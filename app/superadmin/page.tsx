"use client";

import { useState } from "react";

type ChurchResult = {
  church: { id: string; name: string; slug: string; custom_domain: string };
  admin: { email: string; temp_password: string };
  urls: { web: string; crm: string; censo: string };
};

export default function SuperAdminPage() {
  const [secret, setSecret] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    short_name: "",
    custom_domain: "",
    admin_email: "",
    admin_name: "",
    plan: "basic",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ChurchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  // Auto-generar slug desde el nombre
  const handleNameBlur = () => {
    if (!form.slug && form.name) {
      const slug = form.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setForm((f) => ({ ...f, slug }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/superadmin/create-church", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-superadmin-secret": secret,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error desconocido");
      } else {
        setResult(data);
        setForm({ name: "", slug: "", short_name: "", custom_domain: "", admin_email: "", admin_name: "", plan: "basic" });
      }
    } catch {
      setError("Error de red. Revisar consola.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-400";
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";

  // ── Pantalla de autenticación ─────────────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Super Admin</h1>
          <p className="text-sm text-gray-400 mb-6">Acceso restringido</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setAuthenticated(true);
            }}
            className="space-y-4"
          >
            <div>
              <label className={labelCls}>Clave maestra</label>
              <input
                type="password"
                className={inputCls}
                placeholder="••••••••••••"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-sm transition"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Panel principal ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Nueva Iglesia</h1>
            <p className="text-sm text-gray-400">Registro completo — acceso al CRM inmediato</p>
          </div>
          <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-1 rounded-full">
            Super Admin
          </span>
        </div>

        {/* Resultado exitoso */}
        {result && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 space-y-3">
            <p className="text-sm font-bold text-emerald-800">
              ✓ Iglesia creada: {result.church.name}
            </p>
            <div className="text-xs text-emerald-700 space-y-1 font-mono">
              <p>Web:   <a href={result.urls.web}   className="underline">{result.urls.web}</a></p>
              <p>CRM:   <a href={result.urls.crm}   className="underline">{result.urls.crm}</a></p>
              <p>Censo: <a href={result.urls.censo} className="underline">{result.urls.censo}</a></p>
            </div>
            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs font-bold text-amber-800 mb-1">
                ⚠ Contraseña temporal — enviar al pastor de forma segura
              </p>
              <p className="text-xs font-mono text-amber-900">
                Email: {result.admin.email}<br />
                Clave: {result.admin.temp_password}
              </p>
            </div>
            <button
              onClick={() => setResult(null)}
              className="text-xs text-emerald-700 underline"
            >
              Crear otra iglesia
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sección iglesia */}
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Datos de la iglesia</p>

          <div>
            <label className={labelCls}>Nombre completo *</label>
            <input
              className={inputCls}
              placeholder="Comunidad El Refugio"
              value={form.name}
              onChange={set("name")}
              onBlur={handleNameBlur}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Slug * <span className="normal-case font-normal">(único, sin espacios)</span></label>
              <input
                className={inputCls}
                placeholder="el-refugio"
                value={form.slug}
                onChange={set("slug")}
                required
                pattern="[a-z0-9\-]+"
                title="Solo letras minúsculas, números y guiones"
              />
            </div>
            <div>
              <label className={labelCls}>Nombre corto</label>
              <input
                className={inputCls}
                placeholder="El Refugio"
                value={form.short_name}
                onChange={set("short_name")}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Dominio propio * <span className="normal-case font-normal">(sin www)</span></label>
            <input
              className={inputCls}
              placeholder="elrefugio.com"
              value={form.custom_domain}
              onChange={set("custom_domain")}
              required
            />
          </div>

          <div>
            <label className={labelCls}>Plan</label>
            <select className={inputCls} value={form.plan} onChange={set("plan")}>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
            </select>
          </div>

          {/* Sección admin */}
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-2">Admin inicial (pastor / responsable)</p>

          <div>
            <label className={labelCls}>Email *</label>
            <input
              type="email"
              className={inputCls}
              placeholder="pastor@elrefugio.com"
              value={form.admin_email}
              onChange={set("admin_email")}
              required
            />
          </div>

          <div>
            <label className={labelCls}>Nombre del admin</label>
            <input
              className={inputCls}
              placeholder="Pastor Juan García"
              value={form.admin_name}
              onChange={set("admin_name")}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition mt-2"
          >
            {loading ? "Creando iglesia..." : "Crear iglesia y usuario admin"}
          </button>
        </form>
      </div>
    </div>
  );
}
