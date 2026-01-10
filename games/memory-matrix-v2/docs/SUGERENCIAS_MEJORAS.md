# Sugerencias de Mejoras - Memory Matrix v2

**Fecha**: 10 Octubre 2025
**Version actual**: 1.0.0
**Estado**: Juego funcional completo

---

## Organizacion por Prioridad

Las sugerencias estan organizadas en tres categorias:
- **Alta Prioridad**: Mejoran la experiencia actual significativamente
- **Media Prioridad**: Agregan contenido y progresion
- **Baja Prioridad**: Polish y extras

---

## Alta Prioridad (Mejora la experiencia actual)

### 1. Sistema de Estadisticas y Records

**Objetivo**: Motivar al jugador a mejorar sus tiempos y precision.

**Funcionalidades**:
- Guardar mejor tiempo por nivel en localStorage
- Mostrar record personal en pantalla de victoria
- Tabla de ranking con mejores 5 tiempos globales
- Mostrar % de precision (intentos correctos / total intentos)
- Grafico de progreso por nivel

**Implementacion tecnica**:
```javascript
// localStorage structure
{
  "levelRecords": {
    "1": { "time": 45, "attempts": 3, "date": "2025-10-10" },
    "2": { "time": 67, "attempts": 5, "date": "2025-10-10" }
  },
  "globalStats": {
    "totalGamesPlayed": 15,
    "totalTime": 1234,
    "averageAccuracy": 85
  }
}
```

**UI sugerido**:
- Icono de trofeo con mejor tiempo en header
- En pantalla victoria: "Nuevo record!" si supera anterior
- Boton "Ver Estadisticas" en menu principal

**Archivos a modificar**:
- `game.js` - Funciones saveRecord(), loadRecords(), calculateStats()
- `index.html` - Overlay de estadisticas
- `styles.css` - Estilos para tabla de records

**Estimacion**: 3-4 horas

---

### 2. Botones Deshacer/Limpiar

**ESTADO**: Implementado pero NO usado en Memory Matrix (10 Oct 2025)

**Razon para NO usar**: Esta funcionalidad rompe la mecanica core del juego. Memory Matrix es sobre MEMORIZAR, no sobre experimentar. Si permites deshacer, el jugador puede simplemente probar todas las casillas hasta acertar, eliminando el desafio de memoria.

**Codigo disponible**: Las funciones undo(), clearBoard() y moveHistory stack estan implementadas en game.js para reutilizacion en otros juegos (puzzles de ajedrez, problemas tacticos, etc.) donde si tiene sentido corregir errores.

**Objetivo ORIGINAL**: Permitir al jugador corregir errores sin reintentar todo el nivel.

**Funcionalidades**:
- Boton "Deshacer" (quita ultima pieza colocada)
- Boton "Limpiar tablero" (remueve todas las piezas)
- Historial de movimientos para deshacer multiple
- Stack de movimientos: push al colocar, pop al deshacer

**Implementacion tecnica**:
```javascript
let moveHistory = []; // Stack de movimientos

function placePiece(square, piece) {
  // ... codigo actual ...
  moveHistory.push({ square, piece }); // Guardar en historial
  updateUndoButton();
}

function undo() {
  if (moveHistory.length === 0) return;
  const lastMove = moveHistory.pop();
  removePieceFromSquare(lastMove.square);
  returnPieceToBank(lastMove.piece);
  updateUndoButton();
}

function clearBoard() {
  while (moveHistory.length > 0) {
    undo();
  }
}
```

**UI sugerido**:
- Boton "Deshacer" (icono flecha izquierda) en header
- Boton "Limpiar" (icono escoba) en header
- Desactivados cuando no hay piezas colocadas
- Animacion al devolver pieza al banco

**Archivos a modificar**:
- `game.js` - Agregar moveHistory, undo(), clearBoard()
- `index.html` - Botones en header
- `styles.css` - Estilos botones

**Estimacion**: 2-3 horas

**Nota**: Ya estaba en lista de "Proximo" en PROGRESO_SESION.md

---

### 3. Sistema de Pausa Mejorado

**Objetivo**: Permitir pausar el juego sin revelar la posicion correcta.

**Funcionalidades**:
- Boton "Pausa" durante fase de colocacion
- Overlay que oculta completamente el tablero (anti-trampa)
- Timer global se pausa
- Boton "Continuar" para reanudar
- Pausa automatica al cambiar de pestana (blur event)

