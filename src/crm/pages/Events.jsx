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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@crm/components/ui/tabs";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import { Calendar, MapPin, User, Edit, Trash2, Plus, CheckSquare } from "lucide-react";
import { format, parseISO } from "date-fns";

const TYPE_COLORS = {
  Service: "bg-indigo-100 text-indigo-700",
  Conference: "bg-purple-100 text-purple-700",
  "Small Group": "bg-emerald-100 text-emerald-700",
  Training: "bg-amber-100 text-amber-700",
  "Special Event": "bg-rose-100 text-rose-700",
};

const TYPE_LABELS = {
  Service: "Servicio",
  Conference: "Conferencia",
  "Small Group": "Grupo Pequeño",
  Training: "Capacitación",
  "Special Event": "Evento Especial",
};

const ATT_LABELS = {
  Present: "Presente",
  Absent: "Ausente",
  Late: "Tarde",
  Excused: "Justificado",
};

const EVENT_TYPES = ["Service", "Conference", "Small Group", "Training", "Special Event"];
const ATT_STATUSES = ["Present", "Absent", "Late", "Excused"];

const EMPTY_EVENT = { event_name: "", event_type: "Service", date: "", location: "", organizer: "" };
const EMPTY_ATT = { member_name: "", event_name: "", event_id: "", attendance_status: "Present", notes: "" };

const EF = ({ label, name, type = "text", options, optionLabels, set, val }) => (
  <div>
    <Label className="text-xs font-medium text-slate-600 mb-1 block">{label}</Label>
    {options ? (
      <Select value={val[name] || ""} onValueChange={v => set(f => ({ ...f, [name]: v }))}>
        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>{options.map((o, i) => <SelectItem key={o} value={o}>{optionLabels ? optionLabels[i] : o}</SelectItem>)}</SelectContent>
      </Select>
    ) : (
      <Input type={type} value={val[name] || ""} onChange={e => set(f => ({ ...f, [name]: e.target.value }))} className="h-9 text-sm" />
    )}
  </div>
);

