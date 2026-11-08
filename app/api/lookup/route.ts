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
  if (!code) return NextResponse.json({ status: "not_found" });

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscribers")
    .select("full_name, email, room_number, coupon_code, confirmed, coupon_redeemed, coupon_redeemed_at, reward_given, redeemed_by_name, created_at")
    .eq("coupon_code", code)
    .single();

  if (!sub) return NextResponse.json({ status: "not_found" });

  if (sub.coupon_redeemed) {
    return NextResponse.json({
      status: "already_redeemed",
      client: { name: sub.full_name, email: sub.email, room: sub.room_number, coupon: sub.coupon_code },
      redemption: { reward: sub.reward_given, by: sub.redeemed_by_name, at: sub.coupon_redeemed_at },
    });
  }

  // Vigencia: el cupón vence 1 semana después de crearse.
  if (estaVencido(sub.created_at)) {
    return NextResponse.json({
      status: "expired",
      client: { name: sub.full_name, coupon: sub.coupon_code },
      vence: venceTexto(sub.created_at),
    });
  }

  return NextResponse.json({
    status: "ok",
    client: {
      name: sub.full_name, email: sub.email, room: sub.room_number,
      coupon: sub.coupon_code, confirmed: sub.confirmed,
      vence: venceTexto(sub.created_at),
    },
  });
}
