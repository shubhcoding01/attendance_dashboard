# WorkForce – Employee Management & Project Tracking System

**WorkForce** is a full-stack internal management system built to handle **employee attendance**, **Jira-style task & project tracking**, **payroll calculation**, and **role-based access control**.

This project is designed for **internal company use** and supports **Admins** and **Employees** with clearly separated permissions.

Repository:  
👉 https://github.com/shubhcoding01/attendance_dashboard

---

## ✨ What This Project Does

This application solves four core problems:

1. Employee Attendance Tracking  
2. Jira-style Project & Task Management  
3. Automated Payroll Calculation  
4. Admin & Employee Role Management  

Everything is handled through a **Next.js frontend** and a **FastAPI backend** using **SQLite**.

---

## 🚀 Key Features

### 1. 📊 Dashboard
- Real-time employee count
- Active staff today
- Average working hours
- Weekly attendance trends
- Top performers leaderboard

---

### 2. 📝 Task Management (Jira-Style)

This system mimics **Jira concepts**, not just basic tasks:

- **Projects (Root Tasks)** – Admin only
- **Infinite Recursive Sub-tasks**
- **Task Metadata**
  - Status: `To Do → In Progress → Done`
  - Priority: Highest / High / Medium / Low / Lowest
  - Task Type: Task / Bug / Story / Epic
  - Story Points
  - Allocated Hours
- **Permissions**
  - Admins: Full control
  - Employees: Only assigned tasks
- **Task Detail Lightbox**
  - Description
  - Progress bar
  - Sub-task hierarchy
  - Inline status updates

---

### 3. 📅 Attendance & Time Tracking
- Punch In / Punch Out
- Daily attendance logs
- Automatic working hour calculation
- Status indicators (Working / Completed)

---

### 4. 💰 Payroll System
- Monthly payroll calculation
- Salary based on:
  - Base salary
  - Days present
  - Working days (excluding Sundays & holidays)
- Configurable holiday list

---

### 5. 👥 User Management
- Add / delete employees
- Assign roles (Admin / Employee)
- Salary configuration
- Secure password hashing (SHA-256)

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Charts:** Recharts
- **HTTP Client:** Axios

### Backend
- **Framework:** FastAPI
- **Language:** Python 3.9+
- **Database:** SQLite
- **Data Processing:** Pandas
- **Server:** Uvicorn

---

## ⚙️ Prerequisites

Ensure the following are installed:

- Node.js ≥ 18
- Python ≥ 3.9
- Git

---

## 📥 Installation & Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/shubhcoding01/attendance_dashboard.git
cd attendance_dashboard

🔧 Backend Setup (FastAPI)
cd backend
python -m venv venv


Activate virtual environment:

Windows

venv\Scripts\activate


Mac / Linux

source venv/bin/activate


Install dependencies:

pip install fastapi uvicorn pandas python-multipart


Run backend:

uvicorn main:app --reload


Backend runs at:

http://localhost:8000

📌 Database Initialization

Database path: backend/databases/attendance.db

Auto-created on first run

If schema changes, delete DB file and restart backend

🎨 Frontend Setup (Next.js)
cd frontend
npm install
npm run dev


Frontend runs at:

http://localhost:3000

🔑 Default Login Credentials
Username: admin
Password: 123


Passwords are stored using SHA-256 hashing.

📂 Project Structure
attendance_dashboard/
│
├── backend/
│   ├── databases/
│   │   ├── db.py
│   │   └── attendance.db
│   ├── main.py
│   └── utils.py
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/
│   │   │   │   ├── tasks/
│   │   │   │   ├── users/
│   │   │   │   ├── payroll/
│   │   │   │   └── attendance/
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── TaskTree.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── KPICard.tsx
│   │   └── public/
│
└── README.md

🔗 API Documentation

Swagger UI available at:

http://localhost:8000/docs

Important APIs

POST /api/login

GET /api/tasks/hierarchy

POST /api/tasks

POST /api/tasks/subtask

POST /api/tasks/{id}/status

GET /api/payroll

POST /api/punch-in/{name}

POST /api/punch-out/{name}

🐞 Troubleshooting
Backend not reachable

Ensure backend is running

Check CORS in main.py

Backend must allow http://localhost:3000

500 Internal Server Error

Stop backend

Delete backend/databases/attendance.db

Restart backend

Tasks not visible

Admin sees all tasks

Employees see only assigned tasks

🧠 Developer Notes

Recursive task tree logic

Pandas used for payroll accuracy

SQLite for zero-config setup

Easy migration to PostgreSQL/MySQL

🛣️ Future Enhancements

Drag & drop Kanban board

Sprint planning

Email notifications

File attachments

Project-level permissions