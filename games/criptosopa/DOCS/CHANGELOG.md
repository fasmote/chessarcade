# 📋 CHANGELOG - CriptoSopa

Historial de cambios del juego CriptoSopa.
Para cambios generales del proyecto ver: `docs/CHANGELOG.md`

---

## [2026-05-09] — Timer diferido + delay modal victoria

### ✨ Added
- **Timer on demand**: el reloj arranca cuando el jugador toca la primera celda, no al cargar la página. Flag `gameState.timerStarted` previene inicio doble.
- **Delay modal victoria**: aumentado de 3000ms a 4000ms para que el jugador vea el tablero completo con el confeti antes del modal.

---

## [2026-05-09] — Marquee ping-pong de palabras candidatas

### ✨ Added
- **Marquee bounce**: las palabras sin encontrar desfilan horizontalmente en la barra debajo del tablero, cada una en su color neon futuro. Al llegar al extremo, rebota en dirección opuesta (efecto ping-pong / cartel LED de kiosco).
- **Extremos marcados**: `· · · · · ·` en ambos extremos del contenido para que se vea claramente dónde termina y dónde empieza el ciclo.
- **Toque en palabra**: al tocar una palabra específica mientras pasa, el marquee se frena en esa palabra (con cursor titilante). Se retoma automáticamente al empezar a seleccionar letras.
- **Suspensión automática**: el marquee se oculta mientras el jugador selecciona letras y reaparece al terminar.
- **Módulo `wordMarquee`**: RAF loop con dirección `±1`, rebote en `scrollX = 0` y `scrollX = maxScroll`.

### 🐛 Fixed
- **Bug última letra y marquee**: al encontrar una palabra, el marquee viejo se detiene de inmediato (`wordMarquee.stop()`) en lugar de dejar que `unsuspend()` lo reactive con la palabra ya encontrada adentro. Evitaba tener que deseleccionar y re-seleccionar la última letra.

---

## [2026-05-09] — Tamaño de letras mobile

### ✨ Added
- Letras del tablero 54% más grandes en mobile respecto al original (`clamp(1.85rem, 6.16vw, 2.77rem)`). El tablero y las celdas no cambiaron.

---

## [2026-05-09] — Sprint 2: Caballo animado + Tutorial primera vez

### ✨ Added
- **Caballo animado (♞)**: al seleccionar celdas, un ♞ cyan vuela entre celdas con arco de rebote (knightBounce 220ms). Al aterrizar: scale 1→2.8 con fade (knightLanding 260ms). Simultáneamente, la celda destino hace un flash ♞ que aparece grande y desaparece (480ms). La letra de la celda siempre visible debajo. Módulo `knightAnimator` con RAF y gestión de timers cancelables.
- **Tutorial primera vez**: overlay de 3 slides (Bienvenida / Cómo moverse / Cómo jugar) que aparece 600ms después de cargar la página, solo la primera vez (localStorage `criptosopa_tutorial_v1`). Dots de progreso, botones Saltar/Siguiente/¡Jugar!

### 🐛 Fixed
- **Deselect necesitaba 3 clicks (mobile)**: `touchmove` revertía el deselect hecho por `touchstart` al procesar la misma celda con un leve temblor de dedo. Fix: `_touchStartCell` y `_touchStartTime` registran la celda del último `touchstart`; `touchmove` la ignora durante 220ms.
- **Última celda blanca al completar palabra**: `isDragging` seguía en `true` después de encontrar una palabra. El `touchmove` posterior llamaba `handleCellClick` en la última celda (ya fuera del path), que la agregaba como primera celda nueva (blanco). Fix: `gameState.isDragging = false` al encontrar una palabra.
- **Límite de 7 letras reseteaba selección**: superar la palabra más larga hacía `selectedPath = [{ r, c }]` (reset total). Fix: sin límite de longitud — el jugador puede explorar hasta 64 celdas. El límite natural es no repetir celdas.

---

## [2026-05-08/09] — Sprint 1: Sonido + Vibración + Confeti + Flash + Touch drag

