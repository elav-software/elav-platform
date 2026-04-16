"use client";
import React, { useEffect, useState } from "react";
import { api, getMyChurchId } from "@crm/api/apiClient";
import { supabase } from "@crm/api/supabaseClient";
import { Link } from "@crm/lib/router-compat";
import { createPageUrl } from "@crm/utils";
import { Card } from "@crm/components/ui/card";
import { Badge } from "@crm/components/ui/badge";
import StatCard from "../components/shared/StatCard";
import {
  Users, UserPlus, Droplets, TrendingUp, DollarSign,
  Church, HandHeart, Calendar, ArrowRight, Star
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export default function Dashboard() {
  const [members, setMembers] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [donations, setDonations] = useState([]);
  const [cellOfferings, setCellOfferings] = useState(0);
  const [events, setEvents] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const monthStart = startOfMonth(now).toISOString().split('T')[0];
    const monthEnd = endOfMonth(now).toISOString().split('T')[0];

    Promise.all([
      api.entities.Member.list("-created_date", 200),
      api.entities.Visitor.list("-created_date", 100),
      api.entities.Donation.list("-created_date", 200),
      api.entities.Event.list("-date", 5),
      getMyChurchId().then(churchId => {
        if (!churchId) return 0;
        return supabase
          .from('leader_cell_submissions')
          .select('offering_amount')
          .eq('church_id', churchId)
          .gte('report_date', monthStart)
          .lte('report_date', monthEnd)
          .then(({ data }) =>
            (data || []).reduce((s, r) => s + (r.offering_amount || 0), 0)
          );
      }),
    ]).then(([m, v, d, e, cellOff]) => {
      setMembers(m);
      setVisitors(v);
      setDonations(d);
      setEvents(e);
      setCellOfferings(cellOff || 0);
      setLoading(false);
    });
  }, []);

  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);

  const visitorsThisMonth = visitors.filter(v =>
    v.visit_date && isWithinInterval(parseISO(v.visit_date), { start: thisMonthStart, end: thisMonthEnd })
  ).length;

  const baptismsThisYear = members.filter(m =>
    m.baptism_date && new Date(m.baptism_date).getFullYear() === now.getFullYear()
  ).length;

  const totalTithesMonth = donations
    .filter(d => d.donation_type === "Tithe" && d.date && isWithinInterval(parseISO(d.date), { start: thisMonthStart, end: thisMonthEnd }))
    .reduce((s, d) => s + (d.amount || 0), 0);

  // Growth chart - last 6 months
  const growthData = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(now, 5 - i);
    const label = format(month, "MMM");
    const count = members.filter(m => {
      if (!m.date_joined) return false;
      const joined = parseISO(m.date_joined);
      return joined <= endOfMonth(month);
    }).length;
    return { month: label, members: count };
  });

  // Giving chart - last 6 months
  const givingData = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(now, 5 - i);
    const label = format(month, "MMM");
    const total = donations
      .filter(d => {
        if (!d.date) return false;
        const dd = parseISO(d.date);
        return isWithinInterval(dd, { start: startOfMonth(month), end: endOfMonth(month) });
      })
      .reduce((s, d) => s + (d.amount || 0), 0);
    return { month: label, amount: total };
  });

  const statusColors = {
    Visitor: "bg-sky-100 text-sky-700",
    "New Believer": "bg-emerald-100 text-emerald-700",
    Member: "bg-indigo-100 text-indigo-700",
    Leader: "bg-amber-100 text-amber-700",
  };

  const statusLabels = {
    Visitor: "Visitante",
    "New Believer": "Nuevo Creyente",
    Member: "Miembro",
    Leader: "Líder",
  };

  const recentMembers = members.slice(0, 5);
  const activePrayers = 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Panel del Pastor</h1>
        <p className="text-slate-500 mt-1">{format(now, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Miembros" value={loading ? "—" : members.length} icon={Users} color="indigo" />
        <StatCard title="Visitantes Este Mes" value={loading ? "—" : visitorsThisMonth} icon={UserPlus} color="cyan" />
        <StatCard title="Bautismos Este Año" value={loading ? "—" : baptismsThisYear} icon={Droplets} color="blue" />
        <StatCard title="Diezmos Este Mes" value={loading ? "—" : `$${totalTithesMonth.toLocaleString()}`} icon={DollarSign} color="amber" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Oraciones Activas" value={loading ? "—" : activePrayers} icon={HandHeart} color="rose" />
        <StatCard title="Próximos Eventos" value={loading ? "—" : events.length} icon={Calendar} color="purple" />
        <StatCard title="Líderes" value={loading ? "—" : members.filter(m => m.member_status === "Leader").length} icon={Star} color="orange" />
        <StatCard title="Ofrenda este mes" value={loading ? "—" : `$${cellOfferings.toLocaleString()}`} icon={TrendingUp} color="green" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6 border-0 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Crecimiento de la Iglesia (Miembros)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }} />
              <Line type="monotone" dataKey="members" stroke="#6366f1" strokeWidth={3} dot={{ fill: "#6366f1", strokeWidth: 2, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 border-0 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Tendencia de Ofrendas</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={givingData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }} formatter={(v) => [`$${v}`, "Monto"]} />
              <Bar dataKey="amount" fill="#d4a843" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Members + Ministry status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Miembros Recientes</h3>
            <Link to={createPageUrl("Members")} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />
              ))
            ) : recentMembers.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">Aún no hay miembros</p>
            ) : (
              recentMembers.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {m.full_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">{m.full_name}</p>
                    <p className="text-xs text-slate-400 truncate">{m.city_neighborhood || m.email || "—"}</p>
                  </div>
                  <Badge className={`text-xs ${statusColors[m.member_status] || "bg-slate-100 text-slate-600"}`}>
                    {statusLabels[m.member_status] || m.member_status || "—"}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Resumen por Estado</h3>
          </div>
          <div className="space-y-3">
            {[
              { key: "Visitor", label: "Visitante" },
              { key: "New Believer", label: "Nuevo Creyente" },
              { key: "Member", label: "Miembro" },
              { key: "Leader", label: "Líder" },
            ].map(({ key: status, label }) => {
              const count = members.filter(m => m.member_status === status).length;
              const pct = members.length ? Math.round((count / members.length) * 100) : 0;
              const colors = {
                Visitor: "bg-sky-500",
                "New Believer": "bg-emerald-500",
                Member: "bg-indigo-500",
                Leader: "bg-amber-500",
              };
              return (
                <div key={status}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-slate-700">{label}</span>
                    <span className="text-sm text-slate-500">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${colors[status]} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Accesos Rápidos</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Agregar Miembro", page: "Members", color: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100" },
                { label: "Registrar Visitante", page: "Visitors", color: "bg-sky-50 text-sky-700 hover:bg-sky-100" },
                { label: "Registrar Donación", page: "Donations", color: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
                { label: "Nuevo Evento", page: "Events", color: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
              ].map(link => (
                <Link key={link.page} to={createPageUrl(link.page)}
                  className={`text-sm font-medium px-3 py-2 rounded-lg text-center transition-colors ${link.color}`}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}