import sqlite3

DB_PATH = "databases/attendance.db"

def get_connection():
    return sqlite3.connect(DB_PATH)

def create_tables():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_name TEXT,
            date TEXT,
            login_time TEXT,
            logout_time TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_name TEXT,
            date TEXT,
            task_name TEXT,
            allocated_hours INTEGER
        )
    """)

    conn.commit()
    conn.close()
