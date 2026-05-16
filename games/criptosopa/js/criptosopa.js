/**
 * CriptoSopa - Knight Movement Word Search
 * Find words by moving like a chess knight (L-shaped moves)
 */

// Game Configuration
const CONFIG = {
    BOARD_SIZE: 8,
    NEON_COLORS: [
        { hex: '#ff00ff', glow: '0 0 15px #ff00ff' },
        { hex: '#00ffff', glow: '0 0 15px #00ffff' },
        { hex: '#ffff00', glow: '0 0 15px #ffff00' },
        { hex: '#ff9900', glow: '0 0 15px #ff9900' },
        { hex: '#39ff14', glow: '0 0 15px #39ff14' },
        { hex: '#b026ff', glow: '0 0 15px #b026ff' },
    ],
    POINTS_PER_WORD: 100,
    HINT_BASE_MULTIPLIER: 2, // el costo se duplica en cada pista usada

    LEVELS: [
        {
            name: 'Ajedrez básico',
            wordsPerGame: 4,
            illumination: 'full',   // casillas válidas bien iluminadas
            hintBaseCost: 50,
            pool: ['CABALLO','ALFIL','TORRE','REINA','REY','PEON','JAQUE','MATE',
                   'TABLERO','ENROQUE','CAPTURA','GAMBITO','ELO','FIDE','RELOJ',
                   'BLANCAS','NEGRAS','PIEZA','ESCAQUE','BANDO','TURNO',
                   'COLUMNA','DIAGONAL','FLANCOS']
        },
        {
            name: 'Conceptos',
            wordsPerGame: 5,
            illumination: 'full',
            hintBaseCost: 50,
            pool: ['ESTRATEGIA','TACTICA','APERTURA','MEDIOJUEGO','DEFENSA',
                   'ATAQUE','POSICION','VENTAJA','SACRIFICIO','VARIANTE',
                   'BLITZ','RAPID','FIANCHETO','MOVILIDAD','ESTRUCTURA',
                   'ESPACIO','TIEMPO','PROFILAXIS','ACTIVIDAD','DINAMICO',
                   'DEBILIDAD','INICIATIVA']
        },
        {
            name: 'Jaques mate',
            wordsPerGame: 6,
            illumination: 'full',
            hintBaseCost: 50,
            pool: ['PASTOR','LEGAL','ANASTASIA','LOCO','BODEN','MORPHY',
                   'PASILLO','OPERA','GRECO','DAMIANO','PHILIDOR','PILLSBURY',
                   'LOLLI','ARABIAN','EPAULETTE','ESPEJO','AHOGADO','BESO',
                   'BLACKBURNE','CORRIDOR','INDIAN','COZIO']
        },
        {
            name: 'Campeones del mundo',
            wordsPerGame: 6,
            illumination: 'border', // solo borde, sin relleno
            hintBaseCost: 100,
            pool: [
                'STEINITZ','LASKER','CAPABLANCA','ALEKHINE','EUWE','BOTVINNIK',
                'SMYSLOV','TAL','PETROSIAN','SPASSKY','FISCHER','KARPOV',
                'KASPAROV','KRAMNIK','ANAND','CARLSEN','DING','GUKESH',
                'KHALIFMAN','PONOMARIOV','KASIMDZHANOV','TOPALOV',
                'GRISCHUK','ABDUSATTOROV','NEPOMNIACHTCHI',
                'MENCHIK','RUDENKO','BYKOVA','RUBTSOVA',
                'GAPRINDASHVILI','CHIBURDANIDZE',
                'XIEJUN','POLGAR','ZHUCHEN','STEFANOVA','YUHUA',
                'KOSTENIUK','YIFAN','USHENINA','MUZYCHUK','ZHONGYI','WENJUN'
            ]
        },
        {
            name: 'Tácticas',
            wordsPerGame: 7,
            illumination: 'border',
            hintBaseCost: 100,
            pool: ['HORQUILLA','CLAVADA','ENFILADA','ZUGZWANG','BLOQUEO',
                   'DEFLEXION','ATRACCION','SOBRECARGA','BATERIA','TRAMPA',
                   'CELADA','RUPTURA','DOMINACION','TEMPO','CLAVO',
                   'AMENAZA','INVASION','PALANCA','APOYO','RAYOS']
        },
        {
            name: 'Animales',
            wordsPerGame: 7,
            illumination: 'border',
            hintBaseCost: 100,
            pool: ['TIGRE','AGUILA','JIRAFA','ELEFANTE','DELFIN','PINGUINO',
                   'COCODRILO','SERPIENTE','MARIPOSA','CANGURO','CAMELLO',
                   'HIPOPOTAMO','GORILA','LEON','PANDA','GUEPARDO','LOBO',
                   'ZORRO','PULPO','BALLENA','TIBURON','ORCA','CONDOR',
                   'TORTUGA','JAGUAR','LEOPARDO']
        },
        {
            name: 'Países',
            wordsPerGame: 8,
            illumination: 'none',   // sin iluminación de casillas válidas
            hintBaseCost: 150,
            pool: ['ARGENTINA','RUSIA','NORUEGA','ALEMANIA','ESPANA','FRANCIA',
                   'ITALIA','BRASIL','CHINA','INDIA','JAPON','HOLANDA',
                   'AUSTRALIA','CANADA','HUNGRIA','GEORGIA','ARMENIA',
                   'UCRANIA','POLONIA','CUBA','IRAN','TURQUIA','SUECIA',
                   'DINAMARCA','ISLANDIA']
        },
        {
            name: 'Deportes',
            wordsPerGame: 8,
            illumination: 'none',
            hintBaseCost: 150,
            pool: ['TENIS','NATACION','ATLETISMO','FUTBOL','CICLISMO','VOLEIBOL',
                   'BALONCESTO','GIMNASIA','BOXEO','SURF','GOLF','RUGBY',
                   'BEISBOL','HOCKEY','REMO','ESGRIMA','JUDO','KARATE',
                   'ARQUERIA','LUCHA','TRIATLON','VELA','ESCALADA']
        }
    ]
};

// Game State
let gameState = {
    board: [],
    currentWordList: [],
    targetWords: [],
    wordPaths: {},
    foundPaths: [],
    selectedPath: [],
    score: 0,
    totalScore: 0,          // acumulado entre niveles
    currentLevelIndex: 0,   // índice 0-based en CONFIG.LEVELS
    hintsUsedThisGame: 0,   // para calcular costo exponencial
    timer: 0,
    totalTime: 0,           // acumulado entre niveles (no resetea al pasar de nivel)
    timerInterval: null,
    timerStarted: false,
    lives: 5,
    livesActive: false,
    hoveredWord: null,
    gameStatus: 'playing',
    isDragging: false,
    hintCell: null
};

// DOM Elements
const elements = {
    gameBoard: null,
    wordList: null,
    scoreDisplay: null,
    timerDisplay: null,
    wordsFound: null,
    currentSelection: null,
    hintCost: null,
    levelDisplay: null,
    resetBtn: null,
    hintBtn: null,
    helpBtn: null,
    closeHelpBtn: null,
    closeHelpBtn2: null,
    closeVictoryBtn: null,
    victoryModal: null,
    helpModal: null,
    nextLevelBtn: null,
    submitScoreBtn: null,
    modalTime: null,
    modalScore: null,
    livesDisplay: null,
    livesDisplayDesktop: null,
    hintBtnDesktop: null,
    undoBtnDesktop: null,
    levelWarning: null,
    gameOverModal: null,
    gameOverRestartBtn: null
};

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    // Recuperar nivel guardado
    const saved = parseInt(localStorage.getItem('criptosopa_level') || '0');
    gameState.currentLevelIndex = Math.min(Math.max(saved, 0), CONFIG.LEVELS.length - 1);

    initializeDOM();
    setupEventListeners();
    startNewGame();
    setTimeout(showTutorial, 600);
});

