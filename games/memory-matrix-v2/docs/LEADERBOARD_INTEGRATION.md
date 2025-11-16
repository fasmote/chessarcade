# Memory Matrix - Leaderboard Integration

## 📋 Resumen

Este documento describe la implementación del leaderboard personalizado para Memory Matrix, con columnas específicas para mostrar las estadísticas del juego.

**Estado:** ✅ Implementado
**Fecha:** 16 Noviembre 2025
**Columnas:** RANK | PLAYER 🇦🇷 | SCORE | LEVEL | SUCCESS | ERRORS | HINTS | TIME

---

## 🎮 Contexto: Memory Matrix

Memory Matrix es un juego de memoria visual donde:
- El jugador debe memorizar posiciones de piezas de ajedrez
- Hay 8 niveles progresivos con dificultad creciente
- Se permiten máximo 5 errores antes de Game Over
- Cada nivel otorga 6 hints para ayuda
- Se trackea el tiempo total de la sesión

### Sistema de Puntuación

**Fórmula:**
```javascript
score = (successful_attempts × 1000) - (failed_attempts × 100) - (hints_used × 50)
```

**Ejemplo:**
- Completó 8 niveles
- 80 intentos exitosos
- 3 errores
- 10 hints usados

```javascript
score = (80 × 1000) - (3 × 100) - (10 × 50)
      = 80,000 - 300 - 500
      = 79,200 puntos
```

**Rango de scores:**
- Mínimo: 1 (score negativo se redondea a 1)
- Máximo teórico: ~100,000 (jugador perfecto sin hints)
- Máximo realista: ~80,000 (completar todos los niveles con pocos errores)

---

## 📊 Columnas del Leaderboard

### Tabla Personalizada

**RANK | PLAYER 🇦🇷 | SCORE | LEVEL | SUCCESS | ERRORS | HINTS | TIME**

#### Descripción de Columnas:

1. **RANK** - Posición en el ranking (con emojis para top 3)
   - 🥇 #1
   - 🥈 #2
   - 🥉 #3

2. **PLAYER 🇦🇷** - Nombre del jugador con bandera de país
   - Primeras 3 letras destacadas
   - Bandera inline al lado del nombre

3. **SCORE** - Puntuación calculada
   - Formateado con separadores de miles (ej: "79,200")

4. **LEVEL** - Nivel alcanzado (1-8 o "ALL 🏆")
   - Si `metadata.levels_completed === 8` → muestra "ALL 🏆"
   - Si `metadata.level_reached` → muestra número del nivel
   - `-` si no hay dato

5. **SUCCESS** - Intentos exitosos totales
   - `metadata.successful_attempts`
   - Número de intentos que completó correctamente

6. **ERRORS** - Intentos fallidos totales
   - `metadata.failed_attempts`
   - Número de errores cometidos (máx 5)

7. **HINTS** - Hints usados totales
   - `metadata.hints_used`
   - Cantidad de pistas utilizadas

8. **TIME** - Tiempo total de la sesión
   - Formato: `MM:SS`
   - Ejemplo: "12:45" = 12 minutos y 45 segundos
   - Se guarda en `time_ms` (milisegundos)

---

## 🔧 Implementación Técnica

### 1. Backend Configuration

**Archivo:** `api/scores/games-config.js`

```javascript
'memory-matrix': {
  name: 'Memory Matrix',
  max_score: 100000,      // Formula: (exitosos × 1000) - penalizaciones (máx ~80,000)
  max_time_ms: 3600000,   // 1 hora máximo
  score_type: 'points',   // Puntos acumulativos, no nivel alcanzado
  has_levels: true,
  has_time: true          // Tiene timer global
}
```

**Cambios realizados:**
- ✅ max_score: 50,000 → 100,000 (evitar rechazo de scores altos)
- ✅ has_time: false → true (el juego SÍ trackea tiempo)

---

### 2. Frontend - Time Tracking

**Archivo:** `games/memory-matrix-v2/leaderboard-integration.js`

**Problema:** El juego tiene `globalElapsedTime` pero no se enviaba en metadata.

**Solución:** Agregar cálculo de tiempo total en ambas funciones submit.

