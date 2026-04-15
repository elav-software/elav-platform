"use client";
import React, { useEffect, useState } from "react";
import { api } from "@crm/api/apiClient";
import { Card } from "@crm/components/ui/card";
import { Button } from "@crm/components/ui/button";
import { Input } from "@crm/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@crm/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@crm/components/ui/dialog";
import { Label } from "@crm/components/ui/label";
import { Textarea } from "@crm/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@crm/components/ui/tabs";
import { Badge } from "@crm/components/ui/badge";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import { Church, Users, MapPin, Calendar, Edit, Trash2, Plus } from "lucide-react";

const EMPTY_MIN = { ministry_name: "", ministry_leader: "", description: "", number_of_volunteers: 0, meeting_day: "", meeting_location: "" };
const EMPTY_VOL = { member_name: "", ministry_name: "", role: "", start_date: "" };

const DAYS_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAYS_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const MF = ({ label, name, type = "text", options, optionLabels, set, val, textarea }) => (
  <div>
    <Label className="text-xs font-medium text-slate-600 mb-1 block">{label}</Label>
    {textarea ? (
      <Textarea value={val[name] || ""} onChange={e => set(f => ({ ...f, [name]: e.target.value }))} className="text-sm" rows={2} />
    ) : options ? (
      <Select value={val[name] || ""} onValueChange={v => set(f => ({ ...f, [name]: v }))}>
        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>{options.map((o, i) => <SelectItem key={o} value={o}>{optionLabels ? optionLabels[i] : o}</SelectItem>)}</SelectContent>
      </Select>
    ) : (
      <Input type={type} value={val[name] || ""} onChange={e => set(f => ({ ...f, [name]: e.target.value }))} className="h-9 text-sm" />
    )}
  </div>
);

