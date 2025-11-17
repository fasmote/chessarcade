# Square Rush - Leaderboard Integration Documentation

**Fecha de implementación:** 16 Nov 2025
**Estado:** ✅ Completado

---

## 📋 Resumen

Square Rush ahora cuenta con integración completa del sistema de leaderboard, incluyendo:

- ✅ Modales personalizados para Game Over y Victory
- ✅ Columnas custom en el leaderboard: RANK | PLAYER | SCORE | LEVEL | COMBO | TARGETS
- ✅ Estadísticas de sesión acumulativas (max combo, total targets)
- ✅ Auto-close modal + auto-open leaderboard después de submit
- ✅ Overlay de "GAME OVER" antes del modal (patrón UX estandarizado)

---

## 🎮 Características del Juego

### Mecánica del Juego

Square Rush es un juego de reconocimiento rápido de coordenadas de ajedrez con las siguientes características:

- **10 niveles** con dificultad creciente
- **Objetivos por nivel:** 5 a 15 cuadrados a encontrar
- **Tiempo límite:** Disminuye de 12s a 3.5s por cuadrado
- **Sistema de combos:** Hasta x3 (resetea a x1 en error)
- **Puntuación:** 100 puntos × combo por cada acierto
- **Game Over:** Un solo error termina el juego inmediatamente

### Niveles

| Nivel | Nombre | Targets | Tiempo | Tema |
|-------|--------|---------|--------|------|
| 1-3 | BABY STEPS | 5 | 12s → 8s | retro |
| 4-5 | LITTLE MASTER | 8 | 7s → 6s | neon |
| 6-7 | SPEED DEMON | 10 | 5.5s → 5s | neon |
| 8-9 | GRANDMASTER | 12 | 4.5s → 4s | neon |
| 10 | LEGENDARY | 15 | 3.5s | neon |

---

## 📊 Estadísticas Rastreadas

### Session Counters (Acumulativos)

Estas estadísticas se acumulan durante toda la partida y se resetean solo al hacer "Play Again":

```javascript
// Definidas en square-rush.js:21-26
let maxComboAchieved = 1;      // Combo máximo alcanzado en la sesión
let totalTargetsFound = 0;     // Total de objetivos encontrados en todos los niveles

// Expuestas al scope global para leaderboard
window.maxComboAchieved = maxComboAchieved;
window.totalTargetsFound = totalTargetsFound;
```

### Actualización de Estadísticas

**Max Combo** se actualiza en `handleSquareClick()` cuando el combo aumenta:
```javascript
// square-rush.js:170-173, 214-217
if (gameState.combo < 3) {
    gameState.combo++;
    if (gameState.combo > maxComboAchieved) {
        maxComboAchieved = gameState.combo;
        window.maxComboAchieved = maxComboAchieved;
    }
}
```

**Total Targets Found** se incrementa en cada acierto:
```javascript
// square-rush.js:162-163, 205-206
gameState.targetFound++;
totalTargetsFound++;
window.totalTargetsFound = totalTargetsFound;
```

### Reset de Estadísticas

Se resetean en `playAgain()`:
```javascript
// square-rush.js:466-470
maxComboAchieved = 1;
totalTargetsFound = 0;
window.maxComboAchieved = maxComboAchieved;
window.totalTargetsFound = totalTargetsFound;
console.log('🔄 Session statistics reset');
```

---

## 🎨 Modales Personalizados

### Modal de Game Over

Se muestra cuando el jugador comete un error y pierde:

**Flujo:**
1. Mostrar overlay "GAME OVER!" durante 2 segundos
2. Ocultar overlay
3. Mostrar modal personalizado con estadísticas

**Estadísticas mostradas:**
- SCORE (puntuación final)
- LEVEL REACHED (nivel alcanzado)
- MAX COMBO (combo máximo: x1, x2, o x3)
- TARGETS FOUND (total de objetivos encontrados)

**Acciones disponibles:**
- 🏆 SUBMIT SCORE → Enviar puntuación al leaderboard
- 👁️ VIEW LEADERBOARD → Ver tabla de posiciones
- 🔄 PLAY AGAIN → Reiniciar juego desde nivel 1

**Implementación:** `leaderboard-integration.js:18-113`

### Modal de Victory (Juego Completado)

Se muestra cuando el jugador completa los 10 niveles:

**Flujo:**
1. Mostrar overlay "🏆 GAME COMPLETED! 🏆" durante 2 segundos
2. Ocultar overlay
3. Mostrar modal de victoria con estadísticas

