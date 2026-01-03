// Game state
let gameState = {
    level: 1,
    score: 0,
    combo: 1,
    currentTarget: '',
    targetFound: 0,
    targetsNeeded: 5,
    timeLeft: 12.0,
    gameActive: false,
    gameStarted: false,
    showCoordinates: true,
    timerInterval: null,
    soundEnabled: true
};

// ✅ Exponer gameState al scope global para leaderboard
window.gameState = gameState;

// ========================================
// SESSION STATISTICS (for leaderboard)
// ========================================
// Estos contadores se acumulan durante toda la sesión de juego
let maxComboAchieved = 1;      // Combo máximo alcanzado
let totalTargetsFound = 0;     // Total de objetivos encontrados en todos los niveles

// Exponer estadísticas al scope global para leaderboard
window.maxComboAchieved = maxComboAchieved;
window.totalTargetsFound = totalTargetsFound;

// Level configuration
const levels = {
    1: { name: "BABY STEPS", targets: 5, time: 12.0, theme: "retro" },
    2: { name: "BABY STEPS", targets: 5, time: 10.0, theme: "retro" },
    3: { name: "BABY STEPS", targets: 5, time: 8.0, theme: "retro" },
    4: { name: "LITTLE MASTER", targets: 8, time: 7.0, theme: "neon" },
    5: { name: "LITTLE MASTER", targets: 8, time: 6.0, theme: "neon" },
    6: { name: "SPEED DEMON", targets: 10, time: 5.5, theme: "neon" },
    7: { name: "SPEED DEMON", targets: 10, time: 5.0, theme: "neon" },
    8: { name: "GRANDMASTER", targets: 12, time: 4.5, theme: "neon" },
    9: { name: "GRANDMASTER", targets: 12, time: 4.0, theme: "neon" },
    10: { name: "LEGENDARY", targets: 15, time: 3.5, theme: "neon" }
};

// Audio setup
const sounds = {
    correct: new Howl({ 
        src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmckBTOLzu63dyMFl2us'],
        volume: 0.5
    }),
    wrong: new Howl({ 
        src: ['data:audio/wav;base64,UklGRhQDAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YfACAAC4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4QEBAQEBAQEBAQEBAQEBAQEBAuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4QEBAQEBAQEBAQEBAQEBAQEBA'],
        volume: 0.5
    }),
    levelUp: new Howl({ 
        src: ['data:audio/wav;base64,UklGRhQEAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YfADAADIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg'],
        volume: 0.7
    })
};

// Sound control functions
function playSound(soundName) {
    if (gameState.soundEnabled && sounds[soundName]) {
        sounds[soundName].play();
    }
}

function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    const soundBtn = document.getElementById('soundToggle');
    if (soundBtn) {
        const iconOn = soundBtn.querySelector('.icon-sound-on');
        const iconOff = soundBtn.querySelector('.icon-sound-off');

        if (gameState.soundEnabled) {
            if (iconOn) iconOn.style.display = 'block';
            if (iconOff) iconOff.style.display = 'none';
            soundBtn.classList.remove('muted');
            soundBtn.title = 'Mute Sound';
            // Reproducir sonido de confirmación al activar
            playSound('correct');
        } else {
            if (iconOn) iconOn.style.display = 'none';
            if (iconOff) iconOff.style.display = 'block';
            soundBtn.classList.add('muted');
            soundBtn.title = 'Enable Sound';
        }
    }

    // Save preference
    localStorage.setItem('squareRushSound', gameState.soundEnabled ? 'enabled' : 'disabled');

    // Update nav button icon
    updateSoundNavIcon();
}

// Load sound preference
function loadSoundPreference() {
    const soundPref = localStorage.getItem('squareRushSound');
    if (soundPref === 'disabled') {
        gameState.soundEnabled = false;
        const soundBtn = document.getElementById('soundToggle');
        if (soundBtn) {
            const iconOn = soundBtn.querySelector('.icon-sound-on');
            const iconOff = soundBtn.querySelector('.icon-sound-off');
            if (iconOn) iconOn.style.display = 'none';
            if (iconOff) iconOff.style.display = 'block';
            soundBtn.classList.add('muted');
            soundBtn.title = 'Enable Sound';
        }
        // Update nav button too
        updateSoundNavIcon();
    }
}

