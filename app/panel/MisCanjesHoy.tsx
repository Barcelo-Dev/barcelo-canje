// Lista de los canjes que hizo HOY el cajero actual (solo lectura).
export type CanjeHoy = {
  id: string;
  full_name: string | null;
  coupon_code: string | null;
  reward_given: string | null;
  coupon_redeemed_at: string | null;
};

function hora(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-GT", { timeZone: "America/Guatemala", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export default function MisCanjesHoy({ rows }: { rows: CanjeHoy[] }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-barcelo-ink">Mis canjes de hoy</h2>
        <span className="rounded-full bg-barcelo-teal/10 px-3 py-1 text-sm font-semibold text-barcelo-deep">
          {rows.length} {rows.length === 1 ? "canje" : "canjes"}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-barcelo-gray/30 bg-white px-4 py-8 text-center text-sm text-barcelo-gray">
          Aún no has canjeado cupones hoy.
        </p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-barcelo-gray/15 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-barcelo-gray/15 text-xs uppercase tracking-wide text-barcelo-gray">
                <th className="px-4 py-3 font-semibold">Hora</th>
                <th className="px-4 py-3 font-semibold">Cliente</th>
                <th className="px-4 py-3 font-semibold">Cupón</th>
                <th className="px-4 py-3 font-semibold">Qué se le dio</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-barcelo-gray/10 last:border-0">
                  <td className="px-4 py-3 text-barcelo-gray">{hora(r.coupon_redeemed_at)}</td>
                  <td className="px-4 py-3 font-medium text-barcelo-ink">{r.full_name || "—"}</td>
                  <td className="px-4 py-3"><span className="font-mono text-xs text-barcelo-deep">{r.coupon_code || "—"}</span></td>
                  <td className="px-4 py-3 text-barcelo-ink/80">{r.reward_given || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
