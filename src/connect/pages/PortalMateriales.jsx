"use client";

import { useState, useEffect } from "react";
import { supabase } from "@connect/api/supabaseClient";
import { getCurrentChurchId } from "@connect/api/apiClient";
import { 
  ArrowLeft, 
  FileText,
  Video,
  Link as LinkIcon,
  Download,
  Eye,
  Search
} from "lucide-react";

export default function PortalMateriales() {
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState([]);
  const [filter, setFilter] = useState('all');
  const redirect = (path) => { window.location.href = path; };

  useEffect(() => {
    verifyAndLoadMaterials();
  }, []);

  const verifyAndLoadMaterials = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        redirect("/connect/portal/login");
        return;
      }

      const churchId = await getCurrentChurchId();
      
      // Verificar líder aprobado
      const { data: leader } = await supabase
        .from('personas')
        .select('id')
        .eq('church_id', churchId)
        .ilike('email', session.user.email)
        .eq('rol', 'Líder')
        .eq('estado_aprobacion', 'aprobado')
        .single();

      if (!leader) {
        redirect("/connect/portal/login");
        return;
      }

      // Cargar materiales activos
      const { data: materialsData, error } = await supabase
        .from('leader_materials')
        .select('*')
        .eq('church_id', churchId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && materialsData) {
        setMaterials(materialsData);
        // Marcar todos como vistos
        if (materialsData.length > 0) {
          const rows = materialsData.map(m => ({
            user_id: session.user.id,
            material_id: m.id
          }));
          await supabase
            .from('leader_material_views')
            .upsert(rows, { onConflict: 'user_id,material_id', ignoreDuplicates: true });
        }
      }
      
    } catch (err) {
      console.error("Error:", err);
      redirect("/connect/portal/login");
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'pdf': 
      case 'document':
        return FileText;
      case 'video':
        return Video;
      case 'link':
        return LinkIcon;
      default:
        return FileText;
    }
  };

  const filteredMaterials = filter === 'all' 
    ? materials 
    : materials.filter(m => m.category === filter);

  const categories = [...new Set(materials.map(m => m.category).filter(Boolean))];

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
            onClick={() => redirect("/connect/portal/dashboard")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Materiales</h1>
            <p className="text-sm text-gray-600">
              Recursos exclusivos para líderes
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Filters */}
        {categories.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === 'all'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
              }`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors capitalize ${
                  filter === cat
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Materials Grid */}
        {filteredMaterials.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay materiales disponibles
            </h3>
            <p className="text-gray-600">
              Pronto el pastor subirá recursos para vos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map((material) => {
              const Icon = getTypeIcon(material.type);
              
              return (
                <div 
                  key={material.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-purple-600" />
                    </div>
                    {material.category && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded capitalize">
                        {material.category}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {material.title}
                  </h3>
                  
                  {material.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {material.description}
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    {material.file_path ? (
                      <button
                        onClick={async () => {
                          const { data } = await supabase.storage
                            .from('materiales')
                            .createSignedUrl(material.file_path, 60 * 60); // 1h
                          if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Descargar
                      </button>
                    ) : (
                      <a
                        href={material.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      Ver
                    </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
