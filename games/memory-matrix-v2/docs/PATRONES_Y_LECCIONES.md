# 📚 Patrones y Lecciones Aprendidas - Memory Matrix

## 🎯 Documento para Futura Librería ChessArcade

Este documento recopila todos los patrones, problemas y soluciones encontrados durante el desarrollo de Memory Matrix. Es la base para crear una **ChessArcade Game Library** reutilizable.

---

## 🔧 PROBLEMA 1: Drag & Drop No Funcionaba

### 🐛 Síntoma
Los event listeners de `mousedown`/`touchstart` no se disparaban en las piezas del banco.

### 🔍 Causa Raíz
CSS `pointer-events: none` estaba bloqueando todos los eventos del mouse/touch.

```css
/* ❌ MAL */
.bank-piece-slot .piece {
    pointer-events: none;  /* Bloquea eventos! */
}
```

### ✅ Solución
Cambiar a `pointer-events: auto` y agregar `cursor: grab`.

```css
/* ✅ BIEN */
.bank-piece-slot .piece {
    pointer-events: auto;  /* Permite eventos */
    cursor: grab;          /* Visual de agarrar */
}

.bank-piece-slot .piece:active {
    cursor: grabbing;      /* Visual mientras arrastra */
}
```

### 📦 Para la Librería
**ChessArcade.DragDrop debe verificar `pointer-events` y advertir si está bloqueado:**

```javascript
function validateDragDropElement(element) {
    const style = getComputedStyle(element);
    if (style.pointerEvents === 'none') {
        console.warn('⚠️ pointer-events: none detected. Drag & drop may not work.');
        return false;
    }
    return true;
}
```

---

## 🔧 PROBLEMA 2: Piezas Dinámicas Sin Event Listeners

### 🐛 Síntoma
Las piezas agregadas dinámicamente (después de animación) no respondían a drag & drop.

### 🔍 Causa Raíz
Los event listeners se agregaban solo a elementos existentes en DOM. Las piezas que se creaban después (via `appendChild`) no tenían listeners.

### ✅ Solución
Usar **MutationObserver** para detectar piezas nuevas automáticamente:

```javascript
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.matches('img.piece')) {
                addPieceListeners(node);
                console.log('🎯 Listeners agregados a pieza:', node.dataset.piece);
            }
        });
    });
});

observer.observe(bankElement, {
    childList: true,
    subtree: true
});
```

### 📦 Para la Librería
**ChessArcade.DragDrop debe incluir MutationObserver por defecto:**

```javascript
ChessArcade.DragDrop.init({
    autoDetectNewPieces: true,  // Default: true
    observeContainer: '.piece-bank'
});
```

---

## 🔧 PROBLEMA 3: Validación Incorrecta Se Quedaba "Validando..."

### 🐛 Síntoma
Cuando colocabas piezas en posiciones incorrectas, decía "Validando..." y no mostraba feedback.

### 🔍 Causa Raíz
La función `validatePosition()` retornaba `false` pero no había callback de error. Solo había callback de éxito (`onLevelComplete`).

### ✅ Solución
Crear dos funciones separadas:
- `onAttemptSuccess()` - Cuando todo está correcto
- `onAttemptFailed(incorrectPieces)` - Cuando hay errores

```javascript
if (isComplete) {
    onAttemptSuccess();
} else {
    onAttemptFailed(incorrectPieces);  // ← ESTO FALTABA
}
```

### 📦 Para la Librería
**Toda validación debe tener ambos callbacks:**

```javascript
ChessArcade.Game.validate({
    onSuccess: () => { /* ... */ },
    onFail: (errors) => { /* ... */ },  // ← OBLIGATORIO
    showFeedback: true  // Mostrar feedback visual
});
```

---

## 🎮 PATRÓN 1: Sistema de Intentos Progresivos

### 📋 Concepto
No pasar de nivel inmediatamente. Requiere **múltiples intentos exitosos** para dominar el nivel.

