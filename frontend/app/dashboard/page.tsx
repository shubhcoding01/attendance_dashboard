// "use client";
// import { useEffect, useState } from "react";
// import axios from "axios";
// import KPICard from "@/components/KPICard";
// import TaskTree from "@/components/TaskTree";
// import { 
//   Users, Clock, Zap, AlertCircle, Fingerprint, Trophy, 
//   Briefcase, CheckCircle2, Circle, X, Plus, Trash2, Layout, Loader2, Lock, AlertTriangle, BarChart as BarChartIcon
// } from "lucide-react";
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// interface Task {
//   id: number;
//   task_name: string;
//   description?: string;
//   employee_name: string;
//   allocated_hours: number;
//   status: "To Do" | "In Progress" | "Done";
//   progress?: number;
//   subtasks?: Task[];
// }

// export default function Dashboard() {
//   const [role, setRole] = useState<string | null>(null);
//   const [username, setUsername] = useState<string>("");
//   const [loading, setLoading] = useState(true);

//   // Data
//   const [adminData, setAdminData] = useState<any>(null);
//   const [employeeStatus, setEmployeeStatus] = useState("not_started");
  
//   // Tasks State (For Admin this holds ALL tasks, for Employee holds THEIR tasks)
//   const [myTasks, setMyTasks] = useState<Task[]>([]);
  
//   // UI State
//   const [selectedTask, setSelectedTask] = useState<any>(null);
  
//   // --- CUSTOM MODAL STATE ---
//   const [modal, setModal] = useState<{
//     type: 'NONE' | 'CONFIRM' | 'INPUT' | 'ALERT';
//     title?: string;
//     message?: string;
//     action?: () => Promise<void> | void;
//     inputValue?: string;
//   }>({ type: 'NONE' });
//   const [modalInput, setModalInput] = useState("");

//   useEffect(() => {
//     const storedRole = localStorage.getItem("role");
//     const storedName = localStorage.getItem("username");
    
//     setRole(storedRole);
//     setUsername(storedName || "");

//     if (storedRole === "Admin") fetchAdminData();
//     else if (storedRole === "Employee" && storedName) fetchEmployeeData(storedName);
//     else setLoading(false);
//   }, []);

//   // --- API FETCHING ---

//   const refreshLightbox = async (id: number) => {
//       try {
//         const detailRes = await axios.get(`http://localhost:8000/api/tasks/${id}`);
//         setSelectedTask(detailRes.data);
//       } catch (e) { console.error(e); }
//   };

//   const fetchAdminData = async () => {
//     try {
//         const [overviewRes, tasksRes] = await Promise.all([
//             axios.get("http://127.0.0.1:8000/api/overview"),
//             axios.get("http://localhost:8000/api/tasks/hierarchy") // Admin sees ALL tasks
//         ]);
//         setAdminData(overviewRes.data);
//         setMyTasks(tasksRes.data);
        
//         if (selectedTask) refreshLightbox(selectedTask.id);
//         setLoading(false);
//     } catch (err) { console.error(err); setLoading(false); }
//   };

//   const fetchEmployeeData = async (name: string) => {
//     setLoading(true);
//     try {
//       const [statusRes, tasksRes] = await Promise.all([
//         axios.get(`http://localhost:8000/api/status/${name}`),
//         axios.get(`http://localhost:8000/api/employee/tasks/${name}`)
//       ]);
//       setEmployeeStatus(statusRes.data.status);
//       setMyTasks(tasksRes.data);
//       if (selectedTask) refreshLightbox(selectedTask.id);
//     } catch (e) { console.error(e); } 
//     finally { setLoading(false); }
//   };

//   const refreshData = () => {
//       if (role === 'Admin') fetchAdminData();
//       else fetchEmployeeData(username);
//   };

//   // --- MODAL HELPERS ---
//   const showConfirm = (title: string, message: string, onConfirm: () => void) => {
//       setModal({ type: 'CONFIRM', title, message, action: onConfirm });
//   };
//   const showAlert = (title: string, message: string) => {
//       setModal({ type: 'ALERT', title, message });
//   };
//   const showInput = (title: string, message: string, onSubmit: () => void) => {
//       setModalInput(""); 
//       setModal({ type: 'INPUT', title, message, action: onSubmit });
//   };

//   // --- ACTIONS ---

//   // 1. DELETE MAIN TASK (Admin Override)
//   const handleDeleteMainTask = (e: React.MouseEvent, id: number, status: string) => {
//       e.stopPropagation();
      
//       // LOGIC: Only block if user is NOT Admin AND task is Done
//       if (role !== 'Admin' && status === 'Done') {
//           showAlert("Action Denied", "Completed tasks are locked and cannot be deleted by employees.");
//           return;
//       }

//       showConfirm(
//           "Delete Project?",
//           role === 'Admin' ? 
//             "⚠️ ADMIN OVERRIDE: Delete this project and ALL sub-tasks? This cannot be undone." : 
//             "Permanently delete this project? This cannot be undone.",
//           async () => {
//               await axios.delete(`http://localhost:8000/api/tasks/${id}`);
//               refreshData();
//               setModal({ type: 'NONE' });
//           }
//       );
//   }

//   // 2. PUNCH CLOCK
//   const handlePunchClick = (type: "in" | "out") => {
//       showConfirm(`Confirm Punch ${type.toUpperCase()}`, `Mark attendance now?`, async () => {
//           try {
//             await axios.post(`http://localhost:8000/api/punch-${type}/${username}`);
//             refreshData();
//             setModal({ type: 'NONE' });
//             // Optional success toast here
//           } catch(e) {
//             showAlert("Error", "Failed to connect to server.");
//           }
//       });
//   };

