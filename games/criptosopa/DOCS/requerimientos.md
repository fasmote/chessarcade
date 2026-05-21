# CriptoSopa - Documento de Requerimientos

## 1. Descripción General

CriptoSopa es un juego de búsqueda de palabras con mecánica única de movimiento de caballo de ajedrez. Los jugadores deben encontrar palabras ocultas moviéndose exclusivamente con saltos en forma de "L" (como el caballo en ajedrez).

## 2. Requerimientos Funcionales

### 2.1 Tablero de Juego
- **RF-001**: Tablero de 8x8 celdas
- **RF-002**: Cada celda contiene una letra mayúscula
- **RF-003**: Las letras están distribuidas de forma que contengan palabras ocultas
- **RF-004**: Las palabras se ocultan siguiendo paths de movimiento de caballo

### 2.2 Mecánica de Movimiento
- **RF-005**: El jugador debe moverse como un caballo de ajedrez (movimiento en L: 2+1 o 1+2 casillas)
- **RF-006**: Solo se pueden seleccionar celdas que estén a un movimiento de caballo válido
- **RF-007**: Las celdas válidas se iluminan automáticamente al seleccionar una letra
- **RF-008**: No se puede repetir una celda en el mismo path

### 2.3 Selección de Palabras
- **RF-009**: Click simple para seleccionar letras
- **RF-010**: Modo drag: mantener presionado y arrastrar sobre letras válidas
- **RF-011**: Click en la última letra seleccionada para deseleccionarla
- **RF-012**: Validación automática al completar una palabra
- **RF-013**: Limpiar selección automáticamente al encontrar palabra correcta

### 2.4 Palabras Objetivo
- **RF-014**: 6 palabras por nivel
- **RF-015**: Vocabulario de ajedrez: CABALLO, ALFIL, TORRE, REINA, REY, PEON, JAQUE, MATE, TABLERO, ENROQUE, CAPTURA, GAMBITO, ELO, FIDE, RELOJ
- **RF-016**: Palabras seleccionadas aleatoriamente por nivel
- **RF-017**: Longitud mínima: 3 letras

### 2.5 Visualización de Palabras Encontradas
- **RF-018**: Cada palabra encontrada tiene un color único (6 colores neon)
- **RF-019**: Las letras de palabras encontradas se colorean con su color asignado
- **RF-020**: Números de paso (badges) en cada letra mostrando el orden
- **RF-021**: Animación de "ola" al pasar mouse sobre palabra en el panel

### 2.6 Celdas Compartidas (Palabras que Cruzan)
- **RF-022**: Palabras pueden compartir letras si es la misma letra
- **RF-023**: Preferencia por NO compartir letras (200 intentos, 150 sin overlap)
- **RF-024**: Celdas compartidas muestran división diagonal de colores
- **RF-025**: Al hacer hover sobre palabra: celda compartida muestra solo ese color
- **RF-026**: Múltiples badges en esquinas para cada palabra
- **RF-027**: Al hacer hover: solo badge de la palabra hovereada

### 2.7 Sistema de Pistas
- **RF-028**: 3 pistas por nivel
- **RF-029**: La pista destaca la primera letra de una palabra no encontrada
- **RF-030**: Animación flash en la letra destacada (3 veces)

### 2.8 Interfaz de Usuario
- **RF-031**: Panel izquierdo: tablero + barra de selección actual + controles
- **RF-032**: Panel derecho: estadísticas + lista de palabras + instrucciones
- **RF-033**: Barra de selección muestra palabra actual con cursor parpadeante
- **RF-034**: Lista de palabras muestra estado (encontradas vs pendientes)
- **RF-035**: Timer con formato MM:SS
- **RF-036**: Contador de palabras encontradas (X/6)
- **RF-037**: Puntuación (100 puntos por palabra)

### 2.9 Controles
- **RF-038**: Botón "NUEVO TABLERO": genera nuevo puzzle
- **RF-039**: Botón "PISTA": muestra pista (máximo 3)
- **RF-040**: Botón "AYUDA": modal con instrucciones

