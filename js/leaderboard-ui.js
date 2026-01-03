/**
 * ChessArcade - Leaderboard UI Components
 *
 * Este módulo proporciona componentes UI reutilizables para mostrar
 * leaderboards, modals, toast notifications, etc.
 *
 * Usa el tema NeonChess (variables CSS de arcade-shared.css) para
 * mantener consistencia visual con el resto del sitio.
 *
 * ¿Por qué separar UI de API?
 * - Separación de responsabilidades (Single Responsibility Principle)
 * - leaderboard-api.js = comunicación con backend
 * - leaderboard-ui.js = renderizado y UX
 * - Más fácil de mantener y testear
 *
 * @author ChessArcade Team
 * @version 2.0.0
 */

// ===========================================================================
// CONFIGURACIÓN DE JUEGOS
// ===========================================================================

/**
 * Mapeo de nombres de juegos a sus display names
 * Usado para mostrar nombres amigables en la UI
 */
const GAME_NAMES = {
  'square-rush': 'Square Rush',
  'knight-quest': 'Knight Quest',
  'memory-matrix': 'Memory Matrix',
  'master-sequence': 'Master Sequence',
  'chessinfive': 'ChessInFive'
};

/**
 * Emojis por juego para los tabs
 */
const GAME_EMOJIS = {
  'square-rush': '⚡',
  'knight-quest': '♞',
  'memory-matrix': '🧠',
  'master-sequence': '🎯',
  'chessinfive': '♟️'
};

// ===========================================================================
// TOAST NOTIFICATIONS
// ===========================================================================

/**
 * Muestra un toast notification temporal
 *
 * ¿Qué es un toast?
 * - Es un mensaje pequeño que aparece temporalmente (como las notificaciones de Android)
 * - Aparece, se muestra unos segundos, y desaparece automáticamente
 * - No bloquea la interacción (a diferencia de alert())
 *
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo: 'success', 'error', 'info', 'warning'
 * @param {number} duration - Duración en ms (default: 3000)
 *
 * @example
 * showToast('¡Score guardado!', 'success');
 * showToast('Error al conectar', 'error', 5000);
 */
function showToast(message, type = 'info', duration = 3000) {
  // Crear elemento del toast
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  // Agregar al body
  document.body.appendChild(toast);

  // Forzar reflow para que la animación funcione
  // (truco de CSS: cambiar una propiedad para activar transición)
  toast.offsetHeight;

  // Agregar clase 'show' para animar entrada
  toast.classList.add('show');

  // Después de 'duration' ms, animar salida y remover
  setTimeout(() => {
    toast.classList.remove('show');

    // Esperar a que termine la animación antes de remover del DOM
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300); // 300ms = duración de la transición CSS
  }, duration);
}

// ===========================================================================
// MODAL BASE
// ===========================================================================

/**
 * Crea y muestra un modal genérico
 *
 * Un modal es una ventana superpuesta que aparece encima del contenido principal.
 * Bloquea la interacción con el resto de la página hasta que se cierre.
 *
 * @param {string} title - Título del modal
 * @param {string|HTMLElement} content - Contenido (HTML string o elemento DOM)
 * @param {object} options - Opciones del modal
 * @param {boolean} options.closeable - Si se puede cerrar (default: true)
 * @param {function} options.onClose - Callback cuando se cierra
 * @returns {HTMLElement} - El elemento del modal (para poder cerrarlo programáticamente)
 *
 * @example
 * const modal = showModal('Leaderboard', '<p>Loading...</p>');
 * // Más tarde: closeModal(modal);
 */
function showModal(title, content, options = {}) {
  // Opciones default
  const config = {
    closeable: options.closeable !== undefined ? options.closeable : true,
    onClose: options.onClose || null
  };

  // Crear overlay (fondo oscuro semi-transparente)
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  // Crear container del modal
  const modal = document.createElement('div');
  modal.className = 'modal-container';

  // Crear header
  const header = document.createElement('div');
  header.className = 'modal-header';

  const titleElement = document.createElement('h2');
  titleElement.textContent = title;
  header.appendChild(titleElement);

  // Botón close si es closeable
  if (config.closeable) {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.innerHTML = '&times;'; // × symbol
    closeBtn.onclick = () => closeModal(overlay);
    header.appendChild(closeBtn);
  }

  // Crear body
  const body = document.createElement('div');
  body.className = 'modal-body';

  // Si content es string, usar innerHTML, sino appendChild
  if (typeof content === 'string') {
    body.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    body.appendChild(content);
  }

  // Ensamblar modal
  modal.appendChild(header);
  modal.appendChild(body);
  overlay.appendChild(modal);

  // Agregar al DOM
  document.body.appendChild(overlay);

  // Forzar reflow y agregar clase 'show' para animar
  overlay.offsetHeight;
  overlay.classList.add('show');

  // Click en overlay (fuera del modal) cierra si es closeable
  if (config.closeable) {
    overlay.addEventListener('click', (e) => {
      // Solo cerrar si el click fue en el overlay, no en el modal
      if (e.target === overlay) {
        closeModal(overlay);
      }
    });

    // ESC key cierra el modal
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal(overlay);
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
  }

  // Guardar callback onClose en el overlay (para ejecutarlo al cerrar)
  overlay._onCloseCallback = config.onClose;

  return overlay;
}

/**
 * Cierra un modal
 *
 * @param {HTMLElement} modalOverlay - El elemento overlay del modal
 */
function closeModal(modalOverlay) {
  if (!modalOverlay) return;

  // Animar salida
  modalOverlay.classList.remove('show');

  // Esperar a que termine la animación
  setTimeout(() => {
    if (modalOverlay.parentNode) {
      // Ejecutar callback onClose si existe
      if (modalOverlay._onCloseCallback) {
        modalOverlay._onCloseCallback();
      }

      // Remover del DOM
      modalOverlay.parentNode.removeChild(modalOverlay);
    }
  }, 300);
}

// ===========================================================================
// LEADERBOARD RENDERING
// ===========================================================================

/**
 * Renderiza una fila de score en el leaderboard
 *
 * Cada score tiene:
 * - rank: posición en el ranking
 * - player_name: nombre del jugador (primeras 3 letras destacadas)
 * - score: puntaje
 * - level: nivel/dificultad (opcional)
 * - country: {code, name} (opcional)
 * - created_at: fecha
 *
 * @param {object} score - Objeto score del backend
 * @param {boolean} highlightTop3 - Si destacar el top 3 (default: true)
 * @returns {string} - HTML string de la fila
 */
