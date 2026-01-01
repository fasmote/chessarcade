/**
 * CriptoSopa - Knight Movement Word Search
 * Find words by moving like a chess knight (L-shaped moves)
 */

// Game Configuration
const CONFIG = {
    BOARD_SIZE: 8,
    DEFAULT_WORDS: [
        "CABALLO", "ALFIL", "TORRE", "REINA", "REY",
        "PEON", "JAQUE", "MATE", "TABLERO", "ENROQUE",
        "CAPTURA", "GAMBITO", "ELO", "FIDE", "RELOJ"
    ],
    NEON_COLORS: [
        { hex: '#ff00ff', glow: '0 0 15px #ff00ff' }, // Pink
        { hex: '#00ffff', glow: '0 0 15px #00ffff' }, // Cyan
        { hex: '#ffff00', glow: '0 0 15px #ffff00' }, // Yellow
        { hex: '#ff9900', glow: '0 0 15px #ff9900' }, // Orange
        { hex: '#39ff14', glow: '0 0 15px #39ff14' }, // Green
        { hex: '#b026ff', glow: '0 0 15px #b026ff' }, // Purple
    ],
    WORDS_PER_LEVEL: 6,
    POINTS_PER_WORD: 100,
    HINTS_PER_LEVEL: 3
};

// Game State
let gameState = {
    board: [],
    currentWordList: [],
    targetWords: [],
    wordPaths: {}, // Store paths for each placed word {word: path}
    foundPaths: [],
    selectedPath: [],
    score: 0,
    level: 1,
    hintsRemaining: CONFIG.HINTS_PER_LEVEL,
    timer: 0,
    timerInterval: null,
    hoveredWord: null,
    gameStatus: 'playing', // 'playing', 'won'
    isDragging: false, // Track if mouse is being held down
    hintCell: null // {r, c, endTime} - Currently hinted cell
};

// DOM Elements
const elements = {
    gameBoard: null,
    wordList: null,
    scoreDisplay: null,
    timerDisplay: null,
    wordsFound: null,
    currentSelection: null,
    hintsLeft: null,
    resetBtn: null,
    hintBtn: null,
    helpBtn: null,
    closeHelpBtn: null,
    closeHelpBtn2: null,
    victoryModal: null,
    helpModal: null,
    nextLevelBtn: null,
    submitScoreBtn: null,
    modalTime: null,
    modalScore: null
};

// Initialize game
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
    elements.wordsFound = document.getElementById('wordsFound');
    elements.currentSelection = document.getElementById('currentSelection');
    elements.hintsLeft = document.getElementById('hintsLeft');
    elements.resetBtn = document.getElementById('resetBtn');
    elements.hintBtn = document.getElementById('hintBtn');
    elements.helpBtn = document.getElementById('helpBtn');
    elements.closeHelpBtn = document.getElementById('closeHelpBtn');
    elements.closeHelpBtn2 = document.getElementById('closeHelpBtn2');
    elements.victoryModal = document.getElementById('victoryModal');
    elements.helpModal = document.getElementById('helpModal');
    elements.nextLevelBtn = document.getElementById('nextLevelBtn');
    elements.submitScoreBtn = document.getElementById('submitScoreBtn');
    elements.modalTime = document.getElementById('modalTime');
    elements.modalScore = document.getElementById('modalScore');
}

// Setup event listeners
function setupEventListeners() {
    elements.resetBtn?.addEventListener('click', startNewGame);
    elements.hintBtn?.addEventListener('click', showHint);
    elements.helpBtn?.addEventListener('click', () => showHelpModal(true));
    elements.closeHelpBtn?.addEventListener('click', () => showHelpModal(false));
    elements.closeHelpBtn2?.addEventListener('click', () => showHelpModal(false));
    elements.nextLevelBtn?.addEventListener('click', nextLevel);
    elements.submitScoreBtn?.addEventListener('click', submitScore);

    // Global mouseup to stop dragging
    document.addEventListener('mouseup', () => {
        gameState.isDragging = false;
    });

    // Stop dragging when mouse leaves the window
    document.addEventListener('mouseleave', () => {
        gameState.isDragging = false;
    });
}

// Start new game
function startNewGame() {
    gameState.foundPaths = [];
    gameState.selectedPath = [];
    gameState.wordPaths = {}; // Clear word paths
    gameState.gameStatus = 'playing';
    gameState.hoveredWord = null;
    gameState.hintsRemaining = CONFIG.HINTS_PER_LEVEL;

    clearInterval(gameState.timerInterval);
    gameState.timer = 0;

    // Create board and place words
    gameState.board = createEmptyBoard();
    gameState.currentWordList = [...CONFIG.DEFAULT_WORDS];
    placeWords();
    fillRandomLetters();

    // Start timer
    startTimer();

    // Render
    renderBoard();
    renderWordList();
    updateDisplay();
}

