"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import KPICard from "@/components/KPICard";
import { 
  Users, Clock, Zap, AlertCircle, Fingerprint, Trophy, 
  Briefcase, CheckCircle2, Circle, X, Plus, Trash2, Layout, Loader2, BarChart as BarChartIcon
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// --- TYPES ---
interface Task {
  id: number;
  task_name: string;
  description?: string;
  employee_name: string;
  allocated_hours: number;
  status: "To Do" | "In Progress" | "Done";
  progress?: number;
  subtasks?: Task[];
}

export default function Dashboard() {
  const [role, setRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Data States
  const [adminData, setAdminData] = useState<any>(null);
  const [employeeStatus, setEmployeeStatus] = useState("not_started");
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  
  // Lightbox State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [subTaskName, setSubTaskName] = useState("");

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    const storedName = localStorage.getItem("username");
    
    setRole(storedRole);
    setUsername(storedName || "");

    if (storedRole === "Admin" && storedName) {
      fetchAdminData(storedName);
    } else if (storedRole === "Employee" && storedName) {
      fetchEmployeeData(storedName);
    } else {
      setLoading(false);
    }
  }, []);

  // --- API CALLS ---
  const fetchAdminData = async (name: string) => {
    try {
        const [overviewRes, tasksRes] = await Promise.all([
            axios.get("http://127.0.0.1:8000/api/overview"),
            axios.get(`http://localhost:8000/api/employee/tasks/${name}`) // Fetch Admin's tasks too
        ]);
        setAdminData(overviewRes.data);
        setMyTasks(tasksRes.data);
        
        // Refresh Lightbox if open
        if (selectedTask) {
            const detailRes = await axios.get(`http://localhost:8000/api/tasks/${selectedTask.id}`);
            setSelectedTask(detailRes.data);
        }
        setLoading(false);
    } catch (err) { console.error(err); setLoading(false); }
  };

  const fetchEmployeeData = async (name: string) => {
    setLoading(true);
    try {
      const [statusRes, tasksRes] = await Promise.all([
        axios.get(`http://localhost:8000/api/status/${name}`),
        axios.get(`http://localhost:8000/api/employee/tasks/${name}`)
      ]);
      setEmployeeStatus(statusRes.data.status);
      setMyTasks(tasksRes.data);
      
      if (selectedTask) {
        const detailRes = await axios.get(`http://localhost:8000/api/tasks/${selectedTask.id}`);
        setSelectedTask(detailRes.data);
      }
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  // --- SHARED ACTIONS ---
  
  // Refresh Data Wrapper
  const refreshData = () => {
      if (role === 'Admin') fetchAdminData(username);
      else fetchEmployeeData(username);
  };

  const handlePunch = async (type: "in" | "out") => {
    if (!confirm(`Confirm Punch ${type.toUpperCase()}?`)) return;
    try {
      await axios.post(`http://localhost:8000/api/punch-${type}/${username}`);
      refreshData();
      alert("Success!");
    } catch (e) { alert("Error connecting to server"); }
  };

  const openTaskDetails = async (taskId: number) => {
    try {
      const res = await axios.get(`http://localhost:8000/api/tasks/${taskId}`);
      setSelectedTask(res.data);
    } catch (e) { alert("Could not load task details"); }
  };

  const handleUpdateStatus = async (id: number, currentStatus: string) => {
    const next = currentStatus === "To Do" ? "In Progress" : currentStatus === "In Progress" ? "Done" : "To Do";
    await axios.post(`http://localhost:8000/api/tasks/${id}/status?status=${next}`);
    refreshData();
  };

  const handleAddSubtask = async () => {
    if (!selectedTask || !subTaskName) return;
    await axios.post("http://localhost:8000/api/tasks/subtask", {
      parent_id: selectedTask.id,
      task_name: subTaskName,
      allocated_hours: 1.0 
    });
    setSubTaskName("");
    refreshData();
  };

  const handleDeleteSubtask = async (subTaskId: number) => {
    if (confirm("Delete this sub-task?")) {
      await axios.delete(`http://localhost:8000/api/tasks/${subTaskId}`);
      refreshData();
    }
  };

  // --- COMPONENTS ---
  const StatusBadge = ({ status, onClick }: any) => (
    <button 
      onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
      className={`px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 transition-all
        ${status === 'Done' ? 'bg-green-900/30 text-green-400 border-green-800 hover:bg-green-900/50' : 
          status === 'In Progress' ? 'bg-blue-900/30 text-blue-400 border-blue-800 hover:bg-blue-900/50' : 
          'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}
      `}
    >
      {status === 'Done' ? <CheckCircle2 size={12}/> : status === 'In Progress' ? <Loader2 size={12} className="animate-spin"/> : <Circle size={12}/>}
      {status.toUpperCase()}
    </button>
  );

  // --- LIGHTBOX COMPONENT ---
  const TaskLightbox = () => {
      if (!selectedTask) return null;
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSelectedTask(null)}>
          <div className="bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-800 flex justify-between items-start">
               <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                     <span className="text-xs text-slate-500 font-mono uppercase">#{selectedTask.id}</span>
                     <StatusBadge status={selectedTask.status} onClick={() => handleUpdateStatus(selectedTask.id, selectedTask.status)} />
                  </div>
                  <h2 className="text-2xl font-bold text-white">{selectedTask.task_name}</h2>
               </div>
               <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><X size={24}/></button>
            </div>

            <div className="p-6 overflow-y-auto">
               <div className="mb-6">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Description</h4>
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-slate-300 text-sm">
                     {selectedTask.description || "No description provided."}
                  </div>
               </div>

               <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Sub-Tasks / Process</h4>
                  <div className="space-y-2">
                     {selectedTask.subtasks && selectedTask.subtasks.map((sub, idx) => (
                        <div key={sub.id} className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg group">
                           <div className="text-xs font-mono text-slate-600">{idx + 1}.</div>
                           <div className={`flex-1 text-sm ${sub.status === 'Done' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                              {sub.task_name}
                           </div>
                           <StatusBadge status={sub.status} onClick={() => handleUpdateStatus(sub.id, sub.status)} />
                           
                           {/* ADMIN & ASSIGNEE CAN DELETE SUBTASK */}
                           <button 
                              onClick={() => handleDeleteSubtask(sub.id)}
                              className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-slate-900 rounded transition opacity-0 group-hover:opacity-100"
                              title="Delete Subtask"
                            >
                              <Trash2 size={14}/>
                           </button>
                        </div>
                     ))}
                  </div>

                  <div className="mt-4 flex gap-2 border-t border-slate-800 pt-4">
                     <input 
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Add sub-task..."
                        value={subTaskName}
                        onChange={(e) => setSubTaskName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                     />
                     <button onClick={handleAddSubtask} className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg"><Plus size={18}/></button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      );
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Loading Dashboard...</div>;

  // ==================================================================================
  // VIEW 1: EMPLOYEE DASHBOARD
  // ==================================================================================
  if (role === "Employee") {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-slate-200">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Header & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl flex flex-col items-center text-center justify-center">
                <div className="h-16 w-16 bg-slate-950 rounded-full flex items-center justify-center mb-4 border border-slate-800 shadow-inner relative">
                  <Fingerprint size={32} className={employeeStatus === 'working' ? "text-green-500 animate-pulse" : "text-blue-500"} />
                  {employeeStatus === 'working' && <span className="absolute top-0 right-0 h-3 w-3 bg-green-500 rounded-full animate-ping"></span>}
                </div>
                <h1 className="text-xl font-bold text-white">Hello, {username}</h1>
                <p className="text-slate-400 text-xs mt-1 uppercase tracking-wider mb-6">
                  {employeeStatus === 'working' ? "🟢 Shift Active" : "⚪ Off Duty"}
                </p>
                <div className="flex gap-3 w-full">
                   <button onClick={() => handlePunch("in")} disabled={employeeStatus !== 'not_started'} className="flex-1 py-2 rounded-lg font-bold text-xs bg-green-600 hover:bg-green-500 disabled:opacity-20 text-white transition">PUNCH IN</button>
                   <button onClick={() => handlePunch("out")} disabled={employeeStatus !== 'working'} className="flex-1 py-2 rounded-lg font-bold text-xs bg-red-600 hover:bg-red-500 disabled:opacity-20 text-white transition">PUNCH OUT</button>
                </div>
             </div>

             <div className="grid grid-rows-2 gap-4">
                <KPICard title="My Pending Tasks" value={myTasks.filter(t => t.status !== 'Done').length} icon={AlertCircle} color="text-yellow-400" bg="bg-yellow-400/10" />
                <KPICard title="Completed Today" value={myTasks.filter(t => t.status === 'Done').length} icon={CheckCircle2} color="text-green-400" bg="bg-green-400/10" />
             </div>
          </div>

          {/* Proper Task Area */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <Briefcase className="text-blue-500" size={20}/> My Assignments
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myTasks.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-500 bg-slate-950/30 rounded-xl border border-slate-800/50 border-dashed">
                  No tasks assigned to you.
                </div>
              ) : (
                myTasks.map((task) => (
                  <div 
                    key={task.id} 
                    onClick={() => openTaskDetails(task.id)}
                    className="bg-slate-950 p-5 rounded-xl border border-slate-800 hover:border-blue-500/50 cursor-pointer transition group relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <StatusBadge status={task.status} onClick={() => handleUpdateStatus(task.id, task.status)} />
                      <span className="text-[10px] text-slate-500 font-mono">#{task.id}</span>
                    </div>
                    <h4 className="font-bold text-white text-lg mb-1">{task.task_name}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Clock size={12}/> {task.allocated_hours}h</span>
                      <span className="text-blue-400 opacity-0 group-hover:opacity-100 transition">View Details →</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <TaskLightbox />
        </div>
      </div>
    );
  }

  // ==================================================================================
  // VIEW 2: ADMIN DASHBOARD (With Charts AND Task Management)
  // ==================================================================================
  if (role === "Admin") {
    const hasTrendData = adminData?.weekly_trend?.some((day: any) => day.present > 0);
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Overview of company performance</p>
          </div>
          
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KPICard title="Total Employees" value={adminData?.total_staff || 0} icon={Users} color="text-blue-400" bg="bg-blue-400/10" />
            <KPICard title="Active Today" value={adminData?.active_today || 0} icon={Zap} color="text-emerald-400" bg="bg-emerald-400/10" />
            <KPICard title="Avg Daily Hours" value={adminData?.avg_hours || "0.0"} icon={Clock} color="text-violet-400" bg="bg-violet-400/10" />
            <KPICard title="Pending Actions" value="3" icon={AlertCircle} color="text-rose-400" bg="bg-rose-400/10" />
          </div>

          {/* CHARTS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg flex flex-col">
              <h3 className="font-semibold text-white mb-6 flex items-center gap-2"><Layout size={18} className="text-blue-500"/> Weekly Trend</h3>
              <div className="h-72 w-full flex-1">
                {hasTrendData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={adminData?.weekly_trend || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }} />
                      <Bar dataKey="present" radius={[4, 4, 0, 0]} barSize={40}>
                        {(adminData?.weekly_trend || []).map((entry: any, index: number) => (
                           <Cell key={`cell-${index}`} fill={entry.name === new Date().toLocaleDateString('en-US', {weekday: 'short'}) ? '#3b82f6' : '#475569'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-slate-950/30 rounded-lg border border-slate-800/50 border-dashed">
                      <BarChartIcon size={32} className="mb-2 opacity-50"/>
                      <p className="text-sm">No recent data</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg flex flex-col h-full">
              <h3 className="font-semibold text-white mb-6 flex items-center gap-2"><Trophy size={18} className="text-yellow-500"/> Top Staff</h3>
              <div className="flex-1 overflow-y-auto space-y-4 max-h-[300px]">
                {adminData?.leaderboard?.map((emp: any, index: number) => (
                    <div key={index} className="flex justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800/50 hover:border-slate-700 transition-colors">
                      <div className="flex gap-3 items-center">
                        <span className="font-bold text-slate-500 text-xs">#{index+1}</span>
                        <span className="text-sm font-medium text-slate-200">{emp.employee_name}</span>
                      </div>
                      <span className="font-mono text-sm font-bold text-blue-400">{emp.total_hours.toFixed(1)}h</span>
                    </div>
                ))}
              </div>
            </div>
          </div>

          {/* ADMIN TASKS (The missing feature) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <Briefcase className="text-blue-500" size={20}/> My Admin Assignments
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myTasks.length === 0 ? (
                <div className="col-span-full text-center py-8 text-slate-500 bg-slate-950/30 rounded-xl border border-slate-800/50 border-dashed">
                  No tasks assigned to you.
                </div>
              ) : (
                myTasks.map((task) => (
                  <div key={task.id} onClick={() => openTaskDetails(task.id)} className="bg-slate-950 p-5 rounded-xl border border-slate-800 hover:border-blue-500/50 cursor-pointer transition group">
                    <div className="flex justify-between items-start mb-2">
                      <StatusBadge status={task.status} onClick={() => handleUpdateStatus(task.id, task.status)} />
                      <span className="text-[10px] text-slate-500 font-mono">#{task.id}</span>
                    </div>
                    <h4 className="font-bold text-white text-lg mb-1">{task.task_name}</h4>
                    <span className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition">Manage Subtasks →</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <TaskLightbox />
        </div>
      </div>
    );
  }

  return <div className="min-h-screen bg-slate-950"/>;
}