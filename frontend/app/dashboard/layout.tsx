// import Sidebar from "@/components/Sidebar";

// export default function DashboardLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <div className="flex min-h-screen bg-slate-950 text-slate-200">
//       {/* Fixed Sidebar on the left */}
//       <Sidebar />
      
//       {/* Scrollable Content Area */}
//       <main className="flex-1 p-8 overflow-y-auto h-screen">
//         {children}
//       </main>
//     </div>
//   );
// }


import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden">
      {/* Sidebar Wrapper (Fixed width, non-shrinkable) */}
      <aside className="flex-shrink-0 h-full border-r border-slate-800 z-20">
        <Sidebar />
      </aside>
      
      {/* Main Content Area (Scrollable independently) */}
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden relative scroll-smooth custom-scrollbar">
        {children}
      </main>
    </div>
  );
}