### 🎯 Implementación
```javascript
let successfulAttempts = 0;
const attemptsRequired = 10;

function onAttemptSuccess() {
    successfulAttempts++;

    if (successfulAttempts >= attemptsRequired) {
        onLevelComplete();  // Pasar de nivel
    } else {
        nextAttempt();  // Otro intento en el mismo nivel
    }
}
```

### 💡 Por Qué Funciona
- **Niños pequeños** necesitan repetición para aprender
- **Adultos** mejoran la memoria con práctica
- Previene pasar niveles "de suerte"

### 📦 Para la Librería
```javascript
ChessArcade.Levels.setProgressionMode({
    type: 'progressive',  // 'immediate' | 'progressive' | 'custom'
    attemptsPerLevel: 10,
    allowSkip: false
});
```

---

## 🎮 PATRÓN 2: Desaparición Progresiva (Scaffolding)

### 📋 Concepto
No ocultar todas las piezas al principio. Dejar **piezas de referencia** y aumentar dificultad gradualmente.

### 🎯 Implementación
```javascript
const hidePiecesConfig = {
    progressiveHiding: [
        { attempts: [1,2,3,4,5,6,7,8], hideCount: 1, hideIndices: [1] },  // Solo 1 pieza
        { attempts: [9,10], hideCount: 2, hideIndices: [0,1] }  // Todas
    ]
};
```

**Nivel 1 - Ejemplo:**
- Intento 1-8: Solo desaparece Rey Negro (Rey Blanco queda de referencia)
- Intento 9-10: Desaparecen ambos reyes (sin referencia, más difícil)

### 💡 Por Qué Funciona
- **Contexto visual**: Tener una pieza visible ayuda a recordar la otra
- **Confianza**: Niños ganan confianza antes del desafío total
- **Progresión natural**: Dificultad aumenta gradualmente

### 📦 Para la Librería
```javascript
ChessArcade.Memory.setDifficultyProgression({
    mode: 'scaffold',  // 'all-at-once' | 'scaffold' | 'custom'
    stages: [
        { ratio: 0.5, attempts: 8 },   // 50% de piezas ocultas
        { ratio: 1.0, attempts: 2 }    // 100% de piezas ocultas
    ]
});
```

---

## 🎮 PATRÓN 3: Ambos Reyes Siempre Presentes

### 📋 Concepto
**Siempre** incluir ambos reyes (wK y bK) en toda posición, independientemente del nivel.

### 🎯 Implementación
```javascript
function generateRandomPosition(levelNumber) {
    const position = [];

    // PASO 1: SIEMPRE agregar ambos reyes
    position.push({ square: getRandomSquare(), piece: 'wK' });
    position.push({ square: getRandomSquare(), piece: 'bK' });

    // PASO 2: Agregar piezas adicionales
    for (let i = 0; i < additionalPieces; i++) {
        const pieceTypes = availableTypes.filter(type => type !== 'K');  // ← Sin reyes
        // ...
    }
}
```

### 💡 Por Qué Funciona
- **Reyes son únicos**: Más fáciles de recordar que torres/alfiles
- **Referencia**: Siempre hay un punto de partida
- **Consistencia**: Jugadores saben que siempre habrá reyes

### 📦 Para la Librería
```javascript
ChessArcade.Position.generate({
    requiredPieces: ['wK', 'bK'],  // Siempre incluidos
    additionalCount: 3,
    allowedTypes: ['Q', 'R', 'B']
});
```

---

## 🎮 PATRÓN 4: Posiciones Completamente Aleatorias

### 📋 Concepto
Cada intento genera una **posición diferente**, nunca la misma.

### 🎯 Implementación
```javascript
// ❌ MAL: Posición fija
const position = [
    { square: 'e1', piece: 'wK' },
    { square: 'e8', piece: 'bK' }
];

// ✅ BIEN: Aleatorio
function generateRandomPosition() {
    return [
        { square: getRandomSquare(), piece: 'wK' },
        { square: getRandomSquare(), piece: 'bK' }
    ];
}
```

