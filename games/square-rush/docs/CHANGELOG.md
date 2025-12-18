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

**Última actualización:** 18 Diciembre 2025
**Versión CSS:** 12
**Estado:** Leaderboard con ranking animation y split view funcional
**Próximo:** Ajustar posición del target display en mobile portrait