// Initialize game
function initGame() {
    createBoard();
    updateUI();
    generateNewTarget();
    loadSoundPreference();
}

// Create chess board
function createBoard() {
    const board = document.getElementById('chessBoard');
    board.innerHTML = '';
    
    // Board from white's perspective: rank 1 at bottom, rank 8 at top
    for (let row = 8; row >= 1; row--) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            const file = String.fromCharCode(97 + col); // a-h
            const rank = row.toString(); // 1-8
            const coordinate = file + rank;
            
            // Standard chess board: A1 = dark, H1 = light (white square bottom-right)
            const isLight = (col + parseInt(rank)) % 2 === 0;
            square.className = `square ${isLight ? 'light' : 'dark'}`;
            square.id = coordinate;
            square.dataset.coordinate = coordinate;
            
            // Add coordinate labels for kids mode
            if (gameState.showCoordinates) {
                square.innerHTML = `<span class="coordinate-label">${coordinate.toUpperCase()}</span>`;
            }
            
            square.addEventListener('click', () => handleSquareClick(coordinate));
            board.appendChild(square);
        }
    }
}

// Handle square click
function handleSquareClick(coordinate) {
    const square = document.getElementById(coordinate);

    // Game can start by clicking correct square in ALL levels
    if (!gameState.gameStarted) {
        if (coordinate === gameState.currentTarget) {
            // Start the game!
            gameState.gameStarted = true;
            gameState.gameActive = true;
            startTimer();
            document.getElementById('startBtn').disabled = true;
            document.getElementById('pauseBtn').disabled = false;

            // Handle this as first correct answer
            square.classList.add('correct');
            playSound('correct');

            gameState.targetFound++;
            totalTargetsFound++; // ✅ Incrementar contador de sesión
            window.totalTargetsFound = totalTargetsFound;

            gameState.score += 100 * gameState.combo;

            if (gameState.combo < 3) {
                gameState.combo++;
                // ✅ Actualizar max combo si es mayor
                if (gameState.combo > maxComboAchieved) {
                    maxComboAchieved = gameState.combo;
                    window.maxComboAchieved = maxComboAchieved;
                }
            }

            // Check if level complete
            if (gameState.targetFound >= gameState.targetsNeeded) {
                completeLevel();
            } else {
                generateNewTarget();
                resetTimer();
            }

            updateUI();

            // Track game start
            gtag('event', 'game_start_by_click', {
                'level': gameState.level,
                'first_coordinate': coordinate
            });
        }
        // If wrong square clicked before game starts, do nothing
        return;
    }

    // Normal game logic (after game has started)
    if (!gameState.gameActive) return;

    if (coordinate === gameState.currentTarget) {
        // Correct answer
        square.classList.add('correct');
        playSound('correct');

        gameState.targetFound++;
        totalTargetsFound++; // ✅ Incrementar contador de sesión
        window.totalTargetsFound = totalTargetsFound;

        gameState.score += 100 * gameState.combo;

        // Update combo
        if (gameState.combo < 3) {
            gameState.combo++;
            // ✅ Actualizar max combo si es mayor
            if (gameState.combo > maxComboAchieved) {
                maxComboAchieved = gameState.combo;
                window.maxComboAchieved = maxComboAchieved;
            }
        }

        // Check if level complete
        if (gameState.targetFound >= gameState.targetsNeeded) {
            completeLevel();
        } else {
            generateNewTarget();
            resetTimer();
        }

        // Track event
        gtag('event', 'correct_answer', {
            'level': gameState.level,
            'coordinate': coordinate
        });

    } else {
        // Wrong answer
        square.classList.add('wrong');
        playSound('wrong');
        gameState.combo = 1;
        gameOver();

        // Track event
        gtag('event', 'wrong_answer', {
            'level': gameState.level,
            'coordinate': coordinate,
            'target': gameState.currentTarget
        });
    }

    updateUI();
}

// Generate new target coordinate
function generateNewTarget() {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
    
    let newTarget;
    do {
        const file = files[Math.floor(Math.random() * files.length)];
        const rank = ranks[Math.floor(Math.random() * ranks.length)];
        newTarget = file + rank;
    } while (newTarget === gameState.currentTarget);
    
    gameState.currentTarget = newTarget;
    document.getElementById('targetCoordinate').textContent = newTarget.toUpperCase();
}

