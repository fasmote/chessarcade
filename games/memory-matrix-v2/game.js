/**
 * ============================================
 * MEMORY MATRIX - GAME LOGIC
 * ============================================
 * JavaScript del juego
 */

// ============================================
// ESTADO GLOBAL
// ============================================
let soundEnabled = true;
let currentPieceStyle = 'cburnett'; // Estilo actual de piezas

// Estado del juego (previene clicks múltiples)
let gameState = 'idle'; // Valores: 'idle', 'playing', 'memorizing', 'solving'
let isAnimating = false; // Flag para prevenir clicks durante animación

// PASO 7: Estado del nivel actual
let currentLevel = 1; // Nivel actual (1-8)
let currentAttempt = 1; // Intento actual dentro del nivel (1-10)
let successfulAttempts = 0; // Intentos exitosos en el nivel actual
let failedAttempts = 0; // Intentos fallidos (contador de errores)
let currentPosition = []; // Posición actual a memorizar
let placedPieces = []; // Piezas que el jugador ha colocado
let startTime = null; // Tiempo de inicio del intento

// Exponer a window para que leaderboard-integration.js pueda acceder
Object.defineProperty(window, 'currentLevel', {
    get: () => currentLevel
});
Object.defineProperty(window, 'successfulAttempts', {
    get: () => successfulAttempts
});
Object.defineProperty(window, 'failedAttempts', {
    get: () => failedAttempts
});

// SISTEMA DE HINTS
// Cada hint muestra TODAS las piezas del banco (no solo una)
// Cantidad limitada de hints por nivel
let hintsLeft = 6; // Hints disponibles por nivel
const HINTS_PER_LEVEL = 6; // Hints que se otorgan al comenzar un nivel
let totalHintsUsedSession = 0; // ✅ NUEVO: Trackear hints usados totales en la sesión

// CONTADORES ACUMULATIVOS DE TODA LA PARTIDA
// Estos NO se resetean al cambiar de nivel, solo al iniciar nueva partida
let totalSuccessfulAttemptsSession = 0; // ✅ Aciertos totales de todos los niveles
let totalFailedAttemptsSession = 0;     // ✅ Errores totales de todos los niveles

// Export to window for leaderboard integration
window.HINTS_PER_LEVEL = HINTS_PER_LEVEL;
// Exponer totalHintsUsedSession mediante getter para que sea siempre actual
Object.defineProperty(window, 'totalHintsUsedSession', {
    get: () => totalHintsUsedSession
});
// Exponer contadores acumulativos
Object.defineProperty(window, 'totalSuccessfulAttemptsSession', {
    get: () => totalSuccessfulAttemptsSession
});
Object.defineProperty(window, 'totalFailedAttemptsSession', {
    get: () => totalFailedAttemptsSession
});

// SISTEMA DE DESHACER/LIMPIAR
// Stack de movimientos para poder deshacer
let moveHistory = []; // Array de {square, piece, bankSlot}

// LÍMITE DE ERRORES
const MAX_FAILED_ATTEMPTS = 5; // Game Over a los 5 errores

// TIMER
let timerInterval = null; // Intervalo del contador
const TIMER_CIRCLE_CIRCUMFERENCE = 283; // 2 * PI * 45 (radio del círculo)

// PAUSA
let isPaused = false; // Estado de pausa
let pausedTimeouts = []; // Timeouts activos para pausar
let globalStartTime = null; // Tiempo de inicio de la sesión global
let globalElapsedTime = 0; // Tiempo total acumulado (en ms)
let globalTimerInterval = null; // Intervalo del timer global

// Exponer a window para que leaderboard-integration.js pueda acceder
Object.defineProperty(window, 'globalElapsedTime', {
    get: () => globalElapsedTime
});
Object.defineProperty(window, 'globalStartTime', {
    get: () => globalStartTime
});

// ============================================
// INICIALIZACIÓN
// Esperar a que el DOM esté cargado
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 Memory Matrix v2 iniciando...');

    // Inicializar botones
    initButtons();

    // Cargar preferencia de audio desde localStorage
    loadAudioPreference();

    // PASO 4: Cargar estilo de piezas preferido
    loadPieceStylePreference();

    // PASO 2: Crear tablero
    createBoard();

    // PASO 5: Crear banco de piezas
    createPieceBank();

    // PASO 6: Inicializar drag & drop
    initDragAndDrop();

    // PASO 7: Click en tablero para iniciar juego (cuando está en idle)
    const chessboard = document.getElementById('chessboard');
    if (chessboard) {
        chessboard.addEventListener('click', (e) => {
            // Solo iniciar si el juego está en estado idle
            if (gameState === 'idle') {
                console.log('🖱️ Click en tablero - Iniciando juego...');
                startGame();
            }
        });
        console.log('✅ Click-to-start en tablero inicializado');
    }

    // Mostrar posición inicial del nivel 1 (sin tablero vacío)
    showInitialPosition();

    console.log('✅ Inicialización completa');
});

// ============================================
// INICIALIZAR BOTONES
// ============================================
function initButtons() {
    // Botón HOME
    const btnHome = document.getElementById('btnHome');
    if (btnHome) {
        btnHome.addEventListener('click', goHome);
    }

    // Botón SONIDO
    const btnSound = document.getElementById('btnSound');
    if (btnSound) {
        btnSound.addEventListener('click', toggleSound);
    }

    // PASO 4: Selector de estilo de piezas
    const pieceStyleSelect = document.getElementById('pieceStyleSelect');
    if (pieceStyleSelect) {
        pieceStyleSelect.addEventListener('change', onPieceStyleChange);
    }

    // Botón COMENZAR / PAUSA
    const btnStart = document.getElementById('btnStart');
    if (btnStart) {
        btnStart.addEventListener('click', togglePause);
    }

    // Botón HINT (header)
    const btnHint = document.getElementById('btnHint');
    if (btnHint) {
        btnHint.addEventListener('click', showHint);
    }

    // Botón HINT (mobile)
    const btnHintMobile = document.getElementById('btnHintMobile');
    if (btnHintMobile) {
        btnHintMobile.addEventListener('click', showHint);
    }

    // Botón DESHACER (desktop)
    const btnUndo = document.getElementById('btnUndo');
    if (btnUndo) {
        btnUndo.addEventListener('click', undo);
        console.log('✅ Botón DESHACER (desktop) inicializado');
    }

    // Botón DESHACER (mobile)
    const btnUndoMobile = document.getElementById('btnUndoMobile');
    if (btnUndoMobile) {
        btnUndoMobile.addEventListener('click', undo);
        console.log('✅ Botón DESHACER (mobile) inicializado');
    }

    // Botón LIMPIAR
    const btnClear = document.getElementById('btnClear');
    if (btnClear) {
        btnClear.addEventListener('click', clearBoard);
        console.log('✅ Botón LIMPIAR inicializado');
    }
}

// ============================================
// FUNCIÓN: Volver a HOME
// ============================================
function goHome() {
    console.log('🏠 Volviendo a ChessArcade...');

    // Ruta relativa al index principal de ChessArcade
    // Ajustar según estructura de carpetas
    window.location.href = '../../index.html';
}

// ============================================
// FUNCIÓN: Toggle Sonido
// ============================================
function toggleSound() {
    // Usar el nuevo sistema de audio
    if (window.MemoryMatrixAudio) {
        const muted = window.MemoryMatrixAudio.toggleMute();
        soundEnabled = !muted;

        // Reproducir sonido de prueba al activar
        if (soundEnabled) {
            window.MemoryMatrixAudio.playSuccessSound();
        }
    } else {
        // Fallback: sistema antiguo
        soundEnabled = !soundEnabled;
        saveAudioPreference();
    }

    console.log(soundEnabled ? '🔊 Audio activado' : '🔇 Audio desactivado');

    // Actualizar iconos
    updateSoundIcon();
}

// ============================================
// FUNCIÓN: Actualizar icono de sonido
// ============================================
function updateSoundIcon() {
    const iconOn = document.querySelector('.icon-sound-on');
    const iconOff = document.querySelector('.icon-sound-off');

    if (soundEnabled) {
        iconOn.style.display = 'block';
        iconOff.style.display = 'none';
    } else {
        iconOn.style.display = 'none';
        iconOff.style.display = 'block';
    }
}

// ============================================
// FUNCIÓN: Guardar preferencia de audio
// ============================================
function saveAudioPreference() {
    localStorage.setItem('memory_matrix_sound', soundEnabled ? 'on' : 'off');
}

// ============================================
// FUNCIÓN: Cargar preferencia de audio
// ============================================
function loadAudioPreference() {
    // Cargar preferencia del nuevo sistema de audio
    if (window.MemoryMatrixAudio) {
        window.MemoryMatrixAudio.loadMutePreference();
        soundEnabled = !window.MemoryMatrixAudio.isMuted();
    } else {
        // Fallback: cargar del localStorage antiguo
        const saved = localStorage.getItem('memory_matrix_sound');
        if (saved === 'off') {
            soundEnabled = false;
        }
    }

    updateSoundIcon();
    console.log(`🔊 Audio ${soundEnabled ? 'activado' : 'desactivado'}`);
}

// ============================================
// PASO 4: SELECTOR DE ESTILO DE PIEZAS
// ============================================

/**
 * Cargar estilo de piezas guardado en localStorage
 * Se ejecuta al iniciar el juego
 */
function loadPieceStylePreference() {
    // Intentar cargar estilo guardado
    const saved = localStorage.getItem('memory_matrix_piece_style');

    // Si hay un estilo guardado, usarlo
    if (saved) {
        currentPieceStyle = saved;
    }

    // Actualizar select para reflejar el estilo actual
    const selectElement = document.getElementById('pieceStyleSelect');
    if (selectElement) {
        selectElement.value = currentPieceStyle;
    }

    console.log(`🎨 Estilo de piezas cargado: ${currentPieceStyle}`);
}

/**
 * Handler cuando el usuario cambia el estilo en el select
 * @param {Event} event - Evento change del select
 */
