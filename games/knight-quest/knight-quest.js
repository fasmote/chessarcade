// ========================================
// KNIGHT QUEST - JUEGO COMPLETO INDEPENDIENTE
// Recorre todas las casillas del tablero con el caballo
// Versión: 1.1.0 - Totalmente autocontenido
// ========================================

// ========================================
// SOUND SYSTEM
// ========================================
let soundEnabled = true;

// Load sound preference from localStorage
function loadSoundPreference() {
    const saved = localStorage.getItem('knight_quest_sound');
    if (saved === 'disabled') {
        soundEnabled = false;
    }
    updateSoundIcon();
}

// Save sound preference
function saveSoundPreference() {
    localStorage.setItem('knight_quest_sound', soundEnabled ? 'enabled' : 'disabled');
}

// Update sound button icon
function updateSoundIcon() {
    const iconOn = document.querySelector('.icon-sound-on');
    const iconOff = document.querySelector('.icon-sound-off');

    if (iconOn && iconOff) {
        if (soundEnabled) {
            iconOn.style.display = 'block';
            iconOff.style.display = 'none';
        } else {
            iconOn.style.display = 'none';
            iconOff.style.display = 'block';
        }
    }
}

// ========================================
// CONFIGURACIÓN DEL JUEGO
// ========================================
const KNIGHT_CONFIG = {
    name: 'knight-quest',
    version: '1.0.0',
    maxScore: 10000,
    difficulties: {
        beginner: { rows: 3, cols: 4, hints: 99, name: 'Principiante' },
        intermediate: { rows: 6, cols: 6, hints: 5, name: 'Intermedio' },
        advanced: { rows: 8, cols: 8, hints: 3, name: 'Avanzado' },
        expert: { rows: 8, cols: 8, hints: 0, name: 'Experto' }
    },
    scoring: {
        basePerSquare: 10,
        timeBonus: 5,
        hintPenalty: 50,
        undoPenalty: 25,
        difficultyMultiplier: {
            beginner: 1,
            intermediate: 1.5,
            advanced: 2,
            expert: 3
        }
    }
};

// ========================================
// ESTADO DEL JUEGO
// ========================================
let gameState = {
    isPlaying: false,
    isPaused: false,
    board: [],
    boardRows: 3,
    boardCols: 4,
    currentPos: null,
    visitedSquares: new Set(),
    moveHistory: [],
    possibleMoves: [],
    startTime: null,
    gameTimer: null,
    difficulty: 'beginner',
    hintsLeft: 99,
    hintsUsed: 0,
    undosUsed: 0,
    score: 0,
    moveCount: 0,
    gameId: null
};

// Movimientos del caballo (L-shaped)
const KNIGHT_MOVES = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
];

// ========================================
// INICIALIZACIÓN DEL JUEGO
// ========================================
function initGame() {
    console.log(`Inicializando ${KNIGHT_CONFIG.name} v${KNIGHT_CONFIG.version}`);
    
    // Crear tablero inicial
    createBoard();
    
    // Configurar UI inicial
    setupUI();
    
    // Bind eventos
    bindEvents();
    
    // Cargar configuración guardada
    loadSettings();
    
    // Actualizar display
    updateUI();
    
    console.log('Knight Quest inicializado correctamente');
}

// ========================================
// CREACIÓN Y MANEJO DEL TABLERO
// ========================================
function createBoard() {
    const board = document.getElementById('chessboard');
    board.innerHTML = '';

    // Configurar tamaño del tablero
    const rows = gameState.boardRows;
    const cols = gameState.boardCols;
    board.className = `chessboard size-${rows}x${cols}`;

    // Inicializar array del tablero
    gameState.board = Array(rows * cols).fill(null);

    // Crear casillas
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const square = document.createElement('div');
            const index = row * cols + col;

            square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
            square.dataset.index = index;
            square.dataset.row = row;
            square.dataset.col = col;

            // Event listener para clicks
            square.addEventListener('click', () => handleSquareClick(index));

            board.appendChild(square);
        }
    }
}

