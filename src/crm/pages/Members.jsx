"use client";
// Módulo de gestión de miembros — CFC CASA CRM
import React, { useEffect, useState } from "react";
import { api, getMyChurchId } from "@crm/api/apiClient";
import { Card } from "@crm/components/ui/card";
import { Badge } from "@crm/components/ui/badge";
import { Button } from "@crm/components/ui/button";
import { Input } from "@crm/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@crm/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@crm/components/ui/dialog";
import { Label } from "@crm/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@crm/components/ui/tabs";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import { Users, Search, Phone, Mail, MapPin, Edit, Trash2, Crown, RefreshCw, Download } from "lucide-react";
import { differenceInYears, parseISO } from "date-fns";
import { Link } from "@crm/lib/router-compat";
import { supabase, supabaseToCRM, crmToSupabase } from "@crm/api/supabaseClient";

const F = ({ label, name, type = "text", options, optionLabels, form, setForm }) => (
  <div>
    <Label className="text-xs font-medium text-slate-600 mb-1 block">{label}</Label>
    {options ? (
      <Select value={form[name] || ""} onValueChange={v => setForm(f => ({ ...f, [name]: v }))}>
        <SelectTrigger className="h-9 text-sm">
          <SelectValue placeholder={`Seleccionar ${label}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o, i) => <SelectItem key={o} value={o}>{optionLabels ? optionLabels[i] : o}</SelectItem>)}
        </SelectContent>
      </Select>
    ) : (
      <Input type={type} value={form[name] || ""} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
        className="h-9 text-sm" />
    )}
  </div>
);

const STATUS_COLORS = {
  Visitor: "bg-sky-100 text-sky-700 border-sky-200",
  "New Believer": "bg-emerald-100 text-emerald-700 border-emerald-200",
  Member: "bg-indigo-100 text-indigo-700 border-indigo-200",
  Leader: "bg-amber-100 text-amber-700 border-amber-200",
};

const STATUS_LABELS = {
  Visitor: "Visitante",
  "New Believer": "Nuevo Creyente",
  Member: "Miembro",
  Leader: "Líder",
};

const EMPTY_FORM = {
  full_name: "", gender: "", date_of_birth: "", marital_status: "",
  phone_number: "", whatsapp_number: "", email: "", address: "",
  city_neighborhood: "", occupation: "", education_level: "",
  member_status: "Member", date_first_visited: "", date_joined: "",
  baptism_status: "Not Baptized", baptism_year: "", ministry_involvement: "",
  small_group: "", spiritual_growth_stage: "",
  spouse: "", children: "", household_size: "",
  conversion_year: "", attended_encounter: "", training_level: "",
  how_did_you_find_us: "", who_invited_you: "",
  technical_skills: "", schedule_availability: "", current_service_area: "",
  church_family_ties: "",
  supabase_id: ""
};

export default function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  const load = async () => {
    const data = await api.entities.Member.list("-created_date", 500);
    setMembers(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (m) => { setEditing(m); setForm({ ...EMPTY_FORM, ...m }); setModalOpen(true); };

  // --- SYNC: CRM → Supabase (al crear/editar) ---
  const syncToSupabase = async (member, supabaseId) => {
    const supaData = crmToSupabase(member);
    if (supabaseId) {
      await supabase.from("personas").update(supaData).eq("id", supabaseId);
    } else {
      const churchId = await getMyChurchId();
      const { data, error } = await supabase
        .from("personas")
        .insert([{ ...supaData, church_id: churchId }])
        .select("id")
        .single();
      if (error) console.error("Error al insertar en personas:", error);
      return data?.id ?? null;
    }
    return supabaseId;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, household_size: form.household_size ? Number(form.household_size) : undefined };

      if (editing) {
        await api.entities.Member.update(editing.id, payload);
        await syncToSupabase(payload, payload.supabase_id);
      } else {
        // api.entities.Member.create ya inserta en personas con church_id
        const created = await api.entities.Member.create(payload);
        // Guardar el supabase_id para futuros updates de sincronización
        if (created?.id) {
          await api.entities.Member.update(created.id, { supabase_id: created.id });
        }
      }
    } catch (err) {
      console.error("Error al guardar/sincronizar:", err);
    }
    await load();
    setModalOpen(false);
    setSaving(false);
  };

  // --- SYNC: Supabase → CRM (importar censo) ---
  const handleImportFromSupabase = async () => {
    setSyncing(true);
    setSyncMsg("");
    try {
      // Traer solo personas aprobadas:
      // - Miembros normales: todos
      // - Líderes: solo los aprobados (excluye pendientes y rechazados)
      const { data: personas, error } = await supabase
        .from("personas")
        .select("*")
        .or("rol.neq.Líder,and(rol.eq.Líder,estado_aprobacion.eq.aprobado)");
      
      if (error) throw error;

      const currentMembers = await api.entities.Member.list("-created_date", 1000);
      const existingSupabaseIds = new Set(currentMembers.map(m => m.supabase_id).filter(Boolean));
      // Clave de deduplicación: nombre completo + fecha de nacimiento
      const existingKeys = new Set(currentMembers.map(m => {
        const name = m.full_name?.toLowerCase().trim() || "";
        const dob = m.date_of_birth || "";
        return `${name}||${dob}`;
      }));

      const currentLeaders = await api.entities.Leader.list("-created_date", 500);
      const existingLeaderSupaIds = new Set(currentLeaders.map(l => {
        const m = currentMembers.find(mb => mb.id === l.member_id);
        return m?.supabase_id;
      }).filter(Boolean));

      let importedMembers = 0;
      let skippedMembers = 0;
      let importedLeaders = 0;
      let importedCellMembers = 0;

      // Identificar IDs de líderes (por rol o porque alguien los referencia como lider_id)
      const liderSupabaseIds = new Set();
      personas.forEach(p => {
        if (p.rol === "Líder" || p.rol === "Lider") liderSupabaseIds.add(p.id);
      });
      personas.forEach(p => {
        if (p.lider_id) liderSupabaseIds.add(p.lider_id);
      });

      // Mapa supabase_id → member CRM creado (para vincular después)
      const supaIdToMemberId = {};
      currentMembers.forEach(m => { if (m.supabase_id) supaIdToMemberId[m.supabase_id] = m.id; });

      // Paso 1: importar todos como Member
      for (const persona of personas) {
        const fullName = [persona.nombre, persona.apellido].filter(Boolean).join(" ").toLowerCase().trim();
        const dob = persona.fecha_nacimiento || "";
        const key = `${fullName}||${dob}`;
        if (existingSupabaseIds.has(persona.id) || existingKeys.has(key)) {
          skippedMembers++;
          continue;
        }
        const isLider = liderSupabaseIds.has(persona.id);
        const memberData = supabaseToCRM(persona);
        if (isLider) memberData.member_status = "Leader";
        const created = await api.entities.Member.create(memberData);
        supaIdToMemberId[persona.id] = created.id;
        importedMembers++;
      }

      // Paso 2: crear Leaders para los que son líderes y no existían
      const supaIdToLeaderId = {};
      currentLeaders.forEach(l => {
        const m = currentMembers.find(mb => mb.id === l.member_id);
        if (m?.supabase_id) supaIdToLeaderId[m.supabase_id] = l.id;
      });

      const DAY_MAP = { "Lunes": "Monday", "Martes": "Tuesday", "Miércoles": "Wednesday", "Miercoles": "Wednesday", "Jueves": "Thursday", "Viernes": "Friday", "Sábado": "Saturday", "Sabado": "Saturday", "Domingo": "Sunday" };

      for (const supaId of liderSupabaseIds) {
        if (supaIdToLeaderId[supaId]) continue; // ya existe
        const persona = personas.find(p => p.id === supaId);
        if (!persona) continue;
        const memberId = supaIdToMemberId[supaId];
        if (!memberId) continue;
        const lugar = persona.lugar_reunion || persona.direccion || "";
        const leaderPayload = {
          full_name: [persona.nombre, persona.apellido].filter(Boolean).join(" "),
          phone: persona.telefono || "",
          email: persona.email || "",
          cell_name: persona.grupo_celula || "",
          meeting_day: DAY_MAP[persona.dia_reunion] || "",
          meeting_time: persona.hora_reunion || "",
          meeting_location: lugar,
          member_id: memberId,
        };
        // Geocodificar dirección
        if (lugar) {
          try {
            const geoRes = await api.functions.invoke('geocodeAddress', { address: lugar });
            if (geoRes?.lat) {
              leaderPayload.latitude = geoRes.lat;
              leaderPayload.longitude = geoRes.lng;
            }
          } catch (e) { console.warn('Geocoding failed for', lugar, e); }
        }
        const leader = await api.entities.Leader.create(leaderPayload);
        supaIdToLeaderId[supaId] = leader.id;
        importedLeaders++;
      }

      // Paso 3: crear CellMembers para personas con lider_id
      const existingCellMembers = await api.entities.CellMember.list("-created_date", 1000);
      const existingCellMemberKeys = new Set(
        existingCellMembers.map(cm => `${cm.leader_id}__${cm.member_name?.toLowerCase().trim()}`)
      );

      for (const persona of personas) {
        if (!persona.lider_id) continue;
        const leaderId = supaIdToLeaderId[persona.lider_id];
        if (!leaderId) continue;
        const fullName = [persona.nombre, persona.apellido].filter(Boolean).join(" ");
        const key = `${leaderId}__${fullName.toLowerCase().trim()}`;
        if (existingCellMemberKeys.has(key)) continue;
        await api.entities.CellMember.create({
          leader_id: leaderId,
          member_name: fullName,
          phone: persona.telefono || "",
          status: "Active",
        });
        importedCellMembers++;
      }

      setSyncMsg(`Miembros: ${importedMembers} importados, ${skippedMembers} ya existían | Líderes: ${importedLeaders} | Miembros de célula: ${importedCellMembers}`);
      await load();
    } catch (err) {
      console.error("Error al importar:", err);
      setSyncMsg("Error al importar desde Supabase");
    }
    setSyncing(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este miembro del CRM?\n(El registro en el censo de Supabase se conservará y podrá volver a importarse)")) return;
    await api.entities.Member.delete(id);
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const calcAge = (dob) => {
    if (!dob) return null;
    try { return differenceInYears(new Date(), parseISO(dob)); } catch { return null; }
  };

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.full_name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.phone_number?.includes(q);
    const matchStatus = filterStatus === "all" || m.member_status === filterStatus;
    return matchSearch && matchStatus;
  });



  return (
    <div>
      <PageHeader title="Miembros" subtitle={`${members.length} miembros en total`} onAdd={openAdd} addLabel="Agregar Miembro" />

      {/* SYNC BUTTON */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Button variant="outline" size="sm" onClick={handleImportFromSupabase} disabled={syncing}
          className="h-9 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50">
          {syncing ? <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1.5" />}
          {syncing ? "Importando..." : "Importar desde Censo (Supabase)"}
        </Button>
        {syncMsg && <span className="text-xs text-slate-500">{syncMsg}</span>}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar por nombre, correo, teléfono..." className="pl-9 h-10"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48 h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="Visitor">Visitante</SelectItem>
            <SelectItem value="New Believer">Nuevo Creyente</SelectItem>
            <SelectItem value="Member">Miembro</SelectItem>
            <SelectItem value="Leader">Líder</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="h-44 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <EmptyState icon={Users} title="No se encontraron miembros" description="Agrega tu primer miembro o ajusta los filtros." onAction={openAdd} actionLabel="Agregar Miembro" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(m => {
            const age = calcAge(m.date_of_birth);
            return (
              <Card key={m.id} className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {m.full_name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm leading-tight">{m.full_name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{age ? `${age} años` : ""}{age && m.gender ? " · " : ""}{m.gender === "Male" ? "Masculino" : m.gender === "Female" ? "Femenino" : m.gender || ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(m)} className="h-7 w-7 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" title="Editar">
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Badge className={`text-xs border ${STATUS_COLORS[m.member_status] || "bg-slate-100 text-slate-600"}`}>
                      {STATUS_LABELS[m.member_status] || m.member_status || "—"}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1.5 mb-4">
                  {m.phone_number && <div className="flex items-center gap-2 text-xs text-slate-500"><Phone className="w-3.5 h-3.5" />{m.phone_number}</div>}
                  {m.email && <div className="flex items-center gap-2 text-xs text-slate-500"><Mail className="w-3.5 h-3.5" />{m.email}</div>}
                  {m.city_neighborhood && <div className="flex items-center gap-2 text-xs text-slate-500"><MapPin className="w-3.5 h-3.5" />{m.city_neighborhood}</div>}
                </div>
                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(m)} className="flex-1 h-8 text-xs">
                    <Edit className="w-3 h-3 mr-1" /> Editar
                  </Button>
                  {m.member_status === "Leader" && (
                    <Link to="/Leaders">
                      <Button variant="ghost" size="sm" className="h-8 text-xs text-amber-600 hover:text-amber-800 hover:bg-amber-50" title="Ver en sección Líderes">
                        <Crown className="w-3 h-3" />
                      </Button>
                    </Link>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(m.id)} className="h-8 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Miembro" : "Agregar Nuevo Miembro"}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="personal">
            <TabsList className="w-full">
              <TabsTrigger value="personal" className="flex-1 text-xs">Personal</TabsTrigger>
              <TabsTrigger value="church" className="flex-1 text-xs">Iglesia</TabsTrigger>
              <TabsTrigger value="service" className="flex-1 text-xs">Servicio</TabsTrigger>
              <TabsTrigger value="family" className="flex-1 text-xs">Familia</TabsTrigger>
            </TabsList>
            <TabsContent value="personal" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <F label="Nombre Completo *" name="full_name" form={form} setForm={setForm} />
              <F label="Fecha de Nacimiento" name="date_of_birth" type="date" form={form} setForm={setForm} />
              <F label="Género" name="gender" options={["Male", "Female"]} optionLabels={["Masculino", "Femenino"]} form={form} setForm={setForm} />
              <F label="Dirección" name="address" form={form} setForm={setForm} />
              <F label="Barrio / Zona" name="city_neighborhood" form={form} setForm={setForm} />
              <F label="Teléfono" name="phone_number" form={form} setForm={setForm} />
              <F label="Número de WhatsApp" name="whatsapp_number" form={form} setForm={setForm} />
              <F label="Correo Electrónico" name="email" type="email" form={form} setForm={setForm} />
              <F label="Ocupación" name="occupation" form={form} setForm={setForm} />
              <F label="Nivel de Educación" name="education_level"
                options={["Primary", "Secondary", "Diploma", "Bachelor", "Master", "Doctorate", "Other"]}
                optionLabels={["Primaria", "Secundaria", "Técnico", "Licenciatura", "Maestría", "Doctorado", "Otro"]} form={form} setForm={setForm} />
            </TabsContent>
            <TabsContent value="church" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <F label="Estado en la Iglesia" name="member_status"
                options={["Visitor", "New Believer", "Member", "Leader"]}
                optionLabels={["Visitante", "Nuevo Creyente", "Miembro", "Líder"]} form={form} setForm={setForm} />
              <F label="Año de Conversión" name="conversion_year" form={form} setForm={setForm} />
              <F label="Fecha de Llegada a CFC" name="date_joined" type="date" form={form} setForm={setForm} />
              <F label="Primera Visita" name="date_first_visited" type="date" form={form} setForm={setForm} />
              <F label="¿Está Bautizado?" name="baptism_status"
                options={["Not Baptized", "Baptized"]}
                optionLabels={["No", "Sí"]} form={form} setForm={setForm} />
              <F label="Año de Bautismo" name="baptism_year" form={form} setForm={setForm} />
              <F label="¿Fue a un Encuentro?" name="attended_encounter"
                options={["No", "Sí"]} form={form} setForm={setForm} />
              <F label="Nivel de Formación" name="training_level"
                options={["Ninguno", "EFE", "Liderazgo"]}
                form={form} setForm={setForm} />
              <F label="¿Cómo nos conociste?" name="how_did_you_find_us" form={form} setForm={setForm} />
              <F label="¿Quién te invitó?" name="who_invited_you" form={form} setForm={setForm} />
              <F label="Área de Servicio Actual" name="current_service_area" form={form} setForm={setForm} />
              <F label="Ministerio" name="ministry_involvement" form={form} setForm={setForm} />
              <F label="Grupo Pequeño / Célula" name="small_group" form={form} setForm={setForm} />
            </TabsContent>
            <TabsContent value="family" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <F label="Estado Civil" name="marital_status" options={["Single", "Married", "Widowed", "Divorced"]} optionLabels={["Soltero/a", "Casado/a", "Viudo/a", "Divorciado/a"]} form={form} setForm={setForm} />
              <F label="Cónyuge" name="spouse" form={form} setForm={setForm} />
              <F label="Hijos" name="children" form={form} setForm={setForm} />
              <F label="Tamaño del Hogar" name="household_size" type="number" form={form} setForm={setForm} />
              <F label="Vínculos Familiares en la Iglesia" name="church_family_ties" form={form} setForm={setForm} />
            </TabsContent>
          </Tabs>
          <div className="flex gap-3 pt-4 mt-2 border-t">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.full_name}
              className="flex-1 bg-[#d4a843] hover:bg-[#c49a3a] text-[#1e293b] font-semibold">
              {saving ? "Guardando..." : editing ? "Guardar Cambios" : "Agregar Miembro"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}