**Diferencias con Game Over:**
- Mensaje de felicitación: "Congratulations! You completed all 10 levels!"
- Título: "🏆 GAME COMPLETED! 🏆"
- LEVELS COMPLETED muestra 10 (en vez de LEVEL REACHED)
- TOTAL TARGETS en vez de TARGETS FOUND

**Implementación:** `leaderboard-integration.js:121-243`

---

## 📤 Sistema de Submit

### Metadata Enviada al Backend

```javascript
// leaderboard-integration.js:142-145, 318-321
{
    level_reached: levelReached,    // Nivel alcanzado (1-10)
    max_combo: maxCombo,            // Combo máximo (1-3)
    targets_found: targetsFound     // Total de objetivos encontrados
}
```

### Flujo de Submit (Patrón Estándar)

Este es el **patrón estándar** que se aplicará a todos los juegos:

1. Usuario ingresa nombre y presiona "🏆 SUBMIT SCORE"
2. Botón cambia a "SUBMITTING..." (deshabilitado)
3. Score se envía al backend con metadata
4. Botón cambia a "✅ SUBMITTED!" durante 2 segundos
5. **Modal se cierra automáticamente**
6. **Leaderboard se abre automáticamente** después de 300ms
7. Usuario puede ver su posición inmediatamente

**Implementación:**
```javascript
// leaderboard-integration.js:157-174, 333-350
setTimeout(() => {
    console.log('🔒 Closing modal after successful submission');

    // Cerrar modal Game Over/Victory
    const modal = document.getElementById('leaderboardGameOverModal');
    if (modal) {
        modal.remove();
    }

    // Abrir leaderboard después de cerrar modal
    setTimeout(() => {
        console.log('📊 Opening leaderboard after score submission');
        if (window.showLeaderboardModal) {
            window.showLeaderboardModal('square-rush');
        }
    }, 300); // Small delay to ensure modal is fully closed

}, 2000); // 2 segundos para que el usuario vea el mensaje de éxito
```

**📌 NOTA IMPORTANTE:** Este patrón de auto-close + auto-open será el estándar para TODOS los juegos del proyecto.

---

## 📊 Leaderboard Custom

### Columnas Personalizadas

El leaderboard de Square Rush muestra las siguientes columnas:

| Columna | Descripción | Fuente |
|---------|-------------|--------|
| RANK | Posición (1, 2, 3...) con emojis 🥇🥈🥉 | Calculado por orden |
| PLAYER | Nombre del jugador | `player_name` |
| SCORE | Puntuación final | `score` |
| LEVEL | Nivel alcanzado (1-10) | `metadata.level_reached` |
| COMBO | Combo máximo (x1, x2, x3) | `metadata.max_combo` |
| TARGETS | Total de objetivos encontrados | `metadata.targets_found` |

### Función de Renderizado

```javascript
// leaderboard-integration.js:386-446
function renderSquareRushLeaderboardTable(scores) {
    // Renderiza tabla HTML con todas las columnas custom
    // Aplica clases especiales para top 3: rank-1, rank-2, rank-3
    // Muestra emojis: 🥇 🥈 🥉
    // Retorna elemento DOM (no HTML string)
}
```

### Integración con leaderboard-ui.js

El sistema de leaderboard detecta automáticamente que estamos en Square Rush y usa el renderer custom:

```javascript
// leaderboard-ui.js:954-956
} else if (state.currentGame === 'square-rush') {
    console.log('[DEBUG] Using Square Rush custom leaderboard');
    table = renderSquareRushLeaderboardTable(data.scores);
}
```

---

## 🔧 Archivos Modificados/Creados

### Archivos Nuevos

1. **`games/square-rush/leaderboard-integration.js`** (459 líneas)
   - Modales personalizados (Game Over y Victory)
   - Handlers de submit con auto-close/auto-open
   - Función de renderizado custom del leaderboard

2. **`games/square-rush/docs/LEADERBOARD_INTEGRATION.md`** (este archivo)
   - Documentación completa de la integración

### Archivos Modificados

1. **`games/square-rush/js/square-rush.js`**
   - Líneas 17-26: Session statistics (maxComboAchieved, totalTargetsFound)
   - Líneas 162-163, 205-206: Incremento de totalTargetsFound
   - Líneas 170-173, 214-217: Actualización de maxComboAchieved
   - Líneas 339-364: gameOver() reescrito con overlay + modal
   - Líneas 435-461: showGameCompleted() reescrito con overlay + modal
   - Líneas 466-470: Reset de session statistics en playAgain()
   - Líneas 520-529: Limpieza de leaderboard integration (solo botón header)

2. **`games/square-rush/index.html`**
   - Línea 167: Agregado `<script src="leaderboard-integration.js"></script>`

