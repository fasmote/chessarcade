# 🐛 Issues Conocidos y Mejoras Futuras

**Última actualización:** 8 de diciembre de 2025

Este documento registra bugs conocidos, limitaciones técnicas y mejoras planificadas para ChessArcade que no son críticas pero deben resolverse eventualmente.

---

## 📋 Issues Activos

### 🔴 PRIORIDAD ALTA

#### 1. CriptoCaballo: config.js no se carga de forma consistente en modo usuario (404)

**Descripción:**
El archivo `config.js` que contiene las credenciales de Supabase NO se carga de forma consistente en el modo usuario. A veces carga correctamente, otras veces devuelve 404, lo que impide conectar a Supabase y cargar puzzles.

**Estado:** 🔴 CRÍTICO - Afecta disponibilidad total del juego
**Prioridad:** Alta (rompe funcionalidad principal de forma intermitente)
**Fecha reportado:** 8 de diciembre de 2025

**Evidencia:**
```
Log 203_CC_usuario.log (líneas 3-5):
config.js:1  Failed to load resource: the server responded with a status of 404 ()
CRYPTO_CONFIG cargado: ❌ NO
Supabase URL: TU_SUPABASE_URL
```

**Comportamiento:**
- **Esperado:** config.js siempre se carga y CRYPTO_CONFIG está disponible
- **Actual:** A veces carga (✅), otras veces 404 (❌)
- **Impacto:** Cuando falla, el usuario NO puede jugar - todos los puzzles muestran "No hay puzzle en Supabase"

**Causa raíz probable:**
- Issue de caché de Vercel
- Timing issue (script se ejecuta antes que config.js termine de cargar)
- Problema de path relativo vs absoluto

**Solución propuesta:**
1. **Inline config en index.html** (solución inmediata):
```html
<script>
window.CRYPTO_CONFIG = {
    supabase: {
        url: "https://eyuuujpwvgmpajrjhnah.supabase.co",
        anonKey: "eyJhbGciOiJIU..."
    }
};
</script>
<script src="criptocaballo.js"></script>
```

2. **Agregar retry logic** (solución robusta):
```javascript
async function loadConfig() {
    for(let i = 0; i < 3; i++) {
        try {
            await import('./config.js');
            if(window.CRYPTO_CONFIG) return true;
        } catch(e) {
            console.warn(`Config load attempt ${i+1} failed`);
            await new Promise(r => setTimeout(r, 100));
        }
    }
    console.error("❌ Config failed to load after 3 attempts");
    return false;
}
```

**Archivos afectados:**
- `games/criptocaballo/index.html` (línea que carga config.js)
- `games/criptocaballo/config.js`

**Testing requerido:**
1. Abrir index.html en modo usuario 10 veces seguidas (hard refresh cada vez)
2. Verificar que CRYPTO_CONFIG se carga TODAS las veces
3. Verificar que puzzles se cargan correctamente

---

#### 1. CriptoCaballo: Puzzle guardado en Supabase no se carga al cambiar tamaño de tablero

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

#### 1. CriptoCaballo: Pistas (iniciales y finales) no se muestran en modo jugador

**Descripción:**
Cuando el admin marca pistas iniciales y finales (usando los botones "Inicio" y "Fin"), estas pistas NO se muestran al usuario en la pantalla de jugador.

**Estado:** 🟡 Pendiente
**Prioridad:** Media (afecta funcionalidad de ayuda al jugador)
**Fecha reportado:** 6 de diciembre de 2025

**Comportamiento esperado:**
Las casillas marcadas como pistas deben mostrarse visualmente diferentes (ej: con color distintivo o badge) en el modo jugador, para ayudar al usuario a saber por dónde empezar/terminar.

**Causa raíz:**
La función `confirmSave()` (línea 1625) actualmente solo muestra un `alert("Simulación: Guardado en DB.")` y NO guarda nada en Supabase. Las pistas se aplican visualmente en modo admin pero no se persisten en la base de datos.

**Bloqueador:**
Este bug requiere primero implementar la funcionalidad completa de guardado en Supabase. Sin eso, no hay forma de persistir las pistas para cargarlas después.

**Solución propuesta (después de implementar guardado):**
1. Implementar `confirmSave()` para guardar en Supabase con campos `start_hints` y `end_hints`
2. Al cargar puzzle desde Supabase en modo jugador, aplicar estilos visuales a las casillas con pistas
3. Agregar clase CSS especial para pistas (ej: `hint-cell` con border amarillo o glow)

