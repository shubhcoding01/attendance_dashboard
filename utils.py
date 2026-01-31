import pandas as pd
import hashlib
import calendar 
from datetime import datetime
from databases.db import get_connection

FULL_DAY_HOURS = 8

# ---------------------------------------------------
# 1. CONFIGURATION (HOLIDAYS 2026)
# ---------------------------------------------------
HOLIDAYS_2026 = [
    "2026-01-01", "2026-01-15", "2026-01-26", "2026-03-19", 
    "2026-05-01", "2026-08-15", "2026-09-14", "2026-10-02", 
    "2026-10-20", "2026-10-21", "2026-12-25"
]

# ---------------------------------------------------
# 2. SECURITY & USERS
# ---------------------------------------------------
def make_hashes(password):
    return hashlib.sha256(str(password).encode('utf-8')).hexdigest()

def check_hashes(password, hashed_text):
    if make_hashes(password) == hashed_text: return True
    return False

def login_user(username, password):
    conn = get_connection(); cursor = conn.cursor()
    try:
        cursor.execute("SELECT role, name, password FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        if user and check_hashes(password, user['password']): return user['role'], user['name']
    except: pass
    finally: conn.close()
    return None, None

def register_user(username, password, name, role='Employee', salary=10000):
    conn = get_connection(); cursor = conn.cursor()
    hashed = make_hashes(password)
    try:
        cursor.execute("INSERT INTO users (username, password, role, name, salary) VALUES (?, ?, ?, ?, ?)", 
                       (username, hashed, role, name, salary))
        conn.commit(); return True
    except: return False
    finally: conn.close()

def get_all_users():
    conn = get_connection()
    try: return pd.read_sql("SELECT username, role, name, salary FROM users", conn)
    except: return pd.DataFrame()
    finally: conn.close()

def delete_user_data(username):
    """Safely deletes a user and ALL related data."""
    if username == 'admin': return False, "❌ Cannot delete Admin!"
    
    conn = get_connection(); cursor = conn.cursor()
    try:
        cursor.execute("SELECT name FROM users WHERE username = ?", (username,))
        res = cursor.fetchone()
        if not res: return False, "User not found"
        name = res['name']

        # Cascading Delete
        cursor.execute("DELETE FROM attendance WHERE employee_name = ?", (name,))
        cursor.execute("DELETE FROM tasks WHERE employee_name = ?", (name,))
        cursor.execute("DELETE FROM users WHERE username = ?", (username,))
        conn.commit()
        return True, f"✅ User {name} and all data deleted."
    except Exception as e: return False, str(e)
    finally: conn.close()

# ---------------------------------------------------
# 3. ATTENDANCE
# ---------------------------------------------------
def load_attendance_data():
    conn = get_connection()
    try:
        df = pd.read_sql("SELECT employee_name, date, login_time, logout_time FROM attendance", conn)
    except: return pd.DataFrame(columns=["employee_name", "date", "working_hours"])
    finally: conn.close()

    if df.empty: return pd.DataFrame(columns=["employee_name", "date", "working_hours"])

    df["date"] = pd.to_datetime(df["date"])
    df["login_time"] = pd.to_datetime(df["login_time"], format="%H:%M", errors='coerce')
    df["logout_time"] = pd.to_datetime(df["logout_time"], format="%H:%M", errors='coerce')
    
    calc_logout = df["logout_time"].fillna(df["login_time"])
    df["working_hours"] = (calc_logout - df["login_time"]).dt.total_seconds() / 3600
    return df

def add_employee_attendance(name, date, login, logout):
    conn = get_connection(); cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO attendance (employee_name, date, login_time, logout_time) VALUES (?, ?, ?, ?)", 
                       (name, date.strftime("%Y-%m-%d"), login.strftime("%H:%M"), logout.strftime("%H:%M")))
        conn.commit(); return True
    except: return False
    finally: conn.close()

# ---------------------------------------------------
# 4. REAL-TIME
# ---------------------------------------------------
def get_employee_current_status(employee_name):
    conn = get_connection()
    try:
        df = pd.read_sql("SELECT logout_time FROM attendance WHERE employee_name = ? AND date = ?", 
                         conn, params=(employee_name, datetime.now().strftime("%Y-%m-%d")))
        if df.empty: return 'not_started'
        if pd.isna(df.iloc[0]['logout_time']) or df.iloc[0]['logout_time'] == "": return 'working'
        return 'completed'
    except: return 'not_started'
    finally: conn.close()

def mark_punch_in(employee_name):
    conn = get_connection(); cursor = conn.cursor(); now = datetime.now()
    try:
        cursor.execute("INSERT INTO attendance (employee_name, date, login_time, logout_time) VALUES (?, ?, ?, ?)", 
                       (employee_name, now.strftime("%Y-%m-%d"), now.strftime("%H:%M"), None))
        conn.commit(); return True
    except: return False
    finally: conn.close()

def mark_punch_out(employee_name):
    conn = get_connection(); cursor = conn.cursor(); now = datetime.now()
    try:
        cursor.execute("UPDATE attendance SET logout_time = ? WHERE employee_name = ? AND date = ?", 
                       (now.strftime("%H:%M"), employee_name, now.strftime("%Y-%m-%d")))
        conn.commit(); return True
    except: return False
    finally: conn.close()

# ---------------------------------------------------
# 5. TASKS (EDIT & DELETE ADDED)
# ---------------------------------------------------
def get_my_tasks(employee_name):
    conn = get_connection()
    try:
        return pd.read_sql("SELECT id, task_name, allocated_hours, status FROM tasks WHERE employee_name = ? AND date = ?", 
                           conn, params=(employee_name, datetime.now().strftime("%Y-%m-%d")))
    except: return pd.DataFrame()
    finally: conn.close()