export default function Ministries() {
  const [ministries, setMinistries] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minModal, setMinModal] = useState(false);
  const [volModal, setVolModal] = useState(false);
  const [editingMin, setEditingMin] = useState(null);
  const [editingVol, setEditingVol] = useState(null);
  const [minForm, setMinForm] = useState(EMPTY_MIN);
  const [volForm, setVolForm] = useState(EMPTY_VOL);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [m, v] = await Promise.all([
      api.entities.Ministry.list("-created_date", 100),
      api.entities.Volunteer.list("-created_date", 200),
    ]);
    setMinistries(m);
    setVolunteers(v);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openMinAdd = () => { setEditingMin(null); setMinForm(EMPTY_MIN); setMinModal(true); };
  const openMinEdit = (m) => { setEditingMin(m); setMinForm({ ...EMPTY_MIN, ...m }); setMinModal(true); };
  const openVolAdd = () => { setEditingVol(null); setVolForm(EMPTY_VOL); setVolModal(true); };
  const openVolEdit = (v) => { setEditingVol(v); setVolForm({ ...EMPTY_VOL, ...v }); setVolModal(true); };

  const saveMin = async () => {
    setSaving(true);
    const payload = { ...minForm, number_of_volunteers: Number(minForm.number_of_volunteers) || 0 };
    if (editingMin) await api.entities.Ministry.update(editingMin.id, payload);
    else await api.entities.Ministry.create(payload);
    await load(); setMinModal(false); setSaving(false);
  };

  const saveVol = async () => {
    setSaving(true);
    if (editingVol) await api.entities.Volunteer.update(editingVol.id, volForm);
    else await api.entities.Volunteer.create(volForm);
    await load(); setVolModal(false); setSaving(false);
  };

  const deleteMin = async (id) => {
    if (!confirm("¿Eliminar este ministerio?")) return;
    await api.entities.Ministry.delete(id);
    setMinistries(prev => prev.filter(m => m.id !== id));
  };

  const deleteVol = async (id) => {
    if (!confirm("¿Eliminar este voluntario?")) return;
    await api.entities.Volunteer.delete(id);
    setVolunteers(prev => prev.filter(v => v.id !== id));
  };

  const dayLabel = (day) => {
    const idx = DAYS_EN.indexOf(day);
    return idx >= 0 ? DAYS_ES[idx] : day;
  };

  return (
    <div>
      <PageHeader title="Ministerios" subtitle="Gestiona ministerios y voluntarios" onAdd={openMinAdd} addLabel="Agregar Ministerio" />

      <Tabs defaultValue="ministries">
        <TabsList className="mb-6">
          <TabsTrigger value="ministries">Ministerios ({ministries.length})</TabsTrigger>
          <TabsTrigger value="volunteers">Voluntarios ({volunteers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="ministries">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(4).fill(0).map((_, i) => <div key={i} className="h-44 rounded-2xl bg-slate-100 animate-pulse" />)}
            </div>
          ) : ministries.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <EmptyState icon={Church} title="Sin Ministerios" description="Crea tu primer ministerio para comenzar a organizar." onAction={openMinAdd} actionLabel="Agregar Ministerio" />
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ministries.map(m => {
                const volCount = volunteers.filter(v => v.ministry_id === m.id || v.ministry_name === m.ministry_name).length;
                return (
                  <Card key={m.id} className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {m.ministry_name?.charAt(0)}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openMinEdit(m)} className="h-8 w-8 p-0"><Edit className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteMin(m.id)} className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">{m.ministry_name}</h3>
                    {m.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{m.description}</p>}
                    <div className="space-y-1.5">
                      {m.ministry_leader && <div className="flex items-center gap-2 text-xs text-slate-500"><Users className="w-3.5 h-3.5" />Líder: {m.ministry_leader}</div>}
                      {m.meeting_day && <div className="flex items-center gap-2 text-xs text-slate-500"><Calendar className="w-3.5 h-3.5" />{dayLabel(m.meeting_day)}</div>}
                      {m.meeting_location && <div className="flex items-center gap-2 text-xs text-slate-500"><MapPin className="w-3.5 h-3.5" />{m.meeting_location}</div>}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <Badge className="bg-amber-50 text-amber-700 text-xs">{volCount} voluntarios</Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="volunteers">
          <div className="flex justify-end mb-4">
            <Button onClick={openVolAdd} className="bg-[#d4a843] hover:bg-[#c49a3a] text-[#1e293b] font-semibold">
              <Plus className="w-4 h-4 mr-2" /> Agregar Voluntario
            </Button>
          </div>
          {loading ? (
            <div className="space-y-3">{Array(4).fill(0).map((_, i) => <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}</div>
          ) : volunteers.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <EmptyState icon={Users} title="Sin Voluntarios" description="Agrega voluntarios a tus ministerios." onAction={openVolAdd} actionLabel="Agregar Voluntario" />
            </Card>
          ) : (
            <div className="space-y-3">
              {volunteers.map(v => (
                <Card key={v.id} className="p-4 border-0 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{v.member_name}</p>
                    <p className="text-xs text-slate-500">{v.ministry_name} · {v.role || "Voluntario"}{v.start_date ? ` · Desde ${v.start_date}` : ""}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openVolEdit(v)} className="h-8 w-8 p-0"><Edit className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteVol(v.id)} className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Ministry Modal */}
      <Dialog open={minModal} onOpenChange={setMinModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingMin ? "Editar Ministerio" : "Agregar Ministerio"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <MF label="Nombre del Ministerio *" name="ministry_name" set={setMinForm} val={minForm} />
            <MF label="Líder del Ministerio" name="ministry_leader" set={setMinForm} val={minForm} />
            <MF label="Día de Reunión" name="meeting_day" set={setMinForm} val={minForm} options={DAYS_EN} optionLabels={DAYS_ES} />
            <MF label="Lugar de Reunión" name="meeting_location" set={setMinForm} val={minForm} />
          </div>
          <MF label="Descripción" name="description" set={setMinForm} val={minForm} textarea />
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setMinModal(false)} className="flex-1">Cancelar</Button>
            <Button onClick={saveMin} disabled={saving || !minForm.ministry_name}
              className="flex-1 bg-[#d4a843] hover:bg-[#c49a3a] text-[#1e293b] font-semibold">
              {saving ? "Guardando..." : editingMin ? "Guardar Cambios" : "Agregar Ministerio"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Volunteer Modal */}
      <Dialog open={volModal} onOpenChange={setVolModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingVol ? "Editar Voluntario" : "Agregar Voluntario"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <MF label="Nombre del Miembro *" name="member_name" set={setVolForm} val={volForm} />
            <MF label="Ministerio *" name="ministry_name" set={setVolForm} val={volForm}
              options={ministries.map(m => m.ministry_name)} />
            <MF label="Rol" name="role" set={setVolForm} val={volForm} />
            <MF label="Fecha de Inicio" name="start_date" type="date" set={setVolForm} val={volForm} />
          </div>
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setVolModal(false)} className="flex-1">Cancelar</Button>
            <Button onClick={saveVol} disabled={saving || !volForm.member_name}
              className="flex-1 bg-[#d4a843] hover:bg-[#c49a3a] text-[#1e293b] font-semibold">
              {saving ? "Guardando..." : editingVol ? "Guardar Cambios" : "Agregar Voluntario"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}