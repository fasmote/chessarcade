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

**Documento creado:** 16 Noviembre 2025
**Autor:** Claude Code (con debugging de FAS)
**Juegos afectados:** Knight Quest, Master Sequence
**Estado:** ✅ Ambos Resueltos
