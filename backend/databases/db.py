# import sqlite3
# import os
# import hashlib # <--- For Password Hashing

# # Ensure the folder exists so the app doesn't crash on startup
# DB_FOLDER = "databases"
# DB_NAME = "attendance.db"
# DB_PATH = os.path.join(DB_FOLDER, DB_NAME)

# def get_connection():
#     # 1. Auto-create the directory if it's missing
#     if not os.path.exists(DB_FOLDER):
#         os.makedirs(DB_FOLDER)
        
#     # 2. Connect with check_same_thread=False (Required for Streamlit)
#     conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    
#     # 3. Enable column access by name (row['date'])
#     conn.row_factory = sqlite3.Row 
#     return conn

# # --- PASSWORD HASHING HELPER ---
# def hash_password(password):
#     """Converts a plain text password into a SHA-256 hash."""
#     return hashlib.sha256(str(password).encode('utf-8')).hexdigest()

# def create_tables():
#     conn = get_connection()
#     cursor = conn.cursor()

#     # 1. Create Attendance Table
#     cursor.execute("""
#         CREATE TABLE IF NOT EXISTS attendance (
#             id INTEGER PRIMARY KEY AUTOINCREMENT,
#             employee_name TEXT,
#             date TEXT,
#             login_time TEXT,
#             logout_time TEXT,
#             UNIQUE(employee_name, date) 
#         )
#     """)

#     # 2. Create Tasks Table
#     cursor.execute("""
#         CREATE TABLE IF NOT EXISTS tasks (
#             id INTEGER PRIMARY KEY AUTOINCREMENT,
#             employee_name TEXT,
#             date TEXT,
#             task_name TEXT,
#             allocated_hours INTEGER,
#             status TEXT DEFAULT 'Pending'
#         )
#     """)

#     # 3. Create Users Table (UPDATED)
#     # Added 'salary' column with default 10000
#     cursor.execute("""
#         CREATE TABLE IF NOT EXISTS users (
#             username TEXT PRIMARY KEY,
#             password TEXT NOT NULL,
#             role TEXT NOT NULL, 
#             name TEXT NOT NULL,
#             salary INTEGER DEFAULT 10000
#         )
#     """)
    
#     # 4. Create Default Admin (HASHED!)
#     try:
#         # We hash '123' before storing it
#         admin_pass_hash = hash_password('123') 
#         # Added salary=0 for Admin
#         cursor.execute("INSERT INTO users (username, password, role, name, salary) VALUES (?, ?, ?, ?, ?)", 
#                        ('admin', admin_pass_hash, 'Admin', 'Administrator', 0))
#         print("✅ Default Admin created (admin/123).")
#     except sqlite3.IntegrityError:
#         pass # Admin already exists

#     conn.commit()
#     conn.close()

# # --- HELPER TO CLEAR DATA ---
# def clear_all_data():
#     conn = get_connection()
#     cursor = conn.cursor()
#     cursor.execute("DELETE FROM attendance")
#     cursor.execute("DELETE FROM tasks")
#     # Optional: Wipe users too if you want a full factory reset
#     # cursor.execute("DELETE FROM users") 
#     conn.commit()
#     conn.close()
#     print("⚠️ All transactional data has been wiped!")

# import sqlite3
# import os
# import hashlib 

# # Ensure the folder exists so the app doesn't crash on startup
# DB_FOLDER = "databases"
# DB_NAME = "attendance.db"
# DB_PATH = os.path.join(DB_FOLDER, DB_NAME)

# def get_connection():
#     # 1. Auto-create the directory if it's missing
#     if not os.path.exists(DB_FOLDER):
#         os.makedirs(DB_FOLDER)
        
#     # 2. Connect with check_same_thread=False (Required for FastAPI/Streamlit)
#     conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    
#     # 3. Enable column access by name (row['date'])
#     conn.row_factory = sqlite3.Row 
    
#     # 4. Enable Foreign Keys (CRITICAL for parent_id to work)
#     conn.execute("PRAGMA foreign_keys = ON")
    
#     return conn

# # --- PASSWORD HASHING HELPER ---
# def hash_password(password):
#     """Converts a plain text password into a SHA-256 hash."""
#     return hashlib.sha256(str(password).encode('utf-8')).hexdigest()

# def create_tables():
#     conn = get_connection()
#     cursor = conn.cursor()

#     # 1. Users Table
#     cursor.execute("""
#         CREATE TABLE IF NOT EXISTS users (
#             username TEXT PRIMARY KEY,
#             password TEXT NOT NULL,
#             role TEXT NOT NULL, 
#             name TEXT NOT NULL,
#             salary INTEGER DEFAULT 10000
#         )
#     """)

#     # 2. Attendance Table
#     cursor.execute("""
#         CREATE TABLE IF NOT EXISTS attendance (
#             id INTEGER PRIMARY KEY AUTOINCREMENT,
#             employee_name TEXT,
#             date TEXT,
#             login_time TEXT,
#             logout_time TEXT,
#             UNIQUE(employee_name, date) 
#         )
#     """)

