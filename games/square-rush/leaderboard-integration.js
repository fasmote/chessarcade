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
                padding: 1.5rem;
                border-radius: 15px;
                text-align: center;
                z-index: 10000;
                backdrop-filter: blur(20px);
                border: 3px solid #ff0080;
                box-shadow: 0 0 30px rgba(255, 0, 128, 0.5);
                max-width: 90vw;
                max-height: 90vh;
                overflow-y: auto;
                width: 320px;
            ">
                <button class="modal-close" onclick="closeLeaderboardGameOverModal(); if(window.playAgain) window.playAgain();" style="
                    position: absolute;
                    top: 10px;
                    right: 15px;
                    background: rgba(255,0,0,0.3);
                    border: 2px solid #ff0080;
                    color: white;
                    font-size: 2.5rem;
                    cursor: pointer;
                    width: 50px;
                    height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.3s ease;
                ">✕</button>

                <div style="font-size: 2rem; margin-bottom: 0.5rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #ff0080;">
                    💀 GAME OVER
                </div>

                <div style="font-size: 0.9rem; color: #e0e0e0; margin-bottom: 0.8rem; line-height: 1.3;">
                    <span style="color: #00ffff; font-weight: bold;">Submit and compete for the top rankings!</span>
                </div>

                <!-- Statistics Grid - Compacto para mobile -->
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-bottom: 1rem;">
                    <div style="background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                        <div style="font-size: 0.7rem; color: #999; margin-bottom: 0.2rem;">SCORE</div>
                        <div style="font-size: 1.3rem; font-weight: 700; color: #00ffff;">${finalScore}</div>
                    </div>
                    <div style="background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                        <div style="font-size: 0.7rem; color: #999; margin-bottom: 0.2rem;">LEVEL</div>
                        <div style="font-size: 1.3rem; font-weight: 700; color: #00ffff;">${levelReached}</div>
                    </div>
                    <div style="background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                        <div style="font-size: 0.7rem; color: #999; margin-bottom: 0.2rem;">MAX COMBO</div>
                        <div style="font-size: 1.3rem; font-weight: 700; color: #00ffff;">x${maxCombo}</div>
                    </div>
                    <div style="background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                        <div style="font-size: 0.7rem; color: #999; margin-bottom: 0.2rem;">TARGETS</div>
                        <div style="font-size: 1.3rem; font-weight: 700; color: #00ffff;">${targetsFound}</div>
                    </div>
                </div>

                <!-- Player Name Input - Compacto -->
                <div style="margin: 10px 0;">
                    <label for="playerNameGameOver" style="display: block; margin-bottom: 5px; color: #00ffff; font-weight: bold; font-size: 0.9rem;">Enter Your Name:</label>
                    <input type="text" id="playerNameGameOver" maxlength="20" placeholder="PLAYER"
                           style="width: 100%; padding: 8px; background: rgba(0, 255, 255, 0.1); border: 2px solid #00ffff; border-radius: 8px; color: white; font-family: 'Orbitron', monospace; font-size: 14px; text-align: center;"
                           value="${localStorage.getItem('squareRushPlayerName') || ''}">
                </div>

                <!-- Container para ranking animation - se insertará aquí dinámicamente -->
                <div id="gameOverRankingContainer"></div>

                <!-- Botón Submit compacto -->
                <button id="submitScoreGameOver" style="margin-bottom: 5px; padding: 0.7rem 1.5rem; font-size: 1rem; font-weight: 700; border: none; border-radius: 20px; cursor: pointer; font-family: 'Orbitron', monospace; text-transform: uppercase; letter-spacing: 0.1em; background: linear-gradient(to bottom, #ff8a80 0%, #ff6b6b 30%, #ff5252 70%, #d32f2f 100%); color: white; width: 100%;">
                    🏆 SUBMIT SCORE
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

    // NOTA EDUCATIVA: Mostramos ranking animation DESPUÉS de insertar el modal en el DOM
    // La animación muestra al jugador en qué posición quedaría su score
    setTimeout(() => {
        const modalContent = document.querySelector('#leaderboardGameOverModal .game-over-modal-content');
        if (modalContent && window.showRankingAnimation) {
            window.showRankingAnimation(finalScore, modalContent, 'playerNameGameOver');
        }
    }, 500);
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

        // ✅ CRÍTICO: Guardar nombre Y score para que el leaderboard pueda destacar la fila correcta
        // NOTA EDUCATIVA: Sin esto, el leaderboard no sabe qué fila resaltar
        window.lastSubmittedPlayerName = playerName;
        window.lastSubmittedScore = finalScore;
        console.log('✅ [DEBUG] Saved for highlight - Name:', playerName, 'Score:', finalScore);

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

            // Limpiar ranking animation
            if (window.clearRankingAnimation) {
                window.clearRankingAnimation();
            }

            // ✅ Abrir leaderboard CON PARÁMETROS DE HIGHLIGHT
            // NOTA EDUCATIVA: Pasar highlightPlayer y highlightScore permite que el leaderboard
            // active la vista dividida (split view) si el jugador está lejos del top 10
            setTimeout(() => {
                console.log('📊 Opening leaderboard after score submission');
                if (window.showLeaderboardModal) {
                    window.showLeaderboardModal('square-rush', {
                        highlightPlayer: window.lastSubmittedPlayerName,
                        highlightScore: window.lastSubmittedScore
                    });
                }
            }, 300);

        }, 2000);

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

                <!-- Container para ranking animation -->
                <div id="victoryRankingContainer"></div>

                <!-- NOTA: Solo mostramos SUBMIT SCORE. Los botones VIEW LEADERBOARD y PLAY AGAIN
                     fueron removidos - el leaderboard se abre automáticamente después del submit. -->
                <button id="submitScoreVictory" style="margin-bottom: 10px; padding: 1rem 2rem; font-size: 1.1rem; font-weight: 700; border: none; border-radius: 25px; cursor: pointer; font-family: 'Orbitron', monospace; text-transform: uppercase; letter-spacing: 0.1em; background: linear-gradient(to bottom, #ff8a80 0%, #ff6b6b 30%, #ff5252 70%, #d32f2f 100%); color: white; width: 100%;">
                    🏆 SUBMIT SCORE
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

    // NOTA EDUCATIVA: Mostramos ranking animation DESPUÉS de insertar el modal en el DOM
    // La animación muestra al jugador en qué posición quedaría su score
    setTimeout(() => {
        const modalContent = document.querySelector('#leaderboardVictoryModal .victory-modal-content');
        if (modalContent && window.showRankingAnimation) {
            window.showRankingAnimation(finalScore, modalContent, 'playerNameVictory');
        }
    }, 500);
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

        // ✅ CRÍTICO: Guardar nombre Y score para que el leaderboard pueda destacar la fila correcta
        window.lastSubmittedPlayerName = playerName;
        window.lastSubmittedScore = finalScore;
        console.log('✅ [DEBUG] Saved for highlight - Name:', playerName, 'Score:', finalScore);

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

            // Limpiar ranking animation
            if (window.clearRankingAnimation) {
                window.clearRankingAnimation();
            }

            // ✅ Abrir leaderboard CON PARÁMETROS DE HIGHLIGHT
            setTimeout(() => {
                console.log('📊 Opening leaderboard after score submission');
                if (window.showLeaderboardModal) {
                    window.showLeaderboardModal('square-rush', {
                        highlightPlayer: window.lastSubmittedPlayerName,
                        highlightScore: window.lastSubmittedScore
                    });
                }
            }, 300);

        }, 2000);

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
 *
 * VISTA DIVIDIDA: Si el jugador destacado está muy lejos del top (rank > 10),
 * muestra: Top 5 → separador "..." → posiciones alrededor del jugador
 *
 * NOTA EDUCATIVA: El "split view" es una técnica de UX que permite mostrar
 * información relevante sin scroll excesivo. El usuario ve los líderes
 * Y su propia posición, sin tener que buscar entre cientos de filas.
 *
 * @param {array} scores - Array de scores del backend
 * @param {string} highlightPlayer - Nombre del jugador a destacar (opcional)
 * @param {number} highlightScore - Score específico a destacar
 */
