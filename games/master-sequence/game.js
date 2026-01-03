/**
 * ============================================
 * COORDINATE SEQUENCE - GAME LOGIC
 * ============================================
 * Lógica principal del juego de secuencias
 *
 * @version 1.0.0
 * @author ChessArcade Team
 */

// ============================================
// ESTADO DEL JUEGO
// ============================================

let gameState = {
    // Progresión
    currentLevel: 1,
    score: 0,
    lives: 5,
    maxLives: 5,

    // Secuencia MASTER acumulativa (Simon Says style)
    masterSequence: [],     // Secuencia acumulativa que crece cada nivel
    sequenceColors: [],     // Colores de cada casilla (mismo índice que masterSequence)
    squareUsageCount: {},   // Contador de apariciones: { 'e4': 2, 'd5': 1, ... }
    sequence: [],           // ['e4', 'd5', 'f3'] - copia de masterSequence para el nivel actual
    playerSequence: [],     // Lo que el jugador clickeó
    currentStep: 0,         // Índice actual en reproducción

    // Fases del juego
    phase: 'idle',          // 'idle' | 'showing' | 'playing' | 'success' | 'fail' | 'gameover'

    // Config
    soundEnabled: true,
    coordinatesEnabled: true,   // Mostrar coordenadas por defecto (ayuda visual)
    hintActive: false,          // Si el jugador activó el HINT
    totalHintsUsed: 0,          // Contador total de hints usados en la partida
    hasFirstCorrect: false,     // Si el jugador ya tuvo al menos un acierto (para habilitar Terminar)

    // Stats
    bestLevel: 1,
    totalAttempts: 0,
    perfectLevels: 0,
    currentLevelAttempts: 0,

    // ============================================
    // SISTEMA DE PUNTUACIÓN MEJORADO
    // ============================================

    // Timing del nivel (para speed bonus)
    levelStartTime: 0,      // Timestamp cuando empieza la fase de input
    levelEndTime: 0,        // Timestamp cuando completa el nivel

    // Timing del juego completo (para leaderboard)
    gameStartTime: 0,       // Timestamp cuando inicia la partida completa

    // Perfect Streak (rachas sin errores)
    perfectStreak: 0,       // Contador de niveles perfectos consecutivos

    // High Scores (persistente en localStorage)
    highScores: {
        topScore: 0,
        bestLevel: 1,
        longestStreak: 0,
        fastestLevel: { level: 1, time: 999999 },
        lastUpdated: null
    }
};

// Estadísticas de la última sesión (se preservan después de Game Over)
let lastSessionStats = {
    level: 1,
    score: 0,
    lives: 5,
    streak: 0,
    sequenceLength: 1,
    totalHintsUsed: 0
};

// ============================================
// SISTEMA DE REPLAY
// ============================================

// Grabación de la partida actual (se va llenando mientras juegas)
let currentRecording = {
    timestamp: null,
    finalLevel: 0,
    finalScore: 0,
    levels: []
};

// Mejor replay guardado (el que se puede ver)
let bestReplay = null;

// Estado del reproductor
let replayState = {
    isPlaying: false,
    isPaused: false,
    currentLevelIndex: 0,
    currentStepIndex: 0,
    playbackSpeed: 1.0,  // 0.5x, 1x, 2x
    autoAdvance: true
};

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🧠 Coordinate Sequence - Initializing...');

    initGame();
    setupEventListeners();
    loadSoundPreference();
    loadCoordinatesPreference();

    console.log('✅ Coordinate Sequence - Ready!');
});

/**
 * Inicializa el juego
 */
function initGame() {
    createBoard();

    // Cargar high scores desde localStorage
    gameState.highScores = loadHighScores();
    console.log('💾 High scores loaded:', gameState.highScores);

    // Cargar mejor replay desde localStorage
    loadBestReplay();

    updateUI();
    console.log('🎮 Game initialized');
}

/**
 * Crea el tablero de ajedrez 8x8
 */
function createBoard() {
    const chessboard = document.getElementById('chessboard');
    chessboard.innerHTML = '';

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    for (let rankIndex = 0; rankIndex < ranks.length; rankIndex++) {
        for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
            const rank = ranks[rankIndex];
            const file = files[fileIndex];
            const square = document.createElement('div');
            const squareId = `${file}${rank}`;

            square.className = 'square';
            square.dataset.square = squareId;

            // Alternar colores
            const isLight = (rankIndex + fileIndex) % 2 === 0;
            square.classList.add(isLight ? 'light' : 'dark');

            // Agregar coordenadas en el borde (igual que Memory Matrix)
            // Fila inferior (rank 1): mostrar letras (a-h)
            if (rank === '1') {
                const coordFile = document.createElement('span');
                coordFile.className = 'coord-file';
                coordFile.textContent = file;
                square.appendChild(coordFile);
            }

            // Columna izquierda (file a): mostrar números (8-1)
            if (file === 'a') {
                const coordRank = document.createElement('span');
                coordRank.className = 'coord-rank';
                coordRank.textContent = rank;
                square.appendChild(coordRank);
            }

            chessboard.appendChild(square);
        }
    }

    console.log('♟️ Board created with 64 squares');
}

/**
 * Configura event listeners
 */
function setupEventListeners() {
    // Botón HOME
    const btnHome = document.getElementById('btnHome');
    if (btnHome) {
        btnHome.addEventListener('click', goHome);
    }

    // Botón COMENZAR (dual: iniciar partida O pausar/reanudar replay)
    const btnStart = document.getElementById('btnStart');
    if (btnStart) {
        btnStart.addEventListener('click', () => {
            if (replayState.isPlaying) {
                // Si estamos en replay, pausar/reanudar
                toggleReplayPause();
            } else {
                // Si no, iniciar partida normal
                startGame();
            }
        });
    }

    // Botón PLAY OVERLAY (central en tablero)
    const btnPlayOverlay = document.getElementById('btnPlayOverlay');
    if (btnPlayOverlay) {
        btnPlayOverlay.addEventListener('click', startGame);
    }

    // Botón COORDINATES
    const btnCoordinates = document.getElementById('btnCoordinates');
    if (btnCoordinates) {
        btnCoordinates.addEventListener('click', toggleCoordinates);
    }

    // Botón SOUND
    const btnSound = document.getElementById('btnSound');
    if (btnSound) {
        btnSound.addEventListener('click', toggleSound);
    }

    // Botones de overlays
    document.getElementById('btnCloseAdvancedStats')?.addEventListener('click', () => {
        hideAllOverlays();
        // Si estaba mostrando stats actuales, limpiar cambios de título
        const overlayTitle = document.querySelector('#advancedStatsOverlay .overlay-title');
        if (overlayTitle && overlayTitle.textContent === '📊 Estadísticas Actuales') {
            // Restaurar valores por defecto para próxima vez que se use en nivel completado
            overlayTitle.textContent = '¡Nivel Completado!';
            document.querySelector('#advancedStatsOverlay .overlay-message').textContent = 'Excelente memoria';
            document.querySelector('#advancedStatsOverlay .overlay-icon').textContent = '🎉';
        }
    });
    document.getElementById('btnRetry')?.addEventListener('click', retryLevel);
    document.getElementById('btnRestart')?.addEventListener('click', restartGame);
    document.getElementById('btnRestartGame')?.addEventListener('click', backToMainScreen); // Volver a pantalla principal SIN empezar juego

    // Botón X de Game Over (misma función que "Volver al Inicio")
    document.getElementById('btnCloseGameOver')?.addEventListener('click', backToMainScreen);

    // Icono ❌ clickeable en el overlay de error (misma función que "Reintentar")
    document.getElementById('btnCloseFailOverlay')?.addEventListener('click', retryLevel);

    // Botón X de Stats Overlay (misma función que "Continuar")
    document.getElementById('btnCloseStats')?.addEventListener('click', () => {
        hideAllOverlays();
        // Si estaba mostrando stats actuales, limpiar cambios de título
        const overlayTitle = document.querySelector('#advancedStatsOverlay .overlay-title');
        if (overlayTitle && overlayTitle.textContent === '📊 Estadísticas Actuales') {
            // Restaurar valores por defecto para próxima vez que se use en nivel completado
            overlayTitle.textContent = '¡Nivel Completado!';
            document.querySelector('#advancedStatsOverlay .overlay-message').textContent = 'Excelente memoria';
            document.querySelector('#advancedStatsOverlay .overlay-icon').textContent = '🎉';
        }
    });

    // Botón STATS (consultar estadísticas actuales)
    document.getElementById('btnStats')?.addEventListener('click', showCurrentStats);

    // Botón HINT (mostrar ayuda visual)
    document.getElementById('btnHint')?.addEventListener('click', showHint);

    // Botón TERMINAR (dual: terminar partida O detener replay)
    document.getElementById('btnEndGame')?.addEventListener('click', () => {
        if (replayState.isPlaying) {
            // Si estamos en replay, detenerlo
            stopReplay();
        } else {
            // Si no, terminar partida normal
            endGame();
        }
    });

    // Botones de confirmación de terminar
    document.getElementById('btnConfirmEnd')?.addEventListener('click', confirmEndGame);
    document.getElementById('btnCancelEnd')?.addEventListener('click', cancelEndGame);

    // Botones de REPLAY
    document.getElementById('btnReplay')?.addEventListener('click', startReplayPlayback);

    // Clicks en el tablero
    const chessboard = document.getElementById('chessboard');
    chessboard.addEventListener('click', handleSquareClick);

    console.log('🎯 Event listeners configured');
}

// ============================================
// FLUJO DEL JUEGO
// ============================================

/**
 * Inicia el juego desde nivel 1
 */
function startGame() {
    console.log('🎮 Starting game...');

    gameState.currentLevel = 1;
    gameState.score = 0;
    gameState.lives = gameState.maxLives;
    gameState.bestLevel = 1;
    gameState.totalAttempts = 0;
    gameState.perfectLevels = 0;
    gameState.masterSequence = []; // Resetear secuencia acumulativa
    gameState.sequenceColors = []; // Resetear colores
    gameState.squareUsageCount = {}; // Resetear contador de uso
    gameState.gameStartTime = Date.now(); // Iniciar cronómetro de partida completa
    gameState.hasFirstCorrect = false; // Resetear flag de primer acierto

    // Deshabilitar botón Terminar hasta que haya al menos un acierto
    const btnEndGame = document.getElementById('btnEndGame');
    if (btnEndGame) {
        btnEndGame.disabled = true;
        btnEndGame.classList.add('disabled');
    }

    // Limpiar líneas de replay si quedaron como residuo
    clearReplayConnectingLines();

    // Quitar efecto vintage si estaba activo
    const chessboard = document.getElementById('chessboard');
    chessboard.classList.remove('replay-mode');

    // Iniciar nueva grabación
    startRecording();

    hideAllOverlays();
    hidePlayButton(); // Ocultar botón play central
    startLevel(1);
}

/**
 * Inicia un nivel específico
 */
