/**
 * ═══════════════════════════════════════════════════════════════
 * CRIPTOSOPA - KNIGHT MOVEMENT WORD SEARCH
 * ═══════════════════════════════════════════════════════════════
 *
 * CONCEPTO DEL JUEGO:
 * Sopa de letras donde solo puedes moverte como el caballo de ajedrez.
 * El caballo se mueve en forma de "L": 2 casillas en una dirección y 1 perpendicular.
 *
 * CONCEPTOS DE PROGRAMACIÓN UTILIZADOS:
 * - Objetos literales (CONFIG, gameState, elements)
 * - Arrays y manipulación de arrays
 * - Algoritmos de backtracking (colocación de palabras)
 * - Event listeners y manejo de eventos
 * - Manipulación del DOM
 * - Timers y intervals
 * - Estados de aplicación
 * - Rendering optimizado
 * ═══════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN DEL JUEGO
// ═══════════════════════════════════════════════════════════════
/**
 * CONFIG es un objeto literal que almacena constantes del juego.
 *
 * ¿Por qué usar const para CONFIG?
 * - 'const' significa que la REFERENCIA al objeto no puede cambiar
 * - Pero las PROPIEDADES del objeto sí pueden modificarse
 * - Esto previene accidentalmente reasignar CONFIG = {}
 *
 * PATRÓN DE DISEÑO: Objeto de configuración centralizado
 * - Facilita ajustar valores sin buscar en todo el código
 * - Hace el código más mantenible
 */
const CONFIG = {
    // Tamaño del tablero (8x8 como un tablero de ajedrez)
    BOARD_SIZE: 8,

    // Array de palabras disponibles para el juego
    // Todas relacionadas con ajedrez para temática consistente
    DEFAULT_WORDS: [
        "CABALLO", "ALFIL", "TORRE", "REINA", "REY",
        "PEON", "JAQUE", "MATE", "TABLERO", "ENROQUE",
        "CAPTURA", "GAMBITO", "ELO", "FIDE", "RELOJ"
    ],

    /**
     * Colores neon para las palabras encontradas
     *
     * ESTRUCTURA DE DATOS: Array de objetos
     * - Cada objeto tiene: color hexadecimal y efecto de resplandor CSS
     * - Permite iterar fácilmente y asignar colores a palabras
     */
    NEON_COLORS: [
        { hex: '#ff00ff', glow: '0 0 15px #ff00ff' }, // Rosa/Magenta
        { hex: '#00ffff', glow: '0 0 15px #00ffff' }, // Cyan/Azul claro
        { hex: '#ffff00', glow: '0 0 15px #ffff00' }, // Amarillo
        { hex: '#ff9900', glow: '0 0 15px #ff9900' }, // Naranja
        { hex: '#39ff14', glow: '0 0 15px #39ff14' }, // Verde neón
        { hex: '#b026ff', glow: '0 0 15px #b026ff' }, // Púrpura
    ],

    // Cantidad de palabras por nivel (balance entre desafío y jugabilidad)
    WORDS_PER_LEVEL: 6,

    // Sistema de puntuación
    POINTS_PER_WORD: 100,

    // Sistema de ayuda: 3 pistas por nivel
    HINTS_PER_LEVEL: 3
};

// ═══════════════════════════════════════════════════════════════
// ESTADO DEL JUEGO
// ═══════════════════════════════════════════════════════════════
/**
 * gameState es el "cerebro" del juego - almacena TODA la información del estado actual
 *
 * PATRÓN DE DISEÑO: Single Source of Truth
 * - Un solo objeto contiene todo el estado
 * - Facilita debugging (inspeccionar gameState en consola)
 * - Hace predecible el flujo de datos
 *
 * ¿Por qué 'let' en vez de 'const'?
 * - Aunque podríamos usar 'const', 'let' es más claro aquí
 * - Indica que este es un estado mutable que cambia durante el juego
 */
