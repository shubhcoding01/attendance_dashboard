"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Users, CalendarCheck, DollarSign, Briefcase, LogOut, BarChart3 } from "lucide-react";

const menuItems = [
  { name: "Overview", icon: LayoutGrid, href: "/dashboard" },
  { name: "Attendance", icon: CalendarCheck, href: "/dashboard/attendance" },
  { name: "Payroll", icon: DollarSign, href: "/dashboard/payroll" },
  { name: "Tasks", icon: Briefcase, href: "/dashboard/tasks" },
  { name: "Employees", icon: Users, href: "/dashboard/users" }, // Points to your users/page.tsx
  // Add this to your menuItems array in Sidebar.tsx
{ name: "Reports", icon: BarChart3, href: "/dashboard/reports" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
      
      {/* Logo Area */}
      <div className="p-6 flex items-center gap-3">
        <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/20">
          W
        </div>
        <span className="text-xl font-bold text-white tracking-tight">WorkForce</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <item.icon size={20} className={isActive ? "text-white" : "text-slate-500"} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-800">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-red-900/10 hover:text-red-300 rounded-lg text-sm font-medium transition-colors">
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
}