function onPieceStyleChange(event) {
    const newStyle = event.target.value;

    console.log(`🎨 Cambiando estilo de piezas a: ${newStyle}`);

    // Actualizar variable global
    currentPieceStyle = newStyle;

    // Guardar preferencia en localStorage
    localStorage.setItem('memory_matrix_piece_style', newStyle);

    // Re-renderizar todas las piezas existentes en el tablero
    refreshAllPieces();

    // PASO 5: También actualizar banco de piezas
    refreshBankPieces();

    // Feedback visual
    updateStatus(`Estilo de piezas cambiado a: ${getStyleDisplayName(newStyle)}`);
}

/**
 * Re-renderizar todas las piezas en el tablero con el nuevo estilo
 * Busca todas las piezas actuales y las redibuja
 */
function refreshAllPieces() {
    // Obtener todas las piezas actualmente en el tablero
    const pieceElements = document.querySelectorAll('.piece');

    // Para cada pieza, obtener su código y casilla, luego redibujarla
    pieceElements.forEach(pieceImg => {
        // Obtener código de pieza (ej: 'wK', 'bP')
        const pieceCode = pieceImg.dataset.piece;

        // Obtener casilla padre
        const square = pieceImg.closest('.square');
        if (square && pieceCode) {
            // Obtener coordenada de la casilla (ej: 'e4')
            const squareName = square.dataset.square;

            // Redibujar pieza con nuevo estilo
            showPiece(squareName, pieceCode);
        }
    });

    console.log(`🔄 ${pieceElements.length} piezas actualizadas con estilo ${currentPieceStyle}`);
}

/**
 * Obtener nombre legible del estilo
 * @param {string} style - Código del estilo
 * @returns {string} Nombre para mostrar
 */
function getStyleDisplayName(style) {
    const names = {
        'cburnett': 'Lichess',
        'merida': 'Chess.com',
        'cardinal': 'Cardinal'
    };
    return names[style] || style;
}

// ============================================
// PASO 7: FLUJO COMPLETO DEL JUEGO
// ============================================

/**
 * Inicia el juego con el nivel actual
 */
function startGame() {
    // PREVENIR CLICKS MÚLTIPLES
    if (isAnimating || gameState === 'playing') {
        console.warn('⚠️ Ya hay un juego en curso');
        updateStatus('Espera a que termine la animación...');
        return;
    }

    const levelConfig = window.MemoryMatrixLevels.getLevelConfig(currentLevel);

    console.log(`🚀 Nivel ${currentLevel} - Intento ${currentAttempt}/${levelConfig.attemptsRequired}`);
    console.log(`📊 Progreso: ${successfulAttempts}/${levelConfig.attemptsRequired} exitosos`);

    // Cambiar estado
    gameState = 'memorizing';
    isAnimating = true;
    startTime = Date.now();

    // Iniciar timer global (si es el primer juego)
    if (!globalStartTime && globalElapsedTime === 0) {
        startGlobalTimer();
    }

    // Cambiar botón a PAUSA
    const btnStart = document.getElementById('btnStart');
    if (btnStart) {
        btnStart.textContent = '⏸ Pausa';
        btnStart.classList.remove('disabled');
        btnStart.style.opacity = '1';
        btnStart.style.cursor = 'pointer';
    }

    // Deshabilitar botón de hints durante memorización
    updateHintButton();
    updateUndoClearButtons();

    // ==========================================
    // LIMPIAR tablero y banco para nuevo intento
    // ==========================================

    clearBoard();          // Limpiar piezas del intento anterior
    clearBankPieces();     // Limpiar banco
    clearAllSquareHints(); // Limpiar coordenadas anteriores
    placedPieces = [];     // Resetear array de piezas colocadas
    moveHistory = [];      // Resetear historial de movimientos

    // Generar posición aleatoria para el nivel actual
    if (!window.MemoryMatrixLevels) {
        console.error('❌ Sistema de niveles no cargado');
        return;
    }

    // Solo generar nueva posición si no existe (ej: después de reintento)
    // Normalmente ya existe de showInitialPosition() o del intento anterior
    if (!currentPosition || currentPosition.length === 0) {
        currentPosition = window.MemoryMatrixLevels.generateRandomPosition(currentLevel);
        console.log('⚠️ Generando nueva posición (no había preview)');
    } else {
        console.log('✅ Usando posición ya mostrada en preview');
    }

    console.log(`👁️ Memoriza ${levelConfig.pieceCount} piezas en ${levelConfig.memorizationTime/1000}s`);

    // ==========================================
    // Mostrar piezas INMEDIATAMENTE (no esperar)
    // El tablero muestra las piezas desde el inicio
    // ==========================================

    // Colocar todas las piezas en el tablero
    currentPosition.forEach(({ square, piece }) => {
        showPiece(square, piece);
    });

    // Luego, continuar con fase de memorización
    showMemorizationPhase(levelConfig);
}

/**
 * Fase 1: Mostrar posición para memorizar
 * NOTA: Las piezas YA están colocadas en el tablero por startGame()
 */
function showMemorizationPhase(levelConfig) {
    console.log('👁️ FASE 1: Memorización');

    updateStatus(`Nivel ${currentLevel} (${successfulAttempts}/${levelConfig.attemptsRequired}) - Intento ${currentAttempt} - ¡Memoriza!`);

    // Deshabilitar botón de hints durante memorización
    updateHintButton();
    updateUndoClearButtons();

    // ==========================================
    // Iniciar contador visual de tiempo
    // ==========================================
    startTimer(levelConfig.memorizationTime);

    console.log(`⏰ Tienes ${levelConfig.memorizationTime/1000} segundos para memorizar`);

    // ==========================================
    // EFECTO GLITCH MATRIX - Advertencia progresiva
    // ==========================================

    // Determinar qué piezas van a desaparecer
    const piecesToHide = window.MemoryMatrixLevels.getPiecesToHide(
        currentLevel,
        currentAttempt,
        currentPosition
    );
    const squaresToGlitch = piecesToHide.map(pos => pos.square);

    // Calcular tiempos para efectos glitch
    const totalTime = levelConfig.memorizationTime;
    const glitchWarningStart = totalTime * 0.4;  // Inicia glitch sutil al 40% del tiempo
    const glitchCriticalStart = totalTime * 0.80; // Glitch intenso al 80% del tiempo

    // Glitch sutil (empieza a mitad del tiempo)
    setTimeout(() => {
        applyGlitchEffect(squaresToGlitch, 'warning');
        console.log('⚠️ Glitch sutil activado');
    }, glitchWarningStart);

    // Glitch crítico (últimos segundos)
    setTimeout(() => {
        applyGlitchEffect(squaresToGlitch, 'critical');
        console.log('🚨 Glitch CRÍTICO activado');
    }, glitchCriticalStart);

    // Después del tiempo de memorización, ocultar piezas
    setTimeout(() => {
        stopTimer(); // Detener timer antes de ocultar
        removeGlitchEffect(squaresToGlitch); // Limpiar efectos glitch
        hidePiecesPhase(levelConfig);
    }, levelConfig.memorizationTime);
}

/**
 * Fase 2: Ocultar piezas (vuelan al banco)
 * Solo oculta las piezas indicadas según el intento actual
 */
function hidePiecesPhase(levelConfig) {
    console.log('✈️ FASE 2: Ocultando piezas');

    const { hidePiecesWithAnimation } = window.ChessGameLibrary.PieceAnimations;

    // Determinar qué piezas ocultar según el intento
    const piecesToHide = window.MemoryMatrixLevels.getPiecesToHide(
        currentLevel,
        currentAttempt,
        currentPosition
    );

    const hideCount = piecesToHide.length;
    const totalCount = currentPosition.length;
    const remainingPieces = totalCount - hideCount;

    if (remainingPieces > 0) {
        updateStatus(`¡${hideCount} pieza${hideCount > 1 ? 's' : ''} al banco! ${remainingPieces} pieza${remainingPieces > 1 ? 's quedan' : ' queda'} de referencia`);
    } else {
        updateStatus('¡Todas las piezas al banco! Reconstruye la posición...');
    }

    // Obtener casillas de las piezas a ocultar
    const squares = piecesToHide.map(pos => pos.square);

    // ==========================================
    // MOSTRAR COORDENADAS cuando piezas despegan
    // ==========================================
    showSquareHints(squares);

    // ==========================================
    // SONIDO DE VUELO (whoosh)
    // ==========================================
    if (window.MemoryMatrixAudio) {
        window.MemoryMatrixAudio.playFlySound();
    }

    // Animar piezas al banco
    hidePiecesWithAnimation(squares, {
        stagger: 150,
        duration: 600,
        onComplete: () => {
            // ==========================================
            // DESVANECER COORDENADAS después del vuelo
            // Delay: 800ms para que el jugador las vea
            // ==========================================
            hideSquareHints(squares, 800);

            startSolvingPhase(piecesToHide);
        }
    });
}

/**
 * Fase 3: Jugador reconstruye la posición
 * @param {Array} piecesToPlace - Piezas que debe colocar el jugador
 */
function startSolvingPhase(piecesToPlace) {
    console.log('🎮 FASE 3: Reconstrucción');

    gameState = 'solving';
    isAnimating = false;

    const pieceCount = piecesToPlace.length;
    updateStatus(`Arrastra ${pieceCount > 1 ? `las ${pieceCount} piezas` : 'la pieza'} del banco al tablero`);

    // Habilitar botón de hints durante fase de resolución
    updateHintButton();
    updateUndoClearButtons();

    console.log('✅ Listo para drag & drop');
}

/**
 * Valida si la posición del jugador es correcta
 * Solo valida las piezas que fueron ocultadas
 */
function validatePosition() {
    console.log('🔍 Validando posición...');

    // Obtener piezas que fueron ocultadas (las que el jugador debía colocar)
    const piecesToValidate = window.MemoryMatrixLevels.getPiecesToHide(
        currentLevel,
        currentAttempt,
        currentPosition
    );

    if (placedPieces.length !== piecesToValidate.length) {
        console.log(`⚠️ Faltan piezas: ${placedPieces.length}/${piecesToValidate.length}`);
        return false;
    }

    // Convertir a Maps para comparar
    const correctMap = new Map(piecesToValidate.map(p => [p.square, p.piece]));
    const playerMap = new Map(placedPieces.map(p => [p.square, p.piece]));

    let correctCount = 0;
    const incorrectPieces = [];

    for (const [square, piece] of correctMap) {
        if (playerMap.get(square) === piece) {
            correctCount++;
        } else {
            incorrectPieces.push({
                square,
                expected: piece,
                actual: playerMap.get(square) || 'vacío'
            });
        }
    }

    const isComplete = correctCount === piecesToValidate.length;

    console.log(`✓ ${correctCount}/${piecesToValidate.length} piezas correctas`);

    if (isComplete) {
        onAttemptSuccess();
    } else {
        onAttemptFailed(incorrectPieces);
    }

    return isComplete;
}

