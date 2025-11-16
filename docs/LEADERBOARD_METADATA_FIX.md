# Leaderboard Metadata Fix - Lecciones Aprendidas

## 📋 Resumen Ejecutivo

Este documento describe bugs complejos encontrados al implementar columnas personalizadas en los leaderboards de Knight Quest y Master Sequence.

**Juegos afectados:**
- Knight Quest: Columnas BOARD y SQUARES mostraban "-" (3 horas de debugging)
- Master Sequence: Columna LENGTH mostraba "1" siempre (4 horas de debugging)

**Complejidad:** Alta (involucró frontend, backend, base de datos y scope de variables)
**Fecha:** 15-16 Noviembre 2025

---

## 🐛 Síntomas del Problema

### Comportamiento Observado

1. El leaderboard de Knight Quest mostraba solo 4 columnas:
   - RANK | PLAYER | SCORE | TIME

2. Después de implementar columnas personalizadas, mostraba 6 columnas:
   - RANK | PLAYER | SCORE | **BOARD** | **SQUARES** | TIME

3. **Pero las columnas BOARD y SQUARES mostraban "-" para todos los scores**

4. Los logs del navegador mostraban:
   ```
   [DEBUG] Using Knight Quest custom leaderboard
   [DEBUG] renderKnightQuestLeaderboardTable exists? function
   ```

   Esto confirmaba que el frontend estaba ejecutando el código correcto.

---

## 🔍 Diagnóstico del Problema

### 1. Verificación del Frontend

**Lo que se verificó:**
- ✅ Función `renderKnightQuestLeaderboardTable()` existía
- ✅ Función `renderKnightQuestScoreRow()` existía
- ✅ Lógica condicional en `showLeaderboardModal()` funcionaba
- ✅ Frontend intentaba acceder a `score.metadata.board_size`

**Conclusión:** El frontend estaba correcto.

### 2. Verificación del Backend (Submit)

**Lo que se verificó:**
- ✅ Knight Quest enviaba metadata al backend:
  ```javascript
  metadata: {
    board_size: "3x4",
    moves: 12,
    visited_squares: 12,
    total_squares: 12,
    completion_percent: 100,
    hints_used: 0
  }
  ```
- ✅ Backend guardaba metadata en la base de datos:
  ```javascript
  ${JSON.stringify(metadata)}  // Convierte objeto a string JSON
  ```

**Conclusión:** La metadata SÍ se estaba guardando en la base de datos.

### 3. Verificación del Backend (Leaderboard API)

**Aquí encontramos los problemas:**

#### Problema #1: SELECT sin metadata

El primer SELECT (con filtros) incluía metadata:
```javascript
SELECT
  id,
  player_name,
  score,
  level,
  time_ms,
  country_code,
  country_name,
  metadata,  // ✅ Incluido
  created_at,
  ROW_NUMBER() OVER (ORDER BY score DESC, created_at ASC) as rank
FROM scores
WHERE game = ${game}
  ${country ? sql`AND country_code = ${country}` : sql``}
  ${level ? sql`AND level = ${level}` : sql``}
```

**Pero** el segundo SELECT (sin filtros) **NO** incluía metadata:
```javascript
SELECT
  id,
  player_name,
  score,
  level,
  time_ms,
  country_code,
  country_name,
  // ❌ FALTABA: metadata
  created_at,
  ROW_NUMBER() OVER (ORDER BY score DESC, created_at ASC) as rank
FROM scores
WHERE game = ${game}
```

#### Problema #2: Response mapping sin metadata

El mapeo de respuesta NO incluía metadata:
```javascript
const formattedScores = scores.map((score, index) => ({
  rank: offset + index + 1,
  id: score.id,
  player_name: score.player_name,
  score: score.score,
  level: score.level,
  time_ms: score.time_ms,
  country: {
    code: score.country_code,
    name: score.country_name
  },
  // ❌ FALTABA: metadata
  created_at: score.created_at
}));
```

#### Problema #3: Metadata como STRING en lugar de OBJECT

Cuando agregamos metadata al response, Postgres lo devolvía como string:
```json
{
  "metadata": "{\"board_size\":\"8x8\",\"moves\":64}"  // ❌ STRING
}
```

El frontend intentaba acceder a `score.metadata.board_size`, pero como metadata era un string, devolvía `undefined`.

---

## ✅ Soluciones Implementadas

### Fix #1: Agregar metadata al segundo SELECT

**Archivo:** `api/scores/leaderboard.js`

```javascript
query = sql`
  SELECT
    id,
    player_name,
    score,
    level,
    time_ms,
    country_code,
    country_name,
    metadata,  // ✅ AGREGADO
    created_at,
    ROW_NUMBER() OVER (ORDER BY score DESC, created_at ASC) as rank
  FROM scores
  WHERE game = ${game}
  ORDER BY score DESC, created_at ASC
  LIMIT ${limit}
  OFFSET ${offset}
