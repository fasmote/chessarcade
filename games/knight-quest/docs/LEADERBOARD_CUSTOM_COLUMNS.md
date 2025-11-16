# Knight Quest - Leaderboard con Columnas Personalizadas

## 📋 Overview

Knight Quest tiene un leaderboard personalizado que muestra información específica del juego en lugar del leaderboard genérico usado por otros juegos.

**Columnas Personalizadas:**
- **BOARD:** Tamaño del tablero (3x4, 6x6, 8x8, 10x10)
- **SQUARES:** Casillas visitadas/total (ej: 12/12, 45/64)
- **TIME:** Tiempo en formato MM:SS

**Bandera:** Se muestra inline junto al nombre del jugador (no en columna separada)

---

## 🎯 Comparación: Genérico vs Knight Quest

### Leaderboard Genérico (otros juegos)

| RANK | PLAYER | SCORE | LEVEL | TIME | COUNTRY |
|------|--------|-------|-------|------|---------|
| #1 | Player1 | 1,000 | EASY | 0:30 | 🇺🇸 |

**Características:**
- 6 columnas fijas
- LEVEL muestra valores de texto (EASY, HARD, etc.)
- COUNTRY como columna separada
- No muestra información específica del juego

### Leaderboard Knight Quest (personalizado)

| RANK | PLAYER | SCORE | BOARD | SQUARES | TIME |
|------|--------|-------|-------|---------|------|
| 🥇 #1 | Player1 🇺🇸 | 19,280 | **3x4** | **12/12** | **0:12** |
| 🥈 #2 | Player2 🇦🇷 | 68,410 | **8x8** | **64/64** | **0:39** |

**Características:**
- 6 columnas (igual cantidad pero diferentes)
- BOARD muestra tamaño del tablero
- SQUARES muestra progreso (visitadas/total)
- Bandera inline con el nombre
- Información específica del juego

---

## 🏗️ Arquitectura de la Implementación

### 1. Frontend - Funciones Personalizadas

**Archivo:** `js/leaderboard-ui.js`

#### Función: `renderKnightQuestScoreRow(score, highlightTop3)`

Renderiza una fila individual del leaderboard.

**Características especiales:**
- Bandera inline con el nombre del jugador
- Lee `score.metadata.board_size` para columna BOARD
- Lee `score.metadata.visited_squares` y `score.metadata.total_squares` para SQUARES
- Formatea time_ms como MM:SS

**Código:**
```javascript
function renderKnightQuestScoreRow(score, highlightTop3 = true) {
  const rowClasses = ['score-row'];
  if (highlightTop3 && score.rank <= 3) {
    rowClasses.push('top-three');
    rowClasses.push(`rank-${score.rank}`);
  }

  let rankDisplay = `#${score.rank}`;
  if (score.rank === 1) rankDisplay = '🥇 #1';
  else if (score.rank === 2) rankDisplay = '🥈 #2';
  else if (score.rank === 3) rankDisplay = '🥉 #3';

  const playerName = score.player_name || 'UNKNOWN';
  const initials = playerName.substring(0, 3);
  const rest = playerName.substring(3);

  // Bandera inline (al lado del nombre)
  let flagHTML = '';
  if (score.country && score.country.code) {
    const countryCode = score.country.code.toLowerCase();
    const countryName = score.country.name || score.country.code;
    flagHTML = `
      <img
        src="https://flagcdn.com/16x12/${countryCode}.png"
        srcset="https://flagcdn.com/32x24/${countryCode}.png 2x,
                https://flagcdn.com/48x36/${countryCode}.png 3x"
        width="16"
        height="12"
        alt="${countryName}"
        title="${countryName}"
        class="country-flag"
        style="margin-left: 6px; vertical-align: middle;"
      >
    `;
  }

  const playerNameHTML = `<span class="player-initials">${initials}</span>${rest}${flagHTML}`;

  // BOARD (tamaño del tablero desde metadata, no desde level)
  const boardDisplay = (score.metadata && score.metadata.board_size)
    ? score.metadata.board_size
    : '-';

  // Score formateado con separadores de miles
  const scoreDisplay = score.score.toLocaleString('en-US');

  // SQUARES - casillas visitadas/total (desde metadata)
  let squaresDisplay = '-';
  if (score.metadata && score.metadata.visited_squares && score.metadata.total_squares) {
    squaresDisplay = `${score.metadata.visited_squares}/${score.metadata.total_squares}`;
  }

  // Time formateado
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
      <td class="level">${boardDisplay}</td>
      <td class="level">${squaresDisplay}</td>
      <td class="time">${timeDisplay}</td>
    </tr>
  `;
}
```