/**
 * Intento exitoso
 */
function onAttemptSuccess() {
    console.log('✅ ¡Intento correcto!');

    successfulAttempts++;
    totalSuccessfulAttemptsSession++; // ✅ INCREMENTAR contador acumulativo de toda la partida
    gameState = 'completed';

    const levelConfig = window.MemoryMatrixLevels.getLevelConfig(currentLevel);

    // ==========================================
    // CELEBRACIÓN VISUAL Y SONORA
    // ==========================================

    // 1. Barra de estado verde con animación de inflado
    updateStatus(
        `✅ ¡Correcto! (${successfulAttempts}/${levelConfig.attemptsRequired})`,
        'success' // Activa animación verde + inflado
    );

    // 2. Sonido de éxito (chime)
    if (window.MemoryMatrixAudio) {
        window.MemoryMatrixAudio.playSuccessSound();
    }

    // 3. Lanzar confeti 🎉 (incluye sonido de confeti)
    launchConfetti(50);

    setTimeout(() => {
        if (successfulAttempts >= levelConfig.attemptsRequired) {
            // Nivel completado
            onLevelComplete();
        } else {
            // ==========================================
            // AUTO-START siguiente intento (sin botón)
            // ==========================================
            currentAttempt++;
            updateStatus(`Preparando siguiente intento...`);

            // Limpiar posición actual para que se genere una nueva
            currentPosition = [];

            // Esperar 1 segundo y auto-iniciar
            setTimeout(() => {
                gameState = 'idle';
                startGame(); // ← Auto-start con nueva posición
            }, 1000);
        }
    }, 1500);
}

/**
 * Intento fallido - Muestra overlay y reintenta automáticamente
 * IMPORTANTE: NO regenera la posición, usa la MISMA
 */
function onAttemptFailed(incorrectPieces) {
    console.log('❌ Intento incorrecto');

    gameState = 'failed';

    // Mostrar qué está mal en consola para debugging
    incorrectPieces.forEach(({ square, expected, actual }) => {
        const expectedName = getPieceName(expected);
        console.log(`❌ ${square}: esperaba ${expectedName}, colocaste ${actual !== 'vacío' ? getPieceName(actual) : 'vacío'}`);
    });

    // ==========================================
    // INCREMENTAR CONTADOR DE ERRORES
    // ==========================================
    failedAttempts++;
    totalFailedAttemptsSession++; // ✅ INCREMENTAR contador acumulativo de toda la partida
    console.log(`❌ Error #${failedAttempts}/${MAX_FAILED_ATTEMPTS}`);

    const levelConfig = window.MemoryMatrixLevels.getLevelConfig(currentLevel);

    // ==========================================
    // VERIFICAR GAME OVER (5 errores)
    // ==========================================
    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
        showErrorOverlay(
            '¡GAME OVER!',
            `${failedAttempts} errores. El juego se reiniciará...`
        );

        setTimeout(() => {
            hideErrorOverlay();
            onGameOver();
        }, 3000);
        return;
    }

    // ==========================================
    // FEEDBACK VISUAL SUTIL (shake + parpadeo rojo)
    // NO usar overlay - mantener concentración
    // ==========================================

    // 1. Shake del tablero (incluye borde rojo)
    shakeBoardOnError();

    // 2. Parpadear piezas incorrectas en rojo
    const incorrectSquares = incorrectPieces.map(item => item.square);
    flashIncorrectPieces(incorrectSquares);

    // 3. ✅ Casillas incorrectas se vuelven rojas
    flashSquaresRed(incorrectSquares);

    // 4. ✅ Sidebar (banco de piezas) parpadea rojo
    flashSidebarRed();

    // 5. ✅ Cambiar título "MEMORY MATRIX" a rojo
    flashTitleRed();

    // 6. Actualizar mensaje de estado con animación de error
    updateStatus(
        `❌ Incorrecto - Errores: ${failedAttempts}/${MAX_FAILED_ATTEMPTS} | Correctos: ${successfulAttempts}/${levelConfig.attemptsRequired}`,
        'error' // Activa animación rosa + inflado
    );

    // ==========================================
    // REINTENTO AUTOMÁTICO DESPUÉS DE 2 SEGUNDOS
    // NO REGENERAR - USAR LA MISMA POSICIÓN
    // ==========================================
    setTimeout(() => {

        // ==========================================
        // IMPORTANTE: Limpiar solo piezas del jugador
        // Mantener piezas de referencia en tablero
        // ==========================================

        // Obtener qué piezas fueron ocultadas (las que el jugador debía colocar)
        const piecesToHide = window.MemoryMatrixLevels.getPiecesToHide(
            currentLevel,
            currentAttempt,
            currentPosition
        );

        // Limpiar solo las piezas colocadas por el jugador (incorrectas)
        placedPieces.forEach(({ square }) => {
            clearPiece(square);
        });

        // Limpiar banco
        clearBankPieces();
        placedPieces = [];
        moveHistory = [];

        // NO incrementar currentAttempt (es el mismo intento, solo reintentar)
        updateStatus(`Reintentando... Nivel ${currentLevel} (${successfulAttempts}/${levelConfig.attemptsRequired})`);

        // ==========================================
        // VOLVER A MOSTRAR LA MISMA POSICIÓN
        // Las piezas de referencia YA están en el tablero (no se limpiaron)
        // Solo necesitamos volver a mostrar las piezas OCULTAS
        // ==========================================
        setTimeout(() => {
            gameState = 'memorizing';
            isAnimating = false;

            console.log('🔄 Reintentando con la MISMA posición');
            console.log(`📍 Posición actual:`, currentPosition);

            // ==========================================
            // IMPORTANTE: Solo volver a mostrar las piezas que fueron OCULTADAS
            // Las piezas de referencia ya están en el tablero
            // ==========================================
            piecesToHide.forEach(({ square, piece }) => {
                showPiece(square, piece);
                console.log(`✨ Re-mostrando pieza oculta: ${piece} en ${square}`);
            });

            updateStatus(`Nivel ${currentLevel} - ¡Memoriza de nuevo!`);

            // ==========================================
            // EFECTO GLITCH en reintento (1 segundo)
            // NO mostrar timer, solo glitch crítico
            // ==========================================
            const squaresToGlitch = piecesToHide.map(pos => pos.square);

            // Activar glitch crítico inmediatamente
            applyGlitchEffect(squaresToGlitch, 'critical');
            console.log('🚨 Glitch crítico activado en reintento');

            // Después de 1 segundo, ocultar las MISMAS piezas
            setTimeout(() => {
                removeGlitchEffect(squaresToGlitch);
                hidePiecesPhase(levelConfig);
            }, 1000); // 1 segundo de glitch antes de ocultar

        }, 500);

    }, 2000); // 2 segundos como pediste
}

/**
 * Game Over - 5 errores alcanzados
 * Reinicia el juego desde el nivel 1
 */
function onGameOver() {
    console.log('💀 GAME OVER - 5 errores alcanzados');

    // Show game over modal with current stats
    if (window.showGameOverModal) {
        console.log('💀 Showing game over modal with stats:', {
            levelReached: currentLevel,
            successfulAttempts: successfulAttempts,
            failedAttempts: failedAttempts,
            hintsUsed: totalHintsUsedSession
        });

        window.showGameOverModal({
            levelReached: currentLevel,
            successfulAttempts: successfulAttempts,
            failedAttempts: failedAttempts,
            hintsUsed: totalHintsUsedSession // ✅ USAR contador global
        });

        // The modal will handle the game reset when closed
        // via resetGameAfterGameOver() in leaderboard-integration.js
    } else {
        // Fallback: reset immediately if modal not available
        console.warn('⚠️ Game over modal not available, resetting immediately');

        // Limpiar todo
        clearBoard();
        clearBankPieces();
        placedPieces = [];
        moveHistory = [];

        // Resetear contadores
        currentLevel = 1;
        currentAttempt = 1;
        successfulAttempts = 0;
        failedAttempts = 0;
        hintsLeft = HINTS_PER_LEVEL;
        totalHintsUsedSession = 0; // ✅ RESETEAR contador de hints
        totalSuccessfulAttemptsSession = 0; // ✅ RESETEAR contador acumulativo
        totalFailedAttemptsSession = 0;     // ✅ RESETEAR contador acumulativo

        // Resetear timer global
        resetGlobalTimer();

        updateStatus('Game Over. Reiniciando desde Nivel 1...');

        // Re-habilitar botón
        const btnStart = document.getElementById('btnStart');
        if (btnStart) {
            btnStart.classList.remove('disabled');
            btnStart.style.opacity = '1';
            btnStart.style.cursor = 'pointer';
            btnStart.textContent = '▶ Comenzar';
        }

        // Actualizar botón de hints
        updateHintButton();
        updateUndoClearButtons();

        gameState = 'idle';
        isPaused = false;

        console.log('🔄 Juego reiniciado - Nivel 1');
    }
}

/**
 * Nivel completado - avanza al siguiente
 */
