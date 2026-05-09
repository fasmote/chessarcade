# CriptoSopa - Errores y Soluciones

## 1. Errores de Renderizado

### Error #001: Parpadeo al hacer click (Primer Intento)
**Fecha**: 2025-12-30
**Severidad**: Media
**Descripción**: Al hacer click en una celda, se observaba un parpadeo visual molesto.

**Causa Raíz**:
- Eventos `click` y `mousedown` duplicados
- Ambos llamaban a `handleCellClick(r, c)`
- La función se ejecutaba dos veces por cada click

**Solución**:
```javascript
// ANTES (código con error)
cell.addEventListener('click', () => handleCellClick(r, c));
cell.addEventListener('mousedown', (e) => {
    e.preventDefault();
    gameState.isDragging = true;
    handleCellClick(r, c);
});

// DESPUÉS (solución)
// Solo mousedown
cell.addEventListener('mousedown', (e) => {
    e.preventDefault();
    gameState.isDragging = true;
    handleCellClick(r, c);
});
```

**Commit**: `7a5b0f2 - fix: Remove duplicate click event causing flicker`

---

### Error #002: Parpadeo persistente (Segundo Intento)
**Fecha**: 2025-12-30
**Severidad**: Alta
**Descripción**: Después de eliminar el evento duplicado, el parpadeo continuaba.

**Causa Raíz**:
- `renderBoard()` ejecutaba `elements.gameBoard.innerHTML = ''` en CADA render
- Esto borraba y recreaba las 64 celdas del DOM completamente
- Event listeners se re-agregaban en cada render
- 128 operaciones DOM por click (64 eliminaciones + 64 creaciones)

**Solución**:
Implementar renderizado inteligente:
1. Detectar si es primera renderización (`shouldRecreate`)
2. Solo crear celdas en primera vez
3. En renders posteriores: actualizar estilos/clases de celdas existentes

```javascript
// Detección
const shouldRecreate = elements.gameBoard.children.length === 0;

if (shouldRecreate) {
    // Crear celda nueva
    cell = document.createElement('div');
    // ... agregar event listeners
    elements.gameBoard.appendChild(cell);
} else {
    // Reutilizar celda existente
    cell = elements.gameBoard.children[cellIndex];
    cell.className = 'board-cell';
    cell.style.cssText = '';
    // ... solo actualizar estilos
}
```

**Impacto**:
- Antes: 128 operaciones DOM por click
- Después: 0 operaciones DOM por click (solo CSS updates)

**Commit**: `3d4301e - fix: Eliminate flicker by updating cells instead of recreating them`

---

## 2. Errores de Visualización de Celdas Compartidas

### Error #003: Colores compartidos no visibles en hover
**Fecha**: 2025-12-30
**Severidad**: Media
**Descripción**: Al pasar mouse sobre una palabra en el panel derecho, las celdas compartidas mostraban gradiente diagonal en lugar del color único de la palabra hovereada.

**Requerimiento Original**:
> "Cuando una letra se comparte y paso el mouse por el panel derecho por una palabra que comparte una letra, la letra se debe iluminar con el color de la palabra, no con los dos colores"

**Causa Raíz**:
- La lógica no diferenciaba entre estado normal y estado hover
- Siempre aplicaba gradiente diagonal para celdas compartidas
- No había validación de `gameState.hoveredWord`

**Solución**:
```javascript
const hoveredWordData = foundDataArray.find(fd => fd.word === gameState.hoveredWord);

if (foundDataArray.length > 1) {
    if (hoveredWordData) {
        // HOVER: Color único de la palabra
        cell.style.background = hoveredWordData.color.hex;
        cell.style.border = `3px solid ${hoveredWordData.color.hex}`;
        cell.classList.add('cell-wave');
        // Solo un badge
    } else {
        // NORMAL: Gradiente diagonal
        cell.style.background = backgroundGradient;
        cell.style.border = '3px solid white';
        // Múltiples badges
    }
}
```

