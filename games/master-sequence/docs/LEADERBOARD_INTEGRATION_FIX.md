# Master Sequence - Leaderboard Integration Fix

## 📋 Resumen

Este documento describe el bug encontrado al implementar el leaderboard personalizado de Master Sequence, donde la columna LENGTH mostraba "1" en lugar del valor correcto.

**Síntoma:** Columna LENGTH siempre mostraba "1"
**Causa:** Variable `lastSessionStats` no expuesta en `window`
**Tiempo de resolución:** ~4 horas
**Fecha:** 16 Noviembre 2025
**Estado:** ✅ Resuelto

---

## 🎮 Contexto: Leaderboard de Master Sequence

Master Sequence es un juego de memoria tipo "Simon Says" donde:
- La secuencia crece **acumulativamente** cada nivel
- Nivel 1: 1 casilla → `masterSequence.length = 1`
- Nivel 2: Se agrega 1 casilla → `masterSequence.length = 2`
- Nivel 6: Se agrega 1 casilla → `masterSequence.length = 6`

### Columnas del Leaderboard:

**RANK | PLAYER 🇦🇷 | SCORE | LENGTH | LEVEL | TIME**

- **LENGTH**: Longitud de la secuencia acumulativa final
- **LEVEL**: Nivel alcanzado con nombre (ej: "6 Cuadrante Derecho")
- **TIME**: Tiempo total de la partida (MM:SS)

---

## 🐛 El Problema

### Síntomas

Todos los scores mostraban **LENGTH = 1**, sin importar a qué nivel llegara el jugador:

```
RANK #11: testlll...   | 1,053 | 1 | 6 Cuadrante Derecho | -
RANK #12: AAARRRRR...  | 1,053 | 1 | 6 Cuadrante Derecho | -
RANK #15: Hoy domingo  |   791 | 1 | 6 Cuadrante Derecho | -
                              ↑ Debería ser 6!
```

### Comportamiento Esperado vs Real

| Nivel | LENGTH esperado | LENGTH mostrado |
|-------|----------------|-----------------|
| 1     | 1              | 1 ✅            |
| 3     | 3              | 1 ❌            |
| 5     | 5              | 1 ❌            |
| 6     | 6              | 1 ❌            |

---

## 🔍 Proceso de Debugging

### Intento #1: gameState.sequence vs masterSequence

**Hipótesis:** Estábamos usando la variable incorrecta.

**Código original (game.js línea 805):**
```javascript
lastSessionStats = {
    sequenceLength: gameState.sequence.length  // ❌ Copia temporal
};
```

**Fix intentado:**
```javascript
lastSessionStats = {
    sequenceLength: gameState.masterSequence.length  // ✅ Secuencia acumulativa
};
```

**Resultado:** Seguía mostrando "1" ❌

---

### Intento #2: Agregar Logs para Rastrear

**Se agregaron logs en 3 lugares:**

1. **game.js (gameOver):**
   ```javascript
   console.log('📊 Last session stats saved:', lastSessionStats);
   console.log('🔍 [DEBUG] Sequence length saved:', lastSessionStats.sequenceLength);
   ```

2. **leaderboard-integration.js (submitGameOverScore):**
   ```javascript
   console.log('🔍 [DEBUG] window.lastSessionStats:', window.lastSessionStats);
   console.log('🔍 [DEBUG] Extracted values:', { sequenceLength, streak, totalTimeMs });
   ```

3. **leaderboard-ui.js (renderMasterSequenceScoreRow):**
   ```javascript
   console.log('🔍 [DEBUG] score.metadata:', score.metadata);
   console.log('   - score.metadata.sequence_length:', score.metadata.sequence_length);
   ```

**Resultado de los logs:**

```javascript
// ✅ EN GAME.JS:
📊 Last session stats saved: {level: 6, score: 791, sequenceLength: 6, ...}
🔍 [DEBUG] Sequence length saved: 6

// ❌ 20 SEGUNDOS DESPUÉS EN LEADERBOARD-INTEGRATION.JS:
🔍 [DEBUG] window.lastSessionStats: undefined
🔍 [DEBUG] Extracted values: { sequenceLength: 1, ... }  ← Default porque stats es {}
```

**¡EUREKA!** La variable se guardaba correctamente pero no se podía leer desde otro módulo.

---

### Intento #3: Causa Raíz Identificada

**El problema:** `lastSessionStats` era una variable **LOCAL** en el scope de `game.js`

```javascript
// games/master-sequence/game.js (línea 69)
let lastSessionStats = {  // ❌ Variable LOCAL del módulo
    level: 1,
    score: 0,
    lives: 5,
    streak: 0,
    sequenceLength: 1
};
```

```javascript
// games/master-sequence/leaderboard-integration.js (línea 79)
const stats = window.lastSessionStats || {};  // ❌ Busca en window pero no existe!
```

**¿Por qué fallaba?**

- `game.js` y `leaderboard-integration.js` son **módulos separados**
- `lastSessionStats` estaba en el scope local de `game.js`
- `window.lastSessionStats` era **undefined**
- El código defaulteaba a `sequenceLength: 1` (línea 82)

```javascript
const sequenceLength = stats.sequenceLength || 1;  // stats = {}, entonces usa 1
```

---

## ✅ La Solución

### Fix Final: Exponer en window

