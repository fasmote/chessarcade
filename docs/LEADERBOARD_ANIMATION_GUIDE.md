# Guía: Animación de Ranking en Leaderboard

Esta guía explica cómo implementar la animación de "descenso en el ranking" cuando termina un juego.
Fue implementada primero en Master Sequence y puede replicarse en otros juegos.

## Resumen de Características

1. **Animación de ranking al terminar**: Muestra tu score "descendiendo" por el leaderboard hasta encontrar su posición
2. **Mensaje motivacional**: Según tu posición (TOP 3, TOP 10, etc.)
3. **Input de nombre prominente**: Con animación de "latido" para llamar la atención
4. **Fila destacada en Global Leaderboard**: Resalta tu entrada después de guardar
5. **Manejo de score 0**: Mensaje de consuelo en vez de pedir guardar
6. **Botones reorganizados**: Navegación discreta arriba del Game Over

---

## Archivos a Crear/Modificar

### 1. Crear: `ranking-animation.js`

Ubicación: `games/[nombre-juego]/ranking-animation.js`

```javascript
/**
 * ========================================
 * RANKING ANIMATION COMPONENT
 * ========================================
 */

(function() {
    'use strict';

    // CONFIGURACIÓN - ajustar según el juego
    const ANIMATION_DELAY_PER_POSITION = 200; // ms entre cada posición
    const MAX_POSITIONS_TO_SHOW = 5;
    const PAUSE_AT_FINAL_POSITION = 1000;
    const GAME_ID = 'nombre-del-juego'; // Cambiar por el ID del juego

    // Flag para prevenir animaciones duplicadas
    let isAnimating = false;

    // MENSAJES MOTIVACIONALES
    const MESSAGES = {
        top1: ['🏆 ¡NUEVO RECORD!', '👑 ¡ERES EL #1!'],
        top3: ['🥇 ¡TOP 3!', '⭐ ¡EXCELENTE!'],
        top10: ['💪 ¡TOP 10!', '🎯 ¡MUY BIEN!'],
        top50: ['👍 ¡BUEN SCORE!', '📈 ¡VAS MEJORANDO!'],
        other: ['🎮 ¡BUEN INTENTO!', '🔄 ¡INTÉNTALO DE NUEVO!']
    };

    function getRandomMessage(category) {
        const messages = MESSAGES[category];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    function getMotivationalMessage(rank) {
        if (rank === 1) return getRandomMessage('top1');
        if (rank <= 3) return getRandomMessage('top3');
        if (rank <= 10) return getRandomMessage('top10');
        if (rank <= 50) return getRandomMessage('top50');
        return getRandomMessage('other');
    }

    function calculateRank(score, leaderboard) {
        if (!leaderboard || leaderboard.length === 0) return 1;
        for (let i = 0; i < leaderboard.length; i++) {
            if (score > leaderboard[i].score) return i + 1;
        }
        return leaderboard.length + 1;
    }

    function createAnimationContainer() {
        const container = document.createElement('div');
        container.id = 'rankingAnimationContainer';
        container.className = 'ranking-animation-container';
        container.innerHTML = `
            <div class="ranking-animation-header">
                <span class="ranking-animation-title">TU POSICIÓN</span>
                <span class="ranking-animation-score" id="rankingAnimScore"></span>
            </div>
            <div class="ranking-animation-body">
                <div class="ranking-list" id="rankingAnimList"></div>
            </div>
            <div class="ranking-animation-message" id="rankingAnimMessage"></div>
        `;
        return container;
    }

    async function showRankingAnimation(playerScore, targetContainer) {
        if (isAnimating) return;
        isAnimating = true;

        let leaderboard = [];
        let finalRank = 1;

        try {
            const data = await getLeaderboard(GAME_ID, { limit: 50 });
            leaderboard = data.scores || [];
        } catch (error) {
            console.warn('Could not fetch leaderboard:', error);
        }

        finalRank = calculateRank(playerScore, leaderboard);

        const container = createAnimationContainer();
        const finalStats = targetContainer.querySelector('.final-stats');
        if (finalStats) {
            finalStats.after(container);
        } else {
            targetContainer.appendChild(container);
        }

        document.getElementById('rankingAnimScore').textContent = playerScore.toLocaleString();
        const listContainer = document.getElementById('rankingAnimList');
        const messageDisplay = document.getElementById('rankingAnimMessage');

        const combinedList = buildCombinedList(leaderboard, playerScore, finalRank);

        container.classList.add('show');

        for (let i = 0; i < combinedList.length; i++) {
            const item = combinedList[i];
            const row = document.createElement('div');

            if (item.isPlayer) {
                row.className = 'ranking-list-row player-row';
                row.innerHTML = `
                    <span class="rank-position">#${item.rank}</span>
                    <span class="rank-name">TÚ</span>
                    <span class="rank-score">${playerScore.toLocaleString()}</span>
                `;
            } else {
                row.className = 'ranking-list-row';
                row.innerHTML = `
                    <span class="rank-position">#${item.rank}</span>
                    <span class="rank-name">${item.player_name || 'PLAYER'}</span>
                    <span class="rank-score">${item.score.toLocaleString()}</span>
                `;
            }

            row.style.opacity = '0';
            row.style.transform = 'translateX(-20px)';
            listContainer.appendChild(row);

            await sleep(50);
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = '1';
            row.style.transform = 'translateX(0)';

            if (item.isPlayer) {
                row.classList.add('found-position');
                await sleep(PAUSE_AT_FINAL_POSITION);
            } else {
                await sleep(ANIMATION_DELAY_PER_POSITION);
            }
        }

        messageDisplay.textContent = getMotivationalMessage(finalRank);
        messageDisplay.classList.add('show');

        await sleep(300);
        const nameInput = document.getElementById('gameOverPlayerNameInput');
        if (nameInput) {
            nameInput.classList.add('highlight-input');
            nameInput.focus();
        }

        isAnimating = false;
    }

    function buildCombinedList(leaderboard, playerScore, playerRank) {
        const combined = [];
        let playerInserted = false;
        const startPos = Math.max(0, playerRank - 3);
        const endPos = Math.min(leaderboard.length, playerRank + 2);

        for (let i = startPos; i < endPos; i++) {
            const score = leaderboard[i];
            const originalRank = i + 1;

            if (!playerInserted && playerScore > score.score) {
                combined.push({ isPlayer: true, rank: playerRank, score: playerScore });
                playerInserted = true;
            }

            combined.push({
                isPlayer: false,
                rank: playerInserted ? originalRank + 1 : originalRank,
                player_name: score.player_name,
                score: score.score
            });
        }

        if (!playerInserted) {
            combined.push({ isPlayer: true, rank: playerRank, score: playerScore });
        }

        return combined.slice(0, MAX_POSITIONS_TO_SHOW);
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function clearRankingAnimation() {
        isAnimating = false;
        const container = document.getElementById('rankingAnimationContainer');
        if (container) container.remove();
        const nameInput = document.getElementById('gameOverPlayerNameInput');
        if (nameInput) nameInput.classList.remove('highlight-input');
    }

    window.showRankingAnimation = showRankingAnimation;
    window.clearRankingAnimation = clearRankingAnimation;
})();
```