#### Función: `renderKnightQuestLeaderboardTable(scores)`

Renderiza la tabla completa con headers personalizados.

**Código:**
```javascript
function renderKnightQuestLeaderboardTable(scores) {
  const table = document.createElement('table');
  table.className = 'leaderboard-table';

  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th class="rank">Rank</th>
      <th class="player-name">Player</th>
      <th class="score">Score</th>
      <th class="level">Board</th>
      <th class="level">Squares</th>
      <th class="time">Time</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  if (scores.length === 0) {
    tbody.innerHTML = `
      <tr class="no-scores">
        <td colspan="6" class="text-center">
          No scores yet. Be the first! 🏆
        </td>
      </tr>
    `;
  } else {
    tbody.innerHTML = scores.map(score => renderKnightQuestScoreRow(score, true)).join('');
  }

  table.appendChild(tbody);

  return table;
}
```

#### Lógica Condicional en `showLeaderboardModal()`

**Ubicación:** `js/leaderboard-ui.js` línea ~618

```javascript
// Renderizar tabla (usar función específica para Knight Quest)
let table;
if (state.currentGame === 'knight-quest') {
  console.log('[DEBUG] Using Knight Quest custom leaderboard');
  table = renderKnightQuestLeaderboardTable(data.scores);
} else {
  console.log('[DEBUG] Using generic leaderboard');
  table = renderLeaderboardTable(data.scores, true);
}
contentArea.innerHTML = '';
contentArea.appendChild(table);
```

---

### 2. Game - Envío de Metadata

**Archivo:** `games/knight-quest/index.html`

#### Función: `submitKnightScore(playerNameInputId, submitBtnId)`

Esta función se usa tanto en el modal de Victoria como en el de Game Over.

**Metadata que se envía:**
```javascript
const result = await submitScore(
  'knight-quest',
  playerName,
  finalScore,
  {
    // NO enviamos 'level' porque el validador solo acepta NOVICE/INTERMEDIATE/etc
    // El board_size está en metadata y se muestra desde ahí en el leaderboard
    time_ms: elapsed * 1000,  // Tiempo en milisegundos para columna TIME
    metadata: {
      board_size: boardSize,           // "3x4", "6x6", "8x8", "10x10"
      moves: moves,                    // Número de movimientos realizados
      visited_squares: visited,        // Casillas visitadas
      total_squares: totalSquares,     // Total de casillas del tablero
      completion_percent: Math.round((visited / totalSquares) * 100),
      hints_used: 3 - gameState.hintsLeft
    }
  }
);
```

**Valores de ejemplo:**

Partida completa 3x4:
```json
{
  "time_ms": 12000,
  "metadata": {
    "board_size": "3x4",
    "moves": 12,
    "visited_squares": 12,
    "total_squares": 12,
    "completion_percent": 100,
    "hints_used": 0
  }
}
```

Partida incompleta 8x8:
```json
{
  "time_ms": 45000,
  "metadata": {
    "board_size": "8x8",
    "moves": 42,
    "visited_squares": 45,
    "total_squares": 64,
    "completion_percent": 70,
    "hints_used": 1
  }
}
```

---

### 3. Backend - API Configuration

**Archivo:** `api/scores/games-config.js`

```javascript
'knight-quest': {
  name: 'Knight Quest',
  max_score: 100000,
  max_time_ms: 1800000,   // 30 minutos máximo
  score_type: 'points',
  has_levels: true,       // Tiene niveles (board sizes)
  has_time: true          // Usa tiempo
}
```

**Nota importante:** Knight Quest NO envía el campo `level` porque el validador espera valores como NOVICE/INTERMEDIATE, pero Knight Quest usa tamaños de tablero (3x4, 6x6, etc.). Por eso `board_size` va en metadata.

