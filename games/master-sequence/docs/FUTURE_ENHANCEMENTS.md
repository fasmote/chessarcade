# Master Sequence - Future Enhancements

Este documento contiene ideas y características que podrían agregarse a Master Sequence en futuras versiones.

---

## 🔥 STREAK (Perfect Streak) - Para Leaderboard Futuro

### Qué es STREAK

**STREAK** = Cantidad de niveles **consecutivos** completados **sin errores**

**NO es la cantidad de hints usados.** Master Sequence no tiene sistema de hints.

### Cómo funciona

**Ejemplo:**
- Nivel 1: ✅ Perfecto (sin errores) → streak = 1
- Nivel 2: ✅ Perfecto → streak = 2
- Nivel 3: ✅ Perfecto → streak = 3
- Nivel 4: ❌ Un error → streak = 0 (se reinicia)
- Nivel 5: ✅ Perfecto → streak = 1 (empieza de nuevo)

### Datos disponibles

El juego **YA** calcula y envía este dato al backend:

```javascript
metadata: {
  level_reached: finalLevel,
  sequence_length: sequenceLength,
  perfect_streak: streak  // ✅ Disponible
}
```

### Por qué no está en el leaderboard ahora

Razones para no incluirlo (por ahora):
1. **Espacio limitado**: Con 6 columnas ya la tabla está completa
2. **LEVEL y LENGTH ya muestran progreso**: Son métricas más importantes
3. **Mantiene la tabla limpia y clara**

### Cómo agregarlo en el futuro

Si se decide incluir STREAK en el leaderboard:

**Opción 1: Agregar columna STREAK**
```
RANK | PLAYER | SCORE | LENGTH | LEVEL | STREAK | TIME
```

**Opción 2: Tooltip al pasar sobre el nombre**
- Mostrar STREAK como información adicional al hacer hover sobre el jugador

**Opción 3: Stat card separada**
- Mostrar "Mejor streak" como una estadística destacada arriba del leaderboard

### Código necesario

En `js/leaderboard-ui.js`, función `renderMasterSequenceScoreRow()`:

```javascript
// STREAK - racha de niveles perfectos
const streakDisplay = (score.metadata && score.metadata.perfect_streak)
  ? score.metadata.perfect_streak
  : '-';

// Agregar columna STREAK a la fila
<td class="level">${streakDisplay}</td>
```

Y en `renderMasterSequenceLeaderboardTable()`:

```html
<th class="level">Streak</th>
```

---

## 🎨 Otras Ideas Futuras

### 1. **Versión con Piezas de Ajedrez**

**Concepto:** En lugar de mostrar coordenadas genéricas, aparecen piezas de ajedrez que forman una partida famosa.

**Ejemplo:**
- Nivel 1: Aparece Peón en e4 → jugador debe hacer clic en e4
- Nivel 2: Aparece Peón en e5 → jugador recuerda [e4, e5]
- Nivel 3: Aparece Caballo en f3 → jugador recuerda [e4, e5, Nf3]
- Al final: Se revela que jugaron la Apertura Italiana

**Beneficios:**
- Educativo: Los jugadores aprenden aperturas famosas
- Atractivo visual: Usar piezas en lugar de casillas vacías
- Narrativa: "Jugaste la Apertura Ruy López nivel 15"

**Metadata adicional necesaria:**
```javascript
metadata: {
  opening_name: "Ruy López",
  famous_game: "Kasparov vs Topalov, 1999"
}
```

### 2. **Modos de Dificultad Alternativos**

**Hard Mode:**
- Reducir tiempo de highlight a 200ms desde nivel 1
- Aumentar penalización por error (perder 2 vidas)
- Sin opción de ver coordenadas

**Zen Mode:**
- Sin límite de vidas
- Solo para practicar
- No cuenta para leaderboard

### 3. **Multijugador Local**

**Concepto:** Dos jugadores se turnan en el mismo dispositivo.

**Reglas:**
- Jugador 1 intenta el nivel
- Si falla, pasa a Jugador 2
- Quien llegue más lejos gana

### 4. **Daily Challenge**

**Concepto:** Una secuencia específica del día (seed fijo).

**Beneficios:**
- Todos juegan la misma secuencia
- Leaderboard diario separado
- Competencia justa

### 5. **Sonidos Musicales**

**Concepto:** Cada casilla tiene una nota musical.

**Beneficios:**
- Ayuda memorización (memoria auditiva + visual)
- Hace el juego más musical
- Parecido a Simon Says original

### 6. **Achievements (Logros)**

**Ejemplos:**
- 🏆 "Perfectionist": Completa 10 niveles sin errores
- 🔥 "Streak Master": Llega a streak de 15
- 🎯 "Speed Demon": Completa nivel 10 en menos de 30 segundos
- 🧠 "Memory Master": Llega a nivel 20

---

## 📊 Sistema de Puntuación Futuro

### Ideas para mejorar scoring:

**Multiplicadores:**
- x1.5 por streak de 5+
- x2.0 por streak de 10+
- Bonus por completar sin usar "Coordinates" helper

**Combo System:**
- Clicks rápidos y correctos dan bonus
- Penalización menor si es cerca de la casilla correcta

**Ranking por Categorías:**
- Best Score (puntaje total)
- Best Level Reached (nivel alcanzado)
- Best Streak (mejor racha)
- Fastest Time per Level (velocidad)

---

## 🎮 Integración con Otros Juegos

### Ideas de crossover:

**"ChessArcade Master"**
- Completa todos los juegos en una sesión
- Suma de scores combinados
- Leaderboard global de arcade

**Shared Progression:**
- Desbloquear tableros especiales en Knight Quest al completar Master Sequence nivel 15
- Desbloquear temas visuales

---

## 📝 Notas de Implementación

**Prioridad Baja:**
- Todas estas ideas son opcionales
- No interfieren con la funcionalidad actual
- Pueden agregarse sin romper compatibilidad

**Prioridad Alta:**
- Mantener el juego simple y funcional
- No agregar complejidad innecesaria
- Escuchar feedback de usuarios primero

---

**Documento creado:** 15 Noviembre 2025
**Autor:** Claude Code
**Estado:** Ideas para futuro desarrollo
**Versión del juego:** 2.0.0
