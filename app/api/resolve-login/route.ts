import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Traduce un "usuario o correo" al correo con el que Supabase inicia sesión.
export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ email: "" }); }
  const id = String((body as { identificador?: string })?.identificador ?? "").trim();
  if (!id) return NextResponse.json({ email: "" });

  if (id.includes("@")) return NextResponse.json({ email: id.toLowerCase() });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .ilike("username", id)
    .single();

  if (!profile) return NextResponse.json({ email: id });

  const { data } = await admin.auth.admin.getUserById(profile.id);
  return NextResponse.json({ email: data?.user?.email ?? id });
}
