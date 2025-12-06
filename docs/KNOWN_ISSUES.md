# 🐛 Issues Conocidos y Mejoras Futuras

**Última actualización:** 6 de diciembre de 2025

Este documento registra bugs conocidos, limitaciones técnicas y mejoras planificadas para ChessArcade que no son críticas pero deben resolverse eventualmente.

---

## 📋 Issues Activos

### 🔴 PRIORIDAD ALTA

#### 1. CriptoCaballo: Timer se reinicia al retroceder después de resolver correctamente

**Descripción:**
Una vez resuelto correctamente un mensaje, si el usuario retrocede un par de casillas (deshacer movimientos), el reloj se reinicia a cero. Entonces puede avanzar nuevamente y parece que resolvió todo en 1 segundo, aunque originalmente tomó mucho más tiempo.

**Estado:** 🔴 Activo - Requiere solución
**Prioridad:** Alta (permite falsear tiempos en leaderboard)
**Fecha reportado:** 6 de diciembre de 2025

**Comportamiento esperado:**
Una vez que el puzzle está resuelto correctamente y el timer se detiene, NO debe reactivarse al retroceder. El tiempo final registrado debe ser el tiempo real de la primera solución completa.

**Causa raíz probable:**
El timer se reinicia cuando `userPath.length` cambia, sin verificar si el puzzle ya fue completado anteriormente.

**Solución propuesta:**
- Agregar flag `puzzleCompleted` que se active al completar el puzzle por primera vez
- Una vez `puzzleCompleted === true`, el timer NO debe reiniciarse aunque se retroceda
- El tiempo guardado debe ser el tiempo de la primera solución completa

**Archivos afectados:**
- `games/criptocaballo/index.html` - Lógica del timer y función de retroceder

**Testing requerido:**
1. Resolver puzzle completamente en 30 segundos
2. Timer se detiene en 30s
3. Retroceder 2 casillas
4. Timer NO debe reiniciarse, debe seguir mostrando 30s
5. Avanzar nuevamente las 2 casillas
6. Timer NO debe cambiar de 30s

---

#### 2. CriptoCaballo: Puzzle guardado en Supabase no se carga al cambiar tamaño de tablero

**Descripción:**
Cuando el admin guarda un puzzle (ej: 8x8) y el usuario selecciona ese tamaño, el juego genera un puzzle aleatorio en lugar de cargar el puzzle guardado desde Supabase.

**Estado:** 🔴 Activo - Requiere solución inmediata
**Prioridad:** Alta (rompe funcionalidad principal del juego)
**Fecha reportado:** 5 de diciembre de 2025

**Evidencia:**
- Supabase muestra 2 registros: 3x4 y 8x8 ambos para 2025-12-05
- Log 172: Usuario selecciona 8x8 pero no se carga el puzzle de Supabase
- Log muestra: "Botón presionado: Encriptar" pero NO "Cargando puzzle para 2025-12-05 (8x8)"

**Causa raíz:**
La función `playerSelectSize()` (línea ~1056) llama a `generateCryptogram()` INMEDIATAMENTE con una frase aleatoria, sobrescribiendo el puzzle antes de que `loadDailyLevel()` pueda cargarlo desde Supabase.

```javascript
function playerSelectSize(r, c) {
    setBoardSize(r, c);
    const randomPhrase = WELCOME_PHRASES[...];
    input.value = randomPhrase;
    generateCryptogram();  // ← Esto previene que se cargue desde Supabase
}
```

**Solución propuesta:**
Modificar `playerSelectSize()` para que sea async e intente cargar puzzle de Supabase ANTES de generar uno aleatorio:

