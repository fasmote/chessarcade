# 📋 Mejoras Futuras - ChessArcade

Este documento contiene una lista de mejoras planificadas para implementar en el futuro.

---

## 🌍 Sistema de Internacionalización (i18n)

**Prioridad:** Media
**Complejidad:** Media
**Impacto:** Alto

### Descripción
Implementar sistema de múltiples idiomas para que la página se muestre automáticamente en español, inglés, francés, portugués, etc., según la ubicación o idioma del navegador del usuario.

### Enfoque Recomendado: Opción 1 + Opción 3 (Combinadas)

#### Características:
- **Detección automática** del idioma del navegador al cargar (`navigator.language`)
- **Selector manual** discreto en el header para que usuarios puedan cambiar idiomas
- **Persistencia** de preferencia en `localStorage`
- **Fallback** a español si el idioma no está disponible

### Idiomas Prioritarios:
1. **Español (es)** - Idioma principal
2. **Inglés (en)** - Audiencia internacional
3. **Portugués (pt)** - Brasil/Portugal (mercado grande de ajedrez)
4. **Francés (fr)** - Opcional

### Estructura de Archivos Propuesta:
```
/lang/
  ├── es.json
  ├── en.json
  ├── fr.json
  └── pt.json
```

### Ejemplo de Archivo de Traducción (es.json):
```json
{
    "nav": {
        "home": "Inicio",
        "about": "Acerca de",
        "games": "Juegos",
        "contact": "Contacto"
    },
    "hero": {
        "title": "Mejora tus Habilidades de Ajedrez Jugando",
        "subtitle": "Juegos interactivos para entrenar tu cerebro"
    },
    "games": {
        "knightQuest": {
            "name": "Knight Quest",
            "description": "Domina el movimiento en L del caballo"
        },
        "criptoCaballo": {
            "name": "Cripto-Caballo",
            "description": "Descifra mensajes ocultos con movimientos de caballo"
        }
    }
}
```

### Implementación JavaScript:
```javascript
// Detectar idioma del navegador
const userLang = navigator.language || navigator.userLanguage;
const lang = userLang.substring(0, 2);

// Cargar traducciones
async function loadLanguage(lang) {
    try {
        const response = await fetch(`/lang/${lang}.json`);
        const translations = await response.json();
        applyTranslations(translations);
    } catch (error) {
        console.error('Error loading translations:', error);
        // Fallback a español
        loadLanguage('es');
    }
}

// Aplicar traducciones a elementos con data-i18n
function applyTranslations(t) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const keys = el.getAttribute('data-i18n').split('.');
        let value = t;

        keys.forEach(key => {
            value = value?.[key];
        });

        if (value) el.textContent = value;
    });
}

// Guardar preferencia
document.getElementById('language-selector').addEventListener('change', (e) => {
    const selectedLang = e.target.value;
    localStorage.setItem('preferredLanguage', selectedLang);
    loadLanguage(selectedLang);
});

// Al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('preferredLanguage');
    const browserLang = (navigator.language || 'en').substring(0, 2);
    const lang = savedLang || browserLang;

    loadLanguage(lang);
});
```

### HTML - Uso de data-i18n:
```html
<h1 data-i18n="hero.title">Cargando...</h1>
<button data-i18n="games.knightQuest.playNow">Cargando...</button>

<!-- Selector de idioma -->
<select id="language-selector" style="position: fixed; top: 20px; right: 20px;">
    <option value="es">🇪🇸 Español</option>
    <option value="en">🇬🇧 English</option>
    <option value="fr">🇫🇷 Français</option>
    <option value="pt">🇧🇷 Português</option>
</select>
```

### Elementos a Traducir:
- Navegación (header/footer)
- Títulos y descripciones de juegos
- Botones ("Jugar Ahora", "Play Now")
- Instrucciones de juegos
- Mensajes del sistema (victorias, errores)
- Artículos (títulos y contenido)

### Alternativa: Geolocalización por IP
Si se desea detectar ubicación física en lugar de idioma del navegador:

