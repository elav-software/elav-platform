"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function Dashboard() {

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        document.cookie = "crm-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT"
        window.location.href = "/crm/login"
      }
    }
    checkSession()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    document.cookie = "crm-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT"
    window.location.href = "/crm/login"
  }

  return (

    <div className="p-10">

      <h1 className="text-2xl font-bold">
        CRM Dashboard
      </h1>

      <p>
        Bienvenido al CRM de la iglesia
      </p>

      <button
        onClick={handleLogout}
        className="mt-6 px-4 py-2 bg-red-500 text-white rounded"
      >
        Cerrar sesión
      </button>

    </div>

  )
}