```javascript
async function playerSelectSize(r, c) {
    setBoardSize(r, c);

    // Try to load from Supabase first
    if(supabaseClient) {
        const boardSize = `${r}x${c}`;
        const today = new Date().toISOString().split('T')[0];

        try {
            const { data, error } = await supabaseClient
                .from('puzzles')
                .select('*')
                .eq('puzzle_date', today)
                .eq('board_size', boardSize)
                .single();

            if (data && !error) {
                // Load puzzle from Supabase
                document.getElementById('messageInput').value = data.message;
                generateCryptogram();

                // Show puzzle ID
                const puzzleId = `#${today.replace(/-/g, '')}-${boardSize}`;
                const titleText = data.title ? ` "${data.title}"` : '';
                const authorText = data.author ? ` por ${data.author}` : '';
                document.getElementById('puzzleIdText').innerHTML =
                    `<strong>Resolviendo:</strong> <strong>${puzzleId}</strong>${titleText}${authorText}`;
                document.getElementById('puzzleIdDisplay').classList.remove('hidden');
                return;
            }
        } catch(e) {
            console.log("Error checking for puzzle:", e);
        }
    }

    // No puzzle found, generate random one
    const randomPhrase = WELCOME_PHRASES[Math.floor(Math.random() * WELCOME_PHRASES.length)];
    document.getElementById('messageInput').value = randomPhrase;
    generateCryptogram();
}
```

**Archivos afectados:**
- `games/criptocaballo/index.html` - líneas ~1056-1065

**Testing requerido:**
1. Como admin: Guardar puzzle 8x8 para hoy
2. Como usuario: Seleccionar 8x8
3. Verificar: Debe cargar puzzle guardado, no uno aleatorio
4. Verificar: Debe mostrar ID del puzzle

---

### 🟡 PRIORIDAD MEDIA

#### 1. CriptoCaballo: Al mostrar espacios con el botón "ojito", se ocultan los espacios sobrantes (filler)

**Descripción:**
Cuando se resuelve todo el puzzle (mensaje + espacios sobrantes) y se presiona el botón "ojito" (Ver con Espacios) para mostrar los espacios del mensaje, los espacios sobrantes (filler, casillas rojas) desaparecen de la visualización.

**Estado:** 🟡 Pendiente
**Prioridad:** Media (afecta UX de visualización final)
**Fecha reportado:** 6 de diciembre de 2025

**Comportamiento esperado:**
Al presionar "Ver con Espacios", debe mostrar el mensaje con sus espacios internos, PERO los espacios sobrantes (filler) deben permanecer visibles debajo de la línea separadora.

**Comportamiento actual:**
La función `toggleSpaces()` solo muestra las primeras N letras (hasta `validMessageLength`), ocultando completamente el filler.

**Solución propuesta:**
Modificar `toggleSpaces()` para que:
1. Muestre el mensaje con espacios (primeros `validMessageLength` caracteres)
2. Agregue separador visual
3. Muestre también el filler (desde `validMessageLength` hasta `userPath.length`)

**Archivos afectados:**
- `games/criptocaballo/index.html` - Función `toggleSpaces()` (línea ~1659)

**Testing requerido:**
1. Resolver puzzle completo (12 casillas en 3x4, mensaje de 10 letras + 2 filler)
2. Presionar botón "ojito" (Ver con Espacios)
3. Verificar: Mensaje muestra espacios internos
4. Verificar: Filler sigue visible debajo del separador

---

#### 2. CriptoCaballo: Pistas (iniciales y finales) no se muestran en modo jugador

**Descripción:**
Cuando el admin marca pistas iniciales y finales (usando los botones "Inicio" y "Fin"), estas pistas NO se muestran al usuario en la pantalla de jugador.

**Estado:** 🟡 Pendiente
**Prioridad:** Media (afecta funcionalidad de ayuda al jugador)
**Fecha reportado:** 6 de diciembre de 2025

**Comportamiento esperado:**
Las casillas marcadas como pistas deben mostrarse visualmente diferentes (ej: con color distintivo o badge) en el modo jugador, para ayudar al usuario a saber por dónde empezar/terminar.

**Causa raíz probable:**
Las pistas se guardan en variables del admin pero no se transfieren al renderizado del jugador, o no se guardan en Supabase junto con el puzzle.

**Solución propuesta:**
1. Guardar pistas en Supabase junto con el puzzle (campos `start_hints` y `end_hints`)
2. Al cargar puzzle desde Supabase, aplicar estilos visuales a las casillas con pistas
3. Agregar clase CSS especial para pistas (ej: `hint-cell` con border amarillo o glow)

**Archivos afectados:**
- `games/criptocaballo/index.html` - Funciones de guardado/carga y renderizado

**Testing requerido:**
1. Como admin: Crear puzzle 3x4, marcar 2 pistas iniciales y 1 pista final
2. Guardar puzzle en Supabase
3. Como jugador: Cargar puzzle para esa fecha/tamaño
4. Verificar: Las 3 casillas de pistas tienen estilo distintivo visible

---

#### 3. CriptoCaballo: Estado del puzzle se pierde al cambiar de tamaño de tablero

**Descripción:**
Cuando el usuario resuelve un puzzle (ej: 3x4) y cambia a otro tamaño (4x5, 5x5), al volver al tamaño original (3x4), el puzzle ya no está resuelto. El tablero aparece limpio.

**Estado:** 🟡 Pendiente
**Prioridad:** Media (afecta UX pero no funcionalidad core)
**Fecha reportado:** 5 de diciembre de 2025

**Comportamiento esperado:**
El estado de cada tamaño de tablero debe mantenerse independientemente. Si resuelvo 3x4 y cambio a 4x5, cuando vuelva a 3x4 debe ver mi progreso guardado.

**Causa raíz:**
La función `setBoardSize()` resetea variables de estado globales compartidas:
```javascript
userPath = [];
currentPath = [];
globalTokens = [];
validMessageLength = 0;
```

Estas variables son compartidas entre todos los tamaños, por lo que al cambiar de tamaño, se pierden.

**Solución propuesta:**
Implementar sistema de caché que guarde estado por tamaño de tablero:

```javascript
// Cache para guardar el estado de cada tamaño
const boardStateCache = {};

