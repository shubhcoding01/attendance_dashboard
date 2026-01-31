import streamlit as st
import pandas as pd
import plotly.express as px
import time 
import calendar # <--- NEW IMPORT
from datetime import datetime

# Import database and logic functions
from databases.db import create_tables
from utils import (
    calculate_payroll,
    load_attendance_data,
    get_daily_attendance,
    get_working_hours_summary,
    get_free_time_employees,
    get_monthly_report,
    allocate_task,
    add_employee_attendance,
    # REAL-TIME FUNCTIONS
    get_employee_current_status,
    mark_punch_in,
    mark_punch_out,
    get_my_tasks,
    update_task_status,
    get_all_tasks_history,
    # SECURITY FUNCTIONS
    login_user,
    register_user,
    get_all_users,
    # NEW FORMATTER
    format_hours  # <---  Ensures 8.5 -> 8h 30m
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
# 2. INITIALIZATION
# ---------------------------------------------------
create_tables()

if 'role' not in st.session_state: st.session_state['role'] = None
if 'username' not in st.session_state: st.session_state['username'] = None

# ---------------------------------------------------
# 3. LOGIN SCREEN
# ---------------------------------------------------
if st.session_state['role'] is None:
    st.title("🔒 WorkForce Secure Login")
    col1, col2 = st.columns([1, 2])
    with col2:
        with st.form("login_form"):
            user = st.text_input("Username")
            pwd = st.text_input("Password", type="password")
            if st.form_submit_button("Login"):
                role, name = login_user(user, pwd)
                if role:
                    st.session_state['role'] = role
                    st.session_state['username'] = name
                    st.success(f"✅ Welcome back, {name}!")
                    time.sleep(1); st.rerun()
                else:
                    st.error("❌ Invalid Username or Password")
        st.info("💡 **Default Admin:** `admin` / `123`")

# ---------------------------------------------------
# 4. EMPLOYEE PORTAL
# ---------------------------------------------------
elif st.session_state['role'] == 'Employee':
    name = st.session_state['username']
    c1, c2 = st.columns([4, 1])
    with c1: st.title(f"👋 Hello, {name}")
    with c2: 
        if st.button("🚪 Logout"):
            st.session_state['role'] = None; st.rerun()

    st.markdown("---")

    # Status
    status = get_employee_current_status(name)
    c_stat, c_act = st.columns(2)
    with c_stat:
        st.subheader("Your Status")
        if status == 'not_started': st.warning("⚪ You are **NOT** punched in.")
        elif status == 'working': st.success("🟢 You are **WORKING**.")
        else: st.info("🏁 Shift **COMPLETED**.")
    with c_act:
        st.subheader("Action")
        if status == 'not_started':
            if st.button("👊 PUNCH IN", type="primary"):
                mark_punch_in(name); time.sleep(1); st.rerun()
        elif status == 'working':
            if st.button("🛑 PUNCH OUT", type="primary"):
                mark_punch_out(name); time.sleep(1); st.rerun()

    # Tasks
    st.markdown("---")
    c_th, c_tr = st.columns([4, 1])
    c_th.subheader("📋 My Tasks")
    if c_tr.button("🔄 Refresh"): st.rerun()
    
    my_tasks = get_my_tasks(name)
    if my_tasks.empty:
        st.info("🎉 No tasks assigned yet.")
    else:
        for index, row in my_tasks.iterrows():
            with st.container():
                c1, c2, c3, c4 = st.columns([3, 1, 1, 1])
                # Show formatted hours in task card
                formatted_hrs = format_hours(row['allocated_hours'])
                c1.write(f"**{row['task_name']}**")
                c1.caption(f"Time: {formatted_hrs}")
                
                if row['status'] == 'Pending':
                    c2.warning("⏳ Pending")
                    if c3.button("✅ Accept", key=f"a_{row['id']}"):
                        update_task_status(row['id'], "Accepted"); time.sleep(1); st.rerun()
                    if c4.button("❌ Reject", key=f"r_{row['id']}"):
                        update_task_status(row['id'], "Rejected"); time.sleep(1); st.rerun()
                elif row['status'] == 'Accepted':
                    c2.success("✅ Accepted")
                else: c2.error("❌ Rejected")
                st.divider()

# ---------------------------------------------------
# 5. ADMIN DASHBOARD
# ---------------------------------------------------
elif st.session_state['role'] == 'Admin':
    
    with st.sidebar:
        st.title("Admin Portal")
        live_mode = st.toggle("🔴 Live Mode", value=False)
        if st.button("🚪 Logout"): st.session_state['role'] = None; st.rerun()
        menu = st.radio("Navigate", ["Dashboard Overview", "Daily Logs", "Monthly Reports", "Task Allocation", "Manage Users"])
        
        st.markdown("---")
        st.write("**Manual Override**")
        with st.form("quick_add_form"):
            users = get_all_users()
            opts = users[users['role'] == 'Employee']['name'].unique() if not users.empty else []
            ne = st.selectbox("Employee", opts)
            nd = st.date_input("Date")
            ti = st.time_input("In"); to = st.time_input("Out")
            if st.form_submit_button("Add"):
                if add_employee_attendance(ne, nd, ti, to): st.success("Added!"); time.sleep(1); st.rerun()
                else: st.error("Error")

    if live_mode: time.sleep(2); st.rerun()
    df = load_attendance_data()
    st.title(f"🏢 {menu}")

    # --- VIEW 1: OVERVIEW ---
    if menu == "Dashboard Overview":
        if df.empty: st.info("No data.")
        else:
            latest = df[df["date"] == df["date"].max()]
            c1, c2, c3, c4 = st.columns(4)
            c1.metric("Staff", df['employee_name'].nunique())
            c2.metric("Active", latest.shape[0])
            
            # Format Average Hours
            avg_raw = latest['working_hours'].mean()
            c3.metric("Avg Hours", format_hours(avg_raw)) # <--- FORMATTED (e.g. 8h 30m)
            c4.metric("Date", df["date"].max().strftime('%d %b'))

            st.divider()
            c_ch1, c_ch2 = st.columns([2, 1])
            with c_ch1:
                st.subheader("Leaderboard")
                summ = get_working_hours_summary(df)
                if not summ.empty:
                    # Apply formatting for display table
                    display_summ = summ.copy()
                    display_summ['Total Time'] = display_summ['total_hours'].apply(format_hours)
                    display_summ['Avg Daily'] = display_summ['average_hours'].apply(format_hours)
                    # Show formatted columns
                    st.dataframe(display_summ[['employee_name', 'Total Time', 'Avg Daily']], use_container_width=True)
            
            with c_ch2:
                st.subheader("Recent")
                # Apply formatting
                display_latest = latest.copy()
                display_latest['Time'] = display_latest['working_hours'].apply(format_hours)
                st.dataframe(display_latest[['employee_name', 'Time']], hide_index=True)

    # --- VIEW 2: DAILY LOGS ---
    elif menu == "Daily Logs":
        if df.empty: st.warning("No data.")
        else:
            sd = st.date_input("Date", df["date"].max())
            ddf = get_daily_attendance(df, pd.to_datetime(sd))
            
            def style_int(val):
                if isinstance(val, str) and "✅" in val: return "background-color: #1adb1a; color: black; font-weight: bold;"
                if isinstance(val, str) and "⏳" in val: return "background-color: #fff3cd; color: black;"
                return ""
            
            # Apply Formatting to Working Hours
            # 8.25 -> 8h 15m
            ddf['working_hours'] = ddf['working_hours'].apply(format_hours) 
            
            st.dataframe(ddf.style.map(style_int), use_container_width=True)

    # --- VIEW 3: MONTHLY REPORTS ---
    elif menu == "Monthly Reports":
        if df.empty: st.warning("No data.")
        else:
            mdf = get_monthly_report(df)
            t1, t2 = st.tabs(["Chart", "Data"])
            with t1:
                pdf = mdf.copy(); pdf["month"] = pdf["month"].astype(str)
                st.plotly_chart(px.line(pdf, x="month", y="total_hours", color="employee_name"), use_container_width=True)
            with t2:
                # Apply Formatting
                mdf['total_hours'] = mdf['total_hours'].apply(format_hours)
                mdf['average_hours'] = mdf['average_hours'].apply(format_hours)
                st.dataframe(mdf, use_container_width=True)

    # VIEW 4: PAYROLL (NEW)
    elif menu == "Payroll & Salary":
        c1, c2, c3 = st.columns(3)
        sel_year = c1.number_input("Year", min_value=2024, max_value=2030, value=datetime.now().year)
        sel_month = c2.selectbox("Month", range(1, 13), index=datetime.now().month - 1)
        
        if c3.button("💰 Calculate Salary", type="primary"):
            payroll_df = calculate_payroll(sel_year, sel_month)
            if not payroll_df.empty:
                st.success(f"Payroll for {sel_month}/{sel_year}")
                
                # Formatting Currency
                payroll_df['base_salary'] = payroll_df['base_salary'].apply(lambda x: f"₹{x:,.2f}")
                payroll_df['final_pay'] = payroll_df['final_pay'].apply(lambda x: f"₹{x:,.2f}")
                
                st.dataframe(payroll_df, use_container_width=True)
            else:
                st.warning("No employee data found for calculation.")

    # --- VIEW 4: TASK ALLOCATION ---
    elif menu == "Task Allocation":
        c1, c2 = st.columns(2)
        with c1:
            st.subheader("Available Staff")
            free_emp = get_free_time_employees(df)
            if free_emp.empty: st.success("All Busy!")
            else:
                # Apply Formatting (e.g. 0.5 -> 30m)
                free_emp['free_hours'] = free_emp['free_hours'].apply(format_hours)
                st.dataframe(free_emp, use_container_width=True)
                
        with c2:
            st.subheader("Assign Task")
            with st.form("alloc"):
                opts = get_free_time_employees(df)["employee_name"].unique() # Get names
                emp = st.selectbox("Employee", opts) if len(opts) > 0 else st.selectbox("Employee", ["None"], disabled=True)
                task = st.text_input("Task")
                hrs = st.slider("Hours", 0.5, 8.0, 2.0, step=0.5)
                if st.form_submit_button("Assign"):
                    allocate_task(emp, task, hrs); st.success("Assigned!"); time.sleep(1); st.rerun()

        st.markdown("---"); st.subheader("History")
        hist = get_all_tasks_history()
        
        def hl_stat(v):
            if v=='Accepted': return 'color: green; font-weight: bold'
            if v=='Rejected': return 'color: red; font-weight: bold'
            return ''
            
        if not hist.empty:
            # Apply Formatting to History Table as well
            hist['allocated_hours'] = hist['allocated_hours'].apply(format_hours) 
            st.dataframe(hist.style.map(hl_stat, subset=['status']), use_container_width=True)

    # --- VIEW 5: USERS ---
    elif menu == "Manage Users":
        st.subheader("Create User")
        with st.form("au"):
            u = st.text_input("Username"); p = st.text_input("Password", type="password")
            n = st.text_input("Name"); r = st.selectbox("Role", ["Employee", "Admin"])
            if st.form_submit_button("Create"):
                if register_user(u, p, n, r): st.success("Created!")
                else: st.error("Error")
        st.dataframe(get_all_users())