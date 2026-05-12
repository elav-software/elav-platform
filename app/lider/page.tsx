"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

const CHURCH_ADDRESS  = "Av. Brig. Gral. Juan Manuel de Rosas 7840, B1765 Isidro Casanova, Provincia de Buenos Aires, Argentina";
const CHURCH_LOCALIDAD = "Isidro Casanova";

const LOCALIDADES_BUENOS_AIRES = [
  "Adrogué", "Almirante Brown", "Avellaneda", "Banfield", "Barracas",
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
  // Partido de La Matanza (localidades frecuentes CFC)
  "Isidro Casanova", "La Tablada", "Lomas del Mirador",
  "Rafael Castillo", "Tapiales", "Villa Luzuriaga",
  "Virrey del Pino", "20 de Junio",
  "Otro",
].sort((a, b) => a.localeCompare(b, "es"));

/** Resuelve el church_id desde el dominio del navegador, consultando Supabase. */
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

  // Producción: strip www. y subdominios (censo.) para obtener el dominio raíz
  const parts = hostname.split('.');
  const rootDomain = parts.length > 2 ? parts.slice(-2).join('.') : hostname;
  const { data } = await supabase.from('churches').select('id').eq('custom_domain', rootDomain).eq('is_active', true).single();
  return data?.id ?? null;
}
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

type FormData = {
  nombre: string; apellido: string; email: string; telefono: string;
  edad: string; direccion: string; fecha_nacimiento: string; genero: string;
  estado_civil: string; whatsapp: string; barrio_zona: string; ocupacion: string;
  nivel_educacion: string; ano_conversion: string; fecha_llegada_cfc: string;
  bautizado: string; ano_bautismo: string; fue_encuentro: string;
  nivel_formacion: string; como_conociste: string; quien_te_invito: string;
  habilidades_tecnicas: string; disponibilidad_horaria: string[]; 
  area_servicio_actual: string[]; ministerio: string; grupo_celula: string;
  dia_reunion: string; hora_reunion: string; lugar_reunion: string; lugar_reunion_localidad: string;
  conyuge: string; hijos: string; tamano_hogar: string; vinculos_familiares_iglesia: string;
  foto_url: string;
};

const INITIAL_FORM: FormData = {
  nombre: "", apellido: "", email: "", telefono: "", edad: "", direccion: "",
  fecha_nacimiento: "", genero: "", estado_civil: "", whatsapp: "", barrio_zona: "",
  ocupacion: "", nivel_educacion: "", ano_conversion: "", fecha_llegada_cfc: "",
  bautizado: "", ano_bautismo: "", fue_encuentro: "", nivel_formacion: "",
  como_conociste: "", quien_te_invito: "", habilidades_tecnicas: "", 
  disponibilidad_horaria: [], area_servicio_actual: [], 
  ministerio: "", grupo_celula: "", dia_reunion: "", hora_reunion: "", lugar_reunion: "", lugar_reunion_localidad: "",
  conyuge: "", hijos: "", tamano_hogar: "", vinculos_familiares_iglesia: "",
  foto_url: "",
};

const STEPS = ["Personales", "Iglesia", "Servicio", "Célula", "Familia"];

const AREAS_SERVICIO = [
  "Consolidación", "Vasos de barro", "Coro Kids", "Alabanza", "Expresión", 
  "Intercesión", "CFC Niños", "Medios", "Social media", "Sonido", "Luces", 
  "Pantalla", "Llamados a la escena", "Servicio Especial", "Seguridad", 
  "Casa en Orden", "Asesoramiento de Imagen", "Primeros Auxilios", "Embajadores de Alegría"
];

const DISPONIBILIDAD = ["Mañana", "Tarde", "Noche", "Fines de semana", "Flexible"];