// Initialize DOM references
function initializeDOM() {
    elements.gameBoard = document.getElementById('gameBoard');
    elements.wordList = document.getElementById('wordList');
    elements.scoreDisplay = document.getElementById('scoreDisplay');
    elements.timerDisplay = document.getElementById('timerDisplay');
    elements.wordsFound = document.getElementById('wordsFound');
    elements.currentSelection = document.getElementById('currentSelection');
    elements.hintCost    = document.getElementById('hintCost');
    elements.levelDisplay = document.getElementById('levelDisplay');
    elements.resetBtn = document.getElementById('resetBtn');
    elements.hintBtn = document.getElementById('hintBtn');
    elements.helpBtn = document.getElementById('helpBtn');
    elements.closeHelpBtn = document.getElementById('closeHelpBtn');
    elements.closeHelpBtn2 = document.getElementById('closeHelpBtn2');
    elements.closeVictoryBtn = document.getElementById('closeVictoryBtn');
    elements.victoryModal = document.getElementById('victoryModal');
    elements.helpModal = document.getElementById('helpModal');
    elements.nextLevelBtn = document.getElementById('nextLevelBtn');
    elements.submitScoreBtn = document.getElementById('submitScoreBtn');
    elements.modalTime = document.getElementById('modalTime');
    elements.modalScore = document.getElementById('modalScore');
    elements.livesDisplay = document.getElementById('livesDisplay');
    elements.livesDisplayDesktop = document.getElementById('livesDisplayDesktop');
    elements.hintBtnDesktop = document.getElementById('hintBtnDesktop');
    elements.undoBtnDesktop = document.getElementById('undoBtnDesktop');
    elements.levelWarning = document.getElementById('levelWarning');
    elements.gameOverModal = document.getElementById('gameOverModal');
    elements.gameOverRestartBtn = document.getElementById('gameOverRestartBtn');
}

// Setup event listeners
function setupEventListeners() {
    elements.resetBtn?.addEventListener('click', startNewGame);
    elements.hintBtn?.addEventListener('click', showHint);
    elements.helpBtn?.addEventListener('click', () => showHelpModal(true));
    elements.closeHelpBtn?.addEventListener('click', () => showHelpModal(false));
    elements.closeHelpBtn2?.addEventListener('click', () => showHelpModal(false));
    elements.closeVictoryBtn?.addEventListener('click', () => closeVictoryModal());
    elements.nextLevelBtn?.addEventListener('click', nextLevel);
    elements.submitScoreBtn?.addEventListener('click', submitScore);
    elements.gameOverRestartBtn?.addEventListener('click', gameOverRestart);

    // Global mouseup to stop dragging
    document.addEventListener('mouseup', () => {
        gameState.isDragging = false;
    });

    // Stop dragging when mouse leaves the window
    document.addEventListener('mouseleave', () => {
        gameState.isDragging = false;
    });

    // Touch drag: arrastrar el dedo para seleccionar letras (equivalente al mousemove desktop)
    initTouchDrag();
}

// Celda procesada por touchstart — el touchmove la ignora brevemente
// (previene que el temblor del dedo deshaga el deselect o re-agregue la celda)
let _touchStartCell = null;
let _touchStartTime  = 0;

// Último click para detección de doble click
let _lastClickR = -1;
let _lastClickC = -1;
let _lastClickTime = 0;
const DOUBLE_CLICK_MS = 350;

function initTouchDrag() {
    const board = elements.gameBoard;
    if (!board) return;

    let lastTouchCell = null;

    board.addEventListener('touchmove', (e) => {
        if (!gameState.isDragging) return;
        e.preventDefault();

        const touch = e.touches[0];
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        if (!el) return;

        const cellEl = el.closest('[data-row]');
        if (!cellEl) return;

        const r = parseInt(cellEl.dataset.row);
        const c = parseInt(cellEl.dataset.col);
        if (isNaN(r) || isNaN(c)) return;

        // Ignorar la celda que acaba de procesar touchstart durante 220ms
        // (evita que el temblor del dedo deshaga un deselect recién hecho)
        if (_touchStartCell &&
            _touchStartCell.r === r &&
            _touchStartCell.c === c &&
            Date.now() - _touchStartTime < 220) return;

        // No procesar la misma celda dos veces seguidas
        if (lastTouchCell && lastTouchCell.r === r && lastTouchCell.c === c) return;
        lastTouchCell = { r, c };

        if (gameState.selectedPath.some(p => p.r === r && p.c === c)) return;

        handleCellClick(r, c);
    }, { passive: false });

    const stopDrag = () => {
        gameState.isDragging = false;
        lastTouchCell = null;
    };
    board.addEventListener('touchend',   stopDrag, { passive: true });
    board.addEventListener('touchcancel', stopDrag, { passive: true });
}

// Start new game. resetTotal=true when starting from scratch (resets totalTime).
function startNewGame(resetTotal = true) {
    if (resetTotal) { gameState.totalTime = 0; gameState.totalScore = 0; gameState.lives = 5; }
    gameState.score = 0;
    gameState.foundPaths = [];
    gameState.selectedPath = [];
    gameState.wordPaths = {};
    gameState.gameStatus = 'playing';
    gameState.hoveredWord = null;
    gameState.hintsUsedThisGame = 0;

    const keepTimer = gameState.timerStarted;
    console.log(`[TIMER] startNewGame resetTotal=${resetTotal} keepTimer=${keepTimer} timer=${gameState.timer}`);
    clearInterval(gameState.timerInterval);
    if (keepTimer) {
        gameState.timerInterval = setInterval(() => {
            gameState.timer++;
            updateTimerDisplay();
        }, 10);
    } else {
        gameState.timer = 0;
        gameState.timerStarted = false;
        updateTimerDisplay(); // ← bug: sin esto el DOM mostraba el tiempo anterior
    }
    console.log(`[TIMER] after reset: timer=${gameState.timer} timerStarted=${gameState.timerStarted}`);

    const levelConfig = CONFIG.LEVELS[gameState.currentLevelIndex];
    gameState.livesActive = levelConfig.illumination === 'none';

    gameState.board = createEmptyBoard();
    gameState.currentWordList = [...levelConfig.pool];
    placeWords(levelConfig.wordsPerGame);
    fillRandomLetters();

    renderBoard();
    renderWordList();
    updateDisplay();
    updateHintButton();
    updateSelectionText();
    updateUndoButton();
    renderLives();

    if (gameState.livesActive) {
        setTimeout(() => showLevelWarning(), 150);
    }

    setTimeout(() => wordMarquee.start(), 150);
}

// Next level
function nextLevel() {
    gameState.totalTime += gameState.timer;
    gameState.totalScore += gameState.score;
    gameState.timerStarted = false; // timer del nuevo nivel empieza en 0 al primer click
    const maxIdx = CONFIG.LEVELS.length - 1;
    if (gameState.currentLevelIndex < maxIdx) {
        gameState.currentLevelIndex++;
        localStorage.setItem('criptosopa_level', gameState.currentLevelIndex);
    }
    closeVictoryModal();
    startNewGame(false);
}

// Create empty board
function createEmptyBoard() {
    return Array(CONFIG.BOARD_SIZE).fill(null).map(() =>
        Array(CONFIG.BOARD_SIZE).fill('')
    );
}

// Check if move is valid knight move
function isKnightMove(r1, c1, r2, c2) {
    const dr = Math.abs(r1 - r2);
    const dc = Math.abs(c1 - c2);
    return (dr === 2 && dc === 1) || (dr === 1 && dc === 2);
}

// Place words on board
function placeWords(wordsPerGame) {
    const selectedWords = [];
    const shuffled = [...gameState.currentWordList].sort(() => 0.5 - Math.random());

    for (const word of shuffled) {
        if (selectedWords.length >= wordsPerGame) break;
        if (placeWord(word)) {
            selectedWords.push(word);
        }
    }

    gameState.targetWords = selectedWords;
}

