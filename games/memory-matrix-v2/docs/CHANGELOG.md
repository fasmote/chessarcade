# 📝 CHANGELOG - Memory Matrix v2

Registro cronológico de cambios día a día.

---

## [2026-05-07] - Reubicar piezas ya colocadas en el tablero

### Added ✨

- **Drag tablero→tablero**: cualquier pieza colocada por el jugador puede arrastrarse a otra casilla vacía sin necesidad de usar el botón deshacer
- **Tap-tap desde tablero (mobile)**: tocar una pieza ya colocada la selecciona con brillo dorado; un segundo tap en casilla vacía la mueve
- **Undo mejorado (bifurcado)**:
  - Movimiento banco→tablero: devuelve la pieza al banco (comportamiento anterior)
  - Movimiento tablero→tablero: devuelve la pieza a su casilla anterior con animación
- **Animación tablero→tablero**: nueva función `animatePieceBackToSquare()` con efecto bounce suave
- **Validación cancelable**: el timeout de auto-validación (500ms) se cancela si el jugador mueve una pieza antes de que dispare, evitando validar una posición intermedia
- **`canDragBoardPiece` con contexto**: el callback recibe la casilla de origen para distinguir piezas colocadas por el jugador vs piezas fijas de referencia
- **MutationObserver en el tablero**: las piezas colocadas por el jugador reciben listeners de drag automáticamente al ser agregadas al DOM

### Fixed 🐛

- **Piezas fijas no arrastrables**: las piezas que aparecen de entrada en el tablero como referencia (ej: Rey Blanco en nivel 1) no se podían arrastrar. Si se movían, el sistema las perdía de `placedPieces` y marcaba todo como incorrecto.
  - **Causa**: el MutationObserver agregaba listeners a TODAS las piezas del tablero, sin distinguir si las colocó el jugador o son piezas fijas
  - **Fix**: `canDragBoardPiece(fromSquare)` verifica que `fromSquare` esté en `placedPieces` antes de permitir el drag

### Changed ⚙️

- Estructura de `moveHistory` extendida: `{ toSquare, fromSquare, piece, fromBank }` (antes: `{ square, piece }`)
- `onPiecePlaced` y `canPlacePiece` reciben `fromSquare` como tercer parámetro opcional (retrocompatible)
- `sharedCallbacks` incluye `canDragBoardPiece: (fromSquare) => ...`

### Not changed 🔒

- CSS, layouts, responsive: sin ningún cambio
- Sistema de puntuación, niveles, timer global: sin cambios
- Animaciones existentes (shake, flash, confeti): sin cambios
- Otros juegos del proyecto: no afectados (DragDrop.js es copia local de Memory Matrix)

---

## [2026-01-14] - Niveles 9-15 + Contador de Corrección + Hints Infinitos

### Added ✨

- **Nuevos Niveles 9-15 (Desafío Extremo)**
  | Nivel | Nombre | Piezas | Tiempo | Dificultad |
  |-------|--------|--------|--------|------------|
  | 9 | Campeón | 11 | 7s | expert |
  | 10 | Virtuoso | 12 | 8s | master |
  | 11 | Genio | 13 | 8s | master |
  | 12 | Prodigio | 14 | 9s | master |
  | 13 | Inmortal | 15 | 9s | legendary |
  | 14 | Titán | 16 | 10s | legendary |
  | 15 | Dios del Ajedrez | 18 | 10s | legendary |

  - El juego ahora tiene 15 niveles (antes 8)
  - Nuevas dificultades: `master` y `legendary`
  - Nivel máximo: 18 piezas en 10 segundos

- **Contador de Corrección Visual ("numberPop")**
  - Cuando el jugador falla, aparece un contador naranja grande en el centro del tablero
  - Muestra "REVISA" + cuenta regresiva (3... 2... 1...)
  - Animación "numberPop": el número aparece grande, rebota y se estabiliza
  - Color naranja neón para diferenciarlo del timer de memorización (cyan)
  - Da tiempo para ver la posición correcta antes de reintentar

- **Hints Infinitos**
  - Ya no hay límite de cantidad de hints
  - Solo limitados por el score disponible
  - Costo exponencial: 100, 200, 400, 800, 1600... puntos
  - Botón muestra el costo: `HINT (-100)`, `HINT (-200)`, etc.
  - Botón gris cuando no hay puntos suficientes (clase `.no-points`)

- **Tiempos Dinámicos según Nivel**
  - Los tiempos de visualización aumentan en niveles avanzados
  - Fórmula: `base + Math.floor((nivel - 1) / 3)` segundos extra
  - **Corrección**: 3s base → Nivel 19: 9 segundos
  - **Hint**: 2s base → Nivel 19: 8 segundos

  | Nivel | Corrección | Hint |
  |-------|------------|------|
  | 1-3   | 3s         | 2s   |
  | 4-6   | 4s         | 3s   |
  | 7-9   | 5s         | 4s   |
  | 10-12 | 6s         | 5s   |
  | 13-15 | 7s         | 6s   |
  | 16-18 | 8s         | 7s   |
  | 19+   | 9s         | 8s   |

### Fixed 🐛

