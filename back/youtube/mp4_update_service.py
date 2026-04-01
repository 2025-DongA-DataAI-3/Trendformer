import time

from config import MAX_RESULTS_TOTAL
from db import get_urls_from_db, update_file_path
from mp4_extractor import get_mp4


# =========================================================
# 15. DB URL -> MP4 추출 -> DB 반영
# =========================================================
def extract_mp4_from_db_urls(limit=None):
    if limit is None:
        limit = MAX_RESULTS_TOTAL

    rows = get_urls_from_db(limit=limit)

    if not rows:
        print("추출할 URL 없음")
        return

    print("MP4 추출 대상 건수:", len(rows))

    success = 0
    fail = 0

    for i, row in enumerate(rows, start=1):
        content_id = row["CONTENT_ID"]
        url = row["ORIGINAL_LINK"]

        print(f"\n[{i}/{len(rows)}] MP4 추출 중")
        print("CONTENT_ID:", content_id)
        print("URL:", url)

        mp4_url = get_mp4(url)

        if mp4_url:
            ok = update_file_path(content_id, mp4_url)
            if ok:
                success += 1
                print("저장 완료")
            else:
                fail += 1
        else:
            fail += 1
            print("MP4 추출 실패")

        time.sleep(0.2)

    print("\n========================")
    print("MP4 추출 작업 완료")
    print("성공:", success)
    print("실패:", fail)
    print("========================")