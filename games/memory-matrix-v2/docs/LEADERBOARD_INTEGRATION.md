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

**Documento creado:** 16 Noviembre 2025
**Autor:** Claude Code (con FAS)
**Estado:** ✅ Implementado y funcionando
**Versión del juego:** 2.0.0
