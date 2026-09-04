"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type ManagedUser = {
  id: string;
  email: string;
  role: "camarero" | "supervisor" | "admin";
  full_name: string | null;
  created_at: string;
};

const roleLabel: Record<string, string> = { camarero: "Camarero", supervisor: "Supervisor", admin: "Administrador" };

export default function UsuariosClient({ users, currentUserId }: { users: ManagedUser[]; currentUserId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"camarero" | "supervisor">("camarero");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function call(action: string, payload: Record<string, unknown>) {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ type: "err", text: data.error ?? "Error." }); return false; }
      return true;
    } catch {
      setMsg({ type: "err", text: "Problema de conexión." }); return false;
    } finally { setBusy(false); }
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    const ok = await call("create", { email, password, role, fullName });
    if (ok) {
      setMsg({ type: "ok", text: `Usuario ${email} creado como ${roleLabel[role].toLowerCase()}.` });
      setEmail(""); setFullName(""); setPassword(""); setRole("camarero");
      router.refresh();
    }
  }

  async function changeRole(id: string, newRole: string) {
    const ok = await call("setRole", { id, role: newRole });
    if (ok) { setMsg({ type: "ok", text: "Rol actualizado." }); router.refresh(); }
  }

  async function deleteUser(id: string, email: string) {
    if (!confirm(`¿Eliminar al usuario ${email}? Esta acción no se puede deshacer.`)) return;
    const ok = await call("delete", { id });
    if (ok) { setMsg({ type: "ok", text: "Usuario eliminado." }); router.refresh(); }
  }

  return (
    <div>
      {/* Crear usuario */}
      <div className="rounded-2xl border border-barcelo-gray/15 bg-white p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold text-barcelo-deep">Crear usuario</h2>
        <form onSubmit={createUser} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-barcelo-ink">Correo</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg border border-barcelo-gray/30 px-4 py-2.5 outline-none focus:border-barcelo-teal focus:ring-2 focus:ring-barcelo-teal/20" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-barcelo-ink">Nombre <span className="text-barcelo-gray">(opcional)</span></label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
              className="w-full rounded-lg border border-barcelo-gray/30 px-4 py-2.5 outline-none focus:border-barcelo-teal focus:ring-2 focus:ring-barcelo-teal/20" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-barcelo-ink">Contraseña</label>
            <input type="text" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full rounded-lg border border-barcelo-gray/30 px-4 py-2.5 outline-none focus:border-barcelo-teal focus:ring-2 focus:ring-barcelo-teal/20" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-barcelo-ink">Rol</label>
            <select value={role} onChange={e => setRole(e.target.value as "camarero" | "supervisor")}
              className="w-full rounded-lg border border-barcelo-gray/30 bg-white px-3 py-2.5 outline-none focus:border-barcelo-teal">
              <option value="camarero">Camarero</option>
              <option value="supervisor">Supervisor</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={busy}
              className="rounded-lg bg-barcelo-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-barcelo-deep disabled:opacity-60">
              {busy ? "Guardando…" : "Crear usuario"}
            </button>
          </div>
        </form>
        {msg && (
          <p className={`mt-4 rounded-lg px-3 py-2 text-sm ${msg.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {msg.text}
          </p>
        )}
      </div>

      {/* Lista de usuarios */}
      <div className="mt-8 overflow-x-auto rounded-xl border border-barcelo-gray/15 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-barcelo-gray/15 text-xs uppercase tracking-wide text-barcelo-gray">
              <th className="px-4 py-3 font-semibold">Correo</th>
              <th className="px-4 py-3 font-semibold">Nombre</th>
              <th className="px-4 py-3 font-semibold">Rol</th>
              <th className="px-4 py-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const isSelf = u.id === currentUserId;
              const isAdmin = u.role === "admin";
              return (
                <tr key={u.id} className="border-b border-barcelo-gray/10 last:border-0">
                  <td className="px-4 py-3 font-medium text-barcelo-ink">
                    {u.email}{isSelf && <span className="ml-2 text-xs text-barcelo-gray">(tú)</span>}
                  </td>
                  <td className="px-4 py-3 text-barcelo-ink/80">{u.full_name || "—"}</td>
                  <td className="px-4 py-3">
                    {isAdmin || isSelf ? (
                      <span className="inline-block rounded-full bg-barcelo-cream px-2.5 py-0.5 text-xs font-medium text-barcelo-deep">{roleLabel[u.role]}</span>
                    ) : (
                      <select value={u.role} onChange={e => changeRole(u.id, e.target.value)} disabled={busy}
                        className="rounded-lg border border-barcelo-gray/30 bg-white px-2 py-1 text-sm outline-none focus:border-barcelo-teal">
                        <option value="camarero">Camarero</option>
                        <option value="supervisor">Supervisor</option>
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isAdmin || isSelf ? (
                      <span className="text-xs text-barcelo-gray">—</span>
                    ) : (
                      <button onClick={() => deleteUser(u.id, u.email)} disabled={busy}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60">
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-barcelo-gray">
        Los administradores aparecen bloqueados: se crean y modifican en Supabase por seguridad.
      </p>
    </div>
  );
}
