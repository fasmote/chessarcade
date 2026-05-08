# Análisis: Permitir Reubicar Piezas Ya Colocadas en el Tablero

**Fecha de análisis:** 2026-05-07  
**Objetivo:** Implementar que el jugador pueda mover una pieza ya colocada en el tablero a otra casilla, sin usar el botón undo. El botón undo debe seguir funcionando, adaptado al nuevo comportamiento.  
**Estado:** Solo análisis — NO se modificó ningún archivo.

---

## RESTRICCIÓN FUNDAMENTAL: Solo lógica, cero cambios de presentación

Todos los cambios van **exclusivamente en la capa de lógica**. Está **prohibido** modificar cualquier cosa que afecte la presentación visual:

- **No tocar CSS** — ni `styles.css` ni clases existentes. Sin nuevas reglas, sin modificar breakpoints, sin cambiar valores de `flex`, `grid`, `padding`, ni `media queries`.
- **No alterar el layout** — la disposición del tablero, el banco de piezas, los botones y el sidebar deben quedar idénticos en desktop, tablet y mobile.
- **No modificar el DOM estructural** — no agregar ni quitar elementos HTML que cambien cómo se ve la página. Sí se permiten elementos temporales que ya existían (como el ghost del drag).
- **No cambiar el sistema de diseño NeonChess** — colores neon, tipografía, animaciones visuales existentes (shake, flash, confeti) se mantienen intactos.
- **Los estados visuales actuales se mantienen** — el highlight verde de casilla al arrastrar, el brillo dorado del tap-tap, el bounce-back de pieza inválida: todo igual.
- **El responsive no se toca** — el comportamiento en mobile, tablet y desktop debe ser idéntico al actual en términos visuales.

**Archivos que NO se tocan bajo ningún concepto:**
- `styles.css`
- `index.html` (estructura)
- Clases CSS del sistema NeonChess

**Archivos que SÍ se modifican (solo lógica):**
- `game.js`
- `ChessGameLibrary/DragDrop.js`
- `ChessGameLibrary/PieceAnimations.js` (solo si se necesita nueva animación tablero→tablero)

---

## 1. Comportamiento Actual (punto de partida)

### Flujo hoy

```
Banco → Tablero     (única dirección posible)
```

- Las piezas del **banco** son arrastrables (drag) o seleccionables (tap).
- Las piezas del **tablero** son imágenes pasivas — no tienen listeners de evento.
- Una vez colocada una pieza, el único modo de moverla es el botón **undo**, que la devuelve al banco.
- El botón undo solo deshace la **última** pieza colocada (LIFO).

### Variables de estado involucradas

```javascript
// game.js línea 24 y 70
let placedPieces = [];   // [{square: "e4", piece: "wK"}, ...]
let moveHistory  = [];   // mismo formato — stack LIFO para undo
```

`placedPieces` y `moveHistory` **siempre tienen el mismo largo** en el sistema actual. Cualquier desincronización entre los dos provoca comportamientos incorrectos en validación y undo.

---

## 2. Comportamiento Deseado

| Acción | Antes | Después |
|---|---|---|
| Arrastrar pieza del banco a casilla vacía | ✅ Funciona | ✅ Sin cambios |
| Arrastrar pieza del banco a casilla ocupada | ❌ Rechaza | ❌ Sigue rechazando (no se mezcla con movimiento) |
| Arrastrar pieza del **tablero** a casilla vacía | ❌ No existe | ✅ Nuevo: mueve la pieza |
| Arrastrar pieza del **tablero** a casilla ocupada | ❌ No existe | ❌ Rechazar (no intercambiar) |
| Botón undo sobre pieza colocada desde banco | ✅ Vuelve al banco | ✅ Sin cambios |
| Botón undo sobre pieza **movida** dentro del tablero | ❌ No existe | ✅ Nuevo: vuelve a su casilla anterior (no al banco) |
| Deshacer cualquier pieza (no solo la última) | ❌ Solo la última | ✅ Nuevo: cualquier pieza del historial |

