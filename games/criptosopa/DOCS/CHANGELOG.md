# 📋 CHANGELOG - CriptoSopa

Historial de cambios del juego CriptoSopa.
Para cambios generales del proyecto ver: `docs/CHANGELOG.md`

---

## [2026-05-14 — 16] — Sesión en progreso: progresión de vidas, modal, UX desktop

### ✨ Added
- **Sistema de vidas con progresión 15→10→5**: activo desde nivel 1. Tier 1 (niveles 1-3) = 15 vidas, Tier 2 (4-6) = 10 vidas, Tier 3 (7-8) = 5 vidas. Las vidas persisten dentro del tier y se resetean al cambiar de tier.
- **Corazones mobile**: fila única horizontal de corazones mini (10px) debajo del tablero, siempre visible.
- **Panel lateral desktop**: orden NUEVO JUEGO → corazones → RENOVAR → PISTA → ATRÁS. PISTA en amarillo, AYUDA eliminado de desktop.
- **Botón NUEVO JUEGO** (verde): vuelve al nivel 1 con todo reseteado.
- **Renombrado NUEVO → RENOVAR**: más claro que genera otro tablero del mismo nivel sin perder vidas.
- **Mobile colores**: NUEVO TABLERO=verde, PISTA=amarillo, AYUDA=celeste.
- **Mobile post-victoria**: botón cambia a "NUEVA PARTIDA" al ganar.
- **Banner de aviso por tier**: "♞ ¡EMPIEZA EL JUEGO!" (tier 1), "⚠️ NIVEL INTERMEDIO" (tier 2), "🔥 MODO EXPERTO" (tier 3). Solo aparece al inicio de cada tier.
- **NUEVO TABLERO no resetea vidas ni acumulado**: el bug histórico era que addEventListener pasaba el MouseEvent como resetTotal (truthy), haciendo siempre reset total.
- **Modal de victoria muestra nivel completado**: "Nivel 3 — Jaques mate" centrado en el body.
- **Doble click en casilla 1**: con vidas activas deja solo la celda 1 (requiere click adicional para perderla). Sin vidas limpia todo. Evita exploit de cambiar inicio sin costo.
- **Countdown al cerrar modal con X**: banner fijo "Siguiente nivel en 3..." con auto-avance. Tocar el banner avanza de inmediato.
- **Auto-dismiss game over en 2 segundos**: transiciona solo al modal de resumen.
- **X en game over abre resumen**: modal de victoria con título "📊 RESUMEN" y sin botón SIGUIENTE NIVEL.
- **Palabras válidas en ambas direcciones**: el path inverso de una palabra también cuenta.
- **Instrucciones desktop al pie**: 6 bloques en grilla de 3 columnas.
- **Descripción CriptoSopa en home, about.html y README.md**.
- **Logo "abc♞" en desktop**: emoji 🔤♞ a 3rem posicionado absolute en el header. La causa raíz de múltiples fallos: el span estaba dentro del h1 que tiene `-webkit-text-fill-color: transparent`, lo que hacía al emoji invisible. Solución: mover el span FUERA del h1.

### 🐛 Fixed
- **Timer DOM no reseteaba al reiniciar**: `gameState.timer = 0` pero el DOM no se actualizaba hasta el primer tick. Fix: `updateTimerDisplay()` en el bloque else de startNewGame.
- **Timer se acumulaba entre niveles**: nextLevel no seteaba timerStarted=false antes de startNewGame.
- **Menú resaltado (class="current")**: quitada la clase current del item CriptoSopa en el dropdown.
- **← MENÚ en desktop**: oculto con `.neon-back-btn { display: none }` en media query desktop.

