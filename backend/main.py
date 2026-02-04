# import pandas as pd
# from fastapi import FastAPI, HTTPException, Query
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from typing import Optional, List
# import utils 
# from databases.db import create_tables 

# # --- INITIALIZE DATABASE (Run Once at Startup) ---
# create_tables()

# app = FastAPI()

# # Allow Next.js (port 3000) to talk to Python (port 8000)
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ==========================================================
# # DATA MODELS (Input Validation)
# # ==========================================================
# class LoginReq(BaseModel):
#     username: str
#     password: str

# class UserReq(BaseModel):
#     username: str
#     password: str
#     name: str
#     role: str
#     salary: int

# class TaskReq(BaseModel):
#     employee_name: str
#     task_name: str
#     description: Optional[str] = ""
#     allocated_hours: float

# class SubTaskReq(BaseModel):
#     parent_id: int
#     task_name: str
#     allocated_hours: float

# class TaskUpdateReq(BaseModel):
#     task_name: str
#     allocated_hours: float

# # ==========================================================
# # 1. AUTHENTICATION
# # ==========================================================
# @app.post("/api/login")
# def login(data: LoginReq):
#     role, name = utils.login_user(data.username, data.password)
#     if not role: raise HTTPException(401, "Invalid Credentials")
#     return {"role": role, "name": name}

# # ==========================================================
# # 2. USERS MANAGEMENT
# # ==========================================================
# @app.get("/api/users")
# def get_users():
#     # utils.get_all_users() returns a List[Dict], no .to_dict needed
#     return utils.get_all_users()

# @app.post("/api/users")
# def create_user(data: UserReq):
#     success = utils.register_user(data.username, data.password, data.name, data.role, data.salary)
#     if not success: raise HTTPException(400, "Username exists")
#     return {"message": "Created"}

# @app.delete("/api/users/{username}")
# def delete_user(username: str):
#     success, msg = utils.delete_user_data(username)
#     if not success: raise HTTPException(400, msg)
#     return {"message": msg}

# # ==========================================================
# # 3. ATTENDANCE & DASHBOARD OVERVIEW
# # ==========================================================
# @app.get("/api/status/{name}")
# def get_status(name: str):
#     return {"status": utils.get_employee_current_status(name)}

# @app.post("/api/punch-in/{name}")
# def punch_in(name: str):
#     utils.mark_punch_in(name)
#     return {"message": "Punched In"}

# @app.post("/api/punch-out/{name}")
# def punch_out(name: str):
#     utils.mark_punch_out(name)
#     return {"message": "Punched Out"}

# @app.get("/api/overview")
# def get_overview():
#     df = utils.load_attendance_data()
    
#     if df.empty:
#         return {
#             "total_staff": 0,
#             "active_today": 0,
#             "avg_hours": "0.0",
#             "leaderboard": [],
#             "weekly_trend": [] 
#         }
    
#     latest = df[df["date"] == df["date"].max()]
    
#     # Safety: Convert DataFrame to Dict and handle NaN
#     summary_df = utils.get_working_hours_summary(df).head(5)
#     summary_df = summary_df.where(pd.notnull(summary_df), None)
    
#     weekly_trend = utils.get_weekly_trend(df) 
    
#     return {
#         "total_staff": int(df['employee_name'].nunique()),
#         "active_today": int(latest.shape[0]) if not latest.empty else 0,
#         "avg_hours": f"{latest['working_hours'].mean():.2f}" if not latest.empty else "0.0",
#         "leaderboard": summary_df.to_dict(orient="records"),
#         "weekly_trend": weekly_trend 
#     }

# @app.get("/api/attendance/daily")
# def get_daily_logs(date: str):
#     df = utils.load_attendance_data()
#     daily = utils.get_daily_attendance(df, pd.to_datetime(date))
#     # Safety: Convert NaN to None
#     daily = daily.where(pd.notnull(daily), None)
#     return daily.to_dict(orient="records")

# # ==========================================================
# # 4. REPORTS & ANALYTICS
# # ==========================================================
# @app.get("/api/reports/monthly")
# def get_monthly_stats():
#     df = utils.load_attendance_data()
#     report = utils.get_monthly_report(df)
#     # Safety: Convert NaN to None
#     report = report.where(pd.notnull(report), None)
#     return report.to_dict(orient="records")

# # ==========================================================
# # 5. TASKS MANAGEMENT (JIRA FEATURES)
# # ==========================================================
# @app.get("/api/tasks/available")
# def get_free_employees():
#     df = utils.load_attendance_data()
#     # Returns List (Handled in utils), do NOT use .to_dict()
#     return utils.get_free_time_employees(df)

