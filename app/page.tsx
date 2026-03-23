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
  fecha_nacimiento: string;
  genero: string;
  estado_civil: string;
  whatsapp: string;
  barrio_zona: string;
  ocupacion: string;
  nivel_educacion: string;
  fecha_conversion: string;
  fecha_llegada_cfc: string;
  bautizado: string;
  fecha_bautismo: string;
  fue_encuentro: string;
  nivel_formacion: string;
  habilidades_tecnicas: string;
  disponibilidad_horaria: string;
  area_servicio_actual: string;
  ministerio: string;
  grupo_celula: string;
  conyuge: string;
  hijos: string;
  tamano_hogar: string;
  vinculos_familiares_iglesia: string;
};

const INITIAL_FORM: FormData = {
  nombre: "",
  apellido: "",
  email: "",
  telefono: "",
  edad: "",
  direccion: "",
  fecha_nacimiento: "",
  genero: "",
  estado_civil: "",
  whatsapp: "",
  barrio_zona: "",
  ocupacion: "",
  nivel_educacion: "",
  fecha_conversion: "",
  fecha_llegada_cfc: "",
  bautizado: "",
  fecha_bautismo: "",
  fue_encuentro: "",
  nivel_formacion: "",
  habilidades_tecnicas: "",
  disponibilidad_horaria: "",
  area_servicio_actual: "",
  ministerio: "",
  grupo_celula: "",
  conyuge: "",
  hijos: "",
  tamano_hogar: "",
  vinculos_familiares_iglesia: "",
};

