import streamlit as st
import pandas as pd
import plotly.express as px
import time
from datetime import datetime

# Import database and logic functions
from databases.db import create_tables
from utils import (
    load_attendance_data, get_daily_attendance, get_working_hours_summary,
    get_free_time_employees, get_monthly_report, allocate_task, add_employee_attendance,
    get_employee_current_status, mark_punch_in, mark_punch_out, get_my_tasks, update_task_status,
    get_all_tasks_history, login_user, register_user, get_all_users, format_hours,
    calculate_payroll, delete_user_data, delete_task, edit_task
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

# Professional CSS Styling
st.markdown("""
<style>
    /* Metric Cards */
    div[data-testid="metric-container"] {
        background-color: #ffffff;
        border: 1px solid #e0e0e0;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0px 2px 5px rgba(0,0,0,0.05);
    }
    /* Header */
    h1, h2, h3 { color: #2c3e50; }
    
    /* Tabs */
    .stTabs [data-baseweb="tab-list"] { gap: 10px; }
    .stTabs [data-baseweb="tab"] {
        height: 50px; white-space: pre-wrap; background-color: #f1f2f6; border-radius: 5px; color: #555;
    }
    .stTabs [aria-selected="true"] { background-color: #e1eaf0; color: #2980b9; font-weight: bold; }

    /* Buttons */
    button[kind="primary"] { background-color: #2980b9; border: none; }
    button[kind="secondary"] { border-color: #e74c3c; color: #e74c3c; }
    
    /* Tables */
    div[data-testid="stDataFrame"] { border: 1px solid #f0f0f0; border-radius: 5px; }
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
    c1, c2, c3 = st.columns([1, 2, 1])
    with c2:
        st.title("🔒 WorkForce Login")
        st.markdown("---")
        with st.form("login_form"):
            user = st.text_input("Username")
            pwd = st.text_input("Password", type="password")
            if st.form_submit_button("Login", type="primary"):
                if user.strip() and pwd.strip():
                    role, name = login_user(user, pwd)
                    if role:
                        st.session_state['role'] = role
                        st.session_state['username'] = name
                        st.success(f"✅ Welcome, {name}!")
                        time.sleep(1); st.rerun()
                    else: st.error("❌ Invalid Username or Password")
                else: st.warning("⚠️ Enter credentials")
        st.caption("Admin: `admin` / `123`")

# ---------------------------------------------------
# 4. EMPLOYEE PORTAL
# ---------------------------------------------------
elif st.session_state['role'] == 'Employee':
    name = st.session_state['username']
    c1, c2 = st.columns([4, 1])
    with c1: st.title(f"👋 Hello, {name}")
    with c2: 
        if st.button("🚪 Logout"): st.session_state['role'] = None; st.rerun()

    st.markdown("---")
    
    # Status Section
    status = get_employee_current_status(name)
    c_stat, c_act = st.columns(2)
    with c_stat:
        st.subheader("Your Status")
        if status == 'not_started': st.warning("⚪ Not Punched In")
        elif status == 'working': st.success("🟢 Currently Working")
        else: st.info("🏁 Shift Completed")
    with c_act:
        st.subheader("Action")
        if status == 'not_started':
            if st.button("👊 PUNCH IN", type="primary"): mark_punch_in(name); st.rerun()
        elif status == 'working':
            if st.button("🛑 PUNCH OUT"): mark_punch_out(name); st.rerun()

    # Tasks Section
    st.markdown("---"); st.subheader("📋 My Tasks")
    if st.button("🔄 Refresh"): st.rerun()
    
    my_tasks = get_my_tasks(name)
    if my_tasks.empty: st.info("No tasks assigned.")
    else:
        for i, row in my_tasks.iterrows():
            with st.container():
                c1, c2, c3, c4 = st.columns([3, 1, 1, 1])
                c1.write(f"**{row['task_name']}**")
                c1.caption(f"⏱️ {format_hours(row['allocated_hours'])}")
                if row['status'] == 'Pending':
                    c2.warning("⏳ Pending")
                    if c3.button("✅", key=f"a_{row['id']}"): update_task_status(row['id'], "Accepted"); st.rerun()
                    if c4.button("❌", key=f"r_{row['id']}"): update_task_status(row['id'], "Rejected"); st.rerun()
                elif row['status'] == 'Accepted': c2.success("Accepted")
                else: c2.error("Rejected")
                st.divider()

# ---------------------------------------------------
# 5. ADMIN DASHBOARD
# ---------------------------------------------------
elif st.session_state['role'] == 'Admin':
    
    with st.sidebar:
        st.title("Admin Portal")
        live_mode = st.toggle("🔴 Live Mode", value=False)
        st.markdown("---")
        menu = st.radio("Menu", ["Overview", "Attendance Logs", "Monthly Reports", "Payroll", "Task Manager", "Users"])
        st.markdown("---")
        if st.button("🚪 Logout"): st.session_state['role'] = None; st.rerun()

        # Manual Override
        with st.expander("📝 Manual Entry"):
            with st.form("quick_add"):
                users = get_all_users()
                opts = users[users['role'] == 'Employee']['name'].unique() if not users.empty else []
                ne = st.selectbox("Who?", opts)
                nd = st.date_input("Date")
                ti = st.time_input("In"); to = st.time_input("Out")
                if st.form_submit_button("Add"):
                    if add_employee_attendance(ne, nd, ti, to): st.success("Saved!"); st.rerun()
                    else: st.error("Error")

    if live_mode: time.sleep(2); st.rerun()
    df = load_attendance_data()
    st.title(f"🏢 {menu}")

    # --- VIEW 1: OVERVIEW ---
    if menu == "Overview":
        if df.empty: st.info("Waiting for data...")
        else:
            lat = df[df["date"] == df["date"].max()]
            c1, c2, c3, c4 = st.columns(4)
            c1.metric("Staff", df['employee_name'].nunique())
            c2.metric("Active Today", lat.shape[0])
            c3.metric("Avg Hours", format_hours(lat['working_hours'].mean()))
            c4.metric("Last Update", df["date"].max().strftime('%d %b'))
            
            st.divider()
            c_ch1, c_ch2 = st.columns([2, 1])
            with c_ch1:
                st.subheader("🏆 Leaderboard")
                sum_df = get_working_hours_summary(df)
                if not sum_df.empty:
                    # Chart uses NUMBERS (float)
                    st.bar_chart(sum_df.set_index("employee_name")['total_hours'], color="#2980b9")
            with c_ch2:
                st.subheader("Recent")
                lat_disp = lat.copy()
                lat_disp['Time'] = lat_disp['working_hours'].apply(format_hours)
                st.dataframe(lat_disp[['employee_name', 'Time']], hide_index=True)

    # --- VIEW 2: LOGS ---
    elif menu == "Attendance Logs":
        sd = st.date_input("Filter Date", df["date"].max() if not df.empty else datetime.now())
        ddf = get_daily_attendance(df, pd.to_datetime(sd))
        if not ddf.empty:
            ddf['working_hours'] = ddf['working_hours'].apply(format_hours)
            def sty(v): return "background-color: #d4edda; color: black;" if "✅" in str(v) else ""
            st.dataframe(ddf.style.map(sty), use_container_width=True)
        else: st.info("No records for this date.")

    # --- VIEW 3: MONTHLY REPORTS (FIXED GRAPH) ---
    elif menu == "Monthly Reports":
        mdf = get_monthly_report(df)
        if not mdf.empty:
            t1, t2 = st.tabs(["📊 Trends", "📄 Detailed Data"])
            with t1:
                # FIX: Chart uses raw FLOAT values, NOT formatted strings
                fig = px.line(mdf, x="month", y="total_hours", color="employee_name", markers=True,
                              title="Monthly Working Hours Trend")
                st.plotly_chart(fig, use_container_width=True)
            with t2:
                # Table uses formatted STRINGS for readability
                disp_mdf = mdf.copy()
                disp_mdf['total_hours'] = disp_mdf['total_hours'].apply(format_hours)
                disp_mdf['average_hours'] = disp_mdf['average_hours'].apply(format_hours)
                st.dataframe(disp_mdf, use_container_width=True)
        else: st.info("Not enough data for monthly analysis.")

    # --- VIEW 4: PAYROLL ---
    elif menu == "Payroll":
        c1, c2, c3 = st.columns(3)
        yr = c1.number_input("Year", 2024, 2030, datetime.now().year)
        mn = c2.selectbox("Month", range(1, 13), datetime.now().month - 1)
        if c3.button("Generate Payroll", type="primary"):
            pdf = calculate_payroll(yr, mn)
            if not pdf.empty:
                st.success(f"Payroll Generated for {mn}/{yr}")
                pdf['base_salary'] = pdf['base_salary'].apply(lambda x: f"₹{x:,.0f}")
                pdf['final_pay'] = pdf['final_pay'].apply(lambda x: f"₹{x:,.0f}")
                st.dataframe(pdf, use_container_width=True)
            else: st.warning("No data available.")

    # --- VIEW 5: TASK MANAGER (EDIT/DELETE ADDED) ---
    elif menu == "Task Manager":
        tab_assign, tab_manage = st.tabs(["➕ Assign Task", "⚙️ Manage Tasks"])
        
        # TAB 1: CREATE
        with tab_assign:
            c1, c2 = st.columns([1, 2])
            with c1:
                st.subheader("Available Staff")
                free = get_free_time_employees(df)
                if not free.empty: 
                    free['free_hours'] = free['free_hours'].apply(format_hours)
                    st.dataframe(free, use_container_width=True)
                else: st.success("Everyone is busy!")
            
            with c2:
                st.subheader("Assign New")
                with st.form("task_f"):
                    opts = get_free_time_employees(df)["employee_name"].unique()
                    emp = st.selectbox("To", opts) if len(opts)>0 else st.text_input("To (Manual)")
                    tsk = st.text_input("Task Detail")
                    hrs = st.slider("Duration (Hrs)", 0.5, 8.0, 2.0, 0.5)
                    if st.form_submit_button("Assign Task"):
                        if tsk: allocate_task(emp, tsk, hrs); st.success("Sent!"); st.rerun()
                        else: st.error("Add details")

        # TAB 2: MANAGE (EDIT/DELETE)
        with tab_manage:
            st.subheader("Active Tasks")
            all_tasks = get_all_tasks_history()
            
            if not all_tasks.empty:
                for i, row in all_tasks.iterrows():
                    with st.expander(f"{row['task_name']} ({row['employee_name']}) - {row['status']}"):
                        ec1, ec2 = st.columns([3, 1])
                        with ec1:
                            with st.form(f"edit_{row['id']}"):
                                new_name = st.text_input("Task Name", row['task_name'])
                                new_hrs = st.number_input("Hours", value=float(row['allocated_hours']), step=0.5)
                                if st.form_submit_button("Update Task"):
                                    if edit_task(row['id'], new_name, new_hrs): st.success("Updated!"); time.sleep(1); st.rerun()
                        with ec2:
                            st.write("Actions")
                            if st.button("🗑️ Delete", key=f"del_{row['id']}", type="secondary"):
                                if delete_task(row['id']): st.warning("Deleted"); time.sleep(1); st.rerun()
            else:
                st.info("No tasks found.")

    # --- VIEW 6: USERS (DELETE ADDED) ---
    elif menu == "Users":
        t_create, t_delete = st.tabs(["Add User", "Delete User"])
        
        with t_create:
            with st.form("new_u"):
                c1, c2 = st.columns(2)
                u = c1.text_input("Username"); p = c2.text_input("Password", type="password")
                n = c1.text_input("Full Name"); s = c2.number_input("Salary", value=10000)
                r = st.selectbox("Role", ["Employee", "Admin"])
                if st.form_submit_button("Create User"):
                    if u and p and n:
                        if register_user(u, p, n, r, s): st.success("Created!"); st.rerun()
                        else: st.error("Exists!")
                    else: st.warning("Fill all fields")
        
        with t_delete:
            st.error("⚠️ Danger Zone: Deleting a user removes ALL their attendance & task history.")
            all_u = get_all_users()
            if not all_u.empty:
                del_opts = all_u[all_u['username']!='admin']['username'].unique()
                target = st.selectbox("Select User to Delete", del_opts)
                if st.button(f"Permanently Delete {target}", type="secondary"):
                    succ, msg = delete_user_data(target)
                    if succ: st.success(msg); time.sleep(2); st.rerun()
                    else: st.error(msg)
            
        st.markdown("---")
        st.dataframe(get_all_users())