**Beneficios**:
- Feedback visual claro de qué palabra se está tracking
- Animación de ola con color único
- Mejor UX al explorar palabras compartidas

**Commit**: `c89b43f - feat: Show single color for hovered word in shared cells`

---

## 3. Errores de Posicionamiento de Badges

### Error #004: Badges mal posicionados en celdas compartidas
**Fecha**: 2025-12-30
**Severidad**: Media
**Descripción**: Los números (badges) no estaban en las esquinas que correspondían a su zona de color.

**Ejemplo del error**:
```
Celda compartida: TABLERO[6] + ENROQUE[3]
- Color superior-izquierdo: amarillo (TABLERO)
- Color inferior-derecho: magenta (ENROQUE)

INCORRECTO:
- Badge "7" (TABLERO): inferior-izquierda ❌
- Badge "4" (ENROQUE): superior-derecha ❌

CORRECTO:
- Badge "7" (TABLERO): superior-izquierda ✓
- Badge "4" (ENROQUE): inferior-derecha ✓
```

**Causa Raíz**:
Posiciones de badges no coincidían con zonas de color en gradiente diagonal.

**Solución**:
```javascript
const cornerPositionsMap = {
    2: [
        { top: '-6px', left: '-6px' },      // word[0]: top-left
        { bottom: '-6px', right: '-6px' }   // word[1]: bottom-right
    ],
    3: [
        { top: '-6px', left: '-6px' },      // word[0]
        { top: '-6px', right: '-6px' },     // word[1]
        { bottom: '-6px', right: '-6px' }   // word[2]
    ],
    4: [
        { top: '-6px', left: '-6px' },      // word[0]
        { top: '-6px', right: '-6px' },     // word[1]
        { bottom: '-6px', left: '-6px' },   // word[2]
        { bottom: '-6px', right: '-6px' }   // word[3]
    ]
};
```

**Commit**: `ec5f8ad - fix: Position badges to match their color zones in shared cells`

---

## 4. Errores de Algoritmo de Colocación

### Error #005: Palabras frecuentemente compartiendo letras
**Fecha**: 2025-12-30
**Severidad**: Baja
**Descripción**: Aunque se solicitó evitar compartir letras, las palabras se cruzaban con frecuencia.

**Causa Raíz**:
- Solo 100 intentos por palabra
- Permitía overlap inmediatamente si la letra coincidía

**Solución**:
```javascript
const maxAttempts = 200; // Aumentado de 100

// Preferir no overlap, pero permitir después de 150 intentos
if (placed && (!hasOverlap || attempt > 150)) {
    // Aplicar al tablero
    return true;
}
```

**Lógica**:
- Intentos 1-150: Solo acepta colocaciones sin overlap
- Intentos 151-200: Acepta overlap si es la misma letra
- Prioridad clara a no compartir

**Commit**: `cb7b0d5 - feat: Support shared cells with multiple colors and numbers`

---

## 5. Errores de Interacción

### Error #006: No se podía arrastrar para seleccionar
**Fecha**: 2025-12-30
**Severidad**: Media
**Descripción**: Solo funcionaba el modo click, faltaba modo drag.

**Requerimiento**:
> "Puedes hacer que no solo haciendo clic, sino haciendo pasar el mouse por las letras"

**Solución**:
```javascript
// Estado global
gameState.isDragging = false;

// Eventos en celdas
cell.addEventListener('mousedown', (e) => {
    e.preventDefault();
    gameState.isDragging = true;
    handleCellClick(r, c);
});

cell.addEventListener('mouseenter', () => {
    if (gameState.isDragging) {
        handleCellClick(r, c);
    }
});

// Eventos globales
document.addEventListener('mouseup', () => {
    gameState.isDragging = false;
});

document.addEventListener('mouseleave', () => {
    gameState.isDragging = false;
});
```

**Commit**: `3ea5820 - feat: Add drag-to-select functionality`

---

### Error #007: Sistema de pistas no funcionaba
**Fecha**: 2025-12-30
**Severidad**: Alta
**Descripción**: Al hacer click en el botón "PISTA", solo se observaba una "vibración" del tablero pero no se destacaba visualmente dónde empieza la palabra.