**Implementacion tecnica**:
```javascript
let isPaused = false;
let pauseStartTime = 0;

function togglePause() {
  isPaused = !isPaused;

  if (isPaused) {
    pauseStartTime = Date.now();
    showPauseOverlay();
    stopAllTimers();
  } else {
    const pauseDuration = Date.now() - pauseStartTime;
    hidePauseOverlay();
    resumeAllTimers(pauseDuration);
  }
}

// Pausa automatica al cambiar pestana
document.addEventListener('visibilitychange', () => {
  if (document.hidden && gameState === 'solving') {
    togglePause();
  }
});
```

**UI sugerido**:
- Boton "Pausa" (icono ||) en header
- Overlay negro 95% con:
  - Icono pausa grande
  - Texto "Juego en pausa"
  - Boton "Continuar"
  - Boton "Reiniciar nivel"
  - Boton "Menu principal"

**Archivos a modificar**:
- `game.js` - togglePause(), pauseOverlay
- `index.html` - Overlay de pausa
- `styles.css` - Estilos overlay

**Estimacion**: 2-3 horas

---

### 4. Feedback de Error mas Especifico

**Objetivo**: Dar informacion util al jugador sobre que esta mal.

**Funcionalidades actuales**:
- Solo dice "Posicion incorrecta"
- No especifica que esta mal

**Mejoras propuestas**:
- Mostrar: "Te faltan X piezas por colocar"
- Mostrar: "Tienes Y piezas en posicion incorrecta"
- Opcion avanzada: Marcar con borde rojo las piezas mal colocadas
  (sin revelar donde van las correctas)

**Implementacion tecnica**:
```javascript
function validatePosition() {
  const expected = getPiecesToValidate();
  const placed = placedPieces;

  let missingCount = 0;
  let incorrectCount = 0;
  let incorrectSquares = [];

  // Contar faltantes
  expected.forEach(exp => {
    const found = placed.find(p =>
      p.square === exp.square && p.piece === exp.piece
    );
    if (!found) missingCount++;
  });

  // Contar incorrectas
  placed.forEach(p => {
    const correct = expected.find(e =>
      e.square === p.square && e.piece === p.piece
    );
    if (!correct) {
      incorrectCount++;
      incorrectSquares.push(p.square);
    }
  });

  return { missingCount, incorrectCount, incorrectSquares };
}
```

**UI sugerido**:
- Mensaje: "Te faltan 2 piezas. 1 pieza esta en posicion incorrecta"
- Opcion: Marcar temporalmente con borde rojo piezas incorrectas
- No revelar donde van las correctas (mantener desafio)

**Archivos a modificar**:
- `game.js` - validatePosition() mejorado
- `styles.css` - Clase .incorrect-piece con borde rojo

**Estimacion**: 1-2 horas

---

## Media Prioridad (Contenido y progresion)

### 5. Mas Niveles (9-15)

**Objetivo**: Extender contenido del juego de 8 a 15 niveles.

**Propuesta de niveles adicionales**:

**Nivel 9: "Estratega Avanzado"**
- 6 piezas (2 reyes, 2 damas, 2 torres)
- Tiempo memorizacion: 8s
- Intentos requeridos: 12
- Hints: 3 por nivel

**Nivel 10: "Tactico Maestro"**
- Posicion de mate en 2 movimientos famoso
- 8 piezas
- Tiempo memorizacion: 9s
- Intentos requeridos: 15

**Nivel 11-12: "Partidas Historicas"**
- Primeros 5 movimientos de partidas famosas
- Kasparov vs Deep Blue 1997 (nivel 11)
- Fischer vs Spassky 1972 (nivel 12)
- 10-12 piezas
- Tiempo memorizacion: 10s

**Nivel 13-15: "Finales Artisticos"**
- Estudios de finales clasicos
- 6-8 piezas (finales limpios)
- Requiere precision total
- Tiempo memorizacion: 8-10s

**Archivos a modificar**:
- `levels.js` - Agregar configuracion niveles 9-15
- `game.js` - Ajustar totalLevels a 15

**Estimacion**: 4-6 horas (incluye investigacion de posiciones historicas)

---

### 6. Modos de Juego Adicionales

**Objetivo**: Ofrecer variedad y replayability.

**Modo 1: Zen**
- Sin timer de memorizacion
- Sin limite de errores
- Sin limite de hints
- Para practicar sin presion
- Estadisticas separadas

**Modo 2: Speedrun**
- Completar todos los niveles lo mas rapido posible
- Timer global continuo
- 1 solo intento por nivel
- Tabla de records global
- Modo para jugadores avanzados

**Modo 3: Desafio Diario**
- Una posicion diferente cada dia
- Seed basado en fecha (reproducible)
- Ranking global del dia
- Incentiva volver cada dia

