"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function Login() {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const handleLogin = async () => {

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert("Error login")
      return
    }

    router.push("/crm/dashboard")

  }

  return (

    <div className="flex min-h-screen items-center justify-center">

      <div className="bg-white p-8 rounded shadow w-80">

        <h1 className="text-xl font-bold mb-4">CRM Login</h1>

        <input
          className="border p-2 w-full mb-3"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="border p-2 w-full mb-3"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="bg-blue-600 text-white w-full p-2 rounded"
        >
          Ingresar
        </button>

      </div>

    </div>

  )
}
