"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      alert("Error login");
      return;
    }

    window.location.href = "/portal";

  };

  return (

    <div style={{ padding: "40px", maxWidth: "400px", margin: "auto" }}>

      <h1>Login Líderes</h1>

      <input
        placeholder="Email"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
        style={{ width:"100%", marginBottom:"10px", padding:"10px"}}
      />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e)=>setPassword(e.target.value)}
        style={{ width:"100%", marginBottom:"10px", padding:"10px"}}
      />

      <button
        onClick={handleLogin}
        style={{ width:"100%", padding:"10px"}}
      >
        Ingresar
      </button>

    </div>

  );
}
