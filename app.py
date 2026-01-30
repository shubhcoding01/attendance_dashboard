# import streamlit as st
# import pandas as pd
# import plotly.express as px

# # Import your database and logic functions
# # NOTE: Ensure 'add_employee_attendance' is added to utils.py (see below)
# from databases.db import create_tables
# from utils import (
#     load_attendance_data,
#     get_daily_attendance,
#     get_working_hours_summary,
#     get_free_time_employees,
#     get_monthly_report,
#     allocate_task,
#     add_employee_attendance  # <--- NEW FUNCTION WE WILL ADD TO UTILS
# )

# # ---------------------------------------------------
# # 1. PAGE CONFIGURATION & STYLING
# # ---------------------------------------------------
# st.set_page_config(
#     page_title="Attendance Ops Dashboard",
#     page_icon="🏢",
#     layout="wide",
#     initial_sidebar_state="expanded"
# )

# # Custom CSS to make metrics look like "Cards"
# st.markdown("""
# <style>
#     div[data-testid="metric-container"] {
#         background-color: #f0f2f6;
#         border: 1px solid #e6e6e6;
#         padding: 5% 5% 5% 10%;
#         border-radius: 10px;
#         color: rgb(30, 30, 30);
#         overflow-wrap: break-word;
#     }
#     /* Break line for sidebar */
#     div[data-testid="stSidebarNav"]::before {
#         content: "Admin Controls";
#         margin-left: 20px;
#         margin-top: 20px;
#         font-size: 20px;
#         font-weight: bold;
#     }
# </style>
# """, unsafe_allow_html=True)

# # ---------------------------------------------------
# # 2. INITIALIZATION
# # ---------------------------------------------------
# create_tables()
# df = load_attendance_data()

# # ---------------------------------------------------
# # 3. SIDEBAR NAVIGATION
# # ---------------------------------------------------
# with st.sidebar:
#     st.image("https://cdn-icons-png.flaticon.com/512/906/906175.png", width=50) # Placeholder Logo
#     st.title("Admin Portal")
    
#     menu = st.radio(
#         "Navigate",
#         ["Dashboard Overview", "Daily Logs", "Monthly Reports", "Task Allocation"],
#         index=0
#     )
    
#     st.markdown("---")
#     st.subheader("➕ Quick Action: Add Log")
    
#     # MOVED LOGIC: The UI only gathers input. Logic is sent to utils.py
#     with st.form("quick_add_form"):
#         new_emp = st.text_input("Employee Name")
#         new_date = st.date_input("Date")
#         t_in = st.time_input("Login")
#         t_out = st.time_input("Logout")
        
#         submit_log = st.form_submit_button("Submit Record")
        
#         if submit_log:
#             if new_emp.strip() == "":
#                 st.error("❌ Employee name required.")
#             elif t_in >= t_out:
#                 st.error("❌ Logout must be after Login.")
#             else:
#                 # Calls the logic layer (Architecture Best Practice)
#                 success = add_employee_attendance(new_emp, new_date, t_in, t_out)
#                 if success:
#                     st.success("✅ Attendance Saved!")
#                     st.rerun()
#                 else:
#                     st.error("❌ Database Error.")

# # ---------------------------------------------------
# # 4. MAIN DASHBOARD LOGIC
# # ---------------------------------------------------

# # HEADER
# st.title(f"🏢 {menu}")
# st.markdown(f"Real-time data insights for **{menu}**")

# # --- VIEW: DASHBOARD OVERVIEW ---
# if menu == "Dashboard Overview":
#     if df.empty:
#         st.info("👋 Welcome! No data found. Use the sidebar to add the first attendance record.")
#     else:
#         # 1. Top Level Metrics
#         latest_date = df["date"].max()
#         latest_df = df[df["date"] == latest_date]
        
#         c1, c2, c3, c4 = st.columns(4)
#         c1.metric("Total Headcount", f"{df['employee_name'].nunique()}")
#         c2.metric("Present Today", f"{latest_df.shape[0]}")
#         c3.metric("Avg Work Hours", f"{round(latest_df['working_hours'].mean(), 1)} hrs")
#         c4.metric("Last Update", f"{latest_date.strftime('%d %b')}")