```javascript
// Usar ipapi.co (gratuito hasta 30,000 requests/mes)
fetch('https://ipapi.co/json/')
    .then(response => response.json())
    .then(data => {
        const country = data.country_code; // 'AR', 'US', 'FR', 'BR'

        const countryToLang = {
            'AR': 'es', 'ES': 'es', 'MX': 'es', 'CO': 'es', 'CL': 'es',
            'US': 'en', 'GB': 'en', 'CA': 'en', 'AU': 'en',
            'FR': 'fr', 'BE': 'fr',
            'BR': 'pt', 'PT': 'pt'
        };

        const lang = countryToLang[country] || 'en';
        loadLanguage(lang);
    })
    .catch(() => {
        // Fallback al idioma del navegador
        const lang = (navigator.language || 'en').substring(0, 2);
        loadLanguage(lang);
    });
```

### Beneficios:
- Mayor alcance internacional
- Mejor experiencia de usuario
- Incremento en retención de usuarios no hispanohablantes
- SEO mejorado para múltiples regiones

### Consideraciones:
- Mantener consistencia en traducciones
- Revisar traducciones por nativos de cada idioma
- Asegurar que todos los textos dinámicos también se traduzcan
- Considerar dirección RTL para idiomas como árabe (futuro)

---

## 🔐 CriptoCaballo: Sistema de Administración de Mensajes

**Prioridad:** Alta
**Complejidad:** Media-Alta
**Impacto:** Alto (mejora calidad del contenido)

### 1. Campo de Comentarios en Admin

**Descripción:**
Agregar un campo opcional "Comentarios" en el formulario de creación/edición de puzzles para que el admin pueda agregar notas, traducciones, pistas, etc.

**Casos de uso:**
- Traducción al inglés: "The early bird catches the worm"
- Autor original: "Frase de Benjamin Franklin"
- Pistas para usuarios: "Pista: busca la letra inicial en la esquina superior izquierda"
- Contexto cultural: "Refrán muy usado en Argentina"
- Nivel de dificultad: "Difícil - tiene muchas Q y X"

**Implementación sugerida:**

**Modelo de datos (Supabase):**
```sql
ALTER TABLE crypto_puzzles
ADD COLUMN admin_comments TEXT;
```

**Formulario Admin:**
```html
<div class="admin-field">
    <label>💬 Comentarios Admin (Opcional)</label>
    <textarea
        id="admin-comments"
        placeholder="Ej: Traducción EN: 'Practice makes perfect' | Pista: Empieza en A1 | Dificultad: Media"
        rows="3"
        style="width: 100%; font-size: 0.9rem; padding: 0.5rem;">
    </textarea>
    <small style="color: #94a3b8;">
        Solo visible para admin. Usa '|' para separar múltiples notas.
    </small>
</div>
```

**Vista en lista de puzzles:**
```
┌─────────────────────────────────────────────────────┐
│ 📋 "El que madruga encuentra oro"                   │
│ 5x5 | 27 chars | ID: 42                            │
│ 💬 EN: "The early bird catches worm" | Dif: Fácil │
│ [Editar] [Eliminar] [Ver Puzzle]                   │
└─────────────────────────────────────────────────────┘
```

---

### 2. Panel de Estadísticas de Mensajes (Opción 1)

**Descripción:**
Nueva pestaña "📊 ESTADÍSTICAS" en el panel admin para ver todos los mensajes y su uso.

**Funcionalidades:**
- **Lista completa** de todos los mensajes usados
- **Contador de uso** por cada mensaje (cuántas veces se ha usado en puzzles)
- **Última fecha de uso**
- **Filtros:** Por tamaño de tablero (3x4, 5x5, 8x8)
- **Búsqueda:** Texto para encontrar mensajes específicos
- **Ordenar:** Por fecha, por frecuencia de uso, alfabéticamente
- **Indicador visual:** Colores
  - 🆕 Verde = Nuevo (0 usos)
  - ⚠️ Amarillo = Poco usado (1-5 usos)
  - 🔥 Naranja = Usado moderado (6-10 usos)
  - 🚨 Rojo = Muy usado (>10 usos)
- **Botón "Marcar como Retirado"** para no usar más un mensaje

