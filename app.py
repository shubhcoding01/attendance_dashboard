# import streamlit as st
# import pandas as pd
# import plotly.express as px

# from databases.db import create_tables
# from utils import (
#     load_attendance_data,
#     get_daily_attendance,
#     get_working_hours_summary,
#     get_free_time_employees,
#     get_monthly_report,
#     allocate_task,
#     calculate_kpis
# )

# # ---------------------------------------------------
# # PAGE CONFIG
# # ---------------------------------------------------
# st.set_page_config(
#     page_title="Attendance & Productivity Dashboard",
#     layout="wide"
# )

# # ---------------------------------------------------
# # INITIALIZE DATABASE
# # ---------------------------------------------------
# create_tables()

# # ---------------------------------------------------
# # SIDEBAR
# # ---------------------------------------------------
# st.sidebar.title("🏢 Admin Dashboard")
# st.sidebar.caption("Attendance & Productivity Monitoring")

# menu = st.sidebar.radio(
#     "Navigation",
#     [
#         "Dashboard Overview",
#         "Daily Attendance",
#         "Monthly Report",
#         "Task Allocation"
#     ]
# )

# st.sidebar.markdown("---")
# st.sidebar.info(
#     "This internal dashboard helps monitor employee attendance, "
#     "working hours, availability, and task allocation."
# )

# # ---------------------------------------------------
# # LOAD DATA
# # ---------------------------------------------------
# df = load_attendance_data()

# st.title("📊 Attendance & Productivity Dashboard")

# # ===================================================
# # DASHBOARD OVERVIEW
# # ===================================================
# if menu == "Dashboard Overview":
#     st.subheader("📌 Dashboard Overview")

#     if df.empty:
#         st.warning("No attendance data available.")
#     else:
#         latest_date = df["date"].max()
#         latest_df = df[df["date"] == latest_date]

#         col1, col2, col3, col4 = st.columns(4)

#         col1.metric("👥 Total Employees", df["employee_name"].nunique())
#         col2.metric("📅 Latest Date", latest_date.strftime("%d %b %Y"))
#         col3.metric("✅ Present Employees", latest_df.shape[0])
#         col4.metric(
#             "⏱ Avg Hours (Latest Day)",
#             round(latest_df["working_hours"].mean(), 2)
#         )

#         st.markdown("---")

#         st.subheader("⏱ Total Working Hours by Employee")

#         summary_df = get_working_hours_summary(df)

#         fig = px.bar(
#             summary_df,
#             x="employee_name",
#             y="total_hours",
#             text_auto=True,
#             labels={
#                 "employee_name": "Employee",
#                 "total_hours": "Total Working Hours"
#             }
#         )

#         st.plotly_chart(fig, use_container_width=True)

# # ===================================================
# # DAILY ATTENDANCE
# # ===================================================
# elif menu == "Daily Attendance":
#     st.subheader("📅 Daily Attendance")

#     if df.empty:
#         st.warning("No attendance data available.")
#     else:
#         selected_date = st.date_input(
#             "Select Date",
#             df["date"].min(),
#             help="Choose a date to view attendance"
#         )

#         daily_df = get_daily_attendance(df, pd.to_datetime(selected_date))

#         st.markdown(
#             f"### Attendance for {selected_date.strftime('%d %b %Y')}"
#         )

#         st.dataframe(daily_df, use_container_width=True)

# # ===================================================
# # MONTHLY REPORT
# # ===================================================
# elif menu == "Monthly Report":
#     st.subheader("📊 Monthly Attendance & Productivity Report")

#     if df.empty:
#         st.warning("No attendance data available.")
#     else:
#         monthly_df = get_monthly_report(df)

#         st.dataframe(monthly_df, use_container_width=True)

#         st.markdown("---")
#         st.subheader("📉 Monthly Working Hours Trend")

#         # IMPORTANT FIX: Convert Period → string for Plotly
#         monthly_plot_df = monthly_df.copy()
#         monthly_plot_df["month"] = monthly_plot_df["month"].astype(str)

#         trend_fig = px.line(
#             monthly_plot_df,
#             x="month",
#             y="total_hours",
#             color="employee_name",
#             markers=True,
#             labels={
#                 "month": "Month",
#                 "total_hours": "Total Working Hours"
#             }
#         )

#         st.plotly_chart(trend_fig, use_container_width=True)

# # ===================================================
# # TASK ALLOCATION
# # ===================================================
# elif menu == "Task Allocation":
#     st.subheader("🛠 Task Allocation Center")
#     st.caption("Allocate tasks based on employee availability")

#     if df.empty:
#         st.warning("No attendance data available.")
#     else:
#         free_employees = get_free_time_employees(df)

