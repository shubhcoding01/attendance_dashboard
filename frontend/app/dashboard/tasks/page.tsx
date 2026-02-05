// "use client";
// import { useEffect, useState, useCallback } from "react";
// import axios from "axios";
// import TaskTree from "@/components/TaskTree";
// import { 
//   Briefcase, Plus, CheckCircle2, Circle, Clock, 
//   User, X, Loader2, Layout, Trash2, Lock, AlertTriangle, AlertCircle,
//   Search, Filter, Trophy, Tag
// } from "lucide-react";

// // --- TYPES ---
// interface Task {
//   id: number;
//   task_key: string;
//   task_name: string;
//   description?: string;
//   employee_name: string;
//   allocated_hours: number;
//   status: "To Do" | "In Progress" | "Done";
//   priority: "Highest" | "High" | "Medium" | "Low" | "Lowest";
//   task_type: string;
//   story_points: number;
//   progress?: number;
//   subtasks?: Task[]; 
//   comments?: any[];
//   history?: any[];
//   time_spent?: number;
// }

// interface Staff {
//   name: string;
// }

// export default function TasksPage() {
//   const [tasks, setTasks] = useState<Task[]>([]);
//   const [staff, setStaff] = useState<Staff[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [role, setRole] = useState<string | null>(null);
//   const [username, setUsername] = useState<string>("");

//   // Filters
//   const [searchQuery, setSearchQuery] = useState("");
//   const [filterAssignee, setFilterAssignee] = useState("");

//   // Lightbox State
//   const [selectedTask, setSelectedTask] = useState<any>(null);
  
//   // Creation Form State
//   const [isCreateOpen, setIsCreateOpen] = useState(false);
//   const [newTask, setNewTask] = useState({ 
//       employee_name: "", task_name: "", description: "", allocated_hours: 2.0,
//       priority: "Medium", task_type: "Task", story_points: 0
//   });

//   // --- CUSTOM MODAL STATE ---
//   // Updated action signature to accept an optional input value
//   const [modal, setModal] = useState<{
//     type: 'NONE' | 'CONFIRM' | 'INPUT' | 'ALERT';
//     title?: string;
//     message?: string;
//     action?: (val?: string) => Promise<void> | void; 
//     inputValue?: string;
//   }>({ type: 'NONE' });

//   // Initialize
//   useEffect(() => { 
//       const r = localStorage.getItem("role");
//       const u = localStorage.getItem("username");
//       setRole(r);
//       setUsername(u || "");
//       if(r && u) fetchData(r, u); 
//       else if (r === 'Admin') fetchData('Admin', 'Admin'); // Fallback for pure admin testing
//   }, []);

//   // --- API FETCH (Strict Visibility Logic) ---
//   const fetchData = useCallback(async (currentRole?: string | null, currentUser?: string) => {
//     const r = currentRole || role;
//     const u = currentUser || username;

//     try {
//       const [resTasks, resStaff] = await Promise.all([
//         axios.get("http://localhost:8000/api/tasks/hierarchy"),
//         axios.get("http://localhost:8000/api/employees")
//       ]);

//       let allTasks = resTasks.data;

//       // 🔒 SECURITY: Filter for Employees
//       // Only show tasks where the Employee is the assignee
//       if (r === 'Employee') {
//           allTasks = allTasks.filter((t: Task) => t.employee_name === u);
//       }

//       setTasks(allTasks);
//       setStaff(resStaff.data);
      
//       // Update Lightbox if open to reflect new tree state
//       if (selectedTask) {
//         const freshDetail = await axios.get(`http://localhost:8000/api/tasks/${selectedTask.id}`);
//         setSelectedTask(freshDetail.data);
//       }
//     } catch (e) { 
//         console.error("Fetch Error:", e);
//     } 
//     finally { setLoading(false); }
//   }, [selectedTask, role, username]);

//   // --- MODAL HELPERS ---
//   const showConfirm = (title: string, message: string, onConfirm: () => void) => {
//       setModal({ type: 'CONFIRM', title, message, action: onConfirm });
//   };
//   const showAlert = (title: string, message: string) => {
//       setModal({ type: 'ALERT', title, message });
//   };
//   const showInput = (title: string, message: string, onSubmit: (val: string) => void) => {
//       setModal({ type: 'INPUT', title, message, action: (val) => onSubmit(val || "") });
//   };

//   // --- ACTIONS ---

//   const handleCreateTask = async () => {
//     // 🔒 Double Check: Only Admins can create root projects
//     if (role !== 'Admin') return;

//     if (!newTask.employee_name || !newTask.task_name) {
//         showAlert("Missing Fields", "Please select an assignee and enter a task summary.");
//         return;
//     }
//     try {
//         await axios.post("http://localhost:8000/api/tasks", { ...newTask, reporter: username });
//         setNewTask({ 
//             employee_name: "", task_name: "", description: "", allocated_hours: 2.0,
//             priority: "Medium", task_type: "Task", story_points: 0
//         });
//         setIsCreateOpen(false);
//         fetchData();
//     } catch(e) { showAlert("Error", "Failed to create task."); }
//   };

