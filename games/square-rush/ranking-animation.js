/**
 * ========================================
 * RANKING ANIMATION COMPONENT - SQUARE RUSH
 * ========================================
 *
 * Muestra una animación de "descenso en el ranking" cuando termina el juego.
 * El score del jugador aparece en la cima y "desciende" hasta su posición real.
 *
 * NOTA EDUCATIVA: Esta técnica se llama "progressive disclosure" - en vez de
 * mostrar toda la información de golpe, la revelamos gradualmente para crear
 * anticipación y engagement. El jugador se pregunta "¿en qué posición quedé?"
 *
 * Adaptado de Memory Matrix para Square Rush.
 */

(function() {
    'use strict';

    // ========================================
    // CONFIGURACIÓN
    // ========================================
    // NOTA EDUCATIVA: Estas constantes controlan la velocidad de la animación.
    // Valores más bajos = animación más rápida. Ajusta según la UX deseada.

    const ANIMATION_DELAY_PER_POSITION = 200; // ms entre cada posición
    const MAX_POSITIONS_TO_SHOW = 5; // Mostrar máximo 5 posiciones (más compacto)
    const PAUSE_AT_FINAL_POSITION = 1000; // ms de pausa en posición final
    const GAME_ID = 'square-rush'; // ID del juego para la API

    // Flag para prevenir animaciones duplicadas
    let isAnimating = false;

    // ========================================
    // MENSAJES MOTIVACIONALES
    // ========================================

    const MESSAGES = {
        top1: ['🏆 ¡NUEVO RECORD!', '👑 ¡ERES EL #1!', '🎉 ¡INCREÍBLE!'],
        top3: ['🥇 ¡TOP 3!', '⭐ ¡EXCELENTE!', '🔥 ¡EN LLAMAS!'],
        top10: ['💪 ¡TOP 10!', '🎯 ¡MUY BIEN!', '✨ ¡GRAN PARTIDA!'],
        top50: ['👍 ¡BUEN SCORE!', '📈 ¡VAS MEJORANDO!', '🎮 ¡SIGUE ASÍ!'],
        other: ['🎮 ¡BUEN INTENTO!', '💡 ¡PRACTICA MÁS!', '🔄 ¡INTÉNTALO DE NUEVO!']
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
    // CALCULAR POSICIÓN
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
    // CREAR CONTAINER DE ANIMACIÓN
    // ========================================

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

    // ========================================
    // ANIMAR RANKING
    // ========================================

    async function showRankingAnimation(playerScore, targetContainer, nameInputId = 'playerNameVictory') {
        // Prevenir animaciones duplicadas
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

        // 2. Calcular posición del jugador
        finalRank = calculateRank(playerScore, leaderboard);
        console.log('🎯 [RankingAnimation] Player would be rank #', finalRank);

        // 3. Crear y mostrar container
        const container = createAnimationContainer();

        // Buscar un buen lugar para insertar la animación
        const statsGrid = targetContainer.querySelector('[style*="grid"]');
        if (statsGrid) {
            statsGrid.after(container);
        } else {
            const nameInputDiv = targetContainer.querySelector('input[type="text"]')?.parentElement;
            if (nameInputDiv) {
                nameInputDiv.before(container);
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

        // 6. Animar la aparición de cada fila
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

            // Animar entrada
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

        // 8. Destacar el input de nombre
        await sleep(300);
        const nameInput = document.getElementById(nameInputId);
        if (nameInput) {
            nameInput.classList.add('highlight-input');
            nameInput.focus();
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
    // LIMPIAR ANIMACIÓN
    // ========================================

    function clearRankingAnimation() {
        isAnimating = false;

        const container = document.getElementById('rankingAnimationContainer');
        if (container) {
            container.remove();
        }

        const inputs = ['playerNameVictory', 'playerNameGameOver'];
        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) input.classList.remove('highlight-input');
        });
    }

    // ========================================
    // EXPORTS
    // ========================================

    window.showRankingAnimation = showRankingAnimation;
    window.clearRankingAnimation = clearRankingAnimation;

    console.log('✅ [ranking-animation.js] Square Rush ranking animation component loaded');

})();
