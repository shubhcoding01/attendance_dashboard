import streamlit as st
import pandas as pd
import plotly.express as px

from utils import (
    load_attendance_data,
    get_daily_attendance,
    get_working_hours_summary,
    get_free_time_employees,
    get_monthly_report,
    allocate_task,
    calculate_kpis
)

# -------------------- PAGE CONFIG --------------------
st.set_page_config(
    page_title="Attendance & Productivity Dashboard",
    layout="wide"
)

st.title("📊 Attendance & Productivity Dashboard")

# -------------------- LOAD DATA --------------------
df = load_attendance_data()

# -------------------- SIDEBAR --------------------
menu = st.sidebar.selectbox(
    "Navigation",
    [
        "Dashboard Overview",
        "Daily Attendance",
        "Monthly Report",
        "Task Allocation"
    ]
)

# -------------------- DASHBOARD OVERVIEW --------------------
if menu == "Dashboard Overview":
    st.subheader("📌 Key Performance Indicators")

    kpis = calculate_kpis(df)

    col1, col2, col3 = st.columns(3)
    col1.metric("👥 Total Employees", kpis["total_employees"])
    col2.metric("⏱ Avg Working Hours", kpis["average_working_hours"])
    col3.metric("⚠ Underutilized Employees", kpis["underutilized_employees"])

    st.markdown("---")

    st.subheader("📈 Working Hours by Employee")

    hours_summary = get_working_hours_summary(df)

    fig = px.bar(
        hours_summary,
        x="employee_name",
        y="total_hours",
        labels={"employee_name": "Employee", "total_hours": "Total Hours"},
    )

    st.plotly_chart(fig, use_container_width=True)

# -------------------- DAILY ATTENDANCE --------------------
elif menu == "Daily Attendance":
    st.subheader("📅 Daily Attendance")

    selected_date = st.date_input(
        "Select Date",
        df["date"].min()
    )

    daily_df = get_daily_attendance(df, pd.to_datetime(selected_date))

    st.dataframe(daily_df, use_container_width=True)

# -------------------- MONTHLY REPORT --------------------
elif menu == "Monthly Report":
    st.subheader("📊 Monthly Attendance & Working Hours")

    monthly_df = get_monthly_report(df)

    st.dataframe(monthly_df, use_container_width=True)

    st.markdown("---")

    st.subheader("📉 Monthly Working Hours Trend")

    trend_fig = px.line(
        monthly_df,
        x="month",
        y="total_hours",
        color="employee_name",
        markers=True
    )

    st.plotly_chart(trend_fig, use_container_width=True)

# -------------------- TASK ALLOCATION --------------------
elif menu == "Task Allocation":
    st.subheader("🛠 Employees Available for Task Allocation")

    free_employees = get_free_time_employees(df)

    if free_employees.empty:
        st.info("✅ No employees are currently underutilized.")
    else:
        st.dataframe(free_employees, use_container_width=True)

        st.markdown("---")
        st.subheader("➕ Allocate New Task")

        employee = st.selectbox(
            "Select Employee",
            free_employees["employee_name"].unique()
        )

        task_name = st.text_input("Task Name")
        allocated_hours = st.number_input(
            "Allocated Hours",
            min_value=1,
            max_value=4,
            step=1
        )

        if st.button("Allocate Task"):
            if task_name.strip() == "":
                st.warning("⚠ Please enter a task name.")
            else:
                allocate_task(employee, task_name, allocated_hours)
                st.success("✅ Task allocated successfully!")
