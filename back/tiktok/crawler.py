import asyncio
import random
import pymysql
import re
from datetime import datetime
from urllib.parse import quote
from playwright.async_api import async_playwright
from config import DB_CONFIG

# --- 1. DB 연결 및 조회 로직 ---
def get_connection():
    return pymysql.connect(**DB_CONFIG)

def get_keywords_by_priority():
    """영상 수가 적은 키워드부터 가져오기 (정렬 쿼리 유지)"""
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            sql = """
                SELECT 
                    tk.KEYWORD_NAME,
                    COUNT(DISTINCT ck.CONTENT_ID) AS video_count
                FROM T_KEYWORD tk
                LEFT JOIN CONTENT_KEYWORD ck ON tk.KEYWORD_NAME = ck.KEYWORD
                GROUP BY tk.KEYWORD_ID, tk.KEYWORD_NAME
                ORDER BY video_count ASC, tk.KEYWORD_ID ASC
            """
            cursor.execute(sql)
            rows = cursor.fetchall()
            return [row[0] for row in rows]
    except Exception as e:
        print(f"⚠️ 키워드 조회 실패: {e}")
        return []
    finally:
        if 'conn' in locals(): conn.close()

def get_existing_urls():
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT ORIGINAL_LINK FROM TREND_CONTENT WHERE PLATFORM_TYPE = 'TIKTOK'")
            return {row[0] for row in cursor.fetchall()}
    except: return set()
    finally:
        if 'conn' in locals(): conn.close()

# --- 2. 데이터 파싱 및 저장 ---
def parse_count(text):
    if not text: return 0
    text = text.strip().upper().replace(',', '')
    try:
        if 'K' in text: return int(float(text.replace('K', '')) * 1000)
        elif 'M' in text: return int(float(text.replace('M', '')) * 1000000)
        return int(re.sub(r'[^0-9]', '', text))
    except: return 0

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
                cid = row[0]
                cursor.execute("INSERT INTO TREND_METRIC (CONTENT_ID, VIEW_COUNT, LIKE_COUNT, RECORDED_AT) VALUES (%s, %s, %s, NOW())", (cid, view_count, like_count))
                cursor.execute("INSERT IGNORE INTO CONTENT_KEYWORD (CONTENT_ID, KEYWORD) VALUES (%s, %s)", (cid, keyword))
                print(f"     👍 좋아요: {like_count} | 👁️ 조회수: {view_count} | 🔑 키워드: {keyword}")
        conn.commit()
    except Exception as e: print(f"❌ DB 저장 실패: {e}")
    finally:
        if 'conn' in locals(): conn.close()

# --- 3. 상세 페이지 추출 로직 ---
async def get_post_details(page, url):
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(random.uniform(2, 4))
        
        content = await page.content()
        
        # 제목 추출
        title = "TikTok Video"
        title_el = await page.query_selector('title')
        if title_el: title = (await title_el.inner_text()).split(' | ')[0][:200]

        # 작성자 이름 추출
        creator_name = ""
        try:
            # 방법 1 - data-e2e 셀렉터
            creator_el = await page.query_selector('[data-e2e="browse-username"]')
            if not creator_el:
                creator_el = await page.query_selector('[data-e2e="video-author-uniqueid"]')
            if creator_el:
                creator_name = await creator_el.inner_text()
            
            # 방법 2 - JSON에서 추출
            if not creator_name:
                match = re.search(r'"uniqueId"\s*:\s*"([^"]+)"', content)
                if match:
                    creator_name = match.group(1)
        except:
            pass

        # 좋아요 수
        like_count = 0
        like_el = await page.query_selector('[data-e2e="like-count"]')
        if like_el: like_count = parse_count(await like_el.inner_text())

        # 조회수
        view_count = 0
        view_el = await page.query_selector('[data-e2e="undefined-count"]') or await page.query_selector('[data-e2e="browse-view-count"]')
        if view_el: view_count = parse_count(await view_el.inner_text())

        # 날짜 추출
        uploaded_at = None
        match = re.search(r'"createTime"\s*:\s*"?(\d+)"?', content)
        if match:
            uploaded_at = datetime.fromtimestamp(int(match.group(1))).strftime("%Y-%m-%d %H:%M:%S")

        video_id = url.split('/video/')[-1].split('?')[0]
        embed_url = f"https://www.tiktok.com/embed/v2/{video_id}"

        return {
            "content": (url, title, creator_name, title, "", embed_url, uploaded_at),
            "like_count": like_count,
            "view_count": view_count
        }
    except: return None

# --- 4. 메인 실행 루프 (스크롤 없이 첫 화면만) ---
async def main():
    existing_urls = get_existing_urls()
    print(f"🚀 무한 반복 크롤링 시작")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        while True:  # 무한 반복
            # 매 사이클마다 키워드와 기존 URL 새로 조회
            target_tags = get_keywords_by_priority()
            existing_urls = get_existing_urls()
            print(f"\n🔄 새 사이클 시작 - 키워드 {len(target_tags)}개, 기존 URL {len(existing_urls)}개")

            for tag in target_tags:
                print(f"\n🔎 키워드 검색: {tag}")
                try:
                    await page.goto(f"https://www.tiktok.com/search?q={quote(tag)}", wait_until="networkidle")
                    await asyncio.sleep(4)

                    links = await page.query_selector_all('a[href*="/video/"]')
                    target_urls = []

                    for link in links:
                        href = await link.get_attribute('href')
                        if href:
                            url = href.split('?')[0]
                            if url not in existing_urls and url not in target_urls:
                                target_urls.append(url)

                    if not target_urls:
                        print(f"   > 새로운 영상이 없습니다. 다음 키워드로.")
                        continue

                    print(f"   > 신규 영상 {len(target_urls)}개 발견. 데이터 추출 시작.")

                    for url in target_urls:
                        res = await get_post_details(page, url)
                        if res:
                            save_to_db(res["content"], res["like_count"], res["view_count"], tag)
                            existing_urls.add(url)  # 저장 즉시 existing_urls에 추가
                            print(f"     ✅ 완료: {url}")
                        await asyncio.sleep(random.uniform(2, 4))

                except Exception as e:
                    print(f"❌ {tag} 처리 중 에러: {e}")
                    continue

            print(f"\n✅ 사이클 완료 - 잠시 대기 후 재시작")
            await asyncio.sleep(10)  # 사이클 완료 후 10초 대기

if __name__ == "__main__":
    asyncio.run(main())