#         st.divider()

#         # 2. Charts Section
#         c_chart1, c_chart2 = st.columns([2, 1])
        
#         with c_chart1:
#             st.subheader("⏱️ Working Hours Leaderboard")
#             summary_df = get_working_hours_summary(df)
#             fig_bar = px.bar(
#                 summary_df, x="employee_name", y="total_hours",
#                 color="total_hours", color_continuous_scale="Blues",
#                 text_auto='.1f', template="plotly_white"
#             )
#             fig_bar.update_layout(xaxis_title="Employee", yaxis_title="Hours")
#             st.plotly_chart(fig_bar, use_container_width=True)
            
#         with c_chart2:
#             st.subheader("🥧 Utilization")
#             # Simple dummy metric for visuals or a pie chart of task distribution
#             st.info("High Performers detected based on utilization data.")
#             st.dataframe(summary_df.head(5), hide_index=True)

# # --- VIEW: DAILY LOGS ---
# elif menu == "Daily Logs":
#     if df.empty: st.warning("No data.")
#     else:
#         col_sel, col_blank = st.columns([1, 3])
#         with col_sel:
#             sel_date = st.date_input("Select Date", df["date"].max())
        
#         daily_df = get_daily_attendance(df, pd.to_datetime(sel_date))
        
#         st.dataframe(
#             daily_df.style.highlight_max(axis=0, color='#90ee90'), 
#             use_container_width=True
#         )

# # --- VIEW: MONTHLY REPORTS ---
# elif menu == "Monthly Reports":
#     if df.empty: st.warning("No data.")
#     else:
#         monthly_df = get_monthly_report(df)
        
#         # Tabs for better organization
#         tab1, tab2 = st.tabs(["📈 Trend Analysis", "📄 Raw Data"])
        
#         with tab1:
#             monthly_plot = monthly_df.copy()
#             monthly_plot["month"] = monthly_plot["month"].astype(str)
            
#             fig_line = px.line(
#                 monthly_plot, x="month", y="total_hours", color="employee_name",
#                 markers=True, template="plotly_white",
#                 title="Productivity Trends over Time"
#             )
#             st.plotly_chart(fig_line, use_container_width=True)
            
#         with tab2:
#             st.dataframe(monthly_df, use_container_width=True)

# # --- VIEW: TASK ALLOCATION ---
# elif menu == "Task Allocation":
#     c1, c2 = st.columns([1, 1])
    
#     with c1:
#         st.subheader("🟢 Available Employees")
#         free_emp = get_free_time_employees(df)
        
#         if free_emp.empty:
#             st.success("All hands on deck! No free employees.")
#         else:
#             st.dataframe(free_emp, use_container_width=True)
            
#     with c2:
#         st.subheader("⚡ Assign Task")
#         with st.form("alloc_form", clear_on_submit=True):
#             # Dynamic dropdown based on free employees
#             options = free_emp["employee_name"].unique() if not free_emp.empty else ["No one available"]
#             emp_sel = st.selectbox("Select Employee", options, disabled=free_emp.empty)
#             task_desc = st.text_input("Task Name")
#             hours = st.slider("Hours Required", 1, 8, 2)
            
#             btn = st.form_submit_button("Allocate")
            
#             if btn:
#                 if free_emp.empty:
#                     st.error("Cannot assign: No employees available.")
#                 elif not task_desc:
#                     st.warning("Enter a task name.")
#                 else:
#                     allocate_task(emp_sel, task_desc, hours)
#                     st.toast(f"✅ Task assigned to {emp_sel}!")
#                     # Optional: Add a small delay and rerun to refresh list


import streamlit as st
import pandas as pd
import plotly.express as px
import time 

# Import database and logic functions
from databases.db import create_tables
from utils import (
    load_attendance_data,
    get_daily_attendance,
    get_working_hours_summary,
    get_free_time_employees,
    get_monthly_report,
    allocate_task,
    add_employee_attendance,
    # NEW REAL-TIME FUNCTIONS
    get_employee_current_status,
    mark_punch_in,
    mark_punch_out,
    get_my_tasks
)

