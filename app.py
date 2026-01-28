import streamlit as st
import pandas as pd
import plotly.express as px

from databases.db import create_tables
from utils import (
    load_attendance_data,
    get_daily_attendance,
    get_working_hours_summary,
    get_free_time_employees,
    get_monthly_report,
    allocate_task,
    calculate_kpis
)

# ---------------------------------------------------
# PAGE CONFIG
# ---------------------------------------------------
st.set_page_config(
    page_title="Attendance & Productivity Dashboard",
    layout="wide"
)

# ---------------------------------------------------
# INITIALIZE DATABASE
# ---------------------------------------------------
create_tables()

# ---------------------------------------------------
# SIDEBAR
# ---------------------------------------------------
st.sidebar.title("🏢 Admin Dashboard")
st.sidebar.caption("Attendance & Productivity Monitoring")

menu = st.sidebar.radio(
    "Navigation",
    [
        "Dashboard Overview",
        "Daily Attendance",
        "Monthly Report",
        "Task Allocation"
    ]
)

st.sidebar.markdown("---")
st.sidebar.info(
    "This internal dashboard helps monitor employee attendance, "
    "working hours, availability, and task allocation."
)

# ---------------------------------------------------
# LOAD DATA
# ---------------------------------------------------
df = load_attendance_data()

st.title("📊 Attendance & Productivity Dashboard")

# ===================================================
# DASHBOARD OVERVIEW
# ===================================================
if menu == "Dashboard Overview":
    st.subheader("📌 Dashboard Overview")

    if df.empty:
        st.warning("No attendance data available.")
    else:
        latest_date = df["date"].max()
        latest_df = df[df["date"] == latest_date]

        col1, col2, col3, col4 = st.columns(4)

        col1.metric("👥 Total Employees", df["employee_name"].nunique())
        col2.metric("📅 Latest Date", latest_date.strftime("%d %b %Y"))
        col3.metric("✅ Present Employees", latest_df.shape[0])
        col4.metric(
            "⏱ Avg Hours (Latest Day)",
            round(latest_df["working_hours"].mean(), 2)
        )

        st.markdown("---")

        st.subheader("⏱ Total Working Hours by Employee")

        summary_df = get_working_hours_summary(df)

        fig = px.bar(
            summary_df,
            x="employee_name",
            y="total_hours",
            text_auto=True,
            labels={
                "employee_name": "Employee",
                "total_hours": "Total Working Hours"
            }
        )

        st.plotly_chart(fig, use_container_width=True)

# ===================================================
# DAILY ATTENDANCE
# ===================================================
elif menu == "Daily Attendance":
    st.subheader("📅 Daily Attendance")

    if df.empty:
        st.warning("No attendance data available.")
    else:
        selected_date = st.date_input(
            "Select Date",
            df["date"].min(),
            help="Choose a date to view attendance"
        )

        daily_df = get_daily_attendance(df, pd.to_datetime(selected_date))

        st.markdown(
            f"### Attendance for {selected_date.strftime('%d %b %Y')}"
        )

        st.dataframe(daily_df, use_container_width=True)

# ===================================================
# MONTHLY REPORT
# ===================================================
elif menu == "Monthly Report":
    st.subheader("📊 Monthly Attendance & Productivity Report")

    if df.empty:
        st.warning("No attendance data available.")
    else:
        monthly_df = get_monthly_report(df)

        st.dataframe(monthly_df, use_container_width=True)

        st.markdown("---")
        st.subheader("📉 Monthly Working Hours Trend")

        # IMPORTANT FIX: Convert Period → string for Plotly
        monthly_plot_df = monthly_df.copy()
        monthly_plot_df["month"] = monthly_plot_df["month"].astype(str)

        trend_fig = px.line(
            monthly_plot_df,
            x="month",
            y="total_hours",
            color="employee_name",
            markers=True,
            labels={
                "month": "Month",
                "total_hours": "Total Working Hours"
            }
        )

        st.plotly_chart(trend_fig, use_container_width=True)

# ===================================================
# TASK ALLOCATION
# ===================================================
elif menu == "Task Allocation":
    st.subheader("🛠 Task Allocation Center")
    st.caption("Allocate tasks based on employee availability")

    if df.empty:
        st.warning("No attendance data available.")
    else:
        free_employees = get_free_time_employees(df)

        if free_employees.empty:
            st.success("🎉 All employees are fully utilized.")
        else:
            st.markdown("### 👇 Employees with Available Time")
            st.dataframe(free_employees, use_container_width=True)

            st.markdown("---")
            st.markdown("### ➕ Allocate New Task")

            with st.form("task_allocation_form"):
                employee = st.selectbox(
                    "Select Employee",
                    free_employees["employee_name"].unique()
                )

                task_name = st.text_input(
                    "Task Description",
                    placeholder="e.g. Prepare weekly report"
                )

                allocated_hours = st.slider(
                    "Allocated Hours",
                    min_value=1,
                    max_value=4,
                    value=2
                )

                submit = st.form_submit_button("Allocate Task")

            if submit:
                if task_name.strip() == "":
                    st.warning("⚠ Please enter a valid task description.")
                else:
                    allocate_task(employee, task_name, allocated_hours)
                    st.success("✅ Task allocated successfully!")


# ===================================================
# ADD ATTENDANCE DATA (ADMIN INPUT)
# ===================================================
st.sidebar.markdown("---")
st.sidebar.subheader("➕ Add Attendance")

with st.sidebar.form("attendance_form"):
    emp_name = st.text_input("Employee Name")
    work_date = st.date_input("Date")
    login = st.time_input("Login Time")
    logout = st.time_input("Logout Time")

    add_attendance = st.form_submit_button("Add Attendance")

if add_attendance:
    if emp_name.strip() == "":
        st.sidebar.warning("Employee name is required")
    else:
        from databases.db import get_connection

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO attendance (employee_name, date, login_time, logout_time)
            VALUES (?, ?, ?, ?)
        """, (
            emp_name,
            work_date.strftime("%Y-%m-%d"),
            login.strftime("%H:%M"),
            logout.strftime("%H:%M")
        ))

        conn.commit()
        conn.close()

        st.sidebar.success("Attendance added successfully")
        st.rerun()