function startLevel(levelNumber) {
    console.log(`📊 Starting level ${levelNumber}...`);

    gameState.currentLevel = levelNumber;
    gameState.currentLevelAttempts = 0;
    gameState.phase = 'idle';

    const config = window.CoordinateSequence.Levels.getLevelConfig(levelNumber);

    // ============================================
    // SECUENCIA ACUMULATIVA (SIMON SAYS STYLE)
    // ============================================
    // Nivel 1: Genera secuencia inicial
    // Niveles 2+: MANTIENE secuencia anterior y AGREGA UNA nueva casilla

    if (levelNumber === 1) {
        // Primer nivel: generar secuencia inicial
        gameState.masterSequence = window.CoordinateSequence.Levels.generateRandomSequence(config);

        // Inicializar contador de uso para cada casilla de la secuencia inicial
        for (const square of gameState.masterSequence) {
            gameState.squareUsageCount[square] = (gameState.squareUsageCount[square] || 0) + 1;
        }

        // Generar colores para cada casilla de la secuencia inicial
        gameState.sequenceColors = [];
        for (let i = 0; i < gameState.masterSequence.length; i++) {
            const color = config.useColors ?
                window.CoordinateSequence.Levels.getSequenceColor(i) :
                { name: 'cyan', hex: '#00ffff', shadowColor: 'rgba(0, 255, 255, 0.8)' };
            gameState.sequenceColors.push(color);
        }

        console.log('   🎬 Primera secuencia generada');
    } else {
        // Niveles siguientes: AGREGAR solo UNA casilla nueva a la master sequence
        // PATRÓN DE MOVIMIENTOS: Rey o Caballo desde la última casilla
        const lastSquare = gameState.masterSequence[gameState.masterSequence.length - 1];

        // Obtener casillas alcanzables desde la última (movimientos de rey + caballo)
        const possibleMoves = window.ChessGameLibrary.BoardUtils.getKingOrKnightMoves(lastSquare);

        // Filtrar solo las que están en el área permitida del nivel
        let availableSquares = [];
        switch (config.restrictedArea) {
            case 'ring':
                const ringSquares = window.ChessGameLibrary.BoardUtils.getRingSquares(config.areaConfig);
                availableSquares = possibleMoves.filter(sq => ringSquares.includes(sq));
                break;
            case 'quadrant':
                const quadrantSquares = window.ChessGameLibrary.BoardUtils.getQuadrantSquares(config.areaConfig);
                availableSquares = possibleMoves.filter(sq => quadrantSquares.includes(sq));
                break;
            case 'rows':
                const rowSquares = window.ChessGameLibrary.BoardUtils.getRowRangeSquares(
                    config.areaConfig.start,
                    config.areaConfig.end
                );
                availableSquares = possibleMoves.filter(sq => rowSquares.includes(sq));
                break;
            case 'full':
            default:
                availableSquares = possibleMoves;
                break;
        }

        // FILTRAR casillas que ya se usaron 2 o más veces
        availableSquares = availableSquares.filter(sq => {
            const usageCount = gameState.squareUsageCount[sq] || 0;
            return usageCount < 2;
        });

        console.log(`   📊 Casillas disponibles después de filtrar saturadas: ${availableSquares.length}`);

        // Trackear origen del movimiento (por defecto es lastSquare, cambia en backtracking)
        let originSquare = null;

        // Si no hay movimientos válidos en el área, EXPANDIR búsqueda a toda el área
        if (availableSquares.length === 0) {
            console.warn(`   ⚠️ No hay movimientos válidos desde ${lastSquare} en área restringida`);

            // En vez de fallback aleatorio, buscar movimientos en TODA el área
            let allAreaSquares = [];
            switch (config.restrictedArea) {
                case 'ring':
                    allAreaSquares = window.ChessGameLibrary.BoardUtils.getRingSquares(config.areaConfig);
                    break;
                case 'quadrant':
                    allAreaSquares = window.ChessGameLibrary.BoardUtils.getQuadrantSquares(config.areaConfig);
                    break;
                case 'rows':
                    allAreaSquares = window.ChessGameLibrary.BoardUtils.getRowRangeSquares(
                        config.areaConfig.start,
                        config.areaConfig.end
                    );
                    break;
                case 'full':
                default:
                    allAreaSquares = window.ChessGameLibrary.BoardUtils.getAllSquares();
                    break;
            }

            // Buscar casillas del área que SÍ sean alcanzables por rey/caballo desde ALGUNA casilla anterior
            for (let i = gameState.masterSequence.length - 1; i >= 0; i--) {
                const previousSquare = gameState.masterSequence[i];
                const movesFromPrevious = window.ChessGameLibrary.BoardUtils.getKingOrKnightMoves(previousSquare);
                let validFromPrevious = allAreaSquares.filter(sq => movesFromPrevious.includes(sq));

                // FILTRAR casillas saturadas también en backtracking
                validFromPrevious = validFromPrevious.filter(sq => {
                    const usageCount = gameState.squareUsageCount[sq] || 0;
                    return usageCount < 2;
                });

                if (validFromPrevious.length > 0) {
                    availableSquares = validFromPrevious;
                    originSquare = previousSquare;

                    // IMPORTANTE: Eliminar casillas "muertas" al hacer backtracking
                    // Si retrocedemos N casillas, eliminar las últimas (N-1) casillas de la secuencia
                    const backtrackSteps = gameState.masterSequence.length - i - 1;
                    if (backtrackSteps > 0) {
                        console.log(`   ⏪ BACKTRACKING: Eliminando ${backtrackSteps} casilla(s) muerta(s)`);

                        // Eliminar las casillas muertas del masterSequence
                        const removedSquares = gameState.masterSequence.splice(i + 1, backtrackSteps);

                        // También eliminar sus colores correspondientes
                        gameState.sequenceColors.splice(i + 1, backtrackSteps);

                        // Decrementar contador de uso de las casillas eliminadas
                        removedSquares.forEach(sq => {
                            if (gameState.squareUsageCount[sq]) {
                                gameState.squareUsageCount[sq]--;
                            }
                        });

                        console.log(`   ⏪ Casillas eliminadas:`, removedSquares);
                    }

                    console.log(`   ✅ Usando movimiento desde ${previousSquare} (${backtrackSteps + 1} casillas atrás en la búsqueda original)`);
                    break;
                }
            }

            // Último recurso: si NINGUNA casilla anterior tiene movimientos válidos, usar aleatorio
            if (availableSquares.length === 0) {
                console.warn(`   ⚠️ FALLBACK EXTREMO: usando casilla aleatoria del área`);
                availableSquares = allAreaSquares;
                originSquare = null;
            }
        }

        // Elegir casilla aleatoria de las disponibles
        const newSquare = availableSquares[Math.floor(Math.random() * availableSquares.length)];

        gameState.masterSequence.push(newSquare);

        // Incrementar contador de uso de la nueva casilla
        gameState.squareUsageCount[newSquare] = (gameState.squareUsageCount[newSquare] || 0) + 1;

        // Agregar color para la nueva casilla (siguiente en la secuencia de colores)
        const newColorIndex = gameState.sequenceColors.length;
        const newColor = config.useColors ?
            window.CoordinateSequence.Levels.getSequenceColor(newColorIndex) :
            { name: 'cyan', hex: '#00ffff', shadowColor: 'rgba(0, 255, 255, 0.8)' };
        gameState.sequenceColors.push(newColor);

        // Determinar origen correcto para el log
        const actualOrigin = originSquare || lastSquare;
        console.log(`   ➕ Casilla agregada: ${newSquare} (desde ${actualOrigin} con movimiento rey/caballo) - Color: ${newColor.name}`);
    }

    // La secuencia actual es una copia de la master sequence
    gameState.sequence = [...gameState.masterSequence];
    gameState.playerSequence = [];
    gameState.currentStep = 0;

    console.log(`   Sequence length: ${gameState.sequence.length} (config says ${config.sequenceLength})`);
    console.log(`   Restricted area: ${config.restrictedArea} (${config.areaConfig || 'full'})`);
    console.log(`   Sequence:`, gameState.sequence);
    console.log(`   Use colors: ${config.useColors}`);

    // Grabar inicio del nivel
    recordLevelStart(levelNumber, gameState.sequence, gameState.sequenceColors);

    updateUI();
    updateStatus(`Nivel ${levelNumber} - ${config.name}`, 'info');

    // Pequeña pausa antes de mostrar la secuencia
    setTimeout(() => {
        showSequence();
    }, 1000);
}

/**
 * Muestra la secuencia al jugador (fase de memorización)
 */
async function showSequence() {
    console.log('👀 Showing sequence...');

    gameState.phase = 'showing';
    updateStatus('¡Memoriza la secuencia!', 'info');

    const config = window.CoordinateSequence.Levels.getLevelConfig(gameState.currentLevel);
    const { highlightDuration, pauseDuration } = config;

    // Deshabilitar clicks durante la visualización
    disableBoard();

    // Mostrar cada casilla de la secuencia
    for (let i = 0; i < gameState.sequence.length; i++) {
        const square = gameState.sequence[i];

        // Usar el color guardado para esta casilla
        const color = gameState.sequenceColors[i];

        // Reproducir sonido ANTES de iluminar (sincronización perfecta)
        if (gameState.soundEnabled && typeof playBeep === 'function') {
            playBeep(440 + i * 50);
            // Pequeño delay para que el audio inicie antes que el visual (Web Audio API latency)
            await sleep(10);
        }

        // Highlight la casilla con el color correspondiente
        await highlightSquare(square, highlightDuration, color);

        // Pausa entre casillas (excepto la última)
        if (i < gameState.sequence.length - 1) {
            await sleep(pauseDuration);
        }
    }

    // Secuencia mostrada, ahora el jugador debe repetirla
    console.log('✅ Sequence shown');
    gameState.phase = 'playing';

    // Capturar timestamp de inicio para speed bonus
    gameState.levelStartTime = Date.now();

    enableBoard();
    updateStatus('¡Ahora repite la secuencia!', 'playing');
}

/**
 * Ilumina una casilla por un tiempo determinado con un color específico
 * @param {string} squareId - ID de la casilla (ej: "e4")
 * @param {number} duration - Duración del highlight en ms
 * @param {Object} color - Objeto con hex y shadowColor
 */
function highlightSquare(squareId, duration, color = null) {
    return new Promise(resolve => {
        const squareElement = document.querySelector(`[data-square="${squareId}"]`);
        if (!squareElement) {
            console.warn(`Square ${squareId} not found`);
            resolve();
            return;
        }

        // Aplicar color personalizado si se proporciona
        if (color) {
            squareElement.style.setProperty('--highlight-color', color.hex);
            squareElement.style.setProperty('--highlight-shadow', color.shadowColor);
        }

        squareElement.classList.add('highlighting');

        // Si las coordenadas están habilitadas, asegurarse de que el label esté visible
        if (gameState.coordinatesEnabled && !squareElement.querySelector('.coordinate-label')) {
            const label = document.createElement('span');
            label.className = 'coordinate-label';
            label.textContent = squareId.toUpperCase();
            squareElement.appendChild(label);
        }

        setTimeout(() => {
            // Desactivar transiciones temporalmente para evitar efecto de "aclarado"
            squareElement.style.transition = 'none';
            squareElement.classList.remove('highlighting');

            // Limpiar estilos inline
            if (color) {
                squareElement.style.removeProperty('--highlight-color');
                squareElement.style.removeProperty('--highlight-shadow');
            }

            // Restaurar transiciones después de que el browser procese el cambio
            requestAnimationFrame(() => {
                squareElement.style.removeProperty('transition');
            });

            resolve();
        }, duration);
    });
}

