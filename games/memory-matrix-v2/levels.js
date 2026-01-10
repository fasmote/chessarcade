/**
 * ============================================
 * MEMORY MATRIX - SISTEMA DE NIVELES
 * ============================================
 * Configuración de niveles progresivos
 * Desde niños de 4 años hasta adultos expertos
 */

// ============================================
// CONFIGURACIÓN DE NIVELES
// ============================================

const LEVELS = [
    // NIVEL 1: Preescolar (4-5 años)
    {
        level: 1,
        name: 'Principiante',
        description: 'Perfecto para comenzar',
        ageRange: '4-5 años',
        pieceCount: 2,  // 2 reyes (siempre están ambos)
        memorizationTime: 3000,  // 3 segundos
        difficulty: 'easy',
        pieceTypes: ['K', 'Q'],
        allowedColors: ['w', 'b'],
        attemptsRequired: 5,  // 5 intentos exitosos para pasar nivel
        hidePiecesConfig: {
            // Intentos 1-4: Solo desaparece 1 pieza (el rey negro)
            // Intento 5: Desaparecen ambas piezas
            progressiveHiding: [
                { attempts: [1, 2, 3, 4], hideCount: 1, hideIndices: [1] }, // Solo bK
                { attempts: [5], hideCount: 2, hideIndices: [0, 1] }  // Ambos
            ]
        }
    },

    // NIVEL 2: Infantil (6-7 años)
    {
        level: 2,
        name: 'Explorador',
        description: '¡Vas mejorando!',
        ageRange: '6-7 años',
        pieceCount: 3,
        memorizationTime: 3000, // 3 segundos
        difficulty: 'easy',
        pieceTypes: ['K', 'Q', 'R'], // Agregar torres
        allowedColors: ['w', 'b'],
        attemptsRequired: 5,
        hidePiecesConfig: {
            // Intentos 1-3: Rey blanco (wK) siempre visible como referencia
            // Intentos 4-5: Todas las piezas desaparecen
            progressiveHiding: [
                { attempts: [1, 2, 3], hideCount: 2, hideIndices: [1, 2] }, // Oculta rey negro + 1 más
                { attempts: [4, 5], hideCount: 3, hideIndices: [0, 1, 2] }  // Todas
            ]
        }
    },

    // NIVEL 3: Junior (8-10 años)
    {
        level: 3,
        name: 'Aventurero',
        description: 'Buen trabajo',
        ageRange: '8-10 años',
        pieceCount: 4,
        memorizationTime: 4000, // 4 segundos
        difficulty: 'medium',
        pieceTypes: ['K', 'Q', 'R', 'B'], // Agregar alfiles
        allowedColors: ['w', 'b'],
        attemptsRequired: 5,
        hidePiecesConfig: {
            // Intentos 1-3: Rey blanco (wK) siempre visible como referencia
            // Intentos 4-5: Todas las piezas desaparecen
            progressiveHiding: [
                { attempts: [1, 2, 3], hideCount: 3, hideIndices: [1, 2, 3] }, // Oculta bK + 2 más
                { attempts: [4, 5], hideCount: 4, hideIndices: [0, 1, 2, 3] }  // Todas
            ]
        }
    },

    // NIVEL 4: Intermedio (11-14 años)
    {
        level: 4,
        name: 'Estratega',
        description: '¡Impresionante!',
        ageRange: '11-14 años',
        pieceCount: 5,
        memorizationTime: 5000, // 5 segundos
        difficulty: 'medium',
        pieceTypes: ['K', 'Q', 'R', 'B', 'N'], // Agregar caballos
        allowedColors: ['w', 'b'],
        attemptsRequired: 5,
        hidePiecesConfig: {
            // Intentos 1-3: Rey blanco (wK) siempre visible como referencia
            // Intentos 4-5: Todas las piezas desaparecen
            progressiveHiding: [
                { attempts: [1, 2, 3], hideCount: 4, hideIndices: [1, 2, 3, 4] }, // Oculta bK + 3 más
                { attempts: [4, 5], hideCount: 5, hideIndices: [0, 1, 2, 3, 4] }  // Todas
            ]
        }
    },

    // NIVEL 5: Avanzado (15+ años)
    {
        level: 5,
        name: 'Maestro',
        description: 'Nivel avanzado',
        ageRange: '15+ años',
        pieceCount: 6,
        memorizationTime: 5000, // 5 segundos
        difficulty: 'hard',
        pieceTypes: ['K', 'Q', 'R', 'B', 'N', 'P'], // Todas las piezas
        allowedColors: ['w', 'b'],
        attemptsRequired: 5,
        hidePiecesConfig: {
            // Intentos 1-3: Rey blanco (wK) siempre visible como referencia
            // Intentos 4-5: Todas las piezas desaparecen
            progressiveHiding: [
                { attempts: [1, 2, 3], hideCount: 5, hideIndices: [1, 2, 3, 4, 5] }, // Oculta bK + 4 más
                { attempts: [4, 5], hideCount: 6, hideIndices: [0, 1, 2, 3, 4, 5] }  // Todas
            ]
        }
    },

    // NIVEL 6: Experto
    {
        level: 6,
        name: 'Gran Maestro',
        description: '¡Extraordinario!',
        ageRange: 'Experto',
        pieceCount: 7,
        memorizationTime: 6000, // 6 segundos
        difficulty: 'hard',
        pieceTypes: ['K', 'Q', 'R', 'B', 'N', 'P'],
        allowedColors: ['w', 'b'],
        attemptsRequired: 5,
        hidePiecesConfig: {
            // Intentos 1-3: Rey blanco (wK) siempre visible como referencia
            // Intentos 4-5: Todas las piezas desaparecen
            progressiveHiding: [
                { attempts: [1, 2, 3], hideCount: 6, hideIndices: [1, 2, 3, 4, 5, 6] }, // Oculta bK + 5 más
                { attempts: [4, 5], hideCount: 7, hideIndices: [0, 1, 2, 3, 4, 5, 6] }  // Todas
            ]
        }
    },

    // NIVEL 7: Élite
    {
        level: 7,
        name: 'Súper Gran Maestro',
        description: 'Nivel élite',
        ageRange: 'Élite',
        pieceCount: 8,
        memorizationTime: 6000, // 6 segundos
        difficulty: 'expert',
        pieceTypes: ['K', 'Q', 'R', 'B', 'N', 'P'],
        allowedColors: ['w', 'b'],
        attemptsRequired: 5,
        hidePiecesConfig: {
            // Intentos 1-3: Rey blanco (wK) siempre visible como referencia
            // Intentos 4-5: Todas las piezas desaparecen
            progressiveHiding: [
                { attempts: [1, 2, 3], hideCount: 7, hideIndices: [1, 2, 3, 4, 5, 6, 7] }, // Oculta bK + 6 más
                { attempts: [4, 5], hideCount: 8, hideIndices: [0, 1, 2, 3, 4, 5, 6, 7] }  // Todas
            ]
        }
    },

    // NIVEL 8: Leyenda
    {
        level: 8,
        name: 'Leyenda',
        description: '¡Increíble memoria!',
        ageRange: 'Leyenda',
        pieceCount: 10,
        memorizationTime: 7000, // 7 segundos
        difficulty: 'expert',
        pieceTypes: ['K', 'Q', 'R', 'B', 'N', 'P'],
        allowedColors: ['w', 'b'],
        attemptsRequired: 5,
        hidePiecesConfig: {
            // Intentos 1-3: Rey blanco (wK) siempre visible como referencia
            // Intentos 4-5: Todas las piezas desaparecen
            progressiveHiding: [
                { attempts: [1, 2, 3], hideCount: 9, hideIndices: [1, 2, 3, 4, 5, 6, 7, 8, 9] }, // Oculta bK + 8 más
                { attempts: [4, 5], hideCount: 10, hideIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] }  // Todas
            ]
        }
    }
];

