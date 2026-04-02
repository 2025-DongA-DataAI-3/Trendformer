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
        await page.goto("https://www.instagram.com/p/DMusGqbzb3y/", wait_until="domcontentloaded")
        await asyncio.sleep(5)

        meta_desc = await page.query_selector('meta[property="og:description"]')
        if meta_desc:
            desc = await meta_desc.get_attribute('content')
            print(f"og:description 전체:\n{desc}")
        else:
            print("og:description 없음")

        await context.close()

asyncio.run(main())