/**
 * Maneja el click en una casilla durante la fase de reproducción
 */
function handleSquareClick(e) {
    if (gameState.phase !== 'playing') {
        return; // No hacer nada si no estamos en fase de reproducción
    }

    const square = e.target.closest('.square');
    if (!square) return;

    const squareId = square.dataset.square;
    console.log(`🖱️ Player clicked: ${squareId}`);

    // Grabar el movimiento del jugador
    recordPlayerMove(squareId);

    // Agregar a la secuencia del jugador
    gameState.playerSequence.push(squareId);

    // Validar si es correcto
    const expectedSquare = gameState.sequence[gameState.currentStep];
    const isCorrect = squareId === expectedSquare;

    if (isCorrect) {
        // ✅ Correcto
        console.log(`✅ Correct! (${gameState.currentStep + 1}/${gameState.sequence.length})`);

        // Habilitar botón Terminar después del primer acierto
        if (!gameState.hasFirstCorrect) {
            gameState.hasFirstCorrect = true;
            const btnEndGame = document.getElementById('btnEndGame');
            if (btnEndGame) {
                btnEndGame.disabled = false;
                btnEndGame.classList.remove('disabled');
            }
        }

        // Limpiar TODO el hint (líneas, flechas, coordenadas, bordes)
        clearHints();

        // Mostrar con el MISMO COLOR que se usó en la secuencia original
        const color = gameState.sequenceColors[gameState.currentStep];
        highlightSquare(squareId, 500, color);

        // Lanzar partículas de éxito (PASO 6)
        spawnParticles(square, color, 5);

        if (gameState.soundEnabled && typeof playCorrect === 'function') {
            playCorrect();
        }

        gameState.currentStep++;

        // ¿Completó toda la secuencia?
        if (gameState.currentStep === gameState.sequence.length) {
            onLevelComplete();
        }
    } else {
        // ❌ Incorrecto
        console.log(`❌ Incorrect! Expected ${expectedSquare}, got ${squareId}`);

        square.classList.add('incorrect');
        setTimeout(() => square.classList.remove('incorrect'), 500);

        if (gameState.soundEnabled && typeof playIncorrect === 'function') {
            playIncorrect();
        }

        onLevelFailed();
    }
}

/**
 * Nivel completado exitosamente
 */
function onLevelComplete() {
    console.log('🎉 Level complete!');

    gameState.phase = 'success';
    disableBoard();

    // Capturar timestamp de finalización
    gameState.levelEndTime = Date.now();
    const timeElapsed = gameState.levelEndTime - gameState.levelStartTime;
    const timeElapsedSeconds = (timeElapsed / 1000).toFixed(2);
    console.log(`⏱️ Level completed in ${timeElapsedSeconds}s`);

    const isPerfect = gameState.currentLevelAttempts === 0;

    // Calcular puntos base
    let points = window.CoordinateSequence.Levels.calculateLevelScore(gameState.currentLevel, isPerfect);

    // Calcular speed bonus
    const speedBonus = calculateSpeedBonus(timeElapsed, gameState.currentLevel);
    if (speedBonus > 0) {
        console.log(`⚡ Speed Bonus: +${speedBonus} pts`);
    }

    // Actualizar perfect streak
    if (isPerfect) {
        gameState.perfectStreak++;
        gameState.perfectLevels++;
    } else {
        gameState.perfectStreak = 0; // Resetear racha
    }

    // Calcular multiplicador de racha
    const streakMultiplier = calculateStreakMultiplier(gameState.perfectStreak);
    if (streakMultiplier > 1.0) {
        console.log(`🔥 Perfect Streak x${gameState.perfectStreak} = Multiplier x${streakMultiplier}`);
    }

    // Calcular puntos finales
    const basePointsTotal = points + speedBonus;
    const finalPoints = Math.round(basePointsTotal * streakMultiplier);

    console.log(`💰 Base: ${points} + Speed: ${speedBonus} = ${basePointsTotal} × ${streakMultiplier} = ${finalPoints} pts`);

    gameState.score += finalPoints;
    gameState.totalAttempts++;

    // Actualizar best level
    if (gameState.currentLevel > gameState.bestLevel) {
        gameState.bestLevel = gameState.currentLevel;
    }

    // Actualizar high scores y obtener lista de records batidos
    const newRecords = updateHighScores(timeElapsed);
    if (newRecords.length > 0) {
        console.log('🎊 ¡NUEVO RECORD!');
        // Confeti dorado especial para records (PASO 6)
        launchGoldenConfetti(100);
    }

    updateUI();

    // Grabar finalización exitosa del nivel
    recordLevelEnd(true, parseFloat(timeElapsedSeconds), gameState.currentLevelAttempts);

    // Reproducir sonido de victoria
    if (gameState.soundEnabled && typeof playLevelComplete === 'function') {
        playLevelComplete();
    }

    // Lanzar confeti (no-disruptivo, mantiene concentración)
    launchConfetti(30);

    // Avanzar al siguiente nivel después de un breve delay (flujo continuo)
    setTimeout(() => {
        nextLevel();
    }, 1500);
}

/**
 * Nivel fallado
 */
function onLevelFailed() {
    console.log('💔 Level failed');

    gameState.phase = 'fail';
    gameState.lives--;
    gameState.currentLevelAttempts++;
    gameState.perfectStreak = 0; // Resetear racha perfecta
    disableBoard();

    updateUI();

    // ¿Game Over?
    if (gameState.lives === 0) {
        gameOver();
        return;
    }

    // Mostrar overlay de fallo
    showFailOverlay();
}

/**
 * Game Over
 */
function gameOver() {
    console.log('💀 Game Over');

    // Calcular tiempo total de juego
    const totalTimeMs = Date.now() - gameState.gameStartTime;

    // Preservar estadísticas de la sesión para mostrar en STATS después
    lastSessionStats = {
        level: gameState.currentLevel,
        score: gameState.score,
        lives: gameState.lives,
        streak: gameState.perfectStreak,
        sequenceLength: gameState.masterSequence.length,  // Usar masterSequence (secuencia acumulativa completa)
        totalTimeMs: totalTimeMs,  // Tiempo total de la partida
        totalHintsUsed: gameState.totalHintsUsed  // Total de hints usados en la partida
    };

    // ✅ CRÍTICO: Exponer en window para que leaderboard-integration.js pueda acceder
    window.lastSessionStats = lastSessionStats;

    console.log('📊 Last session stats saved:', lastSessionStats);
    console.log('🔍 [DEBUG] Sequence length saved:', lastSessionStats.sequenceLength);
    console.log('✅ [DEBUG] window.lastSessionStats exposed:', window.lastSessionStats);

    // Finalizar grabación y decidir si guardar
    const savedNewRecord = finishRecording();
    if (savedNewRecord) {
        console.log('🎬 ¡Nuevo mejor replay guardado!');
    }

    gameState.phase = 'gameover';

    if (gameState.soundEnabled && typeof playGameOver === 'function') {
        playGameOver();
    }

    updateUI();
    showGameOverOverlay();
}

/**
 * Siguiente nivel
 */
function nextLevel() {
    hideAllOverlays();
    startLevel(gameState.currentLevel + 1);
}

/**
 * Reintentar nivel actual
 */
function retryLevel() {
    hideAllOverlays();

    // IMPORTANTE: Deshabilitar tablero inmediatamente para evitar clicks prematuros
    disableBoard();

    // Resetear estado del nivel (mantener lives)
    gameState.playerSequence = [];
    gameState.currentStep = 0;
    gameState.phase = 'idle';

    // NO regenerar secuencia, usar la misma masterSequence acumulativa
    // La secuencia ya está en gameState.sequence (copia de masterSequence)
    console.log(`🔄 Retrying level ${gameState.currentLevel} with same sequence:`, gameState.sequence);

    updateUI();

    setTimeout(() => {
        showSequence();
    }, 500);
}

/**
 * Reiniciar juego completo
 */
function restartGame() {
    hideAllOverlays();
    startGame();
}

/**
 * Terminar partida (usuario decide terminar antes de perder todas las vidas)
 * Muestra overlay de confirmación estilo ChessArcade
 */
function endGame() {
    console.log('🛑 Usuario quiere terminar la partida manualmente');

    // Solo si está jugando
    if (gameState.phase === 'idle' || gameState.currentLevel === 1) {
        console.log('⚠️ No hay partida activa para terminar');
        updateStatus('No hay partida activa para terminar');
        return;
    }

    // Mostrar overlay de confirmación
    document.getElementById('confirmEndOverlay').classList.remove('hidden');
}

/**
 * Confirma terminar partida (fuerza Game Over)
 */
function confirmEndGame() {
    hideAllOverlays();
    console.log('✓ Usuario confirmó terminar partida');

    // Forzar Game Over
    gameState.lives = 0;
    gameOver();
}

/**
 * Cancela terminar partida
 */
function cancelEndGame() {
    hideAllOverlays();
    console.log('✗ Usuario canceló terminar partida');
}

/**
 * Muestra hint visual: marca toda la secuencia en gris + borde amarillo en siguiente casilla
 * Penalización: -100 puntos + rompe racha perfecta
 */
function showHint() {
    // Solo funciona durante la fase de juego
    if (gameState.phase !== 'playing') {
        console.log('⚠️ Hint solo disponible durante la fase de juego');
        updateStatus('El hint solo está disponible cuando estás jugando', 'error');
        return;
    }

    // Verificar que tiene puntos suficientes
    const HINT_COST = 100;
    if (gameState.score < HINT_COST) {
        console.log(`⚠️ Puntos insuficientes para hint (tienes ${gameState.score}, necesitas ${HINT_COST})`);
        updateStatus(`Necesitas al menos ${HINT_COST} puntos para usar el hint. Tienes ${gameState.score} pts.`, 'error');
        return;
    }

    // Verificar que hay una casilla siguiente
    if (gameState.currentStep >= gameState.sequence.length) {
        console.log('⚠️ Ya completaste toda la secuencia');
        updateStatus('Ya has completado toda la secuencia', 'info');
        return;
    }

    console.log('💡 Mostrando hint...');

    // Grabar uso de hint
    recordHintUsed();

    // Aplicar penalización: -100 puntos
    const penalty = 100;
    gameState.score = Math.max(0, gameState.score - penalty);

    // Romper racha perfecta
    const previousStreak = gameState.perfectStreak;
    gameState.perfectStreak = 0;

    console.log(`💸 Penalización: -${penalty} puntos, racha rota (era ${previousStreak})`);

    // Limpiar hints anteriores
    clearHints();

    // Activar flag de hint
    gameState.hintActive = true;

    // Dibujar líneas conectoras PRIMERO (debajo de todo)
    drawConnectingLines();

    // Marcar SOLO la secuencia RESTANTE (desde currentStep hasta el final)
    for (let index = gameState.currentStep; index < gameState.sequence.length; index++) {
        const squareId = gameState.sequence[index];
        const square = document.querySelector(`[data-square="${squareId}"]`);

        if (square) {
            const color = gameState.sequenceColors[index];

            // Aplicar fondo blanco a la casilla para destacarla
            square.style.backgroundColor = '#fff';
            square.classList.add('hint-sequence');

            // ====================================================================
            // NOTA: NO crear coordenada de texto (e.g. "E4", "D5")
            // Usuario prefiere solo las flechas de colores porque las coordenadas
            // tapan las flechas y dificultan ver la dirección del movimiento.
            // ====================================================================

            // Agregar flecha o símbolo de repetición si no es la última casilla
            if (index < gameState.sequence.length - 1) {
                const currentSquare = squareId;
                const nextSquare = gameState.sequence[index + 1];

                // Si la siguiente casilla es la misma (repetición), mostrar símbolo ⟲
                if (currentSquare === nextSquare) {
                    addRepeatSymbol(square, color.hex);
                } else {
                    // Si la siguiente casilla es diferente, mostrar flecha direccional
                    // La flecha apunta desde currentSquare hacia nextSquare
                    addDirectionalArrow(square, currentSquare, nextSquare, color.hex);
                }
            }
        }
    }

    // Resaltar la SIGUIENTE casilla con borde amarillo pulsante
    // Esta es la casilla que el jugador debe clickear ahora
    const nextSquareId = gameState.sequence[gameState.currentStep];
    const nextSquare = document.querySelector(`[data-square="${nextSquareId}"]`);
    if (nextSquare) {
        // La clase 'hint-next' aplica un borde amarillo pulsante (ver CSS)
        nextSquare.classList.add('hint-next');

        // NOTA: Ya no hay label de coordenada que ocultar (se eliminó arriba)
        // Solo dejamos el borde amarillo para indicar "esta es la siguiente"
    }

    // Actualizar UI
    updateUI();
    updateStatus(`💡 Hint activado (-${penalty} pts, racha perdida). Las flechas te guiarán...`, 'hint');

    // NOTA: Los hints ahora persisten hasta que el jugador haga click
    // Se limpiarán progresivamente en onSquareClick()
}

