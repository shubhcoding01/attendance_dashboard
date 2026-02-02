"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { Calendar as CalendarIcon, Search, CheckCircle2, Clock } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-200">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 flex items-center gap-2 text-white">
          <CalendarIcon className="text-blue-500" /> Daily Attendance Logs
        </h1>

        {/* Filter Bar */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 mb-8 flex items-end gap-4">
          <div className="w-full max-w-xs">
            <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">Select Date</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button onClick={fetchLogs} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-500 transition font-medium">
            <Search size={18} />
          </button>
        </div>

        {/* Logs Table */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
          {logs.length === 0 ? (
            <div className="p-10 text-center text-slate-500">No records found for this date.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-xs">
                <tr>
                  <th className="p-4">Employee</th>
                  <th className="p-4">Hours Logged</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {logs.map((log, i) => (
                  <tr key={i} className="hover:bg-slate-800/50">
                    <td className="p-4 font-medium text-white">{log.employee_name}</td>
                    <td className="p-4 text-slate-400 font-mono">
                      {log.working_hours > 0 ? `${log.working_hours.toFixed(2)} hrs` : "--"}
                    </td>
                    <td className="p-4">
                      {log.status.includes("Present") ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-green-900/30 text-green-400 border border-green-900">
                          <CheckCircle2 size={12}/> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-yellow-900/30 text-yellow-400 border border-yellow-900">
                          <Clock size={12}/> Working
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}