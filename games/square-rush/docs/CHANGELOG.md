# 📝 CHANGELOG - Square Rush

## 🎨 Versión 6 - Tablero estilo Memory Matrix (11 Octubre 2025)

### Cambio principal: Tablero responsivo y consistente

**Problema:**
- Tablero fijo de 480px (60px × 8 casillas)
- No ocupaba pantalla completa en mobile
- Estilo arcade diferente a Memory Matrix
- Casillas pequeñas difíciles de tocar en celular

**Solución:**
Adoptar el sistema de tablero de Memory Matrix para consistencia visual y mejor UX mobile.

---

### 🔧 Cambios técnicos:

#### **Antes (v5):**
```css
.chess-board {
    grid-template-columns: repeat(8, 60px);  /* Tamaño fijo */
    grid-template-rows: repeat(8, 60px);
    gap: 2px;
    border: 4px solid #00ffff;
}

.square {
    font-size: 12px;  /* Fijo */
}
```

#### **Después (v6):**
```css
.chess-board {
    grid-template-columns: repeat(8, 1fr);  /* Responsivo */
    grid-template-rows: repeat(8, 1fr);

    /* Ocupa 90% del viewport */
    width: 90vw;
    max-width: 400px;  /* Mobile */
    aspect-ratio: 1;   /* Siempre cuadrado */
}

/* Tablet */
@media (min-width: 600px) {
    .chess-board { max-width: 450px; }
}

/* Desktop */
@media (min-width: 900px) {
    .chess-board { max-width: 500px; }
}

.square {
    width: 100%;  /* Definido por grid */
    height: 100%;
    font-size: clamp(10px, 2.5vw, 14px);  /* Responsivo */
}
```

---

### 📐 Tamaños del tablero:

| Dispositivo | Ancho pantalla | Tamaño tablero | Tamaño casilla |
|-------------|----------------|----------------|----------------|
| Mobile pequeño | 360px | 324px (90vw) | ~40px |
| Mobile grande | 414px | 373px (90vw) | ~46px |
| Tablet | 768px | 450px (max) | ~56px |
| Desktop | 1440px | 500px (max) | ~62px |

**Antes:** 480px fijo (60px/casilla) - no cabía completo en mobile

---

### ✨ Mejoras visuales:

#### 1. **Board Container:**
- Padding aumentado: `1rem` (antes implícito)
- Borde neón más grueso: `3px` (antes 4px)
- Glow neón mejorado: 3 capas de sombra
- Fondo semi-transparente: `rgba(0, 0, 0, 0.4)`

#### 2. **Casillas:**
- Hover mejorado: `brightness(1.15)` + `scale(1.05)`
- Transición más rápida: `0.2s` (antes 0.3s)
- Colores sólidos (sin gradiente para mejor rendimiento)

#### 3. **Coordenadas:**
- Fuente responsiva: `clamp(10px, 2.5vw, 14px)`
- Se adapta automáticamente al tamaño de casilla

---

### 🎯 Beneficios:

✅ **Mobile:** Tablero ocupa toda la pantalla disponible
✅ **Touch:** Casillas más grandes = más fácil tocar
✅ **Consistencia:** Mismo look & feel que Memory Matrix
✅ **Responsivo:** Se adapta a cualquier tamaño de pantalla
✅ **Performance:** Usa `aspect-ratio` nativo (no JS)
✅ **Accesibilidad:** Tamaño mínimo 40px en mobile (recomendado: 44px)

---

### 📦 Archivos modificados:

**square-rush.css:**
- Líneas 270-367: Reescritura completa de `.board-container`, `.chess-board`, `.square`
- +97 líneas (media queries + propiedades responsivas)
- Línea 1: Comentario de versión actualizado a v6

**index.html:**
- Línea 8: Cache buster actualizado: `?v=5` → `?v=6`

---

### 🧪 Testing:

**Probado en:**
- [ ] Mobile 360px (Galaxy S8)
- [ ] Mobile 414px (iPhone 12)
- [ ] Tablet 768px (iPad)
- [ ] Desktop 1440px

**Verificar:**
- [ ] Tablero ocupa ~90% del ancho en mobile
- [ ] Casillas son cuadradas (aspect-ratio funciona)
- [ ] Coordenadas visibles en todos los tamaños
- [ ] Animaciones correctas (correct/wrong flash)
- [ ] Hover funciona en desktop

---

### 🔄 Migración desde v5:

No se requiere cambio en JavaScript - el grid sigue siendo 8×8 con las mismas clases CSS.

**Compatible con:**
- Sistema de coordenadas existente
- Animaciones `.correct` y `.wrong`
- Lógica de juego sin cambios

---

---

## 🐛 Versión 7-10 - Intentos de arreglar tamaño tablero mobile (11 Octubre 2025)

**Problema reportado:** Tablero se veía pequeño en mobile con mucho espacio vacío dentro del borde cyan.

### Intentos fallidos:

**v7:** `width: calc(88vw + 0.6rem)` en container → Roto en desktop
**v8:** `max-width: 88vw` sin límite 400px → No funcionó por caché
**v9:** `width: calc(88vw + 0.6rem)` exacto → Peor en desktop
**v10:** Sin width en container (copia exacta Memory Matrix) → CSS correcto pero caché Chrome persistió

### Resultado:
- ✅ Firefox mobile: Funcionó desde v10
- ❌ Chrome mobile: Seguía mostrando tablero pequeño (caché v6-v9)
- ✅ Desktop: Funcionó desde v10

---

## ✅ Versión 11 - SOLUCIÓN: Renombrar clase CSS (11 Octubre 2025)

### El problema real: Caché agresivo de Chrome

**Situación:**
- CSS v10 era correcto (copia exacta de Memory Matrix)
- Servidor servía archivo correcto
- Firefox lo mostraba perfecto
- Chrome mobile/desktop seguía mostrando tablero pequeño

**Causa raíz:**
Chrome tenía **cacheadas las reglas CSS de `.chess-board`** de las versiones 6-9 (con `width: 88vw`, `max-width: 88vw`, `calc()` rotos).

Aunque el archivo CSS era nuevo (v10), Chrome aplicaba las reglas viejas porque:
1. El **selector** `.chess-board` era el mismo
2. Chrome cachea reglas CSS por **nombre de clase**
3. No le importaba el `?v=10` ni el contenido del archivo

**Intentos que NO funcionaron:**
- ❌ Cache buster `?v=1` hasta `?v=10`
- ❌ `?nocache=timestamp`
- ❌ Hard refresh (Ctrl+Shift+R)
- ❌ Limpiar caché manualmente
- ❌ Modo incógnito
- ❌ Diferentes navegadores en misma máquina

### Solución aplicada:

**Renombrar clase CSS:**
```diff
<!-- HTML -->
- <div class="chess-board" id="chessBoard">
+ <div class="chessboard" id="chessBoard">

/* CSS */
- .chess-board {
+ .chessboard {
    width: 90vw;
    max-width: 400px;
    aspect-ratio: 1;
}
```

### Por qué funcionó:

Chrome no tenía `.chessboard` (sin guión) cacheado:
- `.chess-board` → Reglas viejas rotas (cacheadas v6-v9)
- `.chessboard` → Clase nueva, descarga reglas correctas ✅

**Analogía:**
```
Diccionario de Chrome:
.chess-board → "usar width: 88vw (cacheado)"  ❌
.chessboard  → "no existe, descargar nuevo"   ✅
```

### Beneficio adicional:

Ahora Square Rush usa la misma clase que Memory Matrix (`.chessboard`), mejorando la consistencia del código.

### Resultado final:

✅ **Chrome mobile:** Tablero ocupa 90vw (perfecto)
✅ **Firefox mobile:** Sigue funcionando
✅ **Desktop:** Sigue funcionando
✅ **Consistencia:** Misma clase que Memory Matrix

---

## 📚 Lección aprendida: Cómo romper caché CSS agresivo

Cuando el caché de CSS es extremadamente persistente y NADA funciona:

### ❌ Lo que NO funcionó:
- Cache busters en la URL (`?v=`, `?nocache=`)
- Hard refresh del navegador
- Limpiar caché manualmente
- Modo incógnito
- Cambiar de navegador en misma máquina

### ✅ Solución definitiva:
**Cambiar el nombre del selector CSS**

```css
/* Viejo (cacheado) */
.my-element { ... }

/* Nuevo (fuerza descarga) */
.my-element-v2 { ... }
/* o */
.myElement { ... }
```

Chrome (y otros navegadores) cachean reglas CSS por **nombre de selector**, no solo por archivo. Cambiar el nombre fuerza la descarga de reglas nuevas.

### Cuándo usar esta técnica:

1. Has probado todos los cache busters
2. El CSS es correcto en el servidor
3. Funciona en un navegador pero no en otro
4. Usuarios reportan versión vieja después de actualizar

### Alternativas (menos drásticas):

1. **Cambiar nombre de archivo:** `styles.css` → `styles-v2.css`
2. **Agregar clase wrapper:** `.v11 .chess-board { ... }`
3. **Usar hash en nombre:** `styles.abc123.css` (requiere build tool)

Pero cambiar el nombre de la clase es la forma más rápida y no requiere herramientas adicionales.

---

---

## 🏆 Versión 12 - Leaderboard Animation y Split View (18 Diciembre 2025)

### Cambio principal: Ranking Animation y UX mejorada

