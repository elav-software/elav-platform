"use client";

import { useState, useEffect } from "react";
import { supabase } from "@connect/api/supabaseClient";
import { getCurrentChurchId } from "@connect/api/apiClient";

export default function PortalLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const redirect = (path) => { window.location.href = path; };

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const userEmail = session.user.email?.toLowerCase().trim();
        const approved = await verifyApprovedLeader(userEmail);
        
        if (approved) {
          redirect("/connect/portal/dashboard");
        } else {
          await supabase.auth.signOut();
          // signOut ya hecho, quedarse en login
        }
      }
    } catch (err) {
      console.error("Error checking session:", err);
    } finally {
      setChecking(false);
    }
  };

  const verifyApprovedLeader = async (email) => {
    try {
      const churchId = await getCurrentChurchId();
      
      const { data, error } = await supabase
        .from('personas')
        .select('id, rol, estado_aprobacion')
        .eq('church_id', churchId)
        .ilike('email', email)
        .eq('rol', 'Líder')
        .eq('estado_aprobacion', 'aprobado')
        .single();

      if (error || !data) {
        return false;
      }

      return true;
    } catch (err) {
      console.error("Error verificando líder:", err);
      return false;
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Login con email y password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) throw error;

      if (data.user) {
        // Verificar si es líder aprobado
        const approved = await verifyApprovedLeader(data.user.email);
        
        if (approved) {
          redirect("/connect/portal/dashboard");
        } else {
          setError("Tu cuenta aún no está aprobada como líder. Contactá al pastor.");
          await supabase.auth.signOut();
        }
      }
    } catch (err) {
      console.error("Error en email login:", err);
      setError(err.message === "Invalid login credentials" 
        ? "Email o contraseña incorrectos" 
        : "Error al iniciar sesión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="w-8 h-8 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        {/* Logo y título */}
        <div className="text-center">
          <img 
            src="/logo.png"
            alt="CFC Logo" 
            className="h-24 w-auto mx-auto mb-6"
          />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Portal de Líderes
          </h2>
          <p className="text-gray-600">
            Acceso exclusivo para líderes aprobados
          </p>
        </div>

        {/* Card de login */}
        <div className="bg-white shadow-xl rounded-2xl p-8 space-y-6">
          
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Formulario de Email + Password */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu-email@cfccasanova.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </form>

          {/* Instrucciones */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              Usá el mismo email que usaste cuando completaste el formulario de censo.
              Tu cuenta debe estar aprobada por el pastor para acceder.
            </p>
          </div>
        </div>

        {/* Link de ayuda */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            ¿No tenés cuenta o problemas para acceder?{" "}
            <a 
              href="/connect/counseling" 
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Contactanos
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