/**
 * Dibuja líneas conectoras negras entre las casillas de la secuencia del HINT
 *
 * EDUCACIONAL: Esta función crea un overlay SVG sobre el tablero para dibujar
 * líneas que conectan visualmente la secuencia de casillas. Esto ayuda al
 * jugador a ver el "camino" que debe seguir.
 *
 * CONCEPTOS CLAVE:
 * - SVG (Scalable Vector Graphics): Formato para gráficos vectoriales
 * - createElementNS: Crea elementos SVG (requiere namespace XML)
 * - getBoundingClientRect(): Obtiene posición/tamaño de elementos en pantalla
 * - Coordenadas relativas: Calculamos posiciones respecto al tablero, no a la ventana
 */
function drawConnectingLines() {
    // 1. Buscar contenedor SVG existente o crear uno nuevo
    // Los elementos SVG se crean con createElementNS (requiere namespace)
    let svgContainer = document.getElementById('hint-lines-container');
    if (!svgContainer) {
        // Namespace SVG requerido para crear elementos SVG correctamente
        svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgContainer.id = 'hint-lines-container';
        svgContainer.classList.add('hint-lines-svg'); // Clase CSS para estilo/posición
        document.getElementById('chessboard').appendChild(svgContainer);
    }

    // 2. Limpiar líneas anteriores (si hay)
    svgContainer.innerHTML = '';

    // 3. Obtener dimensiones y posición del tablero
    // getBoundingClientRect() retorna un objeto con propiedades:
    // - left, top: posición en pantalla
    // - width, height: dimensiones del elemento
    const board = document.getElementById('chessboard');
    const boardRect = board.getBoundingClientRect();

    // 4. Iterar sobre la secuencia RESTANTE (no toda la secuencia, solo lo que falta)
    // Desde currentStep (donde está el jugador) hasta el final
    for (let i = gameState.currentStep; i < gameState.sequence.length - 1; i++) {
        const currentSquareId = gameState.sequence[i];     // ej: "e4"
        const nextSquareId = gameState.sequence[i + 1];    // ej: "d5"

        // 5. Skip casillas repetidas (no dibujar línea si es la misma casilla)
        if (currentSquareId === nextSquareId) continue;

        // 6. Obtener elementos DOM de ambas casillas
        const currentSquare = document.querySelector(`[data-square="${currentSquareId}"]`);
        const nextSquare = document.querySelector(`[data-square="${nextSquareId}"]`);

        if (currentSquare && nextSquare) {
            // 7. Calcular centro de cada casilla (relativo al tablero, no a la ventana)
            const currentRect = currentSquare.getBoundingClientRect();
            const nextRect = nextSquare.getBoundingClientRect();

            // Coordenadas X, Y del centro de cada casilla (relativas al tablero)
            // Restamos boardRect.left/top para convertir de coordenadas de ventana
            // a coordenadas relativas al tablero
            const x1 = currentRect.left - boardRect.left + currentRect.width / 2;
            const y1 = currentRect.top - boardRect.top + currentRect.height / 2;
            const x2 = nextRect.left - boardRect.left + nextRect.width / 2;
            const y2 = nextRect.top - boardRect.top + nextRect.height / 2;

            // 8. Crear elemento <line> SVG
            // Las líneas SVG se definen con x1,y1 (punto inicial) y x2,y2 (punto final)
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);  // Inicio X
            line.setAttribute('y1', y1);  // Inicio Y
            line.setAttribute('x2', x2);  // Final X
            line.setAttribute('y2', y2);  // Final Y
            line.setAttribute('stroke', '#000');           // Color negro
            line.setAttribute('stroke-width', '4');        // Grosor 4px
            line.setAttribute('stroke-linecap', 'round');  // Puntas redondeadas
            line.classList.add('hint-connecting-line');    // Clase CSS para estilos

            // 9. Agregar línea al contenedor SVG
            svgContainer.appendChild(line);
        }
    }
}

/**
 * Agrega símbolo de repetición (⟲) cuando la secuencia repite la misma casilla
 *
 * EDUCACIONAL: Cuando la secuencia pide clickear la misma casilla dos veces
 * seguidas (ej: e4 → e4), en vez de flecha mostramos el símbolo ⟲ (reload/repeat)
 *
 * CONCEPTOS CLAVE:
 * - innerHTML: Permite insertar caracteres Unicode como ⟲
 * - style.color / style.textShadow: Aplicar estilos inline dinámicamente
 * - appendChild: Agregar el símbolo como hijo del elemento casilla
 *
 * @param {HTMLElement} square - Elemento DOM de la casilla
 * @param {string} color - Color en hexadecimal para el símbolo (ej: "#ff0080")
 */
function addRepeatSymbol(square, color) {
    // Crear contenedor div para el símbolo
    const symbol = document.createElement('div');
    symbol.className = 'hint-repeat';  // Clase CSS para posicionamiento/tamaño

    // Insertar símbolo Unicode ⟲ (significa "repetir/reload")
    symbol.innerHTML = '⟲';

    // Aplicar color dinámico (usa el color de la secuencia actual)
    symbol.style.color = color;

    // Agregar glow/resplandor con text-shadow (efecto neón)
    // Dos sombras: una a 10px y otra a 20px para mayor intensidad
    symbol.style.textShadow = `0 0 10px ${color}, 0 0 20px ${color}`;

    // Agregar el símbolo a la casilla
    square.appendChild(symbol);
}

/**
 * Agrega flecha direccional SVG indicando hacia dónde continúa la secuencia
 *
 * EDUCACIONAL: Esta función crea flechas de colores que apuntan desde una casilla
 * hacia la siguiente en la secuencia. Calcula la dirección y rota un SVG de flecha.
 *
 * CONCEPTOS CLAVE:
 * - charCodeAt(): Convierte letra a número ASCII (a=97, b=98, etc.)
 * - parseInt(): Convierte string a número entero
 * - CSS Custom Properties (--rotation): Variables CSS que podemos cambiar dinámicamente
 * - SVG Filters: Efectos visuales como blur (desenfoque) para crear glow (resplandor)
 * - Template literals (`): Permiten crear strings multilínea e interpolar variables
 *
 * @param {HTMLElement} square - Elemento DOM de la casilla actual
 * @param {string} fromSquare - Coordenada origen (ej: "e4")
 * @param {string} toSquare - Coordenada destino (ej: "d5")
 * @param {string} color - Color hexadecimal para la flecha (ej: "#00ffff")
 */
function addDirectionalArrow(square, fromSquare, toSquare, color) {
    // 1. Convertir coordenadas de ajedrez (ej: "e4") a números
    // charCodeAt(0) obtiene el código ASCII de la primera letra
    // Restamos 'a'.charCodeAt(0) para convertir: a=0, b=1, c=2, ... h=7
    const fromFile = fromSquare.charCodeAt(0) - 'a'.charCodeAt(0);  // Columna origen (0-7)
    const fromRank = parseInt(fromSquare[1]) - 1;                     // Fila origen (0-7)
    const toFile = toSquare.charCodeAt(0) - 'a'.charCodeAt(0);      // Columna destino (0-7)
    const toRank = parseInt(toSquare[1]) - 1;                         // Fila destino (0-7)

    // 2. Calcular diferencia (delta) entre origen y destino
    // Ejemplo: si fromFile=4 (e) y toFile=3 (d), deltaFile=-1 (movimiento hacia izquierda)
    const deltaFile = toFile - fromFile;  // Diferencia horizontal (-7 a +7)
    const deltaRank = toRank - fromRank;  // Diferencia vertical (-7 a +7)

    // 3. Determinar ángulo de rotación basado en la dirección del movimiento
    // IMPORTANTE: El SVG base (definido abajo) apunta hacia ABAJO (Sur = 180° en brújula)
    // Por eso sumamos 180° a las rotaciones para que apunten correctamente
    let rotation = 0;
    if (deltaFile === 0 && deltaRank > 0) rotation = 180;    // ↑ Norte (vertical arriba)
    else if (deltaFile > 0 && deltaRank > 0) rotation = 225;  // ↗ Noreste (diagonal arriba-derecha)
    else if (deltaFile > 0 && deltaRank === 0) rotation = 270; // → Este (horizontal derecha)
    else if (deltaFile > 0 && deltaRank < 0) rotation = 315; // ↘ Sureste (diagonal abajo-derecha)
    else if (deltaFile === 0 && deltaRank < 0) rotation = 0; // ↓ Sur (vertical abajo)
    else if (deltaFile < 0 && deltaRank < 0) rotation = 45; // ↙ Suroeste (diagonal abajo-izquierda)
    else if (deltaFile < 0 && deltaRank === 0) rotation = 90; // ← Oeste (horizontal izquierda)
    else if (deltaFile < 0 && deltaRank > 0) rotation = 135; // ↖ Noroeste (diagonal arriba-izquierda)

    // 4. Crear contenedor div para la flecha
    const arrow = document.createElement('div');
    arrow.className = 'hint-arrow';  // Clase CSS que posiciona la flecha en el centro

    // 5. Aplicar rotación usando CSS Custom Property (variable CSS)
    // setProperty() permite cambiar variables CSS dinámicamente
    // La clase .hint-arrow en CSS usa: transform: rotate(var(--rotation))
    arrow.style.setProperty('--rotation', `${rotation}deg`);

    // 6. Crear SVG inline usando template literal
    // Template literal (`) permite strings multilínea e interpolación ${variable}
    arrow.innerHTML = `
        <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <!-- Definir filtro de glow/resplandor para efecto neón -->
                <filter id="glow-${color.replace('#', '')}">
                    <!-- feGaussianBlur: Desenfoque gaussiano con radio 3px -->
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <!-- feMerge: Combinar el blur con el gráfico original -->
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>      <!-- Blur atrás (glow) -->
                        <feMergeNode in="SourceGraphic"/>    <!-- Gráfico adelante -->
                    </feMerge>
                </filter>
            </defs>
            <!-- path: Define la forma de la flecha usando comandos SVG
                 M = Move to (mover a punto)
                 L = Line to (línea hasta punto)
                 Coordenadas: (x, y) en el viewBox de 60x60
                 M30 10 L30 40: Línea vertical desde (30,10) hasta (30,40) - tronco de flecha
                 M30 40 L20 30: Línea desde (30,40) hasta (20,30) - punta izquierda
                 M30 40 L40 30: Línea desde (30,40) hasta (40,30) - punta derecha
                 Resultado: Flecha apuntando HACIA ABAJO ↓
            -->
            <path d="M30 10 L30 40 M30 40 L20 30 M30 40 L40 30"
                  stroke="${color}"
                  stroke-width="6"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  filter="url(#glow-${color.replace('#', '')})"/>
                  <!-- stroke="${color}": Color interpolado desde parámetro (ej: #FF00FF)
                       stroke-width="6": Grosor de línea en píxeles
                       fill="none": Sin relleno, solo el contorno (línea)
                       stroke-linecap="round": Extremos de línea redondeados
                       stroke-linejoin="round": Uniones de línea redondeadas
                       filter="url(#glow-...)": Aplica el filtro definido en <defs> -->
        </svg>
    `;

    // 7. Agregar el elemento arrow (con SVG dentro) como hijo de la casilla
    // La flecha ahora es visible y rotada según la dirección del movimiento
    square.appendChild(arrow);
}

