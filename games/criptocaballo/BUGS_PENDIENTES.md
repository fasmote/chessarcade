# 🐛 Bugs Pendientes - CriptoCaballo

**Última actualización:** 11 de diciembre de 2025

---

## 🔴 PRIORIDAD ALTA (Críticos)

### 1. config.js no se carga de forma consistente en modo usuario (404)
**Estado:** 🔴 CRÍTICO
**Fecha reportado:** 8 de diciembre de 2025
**Impacto:** A veces el juego no funciona para ningún usuario

**Descripción:**
El archivo `config.js` que contiene las credenciales de Supabase NO se carga de forma consistente en el modo usuario. A veces carga correctamente, otras veces devuelve 404, lo que impide conectar a Supabase y cargar puzzles.

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

---

### 2. Puzzle guardado no se carga al cambiar tamaño de tablero
**Estado:** 🔴 CRÍTICO
**Fecha reportado:** 5 de diciembre de 2025
**Impacto:** Rompe funcionalidad principal del juego

**Descripción:**
Cuando el admin guarda un puzzle (ej: 8x8) y el usuario selecciona ese tamaño, el juego genera un puzzle aleatorio en lugar de cargar el puzzle guardado desde Supabase.

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

---

### 3. ✅ RESUELTO - Múltiples casillas marcadas como inicio al retroceder
**Estado:** ✅ RESUELTO
**Fecha reportado:** 11 de diciembre de 2025
**Fecha resuelto:** 12 de diciembre de 2025
**Impacto:** Confundía al usuario sobre dónde empezar

**Descripción:**
En modo admin y usuario, si el usuario comenzaba a resolver, retrocedía con UNDO y volvía a comenzar, quedaban marcadas VARIAS casillas en verde como inicio.

**Causa raíz:**
La lógica de UNDO en `admin.html:1532` y `index.html:1782` no removía la clase `start-cell` al hacer undo de la primera celda. Cuando el usuario hacía click en una nueva celda inicial, se agregaba otra `start-cell` sin limpiar la anterior.

**Solución implementada:**
Agregado `'start-cell'` a la lista de clases removidas en la lógica de UNDO:

```javascript
// ANTES (línea 1532 en admin.html y 1782 en index.html):
cell.classList.remove('user-selected', 'message-final-char', 'user-selected-filler', 'user-selected-separator');

// DESPUÉS:
cell.classList.remove('user-selected', 'message-final-char', 'user-selected-filler', 'user-selected-separator', 'start-cell');
```

**Archivos modificados:**
- `games/criptocaballo/admin.html` - línea 1532
- `games/criptocaballo/index.html` - línea 1782

**Commit:** `bfe8778` - "fix: Remove start-cell class on UNDO to prevent multiple start cells"

---

## 🟡 PRIORIDAD MEDIA

### 4. Pistas (iniciales y finales) no se muestran en modo jugador
**Estado:** 🟡 Pendiente
**Fecha reportado:** 6 de diciembre de 2025
**Impacto:** Afecta funcionalidad de ayuda al jugador

**Descripción:**
Cuando el admin marca pistas iniciales y finales (usando los botones "Inicio" y "Fin"), estas pistas NO se muestran al usuario en la pantalla de jugador.

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

---

### 5. Estado del puzzle se pierde al cambiar de tamaño de tablero
**Estado:** 🟡 Pendiente
**Fecha reportado:** 5 de diciembre de 2025
**Impacto:** Mala UX pero no rompe funcionalidad core

**Descripción:**
Cuando el usuario resuelve un puzzle (ej: 3x4) y cambia a otro tamaño (4x5, 5x5), al volver al tamaño original (3x4), el puzzle ya no está resuelto. El tablero aparece limpio.

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

---

### 6. Scroll trabado en Firefox Mobile en todas las páginas
**Estado:** 🟡 Pendiente
**Fecha reportado:** 23 de noviembre de 2025
**Impacto:** Afecta minoría de usuarios (mayoría usa Chrome)

**Descripción:**
El scroll funciona perfectamente en Chrome Mobile, pero en Firefox Mobile apenas se mueve unos milímetros. Esto afecta a todas las páginas del sitio (privacy-policy.html, contact.html, about.html, chess_rules.html, articles.html).

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

---

### 7. Scroll no funciona en mobile en chess_rules.html
**Estado:** 🟡 Pendiente
**Fecha reportado:** 11 de diciembre de 2025
**Impacto:** Usuarios de mobile no pueden leer las reglas completas

**Descripción:**
En la página de reglas del ajedrez (chess_rules.html), el scroll NO funciona en dispositivos móviles. El usuario no puede desplazarse hacia abajo para leer el contenido completo.