```javascript
// Get total time (globalElapsedTime + current session if timer is running)
let totalTimeMs = window.globalElapsedTime || 0;
if (window.globalStartTime) {
    totalTimeMs += Date.now() - window.globalStartTime;
}

// Submit to API
const result = await submitScore(
    'memory-matrix',
    playerName,
    finalScore,
    {
        time_ms: totalTimeMs,  // ✅ NUEVO: tiempo en milisegundos
        metadata: {
            successful_attempts: totalSuccessful,
            failed_attempts: totalFailed,
            hints_used: totalHintsUsed,
            level_reached: levelReached  // Solo en Game Over
            // O
            levels_completed: 8           // Solo en Victoria
        }
    }
);
```

**Funciones modificadas:**
1. `submitVictoryScore()` (líneas 165-228)
2. `submitGameOverScore()` (líneas 370-435)

---

### 3. Frontend - Custom Leaderboard UI

**Archivo:** `js/leaderboard-ui.js`

Se agregaron 2 funciones nuevas siguiendo el patrón de Master Sequence:

#### 3.1. Función de Renderizado de Fila

```javascript
function renderMemoryMatrixScoreRow(score, highlightTop3 = true) {
  // LEVEL - nivel alcanzado (1-8, o "ALL" si completó todos)
  let levelDisplay = '-';
  if (score.metadata) {
    // Si levels_completed = 8, muestra "ALL 🏆"
    if (score.metadata.levels_completed === 8) {
      levelDisplay = 'ALL 🏆';
    } else if (score.metadata.level_reached) {
      levelDisplay = score.metadata.level_reached;
    }
  }

  // SUCCESS - intentos exitosos
  const successDisplay = (score.metadata && score.metadata.successful_attempts !== undefined)
    ? score.metadata.successful_attempts
    : '-';

  // ERRORS - intentos fallidos
  const errorsDisplay = (score.metadata && score.metadata.failed_attempts !== undefined)
    ? score.metadata.failed_attempts
    : '-';

  // HINTS - hints usados
  const hintsDisplay = (score.metadata && score.metadata.hints_used !== undefined)
    ? score.metadata.hints_used
    : '-';

  // TIME - tiempo total formateado (MM:SS)
  let timeDisplay = '-';
  if (score.time_ms) {
    const seconds = Math.floor(score.time_ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    timeDisplay = `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  return `
    <tr class="${rowClasses.join(' ')}" data-score-id="${score.id}">
      <td class="rank">${rankDisplay}</td>
      <td class="player-name">${playerNameHTML}</td>
      <td class="score">${scoreDisplay}</td>
      <td class="level">${levelDisplay}</td>
      <td class="level">${successDisplay}</td>
      <td class="level">${errorsDisplay}</td>
      <td class="level">${hintsDisplay}</td>
      <td class="time">${timeDisplay}</td>
    </tr>
  `;
}
```

#### 3.2. Función de Renderizado de Tabla

```javascript
function renderMemoryMatrixLeaderboardTable(scores) {
  const table = document.createElement('table');
  table.className = 'leaderboard-table';

  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th class="rank">Rank</th>
      <th class="player-name">Player</th>
      <th class="score">Score</th>
      <th class="level">Level</th>
      <th class="level">Success</th>
      <th class="level">Errors</th>
      <th class="level">Hints</th>
      <th class="time">Time</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  if (scores.length === 0) {
    tbody.innerHTML = `
      <tr class="no-scores">
        <td colspan="8" class="text-center">
          No scores yet. Be the first! 🏆
        </td>
      </tr>
    `;
  } else {
    tbody.innerHTML = scores.map(score => renderMemoryMatrixScoreRow(score, true)).join('');
  }

  table.appendChild(tbody);
  return table;
}
```

#### 3.3. Lógica Condicional

En `showLeaderboardModal()` (línea 940-942):

```javascript
} else if (state.currentGame === 'memory-matrix') {
  console.log('[DEBUG] Using Memory Matrix custom leaderboard');
  table = renderMemoryMatrixLeaderboardTable(data.scores);
}
```

---

## 🎯 Resultado

### Antes del Fix:

**Tabla genérica (sin columnas personalizadas):**
```
RANK | PLAYER | SCORE | COUNTRY | TIME
#1   | MEMORY | 79200 | AR      | 12:45
```

**Problemas:**
- ❌ No se mostraban estadísticas específicas (success, errors, hints)
- ❌ No se guardaba el tiempo (has_time: false)
- ❌ max_score muy bajo (50,000)

### Después del Fix:

**Tabla personalizada:**
```
RANK   | PLAYER 🇦🇷 | SCORE  | LEVEL    | SUCCESS | ERRORS | HINTS | TIME
🥇 #1  | MEM 🇦🇷    | 79,200 | ALL 🏆   | 80      | 3      | 10    | 12:45
🥈 #2  | FAS 🇺🇸    | 65,500 | 7        | 70      | 5      | 15    | 15:30
🥉 #3  | CLU 🇧🇷    | 52,000 | 6        | 60      | 4      | 20    | 18:12
```

**Beneficios:**
- ✅ Muestra todas las estadísticas relevantes
- ✅ Tiempo total de la sesión visible
- ✅ Distingue entre completar todos los niveles (ALL 🏆) y llegar a nivel X
- ✅ max_score correcto (100,000)
- ✅ Scoring basado en performance (no solo nivel alcanzado)

---

## 🐛 Bugs Encontrados Durante la Implementación

Durante la implementación del leaderboard personalizado se encontraron **7 bugs diferentes**. La mayoría compartían el mismo patrón (variables no expuestas a window), pero este patrón no fue reconocido hasta muy tarde en el proceso.

### Bug #1: Hints Mostraba Valor Incorrecto (42 en lugar de 0)

**Fecha:** 16 Nov 2025
**Tiempo de debug:** ~30 minutos

**Síntoma:**
- Modal de Game Over mostraba "Hints Used: 42"
- Usuario NUNCA había presionado el botón de hint
- Valor esperado: 0

**Causa Raíz:**
La fórmula calculaba hints usados de forma retrospectiva, asumiendo que se habían jugado los 8 niveles:

```javascript
// ❌ CÓDIGO INCORRECTO (leaderboard-integration.js, línea ~430)
const hintsPerLevel = 6;
const totalHintsUsed = (hintsPerLevel * 8) - hintsLeft;
// Si está en nivel 3 con hintsLeft=6:
// (6 × 8) - 6 = 48 - 6 = 42 ❌
```

**Solución Implementada:**
1. Crear contador global que se incrementa SOLO cuando se usa hint
2. Exponer contador a window para acceso desde leaderboard-integration.js

```javascript
// EN game.js (línea 32)
let totalHintsUsedSession = 0;

