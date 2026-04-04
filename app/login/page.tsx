"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Completá email y contraseña");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast.error("Credenciales incorrectas");
    } else {
      router.push("/portal");
    }
  };

  const inputClasses =
    "w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow";
  const labelClasses = "block text-sm font-medium text-slate-700 mb-1";

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center items-center px-4">
      <Toaster position="top-right" />

      <motion.form
        onSubmit={handleLogin}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 md:p-10 rounded-2xl w-full max-w-md shadow-xl border border-slate-100"
      >
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="CFC Logo" className="w-20 h-auto object-contain mb-4" />
          <h2 className="text-slate-800 text-2xl font-bold text-center leading-tight">
            Centro Familiar Cristiano
            <br />
            <span className="text-blue-600">Acceso al Portal</span>
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClasses}>Email</label>
            <input
              type="email"
              className={inputClasses}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className={labelClasses}>Contraseña</label>
            <input
              type="password"
              className={inputClasses}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md transition-colors disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