`;
```

### Fix #2: Agregar metadata al response mapping

**Archivo:** `api/scores/leaderboard.js`

```javascript
const formattedScores = scores.map((score, index) => ({
  rank: offset + index + 1,
  id: score.id,
  player_name: score.player_name,
  score: score.score,
  level: score.level,
  time_ms: score.time_ms,
  country: {
    code: score.country_code,
    name: score.country_name
  },
  metadata: score.metadata || {},  // ✅ AGREGADO
  created_at: score.created_at
}));
```

### Fix #3: Parsear metadata de STRING a OBJECT

**Archivo:** `api/scores/leaderboard.js`

```javascript
const formattedScores = scores.map((score, index) => {
  // Parse metadata if it's a string (from JSONB column)
  let metadata = {};
  if (score.metadata) {
    if (typeof score.metadata === 'string') {
      try {
        metadata = JSON.parse(score.metadata);
      } catch (e) {
        console.error('Failed to parse metadata:', e);
        metadata = {};
      }
    } else {
      metadata = score.metadata;
    }
  }

  return {
    rank: offset + index + 1,
    id: score.id,
    player_name: score.player_name,
    score: score.score,
    level: score.level,
    time_ms: score.time_ms,
    country: {
      code: score.country_code,
      name: score.country_name
    },
    metadata: metadata,  // ✅ Ahora es un objeto, no un string
    created_at: score.created_at
  };
});
```

---

## 🎯 Resultado Final

### API Response (Correcto)

```json
{
  "rank": 1,
  "id": 63,
  "player_name": "Faaassmote!!",
  "score": 68410,
  "level": null,
  "time_ms": 39000,
  "country": {
    "code": "AR",
    "name": "Argentina"
  },
  "metadata": {
    "board_size": "8x8",
    "moves": 64,
    "visited_squares": 64,
    "total_squares": 64,
    "completion_percent": 100,
    "hints_used": 0
  },
  "created_at": "2025-11-16T00:06:33.755Z"
}
```

### Leaderboard Display (Correcto)

| RANK | PLAYER | SCORE | BOARD | SQUARES | TIME |
|------|--------|-------|-------|---------|------|
| 🥇 #1 | Faaassmote!! 🇦🇷 | 68,410 | **8x8** | **64/64** | **0:39** |
| 🥈 #2 | Fasmote-15-11-2 | 68,370 | - | - | - |
| 🥉 #3 | FAS1 🇦🇷 | 19,320 | **3x4** | **12/12** | **0:08** |

---

## 📚 Lecciones Aprendidas

### 1. Verificar TODOS los SELECTs

Cuando agregues una columna, verifica que esté en **TODOS** los queries, no solo en uno.

En este caso había dos SELECTs:
- Uno con filtros (country, level)
- Uno sin filtros

Ambos necesitaban incluir `metadata`.

### 2. Verificar el Response Mapping

Aunque la columna esté en el SELECT, si hay un `.map()` que formatea la respuesta, asegúrate de incluir el campo ahí también.

### 3. JSONB en Postgres puede devolver strings

Postgres almacena JSONB correctamente, pero al hacer SELECT puede devolver el valor como string. Siempre parsear:

```javascript
if (typeof metadata === 'string') {
  metadata = JSON.parse(metadata);
}
```

### 4. Usar Debug Logs

Los `console.log()` fueron cruciales para identificar que:
- ✅ Frontend ejecutaba el código correcto
- ✅ Funciones existían y se llamaban
- ❌ Pero la data no llegaba del backend

### 5. Verificar el Network Tab

Ver la respuesta real del API en DevTools → Network fue clave para descubrir que metadata no estaba en el JSON response.

---

## 🔧 Cómo Aplicar Esto a Otros Juegos

Si quieres agregar columnas personalizadas a otros juegos:

### 1. Frontend: Crear funciones específicas

**Archivo:** `js/leaderboard-ui.js`

```javascript
// Función para renderizar un score row personalizado
function renderMyGameScoreRow(score, highlightTop3 = true) {
  // ... código específico del juego

  // Obtener datos de metadata
  const customData = score.metadata?.custom_field || '-';

  return `
    <tr>
      <td>${score.rank}</td>
      <td>${score.player_name}</td>
      <td>${score.score}</td>
      <td>${customData}</td>  <!-- Columna personalizada -->
    </tr>
  `;
}

// Función para renderizar la tabla completa
function renderMyGameLeaderboardTable(scores) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');

  thead.innerHTML = `
    <tr>
      <th>RANK</th>
      <th>PLAYER</th>
      <th>SCORE</th>
      <th>CUSTOM</th>  <!-- Header personalizado -->
    </tr>
  `;

  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  tbody.innerHTML = scores.map(score => renderMyGameScoreRow(score)).join('');
  table.appendChild(tbody);

  return table;
}
```

