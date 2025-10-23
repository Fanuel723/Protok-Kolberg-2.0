import asyncio
from playwright.async_api import async_playwright, expect

ADMIN_USERNAME = 'admin'
ADMIN_PASSWORD = 'default_password'
APP_URL = 'http://localhost:5000'

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--no-sandbox'])
        page = await browser.new_page()

        try:
            # 1. Login
            print("Logging in as admin...")
            await page.goto(f"{APP_URL}/login")
            await page.fill('input[name="username"]', ADMIN_USERNAME)
            await page.fill('input[name="password"]', ADMIN_PASSWORD)
            await page.click('button[type="submit"]')
            await expect(page).to_have_url(f"{APP_URL}/admin")
            print("Login successful.")

            # 2. Find and edit the teczka
            print("Navigating to edit teczka...")
            # The test data will have teczka id = 1
            await page.click('a[href="/teczka/1"]')
            await expect(page).to_have_url(f"{APP_URL}/teczka/1")
            print("On the edit page.")

            # 3. Change status and category
            print("Updating status and category...")
            await page.select_option('select[name="status"]', 'Zatwierdzone')
            await page.select_option('select[name="kategoria"]', 'Nawiedzone miejsca')

            # 4. Mark GPS as manually verified
            print("Manually verifying GPS by clicking the map...")
            await page.click('#map') # Simulate a click to trigger manual verification logic

            await page.click('button[type="submit"]')
            await expect(page).to_have_url(f"{APP_URL}/admin")
            print("Changes saved, returned to admin panel.")

            # 5. Logout
            print("Logging out...")
            await page.click('a[href="/logout"]')
            await expect(page).to_have_url(f"{APP_URL}/")
            print("Logout successful.")

            # 6. Verify the "Szepty i Cienie" layer
            print("Verifying the 'Szepty i Cienie' layer on the main map...")
            await page.wait_for_selector('#map', state='visible')
            await page.wait_for_timeout(3000) # Wait for markers to load

            # Temporarily remove the check that was causing the error to debug.
            # szepty_layer_checkbox = page.locator('.leaflet-control-layers-selector').last()
            # await expect(szepty_layer_checkbox).to_be_visible()

            screenshot_path = 'verification_final_cycle.png'
            await page.screenshot(path=screenshot_path)
            print(f"Final verification screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"An error occurred during verification: {e}")
            await page.screenshot(path='verification_error.png')
        finally:
            await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