// Start game timer
function startTimer() {
    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft -= 0.1;
        
        if (gameState.timeLeft <= 0) {
            gameState.timeLeft = 0;
            gameOver();
        }
        
        updateUI();
    }, 100);
}

// Reset timer
function resetTimer() {
    clearInterval(gameState.timerInterval);
    gameState.timeLeft = levels[gameState.level].time;
    startTimer();
}

// Update UI
function updateUI() {
    document.getElementById('levelNumber').textContent = gameState.level;
    document.getElementById('levelName').textContent = levels[gameState.level].name;
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('combo').textContent = gameState.combo;
    document.getElementById('timer').textContent = gameState.timeLeft.toFixed(1);
    
    // Update progress
    const progress = (gameState.targetFound / gameState.targetsNeeded) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
    document.getElementById('progressText').textContent = 
        `Find ${gameState.targetsNeeded - gameState.targetFound} more squares to complete level ${gameState.level}`;
}

// Complete level
function completeLevel() {
    clearInterval(gameState.timerInterval);
    gameState.gameActive = false;

    playSound('levelUp');

    // Usar LevelTransition en vez del overlay agresivo
    if (window.ChessGameLibrary && window.ChessGameLibrary.LevelTransition) {
        window.ChessGameLibrary.LevelTransition.show({
            levelNumber: gameState.level + 1,
            levelName: gameState.level < Object.keys(levels).length ? `Speed: ${levels[gameState.level + 1].time}s` : 'Final',
            icon: '🎉',
            duration: 2500,
            onComplete: () => {
                // Avanzar automáticamente al siguiente nivel
                nextLevel();
            }
        });
    } else {
        // Fallback: usar overlay viejo si la librería no está
        document.getElementById('gameOverTitle').textContent = 'LEVEL COMPLETE!';
        document.getElementById('finalScore').textContent = `Score: ${gameState.score}`;
        document.getElementById('gameOverScreen').style.display = 'flex';
    }

    // Track completion
    gtag('event', 'level_complete', {
        'level': gameState.level,
        'score': gameState.score,
        'time': levels[gameState.level].time - gameState.timeLeft
    });
}

// Game over
function gameOver() {
    clearInterval(gameState.timerInterval);
    gameState.gameActive = false;

    // ✅ CAPTURAR estadísticas ANTES de mostrar overlay (antes de cualquier reset)
    if (window.captureGameStats) {
        window.captureGameStats();
    }

    // ✅ Mostrar primero el overlay de "GAME OVER"
    document.getElementById('gameOverTitle').textContent = 'GAME OVER!';
    document.getElementById('finalScore').textContent = `Final Score: ${gameState.score}`;
    document.getElementById('gameOverScreen').style.display = 'flex';

    // ✅ Después de 2 segundos, ocultar overlay y mostrar modal de leaderboard
    setTimeout(() => {
        document.getElementById('gameOverScreen').style.display = 'none';

        // Mostrar modal de Game Over con opciones de submit
        if (window.showLeaderboardGameOverModal) {
            window.showLeaderboardGameOverModal();
        }
    }, 2000);

    // Track game over
    gtag('event', 'game_over', {
        'level': gameState.level,
        'score': gameState.score,
        'targets_found': totalTargetsFound
    });
}

// Start game
function startGame() {
    gameState.gameStarted = true;
    gameState.gameActive = true;
    gameState.targetFound = 0;
    gameState.combo = 1;

    const levelConfig = levels[gameState.level];
    gameState.targetsNeeded = levelConfig.targets;

    // NEVER generate new target - always keep the current one shown!
    // This prevents confusion when pressing START GAME

    resetTimer();
    updateUI();

    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;

    // Track game start
    gtag('event', 'game_start_button', {
        'level': gameState.level
    });
}

// Pause game
function pauseGame() {
    if (gameState.gameActive) {
        clearInterval(gameState.timerInterval);
        gameState.gameActive = false;
        document.getElementById('pauseBtn').textContent = 'RESUME';
    } else {
        startTimer();
        gameState.gameActive = true;
        document.getElementById('pauseBtn').textContent = 'PAUSE';
    }
}

