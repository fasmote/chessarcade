/**
 * ========================================
 * CRIPTOSOPA - LEADERBOARD INTEGRATION
 * ========================================
 *
 * Conecta CriptoSopa con el leaderboard global.
 * Se encarga de:
 *  1. Observar el gameOverModal para activar la animación de ranking
 *  2. Cargar/guardar el nombre del jugador desde localStorage
 *  3. Enviar el score acumulado total al leaderboard
 *  4. Abrir el leaderboard resaltando la fila del jugador
 *
 * Diferencias respecto a Master Sequence:
 *  - Trigger: gameOverModal.active (cuando el jugador pierde todas las vidas)
 *  - Score: gameState.totalScore + gameState.score (acumulado de todos los niveles)
 *  - Estado del juego: accedido via window.csGameState (expuesto en criptosopa.js)
 *  - Input de nombre: #csPlayerNameInput (en body del gameOverModal)
 */

(function() {
    'use strict';

    const GAME_ID    = 'criptosopa';
    const STORAGE_KEY = 'criptosopa_player_name';

    // Permiten que leaderboard-ui.js resalte la fila correcta después del submit
    window.lastSubmittedPlayerName = null;
    window.lastSubmittedScore      = null;

    let isSubmitting = false;

    // ── Helpers para leer el estado del juego ──

    function getScore() {
        const gs = window.csGameState;
        if (!gs) return 0;
        // Score acumulado de todos los niveles (lo que muestra "ACUMULADO" en el modal)
        return gs.totalScore + gs.score;
    }

    function getTimeMs() {
        const gs = window.csGameState;
        if (!gs) return 0;
        // gameState usa centisegundos (timer corre cada 10ms) → convertir a ms
        return (gs.totalTime + gs.timer) * 10;
    }

    function getMetadata() {
        const gs = window.csGameState;
        if (!gs) return {};
        return {
            nivel_llegado:   gs.currentLevelIndex + 1,
            vidas_restantes: gs.lives,
            pistas_usadas:   gs.hintsUsedThisGame,
            palabras_nivel:  gs.foundPaths ? gs.foundPaths.length : 0
        };
    }

    // ── Nombre del jugador ──

    function loadSavedName() {
        const saved = localStorage.getItem(STORAGE_KEY);
        const input = document.getElementById('csPlayerNameInput');
        if (saved && input && !input.value) input.value = saved;
    }

    // ── Botón de envío ──

    function resetSubmitBtn() {
        isSubmitting = false;
        const btn = document.getElementById('submitScoreBtn');
        if (btn) {
            btn.disabled  = false;
            btn.textContent = '📊 ENVIAR PUNTUACIÓN';
        }
    }

    // ── Lógica al abrirse el modal de game over ──

    function onGameOverModalOpen() {
        loadSavedName();
        resetSubmitBtn();

        const score         = getScore();
        const submitSection = document.getElementById('csSubmitSection');
        const submitBtn     = document.getElementById('submitScoreBtn');

        if (score > 0) {
            // Mostrar sección de nombre y botón de envío
            if (submitSection) submitSection.style.display = 'block';
            if (submitBtn)     submitBtn.style.display     = '';

            // Mostrar animación de ranking
            if (typeof window.showRankingAnimation === 'function') {
                const modalBody = document.querySelector('#gameOverModal .modal-body');
                if (modalBody) {
                    if (typeof window.clearRankingAnimation === 'function') {
                        window.clearRankingAnimation();
                    }
                    setTimeout(() => {
                        window.showRankingAnimation(score, modalBody);
                    }, 600);
                }
            }
        } else {
            // Score 0: ocultar sección de envío
            if (submitSection) submitSection.style.display = 'none';
            if (submitBtn)     submitBtn.style.display     = 'none';
        }
    }

    // ── Enviar score ──

    async function submitGameScore() {
        if (isSubmitting) return;
        isSubmitting = true;

        const input      = document.getElementById('csPlayerNameInput');
        const playerName = (input?.value?.trim() || 'JUGADOR').toUpperCase().slice(0, 15);
        localStorage.setItem(STORAGE_KEY, playerName);

        const score    = getScore();
        const timeMs   = getTimeMs();
        const metadata = getMetadata();

        console.log('[criptosopa-lb] Enviando score:', { playerName, score, timeMs, metadata });

        const btn = document.getElementById('submitScoreBtn');
        if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }

        try {
            const result = await submitScore(GAME_ID, playerName, score, {
                time_ms: timeMs,
                metadata
            });

            console.log('[criptosopa-lb] Resultado:', result);

            if (btn) { btn.disabled = true; btn.textContent = '✅ ¡Enviado!'; }

            window.lastSubmittedPlayerName = playerName;
            window.lastSubmittedScore      = score;

            // Cerrar modal y abrir leaderboard resaltando la fila
            setTimeout(() => {
                const modal = document.getElementById('gameOverModal');
                if (modal) modal.classList.remove('active');

                setTimeout(() => {
                    if (window.showLeaderboardModal) {
                        window.showLeaderboardModal(GAME_ID, {
                            highlightPlayer: playerName,
                            highlightScore:  score
                        });
                    }
                }, 300);
            }, 2000);

        } catch (error) {
            console.error('[criptosopa-lb] Error:', error);
            if (btn) {
                btn.disabled    = false;
                btn.textContent = '📊 ENVIAR PUNTUACIÓN';
            }
            isSubmitting = false;
        }
    }

    // ── Inicialización ──

    window.addEventListener('DOMContentLoaded', () => {
        loadSavedName();

        // Observar el gameOverModal: cuando se agrega la clase 'active', activar integración
        const gameOverModal = document.getElementById('gameOverModal');
        if (gameOverModal) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((m) => {
                    if (m.attributeName === 'class') {
                        if (gameOverModal.classList.contains('active')) {
                            onGameOverModalOpen();
                        } else {
                            if (typeof window.clearRankingAnimation === 'function') {
                                window.clearRankingAnimation();
                            }
                        }
                    }
                });
            });
            observer.observe(gameOverModal, { attributes: true });
            console.log('✅ [criptosopa-lb] Observer en gameOverModal listo');
        } else {
            console.warn('⚠️ [criptosopa-lb] #gameOverModal no encontrado');
        }

        // Botón "ENVIAR PUNTUACIÓN" — reemplaza el stub de criptosopa.js
        const submitBtn = document.getElementById('submitScoreBtn');
        if (submitBtn) {
            // Remover el listener del stub y agregar el propio
            submitBtn.replaceWith(submitBtn.cloneNode(true));
            document.getElementById('submitScoreBtn')
                .addEventListener('click', submitGameScore);
            console.log('✅ [criptosopa-lb] submitScoreBtn conectado');
        }

        // Botón RANKING en el header (ya existente en index.html)
        const headerBtn = document.getElementById('btnLeaderboard');
        if (headerBtn) {
            headerBtn.onclick = () => window.showLeaderboardModal?.(GAME_ID);
        }

        console.log('✅ [criptosopa-lb] CriptoSopa Leaderboard Integration cargado');
    });

})();
