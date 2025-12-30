/**
 * CriptoSopa - Word Search Chess Game
 * Find chess-related words hidden in the grid
 */

// Game Configuration
const CONFIG = {
    GRID_SIZE: 8,
    WORDS: [
        'REY',
        'DAMA',
        'TORRE',
        'ALFIL',
        'CABALLO',
        'PEON',
        'JAQUE',
        'MATE'
    ],
    DIRECTIONS: [
        { dx: 1, dy: 0 },   // horizontal →
        { dx: 0, dy: 1 },   // vertical ↓
        { dx: 1, dy: 1 },   // diagonal ↘
        { dx: 1, dy: -1 },  // diagonal ↗
        { dx: -1, dy: 0 },  // horizontal ←
        { dx: 0, dy: -1 },  // vertical ↑
        { dx: -1, dy: -1 }, // diagonal ↖
        { dx: -1, dy: 1 }   // diagonal ↙
    ],
    POINTS_PER_WORD: 100,
    TIME_BONUS_THRESHOLD: 180, // 3 minutes
    TIME_BONUS_POINTS: 500
};

// Game State
let gameState = {
    grid: [],
    words: [],
    foundWords: [],
    level: 1,
    score: 0,
    startTime: null,
    timerInterval: null,
    isSelecting: false,
    selectionStart: null,
    selectionEnd: null,
    selectedCells: [],
    hintsRemaining: 3,
    totalSeconds: 0
};

// DOM Elements
const elements = {
    gameBoard: null,
    wordList: null,
    scoreDisplay: null,
    timerDisplay: null,
    levelDisplay: null,
    foundDisplay: null,
    hintsLeft: null,
    newGameBtn: null,
    hintBtn: null,
    victoryModal: null,
    nextLevelBtn: null,
    submitScoreBtn: null,
    modalLevel: null,
    modalTime: null,
    modalScore: null,
    victoryMessage: null
};

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeDOM();
    setupEventListeners();
    startNewGame();
});

// Initialize DOM references
function initializeDOM() {
    elements.gameBoard = document.getElementById('gameBoard');
    elements.wordList = document.getElementById('wordList');
    elements.scoreDisplay = document.getElementById('scoreDisplay');
    elements.timerDisplay = document.getElementById('timerDisplay');
    elements.levelDisplay = document.getElementById('levelDisplay');
    elements.foundDisplay = document.getElementById('foundDisplay');
    elements.hintsLeft = document.getElementById('hintsLeft');
    elements.newGameBtn = document.getElementById('newGameBtn');
    elements.hintBtn = document.getElementById('hintBtn');
    elements.victoryModal = document.getElementById('victoryModal');
    elements.nextLevelBtn = document.getElementById('nextLevelBtn');
    elements.submitScoreBtn = document.getElementById('submitScoreBtn');
    elements.modalLevel = document.getElementById('modalLevel');
    elements.modalTime = document.getElementById('modalTime');
    elements.modalScore = document.getElementById('modalScore');
    elements.victoryMessage = document.getElementById('victoryMessage');
}

// Setup event listeners
function setupEventListeners() {
    elements.newGameBtn?.addEventListener('click', resetGame);
    elements.hintBtn?.addEventListener('click', showHint);
    elements.nextLevelBtn?.addEventListener('click', nextLevel);
    elements.submitScoreBtn?.addEventListener('click', submitScore);

    // Mouse events for word selection
    elements.gameBoard?.addEventListener('mousedown', handleMouseDown);
    elements.gameBoard?.addEventListener('mousemove', handleMouseMove);
    elements.gameBoard?.addEventListener('mouseup', handleMouseUp);
    elements.gameBoard?.addEventListener('mouseleave', handleMouseUp);

    // Touch events for mobile
    elements.gameBoard?.addEventListener('touchstart', handleTouchStart, { passive: false });
    elements.gameBoard?.addEventListener('touchmove', handleTouchMove, { passive: false });
    elements.gameBoard?.addEventListener('touchend', handleTouchEnd);
}

