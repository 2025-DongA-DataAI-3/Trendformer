import schedule
import time
import subprocess
import sys
import pymysql
from datetime import datetime
from config import DB_CONFIG


def get_connection():
    return pymysql.connect(**DB_CONFIG)

def get_instagram_count():
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM TREND_CONTENT WHERE PLATFORM_TYPE = 'INSTAGRAM'")
            return cursor.fetchone()[0]
    except Exception as e:
        print(f"⚠️ DB 조회 실패: {e}")
        return 0
    finally:
        if 'conn' in locals(): conn.close()

def delete_old_contents():
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            # 1달 넘은 게시물 TREND_METRIC 먼저 삭제
            cursor.execute("""
                DELETE FROM TREND_METRIC 
                WHERE CONTENT_ID IN (
                    SELECT CONTENT_ID FROM TREND_CONTENT 
                    WHERE PLATFORM_TYPE = 'INSTAGRAM' 
                    AND CREATED_AT < DATE_SUB(NOW(), INTERVAL 1 MONTH)
                )
            """)
            # TREND_CONTENT 삭제
            cursor.execute("""
                DELETE FROM TREND_CONTENT 
                WHERE PLATFORM_TYPE = 'INSTAGRAM' 
                AND CREATED_AT < DATE_SUB(NOW(), INTERVAL 1 MONTH)
            """)
            deleted = cursor.rowcount
        conn.commit()
        print(f"🗑️ {deleted}개 오래된 게시물 삭제 완료")
        return deleted
    except Exception as e:
        print(f"❌ 삭제 실패: {e}")
        return 0
    finally:
        if 'conn' in locals(): conn.close()

def run_crawler():
    print(f"\n🚀 [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 크롤링 체크 시작")
    
    count = get_instagram_count()
    print(f"📦 현재 인스타 게시물 수: {count}개")

    if count >= 3000:
        print("✅ 3000개 이상 - 크롤링 스킵")
        return

    # 1달 넘은 게시물 삭제
    deleted = delete_old_contents()
    if deleted > 0:
        print(f"🔄 {deleted}개 삭제 후 재크롤링 시작")

    # 크롤링 실행
    subprocess.run([sys.executable, "crawler.py"])
    print(f"✅ 크롤링 완료")

def run_update():
    print(f"\n🔄 [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 좋아요 업데이트 시작")
    subprocess.run([sys.executable, "update_likes.py"])
    print(f"✅ 좋아요 업데이트 완료")

# 매일 오전 9시 - 크롤링 체크
schedule.every().day.at("09:00").do(run_crawler)

# 매일 오후 6시 - 좋아요 수 갱신
schedule.every().day.at("18:00").do(run_update)

print("⏰ 스케줄러 시작!")
print("  - 매일 09:00 크롤링 체크 (3000개 미만일 때만)")
print("  - 매일 18:00 좋아요 수 갱신")

while True:
    schedule.run_pending()
    time.sleep(60)
