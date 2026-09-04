# Barceló Guatemala City — Canje de cupones

Tercer sitio, con perfiles por rol. Comparte la base de datos de Supabase.

## Roles
- **camarero**: solo canjea cupones y registra qué se le dio al cliente.
- **supervisor**: ve el historial de canjes y exporta (PDF/Excel).
- **admin**: puede canjear y ver/exportar todo.

## Puesta en marcha
1. Ejecuta en Supabase (SQL Editor) el archivo `supabase/migracion-canje.sql`.
   Crea la tabla `profiles`, los campos de canje y asigna 'admin' a los usuarios
   que ya existían.
2. Crea usuarios en Supabase (Authentication > Users > Add user). Cada uno nace
   como 'camarero'. Para cambiar rol/nombre, usa el SQL de ejemplo que está al
   final de la migración.
3. Variables de entorno (Vercel):
   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

## Seguridad
La autorización por rol se valida en el servidor (API routes con service_role):
un camarero no puede ver la lista de canjes ni exportar, aunque lo intente.