### ⚠️ PENDIENTE — No resuelto al cierre de la sesión
- **Título "CRIPTOSOPA" no centrado en desktop**: el `neon-container` tiene `align-items: center` que encoge el header. Se intentaron: `justify-content:center`, `width:100%!important`, `display:inline-block`, `margin:0 auto + fit-content`, `align-self:stretch`. Ninguno funcionó. **Primera prioridad de la próxima sesión**. Estrategia sugerida para la próxima sesión: inspeccionar con DevTools el computed CSS del `.neon-header` en tiempo real para entender exactamente qué regla está ganando la cascada.

### 📚 Aprendizajes
- **`-webkit-text-fill-color: transparent` se propaga a hijos**: cualquier span dentro de un elemento con esta propiedad queda invisible. Nunca poner logos/iconos dentro de un h1 con gradient text.
- **`align-items: center` en flex column encoge hijos**: los flex items con `align-items: center` se achican a su contenido. `align-self: stretch` o `width: 100%` deberían sobrescribirlo pero el cascade con `!important` externo puede interferir.
- **Siempre mirar cómo lo hacen los otros juegos antes de inventar**: Square Rush centra su título con un simple `text-align: center` en un div que NO está dentro de un flex container con `align-items: center`. CriptoSopa tiene una estructura de layout diferente que complica el centrado.

---

## [2026-05-16] — Desktop UX: panel lateral, instrucciones, mecánicas de selección

### ✨ Added
- **Panel lateral izquierdo desktop** (estilo MemoryMatrix): corazones ❤️❤️❤️❤️❤️ siempre visibles (grises cuando vidas no activas, magenta cuando activas) + botón 🔄 NUEVO + botón 💡 PISTA (amarillo) + botón ↩️ ATRÁS (magenta). Solo visible en desktop (≥768px), mobile sin cambios.
- **Botón ATRÁS**: elimina la última celda seleccionada del path. Deshabilitado cuando el path tiene 1 sola celda (no se puede ir antes de la primera). No cuesta vida.
- **Doble click en celda 1**: limpia la selección rápidamente. Sin vidas: borra todo. Con vidas: deja solo la celda 1 en el path (el jugador debe hacer un click adicional para abandonarla y perder la vida). Evita que sea un exploit para cambiar la letra de inicio sin penalización.
- **Palabras válidas en ambas direcciones**: si el jugador recorre el path de una palabra al revés, también se cuenta como encontrada. El nombre mostrado siempre es el canónico.
- **Instrucciones desktop al pie**: sección `cs-how-to-play` con 6 bloques en grilla de 3 columnas (Objetivo, Movimiento en L, Selección, Pistas, Vidas, Progresión). Solo visible en desktop. El card de instrucciones del panel lateral se oculta en desktop y se mantiene en mobile.

### 🐛 Fixed
- **Pistas siempre deshabilitadas**: `updateHintButton()` no se llamaba al encontrar una palabra. El score subía pero el botón permanecía `disabled`. Fix: agregar `updateHintButton()` en `handleCellClick()` junto a `updateDisplay()`.
- **Modal victoria desktop roto**: `#modalTotalSection` estaba oculto con `display:none` y solo aparecía cuando `totalTime > 0`. En nivel 1 nunca aparecía. Rediseño: siempre visible, ambas secciones (ESTE NIVEL y ACUMULADO) muestran valores en todo momento.
- **Estilo botones laterales desktop**: CSS de `cs-btn-side` copiado exactamente de MemoryMatrix v2 (`padding: 12px 16px`, `min-width: 80px`, `gap: 6px`, `font-size: 10px`, `transition: 0.3s`). Anteriormente los botones eran demasiado distintos.
- **Grid 3 columnas desktop**: `game-wrapper` tenía `grid-template-columns: 1fr 260px` (2 columnas). Al agregar el panel lateral, el `info-panel` caía a la fila siguiente. Fix: `auto 1fr 260px` (3 columnas).