- **Bug del Caballo Negro (bN) - DragDrop.js**
  - **Problema**: Al usar tap-tap, a veces una pieza se identificaba incorrectamente (ej: caballo blanco wN → caballo negro bN)
  - **Causa**: El código usaba fallback al `dataset.piece` del **slot** del banco cuando la pieza no lo tenía
    ```javascript
    // ANTES (bug)
    const piece = pieceElement.dataset.piece || bankSlot.dataset.piece;
    ```
  - **Por qué fallaba**: Los slots tienen `dataset.piece` predefinido (wK, wQ, ..., bN, bP), pero las piezas que vuelan al banco caen en cualquier slot vacío, no necesariamente el que coincide con su tipo
  - **Solución**: Solo usar el `dataset.piece` de la imagen, nunca del slot
    ```javascript
    // AHORA (correcto)
    const piece = pieceElement.dataset.piece;
    ```
  - Corregido en 2 lugares: `handleDragStart()` y `initTapTap()`

- **Contador de Corrección no se mostraba**
  - **Problema**: El contador existía pero no aparecía visualmente
  - **Causa**: La clase `.hidden` tiene `display: none !important`, que ganaba sobre `.visible`
  - **Solución**: Usar `classList.remove('hidden')` además de `classList.add('visible')`

- **Desbordamiento del Banco con 13+ Piezas**
  - **Problema**: El juego se congelaba en nivel 11+ porque el banco solo tenía 12 slots fijos
  - **Causa**: `createPieceBank()` creaba exactamente 12 slots (6 tipos × 2 colores), pero niveles 11+ pueden tener piezas duplicadas (ej: 2 damas blancas)
  - **Solución**:
    - Nueva función `ensureBankHasEnoughSlots(numPieces)` que crea slots extra dinámicamente
    - Se llama antes de `hidePiecesWithAnimation()` con el número de piezas a ocultar
    - Los slots extra tienen clase `.extra-slot` para styling diferenciado
    - `cleanExtraBankSlots()` limpia los slots extra al reiniciar nivel
  - **CSS ajustado**: `max-height: 250px` (mobile), `450px` (desktop) para permitir scroll

- **Formato del Reloj Global (HH:MM:SS)**
  - **Problema**: Después de 1 hora, mostraba "234:56" en vez de "03:54:56"
  - **Solución**: Calcular horas y mostrar formato condicional HH:MM:SS cuando `hours > 0`

### Added ✨ (Debug Tools)

- **Shortcut para Saltar a Nivel Específico**
  - `Ctrl+Shift+L`: Abre prompt para ingresar número de nivel (1-15)
  - `jumpToLevel(11)`: Función disponible en consola para testing rápido
  - Útil para probar niveles altos sin tener que jugar todos los anteriores

- **Console.log Detallados en PieceAnimations.js**
  - `hidePiecesWithAnimation()` ahora muestra:
    - Total de piezas a ocultar
    - Slots totales y vacíos disponibles
    - Progreso pieza por pieza
    - Errores detallados si falta algo

- **Parámetro URL para Saltar a Nivel (Mobile-friendly)**
  - `?level=11` en la URL salta directamente al nivel indicado
  - Funciona en cualquier dispositivo (ideal para testing en móvil)
  - Ejemplo: `index.html?level=15` para probar el nivel final

### Added ✨ (Victory Modal)

- **Modal de Victoria Épica (Nivel 15 completado)**
  - Aparece al completar todos los 15 niveles
  - **Elementos visuales**:
    - Trofeo 🏆 gigante con animación de rebote y brillo dorado
    - Título "¡VICTORIA!" con efecto neón dorado pulsante
    - Subtítulo "Has completado todos los niveles"
    - Stats: Tiempo total y Puntuación final
    - Texto motivacional "¡Eres un verdadero Dios del Ajedrez!"
    - Botón "Ver Ranking" con efecto pulso dorado
  - **Animaciones**:
    - `trophyBounce`: Trofeo aparece girando y rebotando
    - `trophyGlow`: Brillo dorado pulsante continuo
    - `victoryTitlePop`: Título con efecto "pop"
    - `fadeInUp`: Elementos aparecen secuencialmente
    - Confeti triple (300 piezas en 3 oleadas)
  - **Flujo**:
    1. Completar nivel 15 → Modal de victoria
    2. Click "Ver Ranking" → Cierra modal → Abre leaderboard
    3. Juego se reinicia al nivel 1

### Technical Details ⚙️

**Animación numberPop (styles.css):**
```css
@keyframes numberPop {
    0% {
        transform: scale(1.5);
        opacity: 0;
    }
    30% {
        transform: scale(0.9);
        opacity: 1;
    }
    50% {
        transform: scale(1.1);
    }
    100% {
        transform: scale(1);
    }
}

.correction-number {
    font-family: 'Orbitron', sans-serif;
    font-size: clamp(60px, 15vw, 120px);
    color: #ff6600;
    animation: numberPop 1s ease-out;
}
```

**Cálculo de tiempo dinámico (game.js):**
```javascript
// Corrección: base 3s + 1s cada 3 niveles
const correctionTime = 3 + Math.floor((currentLevel - 1) / 3);

// Hint: base 2s + 1s cada 3 niveles
const hintDisplayTime = 2000 + Math.floor((currentLevel - 1) / 3) * 1000;
```

