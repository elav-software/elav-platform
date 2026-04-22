"use client";
import React, { useState } from "react";
import { Card } from "@crm/components/ui/card";
import { Badge } from "@crm/components/ui/badge";
import { Button } from "@crm/components/ui/button";
import { MapPin, Clock, Users, FileText, Edit, Trash2, User } from "lucide-react";

const DAY_ES = {
  Monday: "Lunes", Tuesday: "Martes", Wednesday: "Miércoles",
  Thursday: "Jueves", Friday: "Viernes", Saturday: "Sábado", Sunday: "Domingo"
};

export default function LeaderCard({ leader, memberCount, reportCount, onEdit, onDelete, onSelect, selected }) {
  const [lightbox, setLightbox] = useState(false);
  return (
    <>
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <img
            src={leader.photo}
            alt={leader.full_name}
            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/70 rounded-full w-9 h-9 flex items-center justify-center text-xl font-bold transition-colors"
            onClick={() => setLightbox(false)}
          >
            ×
          </button>
        </div>
      )}
    <Card
      onClick={() => onSelect(leader)}
      className={`p-5 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer ${selected ? "ring-2 ring-amber-400" : ""}`}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden"
          onClick={(e) => { if (leader.photo) { e.stopPropagation(); setLightbox(true); } }}
          title={leader.photo ? "Ver foto" : undefined}
          style={leader.photo ? { cursor: 'zoom-in' } : {}}
        >
          {leader.photo ? (
            <img src={leader.photo} alt={leader.full_name} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <User className="w-6 h-6 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-900">{leader.full_name}</h3>
              <p className="text-sm text-slate-500">{leader.cell_name || "Célula sin nombre"}</p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={e => { e.stopPropagation(); onEdit(leader); }}>
                <Edit className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-50" onClick={e => { e.stopPropagation(); onDelete(leader.id); }}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <div className="mt-2 space-y-1">
            {(leader.meeting_day || leader.meeting_time) && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Clock className="w-3 h-3 text-amber-500" />
                {DAY_ES[leader.meeting_day] || leader.meeting_day}{leader.meeting_time ? ` — ${leader.meeting_time}` : ""}
              </div>
            )}
            {leader.meeting_location && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <MapPin className="w-3 h-3 text-rose-500" />
                <span className="truncate">{leader.meeting_location}</span>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-3">
            <Badge className="text-xs bg-sky-100 text-sky-700 flex items-center gap-1">
              <Users className="w-3 h-3" /> {memberCount} integrantes
            </Badge>
            <Badge className="text-xs bg-emerald-100 text-emerald-700 flex items-center gap-1">
              <FileText className="w-3 h-3" /> {reportCount} reportes
            </Badge>
          </div>
        </div>
      </div>
    </Card>
    </>
  );
}