"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@crm/api/supabaseClient";

export default function Welcome() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const role = session.user.user_metadata?.role ?? "user";
        if (role === "admin") {
          window.location.href = "/crm/dashboard";
        } else {
          // Sesión activa pero sin rol admin — cerrar sesión
          supabase.auth.signOut();
        }
      }
    }).finally(() => setChecking(false));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (authError) {
      setError("Correo o contraseña incorrectos.");
      setLoading(false);
      return;
    }
    const role = data.user?.user_metadata?.role ?? "user";
    if (role !== "admin") {
      await supabase.auth.signOut();
      setError("Tu cuenta no tiene permisos para acceder al CRM.");
      setLoading(false);
      return;
    }
    window.location.href = "/crm/dashboard";
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-8 max-w-md w-full">
        <div className="text-center">
          <img
            src="/logo.png"
            alt="CFC CASA"
            className="h-20 w-auto mx-auto mb-4 drop-shadow-lg"
          />
          <h1 className="text-4xl font-bold text-white tracking-tight">CFC CASA CRM</h1>
          <p className="text-red-300 mt-1 text-lg">Sistema de Gestión</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-8 space-y-5"
        >
          <div className="space-y-1">
            <label className="text-sm text-slate-400 block">Correo electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cfccasanova.com"
              className="w-full h-11 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-500 px-3 text-sm focus:outline-none focus:border-red-400 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-slate-400 block">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-500 px-3 text-sm focus:outline-none focus:border-red-400 transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-70"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="text-slate-500 text-sm">© 2026 CFC CASA CRM.</p>
      </div>
    </div>
  );
}