// ============================================
// GENERADOR DE POSICIONES ALEATORIAS
// ============================================

/**
 * Genera posición aleatoria para un nivel
 * IMPORTANTE: Siempre incluye ambos reyes (wK y bK) como piezas base
 * @param {number} levelNumber - Número de nivel (1-8)
 * @returns {Array} Array de objetos {square: 'e4', piece: 'wK'}
 */
function generateRandomPosition(levelNumber) {
    const level = LEVELS[levelNumber - 1];
    if (!level) {
        console.error(`❌ Nivel ${levelNumber} no existe`);
        return [];
    }

    console.log(`🎲 Generando posición aleatoria para Nivel ${levelNumber}: ${level.name}`);

    const position = [];
    const usedSquares = new Set();

    // ============================================
    // PASO 1: SIEMPRE agregar ambos reyes primero
    // ============================================

    // Rey blanco
    let wKingSquare = getRandomSquare();
    usedSquares.add(wKingSquare);
    position.push({
        square: wKingSquare,
        piece: 'wK'
    });
    console.log(`  👑 wK en ${wKingSquare} (SIEMPRE)`);

    // Rey negro - IMPORTANTE: VALIDAR DISTANCIA
    // Los reyes NUNCA pueden estar adyacentes (regla de ajedrez)
    let bKingSquare;
    let attempts = 0;
    const maxAttempts = 100; // Prevenir loop infinito

    do {
        bKingSquare = getRandomSquare();
        attempts++;

        if (attempts > maxAttempts) {
            console.error('❌ No se pudo encontrar casilla válida para bK');
            // Fallback: colocar en esquina opuesta
            bKingSquare = wKingSquare === 'a1' ? 'h8' : 'a1';
            break;
        }
    } while (
        usedSquares.has(bKingSquare) ||
        !areKingsValid(wKingSquare, bKingSquare) // ← VALIDACIÓN DE DISTANCIA
    );

    const distance = getSquareDistance(wKingSquare, bKingSquare);
    usedSquares.add(bKingSquare);
    position.push({
        square: bKingSquare,
        piece: 'bK'
    });
    console.log(`  👑 bK en ${bKingSquare} (SIEMPRE) - distancia: ${distance} casillas`);

    // ============================================
    // PASO 2: Agregar piezas adicionales
    // ============================================
    // Restar 2 porque ya tenemos los 2 reyes
    const additionalPieces = level.pieceCount - 2;

    for (let i = 0; i < additionalPieces; i++) {
        // 1. Seleccionar tipo de pieza y color PRIMERO
        const availableTypes = level.pieceTypes.filter(type => type !== 'K');
        const pieceType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const color = level.allowedColors[Math.floor(Math.random() * level.allowedColors.length)];
        const pieceCode = color + pieceType;

        // 2. Encontrar una casilla válida para esta pieza
        let square;
        let attempts = 0;
        const maxAttempts = 200; // Prevenir loops infinitos

        do {
            square = getRandomSquare();
            attempts++;
            if (attempts > maxAttempts) {
                console.warn(`⚠️ No se pudo encontrar casilla válida para ${pieceCode} tras ${maxAttempts} intentos.`);
                break; // Salir del loop para no bloquear el juego
            }
        } while (
            usedSquares.has(square) ||
            // REGLA ANTI-PEONES: No colocar peones en filas 1 u 8
            (pieceType === 'P' && (square.endsWith('1') || square.endsWith('8')))
        );

        // Si no se encontró casilla, saltar esta pieza
        if (attempts > maxAttempts) {
            continue;
        }

        usedSquares.add(square);

        position.push({
            square: square,
            piece: pieceCode
        });

        console.log(`  📍 ${pieceCode} en ${square}`);
    }

    return position;
}

