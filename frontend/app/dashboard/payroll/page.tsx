// "use client";
// import { useState } from "react";
// import axios from "axios";
// import { Loader2, AlertCircle, CalendarDays, Wallet } from "lucide-react";

// interface PayrollRecord {
//   name: string;
//   base_salary: number;
//   total_working_days: number;
//   days_present: number;
//   final_pay: number;
// }

// export default function PayrollPage() {
//   const [data, setData] = useState<PayrollRecord[]>([]);
//   const [year, setYear] = useState(new Date().getFullYear());
//   const [month, setMonth] = useState(new Date().getMonth() + 1);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       maximumFractionDigits: 0
//     }).format(amount);
//   };

//   const generatePayroll = async () => {
//     setLoading(true);
//     setError("");
//     setData([]);

//     try {
//       const res = await axios.get(`http://localhost:8000/api/payroll?year=${year}&month=${month}`);
//       if (Array.isArray(res.data) && res.data.length > 0) {
//         setData(res.data);
//       } else {
//         setError("No attendance data found for this month.");
//       }
//     } catch (err) {
//       console.error(err);
//       setError("Failed to connect to server. Ensure Backend is running.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-slate-950 p-8 text-slate-200">
//       <div className="max-w-7xl mx-auto">
        
//         {/* Header */}
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
//           <div>
//             <h1 className="text-2xl font-bold text-white flex items-center gap-2">
//               <Wallet className="text-blue-500" /> Monthly Payroll
//             </h1>
//             <p className="text-slate-400 text-sm mt-1">Process salaries based on attendance</p>
//           </div>
//         </div>

//         {/* Controls Card */}
//         <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 mb-8 flex flex-wrap gap-6 items-end">
//           <div>
//             <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Year</label>
//             <input 
//               type="number" 
//               className="p-2.5 bg-slate-950 border border-slate-700 text-white rounded-lg w-32 focus:ring-2 focus:ring-blue-500 outline-none font-medium placeholder-slate-500" 
//               value={year} 
//               onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())} 
//             />
//           </div>
          
//           <div>
//             <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Month</label>
//             <select 
//               className="p-2.5 bg-slate-950 border border-slate-700 text-white rounded-lg w-48 focus:ring-2 focus:ring-blue-500 outline-none font-medium appearance-none" 
//               value={month} 
//               onChange={(e) => setMonth(parseInt(e.target.value))}
//             >
//               {Array.from({length:12}, (_, i) => (
//                 <option key={i+1} value={i+1} className="bg-slate-900">
//                   {new Date(0, i).toLocaleString('default', {month:'long'})}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <button 
//             onClick={generatePayroll} 
//             disabled={loading}
//             className="bg-blue-600 text-white px-8 py-2.5 rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all font-medium ml-auto shadow-lg shadow-blue-900/20"
//           >
//             {loading ? <Loader2 className="animate-spin" size={18} /> : "Generate Sheet"}
//           </button>
//         </div>

//         {/* Error Message */}
//         {error && (
//           <div className="bg-red-900/20 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3 border border-red-900/50">
//             <AlertCircle size={20} />
//             <span className="font-medium">{error}</span>
//           </div>
//         )}

//         {/* Data Table */}
//         {data.length > 0 && (
//           <div className="bg-slate-900 rounded-xl shadow-xl border border-slate-800 overflow-hidden">
//             <div className="overflow-x-auto">
//               <table className="w-full text-sm text-left">
//                 <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-xs">
//                   <tr>
//                     <th className="p-5 font-semibold">Employee Name</th>
//                     <th className="p-5 font-semibold">Base Salary (CTC)</th>
//                     <th className="p-5 font-semibold">Working Days</th>
//                     <th className="p-5 font-semibold">Days Present</th>
//                     <th className="p-5 font-bold text-right text-slate-300">Final Payout</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-800">
//                   {data.map((row, i) => (
//                     <tr key={i} className="hover:bg-slate-800/50 transition-colors group">
//                       <td className="p-5 font-medium text-white flex items-center gap-3">
//                         <div className="h-8 w-8 rounded-full bg-slate-800 text-blue-400 border border-slate-700 flex items-center justify-center text-xs font-bold">
//                           {row.name.charAt(0)}
//                         </div>
//                         {row.name}
//                       </td>
//                       <td className="p-5 text-slate-400">{formatCurrency(row.base_salary)}</td>
//                       <td className="p-5 text-slate-400 flex items-center gap-2">
//                          <CalendarDays size={16} className="text-slate-600"/>
//                          {row.total_working_days}
//                       </td>
//                       <td className="p-5">
//                         <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
//                           row.days_present >= row.total_working_days - 2 
//                             ? "bg-green-900/30 text-green-400 border-green-900" 
//                             : "bg-yellow-900/30 text-yellow-400 border-yellow-900"
//                         }`}>
//                           {row.days_present} Days
//                         </span>
//                       </td>
//                       <td className="p-5 text-right">
//                         <span className="font-bold text-lg text-emerald-400">
//                           {formatCurrency(row.final_pay)}
//                         </span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
            
//             <div className="bg-slate-950 p-4 border-t border-slate-800 flex justify-end gap-8 text-sm">
//               <div className="flex flex-col items-end">
//                   <span className="text-slate-500 text-xs uppercase font-semibold">Total Payout</span>
//                   <span className="font-bold text-white text-lg tracking-tight">
//                       {formatCurrency(data.reduce((acc, curr) => acc + curr.final_pay, 0))}
//                   </span>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }


"use client";
import { useState, useMemo } from "react";
import axios from "axios";
import { 
  Loader2, AlertCircle, CalendarDays, Wallet, Download, 
  Users, TrendingUp, IndianRupee 
} from "lucide-react";

interface PayrollRecord {
  name: string;
  base_salary: number;
  total_working_days: number;
  days_present: number;
  final_pay: number;
}

export default function PayrollPage() {
  const [data, setData] = useState<PayrollRecord[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Currency Formatter
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Computed Stats
  const stats = useMemo(() => {
      const totalPayout = data.reduce((acc, curr) => acc + curr.final_pay, 0);
      const totalStaff = data.length;
      const avgPay = totalStaff > 0 ? totalPayout / totalStaff : 0;
      return { totalPayout, totalStaff, avgPay };
  }, [data]);

  // Fetch Payroll Data
  const generatePayroll = async () => {
    setLoading(true);
    setError("");
    setData([]);

    try {
      const res = await axios.get(`http://localhost:8000/api/payroll?year=${year}&month=${month}`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        setData(res.data);
      } else {
        setError("No attendance data found for this month.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to server. Ensure Backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // CSV Export Function
  const downloadCSV = () => {
    if (data.length === 0) return;
    
    const headers = ["Employee Name", "Base Salary", "Working Days", "Days Present", "Final Payout"];
    const rows = data.map(row => [
        row.name,
        row.base_salary,
        row.total_working_days,
        row.days_present,
        row.final_pay
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payroll_${year}_${month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-200">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Wallet className="text-blue-500" /> Monthly Payroll
            </h1>
            <p className="text-slate-400 text-sm mt-1">Process salaries based on attendance records.</p>
          </div>
        </div>

        {/* Summary Cards (Only show if data exists) */}
        {data.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex items-center gap-4 shadow-lg">
                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg"><IndianRupee size={24} /></div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Total Payout</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalPayout)}</p>
                    </div>
                </div>
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex items-center gap-4 shadow-lg">
                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg"><Users size={24} /></div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Employees Processed</p>
                        <p className="text-2xl font-bold text-white">{stats.totalStaff}</p>
                    </div>
                </div>
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex items-center gap-4 shadow-lg">
                    <div className="p-3 bg-purple-500/10 text-purple-500 rounded-lg"><TrendingUp size={24} /></div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Avg Salary</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(stats.avgPay)}</p>
                    </div>
                </div>
            </div>
        )}

        {/* Controls Card */}
        <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 mb-8 flex flex-wrap gap-6 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Year</label>
            <input 
              type="number" 
              className="p-2.5 bg-slate-950 border border-slate-700 text-white rounded-lg w-32 focus:ring-2 focus:ring-blue-500 outline-none font-medium transition" 
              value={year} 
              onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())} 
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Month</label>
            <select 
              className="p-2.5 bg-slate-950 border border-slate-700 text-white rounded-lg w-48 focus:ring-2 focus:ring-blue-500 outline-none font-medium appearance-none transition cursor-pointer" 
              value={month} 
              onChange={(e) => setMonth(parseInt(e.target.value))}
            >
              {Array.from({length:12}, (_, i) => (
                <option key={i+1} value={i+1}>
                  {new Date(0, i).toLocaleString('default', {month:'long'})}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 ml-auto">
              <button 
                onClick={generatePayroll} 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg transition-all font-medium flex items-center gap-2 shadow-lg shadow-blue-900/20"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : "Generate Report"}
              </button>
              
              {data.length > 0 && (
                  <button 
                    onClick={downloadCSV}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 border border-slate-700"
                    title="Export CSV"
                  >
                    <Download size={18} />
                  </button>
              )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3 border border-red-900/50">
            <AlertCircle size={20} />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Data Table */}
        {data.length > 0 && (
          <div className="bg-slate-900 rounded-xl shadow-xl border border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-xs">
                  <tr>
                    <th className="p-5 font-bold">Employee Name</th>
                    <th className="p-5 font-bold">Base Salary (CTC)</th>
                    <th className="p-5 font-bold">Working Days</th>
                    <th className="p-5 font-bold">Days Present</th>
                    <th className="p-5 font-bold text-right text-slate-300">Final Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {data.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-800/50 transition-colors group">
                      <td className="p-5 font-medium text-white flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-800 text-blue-400 border border-slate-700 flex items-center justify-center text-xs font-bold">
                          {row.name.charAt(0)}
                        </div>
                        {row.name}
                      </td>
                      <td className="p-5 text-slate-400 font-mono">{formatCurrency(row.base_salary)}</td>
                      <td className="p-5 text-slate-400 flex items-center gap-2">
                          <CalendarDays size={16} className="text-slate-600"/>
                          {row.total_working_days}
                      </td>
                      <td className="p-5">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                          row.days_present >= row.total_working_days - 2 
                            ? "bg-green-900/30 text-green-400 border-green-900" 
                            : "bg-yellow-900/30 text-yellow-400 border-yellow-900"
                        }`}>
                          {row.days_present} Days
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        <span className="font-bold text-lg text-emerald-400 font-mono">
                          {formatCurrency(row.final_pay)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}