/**
 * Limpia el hint de UNA casilla específica (llamado al hacer click correcto)
 * @param {HTMLElement} square - Elemento de la casilla a limpiar
 */
function clearHintFromSquare(square) {
    // Remover clase hint-sequence
    square.classList.remove('hint-sequence');
    square.classList.remove('hint-next');
    square.style.removeProperty('background-color');

    // Remover label de hint
    const label = square.querySelector('.hint-label');
    if (label) {
        label.remove();
    }

    // Remover flecha
    const arrow = square.querySelector('.hint-arrow');
    if (arrow) {
        arrow.remove();
    }

    // Remover símbolo de repetición
    const repeat = square.querySelector('.hint-repeat');
    if (repeat) {
        repeat.remove();
    }
}

/**
 * Actualiza el hint de la siguiente casilla (mueve el borde pulsante)
 * SOLO si el hint está activo
 */
function updateNextHint() {
    // Solo ejecutar si el hint está activo
    if (!gameState.hintActive) {
        return;
    }

    // Remover hint-next de todas las casillas
    document.querySelectorAll('.hint-next').forEach(sq => {
        sq.classList.remove('hint-next');
        // Restaurar display de label si estaba oculta
        const label = sq.querySelector('.hint-label');
        if (label) {
            label.style.removeProperty('display');
        }
    });

    // Si aún hay casillas por completar, marcar la siguiente
    if (gameState.currentStep < gameState.sequence.length) {
        const nextSquareId = gameState.sequence[gameState.currentStep];
        const nextSquare = document.querySelector(`[data-square="${nextSquareId}"]`);
        if (nextSquare) {
            nextSquare.classList.add('hint-next');
            // Ocultar su coordenada (solo borde visible)
            const nextLabel = nextSquare.querySelector('.hint-label');
            if (nextLabel) {
                nextLabel.style.display = 'none';
            }
        }
    }
}

/**
 * Limpia TODOS los hints del tablero (llamado en clearHints completo)
 */
function clearHints() {
    // Desactivar flag de hint
    gameState.hintActive = false;

    // Eliminar líneas conectoras
    const svgContainer = document.getElementById('hint-lines-container');
    if (svgContainer) {
        svgContainer.remove();
    }

    // Limpiar TODAS las flechas del tablero (no solo .hint-sequence)
    document.querySelectorAll('.hint-arrow').forEach(arrow => {
        arrow.remove();
    });

    // Limpiar TODOS los símbolos de repetición
    document.querySelectorAll('.hint-repeat').forEach(repeat => {
        repeat.remove();
    });

    // Limpiar TODOS los labels de hint
    document.querySelectorAll('.hint-label').forEach(label => {
        label.remove();
    });

    // Limpiar casillas de secuencia (solo clases y backgrounds)
    document.querySelectorAll('.hint-sequence').forEach(sq => {
        sq.classList.remove('hint-sequence');
        sq.style.removeProperty('background-color');
    });

    // Limpiar siguiente casilla
    document.querySelectorAll('.hint-next').forEach(sq => {
        sq.classList.remove('hint-next');
    });
}

/**
 * Muestra overlay de estadísticas actuales (botón STATS)
 *
 * Permite consultar las stats en cualquier momento sin interrumpir el juego.
 * Usa el overlay avanzado de estadísticas con los datos actuales de la sesión.
 */
function showCurrentStats() {
    console.log('📊 Mostrando estadísticas actuales...');

    const overlay = document.getElementById('advancedStatsOverlay');

    // Usar lastSessionStats si existe (después de Game Over), sino usar gameState actual
    const stats = lastSessionStats.level > 1 ? lastSessionStats : {
        level: gameState.currentLevel,
        score: gameState.score,
        lives: gameState.lives,
        streak: gameState.perfectStreak,
        sequenceLength: gameState.sequence.length
    };

    const streakMultiplier = stats.streak >= 3 ? calculateStreakMultiplier(stats.streak) : 1.0;

    // Título y mensaje del overlay
    document.getElementById('successMessage').textContent = '📊 Estadísticas de Última Sesión';

    // Grid de estadísticas - DATOS REALES DE LA SESIÓN
    document.getElementById('successLevel').textContent = stats.level;
    document.getElementById('successTime').textContent = `Long: ${stats.sequenceLength}`;
    document.getElementById('successBasePoints').textContent = `Vidas: ${stats.lives}/${gameState.maxLives}`;
    document.getElementById('successSpeedBonus').textContent = `Racha: ${stats.streak}`;

    // Ocultar speed badge
    document.getElementById('speedBadge').style.display = 'none';
    document.getElementById('speedBonusCard').style.opacity = '0.5';

    // Sección de racha perfecta
    const streakSection = document.getElementById('streakSection');
    if (stats.streak >= 3) {
        streakSection.style.display = 'block';
        document.getElementById('successStreak').textContent = stats.streak;
        document.getElementById('successMultiplier').textContent = `x${streakMultiplier.toFixed(1)}`;
    } else {
        streakSection.style.display = 'none';
    }

    // Puntos finales (score total de la sesión)
    document.getElementById('successFinalPoints').textContent = stats.score;

    // Mostrar high scores guardados en la sección de records
    const recordsList = document.getElementById('recordsList');
    const recordsSection = document.getElementById('recordsSection');
    recordsSection.style.display = 'block';
    document.querySelector('#recordsSection .records-title').textContent = '🏆 RECORDS PERSONALES';

    recordsList.innerHTML = '';
    const records = [
        `🏆 Mejor Puntuación: ${gameState.highScores.topScore}`,
        `📊 Mejor Nivel: ${gameState.highScores.bestLevel}`,
        `🔥 Racha Más Larga: ${gameState.highScores.longestStreak}`,
        `⚡ Nivel Más Rápido: ${gameState.highScores.fastestLevel.level} en ${(gameState.highScores.fastestLevel.time / 1000).toFixed(2)}s`
    ];

    records.forEach(record => {
        const item = document.createElement('div');
        item.className = 'record-item';
        item.textContent = record;
        recordsList.appendChild(item);
    });

    // Mostrar el overlay directamente (NO llamar showAdvancedStatsOverlay para evitar sobrescritura)
    overlay.classList.remove('hidden');
}

/**
 * Volver a pantalla principal de Master Sequence (SIN empezar juego)
 * Cierra overlay y muestra botón PLAY para que usuario decida qué hacer
 */
/**
 * Vuelve a la pantalla principal de Master Sequence SIN empezar juego automáticamente
 *
 * 🔮 FUTURO (cuando tengamos BD):
 * - Guardar estadísticas de la sesión en DB
 * - Enviar score final al backend
 * - Actualizar leaderboard global
 * - Guardar progreso del usuario
 * - Registrar analytics de la partida
 */
function backToMainScreen() {
    // Cerrar overlay de Game Over
    hideAllOverlays();

    // TODO: Cuando tengamos BD, guardar sesión aquí
    // await saveGameSession({
    //     score: gameState.score,
    //     level: gameState.currentLevel,
    //     perfectLevels: gameState.perfectLevels,
    //     highScores: gameState.highScores,
    //     timestamp: Date.now()
    // });

    // Resetear estado del juego
    gameState.currentLevel = 1;
    gameState.score = 0;
    gameState.lives = 5;
    gameState.masterSequence = [];
    gameState.sequenceColors = [];
    gameState.squareUsageCount = {};
    gameState.sequence = [];
    gameState.playerSequence = [];
    gameState.currentStep = 0;
    gameState.phase = 'idle';
    gameState.currentLevelAttempts = 0;
    gameState.perfectStreak = 0;
    gameState.totalHintsUsed = 0;

    // Actualizar UI con valores reseteados
    updateUI();

    // Mostrar botón PLAY central para que usuario decida cuándo empezar
    showPlayButton();

    // Mensaje de bienvenida
    updateStatus('Presiona COMENZAR para iniciar');

    console.log('🏠 Vuelto a pantalla principal de Master Sequence');
}

/**
 * Volver al inicio
 */
function goHome() {
    window.location.href = '../../index.html';
}

// ============================================
// UI Y VISUALES
// ============================================

/**
 * Actualiza todos los elementos de la UI
 */
function updateUI() {
    // Stats
    document.getElementById('scoreDisplay').textContent = gameState.score;

    // Mostrar longitud REAL de la secuencia acumulativa (no el config)
    // Esto refleja cuántas casillas realmente tiene que recordar el jugador
    const actualLength = gameState.sequence.length || 0;
    document.getElementById('sequenceDisplay').textContent = actualLength;

    // Vidas (corazones)
    const hearts = '❤️'.repeat(gameState.lives) + '🖤'.repeat(gameState.maxLives - gameState.lives);
    document.getElementById('livesDisplay').textContent = hearts;

    // Perfect Streak - siempre visible en desktop (CSS oculta en mobile)
    const streakStat = document.getElementById('streakStat');
    const streakDisplay = document.getElementById('streakDisplay');
    streakStat.style.display = 'flex';
    streakDisplay.textContent = gameState.perfectStreak > 0 ? `${gameState.perfectStreak}🔥` : '0';

    // Best Score
    document.getElementById('bestDisplay').textContent = gameState.highScores.topScore;

    // Actualizar visibilidad del botón REPLAY
    updateReplayButtonVisibility();
}

/**
 * Actualiza el mensaje de estado
 */
