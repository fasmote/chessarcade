/**
 * ========================================
 * RANKING ANIMATION COMPONENT - ChessInFive
 * ========================================
 *
 * Muestra una animacion de "descenso en el ranking" cuando termina el juego.
 * El score del jugador aparece y "desciende" hasta su posicion real.
 *
 * Adaptado de Master Sequence para ChessInFive.
 */

(function() {
    'use strict';

    // ========================================
    // CONFIGURACION
    // ========================================

    const ANIMATION_DELAY_PER_POSITION = 200;
    const MAX_POSITIONS_TO_SHOW = 5;
    const PAUSE_AT_FINAL_POSITION = 1000;
    const GAME_ID = 'chessinfive';

    let isAnimating = false;

    // ========================================
    // MENSAJES MOTIVACIONALES
    // ========================================

    const MESSAGES = {
        top1: ['🏆 NUEVO RECORD!', '👑 ERES EL #1!', '🎉 INCREIBLE!'],
        top3: ['🥇 TOP 3!', '⭐ EXCELENTE!', '🔥 EN LLAMAS!'],
        top10: ['💪 TOP 10!', '🎯 MUY BIEN!', '✨ GRAN PARTIDA!'],
        top50: ['👍 BUEN SCORE!', '📈 VAS MEJORANDO!', '🎮 SIGUE ASI!'],
        other: ['🎮 BUEN INTENTO!', '💡 PRACTICA MAS!', '🔄 INTENTALO DE NUEVO!']
    };

    function getRandomMessage(category) {
        const messages = MESSAGES[category];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    function getMotivationalMessage(rank, totalPlayers) {
        if (rank === 1) return getRandomMessage('top1');
        if (rank <= 3) return getRandomMessage('top3');
        if (rank <= 10) return getRandomMessage('top10');
        if (rank <= 50) return getRandomMessage('top50');
        return getRandomMessage('other');
    }

    // ========================================
    // CALCULAR POSICION
    // ========================================

    function calculateRank(score, leaderboard) {
        if (!leaderboard || leaderboard.length === 0) {
            return 1;
        }

        for (let i = 0; i < leaderboard.length; i++) {
            if (score > leaderboard[i].score) {
                return i + 1;
            }
        }

        return leaderboard.length + 1;
    }

    // ========================================
    // CREAR CONTAINER DE ANIMACION
    // ========================================

    function createAnimationContainer() {
        const container = document.createElement('div');
        container.id = 'rankingAnimationContainer';
        container.className = 'ranking-animation-container';
        container.innerHTML = `
            <div class="ranking-animation-header">
                <span class="ranking-animation-title">TU POSICION</span>
                <span class="ranking-animation-score" id="rankingAnimScore"></span>
            </div>
            <div class="ranking-animation-body">
                <div class="ranking-list" id="rankingAnimList"></div>
            </div>
            <div class="ranking-animation-message" id="rankingAnimMessage"></div>
        `;
        return container;
    }

    // ========================================
    // ANIMAR RANKING
    // ========================================

    async function showRankingAnimation(playerScore, targetContainer, nameInputId = 'gameOverPlayerNameInput') {
        if (isAnimating) {
            console.log('⚠️ [RankingAnimation] Animation already in progress, skipping');
            return;
        }
        isAnimating = true;

        console.log('🎬 [RankingAnimation] Starting animation for score:', playerScore);

        // 1. Obtener leaderboard actual
        let leaderboard = [];
        let finalRank = 1;
        let totalPlayers = 0;

        try {
            const data = await getLeaderboard(GAME_ID, { limit: 50 });
            leaderboard = data.scores || [];
            totalPlayers = data.pagination?.total || leaderboard.length;
            console.log('📊 [RankingAnimation] Got leaderboard with', leaderboard.length, 'scores');
        } catch (error) {
            console.warn('⚠️ [RankingAnimation] Could not fetch leaderboard:', error);
        }

        // 2. Calcular posicion del jugador
        finalRank = calculateRank(playerScore, leaderboard);
        console.log('🎯 [RankingAnimation] Player would be rank #', finalRank);

        // 3. Crear y mostrar container
        const container = createAnimationContainer();

        // Insertar antes del input de nombre
        const nameInputDiv = targetContainer.querySelector(`[for="${nameInputId}"]`)?.parentElement;
        if (nameInputDiv) {
            targetContainer.insertBefore(container, nameInputDiv);
        } else {
            // Buscar el div del input directamente
            const inputElement = document.getElementById(nameInputId);
            if (inputElement && inputElement.parentElement) {
                targetContainer.insertBefore(container, inputElement.parentElement);
            } else {
                targetContainer.appendChild(container);
            }
        }

        // 4. Configurar valores
        const scoreDisplay = document.getElementById('rankingAnimScore');
        const listContainer = document.getElementById('rankingAnimList');
        const messageDisplay = document.getElementById('rankingAnimMessage');

        scoreDisplay.textContent = playerScore.toLocaleString();

        // 5. Construir lista combinada
        const combinedList = buildCombinedList(leaderboard, playerScore, finalRank);

        // 6. Animar la aparicion de cada fila
        container.classList.add('show');

        for (let i = 0; i < combinedList.length; i++) {
            const item = combinedList[i];
            const row = document.createElement('div');

            if (item.isPlayer) {
                row.className = 'ranking-list-row player-row';
                row.innerHTML = `
                    <span class="rank-position">#${item.rank}</span>
                    <span class="rank-name">TU</span>
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

        // 7. Mostrar mensaje motivacional
        const message = getMotivationalMessage(finalRank, totalPlayers || finalRank);
        messageDisplay.textContent = message;
        messageDisplay.classList.add('show');

        // 8. Destacar el input de nombre (sin focus para evitar teclado automatico en mobile)
        await sleep(300);
        const nameInput = document.getElementById(nameInputId);
        if (nameInput) {
            nameInput.classList.add('highlight-input');
            // No hacer focus() - en mobile dispara el teclado y tapa todo
        }

        isAnimating = false;
        console.log('✅ [RankingAnimation] Animation complete');
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
                combined.push({
                    isPlayer: true,
                    rank: playerRank,
                    score: playerScore
                });
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
            combined.push({
                isPlayer: true,
                rank: playerRank,
                score: playerScore
            });
        }

        return combined.slice(0, MAX_POSITIONS_TO_SHOW);
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ========================================
    // LIMPIAR ANIMACION
    // ========================================

    function clearRankingAnimation() {
        isAnimating = false;

        const container = document.getElementById('rankingAnimationContainer');
        if (container) {
            container.remove();
        }

        const nameInput = document.getElementById('gameOverPlayerNameInput');
        if (nameInput) {
            nameInput.classList.remove('highlight-input');
        }
    }

    // ========================================
    // EXPORTS
    // ========================================

    window.showRankingAnimation = showRankingAnimation;
    window.clearRankingAnimation = clearRankingAnimation;

    console.log('✅ [ranking-animation.js] ChessInFive ranking animation component loaded');

})();
