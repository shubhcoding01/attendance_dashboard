// "use client";
// import { useState, useEffect } from "react";
// import axios from "axios";
// import { Calendar as CalendarIcon, Search, CheckCircle2, Clock } from "lucide-react";

// export default function AttendancePage() {
//   const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
//   const [logs, setLogs] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);

//   const fetchLogs = async () => {
//     setLoading(true);
//     try {
//       const res = await axios.get(`http://localhost:8000/api/attendance/daily?date=${date}`);
//       setLogs(res.data);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { fetchLogs(); }, [date]);

//   return (
//     <div className="min-h-screen bg-slate-950 p-8 text-slate-200">
//       <div className="max-w-4xl mx-auto">
//         <h1 className="text-2xl font-bold mb-8 flex items-center gap-2 text-white">
//           <CalendarIcon className="text-blue-500" /> Daily Attendance Logs
//         </h1>

//         {/* Filter Bar */}
//         <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 mb-8 flex items-end gap-4">
//           <div className="w-full max-w-xs">
//             <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">Select Date</label>
//             <input 
//               type="date" 
//               value={date}
//               onChange={(e) => setDate(e.target.value)}
//               className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
//             />
//           </div>
//           <button onClick={fetchLogs} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-500 transition font-medium">
//             <Search size={18} />
//           </button>
//         </div>

//         {/* Logs Table */}
//         <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
//           {logs.length === 0 ? (
//             <div className="p-10 text-center text-slate-500">No records found for this date.</div>
//           ) : (
//             <table className="w-full text-left text-sm">
//               <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-xs">
//                 <tr>
//                   <th className="p-4">Employee</th>
//                   <th className="p-4">Hours Logged</th>
//                   <th className="p-4">Status</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-800">
//                 {logs.map((log, i) => (
//                   <tr key={i} className="hover:bg-slate-800/50">
//                     <td className="p-4 font-medium text-white">{log.employee_name}</td>
//                     <td className="p-4 text-slate-400 font-mono">
//                       {log.working_hours > 0 ? `${log.working_hours.toFixed(2)} hrs` : "--"}
//                     </td>
//                     <td className="p-4">
//                       {log.status.includes("Present") ? (
//                         <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-green-900/30 text-green-400 border border-green-900">
//                           <CheckCircle2 size={12}/> Completed
//                         </span>
//                       ) : (
//                         <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-yellow-900/30 text-yellow-400 border border-yellow-900">
//                           <Clock size={12}/> Working
//                         </span>
//                       )}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }


// "use client";
// import { useState, useEffect, useMemo } from "react";
// import axios from "axios";
// import { 
//   Calendar as CalendarIcon, Search, CheckCircle2, 
//   Clock, Users, Timer, AlertCircle, Loader2 
// } from "lucide-react";

// export default function AttendancePage() {
//   const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
//   const [logs, setLogs] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);

//   const fetchLogs = async () => {
//     setLoading(true);
//     try {
//       const res = await axios.get(`http://localhost:8000/api/attendance/daily?date=${date}`);
//       setLogs(res.data);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { fetchLogs(); }, [date]);

//   // Calculate Daily Stats on the fly
//   const stats = useMemo(() => {
//     const total = logs.length;
//     const completed = logs.filter(l => l.status.includes("Present")).length;
//     const working = logs.filter(l => l.status.includes("Working")).length;
    
//     // Calculate average hours safely (handling potential nulls from backend)
//     const totalHours = logs.reduce((acc, curr) => acc + (curr.working_hours || 0), 0);
//     const avg = total > 0 ? (totalHours / total).toFixed(1) : "0.0";

//     return { total, completed, working, avg };
//   }, [logs]);

//   return (
//     <div className="min-h-screen bg-slate-950 p-8 text-slate-200">
//       <div className="max-w-5xl mx-auto">
        
//         {/* Header */}
//         <div className="mb-8">
//             <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
//                 <CalendarIcon className="text-blue-500" /> Daily Attendance
//             </h1>
//             <p className="text-slate-400 text-sm mt-1">View employee check-ins and working hours for a specific date.</p>
//         </div>

//         {/* Stats Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
//             <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
//                 <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg"><Users size={20} /></div>
//                 <div>
//                     <p className="text-xs text-slate-500 uppercase font-bold">Total Staff</p>
//                     <p className="text-xl font-bold text-white">{stats.total}</p>
//                 </div>
//             </div>
//             <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
//                 <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-lg"><Clock size={20} /></div>
//                 <div>
//                     <p className="text-xs text-slate-500 uppercase font-bold">Active Now</p>
//                     <p className="text-xl font-bold text-white">{stats.working}</p>
//                 </div>
//             </div>
//             <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
//                 <div className="p-3 bg-green-500/10 text-green-500 rounded-lg"><CheckCircle2 size={20} /></div>
//                 <div>
//                     <p className="text-xs text-slate-500 uppercase font-bold">Completed</p>
//                     <p className="text-xl font-bold text-white">{stats.completed}</p>
//                 </div>
//             </div>
//             <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
//                 <div className="p-3 bg-purple-500/10 text-purple-500 rounded-lg"><Timer size={20} /></div>
//                 <div>
//                     <p className="text-xs text-slate-500 uppercase font-bold">Avg Hours</p>
//                     <p className="text-xl font-bold text-white">{stats.avg}h</p>
//                 </div>
//             </div>
//         </div>

//         {/* Filter Bar */}
//         <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 mb-8 flex items-end gap-4 shadow-lg">
//           <div className="w-full max-w-xs">
//             <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Select Date</label>
//             <input 
//               type="date" 
//               value={date}
//               onChange={(e) => setDate(e.target.value)}
//               className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
//             />
//           </div>
//           <button 
//             onClick={fetchLogs} 
//             disabled={loading}
//             className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg transition font-medium flex items-center gap-2 shadow-lg shadow-blue-900/20"
//           >
//             {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
//             Fetch Records
//           </button>
//         </div>

