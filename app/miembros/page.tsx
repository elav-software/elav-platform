"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

const LOCALIDADES_BUENOS_AIRES = [
  "Adrogué", "Almirante Brown", "Avellaneda", "Cañuelas", "Ciudad Evita", "Banfield", "Barracas",
  "Beccar", "Berazategui", "Bernal", "Burzaco", "Caballito",
  "Castelar", "Ciudadela", "Ciudad Autónoma de Buenos Aires", "Claypole",
  "Don Bosco", "Don Torcuato", "El Palomar", "El Talar", "Ezeiza",
  "Ezpeleta", "Florencio Varela", "Florida", "General Rodríguez",
  "González Catán", "Gregorio de Laferrere", "Guernica", "Haedo",
  "Hurlingham", "Ituzaingó", "José C. Paz", "La Matanza", "La Plata",
  "Lanús", "Llavallol", "Lomas de Zamora", "Longchamps", "Luján",
  "Luis Guillón", "Malvinas Argentinas", "Martínez", "Merlo",
  "Monte Grande", "Moreno", "Morón", "Munro", "Olivos",
  "Palermo", "Pilar", "Quilmes", "Rafael Calzada", "Ramos Mejía",
  "Ranelagh", "Remedios de Escalada", "San Fernando", "San Isidro",
  "San Justo", "San Martín", "San Miguel", "San Nicolás",
  "Temperley", "Tigre", "Tres de Febrero", "Tristán Suárez",
  "Turdera", "Varela", "Vicente López", "Villa Ballester",
  "Villa del Parque", "Villa Devoto", "Villa Luro", "Villa Madero",
  "Villa Urquiza", "Wilde", "Zárate",
  "Isidro Casanova", "La Tablada", "Lomas del Mirador",
  "Rafael Castillo", "Tapiales", "Villa Luzuriaga",
  "Virrey del Pino", "20 de Junio",
  "Otro",
].sort((a, b) => a.localeCompare(b, "es"));

async function resolveChurchId(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

  if (isLocal) {
    const slug = new URLSearchParams(window.location.search).get('church')
      ?? process.env.NEXT_PUBLIC_DEFAULT_CHURCH_SLUG
      ?? 'cfc';
    const { data } = await supabase.from('churches').select('id').eq('slug', slug).eq('is_active', true).single();
    return data?.id ?? null;
  }

  const rootDomain = hostname.replace(/^www\./, '').replace(/^(crm|censo|portal)\./, '');
  const { data } = await supabase.from('churches').select('id').eq('custom_domain', rootDomain).eq('is_active', true).single();
  return data?.id ?? null;
}
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";

type Lider = {
  id: number;
  nombre: string;
  apellido: string;
};

type FormData = {
  nombre: string; apellido: string; email: string; telefono: string; direccion: string;
  fecha_nacimiento: string; genero: string; estado_civil: string;
  barrio_zona: string; ocupacion: string; lider_id: string;
  bautizado: string; fue_encuentro: string; conyuge: string; hijos: string;
  foto_url: string;
  area_servicio_actual: string[];
};

const AREAS_SERVICIO = [
  "Consolidación", "Vasos de barro", "Coro Kids", "Alabanza", "Expresión",
  "Intercesión", "CFC Niños", "Medios", "Social media", "Sonido", "Luces",
  "Pantalla", "Llamados a la escena", "Servicio Especial", "Seguridad",
  "Casa en Orden", "Asesoramiento de Imagen", "Primeros Auxilios", "Embajadores de Alegría"
];

const INITIAL_FORM: FormData = {
  nombre: "", apellido: "", email: "", telefono: "", direccion: "", fecha_nacimiento: "",
  genero: "", estado_civil: "", barrio_zona: "", ocupacion: "", lider_id: "",
  bautizado: "", fue_encuentro: "", conyuge: "", hijos: "", foto_url: "",
  area_servicio_actual: [],
};

const STEPS = ["Datos Personales", "Iglesia y Líder", "Familia"];

