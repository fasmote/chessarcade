# CriptoSopa - Futuras Mejoras

## 1. Mejoras de Gameplay

### 1.1 Sistema de Niveles Progresivos
**Prioridad**: Alta
**Descripción**: Implementar dificultad incremental

**Características**:
- Nivel 1-3: 4 palabras, 3-5 letras cada una
- Nivel 4-6: 5 palabras, 4-7 letras
- Nivel 7-9: 6 palabras, 5-9 letras
- Nivel 10+: 7 palabras, 6+ letras

**Implementación**:
```javascript
function getDifficultyConfig(level) {
    if (level <= 3) return { wordCount: 4, minLength: 3, maxLength: 5 };
    if (level <= 6) return { wordCount: 5, minLength: 4, maxLength: 7 };
    if (level <= 9) return { wordCount: 6, minLength: 5, maxLength: 9 };
    return { wordCount: 7, minLength: 6, maxLength: 12 };
}
```

**Beneficios**:
- Curva de aprendizaje suave
- Mayor rejugabilidad
- Sensación de progreso

---

### 1.2 Sistema de Bonus por Velocidad
**Prioridad**: Media
**Descripción**: Recompensar completar niveles rápidamente

**Fórmula Propuesta**:
```javascript
function calculateScore(wordsFound, timeInSeconds) {
    const baseScore = wordsFound * 100;
    const timeBonus = Math.max(0, 300 - timeInSeconds) * 2;
    const speedMultiplier = timeInSeconds < 60 ? 1.5 : 1.0;
    return Math.floor((baseScore + timeBonus) * speedMultiplier);
}
```

**Rangos de Bonus**:
- < 30 seg: 540 puntos extra + 50% multiplicador
- 30-60 seg: 300-540 puntos + 50% multiplicador
- 60-120 seg: 0-300 puntos
- > 120 seg: sin bonus

---

### 1.3 Modo Contra Reloj
**Prioridad**: Media
**Descripción**: Añadir límite de tiempo por nivel

**Configuración**:
- Nivel fácil: 5 minutos
- Nivel normal: 3 minutos
- Nivel difícil: 2 minutos

**UI Adicional**:
- Barra de progreso de tiempo
- Cambio de color cuando quedan < 30 segundos
- Sonido de advertencia (opcional)

---

### 1.4 Modo Multijugador Local
**Prioridad**: Baja
**Descripción**: Dos jugadores compiten en el mismo tablero

**Mecánica**:
- Turnos alternados
- Cada jugador tiene su color
- Primer jugador en encontrar palabra la reclama
- Ganador: más palabras encontradas

**Cambios Necesarios**:
```javascript
gameState.players = [
    { name: 'Jugador 1', color: '#ff00ff', score: 0, wordsFound: [] },
    { name: 'Jugador 2', color: '#00ffff', score: 0, wordsFound: [] }
];
gameState.currentPlayer = 0;
```

---

## 2. Mejoras de UI/UX

### 2.1 Tutorial Interactivo
**Prioridad**: Alta
**Descripción**: Guía paso a paso para nuevos jugadores

**Pasos del Tutorial**:
1. "Haz click en esta letra P"
2. "Ahora muévete como un caballo a esta E"
3. "Completa la palabra PEON"
4. "¡Encontraste tu primera palabra!"

**Implementación**:
- Overlay semi-transparente
- Highlights en elementos específicos
- Tooltips con instrucciones
- Desactivable con checkbox "No volver a mostrar"

---

### 2.2 Animaciones de Victoria Mejoradas
**Prioridad**: Media
**Descripción**: Celebración más impactante

**Efectos Propuestos**:
- Confetti de partículas neon
- Animación de estrellas en palabras encontradas
- Sonido de victoria (opcional)
- Fireworks de fondo

**Librería Sugerida**:
```javascript
// canvas-confetti
confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#ff00ff', '#00ffff', '#ffff00']
});
```

---

### 2.3 Historial de Palabras Encontradas
**Prioridad**: Baja
**Descripción**: Panel expandible con registro de todas las palabras encontradas en la sesión

**Información Mostrada**:
- Palabra
- Tiempo en que se encontró
- Número de movimientos
- Path visualizado

**UI**:
```
📜 HISTORIAL (12 palabras)
┌─────────────────────────────┐
│ 00:23 - CABALLO (7 mov.)    │
│ 00:45 - TORRE (5 mov.)      │
│ 01:12 - ENROQUE (7 mov.)    │
└─────────────────────────────┘
```