**Comportamiento:**
- **Esperado:** El usuario puede hacer scroll vertical para ver todas las reglas
- **Actual:** El scroll está bloqueado o no responde en mobile

**Causa raíz probable:**
- Puede ser el mismo issue que afecta a Firefox Mobile en otras páginas
- Posible conflicto con CSS de `overflow`, `touch-action` o `position: fixed`
- Background animado bloqueando touch events

**Solución propuesta:**
Similar a otras páginas con problemas de scroll:
1. Verificar que el contenedor principal tenga `overflow-y: auto`
2. Agregar `touch-action: pan-y` al contenedor de contenido
3. Asegurar que el background animado tenga `pointer-events: none`
4. Remover cualquier `height: 100vh` que pueda estar bloqueando scroll

**Archivos afectados:**
- `chess_rules.html`
- `assets/css/neonchess-style.css`

---

### 8. Imagen del movimiento de piezas no se abre en desktop
**Estado:** 🟡 Pendiente
**Fecha reportado:** 11 de diciembre de 2025
**Impacto:** Usuarios de desktop no pueden ver detalles de movimientos

**Descripción:**
En la página chess_rules.html (escritorio), cuando el usuario hace click en la imagen que muestra el movimiento de las piezas, NO se abre/amplía la imagen.

**Comportamiento:**
- **Esperado:** Al hacer click en la imagen, se abre en modal/lightbox o se amplía para ver en detalle
- **Actual:** El click no hace nada, la imagen no se amplía

**Causa raíz probable:**
- Falta JavaScript para manejar el click event de la imagen
- No hay modal/lightbox implementado para mostrar imagen ampliada
- El enlace/botón está roto o no existe

**Solución propuesta:**

Opción 1 - Modal simple con CSS:
```html
<div class="image-modal" id="imageModal">
    <span class="close">&times;</span>
    <img class="modal-content" id="modalImage">
</div>

<img src="path/to/piece-moves.png" onclick="openModal(this)" style="cursor: pointer;">

<script>
function openModal(img) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    modal.style.display = "block";
    modalImg.src = img.src;
}
</script>
```

Opción 2 - Link simple:
```html
<a href="path/to/piece-moves.png" target="_blank">
    <img src="path/to/piece-moves.png" alt="Movimiento de piezas">
</a>
```

**Archivos afectados:**
- `chess_rules.html` - Sección de imágenes de movimientos
- CSS para modal (si se usa Opción 1)

---

## 🟢 PRIORIDAD BAJA (Cosméticos)

### 9. Tablero se desplaza progresivamente a la derecha en tamaños grandes (8x8)
**Estado:** 🟢 Cosmético
**Fecha reportado:** 8 de diciembre de 2025
**Impacto:** Visual, no afecta jugabilidad

**Descripción:**
En modo usuario, el tablero NO está perfectamente centrado. A medida que crece el tamaño (3x4 se ve bien, 8x8 se ve muy desplazado a la derecha), el desplazamiento se hace más evidente.

**Evidencia:**
- Screenshot: `screenshot_errores/197_CC_usuario_tablero_desplazado_.png`
- Tablero 8x8 visiblemente más a la derecha que centro de pantalla
- Tableros pequeños (3x4, 4x5) se ven casi centrados

**Causa raíz:**
El `.board-wrapper` usa un grid de 2 columnas:
- Columna 1: Números de filas (ranks-col) - ancho variable según tamaño
- Columna 2: Tablero (chess-grid)

Cuando el tablero crece, la columna 1 también crece, empujando todo el conjunto hacia la derecha. El `justify-self: center` centra el GRID COMPLETO, pero no compensa por el ancho asimétrico de las columnas.

**Solución propuesta:**
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

**Notas:**
Usuario decidió dejarlo para futuro: "el desplazamiento se va dando a medida que el tablero crece, pero empieza bien, guardalo como bug a solucionar a futuro, ya me canse"

---

## 📝 Notas

- Este archivo debe actualizarse cada vez que se descubre un nuevo bug
- Los bugs resueltos deben moverse a un archivo separado `BUGS_RESUELTOS.md` con fecha y solución
- Prioridades:
  - 🔴 **ALTA**: Afecta funcionalidad core, muchos usuarios, o experiencia crítica
  - 🟡 **MEDIA**: Afecta minoría de usuarios o tiene workaround aceptable
  - 🟢 **BAJA**: Mejoras "nice to have", pulido, edge cases

---

## 🔗 Referencias

- **Errores documentados:** `docs/ERRORES_Y_SOLUCIONES.md`
- **Issues conocidos del proyecto:** `docs/KNOWN_ISSUES.md`
- **Roadmap de features:** `docs/ROADMAP.md`