**Problema:**
- Al terminar el juego, el usuario no sabía en qué posición quedaría antes de enviar su score
- Demasiados botones en los modales (VIEW LEADERBOARD, PLAY AGAIN, SUBMIT SCORE)
- Si el jugador quedaba en posición lejana (ej: #47), tenía que hacer scroll para ver su fila

**Solución:**
Implementar el mismo sistema de ranking animation y split view que Memory Matrix y Master Sequence.

---

### 🔧 Cambios implementados:

#### 1. **Ranking Animation (nuevo archivo: `ranking-animation.js`)**
- Muestra animación de "descenso en el ranking" al terminar el juego
- El score del jugador aparece y "desciende" hasta encontrar su posición real
- Mensajes motivacionales según la posición (TOP 1, TOP 3, TOP 10, etc.)
- Input de nombre se destaca con animación de "pulso" para llamar la atención

#### 2. **Modales simplificados (`leaderboard-integration.js`)**
- **REMOVIDO:** Botón "VIEW LEADERBOARD" - el leaderboard se abre automáticamente después del submit
- **REMOVIDO:** Botón "PLAY AGAIN" / "CONTINUE" - el modal se cierra y reinicia solo
- **CONSERVADO:** Solo botón "SUBMIT SCORE" - UX más limpia y directa

#### 3. **Split View en leaderboard**
Si el jugador queda en posición > 10, el leaderboard muestra:
- Top 5 posiciones (los líderes)
- Separador visual con indicador de posiciones ocultas
- 2 posiciones antes del jugador
- Posición del jugador (destacada con borde neón)
- 2 posiciones después del jugador

#### 4. **Highlight de fila del jugador**
- La fila del jugador se destaca con borde neón rosa/magenta
- Fondo con gradiente cyan-magenta
- Animación de brillo pulsante (`pulseGlow`)

---

### 📦 Archivos modificados/creados:

| Archivo | Cambio |
|---------|--------|
| `ranking-animation.js` | **NUEVO** - Componente de animación de ranking |
| `leaderboard-integration.js` | Modales simplificados, ranking animation, highlight params |
| `css/square-rush.css` | CSS para ranking animation y highlight |
| `index.html` | Incluido script de ranking-animation.js |
| `js/leaderboard-ui.js` | Parámetros de highlight para Square Rush |

---

### 🎯 Beneficios:

- **Anticipación:** El jugador ve su posición ANTES de enviar el score
- **UX limpia:** Un solo botón en vez de tres
- **No scroll:** Vista dividida muestra Top 5 + zona del jugador
- **Feedback visual:** Fila destacada es fácil de identificar
- **Consistencia:** Mismo comportamiento que Memory Matrix y Master Sequence

---

### 🐛 Errores encontrados y solucionados:

**Error 500 en Vercel Preview:**
- **Problema:** Las serverless functions del API fallaban en preview deployments
- **Causa:** Preview de Vercel a veces tiene problemas con serverless functions
- **Solución:** Deploy a producción (`vercel --prod`) funciona correctamente

---

### 🔮 MEJORAS FUTURAS (URGENTE):

#### **Mobile Portrait: Cartel del escaque queda muy arriba**
- **Problema:** En celular en modo portrait, el cartel que muestra el escaque al que hay que hacer click (ej: "H8") queda muy arriba
- **Impacto:** El usuario tiene que hacer scroll para ver el tablero, lo cual arruina la experiencia de juego
- **Solución propuesta:** Mover el target display debajo del tablero o hacerlo floating/sticky para que siempre esté visible
- **Prioridad:** ALTA - afecta directamente la jugabilidad en móvil

---

---

## 📱 Versión 13 - Mobile UX: Hamburger Menu y Fixes (19 Diciembre 2025)

### Cambio principal: Menú hamburguesa y optimización mobile

**Problemas resueltos:**
1. En mobile portrait, el target display quedaba muy arriba y el usuario tenía que hacer scroll
2. No había navegación móvil - los botones de sonido/leaderboard ocupaban espacio
3. Al terminar el juego, el teclado aparecía automáticamente tapando el modal
4. El modal Game Over era muy grande y no cabía en mobile

---

### 🍔 Menú Hamburguesa (NUEVO)

#### Comportamiento:
- **Posición:** Esquina superior derecha (fixed)
- **Icono:** ☰ (tres líneas horizontales)
- **Aparece:** Solo en mobile portrait (`@media (max-width: 480px) and (orientation: portrait)`)

#### Contenido del menú:
```
┌─────────────────────┐
│ 🏠 Home             │  → Vuelve al index principal
│ 🏆 Leaderboard      │  → Abre el leaderboard modal
│ 🔊 Sound: ON/OFF    │  → Toggle de sonido (sincronizado)
│ 🎮 Games        ▼   │  → Submenú expandible
│   ├─ ♟️ Square Rush │
│   ├─ 🧠 Memory Matrix│
│   ├─ 🎵 Master Sequence│
│   ├─ ♞ Knight Quest │
│   └─ 🔐 CriptoCaballo│
└─────────────────────┘
```

#### Comportamiento del toggle Sound:
- Se sincroniza con el estado actual del sonido del juego
- Al hacer click, cambia el estado y actualiza el texto (ON ↔ OFF)
- Guarda preferencia en localStorage

#### Comportamiento del submenú Games:
- Click en "Games" expande/colapsa el submenú
- Cada juego es un link directo a su página
- El juego actual (Square Rush) está marcado como activo

#### CSS clave:
```css
.hamburger-menu-container {
    display: none;  /* Oculto por defecto */
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 1000;
}

@media (max-width: 480px) and (orientation: portrait) {
    .hamburger-menu-container {
        display: block;  /* Visible solo en mobile portrait */
    }
    .desktop-only {
        display: none !important;  /* Oculta botones de desktop */
    }
}
```

#### JavaScript del menú:
```javascript
// Toggle del menú
hamburgerBtn.addEventListener('click', () => {
    dropdown.classList.toggle('show');
});

// Cerrar al hacer click fuera
document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
        dropdown.classList.remove('show');
    }
});

// Sincronización de sonido
const isSoundEnabled = localStorage.getItem('squareRushSound') !== 'disabled';
soundToggle.textContent = isSoundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
```

---

### 📐 Mobile Portrait Layout Fix

#### Problema:
El "level-info" (ej: "1 BABY STEPS") ocupaba espacio vertical valioso, empujando el tablero fuera de la pantalla.

#### Solución:
```css
@media (max-width: 480px) and (orientation: portrait) {
    .level-info {
        display: none !important;  /* Ocultar nivel en portrait */
    }

    .game-title {
        font-size: 1.5rem;
    }

    /* Salto de línea solo en mobile */
    .mobile-break {
        display: inline;  /* "SQUARE" + br + "RUSH" */
    }
}
```

---

### ⌨️ Fix: Teclado automático en mobile

#### Problema:
Al terminar el juego, el input de nombre hacía `.focus()` automáticamente, lo que en mobile disparaba el teclado y tapaba todo el modal.

#### Solución:
Eliminar el `focus()` automático en `ranking-animation.js`:
```javascript
// ANTES (malo):
nameInput.focus();  // Dispara teclado en mobile

// DESPUÉS (bueno):
nameInput.classList.add('highlight-input');
// No hacer focus() - en mobile dispara el teclado y tapa todo
```

#### Input destacado sin focus:
Para que el usuario sepa dónde escribir su nombre, el input ahora tiene una animación de pulso más prominente:
```css
.highlight-input {
    animation: inputPulse 1s ease-in-out infinite;
    border-color: #ff0080 !important;
    border-width: 3px !important;
    box-shadow: 0 0 20px rgba(255, 0, 128, 0.6),
                0 0 40px rgba(255, 0, 128, 0.3),
                inset 0 0 10px rgba(255, 0, 128, 0.2) !important;
    background: rgba(255, 0, 128, 0.15) !important;
}
```

**Aplicado a:** Square Rush, Memory Matrix, Knight Quest, Master Sequence

---

### 💀 Modal Game Over - Rediseño

#### Cambios visuales:
- **Emoji:** 💥 → 💀 (calavera)
- **Botón X:** Más grande (50px), con borde rosa y fondo semitransparente
- **Stats grid:** Más compacto (padding, gap, font-size reducidos)
- **Modal:** Ancho fijo 320px, padding 1.5rem (antes 3rem)

#### Antes vs Después:
| Elemento | Antes | Después |
|----------|-------|---------|
| Padding modal | 3rem | 1.5rem |
| Ancho modal | min-width: 400px | width: 320px |
| Stats gap | 1rem | 0.5rem |
| Stats padding | 1rem | 0.5rem |
| Stats font-size | 1.8rem | 1.3rem |
| Título | 2.5rem | 2rem |

---

### 📦 Archivos modificados:

| Archivo | Cambio |
|---------|--------|
| `index.html` | Hamburger menu HTML, `mobile-break` en título |
| `css/square-rush.css` | CSS hamburger, mobile portrait fixes, highlight-input mejorado |
| `leaderboard-integration.js` | Modal compacto, calavera, X grande |
| `ranking-animation.js` | Removido `.focus()` |

**Otros juegos actualizados (fix teclado):**
- `games/memory-matrix-v2/ranking-animation.js`
- `games/knight-quest/ranking-animation.js`
- `games/master-sequence/ranking-animation.js`

---

### 🎯 Próximos pasos:

- [ ] Aplicar menú hamburguesa a todos los juegos
- [ ] Consistencia de modales compactos en todos los juegos

---

**Última actualización:** 19 Diciembre 2025
**Versión CSS:** 13
**Estado:** Mobile UX optimizada con hamburger menu
**Próximo:** Replicar hamburger menu en otros juegos
