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

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/connect/portal/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (err) {
      console.error("Error en Google login:", err);
      setError("Error al iniciar sesión con Google. Intentá de nuevo.");
      setLoading(false);
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

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">o continuar con</span>
            </div>
          </div>

          {/* Botón de Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-200 hover:border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continuar con Google</span>
              </>
            )}
          </button>

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
