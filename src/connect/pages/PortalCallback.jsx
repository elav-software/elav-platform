"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "@connect/lib/router-compat";
import { supabase } from "@connect/api/supabaseClient";
import { getCurrentChurchId } from "@connect/api/apiClient";

export default function PortalCallback() {
  const [status, setStatus] = useState("Verificando credenciales...");
  const navigate = useNavigate();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Esperar a que Supabase procese el token del hash de la URL
      const { data: { session }, error: sessionError } = await new Promise((resolve) => {
        // Primero intentar getSession directamente
        supabase.auth.getSession().then(({ data, error }) => {
          if (data.session) {
            resolve({ data, error });
          } else {
            // Si no hay sesión, escuchar el evento SIGNED_IN (token viene en el hash)
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
              if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                subscription.unsubscribe();
                resolve({ data: { session }, error: null });
              }
            });
            // Timeout de seguridad 5 segundos
            setTimeout(() => {
              subscription.unsubscribe();
              resolve({ data: { session: null }, error: new Error('Timeout') });
            }, 5000);
          }
        });
      });

      if (sessionError) throw sessionError;
      
      if (!session?.user) {
        setStatus("No se pudo obtener la sesión");
        setTimeout(() => navigate("/connect/portal/login"), 2000);
        return;
      }

      // Verificar que sea líder aprobado
      setStatus("Verificando permisos...");
      
      const churchId = await getCurrentChurchId();
      const { data: leader, error: leaderError } = await supabase
        .from('personas')
        .select('id, nombre, apellido, rol, estado_aprobacion')
        .eq('church_id', churchId)
        .ilike('email', session.user.email)
        .eq('rol', 'Líder')
        .single();

      if (leaderError || !leader) {
        setStatus("No estás registrado como líder");
        await supabase.auth.signOut();
        setTimeout(() => navigate("/connect/portal/login"), 2000);
        return;
      }

      if (leader.estado_aprobacion !== 'aprobado') {
        setStatus(`Tu cuenta está: ${leader.estado_aprobacion}. Contactá al pastor.`);
        await supabase.auth.signOut();
        setTimeout(() => navigate("/connect/portal/login"), 3000);
        return;
      }

      // Todo OK — redirigir al dashboard
      setStatus("¡Bienvenido/a! Redirigiendo...");
      setTimeout(() => navigate("/connect/portal/dashboard"), 1000);
      
    } catch (err) {
      console.error("Error en callback:", err);
      setStatus("Error en la autenticación");
      setTimeout(() => navigate("/connect/portal/login"), 2000);
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