**User Report**: "puedes mejorar la AYUDA, ahora mismo no hace nada, solo 'vibra' el tablero, pero no da pista de donde empieza alguna palabra"

**Causa Raíz**:
- La función `showHint()` agregaba la clase 'cell-hint-flash' directamente al DOM
- `renderBoard()` se ejecuta constantemente y limpia los estilos de las celdas
- La clase 'cell-hint-flash' era removida inmediatamente en el siguiente re-render
- La animación CSS nunca se podía ver porque la clase desaparecía

**Solución**:
Implementar estado persistente de hint:
```javascript
// En gameState
hintCell: null // {r, c, endTime}

// En showHint()
gameState.hintCell = {
    r: startPos.r,
    c: startPos.c,
    endTime: Date.now() + 3000
};
renderBoard();

// En renderBoard() - aplicar estilo si hint está activo
const isHintCell = gameState.hintCell &&
    gameState.hintCell.r === r &&
    gameState.hintCell.c === c &&
    Date.now() < gameState.hintCell.endTime;

if (isHintCell) {
    cell.classList.add('cell-hint-flash');
}
```

**Beneficios**:
- El hint sobrevive a los re-renders
- La animación se ve por completos 3 segundos
- Console log muestra exactamente qué palabra y posición se está destacando
- Auto-limpieza después del timeout

**Commit**: `b776af2 - feat: Improve hint system to actually highlight word start`

---

## 6. Bugs Conocidos (No Resueltos)

### Bug #001: Console logs de debug
**Severidad**: Cosmética
**Descripción**: Múltiples console.logs en producción.

**Ubicación**:
- `[WORD FOUND]` en línea 292
- `[SHARED CELL]` en línea 428

**Solución Propuesta**:
Crear constante de configuración:
```javascript
const DEBUG = false;

if (DEBUG) {
    console.log('[WORD FOUND]', ...);
}
```

---

## 7. Lecciones Aprendidas

### 7.1 Performance de DOM
- **Problema**: Recrear elementos DOM es LENTO
- **Solución**: Reutilizar elementos, solo actualizar estilos
- **Impacto**: Eliminación total de flicker

### 7.2 Event Listeners
- **Problema**: Eventos duplicados causan bugs sutiles
- **Solución**: Consolidar eventos, agregar una sola vez
- **Impacto**: Mejor rendimiento y menos bugs

### 7.3 Estado de UI
- **Problema**: UI compleja requiere múltiples estados
- **Solución**: Flags claros (isDragging, hoveredWord)
- **Impacto**: Lógica más clara y mantenible

### 7.4 Feedback Visual
- **Problema**: Usuario necesita entender estado actual
- **Solución**: Colores, animaciones, badges
- **Impacto**: UX significativamente mejorada

### 7.5 Estado Persistente vs. DOM Directo
- **Problema**: Modificaciones directas al DOM se pierden en re-renders
- **Solución**: Almacenar estado en gameState, aplicar durante render
- **Impacto**: Animaciones y efectos visuales funcionan correctamente
- **Ejemplo**: hintCell con endTime sobrevive a re-renders

---

## 8. Herramientas de Debugging Utilizadas

### 8.1 Console Logs
- `[WORD FOUND]`: Path completo de palabra encontrada
- `[SHARED CELL]`: Detección de celdas compartidas
- `[HINT]`: Palabra y posición siendo destacada por el sistema de pistas

### 8.2 Chrome DevTools
- Inspección de eventos (Event Listeners panel)
- Performance profiling (para detectar re-renders)
- Elementos DOM (para verificar estructura)

### 8.3 Git Bisect
- No utilizado (desarrollo lineal)
- Útil para futuros bugs de regresión

---

## 9. Errores de Estética y Responsive — Sesión 2026-05-07/08

### Error #101: Botones sin estilos neon
**Fecha**: 2026-05-07
**Severidad**: Alta
**Descripción**: Los tres botones del juego (NUEVO TABLERO, PISTA, AYUDA) se veían con estilos por defecto del navegador — grises, sin colores neon.

