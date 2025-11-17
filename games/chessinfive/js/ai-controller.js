/**
 * ==========================================
 * AI CONTROLLER
 * ==========================================
 *
 * Este módulo maneja la integración de la IA con el juego.
 * Coordina cuándo la IA debe jugar y ejecuta sus movimientos.
 */

const AIController = {
    aiEnabled: {
        cyan: false,      // Is Cyan controlled by AI?
        magenta: false    // Is Magenta controlled by AI?
    },
    isThinking: false,    // Prevent multiple simultaneous AI moves

    /**
     * Initialize AI controller
     */
    init() {
        this.attachUIListeners();
        console.log('🤖 AI Controller initialized');
    },

    /**
     * Attach event listeners for AI toggles (one per player)
     */
    attachUIListeners() {
        // Cyan AI Toggle
        const aiToggleCyan = document.getElementById('ai-toggle-cyan');
        if (aiToggleCyan) {
            aiToggleCyan.addEventListener('change', (e) => {
                this.aiEnabled.cyan = e.target.checked;
                console.log(`🤖 Cyan AI ${this.aiEnabled.cyan ? 'enabled' : 'disabled'}`);
                this.updateAIIndicator('cyan');

                // If AI is enabled and it's cyan's turn, make move
                if (this.aiEnabled.cyan && GameState.currentPlayer === 'cyan' && !GameState.gameOver) {
                    setTimeout(() => this.makeAIMove(), 500);
                }
            });
        }

        // Magenta AI Toggle
        const aiToggleMagenta = document.getElementById('ai-toggle-magenta');
        if (aiToggleMagenta) {
            aiToggleMagenta.addEventListener('change', (e) => {
                this.aiEnabled.magenta = e.target.checked;
                console.log(`🤖 Magenta AI ${this.aiEnabled.magenta ? 'enabled' : 'disabled'}`);
                this.updateAIIndicator('magenta');

                // If AI is enabled and it's magenta's turn, make move
                if (this.aiEnabled.magenta && GameState.currentPlayer === 'magenta' && !GameState.gameOver) {
                    setTimeout(() => this.makeAIMove(), 500);
                }
            });
        }
    },

    /**
     * Check if it's AI's turn
     */
    isAITurn() {
        const currentPlayer = GameState.currentPlayer;
        return this.aiEnabled[currentPlayer] && !GameState.gameOver;
    },

    /**
     * Check if should make AI move after player moved
     */
    checkAndMakeAIMove() {
        if (this.isAITurn() && !this.isThinking) {
            // Add small delay so player sees their move complete
            setTimeout(() => {
                this.makeAIMove();
            }, 500);
        }
    },

    /**
     * Make AI move
     */
    async makeAIMove() {
        const currentPlayer = GameState.currentPlayer;

        // Check if current player is AI-controlled
        if (!this.aiEnabled[currentPlayer] || this.isThinking || GameState.gameOver) {
            return;
        }

        this.isThinking = true;
        this.showThinkingIndicator(true);

        try {
            console.log(`🤖 AI (${currentPlayer}) is making a move...`);

            // Get AI decision
            const move = await ChessInFiveAI.makeMove(GameState);

            if (!move) {
                console.error('🤖 AI returned no move!');
                this.isThinking = false;
                this.showThinkingIndicator(false);
                return;
            }

            // Execute the move based on phase
            if (move.phase === 'gravity') {
                this.executeGravityMove(move);
            } else if (move.phase === 'chess') {
                this.executeChessMove(move);
            }

        } catch (error) {
            console.error('🤖 AI error:', error);
            this.isThinking = false;
            this.showThinkingIndicator(false);
        } finally {
            this.isThinking = false;
            this.showThinkingIndicator(false);
        }
    },

    /**
     * Execute gravity phase move
     */
    executeGravityMove(move) {
        const { pieceType, col } = move;

        console.log(`🤖 AI drops ${pieceType} in column ${col}`);

        // Select the piece type (both in state and UI)
        GameState.selectedPieceType = pieceType;
        UIController.selectPiece(pieceType); // Mark visually in AI's selector

        // Small delay to show the selection
        setTimeout(() => {
            this.executePlacement(pieceType, col);
        }, 300);
    },

    /**
     * Execute the actual placement after showing selection
     */
    executePlacement(pieceType, col) {
        // Place the piece
        const result = GameState.placePiece(col, pieceType);

        if (result) {
            const { row, col: placedCol } = result;

            // Render piece with animation
            BoardRenderer.renderPiece(row, placedCol, GameState.currentPlayer, pieceType, true);

            // Play sound
            SoundManager.play('place');

            // Check for win
            const winResult = WinDetection.checkWin(row, placedCol);
            if (winResult) {
                GravityPhase.handleWin(winResult);
                return;
            }

            // Check if gravity phase is complete
            if (GameState.isGravityPhaseComplete()) {
                setTimeout(() => {
                    GravityPhase.transitionToChessPhase();
                }, 1000);
                return;
            }

            // Switch player
            GameState.switchPlayer();

            // Update UI (updatePieceSelector will auto-select first available piece)
            UIController.updateTurnIndicator();
            UIController.updatePlayerInfo();
            UIController.updatePieceSelector(); // This auto-selects a piece for the new player

            // Check if next player is also AI (delayed to avoid race condition)
            setTimeout(() => this.checkAndMakeAIMove(), 100);

        } else {
            console.error('🤖 AI tried invalid gravity move!');
            SoundManager.play('invalid');
        }
    },

    /**
     * Execute chess phase move
     */
    executeChessMove(move) {
        const { from, to } = move;

        console.log(`🤖 AI moves from (${from.row},${from.col}) to (${to.row},${to.col})`);

        // Validate move
        if (!PieceManager.isValidMove(from.row, from.col, to.row, to.col)) {
            console.error('🤖 AI tried invalid chess move!');
            SoundManager.play('invalid');
            return;
        }

        // Move piece in game state
        const success = GameState.movePiece(from.row, from.col, to.row, to.col);

        if (success) {
            // Update board visuals
            BoardRenderer.renderBoard();

            // Highlight last move (from/to squares)
            BoardRenderer.highlightLastMove();

            // Play sound
            SoundManager.play('move');

            // Check for win
            const winResult = WinDetection.checkWin(to.row, to.col);
            if (winResult) {
                ChessPhase.handleWin(winResult);
                return;
            }

            // Switch player
            GameState.switchPlayer();

            // Update UI
            UIController.updateTurnIndicator();
            UIController.updatePlayerInfo();

            // Check if next player is also AI (delayed to avoid race condition)
            setTimeout(() => this.checkAndMakeAIMove(), 100);

        } else {
            console.error('🤖 AI chess move failed!');
            SoundManager.play('invalid');
        }
    },

    /**
     * Show/hide "AI is thinking..." hourglass indicator in player panel
     */
    showThinkingIndicator(show, player = null) {
        // Use current player if not specified
        const targetPlayer = player || GameState.currentPlayer;

        // Show/hide hourglass in the correct player panel
        const hourglassCyan = document.getElementById('aiThinkingCyan');
        const hourglassMagenta = document.getElementById('aiThinkingMagenta');

        if (hourglassCyan) {
            hourglassCyan.style.display = (show && targetPlayer === 'cyan') ? 'inline-block' : 'none';
        }
        if (hourglassMagenta) {
            hourglassMagenta.style.display = (show && targetPlayer === 'magenta') ? 'inline-block' : 'none';
        }
    },

    /**
     * Update AI indicator in UI for a specific player
     */
    updateAIIndicator(player) {
        const indicator = document.getElementById(`ai-status-${player}`);
        if (indicator) {
            indicator.textContent = this.aiEnabled[player] ? '🤖 AI' : '👤 Human';
        }
    }
};

// ========================================
// EXPONER A WINDOW (IMPORTANTE!)
// ========================================
// LECCIÓN APRENDIDA: Necesario para que leaderboard-integration.js
// pueda detectar si los jugadores son AI o humanos
window.AIController = AIController;

console.log('🤖 AI Controller loaded');
console.log('✅ AIController exposed to window for leaderboard integration');