---

### 2.4 Temas Visuales
**Prioridad**: Baja
**Descripción**: Diferentes paletas de colores

**Temas Propuestos**:
1. **Neon Synthwave** (actual)
2. **Matrix Green**: verdes fosforescentes
3. **Sunset Orange**: naranjas y rosas
4. **Deep Blue**: azules y violetas
5. **Retro Arcade**: amarillos y rojos

**Selector de Tema**:
```javascript
const themes = {
    neon: ['#ff00ff', '#00ffff', '#ffff00', '#ff9900', '#39ff14', '#b026ff'],
    matrix: ['#00ff00', '#00cc00', '#009900', '#006600', '#33ff33', '#66ff66'],
    sunset: ['#ff6b6b', '#ee5a6f', '#ff9999', '#ffb366', '#ffd166', '#ee9b00']
};
```

---

## 3. Mejoras Técnicas

### 3.1 Optimización de Algoritmo de Colocación
**Prioridad**: Alta
**Descripción**: Mejorar velocidad de generación de tableros

**Problema Actual**:
- Backtracking puede ser lento
- 200 intentos por palabra puede fallar

**Soluciones Propuestas**:

#### A) Greedy con Heurística
```javascript
function getValidKnightMovesWeighted(r, c, board, path) {
    const moves = getValidKnightMoves(r, c, board, path);
    // Priorizar movimientos que dejan más espacio libre
    return moves.sort((a, b) => {
        const freeA = countFreeCells(a.r, a.c, board);
        const freeB = countFreeCells(b.r, b.c, board);
        return freeB - freeA;
    });
}
```

#### B) Pre-calcular Paths Válidos
```javascript
// Al inicio del juego
const validPaths = precomputeAllValidPaths(BOARD_SIZE, MAX_WORD_LENGTH);

// Al colocar palabra
function placeWordFast(word) {
    const suitablePaths = validPaths.filter(path =>
        path.length === word.length &&
        isPathAvailable(path, gameState.board)
    );
    // Seleccionar random de paths disponibles
}
```

**Impacto Esperado**:
- Reducción de 200ms a <50ms por tablero

---

### 3.2 Web Workers para Generación de Tableros
**Prioridad**: Media
**Descripción**: No bloquear UI mientras se genera tablero

**Implementación**:
```javascript
// board-generator.worker.js
self.onmessage = function(e) {
    const { words, boardSize } = e.data;
    const board = generateBoard(words, boardSize);
    self.postMessage({ board });
};

// criptosopa.js
const worker = new Worker('board-generator.worker.js');
worker.postMessage({ words: targetWords, boardSize: 8 });
worker.onmessage = (e) => {
    gameState.board = e.data.board;
    renderBoard();
};
```

**Beneficios**:
- UI responsive durante generación
- Mejor experiencia en dispositivos lentos

---

### 3.3 LocalStorage para Persistencia
**Prioridad**: Media
**Descripción**: Guardar progreso del jugador

**Datos a Guardar**:
```javascript
const saveData = {
    currentLevel: gameState.level,
    totalScore: gameState.totalScore,
    bestTime: gameState.bestTime,
    totalWordsFound: gameState.totalWordsFound,
    achievements: gameState.achievements,
    settings: {
        soundEnabled: true,
        theme: 'neon',
        showTutorial: false
    }
};

localStorage.setItem('criptosopa-save', JSON.stringify(saveData));
```

**Features**:
- Continuar partida interrumpida
- Estadísticas acumuladas
- Configuraciones persistentes

---

### 3.4 Service Worker para Modo Offline
**Prioridad**: Baja
**Descripción**: Jugar sin conexión

**Archivos a Cachear**:
- index.html
- criptosopa.js
- criptosopa.css
- neonchess-effects.js
- Fuentes (Orbitron, Rajdhani)

**Implementación**:
```javascript
// sw.js
const CACHE_NAME = 'criptosopa-v1';
const urlsToCache = [
    '/games/criptosopa/',
    '/games/criptosopa/css/criptosopa.css',
    '/games/criptosopa/js/criptosopa.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});
```

---

## 4. Features Avanzadas

### 4.1 Creador de Puzzles Personalizado
**Prioridad**: Baja
**Descripción**: Permitir a usuarios crear sus propios puzzles

