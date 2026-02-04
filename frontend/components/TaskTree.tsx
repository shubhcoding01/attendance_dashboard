"use client";
import { useState } from "react";
import { 
  ChevronRight, ChevronDown, CheckCircle2, Circle, 
  Plus, Trash2, X, Loader2 
} from "lucide-react";

export default function TaskTree({ task, onUpdateStatus, onDelete, onAddSubtask }: any) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newSubtaskName, setNewSubtaskName] = useState("");

  const handleAdd = () => {
    if (!newSubtaskName.trim()) return;
    onAddSubtask(task.id, newSubtaskName);
    setNewSubtaskName("");
    setIsAdding(false);
  };

  const StatusBadge = ({ status }: any) => (
    <button 
      onClick={(e) => { e.stopPropagation(); onUpdateStatus(task.id, task.status); }}
      className={`px-2 py-0.5 text-[10px] font-bold border flex items-center gap-1.5 rounded transition-all
        ${status === 'Done' ? 'bg-green-900/30 text-green-400 border-green-800 hover:bg-green-900/50' : 
          status === 'In Progress' ? 'bg-blue-900/30 text-blue-400 border-blue-800 hover:bg-blue-900/50' : 
          'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}
      `}
    >
      {status === 'Done' ? <CheckCircle2 size={10}/> : status === 'In Progress' ? <Loader2 size={10} className="animate-spin"/> : <Circle size={10}/>}
      {status}
    </button>
  );

  return (
    <div className="ml-4 border-l border-slate-800 pl-4 relative">
      {/* Node Row */}
      <div className="flex items-center gap-3 py-2 group hover:bg-slate-800/30 rounded pr-2 transition">
        
        {/* Toggle (Only if children exist) */}
        <div className="w-4 flex justify-center">
            {task.subtasks && task.subtasks.length > 0 && (
            <button onClick={() => setIsExpanded(!isExpanded)} className="text-slate-500 hover:text-white">
                {isExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
            </button>
            )}
        </div>

        {/* Status & Name */}
        <StatusBadge status={task.status} />
        
        <div className={`flex-1 text-sm ${task.status === 'Done' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
          {task.task_name}
        </div>

        {/* Actions (Hover Only) */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="p-1 text-slate-500 hover:text-blue-400 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800"
            title="Add Subtask"
          >
            <Plus size={12} />
          </button>
          <button 
            onClick={() => onDelete(task.id)}
            className="p-1 text-slate-500 hover:text-red-400 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Inline Add Form */}
      {isAdding && (
        <div className="flex items-center gap-2 mb-2 ml-8 animate-in fade-in slide-in-from-top-1 duration-200">
          <input 
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none w-48 focus:border-blue-500"
            placeholder="Subtask name..."
            autoFocus
            value={newSubtaskName}
            onChange={e => setNewSubtaskName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <button onClick={handleAdd} className="text-xs bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded text-white">Add</button>
          <button onClick={() => setIsAdding(false)} className="text-xs text-slate-500 hover:text-white"><X size={12}/></button>
        </div>
      )}

      {/* Recursive Children Rendering */}
      {isExpanded && task.subtasks && (
        <div className="flex flex-col">
          {task.subtasks.map((sub: any) => (
            <TaskTree 
              key={sub.id} 
              task={sub} 
              onUpdateStatus={onUpdateStatus} 
              onDelete={onDelete} 
              onAddSubtask={onAddSubtask} 
            />
          ))}
        </div>
      )}
    </div>
  );
}