// Start new game
function startNewGame() {
    gameState.words = [...CONFIG.WORDS];
    gameState.foundWords = [];
    gameState.grid = createEmptyGrid();
    gameState.hintsRemaining = 3;

    placeWordsInGrid();
    fillEmptySpaces();
    renderGrid();
    renderWordList();
    startTimer();
    updateDisplay();
}

// Reset game (keep level and score)
function resetGame() {
    clearInterval(gameState.timerInterval);
    startNewGame();
}

// Next level
function nextLevel() {
    gameState.level++;
    gameState.hintsRemaining = 3;
    clearInterval(gameState.timerInterval);
    closeVictoryModal();
    startNewGame();
}

// Create empty 8x8 grid
function createEmptyGrid() {
    return Array(CONFIG.GRID_SIZE).fill(null).map(() =>
        Array(CONFIG.GRID_SIZE).fill('')
    );
}

// Place words in grid
function placeWordsInGrid() {
    const placedWords = [];

    for (const word of gameState.words) {
        let placed = false;
        let attempts = 0;
        const maxAttempts = 100;

        while (!placed && attempts < maxAttempts) {
            const direction = CONFIG.DIRECTIONS[Math.floor(Math.random() * CONFIG.DIRECTIONS.length)];
            const row = Math.floor(Math.random() * CONFIG.GRID_SIZE);
            const col = Math.floor(Math.random() * CONFIG.GRID_SIZE);

            if (canPlaceWord(word, row, col, direction)) {
                placeWord(word, row, col, direction);
                placedWords.push({
                    word,
                    start: { row, col },
                    direction
                });
                placed = true;
            }
            attempts++;
        }

        if (!placed) {
            console.warn(`Could not place word: ${word}`);
        }
    }

    return placedWords;
}

// Check if word can be placed
function canPlaceWord(word, row, col, direction) {
    const { dx, dy } = direction;

    for (let i = 0; i < word.length; i++) {
        const newRow = row + (dy * i);
        const newCol = col + (dx * i);

        // Check bounds
        if (newRow < 0 || newRow >= CONFIG.GRID_SIZE || newCol < 0 || newCol >= CONFIG.GRID_SIZE) {
            return false;
        }

        // Check if cell is empty or matches the letter
        const currentCell = gameState.grid[newRow][newCol];
        if (currentCell !== '' && currentCell !== word[i]) {
            return false;
        }
    }

    return true;
}

// Place word in grid
function placeWord(word, row, col, direction) {
    const { dx, dy } = direction;

    for (let i = 0; i < word.length; i++) {
        const newRow = row + (dy * i);
        const newCol = col + (dx * i);
        gameState.grid[newRow][newCol] = word[i];
    }
}

// Fill empty spaces with random letters
function fillEmptySpaces() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let row = 0; row < CONFIG.GRID_SIZE; row++) {
        for (let col = 0; col < CONFIG.GRID_SIZE; col++) {
            if (gameState.grid[row][col] === '') {
                gameState.grid[row][col] = letters[Math.floor(Math.random() * letters.length)];
            }
        }
    }
}

// Render grid
function renderGrid() {
    if (!elements.gameBoard) return;

    elements.gameBoard.innerHTML = '';

    for (let row = 0; row < CONFIG.GRID_SIZE; row++) {
        for (let col = 0; col < CONFIG.GRID_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.textContent = gameState.grid[row][col];
            cell.dataset.row = row;
            cell.dataset.col = col;
            elements.gameBoard.appendChild(cell);
        }
    }
}

// Render word list
function renderWordList() {
    if (!elements.wordList) return;

    elements.wordList.innerHTML = gameState.words.map(word => `
        <li class="word-item ${gameState.foundWords.includes(word) ? 'found' : ''}" data-word="${word}">
            ${word}
        </li>
    `).join('');
}

// Mouse handlers
function handleMouseDown(e) {
    if (!e.target.classList.contains('grid-cell')) return;

    gameState.isSelecting = true;
    gameState.selectionStart = {
        row: parseInt(e.target.dataset.row),
        col: parseInt(e.target.dataset.col)
    };
    gameState.selectedCells = [gameState.selectionStart];
    e.target.classList.add('selecting');
}

