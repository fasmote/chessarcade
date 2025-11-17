/**
 * ========================================
 * SQUARE RUSH - LEADERBOARD INTEGRATION
 * ========================================
 *
 * Gestiona la integración del leaderboard para Square Rush, incluyendo:
 * - Modales personalizados para Game Over y Victory
 * - Columnas custom: RANK | PLAYER | SCORE | LEVEL | TARGETS | COMBO
 * - Metadata: level_reached, targets_found, max_combo
 * - Auto-close modal + auto-open leaderboard después de submit
 */

console.log('🎯 Square Rush Leaderboard Integration loaded');

// ========================================
// MODAL GAME OVER
// ========================================

// ========================================
// TEMPORARY STATS STORAGE
// ========================================
// Guardar estadísticas antes de que se reseteen
let lastGameStats = {
    score: 0,
    level: 1,
    maxCombo: 1,
    targetsFound: 0
};

/**
 * Guardar estadísticas del juego antes de mostrar modal
 * IMPORTANTE: Llamar ANTES de resetear gameState
 *
 * EXPONER A WINDOW (window.captureGameStats):
 * - Esto hace que la función sea accesible desde otros archivos JavaScript
 * - square-rush.js puede llamar window.captureGameStats() antes de mostrar el modal
 * - Sin el "window.", esta función solo existiría dentro de este archivo
 */
window.captureGameStats = function() {
    // 📸 CAPTURAR: Tomar una "foto" del estado actual antes de que cambie
    // Usamos window.gameState porque fue expuesto en square-rush.js línea 18
    console.log('📸 [CAPTURE] Reading current game state from window...');
    console.log('   - window.gameState:', window.gameState);
    console.log('   - window.maxComboAchieved:', window.maxComboAchieved);
    console.log('   - window.totalTargetsFound:', window.totalTargetsFound);

    lastGameStats = {
        score: window.gameState?.score || 0,
        level: window.gameState?.level || 1,
        maxCombo: window.maxComboAchieved || 1,
        targetsFound: window.totalTargetsFound || 0
    };

    console.log('✅ [CAPTURE] Stats captured successfully:', lastGameStats);

    // ⚠️ VALIDACIÓN: Verificar si los datos tienen sentido
    if (lastGameStats.score === 0) {
        console.warn('⚠️ [CAPTURE] Score is 0 - might be a problem!');
    }
    if (lastGameStats.targetsFound === 0) {
        console.warn('⚠️ [CAPTURE] No targets found - might be a problem!');
    }
};

/**
 * Mostrar modal de Game Over con opción de submit
 */