---

### 2. Modificar: `leaderboard-integration.js`

Agregar al inicio del archivo:
```javascript
window.lastSubmittedPlayerName = null;
window.lastSubmittedScore = null;
```

En el MutationObserver del gameOverOverlay, agregar:
```javascript
// Obtener el score final
const finalScore = parseInt(document.getElementById('finalScore')?.textContent) || 0;

// Manejar caso score = 0
if (finalScore === 0) {
    document.getElementById('gameOverSubmitSection').style.display = 'none';
    document.getElementById('zeroScoreMessage').style.display = 'block';
} else {
    document.getElementById('gameOverSubmitSection').style.display = 'block';
    document.getElementById('zeroScoreMessage').style.display = 'none';

    // Mostrar animación de ranking
    if (typeof window.showRankingAnimation === 'function') {
        setTimeout(() => {
            window.showRankingAnimation(finalScore, overlayContent);
        }, 500);
    }
}
```

Después de submit exitoso:
```javascript
window.lastSubmittedPlayerName = playerName;
window.lastSubmittedScore = finalScore;

// Al abrir leaderboard:
window.showLeaderboardModal('nombre-juego', {
    highlightPlayer: playerName,
    highlightScore: finalScore
});
```

---

### 3. Modificar: `leaderboard-ui.js`

En `showLeaderboardModal`:
```javascript
async function showLeaderboardModal(initialGame, options = {}) {
    const state = {
        // ...
        highlightPlayer: options.highlightPlayer || window.lastSubmittedPlayerName || null,
        highlightScore: options.highlightScore || window.lastSubmittedScore || null
    };
    // ...
}
```

En la función de renderizado de tabla (ej: `renderMasterSequenceLeaderboardTable`):
```javascript
function renderLeaderboardTable(scores, highlightPlayer = null, highlightScore = null) {
    // En el map de scores:
    const nameMatches = highlightPlayer && score.player_name?.toLowerCase() === highlightPlayer.toLowerCase();
    const scoreMatches = highlightScore === null || score.score === highlightScore;

    if (nameMatches && scoreMatches) {
        // Agregar clase 'highlight-player-row'
    }
}
```

