import { NextResponse } from "next/server";
import { getSession } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";

const MANAGEABLE = ["camarero", "supervisor", "admin"]; // roles asignables (los tres son distintos)

async function totalAdmins(admin: ReturnType<typeof createAdminClient>) {
  const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin");
  return count ?? 0;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  if (session.role !== "admin")
    return NextResponse.json({ error: "Solo un administrador puede gestionar usuarios." }, { status: 403 });

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Petición inválida." }, { status: 400 }); }

  const action = String(body?.action ?? "");
  const admin = createAdminClient();

  // --- Crear usuario ---
  if (action === "create") {
    const email = String(body?.email ?? "").trim().toLowerCase();
    const username = String(body?.username ?? "").trim();
    const password = String(body?.password ?? "");
    const role = String(body?.role ?? "camarero");
    const fullName = String(body?.fullName ?? "").trim() || null;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ error: "Correo inválido." }, { status: 400 });
    if (username && !/^[a-zA-Z0-9._-]{3,30}$/.test(username))
      return NextResponse.json({ error: "El usuario debe tener 3–30 caracteres (letras, números, . _ -)." }, { status: 400 });
    if (password.length < 6)
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
    if (!MANAGEABLE.includes(role))
      return NextResponse.json({ error: "Rol no permitido." }, { status: 400 });
    if (username) {
      const { data: tomado } = await admin.from("profiles").select("id").ilike("username", username).maybeSingle();
      if (tomado) return NextResponse.json({ error: "Ese nombre de usuario ya existe." }, { status: 400 });
    }

    const { data, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (error || !data.user) {
      const msg = error?.message?.includes("already") ? "Ese correo ya existe." : "No se pudo crear el usuario.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Asegura el perfil con el rol, nombre y usuario elegidos.
    await admin.from("profiles").upsert({ id: data.user.id, role, full_name: fullName, username: username || null });
    return NextResponse.json({ ok: true });
  }

  // --- Cambiar rol ---
  if (action === "setRole") {
    const id = String(body?.id ?? "");
    const role = String(body?.role ?? "");
    if (!id) return NextResponse.json({ error: "Usuario no indicado." }, { status: 400 });
    if (!MANAGEABLE.includes(role))
      return NextResponse.json({ error: "Rol no permitido." }, { status: 400 });
    if (id === session.userId)
      return NextResponse.json({ error: "No puedes cambiar tu propio rol." }, { status: 400 });

    // No dejar al sistema sin ningún administrador.
    const { data: target } = await admin.from("profiles").select("role").eq("id", id).single();
    if (target?.role === "admin" && role !== "admin" && (await totalAdmins(admin)) <= 1)
      return NextResponse.json({ error: "Debe quedar al menos un administrador." }, { status: 400 });

    const { error } = await admin.from("profiles").update({ role }).eq("id", id);
    if (error) return NextResponse.json({ error: "No se pudo cambiar el rol." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // --- Eliminar usuario ---
  if (action === "delete") {
    const id = String(body?.id ?? "");
    if (!id) return NextResponse.json({ error: "Usuario no indicado." }, { status: 400 });
    if (id === session.userId)
      return NextResponse.json({ error: "No puedes eliminar tu propia cuenta." }, { status: 400 });

    const { data: target } = await admin.from("profiles").select("role").eq("id", id).single();
    if (target?.role === "admin" && (await totalAdmins(admin)) <= 1)
      return NextResponse.json({ error: "Debe quedar al menos un administrador." }, { status: 400 });

    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) return NextResponse.json({ error: "No se pudo eliminar el usuario." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
}
