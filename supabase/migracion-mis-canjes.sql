-- ============================================================
--  Migración: guardar el id de quién canjeó cada cupón
--  Permite mostrarle al cajero "Mis canjes de hoy" con exactitud.
--  Ejecutar UNA vez en Supabase > SQL Editor.
-- ============================================================

alter table public.subscribers
  add column if not exists redeemed_by_id uuid;

-- Índice para consultar rápido los canjes de un cajero.
create index if not exists idx_subscribers_redeemed_by
  on public.subscribers (redeemed_by_id);
