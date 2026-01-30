# import pandas as pd
# from datetime import datetime
# from databases.db import get_connection

# FULL_DAY_HOURS = 8

# # ---------------------------------------------------
# # 1. LOAD ATTENDANCE DATA
# # ---------------------------------------------------
# def load_attendance_data():
#     """
#     Load attendance data from database and calculate working hours.
#     Returns a cleaned DataFrame with calculated columns.
#     """
#     conn = get_connection()
    
#     try:
#         query = """
#             SELECT employee_name, date, login_time, logout_time 
#             FROM attendance 
#         """
#         df = pd.read_sql(query, conn)
#     except Exception as e:
#         print(f"Error loading data: {e}")
#         df = pd.DataFrame()
#     finally:
#         conn.close()

#     # Handle empty database case gracefully
#     if df.empty:
#         return pd.DataFrame(columns=[
#             "employee_name", "date", "login_time", "logout_time", "working_hours"
#         ])

#     # Convert columns to correct data types
#     df["date"] = pd.to_datetime(df["date"])
    
#     # We convert time strings to full datetime objects for subtraction
#     df["login_time"] = pd.to_datetime(df["login_time"], format="%H:%M", errors='coerce')
#     df["logout_time"] = pd.to_datetime(df["logout_time"], format="%H:%M", errors='coerce')

#     # Calculate Working Hours
#     # (Total Seconds / 3600 gives hours)
#     df["working_hours"] = (
#         df["logout_time"] - df["login_time"]
#     ).dt.total_seconds() / 3600

#     return df

# # ---------------------------------------------------
# # 2. WRITE DATA (NEW FUNCTION)
# # ---------------------------------------------------
# def add_employee_attendance(name, date, login, logout):
#     """
#     Inserts a new attendance record into the database.
#     Used by the Admin Sidebar form.
#     """
#     conn = get_connection()
#     cursor = conn.cursor()
    
#     try:
#         # Format times as strings for storage if your DB expects text
#         # If your DB is strictly TIME type, pass the objects directly
#         login_str = login.strftime("%H:%M")
#         logout_str = logout.strftime("%H:%M")
#         date_str = date.strftime("%Y-%m-%d")

#         cursor.execute("""
#             INSERT INTO attendance (employee_name, date, login_time, logout_time)
#             VALUES (?, ?, ?, ?)
#         """, (name, date_str, login_str, logout_str))
        
#         conn.commit()
#         return True
#     except Exception as e:
#         print(f"Error inserting attendance: {e}")
#         return False
#     finally:
#         conn.close()

# # ---------------------------------------------------
# # 3. DAILY ATTENDANCE VIEW
# # ---------------------------------------------------
# def get_daily_attendance(df, selected_date):
#     """
#     Filters data for a specific day and determines status.
#     """
#     if df.empty:
#         return pd.DataFrame()

#     # Filter by date
#     daily_df = df[df["date"] == selected_date].copy()

#     if daily_df.empty:
#         return pd.DataFrame(columns=["employee_name", "working_hours", "status"])

#     # Determine Status Logic
#     daily_df["status"] = daily_df["working_hours"].apply(
#         lambda x: "✅ Present" if x > 0 else "❌ Absent"
#     )

#     # Format for display
#     return daily_df[["employee_name", "working_hours", "status"]]

# # ---------------------------------------------------
# # 4. SUMMARY METRICS (For Charts)
# # ---------------------------------------------------
# def get_working_hours_summary(df):
#     """
#     Aggregates total hours per employee for the Leaderboard Chart.
#     """
#     if df.empty:
#         return pd.DataFrame(columns=["employee_name", "total_hours", "average_hours"])

#     summary = df.groupby("employee_name").agg(
#         total_hours=("working_hours", "sum"),
#         average_hours=("working_hours", "mean")
#     ).reset_index()

#     return summary.sort_values(by="total_hours", ascending=False)

# # ---------------------------------------------------
# # 5. FREE TIME LOGIC (For Task Allocation)
# # ---------------------------------------------------
# def get_free_time_employees(df):
#     """
#     Identifies employees who have worked less than the standard day (8 hrs).
#     Focuses on the *latest available date* for that employee.
#     """
#     if df.empty:
#         return pd.DataFrame(columns=["employee_name", "free_hours"])