//   // 3. ADD ROOT PHASE
//   const handleAddRootPhaseClick = () => {
//       showInput("Add New Phase", "Enter phase name:", async () => {
//           if(!modalInput.trim()) return;
//           await axios.post("http://localhost:8000/api/tasks/subtask", {
//               parent_id: selectedTask.id, task_name: modalInput, allocated_hours: 1.0 
//           });
//           refreshLightbox(selectedTask.id);
//           refreshData();
//           setModal({ type: 'NONE' });
//       });
//   };

//   // 4. RECURSIVE DELETE
//   const handleRecursiveDelete = (id: number) => {
//       if (role !== 'Admin' && selectedTask.status === 'Done') {
//          showAlert("Locked", "Cannot delete items in a completed project.");
//          return;
//       }
//       showConfirm("Delete Item?", "Remove this item and its sub-items?", async () => {
//           await axios.delete(`http://localhost:8000/api/tasks/${id}`);
//           refreshLightbox(selectedTask.id);
//           refreshData();
//           setModal({ type: 'NONE' });
//       });
//   };

//   const handleRecursiveAdd = async (parentId: number, name: string) => {
//     await axios.post("http://localhost:8000/api/tasks/subtask", {
//       parent_id: parentId, task_name: name, allocated_hours: 1.0 
//     });
//     refreshLightbox(selectedTask.id);
//     refreshData(); 
//   };

//   const handleStatusUpdate = async (id: number, currentStatus: string) => {
//     // Admin can toggle status even if Done. Employee cannot.
//     if (role !== 'Admin' && currentStatus === "Done") return; 
    
//     let next = "To Do";
//     if(currentStatus === "To Do") next = "In Progress";
//     else if(currentStatus === "In Progress") next = "Done";
//     else if(currentStatus === "Done" && role === "Admin") next = "In Progress"; // Admin Re-open logic

//     await axios.post(`http://localhost:8000/api/tasks/${id}/status?status=${next}`);
//     if (selectedTask) refreshLightbox(selectedTask.id);
//     refreshData();
//   };

//   const openTaskDetails = async (taskId: number) => {
//     try {
//       const res = await axios.get(`http://localhost:8000/api/tasks/${taskId}`);
//       setSelectedTask(res.data);
//     } catch (e) { showAlert("Error", "Could not load task details"); }
//   };

//   // --- SUB COMPONENTS ---

//   const StatusBadge = ({ status, onClick }: any) => {
//     const isDone = status === 'Done';
//     const canClick = !isDone || role === 'Admin'; // Admin can click completed items

//     return (
//         <button 
//         onClick={(e) => { e.stopPropagation(); if(canClick && onClick) onClick(); }}
//         disabled={!canClick}
//         className={`
//             px-2 py-1 rounded text-[10px] font-bold border flex items-center gap-1.5 transition-all
//             ${isDone ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800' : 
//             status === 'In Progress' ? 'bg-blue-900/30 text-blue-400 border-blue-800 hover:bg-blue-900/50' : 
//             'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}
//             ${!canClick ? 'cursor-not-allowed' : 'cursor-pointer'}
//         `}
//         >
//         {isDone ? <Lock size={10}/> : status === 'In Progress' ? <Loader2 size={10} className="animate-spin"/> : <Circle size={10}/>}
//         {status.toUpperCase()}
//         </button>
//     );
//   };

//   const GlobalModal = () => {
//       if (modal.type === 'NONE') return null;
//       return (
//           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
//               <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
//                   <div className="flex items-center gap-3">
//                       <div className={`p-3 rounded-full ${modal.type === 'ALERT' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
//                           {modal.type === 'ALERT' ? <AlertTriangle size={24} /> : modal.type === 'INPUT' ? <Plus size={24} /> : <AlertCircle size={24} />}
//                       </div>
//                       <h3 className="text-lg font-bold text-white">{modal.title}</h3>
//                   </div>
//                   <p className="text-slate-400 text-sm leading-relaxed">{modal.message}</p>
//                   {modal.type === 'INPUT' && (
//                       <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
//                           placeholder="Type here..." autoFocus value={modalInput} onChange={(e) => setModalInput(e.target.value)}
//                           onKeyDown={(e) => e.key === 'Enter' && modal.action && modal.action()}
//                       />
//                   )}
//                   <div className="flex gap-3 justify-end mt-2">
//                       <button onClick={() => setModal({ type: 'NONE' })} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition">
//                           {modal.type === 'ALERT' ? 'Close' : 'Cancel'}
//                       </button>
//                       {modal.type !== 'ALERT' && (
//                           <button onClick={() => modal.action && modal.action()} className={`px-4 py-2 rounded-lg text-sm font-bold text-white transition shadow-lg ${modal.type === 'CONFIRM' ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
//                               {modal.type === 'CONFIRM' ? 'Confirm' : 'Submit'}
//                           </button>
//                       )}
//                   </div>
//               </div>
//           </div>
//       );
//   };

//   const TaskLightbox = () => {
//       if (!selectedTask) return null;
//       const isProjectDone = selectedTask.status === 'Done';
//       // Admin can always edit, Employees cannot edit Done projects
//       const canEdit = role === 'Admin' || !isProjectDone;

