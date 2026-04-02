import re
import time
import requests

from config import REQUEST_SLEEP, SHORTS_MAX_SECONDS
from utils import convert_datetime, parse_iso8601_duration_to_seconds, chunked


def raise_if_api_error(data, res, api_name="API"):
    if res.status_code == 200:
        return

    print(f"{api_name} 에러:", data)

    reason = ""
    if isinstance(data, dict):
        errors = data.get("error", {}).get("errors", [])
        if errors:
            reason = errors[0].get("reason", "")

    if reason == "quotaExceeded":
        raise Exception("quotaExceeded")

    raise Exception(f"{api_name} 오류")


# =========================================================
# 6. 유튜브 검색
# =========================================================
def search_youtube(api_key, keyword, max_results=20):
    video_ids = []
    seen = set()
    next_page_token = None

    while len(video_ids) < max_results:
        page_size = min(50, max_results - len(video_ids))

        params = {
            "part": "snippet",
            "q": keyword,
            "type": "video",
            "maxResults": page_size,
            "order": "date",
            "key": api_key,
            "pageToken": next_page_token,
            "regionCode": "KR",
            "relevanceLanguage": "ko",
            "videoDuration": "short"
        }

        res = requests.get(
            "https://www.googleapis.com/youtube/v3/search",
            params=params,
            timeout=20
        )
        data = res.json()

        print(f"[search] keyword={keyword}, status={res.status_code}")

        raise_if_api_error(data, res, "검색 API")

        if res.status_code != 200:
            print("검색 API 에러:", data)
            break

        items = data.get("items", [])
        if not items:
            break

        for item in items:
            video_id = item.get("id", {}).get("videoId")
            if video_id and video_id not in seen:
                seen.add(video_id)
                video_ids.append(video_id)

        next_page_token = data.get("nextPageToken")
        if not next_page_token:
            break

        time.sleep(REQUEST_SLEEP)

    return video_ids


# =========================================================
# 7. 영상 상세정보 조회
# =========================================================
def get_video_details(api_key, video_ids):
    video_map = {}

    for batch in chunked(video_ids, 50):
        params = {
            "part": "snippet,statistics,contentDetails,status",
            "id": ",".join(batch),
            "key": api_key
        }

        res = requests.get(
            "https://www.googleapis.com/youtube/v3/videos",
            params=params,
            timeout=20
        )
        data = res.json()

        raise_if_api_error(data, res, "videos API")

        if res.status_code != 200:
            print("videos API 에러:", data)
            continue

        for item in data.get("items", []):
            snippet = item.get("snippet", {})
            content_details = item.get("contentDetails", {})
            status_info = item.get("status", {})

            video_id = item.get("id", "")
            duration_str = content_details.get("duration", "")
            duration_seconds = parse_iso8601_duration_to_seconds(duration_str)

            if duration_seconds > SHORTS_MAX_SECONDS:
                continue

            privacy_status = status_info.get("privacyStatus", "")
            if privacy_status not in ("public", "unlisted", ""):
                continue

            video_map[video_id] = item

        time.sleep(REQUEST_SLEEP)

    return video_map


# =========================================================
# 8. 채널 국가 일괄 조회
# =========================================================
def get_channel_country_map(api_key, channel_ids):
    channel_country_map = {}

    unique_channel_ids = list(dict.fromkeys([cid for cid in channel_ids if cid]))

    for batch in chunked(unique_channel_ids, 50):
        params = {
            "part": "snippet",
            "id": ",".join(batch),
            "key": api_key
        }

        res = requests.get(
            "https://www.googleapis.com/youtube/v3/channels",
            params=params,
            timeout=20
        )
        data = res.json()

        raise_if_api_error(data, res, "channels API")

        if res.status_code != 200:
            print("channels API 에러:", data)
            continue

        for item in data.get("items", []):
            channel_id = item.get("id", "")
            country = item.get("snippet", {}).get("country")
            channel_country_map[channel_id] = country

        time.sleep(REQUEST_SLEEP)

    return channel_country_map


# =========================================================
# 9. 한국 쇼츠만 row 생성
# =========================================================
def build_rows_from_videos(video_map, channel_country_map):
    rows = []

    for video_id, item in video_map.items():
        snippet = item.get("snippet", {})
        stats = item.get("statistics", {})
        content_details = item.get("contentDetails", {})

        title = (snippet.get("title", "") or "").strip()
        description = (snippet.get("description", "") or "").strip()
        channel_id = snippet.get("channelId", "")
        channel_title = (snippet.get("channelTitle", "") or "").strip()

        duration_str = content_details.get("duration", "")
        duration_seconds = parse_iso8601_duration_to_seconds(duration_str)

        country = channel_country_map.get(channel_id)

        title_lower = title.lower()
        desc_lower = description.lower()

        is_korean_channel = (country == "KR")

        has_korean_signal = (
            ("한국" in title) or
            ("한국" in description) or
            ("korea" in title_lower) or
            ("korea" in desc_lower) or
            ("korean" in title_lower) or
            ("korean" in desc_lower) or
            re.search(r"[가-힣]", title) is not None or
            re.search(r"[가-힣]", description) is not None
        )

        if not (is_korean_channel or has_korean_signal):
            continue

        rows.append({
            "CONTENT_ID": f"yt_{video_id}",
            "USER_ID": "TEST",
            "PLATFORM_TYPE": "YOUTUBE",
            "ORIGINAL_LINK": f"https://youtube.com/watch?v={video_id}",
            "TITLE": title[:200],
            "CREATOR_NAME": channel_title[:100],
            "DESCRIPTION": description,
            "THUMBNAIL_PATH": snippet.get("thumbnails", {}).get("high", {}).get("url"),
            "FILE_PATH": None,
            "SOURCE_TYPE": "CRAWLING",
            "IS_AI_TRANSFORMED": 0,
            "UPLOADED_AT": convert_datetime(snippet.get("publishedAt", "")),
            "VIEW_COUNT": int(stats.get("viewCount", 0)) if str(stats.get("viewCount", 0)).isdigit() else 0,
            "LIKE_COUNT": int(stats.get("likeCount", 0)) if str(stats.get("likeCount", 0)).isdigit() else 0,
            "COMMENT_COUNT": int(stats.get("commentCount", 0)) if str(stats.get("commentCount", 0)).isdigit() else 0,
            "DURATION_SECONDS": duration_seconds,
            "CHANNEL_ID": channel_id,
            "CHANNEL_COUNTRY": country
        })

    return rows