#     # Get the latest entry for each employee
#     latest_entries = df.sort_values("date").groupby("employee_name").tail(1).copy()
    
#     # Calculate free hours remaining
#     latest_entries["free_hours"] = FULL_DAY_HOURS - latest_entries["working_hours"]

#     # Filter: Only show those with significant free time (> 1 hour)
#     free_employees = latest_entries[latest_entries["free_hours"] > 1]

#     return free_employees[["employee_name", "free_hours"]]

# # ---------------------------------------------------
# # 6. MONTHLY REPORT
# # ---------------------------------------------------
# def get_monthly_report(df):
#     """
#     Aggregates data by month.
#     """
#     if df.empty:
#         return pd.DataFrame()

#     df = df.copy()
#     # Create a Month Period (e.g., 2023-10)
#     df["month_period"] = df["date"].dt.to_period("M")

#     monthly_report = df.groupby(["employee_name", "month_period"]).agg(
#         working_days=("date", "nunique"),
#         total_hours=("working_hours", "sum"),
#         average_hours=("working_hours", "mean")
#     ).reset_index()

#     # IMPORTANT: Convert Period to String for Streamlit/Plotly compatibility
#     monthly_report["month"] = monthly_report["month_period"].astype(str)
    
#     return monthly_report.drop(columns=["month_period"])

# # ---------------------------------------------------
# # 7. TASK ALLOCATION (WRITE DB)
# # ---------------------------------------------------
# def allocate_task(employee_name, task_name, allocated_hours):
#     """
#     Inserts a task assignment into the database.
#     """
#     conn = get_connection()
#     cursor = conn.cursor()

#     try:
#         cursor.execute("""
#             INSERT INTO tasks (employee_name, date, task_name, allocated_hours)
#             VALUES (?, DATE('now'), ?, ?)
#         """, (employee_name, task_name, allocated_hours))
#         conn.commit()
#     except Exception as e:
#         print(f"Error allocating task: {e}")
#     finally:
#         conn.close()

# # ---------------------------------------------------
# # 8. KPIS
# # ---------------------------------------------------
# def calculate_kpis(df):
#     """
#     Returns a dictionary of high-level metrics.
#     """
#     if df.empty:
#         return {
#             "total_employees": 0,
#             "average_working_hours": 0,
#             "underutilized_employees": 0
#         }

#     return {
#         "total_employees": df["employee_name"].nunique(),
#         "average_working_hours": round(df["working_hours"].mean(), 2),
#         "underutilized_employees": len(get_free_time_employees(df))
#     }


import pandas as pd
from datetime import datetime
from databases.db import get_connection

FULL_DAY_HOURS = 8

# ---------------------------------------------------
# 1. LOAD ATTENDANCE DATA (UPDATED FOR REAL-TIME)
# ---------------------------------------------------
def load_attendance_data():
    """
    Load attendance data from database and calculate working hours.
    Handles 'Still Working' employees gracefully.
    """
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
        return pd.DataFrame(columns=[
            "employee_name", "date", "login_time", "logout_time", "working_hours"
        ])

    # Convert to DateTime objects
    df["date"] = pd.to_datetime(df["date"])
    df["login_time"] = pd.to_datetime(df["login_time"], format="%H:%M", errors='coerce')
    df["logout_time"] = pd.to_datetime(df["logout_time"], format="%H:%M", errors='coerce')

    # --- CRITICAL FIX: HANDLE ACTIVE SESSIONS ---
    # If logout_time is NaT (Not a Time), it means they are still working.
    # We temporarily fill it with login_time so the calculation = 0 hours (instead of crashing)
    # Alternatively, you could fill with datetime.now() to show "hours worked so far"
    calc_logout = df["logout_time"].fillna(df["login_time"])

    df["working_hours"] = (calc_logout - df["login_time"]).dt.total_seconds() / 3600

    return df

# ---------------------------------------------------
# 2. REAL-TIME EMPLOYEE ACTIONS (NEW SECTIONS)
# ---------------------------------------------------

