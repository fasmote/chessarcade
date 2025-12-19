/**
 * ========================================
 * HAMBURGER MENU - Biblioteca Compartida
 * ========================================
 *
 * Menu hamburguesa estandarizado para todos los juegos de ChessArcade.
 *
 * USO:
 * 1. Incluir este script en el HTML
 * 2. Incluir hamburger-menu.css
 * 3. Llamar: HamburgerMenu.init({ currentGame: 'square-rush', ... })
 *
 * OPCIONES:
 * - currentGame: ID del juego actual (para destacarlo)
 * - gameId: ID para el leaderboard
 * - soundManager: Referencia al SoundManager del juego (opcional)
 * - containerSelector: Selector donde insertar el menu (default: 'header' o 'body')
 */

(function() {
    'use strict';

    // ========================================
    // CONFIGURACION DE JUEGOS
    // ========================================

    const GAMES = [
        { id: 'knight-quest', name: 'Knight Quest', icon: '♞', path: '../knight-quest/index.html' },
        { id: 'square-rush', name: 'Square Rush', icon: '🎯', path: '../square-rush/index.html' },
        { id: 'memory-matrix', name: 'Memory Matrix', icon: '🧠', path: '../memory-matrix-v2/index.html' },
        { id: 'master-sequence', name: 'Master Sequence', icon: '🎵', path: '../master-sequence/index.html' },
        { id: 'chessinfive', name: 'ChessInFive', icon: '⚔️', path: '../chessinfive/index.html' },
        { id: 'criptocaballo', name: 'CriptoCaballo', icon: '🔐', path: '../criptocaballo/index.html' }
    ];

    // ========================================
    // ESTADO
    // ========================================

    let config = {
        currentGame: null,
        gameId: null,
        soundManager: null,
        containerSelector: null
    };

    let isGamesExpanded = true; // Expandido por defecto

    // ========================================
    // CREAR HTML
    // ========================================

    function createMenuHTML() {
        const menuHTML = `
            <div class="hamburger-menu-container" id="hamburgerMenuContainer">
                <button class="hamburger-btn" id="hamburgerBtn" aria-label="Menu">
                    <span class="hamburger-icon">☰</span>
                </button>
                <div class="hamburger-dropdown" id="hamburgerDropdown">
                    <a href="../../index.html" class="hamburger-item">
                        <span class="hamburger-item-icon">🏠</span>
                        <span class="hamburger-item-text">Home</span>
                    </a>
                    <button class="hamburger-item" id="hamburgerLeaderboard">
                        <span class="hamburger-item-icon">🏆</span>
                        <span class="hamburger-item-text">Leaderboard</span>
                    </button>
                    <button class="hamburger-item" id="hamburgerSound">
                        <span class="hamburger-item-icon">🔊</span>
                        <span class="hamburger-item-text">Sound: ON</span>
                    </button>
                    <div class="hamburger-divider"></div>
                    <button class="hamburger-item hamburger-games-toggle" id="hamburgerGamesToggle">
                        <span class="hamburger-item-icon">🎮</span>
                        <span class="hamburger-item-text">Games</span>
                        <span class="hamburger-arrow" id="hamburgerArrow">▲</span>
                    </button>
                    <div class="hamburger-games-submenu show" id="hamburgerGamesSubmenu">
                        ${createGamesListHTML()}
                    </div>
                </div>
            </div>
        `;
        return menuHTML;
    }

    function createGamesListHTML() {
        return GAMES.map(game => {
            const isActive = game.id === config.currentGame;
            const activeClass = isActive ? 'active' : '';
            return `
                <a href="${game.path}" class="hamburger-item hamburger-game ${activeClass}">
                    <span class="hamburger-item-icon">${game.icon}</span>
                    <span class="hamburger-item-text">${game.name}</span>
                </a>
            `;
        }).join('');
    }

    // ========================================
    // INSERTAR EN DOM
    // ========================================

    function insertMenu() {
        const menuHTML = createMenuHTML();

        // Siempre insertar al inicio del body como fixed para consistencia
        document.body.insertAdjacentHTML('afterbegin', menuHTML);

        const menuContainer = document.getElementById('hamburgerMenuContainer');
        if (menuContainer) {
            // Posición fija en esquina superior derecha
            menuContainer.style.position = 'fixed';
            menuContainer.style.top = '10px';
            menuContainer.style.right = '10px';
            menuContainer.style.zIndex = '9999';
        }

        console.log('🍔 [HamburgerMenu] Menu inserted at fixed position (top-right)');
    }

    // ========================================
    // EVENT LISTENERS
    // ========================================

    function attachEventListeners() {
        console.log('🍔 [HamburgerMenu] Attaching event listeners...');

        const hamburgerBtn = document.getElementById('hamburgerBtn');
        const hamburgerDropdown = document.getElementById('hamburgerDropdown');
        const hamburgerLeaderboard = document.getElementById('hamburgerLeaderboard');
        const hamburgerSound = document.getElementById('hamburgerSound');
        const hamburgerGamesToggle = document.getElementById('hamburgerGamesToggle');
        const hamburgerGamesSubmenu = document.getElementById('hamburgerGamesSubmenu');
        const hamburgerArrow = document.getElementById('hamburgerArrow');

        console.log('🍔 [HamburgerMenu] Elements:', {
            hamburgerBtn: !!hamburgerBtn,
            hamburgerDropdown: !!hamburgerDropdown
        });

        if (!hamburgerBtn || !hamburgerDropdown) {
            console.error('🍔 [HamburgerMenu] ERROR: Menu elements not found!');
            return;
        }

        // Toggle dropdown principal
        hamburgerBtn.addEventListener('click', (e) => {
            console.log('🍔 [HamburgerMenu] Button CLICKED!');
            e.stopPropagation();
            hamburgerDropdown.classList.toggle('show');
            console.log('🍔 [HamburgerMenu] Dropdown show:', hamburgerDropdown.classList.contains('show'));
        });

        // Cerrar al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!hamburgerBtn.contains(e.target) && !hamburgerDropdown.contains(e.target)) {
                hamburgerDropdown.classList.remove('show');
                // También cerrar submenu de games
                if (hamburgerGamesSubmenu) {
                    hamburgerGamesSubmenu.classList.remove('show');
                    isGamesExpanded = false;
                    if (hamburgerArrow) hamburgerArrow.textContent = '▼';
                }
            }
        });

        // Leaderboard button
        if (hamburgerLeaderboard) {
            hamburgerLeaderboard.addEventListener('click', () => {
                hamburgerDropdown.classList.remove('show');
                if (window.showLeaderboardModal && config.gameId) {
                    window.showLeaderboardModal(config.gameId);
                }
            });
        }

        // Sound toggle
        if (hamburgerSound) {
            updateSoundText();
            hamburgerSound.addEventListener('click', () => {
                toggleSound();
                updateSoundText();
                hamburgerDropdown.classList.remove('show');
            });
        }

        // Games submenu toggle
        if (hamburgerGamesToggle && hamburgerGamesSubmenu) {
            hamburgerGamesToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                isGamesExpanded = !isGamesExpanded;
                hamburgerGamesSubmenu.classList.toggle('show');
                if (hamburgerArrow) {
                    hamburgerArrow.textContent = isGamesExpanded ? '▲' : '▼';
                }
            });
        }

        console.log('🍔 [HamburgerMenu] Event listeners attached');
    }

    // ========================================
    // SOUND MANAGEMENT
    // ========================================

    function toggleSound() {
        // Intentar usar el SoundManager proporcionado
        if (config.soundManager && config.soundManager.toggleMute) {
            config.soundManager.toggleMute();
            return;
        }

        // Fallback: buscar SoundManager en window
        if (window.SoundManager && window.SoundManager.toggleMute) {
            window.SoundManager.toggleMute();
            return;
        }

        // Fallback: buscar botón de sonido existente y simuler click
        const soundBtn = document.getElementById('soundToggle') || document.getElementById('btnSound');
        if (soundBtn) {
            soundBtn.click();
        }
    }

    function isSoundEnabled() {
        // Intentar usar el SoundManager proporcionado
        if (config.soundManager && config.soundManager.isMuted) {
            return !config.soundManager.isMuted();
        }

        // Fallback: buscar SoundManager en window
        if (window.SoundManager && window.SoundManager.isMuted) {
            return !window.SoundManager.isMuted();
        }

        // Fallback: buscar en localStorage
        const stored = localStorage.getItem(config.currentGame + 'Sound') ||
                       localStorage.getItem('squareRushSound') ||
                       localStorage.getItem('soundEnabled');
        return stored !== 'disabled' && stored !== 'false';
    }

    function updateSoundText() {
        const hamburgerSound = document.getElementById('hamburgerSound');
        if (!hamburgerSound) return;

        const enabled = isSoundEnabled();
        hamburgerSound.innerHTML = enabled
            ? '<span class="hamburger-item-icon">🔊</span><span class="hamburger-item-text">Sound: ON</span>'
            : '<span class="hamburger-item-icon">🔇</span><span class="hamburger-item-text">Sound: OFF</span>';
    }

    // ========================================
    // API PUBLICA
    // ========================================

    window.HamburgerMenu = {
        /**
         * Inicializar el menu hamburguesa
         * @param {Object} options - Opciones de configuracion
         * @param {string} options.currentGame - ID del juego actual
         * @param {string} options.gameId - ID para el leaderboard
         * @param {Object} options.soundManager - Referencia al SoundManager (opcional)
         * @param {string} options.containerSelector - Selector CSS del contenedor (opcional)
         */
        init: function(options = {}) {
            console.log('🍔 [HamburgerMenu] Initializing...', options);

            // Guardar configuracion
            config = {
                currentGame: options.currentGame || null,
                gameId: options.gameId || options.currentGame || null,
                soundManager: options.soundManager || null,
                containerSelector: options.containerSelector || null
            };

            console.log('🍔 [HamburgerMenu] Config set:', config);
            console.log('🍔 [HamburgerMenu] Document readyState:', document.readyState);

            // Insertar menu y attachar eventos
            const doInit = () => {
                console.log('🍔 [HamburgerMenu] doInit called');
                insertMenu();
                attachEventListeners();
                console.log('🍔 [HamburgerMenu] Initialized successfully!');
            };

            // Esperar a que el DOM este listo
            if (document.readyState === 'loading') {
                console.log('🍔 [HamburgerMenu] Waiting for DOMContentLoaded...');
                document.addEventListener('DOMContentLoaded', doInit);
            } else {
                console.log('🍔 [HamburgerMenu] DOM already ready, initializing now');
                doInit();
            }
        },

        // Actualizar estado del sonido (llamar cuando cambie externamente)
        updateSoundState: updateSoundText,

        // Obtener lista de juegos
        getGames: () => GAMES,

        // Agregar un juego dinamicamente
        addGame: function(game) {
            GAMES.push(game);
        }
    };

    console.log('🍔 [HamburgerMenu] Library loaded');

})();