### 2.10 Modales
- **RF-041**: Modal de ayuda con explicación de movimiento de caballo
- **RF-042**: Modal de victoria con tiempo y puntuación final
- **RF-043**: Opción "SIGUIENTE NIVEL" (genera nuevo tablero)
- **RF-044**: Opción "ENVIAR PUNTUACIÓN" (integración con leaderboard)

### 2.11 Responsive Design
- **RF-045**: Diseño adaptable mobile/tablet/desktop
- **RF-046**: Panel derecho se mueve abajo en móviles
- **RF-047**: Tamaño de celdas ajustable (40px-60px)

## 3. Requerimientos No Funcionales

### 3.1 Rendimiento
- **RNF-001**: No recrear celdas DOM en cada render
- **RNF-002**: Solo actualizar estilos CSS cuando sea necesario
- **RNF-003**: Event listeners agregados una sola vez (no en cada render)

### 3.2 Usabilidad
- **RNF-004**: Sin parpadeo visual al hacer click
- **RNF-005**: Feedback visual inmediato (iluminación de celdas válidas)
- **RNF-006**: Prevenir selección de texto durante drag

### 3.3 Estética
- **RNF-007**: Diseño NeonChess (synthwave/cyberpunk)
- **RNF-008**: Colores neon vibrantes
- **RNF-009**: Animaciones suaves (wave, scale, glow)
- **RNF-010**: Fuentes: Orbitron (títulos), Rajdhani (texto)

### 3.4 Compatibilidad
- **RNF-011**: Navegadores modernos (Chrome, Firefox, Safari, Edge)
- **RNF-012**: JavaScript vanilla (sin frameworks)
- **RNF-013**: CSS moderno (grid, flexbox, gradients)

## 4. Reglas de Negocio

### 4.1 Colocación de Palabras
- **RN-001**: Las palabras se colocan siguiendo movimientos válidos de caballo
- **RN-002**: Algoritmo de backtracking para encontrar paths válidos
- **RN-003**: Máximo 200 intentos por palabra
- **RN-004**: Si fallan todos los intentos, la palabra no se incluye en el nivel

### 4.2 Puntuación
- **RN-005**: 100 puntos base por palabra
- **RN-006**: Sin penalización por tiempo
- **RN-007**: Sin bonus por velocidad (implementación futura)

### 4.3 Victoria
- **RN-008**: Ganar al encontrar las 6 palabras
- **RN-009**: Timer se detiene al ganar
- **RN-010**: Modal de victoria automático

## 5. Estados del Juego

### 5.1 Estados de Celda
- **Default**: Gris oscuro, sin seleccionar
- **Hint**: Blanco semitransparente (movimiento válido disponible)
- **Selected**: Blanco sólido, escala aumentada
- **Found (single)**: Color de palabra, badge con número
- **Found (shared)**: Gradiente diagonal de colores, múltiples badges
- **Found (shared + hover)**: Color único de palabra hovereada

### 5.2 Estados de Juego
- **Playing**: Juego activo
- **Won**: Todas las palabras encontradas

## 6. Integraciones

### 6.1 Leaderboard API
- **INT-001**: Envío de puntuación al sistema de leaderboard
- **INT-002**: Nombre del juego: "criptosopa"

### 6.2 NeonChess Effects
- **INT-003**: Sistema de partículas de fondo
- **INT-004**: Efectos visuales globales

## 7. Prioridades

### Alta Prioridad
- Mecánica de movimiento de caballo
- Validación de palabras
- Visualización de palabras encontradas
- Generación de tableros

### Media Prioridad
- Sistema de pistas
- Modo drag
- Celdas compartidas
- Animaciones

### Baja Prioridad
- Optimizaciones de rendimiento
- Responsive avanzado
- Efectos visuales adicionales

---

## 8. Requerimientos Implementados — Sesión 2026-05-07/09
*(Documentación retroactiva: se implementaron primero, se documentan después)*

> Nota metodológica: estos requerimientos se descubrieron durante el desarrollo, no se especificaron antes. El ejercicio de documentarlos retroactivamente sirve para entender cómo habrían sido escritos si se hubiera planificado.

