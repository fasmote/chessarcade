-- ================================================
-- ChessArcade - Tabla de Heartbeat (latido del keepalive)
-- ================================================
-- Cada vez que el cron de Vercel llama a /api/scores/keepalive,
-- se inserta una fila acá. Sirve para dos cosas:
--
-- 1. REGISTRO PERMANENTE: Vercel Hobby solo guarda 1 hora de logs,
--    así que sin esta tabla no hay forma de saber si el cron corrió
--    ayer, la semana pasada, o nunca. Con esta tabla alcanza con:
--      SELECT * FROM heartbeat ORDER BY created_at DESC LIMIT 10;
--
-- 2. ACTIVIDAD MÁS FUERTE: un INSERT (escritura) es una señal de uso
--    más clara para Supabase que un SELECT, y reduce el riesgo de que
--    el proyecto free tier se pause por "inactividad".
--
-- Usar en Supabase SQL Editor:
-- 1. Ir a https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- 2. Copiar y pegar este script
-- 3. Ejecutar "Run"

CREATE TABLE IF NOT EXISTS heartbeat (
  -- ID único de cada latido (auto-incremental)
  id SERIAL PRIMARY KEY,

  -- Quién generó el latido: 'cron' si lo llamó Vercel Cron,
  -- 'manual' si alguien abrió la URL a mano para probar
  source VARCHAR(20) NOT NULL DEFAULT 'manual',

  -- Cantidad de scores en la DB en ese momento (dato extra para auditar)
  scores_count INTEGER,

  -- Momento exacto del latido (TIMESTAMPTZ guarda la zona horaria)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índice para que "los últimos N latidos" sea una consulta rápida
CREATE INDEX IF NOT EXISTS idx_heartbeat_created_at ON heartbeat(created_at DESC);

-- Row Level Security activado SIN políticas:
-- - El backend de Vercel se conecta como el usuario "postgres", que ignora RLS,
--   así que el keepalive puede insertar sin problema.
-- - La API pública de Supabase (con la anon key) queda bloqueada:
--   nadie desde afuera puede leer ni ensuciar esta tabla.
ALTER TABLE heartbeat ENABLE ROW LEVEL SECURITY;
