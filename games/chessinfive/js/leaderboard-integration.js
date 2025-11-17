/**
 * ========================================
 * CHESSINFIVE - LEADERBOARD INTEGRATION
 * ========================================
 *
 * Integración del sistema de leaderboard global en ChessInFive.
 *
 * Este módulo se encarga de:
 * 1. Cargar/guardar el nombre del jugador ganador desde localStorage
 * 2. Conectar los botones del Game Over modal con el leaderboard
 * 3. Enviar el score del ganador al leaderboard global
 * 4. Mostrar el leaderboard cuando se solicita
 *
 * NOTA: ChessInFive es un juego multiplayer local (2 jugadores)
 * Solo el jugador ganador puede enviar su score al leaderboard
 */

(function() {
    'use strict';

    // ========================================
    // CONFIGURACIÓN
    // ========================================

    const STORAGE_KEY = 'chessInFivePlayerName';
    const GAME_ID = 'chessinfive';

    // ========================================
    // CARGAR NOMBRE GUARDADO
    // ========================================

    function loadSavedName() {
        const savedName = localStorage.getItem(STORAGE_KEY);
        const playerInput = document.getElementById('gameOverPlayerNameInput');
        if (savedName && playerInput) {
            playerInput.value = savedName;
            console.log('📝 Loaded saved player name:', savedName);
        }
    }

    // Cargar nombre al inicio
    window.addEventListener('DOMContentLoaded', () => {
        loadSavedName();
    });

    // También cargar cuando se muestra el Game Over modal
    const gameOverObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const gameOverModal = document.getElementById('gameOverModal');
                if (gameOverModal && gameOverModal.style.display !== 'none') {
                    console.log('👁️ [CHESSINFIVE] Game Over modal is now visible');
                    loadSavedName();

                    // Verificar estado del botón Submit
                    const submitBtn = document.getElementById('gameOverSubmitScoreBtn');
                    if (submitBtn) {
                        console.log('🔘 [CHESSINFIVE] Submit button found!');
                        console.log('   - disabled:', submitBtn.disabled);
                        console.log('   - textContent:', submitBtn.textContent);
                        console.log('   - display:', submitBtn.style.display);
                        console.log('   - classList:', submitBtn.classList.toString());
                    } else {
                        console.error('❌ [CHESSINFIVE] Submit button NOT FOUND in modal!');
                    }
                }
            }
        });
    });

    const gameOverModal = document.getElementById('gameOverModal');
    if (gameOverModal) {
        gameOverObserver.observe(gameOverModal, { attributes: true });
    }

    // ========================================
    // ENVIAR SCORE AL LEADERBOARD
    // ========================================

    async function submitGameOverScore() {
        console.log('🎯 [CHESSINFIVE] ========================================');
        console.log('🎯 [CHESSINFIVE] Submit Score button CLICKED!');
        console.log('🎯 [CHESSINFIVE] ========================================');

        const playerInput = document.getElementById('gameOverPlayerNameInput');
        const playerName = playerInput.value.trim() || 'WINNER';

        console.log('📝 [CHESSINFIVE] Player name from input:', playerName);

        // Save name for future sessions
        localStorage.setItem(STORAGE_KEY, playerName);
        console.log('💾 [CHESSINFIVE] Saved name to localStorage:', playerName);

        // ========================================
        // 📊 CAPTURAR ESTADÍSTICAS DEL JUEGO
        // ========================================
        console.log('📊 [CHESSINFIVE] Capturing game statistics...');

        // Verificar que GameState existe
        console.log('🔍 [CHESSINFIVE] window.GameState exists?', window.GameState ? 'YES' : 'NO');
        if (window.GameState) {
            console.log('🔍 [CHESSINFIVE] GameState.moveHistory:', window.GameState.moveHistory);
            console.log('🔍 [CHESSINFIVE] GameState.phase:', window.GameState.phase);
            console.log('🔍 [CHESSINFIVE] GameState.startTime:', window.GameState.startTime);
            console.log('🔍 [CHESSINFIVE] GameState.gameOver:', window.GameState.gameOver);
        }

        // Get winner information from DOM
        const winnerTitleElement = document.getElementById('winnerTitle');
        const winnerTitle = winnerTitleElement ? winnerTitleElement.textContent : 'UNKNOWN';

        console.log('🏆 [CHESSINFIVE] Winner title from DOM:', winnerTitle);

        // Determine which player won (CYAN or MAGENTA)
        const winnerPlayer = winnerTitle.includes('CYAN') ? 'CYAN' : 'MAGENTA';
        console.log('🏆 [CHESSINFIVE] Winner player:', winnerPlayer);

        // Get game state from global GameState
        // LECCIÓN APRENDIDA: GameState se expuso a window en game-state.js línea 395
        const moveCount = window.GameState?.moveHistory?.length || 0;
        const finalPhase = window.GameState?.phase || 'unknown';
        const elapsedSeconds = window.GameState?.getElapsedTimeSeconds() || 0;

        console.log('📊 [CHESSINFIVE] moveCount:', moveCount);
        console.log('📊 [CHESSINFIVE] finalPhase:', finalPhase);
        console.log('📊 [CHESSINFIVE] elapsedSeconds:', elapsedSeconds);

        // ========================================
        // DETECTAR PLAYER TYPE (Human / AI)
        // ========================================
        // ChessInFive es multiplayer local con AI opcional
        // Necesitamos saber si el ganador es humano o IA
        let playerType = 'Unknown';

        // Check if AI is enabled for the winner
        if (window.AIController && window.AIController.aiEnabled) {
            const aiEnabled = window.AIController.aiEnabled;
            console.log('🤖 [CHESSINFIVE] AI status:', aiEnabled);

            // Determine winner player (cyan or magenta)
            const winnerPlayerLower = winnerPlayer.toLowerCase();

            if (aiEnabled.cyan && aiEnabled.magenta) {
                // Both players are AI
                playerType = 'AI vs AI';
                console.log('🤖🤖 [CHESSINFIVE] Winner is from AI vs AI game');
            } else if (aiEnabled[winnerPlayerLower]) {
                // Winner is AI
                playerType = 'AI';
                console.log('🤖 [CHESSINFIVE] Winner is AI');
            } else {
                // Winner is Human
                playerType = 'Human';
                console.log('👤 [CHESSINFIVE] Winner is Human');
            }
        } else {
            // Assume human if AI controller not available
            playerType = 'Human';
            console.log('👤 [CHESSINFIVE] Assuming Human (AI controller not found)');
        }

        console.log('📊 [CHESSINFIVE] Raw stats:', {
            moveCount,
            finalPhase,
            elapsedSeconds,
            winnerPlayer,
            playerType
        });

        // ========================================
        // 🧮 NUEVO SISTEMA DE SCORING
        // ========================================
        // LECCIÓN APRENDIDA: El score debe reflejar habilidad (menos movimientos y tiempo = mejor)
        //
        // FÓRMULA:
        // Score = 10000 - (moveCount × 50) - (elapsedSeconds × 1) + phaseBonus
        //
        // EXPLICACIÓN:
        // - Base: 10000 puntos para todos
        // - Penalización por movimientos: -50 puntos por cada movimiento extra
        // - Penalización por tiempo: -1 punto por cada segundo
        // - Bonus por fase:
        //   * +3000 si ganó en fase GRAVITY (más difícil - victoria rápida)
        //   * +0 si ganó en fase CHESS (normal)
        // - Mínimo: 1000 puntos (nunca score negativo)

        const phaseBonus = finalPhase === 'gravity' ? 3000 : 0;
        const rawScore = 10000 - (moveCount * 50) - (elapsedSeconds * 1) + phaseBonus;
        const finalScore = Math.max(1000, Math.floor(rawScore));

        console.log('🧮 [CHESSINFIVE] Score calculation:', {
            base: 10000,
            movePenalty: -(moveCount * 50),
            timePenalty: -(elapsedSeconds * 1),
            phaseBonus: phaseBonus,
            rawScore: rawScore,
            finalScore: finalScore
        });

        console.log('📤 [CHESSINFIVE] Submitting score:', {
            playerName,
            finalScore,
            winnerPlayer,
            moveCount,
            elapsedSeconds,
            finalPhase,
            playerType
        });

        try {
            const submitBtn = document.getElementById('gameOverSubmitScoreBtn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'SUBMITTING...';

            // ========================================
            // 🎯 LECCIÓN APRENDIDA: Usar wrapper "metadata"
            // ========================================
            // En Square Rush aprendimos que submitScore() espera:
            // { metadata: { ... } }
            // NO directamente los campos en options
            // Ver: js/leaderboard-api.js línea 325

            const result = await submitScore(
                GAME_ID,
                playerName,
                finalScore,
                {
                    metadata: {  // ← IMPORTANTE: Wrapper necesario
                        winner_player: winnerPlayer,
                        move_count: moveCount,
                        time_seconds: elapsedSeconds,
                        final_phase: finalPhase,
                        phase_bonus: phaseBonus,
                        player_type: playerType  // 🆕 Nuevo campo
                    }
                }
            );

            console.log('✅ [CHESSINFIVE] Metadata sent:', {
                winner_player: winnerPlayer,
                move_count: moveCount,
                time_seconds: elapsedSeconds,
                final_phase: finalPhase,
                phase_bonus: phaseBonus,
                player_type: playerType
            });

            console.log('✅ [CHESSINFIVE] Score submitted successfully:', result);

            showToast(`Score submitted! Rank #${result.rank} of ${result.totalPlayers}`, 'success');

            submitBtn.disabled = true;  // Keep disabled to prevent multiple submissions
            submitBtn.textContent = '✅ SUBMITTED!';

            // ========================================
            // 🎯 LECCIÓN APRENDIDA: Auto-close modal + auto-open leaderboard
            // ========================================
            // Pattern de Memory Matrix y Square Rush:
            // 1. Wait 2 seconds (let user see success message)
            // 2. Close modal
            // 3. Open leaderboard automatically
            setTimeout(() => {
                console.log('🔒 [CHESSINFIVE] Closing Game Over modal after successful submission');

                // Close the Game Over modal
                const gameOverModal = document.getElementById('gameOverModal');
                if (gameOverModal) {
                    gameOverModal.style.display = 'none';
                    console.log('✅ [CHESSINFIVE] Game Over modal closed');
                }

                // Wait a bit, then open leaderboard
                setTimeout(() => {
                    console.log('📊 [CHESSINFIVE] Opening leaderboard after score submission');
                    if (window.showLeaderboardModal) {
                        window.showLeaderboardModal('chessinfive');
                        console.log('✅ [CHESSINFIVE] Leaderboard opened');
                    } else {
                        console.error('❌ [CHESSINFIVE] showLeaderboardModal not found');
                    }
                }, 300);  // Small delay for smooth transition
            }, 2000);  // 2 seconds to let user see "SUBMITTED!" message

        } catch (error) {
            console.error('Error submitting score:', error);
            showToast(`Error: ${error.message}`, 'error');

            const submitBtn = document.getElementById('gameOverSubmitScoreBtn');
            submitBtn.disabled = false;
            submitBtn.textContent = '🏆 SUBMIT SCORE';
        }
    }

    // ========================================
    // EVENT LISTENERS
    // ========================================

    // Botón "Submit Score" en Game Over modal
    const gameOverSubmitBtn = document.getElementById('gameOverSubmitScoreBtn');
    if (gameOverSubmitBtn) {
        gameOverSubmitBtn.addEventListener('click', submitGameOverScore);
        console.log('✅ Game Over Submit Score button connected');
    } else {
        console.warn('⚠️ Game Over Submit Score button not found');
    }

    // Botón "View Leaderboard" en Game Over modal
    const gameOverViewLeaderboardBtn = document.getElementById('gameOverViewLeaderboardBtn');
    if (gameOverViewLeaderboardBtn) {
        gameOverViewLeaderboardBtn.addEventListener('click', () => {
            showLeaderboardModal(GAME_ID);
        });
        console.log('✅ Game Over View Leaderboard button connected');
    } else {
        console.warn('⚠️ Game Over View Leaderboard button not found');
    }

    // Botón "Leaderboard" en header
    const btnLeaderboard = document.getElementById('btnLeaderboard');
    if (btnLeaderboard) {
        btnLeaderboard.addEventListener('click', () => {
            showLeaderboardModal(GAME_ID);
        });
        console.log('✅ Header Leaderboard button connected');
    } else {
        console.warn('⚠️ Header Leaderboard button not found');
    }

    console.log('✅ ChessInFive Leaderboard Integration loaded');

})();

