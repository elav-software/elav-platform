"use client";
import React, { useEffect, useState, useMemo } from "react";
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
import StatCard from "../components/shared/StatCard";
import { DollarSign, TrendingUp, TrendingDown, Search, Edit, Trash2, Users, Wallet, Plus, Minus } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

// ── INGRESOS ──────────────────────────────────────────────────
const TYPE_LABELS = {
  Tithe: "Diezmo", Offering: "Ofrenda", Missions: "Misiones", "Special Project": "Proyecto Especial",
};
const PAYMENT_LABELS = {
  Cash: "Efectivo", "Bank Transfer": "Transferencia", Online: "En línea", Check: "Cheque", Other: "Otro",
};
const DONATION_TYPES   = ["Tithe", "Offering", "Missions", "Special Project"];
const PAYMENT_METHODS  = ["Cash", "Bank Transfer", "Online", "Check", "Other"];

// ── EGRESOS ───────────────────────────────────────────────────
const GASTO_CATEGORIAS = ["Servicios", "Alquiler", "Equipamiento", "Mantenimiento", "Misiones", "Personal", "Eventos", "Otro"];
const METODOS_PAGO     = ["Efectivo", "Transferencia", "Cheque", "Tarjeta", "Otro"];

const EMPTY_DONATION = { member_name: "", donation_type: "Tithe", amount: "", date: new Date().toISOString().slice(0,10), payment_method: "Cash", notes: "" };
const EMPTY_GASTO    = { descripcion: "", categoria: "Servicios", monto: "", fecha: new Date().toISOString().slice(0,10), metodo_pago: "Efectivo", proveedor: "", notas: "" };

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

const fmt = (n) => `$${(n || 0).toLocaleString("es-AR")}`;