# @app.get("/api/tasks/history")
# def get_tasks():
#     df = utils.get_all_tasks_history()
#     # Safety: Convert NaN to None
#     df = df.where(pd.notnull(df), None)
#     return df.to_dict(orient="records")

# @app.get("/api/tasks/hierarchy")
# def get_task_hierarchy():
#     """Returns tasks grouped by Parent -> Subtasks for the Board"""
#     # Returns List (Handled in utils), do NOT use .to_dict()
#     return utils.get_tasks_with_subtasks()

# @app.get("/api/tasks/{task_id}")
# def get_task_detail_api(task_id: int):
#     """Returns details for a single task (used in Lightbox)"""
#     # Returns Dict (Handled in utils)
#     task = utils.get_task_details(task_id)
#     if not task: raise HTTPException(404, "Task not found")
#     return task

# @app.post("/api/tasks")
# def assign_task(data: TaskReq):
#     utils.allocate_task(data.employee_name, data.task_name, data.allocated_hours)
#     return {"message": "Assigned"}

# @app.post("/api/tasks/subtask")
# def create_subtask(data: SubTaskReq):
#     utils.add_subtask(data.parent_id, data.task_name, data.allocated_hours)
#     return {"message": "Subtask Created"}

# @app.put("/api/tasks/{task_id}")
# def update_task(task_id: int, data: TaskUpdateReq):
#     utils.edit_task(task_id, data.task_name, data.allocated_hours)
#     return {"message": "Updated"}

# @app.delete("/api/tasks/{task_id}")
# def remove_task(task_id: int):
#     utils.delete_task(task_id)
#     return {"message": "Deleted"}

# @app.post("/api/tasks/{task_id}/status")
# def set_task_status(task_id: int, status: str = Query(...)): 
#     utils.update_task_status(task_id, status)
#     return {"message": "Status updated"}

# @app.get("/api/employee/tasks/{name}")
# def get_employee_tasks(name: str):
#     tasks = utils.get_my_tasks(name)
#     # Safety: Convert NaN to None
#     tasks = tasks.where(pd.notnull(tasks), None)
#     return tasks.to_dict(orient="records")

# # ==========================================================
# # 6. PAYROLL
# # ==========================================================
# @app.get("/api/payroll")
# def get_payroll(year: int, month: int):
#     df = utils.calculate_payroll(year, month)
#     # Safety: Convert NaN to None
#     df = df.where(pd.notnull(df), None)
#     return df.to_dict(orient="records")


# import pandas as pd
# from fastapi import FastAPI, HTTPException, Query
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from typing import Optional, List, Dict, Any
# import utils 
# from databases.db import create_tables 

# # --- INITIALIZE DATABASE ---
# create_tables()

# app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ==========================================================
# # INPUT MODELS
# # ==========================================================
# class LoginReq(BaseModel):
#     username: str
#     password: str

# class UserReq(BaseModel):
#     username: str
#     password: str
#     name: str
#     role: str
#     salary: int

# class TaskReq(BaseModel):
#     employee_name: str
#     task_name: str
#     description: Optional[str] = ""
#     allocated_hours: float
#     # New JIRA fields
#     priority: Optional[str] = "Medium"
#     task_type: Optional[str] = "Task"
#     story_points: Optional[int] = 0
#     sprint_id: Optional[int] = None
#     epic_id: Optional[int] = None
#     due_date: Optional[str] = None # YYYY-MM-DD format

# class SubTaskReq(BaseModel):
#     parent_id: int
#     task_name: str
#     allocated_hours: float

# class TaskUpdateReq(BaseModel):
#     task_name: Optional[str] = None
#     allocated_hours: Optional[float] = None
#     description: Optional[str] = None
#     priority: Optional[str] = None
#     story_points: Optional[int] = None

# class CommentReq(BaseModel):
#     username: str
#     comment: str

# class SprintReq(BaseModel):
#     name: str
#     start_date: str
#     end_date: str
#     goal: Optional[str] = ""

# class EpicReq(BaseModel):
#     name: str
#     description: Optional[str] = ""
#     owner: str
#     color: Optional[str] = "#0052CC"

# # ==========================================================
# # 1. AUTH & USERS
# # ==========================================================
# @app.post("/api/login")
# def login(data: LoginReq):
#     role, name = utils.login_user(data.username, data.password)
#     if not role: raise HTTPException(401, "Invalid Credentials")
#     return {"role": role, "name": name}

# @app.get("/api/users")
# def get_users():
#     return utils.get_all_users()