---

## 3. Arquitectura del Sistema Drag & Drop (estado actual)

El juego implementa dos métodos de interacción, inicializados juntos en `game.js` líneas 2244-2336:

```javascript
const { initDragDrop, initTapTap } = window.ChessGameLibrary.DragDrop;
initDragDrop(sharedCallbacks);
initTapTap(sharedCallbacks);
```

### 3.1 Drag & Drop (desktop y touch con arrastre)

**Archivo:** `ChessGameLibrary/DragDrop.js`

| Fase | Qué ocurre | Líneas aprox. |
|---|---|---|
| `mousedown` / `touchstart` en pieza del banco | Guarda estado en `dragState`, inicia ghost | 147–234 |
| `mousemove` / `touchmove` | Mueve ghost, resalta casilla destino | 247–278 |
| `mouseup` / `touchend` | Detecta casilla con `elementFromPoint()`, valida con `canPlacePiece()`, llama `showPiece()` o hace bounce-back | 337–435 |

**`dragState` object (DragDrop.js línea 42–52):**
```javascript
let dragState = {
    isDragging: false,
    piece: null,          // código de pieza, ej: "wK"
    sourceElement: null,  // <img> en el banco
    bankSlot: null,       // slot contenedor en el banco
    ghostElement: null    // elemento fantasma que sigue al cursor
};
```

Actualmente `dragState` no registra si la pieza viene del banco o del tablero.

### 3.2 Tap-Tap (mobile alternativo, sin arrastre)

**Archivo:** `ChessGameLibrary/DragDrop.js` líneas 614–731

```javascript
let tapState = {
    selectedPiece: null,          // código de pieza
    selectedPieceElement: null,   // <img> en el banco
    selectedSlot: null            // slot contenedor en el banco
};
```

- **Tap 1:** Selecciona pieza del banco → feedback visual dorado (líneas 665–672)
- **Tap 2:** Toca casilla → valida con `canPlacePiece()` → coloca pieza (líneas 678–728)

`tapState` actualmente solo maneja piezas del banco. No reconoce piezas del tablero como seleccionables.

---

## 4. Funciones Clave y Su Rol

### 4.1 `canPlacePiece(piece, square)` — game.js líneas 2297–2326

```javascript
canPlacePiece: (piece, square) => {
    if (gameState !== 'solving') return false;

    const squareElement = document.querySelector(`[data-square="${square}"]`);
    const pieces = squareElement?.querySelectorAll('.piece');

    let hasRealPiece = false;
    if (pieces) {
        pieces.forEach(p => {
            if (!p.classList.contains('hint-piece')) {
                hasRealPiece = true;
            }
        });
    }

    if (hasRealPiece) return false;  // ← rechaza casillas ocupadas
    return true;
}
```

**Problema para el nuevo comportamiento:** La función recibe `(piece, square)` pero no sabe si la pieza viene del banco o del tablero. Sin ese dato, no puede decidir si permitir o rechazar una casilla ocupada.

### 4.2 `showPiece(square, piece)` — game.js líneas 1909–1951

```javascript
function showPiece(square, piece) {
    const squareElement = getSquareElement(square);

    // LIMPIA piezas existentes en esa casilla (reales + hints)
    const existingPieces = squareElement.querySelectorAll('.piece');
    existingPieces.forEach(piece => piece.remove());

    // Crea <img class="piece"> y lo agrega al DOM
    const img = document.createElement('img');
    img.className = 'piece';
    img.src = `${LICHESS_CDN_BASE}${currentPieceStyle}/${piece}.svg`;
    img.alt = piece;
    img.dataset.piece = piece;
    squareElement.appendChild(img);
}
```

**Buena noticia:** Esta función ya limpia la casilla destino antes de poner la pieza. Sirve sin modificar para tablero→tablero.

### 4.3 `undo()` — game.js líneas 1657–1700

