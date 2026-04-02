import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            user_data_dir="user_data",
            headless=False,
            args=["--disable-blink-features=AutomationControlled"]
        )
        page = context.pages[0]
        await page.goto("https://www.instagram.com/explore/tags/밈/", wait_until="networkidle")
        await asyncio.sleep(5)

        # 페이지 전체 텍스트로 섹션 확인
        body_text = await page.inner_text('body')
        print(body_text[:3000])

        await context.close()

asyncio.run(main())