**Modo 4: Infinito**
- Genera posiciones aleatorias infinitas
- Dificultad incrementa gradualmente
- Score basado en niveles completados
- Termina al fallar 3 veces

**Implementacion tecnica**:
```javascript
const GAME_MODES = {
  CLASSIC: 'classic',
  ZEN: 'zen',
  SPEEDRUN: 'speedrun',
  DAILY: 'daily',
  INFINITE: 'infinite'
};

let currentMode = GAME_MODES.CLASSIC;

function startGame(mode) {
  currentMode = mode;
  applyModeRules(mode);
  initLevel(1);
}

function applyModeRules(mode) {
  switch(mode) {
    case GAME_MODES.ZEN:
      maxErrors = Infinity;
      hintsLeft = Infinity;
      // No timer de memorizacion
      break;
    case GAME_MODES.SPEEDRUN:
      maxErrors = 0; // 1 intento por nivel
      startGlobalTimer();
      break;
    // ... otros modos
  }
}
```

**UI sugerido**:
- Menu principal con selector de modo
- Cards para cada modo con descripcion
- Icono distintivo por modo
- Estadisticas separadas por modo

**Archivos a crear**:
- `modes.js` - Configuracion y logica de modos

**Archivos a modificar**:
- `game.js` - Soporte para diferentes modos
- `index.html` - Menu selector de modos
- `styles.css` - Estilos menu de modos

**Estimacion**: 8-10 horas (todos los modos)

---

### 7. Tutorial Interactivo

**Objetivo**: Onboarding para nuevos jugadores (especialmente ninos 4-8 anos).

**Estructura del tutorial**:

**Tutorial 1: "Tu primer movimiento"**
- Solo 1 pieza: wK en e4
- Mensaje: "Mira donde esta el rey blanco"
- Timer: 5s (generoso)
- Al volar: "Arrastra el rey de vuelta a su casilla"
- Mano animada mostrando drag & drop
- Sin errores posibles (auto-completa)

**Tutorial 2: "Dos piezas"**
- 2 piezas: wK en e4, wQ en d4
- Introducir concepto de 2 piezas
- Timer: 5s
- Permitir 1 error con mensaje alentador

**Tutorial 3: "Usando Hints"**
- 3 piezas: wK, wQ, wR
- Introducir boton HINT
- Mensaje: "Si olvidas donde va una pieza, usa un HINT"
- Forzar uso de hint (boton parpadeante)
- Timer: 4s

**Tutorial completado**:
- Mensaje: "Excelente! Ahora estas listo para el Nivel 1"
- Animacion de celebracion
- Guardar en localStorage que completo tutorial

**Implementacion tecnica**:
```javascript
const TUTORIAL_LEVELS = [
  {
    id: 'tutorial-1',
    name: 'Tu primer movimiento',
    pieces: [{square: 'e4', piece: 'wK'}],
    instructions: 'Mira donde esta el rey blanco',
    timer: 5000,
    autoComplete: true
  },
  // ... tutorial 2 y 3
];

let tutorialCompleted = localStorage.getItem('tutorialCompleted') === 'true';

function startTutorial() {
  isTutorialMode = true;
  currentTutorialStep = 0;
  loadTutorialLevel(TUTORIAL_LEVELS[0]);
}
```

**UI sugerido**:
- Overlay semitransparente con texto grande
- Mano animada (SVG) mostrando gestos
- Flechas apuntando a elementos importantes
- Boton "Saltar tutorial" (para jugadores experimentados)
- Boton "Repetir tutorial" en menu settings

**Archivos a crear**:
- `tutorial.js` - Logica del tutorial

**Archivos a modificar**:
- `game.js` - Deteccion de primer inicio
- `index.html` - Overlays de instrucciones
- `styles.css` - Animaciones de mano

**Estimacion**: 6-8 horas

---

### 8. Logros/Achievements

**Objetivo**: Motivar al jugador con metas adicionales.

**Logros propuestos**:

**Categoria: Precision**
- "Memoria Fotografica": Completa un nivel sin errores
- "Perfeccionista": Completa todos los niveles sin errores
- "Primera Victoria": Completa el nivel 1

**Categoria: Velocidad**
- "Velocista": Completa un nivel en menos de 10s
- "Rayo": Completa un nivel en menos de 5s
- "Speedrunner": Completa todos los niveles en menos de 10 minutos

**Categoria: Perseverancia**
- "Persistente": Completa un nivel despues de 5+ intentos
- "Nunca Te Rindas": Completa un nivel despues de 10+ intentos
- "Maratonista": Juega 10 partidas en un dia

