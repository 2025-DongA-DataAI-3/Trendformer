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
        await page.goto("https://www.instagram.com/")
        
        print("⚠️ 브라우저에서 직접 로그인 해주세요!")
        print("로그인 완료 후 엔터를 누르세요...")
        input()
        
        await context.close()
        print("✅ 세션 저장 완료!")

asyncio.run(main())