**UI de Editor**:
```
┌────────────────────────────┐
│ CREAR PUZZLE PERSONALIZADO │
├────────────────────────────┤
│ Palabras (una por línea):  │
│ ┌────────────────────────┐ │
│ │ CABALLO                │ │
│ │ TORRE                  │ │
│ │ JAQUE                  │ │
│ └────────────────────────┘ │
│                            │
│ [GENERAR] [PROBAR]         │
└────────────────────────────┘
```

**Compartir Puzzle**:
- URL con hash del puzzle
- Ejemplo: `criptosopa?p=abc123def456`

---

### 4.2 Logros y Badges
**Prioridad**: Baja
**Descripción**: Sistema de achievements

**Logros Propuestos**:
- 🐴 "Knight Master": Completar 10 niveles
- ⚡ "Speed Demon": Completar nivel en < 30 segundos
- 🎯 "Perfect": Completar sin usar pistas
- 🔥 "Hot Streak": 5 palabras en < 2 minutos
- 🌟 "Completionist": Encontrar todas las 15 palabras únicas
- 💎 "Flawless Victory": Completar 10 niveles sin errores

**Implementación**:
```javascript
const achievements = [
    {
        id: 'knight_master',
        name: 'Knight Master',
        icon: '🐴',
        description: 'Completar 10 niveles',
        unlocked: false,
        progress: 0,
        target: 10
    }
];

function checkAchievements() {
    // Verificar condiciones y desbloquear
}
```

---

### 4.3 Modo Daily Challenge
**Prioridad**: Media
**Descripción**: Puzzle diario compartido globalmente

**Características**:
- Mismo puzzle para todos los jugadores
- Leaderboard diario
- Seed basado en fecha: `seed = Date.now() / 86400000`
- Recompensas por participación diaria

**Generación Determinística**:
```javascript
function getDailySeed() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.getTime();
}

Math.seedrandom(getDailySeed());
const dailyWords = selectRandomWords(WORD_LIST, 6);
```

---

### 4.4 Hints Inteligentes
**Prioridad**: Baja
**Descripción**: Pistas más sofisticadas

**Tipos de Pistas**:

1. **Básica** (actual): Destaca primera letra
2. **Intermedia**: Muestra primeros 2 movimientos
3. **Avanzada**: Resalta todas las letras pero sin orden
4. **Visual**: Muestra dirección general (zona del tablero)

**Costos**:
- Básica: -10 puntos
- Intermedia: -25 puntos
- Avanzada: -50 puntos

---

## 5. Integración con Ecosistema

### 5.1 Integración con Leaderboard Global
**Prioridad**: Alta
**Descripción**: Mejorar sistema actual

**Datos a Enviar**:
```javascript
{
    game: 'criptosopa',
    score: finalScore,
    level: currentLevel,
    time: elapsedTime,
    wordsFound: wordCount,
    hintsUsed: hintsUsed,
    metadata: {
        difficulty: 'normal',
        mode: 'classic',
        date: new Date().toISOString()
    }
}
```

**Rankings**:
- Global All-Time
- Daily Top 10
- Weekly Top 100
- Por modo de juego

---

### 5.2 Compartir en Redes Sociales
**Prioridad**: Media
**Descripción**: Botones de compartir resultados

**Formato de Mensaje**:
```
🐴 CriptoSopa - Knight Word Search

Nivel 5 completado!
⏱️ 01:23
🎯 6/6 palabras
⭐ 1,250 puntos

¿Puedes superarme?
👉 chessarcade.com/criptosopa
```

**Botones**:
- Twitter/X
- Facebook
- WhatsApp
- Copiar al portapapeles

---

### 5.3 Analytics
**Prioridad**: Baja
**Descripción**: Tracking de métricas

**Eventos a Trackear**:
- Niveles completados
- Tiempo promedio por nivel
- Palabras más difíciles (menos encontradas)
- Tasa de abandono
- Uso de pistas

**Implementación**:
```javascript
// Google Analytics 4
gtag('event', 'level_complete', {
    level: gameState.level,
    time: elapsedTime,
    score: finalScore,
    hints_used: hintsUsed
});
```

---

## 6. Accesibilidad

### 6.1 Soporte para Teclado
**Prioridad**: Alta
**Descripción**: Jugar sin mouse

**Controles Propuestos**:
- Flechas: Navegar entre celdas
- Enter: Seleccionar celda
- Backspace: Deseleccionar última
- Escape: Cancelar selección
- Tab: Cambiar entre paneles

