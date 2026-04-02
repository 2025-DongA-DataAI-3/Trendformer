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
        await page.goto("https://www.instagram.com/p/DD4h_8Uy2ka/", wait_until="domcontentloaded")
        await asyncio.sleep(5)

        # 페이지 전체 텍스트 출력
        body_text = await page.inner_text('body')
        print(body_text[:3000])  # 앞부분 3000자만 출력

        await context.close()

asyncio.run(main())