**Costo exponencial de hints:**
```javascript
const nextHintCost = 100 * Math.pow(2, totalHintsUsedSession);
// Hint 1: 100, Hint 2: 200, Hint 3: 400, Hint 4: 800...
```

**Animaciones del Victory Modal (styles.css):**
```css
@keyframes trophyBounce {
    0% { transform: scale(0) rotate(-20deg); opacity: 0; }
    50% { transform: scale(1.3) rotate(10deg); }
    70% { transform: scale(0.9) rotate(-5deg); }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

@keyframes trophyGlow {
    0%, 100% { filter: drop-shadow(0 0 30px gold); }
    50% { filter: drop-shadow(0 0 50px gold); }
}

@keyframes victoryTitlePop {
    0% { transform: scale(0.3); opacity: 0; }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
}
```

**showVictoryModal() (game.js):**
```javascript
function showVictoryModal(stats, onClose) {
    // Formatear tiempo HH:MM:SS
    // Actualizar displays con stats.time y stats.score
    // Mostrar overlay con animación
    // Lanzar confeti triple (100 + 100 + 100)
    // Botón cierra modal y llama onClose → leaderboard
}
```

---

## [2026-01-10] - Botones Laterales Desktop + Sonido Timer Sincronizado

### Added ✨
- **Indicador de Nivel y Barra de Progreso (solo desktop)**
  - Muestra nivel actual (NIVEL 1, NIVEL 2, etc.)
  - Barra de progreso visual con gradiente cyan → verde
  - Contador de intentos exitosos / requeridos (ej: 3/10)
  - Animación de completado cuando se llena la barra
  - Diseño compacto integrado con el panel lateral

- **Contador de Vidas con corazones (solo desktop)**
  - 5 corazones ❤️ = 5 vidas
  - Corazones llenos para vidas restantes, negros 🖤 para perdidas
  - Animación de pulso al perder una vida
  - Se resetea al pasar de nivel o reiniciar

- **Botones HINT y ATRAS laterales (solo desktop)**
  - Nueva ubicación: a la izquierda del tablero, siempre visibles mientras juegas
  - Botones apilados verticalmente con estilo neón
  - HINT: color amarillo neón
  - ATRAS: color magenta neón
  - Efectos hover con glow y escala
  - Los botones del header se ocultan en desktop (ahora están al lado)

- **Sonido de advertencia en timer countdown**
  - El sonido ahora suena con 3, 2 y 1 segundos restantes
  - Antes solo había efecto visual, ahora hay feedback auditivo sincronizado
  - Sonido se reproduce al inicio de cada segundo para mejor sincronización

### Fixed 🐛
- **Menú hamburguesa (mobile) ahora muestra estado correcto del sonido**
  - Problema: Siempre mostraba "Sound: ON" aunque estuviera desactivado
  - Causa: `isSoundEnabled()` no conocía `MemoryMatrixAudio`
  - Solución: Agregar soporte para `MemoryMatrixAudio` en hamburger-menu.js
  - Bonus: Ahora reproduce sonido de confirmación al activar (igual que desktop)

- **Indicador "Click para Empezar" centrado correctamente**
  - Agregado `position: relative` a `.board-wrapper`
  - Agregado `white-space: nowrap` para mantener texto en una línea

- **X del modal de error ahora es clickeable**
  - Se puede cerrar el modal de Game Over haciendo click en la X
  - Agregado efecto hover (escala + brillo)
  - Mantiene también el cierre automático por tiempo

- **Sonidos duplicados en timer corregidos**
  - Problema: Con 2 y 1 segundos se escuchaban dos sonidos
  - Causa: `applyGlitchEffect()` también reproducía sonido al activar efecto visual
  - Solución: Centralizar sonido solo en el timer, quitar de `applyGlitchEffect()`

### Technical Details ⚙️

**Botones laterales (styles.css):**
```css
.side-buttons-container {
    display: none; /* Oculto en mobile */
}

@media (min-width: 768px) {
    .side-buttons-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
        align-self: center;
    }

    /* Ocultar botones del header */
    .header .btn-hint,
    .header .btn-undo-desktop {
        display: none !important;
    }
}
```

**Sonido timer (game.js):**
```javascript
// Al iniciar timer con <= 3 segundos
if (remaining <= 3) {
    circle?.classList.add('warning');
    window.MemoryMatrixAudio.playGlitchSound('warning');
}

// Durante countdown, cuando cambia el segundo
if (remainingSeconds <= 3 && remainingSeconds > 0) {
    window.MemoryMatrixAudio.playGlitchSound('warning');
}
```

### Files Modified 📝
- `index.html` - Agregado contenedor `.side-buttons-container` con botones
- `styles.css` - Estilos para botones laterales, ocultar header buttons en desktop
- `game.js` - Event listeners para botones laterales, sonido en timer, sync de estados

---

## [2025-10-15] - Sistema Tap-Tap Mejorado + UX Mobile Optimizada

