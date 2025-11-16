/**
 * ChessArcade - Validation Middleware
 *
 * Validates incoming score submissions against game-specific rules
 */

import { GAME_LIMITS } from '../games-config.js';

/**
 * Validate score submission data
 * @param {Object} data - Score submission data
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateScoreSubmission(data) {
  const { game, player_name, score, level, time_ms, country_code } = data;

  // 1. Check required fields
  if (!game || !player_name || score === undefined) {
    return {
      valid: false,
      error: 'Missing required fields: game, player_name, score'
    };
  }

  // 2. Validate game exists
  const gameConfig = GAME_LIMITS[game];
  if (!gameConfig) {
    return {
      valid: false,
      error: `Invalid game: ${game}. Valid games: ${Object.keys(GAME_LIMITS).join(', ')}`
    };
  }

  // 3. Validate player name (1-15 chars, alphanumeric + spaces)
  if (typeof player_name !== 'string' || player_name.length < 1 || player_name.length > 15) {
    return {
      valid: false,
      error: 'player_name must be 1-15 characters'
    };
  }

  // Allow alphanumeric, spaces, and common safe special characters
  // Permitidos: letras, números, espacios, . _ - ! @ # $ % & * ( ) + =
  const nameRegex = /^[a-zA-Z0-9\s._\-!@#$%&*()+=]+$/;
  if (!nameRegex.test(player_name)) {
    return {
      valid: false,
      error: 'player_name contains invalid characters. Allowed: letters, numbers, spaces, and . _ - ! @ # $ % & * ( ) + ='
    };
  }

  // 4. Validate score (must be positive integer)
  if (!Number.isInteger(score) || score < 0) {
    return {
      valid: false,
      error: 'score must be a positive integer'
    };
  }

  // 5. Anti-cheat: Check max score
  if (score > gameConfig.max_score) {
    return {
      valid: false,
      error: `Score too high for ${game}. Max: ${gameConfig.max_score}`
    };
  }

  // 6. Validate time if provided
  if (time_ms !== undefined && time_ms !== null) {
    if (!Number.isInteger(time_ms) || time_ms < 0) {
      return {
        valid: false,
        error: 'time_ms must be a non-negative integer or null'
      };
    }

    // Anti-cheat: Check max time
    if (gameConfig.has_time && time_ms > gameConfig.max_time_ms) {
      return {
        valid: false,
        error: `Time too long for ${game}. Max: ${gameConfig.max_time_ms}ms`
      };
    }
  }

  // 7. Validate level if provided
  if (level !== undefined) {
    if (gameConfig.has_levels) {
      const validLevels = ['NOVICE', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'MASTER'];
      if (!validLevels.includes(level)) {
        return {
          valid: false,
          error: `Invalid level. Valid levels: ${validLevels.join(', ')}`
        };
      }
    }
  }

  // 8. Validate country code if provided (2 letters uppercase)
  if (country_code !== undefined) {
    if (typeof country_code !== 'string' || !/^[A-Z]{2}$/.test(country_code)) {
      return {
        valid: false,
        error: 'country_code must be 2 uppercase letters (e.g., US, AR)'
      };
    }
  }

  // All validations passed
  return { valid: true };
}

/**
 * Validate query parameters for leaderboard
 * @param {Object} params - Query parameters
 * @returns {Object} { valid: boolean, error?: string, sanitized?: Object }
 */
export function validateLeaderboardParams(params) {
  const { game, limit = 50, offset = 0, country, level } = params;

  // 1. Validate game
  if (!game) {
    return {
      valid: false,
      error: 'game parameter is required'
    };
  }

  if (!GAME_LIMITS[game]) {
    return {
      valid: false,
      error: `Invalid game: ${game}`
    };
  }

  // 2. Validate limit (1-100)
  const limitNum = parseInt(limit);
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return {
      valid: false,
      error: 'limit must be between 1 and 100'
    };
  }

  // 3. Validate offset (0+)
  const offsetNum = parseInt(offset);
  if (isNaN(offsetNum) || offsetNum < 0) {
    return {
      valid: false,
      error: 'offset must be 0 or greater'
    };
  }

  // 4. Validate country if provided
  if (country && !/^[A-Z]{2}$/.test(country)) {
    return {
      valid: false,
      error: 'country must be 2 uppercase letters'
    };
  }

  // 5. Validate level if provided
  if (level) {
    const validLevels = ['NOVICE', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'MASTER'];
    if (!validLevels.includes(level)) {
      return {
        valid: false,
        error: `Invalid level. Valid: ${validLevels.join(', ')}`
      };
    }
  }

  return {
    valid: true,
    sanitized: {
      game,
      limit: limitNum,
      offset: offsetNum,
      country,
      level
    }
  };
}

/**
 * Validate search parameters
 * @param {Object} params - Query parameters
 * @returns {Object} { valid: boolean, error?: string, sanitized?: Object }
 */
export function validateSearchParams(params) {
  const { game, player_name, limit = 20 } = params;

  // 1. Validate game
  if (!game) {
    return {
      valid: false,
      error: 'game parameter is required'
    };
  }

  if (!GAME_LIMITS[game]) {
    return {
      valid: false,
      error: `Invalid game: ${game}`
    };
  }

  // 2. Validate player_name
  if (!player_name || typeof player_name !== 'string') {
    return {
      valid: false,
      error: 'player_name parameter is required'
    };
  }

  if (player_name.length < 1 || player_name.length > 15) {
    return {
      valid: false,
      error: 'player_name must be 1-15 characters'
    };
  }

  // 3. Validate limit
  const limitNum = parseInt(limit);
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
    return {
      valid: false,
      error: 'limit must be between 1 and 50'
    };
  }

  return {
    valid: true,
    sanitized: {
      game,
      player_name,
      limit: limitNum
    }
  };
}
