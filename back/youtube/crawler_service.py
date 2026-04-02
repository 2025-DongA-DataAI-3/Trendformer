import re
import pandas as pd

from config import API_KEY, KEYWORDS, MAX_RESULTS_TOTAL
from youtube_api import search_youtube, get_video_details, get_channel_country_map, build_rows_from_videos
from db import save_to_db, save_metrics, update_file_path
from mp4_update_service import get_new_mp4_url


# =========================================================
# API KEY 자동 변경 (추가)
# =========================================================
current_key_index = 0


def get_api_key():

    global current_key_index

    if current_key_index >= len(API_KEY):
        return None

    return API_KEY[current_key_index]


def change_api_key():

    global current_key_index

    current_key_index += 1

    if current_key_index < len(API_KEY):

        print(f"\nAPI KEY 변경 → {current_key_index+1}번 KEY 사용")

        return True

    print("\n모든 API KEY quota 소진")

    return False


# =========================================================
# 안전 호출 함수 (추가)
# =========================================================
def safe_call(func, *args, **kwargs):

    while True:

        key = get_api_key()

        if key is None:
            print("사용 가능한 API KEY 없음")
            return None

        try:

            return func(key, *args, **kwargs)

        except Exception as e:

            print("API 오류:", e)

            if not change_api_key():
                return None


# =========================================================
# KEYWORDS 컬럼 보정 (추가)
# - youtube_api.py 안 건드리고 여기서 자동 생성
# =========================================================
def add_keywords_column(df):

    if df.empty:
        return df

    temp_df = df.copy()

    if "KEYWORDS" in temp_df.columns:
        temp_df["KEYWORDS"] = temp_df["KEYWORDS"].fillna("")
        return temp_df

    keyword_values = []

    for _, row in temp_df.iterrows():

        title = str(row.get("TITLE", "")).lower()
        description = str(row.get("DESCRIPTION", "")).lower()

        found_keywords = []

        for keyword in KEYWORDS:
            keyword_lower = str(keyword).lower().strip()

            if not keyword_lower:
                continue

            if keyword_lower in title or keyword_lower in description:
                found_keywords.append(keyword)

        # 아무 키워드도 못 찾으면 제목에서 한글/영문 단어 일부 추출
        if not found_keywords:
            raw_text = f"{row.get('TITLE', '')} {row.get('DESCRIPTION', '')}"
            tokens = re.findall(r"[가-힣A-Za-z0-9]+", str(raw_text))
            tokens = [t.strip() for t in tokens if len(t.strip()) >= 2]
            found_keywords = tokens[:3]

        keyword_values.append(",".join(found_keywords))

    temp_df["KEYWORDS"] = keyword_values

    return temp_df