---

### 6.2 Modo Alto Contraste
**Prioridad**: Media
**Descripción**: Para usuarios con dificultades visuales

**Características**:
- Bordes más gruesos (5px)
- Colores más saturados
- Mayor tamaño de fuente
- Sin animaciones (opcional)

---

### 6.3 Screen Reader Support
**Prioridad**: Baja
**Descripción**: Atributos ARIA

**Ejemplo**:
```html
<div class="board-cell"
     role="button"
     aria-label="Letra P, fila 3, columna 4"
     aria-pressed="false"
     tabindex="0">
    P
</div>
```

---

## 7. Roadmap Sugerido

### Versión 1.0.x — Estética y Responsive (EN PROGRESO — 2026-05-07/08)

#### ✅ COMPLETADO
- [x] Botones neon: `.neon-arcade-btn--primary/secondary/tertiary` definidos en CSS
- [x] Modales: `.neon-modal`, `.neon-modal-content`, `.modal-header`, `.modal-close-btn` definidos
- [x] Fix SVG joystick gigante: `width="40" height="40"` en atributos HTML
- [x] Fix canvas huérfano: `position: fixed` en `.particles-canvas`
- [x] Responsive tablet: grid 2 columnas desde 768px (antes 1024px)
- [x] Mobile compacto: padding reducido, subtítulo oculto, botones en grid 2+1
- [x] `--neon-yellow` sincronizado a `#ffff00`

#### 🔲 PENDIENTE — Fase 3 (Detalles estéticos)
- [ ] Confeti en victoria: llamar `launchConfetti()` al completar todas las palabras
- [ ] Mini logo en mobile: reemplazar ← MENÚ con algo más visual (actualmente oculto)
- [ ] Flash más notorio al encontrar una palabra
- [ ] Revisar visual del modal de victoria con el nuevo estilo
- [ ] Subir a Hostinger via FTP (los archivos modificados son: `css/criptosopa.css` e `index.html`)
- [ ] Testear en dispositivos reales: iPhone, Android, tablet
- [ ] Remover console.logs de debug en `criptosopa.js`

#### 🔲 ARCHIVOS MODIFICADOS EN ESTA SESIÓN
- `games/criptosopa/css/criptosopa.css` — todos los cambios de estética
- `games/criptosopa/index.html` — fix width/height en SVG joystick
- `games/criptosopa/DOCS/futuras-mejoras.md` — este archivo
- `games/criptosopa/DOCS/errores-y-soluciones.md` — errores #101 al #106

---

### Versión 1.1 (Próxima release)
- [ ] Tutorial interactivo
- [ ] Sistema de niveles progresivos
- [ ] Remover console.logs de debug
- [ ] Optimización de algoritmo de colocación

### Versión 1.2
- [ ] Sistema de bonus por velocidad
- [ ] Persistencia con LocalStorage
- [ ] Temas visuales (3 temas)
- [ ] Integración mejorada con leaderboard

### Versión 1.3
- [ ] Modo contra reloj
- [ ] Logros y badges
- [ ] Animaciones de victoria mejoradas
- [ ] Compartir en redes sociales

### Versión 2.0
- [ ] Modo Daily Challenge
- [ ] Creador de puzzles personalizado
- [ ] Modo multijugador local
- [ ] Service Worker (modo offline)

---

## 8. Estética y Responsive — Análisis 2026-05-07

> Análisis realizado comparando CriptoSopa con Memory Matrix y Master Sequence.
> Regla: no alterar lógica del juego. Solo CSS y estructura visual.

### Estado actual

| Elemento | Estado | Notas |
|---|---|---|
| Header (título/subtítulo) | ✅ Correcto | Usa `.neon-title`, `.neon-subtitle` del sistema compartido |
| Logo + nav desktop | ✅ Correcto | Borde, colores y hover funcionan |
| Hamburger menu mobile | ✅ Correcto | Ya integrado |
| Tablero con borde cyan | ✅ Correcto | Buena estética arcade |
| Timer naranja neon | ✅ Correcto | Usa `var(--neon-orange)` correctamente |
| Info-cards panel derecho | ✅ Correcto | Look ChessArcade |
| Estados de celda | ✅ Correcto | selected/found/hint con neon |
| **Botones NUEVO/PISTA/AYUDA** | ❌ Sin estilos | Clases `--primary/secondary/tertiary` no definidas en ningún CSS |
| **Modales help y victory** | ❌ Sin estilos | `.neon-modal`, `.neon-modal-content`, `.modal-header`, `.modal-close-btn` no definidas |
| **Responsive tablet** | ❌ Falta | Sin breakpoint 641–1023px |
| `--neon-yellow` | ⚠️ Desincronizada | `#ffd700` en criptosopa.css vs `#ffff00` en neonchess-style.css |
| Confeti en victoria | ❌ Falta | Función `launchConfetti` existe en el proyecto, no está llamada |

