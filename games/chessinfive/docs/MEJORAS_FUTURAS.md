# ChessInFive - Mejoras Futuras

Este documento recopila ideas y mejoras planificadas para futuras versiones del juego.

---

## 🏆 Sistema de Scoring Avanzado - Sistema ELO

### Motivación

El sistema de scoring actual es funcional pero limitado:

```javascript
Score = 10000 - (moves × 50) - (seconds × 1) + phaseBonus
```

**Limitaciones:**
- ✅ Funciona bien para ranking individual
- ❌ No refleja la dificultad del oponente
- ❌ No incentiva jugar contra rivales fuertes
- ❌ Difícil balancear para diferentes estilos de juego

### Propuesta: Sistema tipo ELO

Similar al sistema usado en ajedrez profesional, donde:
- Cada jugador tiene un **rating numérico** (ej: 1200-2800)
- Ganar contra un jugador fuerte → más puntos
- Ganar contra un jugador débil → pocos puntos
- Perder contra un jugador débil → pierdes muchos puntos

---

## 📐 Diseño del Sistema ELO

### 1. Rating Inicial

Todos los jugadores empiezan con un rating de **1500 puntos**.

### 2. Fórmula de Cálculo

Basada en el sistema ELO estándar con ajustes para ChessInFive:

```javascript
// PASO 1: Calcular probabilidad esperada de ganar
const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));

// PASO 2: Determinar resultado
// Win = 1, Draw = 0.5, Loss = 0
const actualScore = result;

// PASO 3: Calcular cambio de rating
const K = 32; // Factor K (más alto = cambios más rápidos)
const ratingChange = K * (actualScore - expectedScore);

// PASO 4: Aplicar modificadores de ChessInFive
const phaseMultiplier = (finalPhase === 'gravity') ? 1.5 : 1.0;
const speedBonus = Math.max(0, (60 - elapsedSeconds) / 10); // Bonus por ganar rápido

const finalChange = ratingChange * phaseMultiplier + speedBonus;

// PASO 5: Actualizar rating
newRating = oldRating + Math.floor(finalChange);
```

### 3. Ejemplo Práctico

**Escenario:** Player A (rating 1600) vs Player B (rating 1400)

**Si gana Player A:**
```
Expected = 1 / (1 + 10^((1400-1600)/400)) = 0.76
Change = 32 * (1 - 0.76) = +7.68 puntos
```

**Si gana Player B:**
```
Expected = 1 / (1 + 10^((1600-1400)/400)) = 0.24
Change = 32 * (1 - 0.24) = +24.32 puntos
```

**Conclusión:** Player B gana más puntos por vencer a un rival mejor.

---

## 🎮 Adaptaciones para ChessInFive

### Modificadores Especiales

#### 1. Phase Bonus Multiplier
- **Gravity Phase Win:** 1.5x al cambio de rating
- **Chess Phase Win:** 1.0x (normal)
- **Razón:** Ganar en fase gravity es más difícil

#### 2. Speed Bonus
- Ganar en < 30 segundos: +5 puntos extra
- Ganar en < 60 segundos: +3 puntos extra
- Ganar en < 120 segundos: +1 punto extra

#### 3. Move Efficiency
- Ganar en < 10 movimientos: +3 puntos extra
- Ganar en < 15 movimientos: +2 puntos extra
- Ganar en < 20 movimientos: +1 punto extra

### Categorías de Rating

| Rating | Categoría | Descripción |
|--------|-----------|-------------|
| < 1200 | Principiante | Aprendiendo las reglas |
| 1200-1400 | Novato | Conoce el juego |
| 1400-1600 | Intermedio | Estrategia básica |
| 1600-1800 | Avanzado | Buen dominio |
| 1800-2000 | Experto | Jugador fuerte |
| 2000-2200 | Maestro | Elite |
| 2200+ | Gran Maestro | Top mundial |

---

## 🔧 Implementación Técnica

### Base de Datos

Agregar columnas a la tabla `scores`:

```sql
ALTER TABLE scores ADD COLUMN player_rating_before INT DEFAULT 1500;
ALTER TABLE scores ADD COLUMN player_rating_after INT DEFAULT 1500;
ALTER TABLE scores ADD COLUMN opponent_rating INT DEFAULT 1500;
ALTER TABLE scores ADD COLUMN rating_change INT DEFAULT 0;
```

### API Changes

**Nuevo endpoint:** `POST /api/elo/calculate`

