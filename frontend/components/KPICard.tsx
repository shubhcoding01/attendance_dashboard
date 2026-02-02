import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string; // e.g. "bg-blue-500"
}

export default function KPICard({ title, value, icon: Icon, color }: KPICardProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-full ${color} bg-opacity-10 text-opacity-100`}>
          <Icon className={color.replace("bg-", "text-")} size={24} />
        </div>
      </div>
    </div>
  );
}