---

### Fase 1 — Bloqueos visuales (prioridad alta)

#### 1A. Botones sin estilos neon

**Problema:** El HTML usa `.neon-arcade-btn--primary`, `--secondary`, `--tertiary` pero estas variantes no existen. Los botones se ven como default del navegador.

**Solución:** Definir en `criptosopa.css`:
- `--primary` → cyan (coherente con tablero y cards)
- `--secondary` → magenta (acción especial — pista)
- `--tertiary` → amarillo (informativo — ayuda)

Seguir el mismo patrón de sombra neon que usa `.neon-arcade-btn.red` en `neonchess-style.css`.

#### 1B. Modales sin definición

**Problema:** `.neon-modal`, `.neon-modal-content`, `.modal-header`, `.modal-close-btn` no tienen CSS. Los modales no se muestran correctamente.

**Solución:** Agregar en `criptosopa.css`:
```
.neon-modal         → overlay position:fixed, fondo rgba oscuro, display:none por defecto
.neon-modal.active  → display:flex para mostrar
.neon-modal-content → caja centrada, borde neon cyan, fondo oscuro, border-radius
.modal-header       → flex row, justify-content:space-between, título + botón X
.modal-close-btn    → botón X con color neon, hover con glow
```

---

### Fase 2 — Responsive completo (prioridad media)

#### 2A. Breakpoint tablet faltante

Hoy el grid de 2 columnas activa en 1024px. En 768px–1023px el tablero ocupa todo el ancho en 1 columna (desperdicia espacio). Cambiar a 768px.

#### 2B. Botones en mobile

En 375px, 3 botones en fila con flex-wrap quedan muy chicos. Propuesta:
- Botones en 2 filas: [NUEVO TABLERO] ancho completo, [PISTA] + [AYUDA] en fila
- O los 3 en columna en mobile

#### 2C. Sincronizar `--neon-yellow`

Cambiar `#ffd700` → `#ffff00` en `:root` de `criptosopa.css`.

---

### Fase 3 — Detalles estéticos (prioridad baja)

- **Confeti en victoria:** llamar `launchConfetti()` al completar todas las palabras (ya existe en el proyecto como función global)
- **Flash más notorio al encontrar palabra:** el color de la palabra ya cambia, pero un breve scale + glow mejoraría el feedback
- **Glow en modal de victoria:** el `.victory-value` podría tener animación de pulso neon

---

### Lo que NO entra en cambios estéticos (es lógica)

- Sistema de niveles progresivos
- Bonus por velocidad
- Modo contra reloj
- Daily Challenge
- Tutorial interactivo
- Hints inteligentes

---

## 9. Notas de Desarrollo

### Compatibilidad
- Mantener soporte para navegadores sin Web Workers (fallback)
- Progressive Enhancement: features avanzadas solo si disponibles
- Mobile-first: todas las features deben funcionar en móvil

### Performance
- Mantener < 50ms de tiempo de generación de tablero
- 60 FPS en animaciones
- < 100KB de JavaScript total
- Lazy loading de features no críticas

### Testing
- Unit tests para algoritmo de colocación
- Integration tests para flujo de juego completo
- Accessibility testing (WAVE, axe)
- Cross-browser testing (Chrome, Firefox, Safari, Edge)

---

## 10. Roadmap Revisado — Sesión 2026-05-08

> Prioridades acordadas. Foco en mobile primero, PC se revisa después.
> Decisión: NO guardar récord en localStorage — irá directo al leaderboard de Supabase cuando esté integrado, para evitar duplicar datos y luego tener que migrarlos.

---

### SPRINT 1 — En curso

