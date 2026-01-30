import pandas as pd
import hashlib
from datetime import datetime
from databases.db import get_connection

FULL_DAY_HOURS = 8

# ---------------------------------------------------
# 1. SECURITY & AUTHENTICATION
# ---------------------------------------------------
def make_hashes(password):
    """Returns the SHA-256 hash of the password."""
    return hashlib.sha256(str(password).encode('utf-8')).hexdigest()

def check_hashes(password, hashed_text):
    """Checks if the entered password matches the stored hash."""
    if make_hashes(password) == hashed_text:
        return True
    return False

def login_user(username, password):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        query = "SELECT role, name, password FROM users WHERE username = ?"
        cursor.execute(query, (username,))
        user = cursor.fetchone()
        
        if user and check_hashes(password, user['password']):
            return user['role'], user['name']
    except Exception as e:
        print(f"Login error: {e}")
    finally:
        conn.close()
    return None, None

def register_user(username, password, name, role='Employee'):
    conn = get_connection()
    cursor = conn.cursor()
    hashed_password = make_hashes(password)
    try:
        cursor.execute("INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)", 
                       (username, hashed_password, role, name))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error creating user: {e}")
        return False
    finally:
        conn.close()

def get_all_users():
    conn = get_connection()
    try:
        df = pd.read_sql("SELECT username, role, name FROM users", conn)
        return df
    except Exception as e:
        print(f"Error fetching users: {e}")
        return pd.DataFrame()
    finally:
        conn.close()

# ---------------------------------------------------
# 2. LOAD ATTENDANCE DATA
# ---------------------------------------------------
def load_attendance_data():
    conn = get_connection()
    try:
        query = "SELECT employee_name, date, login_time, logout_time FROM attendance"
        df = pd.read_sql(query, conn)
    except Exception as e:
        print(f"Error loading data: {e}")
        df = pd.DataFrame()
    finally:
        conn.close()

    if df.empty:
        return pd.DataFrame(columns=["employee_name", "date", "login_time", "logout_time", "working_hours"])

    df["date"] = pd.to_datetime(df["date"])
    df["login_time"] = pd.to_datetime(df["login_time"], format="%H:%M", errors='coerce')
    df["logout_time"] = pd.to_datetime(df["logout_time"], format="%H:%M", errors='coerce')

    # Handle active sessions (Still Working)
    calc_logout = df["logout_time"].fillna(df["login_time"])
    df["working_hours"] = (calc_logout - df["login_time"]).dt.total_seconds() / 3600

    return df

# ---------------------------------------------------
# 3. MANUAL OVERRIDE (FIXED)
# ---------------------------------------------------
def add_employee_attendance(name, date, login, logout):
    """
    Manually inserts a record. 
    Returns True if successful, False if error (e.g., duplicate).
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Convert objects to string format for SQLite
        login_str = login.strftime("%H:%M")
        logout_str = logout.strftime("%H:%M")
        date_str = date.strftime("%Y-%m-%d")

        cursor.execute("""
            INSERT INTO attendance (employee_name, date, login_time, logout_time)
            VALUES (?, ?, ?, ?)
        """, (name, date_str, login_str, logout_str))
        
        conn.commit()
        return True
    except Exception as e:
        print(f"Manual Add Error: {e}")
        return False
    finally:
        conn.close()

# ---------------------------------------------------
# 4. REAL-TIME EMPLOYEE ACTIONS
# ---------------------------------------------------
def get_employee_current_status(employee_name):
    conn = get_connection()
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    try:
        query = "SELECT login_time, logout_time FROM attendance WHERE employee_name = ? AND date = ?"
        df = pd.read_sql(query, conn, params=(employee_name, today_str))
        
        if df.empty: return 'not_started'
        
        logout_val = df.iloc[0]['logout_time']
        if pd.isna(logout_val) or logout_val is None or logout_val == "":
            return 'working'
        else:
            return 'completed' 
    except Exception as e:
        print(f"Error checking status: {e}")
        return 'not_started'
    finally:
        conn.close()

def mark_punch_in(employee_name):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now()
    
    try:
        cursor.execute("""
            INSERT INTO attendance (employee_name, date, login_time, logout_time)
            VALUES (?, ?, ?, ?)
        """, (employee_name, now.strftime("%Y-%m-%d"), now.strftime("%H:%M"), None))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error punching in: {e}")
        return False
    finally:
        conn.close()

def mark_punch_out(employee_name):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now()
    
    try:
        cursor.execute("""
            UPDATE attendance 
            SET logout_time = ? 
            WHERE employee_name = ? AND date = ?
        """, (now.strftime("%H:%M"), employee_name, now.strftime("%Y-%m-%d")))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error punching out: {e}")
        return False
    finally:
        conn.close()

# ---------------------------------------------------
# 5. TASKS LOGIC (UPDATED)
# ---------------------------------------------------
def get_my_tasks(employee_name):
    conn = get_connection()
    today_str = datetime.now().strftime("%Y-%m-%d")
    try:
        query = """
            SELECT id, task_name, allocated_hours, status 
            FROM tasks 
            WHERE employee_name = ? AND date = ?
        """
        df = pd.read_sql(query, conn, params=(employee_name, today_str))
        return df
    except Exception as e:
        print(f"Error fetching tasks: {e}")
        return pd.DataFrame()
    finally:
        conn.close()

def get_all_tasks_history():
    """
    Fetches ALL tasks ever assigned for the Admin History View.
    Ordered by latest first.
    """
    conn = get_connection()
    try:
        query = """
            SELECT date, employee_name, task_name, allocated_hours, status 
            FROM tasks 
            ORDER BY id DESC
        """
        df = pd.read_sql(query, conn)
        return df
    except Exception as e:
        print(f"Error fetching task history: {e}")
        return pd.DataFrame()
    finally:
        conn.close()

def update_task_status(task_id, new_status):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE tasks SET status = ? WHERE id = ?", (new_status, task_id))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error updating task: {e}")
        return False
    finally:
        conn.close()

def allocate_task(employee_name, task_name, allocated_hours):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO tasks (employee_name, date, task_name, allocated_hours, status)
            VALUES (?, DATE('now'), ?, ?, 'Pending')
        """, (employee_name, task_name, allocated_hours))
        conn.commit()
    except Exception as e:
        print(f"Error allocating task: {e}")
    finally:
        conn.close()

