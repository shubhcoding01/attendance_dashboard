"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Users, CalendarCheck, DollarSign, Briefcase, LogOut } from "lucide-react";

const menuItems = [
  { name: "Overview", icon: LayoutGrid, href: "/dashboard" },
  { name: "Attendance", icon: CalendarCheck, href: "/dashboard/attendance" },
  { name: "Payroll", icon: DollarSign, href: "/dashboard/payroll" },
  { name: "Tasks", icon: Briefcase, href: "/dashboard/tasks" },
  { name: "Employees", icon: Users, href: "/dashboard/employees" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">W</div>
        <span className="text-xl font-bold text-gray-800">WorkForce</span>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition">
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
}