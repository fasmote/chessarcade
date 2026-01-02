/**
 * ChessArcade - Leaderboard API Client
 *
 * Este módulo proporciona funciones para interactuar con el backend API
 * deployed en Vercel. Actúa como un "wrapper" (envoltorio) que simplifica
 * las llamadas a la API desde los juegos.
 *
 * ¿Por qué usamos fetch()?
 * - fetch() es la API moderna de JavaScript para hacer peticiones HTTP
 * - Devuelve Promises, lo que permite usar async/await
 * - Es nativa del browser, no necesita librerías externas
 *
 * Arquitectura:
 * Frontend (Hostinger) → fetch() → Backend API (Vercel) → Supabase DB
 *
 * @author ChessArcade Team
 * @version 2.0.0
 */

// ===========================================================================
// CONFIGURACIÓN
// ===========================================================================

/**
 * URL base del backend API
 *
 * ARQUITECTURA ACTUAL:
 * - Frontend: Hostinger (chessarcade.com.ar)
 * - Backend: Vercel (chessarcade.vercel.app)
 *
 * Lógica:
 * - localhost:3000 (vercel dev) → http://localhost:3000/api/scores
 * - chessarcade.com.ar (Hostinger) → https://chessarcade.vercel.app/api/scores
 * - Cualquier dominio de Vercel → /api/scores (ruta relativa)
 *
 * NOTA: Ver DEPLOYMENT_PLAN.md para más detalles sobre la arquitectura
 */
const API_BASE_URL = (() => {
    const hostname = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol;

    // ✅ file:// protocol (desarrollo local sin servidor) → apuntar a Vercel
    if (protocol === 'file:') {
        console.log('[leaderboard-api] Running from file:// → using Vercel API');
        return 'https://chessarcade.vercel.app/api/scores';
    }

    // Desarrollo local con vercel dev
    if (hostname === 'localhost' && port === '3000') {
        return 'http://localhost:3000/api/scores';
    }

    // Producción en Hostinger → apuntar a Vercel
    if (hostname === 'chessarcade.com.ar' || hostname === 'www.chessarcade.com.ar') {
        return 'https://chessarcade.vercel.app/api/scores';
    }

    // Si estamos en Vercel (preview o producción) → ruta relativa
    if (hostname.includes('vercel.app')) {
        return '/api/scores';
    }

    // Localhost en cualquier otro puerto (http-server, etc.) → apuntar a Vercel
    if (hostname === 'localhost') {
        return 'https://chessarcade.vercel.app/api/scores';
    }

    // Default: ruta relativa
    return '/api/scores';
})();

/**
 * Timeout para requests (15 segundos)
 * Si la API no responde en 15s, cancelamos el request
 */
const REQUEST_TIMEOUT = 15000;

// ===========================================================================
// FUNCIONES AUXILIARES
// ===========================================================================

/**
 * Cache para el país detectado (para no hacer múltiples requests)
 * Se guarda en memoria durante la sesión del usuario
 */
let cachedCountry = null;

/**
 * Detecta automáticamente el país del usuario usando su IP
 *
 * Usa la API gratuita de geojs.io para detectar el país basado en la IP.
 * El resultado se cachea en memoria para evitar múltiples requests.
 *
 * API usada: https://get.geojs.io/v1/ip/country.json
 * - Gratis
 * - No requiere API key
 * - Devuelve: { country_code: "AR", country: "Argentina", ip: "..." }
 *
 * @returns {Promise<object|null>} - { code: "AR", name: "Argentina" } o null si falla
 */