### 8.1 Feedback de Audio y Vibración
- **RF-050**: Sonido sutil al seleccionar cada celda válida (tick 780Hz, 35ms)
- **RF-051**: Sonido de des-selección audiblemente distinto del de selección (sweep descendente 450→280Hz)
- **RF-052**: Sonido de impacto grave al encontrar una palabra (sweep 160→40Hz, "whump")
- **RF-053**: Fanfarria melódica diferente al completar el juego (C5-E5-G5-C6)
- **RF-054**: Vibración haptica en mobile: 100ms al encontrar palabra, patrón rítmico al ganar
- **RF-055**: El timer debe comenzar cuando el jugador toca la primera celda, no al cargar la página

### 8.2 Feedback Visual
- **RF-056**: Confeti neon (70 piezas, 6 colores) al completar el juego
- **RF-057**: Flash en cada celda de la palabra encontrada, escalonado 40ms entre celdas
- **RF-058**: Animación de caballo ♞ que vuela entre celdas durante la selección: arco bounce al volar, impact scale+fade al aterrizar, flash ♞ en la celda destino
- **RF-059**: La letra de la celda siempre visible — el ♞ no la tapa permanentemente
- **RF-060**: El modal de victoria debe esperar 4 segundos para que el jugador vea el tablero completo

### 8.3 Barra de Sugerencia (Selection Bar)
- **RF-061**: La barra bajo el tablero muestra la próxima palabra a buscar cuando no hay selección activa
- **RF-062**: La palabra sugerida debe mostrar el color neon que tendrá cuando sea encontrada
- **RF-063**: Las palabras sin encontrar desfilan horizontalmente (marquee ping-pong)
- **RF-064**: Al tocar una palabra en el marquee, el cartel se detiene en esa palabra
- **RF-065**: `· · · · · ·` en ambos extremos del marquee para marcar el fin del ciclo
- **RF-066**: El marquee rebota al llegar a cada extremo (no hace loop circular)
- **RF-067**: El marquee se suspende al seleccionar letras y se reanuda al terminar

### 8.4 Interacción Mobile
- **RF-068**: Arrastrar el dedo sobre el tablero selecciona letras (sin levantar el dedo)
- **RF-069**: El sistema touch debe ignorar el temblor de dedo para no revertir des-selecciones
- **RF-070**: No existe límite de longitud de selección — el jugador puede explorar hasta 64 celdas

### 8.5 Tutorial Primera Vez
- **RF-071**: Al entrar por primera vez, mostrar tutorial de 3 slides explicando la mecánica
- **RF-072**: El tutorial solo aparece una vez (guardado en localStorage)
- **RF-073**: Botón Saltar para usuarios que no necesitan el tutorial

### 8.6 Diseño Mobile Específico
- **RF-074**: Letras del tablero 54% más grandes en mobile (sin cambiar el tamaño de las celdas)
- **RF-075**: Emoji 🐴🔍 oculto en mobile para ahorrar espacio horizontal
- **RF-076**: Subtítulo "KNIGHT WORD SEARCH" oculto en mobile
- **RF-077**: Puntaje prominente (1.8rem, glow magenta) en mobile
- **RF-078**: "ESTADÍSTICAS" título oculto en mobile — se entiende sin él
- **RF-079**: Panel de palabras con puntaje arriba de contador de palabras en mobile

### 8.7 Sistema de Sonido (Estilo Consistente)
- **RF-080**: Ícono de sonido: parlante siempre visible + X a la derecha cuando está muted
- **RF-081**: El hamburger menu mobile debe reflejar el estado real del sonido (ON/OFF)
- **RF-082**: El sonido en iOS requiere `AudioContext.resume()` en interacción del usuario

### 8.8 Estética y CSS
- **RF-083**: Botones del juego con colores neon distintivos (primary=cyan, secondary=magenta, tertiary=amarillo)
- **RF-084**: Modales con overlay oscuro, blur y animación de entrada
- **RF-085**: Canvas background debe ser `position: fixed` para no ocupar espacio en el flujo del documento

---

## 9. Requerimientos Implementados — Sesión 2026-05-14

### 9.1 Sistema de Progresión por Niveles
- **RF-086**: 8 niveles con pool de palabras propio, cantidad de palabras por partida, modo de iluminación y costo base de pistas
- **RF-087**: El nivel actual se guarda en `localStorage` y se restaura al recargar
- **RF-088**: Botón "SIGUIENTE NIVEL" avanza al siguiente nivel (o repite el último si ya es el 8)
- **RF-089**: El panel de estadísticas muestra el número y nombre del nivel actual
- **RF-090**: Botón "PISTA" muestra el costo dinámico actual (`-50`, `-100`, etc.)