//   const handleDeleteMainTask = async (e: React.MouseEvent, id: number, status: string) => {
//     e.stopPropagation();
//     if (role !== 'Admin') {
//         showAlert("Access Denied", "Only Administrators can delete main projects.");
//         return;
//     }
//     showConfirm(
//         "Delete Project?",
//         "⚠️ ADMIN: Delete this project and ALL history?",
//         async () => {
//             await axios.delete(`http://localhost:8000/api/tasks/${id}?user=${username}`);
//             fetchData();
//             setModal({ type: 'NONE' });
//         }
//     );
//   };

//   const handleStatusUpdate = async (id: number, currentStatus: string) => {
//     // Permission check
//     if (role !== 'Admin' && currentStatus === "Done") return;

//     let next = "To Do";
//     if(currentStatus === "To Do") next = "In Progress";
//     else if(currentStatus === "In Progress") next = "Done";
//     else if(currentStatus === "Done" && role === "Admin") next = "In Progress";

//     await axios.post(`http://localhost:8000/api/tasks/${id}/status?status=${next}&user=${username}`);
//     // Refresh to update UI
//     if(selectedTask) {
//         const fresh = await axios.get(`http://localhost:8000/api/tasks/${selectedTask.id}`);
//         setSelectedTask(fresh.data);
//     }
//     fetchData();
//   };

//   // --- RECURSIVE ACTIONS ---

//   const handleAddRootPhaseClick = () => {
//       // 🔒 Permission: Only Admin OR Assignee (if not Done)
//       if (role !== 'Admin' && (selectedTask.employee_name !== username || selectedTask.status === 'Done')) {
//           showAlert("Permission Denied", "You cannot add sub-tasks to this project.");
//           return;
//       }

//       showInput("Add Phase/Task", "Enter name:", async (val) => {
//           if(!val.trim()) return;
//           try {
//             await axios.post("http://localhost:8000/api/tasks/subtask", {
//                 parent_id: selectedTask.id, task_name: val, allocated_hours: 1.0 
//             });
//             // Refresh lightbox
//             const res = await axios.get(`http://localhost:8000/api/tasks/${selectedTask.id}`);
//             setSelectedTask(res.data);
//             fetchData();
//             setModal({ type: 'NONE' });
//           } catch (e) {
//             showAlert("Error", "Failed to add subtask");
//           }
//       });
//   };

//   const handleRecursiveAdd = async (parentId: number, name: string) => {
//     await axios.post("http://localhost:8000/api/tasks/subtask", {
//         parent_id: parentId, task_name: name, allocated_hours: 1.0 
//     });
//     if(selectedTask) {
//         const res = await axios.get(`http://localhost:8000/api/tasks/${selectedTask.id}`);
//         setSelectedTask(res.data);
//     }
//     fetchData();
//   };

//   const handleRecursiveDelete = async (id: number) => {
//     // Permission logic handled inside TaskTree, but double check here
//     showConfirm("Delete Item?", "Remove this sub-task?", async () => {
//         await axios.delete(`http://localhost:8000/api/tasks/${id}?user=${username}`);
//         if(selectedTask) {
//             const res = await axios.get(`http://localhost:8000/api/tasks/${selectedTask.id}`);
//             setSelectedTask(res.data);
//         }
//         fetchData();
//         setModal({ type: 'NONE' });
//     });
//   };

//   const filteredTasks = tasks.filter(t => {
//       const matchSearch = t.task_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
//                           (t.task_key || "").toLowerCase().includes(searchQuery.toLowerCase());
//       const matchAssignee = filterAssignee ? t.employee_name === filterAssignee : true;
//       return matchSearch && matchAssignee;
//   });

//   // --- COMPONENT: STATUS BADGE ---
//   const StatusBadge = ({ status, onClick, size="sm" }: any) => {
//     const isDone = status === 'Done';
//     const canClick = !isDone || role === 'Admin';
//     return (
//         <button 
//         onClick={(e) => { e.stopPropagation(); if(canClick && onClick) onClick(); }}
//         disabled={!canClick}
//         className={`
//             ${size === 'lg' ? 'px-4 py-1.5 text-sm' : 'px-2 py-0.5 text-[10px]'} 
//             rounded-md font-bold border flex items-center gap-2 transition-all
//             ${isDone ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800' : 
//             status === 'In Progress' ? 'bg-blue-900/30 text-blue-400 border-blue-800 hover:bg-blue-900/50' : 
//             'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}
//             ${!canClick ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}
//         `}
//         >
//         {isDone ? <CheckCircle2 size={12}/> : status === 'In Progress' ? <Loader2 size={12} className="animate-spin"/> : <Circle size={12}/>}
//         {status.toUpperCase()}
//         </button>
//     );
//   };

//   // --- COMPONENT: GLOBAL MODAL (Updated) ---
//   const GlobalModal = () => {
//       const [localInput, setLocalInput] = useState("");
      
//       if (modal.type === 'NONE') return null;

//       const handleSubmit = () => {
//           if (modal.action) modal.action(localInput);
//           setLocalInput(""); // Reset
//       }

