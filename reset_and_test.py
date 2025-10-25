import os
import sqlite3
from main import init_db, get_db

DB_PATH = 'database.db'

def reset_database():
    """Removes the old database file and initializes a new one."""
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print(f"Removed existing database: {DB_PATH}")

    print("Initializing new database...")
    init_db()
    print("Database initialized successfully.")

def insert_test_data():
    """Inserts a test submission and a corresponding teczka."""
    try:
        db = get_db()
        cursor = db.cursor()

        # Step 1: Insert into submissions
        cursor.execute(
            "INSERT INTO submissions (submission_type, original_filename, stored_filename) VALUES (?, ?, ?)",
            ('image', 'test_krajobraz.jpg', 'test_krajobraz.jpg')
        )
        submission_id = cursor.lastrowid
        print(f"Inserted into submissions with ID: {submission_id}")

        # Step 2: Insert into teczki
        cursor.execute(
            "INSERT INTO teczki (submission_id, latitude, longitude, zrodlo_gps) VALUES (?, ?, ?, ?)",
            (submission_id, 54.347, 18.645, 'metadata')
        )
        teczka_id = cursor.lastrowid
        print(f"Inserted into teczki with ID: {teczka_id}")

        db.commit()
        print("Test data inserted successfully.")

    except Exception as e:
        print(f"An error occurred during test data insertion: {e}")

if __name__ == '__main__':
    reset_database()
    insert_test_data()