### 9.2 Iluminación Adaptativa
- **RF-091**: Niveles 1–3 (`illumination: full`): celdas válidas se iluminan con fondo semitransparente (comportamiento original)
- **RF-092**: Niveles 4–6 (`illumination: border`): celdas válidas muestran solo el borde, sin fondo (más difícil)
- **RF-093**: Niveles 7–8 (`illumination: none`): sin ayuda visual de movimientos válidos

### 9.3 Pistas con Costo Exponencial
- **RF-094**: El costo de cada pista se duplica con cada pista usada: `hintBaseCost × 2^n`
- **RF-095**: El costo se descuenta del puntaje al usar la pista
- **RF-096**: El botón PISTA se deshabilita si el puntaje no alcanza el costo actual
- **RF-097**: `hintsUsedThisGame` se resetea al empezar cada nivel

### 9.4 Tiempo y Puntaje Acumulado
- **RF-098**: `gameState.totalTime` acumula el tiempo de todos los niveles completados en la sesión
- **RF-099**: `gameState.totalScore` acumula los puntos de todos los niveles completados en la sesión
- **RF-100**: El modal de victoria muestra sección "ESTE NIVEL" (cyan) con tiempo y puntos del nivel
- **RF-101**: El modal de victoria muestra sección "ACUMULADO" (magenta) con totales — oculta en el nivel 1
- **RF-102**: Ambas secciones separadas visualmente por un divider punteado
- **RF-103**: `formatTime()` muestra `H:MM:SS` cuando el tiempo supera 60 minutos
- **RF-104**: Presionar "NUEVO TABLERO" con el timer ya corriendo no resetea el tiempo — el reloj sigue

---

## 10. Requerimientos Implementados — Sesión 2026-05-14 (parte 2)

### 10.1 Sistema de Vidas
- **RF-105**: 5 vidas globales activas solo en niveles con `illumination: 'none'` (niveles 7 y 8)
- **RF-106**: Las vidas son un recurso compartido entre niveles — no se reinician al pasar de nivel
- **RF-107**: Las vidas solo se restauran a 5 al iniciar una partida nueva desde cero (NUEVO TABLERO)
- **RF-108**: Se pierde una vida cuando el jugador intenta deseleccionar la primera y única celda seleccionada (cambiar la letra de inicio del path)
- **RF-109**: El jugador puede retroceder libremente en el path sin costo, mientras no llegue a deseleccionar la primera celda
- **RF-110**: Display de corazones visible sobre el tablero en niveles con vidas activas (corazones perdidos se muestran grises)

### 10.2 Feedback al Perder una Vida
- **RF-111**: Corazón perdido anima con escala 2.2× y glow rojo antes de volverse gris (`heartDying`, 400ms)
- **RF-112**: Flash rojo sobre el tablero entero al perder una vida (`boardLifeLost`, box-shadow inset, 600ms)
- **RF-113**: Sonido crunch dramático: 2 osciladores sawtooth (220Hz + 110Hz) descendiendo a 40Hz
- **RF-114**: Vibración haptica `[80, 40, 180]` en mobile al perder una vida

### 10.3 Game Over
- **RF-115**: Al llegar a 0 vidas aparece modal de Game Over con los 5 corazones grises
- **RF-116**: Opción "VOLVER A EMPEZAR" reinicia desde el nivel 1 con timer, puntaje y vidas en cero
- **RF-117**: El timer muestra 00:00 al reiniciar tras Game Over (no el tiempo del nivel anterior)

### 10.4 Banner de Aviso
- **RF-118**: Al iniciar un nivel sin iluminación, aparece un overlay sobre el tablero con las vidas restantes y la regla de pérdida
- **RF-119**: El banner bloquea el tablero durante su visualización (`gameStatus = 'warning'`)
- **RF-120**: El banner se auto-descarta en 3.5 segundos o con un toque del jugador

---

## 11. Requerimientos Implementados — Sesión 2026-05-14 (parte 3)

