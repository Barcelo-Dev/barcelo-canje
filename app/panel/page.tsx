import { redirect } from "next/navigation";
import { getSession, canRedeem, canView } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import RedeemForm from "./RedeemForm";
import RedemptionsView, { type Redemption } from "./RedemptionsView";
import MisCanjesHoy, { type CanjeHoy } from "./MisCanjesHoy";

export const dynamic = "force-dynamic";

// Instante UTC del inicio de HOY en hora de Guatemala (00:00 GT = 06:00 UTC).
function inicioHoyGT() {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guatemala", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const g = (t: string) => Number(p.find(x => x.type === t)!.value);
  return new Date(Date.UTC(g("year"), g("month") - 1, g("day"), 6, 0, 0)).toISOString();
}

const roleLabel: Record<string, string> = {
  camarero: "Camarero",
  supervisor: "Supervisor",
  admin: "Administrador",
};

export default async function PanelPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const canR = canRedeem(session.role);
  const canV = canView(session.role);
  const admin = createAdminClient();

  // Canjes de HOY del cajero actual (para quien puede canjear).
  let misCanjes: CanjeHoy[] = [];
  if (canR) {
    const { data } = await admin
      .from("subscribers")
      .select("id, full_name, coupon_code, reward_given, coupon_redeemed_at")
      .eq("coupon_redeemed", true)
      .eq("redeemed_by_id", session.userId)
      .gte("coupon_redeemed_at", inicioHoyGT())
      .order("coupon_redeemed_at", { ascending: false });
    misCanjes = (data ?? []) as CanjeHoy[];
  }

  // Historial completo solo si el rol puede verlo (supervisor/admin).
  let redemptions: Redemption[] = [];
  if (canV) {
    const { data } = await admin
      .from("subscribers")
      .select("id, full_name, email, room_number, coupon_code, reward_given, redeemed_by_name, coupon_redeemed_at")
      .eq("coupon_redeemed", true)
      .order("coupon_redeemed_at", { ascending: false });
    redemptions = (data ?? []) as Redemption[];
  }

  return (
    <div className="min-h-[100svh]">
      <header className="border-b border-barcelo-gray/15 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-6">
          <img src="/logo.png" alt="Barceló Guatemala City" className="h-7 w-auto" />
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Identidad del usuario */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-barcelo-teal/10 text-sm font-bold uppercase text-barcelo-deep">
                {(session.username || session.name || session.email || "?").charAt(0)}
              </div>
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-semibold text-barcelo-ink">{session.username || session.name || session.email}</p>
                <p className="text-xs text-barcelo-gray">{roleLabel[session.role ?? ""] ?? "Sin rol"}</p>
              </div>
            </div>

            <div className="h-6 w-px bg-barcelo-gray/20" />

            {session.role === "admin" && (
              <a href="/panel/usuarios" className="rounded-lg border border-barcelo-gray/30 px-3 py-1.5 text-sm font-medium text-barcelo-ink transition hover:bg-barcelo-cream">
                Usuarios
              </a>
            )}
            <form action="/auth/signout" method="post">
              <button type="submit" className="rounded-lg border border-barcelo-gray/30 px-3 py-1.5 text-sm font-medium text-barcelo-ink transition hover:bg-barcelo-cream">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-6">
        {!session.role && (
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Tu usuario no tiene un rol asignado. Contacta al administrador.
          </div>
        )}

        {canR && (
          <section className={canV ? "mb-10" : ""}>
            <div className="mx-auto max-w-lg text-center">
              <h1 className="font-display text-2xl font-bold text-barcelo-ink">Canjear cupón</h1>
              <p className="mt-1 text-sm text-barcelo-gray">
                Ingresa el código que presenta el huésped y registra qué se le entregó.
              </p>
              <div className="mt-5 text-left">
                <RedeemForm />
              </div>
            </div>

            {/* Mis canjes de hoy (del cajero actual) */}
            <div className="mt-10">
              <MisCanjesHoy rows={misCanjes} />
            </div>
          </section>
        )}

        {canV && (
          <section>
            <h2 className="font-display text-2xl font-bold text-barcelo-ink">Canjes realizados</h2>
            <p className="mt-1 text-sm text-barcelo-gray">
              Historial de cupones canjeados. Puedes exportarlo en PDF o Excel.
            </p>
            <div className="mt-5">
              <RedemptionsView rows={redemptions} />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