**Categoria: Maestria**
- "Sin Ayuda": Completa todos los niveles sin usar hints
- "Leyenda": Completa el nivel 8 (o 15)
- "Coleccionista": Desbloquea todos los logros

**Implementacion tecnica**:
```javascript
const ACHIEVEMENTS = {
  PHOTO_MEMORY: {
    id: 'photo-memory',
    name: 'Memoria Fotografica',
    description: 'Completa un nivel sin errores',
    icon: '📸',
    condition: (stats) => stats.errorsInLevel === 0
  },
  SPEEDSTER: {
    id: 'speedster',
    name: 'Velocista',
    description: 'Completa un nivel en menos de 10s',
    icon: '⚡',
    condition: (stats) => stats.levelTime < 10
  }
  // ... mas logros
};

function checkAchievements(stats) {
  Object.values(ACHIEVEMENTS).forEach(achievement => {
    if (achievement.condition(stats) && !isUnlocked(achievement.id)) {
      unlockAchievement(achievement);
      showAchievementNotification(achievement);
    }
  });
}
```

**UI sugerido**:
- Notificacion toast cuando se desbloquea logro
- Pantalla "Logros" en menu principal
- Grid de badges (desbloqueados en color, bloqueados en gris)
- Progreso: "12/20 logros desbloqueados"
- Compartir logro en redes sociales

**Archivos a crear**:
- `achievements.js` - Definiciones y logica

**Archivos a modificar**:
- `game.js` - checkAchievements() en eventos clave
- `index.html` - Pantalla de logros
- `styles.css` - Estilos badges y notificaciones

**Estimacion**: 6-8 horas

---

## Baja Prioridad (Polish y extras)

### 9. Temas Visuales del Tablero

**Objetivo**: Personalizacion visual del tablero.

**Temas propuestos**:

**Tema 1: Clasico Marron (actual)**
- Claro: #f0d9b5
- Oscuro: #b58863

**Tema 2: Verde Torneo**
- Claro: #ffffdd
- Oscuro: #86a666

**Tema 3: Azul Neon (Cyberpunk)**
- Claro: #1a1a2e
- Oscuro: #0f3460
- Borde: cyan brillante

**Tema 4: Rosa Neon**
- Claro: #2d1b3d
- Oscuro: #1a0b2e
- Borde: magenta brillante

**Implementacion tecnica**:
```javascript
const BOARD_THEMES = {
  classic: { light: '#f0d9b5', dark: '#b58863', border: '#00ffff' },
  green: { light: '#ffffdd', dark: '#86a666', border: '#00ffff' },
  neonBlue: { light: '#1a1a2e', dark: '#0f3460', border: '#00ffff' },
  neonPink: { light: '#2d1b3d', dark: '#1a0b2e', border: '#ff0080' }
};

function applyBoardTheme(themeName) {
  const theme = BOARD_THEMES[themeName];
  document.documentElement.style.setProperty('--square-light', theme.light);
  document.documentElement.style.setProperty('--square-dark', theme.dark);
  document.documentElement.style.setProperty('--board-border', theme.border);
  localStorage.setItem('boardTheme', themeName);
}
```

**UI sugerido**:
- Boton "Temas" en header o settings
- Selector con preview visual de cada tema
- Radio buttons o cards clickeables

**Archivos a modificar**:
- `styles.css` - CSS variables para colores
- `game.js` - applyBoardTheme()
- `index.html` - Selector de temas

**Estimacion**: 2-3 horas

---

### 10. Animaciones de Entrada de Piezas

**Objetivo**: Mejoras visuales sutiles.

**Animaciones propuestas**:

**Al inicio del nivel (mostrar piezas)**:
- Fade-in escalonado (stagger 50ms entre piezas)
- Scale 0.5 → 1.0 con elastic easing
- Aparecen en orden: peones → torres → caballos → alfiles → damas → reyes

**Al colocar pieza correctamente**:
- Bounce suave (scale 1.0 → 1.1 → 1.0)
- Particulas verdes (5-10) alrededor de la pieza
- Sonido "ding" (ya existe playSuccessSound)

**Al colocar pieza incorrectamente**:
- Shake horizontal ya existe
- Agregar: Bounce rojo (escala rapida)
- Particulas rojas

**Implementacion tecnica**:
```javascript
function showPiecesWithAnimation(pieces) {
  pieces.forEach((piece, index) => {
    setTimeout(() => {
      showPiece(piece.square, piece.piece);

      const pieceEl = getPieceElement(piece.square);
      pieceEl.style.animation = 'pieceEnter 0.5s ease-out';
    }, index * 50); // Stagger 50ms
  });
}

// CSS
@keyframes pieceEnter {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  70% {
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
```