```javascript
{
  "player_id": "123",
  "opponent_id": "456",
  "winner": "player", // "player", "opponent", "draw"
  "metadata": {
    "final_phase": "gravity",
    "move_count": 12,
    "time_seconds": 45
  }
}

// Response:
{
  "player_rating_change": +18,
  "player_new_rating": 1618,
  "opponent_rating_change": -18,
  "opponent_new_rating": 1382,
  "explanation": "Victory against lower-rated opponent in gravity phase"
}
```

### Frontend Changes

**Leaderboard Display:**
```javascript
// Mostrar rating en lugar de score
RANK | PLAYER | RATING | W-L | STREAK
  1  | PLAYER1 | 2150  | 45-12 | 🔥 5
  2  | PLAYER2 | 2089  | 38-15 | 🔥 3
```

**Game Over Modal:**
```javascript
// Mostrar cambio de rating
"🎉 Victory! Rating: 1500 → 1518 (+18)"
"Your new rank: #42 (↑5)"
```

---

## 📊 Ventajas del Sistema ELO

1. **Más Justo:** Refleja habilidad real, no solo victorias
2. **Competitivo:** Incentiva enfrentarse a rivales fuertes
3. **Balanceado:** Automáticamente ajusta dificultad
4. **Escalable:** Funciona con millones de jugadores
5. **Probado:** Sistema usado en ajedrez durante décadas

---

## 🚀 Plan de Migración

### Fase 1: Testing (1-2 semanas)
- Implementar sistema ELO en paralelo al actual
- Recopilar datos sin afectar leaderboard público
- Analizar distribución de ratings

### Fase 2: Beta (2-4 semanas)
- Mostrar rating junto al score actual
- Permitir a usuarios optar por modo ELO
- Recopilar feedback

### Fase 3: Transición (1 semana)
- Convertir scores existentes a ratings iniciales
- Cambiar leaderboard principal a ELO
- Mantener score antiguo como secundario

### Fase 4: Optimización (ongoing)
- Ajustar Factor K según feedback
- Balancear modificadores de fase/tiempo
- Agregar ligas y temporadas

---

## 💡 Ideas Adicionales

### Matchmaking Inteligente
Emparejar jugadores con ratings similares (±200 puntos)

### Ligas y Temporadas
- Temporadas de 3 meses
- Reset parcial de ratings (80% del actual)
- Premios para top 10 de cada liga

### Achievements
- "Giant Killer": Vencer a alguien +400 rating
- "Unbeatable": 10 victorias consecutivas
- "Speed Demon": Ganar en < 30 segundos

### Modos de Juego
- **Ranked:** Afecta rating ELO
- **Casual:** Solo por diversión, no afecta rating
- **Torneo:** Swiss system, premios especiales

---

## 📚 Referencias

