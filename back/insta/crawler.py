import asyncio
import random
import pymysql
import re
from datetime import datetime
from playwright.async_api import async_playwright
from config import DB_CONFIG

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

def parse_og_description(desc):
    title = "제목 없음"
    uploaded_at = None
    like_count = 0

    if not desc:
        return title, uploaded_at, like_count

    try:
        like_match = re.search(r'([\d.]+[KM]?)\s*likes', desc, re.IGNORECASE)
        if like_match:
            like_text = like_match.group(1)
            if 'K' in like_text:
                like_count = int(float(like_text.replace('K', '')) * 1000)
            elif 'M' in like_text:
                like_count = int(float(like_text.replace('M', '')) * 1000000)
            else:
                like_count = int(like_text)

        date_match = re.search(r'(\w+ \d+, \d{4})', desc)
        if date_match:
            date_str = date_match.group(1)
            uploaded_at = datetime.strptime(date_str, "%B %d, %Y").strftime("%Y-%m-%d %H:%M:%S")

        caption_match = re.search(r'\d{4}:\s*"(.+?)(?:"|$)', desc, re.DOTALL)
        if caption_match:
            title = caption_match.group(1).split('\n')[0][:200]

    except Exception as e:
        print(f"파싱 오류: {e}")

    return title, uploaded_at, like_count

def save_to_db(content_item, like_count):
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            content_sql = """
                INSERT IGNORE INTO TREND_CONTENT
                (CONTENT_ID, PLATFORM_TYPE, ORIGINAL_LINK, TITLE, DESCRIPTION, FILE_PATH, SOURCE_TYPE, UPLOADED_AT, CREATED_AT, UPDATED_AT)
                VALUES (UUID(), 'INSTAGRAM', %s, %s, %s, %s, 'CRAWLING', %s, NOW(), NOW())
            """
            cursor.execute(content_sql, content_item)

            cursor.execute("SELECT CONTENT_ID FROM TREND_CONTENT WHERE ORIGINAL_LINK = %s", (content_item[0],))
            row = cursor.fetchone()

            if row:
                content_id = row[0]
                cursor.execute("""
                    INSERT INTO TREND_METRIC (CONTENT_ID, VIEW_COUNT, LIKE_COUNT, RECORDED_AT)
                    VALUES (%s, 0, %s, NOW())
                """, (content_id, like_count))

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

        video_element = await page.query_selector('video')
        if not video_element:
            print(f"⏭️ 일반 게시물 스킵: {url}")
            return None

        title = "제목 없음"
        uploaded_at = None
        like_count = 0
        description = ""

        try:
            meta_desc = await page.query_selector('meta[property="og:description"]')
            if meta_desc:
                desc = await meta_desc.get_attribute('content')
                print(f"📝 og:description: {desc[:100]}")
                title, uploaded_at, like_count = parse_og_description(desc)
                description = desc[:500]
                print(f"📅 업로드 날짜: {uploaded_at}")
                print(f"👍 좋아요: {like_count}")
                print(f"📌 제목: {title}")
        except Exception as e:
            print(f"⚠️ meta 추출 실패: {e}")

        embed_url = url.rstrip('/') + '/embed'

        return {
            "content": (url, title, description, embed_url, uploaded_at),
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