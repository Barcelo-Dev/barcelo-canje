import { NextResponse } from "next/server";
import { getSession, canRedeem } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { estaVencido, venceTexto } from "@/lib/vigencia";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  if (!canRedeem(session.role))
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Petición inválida." }, { status: 400 }); }
  const code = String(body?.code ?? "").trim().toUpperCase();
  const reward = String(body?.reward ?? "").trim();
  if (!code) return NextResponse.json({ error: "Código requerido." }, { status: 400 });
  if (!reward) return NextResponse.json({ error: "Indica qué se le dio al cliente." }, { status: 400 });

  const admin = createAdminClient();

  // Verificar estado actual
  const { data: sub } = await admin
    .from("subscribers")
    .select("id, coupon_redeemed, created_at")
    .eq("coupon_code", code)
    .single();

  if (!sub) return NextResponse.json({ error: "Cupón no encontrado." }, { status: 404 });
  if (sub.coupon_redeemed)
    return NextResponse.json({ error: "Este cupón ya fue canjeado." }, { status: 409 });
  if (estaVencido(sub.created_at))
    return NextResponse.json({ error: `Este cupón venció el ${venceTexto(sub.created_at)}.` }, { status: 410 });

  const who = session.name || session.email || "Personal";
  const { error } = await admin
    .from("subscribers")
    .update({
      coupon_redeemed: true,
      coupon_redeemed_at: new Date().toISOString(),
      reward_given: reward,
      redeemed_by_name: who,
      redeemed_by_id: session.userId,
    })
    .eq("id", sub.id)
    .eq("coupon_redeemed", false); // evita doble canje simultáneo

  if (error) return NextResponse.json({ error: "No se pudo canjear. Inténtalo de nuevo." }, { status: 500 });

  return NextResponse.json({ ok: true, by: who });
}
