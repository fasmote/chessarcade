/**
 * UI CONTROLLER
 * Handles all user interface updates
 */

const UIController = {
    /**
     * Initialize UI controller
     */
    init() {
        this.attachEventListeners();
        this.updateAll();

        // MOBILE: Inicializar visibilidad de paneles
        const isMobile = window.innerWidth <= 1024;
        if (isMobile) {
            const cyanPanelContainer = document.querySelector('.player-panel-left');
            const magentaPanelContainer = document.querySelector('.player-panel-right');

            // Al inicio siempre es turno de Cyan
            if (GameState.currentPlayer === 'cyan') {
                cyanPanelContainer.classList.remove('mobile-hidden');
                magentaPanelContainer.classList.add('mobile-hidden');
            } else {
                cyanPanelContainer.classList.add('mobile-hidden');
                magentaPanelContainer.classList.remove('mobile-hidden');
            }

            console.log('📱 Mobile panel visibility initialized - Turn:', GameState.currentPlayer);
        }

        console.log('🎮 UI controller initialized');
    },

    /**
     * Attach event listeners to UI elements
     */
    attachEventListeners() {
        // Home button
        document.getElementById('btnHome').addEventListener('click', () => {
            window.location.href = '../../index.html';
        });

        // Sound toggle
        document.getElementById('soundToggle').addEventListener('click', () => {
            this.toggleSound();
        });

        // Piece selector buttons
        const pieceOptions = document.querySelectorAll('.piece-option');
        pieceOptions.forEach(btn => {
            btn.addEventListener('click', () => {
                const pieceType = btn.dataset.piece;
                this.selectPiece(pieceType);
            });
        });

        // New game button
        document.getElementById('btnNewGame').addEventListener('click', () => {
            this.newGame();
        });

        // Help button
        document.getElementById('btnHelp').addEventListener('click', () => {
            this.showHelp();
        });

        // Close help button
        document.getElementById('btnCloseHelp').addEventListener('click', () => {
            this.hideHelp();
        });

        // Game over modal buttons
        document.getElementById('btnPlayAgain').addEventListener('click', () => {
            this.newGame();
        });

        document.getElementById('btnBackHome').addEventListener('click', () => {
            window.location.href = '../../index.html';
        });

        // Close game over modal (X button) - allows analyzing the game
        document.getElementById('btnCloseGameOver').addEventListener('click', () => {
            this.hideGameOver();
        });

        // Undo button (future implementation)
        document.getElementById('btnUndo').addEventListener('click', () => {
            console.log('⏮️ Undo not implemented yet');
        });
    },

    /**
     * Update all UI elements
     */
    updateAll() {
        this.updatePhaseIndicator();
        this.updatePlayerInfo();
        this.updateTurnIndicator();
        this.updateSoundButton();
        this.updatePieceSelector();
    },

    /**
     * Select a piece type
     */
    selectPiece(pieceType) {
        const player = GameState.currentPlayer;

        // Check if piece is available
        if (GameState.inventory[player][pieceType] <= 0) {
            SoundManager.play('invalid');
            return;
        }

        // Set selected piece
        GameState.selectedPieceType = pieceType;

        // Update visual selection
        const buttons = document.querySelectorAll('.piece-option');
        buttons.forEach(btn => {
            if (btn.dataset.piece === pieceType) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });

        SoundManager.play('select');
        console.log(`✅ Selected ${pieceType}`);
    },

    /**
     * Update piece selector (counts, symbols, disabled states)
     * Actualiza AMBOS selectores (cyan y magenta)
     */
    updatePieceSelector() {
        const currentPlayer = GameState.currentPlayer;
        const pieceTypes = ['rook', 'knight', 'bishop', 'queen', 'king'];

        // Show/hide both selectors based on phase
        const selectorCyan = document.getElementById('pieceSelector');
        const selectorMagenta = document.getElementById('pieceSelectorMagenta');

        if (GameState.phase === 'gravity') {
            selectorCyan.style.display = 'block';
            selectorMagenta.style.display = 'block';
        } else {
            selectorCyan.style.display = 'none';
            selectorMagenta.style.display = 'none';
            return;
        }

        // Update CYAN selector
        this.updatePlayerSelector('cyan', currentPlayer === 'cyan');

        // Update MAGENTA selector
        this.updatePlayerSelector('magenta', currentPlayer === 'magenta');

        // Auto-select first available piece if none selected
        const inventory = GameState.inventory[currentPlayer];
        if (!GameState.selectedPieceType || inventory[GameState.selectedPieceType] <= 0) {
            const firstAvailable = pieceTypes.find(type => inventory[type] > 0);
            if (firstAvailable) {
                this.selectPiece(firstAvailable);
            }
        }
    },

    /**
     * Update a specific player's selector
     * @param {string} player - 'cyan' or 'magenta'
     * @param {boolean} isActive - true if this is the current player's turn
     */
    updatePlayerSelector(player, isActive) {
        const inventory = GameState.inventory[player];
        const pieceTypes = ['rook', 'knight', 'bishop', 'queen', 'king'];
        const suffix = player === 'magenta' ? 'Magenta' : '';

        pieceTypes.forEach(type => {
            const capitalType = type.charAt(0).toUpperCase() + type.slice(1);
            const symbolId = `selected${capitalType}${suffix}`;
            const countId = `count${capitalType}${suffix}`;

            const symbol = document.getElementById(symbolId);
            const count = document.getElementById(countId);

            if (!symbol || !count) return; // Safety check

            // Update symbol
            symbol.textContent = PieceManager.getSymbol(player, type);
            symbol.style.color = player === 'cyan' ? 'var(--cyan-primary)' : 'var(--magenta-primary)';

            // Update count
            count.textContent = inventory[type];
        });

        // Enable/disable entire selector based on turn
        const selector = player === 'cyan'
            ? document.getElementById('pieceSelector')
            : document.getElementById('pieceSelectorMagenta');

        if (isActive) {
            selector.classList.remove('disabled');
            // Enable individual buttons based on inventory
            const buttons = selector.querySelectorAll('.piece-option');
            buttons.forEach(btn => {
                const type = btn.dataset.piece;
                if (inventory[type] <= 0) {
                    btn.disabled = true;
                    btn.classList.remove('selected');
                } else {
                    btn.disabled = false;
                }
            });
        } else {
            // Disable entire selector for non-active player
            selector.classList.add('disabled');
            const buttons = selector.querySelectorAll('.piece-option');
            buttons.forEach(btn => {
                btn.disabled = true;
                btn.classList.remove('selected');
            });
        }
    },

    /**
     * Update phase indicator
     */
    updatePhaseIndicator() {
        const phaseTitle = document.getElementById('phaseTitle');
        const phaseDescription = document.getElementById('phaseDescription');
        const phaseIndicator = document.querySelector('.phase-indicator');
        const gameContainer = document.querySelector('.game-container');
        const isMobile = window.innerWidth <= 1024;

        if (GameState.phase === 'gravity') {
            phaseTitle.textContent = 'PHASE 1: GRAVITY PLACEMENT';
            phaseDescription.textContent = 'Click on a column to drop your piece';

            // Remove phase-chess class
            gameContainer.classList.remove('phase-chess');
        } else {
            phaseTitle.textContent = 'PHASE 2: CHESS MOVEMENT';
            phaseDescription.textContent = 'Move your pieces to align 5 in a row';

            // Add phase-chess class for styling
            gameContainer.classList.add('phase-chess');

            // CROSS-DEVICE: Animate phase change (desktop y mobile)
            if (phaseIndicator) {
                // Reset animation
                phaseIndicator.classList.remove('animate-fade', 'fade-complete');

                // Force reflow to restart animation
                void phaseIndicator.offsetWidth;

                // Add animation class
                phaseIndicator.classList.add('animate-fade');

                // Hide after animation (2s)
                setTimeout(() => {
                    phaseIndicator.classList.add('fade-complete');
                }, 2000);

                // Re-attach click handler (may have been removed)
                phaseIndicator.onclick = () => {
                    phaseIndicator.classList.add('fade-complete');
                    console.log('🖱️ Phase 2 indicator closed manually');
                };
            }
        }
    },

    /**
     * Update player information panels
     */
    updatePlayerInfo() {
        // Update pieces left
        document.getElementById('cyanPiecesLeft').textContent = GameState.getTotalPieces('cyan');
        document.getElementById('magentaPiecesLeft').textContent = GameState.getTotalPieces('magenta');

        // Update inventories
        this.updateInventory('cyan');
        this.updateInventory('magenta');

        // Update board border según turno
        const boardContainer = document.querySelector('.board-container');
        if (GameState.currentPlayer === 'cyan') {
            boardContainer.classList.remove('turn-magenta');
            boardContainer.classList.add('turn-cyan');
        } else {
            boardContainer.classList.remove('turn-cyan');
            boardContainer.classList.add('turn-magenta');
        }

        // Update active player highlight
        const cyanPanel = document.getElementById('playerCyan');
        const magentaPanel = document.getElementById('playerMagenta');
        const cyanPanelContainer = document.querySelector('.player-panel-left');
        const magentaPanelContainer = document.querySelector('.player-panel-right');

        // Detectar mobile
        const isMobile = window.innerWidth <= 1024;

        if (GameState.currentPlayer === 'cyan') {
            cyanPanel.classList.add('active');
            magentaPanel.classList.remove('active');

            // MOBILE: Solo mostrar panel del jugador activo (Fase 1 Y Fase 2)
            if (isMobile) {
                magentaPanelContainer.classList.add('mobile-hidden'); // Ocultar magenta (right)
                cyanPanelContainer.classList.remove('mobile-hidden'); // Mostrar cyan (left)
            } else {
                // Desktop: mostrar ambos
                cyanPanelContainer.classList.remove('mobile-hidden');
                magentaPanelContainer.classList.remove('mobile-hidden');
            }
        } else {
            magentaPanel.classList.add('active');
            cyanPanel.classList.remove('active');

            // MOBILE: Solo mostrar panel del jugador activo (Fase 1 Y Fase 2)
            if (isMobile) {
                cyanPanelContainer.classList.add('mobile-hidden'); // Ocultar cyan (left)
                magentaPanelContainer.classList.remove('mobile-hidden'); // Mostrar magenta (right)
            } else {
                // Desktop: mostrar ambos
                cyanPanelContainer.classList.remove('mobile-hidden');
                magentaPanelContainer.classList.remove('mobile-hidden');
            }
        }
    },

    /**
     * Update piece inventory display
     * MOBILE: Las piezas son clickeables y funcionan como selector
     */
    updateInventory(player) {
        const inventoryEl = document.getElementById(`${player}Inventory`);
        inventoryEl.innerHTML = '';

        const inventory = GameState.inventory[player];
        const pieceTypes = ['rook', 'knight', 'bishop', 'queen', 'king'];
        const isMobile = window.innerWidth <= 1024;
        const isActivePlayer = GameState.currentPlayer === player;

        for (const type of pieceTypes) {
            const count = inventory[type];
            const total = type === 'queen' || type === 'king' ? 1 : 2;

            for (let i = 0; i < total; i++) {
                const piece = document.createElement('span');
                piece.className = 'inventory-piece';
                piece.textContent = PieceManager.getSymbol(player, type);

                // Marcar piezas usadas
                if (i >= count) {
                    piece.classList.add('used');
                }

                // MOBILE: Hacer piezas clickeables (solo las disponibles)
                if (isMobile && i < count && isActivePlayer && GameState.phase === 'gravity') {
                    piece.classList.add('piece'); // Clase adicional para CSS mobile
                    piece.dataset.piece = type;
                    piece.style.cursor = 'pointer';

                    // Event listener para seleccionar pieza
                    piece.addEventListener('click', () => {
                        // Solo permitir si es el turno del jugador
                        if (GameState.currentPlayer === player && GameState.phase === 'gravity') {
                            this.selectPiece(type);

                            // Visual feedback: highlight temporalmente
                            piece.style.transform = 'scale(1.3)';
                            setTimeout(() => {
                                piece.style.transform = '';
                            }, 200);
                        }
                    });
                }

                inventoryEl.appendChild(piece);
            }
        }
    },

    /**
     * Update turn indicator (Actualizar indicador de turno)
     *
     * Esta función se encarga de actualizar el indicador visual del turno actual.
     * Hace 3 cosas:
     * 1. Actualiza el texto ("CYAN PLAYER" o "MAGENTA PLAYER")
     * 2. Cambia el color del texto
     * 3. Cambia el borde y glow del contenedor
     *
     * Técnica: BEM-style modifiers con clases CSS
     * - Removemos las clases anteriores (.turn-cyan, .turn-magenta)
     * - Agregamos la clase correspondiente al jugador actual
     * - El CSS hace la transición suave automáticamente
     */
    updateTurnIndicator() {
        // 1. Obtener elementos del DOM
        const turnText = document.getElementById('currentTurnText');
        const turnContainer = document.querySelector('.turn-indicator');

        // 2. Validar que los elementos existen (null-safe)
        if (!turnText || !turnContainer) {
            console.warn('⚠️ Turn indicator elements not found in DOM');
            return;
        }

        // 3. Actualizar el texto del turno
        turnText.textContent = GameState.currentPlayer.toUpperCase() + ' PLAYER';

        // 4. Cambiar color del texto según jugador
        // Operador ternario: condición ? valor_si_true : valor_si_false
        turnText.style.color = GameState.currentPlayer === 'cyan'
            ? 'var(--cyan-primary)'  // Si es cyan, usar color cyan
            : 'var(--magenta-primary)'; // Si es magenta, usar color magenta

        // 5. Cambiar el borde y glow del contenedor
        // Primero removemos ambas clases (limpieza)
        turnContainer.classList.remove('turn-cyan', 'turn-magenta');
        // Luego agregamos la clase correspondiente al jugador actual
        turnContainer.classList.add(`turn-${GameState.currentPlayer}`);
        // Ejemplo: Si currentPlayer es 'cyan', agrega clase 'turn-cyan'
    },

    /**
     * Update sound button state
     */
    updateSoundButton() {
        const soundBtn = document.getElementById('soundToggle');
        const iconOn = soundBtn.querySelector('.icon-sound-on');
        const iconOff = soundBtn.querySelector('.icon-sound-off');

        if (SoundManager.isEnabled()) {
            iconOn.style.display = 'inline';
            iconOff.style.display = 'none';
        } else {
            iconOn.style.display = 'none';
            iconOff.style.display = 'inline';
        }
    },

    /**
     * Toggle sound
     */
    toggleSound() {
        SoundManager.toggle();
        this.updateSoundButton();
    },

    /**
     * Start new game
     */
    newGame() {
        // Hide game over modal
        document.getElementById('gameOverModal').style.display = 'none';

        // Reset Submit Score button to initial state
        // LECCIÓN APRENDIDA: El botón quedaba deshabilitado de la partida anterior
        const submitBtn = document.getElementById('gameOverSubmitScoreBtn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '🏆 SUBMIT SCORE';
            console.log('🔄 [CHESSINFIVE] Submit Score button reset for new game');
        }

        // Remove game-over class to hide NEW GAME button in mobile Phase 2
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.classList.remove('game-over');
        }

        // Reset game state
        GameState.init();

        // Clear board highlights
        BoardRenderer.clearHighlights();

        // Re-render board (clears all pieces)
        BoardRenderer.renderBoard();

        // Update UI
        this.updateAll();

        // CRITICAL: Check if AI is enabled and start AI move if it's Cyan's turn
        // This fixes the bug where AI doesn't activate on New Game if toggles are already ON
        if (AIController.isAITurn()) {
            setTimeout(() => {
                AIController.checkAndMakeAIMove();
            }, 500);
        }

        // Note: GravityPhase listeners are already attached (done once on page load)
        console.log('🆕 New game started');

        // Track in analytics
        gtag('event', 'new_game', {
            'game_name': 'chessinfive'
        });
    },

    /**
     * Show game over modal
     */
    showGameOver(winner) {
        const modal = document.getElementById('gameOverModal');
        const title = document.getElementById('winnerTitle');
        const message = document.getElementById('winnerMessage');
        const gameContainer = document.querySelector('.game-container');

        title.textContent = winner.toUpperCase() + ' PLAYER WINS!';
        title.style.color = winner === 'cyan' ? 'var(--cyan-primary)' : 'var(--magenta-primary)';
        message.textContent = 'Five pieces aligned!';

        // Add game-over class to show NEW GAME button in mobile
        if (gameContainer) {
            gameContainer.classList.add('game-over');
        }

        // Delay de 2 segundos para que el usuario disfrute la victoria
        setTimeout(() => {
            modal.style.display = 'flex';
        }, 2000);

        // Track in analytics
        gtag('event', 'game_complete', {
            'game_name': 'chessinfive',
            'winner': winner,
            'phase': GameState.phase
        });
    },

    /**
     * Show help modal
     */
    showHelp() {
        document.getElementById('helpModal').style.display = 'flex';
    },

    /**
     * Hide help modal
     */
    hideHelp() {
        document.getElementById('helpModal').style.display = 'none';
    },

    /**
     * Hide game over modal (allows user to analyze the game)
     */
    hideGameOver() {
        document.getElementById('gameOverModal').style.display = 'none';
        console.log('📊 Game over modal closed - analyzing game');
    }
};