function updateStatus(message, type = 'info') {
    const statusElement = document.getElementById('statusMessage');
    statusElement.textContent = message;

    // Opcional: cambiar color según tipo
    statusElement.className = 'status-message';
    if (type === 'playing') {
        statusElement.style.borderColor = 'var(--neon-green)';
        statusElement.style.color = 'var(--neon-green)';
    } else if (type === 'error') {
        statusElement.style.borderColor = 'var(--neon-red)';
        statusElement.style.color = 'var(--neon-red)';
    } else {
        statusElement.style.borderColor = 'var(--neon-cyan)';
        statusElement.style.color = 'var(--neon-cyan)';
    }
}

/**
 * Deshabilita interacción con el tablero
 */
function disableBoard() {
    const squares = document.querySelectorAll('.square');
    squares.forEach(sq => {
        sq.classList.remove('clickable');
        sq.style.cursor = 'default';
    });
}

/**
 * Habilita interacción con el tablero
 */
function enableBoard() {
    const squares = document.querySelectorAll('.square');
    squares.forEach(sq => {
        sq.classList.add('clickable');
        sq.style.cursor = 'pointer';
    });
}

// ============================================
// OVERLAYS
// ============================================

/**
 * Muestra overlay AVANZADO de estadísticas (SOLO para Game Over o fin de sesión)
 *
 * ⚠️ NO usar entre niveles - es muy disruptivo y rompe concentración
 * Para niveles: usar confeti + auto-avance (no-bloqueante)
 *
 * @param {Object} stats - Objeto con todas las estadísticas del nivel
 */
function showAdvancedStatsOverlay(stats) {
    const overlay = document.getElementById('advancedStatsOverlay');
    const config = window.CoordinateSequence.Levels.getLevelConfig(gameState.currentLevel);

    // Título y mensaje
    document.getElementById('successMessage').textContent = `${config.name} completado`;

    // Grid de estadísticas
    document.getElementById('successLevel').textContent = gameState.currentLevel;
    document.getElementById('successTime').textContent = `${stats.timeElapsed}s`;
    document.getElementById('successBasePoints').textContent = stats.basePoints;
    document.getElementById('successSpeedBonus').textContent = stats.speedBonus > 0 ? `+${stats.speedBonus}` : '0';

    // Badge de velocidad (solo si ganó bonus)
    const speedBadge = document.getElementById('speedBadge');
    const speedBonusCard = document.getElementById('speedBonusCard');
    if (stats.speedBonus >= 100) {
        speedBadge.style.display = 'flex';
        speedBadge.querySelector('.badge-text').textContent = 'SÚPER RÁPIDO';
    } else if (stats.speedBonus >= 50) {
        speedBadge.style.display = 'flex';
        speedBadge.querySelector('.badge-text').textContent = 'RÁPIDO';
    } else if (stats.speedBonus >= 25) {
        speedBadge.style.display = 'flex';
        speedBadge.querySelector('.badge-text').textContent = 'A TIEMPO';
    } else {
        speedBadge.style.display = 'none';
    }

    // Ocultar card de speed bonus si es 0
    if (stats.speedBonus === 0) {
        speedBonusCard.style.opacity = '0.5';
    } else {
        speedBonusCard.style.opacity = '1';
    }

    // Sección de racha perfecta (solo si hay multiplicador > 1)
    const streakSection = document.getElementById('streakSection');
    if (stats.streakMultiplier > 1.0) {
        streakSection.style.display = 'block';
        document.getElementById('successStreak').textContent = gameState.perfectStreak;
        document.getElementById('successMultiplier').textContent = `x${stats.streakMultiplier.toFixed(1)}`;
    } else {
        streakSection.style.display = 'none';
    }

    // Puntos finales
    document.getElementById('successFinalPoints').textContent = `+${stats.finalPoints}`;

    // Records batidos
    const recordsSection = document.getElementById('recordsSection');
    const recordsList = document.getElementById('recordsList');
    if (stats.newRecords && stats.newRecords.length > 0) {
        recordsSection.style.display = 'block';
        recordsList.innerHTML = '';
        stats.newRecords.forEach(record => {
            const item = document.createElement('div');
            item.className = 'record-item';
            item.textContent = record;
            recordsList.appendChild(item);
        });
    } else {
        recordsSection.style.display = 'none';
    }

    overlay.classList.remove('hidden');
}

/**
 * Muestra overlay de fallo
 */
function showFailOverlay() {
    const overlay = document.getElementById('failOverlay');

    const livesText = gameState.lives === 1 ? '1 intento' : `${gameState.lives} intentos`;
    document.getElementById('failMessage').textContent = `Te quedan ${livesText}`;

    // Mostrar secuencia correcta
    const sequenceText = gameState.sequence.join(' → ');
    document.getElementById('correctSequence').textContent = sequenceText;

    overlay.classList.remove('hidden');
}

/**
 * Muestra overlay de game over
 */
function showGameOverOverlay() {
    const overlay = document.getElementById('gameOverOverlay');
    document.getElementById('finalLevel').textContent = gameState.currentLevel;
    document.getElementById('finalScore').textContent = gameState.score;
    overlay.classList.remove('hidden');
}

/**
 * Oculta todos los overlays
 */
function hideAllOverlays() {
    document.querySelectorAll('.overlay').forEach(overlay => {
        overlay.classList.add('hidden');
    });
}

// ============================================
// AUDIO
// ============================================

/**
 * Toggle sonido on/off
 */
function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;

    const iconOn = document.querySelector('.icon-sound-on');
    const iconOff = document.querySelector('.icon-sound-off');

    if (gameState.soundEnabled) {
        iconOn.style.display = 'block';
        iconOff.style.display = 'none';
        console.log('🔊 Sound enabled');
        // Reproducir sonido de confirmación al activar
        if (typeof playBeep === 'function') {
            playBeep(660); // Tono agradable
        }
    } else {
        iconOn.style.display = 'none';
        iconOff.style.display = 'block';
        console.log('🔇 Sound disabled');
    }

    saveSoundPreference();
}

/**
 * Guarda preferencia de sonido
 */
function saveSoundPreference() {
    localStorage.setItem('coordinate_sequence_sound', gameState.soundEnabled ? 'enabled' : 'disabled');
}

/**
 * Carga preferencia de sonido
 */
function loadSoundPreference() {
    const saved = localStorage.getItem('coordinate_sequence_sound');
    if (saved === 'disabled') {
        gameState.soundEnabled = false;
        document.querySelector('.icon-sound-on').style.display = 'none';
        document.querySelector('.icon-sound-off').style.display = 'block';
    }
}

/**
 * Toggle de coordenadas (modo ayuda)
 */
function toggleCoordinates() {
    gameState.coordinatesEnabled = !gameState.coordinatesEnabled;

    const btnCoordinates = document.getElementById('btnCoordinates');
    const btnText = btnCoordinates.querySelector('.btn-text');

    if (gameState.coordinatesEnabled) {
        btnCoordinates.classList.add('active');
        btnText.textContent = 'HIDE COORDINATES';
        showAllCoordinates();
        console.log('📍 Coordinates enabled');
    } else {
        btnCoordinates.classList.remove('active');
        btnText.textContent = 'SHOW COORDINATES';
        hideAllCoordinates();
        console.log('📍 Coordinates disabled');
    }

    saveCoordinatesPreference();
}

/**
 * Muestra coordenadas en todas las casillas
 */
function showAllCoordinates() {
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
        const squareId = square.dataset.square;
        if (!square.querySelector('.coordinate-label')) {
            const label = document.createElement('span');
            label.className = 'coordinate-label';
            label.textContent = squareId.toUpperCase();
            square.appendChild(label);
        }
    });
}

/**
 * Oculta todas las coordenadas
 */
function hideAllCoordinates() {
    const labels = document.querySelectorAll('.coordinate-label');
    labels.forEach(label => label.remove());
}

/**
 * Guarda preferencia de coordenadas
 */
function saveCoordinatesPreference() {
    localStorage.setItem('coordinate_sequence_coordinates', gameState.coordinatesEnabled ? 'enabled' : 'disabled');
}

/**
 * Carga preferencia de coordenadas
 * Por defecto las coordenadas están ACTIVADAS (visible)
 * Solo se desactivan si el usuario las desactivó explícitamente
 */
function loadCoordinatesPreference() {
    const saved = localStorage.getItem('coordinate_sequence_coordinates');
    const btnCoordinates = document.getElementById('btnCoordinates');
    const btnText = btnCoordinates?.querySelector('.btn-text');

    // Si el usuario DESACTIVÓ las coordenadas explícitamente, respetar esa preferencia
    if (saved === 'disabled') {
        gameState.coordinatesEnabled = false;
        if (btnCoordinates) btnCoordinates.classList.remove('active');
        if (btnText) btnText.textContent = 'SHOW COORDINATES';
        hideAllCoordinates();
    } else {
        // Por defecto (o si guardó 'enabled'), mostrar coordenadas
        gameState.coordinatesEnabled = true;
        if (btnCoordinates) btnCoordinates.classList.add('active');
        if (btnText) btnText.textContent = 'HIDE COORDINATES';
        showAllCoordinates();
    }
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Promesa de sleep
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/* ============================================
   PASO 6: ANIMACIONES Y EFECTOS VISUALES
   ============================================ */

/**
 * Crea partículas que explotan desde una casilla
 * @param {HTMLElement} squareElement - Elemento de la casilla
 * @param {Object} color - Objeto con hex color
 * @param {number} count - Número de partículas (default: 5)
 */
function spawnParticles(squareElement, color, count = 5) {
    const rect = squareElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.backgroundColor = color.hex;
        particle.style.boxShadow = `0 0 10px ${color.hex}`;
        particle.style.left = centerX + 'px';
        particle.style.top = centerY + 'px';

        // Dirección aleatoria
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const distance = 30 + Math.random() * 20;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;

        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);

        document.body.appendChild(particle);

        // Remover después de animación
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 800);
    }
}

/**
 * Lanza confeti dorado especial para records batidos
 * @param {number} count - Número de piezas de confeti (default: 100)
 */
function launchGoldenConfetti(count = 100) {
    const container = document.getElementById('confettiContainer');
    if (!container) return;

    const colors = ['#FFD700', '#FFA500', '#FFFF00', '#FF8C00']; // Dorados y amarillos

    for (let i = 0; i < count; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti golden';
        confetti.style.cssText = `
            position: fixed;
            width: ${8 + Math.random() * 8}px;
            height: ${8 + Math.random() * 8}px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            left: ${Math.random() * 100}vw;
            top: -20px;
            opacity: 1;
            animation: confettiFall ${2 + Math.random() * 2}s linear forwards;
            animation-delay: ${Math.random() * 0.3}s;
            transform: rotate(${Math.random() * 360}deg);
            border-radius: 50%;
            box-shadow: 0 0 10px currentColor;
            pointer-events: none;
            z-index: 9999;
        `;

        container.appendChild(confetti);

        // Remover después de animación
        setTimeout(() => {
            if (confetti.parentNode) {
                confetti.parentNode.removeChild(confetti);
            }
        }, 5000);
    }
}

/**
 * Obtiene coordenada de índice
 */
function getSquareFromIndex(index) {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    const file = files[index % 8];
    const rank = ranks[Math.floor(index / 8)];

    return `${file}${rank}`;
}

/**
 * Lanza confeti para celebración sutil (no disruptiva)
 * @param {number} count - Cantidad de confetis a lanzar
 */