# ---------------------------------------------------
# 1. PAGE CONFIGURATION & STYLING
# ---------------------------------------------------
st.set_page_config(
    page_title="WorkForce Pro",
    page_icon="🏢",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    div[data-testid="metric-container"] {
        background-color: #f0f2f6;
        border: 1px solid #e6e6e6;
        padding: 5% 5% 5% 10%;
        border-radius: 10px;
        color: rgb(30, 30, 30);
    }
    div[data-testid="stSidebarNav"]::before {
        content: "Navigation";
        margin-left: 20px;
        margin-top: 20px;
        font-size: 20px;
        font-weight: bold;
    }
</style>
""", unsafe_allow_html=True)

# ---------------------------------------------------
# 2. INITIALIZATION & SESSION STATE
# ---------------------------------------------------
create_tables()

# Initialize Session State for Login
if 'role' not in st.session_state:
    st.session_state['role'] = None
if 'username' not in st.session_state:
    st.session_state['username'] = None

# ---------------------------------------------------
# 3. LOGIN SCREEN (Start View)
# ---------------------------------------------------
if st.session_state['role'] is None:
    st.title("🔐 WorkForce Access Portal")
    st.markdown("Select your role to continue.")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.info("👨‍💼 **For Staff**")
        emp_name = st.text_input("Enter your Name", placeholder="e.g. Rahul")
        if st.button("Log in as Employee"):
            if emp_name.strip():
                st.session_state['role'] = 'Employee'
                st.session_state['username'] = emp_name
                st.rerun()
            else:
                st.error("Please enter your name.")
                
    with col2:
        st.info("🛡️ **For Managers**")
        # specific password check can be added here
        if st.button("Log in as Admin"):
            st.session_state['role'] = 'Admin'
            st.rerun()

# ---------------------------------------------------
# 4. EMPLOYEE PORTAL (Real-Time View)
# ---------------------------------------------------
elif st.session_state['role'] == 'Employee':
    name = st.session_state['username']
    
    # Header with Logout
    c1, c2 = st.columns([4, 1])
    with c1:
        st.title(f"👋 Hello, {name}")
    with c2:
        if st.button("🚪 Logout"):
            st.session_state['role'] = None
            st.rerun()

    st.markdown("---")

    # --- SECTION A: ATTENDANCE ACTION ---
    status = get_employee_current_status(name)
    col_status, col_action = st.columns(2)
    
    with col_status:
        st.subheader("Your Status")
        if status == 'not_started':
            st.warning("⚪ You are **NOT** punched in.")
        elif status == 'working':
            st.success("🟢 You are **WORKING**.")
            st.caption("Don't forget to punch out!")
        else:
            st.info("🏁 Shift **COMPLETED**.")

    with col_action:
        st.subheader("Action")
        if status == 'not_started':
            if st.button("👊 PUNCH IN", type="primary"):
                if mark_punch_in(name):
                    st.success("✅ Punched In!")
                    time.sleep(1)
                    st.rerun()
        elif status == 'working':
            if st.button("🛑 PUNCH OUT", type="primary"):
                if mark_punch_out(name):
                    st.success("✅ Punched Out!")
                    time.sleep(1)
                    st.rerun()
        else:
            st.write("See you tomorrow! 👋")

    # --- SECTION B: MY TASKS ---
    st.markdown("---")
    c_task_head, c_task_refresh = st.columns([4, 1])
    with c_task_head:
        st.subheader("📋 My Tasks for Today")
    with c_task_refresh:
        if st.button("🔄 Refresh"):
            st.rerun()
            
    my_tasks = get_my_tasks(name)
    
    if my_tasks.empty:
        st.info("🎉 No tasks assigned yet.")
    else:
        st.dataframe(my_tasks, use_container_width=True)

# ---------------------------------------------------
# 5. ADMIN DASHBOARD (Previous Functionality)
# ---------------------------------------------------
elif st.session_state['role'] == 'Admin':
    
    # Load Data ONLY when Admin is logged in
    df = load_attendance_data()

    # --- SIDEBAR ---
    with st.sidebar:
        st.title("Admin Portal")
        st.button("🚪 Logout", on_click=lambda: st.session_state.update(role=None))
        
        menu = st.radio(
            "Navigate", 
            ["Dashboard Overview", "Daily Logs", "Monthly Reports", "Task Allocation"]
        )
        
        st.markdown("---")
        st.write("**Manual Override**")
        with st.form("quick_add_form"):
            new_emp = st.text_input("Employee Name")
            new_date = st.date_input("Date")
            t_in = st.time_input("Login")
            t_out = st.time_input("Logout")
            
            if st.form_submit_button("Add Record"):
                if add_employee_attendance(new_emp, new_date, t_in, t_out):
                    st.success("Added!")
                    st.rerun()

    # --- MAIN CONTENT ---
    st.title(f"🏢 {menu}")
    
    # Refresh button for Real-Time monitoring
    if st.button("🔄 Refresh Real-Time Data"):
        st.rerun()

    # VIEW 1: OVERVIEW
    if menu == "Dashboard Overview":
        if df.empty:
            st.info("No data yet.")
        else:
            latest_date = df["date"].max()
            latest_df = df[df["date"] == latest_date]
            
            c1, c2, c3, c4 = st.columns(4)
            c1.metric("Total Staff", df['employee_name'].nunique())
            c2.metric("Active Today", latest_df.shape[0])
            c3.metric("Avg Hours", f"{round(latest_df['working_hours'].mean(), 1)}")
            c4.metric("Date", latest_date.strftime('%d %b'))

            st.divider()
            
            c_chart1, c_chart2 = st.columns([2, 1])
            with c_chart1:
                st.subheader("⏱️ Hours Leaderboard")
                summary_df = get_working_hours_summary(df)
                if not summary_df.empty:
                    fig = px.bar(summary_df, x="employee_name", y="total_hours", text_auto='.1f', template="plotly_white")
                    st.plotly_chart(fig, use_container_width=True)
            
            with c_chart2:
                st.subheader("📊 Recent Activity")
                st.dataframe(latest_df[['employee_name', 'working_hours']], hide_index=True)

    # VIEW 2: DAILY LOGS
    elif menu == "Daily Logs":
        if df.empty: st.warning("No data.")
        else:
            sel_date = st.date_input("Select Date", df["date"].max())
            daily_df = get_daily_attendance(df, pd.to_datetime(sel_date))
            st.dataframe(daily_df.style.highlight_max(axis=0, color='#90ee90'), use_container_width=True)

    # VIEW 3: MONTHLY REPORTS
    elif menu == "Monthly Reports":
        if df.empty: st.warning("No data.")
        else:
            monthly_df = get_monthly_report(df)
            tab1, tab2 = st.tabs(["📈 Chart", "📄 Data"])
            with tab1:
                plot_df = monthly_df.copy()
                plot_df["month"] = plot_df["month"].astype(str)
                fig = px.line(plot_df, x="month", y="total_hours", color="employee_name", markers=True)
                st.plotly_chart(fig, use_container_width=True)
            with tab2:
                st.dataframe(monthly_df, use_container_width=True)

    # VIEW 4: TASK ALLOCATION
    elif menu == "Task Allocation":
        c1, c2 = st.columns([1, 1])
        with c1:
            st.subheader("🟢 Available Staff")
            free_emp = get_free_time_employees(df)
            if free_emp.empty:
                st.success("Everyone is busy!")
            else:
                st.dataframe(free_emp, use_container_width=True)
                
        with c2:
            st.subheader("⚡ Assign Task")
            with st.form("alloc"):
                opts = free_emp["employee_name"].unique() if not free_emp.empty else ["None"]
                emp = st.selectbox("Employee", opts, disabled=free_emp.empty)
                task = st.text_input("Task")
                hrs = st.slider("Hours", 1, 8, 2)
                
                if st.form_submit_button("Allocate"):
                    if not free_emp.empty and task:
                        allocate_task(emp, task, hrs)
                        st.success(f"Assigned to {emp}!")
                    else:
                        st.error("Invalid assignment")