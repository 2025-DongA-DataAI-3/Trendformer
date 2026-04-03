import schedule
import time
from datetime import datetime

from crawler_service import run_save_urls_and_extract_mp4


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


# =========================================================
# 실행
# =========================================================
def run_scheduler():

    print("===== 자동 크롤링 서버 시작 =====")

    # 서버 시작 즉시 실행
    scheduled_job()

    # 3시간마다 반복
    schedule.every(3).hours.do(scheduled_job)

    print("===== 3시간 자동 수집 등록 완료 =====")

    while True:

        schedule.run_pending()

        time.sleep(1)