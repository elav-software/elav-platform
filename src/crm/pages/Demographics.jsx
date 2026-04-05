"use client";
import React, { useEffect, useState } from "react";
import { base44 } from "@crm/api/base44Client";
import { Card } from "@crm/components/ui/card";
import PageHeader from "../components/shared/PageHeader";
import { BarChart3, Users, UserPlus, Crown, Heart } from "lucide-react";
import { differenceInYears, parseISO } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#6366f1", "#d4a843", "#10b981", "#f43f5e", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];

const GENDER_LABELS = { Male: "Masculino", Female: "Femenino", Unknown: "Desconocido" };
const MARITAL_LABELS = { Single: "Soltero/a", Married: "Casado/a", Widowed: "Viudo/a", Divorced: "Divorciado/a", Unknown: "Desconocido" };
const STATUS_LABELS = { Visitor: "Visitante", "New Believer": "Nuevo Creyente", Member: "Miembro", Leader: "Líder", Unknown: "Desconocido" };

export default function Demographics() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Member.list("-created_date", 5000).then(data => {
      setMembers(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader title="Métricas" subtitle="Estadísticas de la congregación" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array(6).fill(0).map((_, i) => <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      </div>
    );
  }

  const totalMembers = members.length;
  const totalVisitors = members.filter(m => m.member_status === "Visitor").length;
  const totalNewBelievers = members.filter(m => m.member_status === "New Believer").length;
  const totalActive = members.filter(m => m.member_status === "Member").length;
  const totalLeaders = members.filter(m => m.member_status === "Leader").length;
  const totalBaptized = members.filter(m => m.baptism_status === "Baptized").length;

  const ageGroups = { "0-17": 0, "18-25": 0, "26-35": 0, "36-50": 0, "51-65": 0, "65+": 0 };
  members.forEach(m => {
    if (!m.date_of_birth) return;
    try {
      const age = differenceInYears(new Date(), parseISO(m.date_of_birth));
      if (age < 18) ageGroups["0-17"]++;
      else if (age <= 25) ageGroups["18-25"]++;
      else if (age <= 35) ageGroups["26-35"]++;
      else if (age <= 50) ageGroups["36-50"]++;
      else if (age <= 65) ageGroups["51-65"]++;
      else ageGroups["65+"]++;
    } catch {}
  });
  const ageData = Object.entries(ageGroups).map(([group, count]) => ({ group, count }));

  const genderMap = {};
  members.forEach(m => { const g = m.gender || "Unknown"; genderMap[g] = (genderMap[g] || 0) + 1; });
  const genderData = Object.entries(genderMap).map(([name, value]) => ({ name: GENDER_LABELS[name] || name, value }));

  const maritalMap = {};
  members.forEach(m => { const s = m.marital_status || "Unknown"; maritalMap[s] = (maritalMap[s] || 0) + 1; });
  const maritalData = Object.entries(maritalMap).map(([name, value]) => ({ name: MARITAL_LABELS[name] || name, value }));

  const statusMap = {};
  members.forEach(m => { const s = m.member_status || "Unknown"; statusMap[s] = (statusMap[s] || 0) + 1; });
  const statusData = Object.entries(statusMap).map(([name, value]) => ({ name: STATUS_LABELS[name] || name, value }));

  const neighborhoodMap = {};
  members.forEach(m => { if (m.city_neighborhood) { neighborhoodMap[m.city_neighborhood] = (neighborhoodMap[m.city_neighborhood] || 0) + 1; } });
  const neighborhoodData = Object.entries(neighborhoodMap).sort(([, a], [, b]) => b - a).slice(0, 8).map(([name, count]) => ({ name, count }));

  const occupationMap = {};
  members.forEach(m => { if (m.occupation) { occupationMap[m.occupation] = (occupationMap[m.occupation] || 0) + 1; } });
  const occupationData = Object.entries(occupationMap).sort(([, a], [, b]) => b - a).slice(0, 8).map(([name, value]) => ({ name, value }));

  const householdMap = {};
  members.forEach(m => { if (m.household_size) { const s = String(m.household_size); householdMap[s] = (householdMap[s] || 0) + 1; } });
  const householdData = Object.entries(householdMap).sort(([a], [b]) => Number(a) - Number(b)).map(([size, count]) => ({ size: `${size} persona${size === "1" ? "" : "s"}`, count }));

  const ChartCard = ({ title, children }) => (
    <Card className="p-6 border-0 shadow-sm">
      <h3 className="font-semibold text-slate-800 mb-4">{title}</h3>
      {children}
    </Card>
  );

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white rounded-xl p-3 shadow-lg border-0 text-sm">
          <p className="font-medium text-slate-800">{payload[0].name || payload[0].payload?.group || payload[0].payload?.size}</p>
          <p className="text-slate-600">{payload[0].value} miembros</p>
        </div>
      );
    }
    return null;
  };

  const StatBox = ({ icon: Icon, label, value, color }) => (
    <Card className="p-4 border-0 shadow-sm flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </Card>
  );

  return (
    <div>
      <PageHeader title="Métricas" subtitle={`Estadísticas de la congregación — ${totalMembers} registrados en total`} />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatBox icon={Users} label="Total" value={totalMembers} color="bg-indigo-500" />
        <StatBox icon={UserPlus} label="Visitantes" value={totalVisitors} color="bg-sky-500" />
        <StatBox icon={Heart} label="Nuevos Creyentes" value={totalNewBelievers} color="bg-emerald-500" />
        <StatBox icon={Users} label="Miembros" value={totalActive} color="bg-violet-500" />
        <StatBox icon={Crown} label="Líderes" value={totalLeaders} color="bg-amber-500" />
        <StatBox icon={BarChart3} label="Bautizados" value={totalBaptized} color="bg-rose-500" />
      </div>

      {totalMembers === 0 ? (
        <Card className="p-16 border-0 shadow-sm flex flex-col items-center justify-center">
          <BarChart3 className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">Sin datos de miembros aún</p>
          <p className="text-sm text-slate-400 mt-1">Agrega miembros para ver las métricas</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Distribución por Edad">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ageData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="group" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Distribución por Género">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={genderData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {genderData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span className="text-sm text-slate-700">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Estado Civil">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={maritalData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {maritalData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span className="text-sm text-slate-700">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Estado en la Iglesia">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span className="text-sm text-slate-700">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {neighborhoodData.length > 0 && (
            <ChartCard title="Miembros por Barrio">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={neighborhoodData} layout="vertical" barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {occupationData.length > 0 && (
            <ChartCard title="Sectores de Ocupación">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={occupationData} layout="vertical" barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {householdData.length > 0 && (
            <ChartCard title="Distribución por Tamaño de Familia">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={householdData} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="size" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#f97316" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}
    </div>
  );
}