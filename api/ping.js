/**
 * ChessArcade - GET /api/ping
 *
 * Keeps the Supabase database active by making a lightweight query.
 * Called daily by Vercel Cron to prevent Supabase from pausing the project
 * due to inactivity (free tier pauses after 1 week without DB queries).
 */

import sql from './scores/db.js';

export default async function handler(req, res) {
  // Only allow GET and cron invocations
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Lightweight query to keep the DB connection alive
    const result = await sql`SELECT COUNT(*) as total FROM scores`;
    const total = parseInt(result[0].total);

    console.log(`[ping] DB alive. Total scores: ${total}`);

    return res.status(200).json({
      success: true,
      message: 'pong',
      db: 'active',
      total_scores: total,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ping] DB error:', error.message);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