### 💡 Por Qué Funciona
- **No se aburren**: Siempre algo nuevo
- **Aprendizaje real**: Memorizan el patrón, no una posición específica
- **Rejugabilidad**: Infinitas partidas únicas

### 📦 Para la Librería
```javascript
ChessArcade.Position.setRandomization({
    mode: 'full',  // 'fixed' | 'partial' | 'full'
    seed: null,    // Para testing reproducible
    avoidRepetition: true  // No repetir últimas 10 posiciones
});
```

---

## 🎨 PATRÓN 5: Feedback Claro y Constructivo

### 📋 Concepto
Cuando algo sale mal, mostrar **exactamente qué está mal** y cómo mejorar.

### 🎯 Implementación
```javascript
function onAttemptFailed(incorrectPieces) {
    // Mostrar qué está mal
    incorrectPieces.forEach(({ square, expected, actual }) => {
        console.log(`❌ ${square}: esperaba ${expected}, colocaste ${actual}`);
    });

    // Mensaje constructivo
    updateStatus(`❌ Incorrecto. Intenta de nuevo (${successfulAttempts}/10 correctos)`);

    // Dar otra oportunidad
    setTimeout(() => {
        updateStatus(`Intenta de nuevo. Presiona COMENZAR`);
    }, 2500);
}
```

### 💡 Por Qué Funciona
- **Aprendizaje**: Saben qué salió mal
- **No frustra**: Pueden intentar inmediatamente
- **Motivación**: Ven su progreso (3/10 correctos)

### 📦 Para la Librería
```javascript
ChessArcade.Feedback.show({
    type: 'error',
    message: 'Incorrecto',
    details: incorrectPieces,  // Array de errores
    showProgress: true,        // Mostrar X/Y correctos
    allowRetry: true,
    retryDelay: 2500
});
```

---

## ⚙️ PATRÓN 6: Estado del Juego Claro

### 📋 Concepto
Siempre saber en qué fase estás y qué se puede hacer.

### 🎯 Implementación
```javascript
let gameState = 'idle';  // 'idle' | 'memorizing' | 'solving' | 'completed' | 'failed'

function canPlacePiece() {
    if (gameState !== 'solving') {
        updateStatus('⚠️ Espera a que comience la fase de resolución');
        return false;
    }
    return true;
}
```

### 💡 Por Qué Funciona
- **Previene bugs**: No puedes arrastrar durante memorización
- **Feedback claro**: Mensajes explican por qué no funciona
- **Seguridad**: Estado consistente

### 📦 Para la Librería
```javascript
ChessArcade.Game.setState({
    current: 'solving',
    allowedActions: ['drag', 'drop'],
    blockedActions: ['start', 'reset'],
    onInvalidAction: (action) => {
        console.warn(`Acción ${action} no permitida en estado ${state}`);
    }
});
```

---

## 🚀 RESUMEN: Librería ChessArcade Propuesta

### Módulos Core

```
ChessArcade/
├── Core/
│   ├── Game.js           (Estado, flujo, validación)
│   ├── Levels.js         (Sistema de niveles progresivos)
│   └── Position.js       (Generación de posiciones)
├── UI/
│   ├── DragDrop.js       (Con MutationObserver integrado)
│   ├── Animations.js     (Piezas voladoras, efectos)
│   └── Feedback.js       (Mensajes, validación visual)
├── Memory/
│   ├── MemoryGame.js     (Lógica específica de memoria)
│   ├── Scaffolding.js    (Desaparición progresiva)
│   └── Progression.js    (Sistema de intentos)
└── Utils/
    ├── Pieces.js         (Nombres, símbolos, validación)
    ├── Board.js          (Coordenadas, casillas)
    └── Validation.js     (Comparación de posiciones)
```

