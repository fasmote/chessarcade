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
 */

(function() {
    'use strict';

    // ========================================
    // CONFIGURACIÓN
    // ========================================

    const STORAGE_KEY = 'masterSequencePlayerName';
    const GAME_ID = 'master-sequence';

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

    // También cargar cuando se muestra el Game Over overlay
    const gameOverObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const gameOverOverlay = document.getElementById('gameOverOverlay');
                if (gameOverOverlay && !gameOverOverlay.classList.contains('hidden')) {
                    loadSavedName();
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

        console.log('🔍 [DEBUG] Extracted values:');
        console.log('   - sequenceLength:', sequenceLength);
        console.log('   - streak:', streak);
        console.log('   - totalTimeMs:', totalTimeMs);

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
                    perfect_streak: streak
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

            // ✅ PATRÓN ESTÁNDAR: Auto-cerrar modal y abrir leaderboard
            setTimeout(() => {
                console.log('🔒 Closing modal after successful submission');

                // Cerrar el modal de Game Over
                const gameOverModal = document.getElementById('gameOverOverlay');
                if (gameOverModal) {
                    console.log('📊 Closing Game Over modal');
                    gameOverModal.classList.add('hidden');
                }

                // Abrir leaderboard después de cerrar modal
                setTimeout(() => {
                    console.log('📊 Opening leaderboard after score submission');
                    if (window.showLeaderboardModal) {
                        window.showLeaderboardModal('master-sequence');
                    }
                }, 300); // Small delay to ensure modal is fully closed

            }, 2000); // 2 segundos para que el usuario vea el mensaje de éxito

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