/**
 * Genera una casilla aleatoria del tablero
 * @returns {string} Coordenada algebraica (ej: 'e4')
 */
function getRandomSquare() {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

    const file = files[Math.floor(Math.random() * files.length)];
    const rank = ranks[Math.floor(Math.random() * ranks.length)];

    return file + rank;
}

/**
 * Calcula distancia entre dos casillas
 * IMPORTANTE: Los reyes nunca pueden estar adyacentes en ajedrez
 * @param {string} square1 - Primera casilla (ej: 'e4')
 * @param {string} square2 - Segunda casilla (ej: 'e5')
 * @returns {number} Distancia máxima en filas o columnas (Chebyshev distance)
 */
function getSquareDistance(square1, square2) {
    // Convertir a índices numéricos
    const file1 = square1.charCodeAt(0) - 'a'.charCodeAt(0); // 0-7
    const rank1 = parseInt(square1[1]) - 1; // 0-7

    const file2 = square2.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank2 = parseInt(square2[1]) - 1;

    // Distancia Chebyshev (máximo de diferencias absolutas)
    // Para ajedrez: reyes adyacentes tienen distancia 1
    const fileDiff = Math.abs(file1 - file2);
    const rankDiff = Math.abs(rank1 - rank2);

    return Math.max(fileDiff, rankDiff);
}

