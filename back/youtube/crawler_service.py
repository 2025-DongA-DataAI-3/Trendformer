import pandas as pd

from config import API_KEY, KEYWORDS, MAX_RESULTS_TOTAL
from youtube_api import search_youtube, get_video_details, get_channel_country_map, build_rows_from_videos
from db import save_to_db


# =========================================================
# 12. 크롤링 -> URL만 DB 저장
# =========================================================
def run_save_urls_only():
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
        ids = search_youtube(API_KEY, keyword, max_results=max_results_per_keyword)
        print(f"{keyword} 검색 결과 수: {len(ids)}")
        all_video_ids.extend(ids)

    all_video_ids = list(dict.fromkeys(all_video_ids))
    all_video_ids = all_video_ids[:MAX_RESULTS_TOTAL]

    print("\n중복 제거 후 전체 video_ids 수:", len(all_video_ids))

    if not all_video_ids:
        print("검색 결과 없음")
        return pd.DataFrame()

    video_map = get_video_details(API_KEY, all_video_ids)
    print("길이 필터 통과 영상 수:", len(video_map))

    if not video_map:
        print("쇼츠 조건을 만족하는 영상 없음")
        return pd.DataFrame()

    channel_ids = [
        item.get("snippet", {}).get("channelId", "")
        for item in video_map.values()
    ]
    channel_country_map = get_channel_country_map(API_KEY, channel_ids)

    rows = build_rows_from_videos(video_map, channel_country_map)

    if not rows:
        print("한국 쇼츠 조건을 만족하는 데이터 없음")
        return pd.DataFrame()

    df = pd.DataFrame(rows)
    df = df.drop_duplicates(subset=["CONTENT_ID"]).reset_index(drop=True)

    if len(df) > MAX_RESULTS_TOTAL:
        df = df.head(MAX_RESULTS_TOTAL).copy()

    df["FILE_PATH"] = None

    if "VIEW_COUNT" in df.columns:
        df = df.sort_values(by="VIEW_COUNT", ascending=False).reset_index(drop=True)

    save_to_db(df.to_dict(orient="records"))

    print("\n최종 URL 저장 건수:", len(df))
    return df