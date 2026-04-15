"use client";
import React, { useState } from "react";
import { api } from "@crm/api/apiClient";
import { Button } from "@crm/components/ui/button";
import { Input } from "@crm/components/ui/input";
import { Label } from "@crm/components/ui/label";
import { Textarea } from "@crm/components/ui/textarea";
import { CheckCircle2, FileText } from "lucide-react";

const EMPTY = { date: "", topic: "", attendance: "", visits: "", new_converts: "", offering: "", notes: "" };

export default function CellReportForm({ leader, onReportSaved }) {
  const [form, setForm] = useState({ ...EMPTY, date: new Date().toISOString().split("T")[0] });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const F = (label, name, type = "text") => (
    <div>
      <Label className="text-xs font-medium text-slate-600 mb-1 block">{label}</Label>
      <Input type={type} value={form[name]} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))} className="h-9 text-sm" />
    </div>
  );

  const handleSave = async () => {
    if (!form.date) return;
    setSaving(true);
    await api.entities.CellReport.create({
      leader_id: leader.id,
      date: form.date,
      topic: form.topic,
      attendance: form.attendance ? Number(form.attendance) : 0,
      visits: form.visits ? Number(form.visits) : 0,
      new_converts: form.new_converts ? Number(form.new_converts) : 0,
      offering: form.offering ? Number(form.offering) : 0,
      notes: form.notes,
    });
    setSaving(false);
    setSaved(true);
    setForm({ ...EMPTY, date: new Date().toISOString().split("T")[0] });
    setTimeout(() => setSaved(false), 3000);
    onReportSaved();
  };

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100">
      <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <FileText className="w-4 h-4 text-amber-500" /> Enviar Reporte de Célula
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {F("Fecha *", "date", "date")}
        {F("Tema / Mensaje", "topic")}
        {F("Asistencia", "attendance", "number")}
        {F("Visitas realizadas", "visits", "number")}
        {F("Nuevos convertidos", "new_converts", "number")}
        {F("Ofrenda ($)", "offering", "number")}
      </div>
      <div className="mt-3">
        <Label className="text-xs font-medium text-slate-600 mb-1 block">Notas adicionales</Label>
        <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="text-sm" />
      </div>
      <div className="flex justify-end mt-4">
        <Button onClick={handleSave} disabled={saving || saved} className="bg-[#d4a843] hover:bg-[#c49a3a] text-[#1e293b] font-semibold">
          {saved ? (
            <><CheckCircle2 className="w-4 h-4 mr-2 text-emerald-700" /> ¡Reporte Enviado!</>
          ) : saving ? "Guardando..." : "Enviar Reporte"}
        </Button>
      </div>
    </div>
  );
}