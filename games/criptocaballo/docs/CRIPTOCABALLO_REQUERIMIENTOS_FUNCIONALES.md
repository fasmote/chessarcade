# CriptoCaballo - Requerimientos Funcionales
## Documento de Especificación Técnica

**Versión**: 1.0
**Fecha**: 2025-12-07
**Autor**: Definido por Usuario

---

## 1. GESTIÓN DE ESTADO Y PERSISTENCIA

### 1.1 Variables de Estado Globales

El juego mantiene las siguientes variables de estado:

| Variable | Tipo | Propósito | Scope |
|----------|------|-----------|-------|
| `userPath` | Array | Secuencia de movimientos del usuario | Por puzzle (fecha + tamaño) |
| `currentPath` | Array | Solución correcta del puzzle | Por puzzle |
| `globalTokens` | Array | Letras encriptadas en el tablero | Por puzzle |
| `messageCompletedCorrectly` | Boolean | Si el usuario resolvió correctamente | Por puzzle (fecha + tamaño) |
| `lastDecodedMessageOriginal` | String | Mensaje original con espacios | Por puzzle |
| `elapsedSeconds` | Number | Tiempo transcurrido | Por puzzle (fecha + tamaño) |
| `rows`, `cols` | Number | Tamaño del tablero actual | Global |
| `isShowingSpaces` | Boolean | Estado del botón ojito | Temporal |

### 1.2 Persistencia en localStorage

**Key format**: `criptocaballo_progress_{fecha}_{tamaño}`

**Ejemplo**: `criptocaballo_progress_2025-12-06_3x4`

**Datos guardados**:
```javascript
{
    userPath: Array,              // Movimientos del usuario
    elapsedSeconds: Number,        // Tiempo transcurrido
    messageCompletedCorrectly: Boolean,  // Si completó correctamente
    timestamp: Number              // Timestamp de guardado
}
```

**CRITICAL**: `lastDecodedMessageOriginal` NO se guarda en localStorage (se carga siempre desde Supabase).

---

## 2. COMPORTAMIENTO DEL TIMER

### 2.1 Inicio del Timer
- Timer inicia al hacer el PRIMER click en una celda
- Si hay progreso guardado y no está completado, continúa automáticamente

### 2.2 Persistencia del Timer

**REQUERIMIENTO CRÍTICO**: El timer DEBE persistir cuando:
1. Usuario cambia de tamaño de tablero (3x4 → 4x5 → 3x4)
2. Usuario cambia de fecha (06/12 → 07/12 → 06/12)

**Comportamiento esperado**:
```
Usuario:
1. Juega 3x4 del 06/12 por 30 segundos
2. Cambia a 4x5 del 06/12
3. Vuelve a 3x4 del 06/12
RESULTADO: Timer debe mostrar 00:00:30 y CONTINUAR contando
```

**Comportamiento esperado con cambio de fecha**:
```
Usuario:
1. Juega 3x4 del 06/12 por 30 segundos (no termina)
2. Cambia fecha a 07/12
3. Juega 3x4 del 07/12 por 15 segundos
4. Vuelve a fecha 06/12
RESULTADO: Timer debe mostrar 00:00:30 (del 06/12) y CONTINUAR
```

### 2.3 Reset del Timer

El timer se resetea SOLO cuando:
1. Usuario presiona botón "Reset Level" (ícono de refresh)
2. Usuario completa el puzzle correctamente

El timer NO se resetea cuando:
- Cambio de tamaño de tablero
- Cambio de fecha
- Reload de página (se carga desde localStorage)

---

## 3. COMPORTAMIENTO DEL BOTÓN OJITO ("Ver con Espacios")

### 3.1 Cuándo Debe Aparecer

El botón ojito SOLO debe mostrarse cuando:
- `messageCompletedCorrectly === true` (puzzle resuelto CORRECTAMENTE)

### 3.2 Cuándo NO Debe Aparecer

El botón ojito NO debe mostrarse cuando:
- Puzzle no está completado (faltan casillas)
- Puzzle está completado pero INCORRECTAMENTE (recorrido completo pero mal)
- Usuario acaba de presionar Reset

### 3.3 Comportamiento del Botón

**Estado inicial**: "Ver con Espacios" (ícono: eye regular)

**Al presionar**:
1. Muestra el mensaje original CON espacios
2. Cambia a "Ocultar Espacios" (ícono: eye-slash)