// EN game.js - showHint() (línea 1085)
function showHint() {
    hintsLeft--;
    totalHintsUsedSession++; // ✅ Incrementar solo cuando se usa
    updateHintButton();
}

// EN game.js - Exponer a window (líneas 37-39)
Object.defineProperty(window, 'totalHintsUsedSession', {
    get: () => totalHintsUsedSession
});

// EN leaderboard-integration.js (línea 430)
const totalHintsUsed = window.totalHintsUsedSession || 0;
```

**Archivos modificados:**
- `games/memory-matrix-v2/game.js` (líneas 32, 37-39, 1085)
- `games/memory-matrix-v2/leaderboard-integration.js` (línea 430)

**User feedback:** "ahora si estan bien los hints usados"

---

### Bug #2: Scoring No Consideraba Nivel ni Tiempo

**Fecha:** 16 Nov 2025
**Tiempo de debug:** ~20 minutos

**Síntoma:**
- Fórmula de scoring era muy simple
- No premiaba llegar a niveles altos
- No premiaba velocidad

**Causa Raíz:**
```javascript
// ❌ FÓRMULA VIEJA
score = (successful × 1000) - (failed × 100) - (hints × 50)
```

**Solución Implementada:**
Fórmula multi-factor que considera 5 aspectos:

```javascript
// ✅ FÓRMULA NUEVA
const levelScore = levelReached * 2000;         // Premia nivel alcanzado
const successScore = totalSuccessful * 200;     // Premia aciertos
const failuresPenalty = totalFailed * 300;      // Penaliza errores
const hintsPenalty = totalHintsUsed * 100;      // Penaliza hints

// Time bonus: max 1000 pts por < 5 min, -100 por cada minuto extra
const timeLimitMs = 5 * 60 * 1000;
const timeBonus = Math.max(0, Math.min(1000,
    1000 - Math.floor(Math.max(0, totalTimeMs - timeLimitMs) / 60000) * 100
));