#         if free_employees.empty:
#             st.success("🎉 All employees are fully utilized.")
#         else:
#             st.markdown("### 👇 Employees with Available Time")
#             st.dataframe(free_employees, use_container_width=True)

#             st.markdown("---")
#             st.markdown("### ➕ Allocate New Task")

#             with st.form("task_allocation_form"):
#                 employee = st.selectbox(
#                     "Select Employee",
#                     free_employees["employee_name"].unique()
#                 )

#                 task_name = st.text_input(
#                     "Task Description",
#                     placeholder="e.g. Prepare weekly report"
#                 )

#                 allocated_hours = st.slider(
#                     "Allocated Hours",
#                     min_value=1,
#                     max_value=4,
#                     value=2
#                 )

#                 submit = st.form_submit_button("Allocate Task")

#             if submit:
#                 if task_name.strip() == "":
#                     st.warning("⚠ Please enter a valid task description.")
#                 else:
#                     allocate_task(employee, task_name, allocated_hours)
#                     st.success("✅ Task allocated successfully!")


# # ===================================================
# # ADD ATTENDANCE DATA (ADMIN INPUT)
# # ===================================================
# st.sidebar.markdown("---")
# st.sidebar.subheader("➕ Add Attendance")

# with st.sidebar.form("attendance_form"):
#     emp_name = st.text_input("Employee Name")
#     work_date = st.date_input("Date")
#     login = st.time_input("Login Time")
#     logout = st.time_input("Logout Time")

#     add_attendance = st.form_submit_button("Add Attendance")

# if add_attendance:
#     if emp_name.strip() == "":
#         st.sidebar.warning("Employee name is required")
#     else:
#         from databases.db import get_connection

#         conn = get_connection()
#         cursor = conn.cursor()

#         cursor.execute("""
#             INSERT INTO attendance (employee_name, date, login_time, logout_time)
#             VALUES (?, ?, ?, ?)
#         """, (
#             emp_name,
#             work_date.strftime("%Y-%m-%d"),
#             login.strftime("%H:%M"),
#             logout.strftime("%H:%M")
#         ))

#         conn.commit()
#         conn.close()

#         st.sidebar.success("Attendance added successfully")
#         st.rerun()


import streamlit as st
import pandas as pd
import plotly.express as px

# Import your database and logic functions
# NOTE: Ensure 'add_employee_attendance' is added to utils.py (see below)
from databases.db import create_tables
from utils import (
    load_attendance_data,
    get_daily_attendance,
    get_working_hours_summary,
    get_free_time_employees,
    get_monthly_report,
    allocate_task,
    add_employee_attendance  # <--- NEW FUNCTION WE WILL ADD TO UTILS
)