3. **`js/leaderboard-ui.js`**
   - Líneas 954-956: Agregado soporte para Square Rush custom renderer

---

## ✅ Testing Checklist

- [ ] Jugar hasta game over → Ver overlay → Ver modal → Submit score
- [ ] Verificar que modal se cierra automáticamente después de submit
- [ ] Verificar que leaderboard se abre automáticamente
- [ ] Verificar que todas las columnas muestran datos correctos
- [ ] Completar todos los 10 niveles → Ver modal de Victory
- [ ] Verificar que maxComboAchieved se actualiza correctamente (llegar a x2 y x3)
- [ ] Verificar que totalTargetsFound acumula correctamente entre niveles
- [ ] Hacer "Play Again" → Verificar que estadísticas se resetean
- [ ] Ver leaderboard desde botón header → Verificar columnas custom
- [ ] Verificar emojis de top 3 (🥇🥈🥉)
- [ ] Verificar que nombre se guarda en localStorage

---

## 🎨 Patrones de Diseño Aplicados

### 1. Overlay + Modal (Patrón UX Estandarizado)

**Patrón:**
1. Mostrar overlay grande con mensaje ("GAME OVER!" o "GAME COMPLETED!")
2. Esperar 2 segundos
3. Ocultar overlay
4. Mostrar modal con estadísticas detalladas y opciones

**Ventajas:**
- Impacto visual inmediato (overlay)
- Información detallada después (modal)
- Transición suave entre estados
- UX más profesional

**Aplicar a:** Knight Quest, Master Sequence, Vision Blitz (cuando se descongele)

### 2. Auto-Close + Auto-Open Leaderboard

**Patrón:**
1. Usuario hace submit
2. Mostrar "✅ SUBMITTED!" durante 2 segundos
3. Cerrar modal automáticamente
4. Abrir leaderboard automáticamente (delay 300ms)

**Ventajas:**
- Usuario ve inmediatamente su posición
- Reduce clicks necesarios
- Flujo más intuitivo
- Mayor engagement con leaderboard

**Aplicar a:** TODOS los juegos (ya implementado en Memory Matrix y Square Rush)

### 3. Session Statistics Pattern

**Patrón:**
- Variables acumulativas que NO se resetean entre niveles
- Solo se resetean en "Play Again"
- Expuestas a window scope para acceso externo
- Actualizadas en tiempo real durante gameplay

**Aplicar a:** Juegos con múltiples niveles/rondas

---

## 📌 Notas Importantes

### Diferencias con Memory Matrix

1. **No tiene sistema de hints** → No se aplica penalización progresiva
2. **Combo limitado a x3** (Memory Matrix no tiene combo)
3. **Game Over instantáneo** en primer error (Memory Matrix tiene 3 errores)
4. **10 niveles fijos** (Memory Matrix tiene niveles definidos por dificultad)

### Metadata vs Backend Configuration

En el backend (`api/leaderboard.js`), Square Rush está configurado como:

```javascript
'square-rush': {
    display_name: 'Square Rush',
    max_score: 50000,
    score_type: 'points',
    has_levels: true
}
```

- `has_levels: true` permite enviar `level_reached` en metadata
- `score_type: 'points'` indica sistema de puntos acumulativos
- `max_score: 50000` es el límite máximo de puntuación aceptada

### localStorage Keys

- `squareRushPlayerName`: Nombre del jugador
- `squareRushSound`: Preferencia de sonido ('enabled' o 'disabled')

---

## 🔮 Futuras Mejoras

### Posibles Adiciones

1. **Estadísticas adicionales:**
   - Average time per target
   - Perfect levels (sin usar hints ni show coordinates)
   - Fastest level completion

2. **Achievements:**
   - "Speed Demon": Completar nivel 10
   - "Combo Master": Alcanzar x3 combo
   - "Perfect Vision": Completar sin usar "Show Coordinates"

3. **Replay System:**
   - Guardar mejor score personal
   - Mostrar mejora respecto a score anterior

4. **Social Features:**
   - Compartir score en redes sociales
   - Challenge friends

---

## 📚 Referencias

- **Patrón UX:** Memory Matrix (overlay + modal)
- **Custom Leaderboard:** Knight Quest (columnas personalizadas)
- **Session Statistics:** Memory Matrix (contadores acumulativos)
- **Auto-close/Auto-open:** Memory Matrix Bug #8 fix

---

## ✨ Créditos

**Implementación:** Claude Code
**Patrón de diseño:** Basado en Memory Matrix y Knight Quest
**Testing:** Pendiente

---

**🎯 Square Rush Leaderboard Integration - Complete! 🎯**
