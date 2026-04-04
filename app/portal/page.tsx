"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Portal() {

  const [personas, setPersonas] = useState<any[]>([]);

  useEffect(() => {
    const fetchMiembros = async () => {

      const { data, error } = await supabase
        .from("personas")
        .select("*")
        .eq("rol", "Miembro");

      if (!error) {
        setPersonas(data);
      }
    };

    fetchMiembros();
  }, []);

  return (
    <div style={{ padding: "40px" }}>

      <h1>Portal de Líderes</h1>

      <h2>Miembros</h2>

      <table border={1} cellPadding={10}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Teléfono</th>
            <th>Barrio</th>
          </tr>
        </thead>

        <tbody>
          {personas.map((p:any) => (
            <tr key={p.id}>
              <td>{p.nombre} {p.apellido}</td>
              <td>{p.telefono}</td>
              <td>{p.barrio_zona}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}
