import schedule
import time
from datetime import datetime

from crawler_service import run_save_urls_and_extract_mp4
from mp4_update_service import extract_mp4_from_db_urls

# =========================================================
# 스케줄 작업
# =========================================================
def scheduled_job():

    print(f"\n===== 자동 크롤링 시작 =====")
    print(datetime.now())

    try:

        # 500개 크롤링 + 바로 MP4 추출
        df = run_save_urls_and_extract_mp4()

        if df is not None:
            print("===== 자동 작업 완료 =====")
            print("총 처리:", len(df))

    except Exception as e:

        print("===== 스케줄러 오류 =====")
        print(e)

def mp4_refresh_job():  # 추가
    print(f"\n===== MP4 URL 갱신 시작 =====")
    print(datetime.now())

    try:
        extract_mp4_from_db_urls()
        print("===== MP4 URL 갱신 완료 =====")

    except Exception as e:
        print("===== MP4 갱신 오류 =====")
        print(e)

# =========================================================
# 실행
# =========================================================
def run_scheduler():

    print("===== 자동 크롤링 서버 시작 =====")

    # 서버 시작 즉시 실행
    scheduled_job()
    mp4_refresh_job()

    # 3시간마다 반복
    schedule.every(3).hours.do(scheduled_job)
    schedule.every(3).hours.do(mp4_refresh_job)

    print("===== 3시간 자동 수집 등록 완료 =====")

    while True:

        schedule.run_pending()

        time.sleep(1)