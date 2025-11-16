/**
 * ChessArcade - Game Limits Configuration
 *
 * Define maximum scores and time limits for each game
 * Used for anti-cheat validation
 */

export const GAME_LIMITS = {
  'square-rush': {
    name: 'Square Rush',
    max_score: 100000,      // Máximo teórico posible
    max_time_ms: 3600000,   // 1 hora máximo (60 min)
    score_type: 'points',
    has_levels: true,
    has_time: true
  },

  'knight-quest': {
    name: 'Knight Quest',
    max_score: 100000,      // Fórmula: casillas×1000 + bonuses (8x8 puede dar ~72,000)
    max_time_ms: 1800000,   // 30 minutos máximo
    score_type: 'points',
    has_levels: true,
    has_time: true
  },

  'memory-matrix': {
    name: 'Memory Matrix',
    max_score: 50000,       // Formula: (level×2000) + (success×200) - (fails×300) - (hints×100) + timeBonus
                            // Max teórico: 16,000 + 16,000 + 1,000 = 33,000
    max_time_ms: 3600000,   // 1 hora máximo
    score_type: 'points',   // Puntos basados en nivel + performance + tiempo
    has_levels: true,
    has_time: true          // Tiene timer global con bonus por rapidez
  },

  'master-sequence': {
    name: 'Master Sequence',
    max_score: 100000,      // Score acumulativo con base + bonos + multiplicadores
    max_time_ms: 3600000,   // 1 hora máximo
    score_type: 'points',   // Puntos acumulativos, no sequence_length
    has_levels: true,       // Tiene niveles progresivos
    has_time: false
  },

  'chessinfive': {
    name: 'ChessInFive',
    max_score: 50000,       // Puntaje máximo basado en victorias y combos
    max_time_ms: 2700000,   // 45 minutos máximo
    score_type: 'wins',
    has_levels: false,
    has_time: true
  }
};

/**
 * Validate if a game ID exists
 * @param {string} gameId - Game identifier
 * @returns {boolean}
 */
export function isValidGame(gameId) {
  return gameId in GAME_LIMITS;
}

/**
 * Get game configuration
 * @param {string} gameId - Game identifier
 * @returns {object|null} Game config or null if not found
 */
export function getGameConfig(gameId) {
  return GAME_LIMITS[gameId] || null;
}

/**
 * Get all game IDs
 * @returns {string[]} Array of game IDs
 */
export function getAllGameIds() {
  return Object.keys(GAME_LIMITS);
}
