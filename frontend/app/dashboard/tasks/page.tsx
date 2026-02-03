"use client";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { 
  Briefcase, Plus, CheckCircle2, Circle, Clock, 
  User, X, Loader2, Layout, Trash2 
} from "lucide-react";

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

interface Staff {
  employee_name: string;
  free_hours: number;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  // Lightbox State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Inputs
  const [assign, setAssign] = useState({ employee_name: "", task_name: "", description: "", allocated_hours: 2.0 });
  const [subTaskName, setSubTaskName] = useState("");

  // --- API FETCH ---
  // Wrapped in useCallback to prevent stale closure issues
  const fetchData = useCallback(async () => {
    try {
      const [resTasks, resStaff] = await Promise.all([
        axios.get("http://localhost:8000/api/tasks/hierarchy"),
        axios.get("http://localhost:8000/api/tasks/available")
      ]);
      setTasks(resTasks.data);
      setStaff(resStaff.data);
      
      // Critical: If lightbox is open, we must refresh its specific data too
      if (selectedTask) {
        const freshDetail = await axios.get(`http://localhost:8000/api/tasks/${selectedTask.id}`);
        setSelectedTask(freshDetail.data);
      }
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  }, [selectedTask]); // Re-create function when selectedTask changes

  useEffect(() => { fetchData(); }, []); // Run once on mount

  // --- ACTIONS ---

  const handleCreateRootTask = async () => {
    if (!assign.employee_name || !assign.task_name) return alert("Fill required fields");
    await axios.post("http://localhost:8000/api/tasks", assign);
    setAssign({ ...assign, task_name: "", description: "" });
    fetchData();
  };

  // 1. DELETE MAIN TASK
  const handleDeleteTask = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Stop lightbox from opening
    if (confirm("Permanently delete this task and all its history?")) {
      await axios.delete(`http://localhost:8000/api/tasks/${id}`);
      fetchData();
    }
  };

  // 2. ADD SUBTASK (Fixed)
  const handleAddSubtask = async () => {
    if (!selectedTask || !subTaskName) return;
    try {
      await axios.post("http://localhost:8000/api/tasks/subtask", {
        parent_id: selectedTask.id,
        task_name: subTaskName,
        allocated_hours: 1.0 
      });
      setSubTaskName("");
      // Force immediate refresh
      const freshDetail = await axios.get(`http://localhost:8000/api/tasks/${selectedTask.id}`);
      setSelectedTask(freshDetail.data); 
      fetchData(); // Refresh board background
    } catch(e) { alert("Error adding subtask"); }
  };

  // 3. DELETE SUBTASK
  const handleDeleteSubtask = async (subId: number) => {
    if(!confirm("Remove this step?")) return;
    await axios.delete(`http://localhost:8000/api/tasks/${subId}`);
    // Refresh Lightbox
    if(selectedTask) {
        const fresh = await axios.get(`http://localhost:8000/api/tasks/${selectedTask.id}`);
        setSelectedTask(fresh.data);
    }
    fetchData();
  };

  const updateStatus = async (id: number, currentStatus: string) => {
    const next = currentStatus === "To Do" ? "In Progress" : currentStatus === "In Progress" ? "Done" : "To Do";
    await axios.post(`http://localhost:8000/api/tasks/${id}/status?status=${next}`);
    
    // Refresh both views
    if(selectedTask && selectedTask.id === id) {
        const fresh = await axios.get(`http://localhost:8000/api/tasks/${id}`);
        setSelectedTask(fresh.data);
    } else if (selectedTask) {
        // If updating a subtask inside the lightbox
        const fresh = await axios.get(`http://localhost:8000/api/tasks/${selectedTask.id}`);
        setSelectedTask(fresh.data);
    }
    fetchData();
  };

  const openLightbox = (task: Task) => {
    setSelectedTask(task);
    setIsLightboxOpen(true);
  };

