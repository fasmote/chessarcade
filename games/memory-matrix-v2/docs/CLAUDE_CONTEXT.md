# Memory Matrix v2 - Contexto para Claude

Este documento resume el estado actual del proyecto Memory Matrix para que futuras sesiones de Claude puedan continuar el trabajo.

**Última actualización:** 2026-01-16

---

## Descripción del Juego

**Memory Matrix** es un juego de memoria visual con piezas de ajedrez. El jugador debe:
1. Memorizar la posición de las piezas en el tablero
2. Ver cómo las piezas "vuelan" al banco lateral
3. Arrastrar las piezas de vuelta a sus posiciones originales

---

## Estructura de Archivos

```
games/memory-matrix-v2/
├── index.html              # HTML principal
├── styles.css              # Estilos (~3400 líneas)
├── game.js                 # Lógica principal (~3100 líneas)
├── levels.js               # Sistema de 15 niveles
├── audio.js                # Web Audio API
├── ChessGameLibrary/       # Módulos reutilizables
│   ├── Utils.js
│   ├── PieceAnimations.js  # Animaciones pieza→banco
│   ├── DragDrop.js         # Drag & drop + tap-tap mobile
│   └── LevelTransition.js  # Transiciones entre niveles
└── docs/
    ├── CHANGELOG.md        # Historial de cambios
    ├── PATRONES_Y_LECCIONES.md
    ├── SUGERENCIAS_MEJORAS.md
    └── CLAUDE_CONTEXT.md   # Este archivo
```

---

## Estado Actual (2026-01-16)

### Niveles Implementados (15 total)

| Nivel | Nombre | Piezas | Tiempo | Dificultad |
|-------|--------|--------|--------|------------|
| 1 | Principiante | 2 | 3s | beginner |
| 2 | Explorador | 3 | 3s | beginner |
| 3 | Aprendiz | 4 | 4s | easy |
| 4 | Jugador | 5 | 4s | easy |
| 5 | Aspirante | 6 | 5s | medium |
| 6 | Competidor | 7 | 5s | medium |
| 7 | Experto | 8 | 6s | hard |
| 8 | Maestro | 10 | 6s | hard |
| 9 | Campeón | 11 | 7s | expert |
| 10 | Virtuoso | 12 | 8s | master |
| 11 | Genio | 13 | 8s | master |
| 12 | Prodigio | 14 | 9s | master |
| 13 | Inmortal | 15 | 9s | legendary |
| 14 | Titán | 16 | 10s | legendary |
| 15 | Dios del Ajedrez | 18 | 10s | legendary |

### Features Principales

1. **Sistema de Puntuación**
   - Puntos por colocación correcta
   - Bonificación por tiempo
   - Penalización por errores y hints

2. **Hints Infinitos**
   - Costo exponencial: 100, 200, 400, 800... puntos
   - Botón muestra costo: `HINT (-100)`
   - Gris cuando no hay puntos suficientes

3. **Contador de Corrección**
   - Aparece cuando el jugador falla (nivel 4+)
   - Muestra "REVISA 3...2...1" en naranja
   - Tiempo dinámico: `3 + floor((nivel-1)/3)` segundos

4. **Banco de Piezas Dinámico**
   - 12 slots base (6 tipos × 2 colores)
   - Crea slots extra automáticamente para niveles 11+
   - `ensureBankHasEnoughSlots(numPieces)`
   - `cleanExtraBankSlots()` limpia al reiniciar

5. **Victory Modal**
   - Aparece al completar nivel 15
   - Trofeo animado con efecto dorado
   - Muestra tiempo total y puntuación
   - Botón "Ver Ranking" → abre leaderboard

6. **Debug Tools**
   - `Ctrl+Shift+L` → prompt para saltar a nivel
   - `jumpToLevel(11)` → función en consola
   - `?level=11` → parámetro URL (mobile-friendly)

---

## Bugs Corregidos Recientemente

### Bug del Caballo Negro (bN)
- **Archivo:** `ChessGameLibrary/DragDrop.js`
- **Problema:** Piezas se identificaban mal al usar tap-tap
- **Causa:** Fallback a `slot.dataset.piece` en vez de `pieceElement.dataset.piece`
- **Solución:** Solo usar `pieceElement.dataset.piece`

### Desbordamiento del Banco (13+ piezas)
- **Archivo:** `game.js`
- **Problema:** Juego se congelaba en nivel 11+
- **Causa:** Solo había 12 slots fijos
- **Solución:** Crear slots dinámicamente con `ensureBankHasEnoughSlots()`