### 2. Frontend: Usar lógica condicional

**Archivo:** `js/leaderboard-ui.js` (en `showLeaderboardModal()`)

```javascript
// Renderizar tabla
let table;
if (state.currentGame === 'my-game') {
  table = renderMyGameLeaderboardTable(data.scores);
} else if (state.currentGame === 'knight-quest') {
  table = renderKnightQuestLeaderboardTable(data.scores);
} else {
  table = renderLeaderboardTable(data.scores, true);
}
```

### 3. Game: Enviar metadata al submitir score

**Archivo:** `games/my-game/index.html`

```javascript
const result = await submitScore(
  'my-game',
  playerName,
  finalScore,
  {
    time_ms: elapsedTime * 1000,
    metadata: {
      custom_field: "valor personalizado",
      another_field: 123,
      // Cualquier dato que quieras mostrar en el leaderboard
    }
  }
);
```

### 4. Backend: VERIFICAR que metadata esté en TODOS los SELECTs

**Archivo:** `api/scores/leaderboard.js`

Busca **TODOS** los `SELECT` y asegúrate que incluyan `metadata`:

```javascript
SELECT
  id,
  player_name,
  score,
  level,
  time_ms,
  country_code,
  country_name,
  metadata,  // ✅ DEBE ESTAR AQUÍ
  created_at,
  ROW_NUMBER() OVER (...)
FROM scores
```

### 5. Backend: VERIFICAR el response mapping

**Archivo:** `api/scores/leaderboard.js`

```javascript
const formattedScores = scores.map((score, index) => {
  let metadata = {};
  if (score.metadata) {
    if (typeof score.metadata === 'string') {
      metadata = JSON.parse(score.metadata);
    } else {
      metadata = score.metadata;
    }
  }

  return {
    // ... otros campos
    metadata: metadata,  // ✅ DEBE ESTAR AQUÍ
    // ...
  };
});
```

---

## 🚨 Checklist para Debugging

Si las columnas personalizadas no funcionan:

- [ ] **Frontend:** ¿Las funciones personalizadas existen?
  - Buscar: `function renderMyGameLeaderboardTable`

- [ ] **Frontend:** ¿Se llaman las funciones correctas?
  - Agregar: `console.log('[DEBUG] Using custom leaderboard for:', game);`

- [ ] **Frontend:** ¿El código intenta acceder a `score.metadata.campo`?
  - Verificar en la función render

- [ ] **Game:** ¿Se envía metadata al submitir?
  - Ver Network tab al hacer submit

- [ ] **Backend (Submit):** ¿Se guarda metadata en DB?
  - Ver código en `api/scores/index.js`

- [ ] **Backend (Leaderboard):** ¿TODOS los SELECTs incluyen metadata?
  - Buscar: `SELECT` en `api/scores/leaderboard.js`

- [ ] **Backend (Leaderboard):** ¿El response mapping incluye metadata?
  - Buscar: `formattedScores.map`

- [ ] **Backend (Leaderboard):** ¿Se parsea metadata de string a object?
  - Buscar: `JSON.parse(score.metadata)`

- [ ] **API Response:** ¿Metadata está en la respuesta como objeto?
  - Ver Network tab → Response

- [ ] **Browser:** ¿Caché limpiado?
  - Hard refresh: Ctrl+Shift+R
  - O abrir en incógnito

---

## 📝 Commits Relacionados

1. `0977be5` - feat: Add custom Knight Quest leaderboard with modular approach
2. `70f3fad` - fix: Include metadata column in leaderboard SELECT queries
3. `3945ead` - fix: Include metadata in API response - FINAL FIX for BOARD/SQUARES
4. `6490852` - fix: Parse metadata JSON string to object in API response

---

## 🎓 Conclusión

Este bug fue complejo porque involucró tres capas:
1. **Frontend** - Funciones personalizadas y lógica condicional
2. **Backend** - Múltiples SELECTs y response mapping
3. **Transformación de datos** - String vs Object

La clave fue hacer debugging sistemático desde el frontend hacia el backend, verificando cada capa hasta encontrar dónde se perdía la información.

**Tiempo total de debugging:** ~3 horas
**Deployments realizados:** 10+
**Lección principal:** Siempre verificar el flujo completo de datos: Frontend → API Submit → Database → API Read → Frontend Display

---

# ============================================
# CASO 2: MASTER SEQUENCE - VARIABLE NO EXPUESTA
# ============================================

## 🐛 Síntomas del Problema

### Comportamiento Observado

1. El leaderboard de Master Sequence mostraba 6 columnas correctamente:
   - RANK | PLAYER | SCORE | **LENGTH** | LEVEL | TIME

2. **Pero la columna LENGTH mostraba "1" para TODOS los scores**
   - Incluso cuando el jugador llegaba a nivel 6
   - La secuencia acumulativa debería ser 6, pero mostraba 1

