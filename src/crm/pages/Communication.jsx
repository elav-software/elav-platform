"use client";
import React, { useEffect, useState } from "react";
import { api } from "@crm/api/apiClient";
import { Card } from "@crm/components/ui/card";
import { Badge } from "@crm/components/ui/badge";
import { Button } from "@crm/components/ui/button";
import { Input } from "@crm/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@crm/components/ui/select";
import { Textarea } from "@crm/components/ui/textarea";
import { Label } from "@crm/components/ui/label";
import PageHeader from "../components/shared/PageHeader";
import { MessageSquare, Mail, Phone, Send, Users, CheckCircle2, Clock, Cake, Calendar, Bell } from "lucide-react";
import { parseISO } from "date-fns";

const AUTOMATIONS = [
  {
    id: "birthday",
    title: "Mensajes de Cumpleaños",
    description: "Envía automáticamente saludos de cumpleaños a los miembros en su día.",
    icon: Cake,
    color: "bg-pink-50 text-pink-600",
    channel: "WhatsApp / Email",
  },
  {
    id: "visitor_followup",
    title: "Seguimiento a Visitantes",
    description: "Envía un mensaje de bienvenida a los nuevos visitantes dentro de las 24 horas de su primera visita.",
    icon: Users,
    color: "bg-cyan-50 text-cyan-600",
    channel: "WhatsApp",
  },
  {
    id: "service_reminder",
    title: "Recordatorio Semanal de Servicio",
    description: "Recuerda a todos los miembros cada domingo sobre el servicio semanal.",
    icon: Bell,
    color: "bg-indigo-50 text-indigo-600",
    channel: "WhatsApp / SMS",
  },
  {
    id: "anniversary",
    title: "Bendiciones de Aniversario",
    description: "Envía bendiciones de aniversario a las parejas casadas.",
    icon: Calendar,
    color: "bg-rose-50 text-rose-600",
    channel: "WhatsApp / phone",
  },
];