**Archivos a modificar**:
- `game.js` - showPiecesWithAnimation()
- `styles.css` - Nuevas animaciones

**Estimacion**: 2-3 horas

---

### 11. Sonidos Adicionales

**Objetivo**: Experiencia de audio mas rica.

**Sistema actual**:
- 5 sonidos: glitch, error, exito, confeti, vuelo
- Web Audio API sintetico
- Toggle on/off funcional

**Sonidos a agregar**:

**Musica de fondo ambiental**:
- Loop de musica electronica suave
- Volumen bajo (20-30%)
- Toggle independiente del resto de sonidos
- Usar Web Audio API con OscillatorNode para generar
- Acordes ambient: Am - F - C - G (loop)

**Sonido al ganar nivel**:
- Fanfare corto (1-2s)
- Arpeggio ascendente en escala mayor
- Mas elaborado que el chime actual

**Sonido tick-tock**:
- En ultimos 2 segundos del timer
- Frecuencia 1000Hz, pulsos cortos 100ms
- Crea urgencia

**Sonido al colocar pieza**:
- Click suave al colocar en tablero
- 200Hz, duracion 50ms
- Feedback tactil

**Implementacion tecnica**:
```javascript
// En audio.js

function playBackgroundMusic() {
  // Acordes ambient: Am - F - C - G
  const chords = [
    [220, 261.63, 329.63], // Am
    [174.61, 220, 261.63], // F
    [261.63, 329.63, 392],  // C
    [196, 246.94, 293.66]   // G
  ];

  let currentChord = 0;

  function playChord() {
    const frequencies = chords[currentChord];
    // ... crear oscillators para cada frecuencia
    // ... loop infinito
    currentChord = (currentChord + 1) % chords.length;
  }
}

function playTickTock() {
  // Pulsos cortos 1000Hz
}

function playFanfare() {
  // Arpeggio C-E-G-C (523-659-783-1046 Hz)
}
```

**Archivos a modificar**:
- `audio.js` - Agregar 4 funciones nuevas
- `game.js` - Integrar nuevos sonidos

**Estimacion**: 3-4 horas

---

### 12. Compartir en Redes Sociales

**Objetivo**: Marketing viral y engagement.

**Funcionalidades**:

**Pantalla de victoria**:
- Boton "Compartir" destacado
- Genera texto personalizado
- Link directo al juego

**Texto generado**:
```
Acabo de completar Memory Matrix en [tiempo]!
Nivel [X]: [nombre del nivel]
Precision: [%]

Puedes superarme?
https://chessarcade.com/memory-matrix
```

**Plataformas soportadas**:
- Twitter/X (share intent)
- WhatsApp (share intent)
- Facebook (share dialog)
- Copiar al portapapeles

**Bonus: Captura de pantalla**:
- Generar imagen PNG con html2canvas
- Muestra: logo, tiempo, nivel, estadisticas
- Estilo neón del juego
- Usuario puede descargar y compartir manualmente

**Implementacion tecnica**:
```javascript
function shareScore(platform) {
  const text = `Acabo de completar Memory Matrix en ${formatTime(totalTime)}! Nivel ${currentLevel}. Puedes superarme?`;
  const url = 'https://chessarcade.com/memory-matrix';

  switch(platform) {
    case 'twitter':
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`);
      break;
    case 'whatsapp':
      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`);
      break;
    case 'facebook':
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
      break;
    case 'clipboard':
      navigator.clipboard.writeText(text + ' ' + url);
      showToast('Copiado al portapapeles!');
      break;
  }
}

// Bonus: Captura con html2canvas
async function generateScoreImage() {
  const canvas = await html2canvas(document.querySelector('.victory-screen'));
  const imgData = canvas.toDataURL('image/png');
  // Descargar o compartir
}
```

**Archivos a modificar**:
- `game.js` - shareScore()
- `index.html` - Botones de compartir en victoria
- `styles.css` - Estilos botones sociales

**Dependencia externa**:
- html2canvas (opcional, para captura de pantalla)

**Estimacion**: 3-4 horas

---

### 13. Modo Multijugador Local

**Objetivo**: Competencia entre 2 jugadores en mismo dispositivo.

**Funcionalidades**:

**Modo: Versus 1v1**
- 2 jugadores alternados
- Mismo nivel para ambos
- Jugador 1: Memoriza y coloca
- Jugador 2: Memoriza y coloca (mismo nivel)
- Gana quien comete menos errores
- Si empatan: Gana quien termino mas rapido