/**
 * Valida si dos reyes pueden coexistir en estas casillas
 * Los reyes NUNCA pueden estar en casillas adyacentes
 * @param {string} kingSquare1 - Casilla del primer rey
 * @param {string} kingSquare2 - Casilla del segundo rey
 * @returns {boolean} true si es válido (distancia >= 2)
 */
function areKingsValid(kingSquare1, kingSquare2) {
    const distance = getSquareDistance(kingSquare1, kingSquare2);
    return distance >= 2; // Mínimo 2 casillas de separación
}

/**
 * Obtiene configuración de un nivel
 * @param {number} levelNumber - Número de nivel
 * @returns {Object} Configuración del nivel
 */
function getLevelConfig(levelNumber) {
    return LEVELS[levelNumber - 1] || LEVELS[0];
}

/**
 * Obtiene cantidad total de niveles
 * @returns {number}
 */
function getTotalLevels() {
    return LEVELS.length;
}

/**
 * Determina qué piezas ocultar según el intento actual
 * @param {number} levelNumber - Nivel actual
 * @param {number} attemptNumber - Intento actual (1-10)
 * @param {Array} position - Posición completa
 * @returns {Array} Array de objetos {square, piece} a ocultar
 */
function getPiecesToHide(levelNumber, attemptNumber, position) {
    const level = getLevelConfig(levelNumber);

    // Si no hay configuración, ocultar todas (comportamiento por defecto)
    if (!level.hidePiecesConfig || !level.hidePiecesConfig.progressiveHiding) {
        return position;
    }

    // Buscar configuración para este intento
    const config = level.hidePiecesConfig.progressiveHiding.find(cfg =>
        cfg.attempts.includes(attemptNumber)
    );

    if (!config) {
        // Si no hay config específica, ocultar todas
        return position;
    }

    // Retornar solo las piezas indicadas por hideIndices
    const piecesToHide = config.hideIndices.map(index => position[index]).filter(Boolean);

    console.log(`🎯 Intento ${attemptNumber}: Ocultando ${piecesToHide.length}/${position.length} piezas`);

    return piecesToHide;
}

/**
 * Valida si un nivel existe
 * @param {number} levelNumber
 * @returns {boolean}
 */
function isValidLevel(levelNumber) {
    return levelNumber >= 1 && levelNumber <= LEVELS.length;
}

// ============================================
// VARIANTES DE DIFICULTAD
// ============================================

/**
 * Genera posición con restricciones espaciales
 * Para niveles avanzados: piezas más juntas (más difícil)
 */