**Causa Raíz**:
El HTML usaba clases `.neon-arcade-btn--primary`, `.neon-arcade-btn--secondary`, `.neon-arcade-btn--tertiary` pero ninguna de estas variantes existía en `neonchess-style.css` ni en `criptosopa.css`. Solo existían `.neon-arcade-btn.red` y `.neon-arcade-btn.blue` en el sistema compartido.

**Solución**:
Definir las tres variantes en `criptosopa.css`:
- `--primary` → cyan (coherente con el tablero)
- `--secondary` → magenta (para pista)
- `--tertiary` → amarillo (para ayuda)
- Agregado estado `disabled` con opacidad 0.4 para botón PISTA sin hints restantes.

**Archivos**: `games/criptosopa/css/criptosopa.css`

---

### Error #102: Modales sin estilos (invisibles)
**Fecha**: 2026-05-07
**Severidad**: Alta
**Descripción**: Los modales de ayuda y victoria no se mostraban visualmente (sin overlay, sin caja, sin nada).

**Causa Raíz**:
El HTML usaba `.neon-modal`, `.neon-modal-content`, `.modal-header`, `.modal-close-btn` pero ninguna de estas clases estaba definida en ningún CSS del proyecto.

**Solución**:
Definir en `criptosopa.css`:
- `.neon-modal` → `display: none` por defecto, `display: flex` con clase `.active`
- `.neon-modal-content` → caja centrada con borde cyan y animación de entrada
- `.modal-header` → flex row con título y botón X
- `.modal-close-btn` → botón X con glow cyan

**Nota**: El JS ya usaba `.classList.add('active')` para mostrar modales — la clase `.active` ya estaba implementada correctamente en el JS, solo faltaba el CSS.

**Archivos**: `games/criptosopa/css/criptosopa.css`

---

### Error #103: SVG joystick del logo gigante en pantalla
**Fecha**: 2026-05-07
**Severidad**: Alta
**Descripción**: Los íconos SVG del logo (joysticks) se veían gigantes ocupando toda la pantalla.

**Causa Raíz**:
Los otros juegos (Memory Matrix, Master Sequence) definen `.joystick-icon { width: 40px; height: 40px; }` en un `<style>` tag inline en el HTML, que tiene mayor precedencia en la cascada CSS que un archivo externo. CriptoSopa solo lo tenía en `criptosopa.css` (archivo externo) y era vulnerable a ser sobreescrito por `neonchess-style.css`.

**Solución**:
Agregar `width="40" height="40"` directamente como atributos HTML en los elementos `<svg>`. Los atributos HTML de dimensión son inmunes a la sobreescritura por CSS.

**Archivos**: `games/criptosopa/index.html` (líneas 37 y 63)

---

### Error #104: Canvas huérfano creaba 150px de espacio vacío en mobile
**Fecha**: 2026-05-08
**Severidad**: Alta
**Descripción**: En mobile había un gran espacio vacío oscuro al inicio de la página (~150px) antes del título del juego.

**Causa Raíz**:
El HTML tiene `<canvas id="particlesCanvas" class="particles-canvas">` sin ningún CSS de posicionamiento. Un `<canvas>` sin CSS tiene tamaño por defecto de **300×150px** y vive en el flujo normal del documento, empujando todo el contenido hacia abajo.

El elemento NO es usado por ningún script del juego: `neonchess-effects.js` crea su propio canvas programáticamente con `id="neon-particles"`. El `particlesCanvas` es un elemento huérfano heredado de una versión anterior.

**Solución**:
Agregar en `criptosopa.css`:
```css
.particles-canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: -1;
}
```
Esto lo saca del flujo del documento y lo convierte en un fondo de pantalla (aunque esté vacío no molesta).

**Nota**: NO eliminar el canvas del HTML hasta confirmar que no hay ningún script externo o futuro que lo use.

**Archivos**: `games/criptosopa/css/criptosopa.css`