**Flujo del juego**:
1. Seleccionar "Modo Versus" en menu
2. Ingresar nombres (Jugador 1, Jugador 2)
3. Elegir nivel inicial (1-8)
4. Turno Jugador 1:
   - Memoriza posicion
   - Coloca piezas
   - Registra errores y tiempo
5. Pantalla "Turno de Jugador 2"
6. Turno Jugador 2 (mismo proceso)
7. Comparacion de resultados
8. Declarar ganador
9. Siguiente nivel (Best of 3? Best of 5?)

**Implementacion tecnica**:
```javascript
const versusMode = {
  player1: { name: '', score: 0, errors: 0, time: 0 },
  player2: { name: '', score: 0, errors: 0, time: 0 },
  currentPlayer: 1,
  rounds: []
};

function startVersusMode() {
  versusMode.player1.name = prompt('Nombre Jugador 1:');
  versusMode.player2.name = prompt('Nombre Jugador 2:');

  startPlayerTurn(1);
}

function startPlayerTurn(playerNum) {
  versusMode.currentPlayer = playerNum;
  showPlayerTurnScreen(playerNum);

  setTimeout(() => {
    startLevel(currentLevel); // Nivel normal
  }, 2000);
}

function onLevelComplete() {
  const player = versusMode[`player${versusMode.currentPlayer}`];
  player.errors = errorCount;
  player.time = levelTime;

  if (versusMode.currentPlayer === 1) {
    startPlayerTurn(2); // Turno jugador 2
  } else {
    showVersusResults(); // Comparar resultados
  }
}
```

**UI sugerido**:
- Pantalla "Turno de [Jugador]" con boton "Listo!"
- Ocultar tablero entre turnos (anti-trampa)
- Tabla comparativa al final
- Animacion del ganador

**Archivos a crear**:
- `versus.js` - Logica multijugador

**Archivos a modificar**:
- `game.js` - Soporte para modo versus
- `index.html` - Pantallas de versus
- `styles.css` - Estilos modo versus

**Estimacion**: 8-10 horas

---

## Mejoras Tecnicas

### 14. Progressive Web App (PWA)

**Objetivo**: Instalar como app nativa, funcionar offline.

**Componentes PWA**:

