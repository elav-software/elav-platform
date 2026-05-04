"use client";
import React, { useEffect, useState } from "react";
import { api, getMyChurchId } from "@crm/api/apiClient";
import { supabase } from "@crm/api/supabaseClient";
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
import { DollarSign, TrendingUp, TrendingDown, Search, Edit, Trash2, Users, Wallet } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

// ── INGRESOS ──────────────────────────────────────────────────
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

// ── EGRESOS ───────────────────────────────────────────────────
const GASTO_CATEGORIAS = ["Servicios", "Alquiler", "Equipamiento", "Mantenimiento", "Misiones", "Personal", "Eventos", "Otro"];
const GASTO_CATEGORIA_COLORS = {
  Servicios:     "bg-blue-100 text-blue-700",
  Alquiler:      "bg-violet-100 text-violet-700",
  Equipamiento:  "bg-orange-100 text-orange-700",
  Mantenimiento: "bg-yellow-100 text-yellow-700",
  Misiones:      "bg-cyan-100 text-cyan-700",
  Personal:      "bg-pink-100 text-pink-700",
  Eventos:       "bg-purple-100 text-purple-700",
  Otro:          "bg-slate-100 text-slate-600",
};
const METODOS_PAGO = ["Efectivo", "Transferencia", "Cheque", "Tarjeta", "Otro"];

const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const EMPTY_DONATION = {
  member_name: "", donation_type: "Tithe", amount: "",
  date: "", payment_method: "Cash", notes: "",
};
const EMPTY_GASTO = {
  descripcion: "", categoria: "Servicios", monto: "",
  fecha: new Date().toISOString().slice(0, 10),
  metodo_pago: "Efectivo", proveedor: "", notas: "",
};

const F = ({ label, name, type = "text", options, optionLabels, textarea, form, setForm }) => (
  <div>
    <Label className="text-xs font-medium text-slate-600 mb-1 block">{label}</Label>
    {textarea ? (
      <Textarea value={form[name] || ""} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))} className="text-sm" rows={2} />
    ) : options ? (
      <Select value={form[name] || ""} onValueChange={v => setForm(f => ({ ...f, [name]: v }))}>
        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o, i) => <SelectItem key={o} value={o}>{optionLabels ? optionLabels[i] : o}</SelectItem>)}
        </SelectContent>
      </Select>
    ) : (
      <Input type={type} value={form[name] || ""} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))} className="h-9 text-sm" />
    )}
  </div>
);