- [Elo Rating System (Wikipedia)](https://en.wikipedia.org/wiki/Elo_rating_system)
- [FIDE Rating Regulations](https://www.fide.com/handbook-2/)
- [Glicko-2 Rating System](http://www.glicko.net/glicko.html) (alternativa más moderna)
- [TrueSkill (Microsoft)](https://www.microsoft.com/en-us/research/project/trueskill-ranking-system/)

---

---

## ⏱️ Sistema de Relojes Individuales (Chess Clocks)

### Motivación

Actualmente, el tiempo se mide globalmente desde el inicio del juego hasta el final. Esto no refleja fielmente el desempeño individual de cada jugador.

**Limitaciones actuales:**
- ✅ Se mide tiempo total del juego
- ❌ No se distingue cuánto tiempo usó cada jugador
- ❌ No refleja la velocidad de pensamiento individual
- ❌ No permite comparar tiempos entre jugadores

### Propuesta: Chess Clocks (Relojes de Ajedrez)

Similar al ajedrez profesional, donde cada jugador tiene su propio reloj:
- El reloj del jugador activo corre mientras es su turno
- El reloj del oponente se pausa
- Al final, cada jugador tiene su tiempo individual acumulado

---

## 📐 Diseño del Sistema de Relojes

### 1. Estructura de Datos

Agregar al `GameState`:

```javascript
playerClocks: {
    cyan: {
        totalTime: 0,      // Tiempo total usado (ms)
        startTime: null,   // Timestamp cuando empezó su turno
        isRunning: false   // Si su reloj está corriendo
    },
    magenta: {
        totalTime: 0,
        startTime: null,
        isRunning: false
    }
}
```

### 2. Flujo de Implementación

**Cuando empieza el turno de un jugador:**
```javascript
startPlayerClock(player) {
    this.playerClocks[player].startTime = Date.now();
    this.playerClocks[player].isRunning = true;
}
```

**Cuando termina el turno:**
```javascript
stopPlayerClock(player) {
    if (this.playerClocks[player].isRunning) {
        const elapsed = Date.now() - this.playerClocks[player].startTime;
        this.playerClocks[player].totalTime += elapsed;
        this.playerClocks[player].isRunning = false;
    }
}
```

**Al cambiar de jugador:**
```javascript
switchPlayer() {
    // Pausar reloj del jugador actual
    stopPlayerClock(this.currentPlayer);

    // Cambiar jugador
    this.currentPlayer = this.currentPlayer === 'cyan' ? 'magenta' : 'cyan';

    // Iniciar reloj del nuevo jugador
    startPlayerClock(this.currentPlayer);
}
```

### 3. Visualización en UI

**Game Header:**
```
┌─────────────────────────────────────┐
│   CYAN: 2:34  │  MAGENTA: 1:48     │
│      ▶        │       ⏸            │
└─────────────────────────────────────┘
```

**Leaderboard:**
```
RANK | PLAYER | SCORE | CYAN TIME | MAGENTA TIME | WINNER TIME
  1  | Player1 | 9500 |   1:23    |    2:45     |    1:23
  2  | Player2 | 9200 |   2:10    |    1:55     |    1:55
```

### 4. Scoring Ajustado

Actualizar la fórmula de scoring para usar el tiempo del ganador:

```javascript
// Antes:
const timePenalty = elapsedSeconds * 1;

// Después:
const winnerTime = playerClocks[winnerPlayer].totalTime / 1000;
const timePenalty = winnerTime * 1;
```

**Beneficios:**
- Score más justo (solo penaliza el tiempo del ganador)
- Incentiva jugar rápido
- No penaliza si el oponente piensa lento

---

## 🔧 Implementación Técnica

### Metadata Actualizado

```javascript
metadata: {
    winner_player: 'CYAN',
    move_count: 32,
    time_seconds: 62,           // Tiempo total (legacy)
    cyan_time_seconds: 34,      // 🆕 Tiempo de Cyan
    magenta_time_seconds: 28,   // 🆕 Tiempo de Magenta
    winner_time_seconds: 34,    // 🆕 Tiempo del ganador
    final_phase: 'chess',
    phase_bonus: 0,
    player_type: 'Human'
}
```

### Base de Datos

No requiere cambios en estructura (metadata es JSON flexible):
- Backend ya acepta cualquier campo en metadata
- Frontend renderiza automáticamente

### Backward Compatibility

```javascript
// Fallback para scores antiguos sin relojes individuales
const winnerTimeSeconds = metadata.winner_time_seconds || metadata.time_seconds || 0;
```

---

## 🎮 Variaciones y Modos

### Time Control Modes (para futuro)

Similar a ajedrez online:

1. **Bullet** (1+0)
   - 1 minuto por jugador
   - Sin incremento

2. **Blitz** (3+2)
   - 3 minutos por jugador
   - +2 segundos por movimiento

3. **Rapid** (10+0)
   - 10 minutos por jugador
   - Sin incremento

4. **Classical** (30+0)
   - 30 minutos por jugador
   - Sin incremento

### Implementación:
```javascript
GameState.timeControl = {
    mode: 'blitz',
    initialTime: 180000,  // 3 minutos en ms
    increment: 2000       // 2 segundos en ms
};
```

---

## 📊 Ventajas del Sistema de Relojes

1. **Más Justo:** Mide desempeño individual, no del juego completo
2. **Competitivo:** Incentiva jugar rápido y eficientemente
3. **Estadísticas:** Permite analizar qué jugador piensa más
4. **Profesional:** Funcionalidad estándar en juegos de ajedrez
5. **Torneos:** Necesario para modos competitivos futuros

---

## 🚀 Plan de Implementación

### Fase 1: Backend (1 semana)
- Agregar métodos al GameState
- Implementar start/stop/switch clock logic
- Testing con unit tests

### Fase 2: UI (1 semana)
- Agregar relojes visuales en header
- Animaciones de reloj activo/pausado
- Testing de sincronización

### Fase 3: Scoring (3 días)
- Actualizar fórmula de scoring
- Migración de datos antiguos
- Testing de cálculos

### Fase 4: Leaderboard (3 días)
- Agregar columnas de tiempo individual
- Actualizar rendering
- Backward compatibility testing

---

**Última actualización:** 2025-01-17
**Estado:** Propuesta pendiente de aprobación
**Prioridad:** Media (después de estabilizar leaderboard actual)
