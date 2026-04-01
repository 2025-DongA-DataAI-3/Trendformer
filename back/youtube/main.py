from crawler_service import run_save_urls_only
from mp4_update_service import extract_mp4_from_db_urls
from db import check_file_path_status
from scheduler_service import run_scheduler
import threading   # 추가


# =========================================================
# 17. 실행 메뉴
# =========================================================
if __name__ == "__main__":
    print("===== main.py 실행됨 =====")   # 추가

    # ==============================
    # 자동 스케줄러 백그라운드 실행
    # ==============================
    threading.Thread(
        target=run_scheduler,
        daemon=True
    ).start()
    print("===== 자동 스케줄러 실행됨 =====")   # 추가

    print("\n실행 모드 선택")
    print("1 : 유튜브 크롤링 후 URL만 DB 저장")
    print("2 : 만료된 mp4 재 추출")
    print("3 : DB 상태 확인")
    print("4 : 3시간마다 300개 크롤링 + MP4 추출 자동 실행")

    mode = input("번호 입력 : ").strip()
    print(f"===== 입력한 모드: {mode} =====")   # 추가

    if mode == "1":
        print("===== 1번 실행: 유튜브 크롤링 후 URL 저장 시작 =====")   # 추가
        df_result = run_save_urls_only()
        if not df_result.empty:
            print(df_result.head())

    elif mode == "2":
        print("===== 2번 실행: 만료된 MP4 재추출 시작 =====")   # 추가
        limit_input = input("몇 개까지 추출할지 입력 (전체면 엔터) : ").strip()
        limit_value = int(limit_input) if limit_input else None
        extract_mp4_from_db_urls(limit=limit_value)

    elif mode == "3":
        print("===== 3번 실행: DB 상태 확인 =====")   # 추가
        check_file_path_status()

    elif mode == "4":
        print("===== 4번 실행: 자동 스케줄러 수동 실행 =====")   # 추가
        run_scheduler()

    else:
        print("===== 잘못된 번호 입력 =====")   # 추가