export default function Donations() {
  const [tab, setTab] = useState("ingresos");

  // ── Ingresos state ──
  const [donations, setDonations] = useState([]);
  const [cellSubs, setCellSubs] = useState([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_DONATION);
  const [saving, setSaving] = useState(false);

  // ── Egresos state ──
  const [gastos, setGastos] = useState([]);
  const [gastoSearch, setGastoSearch] = useState("");
  const [gastoFilterCat, setGastoFilterCat] = useState("all");
  const [gastoModalOpen, setGastoModalOpen] = useState(false);
  const [editingGasto, setEditingGasto] = useState(null);
  const [gastoForm, setGastoForm] = useState(EMPTY_GASTO);
  const [gastoSaving, setGastoSaving] = useState(false);

  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [donationData, gastoData] = await Promise.all([
      api.entities.Donation.list("-date", 500),
      api.entities.Gasto.list("-fecha", 500),
    ]);
    setDonations(donationData);
    setGastos(gastoData);
    const churchId = await getMyChurchId();
    if (churchId) {
      const { data: subs } = await supabase
        .from("leader_cell_submissions")
        .select("id, report_date, offering_amount, personas!leader_id(nombre, apellido, grupo_celula)")
        .eq("church_id", churchId)
        .gt("offering_amount", 0)
        .order("report_date", { ascending: false });
      setCellSubs(subs || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // ── Ingresos handlers ──
  const openAdd = () => { setEditing(null); setForm(EMPTY_DONATION); setModalOpen(true); };
  const openEdit = (d) => { setEditing(d); setForm({ ...EMPTY_DONATION, ...d, amount: String(d.amount || "") }); setModalOpen(true); };
  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form, amount: parseFloat(form.amount) || 0 };
    if (editing) await api.entities.Donation.update(editing.id, payload);
    else await api.entities.Donation.create(payload);
    await load(); setModalOpen(false); setSaving(false);
  };
  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este registro?")) return;
    await api.entities.Donation.delete(id);
    setDonations(prev => prev.filter(d => d.id !== id));
  };

  // ── Egresos handlers ──
  const openAddGasto = () => { setEditingGasto(null); setGastoForm(EMPTY_GASTO); setGastoModalOpen(true); };
  const openEditGasto = (g) => { setEditingGasto(g); setGastoForm({ ...EMPTY_GASTO, ...g, monto: String(g.monto || "") }); setGastoModalOpen(true); };
  const handleSaveGasto = async () => {
    setGastoSaving(true);
    const payload = { ...gastoForm, monto: parseFloat(gastoForm.monto) || 0 };
    if (editingGasto) await api.entities.Gasto.update(editingGasto.id, payload);
    else await api.entities.Gasto.create(payload);
    await load(); setGastoModalOpen(false); setGastoSaving(false);
  };
  const handleDeleteGasto = async (id) => {
    if (!confirm("¿Eliminar este egreso?")) return;
    await api.entities.Gasto.delete(id);
    setGastos(prev => prev.filter(g => g.id !== id));
  };

  // ── Cálculos ──
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const inMonth = (item, field) =>
    item[field] && isWithinInterval(parseISO(item[field]), { start: monthStart, end: monthEnd });

  const totalIngresosMonth =
    donations.filter(d => inMonth(d, "date")).reduce((s, d) => s + (d.amount || 0), 0) +
    cellSubs.filter(s => inMonth(s, "report_date")).reduce((s, r) => s + (r.offering_amount || 0), 0);
  const tithesMonth = donations.filter(d => inMonth(d, "date") && d.donation_type === "Tithe").reduce((s, d) => s + (d.amount || 0), 0);
  const offeringsMonth =
    donations.filter(d => inMonth(d, "date") && d.donation_type === "Offering").reduce((s, d) => s + (d.amount || 0), 0) +
    cellSubs.filter(s => inMonth(s, "report_date")).reduce((s, r) => s + (r.offering_amount || 0), 0);
  const totalIngresosAll =
    donations.reduce((s, d) => s + (d.amount || 0), 0) +
    cellSubs.reduce((s, r) => s + (r.offering_amount || 0), 0);

  const totalEgresosMonth = gastos.filter(g => inMonth(g, "fecha")).reduce((s, g) => s + (g.monto || 0), 0);
  const totalEgresosAll = gastos.reduce((s, g) => s + (g.monto || 0), 0);
  const balanceMes = totalIngresosMonth - totalEgresosMonth;

  const monthlyData = MONTHS_ES.map((month, idx) => {
    const year = now.getFullYear();
    const ingresos =
      donations.filter(d => d.date && new Date(d.date).getFullYear() === year && new Date(d.date).getMonth() === idx)
        .reduce((s, d) => s + (d.amount || 0), 0) +
      cellSubs.filter(s => s.report_date && new Date(s.report_date).getFullYear() === year && new Date(s.report_date).getMonth() === idx)
        .reduce((s, r) => s + (r.offering_amount || 0), 0);
    const egresos = gastos
      .filter(g => g.fecha && new Date(g.fecha).getFullYear() === year && new Date(g.fecha).getMonth() === idx)
      .reduce((s, g) => s + (g.monto || 0), 0);
    return { month, ingresos, egresos };
  });

  const filteredDonations = donations.filter(d => {
    const q = search.toLowerCase();
    return (!q || d.member_name?.toLowerCase().includes(q)) &&
           (filterType === "all" || d.donation_type === filterType);
  });
  const filteredGastos = gastos.filter(g => {
    const q = gastoSearch.toLowerCase();
    return (!q || g.descripcion?.toLowerCase().includes(q) || g.proveedor?.toLowerCase().includes(q)) &&
           (gastoFilterCat === "all" || g.categoria === gastoFilterCat);
  });

  const giverMap = {};
  donations.forEach(d => { if (d.member_name) giverMap[d.member_name] = (giverMap[d.member_name] || 0) + (d.amount || 0); });
  const topGivers = Object.entries(giverMap).sort(([, a], [, b]) => b - a).slice(0, 5);

  const addLabel = tab === "ingresos" ? "Registrar ingreso" : tab === "egresos" ? "Agregar egreso" : undefined;
  const onAdd = tab === "ingresos" ? openAdd : tab === "egresos" ? openAddGasto : undefined;

  return (
    <div>
      <PageHeader title="Finanzas" subtitle="Libro contable de la iglesia" onAdd={onAdd} addLabel={addLabel} />

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit mb-6">
        {[
          { id: "ingresos", label: "Ingresos" },
          { id: "egresos", label: "Egresos" },
          { id: "balance", label: "Balance" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── TAB INGRESOS ─────────────────────────────────────── */}
      {tab === "ingresos" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard title="Total Este Mes"    value={`$${totalIngresosMonth.toLocaleString()}`} icon={DollarSign}  color="amber" />
            <StatCard title="Diezmos Este Mes"  value={`$${tithesMonth.toLocaleString()}`}        icon={TrendingUp}  color="indigo" />
            <StatCard title="Ofrendas Este Mes" value={`$${offeringsMonth.toLocaleString()}`}     icon={TrendingUp}  color="green" />
            <StatCard title="Total General"     value={`$${totalIngresosAll.toLocaleString()}`}   icon={DollarSign}  color="purple" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 border-0 shadow-sm col-span-1 lg:col-span-2">
              <h3 className="font-semibold text-slate-800 mb-4">Ingresos Mensuales — {now.getFullYear()}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
                    formatter={v => [`$${v.toLocaleString()}`, "Ingresos"]} />
                  <Bar dataKey="ingresos" fill="#d4a843" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-6 border-0 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">Mayores Donantes</h3>
              {topGivers.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">Sin datos aún</p>
              ) : topGivers.map(([name, total], i) => (
                <div key={name} className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-bold text-slate-400 w-5">{i + 1}</span>
                  <p className="text-sm font-medium text-slate-800 flex-1 truncate">{name}</p>
                  <span className="text-sm font-semibold text-amber-600">${total.toLocaleString()}</span>
                </div>
              ))}
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
          ) : filteredDonations.length === 0 && cellSubs.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <EmptyState icon={DollarSign} title="Sin ingresos registrados" description="Comenzá a registrar los ingresos." />
            </Card>
          ) : (
            <div className="space-y-3">
              {cellSubs.map(s => {
                const lider = s.personas;
                const nombre = lider ? `${lider.nombre} ${lider.apellido}` : "Líder";
                const celula = lider?.grupo_celula ? ` · ${lider.grupo_celula}` : "";
                return (
                  <Card key={`cell-${s.id}`} className="p-4 border-0 shadow-sm flex items-center justify-between bg-emerald-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">{nombre}</p>
                          <Badge className="text-xs bg-emerald-100 text-emerald-700">Ofrenda Célula{celula}</Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {s.report_date ? format(parseISO(s.report_date), "d MMM yyyy") : ""}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-lg text-slate-900">${(s.offering_amount || 0).toLocaleString()}</span>
                  </Card>
                );
              })}
              {filteredDonations.map(d => (
                <Card key={d.id} className="p-4 border-0 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{d.member_name || "Anónimo"}</p>
                        <Badge className={`text-xs ${TYPE_COLORS[d.donation_type] || "bg-slate-100 text-slate-600"}`}>
                          {TYPE_LABELS[d.donation_type] || d.donation_type}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {PAYMENT_LABELS[d.payment_method] || d.payment_method}
                        {d.date ? ` · ${format(parseISO(d.date), "d MMM yyyy")}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-slate-900">${(d.amount || 0).toLocaleString()}</span>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(d)} className="h-8 w-8 p-0">
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id)} className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── TAB EGRESOS ──────────────────────────────────────── */}
      {tab === "egresos" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <StatCard title="Egresos Este Mes" value={`$${totalEgresosMonth.toLocaleString()}`}    icon={TrendingDown} color="rose" />
            <StatCard title="Total Acumulado"   value={`$${totalEgresosAll.toLocaleString()}`}     icon={TrendingDown} color="rose" />
            <StatCard title={balanceMes >= 0 ? "Superávit del Mes" : "Déficit del Mes"}
              value={`$${Math.abs(balanceMes).toLocaleString()}`}
              icon={Wallet}
              color={balanceMes >= 0 ? "green" : "rose"} />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Buscar por descripción o proveedor..." className="pl-9 h-10"
                value={gastoSearch} onChange={e => setGastoSearch(e.target.value)} />
            </div>
            <Select value={gastoFilterCat} onValueChange={setGastoFilterCat}>
              <SelectTrigger className="w-full sm:w-52 h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {GASTO_CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}</div>
          ) : filteredGastos.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <EmptyState icon={TrendingDown} title="Sin egresos registrados"
                description="Registrá los gastos de la iglesia."
                onAction={openAddGasto} actionLabel="Agregar egreso" />
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredGastos.map(g => (
                <Card key={g.id} className="p-4 border-0 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
                      <TrendingDown className="w-4 h-4 text-rose-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{g.descripcion}</p>
                        <Badge className={`text-xs ${GASTO_CATEGORIA_COLORS[g.categoria] || "bg-slate-100 text-slate-600"}`}>
                          {g.categoria}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {g.metodo_pago}
                        {g.proveedor ? ` · ${g.proveedor}` : ""}
                        {g.fecha ? ` · ${format(parseISO(g.fecha), "d MMM yyyy")}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-rose-600">-${(g.monto || 0).toLocaleString()}</span>
                    <Button variant="ghost" size="sm" onClick={() => openEditGasto(g)} className="h-8 w-8 p-0">
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteGasto(g.id)} className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── TAB BALANCE ──────────────────────────────────────── */}
      {tab === "balance" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard title="Ingresos del Mes"  value={`$${totalIngresosMonth.toLocaleString()}`}         icon={TrendingUp}   color="green" />
            <StatCard title="Egresos del Mes"   value={`$${totalEgresosMonth.toLocaleString()}`}          icon={TrendingDown} color="rose" />
            <StatCard title={balanceMes >= 0 ? "Superávit" : "Déficit"}
              value={`$${Math.abs(balanceMes).toLocaleString()}`}
              icon={Wallet}
              color={balanceMes >= 0 ? "green" : "rose"} />
            <StatCard title="Balance Acumulado" value={`$${(totalIngresosAll - totalEgresosAll).toLocaleString()}`} icon={DollarSign} color="amber" />
          </div>

          <Card className="p-6 border-0 shadow-sm mb-6">
            <h3 className="font-semibold text-slate-800 mb-4">Ingresos vs Egresos — {now.getFullYear()}</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} barSize={16} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
                  formatter={(v, name) => [`$${v.toLocaleString()}`, name === "ingresos" ? "Ingresos" : "Egresos"]} />
                <Legend formatter={v => v === "ingresos" ? "Ingresos" : "Egresos"} />
                <Bar dataKey="ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="egresos"  fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">Detalle mensual — {now.getFullYear()}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 px-1 text-slate-500 font-medium">Mes</th>
                    <th className="text-right py-2 px-1 text-slate-500 font-medium">Ingresos</th>
                    <th className="text-right py-2 px-1 text-slate-500 font-medium">Egresos</th>
                    <th className="text-right py-2 px-1 text-slate-500 font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map(({ month, ingresos, egresos }) => {
                    const bal = ingresos - egresos;
                    return (
                      <tr key={month} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-1 font-medium text-slate-700">{month}</td>
                        <td className="py-2.5 px-1 text-right text-emerald-600">${ingresos.toLocaleString()}</td>
                        <td className="py-2.5 px-1 text-right text-rose-500">
                          {egresos > 0 ? `-$${egresos.toLocaleString()}` : "—"}
                        </td>
                        <td className={`py-2.5 px-1 text-right font-semibold ${bal >= 0 ? "text-slate-900" : "text-rose-600"}`}>
                          {bal < 0 ? "-" : ""}${Math.abs(bal).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ─── MODAL INGRESO ────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Editar ingreso" : "Registrar ingreso"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <F label="Nombre del Miembro" name="member_name" form={form} setForm={setForm} />
            <F label="Tipo" name="donation_type"
              options={DONATION_TYPES} optionLabels={DONATION_TYPES.map(t => TYPE_LABELS[t])}
              form={form} setForm={setForm} />
            <F label="Monto *" name="amount" type="number" form={form} setForm={setForm} />
            <F label="Fecha"   name="date"   type="date"   form={form} setForm={setForm} />
            <F label="Método de Pago" name="payment_method"
              options={PAYMENT_METHODS} optionLabels={PAYMENT_METHODS.map(p => PAYMENT_LABELS[p])}
              form={form} setForm={setForm} />
          </div>
          <F label="Notas" name="notes" textarea form={form} setForm={setForm} />
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.amount}
              className="flex-1 bg-[#d4a843] hover:bg-[#c49a3a] text-[#1e293b] font-semibold">
              {saving ? "Guardando..." : editing ? "Guardar cambios" : "Registrar ingreso"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL EGRESO ─────────────────────────────────────── */}
      <Dialog open={gastoModalOpen} onOpenChange={setGastoModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingGasto ? "Editar egreso" : "Agregar egreso"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div className="sm:col-span-2">
              <F label="Descripción *" name="descripcion" form={gastoForm} setForm={setGastoForm} />
            </div>
            <F label="Categoría" name="categoria"
              options={GASTO_CATEGORIAS}
              form={gastoForm} setForm={setGastoForm} />
            <F label="Monto *" name="monto" type="number" form={gastoForm} setForm={setGastoForm} />
            <F label="Fecha"   name="fecha" type="date"   form={gastoForm} setForm={setGastoForm} />
            <F label="Método de Pago" name="metodo_pago"
              options={METODOS_PAGO}
              form={gastoForm} setForm={setGastoForm} />
            <div className="sm:col-span-2">
              <F label="Proveedor / Destinatario" name="proveedor" form={gastoForm} setForm={setGastoForm} />
            </div>
          </div>
          <F label="Notas" name="notas" textarea form={gastoForm} setForm={setGastoForm} />
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setGastoModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleSaveGasto} disabled={gastoSaving || !gastoForm.monto || !gastoForm.descripcion}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold">
              {gastoSaving ? "Guardando..." : editingGasto ? "Guardar cambios" : "Agregar egreso"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
