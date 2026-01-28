# import pandas as pd

# # -------------------- CONSTANTS --------------------
# FULL_DAY_HOURS = 8


# # -------------------- LOAD DATA --------------------
# def load_attendance_data(filepath="attendance.csv"):
#     """
#     Load attendance CSV and calculate working hours.
#     """
#     df = pd.read_csv(filepath)

#     # Convert date column
#     df["date"] = pd.to_datetime(df["date"])

#     # Convert login and logout times
#     df["login_time"] = pd.to_datetime(df["login_time"], format="%H:%M")
#     df["logout_time"] = pd.to_datetime(df["logout_time"], format="%H:%M")

#     # Calculate working hours in hours
#     df["working_hours"] = (
#         df["logout_time"] - df["login_time"]
#     ).dt.total_seconds() / 3600

#     return df


# # -------------------- DAILY ATTENDANCE --------------------
# def get_daily_attendance(df, selected_date):
#     """
#     Get daily attendance with Present / Absent status.
#     """
#     day_df = df[df["date"] == selected_date].copy()

#     day_df["status"] = day_df["working_hours"].apply(
#         lambda x: "Present" if x > 0 else "Absent"
#     )

#     return day_df[["employee_name", "working_hours", "status"]]


# # -------------------- WORKING HOURS SUMMARY --------------------
# def get_working_hours_summary(df):
#     """
#     Get total and average working hours per employee.
#     """
#     summary = df.groupby("employee_name").agg(
#         total_hours=("working_hours", "sum"),
#         average_hours=("working_hours", "mean")
#     ).reset_index()

#     return summary


# # -------------------- FREE TIME DETECTION --------------------
# def get_free_time_employees(df):
#     """
#     Identify employees who worked less than full working hours.
#     """
#     df = df.copy()
#     df["free_hours"] = FULL_DAY_HOURS - df["working_hours"]

#     free_employees = df[df["free_hours"] > 2]

#     return free_employees[["employee_name", "free_hours"]]


# # -------------------- MONTHLY REPORT --------------------
# def get_monthly_report(df):
#     """
#     Generate monthly attendance and working hours report.
#     """
#     df = df.copy()
#     df["month"] = df["date"].dt.to_period("M")

#     monthly_report = df.groupby(["employee_name", "month"]).agg(
#         working_days=("date", "nunique"),
#         total_hours=("working_hours", "sum"),
#         average_hours=("working_hours", "mean")
#     ).reset_index()

#     return monthly_report


# # -------------------- TASK ALLOCATION --------------------
# def allocate_task(employee_name, task_name, hours, filepath="tasks.csv"):
#     """
#     Allocate a task to an employee and store it in CSV.
#     """
#     task_df = pd.read_csv(filepath)

#     new_task = {
#         "employee_name": employee_name,
#         "date": pd.Timestamp.today().date(),
#         "task_name": task_name,
#         "allocated_hours": hours
#     }

#     task_df = pd.concat([task_df, pd.DataFrame([new_task])], ignore_index=True)
#     task_df.to_csv(filepath, index=False)


# # -------------------- KPI CALCULATIONS --------------------
# def calculate_kpis(df):
#     """
#     Calculate dashboard KPIs.
#     """
#     total_employees = df["employee_name"].nunique()
#     average_working_hours = round(df["working_hours"].mean(), 2)
#     underutilized_count = len(get_free_time_employees(df))

#     return {
#         "total_employees": total_employees,
#         "average_working_hours": average_working_hours,
#         "underutilized_employees": underutilized_count
#     }


import pandas as pd
from databases.db import get_connection

FULL_DAY_HOURS = 8


# ---------------------------------------------------
# LOAD ATTENDANCE DATA
# ---------------------------------------------------
def load_attendance_data():
    """
    Load attendance data from SQLite database and
    calculate working hours.
    """
    conn = get_connection()

    query = """
        SELECT employee_name, date, login_time, logout_time
        FROM attendance
    """

    df = pd.read_sql(query, conn)
    conn.close()

    if df.empty:
        return pd.DataFrame(
            columns=[
                "employee_name",
                "date",
                "login_time",
                "logout_time",
                "working_hours"
            ]
        )

    df["date"] = pd.to_datetime(df["date"])
    df["login_time"] = pd.to_datetime(df["login_time"], format="%H:%M")
    df["logout_time"] = pd.to_datetime(df["logout_time"], format="%H:%M")

    df["working_hours"] = (
        df["logout_time"] - df["login_time"]
    ).dt.total_seconds() / 3600

    return df


# ---------------------------------------------------
# DAILY ATTENDANCE
# ---------------------------------------------------
def get_daily_attendance(df, selected_date):
    """
    Return daily attendance with Present / Absent status.
    """
    daily_df = df[df["date"] == selected_date].copy()

    daily_df["status"] = daily_df["working_hours"].apply(
        lambda x: "Present" if x > 0 else "Absent"
    )

    return daily_df[
        ["employee_name", "working_hours", "status"]
    ]


# ---------------------------------------------------
# WORKING HOURS SUMMARY
# ---------------------------------------------------
def get_working_hours_summary(df):
    """
    Return total and average working hours per employee.
    """
    if df.empty:
        return pd.DataFrame(
            columns=["employee_name", "total_hours", "average_hours"]
        )

    summary = df.groupby("employee_name").agg(
        total_hours=("working_hours", "sum"),
        average_hours=("working_hours", "mean")
    ).reset_index()

    return summary


# ---------------------------------------------------
# FREE TIME DETECTION
# ---------------------------------------------------
def get_free_time_employees(df):
    """
    Identify employees with more than 2 free hours.
    """
    if df.empty:
        return pd.DataFrame(
            columns=["employee_name", "free_hours"]
        )

    df = df.copy()
    df["free_hours"] = FULL_DAY_HOURS - df["working_hours"]

    free_employees = df[df["free_hours"] > 2]

    return free_employees[
        ["employee_name", "free_hours"]
    ]


# ---------------------------------------------------
# MONTHLY REPORT
# ---------------------------------------------------
def get_monthly_report(df):
    """
    Generate monthly attendance and productivity report.
    """
    if df.empty:
        return pd.DataFrame(
            columns=[
                "employee_name",
                "month",
                "working_days",
                "total_hours",
                "average_hours"
            ]
        )

    df = df.copy()
    df["month"] = df["date"].dt.to_period("M")

    monthly_report = df.groupby(
        ["employee_name", "month"]
    ).agg(
        working_days=("date", "nunique"),
        total_hours=("working_hours", "sum"),
        average_hours=("working_hours", "mean")
    ).reset_index()

    return monthly_report


# ---------------------------------------------------
# TASK ALLOCATION (DATABASE)
# ---------------------------------------------------
def allocate_task(employee_name, task_name, allocated_hours):
    """
    Insert allocated task into SQLite database.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO tasks (employee_name, date, task_name, allocated_hours)
        VALUES (?, DATE('now'), ?, ?)
    """, (employee_name, task_name, allocated_hours))

    conn.commit()
    conn.close()


# ---------------------------------------------------
# DASHBOARD KPIs
# ---------------------------------------------------
def calculate_kpis(df):
    """
    Calculate dashboard KPIs.
    """
    if df.empty:
        return {
            "total_employees": 0,
            "average_working_hours": 0,
            "underutilized_employees": 0
        }

    total_employees = df["employee_name"].nunique()
    average_working_hours = round(df["working_hours"].mean(), 2)
    underutilized_employees = len(get_free_time_employees(df))

    return {
        "total_employees": total_employees,
        "average_working_hours": average_working_hours,
        "underutilized_employees": underutilized_employees
    }