---

### Error #105: Responsive incompleto — breakpoint tablet faltante
**Fecha**: 2026-05-08
**Severidad**: Media
**Descripción**: Entre 641px y 1023px no había breakpoint, la página usaba 1 columna sin ajustes específicos. El grid de 2 columnas solo activaba a 1024px.

**Solución**:
- Grid 2 columnas activado desde **768px** (sidebar 260px)
- Desktop 1024px+ mantiene sidebar 320px con celdas más grandes
- Tablet pequeña 641–767px: 1 columna con tamaño de celda optimizado
- Mobile ≤640px: layout compacto completo (ver siguiente error)

**Archivos**: `games/criptosopa/css/criptosopa.css`

---

### Error #106: Mobile — demasiado espacio y botones no visibles sin scroll
**Fecha**: 2026-05-08
**Severidad**: Alta
**Descripción**: En mobile (iPhone 14), el título ocupaba demasiado espacio vertical y los botones quedaban fuera de la pantalla sin scrollear.

**Causa**: `.neon-container { padding: 2rem }` + título 2.5rem + subtítulo + timer = demasiada altura antes del tablero.

**Solución en mobile (≤640px)**:
- `.neon-container` padding reducido a `0.25rem 0.5rem`
- `.neon-back-btn` (← MENÚ) oculto — el emoji 🐴🔍 del título identifica el juego
- `.neon-subtitle` ("KNIGHT WORD SEARCH") oculto — ahorra una línea completa
- `.neon-title` reducido a `2rem !important`
- `.selection-bar` de 48px → 40px (sigue mostrando letras seleccionadas al jugar)
- Timer compacto (padding reducido, font 1.2rem)
- `.game-wrapper` gap 0.5rem
- Botones en grid 2+1: NUEVO TABLERO ocupa fila completa, PISTA + AYUDA comparten fila

**Archivos**: `games/criptosopa/css/criptosopa.css`

---

## 10. Errores de Audio y Touch — Sesión 2026-05-08

### Error #107: AudioContext suspendido en iOS — sin sonido en mobile
**Fecha**: 2026-05-08
**Severidad**: Alta
**Descripción**: Los sonidos no funcionaban en mobile (iOS Safari). El ícono mostraba "ON" pero no se escuchaba nada.

**Causa Raíz**:
iOS Safari requiere que el `AudioContext` sea "reanudado" (`resume()`) tras una interacción del usuario. La Web Audio API crea el contexto en estado `suspended` por defecto en iOS. El código llamaba directamente a `oscillator.start()` sin verificar ni reanudar el contexto.

**Solución**:
```javascript
function playBeep(frequency, duration) {
    const ctx = initAudio();
    if (ctx.state === 'suspended') {
        ctx.resume().then(() => play()); // reanudar antes de tocar
    } else {
        play();
    }
}
```

**Archivos**: `games/criptosopa/js/criptosopa.js` — función `playBeep()`

---

### Error #108: Ícono de mute no cambiaba visualmente
**Fecha**: 2026-05-08
**Severidad**: Media
**Descripción**: El ícono del botón de sonido siempre mostraba el parlante ON. Al mutear, el ícono no cambiaba.

**Causa Raíz**:
El código cambiaba `icon.className` correctamente, pero el diseño esperado era diferente al implementado. El usuario esperaba que el **parlante se mantuviera visible** y apareciera una **X a la derecha** (como en los otros juegos), no que se reemplazara el ícono por `fa-volume-slash`.

**Solución**:
Agregar un segundo `<i>` elemento para la X, controlado por la clase `.muted` en el botón vía CSS:
```html
<span class="sound-icon-wrap">
    <i class="fa-solid fa-volume-high"></i>
    <i class="fa-solid fa-xmark sound-muted-x"></i>  ← solo visible cuando .muted
</span>
```
```css
.sound-muted-x { display: none; }
.nav-btn.btn-sound.muted .sound-muted-x { display: inline; }
```

