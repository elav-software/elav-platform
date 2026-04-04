"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Portal() {

  const [personas, setPersonas] = useState<any[]>([]);

  useEffect(()=>{

    const checkSession = async () => {

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/login";
        return;
      }

      loadMembers();

    }

    const loadMembers = async () => {

      const { data } = await supabase
        .from("personas")
        .select("*")
        .eq("rol","Miembro");

      setPersonas(data || []);

    }

    checkSession();

  },[])

  return(

    <div style={{padding:"40px"}}>

      <h1>Portal Líder</h1>

      <button
        onClick={async ()=>{
          await supabase.auth.signOut();
          window.location.href="/login";
        }}
      >
        Cerrar sesión
      </button>

      <table border={1} cellPadding={10}>

        <thead>
          <tr>
            <th>Nombre</th>
            <th>Teléfono</th>
            <th>Barrio</th>
          </tr>
        </thead>

        <tbody>

        {personas.map((p:any)=>(
          <tr key={p.id}>
            <td>{p.nombre} {p.apellido}</td>
            <td>{p.telefono}</td>
            <td>{p.barrio_zona}</td>
          </tr>
        ))}

        </tbody>

      </table>

    </div>

  )
}
