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
    loaded = _load_model()
    if loaded is None:
        return "도입"

    model = loaded["model"]
    features = loaded["features"]
    le = loaded["label_encoder"]

    stats = get_keyword_stats(keyword)
    if not stats or stats["CONTENT_COUNT"] is None:
        return "도입"

    # None 체크 추가
    if not stats["FIRST_UPLOAD"] or not stats["LAST_UPLOAD"]:
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

        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("SELECT KEYWORD_ID, KEYWORD_NAME FROM T_KEYWORD")
            keywords_data = cursor.fetchall()

        print(f"총 {len(keywords_data)}개의 키워드 분석 시작...")

        for row in keywords_data:
            kw_id = row['KEYWORD_ID']
            kw_name = row['KEYWORD_NAME']

            stage = predict_lifecycle(kw_name)

            stats = get_keyword_stats(kw_name)
            content_count = stats["CONTENT_COUNT"] if stats and stats["CONTENT_COUNT"] else 0
            total_view = float(stats["TOTAL_VIEW"] or 0)
            total_like = float(stats["TOTAL_LIKE"] or 0)

            # None 체크 추가
            if stats and stats["FIRST_UPLOAD"] and stats["LAST_UPLOAD"]:
                first_upload = pd.to_datetime(stats["FIRST_UPLOAD"])
                last_upload = pd.to_datetime(stats["LAST_UPLOAD"])
                active_days = max((last_upload - first_upload).days, 1)
            else:
                active_days = 1

            growth_rate = content_count / active_days

            update_sql = """
                INSERT INTO KEYWORD_METRIC 
                    (KEYWORD_ID, TOTAL_CONTENT_COUNT, TOTAL_VIEW_COUNT, TOTAL_LIKE_COUNT, GROWTH_RATE, LIFECYCLE_STAGE, RECORDED_AT)
                VALUES (%s, %s, %s, %s, %s, %s, NOW())
                ON DUPLICATE KEY UPDATE
                    TOTAL_CONTENT_COUNT = VALUES(TOTAL_CONTENT_COUNT),
                    TOTAL_VIEW_COUNT    = VALUES(TOTAL_VIEW_COUNT),
                    TOTAL_LIKE_COUNT    = VALUES(TOTAL_LIKE_COUNT),
                    GROWTH_RATE         = VALUES(GROWTH_RATE),
                    LIFECYCLE_STAGE     = VALUES(LIFECYCLE_STAGE),
                    RECORDED_AT         = NOW()
            """

            with conn.cursor() as cursor:
                cursor.execute(update_sql, (kw_id, content_count, total_view, total_like, growth_rate, stage))

            conn.commit()
            print(f" ✅ {kw_name} -> {stage} (저장 완료)")

    except Exception as e:
        print(f"❌ 분석 및 저장 중 오류 발생: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()
            print("DB 연결 종료.")


if __name__ == "__main__":
    print("===== 🚀 AI 생애주기 분석 및 DB 저장 시작 =====")
    predict_all_keywords()
    print("===== ✅ 모든 분석 작업 완료 =====")