#     # 3. Sprints Table (Agile)
#     cursor.execute("""
#         CREATE TABLE IF NOT EXISTS sprints (
#             id INTEGER PRIMARY KEY AUTOINCREMENT,
#             name TEXT NOT NULL,
#             start_date TEXT,
#             end_date TEXT,
#             goal TEXT,
#             status TEXT DEFAULT 'Planning', -- Planning, Active, Completed
#             created_at TEXT
#         )
#     """)

#     # 4. Epics Table (Large Features)
#     cursor.execute("""
#         CREATE TABLE IF NOT EXISTS epics (
#             id INTEGER PRIMARY KEY AUTOINCREMENT,
#             name TEXT NOT NULL,
#             description TEXT,
#             owner TEXT,
#             color TEXT DEFAULT '#0052CC',
#             status TEXT DEFAULT 'Open',
#             created_at TEXT
#         )
#     """)

#     # 5. Tasks Table (The Core Table - Expanded for Jira)
#     cursor.execute("""
#         CREATE TABLE IF NOT EXISTS tasks (
#             id INTEGER PRIMARY KEY AUTOINCREMENT,
#             task_key TEXT, -- e.g. TASK-1 (Unique ID for display)
#             employee_name TEXT,
#             date TEXT,
#             task_name TEXT,
#             description TEXT DEFAULT '',
#             allocated_hours REAL, 
#             status TEXT DEFAULT 'To Do',
#             priority TEXT DEFAULT 'Medium', -- Highest, High, Medium, Low, Lowest
#             task_type TEXT DEFAULT 'Task', -- Task, Bug, Story, Epic, Sub-task
#             story_points INTEGER DEFAULT 0,
#             labels TEXT, -- Comma separated tags
#             due_date TEXT,
            
#             -- Relationships
#             parent_id INTEGER,
#             sprint_id INTEGER,
#             epic_id INTEGER,
#             reporter TEXT,
            
#             created_at TEXT,
#             updated_at TEXT,

#             FOREIGN KEY(parent_id) REFERENCES tasks(id) ON DELETE CASCADE,
#             FOREIGN KEY(sprint_id) REFERENCES sprints(id) ON DELETE SET NULL,
#             FOREIGN KEY(epic_id) REFERENCES epics(id) ON DELETE SET NULL
#         )
#     """)

#     # 6. Task Comments Table
#     cursor.execute("""
#         CREATE TABLE IF NOT EXISTS task_comments (
#             id INTEGER PRIMARY KEY AUTOINCREMENT,
#             task_id INTEGER,
#             username TEXT,
#             comment TEXT,
#             created_at TEXT,
#             FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
#         )
#     """)

#     # 7. Task History Table (Audit Log)
#     cursor.execute("""
#         CREATE TABLE IF NOT EXISTS task_history (
#             id INTEGER PRIMARY KEY AUTOINCREMENT,
#             task_id INTEGER,
#             changed_by TEXT,
#             change_type TEXT, -- status_change, comment, edit, etc.
#             description TEXT,
#             changed_at TEXT,
#             FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
#         )
#     """)

#     # 8. Time Logs Table (Actual work tracking)
#     cursor.execute("""
#         CREATE TABLE IF NOT EXISTS task_time_logs (
#             id INTEGER PRIMARY KEY AUTOINCREMENT,
#             task_id INTEGER,
#             employee_name TEXT,
#             start_time TEXT,
#             end_time TEXT,
#             description TEXT,
#             FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
#         )
#     """)

#     # 9. Watchers Table
#     cursor.execute("""
#         CREATE TABLE IF NOT EXISTS task_watchers (
#             id INTEGER PRIMARY KEY AUTOINCREMENT,
#             task_id INTEGER,
#             username TEXT,
#             added_at TEXT,
#             FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
#         )
#     """)

#     # 10. Attachments Table
#     cursor.execute("""
#         CREATE TABLE IF NOT EXISTS task_attachments (
#             id INTEGER PRIMARY KEY AUTOINCREMENT,
#             task_id INTEGER,
#             filename TEXT,
#             file_path TEXT,
#             uploaded_by TEXT,
#             uploaded_at TEXT,
#             FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
#         )
#     """)
    
#     # 11. Create Default Admin (HASHED!)
#     try:
#         # We hash '123' before storing it
#         admin_pass_hash = hash_password('123') 
#         cursor.execute("INSERT INTO users (username, password, role, name, salary) VALUES (?, ?, ?, ?, ?)", 
#                        ('admin', admin_pass_hash, 'Admin', 'Administrator', 0))
#         print("✅ Default Admin created (admin/123).")
#     except sqlite3.IntegrityError:
#         pass # Admin already exists

#     conn.commit()
#     conn.close()

# # --- HELPER TO CLEAR DATA ---
# def clear_all_data():
#     conn = get_connection()
#     cursor = conn.cursor()
#     # List of all tables to clear
#     tables = [
#         "attendance", "tasks", "sprints", "epics", 
#         "task_comments", "task_history", "task_time_logs", 
#         "task_watchers", "task_attachments"
#     ]
#     for table in tables:
#         cursor.execute(f"DELETE FROM {table}")
        