---

### 4. Backend - Database Storage

**Schema:** La metadata se guarda en una columna JSONB

```sql
CREATE TABLE scores (
    -- ... otros campos
    metadata JSONB DEFAULT '{}',
    -- ...
);
```

**Ejemplo de fila en la base de datos:**

```sql
id  | game         | player_name  | score  | level | time_ms | metadata
----|--------------|--------------|--------|-------|---------|------------------------------------------
63  | knight-quest | Faaassmote!! | 68410  | NULL  | 39000   | {"board_size":"8x8","moves":64,"visited_squares":64,"total_squares":64,"completion_percent":100,"hints_used":0}
```

---

### 5. Backend - Leaderboard API Response

**Archivo:** `api/scores/leaderboard.js`

#### Importante: Parsear metadata de STRING a OBJECT

Postgres devuelve JSONB como string. El backend debe parsearlo:

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
    metadata: metadata,  // ✅ Objeto, no string
    created_at: score.created_at
  };
});
```

**Response JSON correcto:**
```json
{
  "success": true,
  "data": {
    "game": "knight-quest",
    "scores": [
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
    ]
  }
}
```

---

## 🔧 Cómo Funciona el Flujo Completo

### Flujo de Submit Score

1. **Usuario completa partida** (o no completa)
2. **Modal de Victoria/Game Over** se muestra
3. **Usuario ingresa nombre** y hace clic en "SUBMIT SCORE"
4. **`submitKnightScore()` calcula:**
   - `board_size`: del estado del juego
   - `moves`: cantidad de movimientos
   - `visited_squares`: casillas visitadas
   - `total_squares`: total de casillas del tablero
5. **`submitScore()` envía al backend:**
   ```javascript
   POST /api/scores
   {
     "game": "knight-quest",
     "player_name": "FAS",
     "score": 19280,
     "time_ms": 12000,
     "metadata": {
       "board_size": "3x4",
       "visited_squares": 12,
       "total_squares": 12,
       ...
     }
   }
   ```
6. **Backend guarda en DB:**
   - Convierte metadata a string: `JSON.stringify(metadata)`
   - Inserta en tabla `scores`
7. **Backend responde:**
   ```json
   {
     "success": true,
     "rank": 6,
     "totalPlayers": 17
   }
   ```
8. **Frontend muestra toast:** "Score submitted! Rank #6 of 17"

### Flujo de Mostrar Leaderboard

1. **Usuario hace clic en 🏆** (botón de leaderboard)
2. **`showLeaderboardModal('knight-quest')` se ejecuta**
3. **Frontend pide datos al backend:**
   ```javascript
   GET /api/scores/leaderboard?game=knight-quest&limit=50&offset=0
   ```
4. **Backend hace SELECT:**
   ```sql
   SELECT id, player_name, score, level, time_ms,
          country_code, country_name, metadata, created_at
   FROM scores
   WHERE game = 'knight-quest'
   ORDER BY score DESC
   LIMIT 50
   ```
5. **Backend parsea metadata** de string a objeto
6. **Backend responde** con JSON (ver ejemplo arriba)
7. **Frontend detecta game === 'knight-quest'**
8. **Frontend usa `renderKnightQuestLeaderboardTable()`**
9. **Tabla se renderiza con columnas personalizadas:**
   - BOARD: lee `score.metadata.board_size`
   - SQUARES: lee `score.metadata.visited_squares` y `total_squares`
   - TIME: formatea `score.time_ms`

---

## 📊 Datos Almacenados en Metadata

### Campos Obligatorios

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `board_size` | string | Tamaño del tablero | "3x4", "6x6", "8x8" |
| `visited_squares` | number | Casillas visitadas | 12, 45, 64 |
| `total_squares` | number | Total de casillas | 12, 64, 100 |

### Campos Opcionales

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `moves` | number | Número de movimientos | 12, 42, 64 |
| `completion_percent` | number | Porcentaje completado | 100, 70, 50 |
| `hints_used` | number | Pistas usadas | 0, 1, 2, 3 |

---

## 🎨 Estilos CSS

Las columnas usan las mismas clases CSS que el leaderboard genérico:

```css
.leaderboard-table th.rank { /* ... */ }
.leaderboard-table th.player-name { /* ... */ }
.leaderboard-table th.score { /* ... */ }
.leaderboard-table th.level { /* Usado para BOARD y SQUARES */ }
.leaderboard-table th.time { /* ... */ }