let gameState = {
    /**
     * board: Matriz 2D que representa el tablero de juego
     * ESTRUCTURA: Array de arrays
     * - Cada elemento board[r][c] contiene una letra
     * - r = fila (row), c = columna (column)
     * Ejemplo: board[0][0] es la esquina superior izquierda
     */
    board: [],

    // Lista de palabras disponibles para este nivel
    currentWordList: [],

    // Palabras que el jugador debe encontrar en este nivel
    targetWords: [],

    /**
     * wordPaths: Diccionario que mapea cada palabra a su camino en el tablero
     * ESTRUCTURA: Objeto usado como HashMap/Dictionary
     * - Clave: nombre de la palabra
     * - Valor: array de posiciones [{r, c}, {r, c}, ...]
     *
     * ¿Por qué necesitamos esto?
     * - Cuando mostramos una pista, necesitamos saber dónde está la palabra
     * - Sin esto, tendríamos que reconstruir el camino (complejo y propenso a errores)
     */
    wordPaths: {},

    /**
     * foundPaths: Array de palabras ya encontradas por el jugador
     * ESTRUCTURA: Array de objetos
     * - Cada objeto contiene: palabra, camino, color, índice
     * - Se usa para renderizar las palabras encontradas con sus colores
     */
    foundPaths: [],

    /**
     * selectedPath: Camino que el jugador está seleccionando actualmente
     * ESTRUCTURA: Array de posiciones
     * - Se llena mientras el jugador hace click en las letras
     * - Se vacía cuando se encuentra una palabra o se cancela la selección
     */
    selectedPath: [],

    // Puntuación acumulada del jugador
    score: 0,

    // Nivel actual (por ahora solo hay nivel 1)
    level: 1,

    // Cantidad de pistas restantes
    hintsRemaining: CONFIG.HINTS_PER_LEVEL,

    // Tiempo transcurrido en segundos
    timer: 0,

    /**
     * timerInterval: Referencia al intervalo del temporizador
     * CONCEPTO: setInterval devuelve un ID que necesitamos guardar
     * - Para poder limpiar el intervalo con clearInterval()
     * - Previene memory leaks cuando reiniciamos el juego
     */
    timerInterval: null,

    /**
     * hoveredWord: Palabra sobre la que está el mouse en la lista lateral
     * CONCEPTO: Estado de UI reactivo
     * - Cuando cambias esto, el renderizado cambia
     * - Permite destacar solo UNA palabra cuando haces hover
     */
    hoveredWord: null,

    /**
     * gameStatus: Estado del juego
     * PATRÓN: Máquina de estados finitos (FSM - Finite State Machine)
     * - 'playing': jugando normalmente
     * - 'won': ha ganado, mostrar modal de victoria
     */
    gameStatus: 'playing',

    /**
     * isDragging: Flag para drag-to-select
     * CONCEPTO: Boolean flag para tracking de interacción
     * - true: el usuario mantiene presionado el mouse
     * - false: el mouse no está presionado
     * - Permite seleccionar múltiples celdas arrastrando
     */
    isDragging: false,

    /**
     * hintCell: Celda actualmente destacada por el sistema de pistas
     * ESTRUCTURA: Objeto con {r, c, endTime}
     * - r, c: posición de la celda
     * - endTime: timestamp cuando debe terminar el efecto
     *
     * ¿Por qué almacenar endTime?
     * - renderBoard() se ejecuta muchas veces
     * - Necesitamos saber si el hint todavía está activo
     * - Comparamos Date.now() < endTime para decidir si mostrar el efecto
     */
    hintCell: null
};

// ═══════════════════════════════════════════════════════════════
// REFERENCIAS A ELEMENTOS DEL DOM
// ═══════════════════════════════════════════════════════════════
/**
 * elements: Objeto que almacena referencias a elementos HTML
 *
 * PATRÓN: Cache de Referencias DOM
 * ¿Por qué hacer esto?
 * - document.getElementById() es relativamente lento
 * - Llamarlo 100 veces por segundo (en renderBoard) sería ineficiente
 * - Guardamos las referencias una vez al inicio
 * - Acceder a elements.gameBoard es instantáneo
 *
 * BENEFICIO: Performance
 * - Reduce operaciones DOM costosas
 * - Código más limpio y legible
 */
const elements = {
    gameBoard: null,        // Contenedor del tablero de juego
    wordList: null,         // Lista de palabras en el panel lateral
    scoreDisplay: null,     // Elemento que muestra el puntaje
    timerDisplay: null,     // Elemento que muestra el tiempo
    wordsFound: null,       // Contador de palabras encontradas
    currentSelection: null, // Barra que muestra la selección actual
    hintsLeft: null,        // Contador de pistas restantes
    resetBtn: null,         // Botón "Nuevo Tablero"
    hintBtn: null,          // Botón "Pista"
    helpBtn: null,          // Botón "Ayuda"
    closeHelpBtn: null,     // Botón X del modal de ayuda
    closeHelpBtn2: null,    // Botón "Entendido" del modal de ayuda
    victoryModal: null,     // Modal que aparece al ganar
    helpModal: null,        // Modal de instrucciones
    nextLevelBtn: null,     // Botón "Siguiente Nivel"
    submitScoreBtn: null,   // Botón "Enviar Puntuación"
    modalTime: null,        // Tiempo mostrado en modal de victoria
    modalScore: null        // Puntaje mostrado en modal de victoria
};

// ═══════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════════
/**
 * Event Listener para DOMContentLoaded
 *
 * CONCEPTO: Ciclo de vida del documento HTML
 * - DOMContentLoaded se dispara cuando el HTML está completamente cargado
 * - Es más rápido que 'load' (que espera imágenes, CSS, etc.)
 * - Garantiza que los elementos existen antes de intentar accederlos
 *
 * SINTAXIS: Arrow function
 * () => {} es equivalente a function() {}
 * - Más conciso
 * - No tiene su propio 'this' (útil en algunos contextos)
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeDOM();      // Paso 1: Obtener referencias a elementos HTML
    setupEventListeners(); // Paso 2: Configurar listeners de eventos
    startNewGame();       // Paso 3: Iniciar el juego
});

/**
 * initializeDOM() - Obtiene y almacena referencias a elementos del DOM
 *
 * PATRÓN: Inicialización temprana de referencias
 *
 * ¿Por qué una función separada?
 * - Separación de responsabilidades (Single Responsibility Principle)
 * - Fácil de leer y mantener
 * - Se ejecuta una sola vez al inicio
 */
function initializeDOM() {
    // getElementById() busca un elemento por su atributo id
    // Retorna null si no existe (por eso usamos optional chaining ?. más adelante)
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

// CONTINÚA EN SIGUIENTE MENSAJE...