### API Propuesta

```javascript
// Inicialización simple
const game = new ChessArcade.MemoryGame({
    board: '#chessboard',
    bank: '.piece-bank',
    levels: ChessArcade.Levels.PROGRESSIVE_10,  // Preset
    difficulty: 'child',  // 'child' | 'teen' | 'adult' | 'expert'
    feedbackMode: 'constructive'  // Siempre mostrar qué está mal
});

// Personalización avanzada
game.setProgression({
    attemptsPerLevel: 10,
    scaffolding: true,
    alwaysIncludeKings: true,
    randomPositions: true
});

// Hooks
game.on('attemptSuccess', () => { /* ... */ });
game.on('attemptFailed', (errors) => { /* ... */ });
game.on('levelComplete', () => { /* ... */ });

// Iniciar
game.start();
```

---

## 📊 Lecciones para Todos los Juegos

### 1. **CSS puede romper JavaScript**
- Verificar `pointer-events`, `display`, `visibility`
- Usar herramientas de debug para CSS

### 2. **DOM dinámico necesita observadores**
- `MutationObserver` para elementos agregados después
- O usar delegación de eventos en contenedores

### 3. **Feedback > Silencio**
- Siempre explicar por qué algo no funciona
- Mostrar progreso (X/Y correctos)

### 4. **Progresión gradual**
- Múltiples intentos antes de avanzar
- Scaffold (quitar ayudas gradualmente)

### 5. **Aleatoriedad inteligente**
- Posiciones aleatorias pero con reglas
- Piezas clave siempre presentes

### 6. **Estado > Variables sueltas**
- Un objeto `gameState` claro
- Validar acciones según estado actual

---

---

## 🔧 PROBLEMA 7: Sonidos Duplicados en Timer Countdown

### 🐛 Síntoma
Durante los últimos 3 segundos del timer de memorización, el sonido de advertencia se reproducía correctamente con el número 3, pero con el 2 y el 1 se escuchaba el sonido duplicado (dos sonidos seguidos).

### 🔍 Causa Raíz
Había **dos sistemas independientes** que reproducían sonidos al mismo tiempo:

1. **Timer countdown**: Reproducía `playGlitchSound('warning')` cuando `remaining <= 3`
2. **Efecto glitch visual**: La función `applyGlitchEffect()` también reproducía el mismo sonido cuando se activaba el efecto visual en las piezas (al 40% y 80% del tiempo de memorización)

```javascript
// ❌ PROBLEMA: Dos lugares reproducían el mismo sonido

// 1. En el timer (nuevo código)
if (remaining <= 3 && remaining > 0) {
    window.MemoryMatrixAudio.playGlitchSound('warning');
}

// 2. En applyGlitchEffect (código existente)
function applyGlitchEffect(squares, intensity) {
    // ... efectos visuales ...
    window.MemoryMatrixAudio.playGlitchSound(intensity); // ← DUPLICADO
}
```

El glitch "crítico" se activaba al 80% del tiempo (≈1-2 segundos restantes), coincidiendo con los sonidos del timer.

### ✅ Solución
Centralizar la reproducción del sonido en un solo lugar (el timer), y quitar el sonido de `applyGlitchEffect`:

```javascript
// ✅ BIEN: Solo el timer reproduce sonido
function applyGlitchEffect(squares, intensity) {
    // ... efectos visuales solamente ...
    // NOTA: El sonido de advertencia ahora se reproduce desde el timer
    // para mejor sincronización con el countdown visual
}
```

### 📦 Para la Librería
**Principio: Un sonido = Una fuente**

```javascript
ChessArcade.Audio.setPolicy({
    // Evitar que múltiples sistemas reproduzcan el mismo sonido
    preventDuplicates: true,

    // Definir qué sistema "posee" cada sonido
    soundOwnership: {
        'warning': 'timer',      // Solo el timer puede reproducir warning
        'success': 'validation', // Solo validación puede reproducir success
        'error': 'validation'
    },

    // Tiempo mínimo entre reproducciones del mismo sonido
    debounceMs: 100
});
```

