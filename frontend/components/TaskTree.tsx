// "use client";
// import { useState } from "react";
// import { 
//   ChevronRight, ChevronDown, CheckCircle2, Circle, 
//   Plus, Trash2, X, Loader2, Lock 
// } from "lucide-react";

// export default function TaskTree({ task, onUpdateStatus, onDelete, onAddSubtask, role }: any) {
//   const [isExpanded, setIsExpanded] = useState(true);
//   const [isAdding, setIsAdding] = useState(false);
//   const [newSubtaskName, setNewSubtaskName] = useState("");

//   const isDone = task.status === "Done";
  
//   // PERMISSION LOGIC:
//   // Admin can edit anything. Employees can only edit if task is NOT done.
//   const canEdit = role === 'Admin' || !isDone;

//   const handleAdd = () => {
//     if (!newSubtaskName.trim()) return;
//     onAddSubtask(task.id, newSubtaskName);
//     setNewSubtaskName("");
//     setIsAdding(false);
//   };

//   const handleStatusClick = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     if (!canEdit) return; 
//     onUpdateStatus(task.id, task.status);
//   };

//   const handleDeleteClick = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     if (!canEdit) return;
//     onDelete(task.id);
//   };

//   // Badge Component
//   const StatusBadge = () => (
//     <button 
//       onClick={handleStatusClick}
//       disabled={!canEdit}
//       className={`
//         px-2 py-0.5 text-[10px] font-bold border flex items-center gap-1.5 rounded transition-all
//         ${task.status === 'Done' ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800' : 
//           task.status === 'In Progress' ? 'bg-blue-900/30 text-blue-400 border-blue-800 hover:bg-blue-900/50' : 
//           'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}
//         ${!canEdit ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}
//       `}
//     >
//       {task.status === 'Done' ? <Lock size={10}/> : 
//        task.status === 'In Progress' ? <Loader2 size={10} className="animate-spin"/> : 
//        <Circle size={10}/>}
//       {task.status}
//     </button>
//   );

//   return (
//     <div className="ml-4 border-l border-slate-800 pl-4 relative">
//       {/* Node Row */}
//       <div className={`flex items-center gap-3 py-2 group rounded pr-2 transition ${isDone && !canEdit ? 'opacity-60' : 'hover:bg-slate-800/30'}`}>
        
//         {/* Toggle */}
//         <div className="w-4 flex justify-center">
//             {task.subtasks && task.subtasks.length > 0 && (
//             <button onClick={() => setIsExpanded(!isExpanded)} className="text-slate-500 hover:text-white">
//                 {isExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
//             </button>
//             )}
//         </div>

//         <StatusBadge />
        
//         <div className={`flex-1 text-sm ${isDone ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
//           {task.task_name}
//         </div>

//         {/* Actions (Hidden if locked) */}
//         {canEdit && (
//           <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
//             <button 
//               onClick={() => setIsAdding(!isAdding)}
//               className="p-1 text-slate-500 hover:text-blue-400 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800"
//               title="Add Subtask"
//             >
//               <Plus size={12} />
//             </button>
//             <button 
//               onClick={handleDeleteClick}
//               className="p-1 text-slate-500 hover:text-red-400 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800"
//               title="Delete"
//             >
//               <Trash2 size={12} />
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Inline Add Form */}
//       {isAdding && (
//         <div className="flex items-center gap-2 mb-2 ml-8 animate-in fade-in slide-in-from-top-1 duration-200">
//           <input 
//             className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none w-48 focus:border-blue-500"
//             placeholder="Subtask name..."
//             autoFocus
//             value={newSubtaskName}
//             onChange={e => setNewSubtaskName(e.target.value)}
//             onKeyDown={e => e.key === 'Enter' && handleAdd()}
//           />
//           <button onClick={handleAdd} className="text-xs bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded text-white">Add</button>
//           <button onClick={() => setIsAdding(false)} className="text-xs text-slate-500 hover:text-white"><X size={12}/></button>
//         </div>
//       )}

//       {/* Recursive Children Rendering */}
//       {isExpanded && task.subtasks && (
//         <div className="flex flex-col">
//           {task.subtasks.map((sub: any) => (
//             <TaskTree 
//               key={sub.id} 
//               task={sub} 
//               role={role} // Pass role down to children!
//               onUpdateStatus={onUpdateStatus} 
//               onDelete={onDelete} 
//               onAddSubtask={onAddSubtask} 
//             />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

"use client";
import { useState } from "react";
import { 
  ChevronRight, ChevronDown, Circle, Plus, Trash2, X, Loader2, Lock, 
  Bug, BookOpen, CheckSquare, Flame, ArrowUp, ArrowDown, Minus, Trophy
} from "lucide-react";

// --- ICONS ---
const TypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'Bug': return <Bug size={14} className="text-red-400" />;
    case 'Story': return <BookOpen size={14} className="text-green-400" />;
    case 'Epic': return <Flame size={14} className="text-purple-400" />;
    default: return <CheckSquare size={14} className="text-blue-400" />;
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