function handleSquareClick(targetIndex) {
    if (!gameState.isPlaying || gameState.isPaused) return;
    
    // Primer movimiento - colocar caballo
    if (gameState.currentPos === null) {
        placeKnight(targetIndex);
        return;
    }
    
    // Verificar si es un movimiento válido
    if (!gameState.possibleMoves.includes(targetIndex)) {
        // Movimiento inválido
        showError('¡Movimiento inválido! El caballo se mueve en forma de L.');
        animateError(targetIndex);
        ChessArcade.playSound('error');
        return;
    }
    
    // Hacer el movimiento
    makeMove(targetIndex);
}

function placeKnight(position) {
    gameState.currentPos = position;
    gameState.visitedSquares.add(position);
    gameState.moveHistory.push(position);
    gameState.board[position] = gameState.moveHistory.length;
    gameState.startTime = Date.now();
    
    // Iniciar timer
    startGameTimer();
    
    // Actualizar UI
    updateBoard();
    updatePossibleMoves();
    updateUI();
    updateGameTips('¡Excelente! Ahora mueve el caballo a una casilla válida.');
    
    ChessArcade.playSound('move');
}

function makeMove(targetIndex) {
    // Verificar si ya fue visitada
    if (gameState.visitedSquares.has(targetIndex)) {
        showError('¡Ya visitaste esa casilla!');
        animateError(targetIndex);
        ChessArcade.playSound('error');
        return;
    }
    
    // Realizar movimiento
    gameState.currentPos = targetIndex;
    gameState.visitedSquares.add(targetIndex);
    gameState.moveHistory.push(targetIndex);
    gameState.board[targetIndex] = gameState.moveHistory.length;
    gameState.moveCount++;
    
    // Actualizar UI
    updateBoard();
    updatePossibleMoves();
    updateUI();
    
    // Verificar victoria
    const totalSquares = gameState.boardRows * gameState.boardCols;
    if (gameState.visitedSquares.size === totalSquares) {
        setTimeout(() => completeQuest(), 500);
    } else {
        // Verificar si hay movimientos posibles
        if (gameState.possibleMoves.length === 0) {
            setTimeout(() => gameOver(false), 500);
        } else {
            updateGameTips(getRandomTip());
        }
    }
    
    ChessArcade.playSound('move');
    updateScore();
}

// ========================================
// LÓGICA DEL CABALLO
// ========================================
function isValidKnightMove(from, to) {
    const cols = gameState.boardCols;
    const fromRow = Math.floor(from / cols);
    const fromCol = from % cols;
    const toRow = Math.floor(to / cols);
    const toCol = to % cols;

    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);

    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
}

function getPossibleMoves(pos) {
    const rows = gameState.boardRows;
    const cols = gameState.boardCols;
    const row = Math.floor(pos / cols);
    const col = pos % cols;
    const moves = [];

    KNIGHT_MOVES.forEach(([dRow, dCol]) => {
        const newRow = row + dRow;
        const newCol = col + dCol;

        if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
            const newPos = newRow * cols + newCol;
            if (!gameState.visitedSquares.has(newPos)) {
                moves.push(newPos);
            }
        }
    });
    
    return moves;
}

function updatePossibleMoves() {
    if (gameState.currentPos !== null) {
        gameState.possibleMoves = getPossibleMoves(gameState.currentPos);
    } else {
        gameState.possibleMoves = [];
    }
}

// ========================================
// ALGORITMO DE WARNSDORFF (PISTAS)
// ========================================
function getBestMoveWarnsdorff(position) {
    const possibleMoves = getPossibleMoves(position);
    if (possibleMoves.length === 0) return null;
    
    let bestMove = possibleMoves[0];
    let fewestOnward = Infinity;
    
    possibleMoves.forEach(move => {
        const onwardMoves = getPossibleMoves(move).length;
        if (onwardMoves < fewestOnward) {
            fewestOnward = onwardMoves;
            bestMove = move;
        }
    });
    
    return bestMove;
}