function handleMouseMove(e) {
    if (!gameState.isSelecting) return;
    if (!e.target.classList.contains('grid-cell')) return;

    const currentCell = {
        row: parseInt(e.target.dataset.row),
        col: parseInt(e.target.dataset.col)
    };

    updateSelection(currentCell);
}

function handleMouseUp() {
    if (!gameState.isSelecting) return;

    gameState.isSelecting = false;
    checkSelectedWord();
    clearSelection();
}

// Touch handlers
function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.classList.contains('grid-cell')) {
        gameState.isSelecting = true;
        gameState.selectionStart = {
            row: parseInt(target.dataset.row),
            col: parseInt(target.dataset.col)
        };
        gameState.selectedCells = [gameState.selectionStart];
        target.classList.add('selecting');
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!gameState.isSelecting) return;

    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.classList.contains('grid-cell')) {
        const currentCell = {
            row: parseInt(target.dataset.row),
            col: parseInt(target.dataset.col)
        };
        updateSelection(currentCell);
    }
}

function handleTouchEnd(e) {
    if (!gameState.isSelecting) return;

    gameState.isSelecting = false;
    checkSelectedWord();
    clearSelection();
}

// Update selection
function updateSelection(endCell) {
    const start = gameState.selectionStart;
    const dx = Math.sign(endCell.col - start.col);
    const dy = Math.sign(endCell.row - start.row);

    // Only allow straight lines (horizontal, vertical, diagonal)
    if (dx !== 0 && dy !== 0 && Math.abs(endCell.col - start.col) !== Math.abs(endCell.row - start.row)) {
        return;
    }

    // Clear previous selection
    document.querySelectorAll('.grid-cell.selecting').forEach(cell => {
        if (!cell.classList.contains('found')) {
            cell.classList.remove('selecting');
        }
    });

    // Select cells in line
    gameState.selectedCells = [];
    let currentRow = start.row;
    let currentCol = start.col;

    while (true) {
        gameState.selectedCells.push({ row: currentRow, col: currentCol });

        const cell = document.querySelector(`[data-row="${currentRow}"][data-col="${currentCol}"]`);
        if (cell && !cell.classList.contains('found')) {
            cell.classList.add('selecting');
        }

        if (currentRow === endCell.row && currentCol === endCell.col) break;

        currentRow += dy;
        currentCol += dx;

        // Safety check
        if (currentRow < 0 || currentRow >= CONFIG.GRID_SIZE ||
            currentCol < 0 || currentCol >= CONFIG.GRID_SIZE) {
            break;
        }
    }
}

// Check if selected word is valid
function checkSelectedWord() {
    const selectedWord = gameState.selectedCells
        .map(({ row, col }) => gameState.grid[row][col])
        .join('');

    const reversedWord = selectedWord.split('').reverse().join('');

    let foundWord = null;
    if (gameState.words.includes(selectedWord) && !gameState.foundWords.includes(selectedWord)) {
        foundWord = selectedWord;
    } else if (gameState.words.includes(reversedWord) && !gameState.foundWords.includes(reversedWord)) {
        foundWord = reversedWord;
    }

    if (foundWord) {
        markWordFound(foundWord);
        gameState.foundWords.push(foundWord);
        gameState.score += CONFIG.POINTS_PER_WORD;
        updateDisplay();
        renderWordList();

        // Check if all words found
        if (gameState.foundWords.length === gameState.words.length) {
            handleLevelComplete();
        }
    }
}

// Mark found word cells
function markWordFound(word) {
    gameState.selectedCells.forEach(({ row, col }) => {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.classList.remove('selecting');
            cell.classList.add('found');
        }
    });
}

// Clear selection
function clearSelection() {
    document.querySelectorAll('.grid-cell.selecting').forEach(cell => {
        cell.classList.remove('selecting');
    });
    gameState.selectedCells = [];
    gameState.selectionStart = null;
}

