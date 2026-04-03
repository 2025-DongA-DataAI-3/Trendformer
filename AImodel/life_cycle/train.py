import pymysql
import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.preprocessing import LabelEncoder
import pickle
import os
from config import DB_CONFIG


def get_connection():
    return pymysql.connect(**DB_CONFIG)


# =========================================================
# DB에서 키워드별 데이터 집계
# =========================================================
def load_data():
    sql = """
        SELECT
            ck.KEYWORD,
            COUNT(DISTINCT tc.CONTENT_ID)                          AS CONTENT_COUNT,
            MIN(tc.UPLOADED_AT)                                    AS FIRST_UPLOAD,
            MAX(tc.UPLOADED_AT)                                    AS LAST_UPLOAD,
            AVG(tm.VIEW_COUNT)                                     AS AVG_VIEW,
            AVG(tm.LIKE_COUNT)                                     AS AVG_LIKE,
            SUM(tm.VIEW_COUNT)                                     AS TOTAL_VIEW,
            SUM(tm.LIKE_COUNT)                                     AS TOTAL_LIKE,
            COUNT(DISTINCT tc.PLATFORM_TYPE)                       AS PLATFORM_COUNT
        FROM CONTENT_KEYWORD ck
        JOIN TREND_CONTENT tc ON ck.CONTENT_ID = tc.CONTENT_ID
        JOIN TREND_METRIC tm  ON tc.CONTENT_ID = tm.CONTENT_ID
        WHERE tc.UPLOADED_AT IS NOT NULL
        GROUP BY ck.KEYWORD
        HAVING COUNT(DISTINCT tc.CONTENT_ID) >= 2
    """
    conn = get_connection()
    try:
        df = pd.read_sql(sql, conn)
        print(f"키워드 수: {len(df)}개")
        return df
    except Exception as e:
        print(f"데이터 로드 실패: {e}")
        return pd.DataFrame()
    finally:
        conn.close()


# =========================================================
# Feature 생성
# =========================================================
def build_features(df):
    df = df.copy()

    now = pd.Timestamp.now()
    df["FIRST_UPLOAD"] = pd.to_datetime(df["FIRST_UPLOAD"], errors="coerce")
    df["LAST_UPLOAD"]  = pd.to_datetime(df["LAST_UPLOAD"],  errors="coerce")

    # 경과일
    df["DAYS_SINCE_FIRST"] = (now - df["FIRST_UPLOAD"]).dt.days.fillna(0).clip(lower=1)
    df["ACTIVE_DAYS"]      = (df["LAST_UPLOAD"] - df["FIRST_UPLOAD"]).dt.days.fillna(0).clip(lower=1)

    # 빈도 / 비율
    df["UPLOAD_FREQUENCY"] = df["CONTENT_COUNT"] / df["DAYS_SINCE_FIRST"]
    df["LIKE_RATIO"]       = df["AVG_LIKE"] / df["AVG_VIEW"].replace(0, 1)
    df["AVG_VIEW_PER_DAY"] = df["TOTAL_VIEW"] / df["DAYS_SINCE_FIRST"]

    # 조회수 증가율: 초기(첫 30일) vs 최근(마지막 30일) 비교는 DB 재조회 필요하므로
    # 여기서는 ACTIVE_DAYS 대비 CONTENT_COUNT 로 근사
    df["GROWTH_RATE"] = df["CONTENT_COUNT"] / df["ACTIVE_DAYS"]

    return df


# =========================================================
# 룰 기반 라벨 생성
# =========================================================
def assign_label(row):
    days   = row["DAYS_SINCE_FIRST"]
    active = row["ACTIVE_DAYS"]
    count  = row["CONTENT_COUNT"]
    growth = row["GROWTH_RATE"]
    freq   = row["UPLOAD_FREQUENCY"]

    # 도입: 첫 등장 30일 이내 또는 영상 5개 이하
    if days <= 30 or count <= 5:
        return "도입"

    # 성장: 업로드 빈도 높고 활동 기간 짧음
    if growth >= 0.3 and active <= 180:
        return "성장"

    # 쇠퇴: 마지막 업로드가 60일 이상 전
    now = pd.Timestamp.now()
    if (now - pd.Timestamp(row["LAST_UPLOAD"])).days >= 60:
        return "쇠퇴"

    # 성숙: 나머지
    return "성숙"


# =========================================================
# 모델 학습
# =========================================================
def train():
    df = load_data()
    if df.empty:
        print("데이터 없음")
        return

    df = build_features(df)
    df["LABEL"] = df.apply(assign_label, axis=1)

    print("\n생애주기 분포:")
    print(df["LABEL"].value_counts())

    features = [
        "CONTENT_COUNT",
        "DAYS_SINCE_FIRST",
        "ACTIVE_DAYS",
        "AVG_VIEW",
        "AVG_LIKE",
        "LIKE_RATIO",
        "UPLOAD_FREQUENCY",
        "AVG_VIEW_PER_DAY",
        "GROWTH_RATE",
        "PLATFORM_COUNT"
    ]

    X = df[features]
    y = df["LABEL"]

    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42
    )

    # XGBoost
    xgb_model = XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        random_state=42,
        eval_metric="mlogloss"
    )
    xgb_model.fit(X_train, y_train)

    y_pred = xgb_model.predict(X_test)
    print("\n===== XGBoost 평가 =====")
    print(classification_report(y_test, y_pred, target_names=le.classes_))

    # RandomForest 비교
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=6,
        random_state=42,
        class_weight="balanced"
    )
    rf_model.fit(X_train, y_train)

    y_pred_rf = rf_model.predict(X_test)
    print("\n===== RandomForest 평가 =====")
    print(classification_report(y_test, y_pred_rf, target_names=le.classes_))

    # Feature 중요도
    print("\n===== Feature 중요도 (XGBoost) =====")
    for feat, imp in sorted(
        zip(features, xgb_model.feature_importances_),
        key=lambda x: x[1], reverse=True
    ):
        print(f"  {feat}: {imp:.4f}")

    # 모델 저장
    model_path = os.path.join(os.path.dirname(__file__), "lifecycle_model.pkl")
    with open(model_path, "wb") as f:
        pickle.dump({
            "model": xgb_model,
            "features": features,
            "label_encoder": le
        }, f)

    print(f"\n모델 저장 완료: {model_path}")
    return df


if __name__ == "__main__":
    train()