**Vista sugerida:**
```
┌─────────────────────────────────────────────────────┐
│ 📊 ESTADÍSTICAS DE MENSAJES                         │
├─────────────────────────────────────────────────────┤
│ Total: 47 | Usados: 32 | Nuevos: 15 | Retirados: 3│
├─────────────────────────────────────────────────────┤
│ [🔍 Buscar...] [Filtro: Todos ▼] [Orden: Fecha ▼] │
├─────────────────────────────────────────────────────┤
│ 🔥 "El que madruga encuentra oro"                   │
│    Usos: 12 | Última: 2025-12-05 | Tablero: 5x5   │
│    💬 "EN: The early bird... | Dificultad: Fácil" │
│    [Ver Puzzle] [Editar] [⛔ Retirar]              │
├─────────────────────────────────────────────────────┤
│ 🆕 "No hay mal que por bien no venga"              │
│    Usos: 0 | Nueva | Tablero: 4x5                 │
│    💬 "Traducir al inglés"                         │
│    [Ver Preview] [Editar]                          │
├─────────────────────────────────────────────────────┤
│ ⚠️ "Más vale tarde que nunca"                      │
│    Usos: 3 | Última: 2025-11-28 | Tablero: 5x6    │
│    [Ver Puzzle] [Editar]                           │
└─────────────────────────────────────────────────────┘
```

**Consulta SQL sugerida:**
```sql
SELECT
    message,
    COUNT(*) as usage_count,
    MAX(created_at) as last_used,
    board_size,
    admin_comments
FROM crypto_puzzles
GROUP BY message, board_size, admin_comments
ORDER BY usage_count DESC;
```

---

### 3. Sistema de Cooldown / Tiempo de Espera (Opción 5)

**Descripción:**
Prevención automática de repetición de mensajes hasta que pase cierto tiempo.

**Configuración:**
```javascript
const COOLDOWN_CONFIG = {
    global: 30,        // 30 días para cualquier mensaje
    byCategory: {
        premium: 60,   // Mensajes marcados como "premium"
        normal: 30,    // Mensajes normales
        filler: 15     // Mensajes de relleno
    }
};
```

**Indicadores visuales en lista:**
```
✅ "El que ríe último ríe mejor" [Disponible]
⏳ "Más vale prevenir que lamentar" [Disponible en 12 días]
🔒 "No por mucho madrugar..." [Bloqueado 25 días]
```

**Lógica:**
```javascript
function canUseMessage(messageId, lastUsedDate) {
    const daysSinceLastUse = (Date.now() - lastUsedDate) / (1000 * 60 * 60 * 24);
    const cooldown = COOLDOWN_CONFIG.global;

    if (daysSinceLastUse < cooldown) {
        const daysRemaining = Math.ceil(cooldown - daysSinceLastUse);
        return {
            allowed: false,
            reason: `Disponible en ${daysRemaining} días`,
            daysRemaining
        };
    }

    return { allowed: true };
}
```

---

### 4. Sugerencias Inteligentes al Crear Puzzle (Opción 7)

**Descripción:**
Al crear un nuevo puzzle, mostrar automáticamente mensajes recomendados (menos usados) y advertir sobre los sobre-utilizados.

**Vista en formulario de creación:**
```
┌─────────────────────────────────────────────────────┐
│ ➕ CREAR NUEVO PUZZLE                               │
├─────────────────────────────────────────────────────┤
│ Tamaño: [5x5 ▼]                                     │
├─────────────────────────────────────────────────────┤
│ 💡 MENSAJES SUGERIDOS (Menos usados):               │
│ • "La práctica hace al maestro" [1 uso] [Usar]     │
│ • "Roma no se construyó en un día" [Nunca] [Usar]  │
│ • "Dime con quién andas..." [2 usos] [Usar]        │
├─────────────────────────────────────────────────────┤
│ 🚫 EVITAR (Muy usados últimamente):                 │
│ • "El que madruga encuentra oro" [15 usos]         │
│ • "Más vale tarde que nunca" [12 usos]             │
├─────────────────────────────────────────────────────┤
│ Mensaje: [____________________________________]     │
│ 💬 Comentarios: [_____________________________]    │
└─────────────────────────────────────────────────────┘
```

**Funcionalidad "Usar":**
- Al hacer clic en [Usar], el mensaje se autocompleta en el campo
- El sistema verifica si tiene cooldown activo
- Muestra los comentarios admin existentes si los hay

---

### 5. Exportar/Importar Mensajes

**Formatos soportados:**
- **CSV** - Para Excel/Google Sheets
- **JSON** - Para backup/migración
- **TXT** - Lista simple de mensajes

**Botones en panel admin:**
```
[📥 Importar CSV] [📤 Exportar CSV] [💾 Backup JSON]
```

