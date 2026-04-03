import pymysql
import pandas as pd
import pickle
import os
from datetime import datetime
from config import DB_CONFIG

MODEL_PATH = os.path.join(os.path.dirname(__file__), "lifecycle_model.pkl")
_cache = None

def _load_model():
    global _cache
    if _cache is None:
        if not os.path.exists(MODEL_PATH):
            print("모델 파일 없음 → train.py 먼저 실행하세요")
            return None
        with open(MODEL_PATH, "rb") as f:
            _cache = pickle.load(f)
    return _cache


def get_keyword_stats(keyword):
    sql = """
        SELECT
            COUNT(DISTINCT tc.CONTENT_ID)     AS CONTENT_COUNT,
            MIN(tc.UPLOADED_AT)               AS FIRST_UPLOAD,
            MAX(tc.UPLOADED_AT)               AS LAST_UPLOAD,
            AVG(tm.VIEW_COUNT)                AS AVG_VIEW,
            AVG(tm.LIKE_COUNT)                AS AVG_LIKE,
            SUM(tm.VIEW_COUNT)                AS TOTAL_VIEW,
            SUM(tm.LIKE_COUNT)                AS TOTAL_LIKE,
            COUNT(DISTINCT tc.PLATFORM_TYPE)  AS PLATFORM_COUNT
        FROM CONTENT_KEYWORD ck
        JOIN TREND_CONTENT tc ON ck.CONTENT_ID = tc.CONTENT_ID
        JOIN TREND_METRIC tm  ON tc.CONTENT_ID = tm.CONTENT_ID
        WHERE ck.KEYWORD = %s
          AND tc.UPLOADED_AT IS NOT NULL
    """
    conn = None
    try:
        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute(sql, (keyword,))
            return cursor.fetchone()
    except Exception as e:
        print(f"DB 조회 실패: {e}")
        return None
    finally:
        if conn:
            conn.close()


def predict_lifecycle(keyword):
    """
    keyword: T_KEYWORD에 저장된 검색어
    반환값: '도입' | '성장' | '성숙' | '쇠퇴'
    """
    loaded = _load_model()
    if loaded is None:
        return "도입"

    model = loaded["model"]
    features = loaded["features"]
    le = loaded["label_encoder"]

    stats = get_keyword_stats(keyword)
    if not stats or stats["CONTENT_COUNT"] is None:
        return "도입"

    now = pd.Timestamp.now()
    first_upload = pd.to_datetime(stats["FIRST_UPLOAD"])
    last_upload  = pd.to_datetime(stats["LAST_UPLOAD"])

    days_since_first = max((now - first_upload).days, 1)
    active_days      = max((last_upload - first_upload).days, 1)
    avg_view         = float(stats["AVG_VIEW"] or 0)
    avg_like         = float(stats["AVG_LIKE"] or 0)
    total_view       = float(stats["TOTAL_VIEW"] or 0)
    content_count    = int(stats["CONTENT_COUNT"] or 0)
    platform_count   = int(stats["PLATFORM_COUNT"] or 0)

    like_ratio       = avg_like / avg_view if avg_view > 0 else 0
    upload_frequency = content_count / days_since_first
    avg_view_per_day = total_view / days_since_first
    growth_rate      = content_count / active_days

    values = {
        "CONTENT_COUNT":    content_count,
        "DAYS_SINCE_FIRST": days_since_first,
        "ACTIVE_DAYS":      active_days,
        "AVG_VIEW":         avg_view,
        "AVG_LIKE":         avg_like,
        "LIKE_RATIO":       like_ratio,
        "UPLOAD_FREQUENCY": upload_frequency,
        "AVG_VIEW_PER_DAY": avg_view_per_day,
        "GROWTH_RATE":      growth_rate,
        "PLATFORM_COUNT":   platform_count
    }

    X = pd.DataFrame([[values[f] for f in features]], columns=features)
    pred = model.predict(X)[0]
    return le.inverse_transform([pred])[0]


def predict_all_keywords():
    conn = None
    try:
        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor() as cursor:
            cursor.execute("SELECT KEYWORD_NAME FROM T_KEYWORD")
            keywords = [row[0] for row in cursor.fetchall()]
    except Exception as e:
        print(f"키워드 조회 실패: {e}")
        return {}
    finally:
        if conn:
            conn.close()

    results = {}
    for kw in keywords:
        stage = predict_lifecycle(kw)
        results[kw] = stage
        print(f"  {kw}: {stage}")

    return results


if __name__ == "__main__":
    print("===== 전체 키워드 생애주기 예측 =====")
    predict_all_keywords()