function getHint() {
    if (gameState.hintsLeft <= 0) {
        showError('¡No tienes pistas restantes!');
        ChessArcade.playSound('error');
        return;
    }
    
    if (gameState.currentPos === null) {
        showError('¡Primero coloca el caballo en el tablero!');
        ChessArcade.playSound('error');
        return;
    }
    
    const bestMove = getBestMoveWarnsdorff(gameState.currentPos);
    if (bestMove === null) {
        showError('¡No hay movimientos posibles!');
        ChessArcade.playSound('error');
        return;
    }
    
    // Resaltar la mejor jugada
    const squares = document.querySelectorAll('.square');
    const hintSquare = squares[bestMove];
    
    hintSquare.classList.add('knight-hint');
    setTimeout(() => {
        hintSquare.classList.remove('knight-hint');
    }, 2000);
    
    gameState.hintsLeft--;
    gameState.hintsUsed++;
    updateUI();
    
    showSuccess(`💡 ¡Pista! La mejor casilla es ${getSquareName(bestMove)}`);
    ChessArcade.playSound('success');
}

// ========================================
// CONTROL DE JUEGO
// ========================================
function startGame() {
    if (gameState.isPlaying) {
        newGame();
        return;
    }
    
    newGame();
}

function newGame() {
    // Reset estado
    resetGameState();
    
    // Recrear tablero
    createBoard();
    
    // Actualizar UI
    updateBoard();
    updateUI();
    updateGameTips('¡Haz clic en cualquier casilla para comenzar tu aventura!');
    
    // Cambiar texto del botón
    document.getElementById('startBtn').textContent = '🔄 REINICIAR';
    
    ChessArcade.playSound('click');
    
    console.log('Nuevo juego iniciado');
}

function resetGame() {
    if (confirm('¿Estás seguro de que quieres reiniciar el juego?')) {
        newGame();
    }
}

function pauseGame() {
    if (!gameState.isPlaying) return;
    
    gameState.isPaused = !gameState.isPaused;
    
    if (gameState.isPaused) {
        clearInterval(gameState.gameTimer);
        showWarning('⏸️ Juego pausado. Presiona ESC para continuar.');
    } else {
        startGameTimer();
        updateGameTips('¡Continuando el juego!');
    }
}

function resetGameState() {
    // Limpiar timer anterior
    if (gameState.gameTimer) {
        clearInterval(gameState.gameTimer);
    }
    
    const difficulty = gameState.difficulty;
    const config = KNIGHT_CONFIG.difficulties[difficulty];
    
    gameState = {
        isPlaying: true,
        isPaused: false,
        board: [],
        boardRows: config.rows,
        boardCols: config.cols,
        currentPos: null,
        visitedSquares: new Set(),
        moveHistory: [],
        possibleMoves: [],
        startTime: null,
        gameTimer: null,
        difficulty: difficulty,
        hintsLeft: config.hints,
        hintsUsed: 0,
        undosUsed: 0,
        score: 0,
        moveCount: 0,
        gameId: Date.now()
    };
}

function undoMove() {
    if (gameState.moveHistory.length <= 1) {
        showError('¡No hay movimientos para deshacer!');
        ChessArcade.playSound('error');
        return;
    }
    
    // Remover último movimiento
    const lastPos = gameState.moveHistory.pop();
    gameState.visitedSquares.delete(lastPos);
    gameState.board[lastPos] = null;
    gameState.undosUsed++;
    
    // Actualizar posición actual
    if (gameState.moveHistory.length > 0) {
        gameState.currentPos = gameState.moveHistory[gameState.moveHistory.length - 1];
    } else {
        gameState.currentPos = null;
        gameState.isPlaying = false;
        clearInterval(gameState.gameTimer);
    }
    
    // Actualizar UI
    updateBoard();
    updatePossibleMoves();
    updateUI();
    updateScore();
    
    showWarning('↩️ Movimiento deshecho');
    ChessArcade.playSound('click');
}