//       return (
//           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
//               <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
//                   <div className="flex items-center gap-3">
//                       <div className={`p-3 rounded-full ${modal.type === 'ALERT' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
//                           {modal.type === 'ALERT' ? <AlertTriangle size={24} /> : modal.type === 'INPUT' ? <Plus size={24} /> : <AlertCircle size={24} />}
//                       </div>
//                       <h3 className="text-lg font-bold text-white">{modal.title}</h3>
//                   </div>
//                   <p className="text-slate-400 text-sm leading-relaxed">{modal.message}</p>
                  
//                   {modal.type === 'INPUT' && (
//                       <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
//                           placeholder="Type here..." autoFocus 
//                           value={localInput} 
//                           onChange={(e) => setLocalInput(e.target.value)}
//                           onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
//                       />
//                   )}

//                   <div className="flex gap-3 justify-end mt-2">
//                       <button onClick={() => setModal({ type: 'NONE' })} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition">
//                           {modal.type === 'ALERT' ? 'Close' : 'Cancel'}
//                       </button>
//                       {modal.type !== 'ALERT' && (
//                           <button onClick={handleSubmit} className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition shadow-lg">Confirm</button>
//                       )}
//                   </div>
//               </div>
//           </div>
//       );
//   };

//   return (
//     <div className="min-h-screen bg-slate-950 p-8 text-slate-200">
//       <GlobalModal />

//       {/* HEADER */}
//       <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
//         <div>
//            <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
//              <Briefcase className="text-blue-500" /> Projects & Tasks
//            </h1>
//            <p className="text-slate-400 text-sm mt-1">Manage project lifecycles, sprints, and task breakdowns.</p>
//         </div>
        
//         {/* 🔒 SECURITY: Only Admin sees Create Project */}
//         {role === 'Admin' && (
//             <button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 transition">
//             <Plus size={18} /> New Project
//             </button>
//         )}
//       </div>

//       {/* FILTER BAR */}
//       <div className="max-w-7xl mx-auto bg-slate-900 p-4 rounded-xl border border-slate-800 mb-6 flex flex-col md:flex-row gap-4 items-center">
//           <div className="relative flex-1 w-full">
//               <Search className="absolute left-3 top-2.5 text-slate-500" size={18}/>
//               <input 
//                   className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 p-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
//                   placeholder="Search projects..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//               />
//           </div>
          
//           {/* Admin sees assignee filter, Employees don't need it (they only see theirs) */}
//           {role === 'Admin' && (
//               <div className="relative w-full md:w-64">
//                   <Filter className="absolute left-3 top-2.5 text-slate-500" size={18}/>
//                   <select 
//                       className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 p-2 text-sm text-slate-300 outline-none appearance-none cursor-pointer"
//                       value={filterAssignee}
//                       onChange={(e) => setFilterAssignee(e.target.value)}
//                   >
//                       <option value="">All Assignees</option>
//                       {staff.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
//                   </select>
//               </div>
//           )}
//       </div>

//       {/* PROJECTS LIST */}
//       <div className="max-w-7xl mx-auto space-y-4">
//           {loading ? (
//               <div className="text-center py-20 text-slate-500 flex flex-col items-center gap-2"><Loader2 className="animate-spin" size={32} /> Loading...</div>
//           ) : filteredTasks.length === 0 ? (
//               <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
//                   <p className="text-slate-500">No projects found.</p>
//               </div>
//           ) : (
//               filteredTasks.map(task => (
//                   <div key={task.id} onClick={() => setSelectedTask(task)} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-blue-500/50 hover:shadow-lg transition cursor-pointer group relative overflow-hidden">
//                       <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-800">
//                           <div className={`w-full transition-all duration-700 ${task.status === 'Done' ? 'bg-emerald-500 h-full' : 'bg-blue-500'}`} style={{ height: `${task.progress || 0}%` }}></div>
//                       </div>
//                       <div className="flex items-start justify-between pl-3">
//                           <div>
//                               <div className="flex items-center gap-3 mb-1">
//                                   <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">{task.task_key || `#${task.id}`}</span>
//                                   <h3 className={`text-lg font-bold ${task.status === 'Done' ? 'text-slate-500 line-through' : 'text-white'}`}>{task.task_name}</h3>
//                               </div>
//                               <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
//                                   <span className="flex items-center gap-1.5"><User size={12}/> {task.employee_name}</span>
//                                   <span className="flex items-center gap-1.5"><Clock size={12}/> {task.allocated_hours}h</span>
//                                   <span className="flex items-center gap-1.5 text-yellow-500"><Trophy size={12}/> {task.story_points} pts</span>
//                               </div>
//                           </div>
//                           {/* 🔒 SECURITY: Only Admin delete main projects */}
//                           {role === 'Admin' && (
//                               <button onClick={(e) => handleDeleteMainTask(e, task.id, task.status)} className="p-2 text-slate-600 hover:text-red-400 hover:bg-slate-950 rounded-lg transition">
//                                   <Trash2 size={16} />
//                               </button>
//                           )}
//                       </div>
//                   </div>
//               ))
//           )}
//       </div>