# @app.get("/api/employees")
# def get_employees():
#     return utils.get_all_employees()

# @app.post("/api/users")
# def create_user(data: UserReq):
#     success = utils.register_user(data.username, data.password, data.name, data.role, data.salary)
#     if not success: raise HTTPException(400, "Username exists")
#     return {"message": "Created"}

# @app.delete("/api/users/{username}")
# def delete_user(username: str):
#     success, msg = utils.delete_user_data(username)
#     if not success: raise HTTPException(400, msg)
#     return {"message": msg}

# # ==========================================================
# # 2. DASHBOARD & ATTENDANCE
# # ==========================================================
# @app.get("/api/status/{name}")
# def get_status(name: str):
#     return {"status": utils.get_employee_current_status(name)}

# @app.post("/api/punch-in/{name}")
# def punch_in(name: str):
#     utils.mark_punch_in(name)
#     return {"message": "Punched In"}

# @app.post("/api/punch-out/{name}")
# def punch_out(name: str):
#     utils.mark_punch_out(name)
#     return {"message": "Punched Out"}

# @app.get("/api/overview")
# def get_overview():
#     df = utils.load_attendance_data()
#     if df.empty:
#         return {"total_staff": 0, "active_today": 0, "avg_hours": "0.0", "leaderboard": [], "weekly_trend": []}
    
#     latest = df[df["date"] == df["date"].max()]
#     summary = utils.get_working_hours_summary(df).head(5)
    
#     # Handle NaN in summary safely
#     summary = summary.where(pd.notnull(summary), None)
    
#     return {
#         "total_staff": int(df['employee_name'].nunique()),
#         "active_today": int(latest.shape[0]) if not latest.empty else 0,
#         "avg_hours": f"{latest['working_hours'].mean():.2f}" if not latest.empty else "0.0",
#         "leaderboard": summary.to_dict(orient="records"),
#         "weekly_trend": utils.get_weekly_trend(df) 
#     }

# # ==========================================================
# # 3. TASK MANAGEMENT (CORE)
# # ==========================================================
# @app.get("/api/tasks/hierarchy")
# def get_task_hierarchy():
#     """Get full recursive task tree"""
#     return utils.get_tasks_with_subtasks()

# @app.get("/api/tasks/search")
# def search_tasks_api(q: str):
#     """Search tasks by name or description"""
#     return utils.search_tasks(q)

# @app.get("/api/tasks/{task_id}")
# def get_task_detail_api(task_id: int):
#     """Get rich task details (history, comments, etc)"""
#     task = utils.get_task_details(task_id)
#     if not task: raise HTTPException(404, "Task not found")
#     return task

# @app.post("/api/tasks")
# def assign_task(data: TaskReq):
#     # Parse date if provided
#     due_dt = pd.to_datetime(data.due_date) if data.due_date else None
    
#     success, res = utils.allocate_task(
#         data.employee_name, data.task_name, data.allocated_hours,
#         task_type=data.task_type, priority=data.priority, 
#         sprint_id=data.sprint_id, epic_id=data.epic_id,
#         story_points=data.story_points, description=data.description,
#         due_date=due_dt
#     )
#     if not success: raise HTTPException(400, str(res))
#     return {"message": "Assigned", "id": res}

# @app.post("/api/tasks/subtask")
# def create_subtask(data: SubTaskReq):
#     success, res = utils.add_subtask(data.parent_id, data.task_name, data.allocated_hours)
#     if not success: raise HTTPException(400, str(res))
#     return {"message": "Subtask Created", "id": res}

# @app.put("/api/tasks/{task_id}")
# def update_task_api(task_id: int, data: TaskUpdateReq, user: str = Query("Admin")):
#     # Convert Pydantic model to dict, removing None values
#     updates = {k: v for k, v in data.dict().items() if v is not None}
    
#     success, msg = utils.edit_task(task_id, updated_by=user, **updates)
#     if not success: raise HTTPException(400, msg)
#     return {"message": msg}

# @app.delete("/api/tasks/{task_id}")
# def remove_task(task_id: int, user: str = Query("Admin")):
#     success, msg = utils.delete_task(task_id, deleted_by=user)
#     if not success: raise HTTPException(400, msg)
#     return {"message": msg}

# @app.post("/api/tasks/{task_id}/status")
# def set_task_status(task_id: int, status: str = Query(...), user: str = Query("System")): 
#     success = utils.update_task_status(task_id, status, changed_by=user)
#     if not success: raise HTTPException(400, "Failed to update status")
#     return {"message": "Status updated"}

