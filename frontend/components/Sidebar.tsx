// "use client";
// import Link from "next/link";
// import { usePathname, useRouter } from "next/navigation"; // Added useRouter
// import { LayoutGrid, Users, CalendarCheck, DollarSign, Briefcase, LogOut, BarChart3 } from "lucide-react";

// const menuItems = [
//   { name: "Overview", icon: LayoutGrid, href: "/dashboard" },
//   { name: "Attendance", icon: CalendarCheck, href: "/dashboard/attendance" },
//   { name: "Reports", icon: BarChart3, href: "/dashboard/reports" },
//   { name: "Payroll", icon: DollarSign, href: "/dashboard/payroll" },
//   { name: "Tasks", icon: Briefcase, href: "/dashboard/tasks" },
//   { name: "Employees", icon: Users, href: "/dashboard/users" },
// ];

// export default function Sidebar() {
//   const pathname = usePathname();
//   const router = useRouter(); // Hook for redirection

//   const handleLogout = () => {
//     // 1. Ask for confirmation
//     if (confirm("Are you sure you want to logout?")) {
//       // 2. Clear credentials
//       localStorage.removeItem("role");
//       localStorage.removeItem("username");
      
//       // 3. Force redirect to Login Page
//       router.push("/"); 
//     }
//   };

//   return (
//     <div className="h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
      
//       {/* Logo Area */}
//       <div className="p-6 flex items-center gap-3">
//         <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/20">
//           W
//         </div>
//         <span className="text-xl font-bold text-white tracking-tight">WorkForce</span>
//       </div>

//       {/* Navigation Links */}
//       <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
//         {menuItems.map((item) => {
//           const isActive = pathname === item.href;
//           return (
//             <Link
//               key={item.href}
//               href={item.href}
//               className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
//                 isActive
//                   ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
//                   : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
//               }`}
//             >
//               <item.icon size={20} className={isActive ? "text-white" : "text-slate-500"} />
//               {item.name}
//             </Link>
//           );
//         })}
//       </nav>

//       {/* Logout Button */}
//       <div className="p-4 border-t border-slate-800">
//         <button 
//           onClick={handleLogout}
//           className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-red-900/10 hover:text-red-300 rounded-lg text-sm font-medium transition-colors"
//         >
//           <LogOut size={20} />
//           Logout
//         </button>
//       </div>
//     </div>
//   );
// }


"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutGrid, Users, CalendarCheck, DollarSign, Briefcase, LogOut, BarChart3, User, Shield 
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  // 1. Check Role on Load
  useEffect(() => {
    // Ensure we are on the client side before accessing localStorage
    const storedRole = localStorage.getItem("role");
    setRole(storedRole);
  }, []);

  // 2. Define Menus based on Role
  const adminMenu = [
    { name: "Overview", icon: LayoutGrid, href: "/dashboard" },
    { name: "Attendance", icon: CalendarCheck, href: "/dashboard/attendance" },
    { name: "Reports", icon: BarChart3, href: "/dashboard/reports" },
    { name: "Payroll", icon: DollarSign, href: "/dashboard/payroll" },
    { name: "Tasks", icon: Briefcase, href: "/dashboard/tasks" },
    { name: "Employees", icon: Users, href: "/dashboard/users" },
  ];

  const employeeMenu = [
    { name: "My Dashboard", icon: LayoutGrid, href: "/dashboard" },
    // You can add "My Tasks" later if needed
  ];

  // Select the correct menu
  const menuItems = role === "Employee" ? employeeMenu : adminMenu;

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.clear();
      router.push("/");
    }
  };

  // Prevent hydration errors by waiting for role
  if (!role) return <div className="h-screen w-64 bg-slate-900 border-r border-slate-800" />; 

  return (
    <div className="h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 transition-all duration-300">
      
      {/* Logo Area */}
      <div className="p-6 flex items-center gap-3">
        <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/20">
          W
        </div>
        <span className="text-xl font-bold text-white tracking-tight">WorkForce</span>
      </div>

      {/* Menu Area */}
      <div className="px-6 pb-4 flex-1 overflow-y-auto">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 mt-2">
          {role === 'Admin' ? 'Admin Controls' : 'Employee Menu'}
        </div>
        <nav className="space-y-1">
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
                <item.icon size={18} className={isActive ? "text-white" : "text-slate-500"} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile Footer */}
      <div className="mt-auto p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="h-9 w-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 border border-slate-600">
            {role === 'Admin' ? <Shield size={16} className="text-purple-400"/> : <User size={16} className="text-blue-400"/>}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">My Account</p>
            <p className="text-xs text-slate-400 truncate font-mono">{role}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-red-900/10 hover:text-red-300 rounded-lg text-sm font-medium transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}