/**
 * ChessArcade - GET /api/scores/leaderboard
 *
 * Get top scores for a game (with optional filters)
 */

import sql from './db.js';
import { validateLeaderboardParams } from './middleware/validate.js';
import { queryRateLimiter } from './middleware/rate-limit.js';

/**
 * GET /api/scores/leaderboard?game=square-rush&limit=50&country=US&level=MASTER
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.'
    });
  }

  try {
    // 1. Rate limiting
    const rateLimitResult = await queryRateLimiter(req, res);
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        success: false,
        error: rateLimitResult.message,
        retryAfter: rateLimitResult.retryAfter
      });
    }

    // 2. Validate query parameters
    const validation = validateLeaderboardParams(req.query);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    const { game, limit, offset, country, level } = validation.sanitized;

    // 3. Build query with filters
    let query = sql`
      SELECT
        id,
        player_name,
        score,
        level,
        time_ms,
        country_code,
        country_name,
        metadata,
        created_at,
        ROW_NUMBER() OVER (ORDER BY score DESC, created_at ASC) as rank
      FROM scores
      WHERE game = ${game}
    `;

    // Apply optional filters
    const conditions = [];
    const params = [];

    if (country) {
      conditions.push(sql`AND country_code = ${country}`);
    }

    if (level) {
      conditions.push(sql`AND level = ${level}`);
    }

    // Combine filters
    if (conditions.length > 0) {
      query = sql`
        SELECT
          id,
          player_name,
          score,
          level,
          time_ms,
          country_code,
          country_name,
          metadata,
          created_at,
          ROW_NUMBER() OVER (ORDER BY score DESC, created_at ASC) as rank
        FROM scores
        WHERE game = ${game}
          ${country ? sql`AND country_code = ${country}` : sql``}
          ${level ? sql`AND level = ${level}` : sql``}
        ORDER BY score DESC, created_at ASC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else {
      query = sql`
        SELECT
          id,
          player_name,
          score,
          level,
          time_ms,
          country_code,
          country_name,
          metadata,
          created_at,
          ROW_NUMBER() OVER (ORDER BY score DESC, created_at ASC) as rank
        FROM scores
        WHERE game = ${game}
        ORDER BY score DESC, created_at ASC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    }

    const scores = await query;

    // 4. Get total count for pagination
    let countQuery = sql`
      SELECT COUNT(*) as total
      FROM scores
      WHERE game = ${game}
    `;

    if (country || level) {
      countQuery = sql`
        SELECT COUNT(*) as total
        FROM scores
        WHERE game = ${game}
          ${country ? sql`AND country_code = ${country}` : sql``}
          ${level ? sql`AND level = ${level}` : sql``}
      `;
    }

    const totalResult = await countQuery;
    const total = parseInt(totalResult[0].total);

    // 5. Format scores
    const formattedScores = scores.map((score, index) => {
      // Parse metadata if it's a string (from JSONB column)
      let metadata = {};
      if (score.metadata) {
        if (typeof score.metadata === 'string') {
          try {
            metadata = JSON.parse(score.metadata);
          } catch (e) {
            console.error('Failed to parse metadata:', e);
            metadata = {};
          }
        } else {
          metadata = score.metadata;
        }
      }

      return {
        rank: offset + index + 1,
        id: score.id,
        player_name: score.player_name,
        score: score.score,
        level: score.level,
        time_ms: score.time_ms,
        country: {
          code: score.country_code,
          name: score.country_name
        },
        metadata: metadata,
        created_at: score.created_at
      };
    });

    // 6. Return response
    return res.status(200).json({
      success: true,
      data: {
        game,
        scores: formattedScores,
        pagination: {
          limit,
          offset,
          total,
          hasMore: offset + limit < total
        },
        filters: {
          country: country || null,
          level: level || null
        }
      }
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again.'
    });
  }
}
