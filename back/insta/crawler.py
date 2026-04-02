import asyncio
import random
import pymysql
import re
from playwright.async_api import async_playwright

DB_CONFIG = {
    'host': 'project-db-campus.smhrd.com',
    'user': 'cgi_25k_da3_p2_2',
    'password': 'smhrd2',
    'database': 'cgi_25k_da3_p2_2',
    'port': 3307,
    'charset': 'utf8mb4'
}

def get_connection():
    return pymysql.connect(**DB_CONFIG)

def get_existing_urls():
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT ORIGINAL_LINK FROM TREND_CONTENT WHERE PLATFORM_TYPE = 'INSTAGRAM'")
            return {row[0] for row in cursor.fetchall()}
    except Exception as e:
        print(f"⚠️ DB 조회 실패: {e}")
        return set()
    finally:
        if 'conn' in locals(): conn.close()

def save_to_db(content_item, like_count):
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            content_sql = """
                INSERT IGNORE INTO TREND_CONTENT
                (CONTENT_ID, PLATFORM_TYPE, ORIGINAL_LINK, TITLE, DESCRIPTION, FILE_PATH, SOURCE_TYPE, CREATED_AT, UPDATED_AT)
                VALUES (UUID(), 'INSTAGRAM', %s, %s, %s, %s, 'CRAWLING', NOW(), NOW())
            """
            cursor.execute(content_sql, content_item)

            cursor.execute("SELECT CONTENT_ID FROM TREND_CONTENT WHERE ORIGINAL_LINK = %s", (content_item[0],))
            row = cursor.fetchone()

            if row:
                content_id = row[0]
                metric_sql = """
                    INSERT INTO TREND_METRIC (CONTENT_ID, VIEW_COUNT, LIKE_COUNT, RECORDED_AT)
                    VALUES (%s, 0, %s, NOW())
                """
                cursor.execute(metric_sql, (content_id, like_count))

        conn.commit()
        print(f"✅ 저장 완료 - 좋아요: {like_count}")
    except Exception as e:
        print(f"❌ DB 저장 실패: {e}")
    finally:
        if 'conn' in locals(): conn.close()

async def get_post_details(page, url):
    try:
        print(f"📄 접속 중: {url}")
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(random.uniform(3, 5))

        # 릴스(동영상)인지 확인
        video_element = await page.query_selector('video')
        if not video_element:
            print(f"⏭️ 일반 게시물 스킵: {url}")
            return None

        # 제목(캡션) 추출
        title = "제목 없음"
        title_element = await page.query_selector('h1')
        if title_element:
            title = await title_element.inner_text()
            title = title.split('\n')[0][:200]

        # 설명 추출
        description = ""
        desc_element = await page.query_selector('h1')
        if desc_element:
            description = await desc_element.inner_text()
            description = description[:500]

        # 좋아요 수 추출
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

        embed_url = url.rstrip('/') + '/embed'

        return {
            "content": (url, title, description, embed_url),
            "like_count": like_count
        }

    except Exception as e:
        print(f"❌ 추출 실패 ({url}): {e}")
        return None

async def main():
    target_tags = ["국내밈", "유머", "짤", "챌린지", "밈"]
    per_tag_count = 50

    existing_urls = get_existing_urls()
    print(f"📦 기존 URL {len(existing_urls)}개 로드됨")

    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            user_data_dir="user_data",
            headless=False,
            args=["--disable-blink-features=AutomationControlled"]
        )
        page = context.pages[0]

        for tag in target_tags:
            print(f"\n🔎 #{tag} 탐색 시작")
            try:
                await page.goto(f"https://www.instagram.com/explore/tags/{tag}/", wait_until="networkidle")
                await asyncio.sleep(5)

                collected_urls = []
                prev_count = 0
                scroll_attempts = 0

                while len(collected_urls) < per_tag_count and scroll_attempts < 20:
                    links = await page.query_selector_all('a[href*="/p/"]')
                    for link in links:
                        href = await link.get_attribute('href')
                        if not href:
                            continue
                        full_url = f"https://www.instagram.com{href.split('?')[0]}"
                        if full_url not in existing_urls and full_url not in collected_urls:
                            collected_urls.append(full_url)
                        if len(collected_urls) >= per_tag_count:
                            break

                    if len(collected_urls) == prev_count:
                        await page.evaluate("window.scrollBy(0, 1000)")
                        await asyncio.sleep(2)
                        scroll_attempts += 1
                    else:
                        scroll_attempts = 0
                    prev_count = len(collected_urls)

                print(f"✅ {len(collected_urls)}개 URL 수집")

                for url in collected_urls:
                    result = await get_post_details(page, url)
                    if result:
                        save_to_db(result["content"], result["like_count"])
                    await asyncio.sleep(random.uniform(5, 10))

            except Exception as e:
                print(f"❌ #{tag} 탐색 실패: {e}")
                continue

        await context.close()

if __name__ == "__main__":
    asyncio.run(main())