//         {/* Logs Table */}
//         <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
//           {logs.length === 0 ? (
//             <div className="flex flex-col items-center justify-center p-16 text-slate-500">
//                 <AlertCircle size={48} className="mb-4 opacity-20" />
//                 <p>No records found for {date}.</p>
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//                 <table className="w-full text-left text-sm">
//                 <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-xs">
//                     <tr>
//                     <th className="p-4 font-bold">Employee Name</th>
//                     <th className="p-4 font-bold">Logged Hours</th>
//                     <th className="p-4 font-bold">Current Status</th>
//                     </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-800">
//                     {logs.map((log, i) => (
//                     <tr key={i} className="hover:bg-slate-800/50 transition">
//                         <td className="p-4 font-medium text-white flex items-center gap-3">
//                             <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
//                                 {log.employee_name.charAt(0)}
//                             </div>
//                             {log.employee_name}
//                         </td>
//                         <td className="p-4 text-slate-300 font-mono">
//                         {/* Safety check for null/NaN working_hours */}
//                         {(log.working_hours || 0) > 0 ? (
//                             <span className="text-blue-400 font-bold">{(log.working_hours || 0).toFixed(2)} hrs</span>
//                         ) : (
//                             <span className="text-slate-600">--</span>
//                         )}
//                         </td>
//                         <td className="p-4">
//                         {log.status.includes("Present") ? (
//                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-900/30 text-green-400 border border-green-800">
//                             <CheckCircle2 size={12}/> Shift Complete
//                             </span>
//                         ) : (
//                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-900/30 text-yellow-400 border border-yellow-800 animate-pulse">
//                             <Clock size={12}/> Currently Working
//                             </span>
//                         )}
//                         </td>
//                     </tr>
//                     ))}
//                 </tbody>
//                 </table>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { 
  Calendar as CalendarIcon, Search, CheckCircle2, 
  Clock, Users, Timer, AlertCircle, Loader2 
} from "lucide-react";

export default function AttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/api/attendance/daily?date=${date}`);
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [date]);

  // Calculate Daily Stats (Fix applied here)
  const stats = useMemo(() => {
    const total = logs.length;
    // Safety check: ensure l.status exists before calling .includes
    const completed = logs.filter(l => l.status && l.status.includes("Present")).length;
    const working = logs.filter(l => l.status && l.status.includes("Working")).length;
    
    const totalHours = logs.reduce((acc, curr) => acc + (curr.working_hours || 0), 0);
    const avg = total > 0 ? (totalHours / total).toFixed(1) : "0.0";

    return { total, completed, working, avg };
  }, [logs]);

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-200">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
            <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
                <CalendarIcon className="text-blue-500" /> Daily Attendance
            </h1>
            <p className="text-slate-400 text-sm mt-1">View employee check-ins and working hours for a specific date.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-4 shadow-sm">
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg"><Users size={20} /></div>
                <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Total Staff</p>
                    <p className="text-xl font-bold text-white">{stats.total}</p>
                </div>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-4 shadow-sm">
                <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-lg"><Clock size={20} /></div>
                <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Active Now</p>
                    <p className="text-xl font-bold text-white">{stats.working}</p>
                </div>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-4 shadow-sm">
                <div className="p-3 bg-green-500/10 text-green-500 rounded-lg"><CheckCircle2 size={20} /></div>
                <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Completed</p>
                    <p className="text-xl font-bold text-white">{stats.completed}</p>
                </div>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-4 shadow-sm">
                <div className="p-3 bg-purple-500/10 text-purple-500 rounded-lg"><Timer size={20} /></div>
                <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Avg Hours</p>
                    <p className="text-xl font-bold text-white">{stats.avg}h</p>
                </div>
            </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 mb-8 flex items-end gap-4 shadow-lg">
          <div className="w-full max-w-xs">
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Select Date</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <button 
            onClick={fetchLogs} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg transition font-medium flex items-center gap-2 shadow-lg shadow-blue-900/20"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
            Fetch Records
          </button>
        </div>

        {/* Logs Table */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-slate-500">
                <AlertCircle size={48} className="mb-4 opacity-20" />
                <p>No records found for {date}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-xs">
                    <tr>
                    <th className="p-4 font-bold">Employee Name</th>
                    <th className="p-4 font-bold">Logged Hours</th>
                    <th className="p-4 font-bold">Current Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {logs.map((log, i) => (
                    <tr key={i} className="hover:bg-slate-800/50 transition">
                        <td className="p-4 font-medium text-white flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                                {log.employee_name ? log.employee_name.charAt(0) : "?"}
                            </div>
                            {log.employee_name || "Unknown"}
                        </td>
                        <td className="p-4 text-slate-300 font-mono">
                        {(log.working_hours || 0) > 0 ? (
                            <span className="text-blue-400 font-bold">{(log.working_hours || 0).toFixed(2)} hrs</span>
                        ) : (
                            <span className="text-slate-600">--</span>
                        )}
                        </td>
                        <td className="p-4">
                        {/* Safe check for status */}
                        {log.status && log.status.includes("Present") ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-900/30 text-green-400 border border-green-800">
                            <CheckCircle2 size={12}/> Shift Complete
                            </span>
                        ) : log.status && log.status.includes("Working") ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-900/30 text-yellow-400 border border-yellow-800 animate-pulse">
                            <Clock size={12}/> Currently Working
                            </span>
                        ) : (
                            <span className="text-slate-500 text-xs">Unknown Status</span>
                        )}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}