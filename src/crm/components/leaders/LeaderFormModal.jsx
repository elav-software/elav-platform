import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@crm/components/ui/dialog";
import { Button } from "@crm/components/ui/button";
import { Input } from "@crm/components/ui/input";
import { Label } from "@crm/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@crm/components/ui/select";
import { Textarea } from "@crm/components/ui/textarea";
import { base44 } from "@crm/api/base44Client";
import { supabase, crmToSupabase } from "@crm/api/supabaseClient";
import { MapPin, Loader2 } from "lucide-react";

const DAYS = [
  { en: "Monday", es: "Lunes" }, { en: "Tuesday", es: "Martes" }, { en: "Wednesday", es: "Miércoles" },
  { en: "Thursday", es: "Jueves" }, { en: "Friday", es: "Viernes" }, { en: "Saturday", es: "Sábado" }, { en: "Sunday", es: "Domingo" }
];

const EMPTY = { full_name: "", phone: "", email: "", cell_name: "", meeting_day: "", meeting_time: "", meeting_location: "", district: "", notes: "", latitude: "", longitude: "", member_id: "" };

export default function LeaderFormModal({ open, onClose, onSaved, editing }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState("");
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({ ...EMPTY, ...editing, latitude: editing.latitude ?? "", longitude: editing.longitude ?? "" });
      } else {
        setForm(EMPTY);
      }
      base44.entities.Member.filter({ member_status: "Leader" }, "-created_date", 200).then(setMembers).catch(() => {});
    }
  }, [editing, open]);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));
  const setVal = (field) => (value) => setForm(f => ({ ...f, [field]: value }));

  const geocodeLocation = async () => {
    if (!form.meeting_location) return;
    setGeocoding(true);
    try {
      const res = await base44.functions.invoke('geocodeAddress', { address: form.meeting_location });
      if (res?.data?.lat) setForm(f => ({ ...f, latitude: res.data.lat, longitude: res.data.lng }));
    } catch (e) { console.error('Geocoding failed', e); }
    setGeocoding(false);
  };

  const handleSave = async () => {
    setError("");
    if (!form.full_name.trim()) {
      setError("El nombre completo es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        full_name: form.full_name,
        phone: form.phone || undefined,
        email: form.email || undefined,
        cell_name: form.cell_name || undefined,
        meeting_day: form.meeting_day || undefined,
        meeting_time: form.meeting_time || undefined,
        meeting_location: form.meeting_location || undefined,
        district: form.district || undefined,
        notes: form.notes || undefined,
        member_id: form.member_id || undefined,
        latitude: form.latitude !== "" && form.latitude !== undefined ? Number(form.latitude) : undefined,
        longitude: form.longitude !== "" && form.longitude !== undefined ? Number(form.longitude) : undefined,
      };

      if (editing && editing.id) {
        await base44.entities.Leader.update(editing.id, payload);
        if (payload.member_id) {
          await base44.entities.Member.update(payload.member_id, {
            full_name: form.full_name,
            phone_number: form.phone || undefined,
            email: form.email || undefined,
            member_status: "Leader",
          });
        }
      } else {
        const allMembers = await base44.entities.Member.list("-created_date", 500);
        const nameToFind = form.full_name.toLowerCase().trim();
        let existingMember = allMembers.find(m => m.full_name?.toLowerCase().trim() === nameToFind);
        let memberId;
        if (existingMember) {
          await base44.entities.Member.update(existingMember.id, {
            member_status: "Leader",
            phone_number: form.phone || existingMember.phone_number,
            email: form.email || existingMember.email,
          });
          if (existingMember.supabase_id) {
            const supaData = crmToSupabase({ ...existingMember, member_status: "Leader" });
            await supabase.from("personas").update(supaData).eq("id", existingMember.supabase_id);
          }
          memberId = existingMember.id;
        } else {
          const memberData = {
            full_name: form.full_name,
            phone_number: form.phone || undefined,
            email: form.email || undefined,
            member_status: "Leader",
          };
          const supaData = crmToSupabase(memberData);
          const { data } = await supabase.from("personas").insert([supaData]);
          if (data?.[0]?.id) memberData.supabase_id = data[0].id;
          const newMember = await base44.entities.Member.create(memberData);
          memberId = newMember?.id;
        }
        payload.member_id = memberId;
        const result = await base44.entities.Leader.create(payload);
        if (!result || !result.id) {
          setError("No se pudo crear el líder.");
          setSaving(false);
          return;
        }
      }

      setSaving(false);
      onSaved();
      onClose();
    } catch (err) {
      console.error("Error saving leader:", err);
      const msg = err?.response?.data?.detail || err?.message || JSON.stringify(err);
      setError("Error al guardar: " + msg);
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing?.id ? "Editar Líder" : "Agregar Líder"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1 block">Nombre completo *</Label>
            <Input value={form.full_name} onChange={set("full_name")} className="h-9 text-sm" placeholder="Ej: Juan Pérez" />
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1 block">Nombre de la célula</Label>
            <Input value={form.cell_name} onChange={set("cell_name")} className="h-9 text-sm" placeholder="Ej: Célula Esperanza" />
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1 block">Teléfono</Label>
            <Input value={form.phone} onChange={set("phone")} className="h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1 block">Correo</Label>
            <Input type="email" value={form.email} onChange={set("email")} className="h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1 block">Día de reunión</Label>
            <Select value={form.meeting_day} onValueChange={setVal("meeting_day")}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Seleccionar día" /></SelectTrigger>
              <SelectContent>
                {DAYS.map(d => <SelectItem key={d.en} value={d.en}>{d.es}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1 block">Hora de reunión</Label>
            <Input type="time" value={form.meeting_time} onChange={set("meeting_time")} className="h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1 block">Distrito / Zona</Label>
            <Input value={form.district} onChange={set("district")} className="h-9 text-sm" placeholder="Ej: Zona Norte" />
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1 block">Vincular a Miembro</Label>
            <Select value={form.member_id || ""} onValueChange={v => setForm(f => ({ ...f, member_id: v === "_none" ? "" : v }))}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Sin vincular" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Sin vincular</SelectItem>
                {members.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-2">
          <Label className="text-xs font-medium text-slate-600 mb-1 block">Lugar de reunión</Label>
          <div className="flex gap-2">
            <Input
              value={form.meeting_location}
              onChange={set("meeting_location")}
              className="h-9 text-sm flex-1"
              placeholder="Dirección o nombre del lugar..."
            />
            <Button
              type="button"
              variant="outline"
              className="h-9 px-3 flex-shrink-0"
              onClick={geocodeLocation}
              disabled={geocoding || !form.meeting_location}
              title="Buscar coordenadas"
            >
              {geocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4 text-rose-500" />}
            </Button>
          </div>
          {form.latitude && form.longitude ? (
            <p className="text-xs text-emerald-600 mt-1">
              📍 Coordenadas: {Number(form.latitude).toFixed(4)}, {Number(form.longitude).toFixed(4)}
            </p>
          ) : (
            <p className="text-xs text-slate-400 mt-1">Toca el pin 📍 para obtener coordenadas y aparecer en el mapa</p>
          )}
        </div>

        <div className="mt-2">
          <Label className="text-xs font-medium text-slate-600 mb-1 block">Notas</Label>
          <Textarea value={form.notes} onChange={set("notes")} rows={2} className="text-sm" />
        </div>

        {error && <p className="text-sm text-red-600 font-medium text-center -mb-2">{error}</p>}

        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-[#d4a843] hover:bg-[#c49a3a] text-[#1e293b] font-semibold"
          >
            {saving ? "Guardando..." : editing?.id ? "Guardar Cambios" : "Agregar Líder"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}