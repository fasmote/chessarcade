# Sesión de Corrección de Bugs - CriptoCaballo
**Fecha**: 2025-12-07
**Duración**: ~8 horas
**Commits**: 5+ commits principales

---

## Resumen Ejecutivo

Esta fue una sesión extensa donde se identificaron y corrigieron múltiples bugs críticos relacionados con:
- Manejo de espacios en mensajes (separador "ninguno")
- Validación de caminos correctos
- Persistencia de datos entre tableros
- Contador de caracteres
- Funcionalidad del botón "Ver con Espacios"

---

## 1. PROBLEMA: Separador "Ninguno" no funcionaba correctamente

### Bug Original
Cuando el admin seleccionaba "Ninguno (Juntar letras)" en el separador de palabras, el sistema:
- Generaba tokens CON espacios internos: `[M, E, ' ', C, A, N, S, E]`
- Mostraba celdas vacías o números en las posiciones de espacios
- El tablero mostraba: `M E _ C A N S E` en vez de `MECANSE`

### Causa Raíz
En `admin.html` líneas 1007-1027, el código tenía esta lógica:
```javascript
// INCORRECTO (versión antigua)
if (separator === 'cross') {
    rawText = rawText.replace(/\s/g, CROSS_MARKER);
} else if (separator === 'knight') {
    rawText = rawText.replace(/\s/g, KNIGHT_MARKER);
} else {
    // Mantenía espacios como ' ' para 'none' y 'space'
    console.log("⚪ Manteniendo espacios como ' '");
}
```

El problema era que NO eliminaba espacios cuando `separator === 'none'`.

### Solución Implementada
```javascript
// CORRECTO (nueva versión)
if (separator === 'none') {
    // NINGUNO: Eliminar TODOS los espacios, juntar las letras
    rawText = rawText.replace(/\s/g, '');
    console.log("🚫 NINGUNO: Eliminados TODOS los espacios, letras juntas");
} else if (separator === 'space') {
    // ESPACIO: Mantener espacios como espacios normales
    console.log("⚪ ESPACIO: Manteniendo espacios como ' '");
} else if (separator === 'cross') {
    rawText = rawText.replace(/\s/g, CROSS_MARKER);
    // ... etc
}
```

**Archivos modificados**:
- `games/criptocaballo/admin.html` (líneas 1011-1034)

**Commit**: `fix: Remove spaces completely when separator='none'`

---

## 2. PROBLEMA: Celdas con espacios mostraban bordes y fondos

