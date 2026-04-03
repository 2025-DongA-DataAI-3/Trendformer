import asyncio
import random
import pymysql
from playwright.async_api import async_playwright
from config import DB_CONFIG

def get_connection():
    return pymysql.connect(**DB_CONFIG)

def get_tiktok_contents():
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT CONTENT_ID, ORIGINAL_LINK 
                FROM TREND_CONTENT 
                WHERE PLATFORM_TYPE = 'TIKTOK'
                ORDER BY UPDATED_AT ASC
            """)
            return cursor.fetchall()
    except Exception as e:
        print(f"⚠️ DB 조회 실패: {e}")
        return []
    finally:
        if 'conn' in locals(): conn.close()

def parse_count(text):
    if not text:
        return 0
    text = text.strip().replace(',', '')
    try:
        if 'K' in text:
            return int(float(text.replace('K', '')) * 1000)
        elif 'M' in text:
            return int(float(text.replace('M', '')) * 1000000)
        else:
            return int(text)
    except:
        return 0

def save_metric(content_id, like_count, view_count):
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
                    SET LIKE_COUNT = %s, VIEW_COUNT = %s, RECORDED_AT = NOW()
                    WHERE CONTENT_ID = %s AND DATE(RECORDED_AT) = CURDATE()
                """, (like_count, view_count, content_id))
                print(f"🔄 업데이트 - 좋아요: {like_count} | 조회수: {view_count}")
            else:
                cursor.execute("""
                    INSERT INTO TREND_METRIC (CONTENT_ID, VIEW_COUNT, LIKE_COUNT, RECORDED_AT)
                    VALUES (%s, %s, %s, NOW())
                """, (content_id, view_count, like_count))
                print(f"✅ 신규 기록 - 좋아요: {like_count} | 조회수: {view_count}")

            # UPDATED_AT 갱신
            cursor.execute("""
                UPDATE TREND_CONTENT
                SET UPDATED_AT = NOW()
                WHERE CONTENT_ID = %s
            """, (content_id,))

        conn.commit()
    except Exception as e:
        print(f"❌ DB 저장 실패: {e}")
    finally:
        if 'conn' in locals(): conn.close()

async def get_stats(page, url):
    try:
        print(f"📄 접속 중: {url}")
        await page.goto(url, wait_until="networkidle", timeout=30000)
        await asyncio.sleep(random.uniform(3, 5))

        like_count = 0
        try:
            el = await page.query_selector('[data-e2e="like-count"]')
            if el:
                like_count = parse_count(await el.inner_text())
        except:
            pass

        view_count = 0
        try:
            el = await page.query_selector('[data-e2e="undefined-count"]')
            if el:
                view_count = parse_count(await el.inner_text())
        except:
            pass

        return like_count, view_count

    except Exception as e:
        print(f"❌ 접속 실패 ({url}): {e}")
        return None, None

async def main():
    contents = get_tiktok_contents()
    print(f"📦 총 {len(contents)}개 틱톡 게시물 업데이트 시작")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            args=["--disable-blink-features=AutomationControlled"]
        )
        context = await browser.new_context()
        page = await context.new_page()

        for content_id, original_link in contents:
            like_count, view_count = await get_stats(page, original_link)
            if like_count is not None:
                save_metric(content_id, like_count, view_count)
            await asyncio.sleep(random.uniform(3, 6))

        await browser.close()
        print("🎉 전체 업데이트 완료!")

if __name__ == "__main__":
    asyncio.run(main())