---

### 4. CSS Necesarios

Agregar a `styles.css` del juego:

```css
/* RANKING ANIMATION */
.ranking-animation-container {
    background: rgba(0, 0, 0, 0.9);
    border: 2px solid var(--neon-cyan);
    border-radius: 8px;
    padding: 0.75rem;
    margin: 0.75rem 0;
    opacity: 0;
    transform: translateY(-20px);
    transition: all 0.5s ease;
}

.ranking-animation-container.show {
    opacity: 1;
    transform: translateY(0);
}

.ranking-list-row {
    display: grid;
    grid-template-columns: 50px 1fr 80px;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 5px;
    margin-bottom: 0.25rem;
}

.ranking-list-row.player-row {
    background: linear-gradient(90deg, rgba(255, 0, 128, 0.3), rgba(0, 255, 255, 0.3));
    border: 2px solid var(--neon-magenta);
    animation: pulseGlow 1s ease-in-out infinite;
}

@keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 15px rgba(255, 0, 128, 0.5); }
    50% { box-shadow: 0 0 30px rgba(255, 0, 128, 0.8); }
}

/* INPUT DE NOMBRE PROMINENTE */
.name-input-container {
    margin: 1rem 0;
    padding: 1rem;
    background: rgba(255, 0, 128, 0.1);
    border: 2px solid var(--neon-magenta);
    border-radius: 10px;
    animation: nameContainerPulse 2s ease-in-out infinite;
}

@keyframes nameContainerPulse {
    0%, 100% { transform: scale(1); box-shadow: 0 0 10px rgba(255, 0, 128, 0.3); }
    50% { transform: scale(1.02); box-shadow: 0 0 25px rgba(255, 0, 128, 0.6); }
}

/* MENSAJE DE CONSUELO (score=0) */
.zero-score-message {
    text-align: center;
    padding: 1.5rem;
    background: rgba(255, 255, 0, 0.1);
    border: 2px solid var(--neon-yellow);
    border-radius: 10px;
}
```

Agregar a `leaderboard.css`:

```css
/* HIGHLIGHT PLAYER ROW */
.highlight-player-row {
    background: linear-gradient(90deg, rgba(255, 0, 128, 0.3), rgba(0, 255, 255, 0.2)) !important;
    border: 2px solid var(--neon-magenta) !important;
    animation: highlightPulse 1.5s ease-in-out infinite;
}
```

---

### 5. HTML del Game Over Overlay

```html
<div id="gameOverOverlay" class="overlay hidden">
    <div class="overlay-content game-over">
        <!-- Botones de navegación discretos arriba -->
        <div class="game-over-nav-buttons">
            <button class="btn-nav-small" id="gameOverViewLeaderboardBtn">👁️ LEADERBOARD</button>
            <button class="btn-nav-small" id="btnRestart">🔄 JUGAR</button>
            <button class="btn-nav-small" id="btnRestartGame">🏠 INICIO</button>
        </div>

        <div class="overlay-icon">💀</div>
        <h2 class="overlay-title">Game Over</h2>
        <div class="final-stats">...</div>

        <!-- La animación de ranking se inserta aquí dinámicamente -->

        <!-- Sección para guardar score (oculta si score=0) -->
        <div id="gameOverSubmitSection">
            <div class="name-input-container">
                <label class="name-input-label">✨ Ingresa tu Nombre:</label>
                <input type="text" id="gameOverPlayerNameInput" class="name-input-field">
            </div>
            <button class="btn-submit-score" id="gameOverSubmitScoreBtn">🏆 GUARDAR SCORE</button>
        </div>

        <!-- Mensaje de consuelo (visible si score=0) -->
        <div id="zeroScoreMessage" style="display: none;">
            <div class="consolation-icon">🎮</div>
            <p class="consolation-text">¡No te rindas!</p>
            <p class="consolation-subtext">Necesitas completar al menos un nivel para guardar tu score.</p>
        </div>
    </div>
</div>
```

---

## 6. Vista Dividida en Global Leaderboard

Cuando el jugador está muy lejos del top (posición > 10), no puede ver su fila sin hacer scroll.
La solución es una **vista dividida** que muestra:

1. **Top 5 posiciones**
2. **Separador visual** ("• • •")
3. **Posiciones alrededor del jugador** (2 antes, su fila, 2 después)

### Modificar `leaderboard-ui.js` (función `renderXxxLeaderboardTable`)