### 11.1 Corrección de Timer Visual
- **RF-121**: Al reiniciar la partida (game over o nuevo tablero), el display del timer debe mostrar 00:00 de inmediato, sin esperar al primer tick del intervalo
- **RF-122**: Logs de diagnóstico permanentes en consola para detectar regresiones del timer: `[TIMER]` en cada llamada a `startNewGame()` y `[GAME OVER RESTART]` al reiniciar

---

## 12. Requerimientos Implementados — Sesión 2026-05-16

### 12.1 Panel Lateral Izquierdo Desktop
- **RF-123**: Panel lateral izquierdo visible solo en desktop (≥768px), oculto en mobile. Los controles mobile (controls-panel) se ocultan en desktop.
- **RF-124**: El panel muestra 5 corazones siempre visibles: grises y atenuados cuando las vidas no están activas, magenta brillante cuando están activas
- **RF-125**: Botón 🔄 NUEVO — inicia nuevo tablero. Estilo cyan, igual que `btn-side` de MemoryMatrix
- **RF-126**: Botón 💡 PISTA — usa el mismo sistema de costo exponencial que el botón mobile. Estilo amarillo, igual que `btn-hint-side` de MemoryMatrix
- **RF-127**: Botón ↩️ ATRÁS — elimina la última celda seleccionada del path. Estilo magenta, igual que `btn-undo-side` de MemoryMatrix
- **RF-128**: El botón ATRÁS está deshabilitado cuando el path tiene 0 o 1 celdas (no puede ir antes de la primera celda)
- **RF-129**: El botón ATRÁS nunca cuesta una vida, es una acción segura de navegación del path

### 12.2 Doble Click para Limpiar Selección
- **RF-130**: Doble click (≤350ms) sobre la primera celda seleccionada limpia la selección
- **RF-131**: Sin vidas activas: el doble click borra todo el path (limpieza completa)
- **RF-132**: Con vidas activas: el doble click borra el path excepto la primera celda — el jugador debe hacer un click adicional sobre esa celda para abandonarla (y perder una vida). Evita el exploit de cambiar letra de inicio sin costo.

### 12.3 Palabras en Ambas Direcciones
- **RF-133**: Si el jugador selecciona las celdas de una palabra en orden inverso, también se cuenta como encontrada
- **RF-134**: La palabra se registra y muestra siempre con su nombre canónico (el de la lista objetivo), no al revés

### 12.4 Instrucciones Desktop
- **RF-135**: Sección de instrucciones al pie de la página, solo visible en desktop, con 6 bloques: Objetivo, Movimiento en L, Selección de letras, Pistas, Vidas (niveles 7-8) y Progresión
- **RF-136**: El card de instrucciones del panel lateral (visible en mobile) se oculta en desktop para evitar duplicación

### 12.5 Modal de Victoria
- **RF-137**: El modal de victoria siempre muestra ambas secciones (ESTE NIVEL y ACUMULADO), sin ocultar condicionalmente con display:none
- **RF-138**: En nivel 1, la sección ACUMULADO muestra los mismos valores que ESTE NIVEL (correcto: el total después del nivel 1 es ese nivel)

---

## 13. Requerimientos Implementados — Sesión 2026-05-16 (parte 2)

### 13.1 Progresión de Vidas (15→10→5)
- **RF-139**: Las vidas se activan desde el nivel 1 (antes solo desde nivel 7)
- **RF-140**: Tier 1 (niveles 1-3) = 15 vidas, Tier 2 (4-6) = 10 vidas, Tier 3 (7-8) = 5 vidas
- **RF-141**: Las vidas persisten entre niveles del mismo tier; se resetean al entrar a un nuevo tier
- **RF-142**: El display de corazones en desktop muestra 3/2/1 filas de 5 según el tier
- **RF-143**: El display en mobile muestra una fila horizontal única de corazones mini

### 13.2 UX Desktop
- **RF-144**: Orden del panel lateral: NUEVO JUEGO (verde, arriba) → corazones → RENOVAR (cyan) → PISTA (amarillo) → ATRÁS (magenta)
- **RF-145**: El botón "NUEVO TABLERO" se llama "RENOVAR" en desktop (mismo nivel, conserva vidas)
- **RF-146**: Botón NUEVO JUEGO (verde): resetea todo desde nivel 1
- **RF-147**: El botón mobile cambia a "NUEVA PARTIDA" cuando el jugador gana el nivel