// Toggle coordinate display
function toggleCoordinates() {
    gameState.showCoordinates = !gameState.showCoordinates;
    createBoard();
    document.getElementById('helpBtn').textContent = 
        gameState.showCoordinates ? 'HIDE COORDINATES' : 'SHOW COORDINATES';
}

// Next level
function nextLevel() {
    if (gameState.level < Object.keys(levels).length) {
        gameState.level++;
        gameState.targetFound = 0;
        gameState.combo = 1;
        gameState.gameStarted = false;
        gameState.gameActive = false;
        document.getElementById('gameOverScreen').style.display = 'none';
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;

        // Generate new target for next level
        generateNewTarget();
        gameState.timeLeft = levels[gameState.level].time;
        updateUI();
    } else {
        // Juego completado - todos los niveles terminados
        showGameCompleted();
    }
}

// Mostrar pantalla de juego completado
function showGameCompleted() {
    clearInterval(gameState.timerInterval);
    gameState.gameActive = false;

    // ✅ CAPTURAR estadísticas ANTES de mostrar overlay (antes de cualquier reset)
    if (window.captureGameStats) {
        window.captureGameStats();
    }

    // ✅ Mostrar primero el overlay de "GAME COMPLETED"
    document.getElementById('gameOverTitle').textContent = '🏆 GAME COMPLETED! 🏆';
    document.getElementById('finalScore').textContent = `Final Score: ${gameState.score}`;
    document.getElementById('gameOverScreen').style.display = 'flex';

    // ✅ Después de 2 segundos, ocultar overlay y mostrar modal de victoria
    setTimeout(() => {
        document.getElementById('gameOverScreen').style.display = 'none';

        // Mostrar modal de Victoria con opciones de submit
        if (window.showLeaderboardVictoryModal) {
            window.showLeaderboardVictoryModal();
        }
    }, 2000);

    // Track game completion
    gtag('event', 'game_completed', {
        'score': gameState.score,
        'final_level': gameState.level,
        'total_targets': totalTargetsFound,
        'max_combo': maxComboAchieved
    });
}

// Play again
function playAgain() {
    // Resetear al nivel 1
    gameState.level = 1;
    gameState.targetFound = 0;
    gameState.score = 0;
    gameState.combo = 1;
    gameState.gameStarted = false;
    gameState.gameActive = false;
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;

    // ✅ Resetear estadísticas de sesión
    maxComboAchieved = 1;
    totalTargetsFound = 0;
    window.maxComboAchieved = maxComboAchieved;
    window.totalTargetsFound = totalTargetsFound;
    console.log('🔄 Session statistics reset');

    // Restaurar botón "Next Level" si estaba oculto
    const nextLevelBtn = document.getElementById('nextLevelBtn');
    if (nextLevelBtn) {
        nextLevelBtn.textContent = 'NEXT LEVEL';
        nextLevelBtn.style.display = 'block';
    }

    // Generate new target for fresh start
    generateNewTarget();
    gameState.timeLeft = levels[gameState.level].time;
    updateUI();
}

// Event listeners
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('pauseBtn').addEventListener('click', pauseGame);
document.getElementById('helpBtn').addEventListener('click', toggleCoordinates);

// Los siguientes botones fueron removidos del HTML porque ahora usamos modales de leaderboard
// Solo agregar listeners si los botones existen (para compatibilidad)
document.getElementById('nextLevelBtn')?.addEventListener('click', nextLevel);
document.getElementById('playAgainBtn')?.addEventListener('click', playAgain);

document.getElementById('soundToggle')?.addEventListener('click', toggleSound);
document.getElementById('btnHome')?.addEventListener('click', () => {
    window.location.href = '../../index.html';
});

// Initialize when page loads
window.addEventListener('load', initGame);

// Prevent context menu on mobile
document.addEventListener('contextmenu', e => e.preventDefault());

// Clean up animations after they complete
document.addEventListener('animationend', (e) => {
    if (e.target.classList.contains('correct') || e.target.classList.contains('wrong')) {
        e.target.classList.remove('correct', 'wrong');
    }
});

// ========================================
// LEADERBOARD INTEGRATION
// ========================================

/**
 * Botón "Leaderboard" del header - Mostrar modal
 */
document.getElementById('btnLeaderboard')?.addEventListener('click', () => {
    showLeaderboardModal('square-rush');
});