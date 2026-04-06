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
import { ClipboardList, Star, Edit, Trash2, Search } from "lucide-react";
import { format, parseISO } from "date-fns";

const SURVEY_TYPES_EN = [
  "Visitor Experience Survey",
  "Member Satisfaction Survey",
  "Event Feedback",
  "Sermon Feedback",
  "Ministry Feedback",
  "Other",
];

const SURVEY_TYPES_ES = [
  "Encuesta de Experiencia del Visitante",
  "Encuesta de Satisfacción del Miembro",
  "Comentarios del Evento",
  "Comentarios del Sermón",
  "Comentarios del Ministerio",
  "Otro",
];

const EMPTY_FORM = {
  survey_name: "", member_name: "", response: "", rating: "", date: ""
};

const F = ({ label, name, type = "text", options, optionLabels, textarea, form, setForm }) => (
  <div>
    <Label className="text-xs font-medium text-slate-600 mb-1 block">{label}</Label>
    {textarea ? (
      <Textarea value={form[name] || ""} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))} className="text-sm" rows={4} />
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

export default function Surveys() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const data = await api.entities.Survey.list("-created_date", 200);
    setSurveys(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (s) => { setEditing(s); setForm({ ...EMPTY_FORM, ...s, rating: String(s.rating || "") }); setModalOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form, rating: form.rating ? Number(form.rating) : undefined };
    if (editing) await api.entities.Survey.update(editing.id, payload);
    else await api.entities.Survey.create(payload);
    await load(); setModalOpen(false); setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta respuesta de encuesta?")) return;
    await api.entities.Survey.delete(id);
    setSurveys(prev => prev.filter(s => s.id !== id));
  };

  const filtered = surveys.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.survey_name?.toLowerCase().includes(q) || s.member_name?.toLowerCase().includes(q) || s.response?.toLowerCase().includes(q);
    const matchType = filterType === "all" || s.survey_name === filterType;
    return matchSearch && matchType;
  });

  const avgRating = surveys.filter(s => s.rating).reduce((sum, s, _, arr) => {
    if (arr.length === 0) return 0;
    return sum + s.rating / arr.length;
  }, 0);

  const surveyTypeCounts = {};
  surveys.forEach(s => { if (s.survey_name) surveyTypeCounts[s.survey_name] = (surveyTypeCounts[s.survey_name] || 0) + 1; });

  const esLabel = (name) => {
    const idx = SURVEY_TYPES_EN.indexOf(name);
    return idx >= 0 ? SURVEY_TYPES_ES[idx] : name;
  };

  const StarRating = ({ value }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= (value || 0) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}`} />
      ))}
    </div>
  );

  return (
    <div>
      <PageHeader title="Encuestas y Comentarios" subtitle="Recopila opiniones de tu congregación" onAdd={openAdd} addLabel="Registrar Respuesta" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 border-0 shadow-sm">
          <p className="text-xs text-slate-500">Total Respuestas</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{surveys.length}</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <p className="text-xs text-slate-500">Calificación Prom.</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{surveys.filter(s => s.rating).length > 0 ? avgRating.toFixed(1) : "—"}</p>
          {surveys.filter(s => s.rating).length > 0 && <StarRating value={Math.round(avgRating)} />}
        </Card>
        {Object.entries(surveyTypeCounts).slice(0, 2).map(([type, count]) => (
          <Card key={type} className="p-4 border-0 shadow-sm">
            <p className="text-xs text-slate-500 line-clamp-1">{esLabel(type)}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{count}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar respuestas..." className="pl-9 h-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-64 h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos de encuesta</SelectItem>
            {SURVEY_TYPES_EN.map((t, i) => <SelectItem key={t} value={t}>{SURVEY_TYPES_ES[i]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <EmptyState icon={ClipboardList} title="Sin Respuestas de Encuestas" description="Comienza a recopilar comentarios de tu congregación." onAction={openAdd} actionLabel="Registrar Respuesta" />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => (
            <Card key={s.id} className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge className="text-xs bg-indigo-100 text-indigo-700">{esLabel(s.survey_name)}</Badge>
                    {s.member_name && <span className="font-medium text-slate-800 text-sm">{s.member_name}</span>}
                    {s.rating && <StarRating value={s.rating} />}
                    {s.date && <span className="text-xs text-slate-400">{format(parseISO(s.date), "d MMM yyyy")}</span>}
                  </div>
                  {s.response && <p className="text-sm text-slate-600 leading-relaxed">{s.response}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(s)} className="h-8 w-8 p-0"><Edit className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editar Respuesta" : "Registrar Respuesta de Encuesta"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <F label="Tipo de Encuesta *" name="survey_name"
              options={SURVEY_TYPES_EN}
              optionLabels={SURVEY_TYPES_ES} form={form} setForm={setForm} />
            <F label="Nombre del Miembro" name="member_name" form={form} setForm={setForm} />
            <F label="Calificación (1-5)" name="rating" type="number" form={form} setForm={setForm} />
            <F label="Fecha" name="date" type="date" form={form} setForm={setForm} />
          </div>
          <F label="Respuesta / Comentario" name="response" textarea form={form} setForm={setForm} />
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.survey_name}
              className="flex-1 bg-[#d4a843] hover:bg-[#c49a3a] text-[#1e293b] font-semibold">
              {saving ? "Guardando..." : editing ? "Guardar Cambios" : "Registrar Respuesta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}