//       return (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSelectedTask(null)}>
//           <div className="bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
//             <div className="p-6 border-b border-slate-800 flex justify-between items-start">
//                <div className="flex-1">
//                   <div className="flex items-center gap-3 mb-2">
//                      <span className="text-xs text-slate-500 font-mono uppercase">PROJECT #{selectedTask.id}</span>
//                      <StatusBadge status={selectedTask.status} onClick={() => handleStatusUpdate(selectedTask.id, selectedTask.status)} />
//                   </div>
//                   <h2 className={`text-2xl font-bold ${isProjectDone ? 'text-slate-400 line-through' : 'text-white'}`}>{selectedTask.task_name}</h2>
//                </div>
//                <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><X size={24}/></button>
//             </div>
//             <div className="p-6 overflow-y-auto flex-1">
//                <div className="mb-8">
//                   <div className="flex justify-between text-xs text-slate-400 mb-2">
//                     <span className="font-bold uppercase">Overall Progress</span>
//                     <span>{selectedTask.progress}%</span>
//                   </div>
//                   <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
//                      <div className={`h-full transition-all duration-500 ${isProjectDone ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${selectedTask.progress || 0}%` }}></div>
//                   </div>
//                </div>
//                <div className="mb-8">
//                   <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Description</h4>
//                   <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-slate-300 text-sm">
//                      {selectedTask.description || "No description provided."}
//                   </div>
//                </div>
//                <div>
//                   <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 pl-4">Work Breakdown</h4>
//                   <div className="space-y-1">
//                      {selectedTask.subtasks && selectedTask.subtasks.map((sub: any) => (
//                         <TaskTree 
//                            key={sub.id} 
//                            task={sub} 
//                            onUpdateStatus={handleStatusUpdate}
//                            onDelete={handleRecursiveDelete}
//                            onAddSubtask={handleRecursiveAdd}
//                         />
//                      ))}
//                      {canEdit && (
//                         <div className="ml-8 mt-4">
//                             <button onClick={handleAddRootPhaseClick} className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition">
//                             <Plus size={16}/> Add Main Phase
//                             </button>
//                         </div>
//                      )}
//                      {!canEdit && (
//                          <div className="mt-6 p-4 bg-emerald-900/10 border border-emerald-900/30 rounded-xl flex items-center justify-center gap-2 text-emerald-500 text-sm">
//                              <Lock size={16} /> Project is complete (Read-Only).
//                          </div>
//                      )}
//                   </div>
//                </div>
//             </div>
//           </div>
//         </div>
//       );
//   };

//   if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Loading Dashboard...</div>;

//   return (
//     <div className="min-h-screen bg-slate-950 p-8 text-slate-200">
//         <GlobalModal />
        
//         {/* EMPLOYEE VIEW */}
//         {role === "Employee" && (
//             <div className="max-w-5xl mx-auto space-y-8">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//                     <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl flex flex-col items-center text-center justify-center">
//                         <div className="h-16 w-16 bg-slate-950 rounded-full flex items-center justify-center mb-4 border border-slate-800 shadow-inner relative">
//                         <Fingerprint size={32} className={employeeStatus === 'working' ? "text-green-500 animate-pulse" : "text-blue-500"} />
//                         {employeeStatus === 'working' && <span className="absolute top-0 right-0 h-3 w-3 bg-green-500 rounded-full animate-ping"></span>}
//                         </div>
//                         <h1 className="text-xl font-bold text-white">Hello, {username}</h1>
//                         <p className="text-slate-400 text-xs mt-1 uppercase tracking-wider mb-6">
//                         {employeeStatus === 'working' ? "🟢 Shift Active" : "⚪ Off Duty"}
//                         </p>
//                         <div className="flex gap-3 w-full">
//                         <button onClick={() => handlePunchClick("in")} disabled={employeeStatus !== 'not_started'} className="flex-1 py-2 rounded-lg font-bold text-xs bg-green-600 hover:bg-green-500 disabled:opacity-20 text-white transition">PUNCH IN</button>
//                         <button onClick={() => handlePunchClick("out")} disabled={employeeStatus !== 'working'} className="flex-1 py-2 rounded-lg font-bold text-xs bg-red-600 hover:bg-red-500 disabled:opacity-20 text-white transition">PUNCH OUT</button>
//                         </div>
//                     </div>
//                     <div className="grid grid-rows-2 gap-4">
//                         <KPICard title="My Pending Tasks" value={myTasks.filter(t => t.status !== 'Done').length} icon={AlertCircle} color="text-yellow-400" bg="bg-yellow-400/10" />
//                         <KPICard title="Completed Today" value={myTasks.filter(t => t.status === 'Done').length} icon={CheckCircle2} color="text-green-400" bg="bg-green-400/10" />
//                     </div>
//                 </div>
//                 <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
//                     <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6"><Briefcase className="text-blue-500" size={20}/> My Assignments</h3>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     {myTasks.length === 0 ? <div className="col-span-full text-center py-12 text-slate-500 bg-slate-950/30 rounded-xl border border-slate-800/50 border-dashed">No tasks assigned.</div> : 
//                         myTasks.map((task) => (
//                         <div key={task.id} onClick={() => openTaskDetails(task.id)} className={`bg-slate-900 p-5 rounded-xl border border-slate-800 cursor-pointer transition group relative overflow-hidden ${task.status === 'Done' ? 'opacity-60 hover:opacity-100' : 'hover:border-blue-500/50'}`}>
//                             <div className="absolute top-0 left-0 w-1 h-full bg-slate-800">
//                                 <div className={`w-full transition-all duration-700 ${task.status === 'Done' ? 'bg-emerald-500 h-full' : 'bg-blue-500'}`} style={{ height: `${task.progress}%` }}></div>
//                             </div>
//                             <div className="flex justify-between items-start mb-2 pl-2">
//                             <StatusBadge status={task.status} onClick={() => handleStatusUpdate(task.id, task.status)} />
//                             <span className="text-[10px] text-slate-500 font-mono">#{task.id}</span>
//                             </div>
//                             <h4 className="font-bold text-white text-lg mb-1 pl-2">{task.task_name}</h4>
//                             <div className="flex items-center gap-3 text-xs text-slate-500 pl-2">
//                             <span className="flex items-center gap-1"><Clock size={12}/> {task.allocated_hours}h</span>
//                             <span className="text-blue-400 opacity-0 group-hover:opacity-100 transition">View Details →</span>
//                             </div>
//                         </div>
//                         ))}
//                     </div>
//                 </div>
//             </div>
//         )}