3. Los logs del navegador mostraban:
   ```
   📊 Last session stats saved: {sequenceLength: 6, ...}
   🔍 [DEBUG] window.lastSessionStats: undefined
   ```

---

## 🔍 Diagnóstico del Problema

### 1. Primera Hipótesis: gameState.sequence vs gameState.masterSequence

**Lo que se verificó:**
- ❌ Inicialmente usaba `gameState.sequence.length` (incorrecto)
- ✅ Cambiado a `gameState.masterSequence.length` (correcto)

**Fix aplicado (línea 805 en game.js):**
```javascript
// ANTES:
sequenceLength: gameState.sequence.length  // ❌ Copia temporal

// DESPUÉS:
sequenceLength: gameState.masterSequence.length  // ✅ Secuencia acumulativa
```

**Resultado:** Seguía mostrando "1" ❌

### 2. Segunda Hipótesis: Logs para rastrear el flujo

**Se agregaron logs detallados en:**
- `game.js` → Cuando se guarda `lastSessionStats`
- `leaderboard-integration.js` → Cuando se lee `lastSessionStats`
- `leaderboard-ui.js` → Cuando se renderiza la columna

**Resultado de los logs:**

```javascript
// EN GAME.JS (línea 808):
📊 Last session stats saved: {level: 6, score: 791, sequenceLength: 6, ...}
✅ sequenceLength: 6 se guardó correctamente

// EN LEADERBOARD-INTEGRATION.JS (línea 194):
🔍 [DEBUG] window.lastSessionStats: undefined
❌ ¡No puede leer la variable!

// POR LO TANTO (línea 196):
sequenceLength: 1  // ← Usa el valor por defecto
```

### 3. Causa Raíz Encontrada

**El problema:** `lastSessionStats` era una variable **LOCAL** en `game.js`

```javascript
// EN game.js (línea 69):
let lastSessionStats = {  // ❌ Variable LOCAL, no está en window
    level: 1,
    score: 0,
    // ...
};

// EN leaderboard-integration.js (línea 79):
const stats = window.lastSessionStats || {};  // ❌ Busca en window pero no existe
```

**¿Por qué fallaba?**
- `lastSessionStats` estaba en el scope del módulo `game.js`
- `leaderboard-integration.js` es otro módulo separado
- `window.lastSessionStats` era `undefined`
- Por eso defaulteaba a `sequenceLength: 1`

---

## ✅ Soluciones Implementadas

### Fix Final: Exponer la variable en window

**Archivo:** `games/master-sequence/game.js` (línea 810)

```javascript
// Preservar estadísticas de la sesión
lastSessionStats = {
    level: gameState.currentLevel,
    score: gameState.score,
    lives: gameState.lives,
    streak: gameState.perfectStreak,
    sequenceLength: gameState.masterSequence.length,  // ✅ Secuencia acumulativa
    totalTimeMs: totalTimeMs
};

// ✅ CRÍTICO: Exponer en window para que leaderboard-integration.js pueda acceder
window.lastSessionStats = lastSessionStats;

console.log('📊 Last session stats saved:', lastSessionStats);
console.log('✅ [DEBUG] window.lastSessionStats exposed:', window.lastSessionStats);
```

---

## 🎯 Resultado Final

### Antes del Fix:
```
RANK #17: youGupo | 519 | 1 | 6 Cuadrante Derecho | 1:21
                          ↑ Incorrecto (debería ser 6)
```

### Después del Fix:
```
RANK #17: youGupo | 519 | 6 | 6 Cuadrante Derecho | 1:21
                          ✅ Correcto!
```

### Logs Correctos:
```
📊 Last session stats saved: {sequenceLength: 6, ...}
✅ window.lastSessionStats exposed: {sequenceLength: 6, ...}
🔍 [DEBUG] window.lastSessionStats: {sequenceLength: 6, ...}  ← Ya NO es undefined
   - sequenceLength: 6  ← Valor correcto
```

---

## 📚 Lecciones Aprendidas (Master Sequence)

### 1. Variables Locales vs Globales

Si una variable necesita ser compartida entre módulos:
- ✅ **Opción 1:** Exponerla en `window`
- ✅ **Opción 2:** Exportarla correctamente con ES6 modules
- ❌ **Incorrecto:** Asumir que estará disponible automáticamente

```javascript
// ❌ MAL: Variable local
let myData = { value: 123 };

// ✅ BIEN: Expuesta globalmente
window.myData = { value: 123 };
```

### 2. Debugging de Variables entre Módulos

Cuando una variable "desaparece" entre archivos:
1. Verificar que esté expuesta en `window` o exportada
2. Agregar logs ANTES y DESPUÉS de acceder a la variable
3. Verificar el scope y el contexto de ejecución

### 3. Defaulting de Valores