function resizeImage(file: File, maxPx = 1200, quality = 0.85): Promise<File> {
  return new Promise(resolve => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const { width, height } = img;
      if (width <= maxPx && height <= maxPx) { resolve(file); return; }
      const ratio = Math.min(maxPx / width, maxPx / height);
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(width  * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        blob => resolve(blob ? new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }) : file),
        'image/jpeg', quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
    img.src = objectUrl;
  });
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [reunionEnIglesia, setReunionEnIglesia] = useState(false);

  const toggleReunionEnIglesia = (checked: boolean) => {
    setReunionEnIglesia(checked);
    setForm(f => ({
      ...f,
      lugar_reunion: checked ? CHURCH_ADDRESS : "",
      lugar_reunion_localidad: checked ? CHURCH_LOCALIDAD : "",
    }));
  };

  const set = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm({ ...form, [field]: e.target.value });

  const handleNameChange = (field: "nombre" | "apellido") => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => setForm(prev => ({ ...prev, [field]: e.target.value.replace(/\d/g, '') }));

  const handleCheckbox = (field: "area_servicio_actual" | "disponibilidad_horaria", value: string) => {
    setForm(prev => {
      const currentArray = prev[field];
      if (currentArray.includes(value)) {
        return { ...prev, [field]: currentArray.filter(item => item !== value) };
      } else {
        return { ...prev, [field]: [...currentArray, value] };
      }
    });
  };

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La foto no puede superar 5MB");
      return;
    }
    const resized = await resizeImage(file);
    setFotoFile(resized);
    setFotoPreview(URL.createObjectURL(resized));
  };

  const validate = () => {
    if (!form.nombre || !form.apellido) {
      toast.error("Nombre y apellido son obligatorios");
      return false;
    }
    if (/\d/.test(form.nombre) || /\d/.test(form.apellido)) {
      toast.error("El nombre y apellido no pueden contener números");
      return false;
    }
    if (!form.email) {
      toast.error("El correo electrónico es obligatorio");
      return false;
    }
    if (!form.edad) {
      toast.error("La edad es obligatoria");
      return false;
    }
    if (!form.fecha_nacimiento) {
      toast.error("La fecha de nacimiento es obligatoria");
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
          // Sin DOB del usuario: no podemos distinguir → bloquear
          if (!form.fecha_nacimiento) {
            toast.error("Ya existe alguien con ese nombre. Completá tu fecha de nacimiento para verificar que no sea un duplicado.");
            setLoading(false);
            return;
          }
          // Con DOB: bloquear solo si algún registro coincide en DOB
          // o si algún registro existente no tiene DOB (no podemos distinguirlos)
          const isDuplicate = existing.some(
            e => e.fecha_nacimiento === form.fecha_nacimiento || !e.fecha_nacimiento
          );
          if (isDuplicate) {
            toast.error("Ya existe un registro con ese nombre y apellido. Si necesitás actualizar tus datos, contactate con el pastor.");
            setLoading(false);
            return;
          }
        }
      } catch {
        // Si RLS bloquea la consulta, continuar con el registro
      }
    }

    // Subir foto via API route (usa service_role, bypassa RLS)
    let fotoUrl = "";
    if (fotoFile && churchId) {
      const fd = new FormData();
      fd.append("file", fotoFile);
      fd.append("churchId", churchId);
      const res = await fetch("/api/upload-leader-photo", { method: "POST", body: fd });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Error desconocido" }));
        toast.error(error ?? "Error al subir la foto");
        setLoading(false);
        return;
      }
      const { url } = await res.json();
      fotoUrl = url;
    }

    const cap = (s: string) => s ? s.trim().toLowerCase().replace(/(^|\s)([^\s])/g, (_, sp, ch) => sp + ch.toUpperCase()) : s;

    const payload = {
      ...form,
      foto_url: fotoUrl || null,
      nombre: cap(form.nombre),
      apellido: cap(form.apellido),
      rol: "Líder",
      edad: form.edad ? Number(form.edad) : null,
      tamano_hogar: form.tamano_hogar ? Number(form.tamano_hogar) : null,
      fecha_nacimiento: form.fecha_nacimiento || null,
      ano_conversion: form.ano_conversion || null,
      ano_bautismo: form.ano_bautismo || null,
      fecha_llegada_cfc: form.fecha_llegada_cfc || null,
      area_servicio_actual: form.area_servicio_actual.join(", ") || null,
      disponibilidad_horaria: form.disponibilidad_horaria.join(", ") || null,
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

  // CLASES BASE
  const inputClasses = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-transparent transition-all duration-200 shadow-sm";
  
  // NUEVA CLASE PARA SELECTS: Aplica diseño Shadcn, oculta flecha nativa y pone SVG personalizado
  const selectClasses = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-transparent transition-all duration-200 shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25em_1.25em] bg-[right_1rem_center] bg-no-repeat cursor-pointer pr-10";
  
  const labelClasses = "block text-sm font-bold text-slate-700 mb-2";
  const fieldGroupClasses = "flex flex-col mb-5";

  const sectionTitle = (text: string) => (
    <h3 className="text-xl font-extrabold text-slate-800 tracking-tight mb-6 flex items-center gap-2">
      <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">{step + 1}</span>
      {text}
    </h3>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-start py-8 px-4 sm:py-12">
      <Toaster position="top-center" />

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

      {!submitted && (
        <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 sm:p-10 rounded-[2rem] w-full max-w-3xl shadow-2xl shadow-slate-200/50 border border-slate-100"
      >
        <div className="flex flex-col items-center mb-10">
          <img src="/logo.png" alt="CFC Logo" className="w-16 h-auto object-contain mb-5" />
          <h2 className="text-slate-800 text-2xl font-bold text-center leading-tight">
            Centro Familiar Cristiano<br />
            <span className="text-blue-600">Registro de Líderes</span>
          </h2>
        </div>

        <div className="mb-10">
          <div className="flex justify-between mb-3">
            {STEPS.map((s, i) => (
              <span key={s} className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${i <= step ? 'text-blue-600' : 'text-slate-300'}`}>
                <span className="hidden sm:inline">{s}</span>
                <span className="sm:hidden">{i + 1}</span>
              </span>
            ))}
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <motion.div 
              className="bg-blue-600 h-full rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ ease: "easeInOut", duration: 0.3 }}
            />
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => { if (e.key === "Enter" && step < STEPS.length - 1) e.preventDefault(); }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <div>
                  {sectionTitle("Información Personal")}

                  {/* Foto de perfil */}
                  <div className="flex flex-col items-center mb-8">
                    <div
                      className="w-28 h-28 rounded-full border-4 border-blue-100 bg-slate-100 overflow-hidden flex items-center justify-center mb-3 shadow-md cursor-pointer relative group"
                      onClick={() => document.getElementById('foto-input')?.click()}
                    >
                      {fotoPreview ? (
                        <img src={fotoPreview} alt="Foto" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-slate-400">
                          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-xs font-bold">Foto</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-full transition-opacity">
                        <span className="text-white text-xs font-bold">Cambiar</span>
                      </div>
                    </div>
                    <input
                      id="foto-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFotoChange}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('foto-input')?.click()}
                      className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {fotoPreview ? "Cambiar foto" : "Subir foto *"}
                    </button>
                    {!fotoPreview && (
                      <p className="text-xs text-slate-400 mt-1">JPG, PNG o WEBP · Máx 5MB</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-2">
                    <div className={fieldGroupClasses}>
                      <label className={labelClasses}>Nombre *</label>
                      <input className={inputClasses} value={form.nombre} onChange={handleNameChange("nombre")} placeholder="Tu nombre" />
                    </div>
                    <div className={fieldGroupClasses}>
                      <label className={labelClasses}>Apellido *</label>
                      <input className={inputClasses} value={form.apellido} onChange={handleNameChange("apellido")} placeholder="Tu apellido" />
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
                      <select className={selectClasses} value={form.genero} onChange={set("genero")}>
                        <option value="">Seleccionar...</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                      </select>
                    </div>
                  </div>

                  <div className="w-full h-px bg-slate-100 my-6"></div>

                  {sectionTitle("Contacto")}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-2">
                    <div className={fieldGroupClasses}>
                      <label className={labelClasses}>Teléfono *</label>
                      <input type="tel" className={inputClasses} value={form.telefono} onChange={set("telefono")} placeholder="Ej: 1123456789" />
                    </div>
                    <div className={`${fieldGroupClasses} md:col-span-2`}>
                      <label className={labelClasses}>Email *</label>
                      <input type="email" className={inputClasses} value={form.email} onChange={set("email")} placeholder="correo@ejemplo.com" />
                    </div>
                  </div>

                  <div className="w-full h-px bg-slate-100 my-6"></div>

                  {sectionTitle("Ubicación y Perfil")}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-2">
                    <div className={fieldGroupClasses}>
                      <label className={labelClasses}>Dirección</label>
                      <input className={inputClasses} value={form.direccion} onChange={set("direccion")} placeholder="Tu dirección" />
                    </div>
                    <div className={fieldGroupClasses}>
                      <label className={labelClasses}>Localidad / Barrio</label>
                      <select className={selectClasses} value={form.barrio_zona} onChange={set("barrio_zona")}>
                        <option value="">Seleccionar localidad...</option>
                        {LOCALIDADES_BUENOS_AIRES.map(loc => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>
                    <div className={fieldGroupClasses}>
                      <label className={labelClasses}>Ocupación</label>
                      <input className={inputClasses} value={form.ocupacion} onChange={set("ocupacion")} placeholder="Ej: Empleado, Estudiante" />
                    </div>
                    <div className={fieldGroupClasses}>
                      <label className={labelClasses}>Nivel de Educación</label>
                      <select className={selectClasses} value={form.nivel_educacion} onChange={set("nivel_educacion")}>
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

              {step === 1 && (
                <div>
                  {sectionTitle("Vida en la Iglesia")}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-2">
                    <div className={`${fieldGroupClasses} md:col-span-2`}>
                      <label className={labelClasses}>¿Cómo conociste la iglesia?</label>
                      <select className={selectClasses} value={form.como_conociste} onChange={set("como_conociste")}>
                        <option value="">Seleccionar...</option>
                        <option value="Invitación de un amigo/familiar">Invitación de un amigo/familiar</option>
                        <option value="Invitación de un miembro de la iglesia">Invitación de un miembro de la iglesia</option>
                        <option value="Instagram / Facebook">Instagram / Facebook</option>
                        <option value="YouTube">YouTube</option>
                        <option value="Sitio Web / Búsqueda en Google">Sitio Web / Búsqueda en Google</option>
                        <option value="Pasaba por la puerta">Pasaba por la puerta</option>
                        <option value="Evento especial / Campaña">Evento especial / Campaña</option>
                        <option value="Radio / TV">Radio / TV</option>
                      </select>
                    </div>
                    
                    {(form.como_conociste === "Invitación de un amigo/familiar" || form.como_conociste === "Invitación de un miembro de la iglesia") && (
                      <div className={`${fieldGroupClasses} md:col-span-2`}>
                        <label className={labelClasses}>¿Quién te invitó?</label>
                        <input className={inputClasses} value={form.quien_te_invito} onChange={set("quien_te_invito")} placeholder="Nombre de la persona" />
                      </div>
                    )}

                    <div className={fieldGroupClasses}>
                      <label className={labelClasses}>Año de Conversión</label>
                      <input type="number" min="1950" max="2026" className={inputClasses} value={form.ano_conversion} onChange={set("ano_conversion")} placeholder="Ej: 2015" />
                    </div>
                    <div className={fieldGroupClasses}>
                      <label className={labelClasses}>Fecha de Llegada a CFC</label>
                      <input type="date" className={inputClasses} value={form.fecha_llegada_cfc} onChange={set("fecha_llegada_cfc")} />
                    </div>
                    <div className={fieldGroupClasses}>
                      <label className={labelClasses}>¿Está Bautizado?</label>
                      <select className={selectClasses} value={form.bautizado} onChange={set("bautizado")}>
                        <option value="">Seleccionar...</option>
                        <option value="Sí">Sí</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    {form.bautizado === "Sí" && (
                      <div className={fieldGroupClasses}>
                        <label className={labelClasses}>Año de Bautismo</label>
                        <input type="number" min="1950" max="2026" className={inputClasses} value={form.ano_bautismo} onChange={set("ano_bautismo")} placeholder="Ej: 2016" />
                      </div>
                    )}
                    <div className={fieldGroupClasses}>
                      <label className={labelClasses}>¿Fue a un Encuentro?</label>
                      <select className={selectClasses} value={form.fue_encuentro} onChange={set("fue_encuentro")}>
                        <option value="">Seleccionar...</option>
                        <option value="Sí">Sí</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div className={fieldGroupClasses}>
                      <label className={labelClasses}>Nivel de Formación Ministerial</label>
                      <select className={selectClasses} value={form.nivel_formacion} onChange={set("nivel_formacion")}>
                        <option value="">Seleccionar...</option>
                        <option value="Ninguno">Ninguno</option>
                        <option value="EFE">EFE</option>
                        <option value="Liderazgo">Liderazgo</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
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

                  <div className="mb-8">
                    <label className={labelClasses}>Área de servicio actual <span className="text-slate-400 font-normal ml-1">(Selección múltiple)</span></label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-3">
                      {AREAS_SERVICIO.map(area => {
                        const isSelected = form.area_servicio_actual.includes(area);
                        return (
                          <label 
                            key={area} 
                            className={`relative flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 text-center select-none ${
                              isSelected 
                                ? "border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm" 
                                : "border-slate-100 bg-white text-slate-600 hover:border-blue-200 hover:bg-slate-50"
                            }`}
                          >
                            <input 
                              type="checkbox" 
                              className="sr-only"
                              checked={isSelected}
                              onChange={() => handleCheckbox("area_servicio_actual", area)}
                            />
                            <span className="text-xs font-bold leading-tight">{area}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div className="mb-8">
                    <label className={labelClasses}>Disponibilidad Horaria <span className="text-slate-400 font-normal ml-1">(Selección múltiple)</span></label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                      {DISPONIBILIDAD.map(disp => {
                        const isSelected = form.disponibilidad_horaria.includes(disp);
                        return (
                          <label 
                            key={disp} 
                            className={`relative flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 text-center select-none ${
                              isSelected 
                                ? "border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm" 
                                : "border-slate-100 bg-white text-slate-600 hover:border-blue-200 hover:bg-slate-50"
                            }`}
                          >
                            <input 
                              type="checkbox" 
                              className="sr-only"
                              checked={isSelected}
                              onChange={() => handleCheckbox("disponibilidad_horaria", disp)}
                            />
                            <span className="text-xs font-bold leading-tight">{disp}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  {sectionTitle("Datos de tu Célula")}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-2">
                    <div className={`${fieldGroupClasses} md:col-span-2`}>
                      <label className={labelClasses}>Red</label>
                      <select className={selectClasses} value={form.grupo_celula} onChange={set("grupo_celula")}>
                        <option value="">Seleccionar red...</option>
                        <option value="Jóvenes">Jóvenes</option>
                        <option value="Entrelazados">Entrelazados</option>
                        <option value="Familias de Bendición">Familias de Bendición</option>
                        <option value="Generales">Generales</option>
                      </select>
                    </div>
                    <div className={fieldGroupClasses}>
                      <label className={labelClasses}>Día de Reunión de la Célula</label>
                      <select className={selectClasses} value={form.dia_reunion} onChange={set("dia_reunion")}>
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
                      <label className={labelClasses}>Hora de Reunión de la Célula</label>
                      <select className={selectClasses} value={form.hora_reunion} onChange={set("hora_reunion")}>
                        <option value="">Seleccionar hora...</option>
                        {Array.from({ length: 48 }, (_, i) => {
                          const h = Math.floor(i / 2).toString().padStart(2, "0");
                          const m = i % 2 === 0 ? "00" : "30";
                          const val = `${h}:${m}`;
                          return <option key={val} value={val}>{val}</option>;
                        })}
                      </select>
                    </div>
                    <div className="md:col-span-2 mb-1">
                      <label
                        className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer select-none transition-colors duration-200"
                        style={{ borderColor: reunionEnIglesia ? "#2563eb" : "#e2e8f0", backgroundColor: reunionEnIglesia ? "#eff6ff" : "#f8fafc" }}
                        onClick={() => toggleReunionEnIglesia(!reunionEnIglesia)}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${reunionEnIglesia ? "bg-blue-600 border-blue-600" : "border-slate-300 bg-white"}`}>
                          {reunionEnIglesia && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm font-bold text-slate-700">¿La célula se reúne en la iglesia?</span>
                      </label>
                    </div>
                    <div className={fieldGroupClasses}>
                      <label className={labelClasses}>Dirección de la Célula</label>
                      <input
                        className={inputClasses}
                        value={form.lugar_reunion}
                        onChange={set("lugar_reunion")}
                        placeholder="Ej: Av. San Martín 1234"
                        readOnly={reunionEnIglesia}
                        style={reunionEnIglesia ? { backgroundColor: "#f1f5f9", color: "#64748b", cursor: "not-allowed" } : {}}
                      />
                    </div>
                    <div className={fieldGroupClasses}>
                      <label className={labelClasses}>Localidad / Barrio de la Célula</label>
                      <select
                        className={selectClasses}
                        value={form.lugar_reunion_localidad}
                        onChange={set("lugar_reunion_localidad")}
                        disabled={reunionEnIglesia}
                        style={reunionEnIglesia ? { backgroundColor: "#f1f5f9", color: "#64748b", cursor: "not-allowed", opacity: 1 } : {}}
                      >
                        <option value="">Seleccionar localidad...</option>
                        {LOCALIDADES_BUENOS_AIRES.map(loc => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  {sectionTitle("Información Familiar")}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-2">
                    <div className={fieldGroupClasses}>
                      <label className={labelClasses}>Estado Civil</label>
                      <select className={selectClasses} value={form.estado_civil} onChange={set("estado_civil")}>
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
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between items-center mt-10 pt-6 border-t border-slate-100">
            <div>
              {step > 0 && (
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button" 
                  onClick={prev} 
                  className="px-6 py-3 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold transition-colors"
                >
                  ← Atrás
                </motion.button>
              )}
            </div>
            <div>
              {step < STEPS.length - 1 ? (
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button" 
                  onClick={next} 
                  className="px-8 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg shadow-slate-900/20 transition-all"
                >
                  Continuar
                </motion.button>
              ) : (
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button" 
                  disabled={loading} 
                  onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
                  className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {loading ? "Procesando..." : "Completar Registro"}
                </motion.button>
              )}
            </div>
          </div>
        </form>
      </motion.div>
      )}
    </div>
  );
}