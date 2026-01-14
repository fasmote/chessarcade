/**
 * ============================================
 * CHESS GAME LIBRARY - PIECE ANIMATIONS
 * ============================================
 * Módulo de animaciones de piezas de ajedrez
 * Reutilizable para cualquier juego de ajedrez
 *
 * @version 1.0.0
 * @author ChessArcade Team
 * @license MIT
 */

// ============================================
// UTILIDADES DE POSICIÓN
// ============================================

/**
 * Obtiene las coordenadas pixel de una casilla del tablero
 * @param {string} square - Coordenada algebraica (ej: 'e4')
 * @returns {Object} {x, y} coordenadas en pixels
 */
function getSquarePosition(square) {
    const squareElement = document.querySelector(`[data-square="${square}"]`);
    if (!squareElement) return null;

    const rect = squareElement.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
}

/**
 * Obtiene las coordenadas pixel de un elemento (slot del banco)
 * @param {string|HTMLElement} element - Selector o elemento
 * @returns {Object} {x, y} coordenadas en pixels
 */
function getElementPosition(element) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return null;

    const rect = el.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
}

// ============================================
// ANIMACIÓN: PIEZA AL BANCO
// ============================================

/**
 * Anima una pieza desde el tablero hacia el banco
 *
 * @param {string} fromSquare - Casilla origen (ej: 'e4')
 * @param {string} piece - Código de pieza (ej: 'wK')
 * @param {string|HTMLElement} toBankSlot - Selector o elemento del slot destino
 * @param {Object} options - Opciones de animación
 * @param {number} options.duration - Duración en ms (default: 600)
 * @param {string} options.easing - Función CSS easing (default: 'ease-out')
 * @param {Function} options.onComplete - Callback al completar
 * @param {Function} options.onStart - Callback al iniciar
 *
 * @example
 * animatePieceToBank('e4', 'wK', '#bank-slot-1', {
 *     duration: 600,
 *     onComplete: () => console.log('Pieza en banco!')
 * });
 */
function animatePieceToBank(fromSquare, piece, toBankSlot, options = {}) {
    const {
        duration = 600,
        easing = 'ease-out',
        onComplete = () => {},
        onStart = () => {}
    } = options;

    // 1. Obtener posiciones
    const fromPos = getSquarePosition(fromSquare);
    const toPos = getElementPosition(toBankSlot);

    if (!fromPos || !toPos) {
        console.error('❌ No se pudo obtener posiciones para animación');
        return;
    }

    // 2. Obtener elemento de pieza
    const squareElement = document.querySelector(`[data-square="${fromSquare}"]`);
    const pieceElement = squareElement?.querySelector('.piece');

    if (!pieceElement) {
        console.error(`❌ No hay pieza en ${fromSquare}`);
        return;
    }

    // 3. Callback de inicio
    onStart();

    // 4. Crear pieza voladora (clone)
    const flyingPiece = pieceElement.cloneNode(true);
    flyingPiece.classList.add('flying-piece');

    // Estilos de la pieza voladora
    flyingPiece.style.position = 'fixed';
    flyingPiece.style.left = `${fromPos.x}px`;
    flyingPiece.style.top = `${fromPos.y}px`;
    flyingPiece.style.transform = 'translate(-50%, -50%)';
    flyingPiece.style.width = `${pieceElement.offsetWidth}px`;
    flyingPiece.style.height = `${pieceElement.offsetHeight}px`;
    flyingPiece.style.zIndex = '1000';
    flyingPiece.style.transition = `all ${duration}ms ${easing}`;
    flyingPiece.style.pointerEvents = 'none';

    // 5. Agregar al body
    document.body.appendChild(flyingPiece);

    // 6. Ocultar pieza original
    pieceElement.style.opacity = '0';

    // 7. Iniciar animación en el siguiente frame
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            // Mover a posición del banco
            flyingPiece.style.left = `${toPos.x}px`;
            flyingPiece.style.top = `${toPos.y}px`;

            // Escalar un poco mientras vuela
            flyingPiece.style.transform = 'translate(-50%, -50%) scale(0.8)';
        });
    });

    // 8. Al terminar animación
    setTimeout(() => {
        // Remover pieza voladora
        flyingPiece.remove();

        // Remover pieza original del tablero
        pieceElement.remove();

        // IMPORTANTE: Agregar pieza al slot del banco
        const bankSlotElement = typeof toBankSlot === 'string'
            ? document.querySelector(toBankSlot)
            : toBankSlot;

        if (bankSlotElement) {
            // Crear nueva pieza en el banco
            const bankPiece = document.createElement('img');
            bankPiece.className = 'piece';
            bankPiece.src = pieceElement.src;
            bankPiece.alt = piece;
            bankPiece.dataset.piece = piece;

            // Agregar al slot
            bankSlotElement.appendChild(bankPiece);

            console.log(`✅ Pieza ${piece} colocada en el banco`);
        }

        // Callback de completado
        onComplete();

        console.log(`✈️ Pieza ${piece} animada desde ${fromSquare} al banco`);
    }, duration);
}