```javascript
function undo() {
    if (moveHistory.length === 0) return;
    if (gameState !== 'solving') return;

    const lastMove = moveHistory.pop();  // LIFO — solo el último

    const squareElement = document.querySelector(`[data-square="${lastMove.square}"]`);
    const pieceElement = squareElement?.querySelector('.piece');

    if (pieceElement) {
        animatePieceBackToBank(lastMove.square, lastMove.piece, () => {
            // Remueve de placedPieces
            const index = placedPieces.findIndex(p =>
                p.square === lastMove.square && p.piece === lastMove.piece
            );
            if (index !== -1) placedPieces.splice(index, 1);

            // Actualiza mensaje de estado
            const piecesToPlace = window.MemoryMatrixLevels.getPiecesToHide(...);
            const remaining = piecesToPlace.length - placedPieces.length;
            updateStatus(`↩️ Deshecho - Faltan ${remaining} pieza(s)`);
        });
    }
    updateUndoClearButtons();
}
```

**Problemas para el nuevo comportamiento:**
1. Solo deshace el **último** movimiento (pop del final). Para deshacer cualquier pieza, necesita poder sacar un elemento específico del array, no solo el último.
2. Siempre llama `animatePieceBackToBank()`. Si la pieza fue movida tablero→tablero, debería volver a su casilla anterior, no al banco.

### 4.4 `animatePieceBackToBank(square, piece, callback)` — game.js

Anima físicamente la pieza desde `square` hasta la posición del slot en el banco. La animación usa las coordenadas del DOM del banco como destino hardcoded.

**Para el nuevo comportamiento:** Cuando el undo es de un movimiento tablero→tablero, se necesita `animatePieceToSquare(fromSquare, toSquare)` — una animación de casilla a casilla, no de casilla a banco.

### 4.5 Callback `onPiecePlaced` — game.js líneas 2268–2292

```javascript
onPiecePlaced: (square, piece) => {
    placedPieces.push({ square, piece });
    moveHistory.push({ square, piece });
    updateUndoClearButtons();

    const piecesToPlace = window.MemoryMatrixLevels.getPiecesToHide(...);
    const remaining = piecesToPlace.length - placedPieces.length;

    if (remaining > 0) {
        updateStatus(`✓ ${pieceName} en ${square} - Faltan ${remaining}...`);
    } else {
        updateStatus(`✓ ${pieceName} en ${square} - ¡Validando...!`);
        setTimeout(() => {
            validatePosition();  // ← AUTO-VALIDACIÓN
        }, 500);
    }
}
```

**Punto crítico:** La auto-validación se dispara cuando `remaining === 0`, es decir, cuando `placedPieces.length === piecesToPlace.length`. Al mover una pieza tablero→tablero, el largo de `placedPieces` no cambia, por lo que si ya estaban todas las piezas colocadas, la validación NO se re-dispara automáticamente. Esto es correcto. Pero hay un riesgo si hay un `setTimeout` pendiente de validación en vuelo cuando el usuario mueve una pieza: validaría la posición vieja. Hay que cancelar o ignorar ese timeout.

---

## 5. Las 7 Zonas de Riesgo

### RIESGO 1 — `canPlacePiece()` no conoce el origen

**Archivo:** `game.js` ~línea 2297  
**Problema:** La firma actual es `canPlacePiece(piece, square)`. Para el nuevo comportamiento necesita saber si el origen es el banco o una casilla del tablero, porque la regla cambia:
- Origen banco → rechazar casillas ocupadas (igual que hoy)
- Origen tablero → rechazar casillas ocupadas (no intercambiar piezas), pero sí permitir moverse a sí mismo si es la misma casilla (drop cancelado)

**Solución necesaria:** Agregar parámetro `fromSquare` (null si viene del banco, nombre de casilla si viene del tablero). La firma quedaría `canPlacePiece(piece, toSquare, fromSquare)`.