# @app.get("/api/employee/tasks/{name}")
# def get_employee_tasks(name: str):
#     df = utils.get_my_tasks(name)
#     return df.to_dict(orient="records")

# @app.get("/api/tasks/available")
# def get_free_employees():
#     return utils.get_free_time_employees(pd.DataFrame()) # Helper handles empty DF logic

# # ==========================================================
# # 4. COMMENTS & HISTORY
# # ==========================================================
# @app.post("/api/tasks/{task_id}/comments")
# def post_comment(task_id: int, data: CommentReq):
#     utils.add_task_comment(task_id, data.username, data.comment)
#     return {"message": "Comment added"}

# @app.get("/api/tasks/{task_id}/comments")
# def get_comments(task_id: int):
#     return utils.get_task_comments(task_id)

# @app.get("/api/tasks/{task_id}/history")
# def get_history(task_id: int):
#     return utils.get_task_history(task_id)

# # ==========================================================
# # 5. SPRINTS & AGILE (New Features)
# # ==========================================================
# @app.get("/api/sprints")
# def list_sprints():
#     return utils.get_all_sprints()

# @app.post("/api/sprints")
# def create_new_sprint(data: SprintReq):
#     start = pd.to_datetime(data.start_date)
#     end = pd.to_datetime(data.end_date)
#     success, res = utils.create_sprint(data.name, start, end, data.goal)
#     if not success: raise HTTPException(400, str(res))
#     return {"message": "Sprint Created", "id": res}

# @app.get("/api/sprints/{sprint_id}")
# def get_sprint(sprint_id: int):
#     data = utils.get_sprint_details(sprint_id)
#     if not data: raise HTTPException(404, "Sprint not found")
#     return data

# @app.get("/api/sprints/{sprint_id}/burndown")
# def get_burndown(sprint_id: int):
#     return utils.get_burndown_chart_data(sprint_id)

# @app.post("/api/sprints/{sprint_id}/assign/{task_id}")
# def assign_to_sprint(sprint_id: int, task_id: int):
#     utils.assign_task_to_sprint(task_id, sprint_id)
#     return {"message": "Task assigned to sprint"}

# # ==========================================================
# # 6. EPICS
# # ==========================================================
# @app.get("/api/epics")
# def list_epics():
#     return utils.get_all_epics()

# @app.post("/api/epics")
# def create_new_epic(data: EpicReq):
#     success, res = utils.create_epic(data.name, data.description, data.owner, data.color)
#     if not success: raise HTTPException(400, str(res))
#     return {"message": "Epic Created", "id": res}

# @app.get("/api/epics/{epic_id}")
# def get_epic(epic_id: int):
#     data = utils.get_epic_details(epic_id)
#     if not data: raise HTTPException(404, "Epic not found")
#     return data

# # ==========================================================
# # 7. PAYROLL & REPORTS
# # ==========================================================
# @app.get("/api/payroll")
# def get_payroll(year: int, month: int):
#     df = utils.calculate_payroll(year, month)
#     # Safety: Convert NaN to None
#     df = df.where(pd.notnull(df), None)
#     return df.to_dict(orient="records")

# @app.get("/api/reports/monthly")
# def get_monthly_stats():
#     df = utils.load_attendance_data()
#     report = utils.get_monthly_report(df)
#     report = report.where(pd.notnull(report), None)
#     return report.to_dict(orient="records")



import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import utils 
from databases.db import create_tables 

# --- INITIALIZE DATABASE ---
create_tables()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================================
# INPUT MODELS
# ==========================================================
class TaskReq(BaseModel):
    employee_name: str
    task_name: str
    description: Optional[str] = ""
    allocated_hours: float
    priority: Optional[str] = "Medium"
    task_type: Optional[str] = "Task"
    story_points: Optional[int] = 0
    reporter: Optional[str] = "Admin"

class SubTaskReq(BaseModel):
    parent_id: int
    task_name: str
    allocated_hours: float

class CommentReq(BaseModel):
    username: str
    comment: str

class LoginReq(BaseModel):
    username: str
    password: str

class UserReq(BaseModel):
    username: str
    password: str
    name: str
    role: str
    salary: int

# ==========================================================
# 1. ESSENTIAL ENDPOINTS (Fixing the 404s)
# ==========================================================

@app.get("/api/employees")
def get_employees():
    # Your utils.get_all_employees() returns a DataFrame, we must convert it
    df = utils.get_all_employees()
    if isinstance(df, pd.DataFrame):
        return df.to_dict(orient="records")
    return df