// ============================================
// ANIMACIÓN: PIEZA DESDE BANCO
// ============================================

/**
 * Anima una pieza desde el banco hacia el tablero
 *
 * @param {string|HTMLElement} fromBankSlot - Selector o elemento del slot origen
 * @param {string} toSquare - Casilla destino (ej: 'e4')
 * @param {string} piece - Código de pieza (ej: 'wK')
 * @param {Object} options - Opciones de animación
 *
 * @example
 * animatePieceFromBank('#bank-slot-1', 'e4', 'wK', {
 *     duration: 500,
 *     onComplete: () => console.log('Pieza colocada!')
 * });
 */
function animatePieceFromBank(fromBankSlot, toSquare, piece, options = {}) {
    const {
        duration = 500,
        easing = 'ease-out',
        onComplete = () => {},
        onStart = () => {}
    } = options;

    // 1. Obtener posiciones
    const fromPos = getElementPosition(fromBankSlot);
    const toPos = getSquarePosition(toSquare);

    if (!fromPos || !toPos) {
        console.error('❌ No se pudo obtener posiciones para animación');
        return;
    }

    // 2. Obtener elemento de pieza del banco
    const bankSlotElement = typeof fromBankSlot === 'string'
        ? document.querySelector(fromBankSlot)
        : fromBankSlot;

    const pieceElement = bankSlotElement?.querySelector('.piece');

    if (!pieceElement) {
        console.error('❌ No hay pieza en el banco');
        return;
    }

    // 3. Callback de inicio
    onStart();

    // 4. Crear pieza voladora
    const flyingPiece = pieceElement.cloneNode(true);
    flyingPiece.classList.add('flying-piece');

    flyingPiece.style.position = 'fixed';
    flyingPiece.style.left = `${fromPos.x}px`;
    flyingPiece.style.top = `${fromPos.y}px`;
    flyingPiece.style.transform = 'translate(-50%, -50%) scale(0.8)';
    flyingPiece.style.width = `${pieceElement.offsetWidth}px`;
    flyingPiece.style.height = `${pieceElement.offsetHeight}px`;
    flyingPiece.style.zIndex = '1000';
    flyingPiece.style.transition = `all ${duration}ms ${easing}`;
    flyingPiece.style.pointerEvents = 'none';

    // 5. Agregar al body
    document.body.appendChild(flyingPiece);

    // 6. Ocultar pieza del banco
    pieceElement.style.opacity = '0';

    // 7. Iniciar animación
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            flyingPiece.style.left = `${toPos.x}px`;
            flyingPiece.style.top = `${toPos.y}px`;
            flyingPiece.style.transform = 'translate(-50%, -50%) scale(1)';
        });
    });

    // 8. Al terminar
    setTimeout(() => {
        // Remover pieza voladora
        flyingPiece.remove();

        // Remover pieza del banco
        pieceElement.remove();

        // Agregar pieza al tablero (usando función global showPiece)
        if (typeof showPiece === 'function') {
            showPiece(toSquare, piece);
        }

        // Callback
        onComplete();

        console.log(`✈️ Pieza ${piece} animada desde banco a ${toSquare}`);
    }, duration);
}