**Qué puede salir mal si no se hace:** La lógica de rechazo quedaría incorrecta para ambos casos.

---

### RIESGO 2 — Piezas del tablero no son arrastrables

**Archivo:** `ChessGameLibrary/DragDrop.js`  
**Problema:** Los listeners de `mousedown`/`touchstart` solo se registran en piezas del banco. Las piezas del tablero son `<img class="piece">` sin ningún evento. Para hacer tablero→tablero drag, hay que:
1. Registrar listeners en piezas del tablero al colocarlas (en `showPiece()` o en el callback `onPiecePlaced`)
2. Distinguir en el handler si el origen es banco o tablero para pasar `fromSquare` correctamente

**Qué puede salir mal:**
- Si se registran listeners en piezas del tablero sin distinguir del banco, el `dragState` puede contener datos incorrectos (ej: `bankSlot: null` porque no viene del banco).
- Si se llama `onPiecePlaced` para un movimiento tablero→tablero, se haría doble push en `placedPieces[]` (la pieza quedaría dos veces en el array) → validación incorrecta.
- Si se registran listeners en la misma pieza más de una vez (ej: al re-renderizar), los eventos se dispararían múltiples veces.

---

### RIESGO 3 — Estructura de `moveHistory[]` incompatible con "mover"

**Archivo:** `game.js` líneas 70, 2271, 1669  
**Problema:** La estructura actual es `{ square, piece }` — solo guarda destino. Para el undo de un movimiento tablero→tablero, necesita también el origen:

```javascript
// Estructura actual (insuficiente)
{ square: "d5", piece: "wK" }

// Estructura necesaria para el nuevo comportamiento
{ toSquare: "d5", piece: "wK", fromSquare: "e4", fromBank: false }
// o bien, para una colocación normal desde banco:
{ toSquare: "e4", piece: "wK", fromSquare: null, fromBank: true }
```

**Qué puede salir mal:** Si el undo no sabe de dónde vino la pieza, puede animar hacia el banco cuando debería ir a una casilla del tablero, dejando el DOM y `placedPieces[]` desincronizados.

**Compatibilidad con undo de "cualquier pieza":** Si el usuario quiere deshacer no el último sino un movimiento anterior, undo ya no puede hacer solo `pop()`. Tiene que poder sacar un elemento arbitrario del array. Pero si se saca un elemento del medio, el orden histórico pierde sentido para las entradas posteriores. Hay que decidir si el historial es una pila LIFO estricta o permite saltar posiciones.

---

### RIESGO 4 — `placedPieces[]` debe actualizarse correctamente al mover

**Archivo:** `game.js`  
**Problema:** Al mover una pieza de `e4` a `d5`:

```javascript
// Lo que hay que hacer (en ese orden):
placedPieces.splice(
    placedPieces.findIndex(p => p.square === 'e4' && p.piece === 'wK'),
    1
);
placedPieces.push({ square: 'd5', piece: 'wK' });
```

Si el splice ocurre antes de confirmar que el drop fue válido (ej: `canPlacePiece()` aún no corrió), se puede perder la pieza del array aunque el movimiento no se completó.

Si el push ocurre sin el splice, la pieza queda duplicada: en `e4` y en `d5` simultáneamente en el array, aunque en el DOM solo esté en `d5`. Cuando `validatePosition()` compare, el array tiene más entradas que casillas en el tablero → fallo silencioso.

**Regla:** El array debe actualizarse solo DESPUÉS de que el movimiento sea confirmado como válido y el DOM actualizado.

---

### RIESGO 5 — Timeout de auto-validación en vuelo

**Archivo:** `game.js` línea ~2287  
**Problema:** Cuando se coloca la última pieza, se ejecuta:

```javascript
setTimeout(() => {
    validatePosition();
}, 500);
```

Si el jugador mueve esa pieza dentro de los 500ms de gracia, `validatePosition()` evaluará la posición con la pieza ya movida en el DOM pero con `placedPieces[]` quizás aún en el estado anterior (dependiendo del orden de ejecución).

