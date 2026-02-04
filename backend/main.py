import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import utils 
from databases.db import create_tables 

# --- INITIALIZE DATABASE (Run Once at Startup) ---
create_tables()

app = FastAPI()

# Allow Next.js (port 3000) to talk to Python (port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================================
# DATA MODELS (Input Validation)
# ==========================================================
class LoginReq(BaseModel):
    username: str
    password: str

class UserReq(BaseModel):
    username: str
    password: str
    name: str
    role: str
    salary: int

class TaskReq(BaseModel):
    employee_name: str
    task_name: str
    description: Optional[str] = ""
    allocated_hours: float

class SubTaskReq(BaseModel):
    parent_id: int
    task_name: str
    allocated_hours: float

class TaskUpdateReq(BaseModel):
    task_name: str
    allocated_hours: float

# ==========================================================
# 1. AUTHENTICATION
# ==========================================================
@app.post("/api/login")
def login(data: LoginReq):
    role, name = utils.login_user(data.username, data.password)
    if not role: raise HTTPException(401, "Invalid Credentials")
    return {"role": role, "name": name}

# ==========================================================
# 2. USERS MANAGEMENT
# ==========================================================
@app.get("/api/users")
def get_users():
    return utils.get_all_users().to_dict(orient="records")

@app.post("/api/users")
def create_user(data: UserReq):
    success = utils.register_user(data.username, data.password, data.name, data.role, data.salary)
    if not success: raise HTTPException(400, "Username exists")
    return {"message": "Created"}

@app.delete("/api/users/{username}")
def delete_user(username: str):
    success, msg = utils.delete_user_data(username)
    if not success: raise HTTPException(400, msg)
    return {"message": msg}

# ==========================================================
# 3. ATTENDANCE & DASHBOARD OVERVIEW
# ==========================================================
@app.get("/api/status/{name}")
def get_status(name: str):
    return {"status": utils.get_employee_current_status(name)}

@app.post("/api/punch-in/{name}")
def punch_in(name: str):
    utils.mark_punch_in(name)
    return {"message": "Punched In"}

@app.post("/api/punch-out/{name}")
def punch_out(name: str):
    utils.mark_punch_out(name)
    return {"message": "Punched Out"}

@app.get("/api/overview")
def get_overview():
    df = utils.load_attendance_data()
    
    if df.empty:
        return {
            "total_staff": 0,
            "active_today": 0,
            "avg_hours": "0.0",
            "leaderboard": [],
            "weekly_trend": [] 
        }
    
    latest = df[df["date"] == df["date"].max()]
    summary = utils.get_working_hours_summary(df).head(5).to_dict(orient="records")
    weekly_trend = utils.get_weekly_trend(df) 
    
    return {
        "total_staff": int(df['employee_name'].nunique()),
        "active_today": int(latest.shape[0]) if not latest.empty else 0,
        "avg_hours": f"{latest['working_hours'].mean():.2f}" if not latest.empty else "0.0",
        "leaderboard": summary,
        "weekly_trend": weekly_trend 
    }

@app.get("/api/attendance/daily")
def get_daily_logs(date: str):
    df = utils.load_attendance_data()
    daily = utils.get_daily_attendance(df, pd.to_datetime(date))
    return daily.to_dict(orient="records")

# ==========================================================
# 4. REPORTS & ANALYTICS
# ==========================================================
@app.get("/api/reports/monthly")
def get_monthly_stats():
    df = utils.load_attendance_data()
    report = utils.get_monthly_report(df)
    return report.to_dict(orient="records")

# ==========================================================
# 5. TASKS MANAGEMENT (JIRA RECURSIVE FEATURES)
# ==========================================================
@app.get("/api/tasks/available")
def get_free_employees():
    df = utils.load_attendance_data()
    # Returns List[Dict] directly (JSON compliant)
    return utils.get_free_time_employees(df)

@app.get("/api/tasks/history")
def get_tasks():
    # Returns only Root Tasks for history view
    return utils.get_all_tasks_history().to_dict(orient="records")

@app.get("/api/tasks/hierarchy")
def get_task_hierarchy():
    """Returns the full recursive tree for the Admin Board"""
    return utils.get_tasks_with_subtasks()

@app.get("/api/tasks/{task_id}")
def get_task_detail_api(task_id: int):
    """Returns recursive details for a single task (used in Lightbox)"""
    task = utils.get_task_details(task_id)
    if not task: raise HTTPException(404, "Task not found")
    return task

@app.post("/api/tasks")
def assign_task(data: TaskReq):
    utils.allocate_task(data.employee_name, data.task_name, data.allocated_hours)
    return {"message": "Assigned"}

@app.post("/api/tasks/subtask")
def create_subtask(data: SubTaskReq):
    # Works for any depth (parent_id can be a sub-task ID)
    utils.add_subtask(data.parent_id, data.task_name, data.allocated_hours)
    return {"message": "Subtask Created"}

@app.put("/api/tasks/{task_id}")
def update_task(task_id: int, data: TaskUpdateReq):
    utils.edit_task(task_id, data.task_name, data.allocated_hours)
    return {"message": "Updated"}

@app.delete("/api/tasks/{task_id}")
def remove_task(task_id: int):
    # Cascading delete handles sub-tasks automatically
    utils.delete_task(task_id)
    return {"message": "Deleted"}

@app.post("/api/tasks/{task_id}/status")
def set_task_status(task_id: int, status: str = Query(...)): 
    utils.update_task_status(task_id, status)
    return {"message": "Status updated"}

@app.get("/api/employee/tasks/{name}")
def get_employee_tasks(name: str):
    # Returns only Root tasks assigned to employee (sub-tasks hidden until click)
    tasks = utils.get_my_tasks(name)
    return tasks.to_dict(orient="records")

# ==========================================================
# 6. PAYROLL
# ==========================================================
@app.get("/api/payroll")
def get_payroll(year: int, month: int):
    df = utils.calculate_payroll(year, month)
    return df.to_dict(orient="records")