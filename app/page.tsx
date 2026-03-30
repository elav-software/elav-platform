"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";

type FormData = {
  nombre: string; apellido: string; email: string; telefono: string;
  edad: string; direccion: string; fecha_nacimiento: string; genero: string;
  estado_civil: string; whatsapp: string; barrio_zona: string; ocupacion: string;
  nivel_educacion: string; fecha_conversion: string; fecha_llegada_cfc: string;
  bautizado: string; fecha_bautismo: string; fue_encuentro: string;
  nivel_formacion: string; habilidades_tecnicas: string; disponibilidad_horaria: string;
  area_servicio_actual: string; ministerio: string; grupo_celula: string;
  dia_reunion: string; hora_reunion: string; lugar_reunion: string;
  conyuge: string; hijos: string; tamano_hogar: string; vinculos_familiares_iglesia: string;
};

const INITIAL_FORM: FormData = {
  nombre: "", apellido: "", email: "", telefono: "", edad: "", direccion: "",
  fecha_nacimiento: "", genero: "", estado_civil: "", whatsapp: "", barrio_zona: "",
  ocupacion: "", nivel_educacion: "", fecha_conversion: "", fecha_llegada_cfc: "",
  bautizado: "", fecha_bautismo: "", fue_encuentro: "", nivel_formacion: "",
  habilidades_tecnicas: "", disponibilidad_horaria: "", area_servicio_actual: "",
  ministerio: "", grupo_celula: "", dia_reunion: "", hora_reunion: "", lugar_reunion: "",
  conyuge: "", hijos: "", tamano_hogar: "", vinculos_familiares_iglesia: "",
};