**Al presionar nuevamente**:
1. Oculta espacios (muestra mensaje sin espacios)
2. Vuelve a "Ver con Espacios"

**CRITICAL**: El botón SOLO debe funcionar si `messageCompletedCorrectly === true`

### 3.4 Casos de Error Actuales

❌ **BUG ACTUAL**: El ojito muestra el mensaje correcto incluso cuando el puzzle está mal resuelto.

**Root Cause**: `lastDecodedMessageOriginal` se setea al CARGAR el puzzle, no al COMPLETARLO correctamente.

**Fix Requerido**: `lastDecodedMessageOriginal` solo debe tener valor cuando `messageCompletedCorrectly === true`.

---

## 4. CAMBIO DE TAMAÑO DE TABLERO

### 4.1 Al Cambiar Tamaño (Misma Fecha)

**Secuencia**:
1. Guardar progreso actual (si `userPath.length > 0`)
2. Resetear variables de estado:
   - `userPath = []`
   - `currentPath = []`
   - `globalTokens = []`
   - `messageCompletedCorrectly = false`
   - `lastDecodedMessageOriginal = ''`
   - `isShowingSpaces = false`
3. Cargar puzzle del nuevo tamaño
4. Intentar cargar progreso desde localStorage (key: `{fecha}_{nuevoTamaño}`)
5. Si hay progreso, restaurar: `userPath`, `elapsedSeconds`, `messageCompletedCorrectly`

### 4.2 Ejemplo de Flujo

```
Usuario en 06/12:
1. Juega 3x4 por 30 seg (10 movimientos) - NO termina
2. Cambia a 4x5
   → Se guarda: criptocaballo_progress_2025-12-06_3x4 (30 seg, 10 mov)
3. Juega 4x5 por 15 seg (5 movimientos)
4. Vuelve a 3x4
   → Se carga: criptocaballo_progress_2025-12-06_3x4
   → Timer muestra: 00:00:30
   → Tablero muestra: 10 movimientos previos
   → Timer CONTINÚA contando desde 30
```

---

## 5. CAMBIO DE FECHA

### 5.1 Al Cambiar Fecha (Mismo Tamaño)

**Secuencia**:
1. **NO** guardar progreso actual (diferente puzzle)
2. Resetear variables de estado:
   - `userPath = []`
   - `messageCompletedCorrectly = false`
   - `isShowingSpaces = false`
   - `lastDecodedMessageOriginal = ''`
3. Cargar puzzle de la nueva fecha
4. Intentar cargar progreso desde localStorage (key: `{nuevaFecha}_{tamaño}`)
5. Si hay progreso, restaurar

### 5.2 Ejemplo de Flujo

```
Usuario en 3x4:
1. Juega 06/12 por 30 seg (10 movimientos) - NO termina
2. Cambia a 07/12
   → Se carga puzzle nuevo del 07/12
   → Timer resetea a 00:00:00
   → NO intenta cargar progreso del 06/12 (fecha diferente)
3. Juega 07/12 por 15 seg (5 movimientos)
4. Vuelve a 06/12
   → Se carga puzzle del 06/12
   → Intenta cargar: criptocaballo_progress_2025-12-06_3x4
   → Timer muestra: 00:00:30
   → Tablero muestra: 10 movimientos previos
```

**REQUERIMIENTO CRÍTICO**: Al volver a una fecha anterior, DEBE cargar el progreso guardado de esa fecha.

---

## 6. COMPLETAR PUZZLE

### 6.1 Verificación de Solución

Al completar el último movimiento (`userPath.length === rows * cols`):

1. Comparar `userPath` con `currentPath` posición por posición
2. Si **TODOS** los movimientos coinciden → `isCorrect = true`
3. Si **ALGUNO** no coincide → `isCorrect = false`

### 6.2 Si Puzzle Correcto (`isCorrect === true`)

1. Setear `messageCompletedCorrectly = true`
2. Agregar clase `success` al tablero (borde verde)
3. Mostrar mensaje "¡CRIPTOGRAMA RESUELTO! 🎉"
4. Mostrar botón ojito
5. Lanzar confetti
6. Guardar progreso en localStorage
7. Parar timer

### 6.3 Si Puzzle Incorrecto (`isCorrect === false`)

