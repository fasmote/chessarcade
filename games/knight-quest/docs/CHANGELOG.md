# Changelog

## [1.1.3] - 2025-12-20

### Fixed 🐛
- **✅ OVERFLOW HORIZONTAL EN MOBILE PORTRAIT SOLUCIONADO**
  - **Síntoma:** Menú hamburguesa se desplazaba hacia la derecha gradualmente, aparecía scroll horizontal
  - **Causa:** Animación `neonGridMove` con `transform: translate(40px, 40px)` causaba overflow en navegadores móviles reales
  - **Nota:** El bug NO aparecía en el simulador de Chrome, solo en celulares físicos
  - **Diagnóstico:** Script de debug reveló que `window.innerWidth` crecía cíclicamente mientras `document.offsetWidth` permanecía constante

### Changed 🔄
- **Stats reposicionados en mobile portrait**
  - Desktop: Stats permanecen debajo del título (posición original)
  - Mobile portrait: Stats movidos después de botones HINT/UNDO
  - Implementación: Dos divs `.game-stats-desktop` y `.game-stats-mobile` con CSS condicional

### Technical Details ⚙️
```css
/* Solución al overflow */
@media (max-width: 767px) and (orientation: portrait) {
    .neon-container::before {
        animation: none !important;
        transform: none !important;
    }

    .game-stats-desktop { display: none !important; }
    .game-stats-mobile { display: grid !important; }
}
```

```javascript
// JavaScript actualizado para sincronizar ambos sets de stats
function updateTimer() {
    // Update both mobile and desktop
    const timeEl = document.getElementById('timeCount');
    const timeElD = document.getElementById('timeCountDesktop');
    if (timeEl) timeEl.textContent = timeStr;
    if (timeElD) timeElD.textContent = timeStr;
}
```

### Files Modified 📝
- `games/knight-quest/index.html`
  - CSS: Desactivar animación grid en portrait
  - CSS: Mostrar/ocultar stats según viewport
  - HTML: Duplicar div de stats (desktop/mobile)
  - JS: Actualizar ambos sets de stats

