import sqlite3

# This script is intended for one-time setup of the database.
# Running this will create the database file and the necessary tables
# based on the schema.sql file.

DATABASE = 'database.db'
SCHEMA = 'schema.sql'

def initialize_database():
    """
    Initializes the database by connecting to it and executing the schema script.
    """
    try:
        # Connect to the database. If it doesn't exist, it will be created.
        db = sqlite3.connect(DATABASE)

        # Open and read the schema.sql file
        with open(SCHEMA, 'r') as f:
            schema_script = f.read()

        # Execute the schema script to create tables
        db.cursor().executescript(schema_script)

        # Commit the changes and close the connection
        db.commit()
        db.close()

        print(f"Database '{DATABASE}' initialized successfully with schema from '{SCHEMA}'.")

    except FileNotFoundError:
        print(f"Error: The schema file '{SCHEMA}' was not found. Please ensure it is in the same directory.")
    except sqlite3.Error as e:
        print(f"An error occurred with the database: {e}")

if __name__ == '__main__':
    initialize_database()
