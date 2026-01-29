import pandas as pd
from datetime import datetime
from databases.db import get_connection

FULL_DAY_HOURS = 8

# ---------------------------------------------------
# 1. LOAD ATTENDANCE DATA
# ---------------------------------------------------
def load_attendance_data():
    """
    Load attendance data from database and calculate working hours.
    Returns a cleaned DataFrame with calculated columns.
    """
    conn = get_connection()
    
    try:
        query = """
            SELECT employee_name, date, login_time, logout_time 
            FROM attendance 
        """
        df = pd.read_sql(query, conn)
    except Exception as e:
        print(f"Error loading data: {e}")
        df = pd.DataFrame()
    finally:
        conn.close()

    # Handle empty database case gracefully
    if df.empty:
        return pd.DataFrame(columns=[
            "employee_name", "date", "login_time", "logout_time", "working_hours"
        ])

    # Convert columns to correct data types
    df["date"] = pd.to_datetime(df["date"])
    
    # We convert time strings to full datetime objects for subtraction
    df["login_time"] = pd.to_datetime(df["login_time"], format="%H:%M", errors='coerce')
    df["logout_time"] = pd.to_datetime(df["logout_time"], format="%H:%M", errors='coerce')

    # Calculate Working Hours
    # (Total Seconds / 3600 gives hours)
    df["working_hours"] = (
        df["logout_time"] - df["login_time"]
    ).dt.total_seconds() / 3600

    return df

# ---------------------------------------------------
# 2. WRITE DATA (NEW FUNCTION)
# ---------------------------------------------------
def add_employee_attendance(name, date, login, logout):
    """
    Inserts a new attendance record into the database.
    Used by the Admin Sidebar form.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Format times as strings for storage if your DB expects text
        # If your DB is strictly TIME type, pass the objects directly
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
        print(f"Error inserting attendance: {e}")
        return False
    finally:
        conn.close()

# ---------------------------------------------------
# 3. DAILY ATTENDANCE VIEW
# ---------------------------------------------------
def get_daily_attendance(df, selected_date):
    """
    Filters data for a specific day and determines status.
    """
    if df.empty:
        return pd.DataFrame()

    # Filter by date
    daily_df = df[df["date"] == selected_date].copy()

    if daily_df.empty:
        return pd.DataFrame(columns=["employee_name", "working_hours", "status"])

    # Determine Status Logic
    daily_df["status"] = daily_df["working_hours"].apply(
        lambda x: "✅ Present" if x > 0 else "❌ Absent"
    )

    # Format for display
    return daily_df[["employee_name", "working_hours", "status"]]

# ---------------------------------------------------
# 4. SUMMARY METRICS (For Charts)
# ---------------------------------------------------
def get_working_hours_summary(df):
    """
    Aggregates total hours per employee for the Leaderboard Chart.
    """
    if df.empty:
        return pd.DataFrame(columns=["employee_name", "total_hours", "average_hours"])

    summary = df.groupby("employee_name").agg(
        total_hours=("working_hours", "sum"),
        average_hours=("working_hours", "mean")
    ).reset_index()

    return summary.sort_values(by="total_hours", ascending=False)

# ---------------------------------------------------
# 5. FREE TIME LOGIC (For Task Allocation)
# ---------------------------------------------------
def get_free_time_employees(df):
    """
    Identifies employees who have worked less than the standard day (8 hrs).
    Focuses on the *latest available date* for that employee.
    """
    if df.empty:
        return pd.DataFrame(columns=["employee_name", "free_hours"])

    # Get the latest entry for each employee
    latest_entries = df.sort_values("date").groupby("employee_name").tail(1).copy()
    
    # Calculate free hours remaining
    latest_entries["free_hours"] = FULL_DAY_HOURS - latest_entries["working_hours"]

    # Filter: Only show those with significant free time (> 1 hour)
    free_employees = latest_entries[latest_entries["free_hours"] > 1]

    return free_employees[["employee_name", "free_hours"]]

# ---------------------------------------------------
# 6. MONTHLY REPORT
# ---------------------------------------------------
def get_monthly_report(df):
    """
    Aggregates data by month.
    """
    if df.empty:
        return pd.DataFrame()

    df = df.copy()
    # Create a Month Period (e.g., 2023-10)
    df["month_period"] = df["date"].dt.to_period("M")

    monthly_report = df.groupby(["employee_name", "month_period"]).agg(
        working_days=("date", "nunique"),
        total_hours=("working_hours", "sum"),
        average_hours=("working_hours", "mean")
    ).reset_index()

    # IMPORTANT: Convert Period to String for Streamlit/Plotly compatibility
    monthly_report["month"] = monthly_report["month_period"].astype(str)
    
    return monthly_report.drop(columns=["month_period"])

# ---------------------------------------------------
# 7. TASK ALLOCATION (WRITE DB)
# ---------------------------------------------------
def allocate_task(employee_name, task_name, allocated_hours):
    """
    Inserts a task assignment into the database.
    """
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

# ---------------------------------------------------
# 8. KPIS
# ---------------------------------------------------
def calculate_kpis(df):
    """
    Returns a dictionary of high-level metrics.
    """
    if df.empty:
        return {
            "total_employees": 0,
            "average_working_hours": 0,
            "underutilized_employees": 0
        }

    return {
        "total_employees": df["employee_name"].nunique(),
        "average_working_hours": round(df["working_hours"].mean(), 2),
        "underutilized_employees": len(get_free_time_employees(df))
    }