// Next level
function nextLevel() {
    gameState.level++;
    gameState.hintsRemaining = CONFIG.HINTS_PER_LEVEL;
    closeVictoryModal();
    startNewGame();
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
function placeWords() {
    const selectedWords = [];
    const shuffled = [...gameState.currentWordList].sort(() => 0.5 - Math.random());

    for (const word of shuffled) {
        if (selectedWords.length >= CONFIG.WORDS_PER_LEVEL) break;
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

    // First click
    if (gameState.selectedPath.length === 0) {
        gameState.selectedPath.push({ r, c });
        renderBoard();
        updateSelectionText();
        return;
    }

    const lastPos = gameState.selectedPath[gameState.selectedPath.length - 1];

    // Click on same cell (deselect last)
    if (lastPos.r === r && lastPos.c === c) {
        gameState.selectedPath.pop();
        renderBoard();
        updateSelectionText();
        return;
    }

    // Check if valid knight move
    if (!isKnightMove(lastPos.r, lastPos.c, r, c)) return;

    // Check if not already in path
    if (gameState.selectedPath.some(p => p.r === r && p.c === c)) return;

    // Add to path
    const newPath = [...gameState.selectedPath, { r, c }];
    const currentWord = newPath.map(p => gameState.board[p.r][p.c]).join('');

    // Check if word is complete
    if (gameState.targetWords.includes(currentWord)) {
        if (!gameState.foundPaths.some(fp => fp.word === currentWord)) {
            const color = CONFIG.NEON_COLORS[gameState.foundPaths.length % CONFIG.NEON_COLORS.length];

            gameState.foundPaths.push({
                word: currentWord,
                path: newPath,
                color: color
            });

            console.log(`[WORD FOUND] "${currentWord}" with path:`,
                newPath.map(p => `(${p.r},${p.c})=${gameState.board[p.r][p.c]}`).join(' -> '));

            gameState.selectedPath = [];
            gameState.score += CONFIG.POINTS_PER_WORD;

            // Check win condition
            if (gameState.foundPaths.length === gameState.targetWords.length) {
                winGame();
            }
        }
    } else {
        // Check if word is too long
        const maxLen = Math.max(...gameState.targetWords.map(w => w.length));
        if (currentWord.length > maxLen) {
            gameState.selectedPath = [{ r, c }];
        } else {
            gameState.selectedPath = newPath;
        }
    }

    renderBoard();
    renderWordList();
    updateSelectionText();
    updateDisplay();
}

// Show hint
function showHint() {
    console.log('[HINT] Button clicked');

    if (gameState.hintsRemaining <= 0) {
        alert('¡No te quedan pistas!');
        return;
    }

    const missingWords = gameState.targetWords.filter(w =>
        !gameState.foundPaths.some(fp => fp.word === w)
    );

    console.log('[HINT] Missing words:', missingWords);
    console.log('[HINT] Target words:', gameState.targetWords);
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

        gameState.hintsRemaining--;
        gameState.score = Math.max(0, gameState.score - 50);
        updateDisplay();
        renderBoard(); // Re-render to apply hint styling

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
            if (!isSelected && !isFound && !isHintCell && gameState.selectedPath.length > 0) {
                const last = gameState.selectedPath[gameState.selectedPath.length - 1];
                if (isKnightMove(last.r, last.c, r, c) &&
                    !gameState.selectedPath.some(p => p.r === r && p.c === c)) {
                    cell.classList.add('cell-hint');
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
                    e.preventDefault(); // Prevent text selection
                    gameState.isDragging = true;
                    handleCellClick(r, c);
                });

                cell.addEventListener('mouseenter', () => {
                    if (gameState.isDragging) {
                        handleCellClick(r, c);
                    }
                });

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
function updateSelectionText() {
    if (!elements.currentSelection) return;
    const text = gameState.selectedPath.map(p => gameState.board[p.r][p.c]).join('');
    elements.currentSelection.textContent = text;
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
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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
    if (elements.hintsLeft) {
        elements.hintsLeft.textContent = gameState.hintsRemaining;
    }
}

// Win game
function winGame() {
    gameState.gameStatus = 'won';
    clearInterval(gameState.timerInterval);

    setTimeout(() => {
        showVictoryModal();
    }, 1000);
}

// Show victory modal
function showVictoryModal() {
    if (!elements.victoryModal) return;

    if (elements.modalTime) {
        elements.modalTime.textContent = formatTime(gameState.timer);
    }
    if (elements.modalScore) {
        elements.modalScore.textContent = gameState.score.toLocaleString();
    }

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

// Sound toggle function
let soundEnabled = true;

function toggleSound() {
    soundEnabled = !soundEnabled;
    const icon = document.getElementById('soundIcon');
    if (icon) {
        icon.className = soundEnabled
            ? 'fa-solid fa-volume-high'
            : 'fa-solid fa-volume-xmark';
    }
    console.log(`🔊 Sonido: ${soundEnabled ? 'ON' : 'OFF'}`);
}

// Make toggleSound available globally for onclick handler
window.toggleSound = toggleSound;

// Initialize
console.log('CriptoSopa (Knight Word Search) loaded successfully!');
