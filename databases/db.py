import sqlite3
import os
import hashlib # <--- For Password Hashing

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

# --- PASSWORD HASHING HELPER ---
def hash_password(password):
    """Converts a plain text password into a SHA-256 hash."""
    return hashlib.sha256(str(password).encode('utf-8')).hexdigest()

def create_tables():
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Create Attendance Table
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

    # 2. Create Tasks Table (UPDATED)
    # Added 'status' column to track Acceptance/Rejection
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_name TEXT,
            date TEXT,
            task_name TEXT,
            allocated_hours INTEGER,
            status TEXT DEFAULT 'Pending'
        )
    """)

    # 3. Create Users Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password TEXT NOT NULL,
            role TEXT NOT NULL, 
            name TEXT NOT NULL
        )
    """)
    
    # 4. Create Default Admin (HASHED!)
    try:
        # We hash '123' before storing it
        admin_pass_hash = hash_password('123') 
        cursor.execute("INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)", 
                       ('admin', admin_pass_hash, 'Admin', 'Administrator'))
        print("✅ Default Admin created (admin/123).")
    except sqlite3.IntegrityError:
        pass # Admin already exists

    conn.commit()
    conn.close()

# --- HELPER TO CLEAR DATA ---
def clear_all_data():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM attendance")
    cursor.execute("DELETE FROM tasks")
    # Optional: Wipe users too if you want a full factory reset
    # cursor.execute("DELETE FROM users") 
    conn.commit()
    conn.close()
    print("⚠️ All transactional data has been wiped!")