export default function MiembrosPage() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [lideres, setLideres] = useState<Lider[]>([]);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [tieneCelula, setTieneCelula] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(15);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La foto no puede superar 5MB");
      return;
    }
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const handleCheckboxArea = (value: string) => {
    setForm(prev => ({
      ...prev,
      area_servicio_actual: prev.area_servicio_actual.includes(value)
        ? prev.area_servicio_actual.filter(v => v !== value)
        : [...prev.area_servicio_actual, value]
    }));
  };

  useEffect(() => {
    const fetchLideres = async () => {
      const churchId = await resolveChurchId();
      if (!churchId) {
        console.error("No se pudo resolver church_id para cargar líderes");
        return;
      }
      const { data, error } = await supabase
        .rpc("get_lideres_publicos", { p_church_id: churchId });

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
    if (!fotoFile) {
      toast.error("La foto de perfil es obligatoria");
      setStep(0);
      return false;
    }
    if (tieneCelula === null) {
      toast.error("Indicá si pertenecés a una célula");
      setStep(1);
      return false;
    }
    if (tieneCelula && !form.lider_id) {
      toast.error("Seleccioná tu líder");
      setStep(1);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    const churchId = await resolveChurchId();

    // Verificar duplicados antes de registrar
    if (churchId) {
      try {
        const { data: existing } = await supabase
          .from("personas")
          .select("id, fecha_nacimiento")
          .eq("church_id", churchId)
          .ilike("nombre", form.nombre.trim())
          .ilike("apellido", form.apellido.trim())
          .limit(5);
        if (existing && existing.length > 0) {
          const dobMatch = form.fecha_nacimiento
            ? existing.some(e => e.fecha_nacimiento === form.fecha_nacimiento)
            : false;
          if (!form.fecha_nacimiento || dobMatch || existing.length >= 1) {
            toast.error("Ya existe un registro con ese nombre y apellido. Si necesitás actualizar tus datos, contactate con tu líder.");
            setLoading(false);
            return;
          }
        }
      } catch {
        // Si RLS bloquea la consulta, continuar con el registro
      }
    }

    // Subir foto
    let fotoUrl = "";
    if (fotoFile) {
      const ext = fotoFile.name.split(".").pop();
      const path = `${churchId ?? "public"}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("leader-photos")
        .upload(path, fotoFile, { upsert: true });
      if (uploadError) {
        toast.error("Error al subir la foto");
        setLoading(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from("leader-photos").getPublicUrl(path);
      fotoUrl = publicUrl;
    }

    const cap = (s: string) => s ? s.trim().replace(/\b\w/g, c => c.toUpperCase()) : s;

    const payload = {
      nombre: cap(form.nombre),
      apellido: cap(form.apellido),
      email: form.email || null,
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
      lider_id: tieneCelula ? form.lider_id : null,
      foto_url: fotoUrl || null,
      area_servicio_actual: form.area_servicio_actual.length > 0 ? form.area_servicio_actual.join(", ") : null,
      ...(churchId ? { church_id: churchId } : {}),
    };

    const { error } = await supabase.from("personas").insert([payload]);

    setLoading(false);

    if (error) {
      toast.error("Error al guardar");
      console.error(error);
    } else {
      setSubmitted(true);
      let secs = 15;
      setCountdown(secs);
      const interval = setInterval(() => {
        secs -= 1;
        setCountdown(secs);
        if (secs <= 0) clearInterval(interval);
      }, 1000);
    }
  };

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
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

      {/* PANTALLA DE CONFIRMACIÓN */}
      {submitted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-10 rounded-[2rem] w-full max-w-md shadow-2xl border border-slate-100 flex flex-col items-center text-center gap-6"
        >
          <img src="/logo.png" alt="CFC Logo" className="w-20 h-auto object-contain" />
          <div>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800 mb-2">¡Registro Enviado!</h2>
            <p className="text-slate-500 text-sm">
              Tu solicitud fue recibida correctamente.<br />
              El pastor revisará tu registro y te contactará pronto.
            </p>
          </div>
          {countdown > 0 ? (
            <div className="flex flex-col items-center gap-1">
              <div className="w-14 h-14 rounded-full border-4 border-blue-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">{countdown}</span>
              </div>
              <p className="text-xs text-slate-400">Esta pantalla seguirá mostrando tu confirmación</p>
            </div>
          ) : (
            <span className="inline-block px-6 py-2 bg-green-100 text-green-700 font-bold rounded-full text-sm tracking-wide">✓ ENVIADO</span>
          )}
        </motion.div>
      )}

      {!submitted && <motion.form
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
            <span className="text-blue-600">Registro de Miembros</span>
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
            {/* Foto de perfil */}
            <div className="flex flex-col items-center mb-8">
              <div
                className="w-28 h-28 rounded-full border-4 border-blue-100 bg-slate-100 overflow-hidden flex items-center justify-center mb-3 shadow-md cursor-pointer relative group"
                onClick={() => document.getElementById('foto-input-miembro')?.click()}
              >
                {fotoPreview ? (
                  <img src={fotoPreview} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                    <span className="text-xs font-bold">Foto</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-full transition-opacity">
                  <span className="text-white text-xs font-bold">Cambiar</span>
                </div>
              </div>
              <input
                id="foto-input-miembro"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFotoChange}
              />
              <button
                type="button"
                onClick={() => document.getElementById('foto-input-miembro')?.click()}
                className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                {fotoPreview ? "Cambiar foto" : "Subir foto *"}
              </button>
              {!fotoPreview && <p className="text-xs text-slate-400 mt-1">JPG, PNG o WEBP · Máx 5MB</p>}
            </div>
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
                <label className={labelClasses}>Email</label>
                <input type="email" className={inputClasses} value={form.email} onChange={set("email")} placeholder="tu-email@ejemplo.com" />
                <p className="text-xs text-slate-400 mt-1">Necesario para acceder al portal si servís en algún área</p>
              </div>
            </div>

            {sectionTitle("Ubicación y Perfil")}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={fieldGroupClasses}>
                <label className={labelClasses}>Dirección</label>
                <input className={inputClasses} value={form.direccion} onChange={set("direccion")} placeholder="Tu dirección" />
              </div>
              <div className={fieldGroupClasses}>
                <label className={labelClasses}>Localidad / Barrio</label>
                <select className={inputClasses} value={form.barrio_zona} onChange={set("barrio_zona")}>
                  <option value="">Seleccionar localidad...</option>
                  {LOCALIDADES_BUENOS_AIRES.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              <div className={`${fieldGroupClasses} md:col-span-2`}>
                <label className={labelClasses}>Ocupación</label>
                <input className={inputClasses} value={form.ocupacion} onChange={set("ocupacion")} placeholder="Ej: Empleado, Estudiante" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: IGLESIA Y LÍDER */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {sectionTitle("Vida en la Iglesia")}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={fieldGroupClasses}>
                <label className={labelClasses}>¿Está Bautizado?</label>
                <select className={inputClasses} value={form.bautizado} onChange={set("bautizado")}>
                  <option value="">Seleccionar...</option>
                  <option value="Sí">Sí</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className={fieldGroupClasses}>
                <label className={labelClasses}>¿Fue a un Encuentro?</label>
                <select className={inputClasses} value={form.fue_encuentro} onChange={set("fue_encuentro")}>
                  <option value="">Seleccionar...</option>
                  <option value="Sí">Sí</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>

            {sectionTitle("¿Pertenecés a una célula?")}
            <div className="flex gap-3 mb-6">
              <button
                type="button"
                onClick={() => setTieneCelula(true)}
                className={`flex-1 py-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                  tieneCelula === true
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-white text-slate-600 border-slate-300 hover:border-blue-400"
                }`}
              >
                Sí, tengo célula
              </button>
              <button
                type="button"
                onClick={() => { setTieneCelula(false); setForm(f => ({ ...f, lider_id: "" })); }}
                className={`flex-1 py-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                  tieneCelula === false
                    ? "bg-slate-700 text-white border-slate-700 shadow-md"
                    : "bg-white text-slate-600 border-slate-300 hover:border-slate-500"
                }`}
              >
                No, no tengo célula
              </button>
            </div>

            {tieneCelula === true && (
              <>
                {sectionTitle("Tu Líder *")}
                <div className={fieldGroupClasses}>
                  <label className={labelClasses}>Seleccioná tu líder</label>
                  <select className={inputClasses} value={form.lider_id} onChange={set("lider_id")}>
                    <option value="">Buscar en la lista...</option>
                    {lideres.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.apellido}, {l.nombre}
                      </option>
                    ))}
                  </select>
                  {lideres.length === 0 && (
                    <p className="text-sm text-slate-500 mt-2 italic">Cargando líderes disponibles...</p>
                  )}
                </div>
              </>
            )}

            {sectionTitle("¿Servís en algún área?")}
            <p className="text-sm text-slate-500 mb-3">Opcional. Podés seleccionar una o más áreas.</p>
            <div className="flex flex-wrap gap-2">
              {AREAS_SERVICIO.map(area => {
                const isSelected = form.area_servicio_actual.includes(area);
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => handleCheckboxArea(area)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-slate-600 border-slate-300 hover:border-blue-400 hover:text-blue-600"
                    }`}
                  >
                    {isSelected && <span className="mr-1">✓</span>}{area}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: FAMILIA */}
        {step === 2 && (
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
                <label className={labelClasses}>Cónyuge</label>
                <input className={inputClasses} value={form.conyuge} onChange={set("conyuge")} placeholder="Nombre del cónyuge" />
              </div>
              <div className={`${fieldGroupClasses} md:col-span-2`}>
                <label className={labelClasses}>Hijos</label>
                <input className={inputClasses} value={form.hijos} onChange={set("hijos")} placeholder="Nombres o cantidad" />
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
                {loading ? "Enviando..." : "Enviar Registro"}
              </button>
            )}
          </div>
        </div>
      </motion.form>}
    </div>
  );
}