const STEPS = ["Datos Personales", "Iglesia", "Servicio", "Familia"];

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);

  const set = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm({ ...form, [field]: e.target.value });

  // Floating label components
  const FloatingInput = ({ label, field, type = "text" }: { label: string; field: keyof FormData; type?: string }) => (
    <div className="float-group">
      <input
        type={type}
        value={form[field]}
        onChange={set(field)}
        placeholder=" "
        className="float-input"
      />
      <label className="float-label">{label}</label>
    </div>
  );

  const FloatingSelect = ({ label, field, children }: { label: string; field: keyof FormData; children: React.ReactNode }) => (
    <div className="float-group">
      <select value={form[field]} onChange={set(field)} className={`float-input ${form[field] ? "has-value" : ""}`}>
        {children}
      </select>
      <label className="float-label active">{label}</label>
    </div>
  );

  const FloatingTextarea = ({ label, field, rows = 3 }: { label: string; field: keyof FormData; rows?: number }) => (
    <div className="float-group">
      <textarea
        value={form[field]}
        onChange={set(field)}
        placeholder=" "
        rows={rows}
        className="float-input"
      />
      <label className="float-label">{label}</label>
    </div>
  );

  const validate = () => {
    if (!form.nombre || !form.apellido) {
      toast.error("Nombre y apellido son obligatorios");
      return false;
    }
    if (!form.telefono) {
      toast.error("Ingresá un teléfono");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    const payload = {
      ...form,
      edad: form.edad ? Number(form.edad) : null,
      tamano_hogar: form.tamano_hogar ? Number(form.tamano_hogar) : null,
      fecha_nacimiento: form.fecha_nacimiento || null,
      fecha_conversion: form.fecha_conversion || null,
      fecha_llegada_cfc: form.fecha_llegada_cfc || null,
      fecha_bautismo: form.fecha_bautismo || null,
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
            Miembros
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
            <FloatingInput label="Nombre *" field="nombre" />
            <FloatingInput label="Apellido *" field="apellido" />
            <FloatingInput label="Fecha de Nacimiento" field="fecha_nacimiento" type="date" />
            <FloatingInput label="Edad" field="edad" type="number" />
            <FloatingSelect label="Género" field="genero">
              <option value="">Seleccionar...</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
            </FloatingSelect>

            {sectionTitle("Contacto")}
            <FloatingInput label="Teléfono *" field="telefono" />
            <FloatingInput label="WhatsApp" field="whatsapp" />
            <FloatingInput label="Email" field="email" />

            {sectionTitle("Ubicación")}
            <FloatingInput label="Dirección" field="direccion" />
            <FloatingInput label="Barrio / Zona" field="barrio_zona" />

            <FloatingInput label="Ocupación" field="ocupacion" />
            <FloatingSelect label="Nivel de Educación" field="nivel_educacion">
              <option value="">Seleccionar...</option>
              <option value="Primaria">Primaria</option>
              <option value="Secundaria">Secundaria</option>
              <option value="Técnico">Técnico</option>
              <option value="Universitario">Universitario</option>
              <option value="Otro">Otro</option>
            </FloatingSelect>
          </>
        )}

        {/* STEP 1: IGLESIA */}
        {step === 1 && (
          <>
            {sectionTitle("Vida en la Iglesia")}
            <FloatingInput label="Fecha de Conversión" field="fecha_conversion" type="date" />
            <FloatingInput label="Fecha de Llegada a CFC" field="fecha_llegada_cfc" type="date" />

            <FloatingSelect label="¿Está Bautizado?" field="bautizado">
              <option value="">Seleccionar...</option>
              <option value="Sí">Sí</option>
              <option value="No">No</option>
            </FloatingSelect>
            {form.bautizado === "Sí" && (
              <FloatingInput label="Fecha de Bautismo" field="fecha_bautismo" type="date" />
            )}

            <FloatingSelect label="¿Fue a un Encuentro?" field="fue_encuentro">
              <option value="">Seleccionar...</option>
              <option value="Sí">Sí</option>
              <option value="No">No</option>
            </FloatingSelect>

            <FloatingSelect label="Nivel de Formación" field="nivel_formacion">
              <option value="">Seleccionar...</option>
              <option value="Ninguno">Ninguno</option>
              <option value="EFE">EFE</option>
              <option value="Liderazgo">Liderazgo</option>
            </FloatingSelect>
          </>
        )}

        {/* STEP 2: SERVICIO */}
        {step === 2 && (
          <>
            {sectionTitle("Servicio y Habilidades")}
            <FloatingTextarea label="Habilidades técnicas/profesionales (ej: Sonido, Diseño, Arte, Danza...)" field="habilidades_tecnicas" />
            <FloatingSelect label="Disponibilidad Horaria" field="disponibilidad_horaria">
              <option value="">Seleccionar...</option>
              <option value="Mañana">Mañana</option>
              <option value="Tarde">Tarde</option>
              <option value="Noche">Noche</option>
              <option value="Fines de semana">Fines de semana</option>
              <option value="Flexible">Flexible</option>
            </FloatingSelect>
            <FloatingInput label="Área de servicio actual" field="area_servicio_actual" />
            <FloatingInput label="Ministerio" field="ministerio" />
            <FloatingInput label="Grupo / Célula" field="grupo_celula" />
          </>
        )}

        {/* STEP 3: FAMILIA */}
        {step === 3 && (
          <>
            {sectionTitle("Información Familiar")}
            <FloatingSelect label="Estado Civil" field="estado_civil">
              <option value="">Seleccionar...</option>
              <option value="Soltero/a">Soltero/a</option>
              <option value="Casado/a">Casado/a</option>
              <option value="Viudo/a">Viudo/a</option>
              <option value="Divorciado/a">Divorciado/a</option>
            </FloatingSelect>
            <FloatingInput label="Cónyuge" field="conyuge" />
            <FloatingInput label="Hijos (nombres o cantidad)" field="hijos" />
            <FloatingInput label="Tamaño del hogar" field="tamano_hogar" type="number" />
            <FloatingTextarea label="Vínculos familiares en la iglesia" field="vinculos_familiares_iglesia" />
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
          .float-group {
            position: relative;
            width: 100%;
          }

          .float-input {
            width: 100%;
            padding: 18px 12px 8px;
            border-radius: 8px;
            border: 1px solid #7f1d1d;
            background: #020617;
            color: white;
            font-size: 14px;
            transition: border 0.2s;
          }

          textarea.float-input {
            resize: vertical;
            font-family: inherit;
          }

          select.float-input {
            appearance: none;
            cursor: pointer;
          }

          .float-input::placeholder {
            color: transparent;
          }

          .float-label {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #94a3b8;
            font-size: 14px;
            pointer-events: none;
            transition: all 0.2s ease;
          }

          textarea ~ .float-label {
            top: 18px;
            transform: none;
          }

          /* Label sube cuando el input tiene foco o valor */
          .float-input:focus ~ .float-label,
          .float-input:not(:placeholder-shown) ~ .float-label,
          .float-label.active {
            top: 6px;
            transform: none;
            font-size: 10px;
            color: #ef4444;
          }

          /* Select siempre muestra label arriba */
          select.float-input ~ .float-label {
            top: 6px;
            transform: none;
            font-size: 10px;
            color: #ef4444;
          }

          .float-input:focus {
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