"use client";
import React, { useEffect, useState } from "react";
import { base44 } from "@crm/api/base44Client";
import { supabase } from "@crm/api/supabaseClient";
import { Card } from "@crm/components/ui/card";
import { Button } from "@crm/components/ui/button";
import { Input } from "@crm/components/ui/input";
import { Label } from "@crm/components/ui/label";
import { Badge } from "@crm/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@crm/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@crm/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@crm/components/ui/alert-dialog";
import { UserPlus, Pencil, Trash2, ToggleLeft, ToggleRight, Users, ShieldAlert } from "lucide-react";

export default function UserManagement() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "user" });
  const [editForm, setEditForm] = useState({ role: "user" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) { setLoading(false); return; }
      const u = {
        id: session.user.id,
        email: session.user.email,
        role: session.user.user_metadata?.role ?? "user",
      };
      setCurrentUser(u);
      if (u.role === "admin") loadUsers();
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('listUsers', {});
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("Error cargando usuarios:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteForm.email) return;
    setSaving(true);
    await base44.users.inviteUser(inviteForm.email, inviteForm.role);
    setShowInviteModal(false);
    setInviteForm({ email: "", role: "user" });
    setSaving(false);
    await loadUsers();
  };

  const handleEdit = async () => {
    setSaving(true);
    await base44.functions.invoke('updateUser', { id: editTarget.id, role: editForm.role });
    setShowEditModal(false);
    setEditTarget(null);
    setSaving(false);
    await loadUsers();
  };

  const handleToggleActive = async (user) => {
    await base44.functions.invoke('updateUser', { id: user.id, is_active: !user.is_active });
    await loadUsers();
  };

  const handleDelete = async () => {
    await base44.functions.invoke('deleteUser', { id: deleteTarget.id });
    setDeleteTarget(null);
    await loadUsers();
  };

  const openEdit = (user) => {
    setEditTarget(user);
    setEditForm({ role: user.role || "user" });
    setShowEditModal(true);
  };

  if (currentUser && currentUser.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <ShieldAlert className="w-16 h-16 text-red-400" />
        <h2 className="text-2xl font-bold text-slate-800">Acceso Restringido</h2>
        <p className="text-slate-500">Solo los administradores pueden acceder a esta sección.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Gestión de Usuarios</h1>
          <p className="text-slate-500 mt-1">Administra los accesos al sistema CFC CASA CRM</p>
        </div>
        <Button
          onClick={() => setShowInviteModal(true)}
          className="bg-red-500 hover:bg-red-600 text-white gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Invitar Usuario
        </Button>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Users className="w-12 h-12 text-slate-300" />
            <p className="text-slate-500">No hay usuarios registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Nombre</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Email</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Rol</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Estado</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-400 to-rose-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {user.full_name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <span className="font-medium text-slate-800">{user.full_name || "—"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <Badge className={user.role === "admin"
                        ? "bg-amber-100 text-amber-800 border-0"
                        : "bg-slate-100 text-slate-700 border-0"}>
                        {user.role === "admin" ? "Admin" : "Usuario"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={user.is_active !== false
                        ? "bg-emerald-100 text-emerald-700 border-0"
                        : "bg-slate-100 text-slate-500 border-0"}>
                        {user.is_active !== false ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-indigo-600"
                          title="Editar rol"
                          onClick={() => openEdit(user)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className={`h-8 w-8 ${user.is_active !== false ? "text-emerald-600 hover:text-slate-600" : "text-slate-400 hover:text-emerald-600"}`}
                          title={user.is_active !== false ? "Desactivar" : "Activar"}
                          onClick={() => handleToggleActive(user)}
                          disabled={user.id === currentUser?.id}
                        >
                          {user.is_active !== false
                            ? <ToggleRight className="w-5 h-5" />
                            : <ToggleLeft className="w-5 h-5" />}
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-red-600"
                          title="Eliminar"
                          onClick={() => setDeleteTarget(user)}
                          disabled={user.id === currentUser?.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Invite Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitar Nuevo Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="usuario@email.com"
                value={inviteForm.email}
                onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Rol</Label>
              <Select value={inviteForm.role} onValueChange={v => setInviteForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuario</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-slate-400">Se enviará un email de invitación para que el usuario configure su contraseña.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>Cancelar</Button>
            <Button onClick={handleInvite} disabled={saving || !inviteForm.email} className="bg-red-500 hover:bg-red-600 text-white">
              {saving ? "Enviando..." : "Enviar Invitación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-600 font-medium">{editTarget?.full_name} — {editTarget?.email}</p>
            <div className="space-y-1">
              <Label>Rol</Label>
              <Select value={editForm.role} onValueChange={v => setEditForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuario</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={saving} className="bg-red-500 hover:bg-red-600 text-white">
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente a <strong>{deleteTarget?.full_name || deleteTarget?.email}</strong> del sistema. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}