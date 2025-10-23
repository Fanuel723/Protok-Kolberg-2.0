import asyncio
import os
import sqlite3
from playwright.async_api import async_playwright, expect
from main import init_db

ADMIN_USERNAME = 'admin'
ADMIN_PASSWORD = 'default_password'
APP_URL = 'http://localhost:5000'
DB_PATH = 'database.db'

async def setup_database():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    init_db()

    db = sqlite3.connect(DB_PATH)
    cursor = db.cursor()
    cursor.execute(
        "INSERT INTO submissions (submission_type, original_filename, stored_filename) VALUES (?, ?, ?)",
        ('image', 'krajobraz.jpg', 'krajobraz.jpg')
    )
    submission_id = cursor.lastrowid
    cursor.execute(
        "INSERT INTO teczki (submission_id, latitude, longitude, zrodlo_gps, status) VALUES (?, ?, ?, ?, ?)",
        (submission_id, 50.061, 19.937, 'metadata', 'Nowe')
    )
    db.commit()
    db.close()

async def main():
    await setup_database()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--no-sandbox'])
        page = await browser.new_page()

        try:
            print("Submitting a short message to be flagged...")
            await page.goto(APP_URL)
            await page.fill('#message-input', 'Krótka')
            await page.click('#send-message')
            await page.wait_for_timeout(1000)
            print("Message submitted.")

            print("Logging in...")
            await page.goto(f"{APP_URL}/login")
            await page.fill('input[name="username"]', ADMIN_USERNAME)
            await page.fill('input[name="password"]', ADMIN_PASSWORD)
            await page.click('button[type="submit"]')
            await expect(page).to_have_url(f"{APP_URL}/admin")
            print("Login successful.")

            # DEBUG: Screenshot of the admin panel
            await page.screenshot(path='debug_admin_panel.png')
            print("Debug screenshot of admin panel taken.")

            print("Verifying the flagged message...")
            await page.click("a[href*='status=Wymaga Weryfikacji']")
            await expect(page.locator("body")).to_contain_text("Treść krótsza niż 15 znaków")
            print("Flagged message correctly identified.")

            print("Finding and approving the valid submission...")
            await page.click("a[href*='status=Nowe']")
            await page.click("a[href='/teczka/1']")
            await page.select_option('select[name="status"]', 'Zatwierdzone')
            await page.click('#map')
            await page.click('button[type="submit"]')
            await expect(page).to_have_url(f"{APP_URL}/admin")
            print("Valid submission approved.")

            print("Logging out and checking the map...")
            await page.click('a[href="/logout"]')
            await page.wait_for_timeout(1000)

            await page.goto(APP_URL)
            await page.wait_for_selector('#map')
            await page.wait_for_timeout(3000)

            screenshot_path = 'verification_full_cycle.png'
            await page.screenshot(path=screenshot_path)
            print(f"Final screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path='verification_error.png')
        finally:
            await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