//       {/* --- CREATE MODAL (ADMIN ONLY) --- */}
//       {isCreateOpen && role === 'Admin' && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
//               <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl p-8 animate-in slide-in-from-bottom-4 duration-300">
//                   <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
//                       <h2 className="text-xl font-bold text-white flex items-center gap-2"><Layout size={20} className="text-blue-500"/> Create New Project</h2>
//                       <button onClick={() => setIsCreateOpen(false)}><X className="text-slate-500 hover:text-white" /></button>
//                   </div>
//                   <div className="grid grid-cols-2 gap-6">
//                       <div className="col-span-2">
//                           <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Project Summary</label>
//                           <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 transition" placeholder="e.g. Develop User Auth Module" value={newTask.task_name} onChange={e => setNewTask({...newTask, task_name: e.target.value})} />
//                       </div>
//                       <div>
//                           <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Assignee</label>
//                           <select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 transition cursor-pointer" value={newTask.employee_name} onChange={e => setNewTask({...newTask, employee_name: e.target.value})}>
//                               <option value="">Select Staff...</option>
//                               {staff.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
//                           </select>
//                       </div>
//                       <div>
//                           <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Priority</label>
//                           <select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 transition cursor-pointer" value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
//                               <option value="Medium">Medium</option>
//                               <option value="Highest">Highest</option>
//                               <option value="High">High</option>
//                               <option value="Low">Low</option>
//                           </select>
//                       </div>
//                       <div className="col-span-2">
//                           <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Description</label>
//                           <textarea className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 transition min-h-[100px]" placeholder="Detailed description..." value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
//                       </div>
//                   </div>
//                   <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-800">
//                       <button onClick={() => setIsCreateOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-white transition">Cancel</button>
//                       <button onClick={handleCreateTask} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition shadow-lg shadow-blue-900/20">Create Project</button>
//                   </div>
//               </div>
//           </div>
//       )}

//       {/* --- LIGHTBOX --- */}
//       {selectedTask && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSelectedTask(null)}>
//           <div className="bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
//             <div className="p-6 border-b border-slate-800 flex justify-between items-start">
//                <div className="flex-1">
//                   <div className="flex items-center gap-3 mb-3">
//                      <span className="text-xs text-slate-500 font-mono uppercase border border-slate-800 px-2 py-0.5 rounded bg-slate-950">{selectedTask.task_key || `#${selectedTask.id}`}</span>
//                      <h2 className="text-2xl font-bold text-white">{selectedTask.task_name}</h2>
//                   </div>
//                   <div className="flex gap-2">
//                       <span className={`px-2 py-1 rounded text-[10px] font-bold border ${selectedTask.status === 'Done' ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800' : 'bg-blue-900/30 text-blue-400 border-blue-800'}`}>
//                           {selectedTask.status.toUpperCase()}
//                       </span>
//                   </div>
//                </div>
//                <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><X size={24}/></button>
//             </div>

//             <div className="p-6 overflow-y-auto flex-1">
//                <div className="mb-8">
//                   <h4 className="text-sm font-bold text-slate-400 uppercase mb-2">Description</h4>
//                   <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 text-slate-300 text-sm leading-relaxed">
//                      {selectedTask.description || <span className="text-slate-600 italic">No description provided.</span>}
//                   </div>
//                </div>

//                <div>
//                   <div className="flex items-center justify-between mb-4">
//                      <h4 className="text-sm font-bold text-slate-400 uppercase">Work Breakdown</h4>
//                      <span className="text-xs text-slate-500">{selectedTask.progress}% Complete</span>
//                   </div>
//                   <div className="w-full h-2 bg-slate-800 rounded-full mb-6 overflow-hidden">
//                      <div className={`h-full transition-all duration-500 ${selectedTask.status === 'Done' ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${selectedTask.progress || 0}%` }}></div>
//                   </div>

//                   <div className="space-y-1">
//                      {selectedTask.subtasks && selectedTask.subtasks.map((sub: any) => (
//                         <TaskTree 
//                            key={sub.id} 
//                            task={sub} 
//                            role={role} 
//                            username={username} // Pass username for permissions
//                            onUpdateStatus={handleStatusUpdate}
//                            onDelete={handleRecursiveDelete}
//                            onAddSubtask={handleRecursiveAdd}
//                         />
//                      ))}
                     
//                      {/* ADD BUTTON IN LIGHTBOX (Using Global Modal Logic) */}
//                      {(role === 'Admin' || (selectedTask.employee_name === username && selectedTask.status !== 'Done')) ? (
//                         <div className="ml-8 mt-4">
//                             <button 
//                                 onClick={handleAddRootPhaseClick}
//                                 className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition"
//                             >
//                                 <Plus size={16}/> Add Phase / Task
//                             </button>
//                         </div>
//                      ) : (
//                         <div className="mt-6 p-3 bg-emerald-900/20 border border-emerald-900/50 rounded flex items-center justify-center gap-2 text-sm text-emerald-400">
//                             <CheckCircle2 size={16} /> Task is complete or read-only.
//                         </div>
//                      )}
//                   </div>
//                </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