| # | Mejora | Dificultad | Estado |
|---|--------|-----------|--------|
| 1 | Confeti al ganar todas las palabras | Fácil | 🔲 |
| 2 | Flash más notorio al encontrar palabra (scale + glow) | Fácil | 🔲 |
| 3 | Remover console.logs de debug | Fácil | 🔲 |
| 4 | Vibración al encontrar palabra (mobile) — `navigator.vibrate(150)` | Fácil | 🔲 |
| 5 | Sonido al encontrar palabra y al ganar | Fácil | 🔲 |
| ~~6~~ | ~~Guardar récord local (localStorage)~~ | — | ❌ Descartado — irá al leaderboard |

---

### SPRINT 2 — Tutorial + Animación (prioridad después del Sprint 1)

| # | Mejora | Dificultad | Notas |
|---|--------|-----------|-------|
| 11 | Tutorial interactivo | Medio | Primera partida guiada paso a paso: "tocá esta celda → ahora esta → ¡encontraste la primera letra!" Solo se muestra la primera vez. |
| 12 | Animación de caballo saltando | Medio | Un pequeño ♞ que salta visualmente entre las celdas seleccionadas siguiendo el path. Refuerza el concepto del movimiento en L. |

---

### SPRINT 3 — Gameplay

| # | Mejora | Dificultad | Notas |
|---|--------|-----------|-------|
| 5 | Niveles de dificultad | Medio | Fácil (4 palabras, casillas válidas muy iluminadas) / Normal (actual) / Difícil (8 palabras, sin iluminación de casillas válidas) |
| 7 | Compartir resultado | Medio | Botón en modal victoria → `navigator.share()` o copiar: "Encontré 6 palabras en 01:45 🐴🔍" |
| 8 | Estadísticas históricas | Medio | Cuando esté el leaderboard, las stats vienen de Supabase |

---

### SPRINT 4 — Features avanzados

| # | Mejora | Dificultad | Notas |
|---|--------|-----------|-------|
| 9 | Daily Puzzle | Complejo | Misma semilla por fecha → mismo tablero para todos. Comparar tiempos. Requiere coordinación con Supabase. |
| 10 | Modo zen (sin tiempo) | Fácil | Toggle que pausa el timer. Para jugadores casuales o niños. |
| 13 | Categorías de palabras | Medio | Ajedrez (actual) + Animales + Países + Deportes. Selector antes de empezar. |
| 14 | Palabras temáticas rotativas | Medio | Set diferente cada semana. Fecha de rotación visible. |
| 15 | Estrellitas según tiempo | Fácil | 1-3 ⭐ en el modal de victoria según rapidez. Incentiva rejugar. |

---

### IDEAS ADICIONALES (sin prioridad aún)

- **Swipe para seleccionar** — arrastrar dedo entre celdas siguiendo movimiento de caballo, más fluido que tap-tap
- **Iluminar camino de palabra encontrada** — al tocar una palabra de la lista ya encontrada, su camino se ilumina en el tablero brevemente
- **Confeti del color de la última palabra** — en lugar de confeti genérico, usa el color asignado a esa palabra
- **Resaltar primer celda de pista** — la pista actual muestra la primera celda de la próxima palabra (sin revelar el camino)
- **Modo daltonismo** — paleta alternativa accesible

---

## 11. Sistema de Niveles Progresivos — Diseño 2026-05-09

> Decisiones de diseño acordadas antes de implementar.

### Reglas generales

| Parámetro | Decisión |
|---|---|
| "NUEVO TABLERO" | Mantiene el nivel actual, genera nuevas palabras del mismo pool |
| Persistencia entre sesiones | localStorage guarda el nivel alcanzado |
| Reset de nivel | **Botón futuro** "Volver al nivel 1" (aún no implementado) |
| Pistas | Infinitas, costo exponencial: 50 → 100 → 200 → 400... (igual a Master Sequence) |
| Botón pista | Muestra el costo: `💡 PISTA (-50)`. Gris si no hay puntos suficientes |

---

### Tabla de niveles

| Nivel | Categoría | Palabras por partida | Iluminación casillas válidas |
|---|---|---|---|
| 1 | Ajedrez básico | 4 | Completa (actual) |
| 2 | Conceptos de ajedrez | 5 | Completa |
| 3 | Jaques mate famosos | 6 | Completa |
| 4 | Campeones del mundo | 6 | Solo borde (sin relleno) |
| 5 | Tácticas | 7 | Solo borde |
| 6 | Animales | 7 | Solo borde |
| 7 | Países | 8 | Sin iluminación |
| 8 | Deportes | 8 | Sin iluminación |

