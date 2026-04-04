"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";

export default function PortalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login");
      } else {
        setLoading(false);
      }
    };
    checkSession();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <Toaster position="top-right" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="CFC Logo" className="w-12 h-auto object-contain" />
            <div>
              <h1 className="text-slate-800 text-xl font-bold leading-tight">
                Centro Familiar Cristiano
              </h1>
              <p className="text-blue-600 text-sm font-medium">Portal de Administración</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 font-medium transition-colors"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a
            href="/"
            className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-slate-800 font-semibold text-lg mb-1">Censo de Líderes</h2>
            <p className="text-slate-500 text-sm">Registrar o actualizar información de líderes.</p>
          </a>

          <a
            href="/miembros"
            className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-slate-800 font-semibold text-lg mb-1">Censo de Miembros</h2>
            <p className="text-slate-500 text-sm">Registrar o actualizar información de miembros.</p>
          </a>
        </div>
      </motion.div>
    </div>
  );
}
