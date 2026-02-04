// "use client";
// import { useEffect, useState } from "react";
// import Link from "next/link";
// import { usePathname, useRouter } from "next/navigation";
// import { 
//   LayoutGrid, Users, CalendarCheck, DollarSign, Briefcase, LogOut, BarChart3, User, Shield 
// } from "lucide-react";

// export default function Sidebar() {
//   const pathname = usePathname();
//   const router = useRouter();
//   const [role, setRole] = useState<string | null>(null);

//   // 1. Check Role on Load
//   useEffect(() => {
//     // Ensure we are on the client side before accessing localStorage
//     const storedRole = localStorage.getItem("role");
//     setRole(storedRole);
//   }, []);

//   // 2. Define Menus based on Role
//   const adminMenu = [
//     { name: "Overview", icon: LayoutGrid, href: "/dashboard" },
//     { name: "Attendance", icon: CalendarCheck, href: "/dashboard/attendance" },
//     { name: "Reports", icon: BarChart3, href: "/dashboard/reports" },
//     { name: "Payroll", icon: DollarSign, href: "/dashboard/payroll" },
//     { name: "Tasks", icon: Briefcase, href: "/dashboard/tasks" },
//     { name: "Employees", icon: Users, href: "/dashboard/users" },
//   ];

//   const employeeMenu = [
//     { name: "My Dashboard", icon: LayoutGrid, href: "/dashboard" },
//     // You can add "My Tasks" later if needed
//   ];

//   // Select the correct menu
//   const menuItems = role === "Employee" ? employeeMenu : adminMenu;

//   const handleLogout = () => {
//     if (confirm("Are you sure you want to logout?")) {
//       localStorage.clear();
//       router.push("/");
//     }
//   };

//   // Prevent hydration errors by waiting for role
//   if (!role) return <div className="h-screen w-64 bg-slate-900 border-r border-slate-800" />; 

//   return (
//     <div className="h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 transition-all duration-300">
      
//       {/* Logo Area */}
//       <div className="p-6 flex items-center gap-3">
//         <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/20">
//           W
//         </div>
//         <span className="text-xl font-bold text-white tracking-tight">WorkForce</span>
//       </div>

//       {/* Menu Area */}
//       <div className="px-6 pb-4 flex-1 overflow-y-auto">
//         <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 mt-2">
//           {role === 'Admin' ? 'Admin Controls' : 'Employee Menu'}
//         </div>
//         <nav className="space-y-1">
//           {menuItems.map((item) => {
//             const isActive = pathname === item.href;
//             return (
//               <Link
//                 key={item.href}
//                 href={item.href}
//                 className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
//                   isActive
//                     ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
//                     : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
//                 }`}
//               >
//                 <item.icon size={18} className={isActive ? "text-white" : "text-slate-500"} />
//                 {item.name}
//               </Link>
//             );
//           })}
//         </nav>
//       </div>

//       {/* User Profile Footer */}
//       <div className="mt-auto p-4 border-t border-slate-800">
//         <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
//           <div className="h-9 w-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 border border-slate-600">
//             {role === 'Admin' ? <Shield size={16} className="text-purple-400"/> : <User size={16} className="text-blue-400"/>}
//           </div>
//           <div className="overflow-hidden">
//             <p className="text-sm font-bold text-white truncate">My Account</p>
//             <p className="text-xs text-slate-400 truncate font-mono">{role}</p>
//           </div>
//         </div>
//         <button 
//           onClick={handleLogout}
//           className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-red-900/10 hover:text-red-300 rounded-lg text-sm font-medium transition-colors"
//         >
//           <LogOut size={18} />
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
  LayoutGrid, Users, CalendarCheck, DollarSign, Briefcase, 
  LogOut, BarChart3, User, Shield, Check, X 
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  // 1. Check Role on Load
  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    setRole(storedRole);
  }, []);

  // 2. Define Menus based on Role
  const adminMenu = [
    { name: "Overview", icon: LayoutGrid, href: "/dashboard" },
    { name: "Attendance", icon: CalendarCheck, href: "/dashboard/attendance" },
    { name: "Reports", icon: BarChart3, href: "/dashboard/reports" },
    { name: "Payroll", icon: DollarSign, href: "/dashboard/payroll" },
    { name: "Projects", icon: Briefcase, href: "/dashboard/tasks" },
    { name: "Employees", icon: Users, href: "/dashboard/users" },
  ];

  const employeeMenu = [
    { name: "Overview", icon: LayoutGrid, href: "/dashboard" },
    { name: "Project Board", icon: Briefcase, href: "/dashboard/tasks" },
  ];

  const menuItems = role === "Employee" ? employeeMenu : adminMenu;

  const performLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  // Prevent hydration errors
  if (!role) return <div className="h-screen w-64 bg-slate-950 border-r border-slate-800 shrink-0" />; 

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
      <div className="px-4 pb-4 flex-1 overflow-y-auto custom-scrollbar">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-2 px-4">
          {role === 'Admin' ? 'Admin Controls' : 'Workspace'}
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
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <item.icon size={18} className={isActive ? "text-white" : "text-slate-500"} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Area */}
      <div className="mt-auto p-4 border-t border-slate-800">
        {/* User Profile */}
        <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white border border-white/10 ${role === 'Admin' ? 'bg-purple-600' : 'bg-blue-600'}`}>
            {role === 'Admin' ? <Shield size={14}/> : <User size={14}/>}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">My Account</p>
            <p className="text-[10px] text-slate-400 truncate font-mono uppercase">{role}</p>
          </div>
        </div>

        {/* Logout Section */}
        {logoutConfirm ? (
            <div className="animate-in slide-in-from-bottom-2 fade-in duration-200">
                <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-3">
                    <p className="text-xs text-red-200 font-medium mb-2 text-center">Confirm Logout?</p>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setLogoutConfirm(false)}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-xs py-1.5 rounded transition"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={performLogout}
                            className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs py-1.5 rounded transition shadow-lg shadow-red-900/20"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        ) : (
            <button 
              onClick={() => setLogoutConfirm(true)}
              className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg text-sm font-medium transition-colors group"
            >
              <LogOut size={18} className="group-hover:text-red-400 transition-colors" />
              Logout
            </button>
        )}
      </div>
    </div>
  );
}