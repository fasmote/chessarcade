/**
 * ChessArcade - GET /api/scores/keepalive
 *
 * Llamado por Vercel Cron diariamente para mantener Supabase activo.
 * Free tier de Supabase pausa la DB tras 7 días sin actividad — este
 * endpoint hace una consulta real y además ESCRIBE un "latido" en la
 * tabla heartbeat (ver sql/create_heartbeat_table.sql).
 *
 * ¿Por qué escribir y no solo leer?
 * - Un INSERT es una señal de actividad más fuerte que un SELECT.
 * - Queda un registro permanente de cada ejecución. Vercel Hobby solo
 *   guarda 1 hora de logs, así que sin esto no hay forma de saber si
 *   el cron estuvo corriendo. Para verificarlo, en Supabase SQL Editor:
 *     SELECT * FROM heartbeat ORDER BY created_at DESC LIMIT 10;
 *
 * Schedule: 0 12 * * * (todos los días a las 12:00 UTC)
 */

import sql from './db.js';

// Cuántos días de latidos conservar. Con 1 latido por día son ~90 filas:
// suficiente historial para diagnosticar, sin que la tabla crezca para siempre.
const HEARTBEAT_RETENTION_DAYS = 90;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const startedAt = new Date().toISOString();

  // Vercel Cron llama al endpoint con el User-Agent "vercel-cron/1.0".
  // Así distinguimos en la tabla los latidos automáticos de las pruebas manuales
  // (por ejemplo, cuando alguien abre la URL en el navegador para probar).
  const userAgent = req.headers['user-agent'] || '';
  const source = userAgent.includes('vercel-cron') ? 'cron' : 'manual';

  console.log(`[keepalive] Ejecutando ping a Supabase (${source}) — ${startedAt}`);

  try {
    // 1. Lectura: contar scores (dato útil para el log y para la fila del latido)
    const result = await sql`SELECT COUNT(*) AS total FROM scores`;
    const total = parseInt(result[0]?.total ?? 0);

    // 2. Escritura: registrar el latido. Esta es la parte que deja rastro permanente.
    await sql`
      INSERT INTO heartbeat (source, scores_count)
      VALUES (${source}, ${total})
    `;

    // 3. Limpieza: borrar latidos más viejos que el período de retención,
    //    para que la tabla no crezca indefinidamente.
    await sql`
      DELETE FROM heartbeat
      WHERE created_at < NOW() - make_interval(days => ${HEARTBEAT_RETENTION_DAYS})
    `;

    console.log(`[keepalive] OK — ${total} scores en DB, latido registrado`);

    return res.status(200).json({
      success: true,
      timestamp: startedAt,
      source,
      scores_count: total
    });

  } catch (error) {
    // Si la DB está pausada, la conexión falla acá. Ojo: este endpoint NO puede
    // despertar una DB pausada — hay que restaurarla a mano desde el dashboard
    // de Supabase (ver docs/admin/ADMIN_Y_MANTENIMIENTO.md).
    console.error('[keepalive] FALLO — Supabase no respondió:', error.message);
    return res.status(500).json({
      success: false,
      timestamp: startedAt,
      error: error.message
    });
  }
}
