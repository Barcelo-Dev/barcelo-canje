import { createClient } from "@supabase/supabase-js";

// Cliente de servidor con service_role: hace las operaciones de datos
// (buscar/canjear cupones, leer canjes). Ignora RLS, por eso TODA la
// autorización por rol se hace en el servidor antes de usarlo.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