function onLevelComplete() {
    console.log('🎉 ¡NIVEL COMPLETADO!');

    gameState = 'completed';

    const levelConfig = window.MemoryMatrixLevels.getLevelConfig(currentLevel);

    updateStatus(`🎉 ¡Nivel ${currentLevel}: ${levelConfig.name} COMPLETADO!`);

    // Mostrar pantalla de transición de nivel
    const totalLevels = window.MemoryMatrixLevels.getTotalLevels();
    const nextLevelNumber = currentLevel + 1;

    if (nextLevelNumber <= totalLevels) {
        const nextLevelConfig = window.MemoryMatrixLevels.getLevelConfig(nextLevelNumber);
        showLevelTransition(nextLevelNumber, nextLevelConfig);
    }

    // Reset para el siguiente nivel
    setTimeout(() => {
        currentLevel++;
        currentAttempt = 1;
        successfulAttempts = 0;
        failedAttempts = 0; // ← RESETEAR ERRORES al pasar de nivel
        hintsLeft = HINTS_PER_LEVEL; // ← RESETEAR HINTS al pasar de nivel

        if (currentLevel > totalLevels) {
            // Juego completado
            stopGlobalTimer(); // ✅ Detener el timer global al completar todos los niveles
            updateStatus('🏆 ¡FELICIDADES! Completaste todos los niveles');
            currentLevel = 1; // Volver al nivel 1
            currentAttempt = 1;
            successfulAttempts = 0;
        } else {
            const nextLevel = window.MemoryMatrixLevels.getLevelConfig(currentLevel);
            updateStatus(`Siguiente: Nivel ${currentLevel} - ${nextLevel.name}. Comenzando en 5s...`);
        }

        // Re-habilitar botón
        const btnStart = document.getElementById('btnStart');
        if (btnStart) {
            btnStart.classList.remove('disabled');
            btnStart.style.opacity = '1';
            btnStart.style.cursor = 'pointer';
            btnStart.textContent = currentLevel <= totalLevels ? `▶ Comenzar Nivel ${currentLevel}` : '▶ Comenzar';
        }

        // Actualizar botón de hints
        updateHintButton();

        // Limpiar tablero antes de mostrar nuevo nivel
        clearBoard();

        // Mostrar posición inicial del nuevo nivel (preview)
        showInitialPosition();

        gameState = 'idle';

        // ✅ INICIO AUTOMÁTICO después de 5 segundos
        if (currentLevel <= totalLevels) {
            setTimeout(() => {
                console.log('🚀 Auto-starting next level after 5 seconds');
                if (gameState === 'idle') {  // Solo si sigue en idle (no pausado ni jugando)
                    startGame();
                }
            }, 5000);
        }
    }, 3000);
}

/**
 * Muestra pantalla de transición entre niveles
 * Usa ChessGameLibrary.LevelTransition
 * @param {number} levelNumber - Número del siguiente nivel
 * @param {object} levelConfig - Configuración del siguiente nivel
 */
function showLevelTransition(levelNumber, levelConfig) {
    if (!window.ChessGameLibrary || !window.ChessGameLibrary.LevelTransition) {
        console.warn('⚠️ LevelTransition no disponible');
        return;
    }

    // Usar la librería
    window.ChessGameLibrary.LevelTransition.show({
        levelNumber: levelNumber,
        levelName: levelConfig.name,
        icon: '🎉',
        duration: 2500,
        onShow: () => {
            // Reproducir sonido al mostrar
            if (window.MemoryMatrixAudio) {
                window.MemoryMatrixAudio.playSuccessSound();
            }
        }
    });
}

/**
 * Limpiar todas las piezas del banco
 */
function clearBankPieces() {
    const bankPieces = document.querySelectorAll('.bank-piece-slot .piece');
    bankPieces.forEach(piece => piece.remove());
    console.log('🗑️ Banco limpiado');
}

// ============================================
// FUNCIÓN: Actualizar mensaje de estado
// ============================================
function updateStatus(message, type = 'normal') {
    const statusEl = document.getElementById('statusMessage');
    if (statusEl) {
        statusEl.textContent = message;

        // Remover clases anteriores
        statusEl.classList.remove('error', 'success');

        // Aplicar clase según tipo
        if (type === 'error') {
            statusEl.classList.add('error');
            console.log(`❌ Status ERROR: ${message}`);

            // Remover clase después de la animación (1.5s)
            setTimeout(() => {
                statusEl.classList.remove('error');
            }, 1500);
        } else if (type === 'success') {
            statusEl.classList.add('success');
            console.log(`✅ Status SUCCESS: ${message}`);

            // Remover clase después de la animación (1.5s)
            setTimeout(() => {
                statusEl.classList.remove('success');
            }, 1500);
        } else {
            // Normal (dorado)
            console.log(`📢 Status: ${message}`);
        }
    }
}

// ============================================
// SISTEMA DE HINTS
// ============================================

/**
 * Muestra brevemente TODAS las piezas del banco como pista
 */
function showHint() {
    // Validaciones
    if (hintsLeft <= 0) {
        updateStatus('❌ No quedan hints disponibles', 'error');
        console.log('❌ No hints left');
        return;
    }

    if (gameState !== 'solving') {
        updateStatus('❌ Solo puedes usar hints durante la fase de colocación', 'error');
        console.log('❌ Can only use hints during solving phase');
        return;
    }

    // Obtener piezas que faltan colocar
    const piecesToValidate = window.MemoryMatrixLevels.getPiecesToHide(
        currentLevel,
        currentAttempt,
        currentPosition
    );

    // Filtrar piezas que aún NO han sido colocadas
    const missingPieces = piecesToValidate.filter(expectedPiece => {
        return !placedPieces.some(placed =>
            placed.square === expectedPiece.square &&
            placed.piece === expectedPiece.piece
        );
    });

    if (missingPieces.length === 0) {
        updateStatus('✅ Ya colocaste todas las piezas correctamente', 'success');
        console.log('✅ All pieces placed');
        return;
    }

    console.log(`💡 Mostrando ${missingPieces.length} piezas faltantes como hint`);

    // Arrays para almacenar elementos para desintegración posterior
    const hintElements = [];

    // Mostrar TODAS las piezas faltantes
    missingPieces.forEach(hintPiece => {
        // Obtener casilla
        const squareEl = getSquareElement(hintPiece.square);
        if (!squareEl) return;

        // VERIFICAR si hay una pieza INCORRECTA en esa casilla
        const existingPiece = squareEl.querySelector('.piece');
        if (existingPiece && !existingPiece.classList.contains('hint-piece')) {
            const existingPieceCode = existingPiece.dataset.piece;

            // Si la pieza existente es diferente a la esperada, devolverla al banco
            if (existingPieceCode !== hintPiece.piece) {
                console.log(`⚠️ Pieza incorrecta ${existingPieceCode} en ${hintPiece.square}, devolviéndola al banco`);

                // Devolver pieza al banco con animación
                animatePieceBackToBank(hintPiece.square, existingPieceCode, () => {
                    // Remover de placedPieces
                    const index = placedPieces.findIndex(p =>
                        p.square === hintPiece.square
                    );
                    if (index !== -1) {
                        placedPieces.splice(index, 1);
                        console.log(`🗑️ Pieza ${existingPieceCode} removida de placedPieces`);
                    }
                });

                // Esperar un momento para que la pieza salga antes de mostrar hint
                // (la función continuará y mostrará el hint después)
            }
        }

        // OCULTAR coordenadas temporalmente
        const squareHints = squareEl.querySelectorAll('.square-hint');
        squareHints.forEach(h => {
            h.style.visibility = 'hidden';
        });

        // Usar showPiece() para mostrar la pieza hint (después de pequeño delay si hubo animación)
        setTimeout(() => {
            showPiece(hintPiece.square, hintPiece.piece);

            // Obtener la pieza recién creada y modificar sus estilos para hint
            const pieceImg = squareEl.querySelector('.piece');
            if (pieceImg) {
                pieceImg.classList.add('hint-piece');
                pieceImg.style.opacity = '0.6';
                pieceImg.style.filter = 'drop-shadow(0 0 20px gold)';
                pieceImg.style.pointerEvents = 'none'; // ← NO BLOQUEA DRAG & DROP

                // Guardar para desintegración
                hintElements.push({
                    squareEl: squareEl,
                    pieceImg: pieceImg,
                    hints: squareHints
                });

                console.log(`✅ Hint piece styled: ${hintPiece.piece} on ${hintPiece.square}`);
            }
        }, 450); // Delay para permitir que termine animación de vuelta al banco (400ms)
    });

    // Efecto de desintegración COORDINADO para TODAS las piezas después de 1.5s
    setTimeout(() => {
        hintElements.forEach(({ squareEl, pieceImg, hints }) => {
            createDisintegrationEffect(squareEl, pieceImg, hints);
        });
    }, 1500);

    // Consumir hint
    hintsLeft--;
    totalHintsUsedSession++; // ✅ INCREMENTAR contador global
    updateHintButton();

    // Mensaje actualizado
    const pieceCount = missingPieces.length;
    const plural = pieceCount > 1 ? 's' : '';
    updateStatus(`💡 Pista (${hintsLeft} restante${hintsLeft !== 1 ? 's' : ''}): ${pieceCount} pieza${plural} mostrada${plural}`);
    console.log(`💡 Hint shown: ${pieceCount} pieces displayed (${hintsLeft} hints left, total used: ${totalHintsUsedSession})`);
}

/**
 * Crea efecto de desintegración en partículas
 * @param {HTMLElement} squareEl - Casilla donde está la pieza
 * @param {HTMLElement} hintElement - Elemento hint (div o img)
 * @param {NodeList|HTMLElement} hiddenHints - Coordenadas ocultas (para restaurar)
 */
function createDisintegrationEffect(squareEl, hintElement, hiddenHints) {
    const rect = squareEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Crear 20 partículas doradas
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'hint-particle';

        // Posición inicial (centro de la pieza)
        particle.style.left = `${centerX}px`;
        particle.style.top = `${centerY}px`;

        // Dirección aleatoria
        const angle = (Math.PI * 2 * i) / 20 + (Math.random() - 0.5) * 0.5;
        const distance = 50 + Math.random() * 50;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;

        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);

        document.body.appendChild(particle);

        // Trigger animation
        setTimeout(() => {
            particle.style.animation = 'hintDisintegrate 1s ease-out forwards';
        }, 10);

        // Remover después de la animación
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 1100);
    }

    // Fade out del elemento hint
    if (hintElement) {
        hintElement.style.transition = 'opacity 1s ease-out';
        hintElement.style.opacity = '0';

        // Remover hint después de 1s
        setTimeout(() => {
            if (hintElement.parentNode) {
                hintElement.remove();
            }
        }, 1000);
    }

    // Restaurar coordenadas después de 1s
    setTimeout(() => {
        if (hiddenHints) {
            if (hiddenHints.forEach) {
                // Es un NodeList
                hiddenHints.forEach(h => {
                    h.style.visibility = 'visible';
                });
            } else {
                // Es un elemento simple
                hiddenHints.style.visibility = 'visible';
            }
        }
        updateStatus('Coloca las piezas restantes...');
    }, 1000);
}