---

### Pools de palabras por nivel

> Sin guiones, sin tildes, todo mayúsculas. Se incluyen todas las palabras sin importar largo — el algoritmo de colocación maneja paths largos. Las palabras de 10+ letras son difíciles de encontrar (mayor desafío).

#### Nivel 1 — Ajedrez básico
```
CABALLO, ALFIL, TORRE, REINA, REY, PEON, JAQUE, MATE, TABLERO, ENROQUE,
CAPTURA, GAMBITO, ELO, FIDE, RELOJ, BLANCAS, NEGRAS, PIEZA, ESCAQUE,
BANDO, TURNO, COLUMNA, DIAGONAL, FLANCOS
```
*(24 palabras)*

#### Nivel 2 — Conceptos de ajedrez
```
ESTRATEGIA, TACTICA, APERTURA, MEDIOJUEGO, DEFENSA, ATAQUE, POSICION,
VENTAJA, SACRIFICIO, VARIANTE, BLITZ, RAPID, FIANCHETO, MOVILIDAD,
ESTRUCTURA, ESPACIO, TIEMPO, PROFILAXIS, ACTIVIDAD, DINAMICO,
DEBILIDAD, INICIATIVA
```
*(22 palabras)*

#### Nivel 3 — Jaques mate famosos
```
PASTOR, LEGAL, ANASTASIA, LOCO, BODEN, MORPHY, PASILLO, OPERA, GRECO,
DAMIANO, PHILIDOR, PILLSBURY, LOLLI, ARABIAN, EPAULETTE, ESPEJO,
AHOGADO, BESO, BLACKBURNE, CORRIDOR, INDIAN, COZIO
```
*(22 palabras)*

#### Nivel 4 — Campeones del mundo (FIDE, PCA, Rápido, Blitz, Femenino)

**Clásico / Unificado (hombres):**
```
STEINITZ, LASKER, CAPABLANCA, ALEKHINE, EUWE, BOTVINNIK, SMYSLOV,
TAL, PETROSIAN, SPASSKY, FISCHER, KARPOV, KASPAROV, KRAMNIK,
ANAND, CARLSEN, DING, GUKESH
```
*(18 nombres — incluye a Gukesh D., campeón 2024, el más joven de la historia)*

**Período FIDE de división (1993–2006):**
```
KHALIFMAN, PONOMARIOV, KASIMDZHANOV, TOPALOV
```
*(La PCA fue la Professional Chess Association, fundada por Kasparov en 1993 al romper con FIDE. KASPAROV ya figura arriba como campeón PCA. SHORT fue el rival de Kasparov en 1993 pero no ganó.)*

**Rápido y Blitz (campeones únicos no ya listados):**
```
GRISCHUK, ABDUSATTOROV, NEPOMNIACHTCHI
```
*(Nota: NEPOMNIACHTCHI tiene 14 letras, ABDUSATTOROV 12, KASIMDZHANOV 12 — palabras largas, alta dificultad para encontrar)*

**Femenino (campeonas mundiales FIDE):**
```
MENCHIK, RUDENKO, BYKOVA, RUBTSOVA, GAPRINDASHVILI, CHIBURDANIDZE,
XIEJUN, POLGAR, ZHUCHEN, STEFANOVA, YUHUA, KOSTENIUK,
YIFAN, USHENINA, MUZYCHUK, ZHONGYI, WENJUN
```
*(Nota: nombres chinos compuestos escritos en una sola cadena: XIEJUN=Xie Jun, ZHUCHEN=Zhu Chen, YUHUA=Xu Yuhua, YIFAN=Hou Yifan, ZHONGYI=Tan Zhongyi, WENJUN=Ju Wenjun)*

**Total nivel 4: ~42 nombres** — el pool más grande del juego.

#### Nivel 5 — Tácticas de ajedrez
```
HORQUILLA, CLAVADA, ENFILADA, ZUGZWANG, BLOQUEO, DEFLEXION, ATRACCION,
SOBRECARGA, BATERIA, TRAMPA, CELADA, RUPTURA, DOMINACION, TEMPO, CLAVO,
AMENAZA, INVASION, PALANCA, APOYO, RAYOS
```
*(20 palabras)*