```javascript
// Esto puede ocultar bugs:
const value = stats.sequenceLength || 1;  // Si stats es {}, devuelve 1

// Mejor logging:
console.log('stats:', stats);  // Ver si stats existe
console.log('stats.sequenceLength:', stats.sequenceLength);  // Ver el valor
const value = stats.sequenceLength || 1;
```

### 4. Usar masterSequence en Juegos Acumulativos

En juegos tipo "Simon Says" donde la secuencia crece:
- `gameState.sequence` = Copia temporal del nivel actual
- `gameState.masterSequence` = **Secuencia acumulativa completa** ✅

Siempre usar `masterSequence.length` para el tracking de progreso.

---

## 🚨 Checklist para Debugging (Actualizado)

Agregar estos checks al debugging anterior:

- [ ] **Variables Compartidas:** ¿La variable está expuesta en `window`?
  - Verificar: `console.log('window.myVar:', window.myVar)`

- [ ] **Scope:** ¿Las variables locales están accesibles desde otros módulos?
  - Si no: Exponer en `window` o exportar correctamente

- [ ] **Defaults:** ¿Los valores por defecto ocultan el problema real?
  - Verificar qué sucede cuando la variable es `undefined`

- [ ] **Secuencias Acumulativas:** ¿Se usa la secuencia correcta?
  - `sequence` vs `masterSequence`
  - Verificar cuál contiene el historial completo

---

## 📝 Commits Relacionados (Master Sequence)

1. `e3ef596` - feat: Add custom leaderboard for Master Sequence with time tracking
2. `f98207a` - fix: Use masterSequence.length for accurate sequence length
3. `852b188` - debug: Add detailed console logs for length tracking
4. `e1d9cda` - debug: Add detailed metadata inspection logs
5. `950aa66` - fix: Expose lastSessionStats to window for leaderboard integration ✅

---

## 🎓 Comparación de Bugs

| Aspecto | Knight Quest | Master Sequence |
|---------|-------------|-----------------|
| **Síntoma** | Columnas BOARD/SQUARES con "-" | Columna LENGTH siempre "1" |
| **Causa** | Metadata no en SELECT/response | Variable no expuesta en window |
| **Capa afectada** | Backend (API) | Frontend (scope de variables) |
| **Tiempo debug** | 3 horas | 4 horas |
| **Dificultad** | Alta | Alta |
| **Lección clave** | Verificar TODOS los SELECTs | Exponer variables compartidas |

---

---

# ============================================
# CASO 3: MEMORY MATRIX - PATRÓN REPETITIVO DE VARIABLES NO EXPUESTAS
# ============================================

## 🐛 Síntomas del Problema

### Comportamiento Observado

Memory Matrix tuvo **7 bugs diferentes** durante la integración del leaderboard, la mayoría relacionados con el mismo patrón que NO fue reconocido a tiempo.

**Columnas esperadas:**
- RANK | PLAYER 🇦🇷 | SCORE | **LEVEL** | **SUCCESS** | **ERRORS** | **HINTS** | **TIME**

**Problemas encontrados:**
1. ✅ HINTS mostraba "42" cuando el jugador nunca usó hints
2. ✅ Scoring no consideraba nivel ni tiempo
3. ✅ file:// protocol causaba error de API
4. ✅ Juego se quedaba en pausa después de cerrar modal
5. ✅ TIME mostraba "-" para todos los scores
6. ✅ Modal no se cerraba después de submit
7. ✅ SUCCESS y ERRORS mostraban "0" cuando el modal mostraba valores correctos

---

## 🔍 Diagnóstico del Problema

### Bug #1: Hints Calculation (Fórmula Incorrecta)

**Síntoma:** Game Over modal mostraba "Hints Used: 42" cuando el jugador NUNCA presionó el botón de hint.

**Código problemático (leaderboard-integration.js, línea ~430):**
```javascript
const hintsPerLevel = 6;  // Cada nivel da 6 hints
const totalHintsUsed = (hintsPerLevel * 8) - hintsLeft;
// Si está en nivel 3 con hintsLeft=6:
// (6 × 8) - 6 = 48 - 6 = 42 ❌ INCORRECTO
```

**Causa raíz:** La fórmula asumía que el jugador había completado los 8 niveles, cuando en realidad solo había jugado 3 niveles.

**Fix aplicado:**
```javascript
// CREAR contador global en game.js (línea 32)
let totalHintsUsedSession = 0; // ✅ Trackear hints realmente usados

// INCREMENTAR cuando se usa hint (línea 1085)
function showHint() {
    hintsLeft--;
    totalHintsUsedSession++; // ✅ Incrementar contador
    updateHintButton();
}

// EXPONER a window (líneas 37-39)
Object.defineProperty(window, 'totalHintsUsedSession', {
    get: () => totalHintsUsedSession
});

// USAR en leaderboard-integration.js (línea 430)
const totalHintsUsed = window.totalHintsUsedSession || 0; // ✅ Correcto
```

---