// ========================================
// CUSTOM LEADERBOARD RENDERING
// ========================================

/**
 * Renderizar leaderboard custom para ChessInFive
 * Columnas: RANK | PLAYER | SCORE | MOVES | TIME | PHASE | TYPE
 *
 * LECCIÓN APRENDIDA: Cada juego necesita su propia función de rendering
 * para mostrar columnas específicas del metadata
 */
function renderChessInFiveLeaderboardTable(scores) {
    console.log('♟️ [RENDER] Rendering custom ChessInFive leaderboard with', scores.length, 'scores');

    if (!scores || scores.length === 0) {
        console.log('⚠️ [RENDER] No scores to display');
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

        console.log(`🔍 [RENDER] Row ${rank}:`, {
            player: entry.player_name,
            score: score,
            metadata: entry.metadata,
            country: entry.country
        });

        // ========================================
        // PLAYER NAME con iniciales destacadas + bandera
        // ========================================
        // Patrón de Memory Matrix para estilo arcade retro
        const playerName = entry.player_name || 'UNKNOWN';
        const initials = playerName.substring(0, 3).toUpperCase();
        const rest = playerName.substring(3);

        // Bandera inline (al lado del nombre)
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
            console.log(`🚩 [RENDER] Row ${rank}: Flag added for ${countryName}`);
        } else {
            console.log(`⚠️ [RENDER] Row ${rank}: No country data`);
        }

        const playerNameHTML = `<span class="player-initials">${initials}</span>${rest}${flagHTML}`;

        // ========================================
        // METADATA
        // ========================================
        const metadata = entry.metadata || {};
        const moveCount = metadata.move_count || '-';
        const timeSeconds = metadata.time_seconds || 0;
        const finalPhase = metadata.final_phase || '-';
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
        if (finalPhase === 'gravity') {
            phaseDisplay = '🪂 Gravity';
        } else if (finalPhase === 'chess') {
            phaseDisplay = '♟️ Chess';
        }

        // Format player type with emoji
        let typeDisplay = '-';
        if (playerType === 'Human') {
            typeDisplay = '👤 Human';
        } else if (playerType === 'AI') {
            typeDisplay = '🤖 AI';
        } else if (playerType === 'AI vs AI') {
            typeDisplay = '🤖🤖 AI vs AI';
        }

        // Clase especial para top 3
        let rowClass = 'score-row';  // Base class for all rows
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

    console.log('✅ [RENDER] ChessInFive leaderboard table HTML generated');

    // Crear elemento tabla desde HTML string
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.firstElementChild;
}

/**
 * Obtener emoji para el ranking
 */
function getRankEmoji(rank) {
    if (rank === 1) return '🥇 ';
    if (rank === 2) return '🥈 ';
    if (rank === 3) return '🥉 ';
    return '';
}

// ========================================
// EXPONER FUNCIÓN AL SCOPE GLOBAL
// ========================================
// LECCIÓN APRENDIDA: leaderboard-ui.js busca funciones con nombre específico
// window.render[GameName]LeaderboardTable()
window.renderChessInFiveLeaderboardTable = renderChessInFiveLeaderboardTable;

console.log('✅ ChessInFive custom leaderboard rendering registered');