**Archivo:** `games/master-sequence/game.js` (línea 810)

```javascript
function gameOver() {
    // ...

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

    // ...
}
```

---

## 🎯 Resultado

### Antes del Fix:

```
RANK #17: youGupo | 519 | 1 | 6 Cuadrante Derecho | 1:21
                        ↑ Siempre 1 (incorrecto)
```

### Después del Fix:

```
RANK #17: youGupo | 519 | 6 | 6 Cuadrante Derecho | 1:21
                        ✅ Valor correcto!
```

### Logs Correctos:

```javascript
// game.js:
📊 Last session stats saved: {sequenceLength: 6, ...}
✅ window.lastSessionStats exposed: {sequenceLength: 6, ...}

// leaderboard-integration.js:
🔍 [DEBUG] window.lastSessionStats: {sequenceLength: 6, ...}  ← Ya NO es undefined
   - sequenceLength: 6  ← Valor correcto

// leaderboard-ui.js:
🔍 [DEBUG] score.metadata.sequence_length: 6  ← Renderiza correctamente
```

---

## 📚 Lecciones Aprendidas

### 1. Variables entre Módulos

Si necesitas compartir una variable entre archivos JavaScript:

**❌ Incorrecto:**
```javascript
// modulo1.js
let myData = { value: 123 };

// modulo2.js
console.log(myData);  // ❌ ReferenceError: myData is not defined
```

**✅ Correcto (Opción 1 - window):**
```javascript
// modulo1.js
let myData = { value: 123 };
window.myData = myData;  // ✅ Exponer en window

// modulo2.js
console.log(window.myData);  // ✅ Funciona
```

**✅ Correcto (Opción 2 - ES6 Modules):**
```javascript
// modulo1.js
export const myData = { value: 123 };

// modulo2.js
import { myData } from './modulo1.js';
console.log(myData);  // ✅ Funciona
```

### 2. Debugging con Logs Estratégicos

Cuando una variable "desaparece":

```javascript
// ✅ Log DONDE SE CREA:
myVariable = { data: 123 };
console.log('✅ Variable created:', myVariable);

// ✅ Log DONDE SE EXPONE:
window.myVariable = myVariable;
console.log('✅ Variable exposed to window:', window.myVariable);

// ✅ Log DONDE SE LEE:
console.log('🔍 Reading from window:', window.myVariable);
const data = window.myVariable || {};
console.log('🔍 Final data:', data);
```

### 3. Valores Default Pueden Ocultar Bugs

```javascript
// ❌ Esto oculta el problema:
const value = stats.sequenceLength || 1;  // Si stats = {}, devuelve 1 silenciosamente

// ✅ Mejor con logging:
console.log('stats:', stats);
console.log('stats.sequenceLength:', stats.sequenceLength);
const value = stats.sequenceLength || 1;
console.log('Final value:', value);
```

### 4. masterSequence vs sequence

En Master Sequence:
- **`gameState.sequence`** = Copia temporal del nivel actual
- **`gameState.masterSequence`** = Secuencia acumulativa COMPLETA ✅

**Siempre usar `masterSequence` para:**
- Tracking de progreso
- Estadísticas finales
- Leaderboard

---

## 🚨 Checklist para Implementar Leaderboards

Si implementas un leaderboard personalizado en otro juego:

- [ ] **Backend:** ¿La metadata se guarda en la base de datos?
  - Verificar en `api/scores/index.js`

- [ ] **Backend:** ¿La metadata está en TODOS los SELECT queries?
  - Verificar en `api/scores/leaderboard.js`

- [ ] **Backend:** ¿La metadata se parsea de string a object?
  - Verificar `JSON.parse()` en el response mapping

- [ ] **Frontend:** ¿Las estadísticas se guardan correctamente?
  - Agregar logs cuando se actualizan

- [ ] **Frontend:** ¿Las estadísticas están expuestas en `window`?
  - `window.lastSessionStats = lastSessionStats`

- [ ] **Frontend:** ¿El código de integración puede leerlas?
  - Verificar `window.lastSessionStats` no sea `undefined`

- [ ] **Frontend:** ¿Las funciones de rendering personalizadas existen?
  - `renderMyGameLeaderboardTable()`
  - `renderMyGameScoreRow()`

- [ ] **Frontend:** ¿La lógica condicional llama a las funciones correctas?
  - Verificar en `showLeaderboardModal()`

---

## 📝 Commits Relacionados

1. `e3ef596` - feat: Add custom leaderboard for Master Sequence with time tracking
2. `f98207a` - fix: Use masterSequence.length for accurate sequence length
3. `852b188` - debug: Add detailed console logs for length tracking
4. `e1d9cda` - debug: Add detailed metadata inspection logs
5. **`950aa66` - fix: Expose lastSessionStats to window for leaderboard integration** ✅

---

## 🔗 Referencias

- Documento principal: `docs/LEADERBOARD_METADATA_FIX.md`
- Caso similar (Knight Quest): Ver sección "CASO 1" en documento principal
- Future enhancements: `games/master-sequence/docs/FUTURE_ENHANCEMENTS.md`

---

**Documento creado:** 16 Noviembre 2025
**Autor:** Claude Code (con debugging de FAS)
**Estado:** ✅ Resuelto
**Versión del juego:** 2.0.0