### 💡 Lección Aprendida
Cuando agregas sonidos a un sistema existente, **buscar primero si ya hay sonidos similares** en otras partes del código. Es fácil crear duplicaciones accidentales cuando diferentes módulos manejan efectos relacionados (visuales + auditivos).

**Checklist antes de agregar sonido:**
- [ ] ¿Existe ya un sonido similar en el código?
- [ ] ¿Hay otros sistemas que podrían activar este sonido?
- [ ] ¿El timing del sonido conflicta con otros eventos?

---

## 🔧 PROBLEMA 8: Pieza Identificada Incorrectamente (Bug del Caballo Negro)

### 🐛 Síntoma
Al usar el sistema tap-tap en mobile, a veces una pieza se identificaba con un tipo incorrecto. Por ejemplo, un caballo blanco (`wN`) aparecía como caballo negro (`bN`), o cualquier pieza podía tomar la identidad de otra.

El jugador colocaba una pieza correctamente en el tablero, pero el sistema la validaba como si fuera otra pieza diferente.

### 🔍 Causa Raíz
El código de `DragDrop.js` usaba un **fallback peligroso** al leer el tipo de pieza:

```javascript
// ❌ MAL - Fallback al slot del banco
const piece = pieceElement.dataset.piece || bankSlot.dataset.piece;
```

**El problema:**
1. El banco tiene 12 slots predefinidos, cada uno con su propio `dataset.piece` (wK, wQ, wR, wB, wN, wP, bK, bQ, bR, bB, **bN**, bP)
2. Cuando las piezas vuelan del tablero al banco, se colocan en **cualquier slot vacío** (no necesariamente el que coincide con su tipo)
3. Si por alguna razón `pieceElement.dataset.piece` estaba vacío o era falsy, el código usaba el `dataset.piece` del **slot** como fallback
4. Esto causaba que una pieza `wN` en el slot `bN` fuera identificada como `bN`

### ✅ Solución
Nunca usar el `dataset.piece` del slot como fallback. Solo confiar en la imagen de la pieza:

```javascript
// ✅ BIEN - Solo usar dataset de la imagen
const piece = pieceElement.dataset.piece;

if (!piece) {
    console.error('❌ Pieza sin dataset.piece - esto es un bug!', pieceElement);
    return;
}
```

### 📍 Archivos Afectados
- `ChessGameLibrary/DragDrop.js` - línea ~163 (handleDragStart)
- `ChessGameLibrary/DragDrop.js` - línea ~650 (initTapTap click handler)

### 📦 Para la Librería
**Principio: Datos de la entidad > Datos del contenedor**

```javascript
ChessArcade.DragDrop.setConfig({
    // La pieza siempre tiene la autoridad sobre su identidad
    pieceIdentitySource: 'element',  // 'element' | 'container' | 'both'

    // Validar que las piezas siempre tengan dataset.piece
    requirePieceDataset: true,

    // En modo debug, advertir si hay inconsistencias
    debugMode: true
});
```

### 💡 Lección Aprendida
**Los contenedores (slots) no deben tener información sobre su contenido futuro.** El `dataset.piece` del slot era un residuo de un diseño anterior donde los slots estaban "reservados" para tipos específicos de piezas.

**Checklist para sistemas de drag & drop:**
- [ ] ¿De dónde viene la identidad del elemento arrastrado?
- [ ] ¿Hay fallbacks que podrían usar datos incorrectos?
- [ ] ¿Los contenedores tienen datos que podrían confundirse con los del contenido?

---

## 🔧 PROBLEMA 9: Clase CSS `hidden` con `!important` Bloquea Visibilidad