### ✨ Added
- **Touch drag mobile**: arrastrar el dedo sobre el tablero selecciona letras (igual que mouse en desktop). Implementado con `touchmove` + `document.elementFromPoint()` en `initTouchDrag()`. Guard `lastTouchCell` para evitar re-procesamiento de la misma celda.
- **Tick al seleccionar celda**: sonido 780Hz/35ms al tocar cada celda válida del path (`playCellClickSound`).
- **Sonido de des-selección**: sweep descendente 450→280Hz/45ms, más suave que el tick (`playCellDeselectSound`).
- **Whump al encontrar palabra**: sweep grave 160→40Hz en 300ms. Sensación de impacto físico (`playWordFoundSound`).
- **Fanfarria de victoria**: acorde ascendente C5-E5-G5-C6 al ganar (`playVictorySound`). Se distingue del whump.
- **Vibración mobile**: 100ms al encontrar palabra; patrón `[100,60,100,60,250]` al ganar.
- **Confeti de victoria**: 70 piezas en 6 colores neon con `launchConfetti()`. Caen con rotación desde arriba.
- **Flash en celdas**: al encontrar una palabra, cada celda hace scale+brightness escalonado (40ms entre celdas) con `flashFoundWordCells()`.
- **Ícono mute**: parlante siempre visible, X pequeña aparece a la derecha al mutear. Estilo consistente con otros juegos. CSS: `.nav-btn.btn-sound.muted .sound-muted-x { display: inline; }`.
- **`window.SoundManager`**: expuesto para que `hamburger-menu.js` pueda leer el estado real del sonido (`isMuted: () => !soundEnabled`).
- **Botón X en modal de victoria**: cierra el modal y vuelve a ver el tablero.
- **Delay modal victoria**: 3000ms (luego 4000ms) antes de mostrar, para ver el tablero completo.
- **Barra de sugerencia**: muestra la próxima palabra a buscar con su color neon. Las letras seleccionadas reemplazan la palabra durante la selección.
- **Score prominente** (mobile): 1.8rem con `text-shadow` magenta.
- **Panel reordenado** (mobile): Puntos arriba de Palabras, título "ESTADÍSTICAS" oculto.
- **Palabra sugerida con color neon**: el color de la barra coincide exactamente con el que tendrá esa palabra en el tablero al encontrarse.
- **Marquee inicial** (primera implementación): las palabras candidatas desfilan. Reemplazado luego por el ping-pong bounce.

### 🐛 Fixed
- **AudioContext suspendido en iOS**: `playBeep()` llama `ctx.resume()` antes de reproducir. Era el motivo por el que el sonido no funcionaba en mobile.
- **Hamburger menu "Sound: ON" siempre**: `isSoundEnabled()` en `hamburger-menu.js` caía en localStorage que CriptoSopa nunca escribe. Fix: `window.SoundManager` con `isMuted()`.
- **Tablero negro** (bug crítico): llave `}` faltante en `initTouchDrag()` dejaba todo el código siguiente anidado dentro de la función → ninguna función era accesible globalmente. Lección: verificar balance de llaves en toda edición JS.

---

## [2026-05-07/08] — Estética, Responsive y Activación

### ✨ Added
- **Card habilitada en página principal**: eliminado estado "PRÓXIMAMENTE", ahora redirige a `games/criptosopa/index.html`. El redirect JS ya existía en `index.html` línea 713.
- **Botones neon**: `.neon-arcade-btn--primary` (cyan), `--secondary` (magenta), `--tertiary` (amarillo). Antes estos estaban en el HTML pero sin definición CSS → botones sin estilo.
- **Modales**: `.neon-modal`, `.neon-modal-content`, `.modal-header`, `.modal-close-btn`. Overlay oscuro, blur, animación de entrada slideUp. El JS ya usaba `.classList.add('active')` — solo faltaba el CSS.
- **Responsive completo**: grid 2 columnas desde 768px (antes 1024px). Tablet 641–767px: 1 columna optimizada. Mobile ≤640px: todo visible sin scroll.
- **Mobile compacto**: `neon-container` padding reducido, subtítulo "KNIGHT WORD SEARCH" oculto, `.neon-back-btn` oculto, título 2rem, timer compacto, botones en grid 2+1.

### 🐛 Fixed
- **Canvas huérfano 150px**: `<canvas id="particlesCanvas">` sin `position` CSS ocupaba 300×150px en el flujo del documento, creando un hueco oscuro arriba de la página. Fix: `.particles-canvas { position: fixed; }`. El canvas no era usado por ningún script (neonchess-effects.js crea su propio canvas con `id="neon-particles"`).
- **SVG joystick gigante**: `width: 40px; height: 40px;` estaba solo en CSS externo, vulnerable a cascada de neonchess-style.css. Fix: atributos HTML `width="40" height="40"` en el SVG (inmunes a CSS).
- **`--neon-yellow` desincronizado**: `#ffd700` en criptosopa.css vs `#ffff00` en neonchess-style.css. Unificado a `#ffff00`.