**Formato CSV:**
```csv
Mensaje,Tablero,Largo,Usos,Última_Fecha,Comentarios,Estado
"El saber no ocupa lugar",5x5,25,8,2025-12-01,"EN: Knowledge takes no space | Easy",Activo
"Más vale tarde que nunca",5x6,26,3,2025-11-28,"Medium difficulty",Activo
```

---

### Implementación Técnica

**Modificaciones en Supabase:**
```sql
-- Agregar columna de comentarios
ALTER TABLE crypto_puzzles
ADD COLUMN admin_comments TEXT;

-- Agregar columna de estado
ALTER TABLE crypto_puzzles
ADD COLUMN status VARCHAR(20) DEFAULT 'active';

-- Crear índice para búsquedas rápidas
CREATE INDEX idx_message ON crypto_puzzles(message);
CREATE INDEX idx_status ON crypto_puzzles(status);
```

**Nuevas funciones JavaScript:**
```javascript
// Obtener estadísticas de mensajes
async function getMessageStats() {
    const { data, error } = await supabase
        .from('crypto_puzzles')
        .select('message, board_size, admin_comments, created_at')
        .order('created_at', { ascending: false });

    // Agrupar y contar
    const stats = {};
    data.forEach(puzzle => {
        if (!stats[puzzle.message]) {
            stats[puzzle.message] = {
                count: 0,
                lastUsed: puzzle.created_at,
                boardSize: puzzle.board_size,
                comments: puzzle.admin_comments
            };
        }
        stats[puzzle.message].count++;
    });

    return stats;
}

// Obtener mensajes sugeridos
function getSuggestedMessages(allMessages, usageStats) {
    return allMessages
        .filter(msg => !usageStats[msg] || usageStats[msg].count < 3)
        .slice(0, 5);
}

// Obtener mensajes a evitar
function getOverusedMessages(usageStats) {
    return Object.entries(usageStats)
        .filter(([msg, stats]) => stats.count > 10)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5);
}
```

---

### Beneficios de esta mejora:

✅ **Mejor organización:** Comentarios ayudan a recordar contexto de cada mensaje
✅ **Evita repetición:** Sistema de cooldown y estadísticas previenen sobre-uso
✅ **Ahorro de tiempo:** Sugerencias inteligentes facilitan creación de puzzles
✅ **Calidad del contenido:** Variedad de mensajes mejora experiencia del usuario
✅ **Trazabilidad:** Historial completo de uso de cada mensaje

---

## 📊 Estadísticas de Uso General (Analytics)

**Prioridad:** Baja
**Complejidad:** Baja

- Panel de estadísticas por juego
- Tiempo promedio de partida
- Tasa de finalización
- Niveles más jugados

---

## 🏆 Sistema de Logros y Badges

**Prioridad:** Media
**Complejidad:** Media

- Logros desbloqueables
- Badges por completar desafíos
- Perfil de usuario
- Historial de progreso

---

## 🎨 Temas Personalizables

**Prioridad:** Baja
**Complejidad:** Baja

- Modo oscuro/claro
- Temas de color personalizados
- Preferencias guardadas por usuario

---

## 🔊 Efectos de Sonido

**Prioridad:** Baja
**Complejidad:** Baja

- Sonidos de movimiento de piezas
- Efectos de victoria/derrota
- Música de fondo opcional
- Control de volumen

---

## 📱 Progressive Web App (PWA)

**Prioridad:** Media
**Complejidad:** Media

- Instalable en móviles
- Funcionamiento offline
- Notificaciones push
- Caché de recursos

---

## 🎮 Más Juegos

**Prioridad:** Alta
**Complejidad:** Alta

Ideas para nuevos juegos:
- **Blitz Tactics** - Resolución rápida de tácticas
- **Endgame Trainer** - Entrenamiento de finales
- **Opening Explorer** - Aprendizaje de aperturas
- **Puzzle Rush** - Rompecabezas contra el tiempo

---

## 🤝 Modo Multijugador

**Prioridad:** Baja
**Complejidad:** Alta

- Jugar contra otros usuarios
- Salas de juego
- Chat en tiempo real
- Ranking global

---

## 📚 Sistema de Tutoriales Interactivos

**Prioridad:** Media
**Complejidad:** Media

- Tutoriales paso a paso
- Guías interactivas en cada juego
- Videos explicativos
- Tooltips contextuales

---

*Última actualización: 2025-12-09*