// ========================================
// DIFICULTAD
// ========================================
function changeDifficulty() {
    const select = document.getElementById('difficultySelect');
    const newDifficulty = select.value;
    
    if (gameState.isPlaying && gameState.moveHistory.length > 0) {
        if (!confirm('¿Cambiar dificultad reiniciará el juego actual. ¿Continuar?')) {
            select.value = gameState.difficulty;
            return;
        }
    }
    
    gameState.difficulty = newDifficulty;
    const config = KNIGHT_CONFIG.difficulties[newDifficulty];
    
    // Actualizar UI
    document.getElementById('levelCount').textContent = config.name;
    
    // Guardar preferencia
    localStorage.setItem('knight_quest_difficulty', newDifficulty);
    
    // Reiniciar juego si estaba en progreso
    if (gameState.isPlaying) {
        newGame();
    } else {
        resetGameState();
        createBoard();
        updateUI();
    }
    
    showSuccess(`🎯 Dificultad cambiada a ${config.name}`);
}

// ========================================
// PUNTUACIÓN
// ========================================
function calculateScore() {
    const config = KNIGHT_CONFIG.scoring;
    const difficulty = KNIGHT_CONFIG.difficulties[gameState.difficulty];
    
    // Puntos base por casillas visitadas
    let score = gameState.visitedSquares.size * config.basePerSquare;
    
    // Bonus por tiempo (menos tiempo = más puntos)
    if (gameState.startTime) {
        const timeElapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
        const timeBonus = Math.max(0, (300 - timeElapsed) * config.timeBonus); // 5 minutos max
        score += timeBonus;
    }
    
    // Penalty por pistas usadas
    score -= gameState.hintsUsed * config.hintPenalty;
    
    // Penalty por deshacer movimientos
    score -= gameState.undosUsed * config.undoPenalty;
    
    // Multiplicador por dificultad
    score *= config.difficultyMultiplier[gameState.difficulty];
    
    // Bonus por completar el juego
    const totalSquares = gameState.boardRows * gameState.boardCols;
    if (gameState.visitedSquares.size === totalSquares) {
        score += 1000 * config.difficultyMultiplier[gameState.difficulty];
    }
    
    return Math.max(0, Math.floor(score));
}

function updateScore() {
    gameState.score = calculateScore();
    document.getElementById('scoreCount').textContent = ChessArcade.formatScore(gameState.score);
}

// ========================================
// FINALIZACIÓN DEL JUEGO
// ========================================
function completeQuest() {
    gameState.isPlaying = false;
    clearInterval(gameState.gameTimer);
    
    const finalScore = calculateScore();
    const timeElapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    
    // Guardar puntuación
    const scoreData = {
        score: finalScore,
        time: timeElapsed,
        moves: gameState.moveCount,
        difficulty: gameState.difficulty,
        hintsUsed: gameState.hintsUsed,
        undosUsed: gameState.undosUsed,
        perfect: gameState.hintsUsed === 0 && gameState.undosUsed === 0
    };
    
    const result = ChessArcade.saveLocalScore(KNIGHT_CONFIG.name, finalScore, timeElapsed, gameState.difficulty, scoreData);
    
    // Verificar logros
    const newAchievements = ChessArcade.checkAchievements(KNIGHT_CONFIG.name, scoreData);
    
    // Mostrar modal de victoria
    showGameOverModal(true, scoreData, result, newAchievements);
    
    ChessArcade.playSound('victory');
    
    console.log('Quest completado:', scoreData);
}

function gameOver(won = false) {
    gameState.isPlaying = false;
    clearInterval(gameState.gameTimer);
    
    const finalScore = calculateScore();
    const timeElapsed = gameState.startTime ? Math.floor((Date.now() - gameState.startTime) / 1000) : 0;
    
    const scoreData = {
        score: finalScore,
        time: timeElapsed,
        moves: gameState.moveCount,
        difficulty: gameState.difficulty,
        hintsUsed: gameState.hintsUsed,
        undosUsed: gameState.undosUsed,
        perfect: false,
        completed: won
    };
    
    if (finalScore > 0) {
        ChessArcade.saveLocalScore(KNIGHT_CONFIG.name, finalScore, timeElapsed, gameState.difficulty, scoreData);
    }
    
    showGameOverModal(won, scoreData);
    
    ChessArcade.playSound(won ? 'victory' : 'error');
}