**1. Manifest.json**:
```json
{
  "name": "Memory Matrix - ChessArcade",
  "short_name": "Memory Matrix",
  "description": "Juego de memoria visual ajedrecistica",
  "start_url": "/games/memory-matrix-v2/index.html",
  "display": "standalone",
  "background_color": "#0a0014",
  "theme_color": "#00ffff",
  "orientation": "portrait",
  "icons": [
    {
      "src": "icons/icon-72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**2. Service Worker**:
```javascript
// service-worker.js
const CACHE_NAME = 'memory-matrix-v1.0.0';
const urlsToCache = [
  '/games/memory-matrix-v2/index.html',
  '/games/memory-matrix-v2/styles.css',
  '/games/memory-matrix-v2/game.js',
  '/games/memory-matrix-v2/levels.js',
  '/games/memory-matrix-v2/audio.js',
  '/games/memory-matrix-v2/ChessGameLibrary/Utils.js',
  '/games/memory-matrix-v2/ChessGameLibrary/PieceAnimations.js',
  '/games/memory-matrix-v2/ChessGameLibrary/DragDrop.js',
  '/games/memory-matrix-v2/ChessGameLibrary/LevelTransition.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

**3. Registro en index.html**:
```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/games/memory-matrix-v2/service-worker.js')
    .then(reg => console.log('Service Worker registrado'))
    .catch(err => console.error('Error al registrar SW:', err));
}
```

**Beneficios**:
- Funciona sin conexion a internet
- Se instala en pantalla de inicio (mobile)
- Splash screen automatico
- Experiencia app nativa
- Actualizaciones automaticas

**Archivos a crear**:
- `manifest.json`
- `service-worker.js`
- `icons/` (carpeta con iconos)

**Archivos a modificar**:
- `index.html` - Link al manifest, registro SW

**Estimacion**: 4-5 horas

---

### 15. Analytics Basico

**Objetivo**: Entender como los jugadores usan el juego.

**Metricas a trackear**:

**Eventos de juego**:
- game_start (nivel, modo)
- level_complete (nivel, tiempo, errores, hints_used)
- level_failed (nivel, attempts)
- game_complete (tiempo_total, niveles_completados)
- hint_used (nivel, hints_remaining)
- undo_used (nivel)
- pause_toggle (nivel, estado)

**Metricas de usuario**:
- first_visit
- returning_visitor
- session_duration
- device_type (mobile/tablet/desktop)
- browser
- screen_size

**Metricas de nivel**:
- completion_rate por nivel
- average_time por nivel
- average_errors por nivel
- abandonment_rate (donde se rinden)

**Implementacion con Google Analytics 4**:
```javascript
// Inicializar GA4
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-XXXXXXXXXX');

// Eventos personalizados
function trackEvent(eventName, params) {
  if (typeof gtag === 'function') {
    gtag('event', eventName, params);
  }
  console.log('Analytics:', eventName, params);
}

// Ejemplos de uso
trackEvent('level_complete', {
  level: currentLevel,
  time: levelTime,
  errors: errorCount,
  hints_used: HINTS_PER_LEVEL - hintsLeft
});

trackEvent('game_complete', {
  total_time: globalTime,
  levels_completed: currentLevel
});
```

**Alternativa: Plausible Analytics**:
- Open source, respeta privacidad
- No cookies, GDPR compliant
- Script mas ligero que GA
```javascript
<script defer data-domain="chessarcade.com"
  src="https://plausible.io/js/plausible.js"></script>

window.plausible('Level Complete', {
  props: {level: 5, time: 45}
});
```

**Dashboard sugerido**:
- Jugadores unicos diarios/mensuales
- Niveles mas dificiles (tasa abandono)
- Tiempo promedio por nivel
- Tasa de uso de hints
- Dispositivos mas usados

**Archivos a modificar**:
- `index.html` - Script de analytics
- `game.js` - trackEvent() en eventos clave

**Estimacion**: 2-3 horas (setup + integracion)

---

## Recomendacion de Implementacion

### Fase 1: Quick Wins (1-2 semanas)
1. Botones Deshacer/Limpiar (2-3h)
2. Feedback de Error Especifico (1-2h)
3. Estadisticas y Records (3-4h)
4. **Total: 6-9 horas**

### Fase 2: Contenido (2-3 semanas)
5. Tutorial Interactivo (6-8h)
6. Mas Niveles 9-15 (4-6h)
7. Logros/Achievements (6-8h)
8. **Total: 16-22 horas**

### Fase 3: Modos de Juego (3-4 semanas)
9. Sistema de Pausa Mejorado (2-3h)
10. Modos de Juego (Zen, Speedrun, Diario) (8-10h)
11. **Total: 10-13 horas**

### Fase 4: Polish (1-2 semanas)
12. Temas Visuales (2-3h)
13. Animaciones Mejoradas (2-3h)
14. Sonidos Adicionales (3-4h)
15. **Total: 7-10 horas**

### Fase 5: Avanzado (2-3 semanas)
16. PWA (4-5h)
17. Compartir Redes Sociales (3-4h)
18. Analytics (2-3h)
19. Modo Versus (8-10h)
20. **Total: 17-22 horas**

---

## Prioridad Maxima Recomendada

Si solo puedes hacer 3 ahora:

1. **Botones Deshacer/Limpiar** - UX inmediato, baja complejidad
2. **Estadisticas y Records** - Motivacion a largo plazo
3. **Tutorial Interactivo** - Onboarding de nuevos jugadores

Total estimado: 11-15 horas de desarrollo

---

## UI Mobile: Contador de Vidas e Indicadores de Progreso

**Fecha agregado**: 10 Enero 2026
**Estado**: Pendiente de implementación

### Contexto
El contador de vidas (corazones) ya está implementado para desktop a la izquierda del tablero. En mobile el espacio es limitado y se necesita una solución que no interfiera con otros elementos.

### Opciones para Vidas en Mobile

#### Opción 1: Junto al Timer Global (RECOMENDADA)
Los corazones aparecen a la izquierda del timer, similar a cómo están UNDO y HINT.

```
Layout: ❤️❤️❤️ | ⏱️ 00:00
```

**Pros**:
- Ya existe esa área y los usuarios ya miran ahí
- No requiere espacio adicional
- Consistente con el diseño actual

**Cons**:
- Puede verse apretado en pantallas muy pequeñas

#### Opción 2: En el Header (reemplazando COMENZAR)
Cuando el juego está en progreso, el botón COMENZAR se transforma en el contador de vidas. Al terminar el juego, vuelve a ser botón.

**Pros**:
- Usa espacio existente
- Muy visible

**Cons**:
- Cambio de contexto puede confundir

#### Opción 3: Overlay en Esquina del Tablero
Corazones pequeños semitransparentes en una esquina del tablero (ej: arriba-derecha).

```css
.lives-overlay-mobile {
    position: absolute;
    top: 5px;
    right: 5px;
    background: rgba(0,0,0,0.5);
    padding: 4px 8px;
    border-radius: 8px;
    font-size: 12px;
}
```

**Pros**:
- No ocupa espacio extra
- Siempre visible durante el juego

**Cons**:
- Puede tapar parte del tablero

#### Opción 4: En la Barra de Estado (mensaje)
Agregar los corazones al final del mensaje de estado.

```
"Coloca las piezas... ❤️❤️❤️"
```

**Pros**:
- Integrado naturalmente
- No requiere UI adicional

**Cons**:
- Menos visible
- Se pierde cuando cambia el mensaje

#### Opción 5: Mini-barra Fija Arriba
Una barra delgada fija arriba con todos los indicadores.

```
| Nivel 1 | ❤️❤️❤️❤️❤️ | Score: 0 |
```

**Pros**:
- Toda la info en un lugar
- Siempre visible

**Cons**:
- Ocupa espacio vertical adicional

---

### Barra de Progreso de Nivel

**Objetivo**: Mostrar visualmente cuánto falta para pasar al siguiente nivel.

#### Diseño Propuesto

```
┌─────────────────────────────────────┐
│  NIVEL 3                            │
│  ████████████░░░░░░  7/10 intentos  │
│  ──────────────────────────────────  │
│  Próximo: Nivel 4 - "Caballos"      │
└─────────────────────────────────────┘
```

#### Elementos a Mostrar

1. **Número de nivel actual** - Grande y visible
2. **Barra de progreso** - Intentos exitosos / requeridos
3. **Contador numérico** - "7/10 intentos"
4. **Preview del próximo nivel** - Nombre y cantidad de piezas

#### Implementación CSS Sugerida

```css
.level-progress-bar {
    width: 100%;
    height: 8px;
    background: rgba(255,255,255,0.2);
    border-radius: 4px;
    overflow: hidden;
}

.level-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--neon-cyan), var(--neon-green));
    transition: width 0.3s ease;
    box-shadow: 0 0 10px var(--neon-cyan);
}

.level-indicator {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: rgba(0,0,0,0.6);
    border: 1px solid var(--neon-cyan);
    border-radius: 8px;
}
```

#### Ubicación Sugerida

**Desktop**: Arriba del tablero o en el panel lateral izquierdo (junto a vidas y botones)

**Mobile**:
- Opción A: Debajo del título, arriba del tablero (barra horizontal compacta)
- Opción B: En el área del timer (reemplaza o complementa)
- Opción C: En una mini-barra fija superior

---

### Score / Puntaje

**Sistema de puntuación sugerido**:

```javascript
// Puntos base por intento correcto
const BASE_POINTS = 100;

// Multiplicadores
const SPEED_BONUS = 1.5;    // Si completa en menos de X segundos
const STREAK_BONUS = 0.1;   // +10% por cada intento consecutivo correcto
const NO_HINT_BONUS = 1.2;  // +20% si no usó hints

// Penalizaciones
const ERROR_PENALTY = -25;  // Por cada error
const HINT_PENALTY = -10;   // Por cada hint usado

function calculateScore(attempt) {
    let points = BASE_POINTS;

    // Bonificaciones
    if (attempt.time < levelConfig.fastTime) {
        points *= SPEED_BONUS;
    }
    points *= (1 + (streak * STREAK_BONUS));
    if (!attempt.usedHint) {
        points *= NO_HINT_BONUS;
    }

    return Math.round(points);
}
```

#### Visualización del Score

**Desktop**: En el panel lateral o header
**Mobile**: Junto al timer o en mini-barra superior

```
┌──────────────────┐
│  SCORE: 1,250    │
│  🔥 x3 streak    │
└──────────────────┘
```

---

### Propuesta de UI Unificada Mobile

Una barra compacta que muestre todo:

```
┌─────────────────────────────────────────────┐
│ LVL 3  │  ████░░░░ 7/10  │  ❤️❤️❤️  │  1250 │
└─────────────────────────────────────────────┘
```

**Elementos**:
- Nivel actual (compacto)
- Barra de progreso mini con contador
- Vidas (corazones)
- Score

**CSS**:
```css
.mobile-status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 12px;
    background: rgba(0,0,0,0.7);
    border: 1px solid var(--neon-cyan);
    border-radius: 8px;
    font-size: 11px;
    font-family: 'Orbitron', sans-serif;
}

@media (max-width: 767px) {
    .mobile-status-bar {
        position: fixed;
        top: 50px; /* Debajo del hamburger menu */
        left: 10px;
        right: 10px;
        z-index: 100;
    }
}
```

---

**Autor**: Claude Code
**Fecha**: 10 Octubre 2025 (actualizado 10 Enero 2026)
**Version**: 1.1