### 🐛 Síntoma
Un elemento que debería aparecer con `.classList.add('visible')` no se mostraba en pantalla, aunque el JavaScript se ejecutaba correctamente y los logs confirmaban que la clase se agregaba.

### 🔍 Causa Raíz
El HTML tenía la clase `hidden` inicial:
```html
<div class="correction-counter hidden" id="correctionCounter">
```

Y el CSS definía:
```css
.hidden {
    display: none !important;
}
```

El `!important` en `display: none` tiene mayor especificidad que cualquier otra regla, incluyendo la clase `.visible` que usaba `opacity` y `visibility`.

### ✅ Solución
Al mostrar el elemento, **primero remover `hidden`**, luego agregar `visible`:

```javascript
// ✅ BIEN - Remover hidden antes de agregar visible
function showElement(element) {
    element.classList.remove('hidden');
    element.classList.add('visible');
}

function hideElement(element) {
    element.classList.remove('visible');
    element.classList.add('hidden');
}
```

### 📦 Para la Librería
**Principio: Conocer la jerarquía de visibilidad CSS**

```javascript
ChessArcade.UI.setVisibilityClasses({
    hidden: 'hidden',    // Clase que oculta completamente
    visible: 'visible',  // Clase que muestra
    // Al mostrar: primero remove hidden, luego add visible
    // Al ocultar: primero remove visible, luego add hidden
    autoManage: true
});
```

### 💡 Lección Aprendida
Cuando uses clases CSS para visibilidad:
1. **`display: none`** es "más fuerte" que `opacity: 0` o `visibility: hidden`
2. **`!important`** puede causar conflictos inesperados
3. Siempre verificar qué clases tiene el elemento inicial en HTML

---

---

## 🔧 PROBLEMA 10: MutationObserver sin Distinción de Contexto

### 🐛 Síntoma
Al agregar drag listeners a piezas del tablero via MutationObserver, las piezas **fijas de referencia** (las que aparecen al inicio del nivel como ayuda visual) también se volvían arrastrables. Al moverlas, el sistema las perdía de `placedPieces`, la validación fallaba, se perdía una vida y la pieza no volvía al tablero.

### 🔍 Causa Raíz
El MutationObserver agregaba listeners a **cualquier** `img.piece` agregada al tablero, sin importar su origen:

```javascript
// ❌ MAL - Observa TODAS las piezas del tablero
boardObserver.observe(boardElement, { childList: true, subtree: true });
// → Las piezas fijas (showPiece durante memorización) también reciben listeners
```

Las piezas fijas son colocadas por `showPiece()` al inicio del juego y NO están en `placedPieces`. El sistema de drag las trataba como piezas del jugador.

### ✅ Solución
El callback `canDragBoardPiece` recibe la casilla de origen y verifica que esté en `placedPieces`:

```javascript
// ✅ BIEN - Solo permite arrastrar piezas que el jugador colocó
canDragBoardPiece: (fromSquare) =>
    gameState === 'solving' &&
    placedPieces.some(p => p.square === fromSquare)
```

El MutationObserver puede seguir observando todo — el control está en el momento del drag, no en el registro del listener.

### 💡 Lección Aprendida
**Los listeners de drag son baratos; la validación de contexto es lo importante.**
No intentes filtrar qué elementos reciben listeners — es difícil y propenso a errores. En cambio, filtrá en el handler usando el estado del juego.

**Checklist para drag desde tablero:**
- [ ] ¿Todas las piezas del tablero tienen listeners? (OK)
- [ ] ¿El handler valida si la pieza pertenece al jugador? (OBLIGATORIO)
- [ ] ¿La validación usa el estado del juego, no el DOM? (OBLIGATORIO)

### 📦 Para la Librería
```javascript
ChessArcade.DragDrop.init({
    canDragFromBoard: (square, piece, gameContext) => {
        // Siempre recibir contexto para decidir
        return gameContext.playerPieces.includes(square);
    }
});
```