// Place single word on board (avoid sharing cells if possible)
function placeWord(word) {
    const maxAttempts = 200; // Increased attempts to find non-overlapping position

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const r = Math.floor(Math.random() * CONFIG.BOARD_SIZE);
        const c = Math.floor(Math.random() * CONFIG.BOARD_SIZE);

        if (gameState.board[r][c] !== '') continue;

        const path = [{ r, c }];
        const tempBoard = JSON.parse(JSON.stringify(gameState.board));

        let placed = true;
        let hasOverlap = false;

        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            const pos = path[i];

            // Check if cell is empty
            if (tempBoard[pos.r][pos.c] === '') {
                tempBoard[pos.r][pos.c] = char;
            } else if (tempBoard[pos.r][pos.c] === char) {
                // Allow overlap if same letter (rare case)
                hasOverlap = true;
            } else {
                // Different letter already there - can't place
                placed = false;
                break;
            }

            // Find next position (if not last letter)
            if (i < word.length - 1) {
                const validMoves = getValidKnightMoves(pos.r, pos.c, tempBoard, path);

                if (validMoves.length === 0) {
                    placed = false;
                    break;
                }

                const nextMove = validMoves[Math.floor(Math.random() * validMoves.length)];
                path.push(nextMove);
            }
        }

        // Prefer placements without overlap, but allow if necessary after many attempts
        if (placed && (!hasOverlap || attempt > 150)) {
            // Apply to actual board
            for (let i = 0; i < word.length; i++) {
                gameState.board[path[i].r][path[i].c] = word[i];
            }
            // Store the path for this word
            gameState.wordPaths[word] = path;
            console.log(`[PLACE WORD] "${word}" placed at path:`, path);
            return true;
        }
    }

    return false;
}

// Get valid knight moves from position
function getValidKnightMoves(r, c, board, excludePath = []) {
    const moves = [
        { r: r - 2, c: c - 1 }, { r: r - 2, c: c + 1 },
        { r: r - 1, c: c - 2 }, { r: r - 1, c: c + 2 },
        { r: r + 1, c: c - 2 }, { r: r + 1, c: c + 2 },
        { r: r + 2, c: c - 1 }, { r: r + 2, c: c + 1 }
    ];

    return moves.filter(m =>
        m.r >= 0 && m.r < CONFIG.BOARD_SIZE &&
        m.c >= 0 && m.c < CONFIG.BOARD_SIZE &&
        board[m.r][m.c] === '' &&
        !excludePath.some(p => p.r === m.r && p.c === m.c)
    );
}

// Fill empty cells with random letters
function fillRandomLetters() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let r = 0; r < CONFIG.BOARD_SIZE; r++) {
        for (let c = 0; c < CONFIG.BOARD_SIZE; c++) {
            if (gameState.board[r][c] === '') {
                gameState.board[r][c] = letters[Math.floor(Math.random() * letters.length)];
            }
        }
    }
}

// Handle cell click
function handleCellClick(r, c) {
    if (gameState.gameStatus !== 'playing') return;

    // Arrancar el timer con el primer click
    if (!gameState.timerStarted) {
        gameState.timerStarted = true;
        startTimer();
    }

    // Doble click sobre la primera celda seleccionada → limpiar todo sin costo
    const now = Date.now();
    const isDoubleClick = (now - _lastClickTime < DOUBLE_CLICK_MS && _lastClickR === r && _lastClickC === c);
    _lastClickR = r; _lastClickC = c; _lastClickTime = now;

    if (isDoubleClick && gameState.selectedPath.length > 0) {
        const first = gameState.selectedPath[0];
        if (first.r === r && first.c === c) {
            if (gameState.livesActive && gameState.selectedPath.length > 1) {
                // Con vidas: deja solo la primera celda (el jugador decide si la abandona)
                gameState.selectedPath = [first];
            } else {
                // Sin vidas (o path ya era 1): limpia todo
                gameState.selectedPath = [];
            }
            playCellDeselectSound();
            renderBoard();
            updateSelectionText();
            updateUndoButton();
            updateKnightPosition();
            return;
        }
    }

    // First click
    if (gameState.selectedPath.length === 0) {
        gameState.selectedPath.push({ r, c });
        playCellClickSound();
        renderBoard();
        updateSelectionText();
        updateKnightPosition();
        return;
    }

    const lastPos = gameState.selectedPath[gameState.selectedPath.length - 1];

    // Click on same cell (deselect last)
    if (lastPos.r === r && lastPos.c === c) {
        if (gameState.selectedPath.length === 1 && gameState.livesActive) {
            loseLife();
            return;
        }
        gameState.selectedPath.pop();
        playCellDeselectSound();
        renderBoard();
        updateSelectionText();
        updateKnightPosition();
        return;
    }

    // Check if valid knight move
    if (!isKnightMove(lastPos.r, lastPos.c, r, c)) return;

    // Check if not already in path
    if (gameState.selectedPath.some(p => p.r === r && p.c === c)) return;

    // Add to path
    const newPath = [...gameState.selectedPath, { r, c }];
    const currentWord = newPath.map(p => gameState.board[p.r][p.c]).join('');
    const reversedWord = currentWord.split('').reverse().join('');

    // Acepta la palabra en cualquier dirección
    const matchedWord = gameState.targetWords.includes(currentWord) ? currentWord
                      : gameState.targetWords.includes(reversedWord) ? reversedWord
                      : null;

    // Check if word is complete
    if (matchedWord) {
        if (!gameState.foundPaths.some(fp => fp.word === matchedWord)) {
            const color = CONFIG.NEON_COLORS[gameState.foundPaths.length % CONFIG.NEON_COLORS.length];

            const foundPath = [...newPath]; // capturar antes de que cambie

            gameState.foundPaths.push({
                word: matchedWord,
                path: newPath,
                color: color
            });

            console.log(`[WORD FOUND] "${matchedWord}" with path:`,
                newPath.map(p => `(${p.r},${p.c})=${gameState.board[p.r][p.c]}`).join(' -> '));

            gameState.selectedPath = [];
            gameState.isDragging = false; // evitar que touchmove re-seleccione la última celda
            gameState.score += CONFIG.POINTS_PER_WORD;

            // Sprint 1: feedback al encontrar palabra
            if (navigator.vibrate) navigator.vibrate(100);
            playWordFoundSound();
            setTimeout(() => flashFoundWordCells(foundPath, color), 50);

            // Check win condition
            if (gameState.foundPaths.length === gameState.targetWords.length) {
                wordMarquee.stop();
                winGame();
            } else {
                // Detener marquee viejo de inmediato y reconstruir con palabras restantes
                wordMarquee.stop();
                setTimeout(() => wordMarquee.start(), 200);
            }
        }
    } else {
        // Sin límite de longitud — el jugador puede explorar hasta las 64 celdas
        // (cada celda solo puede estar una vez en el path, el check ya está arriba)
        gameState.selectedPath = newPath;
        playCellClickSound();
    }

    renderBoard();
    renderWordList();
    updateSelectionText();
    updateDisplay();
    updateHintButton();
    updateUndoButton();
    updateKnightPosition();
}