1. Mantener `messageCompletedCorrectly = false`
2. Mostrar mensaje: "Puzzle completado pero en orden incorrecto"
3. **NO** mostrar botón ojito
4. **NO** mostrar success
5. **NO** lanzar confetti
6. Guardar progreso en localStorage (para que pueda resetear)
7. Timer CONTINÚA

**CRITICAL**: `lastDecodedMessageOriginal` NO debe ser accesible si `messageCompletedCorrectly === false`.

---

## 7. BOTÓN RESET

### 7.1 Comportamiento

Al presionar reset:
1. Resetear `userPath = []`
2. Resetear timer a 00:00:00
3. `messageCompletedCorrectly = false`
4. Ocultar botón ojito
5. Remover clase `success` del tablero
6. Limpiar localStorage para este puzzle
7. Re-renderizar tablero vacío

---

## 8. CARGA DESDE SUPABASE

### 8.1 Datos del Puzzle

Cada puzzle en Supabase contiene:
```javascript
{
    puzzle_date: "2025-12-06",
    board_size: "3x4",
    message: "SABER ES PODER",          // Mensaje original
    solution_path: [...],               // Solución correcta
    title: "Título del puzzle",
    author: "Nombre del autor",
    word_separator: "space",            // Tipo de separador
    tokens: [...]                       // Tokens encriptados
}
```

### 8.2 Secuencia de Carga

1. Query Supabase con `.eq('puzzle_date', fecha).eq('board_size', tamaño)`
2. Si existe, cargar datos
3. Setear `lastDecodedMessageOriginal = data.message` **TEMPORALMENTE**
4. Cargar `currentPath = data.solution_path`
5. Cargar `globalTokens = data.tokens`
6. Renderizar tablero
7. Intentar cargar progreso desde localStorage
8. Si hay progreso Y `messageCompletedCorrectly === true` → mantener `lastDecodedMessageOriginal`
9. Si NO hay progreso O `messageCompletedCorrectly === false` → **LIMPIAR** `lastDecodedMessageOriginal = ''`

**CRITICAL**: `lastDecodedMessageOriginal` solo debe tener valor cuando el puzzle fue resuelto correctamente.

---

## 9. CASOS DE USO

### 9.1 Usuario Resuelve Puzzle Correctamente

```
1. Carga 3x4 del 06/12
2. Hace todos los movimientos correctamente
3. Al último movimiento:
   - messageCompletedCorrectly = true
   - Muestra success
   - Muestra botón ojito
4. Presiona ojito → Ve "SABER ES PODER" con espacios
5. Cambia a 4x5
6. Vuelve a 3x4
   - Se carga progreso desde localStorage
   - messageCompletedCorrectly = true (del localStorage)
   - Muestra success
   - Muestra botón ojito
7. Presiona ojito → Funciona correctamente
```

### 9.2 Usuario Resuelve Puzzle Incorrectamente

```
1. Carga 3x4 del 06/12
2. Hace todos los movimientos pero en orden incorrecto
3. Al último movimiento:
   - messageCompletedCorrectly = false
   - Muestra "Puzzle completado pero en orden incorrecto"
   - NO muestra botón ojito
4. ❌ BUG ACTUAL: Si presiona donde aparecería el ojito, ve el mensaje correcto
5. ✅ COMPORTAMIENTO ESPERADO: Botón ojito NO debe existir
```

### 9.3 Usuario Cambia de Fecha y Vuelve

```
1. Juega 3x4 del 06/12 (30 seg, 10 movimientos, no termina)
2. Cambia a fecha 07/12
   - Timer resetea a 00:00:00
   - Tablero vacío
   - Carga puzzle del 07/12
3. Juega 3x4 del 07/12 (15 seg, 5 movimientos)
4. Vuelve a fecha 06/12
   - Carga progreso: criptocaballo_progress_2025-12-06_3x4
   - Timer: 00:00:30 y CONTINÚA
   - Tablero: muestra 10 movimientos previos
   - Puede seguir jugando desde donde quedó
```

### 9.4 Usuario Cambia de Tamaño y Vuelve

```
1. Juega 3x4 del 06/12 (30 seg, 10 movimientos, no termina)
2. Cambia a tamaño 4x5
   - Se guarda progreso: criptocaballo_progress_2025-12-06_3x4
   - Timer resetea a 00:00:00
   - Tablero vacío
3. Juega 4x5 (15 seg, 5 movimientos)
4. Vuelve a tamaño 3x4
   - Carga progreso: criptocaballo_progress_2025-12-06_3x4
   - Timer: 00:00:30 y CONTINÚA
   - Tablero: muestra 10 movimientos previos
```