**Archivos**: `games/criptosopa/index.html`, `games/criptosopa/css/criptosopa.css`

---

### Error #109: Hamburger menu siempre mostraba "Sound: ON"
**Fecha**: 2026-05-08
**Severidad**: Media
**Descripción**: En mobile, el hamburger menu siempre mostraba "Sound: ON" sin importar el estado real del sonido.

**Causa Raíz**:
`hamburger-menu.js` usa `isSoundEnabled()` para leer el estado del sonido. Sin `window.SoundManager` ni `window.SoundManager.isMuted`, cae en el fallback de `localStorage`, que CriptoSopa nunca escribe → siempre retorna `true`.

**Solución**:
Exponer una interfaz compatible desde `criptosopa.js`:
```javascript
window.SoundManager = {
    isMuted: () => !soundEnabled,
    toggleMute: toggleSound
};
```

**Archivos**: `games/criptosopa/js/criptosopa.js`

---

### Error #110: Drag touch rompió todo el tablero — llave de cierre faltante
**Fecha**: 2026-05-08
**Severidad**: Crítica
**Descripción**: Tras implementar el drag touch, el tablero quedó completamente negro sin letras ni casillas. El juego no funcionaba en absoluto.

**Causa Raíz**:
La función `initTouchDrag()` fue escrita sin la llave de cierre `}`. En JavaScript, esto hace que todo el código siguiente quede **anidado dentro de esa función**. Las funciones `startNewGame()`, `renderBoard()`, etc. dejaron de ser accesibles globalmente, rompiendo toda la lógica del juego.

```javascript
function initTouchDrag() {
    // ...
    board.addEventListener('touchcancel', stopDrag);
    // ← FALTABA } AQUÍ

// Start new game  ← esto quedó DENTRO de initTouchDrag()
function startNewGame() { ... }
```

**Síntoma visual**: tablero negro, sin letras, sin interacción posible.
**Diagnóstico**: revisar la consola del browser al ver un tablero vacío — mostraba `startNewGame is not defined` u error similar.

**Solución**: agregar el `}` faltante.

**Lección**: Al agregar funciones nuevas mediante edición de texto, siempre verificar que el conteo de llaves de apertura y cierre sea correcto. Ante un bug tan total (todo el juego roto), la causa casi siempre es un error de sintaxis JS.

**Archivos**: `games/criptosopa/js/criptosopa.js`

---

### Error #111: Drag touch — deselección accidental al arrastrar
**Fecha**: 2026-05-08
**Severidad**: Media (diseño previsto)
**Descripción**: En la implementación de touch drag, al deslizar el dedo de vuelta sobre la última celda seleccionada, se activaba la lógica de "click en misma celda → des-seleccionar", causando comportamiento inesperado.

**Solución**:
Dos medidas preventivas en `initTouchDrag()`:
1. `lastTouchCell`: no procesar la misma celda dos veces consecutivas (evita deselección por temblor del dedo)
2. Skip si la celda ya está en el path: el drag solo puede AGREGAR celdas, nunca retroceder (comportamiento igual que en desktop con mouse)

**Archivos**: `games/criptosopa/js/criptosopa.js`

---

## 11. Errores de Marquee y Timer — Sesión 2026-05-09

### Error #112: Marquee loop sin separación visual entre ciclos
**Fecha**: 2026-05-09
**Severidad**: UX / Baja
**Descripción**: El marquee de palabras candidatas hacía un loop continuo sin indicación visual de que el ciclo había terminado. El jugador tenía "sensación de infinito" — no sabía cuántas palabras había.

**Causa Raíz**:
El contenido era duplicado para hacer el loop seamless, pero el separador `♞` entre el final del primer set y el inicio del segundo era idéntico al separador entre palabras. No había forma de distinguir el fin del ciclo.

**Solución**:
Cambio de arquitectura del marquee: en lugar de loop con contenido duplicado, implementar **ping-pong (bounce)**:
- Contenido UNA sola vez
- `· · · · · ·` en ambos extremos
- Dirección `±1` que se invierte al llegar a `scrollX = 0` o `scrollX = maxScroll`

