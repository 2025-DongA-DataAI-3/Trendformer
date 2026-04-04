import pymysql
from config import API_KEY, DB_CONFIG
from youtube_api import get_video_stats
from utils import chunked

current_key_index = 0

def get_connection():
    return pymysql.connect(**DB_CONFIG)

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

def get_youtube_contents():
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT tc.CONTENT_ID, tc.ORIGINAL_LINK
                FROM TREND_CONTENT tc
                JOIN CONTENT_KEYWORD ck ON tc.CONTENT_ID = ck.CONTENT_ID
                JOIN T_KEYWORD tk ON ck.KEYWORD = tk.KEYWORD_NAME
                WHERE tc.PLATFORM_TYPE = 'YOUTUBE'
                GROUP BY tc.CONTENT_ID, tc.ORIGINAL_LINK
                ORDER BY tc.UPDATED_AT ASC
            """)
            return cursor.fetchall()
    except Exception as e:
        print(f"⚠️ DB 조회 실패: {e}")
        return []
    finally:
        if 'conn' in locals(): conn.close()

def save_metric(content_id, view_count, like_count):
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT METRIC_ID FROM TREND_METRIC
                WHERE CONTENT_ID = %s AND DATE(RECORDED_AT) = CURDATE()
            """, (content_id,))
            existing = cursor.fetchone()

            if existing:
                cursor.execute("""
                    UPDATE TREND_METRIC
                    SET VIEW_COUNT = %s, LIKE_COUNT = %s, RECORDED_AT = NOW()
                    WHERE CONTENT_ID = %s AND DATE(RECORDED_AT) = CURDATE()
                """, (view_count, like_count, content_id))
                print(f"🔄 업데이트 - 조회수: {view_count} | 좋아요: {like_count}")
            else:
                cursor.execute("""
                    INSERT INTO TREND_METRIC (CONTENT_ID, VIEW_COUNT, LIKE_COUNT, RECORDED_AT)
                    VALUES (%s, %s, %s, NOW())
                """, (content_id, view_count, like_count))
                print(f"✅ 신규 기록 - 조회수: {view_count} | 좋아요: {like_count}")

            cursor.execute("""
                UPDATE TREND_CONTENT SET UPDATED_AT = NOW()
                WHERE CONTENT_ID = %s
            """, (content_id,))

        conn.commit()
    except Exception as e:
        print(f"❌ DB 저장 실패: {e}")
    finally:
        if 'conn' in locals(): conn.close()

def run_update_metrics():
    global current_key_index
    current_key_index = 0

    contents = get_youtube_contents()
    print(f"📦 총 {len(contents)}개 유튜브 영상 업데이트 시작")

    # video_id 추출
    content_map = {}
    for row in contents:
        content_id = row["CONTENT_ID"]
        original_link = row["ORIGINAL_LINK"]
        video_id = original_link.split("v=")[-1].split("&")[0]
        content_map[video_id] = content_id

    video_ids = list(content_map.keys())

    # 50개씩 배치로 API 호출
    for batch in chunked(video_ids, 50):
        stats_map = safe_call(get_video_stats, batch)
        if stats_map is None:
            print("API 키 소진으로 중단")
            break

        for video_id, stats in stats_map.items():
            content_id = content_map.get(video_id)
            if content_id:
                save_metric(content_id, stats["view_count"], stats["like_count"])

    print("🎉 전체 업데이트 완료!")

if __name__ == "__main__":
    run_update_metrics()