// ========================================
// ACTUALIZACIÓN DE UI
// ========================================
function updateUI() {
    // Estadísticas
    document.getElementById('moveCount').textContent = gameState.moveCount;
    document.getElementById('visitedCount').textContent = gameState.visitedSquares.size;
    document.getElementById('levelCount').textContent = KNIGHT_CONFIG.difficulties[gameState.difficulty].name;
    document.getElementById('hintsLeft').textContent = gameState.hintsLeft;
    
    // Progreso
    const totalSquares = gameState.boardRows * gameState.boardCols;
    const progress = (gameState.visitedSquares.size / totalSquares) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = `${Math.floor(progress)}% completado`;
    
    // Botones
    document.getElementById('hintBtn').disabled = gameState.hintsLeft <= 0 || !gameState.isPlaying;
    document.getElementById('undoBtn').disabled = gameState.moveHistory.length <= 1 || !gameState.isPlaying;
    
    // Puntuación
    updateScore();
}

function updateBoard() {
    const squares = document.querySelectorAll('.square');
    
    // Limpiar clases especiales
    squares.forEach(square => {
        square.className = square.className.split(' ').filter(c => 
            c === 'square' || c === 'light' || c === 'dark'
        ).join(' ');
        square.textContent = '';
    });
    
    // Marcar casillas visitadas
    gameState.visitedSquares.forEach((index, i) => {
        if (index !== gameState.currentPos) {
            squares[index].classList.add('knight-visited');
            squares[index].textContent = gameState.board[index];
        }
    });
    
    // Marcar posición actual
    if (gameState.currentPos !== null) {
        squares[gameState.currentPos].classList.add('knight-current');
        squares[gameState.currentPos].textContent = '♘';
    }
    
    // Marcar movimientos posibles
    gameState.possibleMoves.forEach(index => {
        squares[index].classList.add('knight-possible');
    });
}

function updateTimer() {
    if (gameState.startTime && !gameState.isPaused) {
        const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
        document.getElementById('timeCount').textContent = ChessArcade.formatTime(elapsed);
    }
}

function startGameTimer() {
    gameState.gameTimer = setInterval(updateTimer, 1000);
}

// ========================================
// MENSAJES Y NOTIFICACIONES
// ========================================
function updateGameTips(message) {
    document.getElementById('gameTips').innerHTML = `<p>💡 <strong>Consejo:</strong> ${message}</p>`;
}

function showSuccess(message) {
    updateStatusPanel(message, 'success');
}

function showWarning(message) {
    updateStatusPanel(message, 'warning');
}

function showError(message) {
    updateStatusPanel(message, 'error');
}

function updateStatusPanel(message, type = 'info') {
    const panel = document.getElementById('statusPanel');
    const messageEl = document.getElementById('statusMessage');
    
    panel.className = `status-panel ${type}`;
    messageEl.textContent = message;
    
    // Auto-clear después de 3 segundos
    setTimeout(() => {
        if (panel.className.includes(type)) {
            panel.className = 'status-panel';
            messageEl.textContent = 'Mueve el caballo por todas las casillas del tablero.';
        }
    }, 3000);
}

function animateError(squareIndex) {
    const squares = document.querySelectorAll('.square');
    const square = squares[squareIndex];
    square.classList.add('knight-error');
    setTimeout(() => {
        square.classList.remove('knight-error');
    }, 500);
}