#     # Optional: Wipe users too if you want a full factory reset
#     # cursor.execute("DELETE FROM users") 
    
#     conn.commit()
#     conn.close()
#     print("⚠️ All transactional data has been wiped!")


import sqlite3
import os
import hashlib 

# Ensure the folder exists so the app doesn't crash on startup
DB_FOLDER = "databases"
DB_NAME = "attendance.db"
DB_PATH = os.path.join(DB_FOLDER, DB_NAME)

def get_connection():
    # 1. Auto-create the directory if it's missing
    if not os.path.exists(DB_FOLDER):
        os.makedirs(DB_FOLDER)
        
    # 2. Connect with check_same_thread=False (Required for FastAPI/Streamlit)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    
    # 3. Enable column access by name (row['date'])
    conn.row_factory = sqlite3.Row 
    
    # 4. Enable Foreign Keys (CRITICAL for parent_id/cascading to work)
    conn.execute("PRAGMA foreign_keys = ON")
    
    return conn

# --- PASSWORD HASHING HELPER ---
def hash_password(password):
    """Converts a plain text password into a SHA-256 hash."""
    return hashlib.sha256(str(password).encode('utf-8')).hexdigest()

def create_tables():
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password TEXT NOT NULL,
            role TEXT NOT NULL, 
            name TEXT NOT NULL,
            salary INTEGER DEFAULT 10000
        )
    """)

    # 2. Attendance Table
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

    # 3. Sprints Table (Agile)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sprints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            start_date TEXT,
            end_date TEXT,
            goal TEXT,
            status TEXT DEFAULT 'Planning', -- Planning, Active, Completed
            created_at TEXT
        )
    """)

    # 4. Epics Table (Large Features)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS epics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            owner TEXT,
            color TEXT DEFAULT '#0052CC',
            status TEXT DEFAULT 'Open',
            created_at TEXT
        )
    """)

    # 5. Tasks Table (The Core Table - Expanded for Jira features)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_key TEXT, -- e.g. TASK-1 (Unique ID for display)
            employee_name TEXT,
            date TEXT,
            task_name TEXT,
            description TEXT DEFAULT '',
            allocated_hours REAL, 
            status TEXT DEFAULT 'To Do',
            priority TEXT DEFAULT 'Medium', -- Highest, High, Medium, Low, Lowest
            task_type TEXT DEFAULT 'Task', -- Task, Bug, Story, Epic, Sub-task
            story_points INTEGER DEFAULT 0,
            labels TEXT, -- Comma separated tags
            due_date TEXT,
            
            -- Relationships
            parent_id INTEGER,
            sprint_id INTEGER,
            epic_id INTEGER,
            reporter TEXT,
            
            created_at TEXT,
            updated_at TEXT,

            FOREIGN KEY(parent_id) REFERENCES tasks(id) ON DELETE CASCADE,
            FOREIGN KEY(sprint_id) REFERENCES sprints(id) ON DELETE SET NULL,
            FOREIGN KEY(epic_id) REFERENCES epics(id) ON DELETE SET NULL
        )
    """)

    # 6. Task Comments Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS task_comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER,
            username TEXT,
            comment TEXT,
            created_at TEXT,
            FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
        )
    """)

    # 7. Task History Table (Audit Log)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS task_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER,
            changed_by TEXT,
            change_type TEXT, -- status_change, comment, edit, etc.
            description TEXT,
            changed_at TEXT,
            FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
        )
    """)

    # 8. Time Logs Table (Actual work tracking)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS task_time_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER,
            employee_name TEXT,
            start_time TEXT,
            end_time TEXT,
            description TEXT,
            FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
        )
    """)

    # 9. Watchers Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS task_watchers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER,
            username TEXT,
            added_at TEXT,
            FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
        )
    """)

    # 10. Attachments Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS task_attachments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER,
            filename TEXT,
            file_path TEXT,
            uploaded_by TEXT,
            uploaded_at TEXT,
            FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
        )
    """)
    
    # 11. Create Default Admin (HASHED!)
    try:
        # We hash '123' before storing it
        admin_pass_hash = hash_password('123') 
        cursor.execute("INSERT INTO users (username, password, role, name, salary) VALUES (?, ?, ?, ?, ?)", 
                       ('admin', admin_pass_hash, 'Admin', 'Administrator', 0))
        print("✅ Default Admin created (admin/123).")
    except sqlite3.IntegrityError:
        pass # Admin already exists

    conn.commit()
    conn.close()

# --- HELPER TO CLEAR DATA ---
def clear_all_data():
    conn = get_connection()
    cursor = conn.cursor()
    # List of all tables to clear
    tables = [
        "attendance", "tasks", "sprints", "epics", 
        "task_comments", "task_history", "task_time_logs", 
        "task_watchers", "task_attachments"
    ]
    for table in tables:
        cursor.execute(f"DELETE FROM {table}")
        
    # Optional: Wipe users too if you want a full factory reset
    # cursor.execute("DELETE FROM users") 
    
    conn.commit()
    conn.close()
    print("⚠️ All transactional data has been wiped!")