### Formato del Reloj (HH:MM:SS)
- **Archivo:** `game.js`
- **Problema:** Después de 1 hora mostraba "234:56"
- **Solución:** Calcular horas y mostrar formato condicional

---

## Animaciones CSS Importantes

```css
/* Contador de corrección */
@keyframes numberPop {
    0% { transform: scale(1.5); opacity: 0; }
    30% { transform: scale(0.9); opacity: 1; }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
}

/* Victory modal - trofeo */
@keyframes trophyBounce {
    0% { transform: scale(0) rotate(-20deg); opacity: 0; }
    50% { transform: scale(1.3) rotate(10deg); }
    70% { transform: scale(0.9) rotate(-5deg); }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

@keyframes trophyGlow {
    0%, 100% { filter: drop-shadow(0 0 30px gold); }
    50% { filter: drop-shadow(0 0 50px gold); }
}
```

---

## Variables Globales Importantes (game.js)

```javascript
let currentLevel = 1;           // Nivel actual (1-15)
let currentScore = 0;           // Puntuación
let currentPosition = [];       // Array de {square, piece}
let globalElapsedTime = 0;      // Tiempo total en ms
let globalStartTime = null;     // Timestamp de inicio
let totalHintsUsedSession = 0;  // Para calcular costo exponencial
```

---

## Funciones Clave

| Función | Archivo | Descripción |
|---------|---------|-------------|
| `startGame()` | game.js | Inicia el juego/nivel |
| `hidePiecesPhase()` | game.js | Fase 2: piezas vuelan al banco |
| `startSolvingPhase()` | game.js | Fase 3: jugador reconstruye |
| `validatePosition()` | game.js | Valida posición del jugador |
| `onLevelComplete()` | game.js | Maneja nivel completado |
| `showVictoryModal()` | game.js | Modal de victoria (nivel 15) |
| `ensureBankHasEnoughSlots()` | game.js | Crea slots extra dinámicos |
| `jumpToLevel(n)` | game.js | Debug: saltar a nivel |
| `hidePiecesWithAnimation()` | PieceAnimations.js | Anima piezas al banco |
| `animatePieceToBank()` | PieceAnimations.js | Animación individual |
| `getLevelConfig()` | levels.js | Obtiene config de nivel |
| `generateRandomPosition()` | levels.js | Genera posición aleatoria |

---

## Branch Git Actual

```
feature/memory-matrix-score
```

**Commits recientes:**
- `0df990a` - Docs: documentar victory modal + URL param
- `a6931e0` - Add: modal de victoria épica al completar nivel 15
- `f76ed78` - Add: parámetro URL ?level=N (mobile-friendly)
- `667f81d` - Fix: jumpToLevel() usaba propiedad inexistente
- `d0fd841` - Fix: banco dinámico para 13+ piezas

---

## Posibles Mejoras Futuras

Ver `SUGERENCIAS_MEJORAS.md` para lista completa. Algunas ideas:

1. **Modos de juego alternativos**
   - Modo contrarreloj
   - Modo infinito (sin game over)
   - Modo desafío diario

2. **Mejoras visuales**
   - Temas de tablero (madera, mármol, neón)
   - Más estilos de piezas
   - Efectos de partículas

3. **Social**
   - Compartir puntuación
   - Desafíos entre amigos
   - Torneos semanales

---

## Cómo Probar Cambios

1. **Desktop:**
   ```
   cd "C:\Users\clau\Documents\Multiajedrez 2025"
   python -m http.server 8000
   ```
   Abrir: `http://localhost:8000/games/memory-matrix-v2/`

2. **Saltar a nivel específico:**
   - Desktop: `Ctrl+Shift+L` o `jumpToLevel(11)` en consola
   - Mobile: `?level=11` en la URL

3. **Ver logs:**
   - Abrir DevTools (F12) → Console
   - Todos los eventos importantes tienen emoji: 🎯, ✅, ❌, 🏦, etc.

---

## Contacto con el Usuario

El usuario (Claudio) trabaja en:
- `C:\Users\clau\Documents\Multiajedrez 2025` - Proyecto principal
- `C:\Users\clau\Documents\DGSISAN_2025bis` - Otro proyecto

Prefiere:
- Commits descriptivos con Co-Authored-By
- Documentación en español
- Logs de consola detallados para debugging
- Probar en móvil además de desktop
