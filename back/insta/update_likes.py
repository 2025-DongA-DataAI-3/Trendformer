import asyncio
import random
import pymysql
import re
from playwright.async_api import async_playwright
from config import DB_CONFIG

def get_connection():
    return pymysql.connect(**DB_CONFIG)

def get_instagram_contents():
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT CONTENT_ID, ORIGINAL_LINK 
                FROM TREND_CONTENT 
                WHERE PLATFORM_TYPE = 'INSTAGRAM'
            """)
            return cursor.fetchall()
    except Exception as e:
        print(f"⚠️ DB 조회 실패: {e}")
        return []
    finally:
        if 'conn' in locals(): conn.close()

def save_metric(content_id, like_count):
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            # 오늘 날짜로 이미 기록됐는지 확인
            cursor.execute("""
                SELECT METRIC_ID FROM TREND_METRIC
                WHERE CONTENT_ID = %s AND DATE(RECORDED_AT) = CURDATE()
            """, (content_id,))
            existing = cursor.fetchone()

            if existing:
                # 오늘 기록이 있으면 업데이트
                cursor.execute("""
                    UPDATE TREND_METRIC
                    SET LIKE_COUNT = %s, RECORDED_AT = NOW()
                    WHERE CONTENT_ID = %s AND DATE(RECORDED_AT) = CURDATE()
                """, (like_count, content_id))
                print(f"🔄 업데이트 완료 - CONTENT_ID: {content_id} | 좋아요: {like_count}")
            else:
                # 오늘 기록이 없으면 새로 INSERT
                cursor.execute("""
                    INSERT INTO TREND_METRIC (CONTENT_ID, VIEW_COUNT, LIKE_COUNT, RECORDED_AT)
                    VALUES (%s, 0, %s, NOW())
                """, (content_id, like_count))
                print(f"✅ 신규 기록 - CONTENT_ID: {content_id} | 좋아요: {like_count}")

        conn.commit()
    except Exception as e:
        print(f"❌ DB 저장 실패: {e}")
    finally:
        if 'conn' in locals(): conn.close()

async def get_like_count(page, url):
    try:
        print(f"📄 접속 중: {url}")
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(random.uniform(3, 5))

        like_count = 0
        like_selectors = [
            "section a[href*='liked_by'] span",
            "span:has-text('likes')",
            "span:has-text('좋아요')",
        ]
        for selector in like_selectors:
            try:
                element = await page.query_selector(selector)
                if element:
                    text = await element.inner_text()
                    numbers = re.findall(r'\d+', text.replace(',', ''))
                    if numbers:
                        like_count = int(numbers[0])
                        break
            except:
                continue

        return like_count

    except Exception as e:
        print(f"❌ 접속 실패 ({url}): {e}")
        return None

async def main():
    contents = get_instagram_contents()
    print(f"📦 총 {len(contents)}개 인스타 게시물 업데이트 시작")

    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            user_data_dir="user_data",
            headless=False,
            args=["--disable-blink-features=AutomationControlled"]
        )
        page = context.pages[0]

        for content_id, original_link in contents:
            like_count = await get_like_count(page, original_link)
            if like_count is not None:
                save_metric(content_id, like_count)
            await asyncio.sleep(random.uniform(5, 10))

        await context.close()
        print("🎉 전체 업데이트 완료!")

if __name__ == "__main__":
    asyncio.run(main())