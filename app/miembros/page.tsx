"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";

type Lider = {
  id: number;
  nombre: string;
  apellido: string;
};

type FormData = {
  nombre: string;
  apellido: string;
  telefono: string;
  direccion: string;
  fecha_nacimiento: string;
  genero: string;
  estado_civil: string;
  barrio_zona: string;
  ocupacion: string;
  lider_id: string;
  bautizado: string;
  fue_encuentro: string;
  conyuge: string;
  hijos: string;
};

const INITIAL_FORM: FormData = {
  nombre: "",
  apellido: "",
  telefono: "",
  direccion: "",
  fecha_nacimiento: "",
  genero: "",
  estado_civil: "",
  barrio_zona: "",
  ocupacion: "",
  lider_id: "",
  bautizado: "",
  fue_encuentro: "",
  conyuge: "",
  hijos: "",
};

const STEPS = ["Datos Personales", "Iglesia y Líder", "Familia"];

export default function MiembrosPage() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [lideres, setLideres] = useState<Lider[]>([]);

  useEffect(() => {
    const fetchLideres = async () => {
      const { data, error } = await supabase
        .from("personas")
        .select("id, nombre, apellido")
        .eq("rol", "Líder")
        .order("apellido", { ascending: true });

      if (error) {
        console.error("Error cargando líderes:", error);
        toast.error("No se pudieron cargar los líderes");
      } else {
        setLideres(data || []);
      }
    };
    fetchLideres();
  }, []);

  const set = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm({ ...form, [field]: e.target.value });

  const validate = () => {
    if (!form.nombre || !form.apellido) {
      toast.error("Nombre y apellido son obligatorios");
      return false;
    }
    if (!form.telefono) {
      toast.error("Ingresá un teléfono");
      return false;
    }
    if (!form.lider_id) {
      toast.error("Seleccioná tu líder");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    const payload = {
      nombre: form.nombre,
      apellido: form.apellido,
      telefono: form.telefono,
      direccion: form.direccion || null,
      fecha_nacimiento: form.fecha_nacimiento || null,
      genero: form.genero || null,
      estado_civil: form.estado_civil || null,
      barrio_zona: form.barrio_zona || null,
      ocupacion: form.ocupacion || null,
      bautizado: form.bautizado || null,
      fue_encuentro: form.fue_encuentro || null,
      conyuge: form.conyuge || null,
      hijos: form.hijos || null,
      rol: "Miembro",
      lider_id: form.lider_id,
    };

    const { error } = await supabase.from("personas").insert([payload]);

    setLoading(false);

    if (error) {
      toast.error("Error al guardar");
      console.error(error);
    } else {
      toast.success("Datos enviados 🙌");
      setForm(INITIAL_FORM);
      setStep(0);
    }
  };

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const sectionTitle = (text: string) => (
    <p style={{ color: "#ef4444", fontWeight: 600, fontSize: 14, marginBottom: 4, marginTop: 8, letterSpacing: "0.5px" }}>
      {text}
    </p>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top, #1a0000, #020617)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <Toaster position="top-right" />

      <motion.form
        onSubmit={handleSubmit}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter" && step < STEPS.length - 1) e.preventDefault();
        }}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: "#020617",
          padding: "30px",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "460px",
          color: "white",
          boxShadow: "0 0 30px rgba(255,0,0,0.2)",
          border: "1px solid #7f1d1d",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {/* LOGO + TÍTULO */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 10 }}>
          <motion.img
            src="/logo.png"
            alt="CFC Logo"
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.06, 1, 1.04, 1] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            whileHover={{ scale: 1.1 }}
            style={{
              width: 70,
              height: "auto",
              objectFit: "contain",
              cursor: "pointer",
              filter: "drop-shadow(0 0 8px rgba(255,0,0,0.7))",
            }}
          />
          <h2
            style={{
              color: "#ef4444",
              letterSpacing: "1px",
              textShadow: "0 0 6px rgba(255,255,255,0.6)",
              marginTop: 8,
              textAlign: "center",
              fontSize: "clamp(16px, 4vw, 22px)",
              lineHeight: "1.2",
            }}
          >
            Centro Familiar Cristiano
            <br />
            MIEMBROS
          </h2>
        </div>

        {/* STEP INDICATOR */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 6 }}>
          {STEPS.map((s, i) => (
            <div
              key={s}
              onClick={() => setStep(i)}
              style={{
                padding: "4px 10px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: step === i ? 700 : 400,
                background: step === i ? "#7f1d1d" : "transparent",
                border: `1px solid ${step === i ? "#ef4444" : "#334155"}`,
                color: step === i ? "#fff" : "#94a3b8",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {s}
            </div>
          ))}
        </div>

        {/* STEP 0: DATOS PERSONALES */}
        {step === 0 && (
          <>
            {sectionTitle("Información Personal")}
            <input placeholder="Nombre *" value={form.nombre} onChange={set("nombre")} />
            <input placeholder="Apellido *" value={form.apellido} onChange={set("apellido")} />
            <label className="field-label">Fecha de Nacimiento</label>
            <input type="date" value={form.fecha_nacimiento} onChange={set("fecha_nacimiento")} />
            <select value={form.genero} onChange={set("genero")}>
              <option value="">Género</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
            </select>

            {sectionTitle("Contacto")}
            <input placeholder="Teléfono *" value={form.telefono} onChange={set("telefono")} />

            {sectionTitle("Ubicación")}
            <input placeholder="Dirección" value={form.direccion} onChange={set("direccion")} />
            <input placeholder="Barrio / Zona" value={form.barrio_zona} onChange={set("barrio_zona")} />
            <input placeholder="Ocupación" value={form.ocupacion} onChange={set("ocupacion")} />
          </>
        )}

        {/* STEP 1: IGLESIA Y LÍDER */}
        {step === 1 && (
          <>
            {sectionTitle("Vida en la Iglesia")}
            <select value={form.bautizado} onChange={set("bautizado")}>
              <option value="">¿Está Bautizado?</option>
              <option value="Sí">Sí</option>
              <option value="No">No</option>
            </select>
            <select value={form.fue_encuentro} onChange={set("fue_encuentro")}>
              <option value="">¿Fue a un Encuentro?</option>
              <option value="Sí">Sí</option>
              <option value="No">No</option>
            </select>

            {sectionTitle("Tu Líder *")}
            <select value={form.lider_id} onChange={set("lider_id")}>
              <option value="">Seleccioná tu líder</option>
              {lideres.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.apellido}, {l.nombre}
                </option>
              ))}
            </select>
            {lideres.length === 0 && (
              <p style={{ color: "#94a3b8", fontSize: 12 }}>
                Cargando líderes...
              </p>
            )}
          </>
        )}

        {/* STEP 2: FAMILIA */}
        {step === 2 && (
          <>
            {sectionTitle("Información Familiar")}
            <select value={form.estado_civil} onChange={set("estado_civil")}>
              <option value="">Estado Civil</option>
              <option value="Soltero/a">Soltero/a</option>
              <option value="Casado/a">Casado/a</option>
              <option value="Viudo/a">Viudo/a</option>
              <option value="Divorciado/a">Divorciado/a</option>
            </select>
            <input placeholder="Cónyuge" value={form.conyuge} onChange={set("conyuge")} />
            <input placeholder="Hijos (nombres o cantidad)" value={form.hijos} onChange={set("hijos")} />
          </>
        )}

        {/* NAVIGATION BUTTONS */}
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          {step > 0 && (
            <button type="button" onClick={prev} className="btn-secondary">
              ← Anterior
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={next} className="btn-primary" style={{ marginLeft: "auto" }}>
              Siguiente →
            </button>
          ) : (
            <button type="button" disabled={loading} className="btn-submit" style={{ marginLeft: "auto" }}
              onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}>
              {loading ? "Enviando..." : "Enviar Censo"}
            </button>
          )}
        </div>

        {/* ESTILOS */}
        <style jsx>{`
          input,
          select,
          textarea {
            width: 100%;
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #7f1d1d;
            background: #020617;
            color: white;
            font-size: 14px;
          }

          textarea {
            resize: vertical;
            font-family: inherit;
          }

          select {
            appearance: none;
            cursor: pointer;
          }

          input::placeholder,
          textarea::placeholder {
            color: #94a3b8;
          }

          input:focus,
          select:focus,
          textarea:focus {
            outline: none;
            border: 1px solid #ef4444;
            box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
          }

          .field-label {
            font-size: 12px;
            color: #94a3b8;
            margin-bottom: -4px;
          }

          .btn-primary,
          .btn-submit {
            padding: 12px 24px;
            border-radius: 8px;
            border: none;
            background: linear-gradient(90deg, #b91c1c, #ef4444);
            color: white;
            font-weight: bold;
            cursor: pointer;
            transition: 0.2s;
            font-size: 14px;
          }

          .btn-primary:hover,
          .btn-submit:hover {
            background: linear-gradient(90deg, #991b1b, #dc2626);
          }

          .btn-secondary {
            padding: 12px 24px;
            border-radius: 8px;
            border: 1px solid #334155;
            background: transparent;
            color: #94a3b8;
            font-weight: 500;
            cursor: pointer;
            transition: 0.2s;
            font-size: 14px;
          }

          .btn-secondary:hover {
            border-color: #94a3b8;
            color: white;
          }
        `}</style>
      </motion.form>
    </div>
  );
}