export default function TaskTree({ task, onUpdateStatus, onDelete, onAddSubtask, role, username }: any) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // New loading state
  const [newSubtaskName, setNewSubtaskName] = useState("");

  const isDone = task.status === "Done";
  
  // --- STRICT PERMISSION LOGIC ---
  // 1. Admin can always edit.
  // 2. Employees can ONLY edit if they are the assignee AND task is not Done.
  const isAssignee = task.employee_name === username;
  const canEdit = role === 'Admin' || (isAssignee && !isDone);

  const handleAdd = async () => {
    if (!newSubtaskName.trim()) return;
    setIsSaving(true);
    await onAddSubtask(task.id, newSubtaskName);
    setNewSubtaskName("");
    setIsAdding(false);
    setIsSaving(false);
    setIsExpanded(true); // Auto-expand to show new item
  };

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEdit) return; 
    onUpdateStatus(task.id, task.status);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEdit) return;
    onDelete(task.id);
  };

  // Badge Component
  const StatusBadge = () => (
    <button 
      onClick={handleStatusClick}
      disabled={!canEdit}
      className={`
        px-2 py-0.5 text-[10px] font-bold border flex items-center gap-1.5 rounded transition-all min-w-[85px] justify-center
        ${task.status === 'Done' ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800' : 
          task.status === 'In Progress' ? 'bg-blue-900/30 text-blue-400 border-blue-800 hover:bg-blue-900/50' : 
          'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}
        ${!canEdit ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}
      `}
    >
      {task.status === 'Done' ? <Lock size={10}/> : 
       task.status === 'In Progress' ? <Loader2 size={10} className="animate-spin"/> : 
       <Circle size={10}/>}
      {task.status}
    </button>
  );

  return (
    <div className="ml-4 border-l border-slate-800 pl-4 relative">
      {/* Node Row */}
      <div className={`flex items-center gap-3 py-2 group rounded pr-2 transition ${isDone && !canEdit ? 'opacity-60' : 'hover:bg-slate-800/30'}`}>
        
        {/* Toggle / Leaf Indicator */}
        <div className="w-4 flex justify-center flex-shrink-0">
            {task.subtasks && task.subtasks.length > 0 ? (
            <button onClick={() => setIsExpanded(!isExpanded)} className="text-slate-500 hover:text-white transition">
                {isExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
            </button>
            ) : (
                <div className="w-2 h-2 rounded-full border border-slate-700 bg-slate-800"></div> 
            )}
        </div>

        {/* Task Type & Key */}
        <div className="flex items-center gap-2 flex-shrink-0 min-w-[90px]" title="Task Type & Key">
            <TypeIcon type={task.task_type} />
            <span className="text-[10px] font-mono text-slate-500">{task.task_key}</span>
        </div>

        {/* Status */}
        <div className="flex-shrink-0">
            <StatusBadge />
        </div>
        
        {/* Name */}
        <div className={`flex-1 text-sm truncate font-medium ${isDone ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
          {task.task_name}
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-3 mr-2 opacity-70 group-hover:opacity-100 transition">
            <div title={`Priority: ${task.priority}`}><PriorityIcon priority={task.priority} /></div>
            
            {task.story_points > 0 && (
                <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-[10px] text-slate-400" title="Story Points">
                    <Trophy size={10} className="text-yellow-600"/> {task.story_points}
                </div>
            )}

            {task.employee_name && (
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-bold ${task.employee_name === username ? 'bg-blue-900 border-blue-500 text-blue-200' : 'bg-slate-800 border-slate-700 text-slate-400'}`} title={`Assignee: ${task.employee_name}`}>
                    {task.employee_name.charAt(0)}
                </div>
            )}
        </div>

        {/* Actions (Hidden if locked) */}
        {canEdit && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="p-1.5 text-slate-500 hover:text-blue-400 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 transition shadow-sm"
              title="Add Subtask"
            >
              <Plus size={12} />
            </button>
            <button 
              onClick={handleDeleteClick}
              className="p-1.5 text-slate-500 hover:text-red-400 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 transition shadow-sm"
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Inline Add Form */}
      {isAdding && (
        <div className="flex items-center gap-2 mb-2 ml-10 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="w-2 h-[1px] bg-slate-700"></div> {/* Visual Connector */}
          <input 
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none w-64 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
            placeholder="Subtask name..."
            autoFocus
            disabled={isSaving}
            value={newSubtaskName}
            onChange={e => setNewSubtaskName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <button onClick={handleAdd} disabled={isSaving} className="text-xs bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-white font-medium transition shadow-sm disabled:opacity-50">
            {isSaving ? <Loader2 size={12} className="animate-spin"/> : "Add"}
          </button>
          <button onClick={() => setIsAdding(false)} className="text-xs text-slate-500 hover:text-white transition p-1"><X size={14}/></button>
        </div>
      )}

      {/* Recursive Children Rendering */}
      {isExpanded && task.subtasks && (
        <div className="flex flex-col">
          {task.subtasks.map((sub: any) => (
            <TaskTree 
              key={sub.id} 
              task={sub} 
              role={role} 
              username={username} // Pass username down!
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