.country-flag {
  margin-left: 6px;
  vertical-align: middle;
}
```

---

## 🧪 Testing

### Test 1: Partida Completa 3x4

1. Jugar Knight Quest tablero 3x4
2. Completar las 12 casillas
3. Submit score con nombre "TEST_3x4"
4. Abrir leaderboard
5. **Verificar:**
   - ✅ BOARD: 3x4
   - ✅ SQUARES: 12/12
   - ✅ TIME: MM:SS (ej: 0:12)

### Test 2: Partida Incompleta 6x6

1. Jugar Knight Quest tablero 6x6
2. Visitar solo 20 de 36 casillas
3. Hacer Game Over (sin completar)
4. Submit score con nombre "TEST_6x6_incomplete"
5. Abrir leaderboard
6. **Verificar:**
   - ✅ BOARD: 6x6
   - ✅ SQUARES: 20/36
   - ✅ TIME: MM:SS

### Test 3: Partida Completa 8x8

1. Jugar Knight Quest tablero 8x8
2. Completar las 64 casillas
3. Submit score con nombre "TEST_8x8"
4. Abrir leaderboard
5. **Verificar:**
   - ✅ BOARD: 8x8
   - ✅ SQUARES: 64/64
   - ✅ TIME: MM:SS

### Test 4: Scores Antiguos sin Metadata

**Comportamiento esperado:**
- Scores creados antes de esta feature muestran "-" en BOARD y SQUARES
- Esto es correcto porque no tienen metadata en la base de datos

---

## 🐛 Troubleshooting

### Problema: BOARD y SQUARES muestran "-"

**Posibles causas:**

1. **Score antiguo:** Si el score fue creado antes de implementar metadata, es normal que muestre "-"

2. **Metadata no se envía:** Verificar en Network tab que el POST incluya metadata

3. **Metadata no se guarda:** Verificar que el backend guarde metadata en DB

4. **Metadata no se devuelve:** Verificar GET response en Network tab

5. **Metadata es string:** Verificar que el backend parsee JSON:
   ```javascript
   metadata = JSON.parse(score.metadata);
   ```

6. **Frontend usa función genérica:** Verificar console logs:
   ```
   [DEBUG] Using Knight Quest custom leaderboard
   ```

### Problema: Leaderboard muestra solo 4 columnas

**Causa:** El frontend está usando la función genérica en lugar de la personalizada.

**Solución:** Verificar que exista la lógica condicional en `showLeaderboardModal()`:
```javascript
if (state.currentGame === 'knight-quest') {
  table = renderKnightQuestLeaderboardTable(data.scores);
}
```

### Problema: Error "Cannot read property 'board_size' of undefined"

**Causa:** metadata es undefined o es un string en lugar de objeto.

**Solución:** Usar optional chaining:
```javascript
const boardDisplay = score.metadata?.board_size || '-';
```

---

## 📝 Historial de Cambios

### v1.0 (2025-11-16)
- ✅ Implementación inicial de columnas personalizadas
- ✅ BOARD muestra tamaño del tablero
- ✅ SQUARES muestra visitadas/total
- ✅ Bandera inline con nombre del jugador
- ✅ Fix de metadata parsing (string → object)

---

## 🔗 Referencias

- Documento general: `docs/LEADERBOARD_METADATA_FIX.md`
- Código frontend: `js/leaderboard-ui.js` (líneas 321-491, 618-628)
- Código game: `games/knight-quest/index.html` (función `submitKnightScore`)
- Código backend: `api/scores/leaderboard.js` (líneas 149-180)
- Schema DB: `api/scores/schema.sql`

---

**Documento creado:** 16 Noviembre 2025
**Versión:** 1.0
**Estado:** ✅ Implementado y funcionando
