# CriptoSopa — Integración con Leaderboard Global

> Referencia: `docs/LEADERBOARD_ANIMATION_GUIDE.md` (patrón genérico)
> Este documento describe las diferencias y decisiones específicas de CriptoSopa.

---

## Diferencias clave respecto a Master Sequence

| Aspecto | Master Sequence | CriptoSopa |
|---|---|---|
| Trigger de submit | `gameOverOverlay` se muestra | `victoryModal` gets class `active` |
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

## Trigger: MutationObserver sobre `#victoryModal`

A diferencia de Master Sequence (que observa `gameOverOverlay`), aquí observamos `#victoryModal`:

```javascript
const victoryModal = document.getElementById('victoryModal');
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
            const isOpen = victoryModal.classList.contains('active');
            if (isOpen) {
                onVictoryModalOpen();
            } else {
                clearRankingAnimation();
            }
        }
    });
});
observer.observe(victoryModal, { attributes: true });
```

---

## HTML a agregar en `#victoryModal` (footer)

Antes del `#submitScoreBtn` existente, agregar el input de nombre:

```html
<!-- Input de nombre — oculto hasta que el jugador quiera enviar -->
<div id="csSubmitSection" style="display:none;">
    <div class="name-input-container">
        <label class="name-input-label">✨ Tu nombre para el ranking:</label>
        <input type="text" id="csPlayerNameInput" class="name-input-field"
               maxlength="20" placeholder="JUGADOR">
    </div>
</div>
```

Y el `#submitScoreBtn` existente se reutiliza (ya está en el footer).

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

## Checklist de implementación

- [ ] Agregar `criptosopa` a `api/scores/games-config.js`
- [ ] Exponer `window.csGameState` en `criptosopa.js`
- [ ] Eliminar `submitScore()` rota de `criptosopa.js` (línea ~2073)
- [ ] Agregar input de nombre en `#victoryModal` footer (HTML)
- [ ] Agregar script tag en `index.html`
- [ ] Crear `leaderboard-integration.js` con observer + submit + ranking animation
- [ ] Probar: ganar nivel 1 con score > 0 → nombre → enviar → leaderboard resalta fila
- [ ] Probar: ganar con score = 0 (imposible en práctica, pero validar que no rompe)
- [ ] Probar: botón RANKING en header abre leaderboard correctamente
- [ ] Probar: submit doble (flag `isSubmitting`)

---

## Problema conocido: `submitScore()` rota

En `criptosopa.js` línea ~2073 existe una función `submitScore()` que:
- Usa `gameState.level` → no existe (debería ser `currentLevelIndex`)  
- Usa `prompt()` para pedir el nombre → reemplazar por input en modal
- Solo envía `gameState.score` → debería ser el total acumulado
- No dispara la animación de ranking ni resalta la fila en leaderboard

**Solución**: eliminar esa función completamente. El botón `#submitScoreBtn` será reconectado por `leaderboard-integration.js`.

Creado: 2026-05-21
