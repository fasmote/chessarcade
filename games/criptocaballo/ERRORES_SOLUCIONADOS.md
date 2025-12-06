# 🐛 Errores Solucionados - CriptoCaballo

**Última actualización:** 5 de diciembre de 2025

Este documento registra todos los bugs que han sido identificados y resueltos en el juego CriptoCaballo.

---

## 📋 Índice de Bugs Resueltos

1. [Config.js no cargaba (404)](#bug-1-configjs-no-cargaba-404)
2. [No se auto-cargaba puzzle del día](#bug-2-no-se-auto-cargaba-puzzle-del-día)
3. [Múltiples casillas de inicio marcadas](#bug-3-múltiples-casillas-de-inicio-marcadas)
4. [Colores celestes persistían al cambiar tamaños](#bug-4-colores-celestes-persistían-al-cambiar-tamaños)
5. [Puzzle guardado no se cargaba al cambiar tamaño](#bug-5-puzzle-guardado-no-se-cargaba-al-cambiar-tamaño-crítico)
6. [toggleSpaces mostraba respuesta correcta](#bug-6-togglespaces-mostraba-respuesta-correcta)
7. [Marcaba como resuelto sin validar orden](#bug-7-marcaba-como-resuelto-sin-validar-orden-crítico)
8. [Casillas rojas revelaban dónde termina mensaje](#bug-8-casillas-rojas-revelaban-dónde-termina-mensaje-crítico)

---

## Bug #1: Config.js no cargaba (404)

### 📝 Descripción
La página del jugador mostraba error 404 al intentar cargar `config.js`, causando que Supabase no se configurara y los puzzles no se cargaran.

### 🔍 Evidencia
```
config.js:1 Failed to load resource: the server responded with a status of 404 ()
CRYPTO_CONFIG cargado: ❌ NO
Supabase URL: TU_SUPABASE_URL
```

### 🎯 Causa Raíz
El archivo `config.js` no existía en el repositorio para producción, solo existía `.private/criptocaballo-config.js` para desarrollo local.

### ✅ Solución
Crear `games/criptocaballo/config.js` con las credenciales de Supabase y deployar a Vercel.

### 📁 Archivos Modificados
- `games/criptocaballo/config.js` (creado)

### 🚀 Commit
`feat: Add config.js for production deployment`

### ✅ Estado
**RESUELTO** - 5 de diciembre de 2025

---

## Bug #2: No se auto-cargaba puzzle del día

### 📝 Descripción
Al abrir la página del jugador, el usuario tenía que hacer clic manualmente en el selector de fecha o tamaño para cargar el puzzle. No se cargaba automáticamente.

### 🎯 Causa Raíz
No había ningún llamado a `loadDailyLevel()` en el evento `DOMContentLoaded`.

### ✅ Solución
Agregar timeout que llama a `loadDailyLevel()` después de cargar la página:

```javascript
document.addEventListener('DOMContentLoaded', () => {
    // ... código existente ...

    // Auto-load today's puzzle on page load
    setTimeout(() => {
        loadDailyLevel();
    }, 500);
});
```

### 📁 Archivos Modificados
- `games/criptocaballo/index.html` - líneas 668-671

### 🚀 Commit
`feat: Auto-load today's puzzle on CriptoCaballo player page`

### ✅ Estado
**RESUELTO** - 5 de diciembre de 2025

---

## Bug #3: Múltiples casillas de inicio marcadas

### 📝 Descripción
Cuando el usuario empezaba desde una casilla, deshacía hasta cero, y empezaba desde otra casilla, ambas quedaban marcadas con borde verde.

### 🔍 Evidencia
Screenshot mostraba 3 casillas con borde verde (diferentes inicios probados).

### 🎯 Causa Raíz
Al deshacer hasta `userPath.length === 0`, no se limpiaban las clases `.start-cell` de las casillas anteriores.

### ✅ Solución
Agregar limpieza de todas las clases `.start-cell` cuando el path está vacío:

```javascript
} else {
    // Remove all start-cell markers when path is empty
    document.querySelectorAll('.start-cell').forEach(c => {
        c.classList.remove('start-cell');
    });
    // ...
}
```

### 📁 Archivos Modificados
- `games/criptocaballo/index.html` - líneas 1406-1408

### 🚀 Commit
`fix: Remove all start-cell markers when undoing to empty path`

### ✅ Estado
**RESUELTO** - 5 de diciembre de 2025

---

## Bug #4: Colores celestes persistían al cambiar tamaños

### 📝 Descripción
Después de resolver un puzzle 3x4, al cambiar a otro tamaño (4x5, 5x5), las casillas celestes con números (de la solución anterior) quedaban marcadas en las mismas coordenadas en el nuevo tablero.

### 🔍 Evidencia
Screenshots 159a, 159b, 159c mostraban casillas celestes en tableros 4x5, 5x5, 6x7 después de haber resuelto 3x4.

### 🎯 Causa Raíz
La función `setBoardSize()` solo limpiaba el HTML del tablero (`board.innerHTML = ''`) pero NO limpiaba las variables de estado globales:
- `userPath`
- `currentPath`
- `globalTokens`
- `validMessageLength`

### ✅ Solución
Resetear todas las variables de estado en `setBoardSize()`:

```javascript
function setBoardSize(r, c) {
    // Reset all game state variables
    userPath = [];
    currentPath = [];
    globalTokens = [];
    validMessageLength = 0;
    currentStep = 0;
    targetStep = 0;
    isAnimating = false;
    lastDecodedMessageOriginal = '';
    isShowingSpaces = false;

    // Clear UI elements
    const decodedText = document.getElementById('decodedText');
    if(decodedText) {
        decodedText.textContent = "LISTO PARA RESOLVER";
    }

    // Hide success elements
    const boardWrapper = document.getElementById('boardWrapper');
    if(boardWrapper) boardWrapper.classList.remove('success');

    // ... resto del código
}
```

### 📁 Archivos Modificados
- `games/criptocaballo/index.html` - líneas 1000-1054

### 🚀 Commit
`fix: Clear all game state when changing board size`

### ✅ Estado
**RESUELTO** - 5 de diciembre de 2025

---

## Bug #5: Puzzle guardado no se cargaba al cambiar tamaño (CRÍTICO)

### 📝 Descripción
Cuando el admin guardaba un puzzle (ej: 8x8) en Supabase y el usuario seleccionaba ese tamaño, el juego generaba un puzzle aleatorio en lugar de cargar el puzzle guardado.

### 🔍 Evidencia
- Supabase mostraba 2 registros: 3x4 y 8x8 para fecha 2025-12-05
- Log mostraba: "Jugador seleccionó: 8x8" → "Botón presionado: Encriptar"
- NO mostraba: "Cargando puzzle para 2025-12-05 (8x8)"

### 🎯 Causa Raíz
La función `playerSelectSize()` llamaba a `generateCryptogram()` INMEDIATAMENTE con una frase aleatoria, sobrescribiendo el puzzle antes de que `loadDailyLevel()` pudiera cargarlo desde Supabase:

```javascript
function playerSelectSize(r, c) {
    setBoardSize(r, c);
    const randomPhrase = WELCOME_PHRASES[...];
    input.value = randomPhrase;
    generateCryptogram();  // ← Esto previene que se cargue desde Supabase
}
```

### ✅ Solución
Convertir `playerSelectSize()` en función `async` que consulta Supabase PRIMERO:

```javascript
async function playerSelectSize(r, c) {
    setBoardSize(r, c);

    // Try to load from Supabase first
    if(supabaseClient) {
        const boardSize = `${r}x${c}`;
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabaseClient
            .from('puzzles')
            .select('*')
            .eq('puzzle_date', today)
            .eq('board_size', boardSize)
            .single();

        if (data && !error) {
            // Load puzzle from Supabase
            input.value = data.message;
            generateCryptogram();
            showPuzzleId(data);
            return;
        }
    }

    // No puzzle found, generate random
    input.value = randomPhrase;
    generateCryptogram();
    hidePuzzleId();
}
```

### 📁 Archivos Modificados
- `games/criptocaballo/index.html` - líneas 1056-1116

### 🚀 Commit
`fix: Load puzzle from Supabase when changing board size + document bugs`

### ✅ Estado
**RESUELTO** - 5 de diciembre de 2025

---

## Bug #6: toggleSpaces mostraba respuesta correcta

### 📝 Descripción
Cuando el usuario completaba todas las casillas en orden INCORRECTO y presionaba "Ver con Espacios", el juego mostraba el mensaje CORRECTO en lugar de la "sopa de letras" que el usuario había creado.

### 🔍 Evidencia
- Usuario completó: R-T-H-S-S-T-T-S-3-I-E-I (orden incorrecto)
- toggleSpaces mostró: "3 TRISTES TI" (mensaje correcto)
- Debería mostrar: "RTHSSTTS3IEI" (lo que el usuario escribió)

### 🎯 Causa Raíz
La función `toggleSpaces()` estaba usando `lastDecodedMessageOriginal` (el mensaje correcto) en lugar de construir el texto desde `userPath`:

```javascript
d.innerHTML = `<span>${lastDecodedMessageOriginal.toUpperCase()}</span>`;
```

### ✅ Solución
Construir el texto desde el camino real del usuario (`userPath`):

```javascript
function toggleSpaces() {
    if (isShowingSpaces) {
        // Build text from USER'S path with spaces
        let userDecodedWithSpaces = '';
        userPath.forEach((pos, idx) => {
            const cell = document.getElementById(`cell-${pos.r}-${pos.c}`);
            const letter = cell.dataset.letter || "";

            // Check if this position should have a space
            if(idx < globalTokens.length) {
                const token = globalTokens[idx];
                if(token === ' ') {
                    userDecodedWithSpaces += ' ';
                }
            }

            userDecodedWithSpaces += letter.toUpperCase();
        });

        d.innerHTML = `<span>${userDecodedWithSpaces}</span>`;
    }
}
```

### 📁 Archivos Modificados
- `games/criptocaballo/index.html` - líneas 1607-1640

### 🚀 Commit
`fix: Show user's actual path in toggleSpaces, not correct answer`

### ✅ Estado
**RESUELTO** - 5 de diciembre de 2025

---

## Bug #7: Marcaba como resuelto sin validar orden (CRÍTICO)

### 📝 Descripción
El juego marcaba el puzzle como "¡CRIPTOGRAMA RESUELTO!" y lanzaba confetti simplemente por completar 12 casillas, **sin importar el orden**. Cualquier combinación de 12 casillas era considerada "correcta".

### 🔍 Evidencia
Screenshot 161 mostraba confetti y "RESUELTO" después de completar en orden incorrecto.

### 🎯 Causa Raíz
La validación solo verificaba cantidad de casillas, no el orden:

```javascript
if (userPath.length === validMessageLength) {
    // ¡Éxito! ❌ Solo verifica cantidad
    launchConfetti();
}
```

### ✅ Solución
Validar posición por posición que el camino del usuario coincida con la solución correcta:

```javascript
if (userPath.length === validMessageLength) {
    // Verify that user's path matches the correct solution
    let isCorrect = true;
    for (let i = 0; i < validMessageLength; i++) {
        if (i >= currentPath.length) {
            isCorrect = false;
            break;
        }
        const [correctR, correctC] = currentPath[i];
        const userPos = userPath[i];
        if (userPos.r !== correctR || userPos.c !== correctC) {
            isCorrect = false;
            break;
        }
    }

    if (isCorrect) {
        // SUCCESS: Show confetti, stop timer, mark as solved
        launchConfetti();
    } else {
        // FAILED: No confetti, timer continues
        console.log("Puzzle completado pero en orden incorrecto");
    }
}
```

### 📁 Archivos Modificados
- `games/criptocaballo/index.html` - líneas 1468-1510

### 🚀 Commit
`fix: Only mark puzzle as solved if path is CORRECT, not just completed`

### ✅ Estado
**RESUELTO** - 5 de diciembre de 2025

---

## Bug #8: Casillas rojas revelaban dónde termina mensaje (CRÍTICO)

### 📝 Descripción
En tableros con casillas sobrantes (ej: mensaje de 10 caracteres en tablero 3x4 = 12 casillas), las últimas 2 casillas se marcaban en ROJO antes de completar el mensaje, revelando exactamente dónde termina y dando una pista injusta.

### 🔍 Evidencia
Usuario reportó: "cuando faltan 2, los marca en rojo como sobrantes... eso esta mal, solo deberia marcarlos en rojo despues que complete la frase"

### 🎯 Causa Raíz
La lógica marcaba casillas como "filler" (rojas) basándose solo en el índice:

```javascript
const currentIsFiller = currentIdx >= validMessageLength;
// Marca rojo cuando índice >= 10, incluso si mensaje no está resuelto
```

Esto revelaba información prematuramente:
- Celda 11: ROJA → "¡El mensaje termina en la 10!"
- Celda 12: ROJA → Pista injusta

### ✅ Solución
Agregar variable `messageCompletedCorrectly` que solo se activa al resolver correctamente:

```javascript
// Variable global
let messageCompletedCorrectly = false;

// Marcar como resuelto correctamente
if (isCorrect) {
    messageCompletedCorrectly = true;
    launchConfetti();
}

// Solo marcar rojo SI ya se completó correctamente
const currentIsFiller = messageCompletedCorrectly && currentIdx >= validMessageLength;

if (currentIsFiller) cell.classList.add('user-selected-filler');
```

Ahora:
1. **Resolviendo (celdas 1-10):** Todas CYAN - Sin pistas
2. **Mensaje completado correctamente:** Flag = true
3. **Continuar más allá (celdas 11-12):** AHORA sí rojas

### 📁 Archivos Modificados
- `games/criptocaballo/index.html` - líneas 615, 1014, 1395, 1436, 1449, 1489, 1613

### 🚀 Commit
`fix: Only mark cells as filler (red) AFTER message is correctly solved`

### ✅ Estado
**RESUELTO** - 5 de diciembre de 2025

---

## 📊 Resumen de la Sesión

| Bug | Prioridad | Estado | Fecha |
|-----|-----------|--------|-------|
| Config 404 | 🔴 ALTA | ✅ RESUELTO | 2025-12-05 |
| No auto-carga | 🟡 MEDIA | ✅ RESUELTO | 2025-12-05 |
| Múltiples inicios | 🟢 BAJA | ✅ RESUELTO | 2025-12-05 |
| Colores persisten | 🟢 BAJA | ✅ RESUELTO | 2025-12-05 |
| Puzzle no carga | 🔴 ALTA | ✅ RESUELTO | 2025-12-05 |
| toggleSpaces incorrecto | 🟡 MEDIA | ✅ RESUELTO | 2025-12-05 |
| Validación de orden | 🔴 ALTA | ✅ RESUELTO | 2025-12-05 |
| Casillas rojas spoiler | 🔴 ALTA | ✅ RESUELTO | 2025-12-05 |

**Total de bugs resueltos:** 8
**Bugs críticos resueltos:** 4

---

## 🔗 Referencias

- **Session Summary:** `docs/CRIPTOCABALLO_SESSION_SUMMARY.md`
- **Known Issues:** `docs/KNOWN_ISSUES.md`
- **Setup Guide:** `games/criptocaballo/QUICK_START.md`
- **Configuration:** `games/criptocaballo/INSTRUCCIONES_CONFIGURACION.md`

---

**Última sesión de debugging:** 5 de diciembre de 2025
**Deployado a producción:** ✅ https://chessarcade-2j0ig0aar-claudios-projects.vercel.app/games/criptocaballo/
