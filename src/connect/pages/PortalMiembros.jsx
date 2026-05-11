"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@connect/api/supabaseClient";
import { getCurrentChurchId, checkIsSuperadmin } from "@connect/api/apiClient";
import {
  ArrowLeft,
  Users,
  Mail,
  Phone,
  MapPin,
  Search,
  UserCheck,
  Calendar,
  CheckSquare,
  Square,
  Save,
  ClipboardList
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function PortalMiembros() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [leader, setLeader] = useState(null);
  const [attendanceMode, setAttendanceMode] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const redirect = (path) => { window.location.href = path; };

  useEffect(() => {
    verifyAndLoadMembers();
  }, []);

  const verifyAndLoadMembers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        redirect("/connect/portal/login");
        return;
      }

      const churchId = await getCurrentChurchId();

      const superadmin = await checkIsSuperadmin();
      if (superadmin) {
        setLeader({ id: null, nombre: 'Superadmin', apellido: '', email: session.user.email });
        setLoading(false);
        return;
      }

      const { data: leaderData, error: leaderError } = await supabase
        .from('personas')
        .select('id, nombre, apellido, email')
        .eq('church_id', churchId)
        .ilike('email', session.user.email)
        .eq('rol', 'Líder')
        .eq('estado_aprobacion', 'aprobado')
        .single();

      if (leaderError || !leaderData) {
        redirect("/connect/portal/login");
        return;
      }

      setLeader(leaderData);

      const { data: membersData, error: membersError } = await supabase
        .from('personas')
        .select('id, nombre, apellido, email, telefono, direccion, rol')
        .eq('church_id', churchId)
        .eq('lider_id', leaderData.id)
        .order('apellido');

      if (!membersError && membersData) {
        setMembers(membersData);
        // Initialize attendance map with everyone present by default
        const defaultMap = {};
        membersData.forEach(m => { defaultMap[m.id] = true; });
        setAttendanceMap(defaultMap);
      }

    } catch (err) {
      console.error("Error:", err);
      redirect("/connect/portal/login");
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = useCallback(async (date) => {
    if (members.length === 0) return;
    const personIds = members.map(m => m.id);
    const { data, error } = await supabase
      .from('attendance')
      .select('person_id, presente')
      .in('person_id', personIds)
      .eq('fecha', date);

    const map = {};
    members.forEach(m => { map[m.id] = true; });
    if (!error && data) {
      data.forEach(r => { map[r.person_id] = r.presente; });
    }
    setAttendanceMap(map);
  }, [members]);

  useEffect(() => {
    if (attendanceMode && members.length > 0) {
      loadAttendance(attendanceDate);
    }
  }, [attendanceMode, attendanceDate, loadAttendance]);

  const togglePresent = (personId) => {
    setAttendanceMap(prev => ({ ...prev, [personId]: !prev[personId] }));
  };

  const saveAttendance = async () => {
    if (members.length === 0) return;
    setSavingAttendance(true);
    try {
      const personIds = members.map(m => m.id);
      await supabase
        .from('attendance')
        .delete()
        .in('person_id', personIds)
        .eq('fecha', attendanceDate);

      const records = members.map(m => ({
        person_id: m.id,
        fecha: attendanceDate,
        presente: attendanceMap[m.id] ?? true,
      }));
      const { error } = await supabase.from('attendance').insert(records);
      if (error) throw error;
      const presentes = records.filter(r => r.presente).length;
      toast.success(`Asistencia guardada: ${presentes}/${records.length} presentes`);
    } catch (err) {
      toast.error('Error al guardar: ' + (err.message || 'Error desconocido'));
    } finally {
      setSavingAttendance(false);
    }
  };

  const filteredMembers = members.filter(member => {
    const fullName = `${member.nombre} ${member.apellido}`.toLowerCase();
    const email = member.email?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  const presentCount = Object.values(attendanceMap).filter(Boolean).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => redirect("/connect/portal/dashboard")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Mis Miembros</h1>
            <p className="text-sm text-gray-600">
              {attendanceMode ? `Asistencia — ${attendanceDate}` : 'Miembros de tu célula'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {members.length > 0 && (
              <button
                onClick={() => setAttendanceMode(m => !m)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  attendanceMode
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                {attendanceMode ? 'Ver lista' : 'Pasar asistencia'}
              </button>
            )}
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{members.length}</p>
              <p className="text-xs text-gray-600">personas</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* Attendance mode */}
        {attendanceMode ? (
          <div>
            {/* Date picker + summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-0.5">Fecha de reunión</label>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={e => setAttendanceDate(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold text-gray-900">{presentCount}<span className="text-base font-normal text-gray-500">/{members.length}</span></p>
                <p className="text-xs text-gray-500">presentes</p>
              </div>
              <button
                onClick={saveAttendance}
                disabled={savingAttendance || members.length === 0}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingAttendance ? 'Guardando...' : 'Guardar asistencia'}
              </button>
            </div>

            {/* Attendance list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {members.map(member => {
                const presente = attendanceMap[member.id] ?? true;
                return (
                  <button
                    key={member.id}
                    onClick={() => togglePresent(member.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      presente
                        ? 'bg-green-50 border-green-400 shadow-sm'
                        : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${
                      presente ? 'bg-green-500' : 'bg-gray-400'
                    }`}>
                      {member.nombre?.[0]}{member.apellido?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {member.nombre} {member.apellido}
                      </p>
                      {member.telefono && (
                        <p className="text-xs text-gray-500 truncate">{member.telefono}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {presente
                        ? <CheckSquare className="w-6 h-6 text-green-600" />
                        : <Square className="w-6 h-6 text-gray-400" />
                      }
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Members List */}
            {filteredMembers.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'No se encontraron miembros' : 'No hay miembros en tu célula'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Intentá con otro término de búsqueda' : 'Los miembros aparecerán aquí cuando se asignen a tu célula'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                          {member.nombre?.[0]}{member.apellido?.[0]}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {member.nombre} {member.apellido}
                          </h3>
                          {member.rol === 'Líder' && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                              <UserCheck className="w-3 h-3" />
                              Líder
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {member.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <a
                            href={`mailto:${member.email}`}
                            className="hover:text-red-600 hover:underline"
                          >
                            {member.email}
                          </a>
                        </div>
                      )}

                      {member.telefono && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <a
                            href={`tel:${member.telefono}`}
                            className="hover:text-red-600 hover:underline"
                          >
                            {member.telefono}
                          </a>
                        </div>
                      )}

                      {member.direccion && (
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                          <span className="flex-1">{member.direccion}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