### Bug Original
Incluso después de ocultar el texto de las celdas con espacios (`cell.textContent = ""`), las celdas seguían mostrando:
- Borde gris (#334155)
- Fondo oscuro (#1e293b)
- Eran visibles como "celdas vacías"

### Causa Raíz
No había CSS específico para la clase `.space-separator`. Las celdas heredaban los estilos de `.cell`.

### Solución Implementada
Agregado CSS para hacer las celdas completamente invisibles:

```css
/* admin.html y index.html - antes de </style> */
.cell.space-separator {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    pointer-events: none !important;
    cursor: default !important;
}
.cell.space-separator:hover {
    background: transparent !important;
    border: none !important;
}
```

**Archivos modificados**:
- `games/criptocaballo/admin.html` (líneas 328-339)
- `games/criptocaballo/index.html` (líneas 330-341)

**Commit**: `fix: Add CSS to hide space-separator cells completely`

---

## 3. PROBLEMA: Badges (números) aparecían en celdas de espacios

### Bug Original
La función `restorePathVisuals()` agregaba badges con números de paso (1, 2, 3...) a TODAS las celdas del camino, incluyendo las celdas con espacios invisibles.

Esto causaba que veas números "flotando" en posiciones vacías.

### Causa Raíz
`restorePathVisuals()` no verificaba si la celda era un espacio invisible antes de agregar el badge:

```javascript
// INCORRECTO
currentPath.forEach((pos, idx) => {
    const [r, c] = pos;
    const cell = document.getElementById(`cell-${r}-${c}`);
    if (!cell) return;

    // ... agregaba badge a TODAS las celdas
    const badge = document.createElement('span');
    badge.className = 'step-number';
    badge.innerText = idx + 1;
    cell.appendChild(badge);
});
```

### Solución Implementada
Agregado check al inicio del loop para saltar espacios invisibles:

```javascript
// CORRECTO
currentPath.forEach((pos, idx) => {
    const [r, c] = pos;
    const cell = document.getElementById(`cell-${r}-${c}`);
    if (!cell) return;

    const token = globalTokens[idx];
    const isSpace = token === ' ';

    // CRITICAL: Si es un espacio invisible, NO agregar badges ni clases visuales
    if (isSpace && cell.classList.contains('space-separator')) {
        console.log(`  🚫 Saltando visuales para espacio en celda [${r},${c}]`);
        return; // Skip adding any visual elements to invisible spaces
    }

    // ... resto del código
});
```

**Archivos modificados**:
- `games/criptocaballo/admin.html` (líneas 1411-1419)
- `games/criptocaballo/index.html` (líneas 1463-1471)

**Commit**: `fix: Prevent badges and visual classes on invisible space separators`

---

## 4. PROBLEMA: Botón "Ver con Espacios" contraía el contenedor

### Bug Original
Cuando el usuario completaba el puzzle y presionaba el botón del ojito "Ver con Espacios":
- El contenedor se contraía visualmente
- Las letras de relleno desaparecían
- Solo mostraba las letras del mensaje con espacios
- La interfaz "saltaba" y se veía feo

### Causa Raíz
La función `toggleSpaces()` tenía dos bloques separados para mensaje y relleno, creando un separador visual entre ellos:

```javascript
// INCORRECTO
if (isShowingSpaces) {
    // Mostrar letras del mensaje con espacios
    for (let idx = 0; idx < messageLength; idx++) {
        // ... agregar letras con espacios
    }

    // SEPARADOR - causaba contracción
    if (userPath.length > validMessageLength && validMessageLength > 0) {
        const separator = document.createElement('div');
        separator.className = 'msg-separator';
        separator.textContent = 'MENSAJE COMPLETADO';
        d.appendChild(separator);
    }

    // Mostrar letras de relleno (en bloque separado)
    if (userPath.length > validMessageLength) {
        for (let idx = validMessageLength; idx < userPath.length; idx++) {
            // ...
        }
    }
}
```

### Solución Implementada
Unificado en un solo loop que muestra todas las letras juntas (mensaje + relleno):

```javascript
// CORRECTO
if (isShowingSpaces) {
    // Build ENTIRE path including message AND filler (no contraction)
    userPath.forEach((pos, idx) => {
        const cell = document.getElementById(`cell-${pos.r}-${pos.c}`);
        const letter = cell.dataset.letter || "";

        // MESSAGE part (with spaces shown)
        if (idx < validMessageLength) {
            // Check if ORIGINAL solution has a space at this position
            if(idx < globalTokens.length) {
                const token = globalTokens[idx];
                if(token === ' ') {
                    // Add space
                    const spaceSpan = document.createElement('span');
                    spaceSpan.className = 'decoded-msg-char';
                    spaceSpan.textContent = ' ';
                    d.appendChild(spaceSpan);
                    return;
                }
            }
            // Add letter (message part)
            if(letter) {
                const span = document.createElement('span');
                span.className = 'decoded-msg-char';
                span.textContent = letter.toUpperCase();
                d.appendChild(span);
            }
        } else {
            // FILLER part (keep showing - no contraction)
            if(letter) {
                const span = document.createElement('span');
                span.className = 'decoded-msg-char text-gray-500';
                span.textContent = letter.toUpperCase();
                d.appendChild(span);
            }
        }
    });
    // NO SEPARATOR - just show all letters together
}
```

**Archivos modificados**:
- `games/criptocaballo/index.html` (líneas 1915-1974)

**Commit**: `fix: Prevent contraction when toggling spaces + debug final char`

---

## 5. PROBLEMA: lastDecodedMessageOriginal persistía entre tableros

### Bug Original
Escenario:
1. Admin selecciona tablero 4x5
2. Escribe "ME CANSE" y encripta
3. Admin cambia a tablero 3x4
4. Escribe "VINI VIDI VICI" y encripta
5. Usuario completa el puzzle de 3x4
6. Presiona botón "Ver con Espacios"
7. **BUG**: Muestra "ME CANSE" en vez de "VINI VIDI VICI"

### Causa Raíz
La variable `lastDecodedMessageOriginal` se guardaba cuando presionabas "Encriptar" pero NO se reseteaba cuando cambias de tamaño de tablero.

```javascript
// INCORRECTO - no reseteaba la variable
function setBoardSize(r, c) {
    rows = r; cols = c;
    isAutoSolved = false;
    activeEndHints = 0;
    lockedHintCount = 0;
    // lastDecodedMessageOriginal seguía con el valor viejo
    // ...
}
```

### Solución Implementada
```javascript
// CORRECTO
function setBoardSize(r, c) {
    rows = r; cols = c;
    isAutoSolved = false;
    activeEndHints = 0;
    lockedHintCount = 0;

    // CRITICAL: Reset lastDecodedMessageOriginal when changing board size
    // This prevents showing old message from previous board
    lastDecodedMessageOriginal = "";

    // ...
}
```

**Archivos modificados**:
- `games/criptocaballo/admin.html` (líneas 1239-1241)
- `games/criptocaballo/index.html` ya tenía el reset (línea 1044)

**Commit**: `fix: Multiple critical bugs - validation, message persistence, counter`

---

## 6. PROBLEMA: Cualquier camino era válido al completar el mensaje

### Bug Original
El usuario podía completar el recorrido del tablero con CUALQUIER secuencia de 7 letras y el sistema marcaba como "¡CRIPTOGRAMA RESUELTO! 🎉".

Ejemplo:
- Mensaje correcto: "MECANSE" (path: M→E→C→A→N→S→E)
- Usuario hace: E→C→A→N→S→R (7 letras pero camino incorrecto)
- **BUG**: Sistema lo acepta como correcto

### Causa Raíz
En `admin.html` líneas 1628-1643, cuando `userPath.length === validMessageLength` marcaba como resuelto SIN validar que el camino coincida con `currentPath`:

```javascript
// INCORRECTO
if (userPath.length === validMessageLength) {
    // NO validaba el camino
    const boardWrapper = document.getElementById('boardWrapper');
    if(boardWrapper) boardWrapper.classList.add('success');
    // ... mostraba éxito sin verificar
}
```

### Solución Implementada
Agregada validación que compara `userPath` con `currentPath`:

```javascript
// CORRECTO
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
        // SUCCESS: Path is correct!
        console.log("✅ Mensaje completado CORRECTAMENTE");
        // ... mostrar éxito
    } else {
        // FAILED: Path is wrong
        console.log("❌ Mensaje completado pero camino INCORRECTO");
        const errorMsg = document.createElement('div');
        errorMsg.className = 'text-sm md:text-base font-bold text-red-400 mt-2';
        errorMsg.textContent = "❌ Camino incorrecto - intenta de nuevo";
        decodedText.appendChild(errorMsg);
    }
}
```

**Archivos modificados**:
- `games/criptocaballo/admin.html` (líneas 1629-1676)
- `games/criptocaballo/index.html` ya tenía la validación (líneas 1662-1703)

**Commit**: `fix: Multiple critical bugs - validation, message persistence, counter`

---

## 7. PROBLEMA: Faltaba contador de caracteres como en v20

### Bug Original
No había feedback visual de cuántos caracteres llevaba el usuario vs cuántos necesitaba el tablero.

En la versión v20 (CriptoCaballoV20) había un contador que mostraba:
- `7 / 12 car. Faltan 5` (amarillo)
- `14 / 12 car. Sobran 2` (rojo)
- `12 / 12 car. Completo` (verde)

### Causa Raín
El HTML tenía `<span id="charCount">` pero no había función `updateCharCount()` implementada.

### Solución Implementada
Copiada la función de v20 y adaptada:

```javascript
function updateCharCount() {
    const input = document.getElementById('messageInput');
    const separator = document.getElementById('wordSeparator').value;
    const countEl = document.getElementById('charCount');
    if (!input || !countEl) return;

    const max = rows * cols;

    let val = input.value;
    if (separator === 'none') {
        val = val.replace(/\s/g, ''); // Count without spaces
    }

    const len = val.length;
    let statusHtml = `<span class="text-slate-300 font-bold">${len}</span> / ${max} car.`;
    if (len < max) statusHtml += ` <span class="text-yellow-400 ml-2"><i class="fa-solid fa-circle-half-stroke mr-1"></i>Faltan ${max - len}</span>`;
    else if (len > max) statusHtml += ` <span class="text-red-400 ml-2"><i class="fa-solid fa-circle-exclamation mr-1"></i>Sobran ${len - max}</span>`;
    else statusHtml += ` <span class="text-green-400 ml-2"><i class="fa-solid fa-circle-check mr-1"></i>Completo</span>`;
    countEl.innerHTML = statusHtml;
}
```

**Event Listeners agregados**:
- `input.addEventListener('input', updateCharCount)` - ya existía (línea 699)
- `<select onchange="updateCharCount()">` - ya existía (línea 466)
- `updateCharCount()` llamado en `setBoardSize()` (línea 1284)

**Archivos modificados**:
- `games/criptocaballo/admin.html` (líneas 1235-1254)

**Commit**: `fix: Multiple critical bugs - validation, message persistence, counter`

---

## Pregunta del Usuario: ¿Los links viejos de Vercel se vencen?

### Respuesta
**NO, los links de Vercel NO se vencen automáticamente**, pero hay detalles importantes:

### Cómo Funciona Vercel

1. **Deployment Permanente**: Cada vez que ejecuto `vercel --prod`, Vercel crea un deployment único con su propia URL:
   - Ejemplo: `https://chessarcade-k8lynnmm2-claudios-projects.vercel.app`
   - Este deployment es **permanente** y nunca se elimina automáticamente

2. **URL de Producción Principal**: Tu proyecto tiene una URL principal de producción:
   - Ejemplo: `https://chessarcade.vercel.app` (o tu dominio custom)
   - Esta URL SIEMPRE apunta al deployment más reciente marcado como "Production"

3. **URLs de Deployments Anteriores**: Los deployments viejos siguen activos:
   - `https://chessarcade-pbjx5fpci-claudios-projects.vercel.app` ← Deployment #1 (sigue vivo)
   - `https://chessarcade-r2r8poym8-claudios-projects.vercel.app` ← Deployment #2 (sigue vivo)
   - `https://chessarcade-k8lynnmm2-claudios-projects.vercel.app` ← Deployment #3 (actual)

### ¿Por Qué Múltiples URLs?

Cada deployment tiene un ID único generado aleatoriamente. Vercel hace esto para:
- **Rollback fácil**: Si el nuevo deployment tiene bugs, puedes volver a uno anterior
- **Testing**: Puedes probar deployments específicos sin afectar producción
- **Preview**: Cada Pull Request genera su propio deployment preview

### Cuándo se Eliminan

Los deployments solo se eliminan cuando:
1. **Manual**: Tú los eliminas desde el dashboard de Vercel
2. **Plan Free Limit**: Vercel Free tiene límite de 100 deployments. Si pasas 100, empieza a eliminar los más viejos automáticamente
3. **Proyecto Eliminado**: Si eliminas todo el proyecto

### Recomendación

**Usa la URL del dominio principal** o la URL de producción (sin el hash random) para compartir con usuarios finales. Las URLs con hash son útiles solo para debugging/testing de versiones específicas.

**URL Actual de Producción**: https://chessarcade-k8lynnmm2-claudios-projects.vercel.app

---

## Testing Recomendado

Por favor prueba los siguientes escenarios para confirmar que todo funciona:

### Test 1: Separador "Ninguno"
1. Tablero 3x4
2. Mensaje: "VINI VIDI VICI" (14 caracteres con espacios, 12 sin espacios)
3. Separador: "Ninguno (Juntar letras)"
4. Verificar contador muestra: `12 / 12 car. Completo` ✅
5. Presionar "Encriptar"
6. Verificar tablero muestra: `VINIVIDIVICI` (sin espacios visibles)
7. Completar camino CORRECTO
8. Verificar muestra: "¡CRIPTOGRAMA RESUELTO! 🎉"
9. Presionar botón ojito "Ver con Espacios"
10. Verificar muestra: "VINI VIDI VICI" (con espacios, sin contracción)

### Test 2: Validación de Camino Incorrecto
1. Tablero 3x4
2. Mensaje: "HOLA MUNDO!!" (12 caracteres)
3. Separador: "Ninguno"
4. Presionar "Encriptar"
5. Resolver con camino INCORRECTO (seleccionar letras en orden diferente)
6. Al completar 12 celdas, verificar muestra: "❌ Camino incorrecto - intenta de nuevo"

### Test 3: Cambio de Tablero
1. Tablero 4x5, mensaje "ME CANSE"
2. Encriptar y resolver
3. Cambiar a tablero 3x4
4. Mensaje "OTRO TEXTO"
5. Encriptar y resolver
6. Presionar ojito
7. Verificar NO muestra "ME CANSE" del tablero anterior

### Test 4: Contador de Caracteres
1. Tablero 3x4 (12 celdas)
2. Escribir "HOLA" → Contador: `4 / 12 car. Faltan 8` (amarillo)
3. Escribir "HOLA MUNDO CRUEL" → Contador: `16 / 12 car. Sobran 4` (rojo)
4. Cambiar separador a "Ninguno" → Contador: `15 / 12 car. Sobran 3` (sin espacios)
5. Escribir exactamente 12 letras → Contador: `12 / 12 car. Completo` (verde)

---

## Archivos Modificados

```
games/criptocaballo/admin.html
games/criptocaballo/index.html
```

## Total de Líneas Cambiadas

- **admin.html**: ~100 líneas modificadas/agregadas
- **index.html**: ~40 líneas modificadas/agregadas

## Commits Principales

1. `fix: Remove spaces completely when separator='none'`
2. `fix: Add CSS to hide space-separator cells completely`
3. `fix: Prevent badges and visual classes on invisible space separators`
4. `fix: Prevent contraction when toggling spaces + debug final char`
5. `fix: Multiple critical bugs - validation, message persistence, counter`

---

## Lecciones Aprendidas

1. **Claridad en Requerimientos**: La confusión inicial sobre cómo debían funcionar los espacios causó ~6 horas de trabajo innecesario. La imagen 183_CC_espacios_admin.png fue clave para entender el requerimiento real.

2. **Testing con Datos Viejos**: Algunos bugs parecían no estar resueltos porque estábamos testeando con puzzles guardados antes de aplicar el fix. Siempre crear puzzles nuevos para testear.

3. **Validación de Datos**: El bug de "cualquier camino es válido" era crítico y pasó desapercibido. Siempre validar que los datos del usuario coincidan con la solución esperada.

4. **CSS Inheritance**: Los espacios invisibles necesitaban `!important` para sobreescribir estilos heredados.

5. **State Management**: Variables globales como `lastDecodedMessageOriginal` deben resetearse en TODOS los puntos donde cambia el contexto (cambio de tablero, nuevo puzzle, etc).

---

**Fin del Documento**
