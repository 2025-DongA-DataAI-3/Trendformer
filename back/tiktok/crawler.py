import asyncio
import random
import pymysql
import re
import requests
from datetime import datetime
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

def save_to_db(content_item, like_count, view_count):
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

        # 좋아요 추출
        like_count = 0
        try:
            el = await page.query_selector('[data-e2e="like-count"]')
            if el:
                like_count = parse_count(await el.inner_text())
        except:
            pass

        # 조회수 추출
        view_count = 0
        try:
            el = await page.query_selector('[data-e2e="undefined-count"]')
            if el:
                view_count = parse_count(await el.inner_text())
        except:
            pass

        # 업로드 날짜 추출
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

        # oEmbed로 제목, 썸네일, 작성자 추출
        oembed = get_oembed_data(url)
        title = "제목 없음"
        thumbnail = ""
        creator_name = None
        if oembed:
            title = oembed.get('title', '제목 없음')[:200]
            thumbnail = oembed.get('thumbnail_url', '')
            creator_name = oembed.get('author_name', '')
            print(f"👤 작성자: {creator_name}")

        # embed URL
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

async def main():
    target_tags = ["국내밈", "유머", "짤", "챌린지", "밈"]
    per_tag_count = 50

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
                await page.goto(f"https://www.tiktok.com/tag/{tag}", wait_until="networkidle")
                await asyncio.sleep(5)

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

                print(f"✅ {len(collected_urls)}개 URL 수집")

                for url in collected_urls:
                    result = await get_post_details(page, url)
                    if result:
                        save_to_db(result["content"], result["like_count"], result["view_count"])
                    await asyncio.sleep(random.uniform(3, 6))

            except Exception as e:
                print(f"❌ #{tag} 탐색 실패: {e}")
                continue

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())