**Escenario problemático:**
1. Usuario coloca pieza 4/4 en `e4` → se dispara `setTimeout(validatePosition, 500)`
2. Inmediatamente arrastra esa pieza a `d5`
3. A los 500ms, `validatePosition()` corre: DOM tiene pieza en `d5` pero `placedPieces` puede tener `e4` si el splice no ocurrió → resultado de validación incorrecto.

**Solución necesaria:** Guardar la referencia del timeout en una variable y cancelarla con `clearTimeout()` cuando se inicia un movimiento desde el tablero.

---

### RIESGO 6 — Sistema tap-tap no reconoce piezas del tablero

**Archivo:** `ChessGameLibrary/DragDrop.js` líneas 614–731  
**Problema:** `tapState` solo tiene campos para piezas del banco (`selectedSlot` apunta al slot del banco). Si el primer tap es en una pieza del tablero:

```javascript
tapState.selectedPiece = piece;
tapState.selectedPieceElement = pieceElement;
tapState.selectedSlot = bankSlot;  // ← null si viene del tablero, no hay "slot"
```

En el segundo tap, la lógica asume que hay que quitar la pieza de un slot del banco (llama a `clearBankSlot()` o similar). Si `selectedSlot` es null, puede romperse o dejar el banco en estado inconsistente.

**Solución necesaria:** Agregar campo `selectedFromSquare` a `tapState` (null si banco, nombre de casilla si tablero), y bifurcar la lógica del segundo tap según el origen.

---

### RIESGO 7 — `animatePieceBackToBank()` está hardcoded para el banco

**Archivo:** `game.js`  
**Problema:** Esta función calcula las coordenadas del destino leyendo la posición DOM del slot del banco. No puede usarse para devolver una pieza a una casilla del tablero.

Si en el undo se llama `animatePieceBackToBank()` para un movimiento tablero→tablero:
- La animación llevaría la pieza al banco (visualmente incorrecto)
- La pieza quedaría en el banco en el DOM
- `placedPieces[]` tendría un entry que apunta a una casilla del tablero que visualmente está vacía
- La próxima validación fallaría por inconsistencia DOM/estado

**Solución necesaria:** Crear función `animatePieceToSquare(fromSquare, toSquare, callback)` que use las coordenadas del tablero como destino, no del banco.

---

## 6. Mapa de Dependencias

```
┌──────────────────────────────────────────────────────────────────┐
│ NUEVA FEATURE: Mover piezas del tablero                         │
└──────────────────────────┬───────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────────┐
          ▼                ▼                    ▼
  DragDrop.js        game.js               game.js
  (listeners)        (lógica)              (estado)
          │                │                    │
  ┌───────┴──────┐  ┌──────┴──────┐   ┌────────┴────────┐
  │ Hacer piezas │  │canPlacePiece│   │ moveHistory[]   │
  │ de tablero   │  │necesita     │   │ estructura nueva │
  │ arrastrables │  │fromSquare   │   │ {toSquare,      │
  │              │  │             │   │  fromSquare,    │
  │tapState:     │  │Timeout de   │   │  piece,         │
  │selectedFrom  │  │validación   │   │  fromBank}      │
  │Square        │  │cancelable   │   │                 │
  └───────┬──────┘  └──────┬──────┘   └────────┬────────┘
          │                │                    │
          └────────────────┼────────────────────┘
                           │
                           ▼
                   ┌───────────────┐
                   │ undo()        │
                   │ bifurcar:     │
                   │ banco vs      │
                   │ tablero       │
                   │               │
                   │animatePiece   │
                   │ToSquare()     │
                   │ (nueva func.) │
                   └───────────────┘
```

---

## 7. Lo Que NO Hay Que Cambiar

Estas funciones sirven tal cual para el nuevo comportamiento:

| Función | Por qué no necesita cambios |
|---|---|
| `showPiece(square, piece)` | Ya limpia la casilla destino y pone la pieza nueva |
| `validatePosition()` | Compara `placedPieces[]` vs solución; si el array está bien, funciona |
| `clearBankPieces()` | Se usa al resetear, no al mover |
| `updateUndoClearButtons()` | Lee longitud de arrays, no les importa el contenido |
| Victory / Game Over logic | No se toca el flujo de niveles |
| `updateStatus()` | Solo muestra texto |

---

## 8. Errores Pasados Relevantes (de docs del proyecto)

### Bug: Timer no se detenía al completar niveles
**Lección:** `stopGlobalTimer()` debe llamarse ANTES de mostrar modales. Al implementar animaciones de movimiento, verificar que no dejen timers activos si el juego termina durante la animación.

### Bug: Scroll bloqueado en mobile
**Lección:** No agregar propiedades CSS preventivas sin entender su efecto. Al agregar estilos para el nuevo cursor/drag de piezas del tablero, agregar solo lo mínimo necesario y testear en dispositivo real.

### Bug: Tiempo incorrecto al hacer submit al leaderboard
**Lección:** Las métricas deben capturarse en el momento del evento, no recalcularse después. Al añadir movimientos de piezas, no recalcular `placedPieces.length` de forma diferida — leerlo al instante del evento.

---

## 9. Orden Recomendado de Implementación

Para minimizar bugs, implementar en este orden (cada paso debe funcionar antes de hacer el siguiente):

1. **Extender `moveHistory[]`** con la nueva estructura `{toSquare, fromSquare, piece, fromBank}` — cambio de estado puro, sin tocar UI.

2. **Extender `canPlacePiece()`** para aceptar `fromSquare` como tercer parámetro opcional. Si `fromSquare` es null, comportamiento igual al actual.

3. **Crear `animatePieceToSquare(fromSquare, toSquare, callback)`** — nueva función de animación tablero→tablero.

4. **Adaptar `undo()`** para bifurcar según `fromBank` del entry del historial:
   - `fromBank: true` → comportamiento actual (anima al banco)
   - `fromBank: false` → nueva animación de vuelta a `fromSquare`
   - Si el usuario puede deshacer cualquier pieza (no solo la última), cambiar de `pop()` a `splice(index, 1)`.

5. **Hacer piezas del tablero arrastrables** — modificar `showPiece()` o `onPiecePlaced` para registrar listeners en la nueva pieza creada.

6. **Extender tap-tap** con `selectedFromSquare` en `tapState`.

7. **Agregar `clearTimeout`** para cancelar auto-validación cuando se inicia movimiento desde tablero.

8. **Test integración** — colocar todas las piezas, mover una, verificar que validación espera; hacer undo de movimiento tablero→tablero; hacer undo de colocación desde banco; verificar que `placedPieces[]` y DOM siempre están sincronizados.

---

## 10. Checklist de Verificación Post-Implementación

- [ ] `placedPieces.length` === número de piezas visibles en el tablero (siempre, en todo momento)
- [ ] `moveHistory` tiene el mismo largo que `placedPieces` (si se mantiene esa invariante)
- [ ] Undo de colocación desde banco → pieza vuelve al banco
- [ ] Undo de movimiento tablero→tablero → pieza vuelve a casilla anterior
- [ ] No se puede colocar pieza sobre casilla ocupada (ni desde banco ni desde tablero)
- [ ] Auto-validación no corre si hay un movimiento pendiente en los 500ms de gracia
- [ ] En mobile: tap en pieza del tablero la selecciona (feedback visual), segundo tap en casilla vacía la mueve
- [ ] Timer no se detiene ni altera durante movimientos
- [ ] `validatePosition()` retorna el resultado correcto después de cualquier secuencia de moves + undos
- [ ] No hay event listeners duplicados en piezas del tablero (ej: al re-colocar la misma pieza)

---

*Análisis realizado por Claude Code. No se modificó ningún archivo del proyecto.*