// Show hint — costo exponencial: baseCost * 2^hintsUsed
function showHint() {
    console.log('[HINT] Button clicked');

    const levelConfig = CONFIG.LEVELS[gameState.currentLevelIndex];
    const cost = levelConfig.hintBaseCost * Math.pow(CONFIG.HINT_BASE_MULTIPLIER, gameState.hintsUsedThisGame);

    if (gameState.score < cost) {
        elements.hintBtn?.classList.add('board-shake');
        setTimeout(() => elements.hintBtn?.classList.remove('board-shake'), 500);
        return;
    }

    const missingWords = gameState.targetWords.filter(w =>
        !gameState.foundPaths.some(fp => fp.word === w)
    );

    console.log('[HINT] Missing words:', missingWords);
    console.log('[HINT] Found paths:', gameState.foundPaths);

    if (missingWords.length === 0) {
        console.log('[HINT] No missing words!');
        return;
    }

    // Shake the board
    if (elements.gameBoard) {
        elements.gameBoard.classList.add('board-shake');
        setTimeout(() => elements.gameBoard.classList.remove('board-shake'), 500);
    }

    // Find a missing word in the board
    const wordToHint = missingWords[0];
    console.log('[HINT] Looking for word:', wordToHint);

    const startPos = findWordStart(wordToHint);
    console.log('[HINT] Start position found:', startPos);

    if (startPos) {
        // Store hint cell in gameState so it survives re-renders
        gameState.hintCell = {
            r: startPos.r,
            c: startPos.c,
            endTime: Date.now() + 3000 // Flash for 3 seconds
        };

        console.log(`[HINT] Showing first letter of "${wordToHint}" at (${startPos.r},${startPos.c}) = ${gameState.board[startPos.r][startPos.c]}`);
        console.log('[HINT] hintCell stored:', gameState.hintCell);

        gameState.hintsUsedThisGame++;
        gameState.score = Math.max(0, gameState.score - cost);
        updateDisplay();
        updateHintButton();
        renderBoard();

        // Auto-clear hint after 3 seconds
        setTimeout(() => {
            gameState.hintCell = null;
            renderBoard();
        }, 3000);
    } else {
        console.log('[HINT] ERROR: Could not find start position for word:', wordToHint);
    }
}

// Find word start position
function findWordStart(word) {
    // Use stored path if available
    if (gameState.wordPaths[word] && gameState.wordPaths[word].length > 0) {
        const startPos = gameState.wordPaths[word][0];
        console.log(`[FIND WORD] Found "${word}" in stored paths at (${startPos.r},${startPos.c})`);
        return startPos;
    }

    // Fallback: search the board (shouldn't happen normally)
    console.log(`[FIND WORD] WARNING: "${word}" not in stored paths, searching board...`);
    for (let r = 0; r < CONFIG.BOARD_SIZE; r++) {
        for (let c = 0; c < CONFIG.BOARD_SIZE; c++) {
            if (gameState.board[r][c] === word[0]) {
                // Try to trace the word
                if (canTraceWord(word, r, c)) {
                    return { r, c };
                }
            }
        }
    }
    return null;
}

// Check if word can be traced from position
function canTraceWord(word, startR, startC) {
    const path = [{ r: startR, c: startC }];

    for (let i = 1; i < word.length; i++) {
        const validNext = getValidKnightMoves(
            path[i - 1].r,
            path[i - 1].c,
            gameState.board,
            path
        ).filter(m => gameState.board[m.r][m.c] === word[i]);

        if (validNext.length === 0) return false;
        path.push(validNext[0]);
    }

    return true;
}

// Render board
function renderBoard() {
    if (!elements.gameBoard) return;

    // Check if we need to recreate the board or just update styles
    const shouldRecreate = elements.gameBoard.children.length === 0;

    if (shouldRecreate) {
        elements.gameBoard.innerHTML = '';
    }

    for (let r = 0; r < CONFIG.BOARD_SIZE; r++) {
        for (let c = 0; c < CONFIG.BOARD_SIZE; c++) {
            let cell;

            if (shouldRecreate) {
                cell = document.createElement('div');
                cell.className = 'board-cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
            } else {
                // Find existing cell and clear its styles/classes
                const cellIndex = r * CONFIG.BOARD_SIZE + c;
                cell = elements.gameBoard.children[cellIndex];
                if (!cell) continue;

                // Reset cell styles
                cell.className = 'board-cell';
                cell.style.cssText = '';

                // Remove all children except the text node (letter)
                while (cell.children.length > 0) {
                    cell.removeChild(cell.children[0]);
                }
            }

            let isSelected = false;
            let isFound = false;
            let foundData = null;
            let foundIndex = -1;

            // Check if selected
            const selIdx = gameState.selectedPath.findIndex(p => p.r === r && p.c === c);
            if (selIdx !== -1) {
                isSelected = true;
                cell.classList.add('cell-selected');

                const badge = document.createElement('div');
                badge.className = 'step-badge badge-selected';
                badge.textContent = selIdx + 1;
                cell.appendChild(badge);
            }

            // Check if found (only if not selected)
            const foundDataArray = [];
            if (!isSelected) {
                for (let i = 0; i < gameState.foundPaths.length; i++) {
                    const fp = gameState.foundPaths[i];
                    const pIdx = fp.path.findIndex(p => p.r === r && p.c === c);
                    if (pIdx !== -1) {
                        foundDataArray.push({
                            word: fp.word,
                            color: fp.color,
                            index: pIdx
                        });
                    }
                }
                isFound = foundDataArray.length > 0;

                // Debug: Log shared cells
                if (foundDataArray.length > 1) {
                    console.log(`[SHARED CELL] (${r},${c}) Letter: ${gameState.board[r][c]}`,
                        foundDataArray.map(fd => `${fd.word}[${fd.index}]`).join(' + '));
                }
            }

            // Apply found styles
            if (isFound && foundDataArray.length > 0) {
                cell.classList.add('cell-found');

                // Check if a specific word is being hovered
                const hoveredWordData = foundDataArray.find(fd => fd.word === gameState.hoveredWord);

                // Multiple words share this cell
                if (foundDataArray.length > 1) {
                    // If hovering over a word that uses this cell, show only that word's color
                    if (hoveredWordData) {
                        // Single color override for hovered word
                        cell.style.background = hoveredWordData.color.hex;
                        cell.style.border = `3px solid ${hoveredWordData.color.hex}`;
                        cell.style.color = 'white';
                        cell.style.fontWeight = 'bold';
                        cell.style.textShadow = `0 0 10px ${hoveredWordData.color.hex}`;
                        cell.style.boxShadow = hoveredWordData.color.glow;
                        cell.classList.add('cell-wave');
                        cell.style.animationDelay = `${hoveredWordData.index * 0.5}s`;
                    } else {
                        // Normal state: show diagonal split of all colors
                        const numWords = foundDataArray.length;
                        let backgroundGradient;

                        if (numWords === 2) {
                            // Diagonal split: top-left = color1, bottom-right = color2
                            backgroundGradient = `linear-gradient(135deg, ${foundDataArray[0].color.hex} 0%, ${foundDataArray[0].color.hex} 50%, ${foundDataArray[1].color.hex} 50%, ${foundDataArray[1].color.hex} 100%)`;
                        } else if (numWords === 3) {
                            // Three-way split: top-left, top-right, bottom
                            backgroundGradient = `linear-gradient(135deg, ${foundDataArray[0].color.hex} 0%, ${foundDataArray[0].color.hex} 33%, ${foundDataArray[1].color.hex} 33%, ${foundDataArray[1].color.hex} 66%, ${foundDataArray[2].color.hex} 66%, ${foundDataArray[2].color.hex} 100%)`;
                        } else {
                            // Four or more: quarters
                            backgroundGradient = `linear-gradient(135deg, ${foundDataArray[0].color.hex} 0%, ${foundDataArray[0].color.hex} 25%, ${foundDataArray[1].color.hex} 25%, ${foundDataArray[1].color.hex} 50%, ${foundDataArray[2].color.hex} 50%, ${foundDataArray[2].color.hex} 75%, ${foundDataArray[3]?.color.hex || foundDataArray[0].color.hex} 75%, ${foundDataArray[3]?.color.hex || foundDataArray[0].color.hex} 100%)`;
                        }

                        cell.style.background = backgroundGradient;
                        cell.style.border = '3px solid white';
                        cell.style.color = 'white';
                        cell.style.fontWeight = 'bold';

                        // Combine text shadows from all colors
                        const textShadows = foundDataArray.map(fd => `0 0 10px ${fd.color.hex}`).join(', ');
                        cell.style.textShadow = textShadows;
                    }

                    // Create badges - if hovering, show only the hovered word's badge
                    if (hoveredWordData) {
                        // Show only the badge for the hovered word
                        const badge = document.createElement('div');
                        badge.className = 'step-badge badge-found';
                        badge.style.position = 'absolute';
                        badge.style.backgroundColor = hoveredWordData.color.hex;
                        badge.style.color = 'black';
                        badge.style.fontSize = '0.6rem';
                        badge.style.width = '18px';
                        badge.style.height = '18px';
                        badge.style.border = '2px solid white';
                        badge.style.top = '-6px';
                        badge.style.right = '-6px';
                        badge.textContent = hoveredWordData.index + 1;
                        cell.appendChild(badge);
                    } else {
                        // Show all badges in corners matching color zones
                        const cornerPositionsMap = {
                            2: [
                                { top: '-6px', left: '-6px' },      // word 0: top-left (matches top-left color)
                                { bottom: '-6px', right: '-6px' }   // word 1: bottom-right (matches bottom-right color)
                            ],
                            3: [
                                { top: '-6px', left: '-6px' },      // word 0
                                { top: '-6px', right: '-6px' },     // word 1
                                { bottom: '-6px', right: '-6px' }   // word 2
                            ],
                            4: [
                                { top: '-6px', left: '-6px' },      // word 0
                                { top: '-6px', right: '-6px' },     // word 1
                                { bottom: '-6px', left: '-6px' },   // word 2
                                { bottom: '-6px', right: '-6px' }   // word 3
                            ]
                        };

                        const positions = cornerPositionsMap[foundDataArray.length] || cornerPositionsMap[4];

                        foundDataArray.forEach((fd, idx) => {
                            const badge = document.createElement('div');
                            badge.className = 'step-badge badge-found';
                            badge.style.position = 'absolute';
                            badge.style.backgroundColor = fd.color.hex;
                            badge.style.color = 'black';
                            badge.style.fontSize = '0.6rem';
                            badge.style.width = '18px';
                            badge.style.height = '18px';
                            badge.style.border = '2px solid white';
                            badge.textContent = fd.index + 1;

                            // Position in corners matching color zones
                            Object.assign(badge.style, positions[idx]);

                            cell.appendChild(badge);
                        });
                    }
                } else {
                    // Single word (original behavior)
                    const fd = foundDataArray[0];
                    cell.style.borderColor = fd.color.hex;
                    cell.style.color = fd.color.hex;
                    cell.style.textShadow = `0 0 10px ${fd.color.hex}`;
                    cell.style.boxShadow = fd.color.glow;

                    // Wave animation on hover
                    if (gameState.hoveredWord === fd.word) {
                        cell.classList.add('cell-wave');
                        cell.style.animationDelay = `${fd.index * 0.5}s`;
                    }

                    const badge = document.createElement('div');
                    badge.className = 'step-badge badge-found';
                    badge.style.backgroundColor = fd.color.hex;
                    badge.textContent = fd.index + 1;
                    cell.appendChild(badge);
                }
            }

            // Check if this is the hint cell (word start being hinted)
            const isHintCell = gameState.hintCell &&
                gameState.hintCell.r === r &&
                gameState.hintCell.c === c &&
                Date.now() < gameState.hintCell.endTime;

            if (isHintCell) {
                console.log(`[RENDER HINT] Cell (${r},${c}) is the hint cell!`);
                // Clear the hint if time expired
                if (Date.now() >= gameState.hintCell.endTime) {
                    console.log('[RENDER HINT] Hint time expired, clearing');
                    gameState.hintCell = null;
                } else {
                    // Apply hint flash animation
                    console.log('[RENDER HINT] Applying cell-hint-flash class');
                    cell.classList.add('cell-hint-flash');
                }
            }

            // Check if hint cell (available next move)
            const illumination = CONFIG.LEVELS[gameState.currentLevelIndex].illumination;
            if (!isSelected && !isFound && !isHintCell && gameState.selectedPath.length > 0 && illumination !== 'none') {
                const last = gameState.selectedPath[gameState.selectedPath.length - 1];
                if (isKnightMove(last.r, last.c, r, c) &&
                    !gameState.selectedPath.some(p => p.r === r && p.c === c)) {
                    cell.classList.add('cell-hint');
                    if (illumination === 'border') cell.classList.add('cell-hint-border');
                }
            }

            // Default state
            if (!isSelected && !isFound && !isHintCell && !cell.classList.contains('cell-hint')) {
                cell.classList.add('cell-default');
            }

            // Set letter (only when recreating or as first child)
            if (shouldRecreate) {
                const letter = document.createTextNode(gameState.board[r][c]);
                cell.appendChild(letter);
            } else {
                // Update existing letter text if needed
                if (cell.firstChild && cell.firstChild.nodeType === Node.TEXT_NODE) {
                    cell.firstChild.textContent = gameState.board[r][c];
                } else {
                    const letter = document.createTextNode(gameState.board[r][c]);
                    cell.insertBefore(letter, cell.firstChild);
                }
            }

            // Only add event listeners when creating new cells
            if (shouldRecreate) {
                // Drag events (handles both click and drag)
                cell.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    gameState.isDragging = true;
                    handleCellClick(r, c);
                });

                cell.addEventListener('mouseenter', () => {
                    if (gameState.isDragging) {
                        handleCellClick(r, c);
                    }
                });

                // Touch: inicio del arrastre en esta celda
                cell.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    gameState.isDragging = true;
                    // Registrar qué celda tocó touchstart para que touchmove la ignore brevemente
                    _touchStartCell = { r, c };
                    _touchStartTime  = Date.now();
                    handleCellClick(r, c);
                }, { passive: false });

                elements.gameBoard.appendChild(cell);
            }
        }
    }
}

