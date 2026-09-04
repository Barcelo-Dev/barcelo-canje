import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type Role = "camarero" | "supervisor" | "admin";

export type SessionInfo = {
  userId: string;
  email: string | null;
  role: Role | null;
  name: string | null;
};

// Obtiene el usuario logueado y su rol (leído por service_role).
export async function getSession(): Promise<SessionInfo | null> {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  return {
    userId: user.id,
    email: user.email ?? null,
    role: (profile?.role as Role) ?? null,
    name: profile?.full_name ?? null,
  };
}

export const canRedeem = (r: Role | null) => r === "camarero" || r === "admin";
export const canView = (r: Role | null) => r === "supervisor" || r === "admin";