const calculatedScore = levelScore + successScore - failuresPenalty - hintsPenalty + timeBonus;
const finalScore = Math.max(1, calculatedScore);  // Mínimo 1 punto
```

**Ejemplo:**
- Nivel 8, 80 aciertos, 3 errores, 10 hints, 12:00 tiempo
- Score = (8×2000) + (80×200) - (3×300) - (10×100) + 300
- Score = 16,000 + 16,000 - 900 - 1,000 + 300 = 30,400 puntos

**Archivos modificados:**
- `games/memory-matrix-v2/leaderboard-integration.js` (líneas 183-201, 441-459)
- `api/scores/games-config.js` (línea 29: max_score 50,000 → 100,000)

---

### Bug #3: Error de API en file:// Protocol

**Fecha:** 16 Nov 2025
**Tiempo de debug:** ~15 minutos

**Síntoma:**
- Al abrir index.html localmente (sin servidor), leaderboard mostraba error
- Console: "Failed to fetch"

**Causa Raíz:**
`API_BASE_URL` no manejaba el protocolo `file://`, intentaba usar URL relativa que falla con CORS.

**Solución Implementada:**
```javascript
// EN js/leaderboard-api.js (líneas 43-47)
if (protocol === 'file:') {
    console.log('[leaderboard-api] Running from file:// → using Vercel API');
    return 'https://chessarcade.vercel.app/api/scores';
}
```

**Archivos modificados:**
- `js/leaderboard-api.js` (líneas 43-47)

---

### Bug #4: Juego Quedaba en Pausa Después de Cerrar Modal

**Fecha:** 16 Nov 2025
**Tiempo de debug:** ~25 minutos

**Síntoma:**
- Después de cerrar modal de Game Over, presionar "Play" no iniciaba el juego
- Usuario tenía que hacer F5 (refresh) para poder jugar de nuevo

**Causa Raíz:**
`gameState` no se reseteaba a 'idle' al cerrar el modal.

**Solución Implementada:**
1. Crear función `setGameState()` para cambiar estado de forma segura
2. Llamar `setGameState('idle')` al cerrar modal

```javascript
// EN game.js (líneas 2413-2424)
function setGameState(newState) {
    const validStates = ['idle', 'playing', 'memorizing', 'solving', 'completed', 'failed'];
    if (!validStates.includes(newState)) {
        console.error(`❌ Invalid game state: ${newState}`);
        return;
    }
    gameState = newState;
    console.log(`🎮 Game state changed to: ${newState}`);
}
window.setGameState = setGameState;

// EN leaderboard-integration.js - closeLeaderboardGameOverModal() (líneas 500-504)
if (window.setGameState) {
    window.setGameState('idle');
    console.log('✅ Game state reset to idle');
}
```

**Archivos modificados:**
- `games/memory-matrix-v2/game.js` (líneas 2413-2424)
- `games/memory-matrix-v2/leaderboard-integration.js` (líneas 500-504)

**User feedback:** "se solucionó lo de play y pause, ahora puedo comenzar a jugar sin F5"

---

### Bug #5: Columna TIME Mostraba "-" (Variables No Expuestas)

**Fecha:** 16 Nov 2025
**Tiempo de debug:** ~45 minutos

**Síntoma:**
- Columna TIME mostraba "-" para TODOS los scores
- Incluso scores recién jugados no mostraban tiempo

**Logs Observados:**
```javascript
🕐 [DEBUG] Time tracking variables: {
    globalElapsedTime: undefined,
    globalStartTime: undefined
}
🕐 [DEBUG] Calculated totalTimeMs: 0
```

**Causa Raíz:**
`globalElapsedTime` y `globalStartTime` eran variables locales en game.js, NO expuestas a window.

```javascript
// ❌ EN game.js (línea 60)
let globalElapsedTime = 0;        // Variable LOCAL
let globalStartTime = null;       // Variable LOCAL

// ❌ EN leaderboard-integration.js (línea 177)
let totalTimeMs = window.globalElapsedTime || 0;  // undefined → 0
```

**Solución Implementada:**
```javascript
// ✅ EN game.js (líneas 60-65) - Exponer a window
Object.defineProperty(window, 'globalElapsedTime', {
    get: () => globalElapsedTime
});
Object.defineProperty(window, 'globalStartTime', {
    get: () => globalStartTime
});
```

