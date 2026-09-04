"use client";

import { useState } from "react";

type Client = { name: string | null; email: string | null; room: string | null; coupon: string; confirmed?: boolean };
type Redemption = { reward: string | null; by: string | null; at: string | null };

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-GT", { timeZone: "America/Guatemala", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export default function RedeemForm() {
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"input" | "found" | "already" | "done">("input");
  const [client, setClient] = useState<Client | null>(null);
  const [prev, setPrev] = useState<Redemption | null>(null);
  const [reward, setReward] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [doneMsg, setDoneMsg] = useState("");

  function reset() {
    setCode(""); setStep("input"); setClient(null); setPrev(null);
    setReward(""); setError(""); setDoneMsg("");
  }

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const c = code.trim();
    if (!c) return setError("Ingresa un código.");
    setLoading(true);
    try {
      const res = await fetch("/api/lookup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: c }) });
      const data = await res.json();
      if (data.status === "ok") { setClient(data.client); setStep("found"); }
      else if (data.status === "already_redeemed") { setClient(data.client); setPrev(data.redemption); setStep("already"); }
      else setError("No encontramos ese código. Verifícalo.");
    } catch { setError("Problema de conexión. Inténtalo de nuevo."); }
    finally { setLoading(false); }
  }

  async function redeem() {
    setError("");
    if (!reward.trim()) return setError("Indica qué se le dio al cliente.");
    setLoading(true);
    try {
      const res = await fetch("/api/redeem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: client!.coupon, reward }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "No se pudo canjear."); setLoading(false); return; }
      setDoneMsg(`Cupón ${client!.coupon} canjeado correctamente.`);
      setStep("done");
    } catch { setError("Problema de conexión. Inténtalo de nuevo."); }
    finally { setLoading(false); }
  }

  if (step === "done") {
    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow-lg">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
          <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
        </div>
        <h3 className="mt-4 font-display text-xl font-bold text-barcelo-ink">¡Canje registrado!</h3>
        <p className="mt-2 text-sm text-barcelo-gray">{doneMsg}</p>
        <button onClick={reset} className="mt-6 rounded-lg bg-barcelo-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-barcelo-deep">
          Canjear otro
        </button>
      </div>
    );
  }

  if (step === "already") {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-lg">
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">Este cupón ya fue canjeado.</div>
        <dl className="mt-4 space-y-2 text-sm">
          <Row k="Cliente" v={client?.name || "—"} />
          <Row k="Cupón" v={client?.coupon || "—"} mono />
          <Row k="Habitación" v={client?.room || "—"} />
          <Row k="Qué se le dio" v={prev?.reward || "—"} />
          <Row k="Canjeado por" v={prev?.by || "—"} />
          <Row k="Fecha" v={fmt(prev?.at ?? null)} />
        </dl>
        <button onClick={reset} className="mt-6 w-full rounded-lg border border-barcelo-gray/30 px-4 py-2.5 text-sm font-medium text-barcelo-ink hover:bg-barcelo-cream">
          Buscar otro código
        </button>
      </div>
    );
  }

  if (step === "found") {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-wide text-barcelo-gray">Cupón válido</p>
        <dl className="mt-3 space-y-2 text-sm">
          <Row k="Cliente" v={client?.name || "Sin nombre"} />
          <Row k="Cupón" v={client?.coupon || "—"} mono />
          <Row k="Habitación" v={client?.room || "—"} />
          {client && client.confirmed === false && (
            <p className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">Nota: este correo no fue confirmado por el huésped.</p>
          )}
        </dl>

        <div className="mt-5">
          <label htmlFor="reward" className="mb-1.5 block text-sm font-medium text-barcelo-ink">¿Qué se le dio al cliente?</label>
          <input id="reward" type="text" value={reward} onChange={(e) => setReward(e.target.value)}
            placeholder="Ej. Bebida de bienvenida, postre, 10% de descuento…"
            className="w-full rounded-lg border border-barcelo-gray/30 px-4 py-3 text-base outline-none focus:border-barcelo-teal focus:ring-2 focus:ring-barcelo-teal/20" />
        </div>

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-5 flex gap-3">
          <button onClick={reset} className="rounded-lg border border-barcelo-gray/30 px-4 py-2.5 text-sm font-medium text-barcelo-ink hover:bg-barcelo-cream">Cancelar</button>
          <button onClick={redeem} disabled={loading} className="flex-1 rounded-lg bg-barcelo-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-barcelo-deep disabled:opacity-60">
            {loading ? "Registrando…" : "Confirmar canje"}
          </button>
        </div>
      </div>
    );
  }

  // step input
  return (
    <form onSubmit={lookup} className="rounded-2xl bg-white p-6 shadow-lg">
      <label htmlFor="code" className="mb-1.5 block text-sm font-medium text-barcelo-ink">Código del cupón</label>
      <input id="code" type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="BARCELO-XXXXXX" autoComplete="off"
        className="w-full rounded-lg border border-barcelo-gray/30 px-4 py-3 font-mono text-base tracking-wider outline-none focus:border-barcelo-teal focus:ring-2 focus:ring-barcelo-teal/20" />
      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={loading} className="mt-4 w-full rounded-lg bg-barcelo-teal px-4 py-3 text-base font-semibold text-white hover:bg-barcelo-deep disabled:opacity-60">
        {loading ? "Buscando…" : "Buscar cupón"}
      </button>
    </form>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-barcelo-gray">{k}</dt>
      <dd className={`text-right font-medium text-barcelo-ink ${mono ? "font-mono" : ""}`}>{v}</dd>
    </div>
  );
}