### 📚 Aprendizajes
- **CSS grid con número fijo de columnas**: agregar un nuevo hijo a un grid sin ampliar `grid-template-columns` hace que el elemento extra se vaya a la fila siguiente. Siempre verificar que la cantidad de columnas del grid coincida con los hijos directos del contenedor.
- **`display:none` condicional en modales**: ocultar secciones con lógica JS es frágil — si la condición no se cumple en el camino feliz, el usuario nunca ve la sección. Mejor mostrar siempre y atenuar visualmente cuando no aplica.
- **Comentarios educativos en el código**: a partir de esta sesión, todo código nuevo lleva comentarios explicativos orientados al aprendizaje del usuario.

---

## [2026-05-14] — Fix timer DOM no reseteaba visualmente

### 🐛 Fixed
- **Timer muestra tiempo anterior al reiniciar (tercera vez, bug raíz encontrado)**: `startNewGame()` hacía `gameState.timer = 0` pero nunca llamaba `updateTimerDisplay()`. El DOM solo se actualiza cuando el `setInterval` dispara — si el timer no está corriendo (caso de reinicio), el display queda congelado en el valor anterior. Fix: agregar `updateTimerDisplay()` en el bloque `else` (cuando `keepTimer = false`).

### 🔍 Diagnóstico agregado
- Logs `[TIMER]` en `startNewGame()`: muestra `resetTotal`, `keepTimer` y valor del timer antes y después del reset.
- Log `[GAME OVER RESTART]` antes de resetear: muestra el estado exacto del timer al momento de reiniciar. Quedan en producción para detectar regresiones futuras.

### 📚 Aprendizajes
- **Resetear estado y actualizar DOM son dos operaciones separadas**: asignar `gameState.timer = 0` no actualiza ningún elemento visual. Siempre llamar la función de render correspondiente inmediatamente después de resetear un valor que tiene representación en el DOM.
- **El `setInterval` no es una fuente confiable de render inicial**: depender de que el interval "eventualmente" actualice el display es una trampa — si el interval no arranca (timer diferido al primer click), el DOM queda desactualizado indefinidamente.

---

## [2026-05-14] — Sistema de vidas + efectos + fixes de timer

### ✨ Added
- **Sistema de vidas (5 vidas globales)**: activo solo en niveles con `illumination: 'none'` (niveles 7 y 8). Las vidas son un recurso compartido a lo largo de toda la partida — no se reinician al pasar de nivel. Solo se restauran al iniciar una nueva partida desde cero.
- **Pérdida de vida**: ocurre cuando el jugador intenta deseleccionar la única celda seleccionada (cambiar la letra de inicio). Puede retroceder libremente en el path mientras no sea la primera celda.
- **Banner de aviso**: overlay sobre el tablero al iniciar un nivel sin iluminación. Muestra las vidas restantes actuales y se auto-descarta en 3.5s o con un toque. El tablero queda bloqueado durante el aviso (`gameStatus = 'warning'`).
- **Efecto espectacular al perder vida**:
  - Corazón perdido anima: escala 2.2× con glow rojo, luego se vuelve gris (`heartDying` 400ms)
  - Flash rojo sobre el tablero entero (`boardLifeLost`, box-shadow inset 600ms)
  - Sonido crunch dramático: 2 osciladores sawtooth (220Hz y 110Hz) descendiendo a 40Hz
  - Vibración haptica `[80, 40, 180]` en mobile
- **Modal de Game Over**: aparece al llegar a 0 vidas. Opción "VOLVER A EMPEZAR" reinicia desde el nivel 1 con timer y puntaje en cero.

