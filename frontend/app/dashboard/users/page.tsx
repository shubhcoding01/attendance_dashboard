"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { Trash2, UserPlus, Shield, Wallet, User, Lock, Loader2 } from "lucide-react";

// Define User Type
interface UserData {
  username: string;
  name: string;
  role: string;
  salary: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  const [form, setForm] = useState({ 
    username: "", 
    password: "", 
    name: "", 
    role: "Employee", 
    salary: 10000 
  });

  const fetchUsers = () => {
    axios.get("http://localhost:8000/api/users")
      .then(res => {
        setUsers(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => {
    if(!form.username || !form.password || !form.name) return alert("Please fill required fields");
    
    setCreating(true);
    try {
      await axios.post("http://localhost:8000/api/users", form);
      fetchUsers();
      setForm({ ...form, username: "", password: "", name: "" }); // Reset fields
      alert("User Created Successfully!");
    } catch (err) { 
      alert("Error creating user. Username might exist."); 
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (username: string) => {
    if(!confirm(`⚠️ DANGER: Delete ${username}?\n\nThis will permanently erase ALL their attendance records, tasks, and history.\n\nAre you sure?`)) return;
    
    try {
      await axios.delete(`http://localhost:8000/api/users/${username}`);
      fetchUsers();
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-200">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="text-blue-500" /> User Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Add, remove, and manage system access</p>
        </div>
        
        {/* Create User Form */}
        <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 mb-8">
          <h3 className="font-semibold mb-6 flex items-center gap-2 text-white">
            <UserPlus size={18} className="text-blue-400"/> Create New Employee
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Username</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-3.5 text-slate-500"/>
                <input 
                  placeholder="jdoe" 
                  className="w-full pl-9 p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={form.username}
                  onChange={e => setForm({...form, username: e.target.value})} 
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-3.5 text-slate-500"/>
                <input 
                  type="password" 
                  placeholder="••••••" 
                  className="w-full pl-9 p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})} 
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Full Name</label>
              <input 
                placeholder="John Doe" 
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})} 
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Monthly Salary</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 text-sm">₹</span>
                <input 
                  type="number" 
                  className="w-full pl-7 p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={form.salary} 
                  onChange={e => setForm({...form, salary: +e.target.value})} 
                />
              </div>
            </div>

            <button 
              onClick={handleCreate} 
              disabled={creating}
              className="bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-500 font-medium transition shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 h-[42px]"
            >
              {creating ? <Loader2 className="animate-spin" size={18}/> : "Add User"}
            </button>
          </div>
        </div>

        {/* User List Table */}
        <div className="bg-slate-900 rounded-xl shadow-xl border border-slate-800 overflow-hidden">
          {loading ? (
             <div className="p-8 text-center text-slate-500 flex justify-center items-center gap-2">
               <Loader2 className="animate-spin"/> Loading users...
             </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-xs">
                <tr>
                  <th className="p-5 font-semibold">Employee Details</th>
                  <th className="p-5 font-semibold">Role Access</th>
                  <th className="p-5 font-semibold">Base Salary</th>
                  <th className="p-5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map(u => (
                  <tr key={u.username} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="p-5 font-medium text-white">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 font-bold text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-base">{u.name}</div>
                          <div className="text-xs text-slate-500 font-normal">@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${
                        u.role === 'Admin' 
                          ? 'bg-purple-900/30 text-purple-400 border-purple-900' 
                          : 'bg-blue-900/30 text-blue-400 border-blue-900'
                      }`}>
                        <Shield size={12} />
                        {u.role}
                      </span>
                    </td>
                    <td className="p-5 text-slate-400">
                      <div className="flex items-center gap-2">
                        <Wallet size={14} className="text-slate-600"/>
                        ₹{u.salary.toLocaleString()}
                      </div>
                    </td>
                    <td className="p-5 text-right">
                      {u.username !== 'admin' && (
                        <button 
                          onClick={() => handleDelete(u.username)} 
                          className="text-slate-500 hover:text-red-400 hover:bg-slate-800 p-2 rounded-lg transition-colors group-hover:text-red-500"
                          title="Delete User"
                        >
                          <Trash2 size={18}/>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}