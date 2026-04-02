import pymysql
from config import DB_CONFIG


# =========================================================
# 2. DB 연결
# =========================================================
def get_connection():
    return pymysql.connect(
        host=DB_CONFIG["host"],
        port=DB_CONFIG["port"],
        user=DB_CONFIG["user"],
        password=DB_CONFIG["password"],
        database=DB_CONFIG["database"],
        charset=DB_CONFIG["charset"],
        cursorclass=pymysql.cursors.DictCursor
    )


# =========================================================
# 11. DB 저장
# =========================================================
def save_to_db(rows):
    if not rows:
        print("저장할 데이터 없음")
        return

    sql = """
    INSERT INTO TREND_CONTENT (
        CONTENT_ID,
        USER_ID,
        PLATFORM_TYPE,
        ORIGINAL_LINK,
        TITLE,
        CREATOR_NAME,
        DESCRIPTION,
        THUMBNAIL_PATH,
        FILE_PATH,
        SOURCE_TYPE,
        IS_AI_TRANSFORMED,
        UPLOADED_AT
    )
    VALUES (
        %(CONTENT_ID)s,
        %(USER_ID)s,
        %(PLATFORM_TYPE)s,
        %(ORIGINAL_LINK)s,
        %(TITLE)s,
        %(CREATOR_NAME)s,
        %(DESCRIPTION)s,
        %(THUMBNAIL_PATH)s,
        %(FILE_PATH)s,
        %(SOURCE_TYPE)s,
        %(IS_AI_TRANSFORMED)s,
        %(UPLOADED_AT)s
    )
    ON DUPLICATE KEY UPDATE
        ORIGINAL_LINK = VALUES(ORIGINAL_LINK),
        TITLE = VALUES(TITLE),
        CREATOR_NAME = VALUES(CREATOR_NAME),
        DESCRIPTION = VALUES(DESCRIPTION),
        THUMBNAIL_PATH = VALUES(THUMBNAIL_PATH),
        FILE_PATH = VALUES(FILE_PATH),
        SOURCE_TYPE = VALUES(SOURCE_TYPE),
        IS_AI_TRANSFORMED = VALUES(IS_AI_TRANSFORMED),
        UPLOADED_AT = VALUES(UPLOADED_AT)
    """

    conn = get_connection()

    try:
        with conn.cursor() as cursor:
            cursor.executemany(sql, rows)
        conn.commit()
        print(f"DB 저장 완료: {len(rows)}건")
    except Exception as e:
        print("[DB 저장 실패]")
        print("에러:", e)
    finally:
        conn.close()


# =========================================================
# 13. DB에서 MP4 추출 대상 조회
# =========================================================
def get_urls_from_db(limit=None):
    sql = """
    SELECT CONTENT_ID, ORIGINAL_LINK
    FROM TREND_CONTENT
    WHERE PLATFORM_TYPE = 'YOUTUBE'
      AND ORIGINAL_LINK IS NOT NULL
      AND ORIGINAL_LINK <> ''
      AND (FILE_PATH IS NULL OR FILE_PATH = '')
    ORDER BY CREATED_AT DESC
    """

    if limit is not None:
        sql += f" LIMIT {int(limit)}"

    conn = get_connection()

    try:
        with conn.cursor() as cursor:
            cursor.execute(sql)
            rows = cursor.fetchall()
        return rows
    except Exception as e:
        print("[URL 조회 실패]")
        print("에러:", e)
        return []
    finally:
        conn.close()


# =========================================================
# 14. FILE_PATH 업데이트
# =========================================================
def update_file_path(content_id, file_path):
    sql = """
    UPDATE TREND_CONTENT
    SET FILE_PATH = %s,
        UPDATED_AT = CURRENT_TIMESTAMP
    WHERE CONTENT_ID = %s
    """

    conn = get_connection()

    try:
        with conn.cursor() as cursor:
            cursor.execute(sql, (file_path, content_id))
        conn.commit()
        return True
    except Exception as e:
        print(f"[UPDATE 실패] CONTENT_ID={content_id}")
        print("에러:", e)
        return False
    finally:
        conn.close()


# =========================================================
# 16. DB 상태 확인
# =========================================================
def check_file_path_status():
    sql = """
    SELECT
        COUNT(*) AS total_count,
        SUM(CASE WHEN FILE_PATH IS NULL OR FILE_PATH = '' THEN 1 ELSE 0 END) AS empty_file_path_count,
        SUM(CASE WHEN FILE_PATH IS NOT NULL AND FILE_PATH <> '' THEN 1 ELSE 0 END) AS filled_file_path_count
    FROM TREND_CONTENT
    WHERE PLATFORM_TYPE = 'YOUTUBE'
    """

    conn = get_connection()

    try:
        with conn.cursor() as cursor:
            cursor.execute(sql)
            result = cursor.fetchone()
        print("\\n현재 DB 상태")
        print(result)
        return result
    except Exception as e:
        print("[상태 조회 실패]")
        print("에러:", e)
        return None
    finally:
        conn.close()

# =========================================================
# 17. TREND_METRIC 저장
# =========================================================
def save_metrics(rows):
    if not rows:
        print("저장할 metric 데이터 없음")
        return

    metric_rows = []

    for row in rows:
        metric_rows.append({
            "CONTENT_ID": row.get("CONTENT_ID"),
            "VIEW_COUNT": row.get("VIEW_COUNT", 0),
            "LIKE_COUNT": row.get("LIKE_COUNT", 0)
        })

    sql = """
    INSERT INTO TREND_METRIC (
        CONTENT_ID,
        VIEW_COUNT,
        LIKE_COUNT
    )
    VALUES (
        %(CONTENT_ID)s,
        %(VIEW_COUNT)s,
        %(LIKE_COUNT)s
    )
    """

    conn = get_connection()

    try:
        with conn.cursor() as cursor:
            cursor.executemany(sql, metric_rows)
        conn.commit()
        print(f"TREND_METRIC 저장 완료: {len(metric_rows)}건")
    except Exception as e:
        print("[TREND_METRIC 저장 실패]")
        print("에러:", e)
    finally:
        conn.close()