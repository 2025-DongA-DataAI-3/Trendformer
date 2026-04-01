import time
from datetime import datetime

from config import SCHEDULE_HOURS, MAX_RESULTS_TOTAL
from crawler_service import run_save_urls_only
from mp4_update_service import extract_mp4_from_db_urls
from db import check_file_path_status


# =========================================================
# 18. 3시간마다 크롤링 + MP4 추출
# =========================================================
def run_scheduler():
    print(f"{SCHEDULE_HOURS}시간마다 자동 실행 시작")
    print(f"회차당 최대 크롤링 수: {MAX_RESULTS_TOTAL}")
    print("중지하려면 Ctrl + C")

    while True:
        print("\n========================")
        print("작업 시작 시간:", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        print("========================")

        try:
            print("\n[1단계] URL 크롤링 및 DB 저장 시작")
            df_result = run_save_urls_only()

            if df_result is not None and not df_result.empty:
                print("\n[2단계] MP4 추출 및 FILE_PATH 업데이트 시작")
                extract_mp4_from_db_urls(limit=MAX_RESULTS_TOTAL)
            else:
                print("\n이번 회차는 저장된 URL 없음")

            print("\n[3단계] 현재 DB 상태 확인")
            check_file_path_status()

        except Exception as e:
            print("\n[스케줄 실행 중 오류]")
            print("에러:", e)

        print("\n========================")
        print(f"다음 실행까지 {SCHEDULE_HOURS}시간 대기")
        print("========================\n")

        time.sleep(SCHEDULE_HOURS * 60 * 60)