/**
 * Actualiza los botones de hint (contador y estado disabled)
 * Sincroniza tanto el del header como el mobile
 */
function updateHintButton() {
    // Botón hint header (desktop)
    const btnHint = document.getElementById('btnHint');
    const hintLabel = document.getElementById('hintLabel');

    if (btnHint && hintLabel) {
        hintLabel.textContent = `HINT (${hintsLeft})`;
        btnHint.disabled = (hintsLeft <= 0 || gameState !== 'solving');
    }

    // Botón hint mobile
    const btnHintMobile = document.getElementById('btnHintMobile');
    const hintCountMobile = document.getElementById('hintCountMobile');

    if (btnHintMobile && hintCountMobile) {
        hintCountMobile.textContent = hintsLeft;
        btnHintMobile.disabled = (hintsLeft <= 0 || gameState !== 'solving');
    }
}

// ============================================
// SISTEMA DE DESHACER/LIMPIAR
// ============================================

/**
 * Deshace el último movimiento (quita la última pieza colocada)
 */
function undo() {
    if (moveHistory.length === 0) {
        console.log('⚠️ No hay movimientos para deshacer');
        return;
    }

    if (gameState !== 'solving') {
        console.log('⚠️ Solo puedes deshacer durante la fase de colocación');
        return;
    }

    // Obtener último movimiento
    const lastMove = moveHistory.pop();
    console.log(`↩️ Deshaciendo: ${lastMove.piece} en ${lastMove.square}`);

    // Quitar pieza del tablero
    const squareElement = document.querySelector(`[data-square="${lastMove.square}"]`);
    const pieceElement = squareElement?.querySelector('.piece');

    if (pieceElement) {
        // Animar pieza de vuelta al banco
        animatePieceBackToBank(lastMove.square, lastMove.piece, () => {
            // Después de la animación, quitar del array placedPieces
            const index = placedPieces.findIndex(p =>
                p.square === lastMove.square && p.piece === lastMove.piece
            );
            if (index !== -1) {
                placedPieces.splice(index, 1);
            }

            // Actualizar status
            const piecesToPlace = window.MemoryMatrixLevels.getPiecesToHide(
                currentLevel,
                currentAttempt,
                currentPosition
            );
            const remaining = piecesToPlace.length - placedPieces.length;
            updateStatus(`↩️ Deshecho - Faltan ${remaining} pieza${remaining > 1 ? 's' : ''}`);
        });
    }

    // Actualizar botones
    updateUndoClearButtons();
}

/**
 * Limpia todas las piezas del tablero (deshacer todo)
 */
function clearBoard() {
    if (moveHistory.length === 0) {
        console.log('⚠️ No hay piezas para limpiar');
        return;
    }

    if (gameState !== 'solving') {
        console.log('⚠️ Solo puedes limpiar durante la fase de colocación');
        return;
    }

    console.log(`🧹 Limpiando ${moveHistory.length} piezas del tablero...`);

    // Guardar cantidad para mensaje
    const totalPieces = moveHistory.length;

    // Deshacer todos los movimientos
    while (moveHistory.length > 0) {
        undo();
    }

    updateStatus(`🧹 Tablero limpio - ${totalPieces} pieza${totalPieces > 1 ? 's' : ''} removida${totalPieces > 1 ? 's' : ''}`);
}

/**
 * Actualiza el estado de los botones Deshacer y Limpiar
 * Sincroniza tanto las versiones desktop como mobile
 */
function updateUndoClearButtons() {
    const disabled = (moveHistory.length === 0 || gameState !== 'solving');

    // Botón Undo (desktop)
    const btnUndo = document.getElementById('btnUndo');
    if (btnUndo) {
        btnUndo.disabled = disabled;
    }

    // Botón Undo (mobile)
    const btnUndoMobile = document.getElementById('btnUndoMobile');
    if (btnUndoMobile) {
        btnUndoMobile.disabled = disabled;
    }

    // Botón Clear (si existe)
    const btnClear = document.getElementById('btnClear');
    if (btnClear) {
        btnClear.disabled = disabled;
    }
}

/**
 * Anima una pieza desde el tablero de vuelta al banco
 */
function animatePieceBackToBank(fromSquare, piece, onComplete) {
    // Buscar un slot vacío en el banco
    const bankSlots = document.querySelectorAll('.bank-piece-slot');
    let emptySlot = null;

    for (const slot of bankSlots) {
        if (!slot.querySelector('.piece')) {
            emptySlot = slot;
            break;
        }
    }

    if (!emptySlot) {
        console.error('❌ No hay slots vacíos en el banco');
        // Forzar creación de la pieza en el banco sin animación
        if (onComplete) onComplete();
        return;
    }

    // Usar la función de animación de la librería
    if (window.ChessGameLibrary && window.ChessGameLibrary.PieceAnimations) {
        window.ChessGameLibrary.PieceAnimations.animatePieceToBank(
            fromSquare,
            piece,
            emptySlot,
            {
                duration: 400,
                easing: 'ease-in',
                onComplete: onComplete
            }
        );
    } else {
        // Fallback sin animación
        const squareElement = document.querySelector(`[data-square="${fromSquare}"]`);
        const pieceElement = squareElement?.querySelector('.piece');
        if (pieceElement) {
            pieceElement.remove();
        }
        if (onComplete) onComplete();
    }
}

// ============================================
// PASO 2: CREAR TABLERO DE AJEDREZ
// ============================================

/**
 * Crear tablero 8x8 con coordenadas
 *
 * ESTRUCTURA:
 * - 64 casillas (8 filas x 8 columnas)
 * - Colores alternados: beige (light) y marrón (dark)
 * - Coordenadas: a-h (columnas), 1-8 (filas)
 *
 * NOTACIÓN ALGEBRAICA:
 * - Columnas: a, b, c, d, e, f, g, h (izquierda → derecha)
 * - Filas: 8, 7, 6, 5, 4, 3, 2, 1 (arriba → abajo)
 * - Ejemplo: a8 = esquina superior izquierda
 */
function createBoard() {
    console.log('🏗️ Creando tablero 8x8...');

    const boardElement = document.getElementById('chessboard');
    if (!boardElement) {
        console.error('❌ Elemento #chessboard no encontrado');
        return;
    }

    // Limpiar tablero si ya existe
    boardElement.innerHTML = '';

    // Arrays de coordenadas
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']; // Columnas
    const ranks = [8, 7, 6, 5, 4, 3, 2, 1]; // Filas (de arriba a abajo)

    // ==========================================
    // CREAR 64 CASILLAS
    // ==========================================
    // Recorrer fila por fila (rank), columna por columna (file)
    ranks.forEach((rank, rankIndex) => {
        files.forEach((file, fileIndex) => {

            // ==========================================
            // 1. CREAR ELEMENTO DE CASILLA
            // ==========================================
            const square = document.createElement('div');
            square.className = 'square';

            // ==========================================
            // 2. DETERMINAR COLOR (light o dark)
            // ==========================================
            // Patrón de ajedrez: alternar según suma de índices
            // Si suma es par → light, si es impar → dark
            const isLight = (rankIndex + fileIndex) % 2 === 0;
            square.classList.add(isLight ? 'light' : 'dark');

            // ==========================================
            // 3. GUARDAR COORDENADA EN data-attribute
            // ==========================================
            // Notación algebraica: file + rank (ej: 'e4', 'a8')
            const squareName = file + rank;
            square.dataset.square = squareName;

            // ==========================================
            // 4. AGREGAR COORDENADAS VISUALES
            // ==========================================

            // Coordenada horizontal (a-h) en fila 1
            if (rank === 1) {
                const coordFile = document.createElement('span');
                coordFile.className = 'coord-file';
                coordFile.textContent = file;
                square.appendChild(coordFile);
            }

            // Coordenada vertical (1-8) en columna 'a'
            if (file === 'a') {
                const coordRank = document.createElement('span');
                coordRank.className = 'coord-rank';
                coordRank.textContent = rank;
                square.appendChild(coordRank);
            }

            // ==========================================
            // 5. AGREGAR CASILLA AL TABLERO
            // ==========================================
            boardElement.appendChild(square);
        });
    });

    console.log('✅ Tablero creado: 64 casillas con coordenadas');
}

/**
 * Obtener elemento de casilla por coordenada
 * @param {string} square - Coordenada algebraica (ej: 'e4', 'a1')
 * @returns {HTMLElement|null}
 */
function getSquareElement(square) {
    return document.querySelector(`[data-square="${square}"]`);
}

// ============================================
// PASO 3: PIEZAS DE AJEDREZ
// ============================================

/**
 * CDN de Lichess para piezas SVG
 * Base URL - se concatena con el estilo y código de pieza
 *
 * CÓDIGOS DE PIEZAS:
 * - Blancas: wK (rey), wQ (dama), wR (torre), wB (alfil), wN (caballo), wP (peón)
 * - Negras: bK, bQ, bR, bB, bN, bP
 *
 * ESTILOS DISPONIBLES:
 * - cburnett (Lichess - estilo moderno)
 * - merida (Chess.com - estilo clásico)
 * - cardinal (Cardinal - estilo tradicional)
 */
const LICHESS_CDN_BASE = 'https://lichess1.org/assets/piece/';

/**
 * Mostrar pieza en una casilla
 *
 * @param {string} square - Coordenada donde colocar pieza (ej: 'e4')
 * @param {string} piece - Código de pieza (ej: 'wK', 'bP')
 *
 * IMPORTANTE: Esta función crea un <img> con la pieza
 * NO drag & drop todavía, solo visualización
 */