**Archivos modificados:**
- `games/memory-matrix-v2/game.js` (líneas 60-65)

**NOTA:** Este bug reveló el patrón de "variables no expuestas" que se repetiría en Bug #7.

---

### Bug #6: Modal No Se Cerraba Después de Submit

**Fecha:** 16 Nov 2025
**Tiempo de debug:** ~10 minutos

**Síntoma:**
- Después de enviar score, modal se quedaba abierto
- Usuario podía cambiar nombre y enviar otro score
- Permitía múltiples submissions

**Causa Raíz:**
No había lógica de auto-close después de submit exitoso.

**Solución Implementada:**
```javascript
// EN leaderboard-integration.js - submitVictoryScore() y submitGameOverScore()
showToast(`Score submitted! Rank #${result.rank} of ${result.totalPlayers}`, 'success');

submitBtn.disabled = true;
submitBtn.textContent = '✅ SUBMITTED!';

// ✅ Cerrar modal después de 2 segundos
setTimeout(() => {
    console.log('🔒 Closing modal after successful submission');
    if (window.closeLeaderboardGameOverModal) {
        closeLeaderboardGameOverModal();
    } else if (window.closeLeaderboardVictoryModal) {
        closeLeaderboardVictoryModal();
    }
}, 2000);
```

**Archivos modificados:**
- `games/memory-matrix-v2/leaderboard-integration.js` (líneas ~218-228, ~472-482)

**User feedback:** "el modal de fin de juego, luego de enviar el nombre al leaderboard, no se cierra automaticamente"

---

### Bug #7: SUCCESS y ERRORS Mostraban 0 (Variables No Expuestas) 🚨 CRÍTICO

**Fecha:** 16 Nov 2025
**Tiempo de debug:** ~90 minutos (el más largo)

**Síntoma:**
- Modal de Game Over mostraba "2 successful, 5 failed" ✅ CORRECTO
- Leaderboard mostraba "0 successful, 0 failed" ❌ INCORRECTO

**Este fue el bug más frustrante porque era EL MISMO PATRÓN del Bug #5.**

**Logs Observados:**
```javascript
📊 [DEBUG] Reading game stats from window: {
    successfulAttempts: undefined,
    failedAttempts: undefined,
    currentLevel: undefined
}

📊 [DEBUG] Final values to submit: {
    totalSuccessful: 0,   // undefined || 0 = 0
    totalFailed: 0,       // undefined || 0 = 0
    levelReached: 1       // undefined || 1 = 1
}
```

**Causa Raíz (MISMO PATRÓN):**
```javascript
// ❌ EN game.js (líneas ~20-22)
let successfulAttempts = 0;   // Variable LOCAL
let failedAttempts = 0;       // Variable LOCAL
let currentLevel = 1;         // Variable LOCAL

// ❌ EN leaderboard-integration.js (líneas 425-427)
const totalSuccessful = window.successfulAttempts || 0;  // undefined → 0
const totalFailed = window.failedAttempts || 0;          // undefined → 0
const levelReached = window.currentLevel || 1;           // undefined → 1
```

**Solución Implementada:**
```javascript
// ✅ EN game.js (líneas 27-36) - Exponer a window
Object.defineProperty(window, 'currentLevel', {
    get: () => currentLevel
});
Object.defineProperty(window, 'successfulAttempts', {
    get: () => successfulAttempts
});
Object.defineProperty(window, 'failedAttempts', {
    get: () => failedAttempts
});
```

**Archivos modificados:**
- `games/memory-matrix-v2/game.js` (líneas 27-36)

**User feedback:**
- "sigue igual, debes poner mas console log para saber donde esta el problema"
- "hay algo que estas dando por sentado y no es asi"
- "no funcionan las columnas SUCCESS y ERRORS, muestra cero, pero cometí 5 errores... mira el modal, ahi si esta bien" ← KEY INSIGHT
- "Por fin!!! funciono OK" ← Después del fix
- **"Como no te diste cuenta antes si era el mismo error?"** ← Frustración justificada

**NOTA CRÍTICA:** El hecho de que el modal mostrara valores correctos pero el leaderboard no, era una señal clara de problema de scope. Debió haber sido reconocido inmediatamente como el mismo patrón de Bug #5.

---

## 📊 Resumen de Bugs

| # | Bug | Patrón | Tiempo Debug | Frustración |
|---|-----|--------|--------------|-------------|
| 1 | Hints = 42 | Variable scope | 30 min | Media |
| 2 | Scoring simple | Business logic | 20 min | Baja |
| 3 | file:// error | Edge case | 15 min | Baja |
| 4 | Juego en pausa | State management | 25 min | Media |
| 5 | TIME = "-" | Variable scope | 45 min | Media |
| 6 | Modal no cierra | UX flow | 10 min | Baja |
| 7 | SUCCESS/ERRORS = 0 | Variable scope | 90 min | **Alta** |

**Total:** ~4 horas de debugging
**Patrón dominante:** Variable scope (Bugs #1, #5, #7) con 6 variables afectadas

---

## 🎓 Lecciones Aprendidas

### 1. El Patrón de "Variables No Expuestas"

**6 variables necesitaron ser expuestas a window:**
- `totalHintsUsedSession` (Bug #1)
- `globalElapsedTime` (Bug #5)
- `globalStartTime` (Bug #5)
- `currentLevel` (Bug #7)
- `successfulAttempts` (Bug #7)
- `failedAttempts` (Bug #7)

**Todos seguían el mismo patrón:**
```javascript
// ❌ PROBLEMA
let myVar = 0;  // Variable local en game.js
const value = window.myVar || default;  // undefined en leaderboard-integration.js

