"use client";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import TaskTree from "@/components/TaskTree";
import { 
  Briefcase, Plus, CheckCircle2, Circle, Clock, 
  User, X, Loader2, Layout, Trash2, Lock, AlertTriangle, AlertCircle,
  Search, Filter, Trophy, Tag
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

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");

  // Lightbox State
  const [selectedTask, setSelectedTask] = useState<any>(null);
  
  // Creation Form State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTask, setNewTask] = useState({ 
      employee_name: "", task_name: "", description: "", allocated_hours: 2.0,
      priority: "Medium", task_type: "Task", story_points: 0
  });

  // --- CUSTOM MODAL STATE ---
  // Updated action signature to accept an optional input value
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
      else if (r === 'Admin') fetchData('Admin', 'Admin'); // Fallback for pure admin testing
  }, []);

  // --- API FETCH (Strict Visibility Logic) ---
  const fetchData = useCallback(async (currentRole?: string | null, currentUser?: string) => {
    const r = currentRole || role;
    const u = currentUser || username;

    try {
      const [resTasks, resStaff] = await Promise.all([
        axios.get("http://localhost:8000/api/tasks/hierarchy"),
        axios.get("http://localhost:8000/api/employees")
      ]);

      let allTasks = resTasks.data;

      // 🔒 SECURITY: Filter for Employees
      // Only show tasks where the Employee is the assignee
      if (r === 'Employee') {
          allTasks = allTasks.filter((t: Task) => t.employee_name === u);
      }

      setTasks(allTasks);
      setStaff(resStaff.data);
      
      // Update Lightbox if open to reflect new tree state
      if (selectedTask) {
        const freshDetail = await axios.get(`http://localhost:8000/api/tasks/${selectedTask.id}`);
        setSelectedTask(freshDetail.data);
      }
    } catch (e) { 
        console.error("Fetch Error:", e);
    } 
    finally { setLoading(false); }
  }, [selectedTask, role, username]);

  // --- MODAL HELPERS ---
  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
      setModal({ type: 'CONFIRM', title, message, action: onConfirm });
  };
  const showAlert = (title: string, message: string) => {
      setModal({ type: 'ALERT', title, message });
  };
  const showInput = (title: string, message: string, onSubmit: (val: string) => void) => {
      setModal({ type: 'INPUT', title, message, action: (val) => onSubmit(val || "") });
  };

  // --- ACTIONS ---

  const handleCreateTask = async () => {
    // 🔒 Double Check: Only Admins can create root projects
    if (role !== 'Admin') return;

    if (!newTask.employee_name || !newTask.task_name) {
        showAlert("Missing Fields", "Please select an assignee and enter a task summary.");
        return;
    }
    try {
        await axios.post("http://localhost:8000/api/tasks", { ...newTask, reporter: username });
        setNewTask({ 
            employee_name: "", task_name: "", description: "", allocated_hours: 2.0,
            priority: "Medium", task_type: "Task", story_points: 0
        });
        setIsCreateOpen(false);
        fetchData();
    } catch(e) { showAlert("Error", "Failed to create task."); }
  };

  const handleDeleteMainTask = async (e: React.MouseEvent, id: number, status: string) => {
    e.stopPropagation();
    if (role !== 'Admin') {
        showAlert("Access Denied", "Only Administrators can delete main projects.");
        return;
    }
    showConfirm(
        "Delete Project?",
        "⚠️ ADMIN: Delete this project and ALL history?",
        async () => {
            await axios.delete(`http://localhost:8000/api/tasks/${id}?user=${username}`);
            fetchData();
            setModal({ type: 'NONE' });
        }
    );
  };

  const handleStatusUpdate = async (id: number, currentStatus: string) => {
    // Permission check
    if (role !== 'Admin' && currentStatus === "Done") return;

    let next = "To Do";
    if(currentStatus === "To Do") next = "In Progress";
    else if(currentStatus === "In Progress") next = "Done";
    else if(currentStatus === "Done" && role === "Admin") next = "In Progress";

    await axios.post(`http://localhost:8000/api/tasks/${id}/status?status=${next}&user=${username}`);
    // Refresh to update UI
    if(selectedTask) {
        const fresh = await axios.get(`http://localhost:8000/api/tasks/${selectedTask.id}`);
        setSelectedTask(fresh.data);
    }
    fetchData();
  };

  // --- RECURSIVE ACTIONS ---

  const handleAddRootPhaseClick = () => {
      // 🔒 Permission: Only Admin OR Assignee (if not Done)
      if (role !== 'Admin' && (selectedTask.employee_name !== username || selectedTask.status === 'Done')) {
          showAlert("Permission Denied", "You cannot add sub-tasks to this project.");
          return;
      }

      showInput("Add Phase/Task", "Enter name:", async (val) => {
          if(!val.trim()) return;
          try {
            await axios.post("http://localhost:8000/api/tasks/subtask", {
                parent_id: selectedTask.id, task_name: val, allocated_hours: 1.0 
            });
            // Refresh lightbox
            const res = await axios.get(`http://localhost:8000/api/tasks/${selectedTask.id}`);
            setSelectedTask(res.data);
            fetchData();
            setModal({ type: 'NONE' });
          } catch (e) {
            showAlert("Error", "Failed to add subtask");
          }
      });
  };

  const handleRecursiveAdd = async (parentId: number, name: string) => {
    await axios.post("http://localhost:8000/api/tasks/subtask", {
        parent_id: parentId, task_name: name, allocated_hours: 1.0 
    });
    if(selectedTask) {
        const res = await axios.get(`http://localhost:8000/api/tasks/${selectedTask.id}`);
        setSelectedTask(res.data);
    }
    fetchData();
  };

  const handleRecursiveDelete = async (id: number) => {
    // Permission logic handled inside TaskTree, but double check here
    showConfirm("Delete Item?", "Remove this sub-task?", async () => {
        await axios.delete(`http://localhost:8000/api/tasks/${id}?user=${username}`);
        if(selectedTask) {
            const res = await axios.get(`http://localhost:8000/api/tasks/${selectedTask.id}`);
            setSelectedTask(res.data);
        }
        fetchData();
        setModal({ type: 'NONE' });
    });
  };

  const filteredTasks = tasks.filter(t => {
      const matchSearch = t.task_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.task_key || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchAssignee = filterAssignee ? t.employee_name === filterAssignee : true;
      return matchSearch && matchAssignee;
  });

  // --- COMPONENT: STATUS BADGE ---
  const StatusBadge = ({ status, onClick, size="sm" }: any) => {
    const isDone = status === 'Done';
    const canClick = !isDone || role === 'Admin';
    return (
        <button 
        onClick={(e) => { e.stopPropagation(); if(canClick && onClick) onClick(); }}
        disabled={!canClick}
        className={`
            ${size === 'lg' ? 'px-4 py-1.5 text-sm' : 'px-2 py-0.5 text-[10px]'} 
            rounded-md font-bold border flex items-center gap-2 transition-all
            ${isDone ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800' : 
            status === 'In Progress' ? 'bg-blue-900/30 text-blue-400 border-blue-800 hover:bg-blue-900/50' : 
            'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}
            ${!canClick ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}
        `}
        >
        {isDone ? <CheckCircle2 size={12}/> : status === 'In Progress' ? <Loader2 size={12} className="animate-spin"/> : <Circle size={12}/>}
        {status.toUpperCase()}
        </button>
    );
  };

  // --- COMPONENT: GLOBAL MODAL (Updated) ---
  const GlobalModal = () => {
      const [localInput, setLocalInput] = useState("");
      
      if (modal.type === 'NONE') return null;

      const handleSubmit = () => {
          if (modal.action) modal.action(localInput);
          setLocalInput(""); // Reset
      }

      return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-full ${modal.type === 'ALERT' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                          {modal.type === 'ALERT' ? <AlertTriangle size={24} /> : modal.type === 'INPUT' ? <Plus size={24} /> : <AlertCircle size={24} />}
                      </div>
                      <h3 className="text-lg font-bold text-white">{modal.title}</h3>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">{modal.message}</p>
                  
                  {modal.type === 'INPUT' && (
                      <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Type here..." autoFocus 
                          value={localInput} 
                          onChange={(e) => setLocalInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                      />
                  )}

                  <div className="flex gap-3 justify-end mt-2">
                      <button onClick={() => setModal({ type: 'NONE' })} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition">
                          {modal.type === 'ALERT' ? 'Close' : 'Cancel'}
                      </button>
                      {modal.type !== 'ALERT' && (
                          <button onClick={handleSubmit} className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition shadow-lg">Confirm</button>
                      )}
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-200">
      <GlobalModal />

      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
           <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
             <Briefcase className="text-blue-500" /> Projects & Tasks
           </h1>
           <p className="text-slate-400 text-sm mt-1">Manage project lifecycles, sprints, and task breakdowns.</p>
        </div>
        
        {/* 🔒 SECURITY: Only Admin sees Create Project */}
        {role === 'Admin' && (
            <button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 transition">
            <Plus size={18} /> New Project
            </button>
        )}
      </div>

      {/* FILTER BAR */}
      <div className="max-w-7xl mx-auto bg-slate-900 p-4 rounded-xl border border-slate-800 mb-6 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 text-slate-500" size={18}/>
              <input 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 p-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
              />
          </div>
          
          {/* Admin sees assignee filter, Employees don't need it (they only see theirs) */}
          {role === 'Admin' && (
              <div className="relative w-full md:w-64">
                  <Filter className="absolute left-3 top-2.5 text-slate-500" size={18}/>
                  <select 
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 p-2 text-sm text-slate-300 outline-none appearance-none cursor-pointer"
                      value={filterAssignee}
                      onChange={(e) => setFilterAssignee(e.target.value)}
                  >
                      <option value="">All Assignees</option>
                      {staff.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
              </div>
          )}
      </div>

      {/* PROJECTS LIST */}
      <div className="max-w-7xl mx-auto space-y-4">
          {loading ? (
              <div className="text-center py-20 text-slate-500 flex flex-col items-center gap-2"><Loader2 className="animate-spin" size={32} /> Loading...</div>
          ) : filteredTasks.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
                  <p className="text-slate-500">No projects found.</p>
              </div>
          ) : (
              filteredTasks.map(task => (
                  <div key={task.id} onClick={() => setSelectedTask(task)} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-blue-500/50 hover:shadow-lg transition cursor-pointer group relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-800">
                          <div className={`w-full transition-all duration-700 ${task.status === 'Done' ? 'bg-emerald-500 h-full' : 'bg-blue-500'}`} style={{ height: `${task.progress || 0}%` }}></div>
                      </div>
                      <div className="flex items-start justify-between pl-3">
                          <div>
                              <div className="flex items-center gap-3 mb-1">
                                  <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">{task.task_key || `#${task.id}`}</span>
                                  <h3 className={`text-lg font-bold ${task.status === 'Done' ? 'text-slate-500 line-through' : 'text-white'}`}>{task.task_name}</h3>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                                  <span className="flex items-center gap-1.5"><User size={12}/> {task.employee_name}</span>
                                  <span className="flex items-center gap-1.5"><Clock size={12}/> {task.allocated_hours}h</span>
                                  <span className="flex items-center gap-1.5 text-yellow-500"><Trophy size={12}/> {task.story_points} pts</span>
                              </div>
                          </div>
                          {/* 🔒 SECURITY: Only Admin delete main projects */}
                          {role === 'Admin' && (
                              <button onClick={(e) => handleDeleteMainTask(e, task.id, task.status)} className="p-2 text-slate-600 hover:text-red-400 hover:bg-slate-950 rounded-lg transition">
                                  <Trash2 size={16} />
                              </button>
                          )}
                      </div>
                  </div>
              ))
          )}
      </div>

      {/* --- CREATE MODAL (ADMIN ONLY) --- */}
      {isCreateOpen && role === 'Admin' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl p-8 animate-in slide-in-from-bottom-4 duration-300">
                  <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2"><Layout size={20} className="text-blue-500"/> Create New Project</h2>
                      <button onClick={() => setIsCreateOpen(false)}><X className="text-slate-500 hover:text-white" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                      <div className="col-span-2">
                          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Project Summary</label>
                          <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 transition" placeholder="e.g. Develop User Auth Module" value={newTask.task_name} onChange={e => setNewTask({...newTask, task_name: e.target.value})} />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Assignee</label>
                          <select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 transition cursor-pointer" value={newTask.employee_name} onChange={e => setNewTask({...newTask, employee_name: e.target.value})}>
                              <option value="">Select Staff...</option>
                              {staff.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Priority</label>
                          <select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 transition cursor-pointer" value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                              <option value="Medium">Medium</option>
                              <option value="Highest">Highest</option>
                              <option value="High">High</option>
                              <option value="Low">Low</option>
                          </select>
                      </div>
                      <div className="col-span-2">
                          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Description</label>
                          <textarea className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 transition min-h-[100px]" placeholder="Detailed description..." value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
                      </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-800">
                      <button onClick={() => setIsCreateOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-white transition">Cancel</button>
                      <button onClick={handleCreateTask} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition shadow-lg shadow-blue-900/20">Create Project</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- LIGHTBOX --- */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSelectedTask(null)}>
          <div className="bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-800 flex justify-between items-start">
               <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                     <span className="text-xs text-slate-500 font-mono uppercase border border-slate-800 px-2 py-0.5 rounded bg-slate-950">{selectedTask.task_key || `#${selectedTask.id}`}</span>
                     <h2 className="text-2xl font-bold text-white">{selectedTask.task_name}</h2>
                  </div>
                  <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold border ${selectedTask.status === 'Done' ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800' : 'bg-blue-900/30 text-blue-400 border-blue-800'}`}>
                          {selectedTask.status.toUpperCase()}
                      </span>
                  </div>
               </div>
               <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><X size={24}/></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
               <div className="mb-8">
                  <h4 className="text-sm font-bold text-slate-400 uppercase mb-2">Description</h4>
                  <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 text-slate-300 text-sm leading-relaxed">
                     {selectedTask.description || <span className="text-slate-600 italic">No description provided.</span>}
                  </div>
               </div>

               <div>
                  <div className="flex items-center justify-between mb-4">
                     <h4 className="text-sm font-bold text-slate-400 uppercase">Work Breakdown</h4>
                     <span className="text-xs text-slate-500">{selectedTask.progress}% Complete</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full mb-6 overflow-hidden">
                     <div className={`h-full transition-all duration-500 ${selectedTask.status === 'Done' ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${selectedTask.progress || 0}%` }}></div>
                  </div>

                  <div className="space-y-1">
                     {selectedTask.subtasks && selectedTask.subtasks.map((sub: any) => (
                        <TaskTree 
                           key={sub.id} 
                           task={sub} 
                           role={role} 
                           username={username} // Pass username for permissions
                           onUpdateStatus={handleStatusUpdate}
                           onDelete={handleRecursiveDelete}
                           onAddSubtask={handleRecursiveAdd}
                        />
                     ))}
                     
                     {/* ADD BUTTON IN LIGHTBOX (Using Global Modal Logic) */}
                     {(role === 'Admin' || (selectedTask.employee_name === username && selectedTask.status !== 'Done')) ? (
                        <div className="ml-8 mt-4">
                            <button 
                                onClick={handleAddRootPhaseClick}
                                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition"
                            >
                                <Plus size={16}/> Add Phase / Task
                            </button>
                        </div>
                     ) : (
                        <div className="mt-6 p-3 bg-emerald-900/20 border border-emerald-900/50 rounded flex items-center justify-center gap-2 text-sm text-emerald-400">
                            <CheckCircle2 size={16} /> Task is complete or read-only.
                        </div>
                     )}
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}