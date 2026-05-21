/**
 * ========================================
 * CRIPTOSOPA - RANKING ANIMATION COMPONENT
 * ========================================
 *
 * Muestra el score del jugador "descendiendo" por el leaderboard
 * hasta encontrar su posición real. Se activa desde leaderboard-integration.js
 * cuando se abre el victoryModal.
 *
 * Basado en el patrón de Master Sequence (ver docs/LEADERBOARD_ANIMATION_GUIDE.md).
 * Diferencias: GAME_ID = 'criptosopa', input ID = 'csPlayerNameInput'.
 */

(function() {
    'use strict';

    const GAME_ID = 'criptosopa';
    const ANIMATION_DELAY_PER_POSITION = 200; // ms entre posiciones
    const MAX_POSITIONS_TO_SHOW = 5;
    const PAUSE_AT_FINAL_POSITION = 1000;

    let isAnimating = false;

    // ── Mensajes motivacionales ──
    const MESSAGES = {
        top1:  ['🏆 ¡NUEVO RECORD!', '👑 ¡ERES EL #1!', '🎉 ¡INCREÍBLE!'],
        top3:  ['🥇 ¡TOP 3!', '⭐ ¡EXCELENTE!', '🔥 ¡EN LLAMAS!'],
        top10: ['💪 ¡TOP 10!', '🎯 ¡MUY BIEN!', '✨ ¡GRAN PARTIDA!'],
        top50: ['👍 ¡BUEN SCORE!', '📈 ¡VAS MEJORANDO!', '🎮 ¡SIGUE ASÍ!'],
        other: ['🎮 ¡BUEN INTENTO!', '💡 ¡PRACTICA MÁS!', '🔄 ¡INTÉNTALO DE NUEVO!']
    };

    function getRandomMessage(cat) {
        const msgs = MESSAGES[cat];
        return msgs[Math.floor(Math.random() * msgs.length)];
    }

    function getMotivationalMessage(rank) {
        if (rank === 1)  return getRandomMessage('top1');
        if (rank <= 3)   return getRandomMessage('top3');
        if (rank <= 10)  return getRandomMessage('top10');
        if (rank <= 50)  return getRandomMessage('top50');
        return getRandomMessage('other');
    }

    // Posición que ocuparía el score en el leaderboard actual
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

        // Obtener leaderboard
        let leaderboard = [];
        try {
            const data = await getLeaderboard(GAME_ID, { limit: 50 });
            leaderboard = data.scores || [];
        } catch (e) {
            console.warn('[ranking-animation] No se pudo obtener leaderboard:', e);
        }

        const finalRank = calculateRank(playerScore, leaderboard);

        // Insertar container en el modal body
        const container = createAnimationContainer();
        // Insertar antes del csSubmitSection si existe, si no al final
        const submitSection = targetContainer.querySelector('#csSubmitSection');
        if (submitSection) {
            targetContainer.insertBefore(container, submitSection);
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
                    <span class="rank-name">${item.player_name || 'JUGADOR'}</span>
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

        // Destacar input de nombre (sin focus — en mobile dispara teclado)
        await sleep(300);
        const nameInput = document.getElementById('csPlayerNameInput');
        if (nameInput) nameInput.classList.add('highlight-input');

        isAnimating = false;
    }

    function buildCombinedList(leaderboard, playerScore, playerRank) {
        const combined = [];
        let playerInserted = false;
        const startPos = Math.max(0, playerRank - 3);
        const endPos   = Math.min(leaderboard.length, playerRank + 2);

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
        const nameInput = document.getElementById('csPlayerNameInput');
        if (nameInput) nameInput.classList.remove('highlight-input');
    }

    window.showRankingAnimation  = showRankingAnimation;
    window.clearRankingAnimation = clearRankingAnimation;

    console.log('✅ [ranking-animation.js] CriptoSopa ranking animation cargado');
})();
