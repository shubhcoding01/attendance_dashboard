# import sqlite3
# import os

# # Ensure the folder exists so the app doesn't crash on startup
# DB_FOLDER = "databases"
# DB_NAME = "attendance.db"
# DB_PATH = os.path.join(DB_FOLDER, DB_NAME)

# def get_connection():
#     # 1. Auto-create the directory if it's missing
#     if not os.path.exists(DB_FOLDER):
#         os.makedirs(DB_FOLDER)
        
#     # 2. connect with check_same_thread=False
#     # This is REQUIRED for Streamlit apps to prevent crashing
#     conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    
#     # 3. Optional: Allows accessing columns by name (row['date'])
#     conn.row_factory = sqlite3.Row 
#     return conn

# def create_tables():
#     conn = get_connection()
#     cursor = conn.cursor()

#     cursor.execute("""
#         CREATE TABLE IF NOT EXISTS attendance (
#             id INTEGER PRIMARY KEY AUTOINCREMENT,
#             employee_name TEXT,
#             date TEXT,
#             login_time TEXT,
#             logout_time TEXT
#         )
#     """)

#     cursor.execute("""
#         CREATE TABLE IF NOT EXISTS tasks (
#             id INTEGER PRIMARY KEY AUTOINCREMENT,
#             employee_name TEXT,
#             date TEXT,
#             task_name TEXT,
#             allocated_hours INTEGER
#         )
#     """)

#     conn.commit()
#     conn.close()

import sqlite3
import os

# Ensure the folder exists so the app doesn't crash on startup
DB_FOLDER = "databases"
DB_NAME = "attendance.db"
DB_PATH = os.path.join(DB_FOLDER, DB_NAME)

def get_connection():
    # 1. Auto-create the directory if it's missing
    if not os.path.exists(DB_FOLDER):
        os.makedirs(DB_FOLDER)
        
    # 2. Connect with check_same_thread=False (Required for Streamlit)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    
    # 3. Enable column access by name (row['date'])
    conn.row_factory = sqlite3.Row 
    return conn

def create_tables():
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Create Attendance Table
    # UPDATE: Added UNIQUE constraint to prevent duplicate punches on the same day
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_name TEXT,
            date TEXT,
            login_time TEXT,
            logout_time TEXT,
            UNIQUE(employee_name, date) 
        )
    """)

    # 2. Create Tasks Table
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

# --- OPTIONAL: HELPER TO CLEAR DATA (Run this manually if needed) ---
def clear_all_data():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM attendance")
    cursor.execute("DELETE FROM tasks")
    conn.commit()
    conn.close()
    print("⚠️ All data has been wiped!")