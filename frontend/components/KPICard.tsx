// import { LucideIcon } from "lucide-react";

// interface KPICardProps {
//   title: string;
//   value: string | number;
//   icon: LucideIcon;
//   color: string; // e.g. "text-blue-500"
//   bg: string;    // e.g. "bg-blue-500/10"
// }

// export default function KPICard({ title, value, icon: Icon, color, bg }: KPICardProps) {
//   return (
//     <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 hover:border-slate-700 transition-colors">
//       <div className="flex items-center justify-between">
//         <div>
//           <p className="text-sm text-slate-400 font-medium mb-1">{title}</p>
//           <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
//         </div>
//         <div className={`p-3 rounded-lg ${bg} ${color}`}>
//           <Icon size={24} />
//         </div>
//       </div>
//     </div>
//   );
// }


import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string; // e.g. "text-blue-400"
  bg: string;    // e.g. "bg-blue-400/10"
}

export default function KPICard({ title, value, icon: Icon, color, bg }: KPICardProps) {
  return (
    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg hover:border-slate-700 transition-all duration-300 group">
      <div className="flex items-center gap-4">
        {/* Icon Container with Hover Effect */}
        <div className={`p-3 rounded-lg ${bg} ${color} group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={24} />
        </div>

        {/* Text Content */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            {value}
          </h3>
        </div>
      </div>
    </div>
  );
}