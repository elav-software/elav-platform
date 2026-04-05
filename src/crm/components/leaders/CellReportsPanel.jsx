"use client";
import React, { useEffect, useState } from "react";
import { base44 } from "@crm/api/base44Client";
import { Card } from "@crm/components/ui/card";
import { Badge } from "@crm/components/ui/badge";
import { Button } from "@crm/components/ui/button";
import { format, parseISO } from "date-fns";
import { Trash2, Users, MapPin, BookOpen, DollarSign, TrendingUp } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from "recharts";

export default function CellReportsPanel({ leader, refreshKey }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");

  const load = async () => {
    const data = await base44.entities.CellReport.filter({ leader_id: leader.id }, "-date", 100);
    setReports(data);
    setLoading(false);
  };

  useEffect(() => { setLoading(true); load(); }, [leader.id, refreshKey]);

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este reporte?")) return;
    await base44.entities.CellReport.delete(id);
    setReports(prev => prev.filter(r => r.id !== id));
  };

  const chartData = [...reports].reverse().slice(-12).map(r => ({
    date: format(parseISO(r.date), "dd/MM"),
    Asistencia: r.attendance || 0,
    Visitas: r.visits || 0,
    Convertidos: r.new_converts || 0,
    Ofrenda: r.offering || 0,
  }));

  const totals = reports.reduce((acc, r) => ({
    attendance: acc.attendance + (r.attendance || 0),
    visits: acc.visits + (r.visits || 0),
    new_converts: acc.new_converts + (r.new_converts || 0),
    offering: acc.offering + (r.offering || 0),
  }), { attendance: 0, visits: 0, new_converts: 0, offering: 0 });

  if (loading) return <div className="h-40 rounded-xl bg-slate-100 animate-pulse" />;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Total asistencia", value: totals.attendance, icon: Users, color: "text-sky-600" },
          { label: "Visitas realizadas", value: totals.visits, icon: MapPin, color: "text-indigo-600" },
          { label: "Nuevos convertidos", value: totals.new_converts, icon: BookOpen, color: "text-emerald-600" },
          { label: "Ofrenda total", value: `$${totals.offering.toLocaleString()}`, icon: DollarSign, color: "text-amber-600" },
        ].map(s => (
          <div key={s.label} className="bg-slate-50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
            <p className="text-xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <h4 className="font-semibold text-slate-800 flex items-center gap-2 flex-1">
          <TrendingUp className="w-4 h-4 text-amber-500" /> Reportes ({reports.length})
        </h4>
        <div className="flex rounded-lg overflow-hidden border border-slate-200">
          <button onClick={() => setView("list")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === "list" ? "bg-slate-800 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>Lista</button>
          <button onClick={() => setView("chart")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === "chart" ? "bg-slate-800 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>Gráfico</button>
        </div>
      </div>

      {view === "chart" && reports.length > 0 && (
        <div className="space-y-6">
          <Card className="p-4 border-0 shadow-sm">
            <p className="text-xs font-medium text-slate-500 mb-3">Asistencia y Visitas</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Asistencia" stroke="#6366f1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Visitas" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Convertidos" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <Card className="p-4 border-0 shadow-sm">
            <p className="text-xs font-medium text-slate-500 mb-3">Ofrendas</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }} />
                <Bar dataKey="Ofrenda" fill="#d4a843" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {view === "list" && (
        reports.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">Aún no hay reportes enviados.</p>
        ) : (
          <div className="space-y-3">
            {reports.map(r => (
              <div key={r.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-medium text-slate-800 text-sm">{format(parseISO(r.date), "dd MMM yyyy")}</span>
                      {r.topic && <Badge className="text-xs bg-indigo-100 text-indigo-700">{r.topic}</Badge>}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { label: "Asistencia", value: r.attendance || 0 },
                        { label: "Visitas", value: r.visits || 0 },
                        { label: "Convertidos", value: r.new_converts || 0 },
                        { label: "Ofrenda", value: `$${(r.offering || 0).toLocaleString()}` },
                      ].map(s => (
                        <div key={s.label} className="text-center bg-white rounded-lg p-2">
                          <p className="text-xs text-slate-400">{s.label}</p>
                          <p className="text-sm font-bold text-slate-800">{s.value}</p>
                        </div>
                      ))}
                    </div>
                    {r.notes && <p className="text-xs text-slate-500 mt-2">{r.notes}</p>}
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-400 hover:bg-rose-50 flex-shrink-0" onClick={() => handleDelete(r.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}