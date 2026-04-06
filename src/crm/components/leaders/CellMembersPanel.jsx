"use client";
import React, { useEffect, useState } from "react";
import { api } from "@crm/api/apiClient";
import { Button } from "@crm/components/ui/button";
import { Input } from "@crm/components/ui/input";
import { Badge } from "@crm/components/ui/badge";
import { Label } from "@crm/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@crm/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@crm/components/ui/select";
import { Users, Plus, Trash2, Phone, UserCheck, UserX } from "lucide-react";

const EMPTY = { member_name: "", phone: "", join_date: "", status: "Active" };

export default function CellMembersPanel({ leader }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const data = await api.entities.CellMember.filter({ leader_id: leader.id }, "-created_date");
    setMembers(data);
    setLoading(false);
  };

  useEffect(() => { setLoading(true); load(); }, [leader.id]);

  const handleSave = async () => {
    if (!form.member_name) return;
    setSaving(true);
    await api.entities.CellMember.create({ ...form, leader_id: leader.id });
    setForm(EMPTY);
    setModalOpen(false);
    setSaving(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este integrante?")) return;
    await api.entities.CellMember.delete(id);
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const toggleStatus = async (m) => {
    const newStatus = m.status === "Active" ? "Inactive" : "Active";
    await api.entities.CellMember.update(m.id, { status: newStatus });
    setMembers(prev => prev.map(x => x.id === m.id ? { ...x, status: newStatus } : x));
  };

  if (loading) return <div className="h-32 rounded-xl bg-slate-100 animate-pulse" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-slate-800 flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-500" /> Integrantes de la Célula ({members.length})
        </h4>
        <Button size="sm" onClick={() => setModalOpen(true)} className="h-8 text-xs bg-[#d4a843] hover:bg-[#c49a3a] text-[#1e293b] font-semibold">
          <Plus className="w-3 h-3 mr-1" /> Agregar
        </Button>
      </div>

      {members.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">Aún no hay integrantes registrados.</p>
      ) : (
        <div className="space-y-2">
          {members.map(m => (
            <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${m.status === "Active" ? "bg-emerald-100" : "bg-slate-200"}`}>
                  {m.status === "Active" ? <UserCheck className="w-4 h-4 text-emerald-600" /> : <UserX className="w-4 h-4 text-slate-400" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{m.member_name}</p>
                  {m.phone && <p className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" />{m.phone}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleStatus(m)}>
                  <Badge className={`text-xs cursor-pointer ${m.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                    {m.status === "Active" ? "Activo" : "Inactivo"}
                  </Badge>
                </button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-400 hover:bg-rose-50" onClick={() => handleDelete(m.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Agregar Integrante</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1 block">Nombre *</Label>
              <Input value={form.member_name} onChange={e => setForm(f => ({ ...f, member_name: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1 block">Teléfono</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1 block">Fecha de ingreso</Label>
              <Input type="date" value={form.join_date} onChange={e => setForm(f => ({ ...f, join_date: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1 block">Estado</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Activo</SelectItem>
                  <SelectItem value="Inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3 pt-3 border-t">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.member_name} className="flex-1 bg-[#d4a843] hover:bg-[#c49a3a] text-[#1e293b] font-semibold">
              {saving ? "Guardando..." : "Agregar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}