function renderSquareRushLeaderboardTable(scores, highlightPlayer = null, highlightScore = null) {
    console.log('🎯 Rendering custom Square Rush leaderboard with', scores.length, 'scores');
    console.log('[DEBUG] Square Rush highlight - Player:', highlightPlayer, 'Score:', highlightScore);

    if (!scores || scores.length === 0) {
        return '<p class="no-scores">No scores yet. Be the first!</p>';
    }

    // Crear tabla
    const table = document.createElement('table');
    table.className = 'leaderboard-table';

    // Crear thead
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>RANK</th>
            <th>PLAYER</th>
            <th>SCORE</th>
            <th>LEVEL</th>
            <th>TARGETS</th>
            <th>COMBO</th>
        </tr>
    `;
    table.appendChild(thead);

    // Crear tbody
    const tbody = document.createElement('tbody');

    /**
     * Función auxiliar para renderizar una fila
     * NOTA EDUCATIVA: Separamos la lógica de renderizado para reutilizarla
     * tanto en vista normal como en vista dividida
     */
    const renderRow = (entry, index) => {
        const rank = index + 1;
        const playerName = entry.player_name || 'PLAYER';
        const score = entry.score || 0;

        // Metadata
        const metadata = entry.metadata || {};
        const levelReached = metadata.level_reached || '-';
        const maxCombo = metadata.max_combo ? `x${metadata.max_combo}` : '-';
        const targetsFound = metadata.targets_found || '-';

        // Clases para la fila
        let rowClasses = [];
        if (rank === 1) rowClasses.push('rank-1');
        else if (rank === 2) rowClasses.push('rank-2');
        else if (rank === 3) rowClasses.push('rank-3');

        // Verificar si esta fila debe ser destacada
        const nameMatches = highlightPlayer && playerName.toLowerCase() === highlightPlayer.toLowerCase();
        const scoreMatches = highlightScore === null || score === highlightScore;

        if (nameMatches && scoreMatches) {
            rowClasses.push('highlight-player-row');
            console.log('[DEBUG] Highlighting row:', playerName, score);
        }

        return `
            <tr class="${rowClasses.join(' ')}">
                <td class="rank">${getRankEmoji(rank)}${rank}</td>
                <td class="player-name">${playerName}</td>
                <td class="score">${score.toLocaleString()}</td>
                <td class="level">${levelReached}</td>
                <td class="level">${targetsFound}</td>
                <td class="level">${maxCombo}</td>
            </tr>
        `;
    };

    // Buscar posición del jugador destacado
    let playerIndex = -1;
    if (highlightPlayer && highlightScore !== null) {
        playerIndex = scores.findIndex(s =>
            s.player_name?.toLowerCase() === highlightPlayer.toLowerCase() &&
            s.score === highlightScore
        );
    }

    console.log('[DEBUG] playerIndex found:', playerIndex);

    // Usar vista dividida si el jugador está en posición > 10 (índice > 9)
    const useSplitView = playerIndex > 9;

    if (useSplitView) {
        // VISTA DIVIDIDA
        const TOP_COUNT = 5;
        const CONTEXT_BEFORE = 2;
        const CONTEXT_AFTER = 2;

        let htmlRows = [];

        // 1. Mostrar Top 5
        for (let i = 0; i < Math.min(TOP_COUNT, scores.length); i++) {
            htmlRows.push(renderRow(scores[i], i));
        }

        // 2. Calcular posiciones ocultas
        const startIndex = Math.max(TOP_COUNT, playerIndex - CONTEXT_BEFORE);
        const hiddenCount = startIndex - TOP_COUNT;

        // 3. Agregar separador (colspan="6" porque Square Rush tiene 6 columnas)
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

        // 4. Mostrar zona del jugador
        const endIndex = Math.min(scores.length - 1, playerIndex + CONTEXT_AFTER);
        for (let i = startIndex; i <= endIndex; i++) {
            htmlRows.push(renderRow(scores[i], i));
        }

        tbody.innerHTML = htmlRows.join('');
    } else {
        // Vista normal: mostrar todas las filas
        tbody.innerHTML = scores.map((entry, index) => renderRow(entry, index)).join('');
    }

    table.appendChild(tbody);
    return table;
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
