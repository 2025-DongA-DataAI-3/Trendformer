import asyncio
import random
import pymysql
import re
import requests
from datetime import datetime
from urllib.parse import quote
from playwright.async_api import async_playwright
from config import DB_CONFIG

def get_connection():
    return pymysql.connect(**DB_CONFIG)

def get_existing_urls():
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT ORIGINAL_LINK FROM TREND_CONTENT WHERE PLATFORM_TYPE = 'TIKTOK'")
            return {row[0] for row in cursor.fetchall()}
    except Exception as e:
        print(f"⚠️ DB 조회 실패: {e}")
        return set()
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

def get_oembed_data(url):
    try:
        response = requests.get(
            f"https://www.tiktok.com/oembed?url={url}",
            timeout=10
        )
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"❌ oEmbed 실패 ({url}): {e}")
    return None

def save_to_db(content_item, like_count, view_count, keyword):
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            content_sql = """
                INSERT IGNORE INTO TREND_CONTENT
                (CONTENT_ID, PLATFORM_TYPE, ORIGINAL_LINK, TITLE, CREATOR_NAME, DESCRIPTION, THUMBNAIL_PATH, FILE_PATH, SOURCE_TYPE, UPLOADED_AT, CREATED_AT, UPDATED_AT)
                VALUES (UUID(), 'TIKTOK', %s, %s, %s, %s, %s, %s, 'CRAWLING', %s, NOW(), NOW())
            """
            cursor.execute(content_sql, content_item)

            cursor.execute("SELECT CONTENT_ID FROM TREND_CONTENT WHERE ORIGINAL_LINK = %s", (content_item[0],))
            row = cursor.fetchone()

            if row:
                content_id = row[0]

                cursor.execute("""
                    INSERT INTO TREND_METRIC (CONTENT_ID, VIEW_COUNT, LIKE_COUNT, RECORDED_AT)
                    VALUES (%s, %s, %s, NOW())
                """, (content_id, view_count, like_count))

                cursor.execute("""
                    INSERT IGNORE INTO CONTENT_KEYWORD (CONTENT_ID, KEYWORD)
                    VALUES (%s, %s)
                """, (content_id, keyword))
                print(f"🔑 키워드 저장: {keyword}")

        conn.commit()
        print(f"✅ 저장 완료 - 좋아요: {like_count}, 조회수: {view_count}")
    except Exception as e:
        print(f"❌ DB 저장 실패: {e}")
    finally:
        if 'conn' in locals(): conn.close()

async def get_post_details(page, url):
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

        uploaded_at = None
        try:
            content = await page.content()
            match = re.search(r'"createTime"\s*:\s*"?(\d+)"?', content)
            if match:
                timestamp = int(match.group(1))
                uploaded_at = datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")
                print(f"📅 업로드 날짜: {uploaded_at}")
        except:
            pass

        oembed = get_oembed_data(url)
        title = "제목 없음"
        thumbnail = ""
        creator_name = None
        if oembed:
            title = oembed.get('title', '제목 없음')[:200]
            thumbnail = oembed.get('thumbnail_url', '')
            creator_name = oembed.get('author_name', '')
            print(f"👤 작성자: {creator_name}")

        video_id = url.split('/video/')[-1].split('?')[0]
        embed_url = f"https://www.tiktok.com/embed/v2/{video_id}"

        print(f"👍 좋아요: {like_count} | 👁️ 조회수: {view_count}")

        return {
            "content": (url, title, creator_name, title, thumbnail, embed_url, uploaded_at),
            "like_count": like_count,
            "view_count": view_count
        }

    except Exception as e:
        print(f"❌ 추출 실패 ({url}): {e}")
        return None

def get_keywords_from_db():
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    tk.KEYWORD_ID,
                    tk.KEYWORD_NAME,
                    COUNT(DISTINCT ck.CONTENT_ID) AS content_count
                FROM T_KEYWORD tk
                LEFT JOIN CONTENT_KEYWORD ck ON tk.KEYWORD_NAME = ck.KEYWORD
                GROUP BY tk.KEYWORD_ID, tk.KEYWORD_NAME
                ORDER BY content_count ASC, tk.KEYWORD_ID ASC
            """)
            rows = cursor.fetchall()
        conn.close()

        for row in rows:
            print(f"  📊 [{row[0]}] {row[1]} - 영상 {row[2]}개")

        return [row[1] for row in rows]
    except Exception as e:
        print(f"⚠️ T_KEYWORD 조회 실패: {e}")
        return []

async def main():
    target_tags = get_keywords_from_db()
    print(f"DB에서 키워드 {len(target_tags)}개 로드됨: {target_tags}")
    per_tag_count = 80

    existing_urls = get_existing_urls()
    print(f"📦 기존 URL {len(existing_urls)}개 로드됨")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            args=["--disable-blink-features=AutomationControlled"]
        )
        context = await browser.new_context()
        page = await context.new_page()

        for tag in target_tags:
            print(f"\n🔎 #{tag} 탐색 시작")
            try:
                # 해시태그로 먼저 시도
                await page.goto(f"https://www.tiktok.com/tag/{tag}", wait_until="networkidle")
                await asyncio.sleep(5)

                links_check = await page.query_selector_all('a[href*="/video/"]')
                if not links_check:
                    # 해시태그 실패 시 검색으로 재시도
                    print(f"⚠️ #{tag} 해시태그 없음, 검색으로 재시도")
                    await page.goto(f"https://www.tiktok.com/search?q={quote(tag)}", wait_until="networkidle")
                    await asyncio.sleep(5)

                    links_check = await page.query_selector_all('a[href*="/video/"]')
                    if not links_check:
                        print(f"⚠️ #{tag} 검색에서도 게시물 없음, 스킵")
                        continue

                collected_urls = []
                prev_count = 0
                scroll_attempts = 0

                while len(collected_urls) < per_tag_count and scroll_attempts < 20:
                    links = await page.query_selector_all('a[href*="/video/"]')
                    for link in links:
                        href = await link.get_attribute('href')
                        if not href:
                            continue
                        clean_url = href.split('?')[0]
                        if clean_url not in existing_urls and clean_url not in collected_urls:
                            collected_urls.append(clean_url)
                        if len(collected_urls) >= per_tag_count:
                            break

                    if len(collected_urls) == prev_count:
                        await page.evaluate("window.scrollBy(0, 1000)")
                        await asyncio.sleep(2)
                        scroll_attempts += 1
                    else:
                        scroll_attempts = 0
                    prev_count = len(collected_urls)

                if not collected_urls:
                    print(f"⚠️ #{tag} 수집된 URL 없음, 스킵")
                    continue

                print(f"✅ {len(collected_urls)}개 URL 수집")

                for url in collected_urls:
                    result = await get_post_details(page, url)
                    if result:
                        save_to_db(result["content"], result["like_count"], result["view_count"], tag)
                    await asyncio.sleep(random.uniform(2, 4))

            except Exception as e:
                print(f"❌ #{tag} 탐색 실패: {e}")
                continue

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())