### Fixed 🐛
- **✅ SISTEMA TAP-TAP AHORA FUNCIONA EN MOBILE**
  - Problema: Solo funcionaba drag (arrastrar), no tap (tocar pieza → tocar casilla)
  - Causa: Evento `touchstart` con `preventDefault()` bloqueaba evento `click`
  - Sistema tap-tap existía pero era inaccesible por conflicto de eventos

### Improved 🎨
- **Detección Inteligente Tap vs Drag**
  - Umbral de movimiento: 10 píxeles
  - **Tap**: Toque rápido sin movimiento (<10px) → Activa sistema tap-tap
  - **Drag**: Toque con movimiento (>10px) → Activa drag con ghost
  - El sistema decide automáticamente según comportamiento del usuario
  - Mejor UX: usuarios pueden elegir su método preferido

- **Coordenadas del tablero reubicadas** (todas las plataformas)
  - Antes: Coordenadas dentro de casillas (difícil de ver)
  - Ahora: Coordenadas en el borde negro del tablero
  - Color: Blanco fuerte (#ffffff) sin neón para máxima visibilidad
  - Posición: Centradas perfectamente en cada casilla
  - Responsive: 12px (mobile), 13px (tablet), 14px (desktop)

- **Espacios verticales reducidos en móvil**
  - `.title-section`: margin 0.25rem (antes 1rem) → -75% espacio
  - `.game-area`: gap 0.5rem (antes 2rem) → -75% espacio
  - `.game-subtitle`: margin inferior 0.5rem (antes 1.5rem) → -66% espacio
  - **Resultado**: Banco de piezas más visible sin scroll excesivo

### Technical Details ⚙️

**ChessGameLibrary/DragDrop.js v2.0.0:**

```javascript
// Estado extendido para tap vs drag
let dragState = {
    touchStartTime: 0,    // Timestamp inicio touch
    touchStartX: 0,       // Posición X inicial
    touchStartY: 0,       // Posición Y inicial
    isTap: false          // Flag: es un tap?
};

// handleDragStart: Para touch, NO previene default inmediatamente
if (e.type === 'touchstart') {
    dragState.isTap = true;  // Asumir tap hasta que se demuestre lo contrario
    return;  // Esperar a handleDragMove
}

// handleDragMove: Detecta si hay movimiento significativo
const deltaX = Math.abs(clientX - dragState.touchStartX);
const deltaY = Math.abs(clientY - dragState.touchStartY);
if (deltaX > 10 || deltaY > 10) {
    dragState.isTap = false;  // Es drag, no tap
    e.preventDefault();
    startDragFromTouch(clientX, clientY);
}

// handleDragEnd: Si fue tap, deja que evento click se dispare
if (dragState.isTap && !dragState.isDragging) {
    // NO prevenir default → evento click se dispara → tap-tap lo maneja
    return;
}
```

**Coordenadas en borde (styles.css líneas 877-938):**
```css
.coord-file {
    position: absolute;
    bottom: -18px;  /* Fuera de casilla, en padding */
    left: 50%;
    transform: translateX(-50%);
    color: #ffffff;  /* Blanco fuerte */
    font-size: 12px;
}

.coord-rank {
    position: absolute;
    left: -18px;  /* Fuera de casilla, en padding */
    top: 50%;
    transform: translateY(-50%);
    color: #ffffff;
}
```

**Espacios mobile (styles.css líneas 1373-1390):**
```css
@media (max-width: 767px) {
    .title-section { margin: 0.25rem 0; }
    .game-area { gap: 0.5rem; margin-top: 0.5rem; }
    .game-subtitle { margin: -0.25rem 0 0.5rem 0; }
}
```

### Files Modified 📝
- `ChessGameLibrary/DragDrop.js` (+80 líneas, v2.0.0)
  - Detección tap vs drag inteligente
  - Documentación completa del sistema
- `styles.css` (líneas 877-938, 1373-1390)
  - Coordenadas reubicadas en borde
  - Espacios verticales optimizados mobile
- `CHANGELOG.md` (este archivo)

### User Benefits 🎯
✅ Tap-tap funciona en mobile (tocar pieza → tocar casilla)
✅ Drag sigue funcionando para quien prefiera arrastrar
✅ Sistema elige automáticamente según comportamiento
✅ Coordenadas mucho más visibles (borde blanco)
✅ Más espacio para banco de piezas en mobile
✅ UX significativamente mejorada en pantallas pequeñas

---

## [2025-10-14] - Subtítulo Descriptivo (Estándar ChessArcade)

### Agregado ✨
- **Subtítulo descriptivo del juego**
  - Línea: "Memorize chess positions and recreate them perfectly!"
  - Ubicación: Justo debajo del título "Memory Matrix"
  - Estilo consistente con Knight Quest y Square Rush
  - Estandarización de diseño en todos los juegos de ChessArcade

### Technical Details ⚙️
```html
<!-- index.html línea 111 -->
<p class="game-subtitle">Memorize chess positions and recreate them perfectly!</p>
```

```css
/* styles.css líneas 695-704 */
.game-subtitle {
    font-family: 'Orbitron', sans-serif;
    font-size: 1rem;
    color: var(--neon-cyan);
    text-align: center;
    margin: -0.5rem 0 1.5rem 0;
    opacity: 0.9;
    letter-spacing: 0.05em;
}

/* styles.css líneas 1355-1358 - Responsive mobile */
.game-subtitle {
    font-size: 0.85rem;
    margin: -0.25rem 0 1rem 0;
}
```

### Files Modified 📝
- `games/memory-matrix-v2/index.html` (línea 111)
- `games/memory-matrix-v2/styles.css` (líneas 695-704, 1355-1358)

### Design Pattern 🎨
Este cambio establece un patrón de diseño estándar para todos los juegos:
1. Título del juego (grande, neón, con emoji/icono)
2. **Subtítulo descriptivo** (nuevo estándar)
3. Controles y área de juego

Juegos con subtítulo descriptivo:
- ✅ Knight Quest: "Master the knight's L-shaped moves and visit every square!"
- ✅ Square Rush: "Race through chess patterns at lightning speed!"
- ✅ Memory Matrix: "Memorize chess positions and recreate them perfectly!"

---

## [2025-10-10] - Hints 6, Posición Preview + How to Play

### Agregado
- **Sección "How to Play"** 🎯
  - Instrucciones en inglés (estilo Knight Quest)
  - Ubicada debajo del selector de piezas
  - Explica objetivo, gameplay, hints, undo y progresión
  - Estilos neón cyan coherentes con el juego
  - Responsive mobile/desktop

### Cambiado
- **Hints aumentados de 3 a 6 por nivel**
  - Más generoso para jugadores nuevos
  - Facilita aprendizaje sin frustración
  - Actualizado en game.js (HINTS_PER_LEVEL = 6)
  - Actualizado en HTML (contador inicial)

- **Posición preview al cargar y pasar de nivel**
  - Ya no se muestra tablero vacío
  - Al cargar: Muestra posición random del nivel 1
  - Al pasar de nivel: Muestra posición del nuevo nivel
  - Función: showInitialPosition()
  - Mejor experiencia visual desde el inicio

### Archivos modificados
- `game.js` (+30 líneas)
  - HINTS_PER_LEVEL: 3 → 6
  - showInitialPosition(): Nueva función
  - Llamada en DOMContentLoaded y onLevelComplete
- `index.html` (+20 líneas)
  - Sección .how-to-play-section agregada
  - Contadores de hints actualizados (3 → 6)
- `styles.css` (+64 líneas)
  - Estilos completos para .how-to-play-section
  - .instructions con borde cyan neón
  - Responsive mobile

---

## [2025-10-10] - UX Mobile: Timer + Hint + Undo - Layout Completo

### Agregado
- **Botón ATRÁS (Undo) activado** ↩️
  - Permite deshacer colocaciones de piezas una por una
  - Útil cuando hay que colocar múltiples piezas y te equivocas
  - Mobile: Icono compacto a la izquierda del timer
  - Desktop: En header con texto "ATRAS"
  - Solo activo durante fase de colocación con piezas colocadas
  - Funcionalidad: Devuelve piezas al banco con animación
  - Sincronización automática desktop/mobile

### Cambiado
- **Layout Mobile Optimizado** (solo mobile, desktop sin cambios)
  - Timer global visible desde inicio mostrando "00:00"
  - Reordenamiento con flexbox order:
    - Mobile: Timer global arriba → Banco piezas medio → Titulo "Piezas Disponibles" abajo
    - Desktop (768px+): Orden normal (titulo arriba, banco medio, timer abajo)
  - Mejor uso del espacio vertical en pantallas pequeñas
  - Timer más visible al iniciar juego

- **Layout de controles mobile** 🎯
  - Mobile: `[↩️ Undo] [⏱️ Timer] [? Hint]` - tres controles centrados
  - Desktop: Timer solo (Undo y Hint en header)
  - Undo y Hint compactos: solo iconos
  - Header mobile centrado (HOME, PAUSA, SONIDO) - simétrico
  - Timer perfectamente centrado entre controles

- **Título "Piezas Disponibles"**
  - Desktop: Centrado (text-align: center)
  - Mobile: Alineado izquierda (sin cambios)

- **Sidebar height ajustado**
  - Removido min-height/max-height que causaba barra lateral muy larga
  - Altura se ajusta automáticamente al contenido
  - Layout más compacto y natural

### Archivos modificados
- `index.html` (+18 líneas)
  - Removida clase `.hidden` del timer global
  - Contenedor `.timer-hint-container` con undo + timer + hint
  - Botón `#btnUndoMobile` (izquierda del timer)
  - Botón `#btnHintMobile` (derecha del timer)
  - Botón `#btnUndo` descomentado en header (desktop)
- `styles.css` (+25 líneas)
  - `.timer-hint-container`: justify-content space-between
  - `.btn-undo-mobile`: Estilos compactos (solo icono)
  - `.btn-hint-mobile`: Estilos compactos (icono + número)
  - `.header`: justify-content center en mobile, space-between en desktop
  - Media queries para ocultar/mostrar versiones según viewport
  - `.bank-title`: text-align center solo en desktop
- `game.js` (+20 líneas)
  - Event listeners para `btnUndoMobile` y `btnHintMobile`
  - `updateUndoClearButtons()`: Sincroniza ambos botones undo
  - `updateHintButton()`: Sincroniza ambos botones hint

### Estadísticas
- 5 commits realizados
- UX mobile significativamente mejorado
- Botón Undo activado y funcional (desktop + mobile)
- Timer + controles siempre visibles sin scroll
- Header mobile centrado y simétrico
- Deshacer pieza por pieza hasta posición original

---

## [2025-10-10] - Sistema Deshacer/Limpiar (codigo) + Documentacion

### Agregado
- **Sistema de Deshacer/Limpiar** (codigo implementado pero NO usado en Memory Matrix)
  - Historial de movimientos (moveHistory stack)
  - Boton DESHACER: Quita ultima pieza colocada
  - Boton LIMPIAR: Remueve todas las piezas del tablero
  - Animacion de vuelta al banco (400ms ease-in)
  - Botones desactivados cuando no hay piezas
  - Mensajes de feedback al deshacer/limpiar
  - Solo disponibles durante fase de colocacion
  - **IMPORTANTE:** Botones comentados en HTML (no visibles)
    - Razon: Rompen la mecanica core de Memory Matrix (memorizar)
    - El codigo permanece para reutilizacion en otros juegos (puzzles, tacticas)
    - En Memory Matrix: Si te equivocas, debes reintentar (esa es la dificultad)

- **ChessGameLibrary/API_REFERENCE.md** (nuevo archivo +520 lineas)
  - Documentacion completa de todas las funciones de la libreria
  - 4 modulos documentados: Utils, PieceAnimations, DragDrop, LevelTransition
  - 20+ funciones con ejemplos de uso
  - Tabla de codigos de piezas con Unicode
  - Requisitos tecnicos HTML/CSS
  - 3 ejemplos de uso completo
  - Seccion de debugging

- **SUGERENCIAS_MEJORAS.md** (nuevo archivo +650 lineas)
  - 15 sugerencias organizadas por prioridad
  - Estimaciones de tiempo para cada mejora
  - Plan de implementacion por fases
  - Codigo de ejemplo para cada sugerencia

### Cambiado
- **Timer circular (3s)**: Revertido a posición original centrado sobre banco de piezas (tanto mobile como desktop)
- **Timer global**: Movido debajo de la barra lateral (dentro de `.piece-bank-container`)
  - Mobile: margin-top 15px
  - Desktop: margin-top 20px, padding y font más grandes

### Archivos modificados
- `game.js` - Sistema deshacer/limpiar (+140 lineas netas)
  - moveHistory stack
  - Funciones: undo(), clearBoard(), updateUndoClearButtons(), animatePieceBackToBank()
  - Integracion con drag & drop
  - Limpieza de historial en resets
- `index.html` - 2 botones nuevos en header (+16 lineas)
  - Boton DESHACER (icono flecha circular)
  - Boton LIMPIAR (icono basura)
- `styles.css` - Estilos para nuevos botones (+30 lineas)
  - .btn-undo (naranja #ff8000)
  - .btn-clear (rojo #ff0055)
  - Estados hover y disabled

### Archivos nuevos
- `ChessGameLibrary/API_REFERENCE.md` - Diccionario completo de funciones (+520 lineas)
- `SUGERENCIAS_MEJORAS.md` - 15 sugerencias organizadas por prioridad (+650 lineas)

### Estadisticas
- Total: +1356 lineas agregadas
- Tiempo estimado implementacion: 2-3h
- Mejora #1 completada de SUGERENCIAS_MEJORAS.md

---

## [2025-10-09] - Rediseño de Hints + Level Transition + UX Improvements

### Agregado
- **ChessGameLibrary.LevelTransition** (nuevo archivo +293 líneas)
  - Librería reutilizable para transiciones entre niveles
  - 6 animaciones CSS: fadeIn, levelZoomIn, iconPulse, neonFlicker, gradientShift, progressFill
  - API pública: `show()`, `hide()`, `injectStyles()`
  - Auto-crea HTML y CSS si no existe
  - Configurable: icon, duration, callbacks

- **SESION_9_OCT.md** - Documentación completa de la sesión (+317 líneas)

### Cambiado
- **Sistema de Hints rediseñado** (`game.js:895-985`)
  - Antes: 10 hints totales, mostraba 1 pieza aleatoria
  - Ahora: 3 hints por nivel (se resetean), muestra TODAS las piezas faltantes simultáneamente
  - Desintegración coordinada de todas las piezas después de 1.5s
  - Balance mejorado: útil pero limitado

- **Tiempos de memorización reducidos 32%** (todos los niveles en `levels.js`)
  - Nivel 1-2: 5s → 3s (-40%)
  - Nivel 3: 6s → 4s (-33%)
  - Nivel 4: 7s → 5s (-29%)
  - Nivel 5: 7.5s → 5s (-33%)
  - Nivel 6: 8s → 6s (-25%)
  - Nivel 7: 9s → 6s (-33%)
  - Nivel 8: 10s → 7s (-30%)

- **Botón "Comenzar Nivel X"** (`game.js:805`)
  - Antes: "Siguiente Nivel"
  - Ahora: "▶ Comenzar Nivel 2", "▶ Comenzar Nivel 3", etc.

- **Timer circular reposicionado** (`styles.css:1273-1302`)
  - Mobile: Centrado sobre banco (absolute)
  - Desktop: Debajo del banco (static + margin-top 20px)
  - *Nota: Revertido el 10 de octubre*

### Archivos modificados
- `game.js` - showHint() rediseñado, botón texto (+124 líneas netas)
- `levels.js` - Tiempos reducidos (8 líneas modificadas)
- `styles.css` - Timer responsive + transición overlay (+159 líneas)
- `index.html` - Import de LevelTransition.js (+16 líneas)

### Estadísticas
- Total: 871 líneas agregadas, 37 eliminadas
- Commit: `4b3a7c6`

---

## [2025-10-08] - Sistema de Audio + Mejora de Visibilidad de Hints

### Agregado
- **audio.js** (nuevo archivo +450 líneas)
  - Sistema completo de audio sintético con Web Audio API
  - 5 sonidos: glitch (warning/critical), error, éxito, confeti, vuelo
  - Sin archivos externos, generados en tiempo real
  - Código educativo con explicaciones de síntesis

### Cambiado
- **Coordenadas en casillas más visibles** (`styles.css`)
  - Fondo oscuro semitransparente (rgba 0,0,0,0.75)
  - Borde neón cyan con triple box-shadow
  - Backdrop-filter blur (efecto vidrio esmerilado)
  - Tamaño mayor: 24-42px (antes 20-32px)
  - Perfecta visibilidad en casillas blancas Y oscuras

### Integrado
- Sonidos en 7 funciones de `game.js`:
  - `applyGlitchEffect()` → playGlitchSound()
  - `shakeBoardOnError()` → playErrorSound()
  - `onAttemptSuccess()` → playSuccessSound()
  - `launchConfetti()` → playConfettiSound()
  - `hidePiecesPhase()` → playFlySound()
  - `toggleSound()` → feedback al activar
  - `loadAudioPreference()` → persistencia localStorage

### Archivos modificados
- `index.html` - Import de audio.js
- `game.js` - Integración de sonidos (+30 líneas)
- `styles.css` - Mejora de .square-hint (+20 líneas)

### Feedback del usuario
✅ "Cada vez me gusta mas, lo jugue bastante, empieza facil y se hace dificil"

---

## [2025-10-07] - Efectos Glitch Matrix + Feedback Visual Completo

### Agregado
- **Efecto Glitch Matrix** - Advertencia visual progresiva
  - Glitch sutil (40%-80%): parpadeos, distorsión, hue-rotate
  - Glitch crítico (80%-100%): efecto intenso tipo TV descompuesto
  - En reintento: 1s de glitch crítico
  - Funciones: `applyGlitchEffect()`, `removeGlitchEffect()`

- **Feedback de Error Sutil** (sin overlay agresivo)
  - Shake del tablero (500ms, ±8px horizontal)
  - Parpadeo rojo en piezas incorrectas (1.8s, 3x)
  - Barra de estado rosa neón que se infla/desinfla (1.5s)
  - NO bloquea vista ni rompe concentración
  - Funciones: `shakeBoardOnError()`, `flashIncorrectPieces()`

- **Celebración de Victoria con Confeti**
  - Barra de estado verde neón que se infla/desinfla
  - 50 confetis neón cayendo (cyan, pink, orange, gold, green)
  - Rotación 720° + fade out mientras cae
  - Posición, velocidad y delay aleatorios
  - Auto-limpieza del DOM
  - Función: `launchConfetti(count)`

### Cambiado
- **updateStatus()** - Parámetro tipo: 'normal'|'error'|'success'
  - Antes: `updateStatus(message, isError = false)`
  - Ahora: `updateStatus(message, type = 'normal')`
  - Aplica clases CSS automáticamente (rosa/verde)
  - Timeout de 1.5s para volver a dorado

### Arreglado
- **Limpieza de piezas entre intentos**
  - `clearBoard()` agregado en `startGame()`
  - No más acumulación de piezas

### Estadísticas
- +143 líneas CSS (6 animaciones nuevas)
- +155 líneas JS (5 funciones nuevas)
- +4 líneas HTML (contenedor confeti)
- Total: ~3,265 líneas de código

---

## [2025-10-06] - Coordenadas Neón + Sistema de Referencia Visual

### Agregado
- **Sistema de Hints Visuales** (coordenadas en casillas)
  - Al volar piezas al banco, aparecen coordenadas centradas (ej: "a5", "b4")
  - Texto neón cyan brillante con triple glow
  - Animación entrada: escala 0.5 → 1.0 (0.3s)
  - Visible 800ms después del vuelo
  - Fade-out elegante: opacidad 1 → 0 (0.8s)
  - Auto-limpieza del DOM
  - Funciones: `showSquareHints()`, `hideSquareHints()`, `clearAllSquareHints()`

- **Sistema de Referencia Visual** (wK visible)
  - Nivel 1: wK visible en intentos 1-8, ambos reyes ocultos en 9-10
  - Niveles 2-8: wK visible en intentos 1-7, todas ocultas en 8-10
  - Progresión gradual dentro de cada nivel
  - Configuración en `levels.js`: hidePiecesConfig para todos los niveles

### Estadísticas
- +62 líneas CSS (estilos + animaciones)
- +70 líneas JS (3 funciones nuevas + integración)
- Total: ~422 líneas nuevas

---

## [2025-10-05] - UX Mobile + Validaciones Críticas

### Cambiado
- **Botón "Comenzar" movido a header** (sin scroll en mobile)
- **Selector de piezas reubicado en footer** (mejor accesibilidad)
- **Timer posicionado sobre barra lateral** (no mueve layout)
- **Tiempos de memorización reducidos 50%** (niveles 1-8)

### Agregado
- **Validación de distancia entre reyes** (Chebyshev)
  - Los reyes deben estar separados al menos 2 casillas
  - Evita posiciones ilegales de ajedrez
  - Función: `validateKingDistance()` en levels.js

- **Overlay de error automático** (2s reintento)
  - Mensaje grande semitransparente
  - Desaparece automáticamente
  - No bloquea el juego

- **Contador de errores + Game Over** (10 errores)
  - Barra de estado muestra errores actuales
  - Al llegar a 10: overlay de Game Over
  - Reinicio completo del juego

- **Timer visual circular** con animación neón
  - SVG circular que se vacía
  - Animación suave con stroke-dashoffset
  - Glow cyan neón

### Arreglado
- **Fix duplicación de piezas al reintentar**
  - `clearBoard()` antes de mostrar piezas
  - No más acumulación visual

### Estadísticas
- 7 fixes documentados en PROGRESO_SESION.md
- Archivos: index.html, styles.css, game.js, levels.js

---

## [2025-10-01 a 2025-10-04] - Memory Matrix v2 - Sistema Completo

### Agregado
- **PASO 1**: Fondo y estructura básica
  - Degradado negro → morado
  - Grid animado con líneas cyan
  - Fuente Orbitron (Google Fonts)
  - Botones neón con glow

- **PASO 2**: Tablero de ajedrez 8x8
  - Generación dinámica con JavaScript
  - Coordenadas a-h y 1-8
  - Casillas oscuras/claras alternadas
  - Responsive con clamp()

- **PASO 3**: Drag & drop de piezas
  - Arrastre táctil + mouse
  - Validación de colocación
  - Animaciones suaves
  - ChessGameLibrary/DragDrop.js

- **PASO 4**: Banco de piezas
  - CDN de Lichess para SVG
  - Selector de estilo (Lichess, Chess.com, Cardinal)
  - Piezas draggables
  - ChessGameLibrary/PieceAnimations.js

- **PASO 5**: Sistema de niveles
  - 8 niveles progresivos
  - Configuración en levels.js
  - Memorización → Vuelo → Colocación
  - Intentos requeridos por nivel

- **PASO 6**: Animaciones de vuelo
  - Piezas vuelan al banco con parábola
  - Rotación durante vuelo
  - Sincronización con easing

- **PASO 7**: Validación de posición
  - Compara piezas colocadas vs esperadas
  - Feedback visual inmediato
  - Conteo de intentos correctos

- **PASO 8**: Sistema de hints
  - 10 hints totales (modificado luego a 3 por nivel)
  - Muestra una pieza con glow dorado
  - Desintegración en partículas

- **PASO 9**: Timer global
  - Cronómetro de sesión
  - Formato MM:SS
  - Persiste entre niveles

- **PASO 10**: Pantalla final de victoria
  - Overlay de celebración
  - Estadísticas de tiempo
  - Reinicio de juego

### Archivos creados
- `index.html` - Estructura HTML completa
- `styles.css` - Estilos ChessArcade neón
- `game.js` - Lógica del juego
- `levels.js` - Configuración de niveles
- `ChessGameLibrary/Utils.js` - Utilidades reutilizables
- `ChessGameLibrary/PieceAnimations.js` - Animaciones
- `ChessGameLibrary/DragDrop.js` - Sistema drag & drop
- `PLAN_DESARROLLO.md` - Plan de 10 pasos
- `REQUERIMIENTOS_FUNCIONALES.md` - 15 RF detallados
- `ERRORES_CONOCIDOS_Y_SOLUCIONES.md` - 8 errores documentados
- `PROGRESO_SESION.md` - Registro detallado de progreso

### Estadísticas iniciales
- ~2,500 líneas de código
- 13 archivos creados
- Mobile First (350px → desktop)
- Sin librerías pesadas (Vanilla JS)

---

## Formato de entrada

Cada día debe seguir este formato:

```markdown
## [YYYY-MM-DD] - Título descriptivo

### Agregado
- Nuevas funcionalidades

### Cambiado
- Modificaciones a funcionalidades existentes

### Arreglado
- Bugs corregidos

### Eliminado
- Funcionalidades removidas

### Archivos modificados
- Lista de archivos

### Estadísticas
- Líneas agregadas/eliminadas

### Feedback del usuario
- Citas del usuario sobre el progreso
```

---

**Última actualización**: 10 Octubre 2025