### Bug #2: Scoring Formula (No Considera Nivel ni Tiempo)

**Síntoma:** La puntuación solo consideraba successful/failed attempts y hints, ignorando el nivel alcanzado y el tiempo.

**Código problemático:**
```javascript
score = (successful × 1000) - (failed × 100) - (hints × 50)
// No premia llegar a niveles altos
// No premia velocidad
```

**Fix aplicado:**
```javascript
// Nueva fórmula multi-factor
const levelScore = levelReached * 2000;  // 2000 pts por nivel
const successScore = totalSuccessful * 200;  // 200 pts por acierto
const failuresPenalty = totalFailed * 300;  // -300 pts por error
const hintsPenalty = totalHintsUsed * 100;  // -100 pts por hint

// Time bonus: max 1000 pts por completar en < 5 min
const timeLimitMs = 5 * 60 * 1000;  // 5 minutos
const timeBonus = Math.max(0, Math.min(1000,
    1000 - Math.floor(Math.max(0, totalTimeMs - timeLimitMs) / 60000) * 100
));

const calculatedScore = levelScore + successScore - failuresPenalty - hintsPenalty + timeBonus;
const finalScore = Math.max(1, calculatedScore);  // Mínimo 1
```

---

### Bug #3: file:// Protocol Error (API Local)

**Síntoma:** Al abrir el juego localmente con `file://`, el leaderboard mostraba "Failed to fetch".

**Causa raíz:** `API_BASE_URL` no manejaba el protocolo `file://`, intentaba usar URL relativa que falla con CORS.

**Fix aplicado (js/leaderboard-api.js, líneas 43-47):**
```javascript
// ✅ file:// protocol (desarrollo local sin servidor) → apuntar a Vercel
if (protocol === 'file:') {
    console.log('[leaderboard-api] Running from file:// → using Vercel API');
    return 'https://chessarcade.vercel.app/api/scores';
}
```

---

### Bug #4: Game Stuck After Modal Close (Estado No Reseteado)

**Síntoma:** Después de cerrar el modal de Game Over, el jugador presionaba "Play" pero el juego no iniciaba. Necesitaba hacer F5 refresh.

**Causa raíz:** `gameState` no se reseteaba a 'idle' después de cerrar el modal.

**Fix aplicado (game.js):**
```javascript
// CREAR función setGameState (líneas 2413-2424)
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

// LLAMAR al cerrar modal (leaderboard-integration.js, líneas 500-504)
// ✅ CRITICAL: Reset game state to 'idle' so player can start again
if (window.setGameState) {
    window.setGameState('idle');
    console.log('✅ Game state reset to idle');
}
```

---

### Bug #5: TIME Column Showing "-" (Variables No Expuestas)

**Síntoma:** La columna TIME mostraba "-" para TODOS los scores, incluso los recién jugados.

**Logs observados:**
```javascript
🕐 [DEBUG] Time tracking variables: {
    globalElapsedTime: undefined,  // ❌ No accesible
    globalStartTime: undefined      // ❌ No accesible
}
🕐 [DEBUG] Calculated totalTimeMs: 0  // ❌ Siempre 0
```

**Causa raíz:** `globalElapsedTime` y `globalStartTime` eran variables locales en `game.js`, NO expuestas a `window`.

```javascript
// EN game.js (línea 60):
let globalElapsedTime = 0;        // ❌ Variable LOCAL
let globalStartTime = null;       // ❌ Variable LOCAL

// EN leaderboard-integration.js (línea 177):
let totalTimeMs = window.globalElapsedTime || 0;  // undefined || 0 = 0 ❌
```

**Fix aplicado (game.js, líneas 60-65):**
```javascript
// ✅ EXPONER variables a window
Object.defineProperty(window, 'globalElapsedTime', {
    get: () => globalElapsedTime
});
Object.defineProperty(window, 'globalStartTime', {
    get: () => globalStartTime
});
```

---

### Bug #6: Modal Not Closing After Submit (Permite Múltiples Submits)

**Síntoma:** Después de enviar el score, el modal se quedaba abierto. El jugador podía cambiar el nombre y enviar otro score.

**Causa raíz:** No había lógica de auto-close después de submit exitoso.

**Fix aplicado (leaderboard-integration.js):**
```javascript
// Después de submit exitoso
showToast(`Score submitted! Rank #${result.rank} of ${result.totalPlayers}`, 'success');

submitBtn.disabled = true;  // Deshabilitar botón
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

---

### Bug #7: SUCCESS and ERRORS Showing 0 (Variables No Expuestas) 🚨 CRÍTICO

**Síntoma:** El modal de Game Over mostraba "2 successful, 5 failed" correctamente, pero el leaderboard mostraba "0" para ambas columnas.

**Este fue el bug MÁS FRUSTRANTE porque era EL MISMO PATRÓN del Bug #5 y NO fue reconocido.**