export default function Donations() {
  const [donations, setDonations] = useState([]);
  const [cellSubs,  setCellSubs]  = useState([]);
  const [gastos,    setGastos]    = useState([]);
  const [loading,   setLoading]   = useState(true);

  // Filtros
  const [search,      setSearch]      = useState("");
  const [filterTipo,  setFilterTipo]  = useState("all");  // all | Ingreso | Egreso
  const [filterCat,   setFilterCat]   = useState("all");
  const [filterMonth, setFilterMonth] = useState("");     // YYYY-MM

  // Modal ingreso
  const [ingresoModal,   setIngresoModal]   = useState(false);
  const [editingIngreso, setEditingIngreso] = useState(null);
  const [ingresoForm,    setIngresoForm]    = useState(EMPTY_DONATION);
  const [ingresoSaving,  setIngresoSaving]  = useState(false);

  // Modal egreso
  const [egresoModal,   setEgresoModal]   = useState(false);
  const [editingEgreso, setEditingEgreso] = useState(null);
  const [egresoForm,    setEgresoForm]    = useState(EMPTY_GASTO);
  const [egresoSaving,  setEgresoSaving]  = useState(false);

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

  // ── Ledger unificado ──────────────────────────────────────
  const ledger = useMemo(() => {
    const entries = [];

    donations.forEach(d => entries.push({
      id: `don-${d.id}`, rawId: d.id, source: "donation",
      tipo: "Ingreso",
      fecha: d.date || d.created_at?.slice(0, 10) || "",
      categoria: TYPE_LABELS[d.donation_type] || d.donation_type || "—",
      descripcion: d.member_name || "Anónimo",
      monto: d.amount || 0,
      metodo: PAYMENT_LABELS[d.payment_method] || d.payment_method || "",
      notas: d.notes || "",
      raw: d,
    }));

    cellSubs.forEach(s => {
      const lider = s.personas;
      const nombre = lider ? `${lider.nombre} ${lider.apellido}` : "Líder";
      const celula = lider?.grupo_celula ? ` · ${lider.grupo_celula}` : "";
      entries.push({
        id: `cell-${s.id}`, rawId: s.id, source: "cell",
        tipo: "Ingreso",
        fecha: s.report_date || "",
        categoria: "Ofrenda Célula",
        descripcion: `${nombre}${celula}`,
        monto: s.offering_amount || 0,
        metodo: "", notas: "", raw: s,
      });
    });

    gastos.forEach(g => entries.push({
      id: `gas-${g.id}`, rawId: g.id, source: "gasto",
      tipo: "Egreso",
      fecha: g.fecha || "",
      categoria: g.categoria || "Otro",
      descripcion: g.descripcion + (g.proveedor ? ` · ${g.proveedor}` : ""),
      monto: g.monto || 0,
      metodo: g.metodo_pago || "",
      notas: g.notas || "",
      raw: g,
    }));

    return entries.sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
  }, [donations, cellSubs, gastos]);

  // ── Filtros aplicados ─────────────────────────────────────
  const filtered = useMemo(() => ledger.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      e.descripcion.toLowerCase().includes(q) ||
      e.categoria.toLowerCase().includes(q) ||
      e.notas.toLowerCase().includes(q);
    const matchTipo  = filterTipo  === "all" || e.tipo === filterTipo;
    const matchCat   = filterCat   === "all" || e.categoria === filterCat;
    const matchMonth = !filterMonth || e.fecha.startsWith(filterMonth);
    return matchSearch && matchTipo && matchCat && matchMonth;
  }), [ledger, search, filterTipo, filterCat, filterMonth]);

  // ── Stats ─────────────────────────────────────────────────
  const now        = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd   = endOfMonth(now);
  const inCurrentMonth = (e) => e.fecha && isWithinInterval(parseISO(e.fecha), { start: monthStart, end: monthEnd });

  const ingresosMonth  = ledger.filter(e => e.tipo === "Ingreso" && inCurrentMonth(e)).reduce((s, e) => s + e.monto, 0);
  const egresosMonth   = ledger.filter(e => e.tipo === "Egreso"  && inCurrentMonth(e)).reduce((s, e) => s + e.monto, 0);
  const ingresosTotal  = ledger.filter(e => e.tipo === "Ingreso").reduce((s, e) => s + e.monto, 0);
  const egresosTotal   = ledger.filter(e => e.tipo === "Egreso") .reduce((s, e) => s + e.monto, 0);
  const balanceMes     = ingresosMonth - egresosMonth;
  const balanceTotal   = ingresosTotal - egresosTotal;

  // Opciones dinámicas de categoría y mes para los filtros
  const allCats     = useMemo(() => [...new Set(ledger.map(e => e.categoria))].sort(), [ledger]);
  const monthOptions = useMemo(() => [...new Set(ledger.map(e => e.fecha?.slice(0, 7)).filter(Boolean))].sort().reverse(), [ledger]);

  // ── Handlers ingreso ──────────────────────────────────────
  const openAddIngreso  = () => { setEditingIngreso(null); setIngresoForm(EMPTY_DONATION); setIngresoModal(true); };
  const openEditIngreso = (raw) => { setEditingIngreso(raw); setIngresoForm({ ...EMPTY_DONATION, ...raw, amount: String(raw.amount || "") }); setIngresoModal(true); };
  const handleSaveIngreso = async () => {
    setIngresoSaving(true);
    const payload = { ...ingresoForm, amount: parseFloat(ingresoForm.amount) || 0 };
    if (editingIngreso) await api.entities.Donation.update(editingIngreso.id, payload);
    else await api.entities.Donation.create(payload);
    await load(); setIngresoModal(false); setIngresoSaving(false);
  };
  const handleDeleteIngreso = async (id) => {
    if (!confirm("¿Eliminar este ingreso?")) return;
    await api.entities.Donation.delete(id);
    setDonations(prev => prev.filter(d => d.id !== id));
  };

  // ── Handlers egreso ───────────────────────────────────────
  const openAddEgreso  = () => { setEditingEgreso(null); setEgresoForm(EMPTY_GASTO); setEgresoModal(true); };
  const openEditEgreso = (raw) => { setEditingEgreso(raw); setEgresoForm({ ...EMPTY_GASTO, ...raw, monto: String(raw.monto || "") }); setEgresoModal(true); };
  const handleSaveEgreso = async () => {
    setEgresoSaving(true);
    const payload = { ...egresoForm, monto: parseFloat(egresoForm.monto) || 0 };
    if (editingEgreso) await api.entities.Gasto.update(editingEgreso.id, payload);
    else await api.entities.Gasto.create(payload);
    await load(); setEgresoModal(false); setEgresoSaving(false);
  };
  const handleDeleteEgreso = async (id) => {
    if (!confirm("¿Eliminar este egreso?")) return;
    await api.entities.Gasto.delete(id);
    setGastos(prev => prev.filter(g => g.id !== id));
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Finanzas</h1>
        <p className="text-sm text-slate-500 mt-1">Libro contable de la iglesia</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Ingresos del Mes"  value={fmt(ingresosMonth)} icon={TrendingUp}   color="green" />
        <StatCard title="Egresos del Mes"   value={fmt(egresosMonth)}  icon={TrendingDown} color="rose"  />
        <StatCard
          title={balanceMes >= 0 ? "Superávit del Mes" : "Déficit del Mes"}
          value={fmt(Math.abs(balanceMes))}
          icon={Wallet}
          color={balanceMes >= 0 ? "green" : "rose"}
        />
        <StatCard
          title={balanceTotal >= 0 ? "Balance Acumulado" : "Déficit Acumulado"}
          value={fmt(Math.abs(balanceTotal))}
          icon={DollarSign}
          color={balanceTotal >= 0 ? "amber" : "rose"}
        />
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3 mb-6">
        <Button onClick={openAddIngreso} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2">
          <Plus className="w-4 h-4" /> Registrar Ingreso
        </Button>
        <Button onClick={openAddEgreso} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-2">
          <Minus className="w-4 h-4" /> Agregar Egreso
        </Button>
      </div>

      {/* Barra de filtros */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar por concepto, categoría..." className="pl-9 h-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-40 h-10"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Ingreso">Ingresos</SelectItem>
            <SelectItem value="Egreso">Egresos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-44 h-10"><SelectValue placeholder="Categoría" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {allCats.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-40 h-10"><SelectValue placeholder="Mes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los meses</SelectItem>
            {monthOptions.map(m => {
              const [y, mo] = m.split("-");
              const label = new Date(Number(y), Number(mo) - 1).toLocaleString("es-AR", { month: "long", year: "numeric" });
              return <SelectItem key={m} value={m}>{label}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Tabla ledger */}
      {loading ? (
        <div className="space-y-2">{Array(6).fill(0).map((_, i) => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-sm p-12 text-center">
          <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Sin movimientos</p>
          <p className="text-slate-400 text-sm mt-1">Registrá el primer ingreso o egreso.</p>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Categoría</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Concepto</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Método</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Monto</th>
                  <th className="py-3 px-4 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {e.fecha ? format(parseISO(e.fecha), "d MMM yyyy") : "—"}
                    </td>
                    <td className="py-3 px-4">
                      {e.tipo === "Ingreso" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                          <TrendingUp className="w-3 h-3" /> Ingreso
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                          <TrendingDown className="w-3 h-3" /> Egreso
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-xs font-normal">{e.categoria}</Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-800 max-w-xs">
                      <p className="truncate">{e.descripcion}</p>
                      {e.notas && <p className="text-xs text-slate-400 truncate mt-0.5">{e.notas}</p>}
                    </td>
                    <td className="py-3 px-4 text-slate-500 hidden md:table-cell whitespace-nowrap">{e.metodo || "—"}</td>
                    <td className={`py-3 px-4 text-right font-bold whitespace-nowrap ${e.tipo === "Ingreso" ? "text-emerald-600" : "text-rose-600"}`}>
                      {e.tipo === "Ingreso" ? "+" : "-"}{fmt(e.monto)}
                    </td>
                    <td className="py-3 px-4">
                      {e.source !== "cell" && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                          <button
                            onClick={() => e.source === "donation" ? openEditIngreso(e.raw) : openEditEgreso(e.raw)}
                            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => e.source === "donation" ? handleDeleteIngreso(e.rawId) : handleDeleteEgreso(e.rawId)}
                            className="p-1.5 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      {e.source === "cell" && (
                        <div className="flex justify-end">
                          <span title="Ofrenda de célula — solo lectura">
                            <Users className="w-3.5 h-3.5 text-slate-300" />
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Totales del filtro aplicado */}
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td colSpan={5} className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {filtered.length} movimiento{filtered.length !== 1 ? "s" : ""}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {(() => {
                        const ing = filtered.filter(e => e.tipo === "Ingreso").reduce((s, e) => s + e.monto, 0);
                        const egr = filtered.filter(e => e.tipo === "Egreso") .reduce((s, e) => s + e.monto, 0);
                        const bal = ing - egr;
                        return <span className={bal >= 0 ? "text-emerald-700" : "text-rose-700"}>{bal >= 0 ? "+" : ""}{fmt(bal)}</span>;
                      })()}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
      )}

      {/* ── Modal Ingreso ──────────────────────────────────── */}
      <Dialog open={ingresoModal} onOpenChange={setIngresoModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingIngreso ? "Editar ingreso" : "Registrar ingreso"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <F label="Nombre del Miembro" name="member_name"   form={ingresoForm} setForm={setIngresoForm} />
            <F label="Tipo"               name="donation_type" form={ingresoForm} setForm={setIngresoForm}
              options={DONATION_TYPES} optionLabels={DONATION_TYPES.map(t => TYPE_LABELS[t])} />
            <F label="Monto *" name="amount" type="number" form={ingresoForm} setForm={setIngresoForm} />
            <F label="Fecha"   name="date"   type="date"   form={ingresoForm} setForm={setIngresoForm} />
            <F label="Método de Pago" name="payment_method" form={ingresoForm} setForm={setIngresoForm}
              options={PAYMENT_METHODS} optionLabels={PAYMENT_METHODS.map(p => PAYMENT_LABELS[p])} />
          </div>
          <F label="Notas" name="notes" textarea form={ingresoForm} setForm={setIngresoForm} />
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIngresoModal(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleSaveIngreso} disabled={ingresoSaving || !ingresoForm.amount}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              {ingresoSaving ? "Guardando..." : editingIngreso ? "Guardar cambios" : "Registrar ingreso"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal Egreso ───────────────────────────────────── */}
      <Dialog open={egresoModal} onOpenChange={setEgresoModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingEgreso ? "Editar egreso" : "Agregar egreso"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div className="sm:col-span-2">
              <F label="Descripción *" name="descripcion" form={egresoForm} setForm={setEgresoForm} />
            </div>
            <F label="Categoría"     name="categoria"   form={egresoForm} setForm={setEgresoForm} options={GASTO_CATEGORIAS} />
            <F label="Monto *"       name="monto"       type="number" form={egresoForm} setForm={setEgresoForm} />
            <F label="Fecha"         name="fecha"       type="date"   form={egresoForm} setForm={setEgresoForm} />
            <F label="Método de Pago" name="metodo_pago" form={egresoForm} setForm={setEgresoForm} options={METODOS_PAGO} />
            <div className="sm:col-span-2">
              <F label="Proveedor / Destinatario" name="proveedor" form={egresoForm} setForm={setEgresoForm} />
            </div>
          </div>
          <F label="Notas" name="notas" textarea form={egresoForm} setForm={setEgresoForm} />
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setEgresoModal(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleSaveEgreso} disabled={egresoSaving || !egresoForm.monto || !egresoForm.descripcion}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold">
              {egresoSaving ? "Guardando..." : editingEgreso ? "Guardar cambios" : "Agregar egreso"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