window.showLeaderboardGameOverModal = function() {
    console.log('🎮 [MODAL] Showing Game Over modal');

    // 📦 USAR estadísticas capturadas previamente (NO leer de gameState nuevamente)
    // Estas se guardaron en lastGameStats cuando se llamó captureGameStats()
    console.log('📦 [MODAL] Using previously captured stats:', lastGameStats);

    const finalScore = lastGameStats.score;
    const levelReached = lastGameStats.level;
    const maxCombo = lastGameStats.maxCombo;
    const targetsFound = lastGameStats.targetsFound;

    console.log('📊 [MODAL] Displaying stats in modal:', {
        finalScore,
        levelReached,
        maxCombo,
        targetsFound
    });

    // Crear modal HTML con estilos inline
    const modalHTML = `
        <div id="leaderboardGameOverModal" class="game-over-modal" style="display: block;">
            <div class="game-over-modal-content" style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(145deg, rgba(0,0,0,0.95), rgba(26,0,51,0.9));
                padding: 3rem;
                border-radius: 20px;
                text-align: center;
                z-index: 10000;
                backdrop-filter: blur(20px);
                border: 4px solid #ff0080;
                box-shadow: 0 0 30px rgba(255, 0, 128, 0.5);
                max-width: 90vw;
                max-height: 90vh;
                overflow-y: auto;
                min-width: 400px;
            ">
                <button class="modal-close" onclick="closeLeaderboardGameOverModal(); if(window.playAgain) window.playAgain();" style="
                    position: absolute;
                    top: 15px;
                    right: 20px;
                    background: none;
                    border: none;
                    color: white;
                    font-size: 2rem;
                    cursor: pointer;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.3s ease;
                ">&times;</button>

                <div style="font-size: 2.5rem; margin-bottom: 1rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #ff0080;">
                    💥 GAME OVER
                </div>

                <div style="font-size: 1.1rem; color: #e0e0e0; margin-bottom: 1.5rem; line-height: 1.4;">
                    Can you beat your best score?<br>
                    <span style="color: #00ffff; font-weight: bold;">Submit and compete for the top rankings!</span>
                </div>

                <!-- Statistics Grid -->
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 2rem;">
                    <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);">
                        <div style="font-size: 0.9rem; color: #999; margin-bottom: 0.5rem;">SCORE</div>
                        <div style="font-size: 1.8rem; font-weight: 700; color: #00ffff;">${finalScore}</div>
                    </div>
                    <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);">
                        <div style="font-size: 0.9rem; color: #999; margin-bottom: 0.5rem;">LEVEL REACHED</div>
                        <div style="font-size: 1.8rem; font-weight: 700; color: #00ffff;">${levelReached}</div>
                    </div>
                    <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);">
                        <div style="font-size: 0.9rem; color: #999; margin-bottom: 0.5rem;">MAX COMBO</div>
                        <div style="font-size: 1.8rem; font-weight: 700; color: #00ffff;">x${maxCombo}</div>
                    </div>
                    <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);">
                        <div style="font-size: 0.9rem; color: #999; margin-bottom: 0.5rem;">TARGETS FOUND</div>
                        <div style="font-size: 1.8rem; font-weight: 700; color: #00ffff;">${targetsFound}</div>
                    </div>
                </div>

                <!-- Player Name Input -->
                <div style="margin: 20px 0;">
                    <label for="playerNameGameOver" style="display: block; margin-bottom: 8px; color: #00ffff; font-weight: bold;">Enter Your Name:</label>
                    <input type="text" id="playerNameGameOver" maxlength="20" placeholder="PLAYER"
                           style="width: 100%; padding: 10px; background: rgba(0, 255, 255, 0.1); border: 2px solid #00ffff; border-radius: 8px; color: white; font-family: 'Orbitron', monospace; font-size: 16px; text-align: center;"
                           value="${localStorage.getItem('squareRushPlayerName') || ''}">
                </div>

                <!-- Action Buttons -->
                <button id="submitScoreGameOver" style="margin-bottom: 10px; padding: 1rem 2rem; font-size: 1.1rem; font-weight: 700; border: none; border-radius: 25px; cursor: pointer; font-family: 'Orbitron', monospace; text-transform: uppercase; letter-spacing: 0.1em; background: linear-gradient(to bottom, #ff8a80 0%, #ff6b6b 30%, #ff5252 70%, #d32f2f 100%); color: white; width: 100%;">
                    🏆 SUBMIT SCORE
                </button>
                <button onclick="showLeaderboardModal('square-rush')" style="margin-bottom: 10px; padding: 1rem 2rem; font-size: 1.1rem; font-weight: 700; border-radius: 25px; cursor: pointer; font-family: 'Orbitron', monospace; text-transform: uppercase; letter-spacing: 0.1em; background: rgba(0, 255, 255, 0.1); border: 2px solid #00ffff; color: #00ffff; width: 100%;">
                    👁️ VIEW LEADERBOARD
                </button>
                <button onclick="closeLeaderboardGameOverModal(); if(window.playAgain) window.playAgain();" style="margin-top: 1rem; padding: 1rem 2rem; font-size: 1.1rem; font-weight: 700; border-radius: 25px; cursor: pointer; font-family: 'Orbitron', monospace; text-transform: uppercase; letter-spacing: 0.1em; background: rgba(255, 0, 128, 0.2); border: 2px solid #ff0080; color: #ff0080; width: 100%;">
                    🔄 PLAY AGAIN
                </button>
            </div>

            <div class="game-over-modal-backdrop" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 9999;
            " onclick="closeLeaderboardGameOverModal(); if(window.playAgain) window.playAgain();"></div>
        </div>
    `;

    // Eliminar modal existente si hay
    const existingModal = document.getElementById('leaderboardGameOverModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Event listener para submit
    document.getElementById('submitScoreGameOver').addEventListener('click', handleSubmitScoreGameOver);

    // Focus en input
    setTimeout(() => {
        document.getElementById('playerNameGameOver')?.focus();
    }, 300);
};

/**
 * Cerrar modal de Game Over
 */
window.closeLeaderboardGameOverModal = function() {
    console.log('🔒 Closing Game Over modal');
    const modal = document.getElementById('leaderboardGameOverModal');
    if (modal) {
        modal.remove();
    }
};

/**
 * Manejar submit de score desde Game Over modal
 */
async function handleSubmitScoreGameOver() {
    console.log('📤 Submitting score from Game Over modal');

    const playerNameInput = document.getElementById('playerNameGameOver');
    const playerName = playerNameInput.value.trim() || 'PLAYER';
    const submitBtn = document.getElementById('submitScoreGameOver');

    // Guardar nombre para futuras sesiones
    localStorage.setItem('squareRushPlayerName', playerName);

    // ✅ Usar estadísticas capturadas (NO re-leer de gameState que puede estar reseteado)
    // IMPORTANTE: lastGameStats se capturó ANTES de que el juego se reseteara
    const finalScore = lastGameStats.score;
    const levelReached = lastGameStats.level;
    const maxCombo = lastGameStats.maxCombo;
    const targetsFound = lastGameStats.targetsFound;

    // 📊 DEBUGGING: Mostrar stats que vamos a enviar
    console.log('📤 [SUBMIT] Preparing to submit score with stats:', {
        finalScore,
        levelReached,
        maxCombo,
        targetsFound
    });

    try {
        // Deshabilitar botón
        submitBtn.disabled = true;
        submitBtn.textContent = 'SUBMITTING...';

        // 🎯 LECCIÓN APRENDIDA: submitScore() espera metadata dentro de un objeto "metadata"
        // Ver: js/leaderboard-api.js línea 325 - if (options.metadata && ...)
        // Por eso Memory Matrix funciona: ellos usan { metadata: { ... } }
        const result = await submitScore(
            'square-rush',
            playerName,
            finalScore,
            {
                metadata: {  // ← IMPORTANTE: Wrapper necesario para que el API lo reconozca
                    level_reached: levelReached,
                    max_combo: maxCombo,
                    targets_found: targetsFound
                }
            }
        );

        console.log('✅ [SUBMIT] Score submitted successfully:', result);

        console.log('✅ Score submitted successfully:', result);

        // Mostrar estado de éxito
        submitBtn.textContent = '✅ SUBMITTED!';
        submitBtn.classList.add('success');

        // ✅ PATRÓN ESTÁNDAR: Auto-cerrar modal y abrir leaderboard
        setTimeout(() => {
            console.log('🔒 Closing modal after successful submission');

            // Cerrar modal Game Over
            const gameOverModal = document.getElementById('leaderboardGameOverModal');
            if (gameOverModal) {
                console.log('📊 Closing Game Over modal');
                gameOverModal.remove();
            }

            // Abrir leaderboard después de cerrar modal
            setTimeout(() => {
                console.log('📊 Opening leaderboard after score submission');
                if (window.showLeaderboardModal) {
                    window.showLeaderboardModal('square-rush');
                }
            }, 300); // Small delay to ensure modal is fully closed

        }, 2000); // 2 segundos para que el usuario vea el mensaje de éxito

    } catch (error) {
        console.error('❌ Error submitting score:', error);
        showToast(`Error: ${error.message}`, 'error');

        // Rehabilitar botón
        submitBtn.disabled = false;
        submitBtn.textContent = '🏆 SUBMIT SCORE';
        submitBtn.classList.remove('success');
    }
}

// ========================================
// MODAL VICTORY (Todos los niveles completados)
// ========================================

/**
 * Mostrar modal de Victoria (todos los niveles completados)
 */
window.showLeaderboardVictoryModal = function() {
    console.log('🏆 [MODAL] Showing Victory modal');

    // 📦 USAR estadísticas capturadas previamente (NO leer de gameState nuevamente)
    console.log('📦 [MODAL] Using previously captured stats:', lastGameStats);

    const finalScore = lastGameStats.score;
    const levelReached = lastGameStats.level;
    const maxCombo = lastGameStats.maxCombo;
    const targetsFound = lastGameStats.targetsFound;

    console.log('📊 [MODAL] Displaying stats in victory modal:', {
        finalScore,
        levelReached,
        maxCombo,
        targetsFound
    });

    // Crear modal HTML con estilos inline
    const modalHTML = `
        <div id="leaderboardVictoryModal" class="victory-modal" style="display: block;">
            <div class="victory-modal-content" style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(145deg, rgba(0,0,0,0.95), rgba(26,0,51,0.9));
                padding: 3rem;
                border-radius: 20px;
                text-align: center;
                z-index: 10000;
                backdrop-filter: blur(20px);
                border: 4px solid #ffd700;
                box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
                max-width: 90vw;
                max-height: 90vh;
                overflow-y: auto;
                min-width: 400px;
            ">
                <button class="modal-close" onclick="closeLeaderboardVictoryModal(); if(window.playAgain) window.playAgain();" style="
                    position: absolute;
                    top: 15px;
                    right: 20px;
                    background: none;
                    border: none;
                    color: white;
                    font-size: 2rem;
                    cursor: pointer;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.3s ease;
                ">&times;</button>

                <div style="font-size: 2.5rem; margin-bottom: 1rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #ffd700;">
                    🏆 GAME COMPLETED! 🏆
                </div>

                <div style="font-size: 1.2rem; color: #e0e0e0; margin-bottom: 1rem; line-height: 1.6;">
                    <strong>Amazing! You mastered all 10 levels!</strong><br>
                    <span style="color: #ffd700; font-weight: bold;">Submit your legendary score to the global leaderboard!</span>
                </div>

                <!-- Statistics Grid -->
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 2rem;">
                    <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);">
                        <div style="font-size: 0.9rem; color: #999; margin-bottom: 0.5rem;">FINAL SCORE</div>
                        <div style="font-size: 1.8rem; font-weight: 700; color: #ffd700;">${finalScore}</div>
                    </div>
                    <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);">
                        <div style="font-size: 0.9rem; color: #999; margin-bottom: 0.5rem;">LEVELS COMPLETED</div>
                        <div style="font-size: 1.8rem; font-weight: 700; color: #ffd700;">${levelReached}</div>
                    </div>
                    <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);">
                        <div style="font-size: 0.9rem; color: #999; margin-bottom: 0.5rem;">MAX COMBO</div>
                        <div style="font-size: 1.8rem; font-weight: 700; color: #ffd700;">x${maxCombo}</div>
                    </div>
                    <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);">
                        <div style="font-size: 0.9rem; color: #999; margin-bottom: 0.5rem;">TOTAL TARGETS</div>
                        <div style="font-size: 1.8rem; font-weight: 700; color: #ffd700;">${targetsFound}</div>
                    </div>
                </div>

                <!-- Player Name Input -->
                <div style="margin: 20px 0;">
                    <label for="playerNameVictory" style="display: block; margin-bottom: 8px; color: #00ffff; font-weight: bold;">Enter Your Name:</label>
                    <input type="text" id="playerNameVictory" maxlength="20" placeholder="PLAYER"
                           style="width: 100%; padding: 10px; background: rgba(0, 255, 255, 0.1); border: 2px solid #00ffff; border-radius: 8px; color: white; font-family: 'Orbitron', monospace; font-size: 16px; text-align: center;"
                           value="${localStorage.getItem('squareRushPlayerName') || ''}">
                </div>

                <!-- Action Buttons -->
                <button id="submitScoreVictory" style="margin-bottom: 10px; padding: 1rem 2rem; font-size: 1.1rem; font-weight: 700; border: none; border-radius: 25px; cursor: pointer; font-family: 'Orbitron', monospace; text-transform: uppercase; letter-spacing: 0.1em; background: linear-gradient(to bottom, #ff8a80 0%, #ff6b6b 30%, #ff5252 70%, #d32f2f 100%); color: white; width: 100%;">
                    🏆 SUBMIT SCORE
                </button>
                <button onclick="showLeaderboardModal('square-rush')" style="margin-bottom: 10px; padding: 1rem 2rem; font-size: 1.1rem; font-weight: 700; border-radius: 25px; cursor: pointer; font-family: 'Orbitron', monospace; text-transform: uppercase; letter-spacing: 0.1em; background: rgba(0, 255, 255, 0.1); border: 2px solid #00ffff; color: #00ffff; width: 100%;">
                    👁️ VIEW LEADERBOARD
                </button>
                <button onclick="closeLeaderboardVictoryModal(); if(window.playAgain) window.playAgain();" style="margin-top: 1rem; padding: 1rem 2rem; font-size: 1.1rem; font-weight: 700; border-radius: 25px; cursor: pointer; font-family: 'Orbitron', monospace; text-transform: uppercase; letter-spacing: 0.1em; background: rgba(255, 215, 0, 0.2); border: 2px solid #ffd700; color: #ffd700; width: 100%;">
                    🔄 PLAY AGAIN
                </button>
            </div>

            <div class="victory-modal-backdrop" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 9999;
            " onclick="closeLeaderboardVictoryModal(); if(window.playAgain) window.playAgain();"></div>
        </div>
    `;

    // Eliminar modal existente si hay
    const existingModal = document.getElementById('leaderboardVictoryModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Event listener para submit
    document.getElementById('submitScoreVictory').addEventListener('click', handleSubmitScoreVictory);

    // Focus en input
    setTimeout(() => {
        document.getElementById('playerNameVictory')?.focus();
    }, 300);
};

/**
 * Cerrar modal de Victoria
 */
window.closeLeaderboardVictoryModal = function() {
    console.log('🔒 Closing Victory modal');
    const modal = document.getElementById('leaderboardVictoryModal');
    if (modal) {
        modal.remove();
    }
};

/**
 * Manejar submit de score desde Victory modal
 */
async function handleSubmitScoreVictory() {
    console.log('📤 Submitting score from Victory modal');

    const playerNameInput = document.getElementById('playerNameVictory');
    const playerName = playerNameInput.value.trim() || 'PLAYER';
    const submitBtn = document.getElementById('submitScoreVictory');

    // Guardar nombre para futuras sesiones
    localStorage.setItem('squareRushPlayerName', playerName);

    // ✅ Usar estadísticas capturadas (NO re-leer de gameState que puede estar reseteado)
    // IMPORTANTE: lastGameStats se capturó ANTES de que el juego se reseteara
    const finalScore = lastGameStats.score;
    const levelReached = lastGameStats.level;
    const maxCombo = lastGameStats.maxCombo;
    const targetsFound = lastGameStats.targetsFound;

    // 📊 DEBUGGING: Mostrar stats que vamos a enviar
    console.log('📤 [SUBMIT] Preparing to submit score with stats:', {
        finalScore,
        levelReached,
        maxCombo,
        targetsFound
    });

    try {
        // Deshabilitar botón
        submitBtn.disabled = true;
        submitBtn.textContent = 'SUBMITTING...';

        // 🎯 LECCIÓN APRENDIDA: submitScore() espera metadata dentro de un objeto "metadata"
        // Ver: js/leaderboard-api.js línea 325 - if (options.metadata && ...)
        // Por eso Memory Matrix funciona: ellos usan { metadata: { ... } }
        const result = await submitScore(
            'square-rush',
            playerName,
            finalScore,
            {
                metadata: {  // ← IMPORTANTE: Wrapper necesario para que el API lo reconozca
                    level_reached: levelReached,
                    max_combo: maxCombo,
                    targets_found: targetsFound
                }
            }
        );

        console.log('✅ [SUBMIT] Score submitted successfully:', result);

        console.log('✅ Score submitted successfully:', result);

        // Mostrar estado de éxito
        submitBtn.textContent = '✅ SUBMITTED!';
        submitBtn.classList.add('success');

        // ✅ PATRÓN ESTÁNDAR: Auto-cerrar modal y abrir leaderboard
        setTimeout(() => {
            console.log('🔒 Closing modal after successful submission');

            // Cerrar modal Victory
            const victoryModal = document.getElementById('leaderboardVictoryModal');
            if (victoryModal) {
                console.log('📊 Closing Victory modal');
                victoryModal.remove();
            }

            // Abrir leaderboard después de cerrar modal
            setTimeout(() => {
                console.log('📊 Opening leaderboard after score submission');
                if (window.showLeaderboardModal) {
                    window.showLeaderboardModal('square-rush');
                }
            }, 300); // Small delay to ensure modal is fully closed

        }, 2000); // 2 segundos para que el usuario vea el mensaje de éxito

    } catch (error) {
        console.error('❌ Error submitting score:', error);
        showToast(`Error: ${error.message}`, 'error');

        // Rehabilitar botón
        submitBtn.disabled = false;
        submitBtn.textContent = '🏆 SUBMIT SCORE';
        submitBtn.classList.remove('success');
    }
}

// ========================================
// CUSTOM LEADERBOARD RENDERING
// ========================================

/**
 * Renderizar leaderboard custom para Square Rush
 * Columnas: RANK | PLAYER | SCORE | LEVEL | TARGETS | COMBO
 */
function renderSquareRushLeaderboardTable(scores) {
    console.log('🎯 Rendering custom Square Rush leaderboard with', scores.length, 'scores');

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
        const rank = index + 1;
        const playerName = entry.player_name || 'PLAYER';
        const score = entry.score || 0;

        // Metadata
        const metadata = entry.metadata || {};
        const levelReached = metadata.level_reached || '-';
        const maxCombo = metadata.max_combo ? `x${metadata.max_combo}` : '-';
        const targetsFound = metadata.targets_found || '-';

        // Clase especial para top 3
        let rowClass = '';
        if (rank === 1) rowClass = 'rank-1';
        else if (rank === 2) rowClass = 'rank-2';
        else if (rank === 3) rowClass = 'rank-3';

        html += `
            <tr class="${rowClass}">
                <td class="rank">${getRankEmoji(rank)}${rank}</td>
                <td class="player-name">${playerName}</td>
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
// Esto permite ver el leaderboard de Square Rush desde otros juegos
window.renderSquareRushLeaderboardTable = renderSquareRushLeaderboardTable;

console.log('✅ Square Rush Leaderboard Integration ready');
console.log('✅ Square Rush custom leaderboard rendering registered');