#### Nivel 6 — Animales
```
TIGRE, AGUILA, JIRAFA, ELEFANTE, DELFIN, PINGUINO, COCODRILO, SERPIENTE,
MARIPOSA, CANGURO, CAMELLO, HIPOPOTAMO, GORILA, LEON, PANDA, GUEPARDO,
LOBO, ZORRO, PULPO, BALLENA, TIBURON, ORCA, CONDOR, TORTUGA, JAGUAR,
LEOPARDO
```
*(26 palabras)*

#### Nivel 7 — Países
```
ARGENTINA, RUSIA, NORUEGA, ALEMANIA, ESPANA, FRANCIA, ITALIA, BRASIL,
CHINA, INDIA, JAPON, HOLANDA, AUSTRALIA, CANADA, HUNGRIA, GEORGIA,
ARMENIA, UCRANIA, POLONIA, CUBA, IRAN, TURQUIA, SUECIA, DINAMARCA,
ISLANDIA
```
*(25 palabras)*

#### Nivel 8 — Deportes
```
TENIS, NATACION, ATLETISMO, FUTBOL, CICLISMO, VOLEIBOL, BALONCESTO,
GIMNASIA, BOXEO, SURF, GOLF, RUGBY, BEISBOL, HOCKEY, REMO, ESGRIMA,
JUDO, KARATE, ARQUERIA, LUCHA, TRIATLON, VELA, ESCALADA
```
*(23 palabras)*

---

### Implementación técnica necesaria

**JS — `criptosopa.js`:**
```javascript
CONFIG.LEVELS = [
  { pool: [...], wordsPerGame: 4, illumination: 'full',   hintBaseCost: 50  },
  { pool: [...], wordsPerGame: 5, illumination: 'full',   hintBaseCost: 50  },
  { pool: [...], wordsPerGame: 6, illumination: 'full',   hintBaseCost: 50  },
  { pool: [...], wordsPerGame: 6, illumination: 'border', hintBaseCost: 100 },
  { pool: [...], wordsPerGame: 7, illumination: 'border', hintBaseCost: 100 },
  { pool: [...], wordsPerGame: 7, illumination: 'border', hintBaseCost: 100 },
  { pool: [...], wordsPerGame: 8, illumination: 'none',   hintBaseCost: 150 },
  { pool: [...], wordsPerGame: 8, illumination: 'none',   hintBaseCost: 150 },
];

// gameState.currentLevelIndex  (0-based, persistido en localStorage)
// gameState.hintsUsedThisGame  (para calcular costo: baseCost * 2^hintsUsed)
// Eliminar: gameState.hintsRemaining (ya no hay límite de pistas)
```

**CSS — `criptosopa.css`:**
```css
/* Nivel 4-6: solo borde, sin relleno */
.cell-hint.hint-border-only {
  background-color: transparent !important;
  border-color: rgba(255,255,255,0.5) !important;
}

/* Nivel 7-8: sin ninguna iluminación */
.cell-hint.hint-none {
  background-color: rgba(15, 23, 42, 0.5) !important;
  border-color: #1e293b !important;
  cursor: default;
}
```

---

### Pendientes relacionados (a documentar como issues futuros)

- [ ] **Botón "Reset nivel"**: volver al nivel 1 manteniendo historial. Ubicación: modal de victoria o menú de configuración.
- [ ] **Indicador de nivel en UI**: "Nivel 4 — Campeones del mundo" visible en pantalla.
- [ ] **Leaderboard por nivel**: el score del nivel 7 no compite contra el del nivel 1.
- [ ] **Validar palabras largas**: verificar que el algoritmo de colocación no se cuelgue con palabras de 12-14 letras (NEPOMNIACHTCHI, GAPRINDASHVILI, CHIBURDANIDZE). Agregar timeout de fallback.

---

### Idea futura: Nivel por imágenes

**Concepto**: en lugar de mostrar la palabra en el marquee, mostrar una **imagen** relacionada. El jugador debe encontrar la palabra en el tablero sin texto de referencia.

- 🐴 → buscar CABALLO
- Foto de Magnus Carlsen → buscar CARLSEN
- 🏆 de ajedrez → buscar CAMPEONA / CAMPEON

**Por qué es el nivel más difícil**: sin texto de referencia, el jugador debe reconocer la imagen, deducir la palabra, y luego encontrarla en el tablero.

**Implementación futura**: agregar campo `hint` (emoji o imageUrl) al pool de palabras. El marquee muestra la imagen/emoji en lugar del texto. El display estático al hacer click muestra la imagen + el texto (para los que no recuerdan).
