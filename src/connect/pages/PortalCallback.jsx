"use client";

import { useEffect, useState } from "react";
import { supabase } from "@connect/api/supabaseClient";
import { getCurrentChurchId } from "@connect/api/apiClient";

export default function PortalCallback() {
  const [status, setStatus] = useState("Verificando credenciales...");

  const redirect = (path) => { window.location.href = path; };

  useEffect(() => {
    // Leer la URL ANTES de que Supabase la procese
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const queryParams = new URLSearchParams(window.location.search);
    const urlType = hashParams.get('type') || queryParams.get('type');

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // PASSWORD_RECOVERY = link de "Crear mi contraseña" en el email
      if (event === 'PASSWORD_RECOVERY' || urlType === 'recovery' || urlType === 'invite') {
        subscription.unsubscribe();
        redirect("/connect/portal/set-password");
        return;
      }

      if (event === 'SIGNED_IN' && session) {
        subscription.unsubscribe();
        verifyLeader(session);
      }
    });

    // Disparar verificación de sesión existente (para login normal con Google)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !urlType) {
        subscription.unsubscribe();
        verifyLeader(session);
      }
    });

    // Timeout de seguridad
    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      setStatus("Tiempo de espera agotado. Redirigiendo...");
      setTimeout(() => redirect("/connect/portal/login"), 2000);
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const verifyLeader = async (session) => {
    try {
      setStatus("Verificando permisos...");
      const churchId = await getCurrentChurchId();

      let query = supabase
        .from('personas')
        .select('id, nombre, apellido, rol, estado_aprobacion')
        .ilike('email', session.user.email)
        .eq('rol', 'Líder');

      if (churchId) query = query.eq('church_id', churchId);

      const { data: leader, error: leaderError } = await query.single();

      if (leaderError || !leader) {
        setStatus("No estás registrado como líder. Contactá al pastor.");
        await supabase.auth.signOut();
        setTimeout(() => redirect("/connect/portal/login"), 3000);
        return;
      }

      if (leader.estado_aprobacion !== 'aprobado') {
        setStatus(`Tu solicitud está ${leader.estado_aprobacion}. Contactá al pastor.`);
        await supabase.auth.signOut();
        setTimeout(() => redirect("/connect/portal/login"), 3000);
        return;
      }

      setStatus("¡Bienvenido/a! Redirigiendo...");
      redirect("/connect/portal/dashboard");
    } catch (err) {
      console.error("Error verificando líder:", err);
      setStatus("Error en la autenticación. Redirigiendo...");
      setTimeout(() => redirect("/connect/portal/login"), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <div className="bg-white shadow-lg rounded-2xl p-12 max-w-md w-full mx-4 text-center space-y-6">
        <div className="w-16 h-16 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin mx-auto" />
        <p className="text-lg text-gray-700 font-medium">{status}</p>
      </div>
    </div>
  );
}
