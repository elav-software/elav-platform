import { createClient } from "@supabase/supabase-js";

// Uses the same Supabase project as censo-iglesia.
// Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);


export function supabaseToCRM(persona) {
  const genderMap = { Masculino: "Male", Femenino: "Female" };
  const maritalMap = { "Soltero/a": "Single", "Casado/a": "Married", "Viudo/a": "Widowed", "Divorciado/a": "Divorced" };
  const baptismMap = { "Sí": "Baptized", "No": "Not Baptized" };

  const isLider = persona.rol === "Líder" || persona.rol === "Lider";
  const memberStatus = isLider ? "Leader" : "Member";

  return {
    supabase_id: persona.id,
    lider_id: persona.lider_id || "",
    full_name: [persona.nombre, persona.apellido].filter(Boolean).join(" "),
    gender: genderMap[persona.genero] || "",
    date_of_birth: persona.fecha_nacimiento || "",
    marital_status: maritalMap[persona.estado_civil] || "",
    phone_number: persona.telefono || "",
    whatsapp_number: persona.whatsapp || "",
    email: persona.email || "",
    address: persona.direccion || "",
    city_neighborhood: persona.barrio_zona || "",
    occupation: persona.ocupacion || "",
    education_level: persona.nivel_educacion || "",
    member_status: memberStatus,
    date_joined: persona.fecha_llegada_cfc || "",
    conversion_year: persona.ano_conversion || "",
    baptism_status: baptismMap[persona.bautizado] || "Not Baptized",
    baptism_year: persona.ano_bautismo || "",
    attended_encounter: persona.fue_encuentro || "",
    training_level: persona.nivel_formacion || "",
    how_did_you_find_us: persona.como_conociste || "",
    who_invited_you: persona.quien_te_invito || "",
    technical_skills: persona.habilidades_tecnicas || "",
    schedule_availability: persona.disponibilidad_horaria || "",
    current_service_area: persona.area_servicio_actual || "",
    ministry_involvement: persona.ministerio || "",
    small_group: persona.grupo_celula || "",
    dia_reunion: persona.dia_reunion || "",
    hora_reunion: persona.hora_reunion || "",
    lugar_reunion: persona.lugar_reunion || "",
    spouse: persona.conyuge || "",
    children: persona.hijos || "",
    household_size: persona.tamano_hogar ? Number(persona.tamano_hogar) : undefined,
    church_family_ties: persona.vinculos_familiares_iglesia || "",
  };
}

export function crmToSupabase(member) {
  const genderMap = { Male: "Masculino", Female: "Femenino" };
  const maritalMap = { Single: "Soltero/a", Married: "Casado/a", Widowed: "Viudo/a", Divorced: "Divorciado/a" };
  const baptismMap = { Baptized: "Sí", "Not Baptized": "No" };
  const rolMap = { Visitor: "Visitante", "New Believer": "Nuevo Creyente", Member: "Miembro", Leader: "Líder" };
  const nameParts = (member.full_name || "").trim().split(/\s+/);
  return {
    nombre: nameParts[0] || "",
    apellido: nameParts.slice(1).join(" ") || "",
    email: member.email || null,
    telefono: member.phone_number || null,
    edad: member.date_of_birth ? Math.floor((Date.now() - new Date(member.date_of_birth).getTime()) / 31557600000) : null,
    fecha_nacimiento: member.date_of_birth || null,
    genero: genderMap[member.gender] || null,
    estado_civil: maritalMap[member.marital_status] || null,
    whatsapp: member.whatsapp_number || null,
    direccion: member.address || null,
    barrio_zona: member.city_neighborhood || null,
    ocupacion: member.occupation || null,
    nivel_educacion: member.education_level || null,
    rol: rolMap[member.member_status] || null,
    ano_conversion: member.conversion_year || null,
    fecha_llegada_cfc: member.date_joined || null,
    bautizado: baptismMap[member.baptism_status] || "No",
    ano_bautismo: member.baptism_year || null,
    fue_encuentro: member.attended_encounter || "No",
    nivel_formacion: member.training_level || "Ninguno",
    como_conociste: member.how_did_you_find_us || null,
    quien_te_invito: member.who_invited_you || null,
    habilidades_tecnicas: member.technical_skills || null,
    disponibilidad_horaria: member.schedule_availability || null,
    area_servicio_actual: member.current_service_area || null,
    ministerio: member.ministry_involvement || null,
    grupo_celula: member.small_group || null,
    dia_reunion: member.dia_reunion || null,
    hora_reunion: member.hora_reunion || null,
    lugar_reunion: member.lugar_reunion || null,
    conyuge: member.spouse || null,
    hijos: member.children || null,
    tamano_hogar: member.household_size ? Number(member.household_size) : null,
    vinculos_familiares_iglesia: member.church_family_ties || null,
    lider_id: member.lider_id || null,
  };
}