function launchConfetti(count = 30) {
    const container = document.getElementById('confettiContainer');
    if (!container) return;

    const colors = ['cyan', 'pink', 'orange', 'gold', ''];
    const windowWidth = window.innerWidth;

    for (let i = 0; i < count; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';

        // Color aleatorio
        const colorClass = colors[Math.floor(Math.random() * colors.length)];
        if (colorClass) {
            confetti.classList.add(colorClass);
        }

        // Posición y timing aleatorio
        confetti.style.left = `${Math.random() * windowWidth}px`;
        confetti.style.animationDelay = `${Math.random() * 0.5}s`;
        confetti.style.animationDuration = `${1.5 + Math.random()}s`;

        container.appendChild(confetti);

        // Auto-limpieza después de 3 segundos
        setTimeout(() => {
            confetti.remove();
        }, 3000);
    }
}

/**
 * Muestra el botón play central
 */
function showPlayButton() {
    const btnPlayOverlay = document.getElementById('btnPlayOverlay');
    if (btnPlayOverlay) {
        btnPlayOverlay.classList.remove('hidden');
    }
}

/**
 * Oculta el botón play central
 */
function hidePlayButton() {
    const btnPlayOverlay = document.getElementById('btnPlayOverlay');
    if (btnPlayOverlay) {
        btnPlayOverlay.classList.add('hidden');
    }
}

// ============================================
// SISTEMA DE PUNTUACIÓN MEJORADO
// ============================================

/**
 * Calcula el speed bonus basado en el tiempo transcurrido
 * @param {number} timeElapsed - Tiempo en milisegundos
 * @param {number} level - Número de nivel
 * @returns {number} Puntos de bonus
 */
function calculateSpeedBonus(timeElapsed, level) {
    const targetTime = window.CoordinateSequence.Levels.getRecommendedTime(level);

    if (timeElapsed < targetTime * 0.5) {
        return 100; // ⚡ Super rápido!
    } else if (timeElapsed < targetTime * 0.75) {
        return 50;  // 🏃 Rápido
    } else if (timeElapsed < targetTime) {
        return 25;  // ✅ Dentro del tiempo
    }

    return 0; // Sin bonus
}

/**
 * Calcula el multiplicador de racha perfecta
 * @param {number} streak - Cantidad de niveles perfectos consecutivos
 * @returns {number} Multiplicador (1.0, 1.5, 2.0, etc.)
 */
function calculateStreakMultiplier(streak) {
    if (streak >= 10) {
        return 3.0; // 🔥🔥🔥 ¡ÉPICO!
    } else if (streak >= 5) {
        return 2.0; // 🔥🔥 ¡Increíble!
    } else if (streak >= 3) {
        return 1.5; // 🔥 ¡Genial!
    }

    return 1.0; // Sin multiplicador
}

/**
 * Carga high scores desde localStorage
 * @returns {Object} High scores o valores por defecto
 */
function loadHighScores() {
    const saved = localStorage.getItem('masterSequence_highScores');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.warn('❌ Error loading high scores:', e);
            return getDefaultHighScores();
        }
    }
    return getDefaultHighScores();
}

/**
 * Retorna high scores por defecto
 * @returns {Object} Estructura de high scores
 */
function getDefaultHighScores() {
    return {
        topScore: 0,
        bestLevel: 1,
        longestStreak: 0,
        fastestLevel: { level: 1, time: 999999 },
        lastUpdated: null
    };
}

/**
 * Guarda high scores en localStorage
 *
 * 🔮 FUTURO (cuando tengamos BD):
 * - También guardar en backend
 * - Sincronizar con servidor
 * - Comparar con leaderboard global
 * - Validar records en servidor
 */
function saveHighScores() {
    gameState.highScores.lastUpdated = Date.now();
    localStorage.setItem('masterSequence_highScores', JSON.stringify(gameState.highScores));
    console.log('💾 High scores saved');

    // TODO: Cuando tengamos BD
    // await syncHighScoresToBackend(gameState.highScores);
}

/**
 * Actualiza high scores si se rompió algún record
 * @param {number} timeElapsed - Tiempo en ms del nivel actual
 * @returns {boolean} True si se rompió algún record
 */
/**
 * Actualiza high scores y retorna array de records batidos
 * @param {number} timeElapsed - Tiempo del nivel en milisegundos
 * @returns {Array<string>} Array de descripciones de records batidos
 */
function updateHighScores(timeElapsed) {
    const newRecords = [];

    // Top Score
    if (gameState.score > gameState.highScores.topScore) {
        gameState.highScores.topScore = gameState.score;
        console.log(`🏆 NEW TOP SCORE: ${gameState.score}!`);
        newRecords.push(`🏆 Mejor Puntuación: ${gameState.score}`);
    }

    // Best Level
    if (gameState.currentLevel > gameState.highScores.bestLevel) {
        gameState.highScores.bestLevel = gameState.currentLevel;
        console.log(`🏆 NEW BEST LEVEL: ${gameState.currentLevel}!`);
        newRecords.push(`📊 Mejor Nivel Alcanzado: ${gameState.currentLevel}`);
    }

    // Longest Streak
    if (gameState.perfectStreak > gameState.highScores.longestStreak) {
        gameState.highScores.longestStreak = gameState.perfectStreak;
        console.log(`🏆 NEW LONGEST STREAK: ${gameState.perfectStreak}!`);
        newRecords.push(`🔥 Racha Perfecta Más Larga: ${gameState.perfectStreak}`);
    }

    // Fastest Level
    if (timeElapsed < gameState.highScores.fastestLevel.time) {
        gameState.highScores.fastestLevel = {
            level: gameState.currentLevel,
            time: timeElapsed
        };
        console.log(`🏆 NEW FASTEST LEVEL: ${gameState.currentLevel} in ${(timeElapsed / 1000).toFixed(2)}s!`);
        newRecords.push(`⚡ Nivel Más Rápido: ${gameState.currentLevel} en ${(timeElapsed / 1000).toFixed(2)}s`);
    }

    if (newRecords.length > 0) {
        saveHighScores();
    }

    return newRecords;
}

/**
 * Resetea high scores (para botón de reset en stats)
 */
function resetHighScores() {
    gameState.highScores = getDefaultHighScores();
    saveHighScores();
    console.log('🗑️ High scores reset');
}

// ============================================
// SISTEMA DE REPLAY - GRABACIÓN
// ============================================

/**
 * Inicia una nueva grabación al comenzar partida
 */
function startRecording() {
    currentRecording = {
        timestamp: new Date().toISOString(),
        finalLevel: 0,
        finalScore: 0,
        finalStreak: 0,
        levels: []
    };
    console.log('📹 Recording started');
}

/**
 * Graba el inicio de un nivel
 */
function recordLevelStart(levelNumber, sequence, colors) {
    const levelData = {
        level: levelNumber,
        sequence: [...sequence],  // Copia de la secuencia
        colors: colors.map(c => ({name: c.name, hex: c.hex})),  // Copia de colores
        playerMoves: [],
        timeElapsed: 0,
        success: false,
        hintsUsed: 0,
        attempts: 0
    };

    currentRecording.levels.push(levelData);
    console.log(`📹 Recording level ${levelNumber}`);
}

/**
 * Graba un movimiento del jugador
 */
function recordPlayerMove(squareId) {
    if (currentRecording.levels.length === 0) return;

    const currentLevel = currentRecording.levels[currentRecording.levels.length - 1];
    currentLevel.playerMoves.push(squareId);
}

/**
 * Graba el uso de un hint
 */
function recordHintUsed() {
    // Incrementar contador global
    gameState.totalHintsUsed++;

    if (currentRecording.levels.length === 0) return;

    const currentLevel = currentRecording.levels[currentRecording.levels.length - 1];
    currentLevel.hintsUsed++;
}

/**
 * Marca el nivel como completado (éxito o fallo)
 */
function recordLevelEnd(success, timeElapsed, attempts) {
    if (currentRecording.levels.length === 0) return;

    const currentLevel = currentRecording.levels[currentRecording.levels.length - 1];
    currentLevel.success = success;
    currentLevel.timeElapsed = timeElapsed;
    currentLevel.attempts = attempts;

    console.log(`📹 Level ${currentLevel.level} recorded: ${success ? 'SUCCESS' : 'FAIL'} in ${timeElapsed}s`);
}

/**
 * Finaliza la grabación y decide si guardar como mejor replay
 */
function finishRecording() {
    currentRecording.finalLevel = gameState.currentLevel;
    currentRecording.finalScore = gameState.score;
    currentRecording.finalStreak = gameState.perfectStreak;

    console.log(`📹 Recording finished: Level ${currentRecording.finalLevel}, Score ${currentRecording.finalScore}`);

    // Guardar si es mejor que el replay actual
    if (shouldSaveReplay()) {
        bestReplay = JSON.parse(JSON.stringify(currentRecording));  // Deep copy
        saveBestReplay();
        console.log('💾 New best replay saved!');
        return true;  // Indica que se guardó un nuevo record
    }

    return false;
}

/**
 * Determina si el replay actual debe guardarse
 * Criterio: Mayor nivel alcanzado, o mismo nivel pero mayor score
 */
function shouldSaveReplay() {
    if (!bestReplay) return true;  // No hay replay guardado

    if (currentRecording.finalLevel > bestReplay.finalLevel) {
        return true;  // Alcanzó nivel más alto
    }

    if (currentRecording.finalLevel === bestReplay.finalLevel &&
        currentRecording.finalScore > bestReplay.finalScore) {
        return true;  // Mismo nivel pero mejor score
    }

    return false;
}

/**
 * Guarda el mejor replay en localStorage
 */
function saveBestReplay() {
    try {
        localStorage.setItem('master_sequence_best_replay', JSON.stringify(bestReplay));
        console.log('💾 Best replay saved to localStorage');
    } catch (e) {
        console.error('❌ Error saving replay:', e);
    }
}

/**
 * Carga el mejor replay desde localStorage
 */
function loadBestReplay() {
    try {
        const saved = localStorage.getItem('master_sequence_best_replay');
        if (saved) {
            bestReplay = JSON.parse(saved);
            console.log('💾 Best replay loaded from localStorage');
            return true;
        }
    } catch (e) {
        console.error('❌ Error loading replay:', e);
    }
    return false;
}

// ============================================
// SISTEMA DE REPLAY - REPRODUCTOR
// ============================================

/**
 * Controla la habilitación del botón VER REPLAY
 * El botón siempre es visible, pero solo se habilita cuando:
 * 1. Hay replay guardado
 * 2. La partida terminó COMPLETAMENTE (gameover o volvió a pantalla principal)
 */
function updateReplayButtonVisibility() {
    const btnReplay = document.getElementById('btnReplay');

    // Si no hay replay guardado, ocultar botón
    const hasReplay = bestReplay && bestReplay.levels.length > 0;
    if (!hasReplay) {
        btnReplay.style.display = 'none';
        return;
    }

    // Si hay replay, botón SIEMPRE visible
    btnReplay.style.display = 'flex';

    // Habilitar SOLO si:
    // 1. phase === 'gameover' (perdió todas las vidas)
    // 2. currentLevel === 1 Y phase === 'idle' (volvió a pantalla principal)
    // NUNCA habilitar durante retry (phase puede ser idle pero currentLevel > 1)
    const isGameOver = gameState.phase === 'gameover';
    const isAtMainScreen = gameState.phase === 'idle' && gameState.currentLevel === 1;

    if (isGameOver || isAtMainScreen) {
        btnReplay.disabled = false;
        btnReplay.style.opacity = '1';
        btnReplay.style.cursor = 'pointer';
    } else {
        btnReplay.disabled = true;
        btnReplay.style.opacity = '0.4';
        btnReplay.style.cursor = 'not-allowed';
    }
}

