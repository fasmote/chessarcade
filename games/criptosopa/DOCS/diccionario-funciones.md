# Diccionario de Funciones - CriptoSopa

## Índice
- [Funciones de Inicialización](#funciones-de-inicialización)
- [Funciones de Generación de Tablero](#funciones-de-generación-de-tablero)
- [Funciones de Interacción](#funciones-de-interacción)
- [Funciones de Renderizado](#funciones-de-renderizado)
- [Funciones de Validación](#funciones-de-validación)
- [Funciones Utilitarias](#funciones-utilitarias)
- [Funciones de UI](#funciones-de-ui)

---

## Funciones de Inicialización

### `initializeDOM()`
**Propósito**: Obtener y almacenar referencias a elementos HTML del DOM.

**Conceptos**:
- Cache de referencias DOM para mejor performance
- `document.getElementById()` - API del navegador para acceder a elementos

**¿Por qué existe?**
- Llamar `document.getElementById()` es lento
- Guardamos las referencias una vez al inicio
- Mejora performance significativamente

**Ejemplo de uso interno**:
```javascript
elements.gameBoard = document.getElementById('gameBoard');
```

**Aprende**: Separación de responsabilidades, optimización de DOM

---

### `setupEventListeners()`
**Propósito**: Configurar todos los event listeners del juego.

**Parámetros**: Ninguno

**Retorna**: `void`

**Conceptos**:
- Event listeners (observadores de eventos)
- Optional chaining (`?.`) para prevenir errores si elemento no existe
- Arrow functions como callbacks

**Código importante**:
```javascript
elements.resetBtn?.addEventListener('click', startNewGame);
```

**¿Qué hace `?.`?**
- Si `elements.resetBtn` es null/undefined, NO ejecuta `addEventListener`
- Previene el error "Cannot read property 'addEventListener' of null"

**Eventos configurados**:
- `click` en botones (reset, hint, help)
- `mouseup` global (para detectar fin de drag)
- `mouseleave` global (para detectar cuando mouse sale de ventana)

**Aprende**: Event-driven programming, defensive programming

---

### `startNewGame()`
**Propósito**: Reiniciar el juego con un tablero nuevo.

**Flujo de ejecución**:
1. Limpiar estado anterior (foundPaths, selectedPath, wordPaths)
2. Resetear contadores (timer, hints, score)
3. Crear tablero vacío
4. Colocar palabras en el tablero
5. Llenar casillas vacías con letras aleatorias
6. Iniciar temporizador
7. Renderizar tablero
8. Actualizar displays

**Conceptos**:
- Reinicialización de estado
- Flujo secuencial de operaciones
- `clearInterval()` para limpiar timers

**Código clave**:
```javascript
gameState.wordPaths = {}; // Limpiar paths anteriores
gameState.board = createEmptyBoard();
placeWords();
fillRandomLetters();
```

**Aprende**: Gestión de estado, limpieza de recursos

---

## Funciones de Generación de Tablero

### `createEmptyBoard()`
**Propósito**: Crear una matriz 8x8 vacía para el tablero.

**Retorna**: `Array<Array<string>>` - Matriz 2D de strings vacíos

**Conceptos**:
- Matrices 2D (arrays de arrays)
- `Array(n)` crea array de longitud n
- `.fill(value)` llena array con un valor
- `.map()` transforma cada elemento

**Implementación explicada**:
```javascript
return Array(CONFIG.BOARD_SIZE)      // [undefined, undefined, ..., undefined] (8 elementos)
    .fill(null)                       // [null, null, ..., null]
    .map(() => Array(CONFIG.BOARD_SIZE).fill(''));
    // Para cada elemento, crear ['',' '', ..., ''] (8 strings vacíos)
```

**¿Por qué `.fill(null).map()`?**
- `Array(8)` crea slots vacíos, NO undefined
- `.fill(null)` los llena para que `.map()` funcione
- `.map()` crea un array NUEVO para cada fila (evita referencias compartidas)

**Trampa común**:
```javascript
// ❌ INCORRECTO
Array(8).fill(Array(8).fill(''))
// Todas las filas comparten la MISMA referencia de array

// ✅ CORRECTO
Array(8).fill(null).map(() => Array(8).fill(''))
// Cada fila es un array DIFERENTE
```

**Aprende**: Matrices 2D, referencias vs valores, functional programming

---

### `placeWords()`
**Propósito**: Seleccionar y colocar palabras en el tablero.

**Retorna**: `void`

**Conceptos**:
- Selección aleatoria de elementos
- `sort(() => 0.5 - Math.random())` - shuffle de array
- Bucles con condiciones de salida

**Algoritmo**:
1. Mezclar aleatoriamente `DEFAULT_WORDS`
2. Intentar colocar cada palabra con `placeWord()`
3. Si se coloca exitosamente, agregarla a `selectedWords`
4. Parar cuando tenemos `WORDS_PER_LEVEL` palabras
5. Guardar en `gameState.targetWords`

**Código clave**:
```javascript
const shuffled = [...gameState.currentWordList]
    .sort(() => 0.5 - Math.random());
```

**¿Cómo funciona el shuffle?**
- `...` (spread operator) copia el array
- `.sort()` ordena elementos
- Función de comparación retorna número aleatorio entre -0.5 y 0.5
- Si retorna negativo: a antes de b
- Si retorna positivo: b antes de a
- Resultado: orden aleatorio

**Aprende**: Algoritmos de aleatorización, spread operator

---

### `placeWord(word)`
**Propósito**: Intentar colocar una palabra en el tablero siguiendo movimientos de caballo.

**Parámetros**:
- `word` (string): La palabra a colocar

**Retorna**: `boolean` - true si se colocó exitosamente, false si no

**Conceptos clave**:
- **Backtracking**: Algoritmo que prueba soluciones y retrocede si falla
- **Greedy approach**: Tomar decisiones locales óptimas
- **Constraint satisfaction**: Cumplir restricciones (movimiento caballo)

**Algoritmo detallado**:
```
POR cada intento (máximo 200):
    1. Elegir posición inicial aleatoria (r, c)
    2. Si la celda NO está vacía, continuar al siguiente intento
    3. Crear path temporal con posición inicial
    4. Crear copia del tablero (para no modificar el original)
    5. POR cada letra de la palabra:
        a. Si celda está vacía: colocar letra
        b. Si celda tiene la misma letra: marcar overlap (permitido pero no ideal)
        c. Si celda tiene letra diferente: abortar este intento
        d. Buscar siguiente posición válida (movimiento caballo)
        e. Si no hay movimientos válidos: abortar
        f. Agregar posición al path
    6. Si completamos todas las letras:
        - Preferir sin overlaps (pero permitir si llevamos >150 intentos)
        - Aplicar cambios al tablero real
        - Guardar path en gameState.wordPaths
        - Retornar true
FIN
Retornar false (no se pudo colocar)
```

**Ejemplo visual**:
```
Palabra: "PEON"
Intento 1:
  P en (0,0) ✓
  Buscar 'E': movimientos válidos desde (0,0) → [(1,2), (2,1)]
  Elegir (1,2) aleatoriamente
  E en (1,2) ✓
  Buscar 'O': movimientos válidos desde (1,2) → [(0,0), (2,0), (3,1), ...]
  ...continúa
```

**Código importante**:
```javascript
// Copia profunda del tablero para no modificar el original
const tempBoard = JSON.parse(JSON.stringify(gameState.board));

// Elegir movimiento aleatorio
const nextMove = validMoves[Math.floor(Math.random() * validMoves.length)];

// Guardar el path cuando se coloca exitosamente
gameState.wordPaths[word] = path;
```

**¿Por qué JSON.parse(JSON.stringify())?**
- Crea una copia PROFUNDA del array 2D
- Si usáramos `tempBoard = board`, ambas variables apuntarían al MISMO array
- Modificar `tempBoard` modificaría `board` también

**Aprende**: Backtracking, copias profundas vs superficiales, aleatoriedad controlada

---

### `fillRandomLetters()`
**Propósito**: Llenar las celdas vacías del tablero con letras aleatorias.

**Retorna**: `void`

**Conceptos**:
- Iteración sobre matriz 2D con bucles anidados
- Generación de caracteres aleatorios
- Código ASCII y conversión a caracteres

**Implementación**:
```javascript
for (let r = 0; r < CONFIG.BOARD_SIZE; r++) {
    for (let c = 0; c < CONFIG.BOARD_SIZE; c++) {
        if (gameState.board[r][c] === '') {
            gameState.board[r][c] = String.fromCharCode(
                65 + Math.floor(Math.random() * 26)
            );
        }
    }
}
```

**Explicación del random letter**:
```javascript
65 + Math.floor(Math.random() * 26)
```
- `Math.random()` → número entre 0 (inclusive) y 1 (exclusivo)
- `* 26` → número entre 0 y 25.999...
- `Math.floor()` → redondear hacia abajo → 0 a 25
- `+ 65` → 65 a 90
- `String.fromCharCode(65)` → 'A'
- `String.fromCharCode(90)` → 'Z'

**¿Por qué 65?**
- En la tabla ASCII, 65 es el código de 'A'
- 90 es el código de 'Z'
- Genera solo letras mayúsculas A-Z

**Aprende**: Bucles anidados, códigos ASCII, generación de caracteres aleatorios

---

## Funciones de Validación

### `getValidKnightMoves(r, c, board, excludePath)`
**Propósito**: Obtener todas las posiciones válidas a las que puede moverse un caballo desde (r,c).

**Parámetros**:
- `r` (number): Fila actual
- `c` (number): Columna actual
- `board` (Array): El tablero (para validar límites)
- `excludePath` (Array): Posiciones ya visitadas (para evitar repeticiones)

**Retorna**: `Array<{r, c}>` - Array de posiciones válidas

**Conceptos**:
- Movimiento del caballo de ajedrez (L-shape)
- Validación de límites
- Filtrado de arrays

**Movimientos posibles del caballo**:
```
Desde posición (r, c), el caballo puede moverse a:
  (r-2, c-1)  (r-2, c+1)
  (r-1, c-2)  (r-1, c+2)
  (r+1, c-2)  (r+1, c+2)
  (r+2, c-1)  (r+2, c+1)

Visualización:
     *     *
   *         *
       K
   *         *
     *     *
```

**Implementación**:
```javascript
const moves = [
    { r: r - 2, c: c - 1 }, { r: r - 2, c: c + 1 },
    { r: r - 1, c: c - 2 }, { r: r - 1, c: c + 2 },
    { r: r + 1, c: c - 2 }, { r: r + 1, c: c + 2 },
    { r: r + 2, c: c - 1 }, { r: r + 2, c: c + 1 }
];

return moves.filter(m =>
    m.r >= 0 && m.r < CONFIG.BOARD_SIZE &&
    m.c >= 0 && m.c < CONFIG.BOARD_SIZE &&
    !excludePath.some(p => p.r === m.r && p.c === m.c)
);
```

**Filtros aplicados**:
1. `m.r >= 0 && m.r < BOARD_SIZE` → No salir del tablero verticalmente
2. `m.c >= 0 && m.c < BOARD_SIZE` → No salir del tablero horizontalmente
3. `!excludePath.some(...)` → No visitar celdas ya en el camino

**¿Qué hace `.some()`?**
- Retorna true si AL MENOS UN elemento cumple la condición
- Retorna false si ningún elemento cumple
- Se usa para check "¿existe en el array?"

**Aprende**: Algoritmos de juegos, filtrado de arrays, validación de límites

---

### `isKnightMove(r1, c1, r2, c2)`
**Propósito**: Verificar si el movimiento de (r1,c1) a (r2,c2) es válido para un caballo.

**Parámetros**:
- `r1, c1`: Posición origen
- `r2, c2`: Posición destino

**Retorna**: `boolean` - true si es movimiento de caballo válido

**Matemática del movimiento en L**:
```javascript
const dr = Math.abs(r2 - r1); // Diferencia en filas
const dc = Math.abs(c2 - c1); // Diferencia en columnas

return (dr === 2 && dc === 1) || (dr === 1 && dc === 2);
```

**Explicación visual**:
```
Casos válidos:
- 2 filas, 1 columna: (0,0) → (2,1) ✓
- 1 fila, 2 columnas: (0,0) → (1,2) ✓

Casos inválidos:
- 2 filas, 2 columnas: (0,0) → (2,2) ✗ (diagonal)
- 1 fila, 1 columna: (0,0) → (1,1) ✗ (diagonal)
- 3 filas, 1 columna: (0,0) → (3,1) ✗ (muy lejos)
```

**¿Por qué `Math.abs()`?**
- El caballo puede moverse en cualquier dirección
- (0,0) → (2,1) y (0,0) → (-2,1) son ambos válidos
- `abs()` convierte negativos a positivos
- Solo importa la DISTANCIA, no la dirección

**Aprende**: Matemáticas básicas, valor absoluto, lógica booleana

---

### `canTraceWord(word, startR, startC)`
**Propósito**: Verificar si una palabra puede ser trazada desde una posición dada.

**Parámetros**:
- `word` (string): Palabra a verificar
- `startR, startC` (number): Posición de inicio

**Retorna**: `boolean` - true si la palabra puede trazarse

**Algoritmo greedy**:
```
1. Crear path con posición inicial
2. POR cada letra de la palabra (excepto la primera):
    a. Obtener movimientos válidos desde última posición
    b. Filtrar solo los que tienen la letra correcta
    c. Si no hay movimientos: retornar false
    d. Tomar el PRIMER movimiento válido (greedy)
    e. Agregar al path
3. Si llegamos aquí: retornar true
```

**Limitación del approach greedy**:
```
Puede fallar si el primer movimiento lleva a un callejón sin salida

Ejemplo:
  A - ? - ?
  |       |
  X - B - C

Si busca "ABC" y toma el camino A→X primero,
no podrá llegar a B y C aunque existe otro camino válido.
```

**Por eso usamos `wordPaths`**:
- En vez de reconstruir, guardamos el path cuando colocamos la palabra
- `findWordStart()` usa el path guardado directamente
- Más confiable y eficiente

**Aprende**: Greedy algorithms, limitaciones algorítmicas

---

## Funciones de Interacción

### `handleCellClick(r, c)`
**Propósito**: Manejar click en una celda del tablero.

**Parámetros**:
- `r` (number): Fila de la celda
- `c` (number): Columna de la celda

**Retorna**: `void`

**Flujo de decisión**:
```
SI selectedPath está vacío:
    → Primera celda seleccionada
    → Agregar a selectedPath
SINO:
    última = última celda en selectedPath

    SI click en la misma celda:
        → Deseleccionar (remover última)
    SINO SI click en celda adyacente válida (movimiento caballo):
        SI celda ya está en path:
            → Remover todas desde esa posición (retroceder)
        SINO:
            → Agregar al path
    SINO:
        → Movimiento inválido, ignorar

Después de cualquier cambio:
    → Actualizar visualización
    → Verificar si formó palabra válida
```

**Concepto: Path retraction**:
```javascript
// Si la celda ya existe en el path, retroceder hasta ahí
const existingIndex = gameState.selectedPath.findIndex(/* ... */);
if (existingIndex !== -1) {
    gameState.selectedPath = gameState.selectedPath.slice(0, existingIndex + 1);
}
```

**¿Qué hace `.findIndex()`?**
- Busca el primer elemento que cumpla la condición
- Retorna el ÍNDICE del elemento (-1 si no existe)
- Similar a `.find()` pero retorna índice en vez del elemento

**¿Qué hace `.slice(0, index + 1)`?**
- Crea un nuevo array desde inicio hasta index (inclusive)
- slice(0, 3) en [a,b,c,d,e] → [a,b,c]
- No modifica el array original

**Aprende**: Lógica condicional compleja, manipulación de arrays, retracción de caminos

---

### `checkWordFound()`
**Propósito**: Verificar si el path seleccionado forma una palabra válida.

**Retorna**: `void`

**Algoritmo**:
```
1. Construir string con las letras del selectedPath
2. Verificar si está en targetWords
3. Verificar que NO esté ya encontrada
4. Si es válida:
    a. Agregar a foundPaths con color único
    b. Incrementar score
    c. Limpiar selectedPath
    d. Si encontramos todas: mostrar modal victoria
5. Actualizar visualización
```

**Construcción del string**:
```javascript
const selectedWord = gameState.selectedPath
    .map(pos => gameState.board[pos.r][pos.c])
    .join('');
```

**Desglose**:
- `.map(pos => board[pos.r][pos.c])` → ['P', 'E', 'O', 'N']
- `.join('')` → "PEON"

**Asignación de colores**:
```javascript
const color = CONFIG.NEON_COLORS[gameState.foundPaths.length % CONFIG.NEON_COLORS.length];
```

**¿Por qué `% NEON_COLORS.length`?**
- Operador módulo (%) da el RESTO de la división
- 0 % 6 = 0 → color 0
- 5 % 6 = 5 → color 5
- 6 % 6 = 0 → color 0 (repite)
- Garantiza que el índice nunca exceda el tamaño del array

**Aprende**: Transformación de arrays, módulo para índices circulares

---

## Funciones de Renderizado

### `renderBoard()`
**Propósito**: Actualizar la visualización del tablero en el DOM.

**Retorna**: `void`

**Optimización clave: Reuso de celdas**:
```javascript
const shouldRecreate = elements.gameBoard.children.length === 0;

if (shouldRecreate) {
    // Primera vez: crear todas las celdas
    cell = document.createElement('div');
    // ... agregar event listeners
    elements.gameBoard.appendChild(cell);
} else {
    // Renders subsiguientes: reutilizar celdas existentes
    cell = elements.gameBoard.children[cellIndex];
    cell.className = 'board-cell'; // Reset classes
    cell.style.cssText = ''; // Reset styles
    while (cell.children.length > 0) {
        cell.removeChild(cell.children[0]);
    }
}
```

**¿Por qué esta optimización?**

**Antes (sin optimización)**:
```
Click → renderBoard() → Borrar 64 celdas → Crear 64 celdas nuevas → Agregar listeners
Resultado: 128+ operaciones DOM por click → Flickering visible
```

**Después (con optimización)**:
```
Click → renderBoard() → Reutilizar 64 celdas → Solo actualizar styles/classes
Resultado: ~64 operaciones DOM por click → Suave y sin flicker
```

**Renderizado por estado**:
```javascript
// 1. Encontrar datos de esta celda
const isSelected = selectedPath.some(/* es esta celda? */);
const isFound = foundPaths.some(/* es esta celda? */);
const isHintCell = hintCell && /* es esta celda? */;

// 2. Aplicar estilos según estado
if (isFound) {
    // Estilo de palabra encontrada (colorido)
    if (foundDataArray.length > 1) {
        // Múltiples palabras: diagonal split
    } else {
        // Una palabra: color sólido
    }
} else if (isSelected) {
    // Estilo de selección actual (brillante)
} else if (isHintCell) {
    // Estilo de pista (amarillo parpadeante)
}
```

**Estados de celda (mutuamente excluyentes)**:
1. **Encontrada** (highest priority) - parte de palabra encontrada
2. **Seleccionada** - en el path actual del jugador
3. **Hint** - destacada por sistema de pistas
4. **Hint available** - próximo movimiento válido desde selección
5. **Default** - estado base

**Aprende**: Optimización de DOM, renderizado condicional, performance

---

### `renderWordList()`
**Propósito**: Mostrar lista de palabras a encontrar en el panel lateral.

**Retorna**: `void`

**Estructura generada**:
```html
<li class="word-item" data-word="PEON">
    <span class="word-step">1</span>
    <span class="word-text">PEON</span>
    <span class="word-status">✓</span> <!-- Solo si encontrada -->
</li>
```

**Aplicar colores a palabras encontradas**:
```javascript
targetWords.forEach((word, index) => {
    const foundData = foundPaths.find(fp => fp.word === word);

    if (foundData) {
        li.classList.add('word-found');
        li.style.borderColor = foundData.color.hex;
        // ...más estilos
    }
});
```

**Event listener para hover**:
```javascript
li.addEventListener('mouseenter', () => {
    gameState.hoveredWord = word;
    renderBoard(); // Re-renderizar para mostrar hover
});

li.addEventListener('mouseleave', () => {
    gameState.hoveredWord = null;
    renderBoard(); // Re-renderizar para quitar hover
});
```

**Concepto: Reactivity manual**:
- Cambiar `hoveredWord` NO actualiza la UI automáticamente
- Debemos llamar `renderBoard()` explícitamente
- Frameworks como React hacen esto automáticamente

**Aprende**: Generación dinámica de HTML, event delegation

---

### `updateDisplay()`
**Propósito**: Actualizar todos los contadores y displays de la UI.

**Retorna**: `void`

**Actualizaciones realizadas**:
```javascript
// Contador de palabras
elements.wordsFound.textContent = `${foundPaths.length}/${targetWords.length}`;

// Score
elements.scoreDisplay.textContent = gameState.score;

// Pistas restantes
elements.hintsLeft.textContent = gameState.hintsRemaining;
```

**Formato de tiempo**:
```javascript
const minutes = Math.floor(gameState.timer / 60);
const seconds = gameState.timer % 60;
elements.timerDisplay.textContent =
    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
```

**¿Qué hace `.padStart(2, '0')`?**
- Rellena el string al inicio hasta alcanzar longitud 2
- Usa '0' como relleno
- Ejemplos:
  - `"5".padStart(2, '0')` → "05"
  - `"42".padStart(2, '0')` → "42" (ya tiene longitud 2)

**Aprende**: String formatting, manipulación de UI

---

## Funciones de UI

### `showHint()`
**Propósito**: Mostrar pista al jugador destacando la primera letra de una palabra no encontrada.

**Retorna**: `void`

**Flujo**:
```
1. Verificar que quedan pistas
2. Filtrar palabras no encontradas
3. Hacer shake del tablero (efecto visual)
4. Encontrar posición de inicio de primera palabra
5. Guardar en hintCell con timestamp de expiración
6. Restar pista y 50 puntos
7. Renderizar tablero (mostrará el hint)
8. Programar auto-limpieza después de 3 segundos
```

**Shake effect**:
```javascript
elements.gameBoard.classList.add('board-shake');
setTimeout(() => elements.gameBoard.classList.remove('board-shake'), 500);
```

**Estado temporal con timeout**:
```javascript
gameState.hintCell = {
    r: startPos.r,
    c: startPos.c,
    endTime: Date.now() + 3000
};

setTimeout(() => {
    gameState.hintCell = null;
    renderBoard();
}, 3000);
```

**¿Por qué guardar `endTime`?**
- `renderBoard()` se llama muchas veces durante los 3 segundos
- Necesita saber si el hint sigue activo
- Compara `Date.now() < hintCell.endTime`

**Aprende**: Timers, animaciones CSS, estado temporal

---

### `findWordStart(word)`
**Propósito**: Encontrar la posición de inicio de una palabra en el tablero.

**Parámetros**:
- `word` (string): Palabra a buscar

**Retorna**: `{r, c} | null` - Posición o null si no se encuentra

**Estrategia de dos niveles**:
```javascript
// 1. Intento primario: usar path guardado
if (gameState.wordPaths[word]) {
    return gameState.wordPaths[word][0];
}

// 2. Fallback: buscar en el tablero (greedy)
for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c] === word[0]) {
            if (canTraceWord(word, r, c)) {
                return { r, c };
            }
        }
    }
}

return null;
```

**¿Por qué el fallback puede fallar?**
- `canTraceWord()` usa greedy approach
- Puede tomar el camino equivocado
- Por eso es crítico guardar paths en `placeWord()`

**Aprende**: Estrategias de búsqueda, fallback patterns

---

### `startTimer()` & `updateTimer()`
**Propósito**: Iniciar y actualizar el cronómetro del juego.

**Implementación**:
```javascript
function startTimer() {
    gameState.timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    gameState.timer++;
    updateDisplay();
}
```

**¿Qué hace `setInterval()`?**
- Ejecuta una función repetidamente cada X milisegundos
- `setInterval(fn, 1000)` → ejecuta `fn` cada 1 segundo
- Retorna un ID que guardamos para poder limpiar después

**Limpieza del interval**:
```javascript
clearInterval(gameState.timerInterval);
gameState.timer = 0;
```

**¿Por qué limpiar?**
- Si no limpiamos, el interval sigue ejecutándose
- Memory leak: consume recursos indefinidamente
- Al iniciar nuevo juego, tendríamos múltiples timers

**Aprende**: Timers JavaScript, memory management

---

### `showVictoryModal()`
**Propósito**: Mostrar modal de victoria cuando se encuentran todas las palabras.

**Retorna**: `void`

**Acciones**:
```
1. Pausar timer
2. Cambiar gameStatus a 'won'
3. Actualizar datos en modal (tiempo, puntos)
4. Mostrar modal (opacity 1)
```

**CSS Transition**:
```css
.neon-modal {
    opacity: 0;
    transition: opacity 0.3s;
}

.neon-modal.show {
    opacity: 1;
}
```

**Formato de tiempo en modal**:
```javascript
const minutes = Math.floor(gameState.timer / 60);
const seconds = gameState.timer % 60;
elements.modalTime.textContent =
    `${minutes}:${seconds.toString().padStart(2, '0')}`;
```

**Aprende**: Modals, UI states, transiciones CSS

---

## Estructuras de Datos Clave

### `gameState.board`
**Tipo**: `Array<Array<string>>`

**Estructura**:
```javascript
[
    ['P', 'X', 'A', ...], // Fila 0
    ['E', 'Z', 'B', ...], // Fila 1
    ['O', 'Q', 'C', ...], // Fila 2
    ...
]
```

**Acceso**: `board[row][col]` → string

---

### `gameState.wordPaths`
**Tipo**: `Object` (usado como diccionario/mapa)

**Estructura**:
```javascript
{
    "PEON": [
        {r: 0, c: 0}, // P
        {r: 1, c: 2}, // E
        {r: 3, c: 3}, // O
        {r: 4, c: 1}  // N
    ],
    "TORRE": [ /* ... */ ]
}
```

**Uso**: `wordPaths[word]` → Array de posiciones

---

### `gameState.foundPaths`
**Tipo**: `Array<Object>`

**Estructura**:
```javascript
[
    {
        word: "PEON",
        path: [{r:0,c:0}, {r:1,c:2}, ...],
        color: {hex: '#ff00ff', glow: '...'},
        index: 0
    },
    {
        word: "TORRE",
        path: [ /* ... */ ],
        color: {hex: '#00ffff', glow: '...'},
        index: 1
    }
]
```

---

## Patrones de Diseño Utilizados

### 1. **Module Pattern** (implícito)
- Todo el código en un scope
- `gameState` como singleton interno
- Encapsulación de estado

### 2. **Observer Pattern**
- Event listeners escuchan cambios de UI
- `addEventListener()` es observer pattern

### 3. **State Machine**
- `gameStatus`: 'playing' → 'won'
- Diferentes comportamientos según estado

### 4. **Factory Pattern**
- `createEmptyBoard()` fabrica tableros
- Consistencia en creación de estructuras

### 5. **Strategy Pattern**
- Diferentes renderers según estado de celda
- `if (isFound)` vs `if (isSelected)`

### 6. **Command Pattern** (ligero)
- Botones ejecutan comandos específicos
- `resetBtn → startNewGame()`

---

## Conceptos de Performance

### 1. **DOM Caching**
```javascript
// ❌ LENTO (busca en DOM cada vez)
document.getElementById('gameBoard').innerHTML = '';

// ✅ RÁPIDO (usa referencia guardada)
elements.gameBoard.innerHTML = '';
```

### 2. **DOM Reuse**
```javascript
// ❌ LENTO (recrea 64 elementos)
gameBoard.innerHTML = '';
for (...) {
    gameBoard.appendChild(createCell());
}

// ✅ RÁPIDO (reutiliza elementos)
for (let i = 0; i < cells.length; i++) {
    updateCell(cells[i]);
}
```

### 3. **Event Delegation** (parcial)
- Event listeners se agregan una vez en creación
- No se re-agregan en cada render

### 4. **Debouncing** (implícito)
- `isDragging` previene re-selección excesiva

---

## Algoritmos Clave

### 1. **Backtracking (placeWord)**
- Probar soluciones
- Retroceder si falla
- Intentar alternativa

### 2. **Greedy (canTraceWord)**
- Tomar primera opción válida
- No explorar todas las posibilidades
- Más rápido pero menos confiable

### 3. **Fisher-Yates Shuffle** (simplificado)
```javascript
array.sort(() => 0.5 - Math.random())
```

### 4. **Breadth-First Path Validation**
- getValidKnightMoves explora todos los vecinos
- Valida constraints antes de agregar

---

## Debugging Tips

### Ver estado completo:
```javascript
console.log(gameState);
```

### Ver paths de palabras:
```javascript
console.table(gameState.wordPaths);
```

### Ver tablero formateado:
```javascript
console.table(gameState.board);
```

### Verificar palabra en tablero:
```javascript
findWordStart("PEON");
```

### Forzar victoria (debug):
```javascript
gameState.foundPaths = gameState.targetWords.map((word, i) => ({
    word,
    path: gameState.wordPaths[word],
    color: CONFIG.NEON_COLORS[i % CONFIG.NEON_COLORS.length],
    index: i
}));
checkWordFound();
```

---

## Preguntas Frecuentes

**Q: ¿Por qué las palabras a veces no se pueden colocar?**
A: El algoritmo intenta 200 veces. Si no encuentra camino válido siguiendo movimientos de caballo, esa palabra se omite.

**Q: ¿Por qué usamos `?.` (optional chaining)?**
A: Si un elemento del DOM no existe, `element?.addEventListener` no lanza error. Hace el código más robusto.

**Q: ¿Qué pasa si clickeo muy rápido?**
A: `renderBoard` se optimiza reutilizando celdas. No hay problemas de performance.

**Q: ¿Por qué guardar `wordPaths`?**
A: Reconstruir paths con greedy algorithm puede fallar. Guardamos el path REAL usado al colocar la palabra.

**Q: ¿Puedo agregar más palabras?**
A: Sí, solo edita `CONFIG.DEFAULT_WORDS` con palabras en mayúsculas.

---

## Ejercicios de Aprendizaje

### Nivel Básico
1. Agrega un botón que muestre/oculte el tablero completo
2. Cambia el color de las celdas por defecto
3. Agrega un contador de clicks

### Nivel Intermedio
4. Implementa un sistema de niveles (más palabras = más difícil)
5. Agrega sonidos al encontrar palabras
6. Implementa un historial de últimas palabras encontradas

### Nivel Avanzado
7. Implementa undo/redo para selección de letras
8. Agrega animación de "wave" cuando encuentras palabra
9. Crea un modo de 2 jugadores por turnos

---

## Recursos Adicionales

- **MDN Web Docs**: Referencia completa de JavaScript
- **CSS-Tricks**: Guías de animaciones y efectos
- **JavaScript.info**: Tutoriales modernos de JS
- **Visualgo**: Visualización de algoritmos de búsqueda

---

**Última actualización**: 2025-12-30
**Versión del juego**: 1.0
**Autor**: Claude Code con comentarios educativos