// Render word list
function renderWordList() {
    if (!elements.wordList) return;

    elements.wordList.innerHTML = '';

    gameState.targetWords.forEach(word => {
        const foundData = gameState.foundPaths.find(fp => fp.word === word);
        const li = document.createElement('li');

        li.className = `word-item ${foundData ? 'word-found' : 'word-default'}`;

        if (foundData) {
            li.style.borderColor = foundData.color.hex;
            li.style.boxShadow = `inset 0 0 10px ${foundData.color.hex}20`;

            li.addEventListener('mouseenter', () => {
                gameState.hoveredWord = word;
                renderBoard();
            });
            li.addEventListener('mouseleave', () => {
                gameState.hoveredWord = null;
                renderBoard();
            });

            li.innerHTML = `
                <span>${word}</span>
                <span class="word-badge" style="background-color:${foundData.color.hex}">OK</span>
            `;
        } else {
            li.innerHTML = `
                <span>${word}</span>
                <div class="word-dot"></div>
            `;
        }

        elements.wordList.appendChild(li);
    });
}

// Update selection text
// Si hay selección activa: muestra las letras seleccionadas.
// Si no hay selección: muestra la próxima palabra a buscar como guía.
function updateSelectionText() {
    if (!elements.currentSelection) return;

    if (gameState.selectedPath.length > 0) {
        // Letras que el jugador va seleccionando — suspender marquee
        wordMarquee.suspend();
        const text = gameState.selectedPath.map(p => gameState.board[p.r][p.c]).join('');
        elements.currentSelection.textContent = text;
        elements.currentSelection.removeAttribute('data-hint');
        elements.currentSelection.style.color = '';
        elements.currentSelection.style.textShadow = '';
    } else {
        // Sin selección activa — reanudar marquee si no está congelado
        wordMarquee.unsuspend();

        // Fallback estático: cuando marquee está congelado o hay una sola palabra
        if (!wordMarquee.isRunning) {
            const nextWord = gameState.targetWords.find(
                w => !gameState.foundPaths.some(fp => fp.word === w)
            );
            if (nextWord) {
                const nextColor = CONFIG.NEON_COLORS[gameState.foundPaths.length % CONFIG.NEON_COLORS.length];
                elements.currentSelection.textContent = nextWord;
                elements.currentSelection.setAttribute('data-hint', 'true');
                elements.currentSelection.style.color = nextColor.hex;
                elements.currentSelection.style.textShadow = nextColor.glow;
            } else {
                elements.currentSelection.textContent = '';
                elements.currentSelection.removeAttribute('data-hint');
                elements.currentSelection.style.color = '';
                elements.currentSelection.style.textShadow = '';
            }
        }
    }
}

