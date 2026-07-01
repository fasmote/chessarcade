# CriptoSopa — Integración con Leaderboard Global

> Referencia: `docs/LEADERBOARD_ANIMATION_GUIDE.md` (patrón genérico)
> Este documento describe las diferencias y decisiones específicas de CriptoSopa.

---

## Diferencias clave respecto a Master Sequence

| Aspecto | Master Sequence | CriptoSopa |
|---|---|---|
| Trigger de submit | `gameOverOverlay` se muestra | `gameOverModal` gets class `active` (ver nota abajo) |
| Score a guardar | score del nivel actual | `totalScore + score` (acumulado de todos los niveles) |
| Tiempo | `totalTimeMs` desde `window.lastSessionStats` | `(totalTime + timer) * 10` ms (centisegundos → ms) |
| Variables de estado | expuestas en `window.lastSessionStats` | en `gameState` local — hay que exponer a `window` |
| `submitScore()` existente | no existía | **hay una rota en `criptosopa.js` (línea ~2073)** que usa `gameState.level` (no existe) y `prompt()` — debe eliminarse |
| Input de nombre | en el overlay de game over | hay que agregar al footer del `#victoryModal` |

---

## Score a enviar

```javascript
// El modal ya muestra este valor en #modalTotalScore:
const scoreToSubmit = gameState.totalScore + gameState.score;

// Tiempo total en milisegundos (gameState usa centisegundos):
const timeMs = (gameState.totalTime + gameState.timer) * 10;
```

El score a guardar es el **total acumulado** (todos los niveles completados en la sesión), no solo el nivel actual. Es el mismo número que aparece en la sección "ACUMULADO" del modal.

---

## Metadata a enviar

```javascript
metadata: {
    nivel_llegado:    gameState.currentLevelIndex + 1,  // 1-10
    vidas_restantes:  gameState.lives,
    pistas_usadas:    gameState.hintsUsedThisGame,      // solo del nivel actual
    palabras_nivel:   gameState.foundPaths.length        // palabras encontradas en el último nivel
}
```

---

## Variables que hay que exponer a `window`

`leaderboard-integration.js` es un IIFE separado que no puede acceder a `gameState` directamente. Agregar al final de `criptosopa.js`, dentro del `DOMContentLoaded`:

```javascript
// Exponer estado necesario para leaderboard-integration.js
Object.defineProperty(window, 'csGameState', {
    get: () => gameState
});
```

Así `leaderboard-integration.js` accede con `window.csGameState.totalScore`, etc.

---

## Trigger: MutationObserver sobre `#gameOverModal`

> **Nota**: el diseño original planeaba observar `#victoryModal`, pero la implementación final usa `#gameOverModal`. El submit ocurre cuando el jugador pierde todas las vidas, no al completar un nivel. Esto tiene más sentido porque el score enviado es el acumulado de toda la sesión.

```javascript
const gameOverModal = document.getElementById('gameOverModal');
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
            if (gameOverModal.classList.contains('active')) {
                onGameOverModalOpen();
            } else {
                clearRankingAnimation();
            }
        }
    });
});
observer.observe(gameOverModal, { attributes: true });
```

---

## HTML en `#gameOverModal`

`#csSubmitSection` y `#submitScoreBtn` están en el `#gameOverModal`, no en `#victoryModal`:

```html
<!-- En .modal-body del #gameOverModal -->
<div id="csSubmitSection" style="display:none; width:100%; margin-top:0.75rem;">
    <div class="name-input-container">
        <label class="name-input-label" for="csPlayerNameInput">✨ Tu nombre para el ranking:</label>
        <input type="text" id="csPlayerNameInput" class="name-input-field"
               maxlength="15" placeholder="JUGADOR" autocomplete="off">
    </div>
</div>

<!-- En .modal-footer del #gameOverModal, antes del botón reiniciar -->
<button id="submitScoreBtn" class="neon-arcade-btn neon-arcade-btn--secondary">
    📊 ENVIAR PUNTUACIÓN
</button>
```

---

## Archivos a crear/modificar

### Crear
- `games/criptosopa/js/leaderboard-integration.js`

### Modificar
- `games/criptosopa/index.html` — agregar input de nombre + script tag
- `games/criptosopa/js/criptosopa.js` — eliminar `submitScore()` rota, exponer `csGameState`
- `api/scores/games-config.js` — agregar config de criptosopa

### No requiere cambios
- `js/leaderboard-api.js` — se usa tal cual
- `js/leaderboard-ui.js` — se puede usar el render genérico (sin columnas custom por ahora)

---

## Límites para `games-config.js`

```javascript
'criptosopa': {
    max_score:   150000,  // 10 niveles × ~15000 pts máx teóricos
    max_time_ms: 7200000  // 2 horas como tope antitrampas
}
```

---

## Orden de scripts en `index.html`

```html
<script src="../../js/leaderboard-api.js"></script>
<script src="../../js/leaderboard-ui.js"></script>
<script src="js/criptosopa.js"></script>
<script src="js/leaderboard-integration.js"></script>  <!-- NUEVO — siempre después de criptosopa.js -->
```

---

## CSS requerido

`index.html` debe cargar `leaderboard.css` además de los scripts habituales:

```html
<link rel="stylesheet" href="../../css/leaderboard.css">
<script src="../../js/leaderboard-api.js"></script>
<script src="../../js/leaderboard-ui.js"></script>
<script src="js/criptosopa.js"></script>
<script src="js/ranking-animation.js"></script>
<script src="js/leaderboard-integration.js"></script>
```

Sin `leaderboard.css`, `.modal-overlay` no tiene `position:fixed` y el modal queda invisible aunque la función se ejecute correctamente.

---

## Checklist de implementación ✅ COMPLETO

- [x] Agregar `criptosopa` a `api/scores/games-config.js`
- [x] Exponer `window.csGameState` en `criptosopa.js`
- [x] Renombrar `submitScore()` stub a `submitScoreStub()` en `criptosopa.js` (no eliminar — necesario como handler temporal en `setupEventListeners`)
- [x] Agregar input de nombre en `#gameOverModal` (body + footer)
- [x] Agregar `leaderboard.css` y script tags en `index.html`
- [x] Crear `leaderboard-integration.js` con observer + submit + ranking animation
- [x] Eliminar auto-cierre de 2s en `showGameOverModal()` (`criptosopa.js`)
- [x] Probar: perder todas las vidas con score > 0 → nombre → enviar → leaderboard resalta fila ✅
- [x] Probar: botón RANKING en header abre leaderboard correctamente ✅
- [x] Probar: desde otro juego, tab CriptoSopa visible en leaderboard ✅

Completado: 2026-07-01