### 13.3 Mecánicas de Selección
- **RF-148**: Doble click en casilla 1 con vidas activas: deja solo la casilla 1 en el path (requiere click adicional para perderla)
- **RF-149**: Doble click en casilla 1 sin vidas activas: limpia todo el path gratis
- **RF-150**: Palabras válidas en ambas direcciones (forward y backward)

### 13.4 Modal y Game Over
- **RF-151**: Modal de victoria muestra el nombre del nivel completado centrado
- **RF-152**: Al cerrar el modal de victoria con X: countdown "Siguiente nivel en 3..." con auto-avance
- **RF-153**: Modal Game Over auto-dismiss en 2 segundos → abre resumen de puntos
- **RF-154**: X en Game Over muestra resumen con título "RESUMEN" y sin botón SIGUIENTE NIVEL

### 13.5 Logo y Header Desktop (⚠️ PARCIALMENTE RESUELTO)
- **RF-155**: Logo 🔤♞ visible en desktop a 3rem, posicionado a la izquierda del header
- **RF-156** ✅ RESUELTO (2026-05-17): Logo 🔤♞ visible a 3.5rem en desktop. Título centrado sobre el tablero. Ver errores #120-123 para el detalle de la solución.

---

## 14. Requerimientos Implementados — Sesión 2026-05-17

### 14.1 Header y Logo Desktop
- **RF-157**: Logo 🔤♞ visible en el header desktop a 3.5rem, idéntico al card de la home
- **RF-158**: Título "CRIPTOSOPA" centrado sobre el tablero (no sobre el viewport completo)
- **RF-159**: Subtítulo "Knight Word Search" centrado debajo del título
- **RF-160**: Estructura del título copiada de MemoryMatrix: `div.cs-title-section` con `display:flex; align-items:center`. El gradient se aplica solo al `span.cs-title-text`, no al h1, para evitar que `-webkit-text-fill-color:transparent` tape el logo.

### 14.2 Layout Desktop
- **RF-161**: `grid-template-rows: auto auto` en el game-wrapper (era `auto 1fr`) para que el board-panel crezca con su contenido y no corte la marquee
- **RF-162**: `margin-right: 170px` (768px+) y `230px` (1024px+) en `cs-title-section` para centrar el título sobre el tablero compensando la asimetría entre info-panel (260-320px) y side-panel (~90px)
- **RF-163**: Timer con `margin-bottom: 0.3rem` (reducido de 1.5rem) para acercar el reloj al tablero
- **RF-164**: `padding-top: 0.5rem` en `.neon-container` desktop para subir todo el contenido

---

## 15. Requerimientos Implementados — Sesión 2026-05-20

### 15.1 Nuevos Niveles
- **RF-165**: Nivel 7 "Aperturas" — nombres de aperturas y defensas de ajedrez, border illumination, 10 vidas, 7 palabras por partida
- **RF-166**: Nivel 8 "Mitología" — dioses y personajes de mitología grecolatina, border illumination, 10 vidas, 7 palabras por partida
- **RF-167**: Países y Deportes renumerados a niveles 9 y 10 (sin cambios en su configuración)
- **RF-168**: El juego pasa de 8 a 10 niveles en total. Tier 2 (borde) comprende niveles 4-8; tier 3 (sin iluminación) comprende niveles 9-10
- **RF-169**: Banner de aviso de tier actualizado — `tierStartLevels = [0, 3, 8]` para reflejar que el tier difícil comienza en el nivel 9

---

## 16. Requerimientos Implementados — Sesión 2026-05-20 (parte 2)

