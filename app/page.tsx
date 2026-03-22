"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";

type FormData = {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  edad: string;
  direccion: string;
};

export default function Home() {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<FormData>({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    edad: "",
    direccion: ""
  });

  const validate = () => {
    if (!form.nombre || !form.apellido) {
      toast.error("Nombre y apellido son obligatorios");
      return false;
    }
    if (!form.email.includes("@")) {
      toast.error("Email inválido");
      return false;
    }
    if (!form.telefono) {
      toast.error("Ingresá un teléfono");
      return false;
    }
    if (!form.edad) {
      toast.error("Ingresá la edad");
      return false;
    }
    if (!form.direccion) {
      toast.error("Ingresá la dirección");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    const { error } = await supabase.from("personas").insert([form]);

    setLoading(false);

    if (error) {
      toast.error("Error al guardar");
      console.error(error);
    } else {
      toast.success("Datos enviados 🙌");
      setForm({
        nombre: "",
        apellido: "",
        email: "",
        telefono: "",
        edad: "",
        direccion: ""
      });
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top, #1a0000, #020617)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20
      }}
    >
      <Toaster position="top-right" />

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: "#020617",
          padding: "30px",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "400px",
          color: "white",
          boxShadow: "0 0 30px rgba(255,0,0,0.2)",
          border: "1px solid #7f1d1d",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}
      >
        {/* LOGO + TÍTULO */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 15
          }}
        >
        <motion.img
          src="/logo.png"
          alt="CFC Logo"
          initial={{ scale: 1 }}
          animate={{
            scale: [1, 1.06, 1, 1.04, 1]
          }}
          transition={{
            duration: 3.5,          // 👈 más lento (clave)
            repeat: Infinity,
            ease: "easeInOut"
          }}
          whileHover={{
            scale: 1.1
          }}
          style={{
            width: 80,
            height: "auto",
            objectFit: "contain",
            cursor: "pointer",
            filter: "drop-shadow(0 0 8px rgba(255,0,0,0.7))"
          }}
        />

        <h2
          style={{
            color: "#ef4444",
            letterSpacing: "1px",
            textShadow: "0 0 6px rgba(255,255,255,0.6)",
            marginTop: 10,
            textAlign: "center",
            fontSize: "clamp(18px, 4vw, 24px)",
            lineHeight: "1.2"
          }}
        >
          Centro Familiar Cristiano<br />
          Miembros
        </h2>
        </div>

        {/* INPUTS */}
        <input
          placeholder="Nombre"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        />

        <input
          placeholder="Apellido"
          value={form.apellido}
          onChange={(e) => setForm({ ...form, apellido: e.target.value })}
        />

        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          placeholder="Teléfono"
          value={form.telefono}
          onChange={(e) => setForm({ ...form, telefono: e.target.value })}
        />

        <input
          type="number"
          placeholder="Edad"
          value={form.edad}
          onChange={(e) => setForm({ ...form, edad: e.target.value })}
        />

        <input
          placeholder="Dirección"
          value={form.direccion}
          onChange={(e) => setForm({ ...form, direccion: e.target.value })}
        />

        {/* BOTÓN */}
        <button type="submit" disabled={loading}>
          {loading ? "Enviando..." : "Enviar"}
        </button>

        {/* estilos */}
        <style jsx>{`
          input {
            width: 100%;
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #7f1d1d;
            background: #020617;
            color: white;
          }

          input::placeholder {
            color: #94a3b8;
          }

          input:focus {
            outline: none;
            border: 1px solid #ef4444;
            box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
          }

          button {
            margin-top: 10px;
            padding: 14px;
            border-radius: 8px;
            border: none;
            background: linear-gradient(90deg, #b91c1c, #ef4444);
            color: white;
            font-weight: bold;
            cursor: pointer;
            transition: 0.2s;
          }

          button:hover {
            background: linear-gradient(90deg, #991b1b, #dc2626);
          }
        `}</style>
      </motion.form>
    </div>
  );
}