"use client";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { 
  Briefcase, Plus, CheckCircle2, Circle, Clock, 
  User, X, Loader2, Layout, Trash2, Lock, AlertTriangle, AlertCircle,
  Search, Filter, Trophy, Tag, ChevronRight, ChevronDown, 
  Bug, BookOpen, CheckSquare, Flame, ArrowUp, ArrowDown, Minus, MoreHorizontal
} from "lucide-react";

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
  task_type: string;
  story_points: number;
  progress?: number;
  subtasks?: Task[]; 
  comments?: any[];
  history?: any[];
  time_spent?: number;
}

interface Staff {
  name: string;
}

// --- ICONS HELPERS ---
const TypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'Bug': return <div className="bg-red-900/30 p-1 rounded"><Bug size={14} className="text-red-400" /></div>;
    case 'Story': return <div className="bg-green-900/30 p-1 rounded"><BookOpen size={14} className="text-green-400" /></div>;
    case 'Epic': return <div className="bg-purple-900/30 p-1 rounded"><Flame size={14} className="text-purple-400" /></div>;
    default: return <div className="bg-blue-900/30 p-1 rounded"><CheckSquare size={14} className="text-blue-400" /></div>;
  }
};

const PriorityIcon = ({ priority }: { priority: string }) => {
  switch (priority) {
    case 'Highest': return <ArrowUp size={14} className="text-red-500" />;
    case 'High': return <ArrowUp size={14} className="text-orange-500" />;
    case 'Low': return <ArrowDown size={14} className="text-blue-400" />;
    case 'Lowest': return <ArrowDown size={14} className="text-slate-500" />;
    default: return <Minus size={14} className="text-yellow-500" />;
  }
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");

  // UI State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Record<number, boolean>>({});
  
  const [newTask, setNewTask] = useState({ 
      employee_name: "", task_name: "", description: "", allocated_hours: 2.0,
      priority: "Medium", task_type: "Task", story_points: 0
  });

  // Modal State
  const [modal, setModal] = useState<{
    type: 'NONE' | 'CONFIRM' | 'INPUT' | 'ALERT';
    title?: string;
    message?: string;
    action?: (val?: string) => Promise<void> | void; 
    inputValue?: string;
  }>({ type: 'NONE' });

  // Initialize
  useEffect(() => { 
      const r = localStorage.getItem("role");
      const u = localStorage.getItem("username");
      setRole(r);
      setUsername(u || "");
      if(r && u) fetchData(r, u); 
      else if (r === 'Admin') fetchData('Admin', 'Admin'); 
  }, []);

  // --- API FETCH ---
  const fetchData = useCallback(async (currentRole?: string | null, currentUser?: string) => {
    const r = currentRole || role;
    const u = currentUser || username;

    try {
      const [resTasks, resStaff] = await Promise.all([
        axios.get("http://localhost:8000/api/tasks/hierarchy"),
        axios.get("http://localhost:8000/api/employees")
      ]);

      let allTasks = resTasks.data;
      if (r === 'Employee') {
          allTasks = allTasks.filter((t: Task) => t.employee_name === u);
      }

      setTasks(allTasks);
      setStaff(resStaff.data);
      
      // Auto-expand all tasks initially for better visibility
      const expandMap: Record<number, boolean> = {};
      allTasks.forEach((t: Task) => { expandMap[t.id] = true; });
      setExpandedTasks(prev => ({...expandMap, ...prev})); // Merge to keep user state

      if (selectedTask) {
        const freshDetail = await axios.get(`http://localhost:8000/api/tasks/${selectedTask.id}`);
        setSelectedTask(freshDetail.data);
      }
    } catch (e) { console.error("Fetch Error:", e); } 
    finally { setLoading(false); }
  }, [selectedTask, role, username]);

  // --- HELPERS ---
  const showConfirm = (title: string, message: string, onConfirm: () => void) => setModal({ type: 'CONFIRM', title, message, action: onConfirm });
  const showAlert = (title: string, message: string) => setModal({ type: 'ALERT', title, message });
  const showInput = (title: string, message: string, onSubmit: (val: string) => void) => setModal({ type: 'INPUT', title, message, action: (val) => onSubmit(val || "") });

  const toggleExpand = (id: number) => {
    setExpandedTasks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // --- ACTIONS ---
  const handleCreateTask = async () => {
    if (role !== 'Admin') return;
    if (!newTask.employee_name || !newTask.task_name) {
        showAlert("Missing Fields", "Please select an assignee and enter a task summary.");
        return;
    }
    try {
        await axios.post("http://localhost:8000/api/tasks", { ...newTask, reporter: username });
        setNewTask({ employee_name: "", task_name: "", description: "", allocated_hours: 2.0, priority: "Medium", task_type: "Task", story_points: 0 });
        setIsCreateOpen(false);
        fetchData();
    } catch(e) { showAlert("Error", "Failed to create task."); }
  };

  const handleDeleteTask = async (e: React.MouseEvent, id: number, status: string) => {
    e.stopPropagation();
    if (role !== 'Admin') {
        showAlert("Access Denied", "Only Administrators can delete projects.");
        return;
    }
    showConfirm("Delete Task?", "This will permanently delete this task and all its history.", async () => {
        await axios.delete(`http://localhost:8000/api/tasks/${id}?user=${username}`);
        fetchData();
        setModal({ type: 'NONE' });
    });
  };

  const handleStatusUpdate = async (id: number, currentStatus: string) => {
    if (role !== 'Admin' && currentStatus === "Done") return;
    let next = currentStatus === "To Do" ? "In Progress" : currentStatus === "In Progress" ? "Done" : "To Do";
    if(currentStatus === "Done" && role === "Admin") next = "In Progress";

    await axios.post(`http://localhost:8000/api/tasks/${id}/status?status=${next}&user=${username}`);
    fetchData(); 
  };

  const handleAddSubtask = (parentId: number) => {
      showInput("Create Subtask", "What needs to be done?", async (val) => {
          if(!val.trim()) return;
          try {
            await axios.post("http://localhost:8000/api/tasks/subtask", {
                parent_id: parentId, task_name: val, allocated_hours: 1.0 
            });
            fetchData();
            setModal({ type: 'NONE' });
            setExpandedTasks(prev => ({ ...prev, [parentId]: true })); // Auto open parent
          } catch (e) { showAlert("Error", "Failed to add subtask"); }
      });
  };

  // --- FILTER LOGIC ---
  const filteredTasks = tasks.filter(t => {
      const matchSearch = t.task_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.task_key || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchAssignee = filterAssignee ? t.employee_name === filterAssignee : true;
      return matchSearch && matchAssignee;
  });

  // --- RECURSIVE ROW RENDERER ---
  const TaskRow = ({ task, depth = 0 }: { task: Task, depth?: number }) => {
      const isExpanded = expandedTasks[task.id];
      const hasChildren = task.subtasks && task.subtasks.length > 0;
      const isDone = task.status === 'Done';

      return (
          <>
            <div 
                className={`group flex items-center py-2 px-4 hover:bg-slate-900 border-b border-slate-800/50 transition-colors text-sm ${isDone ? 'opacity-60' : ''}`}
                onClick={() => setSelectedTask(task)}
            >
                {/* 1. Type */}
                <div className="w-[50px] flex-shrink-0 flex justify-center">
                    <TypeIcon type={task.task_type} />
                </div>

                {/* 2. Key */}
                <div className="w-[100px] flex-shrink-0 font-mono text-xs text-slate-500">
                    {task.task_key || `#${task.id}`}
                </div>

                {/* 3. Summary (Indented) */}
                <div className="flex-1 flex items-center gap-2 min-w-0 pr-4">
                    <div style={{ width: depth * 24 }} /> {/* Indentation */}
                    
                    {/* Expand Toggle */}
                    <div className="w-5 flex justify-center flex-shrink-0">
                        {hasChildren && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); toggleExpand(task.id); }}
                                className="text-slate-500 hover:text-white p-0.5 rounded hover:bg-slate-800"
                            >
                                {isExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                            </button>
                        )}
                    </div>

                    <span className={`truncate font-medium ${isDone ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {task.task_name}
                    </span>
                </div>

                {/* 4. Status */}
                <div className="w-[140px] flex-shrink-0">
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleStatusUpdate(task.id, task.status); }}
                        disabled={role !== 'Admin' && isDone}
                        className={`px-3 py-1 rounded text-[10px] font-bold border uppercase tracking-wider transition-all
                            ${task.status === 'Done' ? 'bg-emerald-950/40 text-emerald-500 border-emerald-900 hover:bg-emerald-900/60' : 
                              task.status === 'In Progress' ? 'bg-blue-900/30 text-blue-400 border-blue-900 hover:bg-blue-900/50' : 
                              'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}
                        `}
                    >
                        {task.status}
                    </button>
                </div>

                {/* 5. Assignee */}
                <div className="w-[180px] flex-shrink-0 flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-blue-400">
                        {task.employee_name.charAt(0)}
                    </div>
                    <span className="text-slate-400 truncate text-xs">{task.employee_name}</span>
                </div>

                {/* 6. Priority */}
                <div className="w-[100px] flex-shrink-0 flex items-center gap-2">
                    <PriorityIcon priority={task.priority} />
                    <span className="text-xs text-slate-400">{task.priority}</span>
                </div>

                {/* 7. Actions */}
                <div className="w-[80px] flex-shrink-0 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                    {/* Add Subtask Button */}
                    {(role === 'Admin' || (task.employee_name === username && !isDone)) && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleAddSubtask(task.id); }}
                            className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-slate-800 rounded"
                            title="Add Subtask"
                        >
                            <Plus size={14}/>
                        </button>
                    )}
                    
                    {/* Delete Button */}
                    {role === 'Admin' && (
                        <button 
                            onClick={(e) => handleDeleteTask(e, task.id, task.status)} 
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded"
                            title="Delete"
                        >
                            <Trash2 size={14}/>
                        </button>
                    )}
                </div>
            </div>

            {/* Recursive Render */}
            {isExpanded && task.subtasks && task.subtasks.map(sub => (
                <TaskRow key={sub.id} task={sub} depth={depth + 1} />
            ))}
          </>
      );
  };

  // --- MODAL COMPONENTS ---
  const GlobalModal = () => {
      const [localInput, setLocalInput] = useState("");
      if (modal.type === 'NONE') return null;
      const handleSubmit = () => { if (modal.action) modal.action(localInput); setLocalInput(""); }

      return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-full ${modal.type === 'ALERT' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                          {modal.type === 'ALERT' ? <AlertTriangle size={24} /> : modal.type === 'INPUT' ? <Plus size={24} /> : <AlertCircle size={24} />}
                      </div>
                      <h3 className="text-lg font-bold text-white">{modal.title}</h3>
                  </div>
                  <p className="text-slate-400 text-sm">{modal.message}</p>
                  {modal.type === 'INPUT' && (
                      <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Type here..." autoFocus value={localInput} onChange={(e) => setLocalInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
                  )}
                  <div className="flex gap-3 justify-end mt-2">
                      <button onClick={() => setModal({ type: 'NONE' })} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                      {modal.type !== 'ALERT' && <button onClick={handleSubmit} className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-500">Confirm</button>}
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden">
      <GlobalModal />

      {/* HEADER / TOOLBAR */}
      <div className="flex-shrink-0 p-6 border-b border-slate-800 flex flex-col gap-6 bg-slate-950 z-10">
          <div className="flex justify-between items-center">
              <div>
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
                      <span>Projects</span>
                      <span className="text-slate-700">/</span>
                      <span className="text-slate-300">Software Development</span>
                  </div>
                  <h1 className="text-2xl font-bold text-white">List</h1>
              </div>
              
              {role === 'Admin' && (
                  <button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-[3px] font-semibold text-sm flex items-center gap-2 transition">
                      Create
                  </button>
              )}
          </div>

          <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2 text-slate-500" size={16}/>
                  <input 
                      className="w-full bg-slate-900 border border-slate-700 rounded-[3px] pl-9 p-1.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-500 transition hover:bg-slate-800"
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                  />
              </div>
              
              {/* Assignee Filter */}
              <div className="flex items-center -space-x-2 mr-4">
                  {staff.slice(0, 4).map((s, i) => (
                      <div key={i} className="h-8 w-8 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-slate-400 cursor-pointer hover:z-10 hover:border-blue-500 transition" title={s.name} onClick={() => setFilterAssignee(filterAssignee === s.name ? "" : s.name)}>
                          {s.name.charAt(0)}
                      </div>
                  ))}
                  {staff.length > 4 && <div className="h-8 w-8 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-[10px] text-slate-500">+{staff.length - 4}</div>}
              </div>
              
              <button className="text-slate-400 hover:text-white text-sm font-medium px-3 py-1.5 rounded hover:bg-slate-800 transition">Clear filters</button>
          </div>
      </div>

      {/* TABLE HEADER */}
      <div className="flex-shrink-0 bg-slate-950 border-b border-slate-800 px-4 py-2 flex items-center text-xs font-bold text-slate-500 uppercase tracking-wide">
          <div className="w-[50px] pl-1">Type</div>
          <div className="w-[100px]">Key</div>
          <div className="flex-1">Summary</div>
          <div className="w-[140px]">Status</div>
          <div className="w-[180px]">Assignee</div>
          <div className="w-[100px]">Priority</div>
          <div className="w-[80px] text-right">Actions</div>
      </div>

      {/* TABLE BODY (Scrollable) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950 pb-20">
          {loading ? (
              <div className="flex justify-center items-center h-64 text-slate-500 gap-2"><Loader2 className="animate-spin" /> Loading tasks...</div>
          ) : filteredTasks.length === 0 ? (
              <div className="text-center py-20 text-slate-500">No tasks found.</div>
          ) : (
              filteredTasks.map(task => (
                  <TaskRow key={task.id} task={task} />
              ))
          )}
          
          {/* Quick Add Row at Bottom */}
          {role === 'Admin' && (
              <div 
                className="flex items-center px-4 py-3 text-sm text-slate-500 hover:bg-slate-900 cursor-pointer border-b border-transparent hover:border-slate-800 transition group"
                onClick={() => setIsCreateOpen(true)}
              >
                  <div className="w-[50px] pl-1"><Plus size={16} /></div>
                  <div className="font-medium group-hover:text-blue-400">Create new task</div>
              </div>
          )}
      </div>

      {/* --- CREATE MODAL (ADMIN ONLY) --- */}
      {isCreateOpen && role === 'Admin' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-lg shadow-2xl p-8 animate-in slide-in-from-bottom-4 duration-300">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold text-white">Create Issue</h2>
                      <button onClick={() => setIsCreateOpen(false)}><X className="text-slate-500 hover:text-white" /></button>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Summary</label>
                          <input className="w-full bg-slate-950 border border-slate-700 rounded-[3px] p-2 text-white focus:border-blue-500 outline-none transition" autoFocus placeholder="What needs to be done?" value={newTask.task_name} onChange={e => setNewTask({...newTask, task_name: e.target.value})} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Type</label>
                              <select className="w-full bg-slate-950 border border-slate-700 rounded-[3px] p-2 text-white focus:border-blue-500 outline-none" value={newTask.task_type} onChange={e => setNewTask({...newTask, task_type: e.target.value})}>
                                  <option value="Task">Task</option>
                                  <option value="Bug">Bug</option>
                                  <option value="Story">Story</option>
                                  <option value="Epic">Epic</option>
                              </select>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Priority</label>
                              <select className="w-full bg-slate-950 border border-slate-700 rounded-[3px] p-2 text-white focus:border-blue-500 outline-none" value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                                  <option value="Medium">Medium</option>
                                  <option value="Highest">Highest</option>
                                  <option value="High">High</option>
                                  <option value="Low">Low</option>
                              </select>
                          </div>
                      </div>

                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Assignee</label>
                          <select className="w-full bg-slate-950 border border-slate-700 rounded-[3px] p-2 text-white focus:border-blue-500 outline-none" value={newTask.employee_name} onChange={e => setNewTask({...newTask, employee_name: e.target.value})}>
                              <option value="">Unassigned</option>
                              {staff.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                          </select>
                      </div>

                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Description</label>
                          <textarea className="w-full bg-slate-950 border border-slate-700 rounded-[3px] p-2 text-white focus:border-blue-500 outline-none min-h-[100px]" placeholder="Add a description..." value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
                      </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-8">
                      <button onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition">Cancel</button>
                      <button onClick={handleCreateTask} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-[3px] text-sm font-bold transition shadow-lg">Create</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- LIGHTBOX (DETAIL VIEW) --- */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedTask(null)}>
          <div className="bg-slate-900 w-full max-w-5xl h-[85vh] rounded-lg shadow-2xl border border-slate-800 flex overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* ... (Previous Lightbox Logic, just styling tweaks for consistency) ... */}
            <div className="w-[70%] flex flex-col border-r border-slate-800">
                <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-3 text-slate-500 text-xs font-mono">
                            <TypeIcon type={selectedTask.task_type} />
                            <span>{selectedTask.task_key || `#${selectedTask.id}`}</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white leading-tight">{selectedTask.task_name}</h2>
                    </div>
                    <button onClick={() => setSelectedTask(null)}><X size={20} className="text-slate-400 hover:text-white"/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="mb-8">
                        <h4 className="text-sm font-bold text-slate-300 mb-2">Description</h4>
                        <div className="text-slate-400 text-sm leading-relaxed">{selectedTask.description || "No description."}</div>
                    </div>
                    
                    {/* Subtasks Section in Lightbox */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold text-slate-300">Subtasks</h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{width: `${selectedTask.progress}%`}}></div>
                                </div>
                                {selectedTask.progress}%
                            </div>
                        </div>
                        {selectedTask.subtasks?.map(sub => (
                            <div key={sub.id} className="flex items-center justify-between py-2 border-b border-slate-800/50 text-sm">
                                <div className="flex items-center gap-3">
                                    <TypeIcon type={sub.task_type} />
                                    <span className={sub.status === 'Done' ? 'line-through text-slate-600' : 'text-slate-300'}>{sub.task_name}</span>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${sub.status === 'Done' ? 'border-emerald-900 text-emerald-500' : 'border-slate-700 text-slate-400'}`}>{sub.status}</span>
                            </div>
                        ))}
                        
                        {(role === 'Admin' || (selectedTask.employee_name === username && selectedTask.status !== 'Done')) && (
                            <button onClick={() => handleAddSubtask(selectedTask.id)} className="mt-3 text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                <Plus size={14}/> Create subtask
                            </button>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="w-[30%] bg-slate-950/30 flex flex-col p-6 border-l border-slate-800 overflow-y-auto">
                <div className="mb-6">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Status</label>
                    <button 
                        onClick={() => handleStatusUpdate(selectedTask.id, selectedTask.status)}
                        className="w-full py-2 px-3 rounded-[3px] bg-slate-800 border border-slate-700 text-left text-sm font-medium text-white hover:bg-slate-700 transition flex justify-between items-center"
                    >
                        {selectedTask.status.toUpperCase()}
                        <ChevronDown size={14} className="opacity-50"/>
                    </button>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <span className="text-xs text-slate-500 block mb-1">Assignee</span>
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-blue-400 font-bold">{selectedTask.employee_name.charAt(0)}</div>
                            <span className="text-sm text-slate-300">{selectedTask.employee_name}</span>
                        </div>
                    </div>
                    <div>
                        <span className="text-xs text-slate-500 block mb-1">Priority</span>
                        <div className="flex items-center gap-2">
                            <PriorityIcon priority={selectedTask.priority} />
                            <span className="text-sm text-slate-300">{selectedTask.priority}</span>
                        </div>
                    </div>
                    <div>
                        <span className="text-xs text-slate-500 block mb-1">Story Points</span>
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-xs font-mono text-slate-300">{selectedTask.story_points}</span>
                    </div>
                    <div className="border-t border-slate-800 pt-4">
                        <span className="text-xs text-slate-500 block mb-1">Original Estimate</span>
                        <span className="text-sm text-slate-300">{selectedTask.allocated_hours}h</span>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}