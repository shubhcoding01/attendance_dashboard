"use client";
import { useEffect, useState } from "react";
import axios from "axios"; // Tool to talk to Python
import KPICard from "@/components/KPICard";
import { Users, Clock, Zap, AlertCircle } from "lucide-react";

// Define what the data looks like
interface DashboardData {
  total_staff: number;
  active_today: number;
  avg_hours: string;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch Data from Python Backend when page loads
  useEffect(() => {
    // NOTE: Make sure your FastAPI backend is running on port 8000!
    axios.get("http://127.0.0.1:8000/api/overview")
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Backend offline?", err);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard 
          title="Total Employees" 
          value={data?.total_staff || "--"} 
          icon={Users} 
          color="bg-blue-600" 
        />
        <KPICard 
          title="Active Today" 
          value={data?.active_today || "--"} 
          icon={Zap} 
          color="bg-green-500" 
        />
        <KPICard 
          title="Avg Hours" 
          value={data?.avg_hours || "--"} 
          icon={Clock} 
          color="bg-purple-500" 
        />
        <KPICard 
          title="Pending Issues" 
          value="3" 
          icon={AlertCircle} 
          color="bg-red-500" 
        />
      </div>

      {/* Placeholder for Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 h-80 flex items-center justify-center text-gray-400">
          Chart: Monthly Attendance Trend
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 h-80 flex items-center justify-center text-gray-400">
          Chart: Department Distribution
        </div>
      </div>
    </div>
  );
}