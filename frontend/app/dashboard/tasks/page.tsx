"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { 
  Briefcase, 
  Clock, 
  User, 
  Trash2, 
  Plus, 
  Pencil, 
  Check, 
  X,
  Loader2
} from "lucide-react";

// Define Data Types
interface Task {
  id: number;
  task_name: string;
  employee_name: string;
  allocated_hours: number;
  status: string;
}

interface Staff {
  employee_name: string;
  free_hours: number;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Assignment State
  const [assign, setAssign] = useState({ employee_name: "", task_name: "", allocated_hours: 2.0 });
  const [assigning, setAssigning] = useState(false);

  // Edit Mode State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ task_name: "", allocated_hours: 0 });

  const refresh = async () => {
    try {
      const [resTasks, resStaff] = await Promise.all([
        axios.get("http://localhost:8000/api/tasks/history"),
        axios.get("http://localhost:8000/api/tasks/available")
      ]);
      setTasks(resTasks.data);
      setStaff(resStaff.data);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const handleAssign = async () => {
    if (!assign.employee_name || !assign.task_name) return alert("Please fill all fields");
    setAssigning(true);
    try {
      await axios.post("http://localhost:8000/api/tasks", assign);
      setAssign({ ...assign, task_name: "" }); // Reset task name only
      refresh();
    } catch (e) {
      alert("Error assigning task");
    } finally {
      setAssigning(false);
    }
  };

  const handleDelete = async (id: number) => {
    if(confirm("Permanently delete this task?")) {
      await axios.delete(`http://localhost:8000/api/tasks/${id}`);
      refresh();
    }
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditForm({ task_name: task.task_name, allocated_hours: task.allocated_hours });
  };

  const saveEdit = async (id: number) => {
    await axios.put(`http://localhost:8000/api/tasks/${id}`, editForm);
    setEditingId(null);
    refresh();
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-200">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 flex items-center gap-2 text-white">
          <Briefcase className="text-blue-500" /> Task Manager
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- LEFT COLUMN: ASSIGN PANEL --- */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 sticky top-8">
              <h3 className="font-semibold mb-6 flex items-center gap-2 text-white">
                <Plus size={18} className="text-blue-400" /> Assign New Task
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Assign To</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-slate-500" size={16} />
                    <select 
                      className="w-full pl-10 p-2.5 bg-slate-950 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-sm text-slate-200"
                      onChange={e => setAssign({...assign, employee_name: e.target.value})}
                      value={assign.employee_name}
                    >
                      <option value="">Select Employee...</option>
                      {staff.map(s => (
                        <option key={s.employee_name} value={s.employee_name}>
                          {s.employee_name} ({s.free_hours}h available)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Task Description</label>
                  <input 
                    placeholder="e.g. Fix Login Bug" 
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-200 placeholder-slate-600"
                    onChange={e => setAssign({...assign, task_name: e.target.value})}
                    value={assign.task_name}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Duration (Hours)</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" min="0.5" max="8" step="0.5" 
                      className="w-full accent-blue-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      value={assign.allocated_hours} 
                      onChange={e => setAssign({...assign, allocated_hours: +e.target.value})} 
                    />
                    <span className="text-white font-mono bg-slate-800 px-2 py-1 rounded text-sm min-w-[3rem] text-center">
                      {assign.allocated_hours}h
                    </span>
                  </div>
                </div>

                <button 
                  onClick={handleAssign} 
                  disabled={assigning}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-blue-900/20 flex justify-center items-center gap-2"
                >
                  {assigning ? <Loader2 className="animate-spin" size={18}/> : "Assign Task"}
                </button>
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: HISTORY LIST --- */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Task History</h3>
              <button onClick={refresh} className="text-xs text-blue-400 hover:text-blue-300">Refresh List</button>
            </div>

            {loading ? (
              <div className="text-center py-10 text-slate-500"><Loader2 className="animate-spin mx-auto mb-2"/>Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-10 text-slate-600 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
                No tasks found. Assign one to get started!
              </div>
            ) : (
              tasks.map(t => (
                <div key={t.id} className="bg-slate-900 p-5 rounded-xl shadow-md border border-slate-800 group hover:border-slate-700 transition-all">
                  
                  {editingId === t.id ? (
                    // --- EDIT MODE ---
                    <div className="flex gap-4 items-center">
                      <div className="flex-1 space-y-2">
                        <input 
                          className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-sm text-white"
                          value={editForm.task_name}
                          onChange={e => setEditForm({...editForm, task_name: e.target.value})}
                        />
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-slate-500"/>
                          <input 
                            type="number" step="0.5"
                            className="w-20 bg-slate-950 border border-slate-700 p-1 rounded text-sm text-white"
                            value={editForm.allocated_hours}
                            onChange={e => setEditForm({...editForm, allocated_hours: +e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(t.id)} className="p-2 bg-green-900/30 text-green-400 rounded hover:bg-green-900/50"><Check size={18}/></button>
                        <button onClick={() => setEditingId(null)} className="p-2 bg-slate-800 text-slate-400 rounded hover:bg-slate-700"><X size={18}/></button>
                      </div>
                    </div>
                  ) : (
                    // --- VIEW MODE ---
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-100 text-lg mb-1">{t.task_name}</h4>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                            <User size={12} className="text-blue-400" /> 
                            {t.employee_name}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock size={12} /> 
                            {t.allocated_hours} hrs
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          t.status === 'Accepted' ? 'bg-green-900/30 text-green-400 border-green-900' : 
                          t.status === 'Rejected' ? 'bg-red-900/30 text-red-400 border-red-900' : 
                          'bg-yellow-900/30 text-yellow-400 border-yellow-900'
                        }`}>
                          {t.status}
                        </span>
                        
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => startEdit(t)} 
                            className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-slate-800 rounded transition"
                            title="Edit"
                          >
                            <Pencil size={16}/>
                          </button>
                          <button 
                            onClick={() => handleDelete(t.id)} 
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition"
                            title="Delete"
                          >
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}