### 🐛 Fixed
- **`updateTimer is not defined`** (ReferenceError crítico): al pasar de nivel, `startNewGame(false)` con `keepTimer=true` llamaba `setInterval(updateTimer, 100)`. `updateTimer` no existe — la función es anónima dentro de `startTimer()`. Además el intervalo era 100ms en lugar de 10ms (centisegundos). Fix: inlinar la misma función anónima de `startTimer()` con intervalo 10ms.
- **Timer acumula entre niveles**: `nextLevel()` guardaba `totalTime += timer` pero `keepTimer=true` en `startNewGame(false)` no reseteaba `timer`. El nivel 2 arrancaba con el tiempo del nivel 1 sumado. Fix: `nextLevel()` pone `timerStarted = false` antes de llamar `startNewGame(false)`.
- **Timer muestra tiempo anterior tras Game Over**: `gameOverRestart()` llamaba `startNewGame(true)` pero `timerStarted` seguía en `true` → `keepTimer=true` → timer no reseteaba. Fix: `gameState.timerStarted = false` antes de llamar `startNewGame(true)`.
- **Vidas se reiniciaban en cada nivel**: `startNewGame()` hacía `gameState.lives = 3` siempre. Fix: las vidas solo se inicializan en `startNewGame(resetTotal=true)` — el paso de nivel usa `resetTotal=false`.

### 📚 Aprendizajes
- **`keepTimer` como estado implícito es frágil**: leer `gameState.timerStarted` dentro de `startNewGame()` para decidir si mantener el timer funcionó para NUEVO TABLERO, pero rompió en `nextLevel()` y `gameOverRestart()` que también llegan ahí con `timerStarted=true`. La solución correcta fue que cada llamador resetee `timerStarted` explícitamente *antes* de llamar `startNewGame()` cuando necesita timer limpio. Alternativa más robusta a futuro: pasar `keepTimer` como parámetro explícito.
- **Verificar que los nombres de función existen antes de pasarlos a `setInterval`**: `setInterval(nombreFuncion, ms)` falla silenciosamente o lanza ReferenceError si la función no existe en el scope — en este caso `updateTimer` nunca existió.

---

## [2026-05-14] — Sistema de 8 niveles + tiempo/puntaje acumulado

### ✨ Added
- **Sistema de 8 niveles**: cada nivel tiene su pool de palabras, cantidad de palabras por partida (`wordsPerGame`), modo de iluminación (`full`/`border`/`none`) y costo base de pistas (`hintBaseCost`). Nivel guardado en `localStorage` (`criptosopa_level`).
- **Pools por nivel**:
  1. Ajedrez básico (4 palabras, full, 50 pts)
  2. Conceptos (5 palabras, full, 50 pts)
  3. Jaques mate (6 palabras, full, 50 pts)
  4. Campeones del mundo (6 palabras, border, 100 pts) — incluye campeones clásicos, FIDE y femeninas
  5. Tácticas (7 palabras, border, 100 pts)
  6. Animales (7 palabras, border, 100 pts)
  7. Países (8 palabras, none, 150 pts)
  8. Deportes (8 palabras, none, 150 pts)
- **Iluminación adaptativa**: `full` muestra celdas posibles con fondo semitransparente; `border` solo muestra el borde de la celda (CSS `cell-hint-border`); `none` sin ayuda visual.
- **Pistas con costo exponencial**: `hintBaseCost × 2^hintsUsados`. El puntaje se descuenta al usarlas. El botón se deshabilita si no alcanza el costo.
- **Tiempo acumulado entre niveles**: `gameState.totalTime` suma el tiempo de cada nivel completado. Se muestra en el modal de victoria.
- **Puntaje acumulado entre niveles**: `gameState.totalScore` suma los puntos de cada nivel completado. Se muestra en el modal de victoria.
- **Modal de victoria rediseñado**: sección **ESTE NIVEL** (cyan) con tiempo y puntos del nivel; separador punteado; sección **ACUMULADO** (magenta, oculta en nivel 1) con totales sumados.
- **Timer con horas**: `formatTime()` muestra `H:MM:SS` cuando el tiempo supera 60 minutos.
- **NUEVO TABLERO conserva el timer**: si el jugador ya empezó a jugar (timer corriendo) y presiona NUEVO TABLERO, el tiempo sigue sin interrupciones.

### 🐛 Fixed
- **Score reseteaba entre niveles**: `startNewGame()` ahora resetea `score` por nivel. `totalScore` persiste hasta "Nuevo Tablero".

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
