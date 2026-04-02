import asyncio
from playwright.async_api import async_playwright
import re
import json

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context()
        page = await context.new_page()
        
        await page.goto("https://www.tiktok.com/@leekakao8/video/7607814316061920530", wait_until="networkidle")
        await asyncio.sleep(5)

        # script 태그에서 날짜 찾기
        content = await page.content()
        
        # createTime, uploadTime 패턴 찾기
        patterns = [
            r'"createTime"\s*:\s*"?(\d+)"?',
            r'"uploadTime"\s*:\s*"?(\d+)"?',
            r'"createTime"\s*:\s*(\d+)',
        ]
        for pattern in patterns:
            matches = re.findall(pattern, content)
            if matches:
                print(f"패턴 {pattern}: {matches[:3]}")
                # unix timestamp 변환
                from datetime import datetime
                for m in matches[:3]:
                    try:
                        dt = datetime.fromtimestamp(int(m))
                        print(f"  → {dt}")
                    except:
                        pass

        await browser.close()

asyncio.run(main())