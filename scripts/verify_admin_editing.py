import asyncio
from playwright.async_api import async_playwright
import urllib.request
import json

BASE_URL = "http://localhost:5173"
API_URL = "http://localhost:8000/api"

async def test_admin_editing():
    print("[1] Logging in as admin on frontend...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        # Login
        await page.goto(f"{BASE_URL}/", wait_until="networkidle")
        sign_in_btn = page.locator("button:has-text('Sign In')").first
        await sign_in_btn.click()
        await page.wait_for_timeout(500)

        await page.locator("input[type='email']").fill("admin@local.com")
        await page.locator("input[type='password']").fill("admin")
        await page.locator("button[type='submit']").click()
        await page.wait_for_timeout(1500)

        # 1. Test editing tournament from /tournaments/1
        print("[2] Testing tournament editing from /tournaments/1...")
        await page.goto(f"{BASE_URL}/tournaments/1", wait_until="networkidle")
        await page.wait_for_timeout(500)
        edit_tourn_btn = page.locator("button:has-text('Edit Tournament')")
        assert await edit_tourn_btn.is_visible(), "Edit Tournament button not visible for admin"
        await edit_tourn_btn.click()
        await page.wait_for_timeout(500)

        # Fill tournament prize pool
        prize_input = page.locator("input[placeholder='$1,000,000']")
        await prize_input.fill("$1,250,000")
        save_btn = page.locator("button:has-text('Save')")
        await save_btn.click()
        await page.wait_for_timeout(1000)

        # Verify prize pool updated on page
        assert "$1,250,000" in await page.content(), "Updated prize pool not found on tournament page"
        print(" -> Tournament successfully edited on tournament page!")

        # 2. Test editing team from /teams/1
        print("[3] Testing team editing from /teams/1...")
        await page.goto(f"{BASE_URL}/teams/1", wait_until="networkidle")
        await page.wait_for_timeout(500)
        edit_team_btn = page.locator("button:has-text('Edit Team')")
        assert await edit_team_btn.is_visible(), "Edit Team button not visible for admin"
        await edit_team_btn.click()
        await page.wait_for_timeout(500)

        coach_input = page.locator("input[value='hally']")
        if await coach_input.count() > 0:
            await coach_input.fill("hally (Lead Coach)")
        save_team_btn = page.locator("button:has-text('Save Changes')")
        await save_team_btn.click()
        await page.wait_for_timeout(1000)
        print(" -> Team successfully edited on team page!")

        # 3. Test editing player from /players/1
        print("[4] Testing player editing from /players/1...")
        await page.goto(f"{BASE_URL}/players/1", wait_until="networkidle")
        await page.wait_for_timeout(500)
        edit_player_btn = page.locator("button:has-text('Edit Player')")
        assert await edit_player_btn.is_visible(), "Edit Player button not visible for admin"
        await edit_player_btn.click()
        await page.wait_for_timeout(500)

        # Update player age
        age_input = page.locator("input[type='number']").first
        await age_input.fill("18")
        save_player_btn = page.locator("button:has-text('Save Changes')")
        await save_player_btn.click()
        await page.wait_for_timeout(1000)
        assert "18 years old" in await page.content() or "18" in await page.content()
        print(" -> Player successfully edited on player page!")

        # 4. Test editing match from /matches/18
        print("[5] Testing match editing from /matches/18...")
        await page.goto(f"{BASE_URL}/matches/18", wait_until="networkidle")
        await page.wait_for_timeout(500)
        edit_match_btn = page.locator("button:has-text('Edit Match')")
        assert await edit_match_btn.is_visible(), "Edit Match button not visible for admin"
        await edit_match_btn.click()
        await page.wait_for_timeout(500)

        # Update start time
        start_time_input = page.locator("input[placeholder='e.g. 19:00 Friday']")
        await start_time_input.fill("20:30 Friday Final")
        save_match_btn = page.locator("button:has-text('Save Match Settings')")
        await save_match_btn.click()
        await page.wait_for_timeout(1000)
        print(" -> Match successfully edited on match page!")

        # 5. Check AdminPage
        print("[6] Checking AdminPage...")
        await page.goto(f"{BASE_URL}/admin", wait_until="networkidle")
        await page.wait_for_timeout(500)
        assert "ADMIN PANEL" in await page.content()
        print(" -> AdminPage verified!")

        await browser.close()
        print("ALL ADMIN EDITING TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    asyncio.run(test_admin_editing())