**Logs observados:**
```javascript
📊 [DEBUG] Reading game stats from window: {
    successfulAttempts: undefined,  // ❌ No accesible
    failedAttempts: undefined,      // ❌ No accesible
    currentLevel: undefined         // ❌ No accesible
}

📊 [DEBUG] Final values to submit: {
    totalSuccessful: 0,  // undefined || 0 = 0 ❌
    totalFailed: 0,      // undefined || 0 = 0 ❌
    levelReached: 1      // undefined || 1 = 1 ❌
}
```

**Causa raíz (MISMO PATRÓN):** `successfulAttempts`, `failedAttempts`, `currentLevel` eran variables locales NO expuestas.

```javascript
// EN game.js (líneas ~20-22):
let successfulAttempts = 0;   // ❌ Variable LOCAL
let failedAttempts = 0;       // ❌ Variable LOCAL
let currentLevel = 1;         // ❌ Variable LOCAL

// EN leaderboard-integration.js (líneas 425-427):
const totalSuccessful = window.successfulAttempts || 0;  // undefined || 0 = 0 ❌
const totalFailed = window.failedAttempts || 0;          // undefined || 0 = 0 ❌
const levelReached = window.currentLevel || 1;           // undefined || 1 = 1 ❌
```

**Fix aplicado (game.js, líneas 27-36):**
```javascript
// ✅ EXPONER las 3 variables a window
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

---

## ✅ Patrón Identificado (DEMASIADO TARDE)

### El Patrón Repetitivo

**6 variables NO expuestas a window:**
1. `totalHintsUsedSession` (Bug #1) ✅ Fixed
2. `globalElapsedTime` (Bug #5) ✅ Fixed
3. `globalStartTime` (Bug #5) ✅ Fixed
4. `currentLevel` (Bug #7) ✅ Fixed
5. `successfulAttempts` (Bug #7) ✅ Fixed
6. `failedAttempts` (Bug #7) ✅ Fixed

**TODOS seguían el mismo patrón:**

```javascript
// ❌ PROBLEMA: Variable local en game.js
let myVariable = 0;

// ❌ INTENTO DE ACCESO: desde leaderboard-integration.js
const value = window.myVariable || defaultValue;  // undefined → usa default

// ✅ SOLUCIÓN: Exponer a window
Object.defineProperty(window, 'myVariable', {
    get: () => myVariable
});
```

### ¿Por Qué No Se Reconoció Antes?

**Feedback del usuario:**
- "sigue igual, debes poner mas console log para saber donde esta el problema"
- **"hay algo que estas dando por sentado y no es asi"** ← Asumía que las variables estaban expuestas
- "si jugue, de hecho 00_TEST es el nombre que puse" ← No reconocí que había jugado
- "no funcionan las columnas SUCCESS y ERRORS, muestra cero, pero cometí 5 errores... **mira el modal, ahi si esta bien**" ← KEY INSIGHT que debió activar el patrón
- "Por fin!!! funciono OK"
- **"Como no te diste cuenta antes si era el mismo error?"** ← Frustración justificada

**Lección crítica:** Después de encontrar que `globalElapsedTime` no estaba expuesto (Bug #5), debí verificar TODAS las otras variables inmediatamente, no esperar a que fallaran una por una.

---

## 🎯 Tabla Comparativa de Bugs

| Bug # | Síntoma | Causa Raíz | Patrón | Tiempo Debug |
|-------|---------|------------|--------|--------------|
| 1 | Hints = 42 | Fórmula + variable no expuesta | ✅ Variable scope | 30 min |
| 2 | Score sin nivel/tiempo | Fórmula incompleta | Lógica de negocio | 20 min |
| 3 | file:// error | Protocol no manejado | Edge case | 15 min |
| 4 | Juego en pausa | Estado no reseteado | State management | 25 min |
| 5 | TIME = "-" | 2 variables no expuestas | ✅ Variable scope | 45 min |
| 6 | Modal no cierra | Falta auto-close | UX flow | 10 min |
| 7 | SUCCESS/ERRORS = 0 | 3 variables no expuestas | ✅ Variable scope | 90 min |

**Total debug time:** ~4 horas
**Tiempo que se pudo ahorrar si se reconoció el patrón:** ~2 horas

---

## 📚 Lecciones Aprendidas (Memory Matrix)

### 1. Reconocer Patrones de Bugs Repetitivos

**Cuando encuentres un bug de "variable no expuesta", INMEDIATAMENTE:**
1. Listar TODAS las variables que `leaderboard-integration.js` necesita
2. Verificar una por una que estén expuestas en `window`
3. NO esperar a que fallen una por una

**Checklist de variables comunes:**
- [ ] Variables de estado del juego (`currentLevel`, `gameState`)
- [ ] Contadores de estadísticas (`successfulAttempts`, `failedAttempts`)
- [ ] Temporizadores (`globalElapsedTime`, `globalStartTime`)
- [ ] Contadores especiales (`totalHintsUsedSession`, `streak`)

### 2. Debugging Logs Estratégicos

**Agregar logs en TRES lugares:**
```javascript
// 1. DONDE SE CREA (game.js)
console.log('📊 Variable created:', { myVariable });

