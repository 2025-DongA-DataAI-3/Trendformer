import os
import re
from datetime import datetime, timedelta

from db import get_connection
from yt_dlp import YoutubeDL

COOKIE_PATH = os.path.join(os.path.dirname(__file__), "cookies.txt")


def get_expire_time_from_url(url):
    if not url:
        return None

    match = re.search(r"[?&]expire=(\d+)", url)
    if not match:
        return None

    expire_unix = int(match.group(1))
    return datetime.fromtimestamp(expire_unix)


def get_new_mp4_url(youtube_url):
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "format": "best",
    }

    if os.path.exists(COOKIE_PATH):
        ydl_opts["cookiefile"] = COOKIE_PATH

    try:
        with YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(youtube_url, download=False)

            if info.get("url"):
                return info["url"]

            if "formats" in info:
                for f in reversed(info["formats"]):
                    if f.get("url"):
                        return f["url"]

    except Exception as e:
        err_msg = str(e).lower()

        delete_keywords = [
            "video unavailable",
            "has been removed",
            "this video is no longer available",
            "requested format is not available",
        ]

        skip_keywords = [
            "sign in to confirm your age",
            "age-restricted",
            "this video may be inappropriate for some users",
            "login_required",
            "private video",
            "this video is private",
            "sign in to confirm you're not a bot",
            "not a bot",
        ]

        if any(keyword in err_msg for keyword in delete_keywords):
            print(f"[삭제 대상] 영상이 존재하지 않음: {youtube_url}")
            return "delete"

        if any(keyword in err_msg for keyword in skip_keywords):
            print(f"[건너뜀] 접근 제한 영상: {youtube_url}")
            return "skip"

        print(f"MP4 추출 실패: {youtube_url}")
        print("에러:", e)
        return None

    return None


def extract_mp4_from_db_urls():
    conn = get_connection()

    try:
        with conn.cursor() as cursor:
            sql = """
                SELECT CONTENT_ID, ORIGINAL_LINK, FILE_PATH
                FROM TREND_CONTENT
                WHERE PLATFORM_TYPE = 'YOUTUBE'
            """
            cursor.execute(sql)
            rows = cursor.fetchall()

        now = datetime.now()
        limit_time = now + timedelta(minutes=30)

        update_count = 0
        delete_count = 0

        for row in rows:
            content_id = row["CONTENT_ID"]
            original_link = row["ORIGINAL_LINK"]
            file_path = row["FILE_PATH"]

            need_refresh = False

            if not file_path:
                need_refresh = True
            else:
                expire_time = get_expire_time_from_url(file_path)

                if expire_time is None:
                    need_refresh = True
                elif expire_time <= limit_time:
                    need_refresh = True

            if need_refresh:
                print(f"\n재추출 대상: {content_id}")
                print("원본 URL:", original_link)

                new_mp4_url = get_new_mp4_url(original_link)

                if new_mp4_url == "delete":
                    with conn.cursor() as cursor:
                        cursor.execute(
                            "DELETE FROM TREND_CONTENT WHERE CONTENT_ID = %s",
                            (content_id,)
                        )
                    conn.commit()
                    delete_count += 1
                    print(f"삭제 완료: {content_id}")

                elif new_mp4_url == "skip":
                    print("건너뜀 -> 삭제 안함")
                    continue

                elif new_mp4_url:
                    with conn.cursor() as cursor:
                        update_sql = """
                            UPDATE TREND_CONTENT
                            SET FILE_PATH = %s,
                                UPDATED_AT = NOW()
                            WHERE CONTENT_ID = %s
                        """
                        cursor.execute(update_sql, (new_mp4_url, content_id))
                    conn.commit()
                    update_count += 1
                    print("MP4 재추출 성공")

                else:
                    print("MP4 재추출 실패 -> 다음 영상으로 진행")
                    continue

        print(f"\n총 {update_count}개 MP4 URL 갱신 완료")
        print(f"총 {delete_count}개 영상 DB 삭제 완료")

    except Exception as e:
        conn.rollback()
        print("extract_mp4_from_db_urls 실행 중 오류:", e)

    finally:
        conn.close()


def extract_mp4_for_one_row(content_id, original_link):
    conn = get_connection()

    try:
        if not content_id or not original_link:
            print("[건너뜀] CONTENT_ID 또는 ORIGINAL_LINK 없음")
            return None

        print(f"\n즉시 MP4 추출 대상: {content_id}")
        print("원본 URL:", original_link)

        new_mp4_url = get_new_mp4_url(original_link)

        if new_mp4_url == "delete":
            with conn.cursor() as cursor:
                cursor.execute(
                    "DELETE FROM TREND_CONTENT WHERE CONTENT_ID = %s",
                    (content_id,)
                )
            conn.commit()
            print(f"삭제 완료: {content_id}")
            return None

        elif new_mp4_url == "skip":
            print("건너뜀 -> 삭제 안함")
            return None

        elif new_mp4_url:
            with conn.cursor() as cursor:
                update_sql = """
                    UPDATE TREND_CONTENT
                    SET FILE_PATH = %s,
                        UPDATED_AT = NOW()
                    WHERE CONTENT_ID = %s
                """
                cursor.execute(update_sql, (new_mp4_url, content_id))
            conn.commit()
            print("즉시 MP4 추출 성공")
            return new_mp4_url

        else:
            print("즉시 MP4 추출 실패 -> 다음 영상으로 진행")
            return None

    except Exception as e:
        conn.rollback()
        print("extract_mp4_for_one_row 실행 중 오류:", e)
        return None

    finally:
        conn.close()