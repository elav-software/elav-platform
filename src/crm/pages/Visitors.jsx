"use client";
import React, { useEffect, useState } from "react";
import { api } from "@crm/api/apiClient";
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
import { UserPlus, Phone, Mail, Calendar, Edit, Trash2, Search } from "lucide-react";
import { format, parseISO } from "date-fns";

const STATUS_COLORS = {
  Pending: "bg-yellow-100 text-yellow-700",
  Contacted: "bg-blue-100 text-blue-700",
  "Follow-up Scheduled": "bg-purple-100 text-purple-700",
  Completed: "bg-emerald-100 text-emerald-700",
  "No Response": "bg-slate-100 text-slate-600",
};

const STATUS_LABELS = {
  Pending: "Pendiente",
  Contacted: "Contactado",
  "Follow-up Scheduled": "Seguimiento Programado",
  Completed: "Completado",
  "No Response": "Sin Respuesta",
};

const STATUSES = ["Pending", "Contacted", "Follow-up Scheduled", "Completed", "No Response"];

const EMPTY_FORM = {
  name: "", phone: "", whatsapp: "", email: "",
  visit_date: "", invited_by: "", follow_up_status: "Pending", notes: ""
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

export default function Visitors() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const data = await api.entities.Visitor.list("-created_at", 200);
    setVisitors(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // Marcar visitantes como vistos al abrir la página
    localStorage.setItem('crm_visitors_last_seen', new Date().toISOString());
    // Disparar evento para que el Layout actualice el badge
    window.dispatchEvent(new Event('visitors-seen'));
  }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (v) => { setEditing(v); setForm({ ...EMPTY_FORM, ...v }); setModalOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    if (editing) await api.entities.Visitor.update(editing.id, form);
    else await api.entities.Visitor.create(form);
    await load();
    setModalOpen(false);
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este visitante?")) return;
    await api.entities.Visitor.delete(id);
    setVisitors(prev => prev.filter(v => v.id !== id));
  };

  const updateStatus = async (id, status) => {
    await api.entities.Visitor.update(id, { follow_up_status: status });
    setVisitors(prev => prev.map(v => v.id === id ? { ...v, follow_up_status: status } : v));
  };

  const filtered = visitors.filter(v => {
    const q = search.toLowerCase();
    const matchSearch = !q || v.name?.toLowerCase().includes(q) || v.email?.toLowerCase().includes(q) || v.phone?.includes(q);
    const matchStatus = filterStatus === "all" || v.follow_up_status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <PageHeader title="Visitantes" subtitle={`${visitors.length} visitantes en total`} onAdd={openAdd} addLabel="Registrar Visitante" />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar visitantes..." className="pl-9 h-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-56 h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <EmptyState icon={UserPlus} title="No se encontraron visitantes" description="Comienza a registrar los visitantes de la iglesia." onAction={openAdd} actionLabel="Registrar Visitante" />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(v => (
            <Card key={v.id} className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-sky-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {v.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900">{v.name}</h3>
                    <div className="flex flex-wrap gap-3 mt-1">
                      {v.phone && <span className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" />{v.phone}</span>}
                      {v.email && <span className="text-xs text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3" />{v.email}</span>}
                      {v.visit_date && <span className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3" />{format(parseISO(v.visit_date), "d MMM yyyy")}</span>}
                      {v.invited_by && <span className="text-xs text-slate-500">Invitado por: {v.invited_by}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Select value={v.follow_up_status || "Pending"} onValueChange={s => updateStatus(v.id, s)}>
                    <SelectTrigger className="h-8 w-52 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(v)} className="h-8 w-8 p-0">
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(v.id)} className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              {v.notes && <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">{v.notes}</p>}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar Visitante" : "Registrar Nuevo Visitante"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <F label="Nombre *" name="name" form={form} setForm={setForm} />
            <F label="Teléfono" name="phone" form={form} setForm={setForm} />
            <F label="WhatsApp" name="whatsapp" form={form} setForm={setForm} />
            <F label="Correo Electrónico" name="email" type="email" form={form} setForm={setForm} />
            <F label="Fecha de Visita" name="visit_date" type="date" form={form} setForm={setForm} />
            <F label="Invitado Por" name="invited_by" form={form} setForm={setForm} />
            <F label="Estado de Seguimiento" name="follow_up_status"
              options={STATUSES}
              optionLabels={STATUSES.map(s => STATUS_LABELS[s])} form={form} setForm={setForm} />
          </div>
          <F label="Notas" name="notes" textarea form={form} setForm={setForm} />
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.name}
              className="flex-1 bg-[#d4a843] hover:bg-[#c49a3a] text-[#1e293b] font-semibold">
              {saving ? "Guardando..." : editing ? "Guardar Cambios" : "Registrar Visitante"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}