const STEPS = ["Datos Personales", "Iglesia", "Servicio", "Célula", "Familia"];

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);

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
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    const payload = {
      ...form,
      rol: "Líder",
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

  const next = () => {
    // Aquí idealmente se validaría cada paso antes de avanzar. 
    // Por ahora solo aseguramos que avance visualmente.
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const sectionTitle = (text: string) => (
    <h3 className="text-blue-700 font-semibold text-lg border-b border-slate-200 pb-2 mb-4 mt-6">
      {text}
    </h3>
  );

  const inputClasses = "w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow";
  const labelClasses = "block text-sm font-medium text-slate-700 mb-1";
  const fieldGroupClasses = "flex flex-col mb-4";

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center items-start py-10 px-4">
      <Toaster position="top-right" />

      <motion.form
        onSubmit={handleSubmit}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter" && step < STEPS.length - 1) e.preventDefault();
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 md:p-10 rounded-2xl w-full max-w-2xl shadow-xl border border-slate-100"
      >
        {/* LOGO + TÍTULO */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="CFC Logo" className="w-20 h-auto object-contain mb-4" />
          <h2 className="text-slate-800 text-2xl font-bold text-center leading-tight">
            Centro Familiar Cristiano<br />
            <span className="text-blue-600">Censo de Líderes</span>
          </h2>
        </div>

        {/* STEP INDICATOR */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {STEPS.map((s, i) => {
            const isCompleted = i < step;
            const isCurrent = i === step;
            return (
              <div
                key={s}
                onClick={() => isCompleted && setStep(i)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isCurrent
                    ? "bg-blue-600 text-white shadow-md"
                    : isCompleted
                    ? "bg-blue-50 text-blue-700 cursor-pointer hover:bg-blue-100"
                    : "bg-slate-100 text-slate-400 opacity-70 cursor-not-allowed"
                }`}
              >
                {s}
              </div>
            );
          })}
        </div>

        {/* STEP 0: DATOS PERSONALES */}
        {step === 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {sectionTitle("Información Personal")}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={fieldGroupClasses}>
                <label className={labelClasses}>Nombre *</label>
                <input className={inputClasses} value={form.nombre} onChange={set("nombre")} placeholder="Tu nombre" />
              </div>
              <div className={fieldGroupClasses}>
                <label className={labelClasses}>Apellido *</label>
                <input className={inputClasses} value={form.apellido} onChange={set("apellido")} placeholder="Tu apellido" />
              </div>
              <div className={fieldGroupClasses}>
                <label className={labelClasses}>Fecha de Nacimiento</label>
                <input type="date" className={inputClasses} value={form.fecha_nacimiento} onChange={set("fecha_nacimiento")} />
              </div>
              <div className={fieldGroupClasses}>
                <label className={labelClasses}>Edad</label>
                <input type="number" className={inputClasses} value={form.edad} onChange={set("edad")} placeholder="Ej: 30" />
              </div>
              <div className={fieldGroupClasses}>
                <label className={labelClasses}>Género</label>
                <select className={inputClasses} value={form.genero} onChange={set("genero")}>
                  <option value="">Seleccionar...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </select>
              </div>
            </div>

            {sectionTitle("Contacto")}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={fieldGroupClasses}>
                <label className={labelClasses}>Teléfono *</label>
                <input type="tel" className={inputClasses} value={form.telefono} onChange={set("telefono")} placeholder="Ej: 1123456789" />
              </div>
              <div className={fieldGroupClasses}>
                <label className={labelClasses}>WhatsApp</label>
                <input type="tel" className={inputClasses} value={form.whatsapp} onChange={set("whatsapp")} placeholder="Ej: 1123456789" />
              </div>
              <div className={`${fieldGroupClasses} md:col-span-2`}>
                <label className={labelClasses}>Email</label>
                <input type="email" className={inputClasses} value={form.email} onChange={set("email")} placeholder="correo@ejemplo.com" />
              </div>
            </div>

            {sectionTitle("Ubicación y Perfil")}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={fieldGroupClasses}>
                <label className={labelClasses}>Dirección</label>
                <input className={inputClasses} value={form.direccion} onChange={set("direccion")} placeholder="Tu dirección" />
              </div>
              <div className={fieldGroupClasses}>
                <label className={labelClasses}>Barrio / Zona</label>
                <input className={inputClasses} value={form.barrio_zona} onChange={set("barrio_zona")} placeholder="Ej: Isidro Casanova" />
              </div>
              <div className={fieldGroupClasses}>
                <label className={labelClasses}>Ocupación</label>
                <input className={inputClasses} value={form.ocupacion} onChange={set("ocupacion")} placeholder="Ej: Empleado, Estudiante" />
              </div>
              <div className={fieldGroupClasses}>
                <label className={labelClasses}>Nivel de Educación</label>
                <select className={inputClasses} value={form.nivel_educacion} onChange={set("nivel_educacion")}>
                  <option value="">Seleccionar...</option>
                  <option value="Primaria">Primaria</option>
                  <option value="Secundaria">Secundaria</option>
                  <option value="Técnico">Técnico</option>
                  <option value="Universitario">Universitario</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: IGLESIA */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {sectionTitle("Vida en la Iglesia")}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={fieldGroupClasses}>
                <label className={labelClasses}>Fecha de Conversión</label>
                <input type="date" className={inputClasses} value={form.fecha_conversion} onChange={set("fecha_conversion")} />
              </div>
              <div className={fieldGroupClasses}>
                <label className={labelClasses}>Fecha de Llegada a CFC</label>
                <input type="date" className={inputClasses} value={form.fecha_llegada_cfc} onChange={set("fecha_llegada_cfc")} />
              </div>
              <div className={fieldGroupClasses}>
                <label className={labelClasses}>¿Está Bautizado?</label>
                <select className={inputClasses} value={form.bautizado} onChange={set("bautizado")}>
                  <option value="">Seleccionar...</option>
                  <option value="Sí">Sí</option>
                  <option value="No">No</option>
                </select>
              </div>
              {form.bautizado === "Sí" && (
                <div className={fieldGroupClasses}>
                  <label className={labelClasses}>Fecha de Bautismo</label>
                  <input type="date" className={inputClasses} value={form.fecha_bautismo} onChange={set("fecha_bautismo")} />
                </div>
              )}
              <div className={fieldGroupClasses}>
                <label className={labelClasses}>¿Fue a un Encuentro?</label>
                <select className={inputClasses} value={form.fue_encuentro} onChange={set("fue_encuentro")}>
                  <option value="">Seleccionar...</option>
                  <option value="Sí">Sí</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className={fieldGroupClasses}>
                <label className={labelClasses}>Nivel de Formación</label>
                <select className={inputClasses} value={form.nivel_formacion} onChange={set("nivel_formacion")}>
                  <option value="">Seleccionar...</option>
                  <option value="Ninguno">Ninguno</option>
                  <option value="EFE">EFE</option>
                  <option value="Liderazgo">Liderazgo</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: SERVICIO */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {sectionTitle("Servicio y Habilidades")}
            <div className={fieldGroupClasses}>
              <label className={labelClasses}>Habilidades técnicas/profesionales</label>
              <textarea 
                className={inputClasses} 
                placeholder="Ej: Sonido, Diseño, Arte, Danza, Medicina, Albañilería..." 
                value={form.habilidades_tecnicas} 
                onChange={set("habilidades_tecnicas")} 
                rows={3} 
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={fieldGroupClasses}>
                <label className={labelClasses}>Disponibilidad Horaria</label>
                <select className={inputClasses} value={form.disponibilidad_horaria} onChange={set("disponibilidad_horaria")}>
                  <option value="">Seleccionar...</option>
                  <option value="Mañana">Mañana</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noche">Noche</option>
                  <option value="Fines de semana">Fines de semana</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </div>
              <div className={fieldGroupClasses}>
                <label className={labelClasses}>Área de servicio actual</label>
                <input className={inputClasses} value={form.area_servicio_actual} onChange={set("area_servicio_actual")} />
              </div>
              <div className={`${fieldGroupClasses} md:col-span-2`}>
                <label className={labelClasses}>Ministerio principal</label>
                <input className={inputClasses} value={form.ministerio} onChange={set("ministerio")} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: CÉLULA */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {sectionTitle("Datos de tu Célula")}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`${fieldGroupClasses} md:col-span-2`}>
                <label className={labelClasses}>Nombre de la célula</label>
                <input className={inputClasses} placeholder="Ej: Célula Esperanza" value={form.grupo_celula} onChange={set("grupo_celula")} />
              </div>
              <div className={fieldGroupClasses}>
                <label className={labelClasses}>Día de reunión</label>
                <select className={inputClasses} value={form.dia_reunion} onChange={set("dia_reunion")}>
                  <option value="">Seleccionar...</option>
                  <option value="Lunes">Lunes</option>
                  <option value="Martes">Martes</option>
                  <option value="Miércoles">Miércoles</option>
                  <option value="Jueves">Jueves</option>
                  <option value="Viernes">Viernes</option>
                  <option value="Sábado">Sábado</option>
                  <option value="Domingo">Domingo</option>
                </select>
              </div>
              <div className={fieldGroupClasses}>
                <label className={labelClasses}>Hora de reunión</label>
                <input type="time" className={inputClasses} value={form.hora_reunion} onChange={set("hora_reunion")} />
              </div>
              <div className={`${fieldGroupClasses} md:col-span-2`}>
                <label className={labelClasses}>Lugar de reunión (dirección)</label>
                <input className={inputClasses} value={form.lugar_reunion} onChange={set("lugar_reunion")} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: FAMILIA */}
        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {sectionTitle("Información Familiar")}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={fieldGroupClasses}>
                <label className={labelClasses}>Estado Civil</label>
                <select className={inputClasses} value={form.estado_civil} onChange={set("estado_civil")}>
                  <option value="">Seleccionar...</option>
                  <option value="Soltero/a">Soltero/a</option>
                  <option value="Casado/a">Casado/a</option>
                  <option value="Viudo/a">Viudo/a</option>
                  <option value="Divorciado/a">Divorciado/a</option>
                </select>
              </div>
              <div className={fieldGroupClasses}>
                <label className={labelClasses}>Tamaño del hogar</label>
                <input type="number" className={inputClasses} placeholder="Cantidad de personas" value={form.tamano_hogar} onChange={set("tamano_hogar")} />
              </div>
              <div className={fieldGroupClasses}>
                <label className={labelClasses}>Cónyuge</label>
                <input className={inputClasses} value={form.conyuge} onChange={set("conyuge")} placeholder="Nombre del cónyuge" />
              </div>
              <div className={fieldGroupClasses}>
                <label className={labelClasses}>Hijos</label>
                <input className={inputClasses} value={form.hijos} onChange={set("hijos")} placeholder="Nombres o cantidad" />
              </div>
              <div className={`${fieldGroupClasses} md:col-span-2`}>
                <label className={labelClasses}>Vínculos familiares en la iglesia</label>
                <textarea 
                  className={inputClasses} 
                  placeholder="Ej: hermano de Juan Pérez, hija de María López..." 
                  value={form.vinculos_familiares_iglesia} 
                  onChange={set("vinculos_familiares_iglesia")} 
                  rows={3} 
                />
              </div>
            </div>
          </div>
        )}

        {/* NAVIGATION BUTTONS */}
        <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-100">
          <div>
            {step > 0 && (
              <button 
                type="button" 
                onClick={prev} 
                className="px-6 py-3 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 font-medium transition-colors"
              >
                ← Anterior
              </button>
            )}
          </div>
          <div>
            {step < STEPS.length - 1 ? (
              <button 
                type="button" 
                onClick={next} 
                className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md transition-colors"
              >
                Siguiente →
              </button>
            ) : (
              <button 
                type="button" 
                disabled={loading} 
                onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
                className="px-8 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition-colors disabled:opacity-50"
              >
                {loading ? "Enviando..." : "Enviar Censo"}
              </button>
            )}
          </div>
        </div>
      </motion.form>
    </div>
  );
}