```javascript
// Encontrar la posición del jugador destacado
let playerIndex = -1;
if (highlightPlayer && highlightScore !== null) {
  playerIndex = scores.findIndex(score =>
    score.player_name?.toLowerCase() === highlightPlayer.toLowerCase() &&
    score.score === highlightScore
  );
}

// Determinar si usar vista dividida (jugador en posición > 10)
const useSplitView = playerIndex > 9; // índice 9 = posición 10

if (useSplitView) {
  const TOP_COUNT = 5;           // Mostrar las primeras 5 posiciones
  const CONTEXT_BEFORE = 2;      // Mostrar 2 posiciones antes del jugador
  const CONTEXT_AFTER = 2;       // Mostrar 2 posiciones después del jugador

  let htmlRows = [];

  // 1. Mostrar Top 5
  for (let i = 0; i < Math.min(TOP_COUNT, scores.length); i++) {
    htmlRows.push(renderRowWithHighlight(scores[i]));
  }

  // 2. Agregar fila separadora "..."
  htmlRows.push(`
    <tr class="separator-row">
      <td colspan="6" class="text-center separator-dots">• • •</td>
    </tr>
  `);

  // 3. Calcular rango de posiciones alrededor del jugador
  const startIndex = Math.max(TOP_COUNT, playerIndex - CONTEXT_BEFORE);
  const endIndex = Math.min(scores.length - 1, playerIndex + CONTEXT_AFTER);

  // 4. Mostrar posiciones alrededor del jugador
  for (let i = startIndex; i <= endIndex; i++) {
    htmlRows.push(renderRowWithHighlight(scores[i]));
  }

  tbody.innerHTML = htmlRows.join('');
} else {
  // Vista normal
  tbody.innerHTML = scores.map(score => renderRowWithHighlight(score)).join('');
}
```

### HTML del separador (en el código JS)

```javascript
// Calcular cuántas posiciones están ocultas
const startIndex = Math.max(TOP_COUNT, playerIndex - CONTEXT_BEFORE);
const hiddenCount = startIndex - TOP_COUNT;

// Agregar fila separadora NOTORIA con indicador de posiciones ocultas
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
```

### CSS para separador (agregar a `leaderboard.css`)

```css
/* Fila separadora */
.separator-row {
  background: transparent !important;
  border: none !important;
}

.separator-cell {
  padding: 0.75rem 0 !important;
  border: none !important;
}

/* Contenedor del indicador de separación */
.separator-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 0.5rem 0;
}

/* Líneas decorativas a los lados */
.separator-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg,
    transparent,
    var(--neon-yellow, #ffff00) 20%,
    var(--neon-yellow, #ffff00) 80%,
    transparent
  );
  max-width: 80px;
  box-shadow: 0 0 8px var(--neon-yellow, #ffff00);
}

/* Texto central con las posiciones ocultas */
.separator-text {
  color: var(--neon-yellow, #ffff00);
  font-size: 0.85rem;
  font-weight: bold;
  letter-spacing: 0.05rem;
  text-shadow: 0 0 10px var(--neon-yellow, #ffff00);
  background: rgba(255, 255, 0, 0.1);
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  border: 1px dashed var(--neon-yellow, #ffff00);
  white-space: nowrap;
}
```

---

## Checklist de Implementación

- [ ] Crear `ranking-animation.js` (cambiar GAME_ID)
- [ ] Agregar script en `index.html` antes de `leaderboard-integration.js`
- [ ] Modificar `leaderboard-integration.js` con variables globales y lógica
- [ ] Actualizar HTML del Game Over overlay
- [ ] Agregar CSS de ranking animation a `styles.css`
- [ ] Verificar que `leaderboard.css` tiene `.highlight-player-row`
- [ ] Verificar que `leaderboard.css` tiene `.separator-row` y `.separator-dots`
- [ ] Implementar vista dividida en `renderXxxLeaderboardTable()`
- [ ] Probar: terminar juego con score > 0
- [ ] Probar: terminar juego con score = 0
- [ ] Probar: abrir leaderboard después de guardar (fila destacada)
- [ ] Probar: guardar score en posición > 10 (vista dividida)

---

## Notas Importantes

1. **GAME_ID**: Debe coincidir exactamente con el ID usado en la base de datos
2. **Variables globales**: `window.lastSubmittedPlayerName` y `window.lastSubmittedScore` permiten que el leaderboard destaque la fila correcta
3. **Score = 0**: Mostrar mensaje de consuelo, NO el formulario de guardar
4. **Highlight único**: Comparar nombre Y score para no destacar todas las filas del mismo jugador
5. **Vista dividida**: Se activa automáticamente si el jugador está en posición > 10
6. **colspan**: Ajustar según la cantidad de columnas de la tabla del juego

---

Creado: Diciembre 2024
Implementado primero en: Master Sequence