/**
 * Inicia la reproducción del replay
 */
async function startReplayPlayback() {
    if (!bestReplay || bestReplay.levels.length === 0) {
        console.log('⚠️ No hay replay guardado');
        return;
    }

    console.log('🎬 Starting replay playback...');

    // Ocultar botón PLAY central si está visible
    hidePlayButton();

    // Aplicar efecto vintage al tablero (filtro sepia + grain)
    const chessboard = document.getElementById('chessboard');
    chessboard.classList.add('replay-mode');

    // Cambiar botón COMENZAR a rojo (modo pausar)
    const btnStart = document.getElementById('btnStart');
    btnStart.textContent = '⏸ Pausar';
    btnStart.style.background = 'linear-gradient(135deg, #ff0000, #8B0000)';
    btnStart.style.borderColor = '#ff0000';

    // Resetear estado del reproductor
    replayState.isPlaying = true;
    replayState.isPaused = false;
    // Comenzar desde el ÚLTIMO nivel (el más largo), no desde el nivel 1
    replayState.currentLevelIndex = bestReplay.levels.length - 1;
    replayState.currentStepIndex = 0;
    replayState.playbackSpeed = 1.0;

    // Limpiar tablero
    clearBoardForReplay();

    // Actualizar visibilidad de botones
    updateReplayButtonVisibility();

    // Iniciar reproducción (sin await para no bloquear UI)
    playReplay().catch(err => {
        console.error('❌ Error during replay:', err);
        stopReplay();
    });
}

/**
 * Reproduce SOLO el último nivel completo (el más difícil alcanzado)
 */
async function playReplay() {
    // Solo reproducir el último nivel, UNA SOLA VEZ (no loop infinito)
    const lastLevelIndex = bestReplay.levels.length - 1;
    const levelData = bestReplay.levels[lastLevelIndex];

    console.log(`🎬 Playing ONLY last level: ${levelData.level} (${levelData.sequence.length} moves)`);

    // Reproducir el nivel UNA VEZ
    await playReplayLevel(levelData);

    // Pausa final antes de detener
    await sleep(2000 / replayState.playbackSpeed);

    console.log('🎬 Replay finished - stopping automatically');

    // Detener automáticamente después de una reproducción
    stopReplay();
}

/**
 * Reproduce un nivel específico del replay
 * SOLO muestra la secuencia de la máquina (NO los movimientos del jugador)
 * Funciona como un "HINT animado" mostrando qué casillas iluminar
 */
async function playReplayLevel(levelData) {
    console.log(`🎬 Playing level ${levelData.level}`);

    // Actualizar mensaje de estado
    updateStatus(`🎬 REPLAY - Nivel ${levelData.level}`, 'playing');

    // SOLO Fase 1: Mostrar secuencia de la máquina
    // (NO mostrar movimientos del jugador - esto es un HINT animado)
    await showReplaySequence(levelData);
}

/**
 * Muestra la secuencia del nivel en el replay
 */
async function showReplaySequence(levelData) {
    const baseDuration = 800;  // Duración base por casilla (aumentado)
    const pauseDuration = 400;  // Pausa entre casillas (aumentado)

    // Dibujar líneas conectoras negras al inicio (como en HINT)
    drawReplayConnectingLines(levelData.sequence);

    for (let i = 0; i < levelData.sequence.length; i++) {
        // Esperar si está pausado
        while (replayState.isPaused && replayState.isPlaying) {
            await sleep(100);
        }

        if (!replayState.isPlaying) return;

        const squareId = levelData.sequence[i];
        const color = levelData.colors[i];

        // Highlight casilla
        await highlightSquareReplay(squareId, baseDuration / replayState.playbackSpeed, color);

        // Pausa entre casillas
        if (i < levelData.sequence.length - 1) {
            await sleep(pauseDuration / replayState.playbackSpeed);
        }
    }

    // Pausa después de mostrar secuencia (aumentada)
    await sleep(1200 / replayState.playbackSpeed);

    // Limpiar líneas al finalizar
    clearReplayConnectingLines();
}

/**
 * Muestra los movimientos del jugador en el replay
 */
async function showReplayPlayerMoves(levelData) {
    replayState.currentStepIndex = 0;

    for (let i = 0; i < levelData.playerMoves.length; i++) {
        // Esperar si está pausado
        while (replayState.isPaused && replayState.isPlaying) {
            await sleep(100);
        }

        if (!replayState.isPlaying) return;

        const squareId = levelData.playerMoves[i];
        const expectedSquare = levelData.sequence[i];
        const isCorrect = squareId === expectedSquare;

        // Color: verde si correcto, rojo si error
        const color = isCorrect ?
            { name: 'green', hex: '#00ff00', shadowColor: 'rgba(0, 255, 0, 0.8)' } :
            { name: 'red', hex: '#ff0000', shadowColor: 'rgba(255, 0, 0, 0.8)' };

        // Mostrar movimiento
        await highlightSquareReplay(squareId, 600 / replayState.playbackSpeed, color);

        replayState.currentStepIndex++;

        await sleep(500 / replayState.playbackSpeed);
    }

    // Pausa final del nivel (aumentada)
    await sleep(1500 / replayState.playbackSpeed);
}

/**
 * Highlight de casilla para replay (sin side effects en gameState)
 */
function highlightSquareReplay(squareId, duration, color) {
    return new Promise((resolve) => {
        const squareElement = document.querySelector(`[data-square="${squareId}"]`);
        if (!squareElement) {
            resolve();
            return;
        }

        // Aplicar highlight
        squareElement.classList.add('highlighting');

        if (color) {
            squareElement.style.setProperty('--highlight-color', color.hex);
            squareElement.style.setProperty('--highlight-shadow', color.shadowColor);
        }

        // Reproducir sonido si está habilitado
        if (gameState.soundEnabled && typeof playBeep === 'function') {
            playBeep(440);
        }

        setTimeout(() => {
            squareElement.classList.remove('highlighting');
            if (color) {
                squareElement.style.removeProperty('--highlight-color');
                squareElement.style.removeProperty('--highlight-shadow');
            }
            resolve();
        }, duration);
    });
}

/**
 * Limpia el tablero para replay
 */
function clearBoardForReplay() {
    const squares = document.querySelectorAll('.square');
    squares.forEach(sq => {
        sq.classList.remove('highlighting', 'hint-sequence', 'hint-next');
        sq.style.removeProperty('--highlight-color');
        sq.style.removeProperty('--highlight-shadow');

        // Limpiar hints y labels
        const labels = sq.querySelectorAll('.hint-label, .hint-arrow, .repeat-symbol');
        labels.forEach(label => label.remove());
    });

    // Limpiar SVG de líneas conectoras de hint
    const svgContainer = document.getElementById('hintLinesSvg');
    if (svgContainer) {
        while (svgContainer.firstChild) {
            svgContainer.removeChild(svgContainer.firstChild);
        }
    }

    // Limpiar líneas de replay
    clearReplayConnectingLines();
}

/**
 * Dibuja líneas conectoras negras entre casillas para el replay
 * Similar a drawConnectingLines() pero para replay (sin HINT UI)
 */
function drawReplayConnectingLines(sequence) {
    // Buscar o crear el contenedor SVG para las líneas de replay
    let svgContainer = document.getElementById('replay-lines-container');
    if (!svgContainer) {
        svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgContainer.id = 'replay-lines-container';
        svgContainer.classList.add('hint-lines-svg'); // Usar mismos estilos que hint
        document.getElementById('chessboard').appendChild(svgContainer);
    }

    // Limpiar líneas anteriores
    svgContainer.innerHTML = '';

    // Obtener el tablero para calcular posiciones
    const board = document.getElementById('chessboard');
    const boardRect = board.getBoundingClientRect();

    // Dibujar líneas entre todas las casillas de la secuencia
    for (let i = 0; i < sequence.length - 1; i++) {
        const currentSquareId = sequence[i];
        const nextSquareId = sequence[i + 1];

        // Si repite la misma casilla, no dibujar línea
        if (currentSquareId === nextSquareId) continue;

        const currentSquare = document.querySelector(`[data-square="${currentSquareId}"]`);
        const nextSquare = document.querySelector(`[data-square="${nextSquareId}"]`);

        if (currentSquare && nextSquare) {
            // Calcular centros relativos al tablero
            const currentRect = currentSquare.getBoundingClientRect();
            const nextRect = nextSquare.getBoundingClientRect();

            const x1 = currentRect.left - boardRect.left + currentRect.width / 2;
            const y1 = currentRect.top - boardRect.top + currentRect.height / 2;
            const x2 = nextRect.left - boardRect.left + nextRect.width / 2;
            const y2 = nextRect.top - boardRect.top + nextRect.height / 2;

            // Crear línea SVG (negra, sin cabezas de flecha)
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', '#000');
            line.setAttribute('stroke-width', '4');
            line.setAttribute('stroke-linecap', 'round');
            line.classList.add('replay-connecting-line');

            svgContainer.appendChild(line);
        }
    }
}

/**
 * Limpia las líneas conectoras del replay
 */
function clearReplayConnectingLines() {
    const svgContainer = document.getElementById('replay-lines-container');
    if (svgContainer) {
        svgContainer.remove();
    }
}

/**
 * Pausa/Resume del replay usando botón COMENZAR
 */
function toggleReplayPause() {
    if (!replayState.isPlaying) return;

    replayState.isPaused = !replayState.isPaused;

    const btnStart = document.getElementById('btnStart');
    if (replayState.isPaused) {
        btnStart.textContent = '▶ Reanudar';
        btnStart.style.background = 'linear-gradient(135deg, #00ff00, #008000)';
        btnStart.style.borderColor = '#00ff00';
        console.log('🎬 Replay paused');
    } else {
        btnStart.textContent = '⏸ Pausar';
        btnStart.style.background = 'linear-gradient(135deg, #ff0000, #8B0000)';
        btnStart.style.borderColor = '#ff0000';
        console.log('🎬 Replay resumed');
    }
}

/**
 * Detiene el replay y vuelve a pantalla principal
 */
function stopReplay() {
    replayState.isPlaying = false;
    replayState.isPaused = false;

    // Quitar efecto vintage del tablero
    const chessboard = document.getElementById('chessboard');
    chessboard.classList.remove('replay-mode');

    // Restaurar botón COMENZAR
    const btnStart = document.getElementById('btnStart');
    btnStart.textContent = '▶ Comenzar';
    btnStart.style.background = '';
    btnStart.style.borderColor = '';

    clearBoardForReplay();

    // Actualizar visibilidad de botones
    updateReplayButtonVisibility();

    console.log('🎬 Replay stopped');
}

console.log('🎮 Coordinate Sequence - Game logic loaded');