function generateClusteredPosition(levelNumber) {
    const level = getLevelConfig(levelNumber);
    const position = [];
    const usedSquares = new Set();

    // Elegir un cuadrante aleatorio del tablero
    const quadrants = [
        { files: ['a', 'b', 'c', 'd'], ranks: ['1', '2', '3', '4'] }, // Esquina inferior izquierda
        { files: ['e', 'f', 'g', 'h'], ranks: ['1', '2', '3', '4'] }, // Esquina inferior derecha
        { files: ['a', 'b', 'c', 'd'], ranks: ['5', '6', '7', '8'] }, // Esquina superior izquierda
        { files: ['e', 'f', 'g', 'h'], ranks: ['5', '6', '7', '8'] }  // Esquina superior derecha
    ];

    const quadrant = quadrants[Math.floor(Math.random() * quadrants.length)];

    for (let i = 0; i < level.pieceCount; i++) {
        // Seleccionar pieza PRIMERO para aplicar reglas
        const pieceType = level.pieceTypes[Math.floor(Math.random() * level.pieceTypes.length)];
        const color = level.allowedColors[Math.floor(Math.random() * level.allowedColors.length)];
        const pieceCode = color + pieceType;

        let square;
        let attempts = 0;
        const maxAttempts = 200;

        do {
            const file = quadrant.files[Math.floor(Math.random() * quadrant.files.length)];
            const rank = quadrant.ranks[Math.floor(Math.random() * quadrant.ranks.length)];
            square = file + rank;
            attempts++;
            if (attempts > maxAttempts) {
                console.warn(`⚠️ No se pudo encontrar casilla válida para ${pieceCode} en cuadrante.`);
                break;
            }
        } while (
            usedSquares.has(square) ||
            // REGLA ANTI-PEONES: No colocar peones en filas 1 u 8
            (pieceType === 'P' && (square.endsWith('1') || square.endsWith('8')))
        );

        if (attempts > maxAttempts) {
            continue;
        }
        
        usedSquares.add(square);

        position.push({
            square: square,
            piece: pieceCode
        });
    }

    return position;
}

/**
 * Genera posición simétrica (bonita visualmente)
 * Para niveles intermedios
 */
function generateSymmetricPosition(levelNumber) {
    const level = getLevelConfig(levelNumber);
    const position = [];
    const piecesPerSide = Math.floor(level.pieceCount / 2);

    // Generar piezas en un lado
    for (let i = 0; i < piecesPerSide; i++) {
        const pieceType = level.pieceTypes[Math.floor(Math.random() * level.pieceTypes.length)];
        const color = 'w'; // Lado blanco
        const pieceCode = color + pieceType;

        let square, rank, file;
        let attempts = 0;
        const maxAttempts = 200;

        do {
            file = ['a', 'b', 'c', 'd'][Math.floor(Math.random() * 4)];
            rank = (Math.floor(Math.random() * 8) + 1).toString();
            square = file + rank;
            attempts++;
            if (attempts > maxAttempts) break;
        } while (
            // REGLA ANTI-PEONES: No colocar peones en filas 1 u 8
            (pieceType === 'P' && (rank === '1' || rank === '8'))
        );

        if (attempts > maxAttempts) continue;

        position.push({ square, piece: pieceCode });

        // Pieza simétrica en el otro lado (mismo rank, archivo opuesto)
        const mirrorFile = String.fromCharCode('h'.charCodeAt(0) - (file.charCodeAt(0) - 'a'.charCodeAt(0)));
        const mirrorSquare = mirrorFile + rank;
        position.push({ square: mirrorSquare, piece: 'b' + pieceType });
    }

    // Si quedan piezas impares, agregar una en el centro
    if (level.pieceCount % 2 !== 0) {
        const pieceType = level.pieceTypes[Math.floor(Math.random() * level.pieceTypes.length)];
        let rank, square;
        let attempts = 0;
        const maxAttempts = 200;

        do {
            const centerFiles = ['d', 'e'];
            const file = centerFiles[Math.floor(Math.random() * 2)];
            rank = (Math.floor(Math.random() * 8) + 1).toString();
            square = file + rank;
            attempts++;
            if (attempts > maxAttempts) break;
        } while (
            // REGLA ANTI-PEONES aquí también
            (pieceType === 'P' && (rank === '1' || rank === '8'))
        );

        if (attempts <= maxAttempts) {
            position.push({
                square: square,
                piece: 'w' + pieceType
            });
        }
    }

    return position;
}

// ============================================
// EXPORTAR
// ============================================

if (typeof window !== 'undefined') {
    window.MemoryMatrixLevels = {
        LEVELS,
        generateRandomPosition,
        generateClusteredPosition,
        generateSymmetricPosition,
        getLevelConfig,
        getTotalLevels,
        isValidLevel,
        getPiecesToHide
    };
}

console.log('📊 Sistema de niveles cargado:', LEVELS.length, 'niveles disponibles');