function renderScoreRow(score, highlightTop3 = true) {
  // Clases CSS según el rank
  const rowClasses = ['score-row'];
  if (highlightTop3 && score.rank <= 3) {
    rowClasses.push('top-three');
    rowClasses.push(`rank-${score.rank}`);
  }

  // Emoji para el top 3
  let rankDisplay = `#${score.rank}`;
  if (score.rank === 1) rankDisplay = '🥇 #1';
  else if (score.rank === 2) rankDisplay = '🥈 #2';
  else if (score.rank === 3) rankDisplay = '🥉 #3';

  // Player name con primeras 3 letras destacadas (estilo arcade retro)
  const playerName = score.player_name || 'UNKNOWN';
  const initials = playerName.substring(0, 3);
  const rest = playerName.substring(3);

  // Country flag INLINE (al lado del nombre, no columna separada)
  let flagHTML = '';
  if (score.country && score.country.code) {
    const countryCode = score.country.code.toLowerCase();
    const countryName = score.country.name || score.country.code;

    // Usar flagcdn.com para las banderas (CDN gratis de flags)
    flagHTML = `
      <img
        src="https://flagcdn.com/16x12/${countryCode}.png"
        srcset="https://flagcdn.com/32x24/${countryCode}.png 2x,
                https://flagcdn.com/48x36/${countryCode}.png 3x"
        width="16"
        height="12"
        alt="${countryName}"
        title="${countryName}"
        class="country-flag"
        style="margin-left: 6px; vertical-align: middle;"
      >
    `;
  }

  // Player name HTML con bandera inline
  const playerNameHTML = `<span class="player-initials">${initials}</span>${rest}${flagHTML}`;

  // Level (buscar en múltiples lugares para compatibilidad con todos los juegos)
  let levelDisplay = '-';
  if (score.level !== undefined && score.level !== null) {
    // Algunos juegos usan score.level directamente
    levelDisplay = score.level;
  } else if (score.metadata) {
    // Square Rush usa metadata.level_reached, ChessInFive usa metadata.moves
    levelDisplay = score.metadata.level_reached
                || score.metadata.moves
                || score.metadata.phase
                || '-';
  }

  // Score formateado con separadores de miles
  const scoreDisplay = score.score.toLocaleString('en-US');

  // Time (buscar en time_ms o metadata.time)
  let timeHTML = '';
  const timeValue = score.time_ms || (score.metadata && score.metadata.time);
  if (timeValue) {
    const seconds = Math.floor(timeValue / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    timeHTML = `<td class="time">${minutes}:${secs.toString().padStart(2, '0')}</td>`;
  } else if (score.metadata && score.metadata.time !== undefined) {
    // ChessInFive guarda tiempo en segundos directo
    const totalSeconds = score.metadata.time;
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    timeHTML = `<td class="time">${minutes}:${secs.toString().padStart(2, '0')}</td>`;
  }

  // Construir la fila (bandera va inline con nombre, no columna separada)
  return `
    <tr class="${rowClasses.join(' ')}" data-score-id="${score.id}">
      <td class="rank">${rankDisplay}</td>
      <td class="player-name">${playerNameHTML}</td>
      <td class="score">${scoreDisplay}</td>
      <td class="level">${levelDisplay}</td>
      ${timeHTML}
    </tr>
  `;
}

/**
 * Renderiza una fila de score ESPECÍFICA para Knight Quest
 * Diferencias vs genérico:
 * - Bandera al lado del nombre (no columna separada)
 * - Columna BOARD en vez de LEVEL
 * - Columna SQUARES mostrando visitadas/total
 *
 * @param {object} score - Objeto score del backend
 * @param {boolean} highlightTop3 - Si destacar el top 3 (default: true)
 * @returns {string} - HTML string de la fila
 */
function renderKnightQuestScoreRow(score, highlightTop3 = true) {
  // Clases CSS según el rank
  const rowClasses = ['score-row'];
  if (highlightTop3 && score.rank <= 3) {
    rowClasses.push('top-three');
    rowClasses.push(`rank-${score.rank}`);
  }

  // Emoji para el top 3
  let rankDisplay = `#${score.rank}`;
  if (score.rank === 1) rankDisplay = '🥇 #1';
  else if (score.rank === 2) rankDisplay = '🥈 #2';
  else if (score.rank === 3) rankDisplay = '🥉 #3';

  // Player name con primeras 3 letras destacadas + BANDERA AL LADO
  const playerName = score.player_name || 'UNKNOWN';
  const initials = playerName.substring(0, 3);
  const rest = playerName.substring(3);

  // Bandera inline (al lado del nombre)
  let flagHTML = '';
  if (score.country && score.country.code) {
    const countryCode = score.country.code.toLowerCase();
    const countryName = score.country.name || score.country.code;
    flagHTML = `
      <img
        src="https://flagcdn.com/16x12/${countryCode}.png"
        srcset="https://flagcdn.com/32x24/${countryCode}.png 2x,
                https://flagcdn.com/48x36/${countryCode}.png 3x"
        width="16"
        height="12"
        alt="${countryName}"
        title="${countryName}"
        class="country-flag"
        style="margin-left: 6px; vertical-align: middle;"
      >
    `;
  }

  const playerNameHTML = `<span class="player-initials">${initials}</span>${rest}${flagHTML}`;

  // BOARD (tamaño del tablero desde metadata, no desde level)
  const boardDisplay = (score.metadata && score.metadata.board_size) ? score.metadata.board_size : '-';

  // Score formateado con separadores de miles
  const scoreDisplay = score.score.toLocaleString('en-US');

  // SQUARES - casillas visitadas/total (desde metadata)
  let squaresDisplay = '-';
  if (score.metadata && score.metadata.visited_squares && score.metadata.total_squares) {
    squaresDisplay = `${score.metadata.visited_squares}/${score.metadata.total_squares}`;
  }

  // Time formateado
  let timeDisplay = '-';
  if (score.time_ms) {
    const seconds = Math.floor(score.time_ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    timeDisplay = `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  // Construir la fila (sin columna COUNTRY separada)
  return `
    <tr class="${rowClasses.join(' ')}" data-score-id="${score.id}">
      <td class="rank">${rankDisplay}</td>
      <td class="player-name">${playerNameHTML}</td>
      <td class="score">${scoreDisplay}</td>
      <td class="level">${boardDisplay}</td>
      <td class="level">${squaresDisplay}</td>
      <td class="time">${timeDisplay}</td>
    </tr>
  `;
}

/**
 * Renderiza una tabla completa de leaderboard
 *
 * @param {array} scores - Array de scores del backend
 * @param {boolean} showTime - Si mostrar columna de tiempo (default: false)
 * @returns {HTMLElement} - Elemento table
 */
function renderLeaderboardTable(scores, showTime = false) {
  // Crear elemento table
  const table = document.createElement('table');
  table.className = 'leaderboard-table';

  // Crear thead (sin columna Country - bandera va inline con nombre)
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th class="rank">Rank</th>
      <th class="player-name">Player</th>
      <th class="score">Score</th>
      <th class="level">Level</th>
      ${showTime ? '<th class="time">Time</th>' : ''}
    </tr>
  `;
  table.appendChild(thead);

  // Crear tbody
  const tbody = document.createElement('tbody');

  if (scores.length === 0) {
    // Si no hay scores, mostrar mensaje
    tbody.innerHTML = `
      <tr class="no-scores">
        <td colspan="${showTime ? 5 : 4}" class="text-center">
          No scores yet. Be the first! 🏆
        </td>
      </tr>
    `;
  } else {
    // Renderizar cada score
    tbody.innerHTML = scores.map(score => renderScoreRow(score, true)).join('');
  }

  table.appendChild(tbody);

  return table;
}

/**
 * Renderiza una tabla completa de leaderboard ESPECÍFICA para Knight Quest
 * Headers personalizados: RANK | PLAYER | SCORE | BOARD | SQUARES | TIME
 * (sin columna COUNTRY separada, la bandera va al lado del nombre)
 *
 * VISTA DIVIDIDA: Si el jugador destacado está muy lejos del top (rank > 10),
 * muestra: Top 5 → separador "..." → posiciones alrededor del jugador
 *
 * @param {array} scores - Array de scores del backend
 * @param {string} highlightPlayer - Nombre del jugador a destacar (opcional)
 * @param {number} highlightScore - Score específico a destacar (opcional)
 * @returns {HTMLElement} - Elemento table
 */
function renderKnightQuestLeaderboardTable(scores, highlightPlayer = null, highlightScore = null) {
  // Crear elemento table
  const table = document.createElement('table');
  table.className = 'leaderboard-table';

  // Crear thead con headers específicos de Knight Quest
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th class="rank">Rank</th>
      <th class="player-name">Player</th>
      <th class="score">Score</th>
      <th class="level">Board</th>
      <th class="level">Squares</th>
      <th class="time">Time</th>
    </tr>
  `;
  table.appendChild(thead);

  // Crear tbody
  const tbody = document.createElement('tbody');

  if (scores.length === 0) {
    // Si no hay scores, mostrar mensaje
    tbody.innerHTML = `
      <tr class="no-scores">
        <td colspan="6" class="text-center">
          No scores yet. Be the first! 🏆
        </td>
      </tr>
    `;
  } else {
    /**
     * VISTA DIVIDIDA: Encontrar la posición del jugador destacado
     * Si está en posición > 10, mostrar vista dividida
     */
    let playerIndex = -1;

    console.log('[DEBUG] Knight Quest split view search - highlightPlayer:', highlightPlayer, 'highlightScore:', highlightScore);

    if (highlightPlayer && highlightScore !== null) {
      playerIndex = scores.findIndex(score => {
        const nameMatch = score.player_name?.toLowerCase() === highlightPlayer.toLowerCase();
        const scoreMatch = score.score === highlightScore;
        if (nameMatch) {
          console.log('[DEBUG] Found name match:', score.player_name, 'score:', score.score, 'expected:', highlightScore, 'match:', scoreMatch);
        }
        return nameMatch && scoreMatch;
      });
    }

    console.log('[DEBUG] playerIndex found:', playerIndex);

    // Determinar si usar vista dividida (jugador en posición > 10)
    const useSplitView = playerIndex > 9;

    /**
     * Función auxiliar para renderizar una fila con highlight si corresponde
     */
    const renderRowWithHighlight = (score) => {
      const rowHtml = renderKnightQuestScoreRow(score, true);
      const nameMatches = highlightPlayer && score.player_name &&
          score.player_name.toLowerCase() === highlightPlayer.toLowerCase();
      const scoreMatches = highlightScore === null || score.score === highlightScore;

      if (nameMatches && scoreMatches) {
        console.log('[DEBUG] Highlighting row:', score.player_name, score.score);
        return rowHtml.replace('<tr class="', '<tr class="highlight-player-row ');
      }
      return rowHtml;
    };

    if (useSplitView) {
      // VISTA DIVIDIDA: Top 5 + separador + posiciones alrededor del jugador
      const TOP_COUNT = 5;
      const CONTEXT_BEFORE = 2;
      const CONTEXT_AFTER = 2;

      let htmlRows = [];

      // 1. Mostrar Top 5
      for (let i = 0; i < Math.min(TOP_COUNT, scores.length); i++) {
        htmlRows.push(renderRowWithHighlight(scores[i]));
      }

      // 2. Calcular cuántas posiciones están ocultas
      const startIndex = Math.max(TOP_COUNT, playerIndex - CONTEXT_BEFORE);
      const hiddenCount = startIndex - TOP_COUNT;

      // 3. Agregar fila separadora
      htmlRows.push(`
        <tr class="separator-row">
          <td colspan="6" class="separator-cell">
            <div class="separator-indicator">
              <span class="separator-line"></span>
              <span class="separator-text">${hiddenCount > 0 ? `#${TOP_COUNT + 1} - #${startIndex} ocultos` : '• • •'}</span>
              <span class="separator-line"></span>
            </div>
          </td>
        </tr>
      `);

      // 4. Calcular rango final
      const endIndex = Math.min(scores.length - 1, playerIndex + CONTEXT_AFTER);

      // 5. Mostrar posiciones alrededor del jugador
      for (let i = startIndex; i <= endIndex; i++) {
        htmlRows.push(renderRowWithHighlight(scores[i]));
      }

      tbody.innerHTML = htmlRows.join('');
    } else {
      // Vista normal: mostrar todas las filas
      tbody.innerHTML = scores.map(score => renderRowWithHighlight(score)).join('');
    }
  }

  table.appendChild(tbody);

  return table;
}

/**
 * Renderiza una fila de score ESPECÍFICA para Master Sequence
 * Columnas: RANK | PLAYER | SCORE | LENGTH | LEVEL | TIME
 *
 * @param {object} score - Score object del backend
 * @param {boolean} highlightTop3 - Si destacar top 3 (default: true)
 * @returns {string} - HTML de la fila <tr>
 */
function renderMasterSequenceScoreRow(score, highlightTop3 = true) {
  // Clases CSS según el rank
  const rowClasses = ['score-row'];
  if (highlightTop3 && score.rank <= 3) {
    rowClasses.push('top-three');
    rowClasses.push(`rank-${score.rank}`);
  }

  // Emoji para el top 3
  let rankDisplay = `#${score.rank}`;
  if (score.rank === 1) rankDisplay = '🥇 #1';
  else if (score.rank === 2) rankDisplay = '🥈 #2';
  else if (score.rank === 3) rankDisplay = '🥉 #3';

  // Player name con primeras 3 letras destacadas + BANDERA AL LADO
  const playerName = score.player_name || 'UNKNOWN';
  const initials = playerName.substring(0, 3);
  const rest = playerName.substring(3);

  // Bandera inline (al lado del nombre)
  let flagHTML = '';
  if (score.country && score.country.code) {
    const countryCode = score.country.code.toLowerCase();
    const countryName = score.country.name || score.country.code;
    flagHTML = `
      <img
        src="https://flagcdn.com/16x12/${countryCode}.png"
        srcset="https://flagcdn.com/32x24/${countryCode}.png 2x,
                https://flagcdn.com/48x36/${countryCode}.png 3x"
        width="16"
        height="12"
        alt="${countryName}"
        title="${countryName}"
        class="country-flag"
        style="margin-left: 6px; vertical-align: middle;"
      >
    `;
  }

  const playerNameHTML = `<span class="player-initials">${initials}</span>${rest}${flagHTML}`;

  // Score formateado con separadores de miles
  const scoreDisplay = score.score.toLocaleString('en-US');

  // LENGTH - longitud de la secuencia (solo número)
  console.log('🔍 [DEBUG] Rendering Master Sequence row for rank', score.rank);
  console.log('   - score.metadata:', score.metadata);
  console.log('   - score.metadata (JSON):', JSON.stringify(score.metadata, null, 2));
  console.log('   - score.metadata.sequence_length:', score.metadata?.sequence_length);
  console.log('   - score.metadata.level_reached:', score.metadata?.level_reached);
  console.log('   - score.metadata.perfect_streak:', score.metadata?.perfect_streak);
  console.log('   - Object.keys(score.metadata):', score.metadata ? Object.keys(score.metadata) : 'no metadata');

  const lengthDisplay = (score.metadata && score.metadata.sequence_length) ? score.metadata.sequence_length : '-';

  // HINTS - cantidad de hints usados (0 = "-" para resaltar que no pidió ayuda)
  let hintsDisplay = '-';
  if (score.metadata && typeof score.metadata.hints_used !== 'undefined' && score.metadata.hints_used > 0) {
    hintsDisplay = score.metadata.hints_used.toString();
  }

  // Time formateado (MM:SS)
  let timeDisplay = '-';
  if (score.time_ms) {
    const seconds = Math.floor(score.time_ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    timeDisplay = `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  // Construir la fila: RANK | PLAYER | SCORE | LENGTH | HINTS | TIME
  return `
    <tr class="${rowClasses.join(' ')}" data-score-id="${score.id}">
      <td class="rank">${rankDisplay}</td>
      <td class="player-name">${playerNameHTML}</td>
      <td class="score">${scoreDisplay}</td>
      <td class="level">${lengthDisplay}</td>
      <td class="hints">${hintsDisplay}</td>
      <td class="time">${timeDisplay}</td>
    </tr>
  `;
}

/**
 * Renderiza una tabla completa de leaderboard ESPECÍFICA para Master Sequence
 * Headers personalizados: RANK | PLAYER | SCORE | LENGTH | HINTS | TIME
 * (sin columna COUNTRY separada, la bandera va al lado del nombre)
 *
 * VISTA DIVIDIDA: Si el jugador destacado está muy lejos del top (rank > 10),
 * muestra: Top 5 → separador "..." → posiciones alrededor del jugador
 * Esto permite ver siempre la posición del jugador sin tener que hacer scroll
 *
 * @param {array} scores - Array de scores del backend
 * @param {string} highlightPlayer - Nombre del jugador a destacar (opcional)
 * @param {number} highlightScore - Score específico a destacar (para no destacar todas las filas)
 * @returns {HTMLElement} - Elemento table
 */
function renderMasterSequenceLeaderboardTable(scores, highlightPlayer = null, highlightScore = null) {
  // Crear elemento table
  const table = document.createElement('table');
  table.className = 'leaderboard-table';

  // Crear thead con headers específicos de Master Sequence
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th class="rank">Rank</th>
      <th class="player-name">Player</th>
      <th class="score">Score</th>
      <th class="level">Length</th>
      <th class="hints">Hints</th>
      <th class="time">Time</th>
    </tr>
  `;
  table.appendChild(thead);

  // Crear tbody
  const tbody = document.createElement('tbody');

  if (scores.length === 0) {
    // Si no hay scores, mostrar mensaje
    tbody.innerHTML = `
      <tr class="no-scores">
        <td colspan="6" class="text-center">
          No scores yet. Be the first! 🏆
        </td>
      </tr>
    `;
  } else {
    /**
     * VISTA DIVIDIDA: Encontrar la posición del jugador destacado
     * Si está en posición > 10, mostrar vista dividida:
     * - Top 5 posiciones
     * - Fila separadora visual
     * - 2 posiciones antes del jugador
     * - Posición del jugador (destacada)
     * - 2 posiciones después del jugador
     */
    let playerIndex = -1;

    // Debug: mostrar qué estamos buscando
    console.log('[DEBUG] Split view search - highlightPlayer:', highlightPlayer, 'highlightScore:', highlightScore);

    if (highlightPlayer && highlightScore !== null) {
      playerIndex = scores.findIndex(score => {
        const nameMatch = score.player_name?.toLowerCase() === highlightPlayer.toLowerCase();
        const scoreMatch = score.score === highlightScore;
        if (nameMatch) {
          console.log('[DEBUG] Found name match:', score.player_name, 'score:', score.score, 'expected:', highlightScore, 'match:', scoreMatch);
        }
        return nameMatch && scoreMatch;
      });
    }

    console.log('[DEBUG] playerIndex found:', playerIndex);

    // Determinar si usar vista dividida (jugador en posición > 10)
    const useSplitView = playerIndex > 9; // índice 9 = posición 10

    /**
     * Función auxiliar para renderizar una fila con highlight si corresponde
     */
    const renderRowWithHighlight = (score) => {
      const rowHtml = renderMasterSequenceScoreRow(score, true);
      const nameMatches = highlightPlayer && score.player_name &&
          score.player_name.toLowerCase() === highlightPlayer.toLowerCase();
      const scoreMatches = highlightScore === null || score.score === highlightScore;

      if (nameMatches && scoreMatches) {
        console.log('[DEBUG] Highlighting row:', score.player_name, score.score);
        return rowHtml.replace('<tr class="', '<tr class="highlight-player-row ');
      }
      return rowHtml;
    };

    if (useSplitView) {
      // VISTA DIVIDIDA: Top 5 + separador + posiciones alrededor del jugador
      const TOP_COUNT = 5;           // Mostrar las primeras 5 posiciones
      const CONTEXT_BEFORE = 2;      // Mostrar 2 posiciones antes del jugador
      const CONTEXT_AFTER = 2;       // Mostrar 2 posiciones después del jugador

      let htmlRows = [];

      // 1. Mostrar Top 5
      for (let i = 0; i < Math.min(TOP_COUNT, scores.length); i++) {
        htmlRows.push(renderRowWithHighlight(scores[i]));
      }

      // 2. Calcular cuántas posiciones están ocultas
      const startIndex = Math.max(TOP_COUNT, playerIndex - CONTEXT_BEFORE);
      const hiddenCount = startIndex - TOP_COUNT;

      // 3. Agregar fila separadora NOTORIA con indicador de posiciones ocultas
      htmlRows.push(`
        <tr class="separator-row">
          <td colspan="6" class="separator-cell">
            <div class="separator-indicator">
              <span class="separator-line"></span>
              <span class="separator-text">${hiddenCount > 0 ? `#${TOP_COUNT + 1} - #${startIndex} ocultos` : '• • •'}</span>
              <span class="separator-line"></span>
            </div>
          </td>
        </tr>
      `);

      // 4. Calcular rango final
      const endIndex = Math.min(scores.length - 1, playerIndex + CONTEXT_AFTER);

      // 5. Mostrar posiciones alrededor del jugador
      for (let i = startIndex; i <= endIndex; i++) {
        htmlRows.push(renderRowWithHighlight(scores[i]));
      }

      tbody.innerHTML = htmlRows.join('');
    } else {
      // Vista normal: mostrar todas las filas
      tbody.innerHTML = scores.map(score => renderRowWithHighlight(score)).join('');
    }
  }

  table.appendChild(tbody);

  return table;
}

// ===========================================================================
// MEMORY MATRIX CUSTOM LEADERBOARD
// ===========================================================================

/**
 * Renderiza una sola fila de score ESPECÍFICA para Memory Matrix
 * Columnas: RANK | PLAYER 🇦🇷 | SCORE | LEVEL | SUCCESS | ERRORS | HINTS | TIME
 *
 * @param {object} score - Score del backend
 * @param {boolean} highlightTop3 - Si destacar top 3 (default: true)
 * @returns {string} - HTML de la fila <tr>
 */
function renderMemoryMatrixScoreRow(score, highlightTop3 = true) {
  // Clases CSS según el rank
  const rowClasses = ['score-row'];
  if (highlightTop3 && score.rank <= 3) {
    rowClasses.push('top-three');
    rowClasses.push(`rank-${score.rank}`);
  }

  // Emoji para el top 3
  let rankDisplay = `#${score.rank}`;
  if (score.rank === 1) rankDisplay = '🥇 #1';
  else if (score.rank === 2) rankDisplay = '🥈 #2';
  else if (score.rank === 3) rankDisplay = '🥉 #3';

  // Player name con primeras 3 letras destacadas + BANDERA AL LADO
  const playerName = score.player_name || 'UNKNOWN';
  const initials = playerName.substring(0, 3);
  const rest = playerName.substring(3);

  // Bandera inline (al lado del nombre)
  let flagHTML = '';
  if (score.country && score.country.code) {
    const countryCode = score.country.code.toLowerCase();
    const countryName = score.country.name || score.country.code;
    flagHTML = `
      <img
        src="https://flagcdn.com/16x12/${countryCode}.png"
        srcset="https://flagcdn.com/32x24/${countryCode}.png 2x,
                https://flagcdn.com/48x36/${countryCode}.png 3x"
        width="16"
        height="12"
        alt="${countryName}"
        title="${countryName}"
        class="country-flag"
        style="margin-left: 6px; vertical-align: middle;"
      >
    `;
  }

  const playerNameHTML = `<span class="player-initials">${initials}</span>${rest}${flagHTML}`;

  // Score formateado con separadores de miles
  const scoreDisplay = score.score.toLocaleString('en-US');

  // 🔍 DEBUG: Log metadata para diagnosticar (usando JSON.stringify para ver contenido completo)
  console.log('🔍 [DEBUG] Memory Matrix score row:', JSON.stringify({
    rank: score.rank,
    player: score.player_name,
    score: score.score,
    time_ms: score.time_ms,
    metadata: score.metadata,
    metadata_type: typeof score.metadata,
    metadata_keys: score.metadata ? Object.keys(score.metadata) : null
  }, null, 2));

  // LEVEL - nivel alcanzado (1-8, o "ALL" si completó todos)
  let levelDisplay = '-';
  if (score.metadata) {
    // Si levels_completed = 8, mostró "ALL 🏆"
    if (score.metadata.levels_completed === 8) {
      levelDisplay = 'ALL 🏆';
    } else if (score.metadata.level_reached) {
      levelDisplay = score.metadata.level_reached;
    }
  }

  // SUCCESS - intentos exitosos
  const successDisplay = (score.metadata && score.metadata.successful_attempts !== undefined)
    ? score.metadata.successful_attempts
    : '-';

  // ERRORS - intentos fallidos
  const errorsDisplay = (score.metadata && score.metadata.failed_attempts !== undefined)
    ? score.metadata.failed_attempts
    : '-';

  // HINTS - hints usados
  const hintsDisplay = (score.metadata && score.metadata.hints_used !== undefined)
    ? score.metadata.hints_used
    : '-';

  // TIME - tiempo total formateado (MM:SS)
  let timeDisplay = '-';
  if (score.time_ms) {
    const seconds = Math.floor(score.time_ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    timeDisplay = `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  // Construir la fila: RANK | PLAYER | SCORE | LEVEL | SUCCESS | ERRORS | HINTS | TIME
  return `
    <tr class="${rowClasses.join(' ')}" data-score-id="${score.id}">
      <td class="rank">${rankDisplay}</td>
      <td class="player-name">${playerNameHTML}</td>
      <td class="score">${scoreDisplay}</td>
      <td class="level">${levelDisplay}</td>
      <td class="level">${successDisplay}</td>
      <td class="level">${errorsDisplay}</td>
      <td class="level">${hintsDisplay}</td>
      <td class="time">${timeDisplay}</td>
    </tr>
  `;
}

/**
 * Renderiza una tabla completa de leaderboard ESPECÍFICA para Memory Matrix
 * Headers personalizados: RANK | PLAYER | SCORE | LEVEL | SUCCESS | ERRORS | HINTS | TIME
 * (sin columna COUNTRY separada, la bandera va al lado del nombre)
 *
 * VISTA DIVIDIDA: Si el jugador destacado está muy lejos del top (rank > 10),
 * muestra: Top 5 → separador "..." → posiciones alrededor del jugador
 * Esto permite ver siempre la posición del jugador sin tener que hacer scroll
 *
 * NOTA EDUCATIVA: Esta función sigue el mismo patrón que renderMasterSequenceLeaderboardTable
 * El "split view" es útil cuando hay muchos jugadores y el usuario quedó en una posición
 * lejana (ej: posición 47). Sin split view, tendría que hacer scroll para ver su fila.
 *
 * @param {array} scores - Array de scores del backend
 * @param {string} highlightPlayer - Nombre del jugador a destacar (opcional)
 * @param {number} highlightScore - Score específico a destacar (para no destacar todas las filas)
 * @returns {HTMLElement} - Elemento table
 */
function renderMemoryMatrixLeaderboardTable(scores, highlightPlayer = null, highlightScore = null) {
  // Crear elemento table
  const table = document.createElement('table');
  table.className = 'leaderboard-table';

  // Crear thead con headers específicos de Memory Matrix
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th class="rank">Rank</th>
      <th class="player-name">Player</th>
      <th class="score">Score</th>
      <th class="level">Level</th>
      <th class="level">Success</th>
      <th class="level">Errors</th>
      <th class="level">Hints</th>
      <th class="time">Time</th>
    </tr>
  `;
  table.appendChild(thead);

  // Crear tbody
  const tbody = document.createElement('tbody');

  if (scores.length === 0) {
    // Si no hay scores, mostrar mensaje
    tbody.innerHTML = `
      <tr class="no-scores">
        <td colspan="8" class="text-center">
          No scores yet. Be the first! 🏆
        </td>
      </tr>
    `;
  } else {
    /**
     * VISTA DIVIDIDA: Encontrar la posición del jugador destacado
     * Si está en posición > 10, mostrar vista dividida:
     * - Top 5 posiciones
     * - Fila separadora visual con indicador de posiciones ocultas
     * - 2 posiciones antes del jugador
     * - Posición del jugador (destacada con borde neón)
     * - 2 posiciones después del jugador
     *
     * NOTA EDUCATIVA: findIndex() retorna el ÍNDICE (0-based) del elemento encontrado.
     * El índice 9 corresponde a la posición #10 en el ranking.
     */
    let playerIndex = -1;

    // Debug: mostrar qué estamos buscando
    console.log('[DEBUG] Memory Matrix split view search - highlightPlayer:', highlightPlayer, 'highlightScore:', highlightScore);

    if (highlightPlayer && highlightScore !== null) {
      playerIndex = scores.findIndex(score => {
        // Comparar nombre (case-insensitive) Y score exacto
        const nameMatch = score.player_name?.toLowerCase() === highlightPlayer.toLowerCase();
        const scoreMatch = score.score === highlightScore;
        if (nameMatch) {
          console.log('[DEBUG] Found name match:', score.player_name, 'score:', score.score, 'expected:', highlightScore, 'match:', scoreMatch);
        }
        return nameMatch && scoreMatch;
      });
    }

    console.log('[DEBUG] playerIndex found:', playerIndex);

    // Determinar si usar vista dividida (jugador en posición > 10)
    // Índice 9 = posición 10 (porque los índices son 0-based)
    const useSplitView = playerIndex > 9;

    /**
     * Función auxiliar para renderizar una fila con highlight si corresponde
     * NOTA EDUCATIVA: Esta función usa String.replace() para inyectar una clase CSS
     * adicional en el HTML generado. Es una técnica simple pero efectiva.
     */
    const renderRowWithHighlight = (score) => {
      const rowHtml = renderMemoryMatrixScoreRow(score, true);
      const nameMatches = highlightPlayer && score.player_name &&
          score.player_name.toLowerCase() === highlightPlayer.toLowerCase();
      const scoreMatches = highlightScore === null || score.score === highlightScore;

      if (nameMatches && scoreMatches) {
        console.log('[DEBUG] Highlighting row:', score.player_name, score.score);
        // Inyectar clase 'highlight-player-row' para aplicar estilos de destaque
        return rowHtml.replace('<tr class="', '<tr class="highlight-player-row ');
      }
      return rowHtml;
    };

    if (useSplitView) {
      // VISTA DIVIDIDA: Top 5 + separador + posiciones alrededor del jugador
      const TOP_COUNT = 5;           // Mostrar las primeras 5 posiciones
      const CONTEXT_BEFORE = 2;      // Mostrar 2 posiciones antes del jugador
      const CONTEXT_AFTER = 2;       // Mostrar 2 posiciones después del jugador

      let htmlRows = [];

      // 1. Mostrar Top 5
      for (let i = 0; i < Math.min(TOP_COUNT, scores.length); i++) {
        htmlRows.push(renderRowWithHighlight(scores[i]));
      }

      // 2. Calcular cuántas posiciones están ocultas
      const startIndex = Math.max(TOP_COUNT, playerIndex - CONTEXT_BEFORE);
      const hiddenCount = startIndex - TOP_COUNT;

      // 3. Agregar fila separadora NOTORIA con indicador de posiciones ocultas
      // colspan="8" porque Memory Matrix tiene 8 columnas
      htmlRows.push(`
        <tr class="separator-row">
          <td colspan="8" class="separator-cell">
            <div class="separator-indicator">
              <span class="separator-line"></span>
              <span class="separator-text">${hiddenCount > 0 ? `#${TOP_COUNT + 1} - #${startIndex} ocultos` : '• • •'}</span>
              <span class="separator-line"></span>
            </div>
          </td>
        </tr>
      `);

      // 4. Calcular rango final
      const endIndex = Math.min(scores.length - 1, playerIndex + CONTEXT_AFTER);

      // 5. Mostrar posiciones alrededor del jugador
      for (let i = startIndex; i <= endIndex; i++) {
        htmlRows.push(renderRowWithHighlight(scores[i]));
      }

      tbody.innerHTML = htmlRows.join('');
    } else {
      // Vista normal: mostrar todas las filas con highlight si corresponde
      tbody.innerHTML = scores.map(score => renderRowWithHighlight(score)).join('');
    }
  }

  table.appendChild(tbody);

  return table;
}

// ===========================================================================
// LEADERBOARD MODAL
// ===========================================================================

/**
 * Muestra el modal de leaderboard con tabs para cada juego
 *
 * Este es el componente principal que muestra el leaderboard completo.
 * Incluye:
 * - Tabs para cambiar entre juegos
 * - Tabla de scores
 * - Paginación
 * - Filtros (TODO en futuro)
 *
 * @param {string} initialGame - Juego inicial a mostrar (default: 'square-rush')
 */
/**
 * @param {string} initialGame - Juego inicial a mostrar (default: 'square-rush')
 * @param {object} options - Opciones adicionales
 * @param {string} options.highlightPlayer - Nombre del jugador a destacar
 * @param {number} options.highlightScore - Score específico a destacar (para no destacar todas las filas del mismo jugador)
 */
async function showLeaderboardModal(initialGame = 'square-rush', options = {}) {
  // Crear contenedor del leaderboard
  const container = document.createElement('div');
  container.className = 'leaderboard-modal-content';

  // Estado del modal (para mantener track de qué se está mostrando)
  const state = {
    currentGame: initialGame,
    currentOffset: 0,
    limit: 50,
    loading: false,
    // Nombre Y score del jugador a destacar (para resaltar SOLO esa fila específica)
    highlightPlayer: options.highlightPlayer || window.lastSubmittedPlayerName || null,
    highlightScore: options.highlightScore || window.lastSubmittedScore || null
  };

  // Crear tabs para los juegos
  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'leaderboard-tabs';

  Object.keys(GAME_NAMES).forEach(gameKey => {
    const tab = document.createElement('button');
    tab.className = 'leaderboard-tab';
    tab.dataset.game = gameKey;
    tab.innerHTML = `${GAME_EMOJIS[gameKey]} ${GAME_NAMES[gameKey]}`;

    if (gameKey === state.currentGame) {
      tab.classList.add('active');
    }

    tab.addEventListener('click', async () => {
      // Si ya está activo, no hacer nada
      if (state.loading || gameKey === state.currentGame) return;

      // Actualizar estado
      state.currentGame = gameKey;
      state.currentOffset = 0;

      // Actualizar tabs visuales
      tabsContainer.querySelectorAll('.leaderboard-tab').forEach(t => {
        t.classList.remove('active');
      });
      tab.classList.add('active');

      // Cargar nuevo leaderboard
      await loadLeaderboard();
    });

    tabsContainer.appendChild(tab);
  });

  // Crear área de contenido (donde va la tabla)
  const contentArea = document.createElement('div');
  contentArea.className = 'leaderboard-content';

  // Crear controles de paginación
  const paginationContainer = document.createElement('div');
  paginationContainer.className = 'leaderboard-pagination';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'pagination-btn';
  prevBtn.innerHTML = '← Previous';
  prevBtn.disabled = true;

  const pageInfo = document.createElement('span');
  pageInfo.className = 'page-info';
  pageInfo.textContent = 'Page 1';

  const nextBtn = document.createElement('button');
  nextBtn.className = 'pagination-btn';
  nextBtn.innerHTML = 'Next →';

  // Event listeners para paginación
  prevBtn.addEventListener('click', async () => {
    if (state.loading || state.currentOffset === 0) return;
    state.currentOffset -= state.limit;
    await loadLeaderboard();
  });

  nextBtn.addEventListener('click', async () => {
    if (state.loading) return;
    state.currentOffset += state.limit;
    await loadLeaderboard();
  });

  paginationContainer.appendChild(prevBtn);
  paginationContainer.appendChild(pageInfo);
  paginationContainer.appendChild(nextBtn);

  // Ensamblar container
  container.appendChild(tabsContainer);
  container.appendChild(contentArea);
  container.appendChild(paginationContainer);

  // Función para cargar leaderboard
  async function loadLeaderboard() {
    if (state.loading) return;

    state.loading = true;

    // Mostrar loading
    contentArea.innerHTML = '<div class="loading">Loading leaderboard... ⏳</div>';

    try {
      // Llamar a la API (función de leaderboard-api.js)
      const data = await getLeaderboard(state.currentGame, {
        limit: state.limit,
        offset: state.currentOffset
      });

      // Renderizar tabla (usar función específica para cada juego)
      console.log('[DEBUG] Current game:', state.currentGame);
      console.log('[DEBUG] highlightPlayer:', state.highlightPlayer);
      console.log('[DEBUG] highlightScore:', state.highlightScore);

      let table;
      if (state.currentGame === 'knight-quest') {
        console.log('[DEBUG] Using Knight Quest custom leaderboard');
        // Pasar nombre Y score para resaltar SOLO la fila específica y activar vista dividida
        table = renderKnightQuestLeaderboardTable(data.scores, state.highlightPlayer, state.highlightScore);
      } else if (state.currentGame === 'master-sequence') {
        console.log('[DEBUG] Using Master Sequence custom leaderboard');
        // Pasar nombre Y score para resaltar SOLO la fila específica (no todas del mismo jugador)
        table = renderMasterSequenceLeaderboardTable(data.scores, state.highlightPlayer, state.highlightScore);
      } else if (state.currentGame === 'memory-matrix') {
        console.log('[DEBUG] Using Memory Matrix custom leaderboard');
        // Pasar nombre Y score para resaltar SOLO la fila específica y activar vista dividida
        // NOTA EDUCATIVA: Igual que Knight Quest y Master Sequence, Memory Matrix ahora soporta
        // highlight y split view para mejorar la UX cuando el jugador está en posiciones lejanas
        table = renderMemoryMatrixLeaderboardTable(data.scores, state.highlightPlayer, state.highlightScore);
      } else if (state.currentGame === 'square-rush') {
        console.log('[DEBUG] Using Square Rush custom leaderboard');
        // NOTA EDUCATIVA: Pasar nombre Y score para resaltar SOLO la fila específica
        // y activar vista dividida si el jugador está en posiciones lejanas
        if (typeof window.renderSquareRushLeaderboardTable === 'function') {
          table = window.renderSquareRushLeaderboardTable(data.scores, state.highlightPlayer, state.highlightScore);
        } else {
          console.warn('[DEBUG] Square Rush custom renderer not available, using generic');
          table = renderLeaderboardTable(data.scores, true);
        }
      } else if (state.currentGame === 'chessinfive') {
        console.log('[DEBUG] Using ChessInFive custom leaderboard');
        if (typeof window.renderChessInFiveLeaderboardTable === 'function') {
          table = window.renderChessInFiveLeaderboardTable(data.scores);
        } else {
          console.warn('[DEBUG] ChessInFive custom renderer not available, using generic');
          table = renderLeaderboardTable(data.scores, true);
        }
      } else {
        console.log('[DEBUG] Using generic leaderboard');
        table = renderLeaderboardTable(data.scores, true);
      }
      contentArea.innerHTML = '';
      contentArea.appendChild(table);

      // Actualizar paginación
      const currentPage = Math.floor(state.currentOffset / state.limit) + 1;
      pageInfo.textContent = `Page ${currentPage}`;

      // Habilitar/deshabilitar botones según disponibilidad
      prevBtn.disabled = state.currentOffset === 0;
      nextBtn.disabled = !data.pagination.hasMore;

    } catch (error) {
      console.error('Error loading leaderboard:', error);
      contentArea.innerHTML = `
        <div class="error">
          <p>❌ Error loading leaderboard</p>
          <p class="error-message">${error.message}</p>
          <button class="retry-btn" onclick="loadLeaderboard()">Retry</button>
        </div>
      `;
    } finally {
      state.loading = false;
    }
  }

  // Mostrar modal
  const modal = showModal('🏆 Global Leaderboard', container, {
    closeable: true
  });

  // Cargar leaderboard inicial
  await loadLeaderboard();

  return modal;
}

// ===========================================================================
// SCORE RESULT DISPLAY
// ===========================================================================

/**
 * Muestra el resultado después de submit un score
 *
 * Se llama desde la victory screen después de submitScore().
 * Muestra un mensaje personalizado según el rank obtenido.
 *
 * @param {object} result - Resultado de submitScore()
 * @param {number} result.rank - Rank obtenido
 * @param {number} result.totalPlayers - Total de jugadores
 * @param {number} result.score - Score guardado
 * @param {string} result.message - Mensaje del backend
 */
function showScoreResult(result) {
  let icon = '🎮';
  let title = 'Score Saved!';
  let message = result.message || `Rank #${result.rank} of ${result.totalPlayers}`;

  // Personalizar según rank
  if (result.rank === 1) {
    icon = '👑';
    title = 'NEW #1!';
    showToast('🎉 You are the CHAMPION!', 'success', 5000);
  } else if (result.rank <= 3) {
    icon = '🏆';
    title = 'TOP 3!';
    showToast(`${icon} Rank #${result.rank}!`, 'success', 4000);
  } else if (result.rank <= 10) {
    icon = '🎯';
    title = 'TOP 10!';
    showToast(message, 'success');
  } else if (result.rank <= 50) {
    icon = '⭐';
    title = 'TOP 50!';
    showToast(message, 'success');
  } else {
    showToast(message, 'info');
  }

  // Crear contenido del modal
  const content = `
    <div class="score-result">
      <div class="result-icon">${icon}</div>
      <h3 class="result-title">${title}</h3>
      <div class="result-stats">
        <div class="stat">
          <span class="stat-label">Your Score</span>
          <span class="stat-value">${result.score.toLocaleString()}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Your Rank</span>
          <span class="stat-value">#${result.rank}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Total Players</span>
          <span class="stat-value">${result.totalPlayers}</span>
        </div>
      </div>
      <button class="view-leaderboard-btn" onclick="closeModal(this.closest('.modal-overlay')); showLeaderboardModal();">
        View Full Leaderboard 🏆
      </button>
    </div>
  `;

  // Mostrar modal
  showModal('Score Submitted!', content, {
    closeable: true
  });
}

// ===========================================================================
// CUSTOM GAME RENDERERS (Cross-Game Compatibility)
// ===========================================================================

/**
 * Helper: Get rank emoji for top 3
 */
function getRankEmoji(rank) {
  if (rank === 1) return '🥇 ';
  if (rank === 2) return '🥈 ';
  if (rank === 3) return '🥉 ';
  return '';
}

/**
 * Custom renderer for Square Rush leaderboard
 * Columnas: RANK | PLAYER | SCORE | LEVEL | TARGETS | COMBO
 *
 * IMPORTANTE: Esta función está en leaderboard-ui.js (global) para estar
 * disponible desde CUALQUIER juego, permitiendo cross-game viewing.
 */
function renderSquareRushLeaderboardTable(scores) {
  console.log('🎯 [CUSTOM] Rendering Square Rush leaderboard with', scores.length, 'scores');

  if (!scores || scores.length === 0) {
    return '<p class="no-scores">No scores yet. Be the first!</p>';
  }

  let html = `
    <table class="leaderboard-table">
      <thead>
        <tr>
          <th>RANK</th>
          <th>PLAYER</th>
          <th>SCORE</th>
          <th>LEVEL</th>
          <th>TARGETS</th>
          <th>COMBO</th>
        </tr>
      </thead>
      <tbody>
  `;

  scores.forEach((entry, index) => {
    const rank = entry.rank || (index + 1);
    const playerName = entry.player_name || 'PLAYER';
    const score = entry.score || 0;

    // Player name con iniciales destacadas + bandera
    const initials = playerName.substring(0, 3).toUpperCase();
    const rest = playerName.substring(3);

    // Bandera inline
    let flagHTML = '';
    if (entry.country && entry.country.code) {
      const countryCode = entry.country.code.toLowerCase();
      const countryName = entry.country.name || entry.country.code;
      flagHTML = `
        <img
          src="https://flagcdn.com/16x12/${countryCode}.png"
          srcset="https://flagcdn.com/32x24/${countryCode}.png 2x,
                  https://flagcdn.com/48x36/${countryCode}.png 3x"
          width="16"
          height="12"
          alt="${countryName}"
          title="${countryName}"
          class="country-flag"
          style="margin-left: 6px; vertical-align: middle;"
        >
      `;
    }

    const playerNameHTML = `<span class="player-initials">${initials}</span>${rest}${flagHTML}`;

    // Metadata
    const metadata = entry.metadata || {};
    const levelReached = metadata.level_reached || '-';
    const maxCombo = metadata.max_combo ? `x${metadata.max_combo}` : '-';
    const targetsFound = metadata.targets_found || '-';

    // Clase especial para top 3
    let rowClass = 'score-row';
    if (rank === 1) rowClass += ' rank-1';
    else if (rank === 2) rowClass += ' rank-2';
    else if (rank === 3) rowClass += ' rank-3';

    html += `
      <tr class="${rowClass}">
        <td class="rank">${getRankEmoji(rank)}${rank}</td>
        <td class="player-name">${playerNameHTML}</td>
        <td class="score">${score.toLocaleString()}</td>
        <td class="level">${levelReached}</td>
        <td class="level">${targetsFound}</td>
        <td class="level">${maxCombo}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  // Crear elemento tabla desde HTML string
  const container = document.createElement('div');
  container.innerHTML = html;
  return container.firstElementChild;
}

/**
 * Custom renderer for ChessInFive leaderboard
 * Columnas: RANK | PLAYER | SCORE | MOVES | TIME | PHASE | TYPE
 *
 * IMPORTANTE: Esta función está en leaderboard-ui.js (global) para estar
 * disponible desde CUALQUIER juego, permitiendo cross-game viewing.
 */
function renderChessInFiveLeaderboardTable(scores) {
  console.log('♟️ [CUSTOM] Rendering ChessInFive leaderboard with', scores.length, 'scores');

  if (!scores || scores.length === 0) {
    return '<p class="no-scores">No scores yet. Be the first!</p>';
  }

  let html = `
    <table class="leaderboard-table">
      <thead>
        <tr>
          <th class="rank">Rank</th>
          <th class="player-name">Player</th>
          <th class="score">Score</th>
          <th class="level">Moves</th>
          <th class="time">Time</th>
          <th class="level">Phase</th>
          <th class="level">Type</th>
        </tr>
      </thead>
      <tbody>
  `;

  scores.forEach((entry, index) => {
    const rank = entry.rank || (index + 1);
    const score = entry.score || 0;

    // Player name con iniciales destacadas + bandera
    const playerName = entry.player_name || 'UNKNOWN';
    const initials = playerName.substring(0, 3).toUpperCase();
    const rest = playerName.substring(3);

    // Bandera inline
    let flagHTML = '';
    if (entry.country && entry.country.code) {
      const countryCode = entry.country.code.toLowerCase();
      const countryName = entry.country.name || entry.country.code;
      flagHTML = `
        <img
          src="https://flagcdn.com/16x12/${countryCode}.png"
          srcset="https://flagcdn.com/32x24/${countryCode}.png 2x,
                  https://flagcdn.com/48x36/${countryCode}.png 3x"
          width="16"
          height="12"
          alt="${countryName}"
          title="${countryName}"
          class="country-flag"
          style="margin-left: 6px; vertical-align: middle;"
        >
      `;
    }

    const playerNameHTML = `<span class="player-initials">${initials}</span>${rest}${flagHTML}`;

    // Metadata
    const metadata = entry.metadata || {};
    const moveCount = metadata.moves || metadata.move_count || '-';
    const timeSeconds = metadata.time || metadata.time_seconds || 0;
    const finalPhase = metadata.phase || metadata.final_phase || '-';
    const playerType = metadata.player_type || 'Unknown';

    // Format time as MM:SS
    let timeDisplay = '-';
    if (timeSeconds > 0) {
      const minutes = Math.floor(timeSeconds / 60);
      const secs = timeSeconds % 60;
      timeDisplay = `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    // Format phase with emoji
    let phaseDisplay = '-';
    if (finalPhase === 1 || finalPhase === 'gravity') {
      phaseDisplay = '🪂 1';
    } else if (finalPhase === 2 || finalPhase === 'chess') {
      phaseDisplay = '♟️ 2';
    }

    // Format player type with emoji
    let typeDisplay = playerType;
    if (playerType.includes('Human')) {
      typeDisplay = '👤';
    } else if (playerType.includes('AI vs AI')) {
      typeDisplay = '🤖🤖';
    } else if (playerType.includes('AI')) {
      typeDisplay = '🤖';
    }

    // Clase especial para top 3
    let rowClass = 'score-row';
    if (rank === 1) rowClass += ' rank-1';
    else if (rank === 2) rowClass += ' rank-2';
    else if (rank === 3) rowClass += ' rank-3';

    html += `
      <tr class="${rowClass}">
        <td class="rank">${getRankEmoji(rank)}${rank}</td>
        <td class="player-name">${playerNameHTML}</td>
        <td class="score">${score.toLocaleString()}</td>
        <td class="level">${moveCount}</td>
        <td class="time">${timeDisplay}</td>
        <td class="level">${phaseDisplay}</td>
        <td class="level">${typeDisplay}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  // Crear elemento tabla desde HTML string
  const container = document.createElement('div');
  container.innerHTML = html;
  return container.firstElementChild;
}

// Exponer custom renderers a window para acceso cross-game
window.renderSquareRushLeaderboardTable = renderSquareRushLeaderboardTable;
window.renderChessInFiveLeaderboardTable = renderChessInFiveLeaderboardTable;

console.log('✅ [CUSTOM RENDERERS] Square Rush and ChessInFive renderers loaded globally');

// ===========================================================================
// EXPORTS
// ===========================================================================

/**
 * Funciones disponibles globalmente:
 * - showToast(message, type, duration)
 * - showModal(title, content, options)
 * - closeModal(overlay)
 * - renderScoreRow(score, highlightTop3)
 * - renderLeaderboardTable(scores, showTime)
 * - showLeaderboardModal(initialGame)
 * - showScoreResult(result)
 */

// Log cuando se carga el módulo
console.log('[leaderboard-ui.js] UI components loaded successfully');
