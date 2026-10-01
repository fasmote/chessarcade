/**
 * ChessArcade - GET /api/scores/keepalive
 *
 * Llamado por Vercel Cron diariamente para mantener Supabase activo.
 * Free tier de Supabase pausa la DB tras 7 días sin actividad — este
 * endpoint ejecuta un SELECT real para que cuente como actividad.
 *
 * Schedule: 0 12 * * * (todos los días a las 12:00 UTC)
 */

import sql from './db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const startedAt = new Date().toISOString();
  console.log(`[keepalive] Ejecutando ping a Supabase — ${startedAt}`);

  try {
    // SELECT real contra la tabla de scores para que cuente como actividad en Supabase
    const result = await sql`SELECT COUNT(*) AS total FROM scores LIMIT 1`;
    const total = result[0]?.total ?? '?';

    console.log(`[keepalive] OK — ${total} scores en DB`);

    return res.status(200).json({
      success: true,
      timestamp: startedAt,
      scores_count: total
    });

  } catch (error) {
    console.error('[keepalive] FALLO — Supabase no respondió:', error.message);
    return res.status(500).json({
      success: false,
      timestamp: startedAt,
      error: error.message
    });
  }
}