**Lección**: El efecto bounce es más natural para el usuario que el loop seamless para listas cortas (6 palabras). El loop es mejor para contenido muy largo (noticias, tickers de bolsa). Para pocas palabras, el bounce comunica mejor los límites de la lista.

---

### Error #113: Marquee mostraba palabra ya encontrada durante 200ms
**Fecha**: 2026-05-09
**Severidad**: Media
**Descripción**: Al encontrar una palabra, el marquee seguía mostrando esa palabra durante 200ms antes de reconstruirse. El jugador debía des-seleccionar y re-seleccionar la última letra para que el sistema lo reconociera.

**Causa Raíz**:
Al encontrar una palabra:
1. `gameState.selectedPath = []` (limpia selección)
2. `setTimeout(() => wordMarquee.start(), 200)` (rebuild en 200ms)
3. `updateSelectionText()` corre **síncronamente** y llama `wordMarquee.unsuspend()`
4. `unsuspend()` reactiva el marquee VIEJO (que aún tenía la palabra encontrada)
5. Durante 200ms el marquee viejo se veía, confundiendo al jugador

**Solución**:
Llamar `wordMarquee.stop()` de inmediato al encontrar una palabra (antes del `setTimeout` del rebuild):
```javascript
wordMarquee.stop(); // detiene y elimina el marquee viejo YA
setTimeout(() => wordMarquee.start(), 200); // reconstruye con palabras restantes
```
En esos 200ms, `updateSelectionText()` muestra el display estático fallback.

**Lección**: Cuando hay un `setTimeout` de "rebuild", siempre destruir el estado anterior de inmediato, no esperar al rebuild para hacerlo. El estado viejo visible durante la espera confunde al usuario.

---

### Error #114: Timer arrancaba al cargar la página, no cuando el jugador comenzaba a jugar
**Fecha**: 2026-05-09
**Severidad**: UX / Media
**Descripción**: El timer comenzaba a correr apenas se cargaba la página, antes de que el jugador tocara ninguna celda. El jugador podía estar leyendo las instrucciones, distraído, o esperando — y el tiempo ya corría.

**Causa Raíz**:
`startTimer()` se llamaba en `startNewGame()`, que se ejecuta automáticamente en `DOMContentLoaded`.

**Solución**:
Flag `gameState.timerStarted = false` en `startNewGame()`. En `handleCellClick()`, al procesar el primer click:
```javascript
if (!gameState.timerStarted) {
    gameState.timerStarted = true;
    startTimer();
}
```

**Lección**: Los timers de juego deben empezar cuando el jugador decide comenzar a jugar, no cuando la página carga. El tiempo de carga, lectura del tutorial, o inactividad no debería penalizar al jugador.

---

### Lecciones Generales de la Sesión 2026-05-08/09

1. **RAF vs CSS animation para scroll**: `requestAnimationFrame` da control total (pausar, reanudar, cambiar dirección, snap a posición). CSS `animation` es más simple pero dificulta la interacción en tiempo real.

2. **Event delegation para detectar click en elemento scrolling**: `e.target.closest('.mq-word')` identifica exactamente qué elemento fue tocado sin calcular posiciones. Siempre preferir esta técnica sobre cálculos de coordenadas.

3. **`document.elementFromPoint(x, y)` para touch drag**: esta es LA función para implementar drag en touch. El `touchmove` dispara en el elemento donde empezó el toque, no donde está el dedo. `elementFromPoint` encuentra el elemento real bajo el dedo.

4. **Guard de tiempo para touch**: un `_touchStartTime` + ventana de 220ms previene que el temblor natural del dedo revierta acciones recién hechas. 220ms es el tiempo mínimo perceptible entre dos intenciones distintas.

5. **Singleton de AudioContext**: crear UN solo `AudioContext` y reutilizarlo. Crear múltiples contextos causa errores en algunos browsers. El patrón lazy-init (`if (!audioContext) { audioContext = new AudioContext(); }`) es el correcto.