function showPiece(square, piece) {
    // ==========================================
    // 1. OBTENER CASILLA
    // ==========================================
    const squareElement = getSquareElement(square);
    if (!squareElement) {
        console.error(`❌ Casilla ${square} no encontrada`);
        return;
    }

    // ==========================================
    // 2. LIMPIAR PIEZAS EXISTENTES EN ESA CASILLA
    // ==========================================
    // Si ya había una pieza, eliminarla primero (incluyendo hints)
    const existingPieces = squareElement.querySelectorAll('.piece');
    existingPieces.forEach(piece => {
        piece.remove();
    });

    // ==========================================
    // 3. CREAR IMAGEN DE LA PIEZA
    // ==========================================
    const img = document.createElement('img');
    img.className = 'piece';

    // URL de la pieza en CDN Lichess con estilo actual
    // Ejemplo: https://lichess1.org/assets/piece/cburnett/wK.svg
    // PASO 4: Ahora usa currentPieceStyle en vez de hardcodear 'cburnett'
    img.src = `${LICHESS_CDN_BASE}${currentPieceStyle}/${piece}.svg`;

    // Alt text para accesibilidad
    img.alt = piece;

    // Data attribute para identificar qué pieza es
    img.dataset.piece = piece;

    // ==========================================
    // 4. AGREGAR PIEZA A LA CASILLA
    // ==========================================
    squareElement.appendChild(img);

    console.log(`✅ Pieza ${piece} colocada en ${square}`);
}

/**
 * Limpiar pieza de una casilla
 * @param {string} square - Coordenada de la casilla a limpiar
 */
function clearPiece(square) {
    const squareElement = getSquareElement(square);
    if (!squareElement) return;

    const piece = squareElement.querySelector('.piece');
    if (piece) {
        piece.remove();
        console.log(`🗑️ Pieza removida de ${square}`);
    }
}

/**
 * Limpiar todas las piezas del tablero
 */
function clearBoard() {
    // Buscar piezas en el tablero Y en el banco
    const boardPieces = document.querySelectorAll('#chessBoard .piece');
    const bankPieces = document.querySelectorAll('.piece-bank .piece');

    // Remover piezas del tablero
    boardPieces.forEach(piece => {
        piece.remove();
    });

    // También limpiar piezas sueltas que puedan estar fuera del tablero
    const allPieces = document.querySelectorAll('.piece');
    allPieces.forEach(piece => {
        // Solo remover si NO está en el banco (las del banco se manejan con clearBankPieces)
        if (!piece.closest('.piece-bank')) {
            piece.remove();
        }
    });

    console.log('🗑️ Tablero limpiado');
}

// ============================================
// PASO 5: BANCO DE PIEZAS
// ============================================

/**
 * Crear banco de piezas lateral
 * PASO 5: AHORA CREA BANCO VACÍO (solo slots)
 * Las piezas llegarán desde el tablero con animación
 */
function createPieceBank() {
    console.log('🏦 Creando banco de piezas (vacío)...');

    const bankElement = document.getElementById('pieceBank');
    if (!bankElement) {
        console.error('❌ Elemento #pieceBank no encontrado');
        return;
    }

    // Limpiar banco si ya existe
    bankElement.innerHTML = '';

    // Tipos de piezas en orden: Rey, Dama, Torre, Alfil, Caballo, Peón
    const pieceTypes = [
        { code: 'K', name: 'Rey' },
        { code: 'Q', name: 'Dama' },
        { code: 'R', name: 'Torre' },
        { code: 'B', name: 'Alfil' },
        { code: 'N', name: 'Caballo' },
        { code: 'P', name: 'Peón' }
    ];

    // Colores: blancas y negras
    const colors = [
        { code: 'w', name: 'Blanca' },
        { code: 'b', name: 'Negra' }
    ];

    // ==========================================
    // CREAR SLOTS VACÍOS PARA CADA PIEZA
    // ==========================================
    // 2 filas: 6 slots cada una (total 12)
    colors.forEach(color => {
        pieceTypes.forEach(type => {
            // Código completo de la pieza (ej: 'wK', 'bP')
            const pieceCode = color.code + type.code;

            // ==========================================
            // 1. CREAR SLOT VACÍO
            // ==========================================
            const slot = document.createElement('div');
            slot.className = 'bank-piece-slot';

            // Data attributes para identificación
            slot.dataset.piece = pieceCode;
            slot.dataset.pieceName = `${color.name} ${type.name}`;

            // ==========================================
            // 2. NO AGREGAR PIEZA TODAVÍA
            // ==========================================
            // Las piezas llegarán con animación desde el tablero

            // ==========================================
            // 3. AGREGAR SLOT VACÍO AL BANCO
            // ==========================================
            bankElement.appendChild(slot);
        });
    });

    console.log('✅ Banco de piezas creado: 12 slots vacíos (6 tipos × 2 colores)');
}

/**
 * Actualizar piezas del banco al cambiar estilo
 * Similar a refreshAllPieces() pero para el banco
 */
function refreshBankPieces() {
    const bankPieces = document.querySelectorAll('.bank-piece-slot .piece');

    bankPieces.forEach(pieceImg => {
        const pieceCode = pieceImg.dataset.piece;
        if (pieceCode) {
            // Actualizar src con nuevo estilo
            pieceImg.src = `${LICHESS_CDN_BASE}${currentPieceStyle}/${pieceCode}.svg`;
        }
    });

    console.log(`🔄 Banco actualizado: ${bankPieces.length} piezas con estilo ${currentPieceStyle}`);
}

/**
 * Mostrar posición inicial para testing
 * (2 reyes: blanco en e1, negro en e8)
 */
function showTestPosition() {
    console.log('🧪 Mostrando posición de prueba: 2 reyes');

    // Rey blanco en e1
    showPiece('e1', 'wK');

    // Rey negro en e8
    showPiece('e8', 'bK');

    updateStatus('Posición de prueba: 2 reyes en e1 y e8');
}

// ============================================
// DEMO: ANIMACIÓN BANCO (PASO 5)
// Testing de la librería ChessGameLibrary
// ============================================

/**
 * Demostración de animación: piezas vuelan al banco
 * Ejecuta después de 2 segundos de mostrar posición
 */
function demoAnimationToBank() {
    console.log('🎬 Iniciando demo de animación al banco...');

    // Verificar que la librería esté cargada
    if (typeof window.ChessGameLibrary === 'undefined') {
        console.error('❌ ChessGameLibrary no está cargada');
        return;
    }

    const { animatePieceToBank, hidePiecesWithAnimation } = window.ChessGameLibrary.PieceAnimations;

    // Mostrar posición de prueba
    showTestPosition();

    // Después de 2 segundos, animar piezas al banco
    setTimeout(() => {
        updateStatus('¡Mira cómo las piezas vuelan al banco! ✨');

        // Animar ambas piezas con stagger
        hidePiecesWithAnimation(['e1', 'e8'], {
            stagger: 300,
            duration: 800,
            onComplete: () => {
                updateStatus('Piezas guardadas en el banco. ¡Memoriza la posición!');
                console.log('✅ Demo completada');

                // IMPORTANTE: Liberar estado después de animación
                isAnimating = false;
                gameState = 'idle';

                // Re-habilitar botón
                const btnStart = document.getElementById('btnStart');
                if (btnStart) {
                    btnStart.classList.remove('disabled');
                    btnStart.style.opacity = '1';
                    btnStart.style.cursor = 'pointer';
                }
            }
        });
    }, 2000);
}

/**
 * Test manual de animación individual
 * Puedes llamar esto desde consola: testSingleAnimation()
 */
function testSingleAnimation() {
    const { animatePieceToBank } = window.ChessGameLibrary.PieceAnimations;

    // Primero colocar una pieza
    showPiece('d4', 'wQ');

    // Buscar primer slot vacío
    const emptySlot = document.querySelector('.bank-piece-slot:not(:has(.piece))');

    // Animar después de 500ms
    setTimeout(() => {
        animatePieceToBank('d4', 'wQ', emptySlot, {
            duration: 600,
            onComplete: () => {
                console.log('✅ Animación individual completada');
            }
        });
    }, 500);
}

// Exponer función de test en window para debugging
window.testSingleAnimation = testSingleAnimation;
window.demoAnimationToBank = demoAnimationToBank;

// ============================================
// PASO 6: DRAG & DROP
// ============================================

/**
 * Convierte código de pieza a nombre legible
 * @param {string} piece - Código de pieza (ej: 'wK', 'bQ')
 * @returns {string} Nombre legible (ej: 'Rey Blanco', 'Dama Negra')
 */
function getPieceName(piece) {
    if (!piece || piece.length !== 2) return piece;

    const color = piece[0] === 'w' ? 'Blanco' : 'Negro';
    const typeMap = {
        'K': 'Rey',
        'Q': 'Dama',
        'R': 'Torre',
        'B': 'Alfil',
        'N': 'Caballo',
        'P': 'Peón'
    };

    const type = typeMap[piece[1]] || piece[1];
    return `${type} ${color}`;
}

/**
 * Inicializa el sistema de drag & drop
 * Permite arrastrar piezas del banco al tablero
 */