def get_employee_current_status(employee_name):
    """
    Checks if employee has punched in/out TODAY.
    Returns: 'not_started', 'working', or 'completed'
    """
    conn = get_connection()
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    try:
        query = """
            SELECT login_time, logout_time 
            FROM attendance 
            WHERE employee_name = ? AND date = ?
        """
        # We need to fetch into a dataframe or use fetchone
        # Using pandas here for consistency with other functions
        df = pd.read_sql(query, conn, params=(employee_name, today_str))
        
        if df.empty:
            return 'not_started'
        
        # Check if logout is None or empty
        # Note: SQLite might return None, Pandas might see it as None or NaN
        logout_val = df.iloc[0]['logout_time']
        
        if logout_val is None or logout_val == "":
            return 'working'
        else:
            return 'completed'
            
    except Exception as e:
        print(f"Error checking status: {e}")
        return 'not_started'
    finally:
        conn.close()

def mark_punch_in(employee_name):
    """
    Inserts a new record with Login Time = Now
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H:%M")
    
    try:
        cursor.execute("""
            INSERT INTO attendance (employee_name, date, login_time, logout_time)
            VALUES (?, ?, ?, ?)
        """, (employee_name, date_str, time_str, None))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error punching in: {e}")
        return False
    finally:
        conn.close()

def mark_punch_out(employee_name):
    """
    Updates today's record with Logout Time = Now
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H:%M")
    
    try:
        cursor.execute("""
            UPDATE attendance 
            SET logout_time = ? 
            WHERE employee_name = ? AND date = ?
        """, (time_str, employee_name, date_str))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error punching out: {e}")
        return False
    finally:
        conn.close()

def get_my_tasks(employee_name):
    """
    Fetches tasks assigned to a specific employee for TODAY.
    """
    conn = get_connection()
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    try:
        query = """
            SELECT task_name, allocated_hours 
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

# ---------------------------------------------------
# 3. ADMIN: MANUAL ADD (Legacy Support)
# ---------------------------------------------------
def add_employee_attendance(name, date, login, logout):
    """
    Admin manually adds a record (Backfill).
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
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
        print(f"Error manual add: {e}")
        return False
    finally:
        conn.close()

# ---------------------------------------------------
# 4. VIEW LOGIC (Charts & Tables)
# ---------------------------------------------------
def get_daily_attendance(df, selected_date):
    if df.empty: return pd.DataFrame()
    daily_df = df[df["date"] == selected_date].copy()
    if daily_df.empty: return pd.DataFrame(columns=["employee_name", "working_hours", "status"])

    # If working_hours is 0 (because they are just logged in), show "Working"
    # Logic: If logout is NaT/None, they are working. Else Present.
    
    def get_status(row):
        # We need to check original data, but 'working_hours' handles the math
        if row['working_hours'] > 0:
            return "✅ Present"
        # If hours are 0, it might mean they just logged in or haven't logged out
        return "⏳ Working (or just started)"

    daily_df["status"] = daily_df.apply(get_status, axis=1)
    return daily_df[["employee_name", "working_hours", "status"]]

def get_working_hours_summary(df):
    if df.empty: return pd.DataFrame(columns=["employee_name", "total_hours", "average_hours"])
    summary = df.groupby("employee_name").agg(
        total_hours=("working_hours", "sum"),
        average_hours=("working_hours", "mean")
    ).reset_index()
    return summary.sort_values(by="total_hours", ascending=False)

def get_free_time_employees(df):
    if df.empty: return pd.DataFrame(columns=["employee_name", "free_hours"])
    latest_entries = df.sort_values("date").groupby("employee_name").tail(1).copy()
    latest_entries["free_hours"] = FULL_DAY_HOURS - latest_entries["working_hours"]
    free_employees = latest_entries[latest_entries["free_hours"] > 1]
    return free_employees[["employee_name", "free_hours"]]

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

# ---------------------------------------------------
# 5. TASK ALLOCATION (Write)
# ---------------------------------------------------
def allocate_task(employee_name, task_name, allocated_hours):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO tasks (employee_name, date, task_name, allocated_hours)
            VALUES (?, DATE('now'), ?, ?)
        """, (employee_name, task_name, allocated_hours))
        conn.commit()
    except Exception as e:
        print(f"Error allocating task: {e}")
    finally:
        conn.close()

def calculate_kpis(df):
    if df.empty:
        return {"total_employees": 0, "average_working_hours": 0, "underutilized_employees": 0}
    return {
        "total_employees": df["employee_name"].nunique(),
        "average_working_hours": round(df["working_hours"].mean(), 2),
        "underutilized_employees": len(get_free_time_employees(df))
    }