from crawler_service import run_save_urls_only
from mp4_update_service import extract_mp4_from_db_urls
from db import check_file_path_status
from scheduler_service import run_scheduler


# =========================================================
# 17. 실행 메뉴
# =========================================================
if __name__ == "__main__":
    print("\n실행 모드 선택")
    print("1 : 유튜브 크롤링 후 URL만 DB 저장")
    print("2 : DB에 저장된 URL들로 MP4 추출 후 FILE_PATH 업데이트")
    print("3 : DB 상태 확인")
    print("4 : 3시간마다 300개 크롤링 + MP4 추출 자동 실행")

    mode = input("번호 입력 : ").strip()

    if mode == "1":
        df_result = run_save_urls_only()
        if not df_result.empty:
            print(df_result.head())

    elif mode == "2":
        limit_input = input("몇 개까지 추출할지 입력 (전체면 엔터) : ").strip()
        limit_value = int(limit_input) if limit_input else None
        extract_mp4_from_db_urls(limit=limit_value)

    elif mode == "3":
        check_file_path_status()

    elif mode == "4":
        run_scheduler()

    else:
        print("잘못된 입력")