"use client";
import React, { useEffect, useState } from "react";
import { base44 } from "@crm/api/base44Client";
import { Card } from "@crm/components/ui/card";
import { Badge } from "@crm/components/ui/badge";
import { Button } from "@crm/components/ui/button";
import { Input } from "@crm/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@crm/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@crm/components/ui/dialog";
import { Label } from "@crm/components/ui/label";
import { Textarea } from "@crm/components/ui/textarea";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import { HandHeart, Search, Edit, Trash2, CheckCircle2, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";

const CATEGORY_COLORS = {
  Health: "bg-rose-100 text-rose-700",
  Family: "bg-blue-100 text-blue-700",
  Financial: "bg-amber-100 text-amber-700",
  Spiritual: "bg-purple-100 text-purple-700",
  Work: "bg-cyan-100 text-cyan-700",
  Relationships: "bg-pink-100 text-pink-700",
  Other: "bg-slate-100 text-slate-600",
};

const CATEGORY_LABELS = {
  Health: "Salud",
  Family: "Familia",
  Financial: "Finanzas",
  Spiritual: "Espiritual",
  Work: "Trabajo",
  Relationships: "Relaciones",
  Other: "Otro",
};

const STATUS_LABELS = {
  Active: "Activa",
  Answered: "Respondida",
  Closed: "Cerrada",
};

const CATEGORIES = ["Health", "Family", "Financial", "Spiritual", "Work", "Relationships", "Other"];

const EMPTY_FORM = {
  member_name: "", request: "", category: "Other",
  date_submitted: "", assigned_prayer_leader: "", status: "Active"
};

const F = ({ label, name, type = "text", options, optionLabels, textarea, form, setForm }) => (
  <div>
    <Label className="text-xs font-medium text-slate-600 mb-1 block">{label}</Label>
    {textarea ? (
      <Textarea value={form[name] || ""} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))} className="text-sm" rows={3} />
    ) : options ? (
      <Select value={form[name] || ""} onValueChange={v => setForm(f => ({ ...f, [name]: v }))}>
        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>{options.map((o, i) => <SelectItem key={o} value={o}>{optionLabels ? optionLabels[i] : o}</SelectItem>)}</SelectContent>
      </Select>
    ) : (
      <Input type={type} value={form[name] || ""} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))} className="h-9 text-sm" />
    )}
  </div>
);

export default function PrayerRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const data = await base44.entities.PrayerRequest.list("-created_date", 200);
    setRequests(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (r) => { setEditing(r); setForm({ ...EMPTY_FORM, ...r }); setModalOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    if (editing) await base44.entities.PrayerRequest.update(editing.id, form);
    else await base44.entities.PrayerRequest.create(form);
    await load(); setModalOpen(false); setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta petición de oración?")) return;
    await base44.entities.PrayerRequest.delete(id);
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  const toggleStatus = async (r) => {
    const newStatus = r.status === "Active" ? "Answered" : "Active";
    await base44.entities.PrayerRequest.update(r.id, { status: newStatus });
    setRequests(prev => prev.map(x => x.id === r.id ? { ...x, status: newStatus } : x));
  };

  const filtered = requests.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.member_name?.toLowerCase().includes(q) || r.request?.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    const matchCat = filterCategory === "all" || r.category === filterCategory;
    return matchSearch && matchStatus && matchCat;
  });

  const active = requests.filter(r => r.status === "Active").length;
  const answered = requests.filter(r => r.status === "Answered").length;

  return (
    <div>
      <PageHeader title="Peticiones de Oración" subtitle="Ora por tu familia de la iglesia" onAdd={openAdd} addLabel="Agregar Petición" />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 border-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-rose-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Activas</p>
              <p className="text-xl font-bold text-slate-900">{active}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Respondidas</p>
              <p className="text-xl font-bold text-slate-900">{answered}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-0 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
              <HandHeart className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total</p>
              <p className="text-xl font-bold text-slate-900">{requests.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar peticiones..." className="pl-9 h-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-36 h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="Active">Activas</SelectItem>
            <SelectItem value="Answered">Respondidas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-44 h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <EmptyState icon={HandHeart} title="Sin Peticiones de Oración" description="Sé el primero en compartir una necesidad de oración." onAction={openAdd} actionLabel="Agregar Petición" />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <Card key={r.id} className={`p-5 border-0 shadow-sm hover:shadow-md transition-shadow ${r.status === "Answered" ? "opacity-70" : ""}`}>
              <div className="flex items-start gap-3">
                <button onClick={() => toggleStatus(r)} className="mt-0.5 flex-shrink-0">
                  {r.status === "Answered"
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    : <Clock className="w-5 h-5 text-slate-400" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {r.member_name && <span className="font-semibold text-slate-900 text-sm">{r.member_name}</span>}
                    <Badge className={`text-xs ${CATEGORY_COLORS[r.category] || "bg-slate-100 text-slate-600"}`}>{CATEGORY_LABELS[r.category] || r.category}</Badge>
                    <Badge className={`text-xs ${r.status === "Active" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>{STATUS_LABELS[r.status] || r.status}</Badge>
                    {r.date_submitted && <span className="text-xs text-slate-400">{format(parseISO(r.date_submitted), "d MMM yyyy")}</span>}
                  </div>
                  <p className={`text-sm text-slate-700 ${r.status === "Answered" ? "line-through text-slate-400" : ""}`}>{r.request}</p>
                  {r.assigned_prayer_leader && <p className="text-xs text-slate-400 mt-1">Líder de oración: {r.assigned_prayer_leader}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(r)} className="h-8 w-8 p-0"><Edit className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Editar Petición de Oración" : "Agregar Petición de Oración"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <F label="Nombre del Miembro" name="member_name" form={form} setForm={setForm} />
            <F label="Categoría" name="category"
              options={CATEGORIES}
              optionLabels={CATEGORIES.map(c => CATEGORY_LABELS[c])} form={form} setForm={setForm} />
            <F label="Fecha de Envío" name="date_submitted" type="date" form={form} setForm={setForm} />
            <F label="Líder de Oración Asignado" name="assigned_prayer_leader" form={form} setForm={setForm} />
            <F label="Estado" name="status"
              options={["Active", "Answered", "Closed"]}
              optionLabels={["Activa", "Respondida", "Cerrada"]} form={form} setForm={setForm} />
          </div>
          <F label="Petición de Oración *" name="request" textarea form={form} setForm={setForm} />
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.request}
              className="flex-1 bg-[#d4a843] hover:bg-[#c49a3a] text-[#1e293b] font-semibold">
              {saving ? "Guardando..." : editing ? "Guardar Cambios" : "Agregar Petición"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}