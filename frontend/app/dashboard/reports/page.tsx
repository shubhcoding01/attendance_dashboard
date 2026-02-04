// "use client";
// import { useEffect, useState } from "react";
// import axios from "axios";
// import { BarChart3 } from "lucide-react";
// import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// export default function ReportsPage() {
//   const [data, setData] = useState<any[]>([]);

//   useEffect(() => {
//     axios.get("http://localhost:8000/api/reports/monthly").then(res => setData(res.data));
//   }, []);

//   return (
//     <div className="min-h-screen bg-slate-950 p-8 text-slate-200">
//       <div className="max-w-6xl mx-auto">
//         <h1 className="text-2xl font-bold mb-8 flex items-center gap-2 text-white">
//           <BarChart3 className="text-blue-500" /> Monthly Reports
//         </h1>

//         <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
//           <h3 className="text-lg font-semibold text-white mb-6">Total Working Hours per Employee</h3>
          
//           <div className="h-[400px] w-full">
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart data={data}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
//                 <XAxis dataKey="employee_name" stroke="#94a3b8" />
//                 <YAxis stroke="#94a3b8" />
//                 <Tooltip 
//                   contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#f8fafc' }}
//                   cursor={{fill: '#1e293b'}}
//                 />
//                 <Bar dataKey="total_hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* Detailed Data Table */}
//         <div className="mt-8 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
//           <table className="w-full text-left text-sm">
//              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-xs">
//                 <tr>
//                    <th className="p-4">Employee</th>
//                    <th className="p-4">Month</th>
//                    <th className="p-4">Total Hours</th>
//                    <th className="p-4">Avg Daily</th>
//                 </tr>
//              </thead>
//              <tbody className="divide-y divide-slate-800">
//                 {data.map((row, i) => (
//                    <tr key={i} className="hover:bg-slate-800/50">
//                       <td className="p-4 font-medium text-white">{row.employee_name}</td>
//                       <td className="p-4 text-slate-400">{row.month}</td>
//                       <td className="p-4 text-blue-400 font-bold">{row.total_hours.toFixed(1)} hrs</td>
//                       <td className="p-4 text-slate-400">{row.average_hours.toFixed(1)} hrs</td>
//                    </tr>
//                 ))}
//              </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { 
  BarChart3, Download, TrendingUp, Clock, Users, Calendar, Loader2, Trophy 
} from "lucide-react";
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export default function ReportsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/reports/monthly");
        // Sort by Total Hours DESC for better chart visualization
        const sortedData = res.data.sort((a: any, b: any) => b.total_hours - a.total_hours);
        setData(sortedData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate Summary KPIs
  const stats = useMemo(() => {
    const totalHours = data.reduce((acc, curr) => acc + curr.total_hours, 0);
    const totalDays = data.reduce((acc, curr) => acc + curr.working_days, 0);
    const avgDaily = totalDays > 0 ? (totalHours / totalDays).toFixed(1) : 0;
    const topPerformer = data.length > 0 ? data[0].employee_name : "-";
    
    return { totalHours: totalHours.toFixed(0), avgDaily, topPerformer, headcount: data.length };
  }, [data]);

  // Export to CSV
  const downloadCSV = () => {
    if (data.length === 0) return;
    const headers = ["Employee", "Month", "Working Days", "Total Hours", "Avg Daily Hours"];
    const rows = data.map(row => [
      row.employee_name, row.month, row.working_days, 
      row.total_hours.toFixed(2), row.average_hours.toFixed(2)
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `monthly_report_${new Date().toISOString().slice(0,7)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500"><Loader2 className="animate-spin mr-2"/> Generating Reports...</div>;

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-200">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="text-blue-500" /> Monthly Performance
            </h1>
            <p className="text-slate-400 text-sm mt-1">Analysis of employee working hours and efficiency.</p>
          </div>
          <button 
            onClick={downloadCSV}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm border border-slate-700"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg"><Clock size={24} /></div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Total Hours</p>
                        <p className="text-2xl font-bold text-white">{stats.totalHours}h</p>
                    </div>
                </div>
            </div>
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 text-green-500 rounded-lg"><TrendingUp size={24} /></div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Avg Daily Hours</p>
                        <p className="text-2xl font-bold text-white">{stats.avgDaily}h</p>
                    </div>
                </div>
            </div>
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 text-purple-500 rounded-lg"><Trophy size={24} /></div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Top Performer</p>
                        <p className="text-lg font-bold text-white truncate max-w-[140px]" title={stats.topPerformer}>{stats.topPerformer}</p>
                    </div>
                </div>
            </div>
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-lg"><Users size={24} /></div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Active Staff</p>
                        <p className="text-2xl font-bold text-white">{stats.headcount}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Charts Section */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg mb-8">
          <h3 className="text-sm font-bold text-slate-400 uppercase mb-6 flex items-center gap-2"><Calendar size={16}/> Efficiency Trends</h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="employee_name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Total Hours', angle: -90, position: 'insideLeft', fill: '#475569' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Avg Daily', angle: 90, position: 'insideRight', fill: '#475569' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                  cursor={{fill: '#1e293b'}}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="total_hours" name="Total Hours" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                <Line yAxisId="right" type="monotone" dataKey="average_hours" name="Avg Daily Hours" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Data Table */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
          <table className="w-full text-left text-sm">
             <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-xs">
                <tr>
                   <th className="p-4 font-semibold">Employee Name</th>
                   <th className="p-4 font-semibold">Period</th>
                   <th className="p-4 font-semibold">Days Worked</th>
                   <th className="p-4 font-semibold">Total Hours</th>
                   <th className="p-4 font-semibold">Avg Daily</th>
                   <th className="p-4 font-semibold text-right">Performance</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-800">
                {data.map((row, i) => (
                   <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 font-medium text-white flex items-center gap-3">
                         <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-blue-400">
                            {row.employee_name.charAt(0)}
                         </div>
                         {row.employee_name}
                      </td>
                      <td className="p-4 text-slate-400">{row.month}</td>
                      <td className="p-4 text-slate-300">{row.working_days} Days</td>
                      <td className="p-4 text-blue-400 font-mono font-bold">{row.total_hours.toFixed(1)} h</td>
                      <td className="p-4 text-slate-300 font-mono">{row.average_hours.toFixed(1)} h</td>
                      <td className="p-4 text-right">
                         <span className={`px-2 py-1 rounded text-[10px] font-bold border ${
                            row.average_hours >= 8 ? 'bg-green-900/30 text-green-400 border-green-900' : 
                            row.average_hours >= 6 ? 'bg-yellow-900/30 text-yellow-400 border-yellow-900' : 
                            'bg-red-900/30 text-red-400 border-red-900'
                         }`}>
                            {row.average_hours >= 8 ? 'EXCELLENT' : row.average_hours >= 6 ? 'GOOD' : 'LOW'}
                         </span>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}