# ---------------------------------------------------
# 1. PAGE CONFIGURATION & STYLING
# ---------------------------------------------------
st.set_page_config(
    page_title="Attendance Ops Dashboard",
    page_icon="🏢",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS to make metrics look like "Cards"
st.markdown("""
<style>
    div[data-testid="metric-container"] {
        background-color: #f0f2f6;
        border: 1px solid #e6e6e6;
        padding: 5% 5% 5% 10%;
        border-radius: 10px;
        color: rgb(30, 30, 30);
        overflow-wrap: break-word;
    }
    /* Break line for sidebar */
    div[data-testid="stSidebarNav"]::before {
        content: "Admin Controls";
        margin-left: 20px;
        margin-top: 20px;
        font-size: 20px;
        font-weight: bold;
    }
</style>
""", unsafe_allow_html=True)

# ---------------------------------------------------
# 2. INITIALIZATION
# ---------------------------------------------------
create_tables()
df = load_attendance_data()

# ---------------------------------------------------
# 3. SIDEBAR NAVIGATION
# ---------------------------------------------------
with st.sidebar:
    st.image("https://cdn-icons-png.flaticon.com/512/906/906175.png", width=50) # Placeholder Logo
    st.title("Admin Portal")
    
    menu = st.radio(
        "Navigate",
        ["Dashboard Overview", "Daily Logs", "Monthly Reports", "Task Allocation"],
        index=0
    )
    
    st.markdown("---")
    st.subheader("➕ Quick Action: Add Log")
    
    # MOVED LOGIC: The UI only gathers input. Logic is sent to utils.py
    with st.form("quick_add_form"):
        new_emp = st.text_input("Employee Name")
        new_date = st.date_input("Date")
        t_in = st.time_input("Login")
        t_out = st.time_input("Logout")
        
        submit_log = st.form_submit_button("Submit Record")
        
        if submit_log:
            if new_emp.strip() == "":
                st.error("❌ Employee name required.")
            elif t_in >= t_out:
                st.error("❌ Logout must be after Login.")
            else:
                # Calls the logic layer (Architecture Best Practice)
                success = add_employee_attendance(new_emp, new_date, t_in, t_out)
                if success:
                    st.success("✅ Attendance Saved!")
                    st.rerun()
                else:
                    st.error("❌ Database Error.")

# ---------------------------------------------------
# 4. MAIN DASHBOARD LOGIC
# ---------------------------------------------------

# HEADER
st.title(f"🏢 {menu}")
st.markdown(f"Real-time data insights for **{menu}**")

# --- VIEW: DASHBOARD OVERVIEW ---
if menu == "Dashboard Overview":
    if df.empty:
        st.info("👋 Welcome! No data found. Use the sidebar to add the first attendance record.")
    else:
        # 1. Top Level Metrics
        latest_date = df["date"].max()
        latest_df = df[df["date"] == latest_date]
        
        c1, c2, c3, c4 = st.columns(4)
        c1.metric("Total Headcount", f"{df['employee_name'].nunique()}")
        c2.metric("Present Today", f"{latest_df.shape[0]}")
        c3.metric("Avg Work Hours", f"{round(latest_df['working_hours'].mean(), 1)} hrs")
        c4.metric("Last Update", f"{latest_date.strftime('%d %b')}")

        st.divider()

        # 2. Charts Section
        c_chart1, c_chart2 = st.columns([2, 1])
        
        with c_chart1:
            st.subheader("⏱️ Working Hours Leaderboard")
            summary_df = get_working_hours_summary(df)
            fig_bar = px.bar(
                summary_df, x="employee_name", y="total_hours",
                color="total_hours", color_continuous_scale="Blues",
                text_auto='.1f', template="plotly_white"
            )
            fig_bar.update_layout(xaxis_title="Employee", yaxis_title="Hours")
            st.plotly_chart(fig_bar, use_container_width=True)
            
        with c_chart2:
            st.subheader("🥧 Utilization")
            # Simple dummy metric for visuals or a pie chart of task distribution
            st.info("High Performers detected based on utilization data.")
            st.dataframe(summary_df.head(5), hide_index=True)

# --- VIEW: DAILY LOGS ---
elif menu == "Daily Logs":
    if df.empty: st.warning("No data.")
    else:
        col_sel, col_blank = st.columns([1, 3])
        with col_sel:
            sel_date = st.date_input("Select Date", df["date"].max())
        
        daily_df = get_daily_attendance(df, pd.to_datetime(sel_date))
        
        st.dataframe(
            daily_df.style.highlight_max(axis=0, color='#90ee90'), 
            use_container_width=True
        )

# --- VIEW: MONTHLY REPORTS ---
elif menu == "Monthly Reports":
    if df.empty: st.warning("No data.")
    else:
        monthly_df = get_monthly_report(df)
        
        # Tabs for better organization
        tab1, tab2 = st.tabs(["📈 Trend Analysis", "📄 Raw Data"])
        
        with tab1:
            monthly_plot = monthly_df.copy()
            monthly_plot["month"] = monthly_plot["month"].astype(str)
            
            fig_line = px.line(
                monthly_plot, x="month", y="total_hours", color="employee_name",
                markers=True, template="plotly_white",
                title="Productivity Trends over Time"
            )
            st.plotly_chart(fig_line, use_container_width=True)
            
        with tab2:
            st.dataframe(monthly_df, use_container_width=True)

# --- VIEW: TASK ALLOCATION ---
elif menu == "Task Allocation":
    c1, c2 = st.columns([1, 1])
    
    with c1:
        st.subheader("🟢 Available Employees")
        free_emp = get_free_time_employees(df)
        
        if free_emp.empty:
            st.success("All hands on deck! No free employees.")
        else:
            st.dataframe(free_emp, use_container_width=True)
            
    with c2:
        st.subheader("⚡ Assign Task")
        with st.form("alloc_form", clear_on_submit=True):
            # Dynamic dropdown based on free employees
            options = free_emp["employee_name"].unique() if not free_emp.empty else ["No one available"]
            emp_sel = st.selectbox("Select Employee", options, disabled=free_emp.empty)
            task_desc = st.text_input("Task Name")
            hours = st.slider("Hours Required", 1, 8, 2)
            
            btn = st.form_submit_button("Allocate")
            
            if btn:
                if free_emp.empty:
                    st.error("Cannot assign: No employees available.")
                elif not task_desc:
                    st.warning("Enter a task name.")
                else:
                    allocate_task(emp_sel, task_desc, hours)
                    st.toast(f"✅ Task assigned to {emp_sel}!")
                    # Optional: Add a small delay and rerun to refresh list