---

## 10. BUGS CONOCIDOS Y FIXES REQUERIDOS

### 10.1 🔴 CRÍTICO: Ojito Muestra Respuesta en Puzzle Incorrecto

**Síntoma**: Usuario resuelve puzzle incorrectamente, presiona ojito, ve mensaje correcto.

**Root Cause**: `lastDecodedMessageOriginal` se setea al cargar puzzle, no al completarlo correctamente.

**Fix**:
```javascript
// EN loadPuzzleFromSavedData():
lastDecodedMessageOriginal = ''; // NO setear aquí

// EN verificación de solución CORRECTA:
if (isCorrect) {
    messageCompletedCorrectly = true;
    lastDecodedMessageOriginal = data.message; // Setear SOLO aquí
}
```

### 10.2 🔴 CRÍTICO: Timer Se Resetea al Cambiar Tablero

**Síntoma**: Usuario juega 3x4 por 30 seg, cambia a 4x5, vuelve a 3x4 → timer en 00:00:00.

**Root Cause**: `loadProgressFromLocalStorage()` no se llama, o `elapsedSeconds` no se restaura correctamente.

**Status**: Pendiente investigación con logs del usuario.

### 10.3 🔴 CRÍTICO: Progreso Se Pierde al Cambiar Fecha

**Síntoma**: Usuario juega 3x4 del 06/12, cambia a 07/12, vuelve a 06/12 → progreso perdido.

**Root Cause**: Al cambiar fecha, no se intenta cargar progreso de la nueva fecha.

**Fix**: En `loadDailyLevel()`, después de cargar puzzle, llamar a `loadProgressFromLocalStorage()`.

### 10.4 Board Centering (Tablero 8x8 Descentrado)

**Síntoma**: Tablero 8x8 se desplaza a la derecha.

**Root Cause**: CSS grid con `inline-grid` y columnas `max-content max-content`.

**Status**: Pendiente fix CSS.

---

## 11. CONSOLE.LOG SYSTEM

### 11.1 Emojis de Debugging

| Emoji | Significado | Uso |
|-------|-------------|-----|
| 📅🔄 | Cambio de fecha | `loadDailyLevel()` |
| 🎯 | Cambio de tamaño | `setBoardSize()` |
| ✅ | Puzzle resuelto correctamente | Verificación de solución |
| ❌ | Puzzle incorrecto | Verificación de solución |
| 📍 | Restore desde localStorage | `loadProgressFromLocalStorage()` |
| 💾 | Save to localStorage | `saveProgressToLocalStorage()` |
| 📥 | Load from localStorage | `loadProgressFromLocalStorage()` |
| 👁️ | Toggle espacios (ojito) | `toggleSpaces()` |
| 🔐 | Encriptación | Generación de puzzle |
| 📋 | Board changes | Rendering |

### 11.2 Logs Críticos a Incluir

```javascript
// En loadDailyLevel():
console.log(`📅🔄 Cargando puzzle para ${fecha} (${tamaño})`);
console.log(`📅🔄 ANTES - messageCompletedCorrectly: ${messageCompletedCorrectly}`);
console.log(`📅🔄 DESPUÉS - messageCompletedCorrectly: ${messageCompletedCorrectly}`);

// En setBoardSize():
console.log(`🎯 Cambio a ${r}x${c}`);
console.log(`🎯 ANTES - userPath.length: ${userPath.length}, elapsedSeconds: ${elapsedSeconds}`);

// En loadProgressFromLocalStorage():
console.log(`📍 Restaurando - messageCompletedCorrectly: ${messageCompletedCorrectly}, elapsedSeconds: ${elapsedSeconds}`);

// En verificación de solución:
console.log(`✅ PUZZLE CORRECTO - Seteando messageCompletedCorrectly = true`);
// O
console.log(`❌ PUZZLE INCORRECTO - messageCompletedCorrectly = false`);

// En toggleSpaces():
console.log(`👁️ messageCompletedCorrectly: ${messageCompletedCorrectly}`);
console.log(`👁️ lastDecodedMessageOriginal: "${lastDecodedMessageOriginal}"`);
```

---

*Documento creado: 2025-12-07*
*Última actualización: 2025-12-07*
*Versión: 1.0*