  // --- BADGE COMPONENT ---
  const StatusBadge = ({ status, onClick, size="sm" }: any) => (
    <button 
      onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
      className={`
        ${size === 'lg' ? 'px-4 py-1.5 text-sm' : 'px-2 py-0.5 text-[10px]'} 
        rounded-md font-bold border flex items-center gap-2 transition-all
        ${status === 'Done' ? 'bg-green-900/30 text-green-400 border-green-800 hover:bg-green-900/50' : 
          status === 'In Progress' ? 'bg-blue-900/30 text-blue-400 border-blue-800 hover:bg-blue-900/50' : 
          'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}
      `}
    >
      {status === 'Done' ? <CheckCircle2 size={14}/> : status === 'In Progress' ? <Loader2 size={14} className="animate-spin"/> : <Circle size={14}/>}
      {status.toUpperCase()}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-200">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-8">
        <div>
           <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
             <Layout className="text-blue-500" /> Project Board
           </h1>
           <p className="text-slate-400 text-sm">Manage tasks, workflows, and sub-processes.</p>
        </div>
        <button onClick={fetchData} className="text-sm bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition text-slate-300">
          Refresh Board
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* --- CREATE PANEL --- */}
        <div className="lg:col-span-1 bg-slate-900 p-5 rounded-xl border border-slate-800 h-fit sticky top-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Plus size={16} className="text-blue-400"/> Create Issue</h3>
          <div className="space-y-4">
             <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Assignee</label>
                <select 
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-300 outline-none focus:border-blue-500"
                  onChange={e => setAssign({...assign, employee_name: e.target.value})}
                  value={assign.employee_name}
                >
                  <option value="">Select Staff...</option>
                  {staff.map(s => <option key={s.employee_name} value={s.employee_name}>{s.employee_name} ({s.free_hours}h)</option>)}
                </select>
             </div>
             <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Summary</label>
                <input 
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white outline-none focus:border-blue-500"
                  placeholder="Task title..."
                  value={assign.task_name}
                  onChange={e => setAssign({...assign, task_name: e.target.value})}
                />
             </div>
             <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                <textarea 
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white outline-none focus:border-blue-500 min-h-[80px]"
                  placeholder="Details..."
                  value={assign.description}
                  onChange={e => setAssign({...assign, description: e.target.value})}
                />
             </div>
             <button onClick={handleCreateRootTask} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-bold text-sm transition shadow-lg">Create</button>
          </div>
        </div>

        {/* --- BOARD --- */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 content-start">
          {loading ? <div className="text-slate-500 col-span-full text-center py-10">Loading...</div> : 
           tasks.map(task => (
             <div 
                key={task.id} 
                onClick={() => openLightbox(task)}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-blue-500/50 cursor-pointer transition group shadow-sm hover:shadow-md relative overflow-hidden"
             >
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
                   <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${task.progress || 0}%` }}></div>
                </div>

                <div className="flex justify-between items-start mb-3 mt-2">
                   <StatusBadge status={task.status} onClick={() => updateStatus(task.id, task.status)} />
                   
                   {/* DELETE BUTTON */}
                   <button 
                     onClick={(e) => handleDeleteTask(e, task.id)}
                     className="text-slate-600 hover:text-red-500 p-1 rounded hover:bg-slate-800 transition"
                   >
                     <Trash2 size={14} />
                   </button>
                </div>
                
                <h4 className="font-bold text-slate-100 mb-1 line-clamp-2">{task.task_name}</h4>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4 h-8">{task.description || "No description provided."}</p>
                
                <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                   <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-blue-400 border border-slate-700">
                         {task.employee_name.charAt(0)}
                      </div>
                      <span className="text-xs text-slate-400">{task.employee_name}</span>
                   </div>
                   <div className="text-[10px] font-bold bg-slate-950 px-2 py-1 rounded text-slate-400">
                      {task.progress}% Done
                   </div>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* --- LIGHTBOX --- */}
      {isLightboxOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsLightboxOpen(false)}>
          <div className="bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            
            <div className="p-6 border-b border-slate-800 flex justify-between items-start">
               <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                     <span className="text-xs text-slate-500 font-mono uppercase">Issue #{selectedTask.id}</span>
                     <StatusBadge status={selectedTask.status} size="lg" onClick={() => updateStatus(selectedTask.id, selectedTask.status)} />
                  </div>
                  <h2 className="text-2xl font-bold text-white">{selectedTask.task_name}</h2>
               </div>
               <button onClick={() => setIsLightboxOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><X size={24}/></button>
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
                     <h4 className="text-sm font-bold text-slate-400 uppercase">Process Workflow</h4>
                     <span className="text-xs text-slate-500">{selectedTask.progress}% Complete</span>
                  </div>

                  <div className="w-full h-2 bg-slate-800 rounded-full mb-6 overflow-hidden">
                     <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${selectedTask.progress || 0}%` }}></div>
                  </div>

                  <div className="space-y-2">
                     {selectedTask.subtasks && selectedTask.subtasks.map((sub, idx) => (
                        <div key={sub.id} className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg group hover:border-slate-700 transition">
                           <div className="text-xs font-mono text-slate-600 w-6">{idx + 1}.</div>
                           <div className={`flex-1 text-sm ${sub.status === 'Done' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                              {sub.task_name}
                           </div>
                           <StatusBadge status={sub.status} onClick={() => updateStatus(sub.id, sub.status)} />
                           
                           {/* DELETE SUBTASK BUTTON */}
                           <button 
                             onClick={() => handleDeleteSubtask(sub.id)}
                             className="text-slate-600 hover:text-red-500 p-1.5 opacity-0 group-hover:opacity-100 transition"
                           >
                             <Trash2 size={14} />
                           </button>
                        </div>
                     ))}
                  </div>

                  <div className="mt-4 flex gap-2">
                     <input 
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Add next step in process..."
                        value={subTaskName}
                        onChange={(e) => setSubTaskName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                     />
                     <button onClick={handleAddSubtask} className="bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 px-4 rounded-lg font-medium transition text-sm">
                        Add Step
                     </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}