function saveBoardState() {
    const key = `${rows}x${cols}`;
    boardStateCache[key] = {
        userPath: [...userPath],
        currentPath: [...currentPath],
        globalTokens: [...globalTokens],
        validMessageLength: validMessageLength,
        message: document.getElementById('messageInput')?.value || '',
        isCompleted: userPath.length === currentPath.length && userPath.length > 0
    };
}

function restoreBoardState() {
    const key = `${rows}x${cols}`;
    if (boardStateCache[key]) {
        const state = boardStateCache[key];
        userPath = [...state.userPath];
        currentPath = [...state.currentPath];
        globalTokens = [...state.globalTokens];
        validMessageLength = state.validMessageLength;

        const messageInput = document.getElementById('messageInput');
        if (messageInput) messageInput.value = state.message;

        if (state.isCompleted) {
            renderUserPath();
            updateUserDecodedText();
        }
    }
}
```

Llamar a `saveBoardState()` antes de cambiar tamaño y `restoreBoardState()` después.

**Archivos afectados:**
- `games/criptocaballo/index.html` - líneas ~999-1054 (función `setBoardSize`)

**Testing requerido:**
1. Resolver puzzle 3x4 completamente
2. Cambiar a 4x5
3. Volver a 3x4
4. Verificar: El puzzle 3x4 debe seguir resuelto

---

#### 2. Scroll trabado en Firefox Mobile en todas las páginas

**Descripción:**
El scroll funciona perfectamente en Chrome Mobile, pero en Firefox Mobile apenas se mueve unos milímetros. Esto afecta a todas las páginas del sitio (privacy-policy.html, contact.html, about.html, chess_rules.html, articles.html).

**Estado:** 🟡 Pendiente
**Prioridad:** Media (la mayoría de usuarios usa Chrome Mobile)
**Fecha reportado:** 23 de noviembre de 2025

**Detalles técnicos:**
- Firefox Mobile no soporta `-webkit-overflow-scrolling: touch`
- Se agregó `touch-action: pan-y pinch-zoom;` pero el problema persiste
- Chrome funciona perfectamente con el CSS actual
- El CSS global ya tiene fixes para mobile (lines 93-152 en neonchess-style.css)

**Intentos de solución:**
1. ✅ Agregado `touch-action: pan-y pinch-zoom;` a html, body, containers
2. ✅ Cambiado `overflow-y: scroll` → `overflow-y: auto`
3. ✅ Agregado `overscroll-behavior-y: auto`
4. ✅ Agregado `pointer-events: none` al background animado
5. ❌ El problema persiste en Firefox

**Próximos pasos a investigar:**
- [ ] Probar con `touch-action: manipulation` en lugar de `pan-y pinch-zoom`
- [ ] Revisar si hay algún elemento con `position: fixed` bloqueando touch events
- [ ] Probar remover completamente el background animado en Firefox
- [ ] Investigar si `will-change` o `transform: translateZ(0)` ayudan
- [ ] Consultar Firefox DevTools para debugging específico

**Workaround temporal:**
Recomendar a usuarios de Firefox que usen Chrome Mobile para mejor experiencia.

**Documentación:**
- Sección #11 en `docs/ERRORES_Y_SOLUCIONES.md`

---

### 🟢 PRIORIDAD BAJA

Ninguno actualmente.

---

## ✅ Issues Resueltos Recientemente

### CriptoCaballo: Contenido no centrado en desktop
- **Resuelto:** 6 de diciembre de 2025
- **Problema:** El contenido quedaba alineado a la izquierda en desktop
- **Solución:** Removido `width: 100%` de `.main-layout` CSS para permitir que el wrapper padre con `items-center` centre correctamente el grid
- **Archivos afectados:** games/criptocaballo/index.html
- **Commits:** 7e9f7fd, 9eb0cab, 8d2d261

### CriptoCaballo: Footer sin estilo ChessArcade
- **Resuelto:** 6 de diciembre de 2025
- **Problema:** Footer muy plano, sin matching con el diseño del sitio
- **Solución:** Rediseñado completo con gradiente púrpura/oscuro, borde cyan 3px con glow, fuente Orbitron, uppercase, hover effects
- **Archivos afectados:** games/criptocaballo/index.html (líneas 1819-1836)
- **Commit:** 7e9f7fd

### CriptoCaballo: Al cambiar tamaño de tablero, ignora fecha seleccionada en date picker
- **Resuelto:** 6 de diciembre de 2025
- **Problema:** Al cambiar tamaños de tablero, siempre usaba fecha actual en lugar de fecha seleccionada
- **Causa raíz:** `playerSelectSize()` usaba `new Date()` en vez de leer `.date-input`
- **Solución:** Leer fecha desde `document.querySelector('.date-input').value`
- **Archivos afectados:** games/criptocaballo/index.html (línea ~1067)

### CriptoCaballo: Puzzles aleatorios aparecen para fechas sin puzzle guardado
- **Resuelto:** 6 de diciembre de 2025
- **Problema:** Para fechas sin puzzle en Supabase, se generaban puzzles aleatorios con letras
- **Solución:** Dejar tablero vacío y mostrar mensaje "No hay puzzle oficial para esta fecha y tamaño"
- **Archivos afectados:** games/criptocaballo/index.html (líneas 1105-1125)

### CriptoCaballo: Botón "Ver con Espacios" incluye caracteres filler en el mensaje
- **Resuelto:** 6 de diciembre de 2025
- **Problema:** Al mostrar mensaje con espacios, incluía las casillas filler (rojas) en el texto
- **Solución:** Limitar iteración a `validMessageLength` en vez de todo `userPath`
- **Archivos afectados:** games/criptocaballo/index.html (función `toggleSpaces()`, líneas 1659-1677)

### Scroll trabado por `min-height: 100vh;` en estilos inline
- **Resuelto:** 23 de noviembre de 2025
- **Solución:** Remover estilos inline de contenedores
- **Páginas afectadas:** contact.html, privacy-policy.html
- **Documentación:** Sección #10 en ERRORES_Y_SOLUCIONES.md

---

## 💡 Mejoras Planificadas (No Bugs)

### UX/UI
- [ ] Agregar indicador visual de carga en leaderboards
- [ ] Mejorar feedback visual cuando se envía formulario de contacto
- [ ] Agregar animación de transición entre páginas

### Performance
- [ ] Lazy loading de imágenes en about.html
- [ ] Minificar CSS y JS en producción
- [ ] Optimizar tamaño de imágenes

### Accesibilidad
- [ ] Mejorar contraste de texto en modo oscuro
- [ ] Agregar navegación por teclado completa
- [ ] Agregar aria-labels a todos los botones interactivos

---

## 📝 Notas

- Este archivo debe actualizarse cada vez que se descubre un nuevo issue
- Los issues resueltos deben moverse a la sección "Resueltos" con fecha y solución
- Prioridades:
  - 🔴 **ALTA**: Afecta funcionalidad core, muchos usuarios, o experiencia crítica
  - 🟡 **MEDIA**: Afecta minoría de usuarios o tiene workaround aceptable
  - 🟢 **BAJA**: Mejoras "nice to have", pulido, edge cases

---

## 🔗 Referencias

- **Errores documentados:** `docs/ERRORES_Y_SOLUCIONES.md`
- **Roadmap de features:** `docs/ROADMAP.md`
- **Testing:** `docs/TESTING.md`
