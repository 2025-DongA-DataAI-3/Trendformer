import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            user_data_dir="tiktok_user_data",
            headless=False,
            args=["--disable-blink-features=AutomationControlled"]
        )
        page = context.pages[0]
        await page.goto("https://www.tiktok.com/@leekakao8/video/7607814316061920530", wait_until="networkidle")
        await asyncio.sleep(5)

        # 모든 data-e2e 값만 출력
        e2e_values = await page.evaluate("""
            () => {
                const els = document.querySelectorAll('[data-e2e]');
                return [...els].map(el => ({
                    e2e: el.getAttribute('data-e2e'),
                    text: el.innerText?.trim()?.substring(0, 50)
                })).filter(x => x.text);
            }
        """)
        for item in e2e_values:
            print(f"data-e2e={item['e2e']}: {item['text']}")

        await context.close()

asyncio.run(main())