@app.get("/api/tasks/hierarchy")
def get_task_hierarchy():
    # Your utils.get_tasks_with_subtasks() returns a List (already cleaned)
    return utils.get_tasks_with_subtasks()

@app.get("/api/sprints")
def list_sprints():
    # Your utils.get_all_sprints() returns a List
    return utils.get_all_sprints()

@app.get("/api/tasks/{task_id}")
def get_task_detail_api(task_id: int):
    task = utils.get_task_details(task_id)
    if not task: raise HTTPException(404, "Task not found")
    return task

@app.post("/api/tasks")
def assign_task(data: TaskReq):
    # Determine due date etc inside util if needed
    success, res = utils.allocate_task(
        data.employee_name, data.task_name, data.allocated_hours,
        task_type=data.task_type, priority=data.priority, 
        story_points=data.story_points, description=data.description,
        reporter=data.reporter
    )
    if not success: raise HTTPException(400, str(res))
    return {"message": "Assigned", "id": res}

@app.post("/api/tasks/subtask")
def create_subtask(data: SubTaskReq):
    success, res = utils.add_subtask(data.parent_id, data.task_name, data.allocated_hours)
    if not success: raise HTTPException(400, str(res))
    return {"message": "Subtask Created", "id": res}

@app.delete("/api/tasks/{task_id}")
def remove_task(task_id: int, user: str = Query("Admin")):
    success, msg = utils.delete_task(task_id, deleted_by=user)
    if not success: raise HTTPException(400, msg)
    return {"message": msg}

@app.post("/api/tasks/{task_id}/status")
def set_task_status(task_id: int, status: str = Query(...), user: str = Query("System")): 
    success = utils.update_task_status(task_id, status, changed_by=user)
    if not success: raise HTTPException(400, "Failed to update status")
    return {"message": "Status updated"}

@app.post("/api/tasks/{task_id}/comments")
def post_comment(task_id: int, data: CommentReq):
    utils.add_task_comment(task_id, data.username, data.comment)
    return {"message": "Comment added"}

@app.get("/api/sprints/{sprint_id}/burndown")
def get_burndown(sprint_id: int):
    return utils.get_burndown_chart_data(sprint_id)

# ==========================================================
# 2. STANDARD DASHBOARD ENDPOINTS
# ==========================================================

@app.post("/api/login")
def login(data: LoginReq):
    role, name = utils.login_user(data.username, data.password)
    if not role: raise HTTPException(401, "Invalid Credentials")
    return {"role": role, "name": name}

@app.get("/api/users")
def get_users():
    df = utils.get_all_users()
    if isinstance(df, pd.DataFrame): return df.to_dict(orient="records")
    return df

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

@app.get("/api/overview")
def get_overview():
    df = utils.load_attendance_data()
    if df.empty:
        return {"total_staff": 0, "active_today": 0, "avg_hours": "0.0", "leaderboard": [], "weekly_trend": []}
    
    latest = df[df["date"] == df["date"].max()]
    summary = utils.get_working_hours_summary(df).head(5)
    summary = summary.where(pd.notnull(summary), None)
    
    return {
        "total_staff": int(df['employee_name'].nunique()),
        "active_today": int(latest.shape[0]) if not latest.empty else 0,
        "avg_hours": f"{latest['working_hours'].mean():.2f}" if not latest.empty else "0.0",
        "leaderboard": summary.to_dict(orient="records"),
        "weekly_trend": utils.get_weekly_trend(df) 
    }

@app.get("/api/attendance/daily")
def get_daily_logs(date: str):
    df = utils.load_attendance_data()
    daily = utils.get_daily_attendance(df, pd.to_datetime(date))
    daily = daily.where(pd.notnull(daily), None)
    return daily.to_dict(orient="records")

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

@app.get("/api/employee/tasks/{name}")
def get_employee_tasks(name: str):
    df = utils.get_my_tasks(name)
    if isinstance(df, pd.DataFrame): return df.to_dict(orient="records")
    return df

@app.get("/api/reports/monthly")
def get_monthly_stats():
    df = utils.load_attendance_data()
    report = utils.get_monthly_report(df)
    report = report.where(pd.notnull(report), None)
    return report.to_dict(orient="records")

@app.get("/api/payroll")
def get_payroll(year: int, month: int):
    df = utils.calculate_payroll(year, month)
    df = df.where(pd.notnull(df), None)
    return df.to_dict(orient="records")

@app.get("/api/tasks/available")
def get_free_employees_api():
    # Passing empty DF as your util handles fetching
    res = utils.get_free_time_employees(pd.DataFrame())
    return res