export default function Events() {
  const [events, setEvents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventModal, setEventModal] = useState(false);
  const [attModal, setAttModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingAtt, setEditingAtt] = useState(null);
  const [eventForm, setEventForm] = useState(EMPTY_EVENT);
  const [attForm, setAttForm] = useState(EMPTY_ATT);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [e, a] = await Promise.all([
      api.entities.Event.list("-date", 200),
      api.entities.Attendance.list("-created_date", 500),
    ]);
    setEvents(e);
    setAttendance(a);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openEventAdd = () => { setEditingEvent(null); setEventForm(EMPTY_EVENT); setEventModal(true); };
  const openEventEdit = (e) => { setEditingEvent(e); setEventForm({ ...EMPTY_EVENT, ...e }); setEventModal(true); };
  const openAttAdd = (event) => {
    setEditingAtt(null);
    setAttForm({ ...EMPTY_ATT, event_name: event ? event.event_name : "", event_id: event ? event.id : "" });
    setAttModal(true);
  };

  const saveEvent = async () => {
    setSaving(true);
    if (editingEvent) await api.entities.Event.update(editingEvent.id, eventForm);
    else await api.entities.Event.create(eventForm);
    await load(); setEventModal(false); setSaving(false);
  };

  const saveAtt = async () => {
    setSaving(true);
    if (editingAtt) await api.entities.Attendance.update(editingAtt.id, attForm);
    else await api.entities.Attendance.create(attForm);
    await load(); setAttModal(false); setSaving(false);
  };

  const deleteEvent = async (id) => {
    if (!confirm("¿Eliminar este evento?")) return;
    await api.entities.Event.delete(id);
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div>
      <PageHeader title="Eventos" subtitle="Gestiona eventos y asistencia" onAdd={openEventAdd} addLabel="Agregar Evento" />

      <Tabs defaultValue="events">
        <TabsList className="mb-6">
          <TabsTrigger value="events">Eventos ({events.length})</TabsTrigger>
          <TabsTrigger value="attendance">Asistencia ({attendance.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          {loading ? (
            <div className="space-y-3">{Array(4).fill(0).map((_, i) => <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />)}</div>
          ) : events.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <EmptyState icon={Calendar} title="Sin Eventos" description="Programa el primer evento de la iglesia." onAction={openEventAdd} actionLabel="Agregar Evento" />
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map(e => {
                const attCount = attendance.filter(a => a.event_id === e.id || a.event_name === e.event_name).length;
                return (
                  <Card key={e.id} className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <Badge className={`text-xs ${TYPE_COLORS[e.event_type] || "bg-slate-100 text-slate-600"}`}>{TYPE_LABELS[e.event_type] || e.event_type}</Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openAttAdd(e)} className="h-7 text-xs px-2">
                          <CheckSquare className="w-3 h-3 mr-1" /> Asistencia
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEventEdit(e)} className="h-7 w-7 p-0"><Edit className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteEvent(e.id)} className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">{e.event_name}</h3>
                    <div className="space-y-1.5">
                      {e.date && <div className="flex items-center gap-2 text-xs text-slate-500"><Calendar className="w-3.5 h-3.5" />{format(parseISO(e.date), "d 'de' MMMM 'de' yyyy")}</div>}
                      {e.location && <div className="flex items-center gap-2 text-xs text-slate-500"><MapPin className="w-3.5 h-3.5" />{e.location}</div>}
                      {e.organizer && <div className="flex items-center gap-2 text-xs text-slate-500"><User className="w-3.5 h-3.5" />{e.organizer}</div>}
                    </div>
                    {attCount > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <span className="text-xs text-slate-500">{attCount} registros de asistencia</span>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="attendance">
          <div className="flex justify-end mb-4">
            <Button onClick={() => openAttAdd(null)} className="bg-[#d4a843] hover:bg-[#c49a3a] text-[#1e293b] font-semibold">
              <Plus className="w-4 h-4 mr-2" /> Registrar Asistencia
            </Button>
          </div>
          {loading ? (
            <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}</div>
          ) : attendance.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <EmptyState icon={CheckSquare} title="Sin Registros de Asistencia" description="Comienza a registrar la asistencia a los eventos." onAction={() => openAttAdd(null)} actionLabel="Registrar Asistencia" />
            </Card>
          ) : (
            <div className="space-y-3">
              {attendance.map(a => (
                <Card key={a.id} className="p-4 border-0 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{a.member_name}</p>
                    <p className="text-xs text-slate-500">{a.event_name}</p>
                  </div>
                  <Badge className={`text-xs ${a.attendance_status === "Present" ? "bg-emerald-100 text-emerald-700" : a.attendance_status === "Late" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                    {ATT_LABELS[a.attendance_status] || a.attendance_status}
                  </Badge>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Event Modal */}
      <Dialog open={eventModal} onOpenChange={setEventModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingEvent ? "Editar Evento" : "Agregar Evento"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <EF label="Nombre del Evento *" name="event_name" set={setEventForm} val={eventForm} />
            <EF label="Tipo de Evento" name="event_type" set={setEventForm} val={eventForm}
              options={EVENT_TYPES} optionLabels={EVENT_TYPES.map(t => TYPE_LABELS[t])} />
            <EF label="Fecha" name="date" type="date" set={setEventForm} val={eventForm} />
            <EF label="Lugar" name="location" set={setEventForm} val={eventForm} />
            <EF label="Organizador" name="organizer" set={setEventForm} val={eventForm} />
          </div>
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setEventModal(false)} className="flex-1">Cancelar</Button>
            <Button onClick={saveEvent} disabled={saving || !eventForm.event_name}
              className="flex-1 bg-[#d4a843] hover:bg-[#c49a3a] text-[#1e293b] font-semibold">
              {saving ? "Guardando..." : editingEvent ? "Guardar Cambios" : "Agregar Evento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Attendance Modal */}
      <Dialog open={attModal} onOpenChange={setAttModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar Asistencia</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <EF label="Nombre del Miembro *" name="member_name" set={setAttForm} val={attForm} />
            <EF label="Evento *" name="event_name" set={setAttForm} val={attForm} options={events.map(e => e.event_name)} />
            <EF label="Estado" name="attendance_status" set={setAttForm} val={attForm}
              options={ATT_STATUSES} optionLabels={ATT_STATUSES.map(s => ATT_LABELS[s])} />
          </div>
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setAttModal(false)} className="flex-1">Cancelar</Button>
            <Button onClick={saveAtt} disabled={saving || !attForm.member_name}
              className="flex-1 bg-[#d4a843] hover:bg-[#c49a3a] text-[#1e293b] font-semibold">
              {saving ? "Guardando..." : "Registrar Asistencia"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}