def get_free_time_employees(df):
    """
    Calculates Free Time.
    Formula: 8 Hours - (Hours Worked + Hours of Accepted Tasks)
    """
    if df.empty:
        return pd.DataFrame(columns=["employee_name", "free_hours"])

    # 1. Get latest attendance (Hours Worked)
    latest_entries = df.sort_values("date").groupby("employee_name").tail(1).copy()
    
    # 2. Get Accepted Task Hours from DB
    conn = get_connection()
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    try:
        tasks_query = """
            SELECT employee_name, allocated_hours 
            FROM tasks 
            WHERE date = ? AND status = 'Accepted'
        """
        tasks_df = pd.read_sql(tasks_query, conn, params=(today_str,))
    except:
        tasks_df = pd.DataFrame(columns=["employee_name", "allocated_hours"])
    finally:
        conn.close()

    # Sum up accepted task hours per employee
    if not tasks_df.empty:
        task_hours_sum = tasks_df.groupby("employee_name")["allocated_hours"].sum().reset_index()
    else:
        task_hours_sum = pd.DataFrame(columns=["employee_name", "allocated_hours"])
    
    # Merge Attendance + Tasks
    merged = pd.merge(latest_entries, task_hours_sum, on="employee_name", how="left")
    merged["allocated_hours"] = merged["allocated_hours"].fillna(0)
    
    # Calculate Free Hours
    merged["free_hours"] = FULL_DAY_HOURS - (merged["working_hours"] + merged["allocated_hours"])

    # Filter: Show if free time > 0.1 hours (6 minutes) to allow minute-level detail
    free_employees = merged[merged["free_hours"] > 0.1]

    return free_employees[["employee_name", "free_hours"]]

# ---------------------------------------------------
# 6. VIEW LOGIC
# ---------------------------------------------------
def get_daily_attendance(df, selected_date):
    if df.empty: return pd.DataFrame()
    daily_df = df[df["date"] == selected_date].copy()
    if daily_df.empty: return pd.DataFrame(columns=["employee_name", "working_hours", "status"])

    def get_status(row):
        if row['working_hours'] > 0: return "✅ Present"
        return "⏳ Working"

    daily_df["status"] = daily_df.apply(get_status, axis=1)
    return daily_df[["employee_name", "working_hours", "status"]]

def get_working_hours_summary(df):
    if df.empty: return pd.DataFrame(columns=["employee_name", "total_hours", "average_hours"])
    summary = df.groupby("employee_name").agg(
        total_hours=("working_hours", "sum"),
        average_hours=("working_hours", "mean")
    ).reset_index()
    return summary.sort_values(by="total_hours", ascending=False)

def get_monthly_report(df):
    if df.empty: return pd.DataFrame()
    df = df.copy()
    df["month_period"] = df["date"].dt.to_period("M")
    monthly_report = df.groupby(["employee_name", "month_period"]).agg(
        working_days=("date", "nunique"),
        total_hours=("working_hours", "sum"),
        average_hours=("working_hours", "mean")
    ).reset_index()
    monthly_report["month"] = monthly_report["month_period"].astype(str)
    return monthly_report.drop(columns=["month_period"])


# --- IMPROVED FORMATTER (Paste in utils.py) ---

def format_hours(hours_float):
    """
    Converts decimal hours to 'Hh Mm' format safely.
    Examples:
    8.016 -> '8h 1m'
    0.5   -> '30m'
    8.0   -> '8h'
    """
    if pd.isna(hours_float) or hours_float <= 0:
        return "-"
    
    # 1. Convert total time to minutes (rounded to nearest minute)
    total_minutes = int(round(hours_float * 60))
    
    # 2. Extract hours and remaining minutes
    hours = total_minutes // 60
    minutes = total_minutes % 60
    
    # 3. Format string
    if hours == 0:
        return f"{minutes}m"       # e.g., "45m"
    if minutes == 0:
        return f"{hours}h"         # e.g., "8h"
        
    return f"{hours}h {minutes}m"  # e.g., "8h 1m"