---

## 🔧 PROBLEMA 11: Estructura de Historial Incompatible con Nuevas Acciones

### 🐛 Síntoma
El botón "deshacer" funcionaba correctamente para piezas colocadas desde el banco, pero si se extendía el sistema para soportar movimientos tablero→tablero, el undo enviaba la pieza al banco en lugar de devolverla a su casilla anterior.

### 🔍 Causa Raíz
El historial `moveHistory` solo guardaba `{ square, piece }` — suficiente para un flujo de una dirección (banco→tablero), pero insuficiente cuando el origen puede ser otra casilla del tablero:

```javascript
// ❌ MAL - Sin información de origen
moveHistory.push({ square: 'd5', piece: 'wK' });
// → El undo no sabe de dónde vino la pieza
```

### ✅ Solución
Extender la estructura con toda la información de origen:

```javascript
// ✅ BIEN - Con información completa de origen
moveHistory.push({
    toSquare: 'd5',
    fromSquare: 'e4',   // null si viene del banco
    piece: 'wK',
    fromBank: false     // true si viene del banco
});

// El undo bifurca según fromBank:
if (lastMove.fromBank) {
    animatePieceBackToBank(lastMove.toSquare, lastMove.piece, callback);
} else {
    animatePieceBackToSquare(lastMove.toSquare, lastMove.fromSquare, lastMove.piece, callback);
}
```

### 💡 Lección Aprendida
**Diseñar el historial pensando en el undo desde el día 1.** El undo necesita saber exactamente de dónde vino cada cosa, no solo a dónde fue. Guardar `{ to, from, what }` siempre es mejor que solo `{ to, what }`.

**Antes de agregar nuevas acciones al historial:**
- [ ] ¿La nueva acción tiene un origen diferente a las anteriores?
- [ ] ¿El undo de la nueva acción funciona con la estructura actual?
- [ ] ¿La estructura es retrocompatible? (el campo `fromBank` permite detectar el caso anterior)

### 📦 Para la Librería
```javascript
ChessArcade.History.push({
    type: 'move',       // 'place' | 'move' | 'remove'
    piece: 'wK',
    from: { type: 'square', coord: 'e4' },   // o { type: 'bank' }
    to:   { type: 'square', coord: 'd5' }
});
```

---

## 🔧 PROBLEMA 12: Timeout de Auto-validación sin Control

### 🐛 Síntoma
Si el jugador colocaba la última pieza y dentro de los 500ms de gracia movía esa pieza a otra casilla, la validación corría con el `placedPieces` actualizado pero podía haber un desajuste entre el estado interno y el DOM durante la transición.

### 🔍 Causa Raíz
```javascript
// ❌ MAL - Timeout sin referencia, no cancelable
setTimeout(() => {
    validatePosition();
}, 500);
```

Si se disparaba un nuevo `onPiecePlaced` antes de los 500ms, se tenía una segunda validación pendiente, y el estado podía ser inconsistente.

### ✅ Solución
Guardar la referencia del timeout y cancelarla al inicio de cada `onPiecePlaced`:

```javascript
// ✅ BIEN - Timeout cancelable
let validationTimeout = null;

// Al colocar pieza:
if (validationTimeout) {
    clearTimeout(validationTimeout);
    validationTimeout = null;
}

if (remaining === 0) {
    validationTimeout = setTimeout(() => {
        validationTimeout = null;
        validatePosition();
    }, 500);
}
```

### 💡 Lección Aprendida
**Todo `setTimeout` que puede ser interrumpido por una acción del usuario debe ser cancelable.** Guardar la referencia en una variable es gratis y evita estados inconsistentes.

**Regla general:** Si el usuario puede hacer algo antes de que termine un timeout, ese timeout debe poder cancelarse.

---

**Este documento será la base de ChessArcade Game Library v1.0**

Última actualización: 2026-05-07