// Timer
function startTimer() {
    clearInterval(gameState.timerInterval);
    gameState.timer = 0;

    gameState.timerInterval = setInterval(() => {
        gameState.timer++;
        updateTimerDisplay();
    }, 10); // 10ms = centiseconds
}

function updateTimerDisplay() {
    if (!elements.timerDisplay) return;

    const totalSeconds = Math.floor(gameState.timer / 100);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    elements.timerDisplay.textContent =
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatTime(centiseconds) {
    const totalSeconds = Math.floor(centiseconds / 100);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    return hours > 0
        ? `${hours}:${mm}:${ss}`
        : `${mm}:${ss}`;
}

// Update display
function updateDisplay() {
    if (elements.scoreDisplay) {
        elements.scoreDisplay.textContent = gameState.score.toLocaleString();
    }
    if (elements.wordsFound) {
        elements.wordsFound.textContent =
            `${gameState.foundPaths.length}/${gameState.targetWords.length}`;
    }
    if (elements.levelDisplay) {
        const lvl = CONFIG.LEVELS[gameState.currentLevelIndex];
        elements.levelDisplay.textContent = `${gameState.currentLevelIndex + 1} — ${lvl.name}`;
    }
}

// Volver atrás un movimiento — solo disponible con path >= 2 celdas
function undoLastMove() {
    if (gameState.gameStatus !== 'playing') return;
    if (gameState.selectedPath.length <= 1) return; // no puede ir antes de la primera celda
    gameState.selectedPath.pop();
    playCellDeselectSound();
    renderBoard();
    updateSelectionText();
    updateKnightPosition();
    updateUndoButton();
}

// Habilita/deshabilita el botón ATRÁS desktop según el path actual
function updateUndoButton() {
    if (!elements.undoBtnDesktop) return;
    elements.undoBtnDesktop.disabled = gameState.selectedPath.length <= 1;
}

// Actualiza el botón de pista con el costo actual y lo habilita/deshabilita
function updateHintButton() {
    const levelConfig = CONFIG.LEVELS[gameState.currentLevelIndex];
    const cost = levelConfig.hintBaseCost * Math.pow(CONFIG.HINT_BASE_MULTIPLIER, gameState.hintsUsedThisGame);
    const canAfford = gameState.score >= cost;

    if (elements.hintCost) elements.hintCost.textContent = cost;
    if (elements.hintBtn) elements.hintBtn.disabled = !canAfford;

    // Botón desktop
    const hintCostDesktop = document.getElementById('hintCostDesktop');
    if (hintCostDesktop) hintCostDesktop.textContent = cost;
    if (elements.hintBtnDesktop) elements.hintBtnDesktop.disabled = !canAfford;
}

// Win game
function winGame() {
    gameState.gameStatus = 'won';
    clearInterval(gameState.timerInterval);

    // Feedback de victoria
    if (navigator.vibrate) navigator.vibrate([100, 60, 100, 60, 250]);
    playVictorySound();
    launchConfetti();

    // Esperar para que el jugador vea el tablero completo
    setTimeout(() => {
        showVictoryModal();
    }, 4000);
}

// ── Lives system ──────────────────────────────────────────────

function renderLives() {
    // Mobile: oculto si lives no están activas
    const el = elements.livesDisplay;
    if (el) {
        if (!gameState.livesActive) { el.style.display = 'none'; }
        else {
            el.style.display = 'flex';
            el.innerHTML = '';
            for (let i = 0; i < 5; i++) {
                const heart = document.createElement('span');
                heart.className = 'life-heart' + (i < gameState.lives ? '' : ' life-heart--lost');
                heart.textContent = '❤️';
                el.appendChild(heart);
            }
        }
    }

    // Desktop: siempre visible, activo o inactivo
    const desktopEl = elements.livesDisplayDesktop;
    if (desktopEl) {
        const heartsSpan = desktopEl.querySelector('.cs-side-hearts');
        if (heartsSpan) {
            if (!gameState.livesActive) {
                heartsSpan.innerHTML = '❤️❤️❤️❤️❤️';
                desktopEl.classList.add('cs-side-lives--inactive');
                desktopEl.classList.remove('cs-side-lives--active');
            } else {
                let html = '';
                for (let i = 0; i < 5; i++) {
                    html += i < gameState.lives
                        ? '<span class="cs-dh-heart">❤️</span>'
                        : '<span class="cs-dh-heart cs-dh-heart--lost">❤️</span>';
                }
                heartsSpan.innerHTML = html;
                desktopEl.classList.add('cs-side-lives--active');
                desktopEl.classList.remove('cs-side-lives--inactive');
            }
        }
    }
}

function showLevelWarning() {
    const el = elements.levelWarning;
    if (!el) return;
    const heartsEl = document.getElementById('levelWarningHearts');
    if (heartsEl) heartsEl.textContent = Array(gameState.lives).fill('❤️').join(' ');
    el.style.display = 'flex';
    // Bloquear el tablero mientras se muestra el aviso
    gameState.gameStatus = 'warning';
    const dismiss = () => {
        el.style.display = 'none';
        gameState.gameStatus = 'playing';
    };
    el.onclick = dismiss;
    setTimeout(dismiss, 3500);
}

function loseLife() {
    gameState.lives--;
    gameState.selectedPath = [];

    playLoseLifeSound();
    if (navigator.vibrate) navigator.vibrate([80, 40, 180]);

    // Flash rojo sobre el tablero
    const board = elements.gameBoard;
    if (board) {
        board.classList.add('board-life-lost');
        setTimeout(() => board.classList.remove('board-life-lost'), 600);
    }

    // Animar el corazón que se pierde (escala arriba antes de desaparecer)
    const hearts = elements.livesDisplay?.querySelectorAll('.life-heart');
    const dyingHeart = hearts?.[gameState.lives]; // índice = nuevas vidas (ya decrementado)
    if (dyingHeart) {
        dyingHeart.classList.add('life-heart--dying');
        setTimeout(() => {
            renderLives(); // ahora renderiza con el corazón ya perdido
        }, 400);
    } else {
        renderLives();
    }

    // Shake del display de vidas
    if (elements.livesDisplay) {
        elements.livesDisplay.classList.add('lives-shake');
        setTimeout(() => elements.livesDisplay?.classList.remove('lives-shake'), 500);
    }

    renderBoard();
    updateSelectionText();
    updateKnightPosition();

    if (gameState.lives <= 0) {
        setTimeout(() => showGameOverModal(), 700);
    }
}

function showGameOverModal() {
    gameState.gameStatus = 'gameover';
    elements.gameOverModal?.classList.add('active');
}

function gameOverRestart() {
    console.log(`[GAME OVER RESTART] timer=${gameState.timer} timerStarted=${gameState.timerStarted} antes de reset`);
    elements.gameOverModal?.classList.remove('active');
    gameState.currentLevelIndex = 0;
    gameState.timerStarted = false;
    localStorage.setItem('criptosopa_level', '0');
    startNewGame(true);
}

// ── Victory modal ──────────────────────────────────────────────

// Show victory modal
function showVictoryModal() {
    if (!elements.victoryModal) return;

    const modalTime       = document.getElementById('modalTime');
    const modalScore      = document.getElementById('modalScore');
    const modalTotalTime  = document.getElementById('modalTotalTime');
    const modalTotalScore = document.getElementById('modalTotalScore');

    if (modalTime)       modalTime.textContent       = formatTime(gameState.timer);
    if (modalScore)      modalScore.textContent      = gameState.score.toLocaleString();
    if (modalTotalTime)  modalTotalTime.textContent  = formatTime(gameState.totalTime + gameState.timer);
    if (modalTotalScore) modalTotalScore.textContent = (gameState.totalScore + gameState.score).toLocaleString();

    elements.victoryModal.classList.add('active');
}

function closeVictoryModal() {
    elements.victoryModal?.classList.remove('active');
}

// Show help modal
function showHelpModal(show) {
    if (!elements.helpModal) return;
    if (show) {
        elements.helpModal.classList.add('active');
    } else {
        elements.helpModal.classList.remove('active');
    }
}

// Submit score
async function submitScore() {
    if (typeof submitGameScore !== 'function') {
        console.error('Leaderboard API not loaded');
        alert('El sistema de puntuaciones no está disponible.');
        return;
    }

    const playerName = prompt('Ingresa tu nombre para el ranking:');
    if (!playerName) return;

    try {
        elements.submitScoreBtn.disabled = true;
        elements.submitScoreBtn.textContent = 'Enviando...';

        const result = await submitGameScore('criptosopa', playerName, gameState.score, {
            level: gameState.level,
            time: gameState.timer,
            words_found: gameState.foundPaths.length
        });

        if (result.success) {
            alert(`¡Puntuación enviada! Ranking: #${result.rank} de ${result.totalPlayers}`);
            closeVictoryModal();
        } else {
            alert('Error al enviar la puntuación. Intenta de nuevo.');
        }
    } catch (error) {
        console.error('Error submitting score:', error);
        alert('Error al enviar la puntuación.');
    } finally {
        elements.submitScoreBtn.disabled = false;
        elements.submitScoreBtn.textContent = '📊 ENVIAR PUNTUACIÓN';
    }
}

// Sound system with Web Audio API
let soundEnabled = true;
let audioContext = null;

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

function playBeep(frequency = 660, duration = 0.1) {
    if (!soundEnabled) return;
    try {
        const ctx = initAudio();

        // iOS Safari arranca el AudioContext suspendido — necesita resume() en interacción del usuario
        const play = () => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + duration);
        };

        if (ctx.state === 'suspended') {
            ctx.resume().then(play);
        } else {
            play();
        }
    } catch (e) {
        console.warn('Audio not available:', e);
    }
}

