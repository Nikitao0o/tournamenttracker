import asyncio
import os
from playwright.async_api import async_playwright

BASE_URL = "http://localhost:5173"
OUTPUT_DIR = os.path.abspath("docs/screenshots")

async def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Standard desktop viewport
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        print("[1] Capturing 01_homepage.png...")
        await page.goto(f"{BASE_URL}/", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "01_homepage.png"))

        print("[2] Capturing 02_match_details.png...")
        await page.goto(f"{BASE_URL}/matches/18", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "02_match_details.png"))

        print("[3] Capturing 03_tournament_double_elim.png...")
        await page.goto(f"{BASE_URL}/tournaments/1", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "03_tournament_double_elim.png"))

        print("[4] Capturing 04_tournament_single_elim.png...")
        await page.goto(f"{BASE_URL}/tournaments/2", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "04_tournament_single_elim.png"))

        print("[5] Capturing 05_tournament_round_robin.png...")
        await page.goto(f"{BASE_URL}/tournaments/3", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "05_tournament_round_robin.png"))

        print("[6] Capturing 06_tournament_swiss.png...")
        await page.goto(f"{BASE_URL}/tournaments/4", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "06_tournament_swiss.png"))

        print("[7] Capturing 08_login_validation.png...")
        await page.goto(f"{BASE_URL}/", wait_until="networkidle")
        # Click Sign In button
        sign_in_btn = page.locator("button:has-text('Sign In')").first
        await sign_in_btn.click()
        await page.wait_for_timeout(500)
        # Type invalid email and submit
        email_input = page.locator("input[type='email']")
        await email_input.fill("invalid-email")
        submit_btn = page.locator("button[type='submit']")
        await submit_btn.click()
        await page.wait_for_timeout(500)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "08_login_validation.png"))

        print("[8] Capturing 07_admin_panel.png (after admin login)...")
        # Fill valid admin credentials
        await email_input.fill("admin@local.com")
        pwd_input = page.locator("input[type='password']")
        await pwd_input.fill("admin")
        await submit_btn.click()
        await page.wait_for_timeout(1500)
        # Navigate to /admin
        await page.goto(f"{BASE_URL}/admin", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "07_admin_panel.png"))

        # Close context and open clean guest context for 09_access_denied_404
        await context.close()

        print("[9] Capturing 09_access_denied_404.png...")
        guest_context = await browser.new_context(viewport={"width": 1440, "height": 900})
        guest_page = await guest_context.new_page()
        await guest_page.goto(f"{BASE_URL}/admin", wait_until="networkidle")
        await guest_page.wait_for_timeout(1000)
        await guest_page.screenshot(path=os.path.join(OUTPUT_DIR, "09_access_denied_404.png"))
        await guest_context.close()

        await browser.close()
        print("All 9 screenshots captured successfully!")

if __name__ == "__main__":
    asyncio.run(main())
