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
