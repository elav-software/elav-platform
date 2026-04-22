"use client";

import { useState, useEffect } from "react";
import { supabase } from "@connect/api/supabaseClient";

export default function PortalSetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  const redirect = (path) => { window.location.href = path; };

  useEffect(() => {
    let done = false;
    let gotRecovery = false;
    let timeoutId;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (done) return;
      if (event === 'PASSWORD_RECOVERY' && session) {
        gotRecovery = true;
        done = true;
        clearTimeout(timeoutId);
        subscription.unsubscribe();
        setChecking(false);
      } else if (event === 'SIGNED_IN' && session && !gotRecovery) {
        // Sesión normal — el usuario ya cambió la contraseña o llegó por otro camino
        done = true;
        clearTimeout(timeoutId);
        subscription.unsubscribe();
        window.location.replace("/connect/portal/dashboard");
      }
    });

    // Cubrir el caso de sesión ya establecida (invite vía callback)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (done) return;
      if (session) {
        done = true;
        clearTimeout(timeoutId);
        subscription.unsubscribe();
        setChecking(false);
      }
    });

    // Timeout de seguridad — si en 8s no hay sesión, ir al login
    timeoutId = setTimeout(() => {
      if (done) return;
      done = true;
      subscription.unsubscribe();
      redirect("/connect/portal/login");
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      // Usar replace para que el botón "atrás" no vuelva a esta pantalla
      window.location.replace("/connect/portal/dashboard");
    } catch (err) {
      console.error(err);
      setError(err?.message || "Error al guardar la contraseña. Intentá de nuevo.");
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
        <div className="text-center">
          <img src="/logo.png" alt="CFC Logo" className="h-20 w-auto mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Crear contraseña</h2>
          <p className="text-gray-600">
            Elegí una contraseña para acceder al Portal de Líderes
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Mínimo 8 caracteres"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="Repetí la contraseña"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                "Guardar contraseña e ingresar"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