export default function Communication() {
  const [members, setMembers] = useState([]);
  const [channel, setChannel] = useState("whatsapp");
  const [recipient, setRecipient] = useState("all");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [automationStates, setAutomationStates] = useState({
    birthday: true,
    visitor_followup: true,
    service_reminder: false,
    anniversary: false,
  });

  useEffect(() => {
    api.entities.Member.list("-created_date", 500).then(setMembers);
  }, []);

  const now = new Date();
  const birthdayToday = members.filter(m => {
    if (!m.date_of_birth) return false;
    const dob = parseISO(m.date_of_birth);
    return dob.getMonth() === now.getMonth() && dob.getDate() === now.getDate();
  });

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));
    setSending(false);
    setSent(true);
    setTimeout(() => { setSent(false); setMessage(""); setSubject(""); }, 3000);
  };

  const toggleAutomation = (id) => {
    setAutomationStates(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const templates = [
    { label: "Bienvenida al Visitante", text: "¡Bienvenido a nuestra familia de la iglesia! Nos alegra mucho que nos hayas acompañado. No dudes en contactarnos si tienes alguna pregunta. 🙏" },
    { label: "Saludo de Cumpleaños", text: "¡Feliz Cumpleaños! 🎂 Que Dios te bendiga con alegría, salud y su gracia abundante en este día especial. ¡Nos alegra tenerte en nuestra familia de la iglesia!" },
    { label: "Recordatorio de Servicio", text: "Recordatorio: El Servicio Dominical es mañana a las [hora] en [lugar]. ¡Esperamos adorar juntos! 🙌" },
    { label: "Seguimiento de Oración", text: "Queremos hacerte saber que estamos orando por ti y por tu petición de oración. Que la paz de Dios esté contigo." },
  ];

  const recipientCount = () => {
    if (recipient === "all") return `Todos los ${members.length} miembros`;
    if (recipient === "leaders") return `${members.filter(m => m.member_status === "Leader").length} líderes`;
    if (recipient === "visitors") return `${members.filter(m => m.member_status === "Visitor").length} visitantes`;
    if (recipient === "new_believers") return `${members.filter(m => m.member_status === "New Believer").length} nuevos creyentes`;
    return `${members.filter(m => m.member_status === "Member").length} miembros activos`;
  };

  return (
    <div>
      <PageHeader title="Comunicación" subtitle="Envía mensajes y gestiona automatizaciones" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border-0 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-500" />
              Redactar Mensaje
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <Label className="text-xs font-medium text-slate-600 mb-1 block">Canal</Label>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">
                      <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-green-500" /> WhatsApp</span>
                    </SelectItem>
                    <SelectItem value="email">
                      <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-blue-500" /> Correo</span>
                    </SelectItem>
                    <SelectItem value="sms">
                      <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-purple-500" /> SMS</span>
                      </SelectItem>
                    <SelectItem value="facebook">
                      <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-purple-500" /> SMS</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600 mb-1 block">Destinatarios</Label>
                <Select value={recipient} onValueChange={setRecipient}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los Miembros</SelectItem>
                    <SelectItem value="visitors">Solo Visitantes</SelectItem>
                    <SelectItem value="members">Miembros Activos</SelectItem>
                    <SelectItem value="leaders">Líderes</SelectItem>
                    <SelectItem value="new_believers">Nuevos Creyentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {channel === "email" && (
              <div className="mb-4">
                <Label className="text-xs font-medium text-slate-600 mb-1 block">Asunto</Label>
                <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Asunto del correo..." className="h-10" />
              </div>
            )}

            <div className="mb-4">
              <Label className="text-xs font-medium text-slate-600 mb-1 block">Mensaje</Label>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Escribe tu mensaje aquí..."
                className="min-h-[120px] text-sm"
              />
            </div>

            <div className="mb-4">
              <p className="text-xs font-medium text-slate-500 mb-2">Plantillas rápidas:</p>
              <div className="flex flex-wrap gap-2">
                {templates.map(t => (
                  <button key={t.label} onClick={() => setMessage(t.text)}
                    className="text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Enviando a: <span className="font-medium text-slate-700">{recipientCount()}</span>
              </p>
              <Button onClick={handleSend} disabled={sending || sent || !message.trim()}
                className="bg-[#d4a843] hover:bg-[#c49a3a] text-[#1e293b] font-semibold">
                {sent ? (
                  <><CheckCircle2 className="w-4 h-4 mr-2 text-emerald-700" /> ¡Enviado!</>
                ) : sending ? (
                  <><Clock className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" /> Enviar Mensaje</>
                )}
              </Button>
            </div>
          </Card>

          {birthdayToday.length > 0 && (
            <Card className="p-5 border-0 shadow-sm bg-gradient-to-r from-pink-50 to-rose-50 border-l-4 border-l-rose-400">
              <div className="flex items-center gap-3">
                <Cake className="w-6 h-6 text-rose-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-rose-800">🎂 ¡Cumpleaños Hoy!</p>
                  <p className="text-sm text-rose-600">{birthdayToday.map(m => m.full_name).join(", ")}</p>
                </div>
                <Button size="sm" className="ml-auto bg-rose-500 hover:bg-rose-600 text-white text-xs"
                  onClick={() => setMessage("¡Feliz Cumpleaños! 🎂 Que Dios te bendiga con alegría, salud y su gracia abundante en este día especial.")}>
                  Enviar Saludo
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Automations */}
        <div className="space-y-4">
          <Card className="p-5 border-0 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              Automatizaciones
            </h3>
            <div className="space-y-4">
              {AUTOMATIONS.map(auto => (
                <div key={auto.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${auto.color}`}>
                    <auto.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-800">{auto.title}</p>
                      <button
                        onClick={() => toggleAutomation(auto.id)}
                        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${automationStates[auto.id] ? "bg-emerald-500" : "bg-slate-300"}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${automationStates[auto.id] ? "left-5" : "left-0.5"}`} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{auto.description}</p>
                    <Badge className="text-xs bg-slate-200 text-slate-600 mt-1">{auto.channel}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 border-0 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-3">Estadísticas Rápidas</h3>
            <div className="space-y-3">
              {[
                { label: "Total Miembros", value: members.length, icon: Users },
                { label: "Cumpleaños Este Mes", value: members.filter(m => m.date_of_birth && parseISO(m.date_of_birth).getMonth() === now.getMonth()).length, icon: Cake },
                { label: "Con WhatsApp", value: members.filter(m => m.whatsapp_number).length, icon: MessageSquare },
                { label: "Con Correo", value: members.filter(m => m.email).length, icon: Mail },
              ].map(stat => (
                <div key={stat.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <stat.icon className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">{stat.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-800">{stat.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}