// ============================================
// ANIMACIÓN: OCULTAR PIEZAS
// ============================================

/**
 * Oculta múltiples piezas con animación hacia el banco
 *
 * @param {Array<string>} squares - Array de casillas (ej: ['e4', 'e5'])
 * @param {Object} options - Opciones
 *
 * @example
 * hidePiecesWithAnimation(['e1', 'e8', 'd1'], {
 *     stagger: 100, // 100ms entre cada pieza
 *     onComplete: () => console.log('Todas ocultas!')
 * });
 */
function hidePiecesWithAnimation(squares, options = {}) {
    const {
        stagger = 150,
        duration = 600,
        onComplete = () => {}
    } = options;

    let completedCount = 0;
    const totalPieces = squares.length;

    console.log(`🎯 hidePiecesWithAnimation: ${totalPieces} piezas a ocultar`);
    console.log(`📍 Casillas: ${squares.join(', ')}`);

    // Pre-asignar slots para evitar colisiones
    const emptySlots = [];
    const allSlots = document.querySelectorAll('.bank-piece-slot');

    console.log(`🏦 Slots totales en banco: ${allSlots.length}`);

    for (const slot of allSlots) {
        if (!slot.querySelector('.piece')) {
            emptySlots.push(slot);
        }
    }

    console.log(`✅ Slots VACÍOS disponibles: ${emptySlots.length}`);

    if (emptySlots.length < totalPieces) {
        console.error(`❌ ERROR: No hay suficientes slots! Necesito ${totalPieces}, tengo ${emptySlots.length}`);
    }

    squares.forEach((square, index) => {
        setTimeout(() => {
            const squareElement = document.querySelector(`[data-square="${square}"]`);
            const pieceElement = squareElement?.querySelector('.piece');

            console.log(`🔄 [${index + 1}/${totalPieces}] Procesando pieza en ${square}`);

            if (!pieceElement) {
                console.error(`❌ No hay pieza en casilla ${square}`);
                return;
            }

            if (!emptySlots[index]) {
                console.error(`❌ No hay slot disponible para pieza ${index + 1} (${square})`);
                return;
            }

            const piece = pieceElement.dataset.piece;
            console.log(`  ✈️ Animando ${piece} desde ${square} al slot ${index}`);

            // Usar slot pre-asignado (cada pieza a un slot diferente)
            animatePieceToBank(square, piece, emptySlots[index], {
                duration,
                onComplete: () => {
                    completedCount++;
                    console.log(`  ✅ ${piece} llegó al banco (${completedCount}/${totalPieces})`);
                    if (completedCount === totalPieces) {
                        console.log('🎉 Todas las piezas en el banco!');
                        onComplete();
                    }
                }
            });
        }, index * stagger);
    });
}

// ============================================
// UTILIDADES DEL BANCO
// ============================================

/**
 * Encuentra el primer slot vacío del banco
 * @returns {HTMLElement|null} Elemento del slot vacío
 */
function findEmptyBankSlot() {
    const slots = document.querySelectorAll('.bank-piece-slot');
    for (const slot of slots) {
        // Un slot está vacío si no tiene elemento .piece dentro
        if (!slot.querySelector('.piece')) {
            return slot;
        }
    }
    console.warn('⚠️ No hay slots vacíos en el banco');
    return null;
}

// ============================================
// EXPORTAR FUNCIONES
// ============================================

// Para uso como módulo ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        animatePieceToBank,
        animatePieceFromBank,
        hidePiecesWithAnimation,
        getSquarePosition,
        getElementPosition
    };
}

// Para uso global en navegador
if (typeof window !== 'undefined') {
    window.ChessGameLibrary = window.ChessGameLibrary || {};
    window.ChessGameLibrary.PieceAnimations = {
        animatePieceToBank,
        animatePieceFromBank,
        hidePiecesWithAnimation,
        getSquarePosition,
        getElementPosition
    };
}

console.log('📦 ChessGameLibrary.PieceAnimations cargado');