# =========================================================
# 13. 키워드별 생애주기 계산 (추가)
# =========================================================
def calculate_keyword_lifecycle(df):

    if df.empty:
        return pd.DataFrame()

    if "UPLOADED_AT" not in df.columns:
        print("UPLOADED_AT 컬럼 없음")
        return pd.DataFrame()

    if "KEYWORDS" not in df.columns:
        print("KEYWORDS 컬럼 없음")
        return pd.DataFrame()

    temp_df = df.copy()

    temp_df["UPLOADED_AT"] = pd.to_datetime(
        temp_df["UPLOADED_AT"],
        errors="coerce"
    )

    temp_df = temp_df.dropna(subset=["UPLOADED_AT"])

    if temp_df.empty:
        print("UPLOADED_AT 변환 후 데이터 없음")
        return pd.DataFrame()

    temp_df["YEAR_WEEK"] = temp_df["UPLOADED_AT"].dt.strftime("%Y-%U")

    keyword_rows = []

    for _, row in temp_df.iterrows():

        keywords = row.get("KEYWORDS")

        if not keywords:
            continue

        if isinstance(keywords, str):
            split_keywords = [k.strip() for k in keywords.split(",") if k.strip()]
        elif isinstance(keywords, list):
            split_keywords = keywords
        else:
            continue

        for keyword in split_keywords:
            keyword_rows.append({
                "CONTENT_ID": row.get("CONTENT_ID"),
                "KEYWORD": keyword,
                "YEAR_WEEK": row.get("YEAR_WEEK"),
                "VIEW_COUNT": row.get("VIEW_COUNT", 0)
            })

    if not keyword_rows:
        print("키워드 데이터 없음")
        return pd.DataFrame()

    keyword_df = pd.DataFrame(keyword_rows)

    weekly_counts = (
        keyword_df
        .groupby(["KEYWORD", "YEAR_WEEK"])
        .agg(
            POST_COUNT=("CONTENT_ID", "count"),
            VIEW_COUNT=("VIEW_COUNT", "sum")
        )
        .reset_index()
        .sort_values(["KEYWORD", "YEAR_WEEK"])
    )

    lifecycle_result = []

    for keyword, group in weekly_counts.groupby("KEYWORD"):

        group = group.sort_values("YEAR_WEEK").reset_index(drop=True)

        post_counts = group["POST_COUNT"].tolist()
        view_counts = group["VIEW_COUNT"].tolist()

        current_post = post_counts[-1]
        prev_post = post_counts[-2] if len(post_counts) >= 2 else 0
        max_post = max(post_counts)

        current_view = view_counts[-1]
        max_view = max(view_counts) if view_counts else 0

        # -----------------------------
        # 생애주기 판정
        # -----------------------------
        if len(post_counts) == 1:
            stage = "도입"

        elif current_post <= 2 and max_post <= 3:
            stage = "도입"

        elif current_post > prev_post:
            stage = "성장"

        elif current_post == prev_post:
            if current_post >= max_post * 0.8:
                stage = "성숙"
            else:
                stage = "성장"

        elif current_post < prev_post:
            if current_post >= max_post * 0.7:
                stage = "성숙"
            else:
                stage = "쇠퇴"

        else:
            stage = "성숙"

        lifecycle_result.append({
            "KEYWORD": keyword,
            "LIFECYCLE_STAGE": stage,
            "CURRENT_POST_COUNT": current_post,
            "PREV_POST_COUNT": prev_post,
            "MAX_POST_COUNT": max_post,
            "CURRENT_VIEW_COUNT": current_view,
            "MAX_VIEW_COUNT": max_view
        })

    return pd.DataFrame(lifecycle_result)


# =========================================================
# 14. 콘텐츠별 생애주기 매핑 (추가)
# =========================================================
def apply_lifecycle_to_content(df, lifecycle_df):

    if df.empty or lifecycle_df.empty:
        return df

    if "KEYWORDS" not in df.columns:
        print("KEYWORDS 컬럼 없음")
        return df

    lifecycle_map = dict(
        zip(
            lifecycle_df["KEYWORD"],
            lifecycle_df["LIFECYCLE_STAGE"]
        )
    )

    result_stage = []

    for _, row in df.iterrows():

        keywords = row.get("KEYWORDS")

        if not keywords:
            result_stage.append("도입")
            continue

        if isinstance(keywords, str):
            split_keywords = [k.strip() for k in keywords.split(",") if k.strip()]
        elif isinstance(keywords, list):
            split_keywords = keywords
        else:
            result_stage.append("도입")
            continue

        stages = []

        for keyword in split_keywords:
            stage = lifecycle_map.get(keyword)
            if stage:
                stages.append(stage)

        if not stages:
            result_stage.append("도입")
            continue

        if "성장" in stages:
            result_stage.append("성장")
        elif "성숙" in stages:
            result_stage.append("성숙")
        elif "쇠퇴" in stages:
            result_stage.append("쇠퇴")
        else:
            result_stage.append("도입")

    result_df = df.copy()
    result_df["LIFECYCLE_STAGE"] = result_stage

    return result_df