// ========================================
// MODALES
// ========================================
function showGameOverModal(won, scoreData, result = null, achievements = []) {
    const modal = document.getElementById('gameOverModal');
    const title = document.getElementById('gameOverTitle');
    const statsContainer = document.getElementById('finalStats');
    const achievementsContainer = document.getElementById('achievementShowcase');
    
    // Título
    title.textContent = won ? '🏆 ¡KNIGHT QUEST COMPLETADO!' : '⚔️ QUEST TERMINADO';
    
    // Estadísticas finales
    statsContainer.innerHTML = `
        <div class="stat-item">
            <span class="stat-value">${ChessArcade.formatScore(scoreData.score)}</span>
            <span class="stat-label">Puntuación Final</span>
        </div>
        <div class="stat-item">
            <span class="stat-value">${ChessArcade.formatTime(scoreData.time)}</span>
            <span class="stat-label">Tiempo Total</span>
        </div>
        <div class="stat-item">
            <span class="stat-value">${scoreData.moves}</span>
            <span class="stat-label">Movimientos</span>
        </div>
        <div class="stat-item">
            <span class="stat-value">${gameState.visitedSquares.size}/${gameState.boardRows * gameState.boardCols}</span>
            <span class="stat-label">Casillas Visitadas</span>
        </div>
        <div class="stat-item">
            <span class="stat-value">${scoreData.hintsUsed}</span>
            <span class="stat-label">Pistas Usadas</span>
        </div>
        <div class="stat-item">
            <span class="stat-value">${KNIGHT_CONFIG.difficulties[gameState.difficulty].name}</span>
            <span class="stat-label">Dificultad</span>
        </div>
    `;
    
    // Mostrar logros desbloqueados
    if (achievements.length > 0) {
        achievementsContainer.innerHTML = achievements.map(achievement => 
            `<div class="achievement-badge">
                <span>${achievement.icon}</span>
                <span>${achievement.name}</span>
            </div>`
        ).join('');
    } else {
        achievementsContainer.innerHTML = '';
    }
    
    // Mostrar modal
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 100);
}