### Documentation 📚
- Bug documentado en `docs/ERRORES_Y_SOLUCIONES.md` (#20)
- Incluye patrón de debug para overflow horizontal

---

## [1.1.2] - 2025-10-14

### Fixed 🐛
- **✅ TABLERO 8x8 AHORA CENTRADO EN MÓVIL**
  - Problema: Tablero 8x8 aparecía desalineado a la izquierda en viewport móvil
  - Usuario tenía que hacer zoom out manualmente para centrarlo
  - Causa: Padding excesivo del contenedor + tamaño fijo del tablero

### Improved 🎨
- **Optimización de espacio en móvil (`@media max-width: 768px`)**
  - `.neon-container`: Padding reducido de 2rem a 0.5rem
  - `.chessboard`: Agregado `width: fit-content` + `margin: 1rem auto`
  - Padding del tablero reducido de 15px a 8px

- **Tamaños de casillas ajustados para máximo aprovechamiento**
  - 4x4: 80px (antes 60px) - tablero ~344px
  - 6x6: 55px (antes 50px) - tablero ~346px
  - 8x8: 43px (antes 45px → 42px) - tablero ~360px
  - 10x10: 34px (antes 35px → 33px) - tablero ~356px
  - Todos los tableros ahora ocupan ~340-360px (óptimo para móviles 375px+)

### Technical Details ⚙️
```css
/* index.html líneas 973-1008 */
@media (max-width: 768px) {
    .neon-container {
        padding: 0.5rem;  /* Antes: var(--space-lg) = 2rem */
    }

    .chessboard {
        margin: 1rem auto;
        padding: 8px;  /* Antes: 15px */
        width: fit-content;  /* Nuevo: fuerza centrado */
    }

    .chessboard.size-8 {
        grid-template-columns: repeat(8, 43px);  /* Optimizado */
        grid-template-rows: repeat(8, 43px);
    }
}
```

### Files Modified 📝
- `games/knight-quest/index.html` (líneas 973-1008)

---

## [1.1.1] - 2025-10-11 (HOTFIX)

### Fixed 🐛
- **✅ BOTONES HOME Y SOUND AHORA FUNCIONAN**
  - **Problema root cause:** Código inline en HTML vs archivo externo `knight-quest.js`
  - Knight Quest usa código JavaScript **inline** en `index.html`
  - Archivo `knight-quest.js` existe pero NO se carga en el HTML
  - Funciones `goHome()` y `toggleSound()` estaban en archivo externo = no existían
  - Event listeners no se configuraban para botones HOME y SOUND

- **Solución implementada:**
  - Agregada función `goHome()` al código inline (línea 1745)
  - Agregada función `testSound()` para debugging (línea 1773)
  - Mejorada `toggleSound()` con logs detallados (línea 1751)
  - Event listeners configurados en DOMContentLoaded (líneas 1207-1232)
  - Todas las funciones ahora en el MISMO scope

### Added 🔧
- **Sistema de logs detallados** para debugging
  - Logs en inicialización: muestra botones encontrados
  - Logs en clicks: confirma que listeners funcionan
  - Logs en toggle: muestra estado de sonido

- **Botones DEBUG temporales** (líneas 1112-1124)
  - HOME2, SOUND2, TEST con onclick inline
  - Ayudaron a identificar el problema de scope
  - [Pendiente limpiar en próxima versión]

### Technical Details ⚙️
```javascript
// ANTES (no funcionaba)
// knight-quest.js (archivo NO cargado)
function goHome() { ... }  // ❌ No existe en runtime

// DESPUÉS (funciona)
// index.html <script> inline
function goHome() { ... }  // ✅ Existe en scope global

document.addEventListener('DOMContentLoaded', function() {
    const btnHome = document.getElementById('btnHome');
    btnHome.addEventListener('click', goHome);  // ✅ Funciona
});
```

### Documentation 📚
- Creado `TROUBLESHOOTING_BOTONES.md` (120+ líneas)
  - Análisis completo del problema
  - Proceso de debugging paso a paso
  - Lecciones aprendidas
  - Checklist para futuros juegos

---

## [1.1.0] - 2025-10-11

### Fixed 🐛
- **Botones HOME y SONIDO** ahora funcionan correctamente con event listeners robustos
  - Agregado `try-catch` para prevenir errores de inicialización
  - Event listeners configurados ANTES de `initGame()`
  - Agregados logs de debugging para troubleshooting
  - `preventDefault()` agregado para evitar comportamiento por defecto

### Improved 🎨
- **Layout mobile completamente rediseñado**
  - HOME y SONIDO en header separado (arriba)
  - Stats (Moves, Visited, Remaining, Time) movidos ABAJO del tablero
  - Monedero reposicionado (más pequeño, no tapa botón SONIDO)
  - "How To Play" movido al final usando CSS flexbox `order`
  - Botones de juego más compactos (40% más pequeños)

- **Subtítulo descriptivo agregado**
  - "Master the knight's L-shaped moves and visit every square!"
  - Estilo consistente con Square Rush

### Technical Changes ⚙️
- **CSS Flexbox Order System** para reordenamiento responsive
  ```css
  @media (max-width: 767px) {
    .control-header { order: 1; }
    .game-header { order: 2; }
    .size-selector { order: 3; }
    #chessboard { order: 4; }
    .game-stats { order: 5; }
    .game-controls { order: 6; }
    .neon-section { order: 99; }
  }
  ```

- **Stats separados de game-header** para mejor control de layout
- **Event listeners con error handling robusto**

### Layout Order (Mobile)
1. 🏠 HOME + 🔊 SONIDO (header separado)
2. 🐴 KNIGHT QUEST + subtítulo
3. Selectores de tamaño (4x4, 6x6, 8x8, 10x10)
4. 🟦 Tablero de ajedrez
5. 📊 Stats (Moves, Visited, Remaining, Time) ← Movido aquí
6. 🎮 Botones de juego (NEW GAME, HINT, UNDO)
7. 📖 How To Play (al final)

---

## [1.0.0] - 2025-01-14

### Added ✨
- **Juego completo Knight Quest** con 4 tamaños de tablero (4x4, 6x6, 8x8, 10x10)
- **Sistema de sonido** con Web Audio API (movimientos, errores, victoria, pistas)
- **Modales interactivos** que se pueden cerrar y volver a abrir
- **Sistema de pistas** inteligente usando algoritmo de Warnsdorff
- **Función deshacer** movimientos
- **Efectos visuales** neon con animaciones CSS
- **Diseño responsive** optimizado para móvil
- **Teclas de acceso rápido** (Espacio, R, U, números)
- **Guardado de mejores puntuaciones** en localStorage

### Visual Improvements 🎨
- **Puntos rojos** en lugar de rayos para movimientos posibles
- **Caballo mejorado** con fondo claro y borde negro para mejor visibilidad
- **Casillas amarillo flúor** para movimientos válidos
- **Estadísticas alineadas** correctamente en ambos modales
- **Modal de Game Over** más compacto y estilizado

### Controls & UX 🎮
- **Botón de cerrar (×)** en modales de victoria y game over
- **Botones "SHOW STATS/RESULT"** para reabrir modales
- **Botón "EASIER"** funcional en Game Over
- **Toggle de sonido** con iconos visuales
- **Contador de monedas** animado
- **Indicadores de progreso** visuales

### Technical Features ⚙️
- **Web Audio API** para sonidos sintéticos
- **Algoritmo Warnsdorff** para pistas óptimas
- **Sistema de estado** robusto del juego
- **Manejo de errores** y validaciones
- **Optimización móvil** con eventos touch
- **Código modular** y bien documentado

### Accessibility 🌐
- **Navegación por teclado** completa
- **Indicadores visuales** claros
- **Feedback sonoro** opcional
- **Colores de alto contraste**
- **Responsive design** para todos los dispositivos

---

*Versión inicial completa del Knight Quest con todas las características principales implementadas.*