//         {/* ADMIN VIEW */}
//         {role === "Admin" && (
//             <div className="max-w-7xl mx-auto">
//                 <div className="mb-8"><h1 className="text-2xl font-bold text-white">Admin Dashboard</h1></div>
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//                     <KPICard title="Total Employees" value={adminData?.total_staff || 0} icon={Users} color="text-blue-400" bg="bg-blue-400/10" />
//                     <KPICard title="Active Today" value={adminData?.active_today || 0} icon={Zap} color="text-emerald-400" bg="bg-emerald-400/10" />
//                     <KPICard title="Avg Daily Hours" value={adminData?.avg_hours || "0.0"} icon={Clock} color="text-violet-400" bg="bg-violet-400/10" />
//                     <KPICard title="Pending Actions" value="3" icon={AlertCircle} color="text-rose-400" bg="bg-rose-400/10" />
//                 </div>
//                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
//                     <div className="lg:col-span-2 bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg flex flex-col">
//                         <h3 className="font-semibold text-white mb-6 flex items-center gap-2"><Layout size={18} className="text-blue-500"/> Weekly Trend</h3>
//                         <div className="h-72 w-full flex-1">
//                             {(adminData?.weekly_trend?.some((day: any) => day.present > 0)) ? (
//                             <ResponsiveContainer width="100%" height="100%">
//                                 <BarChart data={adminData?.weekly_trend || []}><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} /><XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} /><YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} /><Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }} /><Bar dataKey="present" radius={[4, 4, 0, 0]} barSize={40}>{(adminData?.weekly_trend || []).map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.name === new Date().toLocaleDateString('en-US', {weekday: 'short'}) ? '#3b82f6' : '#475569'} />)}</Bar></BarChart>
//                             </ResponsiveContainer>
//                             ) : <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-slate-950/30 rounded-lg border border-slate-800/50 border-dashed"><BarChartIcon size={32} className="mb-2 opacity-50"/><p className="text-sm">No recent data</p></div>}
//                         </div>
//                     </div>
//                     <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg flex flex-col h-full">
//                         <h3 className="font-semibold text-white mb-6 flex items-center gap-2"><Trophy size={18} className="text-yellow-500"/> Top Staff</h3>
//                         <div className="flex-1 overflow-y-auto space-y-4 max-h-[300px]">
//                             {adminData?.leaderboard?.map((emp: any, index: number) => (
//                                 <div key={index} className="flex justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800/50">
//                                     <span className="text-sm font-medium text-slate-200">{emp.employee_name}</span>
//                                     <span className="font-mono text-sm font-bold text-blue-400">{emp.total_hours.toFixed(1)}h</span>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//                 </div>

//                 <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
//                     <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6"><Briefcase className="text-blue-500" size={20}/> All Active Projects</h3>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     {myTasks.length === 0 ? <div className="col-span-full text-center py-8 text-slate-500 bg-slate-950/30 rounded-xl border border-slate-800/50 border-dashed">No active projects found.</div> : 
//                         myTasks.map((task) => (
//                         <div key={task.id} onClick={() => openTaskDetails(task.id)} className={`bg-slate-900 p-5 rounded-xl border border-slate-800 cursor-pointer transition group ${task.status === 'Done' ? 'opacity-60' : 'hover:border-blue-500/50'}`}>
//                             <div className="flex justify-between items-start mb-2">
//                             <StatusBadge status={task.status} onClick={() => handleStatusUpdate(task.id, task.status)} />
//                             <div className="flex items-center gap-2">
//                                 <span className="text-[10px] text-slate-500 font-mono">#{task.id}</span>
//                                 <button onClick={(e) => handleDeleteMainTask(e, task.id, task.status)} className={`text-slate-600 p-1 rounded transition ${task.status === 'Done' && role !== 'Admin' ? 'cursor-not-allowed opacity-30' : 'hover:text-red-500 hover:bg-slate-800'}`} title="Delete Project"><Trash2 size={14} /></button>
//                             </div>
//                             </div>
//                             <h4 className="font-bold text-white text-lg mb-1">{task.task_name}</h4>
//                             <div className="flex justify-between items-center mt-2">
//                                 <span className="text-xs text-slate-500 flex items-center gap-1"><Users size={12}/> {task.employee_name}</span>
//                                 <span className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition">Manage Subtasks →</span>
//                             </div>
//                         </div>
//                         ))}
//                     </div>
//                 </div>
//             </div>
//         )}
//         <TaskLightbox />
//     </div>
//   );
// }


"use client";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import KPICard from "@/components/KPICard";
import TaskTree from "@/components/TaskTree";
import { 
  Users, Clock, Zap, AlertCircle, Fingerprint, Trophy, 
  Briefcase, CheckCircle2, Circle, X, Plus, Trash2, Layout, 
  Loader2, Lock, AlertTriangle, MessageSquare, History, Tag, 
  Flame, ChevronRight
} from "lucide-react";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, Legend 
} from 'recharts';

// --- TYPES ---
interface Task {
  id: number;
  task_key: string;
  task_name: string;
  description?: string;
  employee_name: string;
  allocated_hours: number;
  status: "To Do" | "In Progress" | "Done";
  priority: "Highest" | "High" | "Medium" | "Low" | "Lowest";
  task_type: "Task" | "Bug" | "Story" | "Epic";
  story_points: number;
  progress?: number;
  subtasks?: Task[];
  comments?: any[];
  history?: any[];
  time_logs?: any[];
  labels?: string;
  time_spent?: number;
}