### 16.1 Sistema de Puntaje Revisado
- **RF-170**: Puntaje por palabra basado en longitud: `largo_palabra × 30 pts` (antes 100 fijo). Palabras más largas valen más.
- **RF-171**: ~~Bonus de velocidad~~ → **REEMPLAZADO** por penalización de tiempo (ver RF-177). El tiempo tardado nunca suma; siempre resta.
- **RF-172**: Bonus de vidas restantes al completar el nivel: `vidas_restantes × 50 pts`. Premia jugar limpio sin cambiar la primera celda.
- **RF-173**: Multiplicador por nivel: `1 + nivel × 0.1` (nivel 1 = ×1.1, nivel 5 = ×1.5, nivel 10 = ×2.0). Cada nivel tiene su propio valor creciente.
- **RF-174**: Fórmula completa: `max(0, (puntaje_palabras + bonus_vidas − penalización_tiempo) × multiplicador)`, redondeado al entero más cercano. El score nunca puede ser negativo.
- **RF-175**: El puntaje se construye progresivamente durante la secuencia visual (no se calcula de golpe en `winGame()`): los corazones suman en tiempo real, el badge de tiempo resta en tiempo real, el multiplicador se aplica al final.
- **RF-176**: El modal de victoria muestra el desglose: `📝 palabras + ❤️ vidas − ⏱️ tiempo × nivel`. El separador `−` es rojo para señalar la penalización.

---

## 17. Requerimientos Implementados — Sesión 2026-05-21

### 17.1 Penalización de Tiempo
- **RF-177**: El tiempo tardado en completar el nivel se convierte en puntos negativos: `minutos × 100 + segundos`. Ejemplo: 2:31 → −231 pts. El timer siempre resta; terminar más rápido protege el puntaje.
- **RF-178**: El timer se congela en ROJO al ganar (animación `timerPenalty`, borde y texto en `#ff2020`), señalando visualmente que el tiempo viene a cobrar.
- **RF-179**: Un badge rojo "−N" aparece sobre el timer congelado, hace pop elástico (scale 0→1, cubic-bezier), y espera 700ms para que el jugador lo lea.
- **RF-180**: El badge vuela hacia el marcador en 700ms (ease-in). Al llegar: el score baja (`Math.max(0, score − timePenalty)`), el marcador hace shake rojo (scale 1.9×, rotate 5°, glow rojo), y un toast "−N" rojo sube flotando.
- **RF-181**: Sonido sad trombone al aparecer el badge: tres notas sawtooth descendentes con bend (A#4 → F#4 → A#3), cada una de 200–400ms, que imitan el "wah wah wah" de trombón.

### 17.2 Secuencia Visual de Victoria (5 Fases)
- **RF-182**: **Fase 1** (t=500ms): timer congela en rojo.
- **RF-183**: **Fase 2** (t=1500ms): animación de corazones colector (ver 17.3). Duración variable según vidas restantes.
- **RF-184**: **Fase 3** (t=T2+heartsDuration+300ms): badge de penalización vuela desde el timer al score y resta.
- **RF-185**: **Fase 4** (t=T3+2000ms): flash del multiplicador de nivel. El score se multiplica y actualiza.
- **RF-186**: **Fase 5** (t=T4+1300ms): modal de victoria.
- **RF-187**: Los tiempos de las fases 3–5 se calculan dinámicamente en función de `gameState.lives` para que el modal nunca interrumpa ninguna animación. Con 10 vidas la secuencia dura ~8s; con 1 vida ~4s.

### 17.3 Animación de Corazones Colector
- **RF-188**: Al ganar, cada corazón individual hace pop (scale ×2) y desaparece de su posición en el display de vidas.
- **RF-189**: Un clon pequeño de cada corazón vuela al corazón colector central (posicionado entre el display de vidas y el centro de la pantalla), con stagger de 180ms entre cada uno.
- **RF-190**: El corazón colector crece con cada fusión: `scale = 0.8 + merged × 0.15`. Cada fusión emite un "plop" (sine 520→260Hz, 140ms) y un pulso de glow.
- **RF-191**: El label del colector muestra el bonus acumulado: "+50", "+100", "+150", etc.
- **RF-192**: Cuando el último corazón llegó (400ms de delay), el colector vuela al marcador en 700ms (cubic-bezier). Al impactar: score += livesBonus, marcador hace shake rosa (scale 2.2×, rotate −8°), toast "+N" rosa flota.
- **RF-193**: Sonidos: pop al salir (sine 320→80Hz), whoosh en vuelo (noise bandpass 1800Hz), plop al fusionarse (sine 520→260Hz), impacto al llegar (triangle 1400→800Hz).
