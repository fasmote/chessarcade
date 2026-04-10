/**
 * ChessArcade - GET /api/scores/keepalive
 *
 * Endpoint llamado por Vercel Cron para mantener la base de datos
 * Supabase activa y evitar que se pause por inactividad (free tier).
 */

import sql from './db.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const result = await sql`SELECT 1 AS alive`;

    return res.status(200).json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Keepalive failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Database unreachable'
    });
  }
}
