"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function Dashboard() {

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = "/crm/login"
      }
    }
    checkSession()
  }, [])

  return (

    <div className="p-10">

      <h1 className="text-2xl font-bold">
        CRM Dashboard
      </h1>

      <p>
        Bienvenido al CRM de la iglesia
      </p>

    </div>

  )
}