function closeGameOverModal() {
    const modal = document.getElementById('gameOverModal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

function showLeaderboard() {
    const modal = document.getElementById('leaderboardModal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 100);
    
    // Cargar leaderboard por defecto
    showLeaderboardTab('all');
}

function closeLeaderboardModal() {
    const modal = document.getElementById('leaderboardModal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

function showLeaderboardTab(tab) {
    // Actualizar tabs
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const content = document.getElementById('leaderboardContent');
    const scores = ChessArcade.getLocalLeaderboard(KNIGHT_CONFIG.name, 20);
    
    if (scores.length === 0) {
        content.innerHTML = `
            <div class="empty-leaderboard">
                <div class="empty-icon">🏆</div>
                <p>¡Aún no hay puntuaciones!</p>
                <p>¡Sé el primero en completar Knight Quest!</p>
            </div>
        `;
        return;
    }
    
    // Filtrar según tab
    let filteredScores = scores;
    if (tab === 'today') {
        const today = new Date().toDateString();
        filteredScores = scores.filter(score => 
            new Date(score.date).toDateString() === today
        );
    }
    
    if (filteredScores.length === 0 && tab === 'today') {
        content.innerHTML = `
            <div class="empty-leaderboard">
                <div class="empty-icon">📅</div>
                <p>¡No hay puntuaciones de hoy!</p>
                <p>¡Juega una partida para aparecer aquí!</p>
            </div>
        `;
        return;
    }
    
    // Generar lista
    content.innerHTML = `
        <div class="leaderboard-list">
            ${filteredScores.map((score, index) => `
                <div class="leaderboard-item ${tab === 'personal' ? 'personal' : ''}">
                    <div class="rank ${index === 0 ? 'first' : index === 1 ? 'second' : index === 2 ? 'third' : ''}">#${index + 1}</div>
                    <div class="player-info">
                        <div class="player-name">Jugador ${score.id.toString().slice(-4)}</div>
                        <div class="player-details">
                            ${score.difficulty} • ${score.moves} movimientos 
                            ${score.perfect ? '• ⭐ Perfecto' : ''}
                        </div>
                    </div>
                    <div class="score-info">
                        <div class="score">${ChessArcade.formatScore(score.score)}</div>
                        <div class="time">${ChessArcade.formatTime(score.time)}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function showHelp() {
    const modal = document.getElementById('helpModal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 100);
}

function closeHelpModal() {
    const modal = document.getElementById('helpModal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

// ========================================
// UTILIDADES
// ========================================
function getSquareName(index) {
    const cols = gameState.boardCols;
    const rows = gameState.boardRows;
    const row = Math.floor(index / cols);
    const col = index % cols;
    const file = String.fromCharCode(65 + col); // A, B, C...
    const rank = rows - row; // 1, 2, 3...
    return `${file}${rank}`;
}

function getRandomTip() {
    const tips = [
        'El caballo es la única pieza que puede saltar sobre otras.',
        'Intenta moverte hacia las esquinas y bordes primero.',
        'Planifica varios movimientos por adelantado.',
        'Las casillas con menos salidas son más difíciles de alcanzar.',
        '¡Usa las pistas sabiamente para obtener mejor puntuación!',
        'Un patrón en espiral puede ser útil en algunos casos.',
        'Las casillas centrales tienen más opciones de movimiento.',
        '¡La práctica hace al maestro del ajedrez!',
        'Cada casilla visitada suma puntos a tu puntuación.',
        '¡Completa sin pistas para obtener el máximo bonus!'
    ];
    
    return tips[Math.floor(Math.random() * tips.length)];
}

function loadSettings() {
    // Cargar dificultad guardada
    const savedDifficulty = localStorage.getItem('knight_quest_difficulty');
    if (savedDifficulty && KNIGHT_CONFIG.difficulties[savedDifficulty]) {
        gameState.difficulty = savedDifficulty;
        document.getElementById('difficultySelect').value = savedDifficulty;
        
        const config = KNIGHT_CONFIG.difficulties[savedDifficulty];
        document.getElementById('levelCount').textContent = config.name;
    }
}

function setupUI() {
    // Configurar botón de sonido inicial
    updateSoundIcon();
}

// ========================================
// EVENT LISTENERS
// ========================================
function bindEvents() {
    // Teclas de acceso rápido
    document.addEventListener('keydown', handleKeyPress);
    
    // Cerrar modales con escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Cerrar modales abiertos
            const modals = document.querySelectorAll('.modal-overlay.show');
            if (modals.length > 0) {
                modals.forEach(modal => {
                    if (modal.id === 'gameOverModal') closeGameOverModal();
                    if (modal.id === 'leaderboardModal') closeLeaderboardModal();
                    if (modal.id === 'helpModal') closeHelpModal();
                });
            } else if (gameState.isPlaying) {
                // Pausar/reanudar juego
                pauseGame();
            }
        }
    });
    
    // Prevenir menu contextual en tablero
    document.getElementById('chessboard').addEventListener('contextmenu', e => e.preventDefault());
}

function handleKeyPress(event) {
    if (!gameState.isPlaying) return;
    
    switch(event.key.toLowerCase()) {
        case 'h':
            event.preventDefault();
            getHint();
            break;
        case 'u':
            event.preventDefault();
            undoMove();
            break;
        case 'n':
            if (event.ctrlKey) {
                event.preventDefault();
                newGame();
            }
            break;
        case 'r':
            if (event.ctrlKey) {
                event.preventDefault();
                resetGame();
            }
            break;
    }
}

// ========================================
// FUNCIONES GLOBALES PARA HTML
// ========================================
function toggleSound() {
    console.log('🔊 toggleSound() LLAMADA INICIADA');
    console.log('   - soundEnabled antes:', soundEnabled);
    soundEnabled = !soundEnabled;
    console.log('   - soundEnabled después:', soundEnabled);
    saveSoundPreference();
    updateSoundIcon();
    console.log(soundEnabled ? '🔊 Sonido activado' : '🔇 Sonido desactivado');
    // Reproducir sonido de confirmación al activar
    if (soundEnabled) {
        // Sincronizar con CHESSARCADE global para que playSound funcione
        if (typeof CHESSARCADE !== 'undefined') {
            CHESSARCADE.soundEnabled = true;
        }
        if (ChessArcade && ChessArcade.playSound) {
            ChessArcade.playSound('click');
        }
    } else {
        // Sincronizar el estado desactivado también
        if (typeof CHESSARCADE !== 'undefined') {
            CHESSARCADE.soundEnabled = false;
        }
    }
}

// Función de prueba para debuggear
function testSound() {
    console.log('🧪 testSound() EJECUTADA');
    console.log('   - soundEnabled actual:', soundEnabled);
    toggleSound();
}

// ========================================
// FUNCIÓN: Go Home (volver a ChessArcade)
// ========================================
function goHome() {
    console.log('🏠 Volviendo a ChessArcade...');
    window.location.href = '../../index.html';
}

// ========================================
// INICIALIZACIÓN AUTOMÁTICA
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('========================================');
    console.log('🎮 KNIGHT QUEST - INICIALIZACIÓN');
    console.log('========================================');
    console.log('DOM loaded, inicializando Knight Quest...');

    // Cargar preferencia de sonido primero
    console.log('📂 Cargando preferencia de sonido...');
    loadSoundPreference();
    console.log('   - soundEnabled:', soundEnabled);

    // Configurar event listeners para botones HOME y SOUND PRIMERO
    // Usar try-catch para asegurar que se registren incluso si hay errores
    console.log('\n🔘 Buscando botones HOME y SOUND...');
    try {
        const btnHome = document.getElementById('btnHome');
        const btnSound = document.getElementById('btnSound');

        console.log('   - btnHome element:', btnHome);
        console.log('   - btnSound element:', btnSound);

        if (btnHome) {
            console.log('✅ HOME button encontrado!');
            console.log('   - ID:', btnHome.id);
            console.log('   - Class:', btnHome.className);
            console.log('   - Text:', btnHome.textContent.trim().substring(0, 20));

            btnHome.addEventListener('click', function(e) {
                console.log('\n🏠🏠🏠 HOME BUTTON CLICKED! 🏠🏠🏠');
                console.log('   - Event:', e);
                e.preventDefault();
                goHome();
            });
            console.log('   ✅ Listener agregado a HOME');
        } else {
            console.error('❌ HOME button NO encontrado (null o undefined)');
        }

        if (btnSound) {
            console.log('✅ SOUND button encontrado!');
            console.log('   - ID:', btnSound.id);
            console.log('   - Class:', btnSound.className);
            console.log('   - Text:', btnSound.textContent.trim().substring(0, 20));

            btnSound.addEventListener('click', function(e) {
                console.log('\n🔊🔊🔊 SOUND BUTTON CLICKED! 🔊🔊🔊');
                console.log('   - Event:', e);
                e.preventDefault();
                toggleSound();
            });
            console.log('   ✅ Listener agregado a SOUND');
        } else {
            console.error('❌ SOUND button NO encontrado (null o undefined)');
        }
    } catch (error) {
        console.error('❌ Error configurando botones:', error);
        console.error('   Stack:', error.stack);
    }

    // Iniciar juego después de configurar listeners
    try {
        initGame();
    } catch (error) {
        console.error('❌ Error iniciando juego:', error);
    }
});

// Hacer funciones disponibles globalmente para los botones HTML
window.startGame = startGame;
window.newGame = newGame;
window.resetGame = resetGame;
window.getHint = getHint;
window.undoMove = undoMove;
window.changeDifficulty = changeDifficulty;
window.showLeaderboard = showLeaderboard;
window.closeLeaderboardModal = closeLeaderboardModal;
window.showLeaderboardTab = showLeaderboardTab;
window.closeGameOverModal = closeGameOverModal;
window.showHelp = showHelp;
window.closeHelpModal = closeHelpModal;
window.toggleSound = toggleSound;

console.log('Knight Quest v' + KNIGHT_CONFIG.version + ' cargado correctamente');