function initDragAndDrop() {
    console.log('🎯 Inicializando Drag & Drop...');

    if (!window.ChessGameLibrary?.DragDrop) {
        console.error('❌ ChessGameLibrary.DragDrop no está cargado');
        return;
    }

    const { initDragDrop, initTapTap } = window.ChessGameLibrary.DragDrop;

    // Callbacks compartidos entre drag y tap-tap
    const sharedCallbacks = {
        bankSelector: '.piece-bank',
        boardSelector: '#chessboard',

        // Callback: cuando se coloca una pieza
        onPiecePlaced: (piece, square) => {
            console.log(`✅ Pieza colocada: ${piece} en ${square}`);

            // Registrar pieza colocada
            placedPieces.push({ square, piece });

            // Agregar al historial de movimientos para poder deshacer
            moveHistory.push({ square, piece });
            updateUndoClearButtons();

            // Calcular cuántas piezas faltan (solo las que fueron ocultadas)
            const piecesToPlace = window.MemoryMatrixLevels.getPiecesToHide(
                currentLevel,
                currentAttempt,
                currentPosition
            );

            const pieceName = getPieceName(piece);
            const remaining = piecesToPlace.length - placedPieces.length;

            if (remaining > 0) {
                updateStatus(`✓ ${pieceName} en ${square.toUpperCase()} - Faltan ${remaining} pieza${remaining > 1 ? 's' : ''}`);
            } else {
                updateStatus(`✓ ${pieceName} en ${square.toUpperCase()} - ¡Validando...!`);

                // Validar automáticamente cuando se colocan todas las piezas
                setTimeout(() => {
                    validatePosition();
                }, 500);
            }
        },

        // Validación: verificar si se puede colocar la pieza
        canPlacePiece: (piece, square) => {
            // Solo permitir durante la fase de resolución
            if (gameState !== 'solving') {
                updateStatus('⚠️ Espera a que comience la fase de resolución');
                return false;
            }

            // Verificar que no haya pieza en la casilla (ignorar hints)
            const squareElement = document.querySelector(`[data-square="${square}"]`);
            const pieces = squareElement?.querySelectorAll('.piece');

            // Filtrar solo piezas reales (no hints)
            let hasRealPiece = false;
            if (pieces) {
                pieces.forEach(p => {
                    if (!p.classList.contains('hint-piece')) {
                        hasRealPiece = true;
                    }
                });
            }

            if (hasRealPiece) {
                console.log(`❌ Ya hay una pieza en ${square}`);
                updateStatus('⚠️ Ya hay una pieza en esa casilla');
                return false;
            }

            console.log(`✅ Se puede colocar ${piece} en ${square}`);
            return true;
        }
    };

    // Inicializar AMBOS sistemas (drag y tap-tap)
    // En mobile, tap-tap será más fácil de usar
    // En desktop, drag será el método principal
    initDragDrop(sharedCallbacks);
    initTapTap(sharedCallbacks);

    console.log('✅ Drag & Drop + Tap-Tap inicializados correctamente');
}

/**
 * Función de test para probar drag & drop
 * Coloca manualmente piezas en el banco para poder arrastrarlas
 * Llamar desde consola: testDragDrop()
 */
function testDragDrop() {
    console.log('🧪 Test Drag & Drop - Colocando piezas en banco...');

    // Colocar algunos reyes en el tablero primero
    showPiece('e1', 'wK');
    showPiece('e8', 'bK');

    // Esperar y animar al banco
    setTimeout(() => {
        const { hidePiecesWithAnimation } = window.ChessGameLibrary.PieceAnimations;

        hidePiecesWithAnimation(['e1', 'e8'], {
            stagger: 200,
            duration: 600,
            onComplete: () => {
                console.log('✅ Piezas en banco - Ahora puedes arrastrarlas!');
                updateStatus('¡Arrastra las piezas del banco al tablero!');

                // Verificar listeners
                setTimeout(() => {
                    const pieces = document.querySelectorAll('.bank-piece-slot .piece');
                    console.log(`🔍 Piezas en banco: ${pieces.length}`);
                    pieces.forEach((piece, i) => {
                        console.log(`  Pieza ${i}: ${piece.dataset.piece}, eventos: ${getEventListeners(piece)?.mousedown?.length || 'N/A'}`);
                        console.log(`  - pointer-events: ${getComputedStyle(piece).pointerEvents}`);
                        console.log(`  - cursor: ${getComputedStyle(piece).cursor}`);
                    });
                }, 100);
            }
        });
    }, 500);
}

// Test manual de eventos
function testEventManual() {
    const pieces = document.querySelectorAll('.bank-piece-slot .piece');
    if (pieces.length === 0) {
        console.error('❌ No hay piezas en el banco');
        return;
    }

    const piece = pieces[0];
    console.log('🧪 Test manual de evento en primera pieza:', piece.dataset.piece);
    console.log('📍 Estilo pointer-events:', getComputedStyle(piece).pointerEvents);
    console.log('📍 Cursor:', getComputedStyle(piece).cursor);

    // Simular click
    piece.click();

    // Simular mousedown
    piece.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
}

// Exponer para debugging
window.testDragDrop = testDragDrop;
window.testEventManual = testEventManual;

// ============================================
// OVERLAY DE ERROR
// ============================================

/**
 * Muestra overlay de error con mensaje personalizado
 * @param {string} title - Título del error
 * @param {string} message - Mensaje descriptivo
 */
function showErrorOverlay(title, message) {
    const overlay = document.getElementById('errorOverlay');
    const titleEl = document.getElementById('errorTitle');
    const messageEl = document.getElementById('errorMessage');

    if (!overlay) {
        console.error('❌ Overlay de error no encontrado');
        return;
    }

    // Actualizar textos
    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;

    // Mostrar overlay
    overlay.classList.add('show');

    console.log(`🚨 Error mostrado: ${title} - ${message}`);
}

/**
 * Oculta el overlay de error
 */
function hideErrorOverlay() {
    const overlay = document.getElementById('errorOverlay');

    if (!overlay) {
        console.error('❌ Overlay de error no encontrado');
        return;
    }

    // Ocultar overlay
    overlay.classList.remove('show');

    console.log('✅ Error ocultado');
}

// ============================================
// CONTADOR DE TIEMPO (TIMER)
// ============================================

/**
 * Inicia el contador visual de tiempo
 * @param {number} durationMs - Duración en milisegundos
 */
function startTimer(durationMs) {
    const container = document.getElementById('timerContainer');
    const textEl = document.getElementById('timerText');
    const progressEl = document.getElementById('timerProgress');
    const circle = container?.querySelector('.timer-circle');

    if (!container || !textEl || !progressEl) {
        console.warn('⚠️ Elementos del timer no encontrados');
        return;
    }

    // Mostrar container
    container.classList.remove('hidden');

    const durationSeconds = Math.ceil(durationMs / 1000);
    let remaining = durationSeconds;

    // Inicializar
    textEl.textContent = remaining;
    progressEl.style.strokeDashoffset = '0';
    circle?.classList.remove('warning');

    console.log(`⏱️ Timer iniciado: ${durationSeconds}s`);

    // Limpiar timer anterior si existe
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    // Actualizar cada 100ms para animación suave
    const updateInterval = 100;
    const totalUpdates = durationMs / updateInterval;
    let currentUpdate = 0;

    timerInterval = setInterval(() => {
        currentUpdate++;
        const elapsed = (currentUpdate / totalUpdates) * durationMs;
        const remainingMs = durationMs - elapsed;
        const remainingSeconds = Math.ceil(remainingMs / 1000);

        // Actualizar texto solo cuando cambia el segundo
        if (remainingSeconds !== remaining) {
            remaining = remainingSeconds;
            textEl.textContent = remaining;

            // Advertencia cuando quedan 2 segundos o menos
            if (remaining <= 2 && remaining > 0) {
                circle?.classList.add('warning');
            }

            console.log(`⏱️ ${remaining}s restantes`);
        }

        // Actualizar progreso del círculo
        const progress = (remainingMs / durationMs);
        const offset = TIMER_CIRCLE_CIRCUMFERENCE * (1 - progress);
        progressEl.style.strokeDashoffset = offset.toString();

        // Terminar cuando se acaba el tiempo
        if (currentUpdate >= totalUpdates) {
            clearInterval(timerInterval);
            timerInterval = null;
            hideTimer();
        }
    }, updateInterval);
}

/**
 * Detiene y oculta el contador
 */
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    hideTimer();
}

/**
 * Oculta el contador
 */
function hideTimer() {
    const container = document.getElementById('timerContainer');
    const circle = container?.querySelector('.timer-circle');

    if (container) {
        container.classList.add('hidden');
        circle?.classList.remove('warning');
    }

    console.log('⏱️ Timer ocultado');
}

// ==========================================
// FEEDBACK DE ERROR SUTIL
// Shake del tablero + parpadeo rojo en piezas incorrectas
// ==========================================

/**
 * Aplica shake al tablero (error visual sutil)
 */
function shakeBoardOnError() {
    const boardContainer = document.querySelector('.board-container');
    if (!boardContainer) return;

    // Agregar clase shake
    boardContainer.classList.add('shake');

    // Remover después de la animación (500ms)
    setTimeout(() => {
        boardContainer.classList.remove('shake');
    }, 500);

    // ==========================================
    // REPRODUCIR SONIDO DE ERROR
    // ==========================================
    if (window.MemoryMatrixAudio) {
        window.MemoryMatrixAudio.playErrorSound();
    }

    console.log('📳 Shake del tablero activado');
}

/**
 * Aplica parpadeo rojo a piezas incorrectas
 * @param {Array<string>} squares - Casillas de las piezas incorrectas
 */
function flashIncorrectPieces(squares) {
    squares.forEach(square => {
        const squareElement = getSquareElement(square);
        if (!squareElement) return;

        const pieceImg = squareElement.querySelector('.piece');
        if (!pieceImg) return;

        // Agregar clase de parpadeo
        pieceImg.classList.add('incorrect-flash');

        // Remover después de la animación (1.5s)
        setTimeout(() => {
            pieceImg.classList.remove('incorrect-flash');
        }, 1500);
    });

    console.log(`🔴 ${squares.length} pieza${squares.length > 1 ? 's' : ''} parpadeando en rojo`);
}

/**
 * Cambia el título "MEMORY MATRIX" a color rojo cuando hay error
 * Vuelve al color normal después de 2 segundos
 */
function flashTitleRed() {
    const titleText = document.querySelector('.title-text');
    if (!titleText) return;

    // Cambiar a rojo
    titleText.style.color = '#ff5252';
    titleText.style.textShadow = '0 0 20px #ff5252, 0 0 40px #ff5252';
    titleText.style.transition = 'all 0.3s ease';

    // Volver al color original después de 2 segundos
    setTimeout(() => {
        titleText.style.color = '';
        titleText.style.textShadow = '';
    }, 2000);

    console.log('🔴 Título cambiado a rojo');
}

/**
 * Parpadea el sidebar (banco de piezas) en rojo cuando hay error
 */
function flashSidebarRed() {
    const sidebar = document.querySelector('.piece-bank-container');
    if (!sidebar) return;

    // Agregar clase de error
    sidebar.classList.add('error-flash');

    // Remover después de la animación (1.5s)
    setTimeout(() => {
        sidebar.classList.remove('error-flash');
    }, 1500);

    console.log('🔴 Sidebar parpadeando en rojo');
}