async function detectUserCountry() {
  // Si ya detectamos el país antes, usar el cache
  if (cachedCountry) {
    return cachedCountry;
  }

  try {
    // Timeout corto (3 segundos) para no retrasar el submit
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch('https://get.geojs.io/v1/ip/country.json', {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Geolocation API error');
    }

    const data = await response.json();

    // Cachear el resultado
    cachedCountry = {
      code: data.country_code || data.country, // Algunos endpoints usan country_code, otros country
      name: data.name || data.country // name es el nombre completo
    };

    console.log('[detectUserCountry] Country detected:', cachedCountry);
    return cachedCountry;

  } catch (error) {
    console.warn('[detectUserCountry] Could not detect country:', error.message);
    // Si falla, devolver null (el score se guardará sin país)
    return null;
  }
}

/**
 * Hace un fetch con timeout
 *
 * ¿Por qué necesitamos timeout?
 * - Si la API está lenta o no responde, el usuario no debe esperar forever
 * - Después de 15s, es mejor mostrar un error y dejar que reintente
 *
 * @param {string} url - URL a hacer fetch
 * @param {object} options - Opciones de fetch
 * @param {number} timeout - Timeout en ms (default: 15000)
 * @returns {Promise<Response>} - Response de fetch
 */
async function fetchWithTimeout(url, options = {}, timeout = REQUEST_TIMEOUT) {
  // AbortController nos permite cancelar un fetch en progreso
  const controller = new AbortController();
  const signal = controller.signal;

  // Crear un timeout que cancele el fetch después de X ms
  const timeoutId = setTimeout(() => {
    controller.abort(); // Cancela el fetch
  }, timeout);

  try {
    // Hacer el fetch con la signal para poder cancelarlo
    const response = await fetch(url, {
      ...options,
      signal // Conecta el AbortController al fetch
    });

    // Si llegamos aquí, el fetch fue exitoso, limpiar el timeout
    clearTimeout(timeoutId);
    return response;

  } catch (error) {
    clearTimeout(timeoutId);

    // Si el error es por abort, significa que se acabó el timeout
    if (error.name === 'AbortError') {
      throw new Error('Request timeout: La API tardó demasiado en responder');
    }

    // Cualquier otro error (red, CORS, etc)
    throw error;
  }
}

/**
 * Procesa la respuesta de la API
 *
 * Todas nuestras respuestas tienen el formato:
 * { success: true/false, data: {...} } o { success: false, error: "mensaje" }
 *
 * @param {Response} response - Response de fetch
 * @returns {Promise<object>} - Data parseada
 * @throws {Error} - Si la respuesta no es exitosa
 */
async function processResponse(response) {
  // Obtener el texto de la respuesta primero
  const responseText = await response.text();

  // Intentar parsear como JSON
  let data;
  try {
    data = JSON.parse(responseText);
  } catch (parseError) {
    // Si no es JSON válido, el servidor devolvió un error como texto plano
    console.error('[leaderboard-api] Server returned non-JSON response:', responseText);
    throw new Error(responseText || `Server error (HTTP ${response.status})`);
  }

  // Si la API devolvió success: false, lanzar error
  if (!data.success) {
    throw new Error(data.error || 'Error desconocido en la API');
  }

  // Si todo OK, devolver solo la data útil
  return data.data;
}

// ===========================================================================
// API FUNCTIONS - ENDPOINTS
// ===========================================================================

/**
 * Envía un score al backend
 *
 * Esta función se llama cuando el jugador completa un juego y queremos
 * guardar su puntaje en el leaderboard global.
 *
 * DETECCIÓN AUTOMÁTICA DE PAÍS:
 * - Si no se proporciona country_code/country_name, se detecta automáticamente
 * - Usa la API gratuita de geojs.io para detectar el país por IP
 * - El resultado se cachea para evitar múltiples requests
 * - Si la detección falla, el score se guarda sin país (no bloquea el submit)
 *
 * Flujo:
 * 1. Usuario termina juego con score X
 * 2. Victory screen llama a submitScore()
 * 3. Se detecta automáticamente el país del usuario (si no se proporcionó)
 * 4. fetch() envía POST a /api/scores en Vercel
 * 5. Vercel valida, guarda en Supabase, calcula rank
 * 6. Devuelve rank y mensaje
 * 7. Victory screen muestra: "¡Top 10! Rank #3!"
 *
 * @param {string} game - Nombre del juego ('square-rush', 'knight-quest', etc)
 * @param {string} playerName - Nombre del jugador (1-15 caracteres)
 * @param {number} score - Puntaje obtenido (debe ser > 0)
 * @param {object} options - Opciones adicionales
 * @param {string} options.level - Nivel/dificultad (opcional)
 * @param {number} options.time_ms - Tiempo en milisegundos (opcional)
 * @param {string} options.country_code - Código ISO del país (ej: "AR", "US") - se detecta automáticamente si no se proporciona
 * @param {string} options.country_name - Nombre del país - se detecta automáticamente si no se proporciona
 * @param {object} options.metadata - Metadata adicional del juego (opcional)
 * @returns {Promise<object>} - { id, rank, totalPlayers, score, message }
 * @throws {Error} - Si hay error en el request o validación
 *
 * @example
 * // Ejemplo básico (país se detecta automáticamente)
 * try {
 *   const result = await submitScore('square-rush', 'PLAYER', 15000, {
 *     level: 'MASTER',
 *     time_ms: 180000
 *   });
 *   console.log(result.message); // "🎉 Top 10! You're rank #3!"
 * } catch (error) {
 *   console.error('Error:', error.message);
 * }
 *
 * @example
 * // Ejemplo con país manual (sobrescribe la detección automática)
 * const result = await submitScore('knight-quest', 'JUAN', 5000, {
 *   country_code: 'AR',
 *   country_name: 'Argentina'
 * });
 */
async function submitScore(game, playerName, score, options = {}) {
  try {
    // Validación básica en el cliente (antes de enviar al servidor)
    if (!game || typeof game !== 'string') {
      throw new Error('Game name es requerido y debe ser string');
    }

    if (!playerName || typeof playerName !== 'string') {
      throw new Error('Player name es requerido y debe ser string');
    }

    if (typeof score !== 'number' || score <= 0) {
      throw new Error('Score debe ser un número mayor a 0');
    }

    if (playerName.length > 15) {
      throw new Error('Player name no puede tener más de 15 caracteres');
    }

    // Detectar país automáticamente si no se proporcionó
    if (!options.country_code || !options.country_name) {
      const detectedCountry = await detectUserCountry();
      if (detectedCountry) {
        // Usar país detectado solo si no se proporcionó manualmente
        if (!options.country_code) {
          options.country_code = detectedCountry.code;
        }
        if (!options.country_name) {
          options.country_name = detectedCountry.name;
        }
      }
    }

    // Construir el payload (datos que enviamos)
    // IMPORTANTE: Solo incluimos campos opcionales si tienen un valor válido
    // Si enviamos null o undefined, el backend los rechaza en la validación
    const payload = {
      game,
      player_name: playerName,
      score
    };

    // Agregar campos opcionales solo si están presentes y no son null/undefined
    if (options.level) {
      payload.level = options.level;
    }

    if (options.time_ms !== undefined && options.time_ms !== null) {
      payload.time_ms = options.time_ms;
    }

    if (options.country_code) {
      payload.country_code = options.country_code;
    }

    if (options.country_name) {
      payload.country_name = options.country_name;
    }

    if (options.metadata && Object.keys(options.metadata).length > 0) {
      payload.metadata = options.metadata;
    }

    // Hacer POST request a /api/scores
    const response = await fetchWithTimeout(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // Procesar la respuesta
    const data = await processResponse(response);

    // Devolver el resultado
    // data contiene: { id, rank, totalPlayers, score, player_name, game, created_at, message }
    return data;

  } catch (error) {
    console.error('[submitScore] Error:', error);

    // Re-lanzar el error con mensaje más amigable
    if (error.message.includes('timeout')) {
      throw new Error('La conexión con el servidor tardó demasiado. Intenta de nuevo.');
    } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
      throw new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
    } else {
      throw error; // Re-lanzar el error original
    }
  }
}

/**
 * Obtiene el leaderboard de un juego
 *
 * Esta función se usa para mostrar el top de jugadores de un juego específico.
 * Soporta paginación (limit/offset) y filtros (country, level).
 *
 * @param {string} game - Nombre del juego
 * @param {object} options - Opciones de filtrado y paginación
 * @param {number} options.limit - Cantidad de scores a devolver (default: 50, max: 100)
 * @param {number} options.offset - Offset para paginación (default: 0)
 * @param {string} options.country - Filtrar por código de país (ej: 'AR', 'US')
 * @param {string} options.level - Filtrar por nivel (ej: 'MASTER', 'EXPERT')
 * @returns {Promise<object>} - { game, scores[], pagination, filters }
 * @throws {Error} - Si hay error en el request
 *
 * @example
 * // Obtener top 50 de Square Rush
 * const data = await getLeaderboard('square-rush');
 * console.log(data.scores); // Array de 50 scores
 *
 * @example
 * // Obtener top 10 de Argentina solamente
 * const data = await getLeaderboard('square-rush', {
 *   limit: 10,
 *   country: 'AR'
 * });
 *
 * @example
 * // Paginación: obtener scores 51-100
 * const data = await getLeaderboard('square-rush', {
 *   limit: 50,
 *   offset: 50
 * });
 */
async function getLeaderboard(game, options = {}) {
  try {
    // Validación básica
    if (!game || typeof game !== 'string') {
      throw new Error('Game name es requerido');
    }

    // Construir query params (los parámetros que van en la URL)
    // URLSearchParams es una API nativa para construir query strings
    const params = new URLSearchParams({
      game,
      limit: options.limit || 50,
      offset: options.offset || 0
    });

    // Agregar filtros opcionales solo si están presentes
    if (options.country) {
      params.append('country', options.country);
    }

    if (options.level) {
      params.append('level', options.level);
    }

    // Construir URL completa con query params
    // Ejemplo: /api/scores/leaderboard?game=square-rush&limit=50&offset=0
    const url = `${API_BASE_URL}/leaderboard?${params.toString()}`;

    // Hacer GET request
    const response = await fetchWithTimeout(url);

    // Procesar respuesta
    const data = await processResponse(response);

    // Devolver resultado
    // data contiene: { game, scores[], pagination: {limit, offset, total, hasMore}, filters: {...} }
    return data;

  } catch (error) {
    console.error('[getLeaderboard] Error:', error);
    throw new Error('Error al obtener leaderboard: ' + error.message);
  }
}

/**
 * Busca jugadores por nombre
 *
 * Permite buscar scores de jugadores cuyo nombre contenga cierto texto.
 * Útil para que un jugador busque sus propios scores o compare con amigos.
 *
 * La búsqueda es case-insensitive y usa LIKE en SQL, así que buscar "TEST"
 * encontrará "TESTUSER", "MyTest", "test123", etc.
 *
 * @param {string} game - Nombre del juego
 * @param {string} playerName - Nombre parcial o completo a buscar
 * @returns {Promise<object>} - { game, search_term, scores[], stats, found }
 * @throws {Error} - Si hay error en el request
 *
 * @example
 * // Buscar todos los scores de jugadores con "PLAYER" en el nombre
 * const result = await searchPlayer('square-rush', 'PLAYER');
 * console.log(result.found); // Cantidad de scores encontrados
 * console.log(result.scores); // Array de scores
 * console.log(result.stats.best_score); // Mejor score encontrado
 */
async function searchPlayer(game, playerName) {
  try {
    // Validación
    if (!game || typeof game !== 'string') {
      throw new Error('Game name es requerido');
    }

    if (!playerName || typeof playerName !== 'string') {
      throw new Error('Player name es requerido para búsqueda');
    }

    // Construir URL con query params
    const params = new URLSearchParams({
      game,
      player_name: playerName
    });

    const url = `${API_BASE_URL}/search?${params.toString()}`;

    // Hacer GET request
    const response = await fetchWithTimeout(url);

    // Procesar respuesta
    const data = await processResponse(response);

    // Devolver resultado
    // data contiene: { game, search_term, scores[], stats: {total, best, avg, first_date}, found }
    return data;

  } catch (error) {
    console.error('[searchPlayer] Error:', error);
    throw new Error('Error al buscar jugador: ' + error.message);
  }
}

/**
 * Obtiene los últimos scores registrados de un juego
 *
 * Útil para mostrar actividad reciente en el leaderboard, tipo
 * "Últimos scores registrados" o "Live feed".
 *
 * Los scores se devuelven ordenados por fecha (más reciente primero).
 *
 * @param {string} game - Nombre del juego
 * @param {number} limit - Cantidad de scores a devolver (default: 10, max: 50)
 * @returns {Promise<object>} - { game, scores[], count }
 * @throws {Error} - Si hay error en el request
 *
 * @example
 * // Obtener los últimos 5 scores de Square Rush
 * const data = await getRecentScores('square-rush', 5);
 * data.scores.forEach(score => {
 *   console.log(`${score.player_name}: ${score.score} - ${score.time_ago}`);
 * });
 * // Output: "PLAYER1: 15000 - 2 min ago"
 */
async function getRecentScores(game, limit = 10) {
  try {
    // Validación
    if (!game || typeof game !== 'string') {
      throw new Error('Game name es requerido');
    }

    // Limitar el limit a 50 como máximo
    const safeLimit = Math.min(Math.max(1, limit), 50);

    // Construir URL
    const params = new URLSearchParams({
      game,
      limit: safeLimit
    });

    const url = `${API_BASE_URL}/recent?${params.toString()}`;

    // Hacer GET request
    const response = await fetchWithTimeout(url);

    // Procesar respuesta
    const data = await processResponse(response);

    // Devolver resultado
    // data contiene: { game, scores[], count }
    // Cada score tiene un campo "time_ago" relativo (ej: "2 min ago", "just now")
    return data;

  } catch (error) {
    console.error('[getRecentScores] Error:', error);
    throw new Error('Error al obtener recent scores: ' + error.message);
  }
}

// ===========================================================================
// EXPORTS
// ===========================================================================

/**
 * Si estás usando ES6 modules (en un bundler como Webpack o Vite),
 * puedes descomentar esto:
 *
 * export { submitScore, getLeaderboard, searchPlayer, getRecentScores };
 *
 * Como estamos usando JavaScript vanilla en el browser sin bundler,
 * dejamos todo en el scope global (window).
 *
 * Las funciones estarán disponibles globalmente como:
 * - window.submitScore()
 * - window.getLeaderboard()
 * - window.searchPlayer()
 * - window.getRecentScores()
 */

// Para debugging: log cuando el módulo se carga
console.log('[leaderboard-api.js] API client loaded successfully');
console.log('[leaderboard-api.js] API Base URL:', API_BASE_URL);
