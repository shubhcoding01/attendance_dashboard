"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2, AlertCircle } from "lucide-react";
import axios from "axios";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:8000/api/login", {
        username: username,
        password: password
      });

      if (res.data.role) {
        // --- FIX STARTS HERE ---
        // 1. Save credentials to Browser Storage
        localStorage.setItem("role", res.data.role);
        localStorage.setItem("username", res.data.name);
        
        // 2. Redirect based on Role
        router.push("/dashboard");
        // --- FIX ENDS HERE ---
      }
    } catch (err: any) {
      if (err.response) {
        setError("Invalid Username or Password");
      } else {
        setError("Cannot connect to server. Is Backend running?");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-800">
        
        <div className="flex justify-center mb-8">
          <div className="h-16 w-16 bg-slate-800 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner border border-slate-700">
            <Lock size={32} />
          </div>
        </div>
        
        <h2 className="text-center text-3xl font-bold text-white mb-2">Welcome Back</h2>
        <p className="text-center text-slate-400 mb-8 text-sm">Enter your credentials to access the workspace</p>
        
        {error && (
          <div className="bg-red-900/20 border border-red-900/50 text-red-400 p-3 rounded-lg mb-6 flex items-center gap-2 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2 ml-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-white placeholder-slate-600"
              placeholder="e.g. admin"
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2 ml-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-white placeholder-slate-600"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-900/20 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
