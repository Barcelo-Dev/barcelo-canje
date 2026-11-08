// Vigencia de los cupones: 1 semana desde que se crean.
export const DIAS_VIGENCIA = 7;

export function fechaVence(createdAtIso: string): Date {
  return new Date(new Date(createdAtIso).getTime() + DIAS_VIGENCIA * 864e5);
}

export function estaVencido(createdAtIso: string): boolean {
  return Date.now() > fechaVence(createdAtIso).getTime();
}

// Fecha de vencimiento legible (DD/MM/AAAA, hora de Guatemala).
export function venceTexto(createdAtIso: string): string {
  return new Intl.DateTimeFormat("es-GT", {
    timeZone: "America/Guatemala", day: "2-digit", month: "2-digit", year: "numeric",
  }).format(fechaVence(createdAtIso));
}