export default function Dashboard() {
  const [role, setRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Data States
  const [adminData, setAdminData] = useState<any>(null);
  const [employeeStatus, setEmployeeStatus] = useState("not_started");
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [burndownData, setBurndownData] = useState<any[]>([]);
  
  // UI States
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'history'>('details');
  const [newComment, setNewComment] = useState("");

  // --- MODAL STATE ---
  const [modal, setModal] = useState<{
    type: 'NONE' | 'CONFIRM' | 'INPUT' | 'ALERT';
    title?: string;
    message?: string;
    action?: () => Promise<void> | void;
    inputValue?: string;
  }>({ type: 'NONE' });
  const [modalInput, setModalInput] = useState("");

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    const storedName = localStorage.getItem("username");
    setRole(storedRole);
    setUsername(storedName || "");

    if (storedRole === "Admin") fetchAdminData();
    else if (storedRole === "Employee" && storedName) fetchEmployeeData(storedName);
    else setLoading(false);
  }, []);

  // --- API CALLS ---

  const refreshLightbox = async (id: number) => {
      try {
        const detailRes = await axios.get(`http://localhost:8000/api/tasks/${id}`);
        setSelectedTask(detailRes.data);
      } catch (e) { console.error(e); }
  };

  const fetchAdminData = async () => {
    try {
        const [overviewRes, tasksRes, sprintsRes] = await Promise.all([
            axios.get("http://127.0.0.1:8000/api/overview"),
            axios.get("http://localhost:8000/api/tasks/hierarchy"),
            axios.get("http://localhost:8000/api/sprints")
        ]);
        setAdminData(overviewRes.data);
        setMyTasks(tasksRes.data);

        // Fetch burndown if active sprint exists
        if (sprintsRes.data.length > 0) {
             const activeSprint = sprintsRes.data.find((s: any) => s.status === 'Active') || sprintsRes.data[0];
             if(activeSprint) {
                 const bdRes = await axios.get(`http://localhost:8000/api/sprints/${activeSprint.id}/burndown`);
                 setBurndownData(bdRes.data);
             }
        }
        
        if (selectedTask) refreshLightbox(selectedTask.id);
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
      if (selectedTask) refreshLightbox(selectedTask.id);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const refreshData = () => {
      if (role === 'Admin') fetchAdminData();
      else fetchEmployeeData(username);
  };

  // --- MODAL HELPERS ---
  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
      setModal({ type: 'CONFIRM', title, message, action: onConfirm });
  };
  const showAlert = (title: string, message: string) => {
      setModal({ type: 'ALERT', title, message });
  };
  const showInput = (title: string, message: string, onSubmit: () => void) => {
      setModalInput(""); 
      setModal({ type: 'INPUT', title, message, action: onSubmit });
  };

  // --- ACTIONS ---

  const handleDeleteMainTask = (e: React.MouseEvent, id: number, status: string) => {
      e.stopPropagation();
      if (role !== 'Admin' && status === 'Done') {
          showAlert("Locked", "Completed tasks cannot be deleted by employees. Contact Admin.");
          return;
      }
      showConfirm(
          "Delete Project?",
          role === 'Admin' ? "⚠️ ADMIN: Delete this project and ALL history?" : "Permanently delete this project?",
          async () => {
              await axios.delete(`http://localhost:8000/api/tasks/${id}?user=${username}`);
              refreshData();
              setModal({ type: 'NONE' });
          }
      );
  }

  const handlePunchClick = (type: "in" | "out") => {
      showConfirm(`Confirm Punch ${type.toUpperCase()}`, `Mark attendance now?`, async () => {
          try {
            await axios.post(`http://localhost:8000/api/punch-${type}/${username}`);
            refreshData();
            setModal({ type: 'NONE' });
          } catch(e) { showAlert("Error", "Connection failed."); }
      });
  };

  const handleAddRootPhaseClick = () => {
      showInput("New Phase", "Enter phase name:", async () => {
          if(!modalInput.trim() || !selectedTask) return;
          await axios.post("http://localhost:8000/api/tasks/subtask", {
              parent_id: selectedTask.id, task_name: modalInput, allocated_hours: 1.0 
          });
          refreshLightbox(selectedTask.id);
          refreshData();
          setModal({ type: 'NONE' });
      });
  };

  const handleAddComment = async () => {
      if(!newComment.trim() || !selectedTask) return;
      await axios.post(`http://localhost:8000/api/tasks/${selectedTask.id}/comments`, {
          username: username, comment: newComment
      });
      setNewComment("");
      refreshLightbox(selectedTask.id);
  };

  // RECURSIVE HANDLERS
  const handleRecursiveAdd = async (parentId: number, name: string) => {
    await axios.post("http://localhost:8000/api/tasks/subtask", {
      parent_id: parentId, task_name: name, allocated_hours: 1.0 
    });
    if(selectedTask) refreshLightbox(selectedTask.id);
    refreshData(); 
  };

  const handleRecursiveDelete = async (id: number) => {
    if (role !== 'Admin' && selectedTask?.status === 'Done') {
        showAlert("Locked", "Project is complete."); return;
    }
    showConfirm("Delete Item?", "Remove this item?", async () => {
        await axios.delete(`http://localhost:8000/api/tasks/${id}?user=${username}`);
        if(selectedTask) refreshLightbox(selectedTask.id);
        refreshData();
        setModal({ type: 'NONE' });
    });
  };

  const handleStatusUpdate = async (id: number, currentStatus: string) => {
    if (role !== 'Admin' && currentStatus === "Done") return;
    
    let next = "To Do";
    if(currentStatus === "To Do") next = "In Progress";
    else if(currentStatus === "In Progress") next = "Done";
    else if(currentStatus === "Done" && role === "Admin") next = "In Progress";

    await axios.post(`http://localhost:8000/api/tasks/${id}/status?status=${next}&user=${username}`);
    if (selectedTask) refreshLightbox(selectedTask.id);
    refreshData();
  };

  const openTaskDetails = async (taskId: number) => {
    try {
      const res = await axios.get(`http://localhost:8000/api/tasks/${taskId}`);
      setSelectedTask(res.data);
      setActiveTab('details'); // Reset tab to details
    } catch (e) { showAlert("Error", "Could not load task details"); }
  };

  // --- SUB COMPONENTS ---

  const StatusBadge = ({ status, onClick }: any) => {
    const isDone = status === 'Done';
    const canClick = !isDone || role === 'Admin';
    return (
        <button 
        onClick={(e) => { e.stopPropagation(); if(canClick && onClick) onClick(); }}
        disabled={!canClick}
        className={`
            px-2 py-1 rounded text-[10px] font-bold border flex items-center gap-1.5 transition-all
            ${isDone ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800' : 
            status === 'In Progress' ? 'bg-blue-900/30 text-blue-400 border-blue-800 hover:bg-blue-900/50' : 
            'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}
            ${!canClick ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}
        `}
        >
        {isDone ? <CheckCircle2 size={10}/> : status === 'In Progress' ? <Loader2 size={10} className="animate-spin"/> : <Circle size={10}/>}
        {status.toUpperCase()}
        </button>
    );
  };

  const PriorityBadge = ({ level }: { level: string }) => {
      const colors: any = { 'Highest': 'text-red-500', 'High': 'text-orange-500', 'Medium': 'text-yellow-500', 'Low': 'text-blue-400', 'Lowest': 'text-slate-400' };
      return <span className={`text-[10px] font-bold ${colors[level] || 'text-slate-400'}`}>{level?.toUpperCase()}</span>
  };

  const GlobalModal = () => {
      if (modal.type === 'NONE') return null;
      return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-full ${modal.type === 'ALERT' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                          {modal.type === 'ALERT' ? <AlertTriangle size={24} /> : modal.type === 'INPUT' ? <Plus size={24} /> : <AlertCircle size={24} />}
                      </div>
                      <h3 className="text-lg font-bold text-white">{modal.title}</h3>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">{modal.message}</p>
                  {modal.type === 'INPUT' && (
                      <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Type here..." autoFocus value={modalInput} onChange={(e) => setModalInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && modal.action && modal.action()}
                      />
                  )}
                  <div className="flex gap-3 justify-end mt-2">
                      <button onClick={() => setModal({ type: 'NONE' })} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition">Cancel</button>
                      {modal.type !== 'ALERT' && (
                          <button onClick={() => modal.action && modal.action()} className={`px-4 py-2 rounded-lg text-sm font-bold text-white transition shadow-lg ${modal.type === 'CONFIRM' ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}>Confirm</button>
                      )}
                  </div>
              </div>
          </div>
      );
  };

  const TaskLightbox = () => {
      if (!selectedTask) return null;
      const isProjectDone = selectedTask.status === 'Done';
      const canEdit = role === 'Admin' || !isProjectDone;

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSelectedTask(null)}>
          <div className="bg-slate-900 w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl border border-slate-800 flex overflow-hidden" onClick={e => e.stopPropagation()}>
            
            {/* LEFT COLUMN: Main Structure */}
            <div className="w-2/3 flex flex-col border-r border-slate-800">
                <div className="p-6 border-b border-slate-800 flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-xs font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800">{selectedTask.task_key || `#${selectedTask.id}`}</span>
                            <StatusBadge status={selectedTask.status} onClick={() => handleStatusUpdate(selectedTask.id, selectedTask.status)} />
                            <PriorityBadge level={selectedTask.priority} />
                        </div>
                        <h2 className={`text-2xl font-bold ${isProjectDone ? 'text-slate-400 line-through' : 'text-white'}`}>{selectedTask.task_name}</h2>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="mb-8">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Description</h4>
                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-slate-300 text-sm leading-relaxed">
                            {selectedTask.description || "No description provided."}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase">Work Breakdown</h4>
                            <span className="text-xs text-slate-500">{selectedTask.progress}% Done</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full mb-6 overflow-hidden">
                            <div className={`h-full transition-all duration-500 ${isProjectDone ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${selectedTask.progress || 0}%` }}></div>
                        </div>
                        <div className="space-y-1">
                            {selectedTask.subtasks && selectedTask.subtasks.map((sub: any) => (
                                <TaskTree 
                                    key={sub.id} task={sub} role={role} 
                                    onUpdateStatus={handleStatusUpdate} onDelete={handleRecursiveDelete} onAddSubtask={handleRecursiveAdd}
                                />
                            ))}
                            {canEdit && (
                                <div className="ml-8 mt-4">
                                    <button onClick={handleAddRootPhaseClick} className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition uppercase tracking-wide">
                                        <Plus size={14}/> Add Phase / Task
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Meta & Tabs */}
            <div className="w-1/3 flex flex-col bg-slate-950/50">
                <div className="flex border-b border-slate-800">
                    <button onClick={() => setActiveTab('details')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider ${activeTab === 'details' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500 hover:text-white'}`}>Details</button>
                    <button onClick={() => setActiveTab('comments')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider ${activeTab === 'comments' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500 hover:text-white'}`}>Comments</button>
                    <button onClick={() => setActiveTab('history')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider ${activeTab === 'history' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500 hover:text-white'}`}>History</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {/* DETAILS TAB */}
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Assignee</h4>
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-blue-900/50 border border-blue-800 flex items-center justify-center text-blue-400 font-bold">{selectedTask.employee_name.charAt(0)}</div>
                                    <span className="text-sm text-slate-200">{selectedTask.employee_name}</span>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Story Points</h4>
                                <div className="inline-flex items-center px-3 py-1 bg-slate-900 border border-slate-800 rounded text-sm text-slate-300">
                                    <Trophy size={14} className="mr-2 text-yellow-500"/> {selectedTask.story_points || 0}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Labels</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedTask.labels ? selectedTask.labels.split(',').map((l:string) => (
                                        <span key={l} className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-[10px] text-slate-400 flex items-center gap-1"><Tag size={10}/> {l}</span>
                                    )) : <span className="text-xs text-slate-600">No labels</span>}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Time Tracking</h4>
                                <div className="bg-slate-900 p-4 rounded border border-slate-800">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs text-slate-400">Logged</span>
                                        <span className="text-sm font-mono text-white">{selectedTask.time_spent || 0}h</span>
                                    </div>
                                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500" style={{ width: `${Math.min(((selectedTask.time_spent || 0) / selectedTask.allocated_hours) * 100, 100)}%` }}></div>
                                    </div>
                                    <div className="mt-2 text-[10px] text-slate-500 text-right">of {selectedTask.allocated_hours}h allocated</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* COMMENTS TAB */}
                    {activeTab === 'comments' && (
                        <div className="flex flex-col h-full">
                            <div className="flex-1 space-y-4 mb-4">
                                {selectedTask.comments?.length === 0 ? <p className="text-slate-600 text-xs text-center py-4">No comments yet.</p> :
                                selectedTask.comments?.map((c: any) => (
                                    <div key={c.id} className="bg-slate-900 p-3 rounded border border-slate-800">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-blue-400">{c.username}</span>
                                            <span className="text-[10px] text-slate-600">{new Date(c.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-slate-300">{c.comment}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-auto">
                                <textarea 
                                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-sm text-white focus:border-blue-500 outline-none"
                                    placeholder="Add a comment..."
                                    rows={3}
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                />
                                <button onClick={handleAddComment} className="mt-2 w-full bg-blue-600 hover:bg-blue-500 text-white py-1.5 rounded text-xs font-bold transition">Post Comment</button>
                            </div>
                        </div>
                    )}

                    {/* HISTORY TAB */}
                    {activeTab === 'history' && (
                        <div className="space-y-4">
                            {selectedTask.history?.map((h: any, i: number) => (
                                <div key={i} className="flex gap-3 pb-4 border-b border-slate-800/50 last:border-0">
                                    <div className="mt-1"><History size={12} className="text-slate-500"/></div>
                                    <div>
                                        <p className="text-xs text-slate-300"><span className="font-bold text-blue-400">{h.changed_by}</span> {h.description}</p>
                                        <p className="text-[10px] text-slate-600 mt-1">{new Date(h.changed_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            <button onClick={() => setSelectedTask(null)} className="absolute top-4 right-4 bg-slate-900 hover:bg-slate-800 p-2 rounded-full border border-slate-700 text-slate-400 transition z-50">
                <X size={20}/>
            </button>
          </div>
        </div>
      );
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-500 gap-4"><Loader2 className="animate-spin" size={32} /><p className="text-sm tracking-wider">LOADING WORKSPACE...</p></div>;

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-200">
        <GlobalModal />
        
        {/* EMPLOYEE VIEW */}
        {role === "Employee" && (
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Punch Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl flex flex-col items-center text-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-700"></div>
                        <div className={`h-20 w-20 rounded-full flex items-center justify-center mb-6 border-2 transition-all duration-500 ${employeeStatus === 'working' ? 'border-green-500/50 bg-green-500/10 shadow-[0_0_30px_rgba(34,197,94,0.2)]' : 'border-slate-800 bg-slate-950'}`}>
                            <Fingerprint size={40} className={employeeStatus === 'working' ? "text-green-500 animate-pulse" : "text-slate-600"} />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-1">Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}, {username}</h1>
                        <p className="text-slate-500 text-xs uppercase tracking-widest font-bold mb-8 flex items-center gap-2">
                            {employeeStatus === 'working' ? <><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> Currently Working</> : <><span className="w-2 h-2 bg-slate-600 rounded-full"/> Off Duty</>}
                        </p>
                        <div className="flex gap-4 w-full max-w-xs z-10">
                            <button onClick={() => handlePunchClick("in")} disabled={employeeStatus !== 'not_started'} className="flex-1 py-3 rounded-xl font-bold text-xs bg-green-600 hover:bg-green-500 disabled:opacity-20 disabled:cursor-not-allowed text-white transition shadow-lg shadow-green-900/20">PUNCH IN</button>
                            <button onClick={() => handlePunchClick("out")} disabled={employeeStatus !== 'working'} className="flex-1 py-3 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-500 disabled:opacity-20 disabled:cursor-not-allowed text-white transition shadow-lg shadow-red-900/20">PUNCH OUT</button>
                        </div>
                    </div>

                    {/* KPI Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <KPICard title="Pending Tasks" value={myTasks.filter(t => t.status !== 'Done').length} icon={AlertCircle} color="text-yellow-400" bg="bg-yellow-400/10" />
                        <KPICard title="Done Today" value={myTasks.filter(t => t.status === 'Done').length} icon={CheckCircle2} color="text-green-400" bg="bg-green-400/10" />
                        <KPICard title="Total Hours" value="0.0" icon={Clock} color="text-blue-400" bg="bg-blue-400/10" />
                        <KPICard title="Story Points" value={myTasks.reduce((acc, t) => acc + (t.story_points || 0), 0)} icon={Trophy} color="text-purple-400" bg="bg-purple-400/10" />
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6"><Briefcase className="text-blue-500" size={20}/> My Assignments</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myTasks.length === 0 ? <div className="col-span-full text-center py-16 text-slate-500 bg-slate-950/50 rounded-xl border border-slate-800/50 border-dashed">No active tasks found. Enjoy your day!</div> : 
                        myTasks.map((task) => (
                        <div key={task.id} onClick={() => openTaskDetails(task.id)} className={`bg-slate-950 p-5 rounded-xl border border-slate-800 cursor-pointer transition group relative overflow-hidden ${task.status === 'Done' ? 'opacity-60 hover:opacity-100' : 'hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-900/5'}`}>
                            <div className="absolute top-0 left-0 w-1 h-full bg-slate-800">
                                <div className={`w-full transition-all duration-700 ${task.status === 'Done' ? 'bg-emerald-500 h-full' : 'bg-blue-500'}`} style={{ height: `${task.progress}%` }}></div>
                            </div>
                            <div className="flex justify-between items-start mb-2 pl-3">
                                <div className="flex gap-2">
                                    <StatusBadge status={task.status} onClick={() => handleStatusUpdate(task.id, task.status)} />
                                    <PriorityBadge level={task.priority} />
                                </div>
                                <span className="text-[10px] text-slate-600 font-mono">{task.task_key || `#${task.id}`}</span>
                            </div>
                            <h4 className="font-bold text-white text-lg mb-1 pl-3 truncate">{task.task_name}</h4>
                            <div className="flex items-center gap-4 text-xs text-slate-500 pl-3 mt-3">
                                <span className="flex items-center gap-1"><Clock size={12}/> {task.allocated_hours}h</span>
                                <span className="flex items-center gap-1"><MessageSquare size={12}/> {task.comments?.length || 0}</span>
                                <span className="ml-auto text-blue-400 opacity-0 group-hover:opacity-100 transition flex items-center gap-1">Open <ChevronRight size={12}/></span>
                            </div>
                        </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* ADMIN VIEW */}
        {role === "Admin" && (
            <div className="max-w-7xl mx-auto space-y-8">
                <div><h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1><p className="text-slate-400 mt-1">Overview of company performance & active projects</p></div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard title="Total Employees" value={adminData?.total_staff || 0} icon={Users} color="text-blue-400" bg="bg-blue-400/10" />
                    <KPICard title="Active Today" value={adminData?.active_today || 0} icon={Zap} color="text-emerald-400" bg="bg-emerald-400/10" />
                    <KPICard title="Avg Daily Hours" value={adminData?.avg_hours || "0.0"} icon={Clock} color="text-violet-400" bg="bg-violet-400/10" />
                    <KPICard title="Pending Tasks" value={myTasks.filter(t => t.status !== 'Done').length} icon={AlertCircle} color="text-rose-400" bg="bg-rose-400/10" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Burndown / Trend Chart */}
                    <div className="lg:col-span-2 bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg flex flex-col">
                        <h3 className="font-semibold text-white mb-6 flex items-center gap-2"><Flame size={18} className="text-orange-500"/> {burndownData.length > 0 ? "Sprint Burndown" : "Weekly Attendance Trend"}</h3>
                        <div className="h-80 w-full flex-1">
                            {burndownData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={burndownData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                        <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickFormatter={(str) => str.slice(5)} />
                                        <YAxis stroke="#64748b" fontSize={12} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                                        <Legend />
                                        <Line type="monotone" dataKey="ideal" stroke="#475569" strokeDasharray="5 5" name="Ideal Guideline" dot={false} />
                                        <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} name="Actual Remaining" />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
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
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg flex flex-col h-full">
                        <h3 className="font-semibold text-white mb-6 flex items-center gap-2"><Trophy size={18} className="text-yellow-500"/> Top Performers</h3>
                        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                            {adminData?.leaderboard?.map((emp: any, index: number) => (
                                <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-slate-950/50 border border-slate-800/50">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-slate-800 text-slate-500'}`}>#{index+1}</div>
                                        <span className="text-sm font-medium text-slate-200">{emp.employee_name}</span>
                                    </div>
                                    <span className="font-mono text-sm font-bold text-blue-400">{emp.total_hours.toFixed(1)}h</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6"><Briefcase className="text-blue-500" size={20}/> All Active Projects</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myTasks.length === 0 ? <div className="col-span-full text-center py-12 text-slate-500 bg-slate-950/30 rounded-xl border border-slate-800/50 border-dashed">No active projects found.</div> : 
                        myTasks.map((task) => (
                        <div key={task.id} onClick={() => openTaskDetails(task.id)} className={`bg-slate-900 p-5 rounded-xl border border-slate-800 cursor-pointer transition group relative overflow-hidden ${task.status === 'Done' ? 'opacity-60' : 'hover:border-blue-500/50'}`}>
                            <div className="flex justify-between items-start mb-2 pl-1">
                                <div className="flex gap-2">
                                    <StatusBadge status={task.status} onClick={() => handleStatusUpdate(task.id, task.status)} />
                                    <PriorityBadge level={task.priority} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-500 font-mono">{task.task_key || `#${task.id}`}</span>
                                    <button onClick={(e) => handleDeleteMainTask(e, task.id, task.status)} className="text-slate-600 p-1 rounded hover:text-red-500 hover:bg-slate-800 transition z-10" title="Delete Project"><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <h4 className="font-bold text-white text-lg mb-1 pl-1 truncate">{task.task_name}</h4>
                            <div className="flex justify-between items-center mt-3 pl-1">
                                <span className="text-xs text-slate-500 flex items-center gap-1"><Users size={12}/> {task.employee_name}</span>
                                <span className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition flex items-center gap-1">Manage <ChevronRight size={12}/></span>
                            </div>
                        </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
        <TaskLightbox />
    </div>
  );
}