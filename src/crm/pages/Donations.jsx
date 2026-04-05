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
import StatCard from "../components/shared/StatCard";
import { DollarSign, TrendingUp, Search, Edit, Trash2 } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

const TYPE_COLORS = {
  Tithe: "bg-indigo-100 text-indigo-700",
  Offering: "bg-emerald-100 text-emerald-700",
  Missions: "bg-blue-100 text-blue-700",
  "Special Project": "bg-amber-100 text-amber-700",
};

const TYPE_LABELS = {
  Tithe: "Diezmo",
  Offering: "Ofrenda",
  Missions: "Misiones",
  "Special Project": "Proyecto Especial",
};

const PAYMENT_LABELS = {
  Cash: "Efectivo",
  "Bank Transfer": "Transferencia",
  Online: "En línea",
  Check: "Cheque",
  Other: "Otro",
};

const DONATION_TYPES = ["Tithe", "Offering", "Missions", "Special Project"];
const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Online", "Check", "Other"];

const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const EMPTY_FORM = {
  member_name: "", donation_type: "Tithe", amount: "",
  date: "", payment_method: "Cash", notes: ""
};

const F = ({ label, name, type = "text", options, optionLabels, textarea, form, setForm }) => (
  <div>
    <Label className="text-xs font-medium text-slate-600 mb-1 block">{label}</Label>
    {textarea ? (
      <Textarea value={form[name] || ""} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))} className="text-sm" rows={2} />
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

export default function Donations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const data = await base44.entities.Donation.list("-date", 500);
    setDonations(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (d) => { setEditing(d); setForm({ ...EMPTY_FORM, ...d, amount: String(d.amount || "") }); setModalOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form, amount: parseFloat(form.amount) || 0 };
    if (editing) await base44.entities.Donation.update(editing.id, payload);
    else await base44.entities.Donation.create(payload);
    await load(); setModalOpen(false); setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este registro de donación?")) return;
    await base44.entities.Donation.delete(id);
    setDonations(prev => prev.filter(d => d.id !== id));
  };

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const inThisMonth = (d) => d.date && isWithinInterval(parseISO(d.date), { start: monthStart, end: monthEnd });

  const totalMonth = donations.filter(inThisMonth).reduce((s, d) => s + (d.amount || 0), 0);
  const tithesMonth = donations.filter(d => inThisMonth(d) && d.donation_type === "Tithe").reduce((s, d) => s + (d.amount || 0), 0);
  const offeringsMonth = donations.filter(d => inThisMonth(d) && d.donation_type === "Offering").reduce((s, d) => s + (d.amount || 0), 0);
  const totalAll = donations.reduce((s, d) => s + (d.amount || 0), 0);

  const giverMap = {};
  donations.forEach(d => {
    if (d.member_name) giverMap[d.member_name] = (giverMap[d.member_name] || 0) + (d.amount || 0);
  });
  const topGivers = Object.entries(giverMap).sort(([, a], [, b]) => b - a).slice(0, 5);

  const monthlyData = MONTHS_ES.map((month, idx) => {
    const total = donations
      .filter(d => d.date && new Date(d.date).getMonth() === idx && new Date(d.date).getFullYear() === now.getFullYear())
      .reduce((s, d) => s + (d.amount || 0), 0);
    return { month, amount: total };
  });

  const filtered = donations.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = !q || d.member_name?.toLowerCase().includes(q);
    const matchType = filterType === "all" || d.donation_type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div>
      <PageHeader title="Donaciones y Diezmos" subtitle="Registra todas las contribuciones financieras" onAdd={openAdd} addLabel="Registrar Donación" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Este Mes" value={`$${totalMonth.toLocaleString()}`} icon={DollarSign} color="amber" />
        <StatCard title="Diezmos Este Mes" value={`$${tithesMonth.toLocaleString()}`} icon={TrendingUp} color="indigo" />
        <StatCard title="Ofrendas Este Mes" value={`$${offeringsMonth.toLocaleString()}`} icon={TrendingUp} color="green" />
        <StatCard title="Total General" value={`$${totalAll.toLocaleString()}`} icon={DollarSign} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 border-0 shadow-sm col-span-1 lg:col-span-2">
          <h3 className="font-semibold text-slate-800 mb-4">Ofrendas Mensuales — {now.getFullYear()}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }} formatter={v => [`$${v}`, "Monto"]} />
              <Bar dataKey="amount" fill="#d4a843" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 border-0 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Mayores Donantes</h3>
          {topGivers.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Sin datos aún</p>
          ) : (
            <div className="space-y-3">
              {topGivers.map(([name, total], i) => (
                <div key={name} className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-400 w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{name}</p>
                  </div>
                  <span className="text-sm font-semibold text-amber-600">${total.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar por miembro..." className="pl-9 h-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48 h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {DONATION_TYPES.map(t => <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <EmptyState icon={DollarSign} title="Sin Donaciones" description="Comienza a registrar diezmos y ofrendas." onAction={openAdd} actionLabel="Registrar Donación" />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(d => (
            <Card key={d.id} className="p-4 border-0 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">{d.member_name || "Anónimo"}</p>
                    <Badge className={`text-xs ${TYPE_COLORS[d.donation_type] || "bg-slate-100 text-slate-600"}`}>{TYPE_LABELS[d.donation_type] || d.donation_type}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {PAYMENT_LABELS[d.payment_method] || d.payment_method} {d.date ? `· ${format(parseISO(d.date), "d MMM yyyy")}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg text-slate-900">${(d.amount || 0).toLocaleString()}</span>
                <Button variant="ghost" size="sm" onClick={() => openEdit(d)} className="h-8 w-8 p-0"><Edit className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id)} className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Editar Donación" : "Registrar Donación"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <F label="Nombre del Miembro" name="member_name" form={form} setForm={setForm} />
            <F label="Tipo de Donación" name="donation_type"
              options={DONATION_TYPES}
              optionLabels={DONATION_TYPES.map(t => TYPE_LABELS[t])} form={form} setForm={setForm} />
            <F label="Monto *" name="amount" type="number" form={form} setForm={setForm} />
            <F label="Fecha" name="date" type="date" form={form} setForm={setForm} />
            <F label="Método de Pago" name="payment_method"
              options={PAYMENT_METHODS}
              optionLabels={PAYMENT_METHODS.map(p => PAYMENT_LABELS[p])} form={form} setForm={setForm} />
          </div>
          <F label="Notas" name="notes" textarea form={form} setForm={setForm} />
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.amount}
              className="flex-1 bg-[#d4a843] hover:bg-[#c49a3a] text-[#1e293b] font-semibold">
              {saving ? "Guardando..." : editing ? "Guardar Cambios" : "Registrar Donación"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}