def get_all_tasks_history():
    conn = get_connection()
    try: 
        # FIX: ADDED 'id' TO SELECT FOR EDIT/DELETE
        return pd.read_sql("SELECT id, date, employee_name, task_name, allocated_hours, status FROM tasks ORDER BY id DESC", conn)
    except: return pd.DataFrame()
    finally: conn.close()

def update_task_status(task_id, new_status):
    conn = get_connection(); cursor = conn.cursor()
    try:
        cursor.execute("UPDATE tasks SET status = ? WHERE id = ?", (new_status, task_id))
        conn.commit(); return True
    except: return False
    finally: conn.close()

def allocate_task(employee_name, task_name, hours):
    conn = get_connection(); cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO tasks (employee_name, date, task_name, allocated_hours, status) VALUES (?, DATE('now'), ?, ?, 'Pending')", 
                       (employee_name, task_name, hours))
        conn.commit()
    except: pass
    finally: conn.close()

def delete_task(task_id):
    """Deletes a task permanently."""
    conn = get_connection(); cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        conn.commit(); return True
    except: return False
    finally: conn.close()

def edit_task(task_id, new_task_name, new_hours):
    """Updates task details."""
    conn = get_connection(); cursor = conn.cursor()
    try:
        cursor.execute("UPDATE tasks SET task_name = ?, allocated_hours = ? WHERE id = ?", 
                       (new_task_name, new_hours, task_id))
        conn.commit(); return True
    except: return False
    finally: conn.close()

def get_free_time_employees(df):
    if df.empty: return pd.DataFrame(columns=["employee_name", "free_hours"])
    latest = df.sort_values("date").groupby("employee_name").tail(1).copy()
    
    conn = get_connection()
    try:
        tasks = pd.read_sql("SELECT employee_name, allocated_hours FROM tasks WHERE date = ? AND status = 'Accepted'", 
                            conn, params=(datetime.now().strftime("%Y-%m-%d"),))
    except: tasks = pd.DataFrame(columns=["employee_name", "allocated_hours"])
    finally: conn.close()

    if not tasks.empty: task_sum = tasks.groupby("employee_name")["allocated_hours"].sum().reset_index()
    else: task_sum = pd.DataFrame(columns=["employee_name", "allocated_hours"])
    
    merged = pd.merge(latest, task_sum, on="employee_name", how="left")
    merged["allocated_hours"] = merged["allocated_hours"].fillna(0)
    merged["free_hours"] = FULL_DAY_HOURS - (merged["working_hours"] + merged["allocated_hours"])
    return merged[merged["free_hours"] > 0.1][["employee_name", "free_hours"]]

# ---------------------------------------------------
# 6. REPORTING & UTILS
# ---------------------------------------------------
def get_daily_attendance(df, selected_date):
    if df.empty: return pd.DataFrame()
    ddf = df[df["date"] == selected_date].copy()
    if ddf.empty: return pd.DataFrame(columns=["employee_name", "working_hours", "status"])
    ddf["status"] = ddf.apply(lambda r: "✅ Present" if r['working_hours'] > 0 else "⏳ Working", axis=1)
    return ddf[["employee_name", "working_hours", "status"]]

def get_working_hours_summary(df):
    if df.empty: return pd.DataFrame(columns=["employee_name", "total_hours", "average_hours"])
    return df.groupby("employee_name").agg(
        total_hours=("working_hours", "sum"),
        average_hours=("working_hours", "mean")
    ).reset_index().sort_values("total_hours", ascending=False)

def get_monthly_report(df):
    if df.empty: return pd.DataFrame()
    df = df.copy()
    df["month_period"] = df["date"].dt.to_period("M")
    
    rep = df.groupby(["employee_name", "month_period"]).agg(
        working_days=("date", "nunique"),
        total_hours=("working_hours", "sum"),
        average_hours=("working_hours", "mean")
    ).reset_index()
    
    rep["month"] = rep["month_period"].astype(str) # Fix KeyError
    return rep.drop(columns=["month_period"])

def format_hours(val):
    if pd.isna(val) or val <= 0: return "-"
    mins = int(round(val * 60))
    h, m = divmod(mins, 60)
    return f"{h}h {m}m" if m!=0 else f"{h}h"

# ---------------------------------------------------
# 7. PAYROLL
# ---------------------------------------------------
def calculate_payroll(year, month):
    conn = get_connection()
    users = pd.read_sql("SELECT name, salary FROM users WHERE role='Employee'", conn)
    if users.empty: conn.close(); return pd.DataFrame()

    _, num_days = calendar.monthrange(year, month)
    non_working = 0
    for day in range(1, num_days + 1):
        dt = datetime(year, month, day)
        if dt.weekday() == 6 or (year == 2026 and dt.strftime("%Y-%m-%d") in HOLIDAYS_2026):
            non_working += 1
            
    total_working_days = max(1, num_days - non_working)
    
    start, end = f"{year}-{month:02d}-01", f"{year}-{month:02d}-{num_days}"
    att = pd.read_sql("SELECT employee_name, COUNT(DISTINCT date) as days_present FROM attendance WHERE date BETWEEN ? AND ? GROUP BY employee_name", 
                      conn, params=(start, end))
    conn.close()
    
    pay = pd.merge(users, att, left_on="name", right_on="employee_name", how="left")
    pay["days_present"] = pay["days_present"].fillna(0)
    pay["final_pay"] = ((pay["salary"] / total_working_days) * pay["days_present"]).round(0)
    pay["total_working_days"] = total_working_days
    
    return pay[["name", "salary", "total_working_days", "days_present", "final_pay"]].rename(columns={"salary": "base_salary"})