/**
 * Parpadea las casillas incorrectas en rojo (fondo rojo)
 * @param {Array<string>} squares - Casillas incorrectas
 */
function flashSquaresRed(squares) {
    squares.forEach(square => {
        const squareElement = getSquareElement(square);
        if (!squareElement) return;

        // Agregar clase de error a la casilla
        squareElement.classList.add('error-flash');

        // Remover después de la animación (1.5s)
        setTimeout(() => {
            squareElement.classList.remove('error-flash');
        }, 1500);
    });

    console.log(`🔴 ${squares.length} casilla${squares.length > 1 ? 's' : ''} parpadeando en rojo`);
}

// ==========================================
// CONFETI - Celebración de victoria
// ==========================================

/**
 * Lanza confeti desde la parte superior de la pantalla
 * @param {number} count - Cantidad de piezas de confeti (default: 50)
 */
function launchConfetti(count = 50) {
    const container = document.getElementById('confettiContainer');
    if (!container) return;

    const colors = ['cyan', 'pink', 'orange', 'gold', ''];
    const windowWidth = window.innerWidth;

    for (let i = 0; i < count; i++) {
        // Crear pieza de confeti
        const confetti = document.createElement('div');
        confetti.className = 'confetti';

        // Color aleatorio
        const colorClass = colors[Math.floor(Math.random() * colors.length)];
        if (colorClass) {
            confetti.classList.add(colorClass);
        }

        // Posición horizontal aleatoria
        confetti.style.left = `${Math.random() * windowWidth}px`;

        // Delay aleatorio para efecto escalonado
        confetti.style.animationDelay = `${Math.random() * 0.5}s`;

        // Duración aleatoria (1.5s a 2.5s)
        confetti.style.animationDuration = `${1.5 + Math.random()}s`;

        // Agregar al contenedor
        container.appendChild(confetti);

        // Remover después de la animación
        setTimeout(() => {
            confetti.remove();
        }, 3000);
    }

    // ==========================================
    // REPRODUCIR SONIDO DE CONFETI
    // ==========================================
    if (window.MemoryMatrixAudio) {
        window.MemoryMatrixAudio.playConfettiSound();
    }

    console.log(`🎉 ${count} confetis lanzados`);
}

// ==========================================
// COORDENADAS EN CASILLAS (HINTS)
// Muestra coordenadas en casillas cuando piezas desaparecen
// ==========================================

/**
 * Muestra coordenadas en las casillas que quedaron vacías
 * @param {Array<string>} squares - Casillas donde mostrar coordenadas
 */
function showSquareHints(squares) {
    squares.forEach(square => {
        const squareElement = getSquareElement(square);
        if (!squareElement) return;

        // Crear elemento de coordenada
        const hintElement = document.createElement('div');
        hintElement.className = 'square-hint';
        hintElement.textContent = square; // ej: "a5", "b4"
        hintElement.dataset.hint = 'true';

        // Agregar a la casilla
        squareElement.appendChild(hintElement);

        console.log(`📍 Coordenada mostrada: ${square}`);
    });
}

/**
 * Oculta coordenadas con animación fade-out
 * @param {Array<string>} squares - Casillas de las coordenadas a ocultar
 * @param {number} delay - Delay antes de iniciar fade-out (ms)
 */
function hideSquareHints(squares, delay = 0) {
    setTimeout(() => {
        squares.forEach(square => {
            const squareElement = getSquareElement(square);
            if (!squareElement) return;

            const hintElement = squareElement.querySelector('.square-hint');
            if (!hintElement) return;

            // Agregar clase para fade-out
            hintElement.classList.add('fade-out');

            // Remover del DOM después de la animación
            setTimeout(() => {
                hintElement.remove();
                console.log(`✨ Coordenada removida: ${square}`);
            }, 800); // Duración de la animación fade-out
        });
    }, delay);
}

/**
 * Limpia todas las coordenadas inmediatamente (sin animación)
 */
function clearAllSquareHints() {
    const hints = document.querySelectorAll('.square-hint');
    hints.forEach(hint => hint.remove());
    console.log(`🧹 ${hints.length} coordenadas limpiadas`);
}

// ==========================================
// EFECTO GLITCH MATRIX
// Animación de advertencia para piezas que van a desaparecer
// ==========================================

/**
 * Aplica efecto glitch a las piezas que van a desaparecer
 * @param {Array<string>} squares - Casillas de las piezas a marcar
 * @param {string} intensity - 'warning' (sutil) o 'critical' (intenso)
 */
function applyGlitchEffect(squares, intensity = 'warning') {
    squares.forEach(square => {
        const squareElement = getSquareElement(square);
        if (!squareElement) return;

        const pieceImg = squareElement.querySelector('.piece');
        if (!pieceImg) return;

        // Remover clase anterior si existe
        pieceImg.classList.remove('glitch-warning', 'glitch-critical');

        // Agregar nueva clase según intensidad
        if (intensity === 'critical') {
            pieceImg.classList.add('glitch-critical');
            console.log(`⚡ Glitch CRÍTICO en ${square}`);
        } else {
            pieceImg.classList.add('glitch-warning');
            console.log(`✨ Glitch sutil en ${square}`);
        }
    });

    // ==========================================
    // REPRODUCIR SONIDO DE GLITCH
    // ==========================================
    if (window.MemoryMatrixAudio) {
        window.MemoryMatrixAudio.playGlitchSound(intensity);
    }
}

/**
 * Muestra posición inicial del nivel actual (al cargar o pasar de nivel)
 * Evita que el tablero se vea vacío
 */
function showInitialPosition() {
    if (!window.MemoryMatrixLevels) {
        console.warn('⚠️ Sistema de niveles no cargado aún');
        return;
    }

    // Generar una posición de preview para el nivel actual
    // Esta será la posición que se usará cuando se presione "Comenzar"
    currentPosition = window.MemoryMatrixLevels.generateRandomPosition(currentLevel);

    // Mostrar piezas en el tablero
    currentPosition.forEach(({ square, piece }) => {
        showPiece(square, piece);
    });

    console.log(`👁️ Posición inicial del nivel ${currentLevel} mostrada (será usada al comenzar)`);
}

/**
 * Remueve efecto glitch de las piezas
 * @param {Array<string>} squares - Casillas de las piezas
 */
function removeGlitchEffect(squares) {
    squares.forEach(square => {
        const squareElement = getSquareElement(square);
        if (!squareElement) return;

        const pieceImg = squareElement.querySelector('.piece');
        if (!pieceImg) return;

        pieceImg.classList.remove('glitch-warning', 'glitch-critical');
    });

    console.log('🔹 Efectos glitch removidos');
}

// ==========================================
// TIMER GLOBAL Y SISTEMA DE PAUSA
// ==========================================

/**
 * Inicia el timer global de la sesión
 */
function startGlobalTimer() {
    if (globalStartTime === null) {
        globalStartTime = Date.now();
    }

    const timerDisplay = document.getElementById('globalTimerDisplay');
    const timerContainer = document.getElementById('globalTimer');

    if (timerContainer) {
        timerContainer.classList.remove('hidden');
    }

    globalTimerInterval = setInterval(() => {
        if (!isPaused) {
            const currentTime = Date.now();
            const elapsed = currentTime - globalStartTime + globalElapsedTime;

            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);

            if (timerDisplay) {
                timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
        }
    }, 100);

    console.log('⏱️ Timer global iniciado');
}

/**
 * Detiene el timer global
 */
function stopGlobalTimer() {
    if (globalTimerInterval) {
        clearInterval(globalTimerInterval);
        globalTimerInterval = null;
    }

    if (globalStartTime) {
        globalElapsedTime += Date.now() - globalStartTime;
        globalStartTime = null;
    }
}

/**
 * Resetea el timer global
 */
function resetGlobalTimer() {
    stopGlobalTimer();
    globalElapsedTime = 0;
    globalStartTime = null;

    const timerDisplay = document.getElementById('globalTimerDisplay');
    if (timerDisplay) {
        timerDisplay.textContent = '00:00';
    }
}

/**
 * Alterna entre pausa y continuar
 */
function togglePause() {
    const btnStart = document.getElementById('btnStart');

    if (gameState === 'idle') {
        // Iniciar juego
        startGame();
        if (btnStart) {
            btnStart.textContent = '⏸ Pausa';
        }
    } else if (isPaused) {
        // Reanudar juego
        isPaused = false;
        startGlobalTimer();
        if (btnStart) {
            btnStart.textContent = '⏸ Pausa';
        }
        updateStatus('Continuando...');
        console.log('▶️ Juego reanudado');
    } else {
        // Pausar juego
        isPaused = true;
        stopGlobalTimer();
        if (btnStart) {
            btnStart.textContent = '▶ Continuar';
        }
        updateStatus('⏸ Juego en pausa');
        console.log('⏸ Juego pausado');
    }
}

/**
 * Permite cambiar el estado del juego desde fuera (usado por leaderboard-integration.js)
 * @param {string} newState - Nuevo estado ('idle', 'memorizing', 'solving', 'completed', 'failed')
 */
function setGameState(newState) {
    const validStates = ['idle', 'playing', 'memorizing', 'solving', 'completed', 'failed'];
    if (!validStates.includes(newState)) {
        console.error(`❌ Invalid game state: ${newState}`);
        return;
    }
    gameState = newState;
    console.log(`🎮 Game state changed to: ${newState}`);
}

// Exponer función a window para uso externo
window.setGameState = setGameState;

/**
 * Resetea todos los contadores de sesión (usado cuando se reinicia el juego después de Game Over)
 */
function resetGameCounters() {
    // Resetear contadores acumulativos de sesión
    totalHintsUsedSession = 0;
    totalSuccessfulAttemptsSession = 0;
    totalFailedAttemptsSession = 0;

    // Resetear contadores del nivel actual
    currentLevel = 1;
    currentAttempt = 1;
    successfulAttempts = 0;
    failedAttempts = 0;
    hintsLeft = HINTS_PER_LEVEL;

    // Resetear arrays
    placedPieces = [];
    moveHistory = [];

    console.log('🔄 All game counters and variables reset');
}

// Exponer función a window para uso externo
window.resetGameCounters = resetGameCounters;