// ✅ SOLUCIÓN
Object.defineProperty(window, 'myVar', { get: () => myVar });
```

### 2. Reconocer Patrones Temprano

**Error cometido:** Resolver bugs uno por uno sin reconocer el patrón.

**Mejor enfoque:**
1. Después de Bug #1 (hints), listar TODAS las variables que leaderboard necesita
2. Verificar TODAS las variables de una vez
3. Exponerlas TODAS antes de continuar

**Tiempo ahorrado:** ~2 horas si se hubiera reconocido el patrón después de Bug #5.

### 3. Modal Correcto + Leaderboard Incorrecto = Variable Scope Issue

**Smoking Gun:**
- ✅ Modal muestra valores correctos → Variables existen con valores correctos
- ❌ Leaderboard muestra ceros → Variables no accesibles desde otro módulo
- → **Problema de scope garantizado**

Esta señal debió activar revisión inmediata de TODAS las variables.

### 4. Debugging Logs en Tres Lugares

**Patrón efectivo:**
```javascript
// 1. Donde se crea (game.js)
console.log('📊 Variable created:', { myVar });

// 2. Donde se expone (game.js)
console.log('✅ Exposed to window:', window.myVar);

// 3. Donde se lee (leaderboard-integration.js)
console.log('🔍 Reading:', window.myVar);
```

### 5. Defaults Ocultan Bugs

```javascript
// ❌ OCULTA: undefined || 0 = 0 (parece válido)
const value = window.myVar || 0;

