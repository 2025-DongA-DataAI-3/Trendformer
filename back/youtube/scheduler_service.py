import time
from crawler_service import run_save_urls_only
from mp4_update_service import extract_mp4_from_db_urls


def run_scheduler():
    print("===== scheduler_service.py 진입 =====")

    while True:
        try:
            print("===== [스케줄러] 크롤링 시작 =====")
            df_result = run_save_urls_only()
            print("===== [스케줄러] URL 저장 완료 =====")

            if df_result is not None:
                try:
                    print(f"===== [스케줄러] 저장된 행 수: {len(df_result)} =====")
                except Exception:
                    print("===== [스케줄러] 저장 결과 길이 확인 실패 =====")

            print("===== [스케줄러] MP4 추출 시작 =====")
            extract_mp4_from_db_urls()
            print("===== [스케줄러] MP4 추출 완료 =====")

        except Exception as e:
            print(f"===== [스케줄러] 실행 중 오류 발생: {e} =====")

        print("===== [스케줄러] 3시간 대기 시작 =====")
        time.sleep(10800)   # 3시간 = 10800초