**Archivos afectados:**
- `games/criptocaballo/index.html` - Función `confirmSave()` (línea 1625) y carga de puzzles

**Testing requerido:**
1. Como admin: Crear puzzle 3x4, marcar 2 pistas iniciales y 1 pista final
2. Guardar puzzle en Supabase
3. Como jugador: Cargar puzzle para esa fecha/tamaño
4. Verificar: Las 3 casillas de pistas tienen estilo distintivo visible

---

#### 2. CriptoCaballo: Estado del puzzle se pierde al cambiar de tamaño de tablero

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

#### 1. CriptoCaballo: Tablero se desplaza progresivamente a la derecha en tamaños grandes (8x8)

**Descripción:**
En modo usuario, el tablero NO está perfectamente centrado. A medida que crece el tamaño (3x4 se ve bien, 8x8 se ve muy desplazado a la derecha), el desplazamiento se hace más evidente.

**Estado:** 🟢 Cosmético - No afecta jugabilidad
**Prioridad:** Baja (bug visual menor)
**Fecha reportado:** 8 de diciembre de 2025

**Evidencia:**
- Screenshot: `screenshot_errores/197_CC_usuario_tablero_desplazado_.png`
- Tablero 8x8 visiblemente más a la derecha que centro de pantalla
- Tableros pequeños (3x4, 4x5) se ven casi centrados

**Causa raíz:**
El `.board-wrapper` usa un grid de 2 columnas:
- Columna 1: Números de filas (ranks-col) - ancho variable según tamaño
- Columna 2: Tablero (chess-grid)

Cuando el tablero crece, la columna 1 también crece, empujando todo el conjunto hacia la derecha. El `justify-self: center` centra el GRID COMPLETO, pero no compensa por el ancho asimétrico de las columnas.

**Solución propuesta (cuando haya tiempo):**
```css
.board-wrapper {
    display: grid;
    grid-template-columns: max-content max-content;
    justify-self: center;
    transform: translateX(-10px); /* Compensar el offset de ranks */
}

/* O mejor aún, centrar basándose solo en el chess-grid */
.board-wrapper {
    position: relative;
    left: 50%;
}

.chess-grid {
    position: relative;
    left: -50%;
}
```

**Archivos afectados:**
- `games/criptocaballo/index.html` - CSS de `.board-wrapper` (línea ~241-250)

**Testing requerido:**
1. Probar todos los tamaños: 3x4, 4x5, 5x5, 5x6, 6x7, 8x8
2. Verificar que todos estén visualmente centrados
3. Verificar en desktop y mobile

**Notas:**
Usuario decidió dejarlo para futuro: "el desplazamiento se va dando a medida que el tablero crece, pero empieza bien, guardalo como bug a solucionar a futuro, ya me canse"

---

## ✅ Issues Resueltos Recientemente

### CriptoCaballo: Date picker en admin siempre vuelve a fecha actual al cambiar tamaño de tablero
- **Resuelto:** 8 de diciembre de 2025
- **Problema:** Selector de fecha persistía pero al cambiar tamaño de tablero, siempre cargaba puzzles de fecha actual
- **Causa raíz:** `document.querySelector('.date-input')` seleccionaba el PRIMER date picker (admin creation), NO el del "RETO DEL DÍA"
- **Solución:** Usar selector `.date-input:not(#puzzleDate)` para excluir el date picker del admin
- **Archivos afectados:** games/criptocaballo/admin.html (línea 1266)
- **Evidencia:** Log 202_CC_admin.log líneas 16-17, 27-28 mostraban el date picker incorrecto

### CriptoCaballo: Timer se reinicia al retroceder después de resolver correctamente (CRÍTICO)
- **Resuelto:** 6 de diciembre de 2025
- **Problema:** Permitía falsear tiempos en leaderboard (resolver en 30s, retroceder, avanzar = 1s)
- **Solución:** Agregar verificación `!messageCompletedCorrectly` antes de iniciar timer
- **Archivos afectados:** games/criptocaballo/index.html (línea 1370)
- **Commit:** cf39b86

### CriptoCaballo: Botón "Ver con Espacios" oculta filler
- **Resuelto:** 6 de diciembre de 2025
- **Problema:** Al mostrar mensaje con espacios, los caracteres filler (rojos) desaparecían
- **Solución:** Agregar bucle separado para construir y mostrar filler con clase `decoded-filler-char`
- **Archivos afectados:** games/criptocaballo/index.html (función `toggleSpaces()`, líneas 1679-1695)
- **Commit:** cf39b86

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