# =========================================================
# 1건 MP4 즉시 추출 + DB 업데이트 (추가)
# - db.py / mp4_update_service.py 함수명 그대로 활용
# =========================================================
def extract_mp4_for_one_row(content_id, original_link):

    if not content_id or not original_link:
        print("[건너뜀] CONTENT_ID 또는 ORIGINAL_LINK 없음")
        return None

    try:
        print(f"\n즉시 MP4 추출 대상: {content_id}")
        print("원본 URL:", original_link)

        new_mp4_url = get_new_mp4_url(original_link)

        if new_mp4_url:
            updated = update_file_path(content_id, new_mp4_url)

            if updated:
                print("즉시 MP4 추출 성공")
                return new_mp4_url
            else:
                print("FILE_PATH 업데이트 실패")
                return None

        else:
            print("즉시 MP4 추출 실패 -> 다음 영상으로 진행")
            return None

    except Exception as e:
        print("extract_mp4_for_one_row 실행 중 오류:", e)
        return None


# =========================================================
# 12. 크롤링 -> URL만 DB 저장
# =========================================================
def run_save_urls_only():

    global current_key_index

    current_key_index = 0   # 실행할때 KEY 초기화

    all_video_ids = []

    keyword_count = len(KEYWORDS)

    if keyword_count == 0:
        print("KEYWORDS 비어있음")
        return pd.DataFrame()

    max_results_per_keyword = MAX_RESULTS_TOTAL // keyword_count

    if MAX_RESULTS_TOTAL % keyword_count != 0:
        max_results_per_keyword += 1

    for keyword in KEYWORDS:

        print(f"\n수집 시작: {keyword}")

        ids = safe_call(
            search_youtube,
            keyword,
            max_results=max_results_per_keyword
        )

        if ids is None:
            return pd.DataFrame()

        print(f"{keyword} 검색 결과 수: {len(ids)}")

        all_video_ids.extend(ids)

    all_video_ids = list(dict.fromkeys(all_video_ids))
    all_video_ids = all_video_ids[:MAX_RESULTS_TOTAL]

    print("\n중복 제거 후 전체 video_ids 수:", len(all_video_ids))

    if not all_video_ids:
        print("검색 결과 없음")
        return pd.DataFrame()

    video_map = safe_call(
        get_video_details,
        all_video_ids
    )

    if video_map is None:
        return pd.DataFrame()

    print("길이 필터 통과 영상 수:", len(video_map))

    if not video_map:
        print("쇼츠 조건을 만족하는 영상 없음")
        return pd.DataFrame()

    channel_ids = [
        item.get("snippet", {}).get("channelId", "")
        for item in video_map.values()
    ]

    channel_country_map = safe_call(
        get_channel_country_map,
        channel_ids
    )

    if channel_country_map is None:
        return pd.DataFrame()

    rows = build_rows_from_videos(video_map, channel_country_map)

    if not rows:
        print("한국 쇼츠 조건을 만족하는 데이터 없음")
        return pd.DataFrame()

    df = pd.DataFrame(rows)

    df = df.drop_duplicates(
        subset=["CONTENT_ID"]
    ).reset_index(drop=True)

    if len(df) > MAX_RESULTS_TOTAL:
        df = df.head(MAX_RESULTS_TOTAL).copy()

    df["FILE_PATH"] = None

    if "VIEW_COUNT" in df.columns:

        df = df.sort_values(
            by="VIEW_COUNT",
            ascending=False
        ).reset_index(drop=True)

    # -----------------------------
    # KEYWORDS 자동 생성 (추가)
    # -----------------------------
    df = add_keywords_column(df)

    # -----------------------------
    # 생애주기 계산 (추가)
    # -----------------------------
    lifecycle_df = calculate_keyword_lifecycle(df)

    if not lifecycle_df.empty:
        print("\n키워드별 생애주기 계산 결과")
        print(lifecycle_df)

        df = apply_lifecycle_to_content(df, lifecycle_df)
    else:
        df["LIFECYCLE_STAGE"] = "도입"

    save_to_db(
        df.to_dict(orient="records")
    )

    save_metrics(
        df.to_dict(orient="records")
    )

    print("\n최종 URL 저장 건수:", len(df))

    return df


