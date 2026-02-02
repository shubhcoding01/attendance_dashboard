"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function ReportsPage() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    axios.get("http://localhost:8000/api/reports/monthly").then(res => setData(res.data));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-200">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 flex items-center gap-2 text-white">
          <BarChart3 className="text-blue-500" /> Monthly Reports
        </h1>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-6">Total Working Hours per Employee</h3>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="employee_name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#f8fafc' }}
                  cursor={{fill: '#1e293b'}}
                />
                <Bar dataKey="total_hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Data Table */}
        <div className="mt-8 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm">
             <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-xs">
                <tr>
                   <th className="p-4">Employee</th>
                   <th className="p-4">Month</th>
                   <th className="p-4">Total Hours</th>
                   <th className="p-4">Avg Daily</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-800">
                {data.map((row, i) => (
                   <tr key={i} className="hover:bg-slate-800/50">
                      <td className="p-4 font-medium text-white">{row.employee_name}</td>
                      <td className="p-4 text-slate-400">{row.month}</td>
                      <td className="p-4 text-blue-400 font-bold">{row.total_hours.toFixed(1)} hrs</td>
                      <td className="p-4 text-slate-400">{row.average_hours.toFixed(1)} hrs</td>
                   </tr>
                ))}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}