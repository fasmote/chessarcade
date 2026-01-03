/**
 * ========================================
 * MASTER SEQUENCE - LEADERBOARD INTEGRATION
 * ========================================
 *
 * Integración del sistema de leaderboard global en Master Sequence.
 *
 * Este módulo se encarga de:
 * 1. Cargar/guardar el nombre del jugador desde localStorage
 * 2. Conectar los botones del Game Over overlay con el leaderboard
 * 3. Enviar el score al leaderboard global cuando termina una partida
 * 4. Mostrar el leaderboard cuando se solicita
 * 5. Manejar el caso especial cuando el score es 0 (mostrar mensaje de consuelo)
 */

(function() {
    'use strict';

    // ========================================
    // CONFIGURACIÓN
    // ========================================

    const STORAGE_KEY = 'masterSequencePlayerName';
    const GAME_ID = 'master-sequence';

    /**
     * Variable global para almacenar el nombre del jugador que acaba de guardar
     * Esto permite que el leaderboard destaque la fila del jugador
     */
    window.lastSubmittedPlayerName = null;

    /**
     * Flag para prevenir doble-submit del score
     */
    let isSubmitting = false;

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

    // ========================================
    // MANEJAR CASO SCORE = 0
    // ========================================

    /**
     * Muestra u oculta las secciones del Game Over según el score
     * Si score es 0, oculta el formulario de nombre y muestra mensaje de consuelo
     * Si score > 0, muestra el formulario normal
     */
    function handleZeroScoreCase(finalScore) {
        const submitSection = document.getElementById('gameOverSubmitSection');
        const zeroScoreMessage = document.getElementById('zeroScoreMessage');

        if (finalScore === 0) {
            // Score es 0: ocultar formulario, mostrar mensaje de consuelo
            if (submitSection) submitSection.style.display = 'none';
            if (zeroScoreMessage) zeroScoreMessage.style.display = 'block';
            console.log('📊 Score es 0, mostrando mensaje de consuelo');
        } else {
            // Score > 0: mostrar formulario normal
            if (submitSection) submitSection.style.display = 'block';
            if (zeroScoreMessage) zeroScoreMessage.style.display = 'none';
        }
    }

    // También cargar cuando se muestra el Game Over overlay
    const gameOverObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const gameOverOverlay = document.getElementById('gameOverOverlay');
                if (gameOverOverlay && !gameOverOverlay.classList.contains('hidden')) {
                    // Overlay ahora visible - cargar nombre y resetear flag
                    loadSavedName();
                    resetSubmitFlag();

                    // Obtener el score final
                    const finalScoreElement = document.getElementById('finalScore');
                    const finalScore = parseInt(finalScoreElement?.textContent) || 0;

                    // Manejar caso especial: score = 0
                    handleZeroScoreCase(finalScore);

                    // Solo mostrar animación si score > 0
                    if (finalScore > 0 && typeof window.showRankingAnimation === 'function') {
                        const overlayContent = gameOverOverlay.querySelector('.overlay-content');
                        if (overlayContent) {
                            // Limpiar animación anterior si existe
                            if (typeof window.clearRankingAnimation === 'function') {
                                window.clearRankingAnimation();
                            }
                            // Mostrar nueva animación con pequeño delay
                            setTimeout(() => {
                                window.showRankingAnimation(finalScore, overlayContent);
                            }, 500);
                        }
                    }
                } else {
                    // Overlay oculto - limpiar animación
                    if (typeof window.clearRankingAnimation === 'function') {
                        window.clearRankingAnimation();
                    }
                }
            }
        });
    });

    const gameOverOverlay = document.getElementById('gameOverOverlay');
    if (gameOverOverlay) {
        gameOverObserver.observe(gameOverOverlay, { attributes: true });
    }

    // ========================================
    // ENVIAR SCORE AL LEADERBOARD
    // ========================================

    async function submitGameOverScore() {
        // Prevenir doble-submit
        if (isSubmitting) {
            console.log('⚠️ Score submission already in progress, ignoring duplicate click');
            return;
        }
        isSubmitting = true;

        const playerInput = document.getElementById('gameOverPlayerNameInput');
        const playerName = playerInput.value.trim() || 'SEQUENCER';

        // Save name for future sessions
        localStorage.setItem(STORAGE_KEY, playerName);

        // Get game stats from DOM (game.js updates these)
        const finalLevelElement = document.getElementById('finalLevel');
        const finalScoreElement = document.getElementById('finalScore');

        const finalLevel = parseInt(finalLevelElement.textContent) || 1;
        const finalScore = parseInt(finalScoreElement.textContent) || 0;

        // Get stats from lastSessionStats (set by game.js in gameOver())
        const stats = window.lastSessionStats || {};
        console.log('🔍 [DEBUG] window.lastSessionStats:', window.lastSessionStats);

        const sequenceLength = stats.sequenceLength || 1;
        const streak = stats.streak || 0;
        const totalTimeMs = stats.totalTimeMs || 0;
        const totalHintsUsed = stats.totalHintsUsed || 0;

        console.log('🔍 [DEBUG] Extracted values:');
        console.log('   - sequenceLength:', sequenceLength);
        console.log('   - streak:', streak);
        console.log('   - totalTimeMs:', totalTimeMs);
        console.log('   - totalHintsUsed:', totalHintsUsed);

        console.log('📊 Submitting score:', {
            playerName,
            finalScore,
            finalLevel,
            sequenceLength,
            streak,
            totalTimeMs
        });

        try {
            const submitBtn = document.getElementById('gameOverSubmitScoreBtn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'SUBMITTING...';

            // Submit to leaderboard API
            const submitData = {
                time_ms: totalTimeMs,
                metadata: {
                    level_reached: finalLevel,
                    sequence_length: sequenceLength,
                    perfect_streak: streak,
                    hints_used: totalHintsUsed
                }
            };

            console.log('🔍 [DEBUG] Data being sent to submitScore API:', submitData);

            const result = await submitScore(
                GAME_ID,
                playerName,
                finalScore,
                submitData
            );

            showToast(`Score submitted! Rank #${result.rank} of ${result.totalPlayers}`, 'success');

            submitBtn.disabled = false;
            submitBtn.textContent = '✅ SUBMITTED!';

            /**
             * Guardar el nombre Y el score del jugador que acaba de enviar
             * Esto permite que el leaderboard destaque SOLO esa fila específica
             * (no todas las filas con el mismo nombre)
             */
            window.lastSubmittedPlayerName = playerName;
            window.lastSubmittedScore = finalScore;

            // ✅ PATRÓN ESTÁNDAR: Auto-cerrar modal y abrir leaderboard
            setTimeout(() => {
                console.log('🔒 Closing modal after successful submission');

                // Cerrar el modal de Game Over
                const gameOverModal = document.getElementById('gameOverOverlay');
                if (gameOverModal) {
                    console.log('📊 Closing Game Over modal');
                    gameOverModal.classList.add('hidden');
                }

                // Abrir leaderboard después de cerrar modal, pasando nombre Y score para destacar
                setTimeout(() => {
                    console.log('📊 Opening leaderboard after score submission');
                    if (window.showLeaderboardModal) {
                        // Pasar nombre Y score para que se destaque SOLO esa fila específica
                        window.showLeaderboardModal('master-sequence', {
                            highlightPlayer: playerName,
                            highlightScore: finalScore
                        });
                    }
                }, 300); // Pequeño delay para asegurar que el modal se cerró

            }, 2000); // 2 segundos para que el usuario vea el mensaje de éxito

        } catch (error) {
            console.error('Error submitting score:', error);
            showToast(`Error: ${error.message}`, 'error');

            const submitBtn = document.getElementById('gameOverSubmitScoreBtn');
            submitBtn.disabled = false;
            submitBtn.textContent = '🏆 SUBMIT SCORE';
            isSubmitting = false; // Reset flag on error
        }
    }

    // Reset submit flag when Game Over overlay is shown (new game ended)
    function resetSubmitFlag() {
        isSubmitting = false;
        const submitBtn = document.getElementById('gameOverSubmitScoreBtn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '🏆 GUARDAR SCORE';
        }
    }

    // ========================================
    // EVENT LISTENERS
    // ========================================

    // Botón "Submit Score" en Game Over overlay
    const gameOverSubmitBtn = document.getElementById('gameOverSubmitScoreBtn');
    if (gameOverSubmitBtn) {
        gameOverSubmitBtn.addEventListener('click', submitGameOverScore);
        console.log('✅ Game Over Submit Score button connected');
    } else {
        console.warn('⚠️ Game Over Submit Score button not found');
    }

    // Botón "View Leaderboard" en Game Over overlay
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

    console.log('✅ Master Sequence Leaderboard Integration loaded');

})();