// ✅ MEJOR: Log muestra undefined claramente
console.log('window.myVar:', window.myVar);  // undefined visible
const value = window.myVar || 0;
```

---

## 🚨 Checklist para Futuras Implementaciones

### Pre-Implementation:
- [ ] Listar TODAS las variables que leaderboard-integration.js necesitará
- [ ] Verificar cada variable esté expuesta a window ANTES de implementar
- [ ] Agregar logs de debug en creación, exposición y lectura
- [ ] No asumir que las variables estarán disponibles

### Durante Debugging:
- [ ] Si modal muestra correcto pero leaderboard no → scope issue
- [ ] Agregar `console.log('window.X:', window.X)` para cada variable
- [ ] Si encuentro UNA variable no expuesta, revisar TODAS las demás
- [ ] No resolver bugs uno por uno sin reconocer patrones

### Post-Fix:
- [ ] Probar ambos modals (Victory y Game Over)
- [ ] Verificar TODAS las columnas muestren datos
- [ ] Verificar auto-close del modal
- [ ] Verificar que se pueda jugar de nuevo sin F5

---

## 📝 Archivos Modificados

### Backend:
1. **`api/scores/games-config.js`**
   - Línea 29: max_score 50,000 → 100,000
   - Línea 33: has_time false → true

### Frontend:
2. **`games/memory-matrix-v2/leaderboard-integration.js`**
   - Línea 179-183: Agregar cálculo de `totalTimeMs` en victory
   - Línea 210-218: Cambiar estructura de submit (time_ms + metadata) en victory
   - Línea 395-399: Agregar cálculo de `totalTimeMs` en game over
   - Línea 427-435: Cambiar estructura de submit (time_ms + metadata) en game over

3. **`js/leaderboard-ui.js`**
   - Línea 661-753: Nueva función `renderMemoryMatrixScoreRow()`
   - Línea 763-804: Nueva función `renderMemoryMatrixLeaderboardTable()`
   - Línea 940-942: Agregar condición para usar tabla personalizada

---

## 🚨 Puntos Clave

### 1. Tiempo Total (globalElapsedTime)

El juego usa un timer global que NO se resetea entre niveles:

```javascript
// game.js
let globalStartTime = null;     // Tiempo de inicio de sesión
let globalElapsedTime = 0;      // Tiempo acumulado (ms)
```

**Cálculo correcto:**
```javascript
let totalTimeMs = window.globalElapsedTime || 0;
if (window.globalStartTime) {
    totalTimeMs += Date.now() - window.globalStartTime;
}
```

### 2. Victoria vs Game Over

**Victoria (completar 8 niveles):**
```javascript
metadata: {
    successful_attempts: 80,
    failed_attempts: 3,
    hints_used: 10,
    levels_completed: 8  // ✅ Indica victoria
}
```

**Game Over (llegar a 5 errores):**
```javascript
metadata: {
    successful_attempts: 40,
    failed_attempts: 5,
    hints_used: 15,
    level_reached: 4     // ✅ Indica nivel alcanzado
}
```

**Renderizado en tabla:**
```javascript
if (score.metadata.levels_completed === 8) {
    levelDisplay = 'ALL 🏆';  // Completó todos los niveles
} else if (score.metadata.level_reached) {
    levelDisplay = score.metadata.level_reached;  // Game Over en nivel X
}
```

### 3. Estructura de Metadata

**Antes (incorrecta):**
```javascript
{
    successful_attempts: 80,  // ❌ Nivel raíz
    failed_attempts: 3,
    hints_used: 10
}
```

**Después (correcta):**
```javascript
{
    time_ms: 765000,         // ✅ Nivel raíz
    metadata: {              // ✅ Anidado
        successful_attempts: 80,
        failed_attempts: 3,
        hints_used: 10,
        level_reached: 7
    }
}
```

---

## 📚 Lecciones Aprendidas

### 1. Verificar Backend Config

Siempre revisar `games-config.js` al implementar un nuevo juego:
- ✅ `max_score` debe ser realista según la fórmula
- ✅ `has_time` debe reflejar si el juego trackea tiempo
- ✅ `score_type` debe ser correcto ('points', 'level_reached', etc.)

### 2. Estructura de Metadata

El backend espera:
```javascript
{
    time_ms: number,      // Nivel raíz (opcional)
    metadata: object      // Nivel raíz (opcional)
}
```

**NO:**
```javascript
{
    time_ms: number,
    successful_attempts: number  // ❌ No anidado
}
```

### 3. Timer Global

Si el juego tiene timer global, calcular correctamente:
```javascript
// globalElapsedTime = tiempo acumulado cuando está en pausa
// globalStartTime = timestamp cuando comenzó sesión actual

