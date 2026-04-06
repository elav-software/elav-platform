"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "@connect/lib/router-compat";
import { supabase } from "@connect/api/supabaseClient";
import { getCurrentChurchId } from "@connect/api/apiClient";
import { 
  ArrowLeft, 
  Users,
  Mail,
  Phone,
  MapPin,
  Search,
  UserCheck
} from "lucide-react";

export default function PortalMiembros() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [leader, setLeader] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    verifyAndLoadMembers();
  }, []);

  const verifyAndLoadMembers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate("/connect/portal/login");
        return;
      }

      const churchId = await getCurrentChurchId();
      
      // Verificar líder aprobado y obtener su celula_id
      const { data: leaderData, error: leaderError } = await supabase
        .from('personas')
        .select('id, nombre, apellido, email, celula_id')
        .eq('church_id', churchId)
        .eq('email', session.user.email)
        .eq('rol', 'Líder')
        .eq('estado_aprobacion', 'aprobado')
        .single();

      if (leaderError || !leaderData) {
        navigate("/connect/portal/login");
        return;
      }

      setLeader(leaderData);

      // Cargar miembros de mi célula
      if (leaderData.celula_id) {
        const { data: membersData, error: membersError } = await supabase
          .from('personas')
          .select('id, nombre, apellido, email, telefono, direccion, rol')
          .eq('church_id', churchId)
          .eq('celula_id', leaderData.celula_id)
          .order('apellido');

        if (!membersError && membersData) {
          setMembers(membersData);
        }
      }
      
    } catch (err) {
      console.error("Error:", err);
      navigate("/connect/portal/login");
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(member => {
    const fullName = `${member.nombre} ${member.apellido}`.toLowerCase();
    const email = member.email?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/connect/portal/dashboard")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Mis Miembros</h1>
            <p className="text-sm text-gray-600">
              Miembros de tu célula
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{members.length}</p>
            <p className="text-xs text-gray-600">personas</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        
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
      </main>
    </div>
  );
}