// Show hint
function showHint() {
    if (gameState.hintsRemaining <= 0) {
        alert('¡No te quedan pistas!');
        return;
    }

    const remainingWords = gameState.words.filter(word => !gameState.foundWords.includes(word));
    if (remainingWords.length === 0) return;

    const wordToHint = remainingWords[0];
    const positions = findWordPositions(wordToHint);

    if (positions.length > 0) {
        const firstLetter = positions[0];
        const cell = document.querySelector(`[data-row="${firstLetter.row}"][data-col="${firstLetter.col}"]`);
        if (cell) {
            cell.classList.add('hint');
            setTimeout(() => cell.classList.remove('hint'), 3000);
        }

        gameState.hintsRemaining--;
        gameState.score = Math.max(0, gameState.score - 50); // Penalty for hint
        updateDisplay();
    }
}

// Find word positions in grid
function findWordPositions(word) {
    for (let row = 0; row < CONFIG.GRID_SIZE; row++) {
        for (let col = 0; col < CONFIG.GRID_SIZE; col++) {
            for (const direction of CONFIG.DIRECTIONS) {
                const positions = checkWordAtPosition(word, row, col, direction);
                if (positions.length > 0) {
                    return positions;
                }
            }
        }
    }
    return [];
}

// Check if word exists at position
function checkWordAtPosition(word, row, col, direction) {
    const { dx, dy } = direction;
    const positions = [];

    for (let i = 0; i < word.length; i++) {
        const newRow = row + (dy * i);
        const newCol = col + (dx * i);

        if (newRow < 0 || newRow >= CONFIG.GRID_SIZE ||
            newCol < 0 || newCol >= CONFIG.GRID_SIZE ||
            gameState.grid[newRow][newCol] !== word[i]) {
            return [];
        }

        positions.push({ row: newRow, col: newCol });
    }

    return positions;
}

// Timer
function startTimer() {
    gameState.startTime = Date.now();
    gameState.totalSeconds = 0;

    clearInterval(gameState.timerInterval);
    gameState.timerInterval = setInterval(() => {
        gameState.totalSeconds = Math.floor((Date.now() - gameState.startTime) / 1000);
        updateTimerDisplay();
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(gameState.totalSeconds / 60);
    const seconds = gameState.totalSeconds % 60;
    if (elements.timerDisplay) {
        elements.timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
}

// Update display
function updateDisplay() {
    if (elements.scoreDisplay) {
        elements.scoreDisplay.textContent = gameState.score.toLocaleString();
    }
    if (elements.levelDisplay) {
        elements.levelDisplay.textContent = gameState.level;
    }
    if (elements.foundDisplay) {
        elements.foundDisplay.textContent = `${gameState.foundWords.length}/${gameState.words.length}`;
    }
    if (elements.hintsLeft) {
        elements.hintsLeft.textContent = gameState.hintsRemaining;
    }
}

// Handle level complete
function handleLevelComplete() {
    clearInterval(gameState.timerInterval);

    // Time bonus
    if (gameState.totalSeconds < CONFIG.TIME_BONUS_THRESHOLD) {
        gameState.score += CONFIG.TIME_BONUS_POINTS;
    }

    showVictoryModal();
}

// Victory modal
function showVictoryModal() {
    if (!elements.victoryModal) return;

    if (elements.modalLevel) elements.modalLevel.textContent = gameState.level;
    if (elements.modalTime) elements.modalTime.textContent = elements.timerDisplay?.textContent || '00:00';
    if (elements.modalScore) elements.modalScore.textContent = gameState.score.toLocaleString();

    const messages = [
        '¡Excelente trabajo! Todas las palabras encontradas.',
        '¡Fantástico! Tu mente es rápida como un caballo.',
        '¡Impresionante! Dominas el arte de la búsqueda.',
        '¡Increíble! Tus ojos de águila lo encontraron todo.'
    ];

    if (elements.victoryMessage) {
        elements.victoryMessage.textContent = messages[Math.floor(Math.random() * messages.length)];
    }

    elements.victoryModal.classList.add('active');
}

function closeVictoryModal() {
    elements.victoryModal?.classList.remove('active');
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
            time: gameState.totalSeconds,
            words_found: gameState.foundWords.length
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

// Initialize game
console.log('CriptoSopa loaded successfully!');