// Tick sutil al seleccionar cada celda
function playCellClickSound() {
    if (!soundEnabled) return;
    try {
        const ctx = initAudio();
        if (ctx.state === 'suspended') { ctx.resume(); return; }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = 780;
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.035);
    } catch (e) {}
}

// Sonido de vida perdida — crunch dramático descendente
function playLoseLifeSound() {
    if (!soundEnabled) return;
    try {
        const ctx = initAudio();
        if (ctx.state === 'suspended') { ctx.resume(); return; }
        // Dos osciladores: grave + ruido para crunch
        [220, 110].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);
            osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.4);
            gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
            osc.start(ctx.currentTime + i * 0.05);
            osc.stop(ctx.currentTime + 0.5);
        });
    } catch (e) {}
}

// Sonido suave al des-seleccionar una celda — micro bajada de frecuencia
function playCellDeselectSound() {
    if (!soundEnabled) return;
    try {
        const ctx = initAudio();
        if (ctx.state === 'suspended') { ctx.resume(); return; }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        // Baja de 450Hz a 280Hz — sensación de "retroceder"
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.045);
    } catch (e) {}
}

// Sonido de palabra encontrada — sweep grave ("whump"), como un impacto físico
function playWordFoundSound() {
    if (!soundEnabled) return;
    try {
        const ctx = initAudio();
        if (ctx.state === 'suspended') { ctx.resume(); return; }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        // Baja de 160Hz a 40Hz en 250ms — efecto "thud" / "whump"
        osc.frequency.setValueAtTime(160, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.7, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
}

// Sonido de victoria — fanfarria corta
function playVictorySound() {
    playBeep(523, 0.12);
    setTimeout(() => playBeep(659, 0.12), 110);
    setTimeout(() => playBeep(784, 0.12), 220);
    setTimeout(() => playBeep(1047, 0.28), 330);
}

// Flash en las celdas de una palabra recién encontrada
function flashFoundWordCells(path, color) {
    path.forEach((pos, index) => {
        setTimeout(() => {
            const cell = elements.gameBoard.querySelector(
                `[data-row="${pos.r}"][data-col="${pos.c}"]`
            );
            if (cell) {
                cell.classList.add('cell-found-flash');
                setTimeout(() => cell.classList.remove('cell-found-flash'), 700);
            }
        }, index * 40);
    });
}

// Confeti de victoria
function launchConfetti() {
    let container = document.getElementById('confettiContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'confettiContainer';
        container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:8000;overflow:hidden;';
        document.body.appendChild(container);
    }

    const colors = ['#00ffff', '#ff0080', '#ffff00', '#00ff80', '#ff8000', '#8000ff'];
    for (let i = 0; i < 70; i++) {
        setTimeout(() => {
            const piece = document.createElement('div');
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = 6 + Math.random() * 8;
            piece.style.cssText = `
                position:absolute;
                width:${size}px;height:${size}px;
                background:${color};
                left:${Math.random() * 100}%;
                top:-20px;
                border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
                animation:confettiFall ${1.5 + Math.random() * 1.5}s ease-in forwards;
                box-shadow:0 0 6px ${color};
            `;
            container.appendChild(piece);
            setTimeout(() => piece.remove(), 3200);
        }, i * 35);
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('soundBtn');
    if (btn) {
        if (soundEnabled) {
            btn.classList.remove('muted');
            playBeep(660, 0.15);
        } else {
            btn.classList.add('muted');
        }
    }
    console.log(`🔊 Sonido: ${soundEnabled ? 'ON' : 'OFF'}`);
}

// ============================================
// CABALLO ANIMADO (#12)
// ============================================

const knightAnimator = (() => {
    let el = null;
    let posX = null;
    let posY = null;
    let landingTimer = null;
    let hideTimer = null;

    function ensureEl() {
        if (el) return;
        el = document.createElement('div');
        el.className = 'knight-jumper';
        el.textContent = '♞';
        document.body.appendChild(el);
    }

    // Flash del ♞ en la celda: aparece grande y se desvanece (letra siempre visible)
    function flashCellKnight(cellEl) {
        const flash = document.createElement('span');
        flash.className = 'knight-cell-flash';
        flash.textContent = '♞';
        cellEl.appendChild(flash);
        setTimeout(() => flash.remove(), 480);
    }

    // Posicionar el elemento sin transición (teleport)
    function teleport(x, y, opacity) {
        el.style.transition = 'none';
        el.style.opacity = String(opacity);
        el.style.left = x + 'px';
        el.style.top  = y + 'px';
        void el.offsetWidth; // forzar reflow
        el.style.transition = '';
    }

    return {
        moveTo(cellEl) {
            ensureEl();
            clearTimeout(landingTimer);
            clearTimeout(hideTimer);
            el.classList.remove('landing', 'jumping');

            const rect = cellEl.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top  + rect.height / 2;

            const isFirst = posX === null;

            if (isFirst) {
                // Primera celda: aparece directo en destino
                teleport(x, y, 1);
            } else {
                // Siguiente: reaparece en posición anterior y vuela al destino
                teleport(posX, posY, 1);
                el.classList.add('jumping');
                el.style.left = x + 'px';
                el.style.top  = y + 'px';
            }

            // Al llegar: aterriza (scale grande + fade) y flash en la celda
            const flightTime = isFirst ? 0 : 160;
            landingTimer = setTimeout(() => {
                el.classList.remove('jumping');
                el.classList.add('landing');
                flashCellKnight(cellEl);
                hideTimer = setTimeout(() => {
                    el.classList.remove('landing');
                    el.style.opacity = '0'; // invisible pero posicionado
                }, 260);
            }, flightTime);

            posX = x;
            posY = y;
        },

        hide() {
            if (!el) return;
            clearTimeout(landingTimer);
            clearTimeout(hideTimer);
            el.classList.remove('landing', 'jumping');
            el.style.opacity = '0';
            posX = null;
            posY = null;
        }
    };
})();

function updateKnightPosition() {
    if (gameState.selectedPath.length === 0) {
        knightAnimator.hide();
        return;
    }
    const last = gameState.selectedPath[gameState.selectedPath.length - 1];
    const cellEl = elements.gameBoard?.querySelector(
        `[data-row="${last.r}"][data-col="${last.c}"]`
    );
    if (cellEl) knightAnimator.moveTo(cellEl);
}

// ============================================
// TUTORIAL PRIMERA VEZ (#11)
// ============================================

const TUTORIAL_KEY = 'criptosopa_tutorial_v1';

const TUTORIAL_STEPS = [
    {
        icon: '♞',
        title: '¡BIENVENIDO!',
        text: 'Buscá <strong>palabras de ajedrez</strong> ocultas en la sopa de letras moviéndote como un Caballo.'
    },
    {
        icon: '🔠',
        title: '¿CÓMO MOVERTE?',
        text: 'El caballo salta en <strong>L</strong>: 2 casillas en una dirección + 1 en perpendicular.<br><br>Las casillas válidas se <strong>iluminan solas</strong> cuando tocás una letra.'
    },
    {
        icon: '💡',
        title: '¡ASÍ SE JUEGA!',
        text: '• La <strong>barra</strong> bajo el tablero dice qué palabra buscar<br>• <strong>Tocá</strong> o <strong>arrastrá</strong> para seleccionar letras<br>• Al completar cada palabra, la barra avanza a la siguiente<br>• ¡Encontrá todas para ganar!'
    }
];

function showTutorial() {
    if (localStorage.getItem(TUTORIAL_KEY)) return;

    let step = 0;

    const overlay = document.createElement('div');
    overlay.className = 'tutorial-overlay';

    function render() {
        const s = TUTORIAL_STEPS[step];
        const isLast = step === TUTORIAL_STEPS.length - 1;

        overlay.innerHTML = `
            <div class="tutorial-card">
                <div class="tutorial-icon">${s.icon}</div>
                <h2 class="tutorial-title">${s.title}</h2>
                <p class="tutorial-text">${s.text}</p>
                <div class="tutorial-dots">
                    ${TUTORIAL_STEPS.map((_, i) =>
                        `<span class="tutorial-dot${i === step ? ' active' : ''}"></span>`
                    ).join('')}
                </div>
                <div class="tutorial-actions">
                    <button class="tutorial-skip">Saltar</button>
                    <button class="tutorial-next neon-arcade-btn neon-arcade-btn--primary">
                        ${isLast ? '▶ ¡JUGAR!' : 'SIGUIENTE →'}
                    </button>
                </div>
            </div>
        `;

        overlay.querySelector('.tutorial-next').addEventListener('click', () => {
            if (isLast) {
                dismissTutorial(overlay);
            } else {
                step++;
                render();
            }
        });

        overlay.querySelector('.tutorial-skip').addEventListener('click', () => {
            dismissTutorial(overlay);
        });
    }

    render();
    document.body.appendChild(overlay);
}

function dismissTutorial(overlay) {
    localStorage.setItem(TUTORIAL_KEY, 'done');
    overlay.classList.add('tutorial-fade-out');
    setTimeout(() => overlay.remove(), 400);
}

// ============================================
// MARQUEE DE PALABRAS CANDIDATAS
// ============================================

const wordMarquee = (() => {
    const SPEED = 48; // px/segundo
    let wrapperEl = null;
    let innerEl   = null;
    let rafId     = null;
    let scrollX   = 0;
    let maxScroll = 0;
    let direction = 1;  // 1 = derecha→izquierda, -1 = izquierda→derecha
    let lastTs    = null;
    let frozen    = false;
    let suspended = false;

    const getBar = () => document.querySelector('.selection-bar');
    const getSel = () => elements.currentSelection;

    function getUnfound() {
        return gameState.targetWords
            .map((w, i) => ({ word: w, origIdx: i }))
            .filter(({ word }) => !gameState.foundPaths.some(fp => fp.word === word));
    }

    function buildInner(unfound) {
        const el = document.createElement('div');
        el.className = 'mq-inner';

        // Marcador de extremo (doble)
        function addBreak() {
            const brk = document.createElement('span');
            brk.className = 'mq-break';
            brk.textContent = '· · · · · ·';
            el.appendChild(brk);
        }

        // Palabras con separadores
        function addWords() {
            unfound.forEach(({ word, origIdx }) => {
                const color = CONFIG.NEON_COLORS[origIdx % CONFIG.NEON_COLORS.length];
                const span = document.createElement('span');
                span.className = 'mq-word';
                span.textContent = word;
                span.style.color = color.hex;
                span.style.textShadow = color.glow;
                span.dataset.word = word;
                span.dataset.origIdx = String(origIdx);
                el.appendChild(span);

                const sep = document.createElement('span');
                sep.className = 'mq-sep';
                sep.textContent = '♞';
                el.appendChild(sep);
            });
        }

        addBreak(); // extremo izquierdo
        addWords();
        addBreak(); // extremo derecho
        return el;
    }

    function tick(ts) {
        if (!frozen && !suspended && lastTs !== null) {
            const dt = (ts - lastTs) / 1000;
            scrollX += direction * SPEED * dt;

            // Rebotar en los extremos
            if (scrollX >= maxScroll) {
                scrollX    = maxScroll;
                direction  = -1;
            } else if (scrollX <= 0) {
                scrollX    = 0;
                direction  = 1;
            }

            if (innerEl) innerEl.style.transform = `translateX(${-scrollX}px)`;
        }
        lastTs = ts;
        rafId = requestAnimationFrame(tick);
    }

    function onWordClick(e) {
        const wordEl = e.target.closest('.mq-word');
        if (!wordEl) return;

        frozen = true;
        const word    = wordEl.dataset.word;
        const origIdx = parseInt(wordEl.dataset.origIdx);
        const color   = CONFIG.NEON_COLORS[origIdx % CONFIG.NEON_COLORS.length];

        if (wrapperEl) wrapperEl.style.display = 'none';
        getBar()?.classList.replace('mq-running', 'mq-frozen');

        const sel = getSel();
        if (sel) {
            sel.textContent = word;
            sel.setAttribute('data-hint', 'true');
            sel.style.color = color.hex;
            sel.style.textShadow = color.glow;
        }
    }

    return {
        start() {
            this.stop();
            const bar = getBar();
            if (!bar) return;

            const unfound = getUnfound();
            if (unfound.length < 2) return;

            frozen    = false;
            suspended = false;
            scrollX   = 0;
            direction = 1;
            lastTs    = null;

            wrapperEl = document.createElement('div');
            wrapperEl.className = 'mq-wrapper';
            wrapperEl.addEventListener('click', onWordClick);

            innerEl = buildInner(unfound);
            wrapperEl.appendChild(innerEl);
            bar.appendChild(wrapperEl);
            bar.classList.add('mq-running');

            requestAnimationFrame(() => requestAnimationFrame(() => {
                maxScroll = Math.max(0, innerEl.scrollWidth - wrapperEl.offsetWidth);
                rafId = requestAnimationFrame(tick);
            }));
        },

        stop() {
            if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
            frozen    = false;
            suspended = false;
            lastTs    = null;
            const bar = getBar();
            bar?.classList.remove('mq-running', 'mq-frozen');
            if (wrapperEl) { wrapperEl.remove(); wrapperEl = null; }
            innerEl = null;
        },

        suspend() {
            if (!wrapperEl) return;
            suspended = true;
            wrapperEl.style.visibility = 'hidden';
            getBar()?.classList.remove('mq-running', 'mq-frozen');
        },

        unsuspend() {
            if (!wrapperEl || frozen) return;
            suspended = false;
            lastTs    = null;
            wrapperEl.style.visibility = '';
            getBar()?.classList.add('mq-running');
        },

        get isRunning() { return !!wrapperEl && !frozen && !suspended; }
    };
})();

// Interfaz para hamburger-menu.js — sin esto, isSoundEnabled() siempre retorna true
window.SoundManager = {
    isMuted: () => !soundEnabled,
    toggleMute: toggleSound
};

// Make toggleSound available globally for onclick handler
window.toggleSound = toggleSound;

// Initialize
console.log('CriptoSopa (Knight Word Search) loaded successfully!');
