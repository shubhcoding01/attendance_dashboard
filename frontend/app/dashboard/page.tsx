"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import KPICard from "@/components/KPICard";
import { Users, Clock, Zap, AlertCircle, Fingerprint, LogOut } from "lucide-react";

export default function Dashboard() {
  const [role, setRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  
  // Admin Data
  const [stats, setStats] = useState<any>(null);
  
  // Employee Data
  const [status, setStatus] = useState("not_started"); // not_started | working | completed

  useEffect(() => {
    // 1. Get User Info from Storage (Saved during Login)
    const storedRole = localStorage.getItem("role");
    const storedName = localStorage.getItem("username");
    
    setRole(storedRole);
    setUsername(storedName || "");

    if (storedRole === "Admin") {
      fetchAdminStats();
    } else if (storedRole === "Employee" && storedName) {
      fetchEmployeeStatus(storedName);
    }
  }, []);

  // --- ADMIN LOGIC ---
  const fetchAdminStats = () => {
    axios.get("http://localhost:8000/api/overview").then(res => setStats(res.data));
  };

  // --- EMPLOYEE LOGIC ---
  const fetchEmployeeStatus = (name: string) => {
    axios.get(`http://localhost:8000/api/status/${name}`).then(res => setStatus(res.data.status));
  };

  const handlePunch = async (type: "in" | "out") => {
    try {
      await axios.post(`http://localhost:8000/api/punch-${type}/${username}`);
      fetchEmployeeStatus(username); // Refresh status
      alert(`Successfully Punched ${type.toUpperCase()}`);
    } catch (e) { alert("Error updating status"); }
  };

  // ----------------------------------------------------
  // VIEW 1: EMPLOYEE PORTAL (Punch In/Out)
  // ----------------------------------------------------
  if (role === "Employee") {
    return (
      <div className="min-h-screen bg-slate-950 p-8 flex flex-col items-center justify-center text-slate-200">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
          
          <div className="mb-8">
            <div className="h-20 w-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700 shadow-inner">
               <Fingerprint size={40} className="text-blue-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Hello, {username}</h1>
            <p className="text-slate-400">Track your attendance securely</p>
          </div>

          <div className="bg-slate-950 rounded-xl p-6 border border-slate-800 mb-8">
             <p className="text-xs font-bold text-slate-500 uppercase mb-2">Current Status</p>
             {status === 'not_started' && <span className="text-yellow-500 font-bold text-xl">⚪ Not Punched In</span>}
             {status === 'working' && <span className="text-green-500 font-bold text-xl animate-pulse">🟢 Currently Working</span>}
             {status === 'completed' && <span className="text-blue-500 font-bold text-xl">🏁 Shift Completed</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <button 
                onClick={() => handlePunch("in")}
                disabled={status !== 'not_started'}
                className="bg-green-600 hover:bg-green-500 disabled:opacity-20 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg transition shadow-lg shadow-green-900/20"
             >
               👊 Punch IN
             </button>
             <button 
                onClick={() => handlePunch("out")}
                disabled={status !== 'working'}
                className="bg-red-600 hover:bg-red-500 disabled:opacity-20 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg transition shadow-lg shadow-red-900/20"
             >
               🛑 Punch OUT
             </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // VIEW 2: ADMIN DASHBOARD (KPIs)
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-200">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8">Dashboard Overview</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard title="Total Staff" value={stats?.total_staff || 0} icon={Users} color="text-blue-400" bg="bg-blue-400/10"/>
          <KPICard title="Active Today" value={stats?.active_today || 0} icon={Zap} color="text-emerald-400" bg="bg-emerald-400/10"/>
          <KPICard title="Avg Hours" value={stats?.avg_hours || "0.0"} icon={Clock} color="text-violet-400" bg="bg-violet-400/10"/>
          <KPICard title="Pending Issues" value="3" icon={AlertCircle} color="text-rose-400" bg="bg-rose-400/10"/>
        </div>

        {/* Admin Widgets (Leaderboard, etc.) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <h3 className="font-bold text-white mb-4">🏆 Top Performers</h3>
              <div className="space-y-3">
                 {stats?.leaderboard?.map((u: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800">
                       <span className="text-white font-medium">{i+1}. {u.employee_name}</span>
                       <span className="text-blue-400 font-bold">{u.total_hours.toFixed(1)} hrs</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}