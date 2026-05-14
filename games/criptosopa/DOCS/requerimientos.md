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