totalTimeMs = globalElapsedTime + (Date.now() - globalStartTime)
```

### 4. Leaderboard Personalizado

Seguir el patrón de otros juegos:
1. Crear `renderXXXScoreRow()` - Renderiza una fila
2. Crear `renderXXXLeaderboardTable()` - Renderiza tabla completa
3. Agregar condición en `showLeaderboardModal()`

---

## 🔗 Referencias

- Documento principal: `docs/LEADERBOARD_METADATA_FIX.md`
- Caso similar (Master Sequence): `games/master-sequence/docs/LEADERBOARD_INTEGRATION_FIX.md`
- Caso similar (Knight Quest): Ver sección "CASO 1" en documento principal

---

## 🎯 Bug #8: Modal No Se Cerraba Automáticamente Después de Submit

**Fecha:** 16 Nov 2025
**Tiempo de debug:** ~20 minutos

**Síntoma:**
- Después de enviar el score, el modal mostraba "✅ SUBMITTED!"
- El leaderboard se abría DETRÁS del modal
- El modal de Game Over/Victory NO se cerraba
- El usuario tenía que cerrar el modal manualmente

**Causa Raíz #1 (Variables con solo getter):**
```javascript
// En resetGameAfterGameOver()
window.currentLevel = 1;  // ❌ Error: Cannot set property currentLevel which has only a getter
```

Las variables estaban definidas con `Object.defineProperty` con solo getter, no setter.

**Causa Raíz #2 (Cerrar modal equivocado):**
```javascript
// ❌ CÓDIGO INCORRECTO
if (window.closeLeaderboardVictoryModal) {
    closeLeaderboardVictoryModal();  // Siempre ejecuta esta, aunque sea Game Over
} else if (window.closeLeaderboardGameOverModal) {
    closeLeaderboardGameOverModal();
}
```

El código siempre intentaba cerrar el Victory modal primero, aunque estuvieras en Game Over.

**Solución Implementada:**

**Fix #1:** Crear función `resetGameCounters()` que maneja el reset internamente
```javascript
// EN game.js (líneas 2464-2485)
function resetGameCounters() {
    // Resetear contadores acumulativos de sesión
    totalHintsUsedSession = 0;
    totalSuccessfulAttemptsSession = 0;
    totalFailedAttemptsSession = 0;

    // Resetear contadores del nivel actual
    currentLevel = 1;
    currentAttempt = 1;
    successfulAttempts = 0;
    failedAttempts = 0;
    hintsLeft = HINTS_PER_LEVEL;

    // Resetear arrays
    placedPieces = [];
    moveHistory = [];
}
window.resetGameCounters = resetGameCounters;
```

**Fix #2:** Detectar qué modal está abierto antes de cerrar
```javascript
// EN leaderboard-integration.js (líneas 537-555)
setTimeout(() => {
    console.log('🔒 Closing modal after successful submission');

    // ✅ Detectar qué modal está abierto y cerrarlo
    const victoryModal = document.getElementById('leaderboardVictoryModal');
    const gameOverModal = document.getElementById('leaderboardGameOverModal');

    if (victoryModal && victoryModal.style.display !== 'none') {
        console.log('📊 Closing Victory modal');
        victoryModal.style.display = 'none';
    } else if (gameOverModal && gameOverModal.style.display !== 'none') {
        console.log('📊 Closing Game Over modal');
        gameOverModal.style.display = 'none';
    }

    // ✅ Open leaderboard after closing modal
    setTimeout(() => {
        console.log('📊 Opening leaderboard after score submission');
        if (window.showLeaderboardModal) {
            window.showLeaderboardModal('memory-matrix');
        }
    }, 300); // Small delay to ensure modal is fully closed
}, 2000);
```

**Archivos modificados:**
- `games/memory-matrix-v2/game.js` (líneas 2464-2485)
- `games/memory-matrix-v2/leaderboard-integration.js` (líneas 537-555, 580-590)

**Flujo Final:**
1. ✅ Terminar juego → Modal Game Over/Victory
2. ✅ Ingresar nombre → Submit
3. ✅ Muestra "✅ SUBMITTED!" por 2 segundos
4. ✅ Detecta qué modal está abierto
5. ✅ Cierra el modal correcto (setea `display = 'none'`)
6. ✅ Espera 300ms
7. ✅ Abre el leaderboard automáticamente

**User feedback:** "Ahora si cierra"

**📌 NOTA IMPORTANTE:** Este será el funcionamiento estándar para TODOS los juegos del proyecto.

---

## 🎨 Futuras Mejoras para Otros Juegos

### Cartel de "GAME OVER" antes del Modal
Memory Matrix tiene un diseño de UX excelente:
1. Primero muestra el cartel grande "¡GAME OVER!" con overlay
2. Después muestra el modal con estadísticas y opción de submit

**Este patrón debería aplicarse a:**
- Knight Quest
- Master Sequence
- Square Rush
- Todos los juegos futuros

**Beneficios:**
- Más impacto visual
- Mejor feedback al usuario
- Transición más dramática
- Mayor engagement

---

**Documento creado:** 16 Noviembre 2025
**Última actualización:** 16 Noviembre 2025
**Autor:** Claude Code (con FAS)
**Estado:** ✅ Implementado y funcionando
**Versión del juego:** 2.0.0
