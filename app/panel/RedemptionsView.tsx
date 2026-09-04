"use client";

import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export type Redemption = {
  id: string;
  full_name: string | null;
  email: string | null;
  room_number: string | null;
  coupon_code: string | null;
  reward_given: string | null;
  redeemed_by_name: string | null;
  coupon_redeemed_at: string | null;
};

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-GT", { timeZone: "America/Guatemala", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}
function today() {
  return new Intl.DateTimeFormat("es-GT", { timeZone: "America/Guatemala", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date());
}

const HEADERS = ["Cliente", "Correo", "Habitación", "Cupón", "Qué se le dio", "Canjeado por", "Fecha"];

function rowValues(r: Redemption) {
  return [
    r.full_name || "—",
    r.email || "—",
    r.room_number || "—",
    r.coupon_code || "—",
    r.reward_given || "—",
    r.redeemed_by_name || "—",
    fmt(r.coupon_redeemed_at),
  ];
}

export default function RedemptionsView({ rows }: { rows: Redemption[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter(r =>
      (r.full_name ?? "").toLowerCase().includes(q) ||
      (r.email ?? "").toLowerCase().includes(q) ||
      (r.coupon_code ?? "").toLowerCase().includes(q) ||
      (r.reward_given ?? "").toLowerCase().includes(q) ||
      (r.redeemed_by_name ?? "").toLowerCase().includes(q)
    );
  }, [rows, query]);

  function exportExcel() {
    const data = [
      ["Barceló Guatemala City — Reporte de canjes de cupones"],
      [`Generado: ${today()}`, "", "", "", `Total: ${filtered.length}`],
      [],
      HEADERS,
      ...filtered.map(rowValues),
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws["!cols"] = [{ wch: 22 }, { wch: 28 }, { wch: 11 }, { wch: 16 }, { wch: 28 }, { wch: 20 }, { wch: 18 }];
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Canjes");
    XLSX.writeFile(wb, `barcelo-canjes-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function exportPDF() {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth();

    // Encabezado con banda teal
    doc.setFillColor(47, 92, 120); // barcelo deep
    doc.rect(0, 0, W, 64, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Barceló Guatemala City", 40, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Reporte de canjes de cupones", 40, 48);
    doc.setFontSize(9);
    doc.text(`Generado: ${today()}   ·   Total: ${filtered.length}`, W - 40, 40, { align: "right" });

    autoTable(doc, {
      startY: 80,
      head: [HEADERS],
      body: filtered.map(rowValues),
      styles: { fontSize: 8, cellPadding: 5, overflow: "linebreak" },
      headStyles: { fillColor: [31, 125, 156], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [246, 244, 239] },
      margin: { left: 40, right: 40 },
      didDrawPage: () => {
        const h = doc.internal.pageSize.getHeight();
        doc.setFontSize(8);
        doc.setTextColor(142, 144, 145);
        doc.text("Barceló Guatemala City — Documento interno", 40, h - 20);
      },
    });

    doc.save(`barcelo-canjes-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por cliente, cupón, quién canjeó…"
          className="w-full rounded-lg border border-barcelo-gray/30 px-4 py-2 text-sm outline-none focus:border-barcelo-teal focus:ring-2 focus:ring-barcelo-teal/20 sm:max-w-xs" />
        <div className="flex gap-2">
          <button onClick={exportPDF} disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-barcelo-teal px-4 py-2 text-sm font-semibold text-barcelo-teal transition hover:bg-barcelo-teal/5 disabled:opacity-50">
            PDF
          </button>
          <button onClick={exportExcel} disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-barcelo-teal px-4 py-2 text-sm font-semibold text-white transition hover:bg-barcelo-deep disabled:opacity-50">
            Excel
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 text-sm text-barcelo-gray">
        <span><span className="font-semibold text-barcelo-deep">{rows.length}</span> canjes en total</span>
        <span>·</span>
        <span>{filtered.length} en vista</span>
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl border border-barcelo-gray/15 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-barcelo-gray/15 text-xs uppercase tracking-wide text-barcelo-gray">
              <th className="px-4 py-3 font-semibold">Cliente</th>
              <th className="px-4 py-3 font-semibold">Hab.</th>
              <th className="px-4 py-3 font-semibold">Cupón</th>
              <th className="px-4 py-3 font-semibold">Qué se le dio</th>
              <th className="px-4 py-3 font-semibold">Canjeó</th>
              <th className="px-4 py-3 font-semibold">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-barcelo-gray">Aún no hay canjes.</td></tr>
            ) : filtered.map(r => (
              <tr key={r.id} className="border-b border-barcelo-gray/10 last:border-0 hover:bg-barcelo-cream/50">
                <td className="px-4 py-3 font-medium text-barcelo-ink">{r.full_name || "—"}</td>
                <td className="px-4 py-3 text-barcelo-ink/80">{r.room_number || "—"}</td>
                <td className="px-4 py-3"><span className="font-mono text-xs text-barcelo-deep">{r.coupon_code || "—"}</span></td>
                <td className="px-4 py-3 text-barcelo-ink/80">{r.reward_given || "—"}</td>
                <td className="px-4 py-3 text-barcelo-ink/80">{r.redeemed_by_name || "—"}</td>
                <td className="px-4 py-3 text-barcelo-gray">{fmt(r.coupon_redeemed_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
