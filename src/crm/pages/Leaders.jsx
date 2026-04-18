"use client";
import React, { useEffect, useState } from "react";
import { api } from "@crm/api/apiClient";
import { Card } from "@crm/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@crm/components/ui/tabs";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import LeaderCard from "../components/leaders/LeaderCard";
import LeaderFormModal from "../components/leaders/LeaderFormModal";
import CellMembersPanel from "../components/leaders/CellMembersPanel";
import CellReportForm from "../components/leaders/CellReportForm";
import CellReportsPanel from "../components/leaders/CellReportsPanel";
import CellsMap from "../components/leaders/CellsMap";
import { Users, Map, ChevronRight, UserPlus } from "lucide-react";

export default function Leaders() {
  const [leaders, setLeaders] = useState([]);
  const [unlinkedMembers, setUnlinkedMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [memberCounts, setMemberCounts] = useState({});
  const [reportCounts, setReportCounts] = useState({});
  const [selectedLeader, setSelectedLeader] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLeader, setEditingLeader] = useState(null);
  const [reportRefreshKey, setReportRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("leaders");

  const load = async () => {
    setLoading(true);
    const [data, memberData] = await Promise.all([
      api.entities.Leader.list("-created_date", 200),
      api.entities.Member.filter({ member_status: "Leader" }, "-created_date", 200)
    ]);
    setLeaders(data);

    // Members with Leader status that don't have a linked Leader entity
    const linkedIds = new Set(data.map(l => l.member_id).filter(Boolean));
    setUnlinkedMembers(memberData.filter(m => !linkedIds.has(m.id)));

    // Load counts
    const mc = {}, rc = {};
    await Promise.all(data.map(async l => {
      const members = await api.entities.CellMember.filter({ leader_id: l.id });
      mc[l.id] = members.length;
      const reports = await api.entities.CellReport.filter({ leader_id: l.id });
      rc[l.id] = reports.length;
    }));
    setMemberCounts(mc);
    setReportCounts(rc);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleEdit = (leader) => {
    setEditingLeader(leader);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este líder y todos sus datos?")) return;
    await api.entities.Leader.delete(id);
    if (selectedLeader?.id === id) setSelectedLeader(null);
    setLeaders(prev => prev.filter(l => l.id !== id));
  };

  const handleSaved = async () => {
    setEditingLeader(null);
    await load();
  };

  const handleReportSaved = () => {
    setReportRefreshKey(k => k + 1);
    load();
  };

  const mappableLeaders = leaders.filter(l => l.latitude && l.longitude);

  if (loading) {
    return (
      <div>
        <PageHeader title="Líderes y Células" subtitle="Gestión de líderes de célula" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="h-40 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Líderes y Células"
        subtitle={`${leaders.length} líderes registrados · ${mappableLeaders.length} con ubicación`}
        onAdd={() => { setEditingLeader(null); setModalOpen(true); }}
        addLabel="Agregar Líder"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-white shadow-sm border border-slate-100">
          <TabsTrigger value="leaders" className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Líderes
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-1.5">
            <Map className="w-3.5 h-3.5" /> Mapa de Células
          </TabsTrigger>
        </TabsList>

        {/* LEADERS TAB */}
        <TabsContent value="leaders">
          {/* Unlinked leader-status members */}
          {unlinkedMembers.length > 0 && (
            <Card className="border-0 shadow-sm mb-5 p-4 bg-amber-50 border border-amber-200">
              <p className="text-sm font-semibold text-amber-800 mb-2">
                👑 Miembros con estado "Líder" sin célula registrada ({unlinkedMembers.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {unlinkedMembers.map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setEditingLeader({ full_name: m.full_name, phone: m.phone_number || "", email: m.email || "", member_id: m.id });
                      setModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors"
                  >
                    <UserPlus className="w-3 h-3" />
                    {m.full_name}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {leaders.length === 0 && unlinkedMembers.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <EmptyState
                icon={Users}
                title="Sin líderes registrados"
                description="Agrega líderes para gestionar sus células."
                onAction={() => setModalOpen(true)}
                actionLabel="Agregar Líder"
              />
            </Card>
          ) : leaders.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">No hay líderes registrados aún.</p>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Leader list */}
              <div className="xl:col-span-1 space-y-3">
                {leaders.map(l => (
                  <LeaderCard
                    key={l.id}
                    leader={l}
                    memberCount={memberCounts[l.id] ?? 0}
                    reportCount={reportCounts[l.id] ?? 0}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onSelect={(ldr) => { setSelectedLeader(ldr); }}
                    selected={selectedLeader?.id === l.id}
                  />
                ))}
              </div>

              {/* Detail panel */}
              <div className="xl:col-span-2">
                {!selectedLeader ? (
                  <Card className="border-0 shadow-sm h-full flex items-center justify-center">
                    <div className="text-center py-16 text-slate-400">
                      <ChevronRight className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Selecciona un líder</p>
                      <p className="text-sm mt-1">para ver su célula en detalle</p>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-5">
                    {/* Leader header */}
                    <Card className="p-5 border-0 shadow-sm bg-gradient-to-r from-slate-800 to-slate-900 text-white">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-white/20">
                          {selectedLeader.photo ? (
                            <img src={selectedLeader.photo} alt={selectedLeader.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                              <span className="text-2xl font-bold text-white">{selectedLeader.full_name[0]}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h2 className="text-xl font-bold">{selectedLeader.full_name}</h2>
                          <p className="text-amber-400 font-medium">{selectedLeader.cell_name || "Célula"}</p>
                          {selectedLeader.phone && <p className="text-slate-300 text-sm mt-1">📞 {selectedLeader.phone}</p>}
                          {selectedLeader.email && <p className="text-slate-300 text-sm">✉️ {selectedLeader.email}</p>}
                          {selectedLeader.meeting_location && <p className="text-slate-300 text-sm">📍 {selectedLeader.meeting_location}</p>}
                        </div>
                      </div>
                    </Card>

                    {/* Members + Report form + Reports */}
                    <Card className="p-5 border-0 shadow-sm">
                      <CellMembersPanel leader={selectedLeader} />
                    </Card>

                    <CellReportForm leader={selectedLeader} onReportSaved={handleReportSaved} />

                    <Card className="p-5 border-0 shadow-sm">
                      <CellReportsPanel leader={selectedLeader} refreshKey={reportRefreshKey} />
                    </Card>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* MAP TAB */}
        <TabsContent value="map">
          <div className="space-y-4">
            {mappableLeaders.length === 0 ? (
              <Card className="p-10 border-0 shadow-sm flex flex-col items-center gap-3 text-slate-400">
                <Map className="w-12 h-12 opacity-30" />
                <p className="font-medium">Aún no hay células con ubicación geocodificada</p>
                <p className="text-sm">Agrega la dirección de reunión a cada líder y usá el botón de pin para geocodificar.</p>
              </Card>
            ) : (
              <CellsMap
                leaders={leaders}
                selectedLeader={selectedLeader}
                onSelectLeader={(l) => { setSelectedLeader(l); }}
                onLeadersUpdated={load}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      <LeaderFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingLeader(null); }}
        onSaved={handleSaved}
        editing={editingLeader}
      />
    </div>
  );
}