# =========================================================
# 12-1. 크롤링 -> 1건 저장 후 바로 MP4 추출 (추가)
# =========================================================
def run_save_urls_and_extract_mp4():

    global current_key_index

    current_key_index = 0   # 실행할때 KEY 초기화

    all_video_ids = []

    keyword_count = len(KEYWORDS)

    if keyword_count == 0:
        print("KEYWORDS 비어있음")
        return pd.DataFrame()

    max_results_per_keyword = MAX_RESULTS_TOTAL // keyword_count

    if MAX_RESULTS_TOTAL % keyword_count != 0:
        max_results_per_keyword += 1

    for keyword in KEYWORDS:

        print(f"\n수집 시작: {keyword}")

        ids = safe_call(
            search_youtube,
            keyword,
            max_results=max_results_per_keyword
        )

        if ids is None:
            return pd.DataFrame()

        print(f"{keyword} 검색 결과 수: {len(ids)}")

        all_video_ids.extend(ids)

    all_video_ids = list(dict.fromkeys(all_video_ids))
    all_video_ids = all_video_ids[:MAX_RESULTS_TOTAL]

    print("\n중복 제거 후 전체 video_ids 수:", len(all_video_ids))

    if not all_video_ids:
        print("검색 결과 없음")
        return pd.DataFrame()

    video_map = safe_call(
        get_video_details,
        all_video_ids
    )

    if video_map is None:
        return pd.DataFrame()

    print("길이 필터 통과 영상 수:", len(video_map))

    if not video_map:
        print("쇼츠 조건을 만족하는 영상 없음")
        return pd.DataFrame()

    channel_ids = [
        item.get("snippet", {}).get("channelId", "")
        for item in video_map.values()
    ]

    channel_country_map = safe_call(
        get_channel_country_map,
        channel_ids
    )

    if channel_country_map is None:
        return pd.DataFrame()

    rows = build_rows_from_videos(video_map, channel_country_map)

    if not rows:
        print("한국 쇼츠 조건을 만족하는 데이터 없음")
        return pd.DataFrame()

    df = pd.DataFrame(rows)

    df = df.drop_duplicates(
        subset=["CONTENT_ID"]
    ).reset_index(drop=True)

    if len(df) > MAX_RESULTS_TOTAL:
        df = df.head(MAX_RESULTS_TOTAL).copy()

    df["FILE_PATH"] = None

    if "VIEW_COUNT" in df.columns:

        df = df.sort_values(
            by="VIEW_COUNT",
            ascending=False
        ).reset_index(drop=True)

    # -----------------------------
    # KEYWORDS 자동 생성 (추가)
    # -----------------------------
    df = add_keywords_column(df)

    # -----------------------------
    # 생애주기 계산 (추가)
    # -----------------------------
    lifecycle_df = calculate_keyword_lifecycle(df)

    if not lifecycle_df.empty:
        print("\n키워드별 생애주기 계산 결과")
        print(lifecycle_df)

        df = apply_lifecycle_to_content(df, lifecycle_df)
    else:
        df["LIFECYCLE_STAGE"] = "도입"

    save_count = 0
    metric_count = 0
    mp4_count = 0

    for row in df.to_dict(orient="records"):

        try:
            print("\n==============================")
            print("CONTENT_ID :", row.get("CONTENT_ID"))
            print("TITLE      :", row.get("TITLE"))

            # 1건 저장
            save_to_db([row])
            save_count += 1

            # metric 1건 저장
            save_metrics([row])
            metric_count += 1

            # 바로 mp4 추출
            mp4_url = extract_mp4_for_one_row(
                row.get("CONTENT_ID"),
                row.get("ORIGINAL_LINK")
            )

            if mp4_url:
                mp4_count += 1
            else:
                print("MP4 추출 실패 -> 다음 영상 진행")

        except Exception as e:
            print("개별 처리 중 오류:", e)
            continue

    print("\n최종 처리 결과")
    print("DB 저장 건수:", save_count)
    print("METRIC 저장 건수:", metric_count)
    print("MP4 추출 건수:", mp4_count)

    return df