// 2. DONDE SE EXPONE (game.js)
console.log('✅ Variable exposed to window:', window.myVariable);

// 3. DONDE SE LEE (leaderboard-integration.js)
console.log('🔍 Reading from window:', {
    raw: window.myVariable,
    withDefault: window.myVariable || defaultValue
});
```

### 3. Modal Mostraba Valores Correctos = Smoking Gun

**En Bug #7, el modal mostraba:**
```javascript
Modal: "2 successful, 5 failed"  ✅ Correcto
Leaderboard: "0 successful, 0 failed"  ❌ Incorrecto
```

**Esto debió indicar INMEDIATAMENTE:**
- ✅ Las variables existen y tienen valores correctos
- ❌ NO están accesibles desde otro módulo
- → Problema de scope/exposición a window

### 4. Object.defineProperty para Encapsulación

**Mejor práctica:**
```javascript
// ❌ MAL: Exponer directamente (se puede sobrescribir)
window.myVariable = myVariable;

// ✅ BIEN: Usar getter (solo lectura)
Object.defineProperty(window, 'myVariable', {
    get: () => myVariable
});

// Ventaja: Si alguien intenta window.myVariable = 999, el valor real no cambia
```

### 5. Variables con Defaults Ocultan Bugs

```javascript
// ❌ OCULTA EL BUG:
const value = window.myVariable || 0;  // Si undefined, usa 0 silenciosamente

// ✅ MEJOR PARA DEBUGGING:
console.log('window.myVariable:', window.myVariable);  // undefined es visible
const value = window.myVariable || 0;
console.log('final value:', value);  // 0 es visible
```

---

## 🚨 Checklist para Memory Matrix (y Juegos Futuros)

### Pre-Implementation Checklist:
- [ ] Listar TODAS las variables que el leaderboard necesita
- [ ] Verificar que cada variable esté expuesta a `window`
- [ ] Agregar logs de debug en creación, exposición y lectura
- [ ] Probar con datos reales antes de declarar "listo"

### Debugging Checklist (cuando algo falla):
- [ ] Ver el modal (si existe) - ¿muestra valores correctos?
- [ ] Si modal está correcto pero leaderboard no → scope issue
- [ ] Agregar `console.log('window.X:', window.X)` para CADA variable
- [ ] Buscar `undefined` en los logs
- [ ] Aplicar el mismo fix a TODAS las variables afectadas a la vez

### Post-Fix Checklist:
- [ ] Probar submit desde Victory modal
- [ ] Probar submit desde Game Over modal
- [ ] Verificar que TODAS las columnas muestren datos
- [ ] Verificar que el modal se cierre automáticamente
- [ ] Verificar que se pueda jugar de nuevo sin F5

---

## 📝 Commits Relacionados (Memory Matrix)

1. `fix: Correct hints calculation using session counter` - Bug #1
2. `feat: Multi-factor scoring formula with level and time bonus` - Bug #2
3. `fix: Handle file:// protocol for local development` - Bug #3
4. `fix: Reset game state to idle after modal close` - Bug #4
5. `fix: Expose globalElapsedTime and globalStartTime to window` - Bug #5
6. `feat: Auto-close modal 2 seconds after score submission` - Bug #6
7. `fix: Expose currentLevel, successfulAttempts, failedAttempts to window` - Bug #7

---

## 🎓 Conclusión

Memory Matrix fue el caso más complejo de los tres:

| Aspecto | Knight Quest | Master Sequence | Memory Matrix |
|---------|--------------|-----------------|---------------|
| **Bugs encontrados** | 3 | 1 | **7** |
| **Patrón principal** | Backend SELECT | Variable scope | **Variable scope (×6)** |
| **Tiempo total** | 3 horas | 4 horas | **4 horas** |
| **Frustración** | Media | Media | **Alta** |
| **Lección clave** | Verificar TODOS los SELECTs | Exponer variables | **Reconocer patrones** |

**El error principal:** No reconocer que Bugs #1, #5 y #7 eran EL MISMO PATRÓN repetido 6 veces.

**La solución correcta era:** Después de Bug #1 (hints), crear una lista de TODAS las variables necesarias y exponerlas TODAS de una vez, no una por una a medida que fallaban.

**Beneficio de documentar esto:** En el próximo juego, si encuentro que UNA variable no está expuesta, inmediatamente verificaré TODAS las otras variables necesarias.

---

**Documento creado:** 16 Noviembre 2025
**Autor:** Claude Code (con debugging de FAS)
**Juegos afectados:** Knight Quest, Master Sequence, Memory Matrix
**Estado:** ✅ Todos Resueltos
