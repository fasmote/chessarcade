# 🚀 Futuras Mejoras - CriptoCaballo

**Última actualización:** 25 de diciembre de 2025

Este documento registra las mejoras planificadas y propuestas para el juego CriptoCaballo.

---

## 📋 Índice de Mejoras Propuestas

1. [Sistema de Categorías/Tags para Puzzles](#mejora-1-sistema-de-categoríastags-para-puzzles) - ✅ **IMPLEMENTADO**
2. [Nube de Tags para Mobile/Portrait](#mejora-2-nube-de-tags-para-mobileportrait) - 📋 PENDIENTE

---

## Mejora #1: Sistema de Categorías/Tags para Puzzles

### 📝 Descripción
Implementar un sistema que permita categorizar los puzzles por tema (matemáticas, ajedrez, navidad, etc.) y que los usuarios puedan filtrar/buscar puzzles por estas categorías.

### 🎯 Objetivo
- Mejorar la organización de puzzles
- Permitir a usuarios encontrar puzzles de temas que les interesen
- Facilitar la creación de eventos temáticos (ej: puzzles navideños en diciembre)

### 💡 Propuestas de Implementación

---

#### Opción A: Categoría Única (Más Simple)

**Base de datos (Supabase):**
```sql
-- Agregar columna category a puzzles
ALTER TABLE puzzles
ADD COLUMN category VARCHAR(50) DEFAULT 'general';

-- Crear tabla de categorías predefinidas
CREATE TABLE puzzle_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    emoji VARCHAR(10),
    color VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insertar categorías iniciales
INSERT INTO puzzle_categories (name, emoji, color) VALUES
    ('general', '🎯', '#22d3ee'),
    ('matematicas', '🔢', '#f59e0b'),
    ('ajedrez', '♞', '#10b981'),
    ('navidad', '🎄', '#ef4444'),
    ('ciencia', '🔬', '#8b5cf6'),
    ('historia', '📜', '#6366f1'),
    ('filosofia', '🤔', '#ec4899'),
    ('deportes', '⚽', '#14b8a6'),
    ('arte', '🎨', '#f97316'),
    ('refranes', '💬', '#84cc16'),
    ('humor', '😄', '#fbbf24'),
    ('motivacion', '💪', '#06b6d4');
```

**Admin (admin.html):**
```html
<!-- Selector de categoría al guardar -->
<div class="mb-4">
    <label class="text-cyan-400 text-sm">Categoría:</label>
    <select id="puzzleCategory" class="w-full bg-slate-800 text-white p-2 rounded">
        <option value="general">🎯 General</option>
        <option value="matematicas">🔢 Matemáticas</option>
        <option value="ajedrez">♞ Ajedrez</option>
        <option value="navidad">🎄 Navidad</option>
        <option value="ciencia">🔬 Ciencia</option>
        <option value="historia">📜 Historia</option>
        <option value="filosofia">🤔 Filosofía</option>
        <option value="deportes">⚽ Deportes</option>
        <option value="arte">🎨 Arte/Cultura</option>
        <option value="refranes">💬 Refranes</option>
        <option value="humor">😄 Humor</option>
        <option value="motivacion">💪 Motivación</option>
    </select>
</div>
```

**Usuario (index.html) - Filtro simple:**
```html
<!-- Botones de filtro por categoría -->
<div class="flex flex-wrap gap-2 justify-center mb-4">
    <button onclick="filterByCategory('all')" class="category-btn active">
        Todos
    </button>
    <button onclick="filterByCategory('matematicas')" class="category-btn">
        🔢 Matemáticas
    </button>
    <button onclick="filterByCategory('ajedrez')" class="category-btn">
        ♞ Ajedrez
    </button>
    <!-- ... más categorías ... -->
</div>
```

**Pros:**
- ✅ Implementación simple
- ✅ UI clara y fácil de usar
- ✅ Fácil de mantener

**Contras:**
- ❌ Un puzzle solo puede tener una categoría
- ❌ Menos flexible para puzzles que podrían encajar en múltiples temas

---

#### Opción B: Sistema de Tags Múltiples (Más Flexible)

**Base de datos (Supabase):**
```sql
-- Tabla de tags
CREATE TABLE puzzle_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    emoji VARCHAR(10),
    color VARCHAR(20),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de relación puzzles <-> tags (muchos a muchos)
CREATE TABLE puzzle_tag_relations (
    puzzle_id UUID REFERENCES puzzles(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES puzzle_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (puzzle_id, tag_id)
);

-- Función para obtener tags de un puzzle
CREATE OR REPLACE FUNCTION get_puzzle_tags(p_id UUID)
RETURNS TABLE(tag_name VARCHAR, emoji VARCHAR, color VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT pt.name, pt.emoji, pt.color
    FROM puzzle_tags pt
    JOIN puzzle_tag_relations ptr ON pt.id = ptr.tag_id
    WHERE ptr.puzzle_id = p_id;
END;
$$ LANGUAGE plpgsql;
```

**Admin (admin.html) - Selector de tags múltiples:**
```html
<!-- Selector de tags con chips -->
<div class="mb-4">
    <label class="text-cyan-400 text-sm">Tags (selecciona varios):</label>
    <div id="tagSelector" class="flex flex-wrap gap-2 mt-2">
        <!-- Los tags se cargan dinámicamente -->
    </div>
    <input type="text" id="newTagInput" placeholder="Agregar nuevo tag..."
           class="mt-2 bg-slate-800 text-white p-2 rounded text-sm">
</div>
```

```javascript
// Tags seleccionados
let selectedTags = [];

function toggleTag(tagName) {
    if (selectedTags.includes(tagName)) {
        selectedTags = selectedTags.filter(t => t !== tagName);
    } else {
        selectedTags.push(tagName);
    }
    renderTagSelector();
}

function renderTagSelector() {
    const container = document.getElementById('tagSelector');
    container.innerHTML = allTags.map(tag => `
        <button onclick="toggleTag('${tag.name}')"
                class="tag-chip ${selectedTags.includes(tag.name) ? 'active' : ''}">
            ${tag.emoji} ${tag.name}
        </button>
    `).join('');
}
```

**Usuario (index.html) - Nube de Tags:**
```html
<!-- Nube de tags interactiva -->
<div class="tag-cloud mb-6">
    <h4 class="text-cyan-400 text-sm mb-2">Explorar por tema:</h4>
    <div id="tagCloud" class="flex flex-wrap gap-2 justify-center">
        <!-- Tags se cargan dinámicamente, tamaño según popularidad -->
    </div>
</div>
```

```javascript
async function loadTagCloud() {
    const { data: tags } = await supabaseClient
        .from('puzzle_tags')
        .select('*')
        .order('usage_count', { ascending: false });

    const maxCount = Math.max(...tags.map(t => t.usage_count));

    const cloud = document.getElementById('tagCloud');
    cloud.innerHTML = tags.map(tag => {
        // Tamaño proporcional a popularidad
        const size = 0.8 + (tag.usage_count / maxCount) * 0.6;
        return `
            <button onclick="filterByTag('${tag.name}')"
                    class="tag-cloud-item"
                    style="font-size: ${size}rem; color: ${tag.color}">
                ${tag.emoji} ${tag.name}
            </button>
        `;
    }).join('');
}
```

**Pros:**
- ✅ Muy flexible - un puzzle puede tener múltiples tags
- ✅ Nube de tags visualmente atractiva
- ✅ Tags pueden crecer orgánicamente
- ✅ Mejor para búsquedas complejas

**Contras:**
- ❌ Más complejo de implementar
- ❌ Requiere más tablas en la base de datos
- ❌ UI más elaborada

---

#### Opción C: Híbrido (Categoría Principal + Tags)

**Concepto:**
- Cada puzzle tiene UNA categoría principal obligatoria
- Adicionalmente puede tener VARIOS tags opcionales

```sql
ALTER TABLE puzzles
ADD COLUMN category VARCHAR(50) DEFAULT 'general',
ADD COLUMN tags TEXT[] DEFAULT '{}';  -- Array de tags
```

**Ejemplo:**
```
Puzzle: "El caballo salta en L"
- Categoría principal: ajedrez
- Tags: [principiantes, movimientos, tutorial]
```

**Pros:**
- ✅ Balance entre simplicidad y flexibilidad
- ✅ Categoría garantiza organización básica
- ✅ Tags permiten búsquedas más específicas

---

### 🎨 Diseño UI/UX Propuesto

#### En Admin (al guardar puzzle):
```
┌─────────────────────────────────────┐
│  📂 Categoría: [Matemáticas    ▼]  │
│                                     │
│  🏷️ Tags:                          │
│  [🎄 navidad] [🔢 números] [+ Add]  │
│                                     │
│  💾 [Guardar Puzzle]               │
└─────────────────────────────────────┘
```

#### En Usuario (filtrar puzzles):
```
┌─────────────────────────────────────────────┐
│         🔍 Explorar Puzzles por Tema        │
│                                             │
│   🎯 Todos   🔢 Matemáticas   ♞ Ajedrez    │
│   🎄 Navidad   🔬 Ciencia   📜 Historia    │
│   💬 Refranes   😄 Humor   💪 Motivación   │
│                                             │
│   ─────── o buscar por tag ───────         │
│   [ 🔍 Buscar tag...              ]        │
│                                             │
│   Tags populares:                           │
│   principiantes • difícil • corto • largo  │
└─────────────────────────────────────────────┘
```

---

### 📊 Categorías Sugeridas

| Categoría | Emoji | Color | Descripción |
|-----------|-------|-------|-------------|
| General | 🎯 | cyan | Frases variadas sin tema específico |
| Matemáticas | 🔢 | amber | Números, operaciones, geometría |
| Ajedrez | ♞ | green | Frases sobre ajedrez y estrategia |
| Navidad | 🎄 | red | Frases navideñas y de fiestas |
| Ciencia | 🔬 | purple | Física, química, biología |
| Historia | 📜 | indigo | Frases históricas y personajes |
| Filosofía | 🤔 | pink | Reflexiones y pensamientos profundos |
| Deportes | ⚽ | teal | Frases deportivas |
| Arte/Cultura | 🎨 | orange | Arte, música, literatura |
| Refranes | 💬 | lime | Dichos populares y refranes |
| Humor | 😄 | yellow | Frases graciosas y chistes |
| Motivación | 💪 | cyan | Frases inspiradoras |
| Autores | ✍️ | slate | Filtrar por autor de la frase |

> **Nota:** El sistema es expandible - se pueden agregar nuevas categorías según necesidad.

---

### 🔄 Plan de Implementación

#### Fase 1: Base de datos
1. Agregar columna `category` a tabla `puzzles`
2. Crear tabla `puzzle_categories` con categorías predefinidas
3. Migrar puzzles existentes a categoría "general"

#### Fase 2: Admin
1. Agregar selector de categoría en formulario de guardado
2. Guardar categoría junto con el puzzle
3. Mostrar categoría en lista de puzzles guardados

#### Fase 3: Usuario
1. Agregar filtros por categoría en UI
2. Mostrar categoría/emoji en cada puzzle
3. Implementar búsqueda por categoría

#### Fase 4: Mejoras (opcional)
1. Sistema de tags múltiples
2. Nube de tags
3. Estadísticas por categoría

---

### ✅ Estado
**APROBADO** - 24 de diciembre de 2025

### 🗳️ Decisión
Se elige **Opción B (Sistema de Tags Múltiples)** por su flexibilidad y capacidad de expansión. Permite:
- Asignar múltiples tags a cada puzzle
- Nube de tags interactiva para usuarios
- Agregar nuevas categorías fácilmente (como "Autores")
- Búsquedas más precisas combinando tags

---

---

## Mejora #2: Nube de Tags para Mobile/Portrait

### 📝 Descripción
Actualmente la nube de tags flotante solo se muestra en desktop (≥1024px). En mobile/portrait no hay espacio lateral para mostrarla. Se necesita una solución alternativa para acceder a la navegación por categorías en dispositivos móviles.

### 🎯 Objetivo
- Permitir a usuarios mobile filtrar puzzles por categoría
- Mantener la experiencia de juego limpia sin ocupar espacio del tablero
- Acceso rápido y fácil a las categorías

### 💡 Propuestas de Implementación

#### Opción A: Menú Hamburguesa de Tags
```
┌──────────────────────────────┐
│  🏷️ (botón flotante)         │
│                              │
│      [TABLERO]               │
│                              │
└──────────────────────────────┘

Al tocar 🏷️:
┌──────────────────────────────┐
│  ╔══════════════════════╗    │
│  ║ 🏷️ CATEGORÍAS       ✕║    │
│  ║                      ║    │
│  ║ 🎯 General (102)     ║    │
│  ║ 🎄 Navidad (12)      ║    │
│  ║ 🎨 Arte (6)          ║    │
│  ║ ♞ Ajedrez (2)        ║    │
│  ║ ...                  ║    │
│  ╚══════════════════════╝    │
└──────────────────────────────┘
```

**Pros:**
- ✅ No ocupa espacio permanente
- ✅ Familiar para usuarios mobile
- ✅ Puede incluir todas las categorías

**Contras:**
- ❌ Requiere tap adicional para ver categorías
- ❌ No tan visual como la nube desktop

#### Opción B: Drawer/Panel Deslizable
Panel que se desliza desde la izquierda al swipe o tocar botón.

#### Opción C: Tags Colapsables
Fila de tags horizontales colapsable arriba del tablero:
```
[🏷️ ▼] → expande a → [🎯] [🎄] [🎨] [♞] [...]
```

### 📊 Recomendación
**Opción A (Menú Hamburguesa)** parece la mejor opción porque:
- Patrón familiar en mobile
- No interfiere con el juego
- Fácil de implementar

### ✅ Estado
**PENDIENTE** - Prioridad media

---

## 📝 Notas

- Las mejoras se priorizan según impacto en UX y complejidad de implementación
- Cada mejora debe documentarse con su análisis de opciones
- Al implementar, mover a `ERRORES_SOLUCIONADOS.md` con detalles de la solución elegida

---

## 🔗 Referencias

- **Bugs pendientes:** `BUGS_PENDIENTES.md`
- **Errores solucionados:** `docs/ERRORES_SOLUCIONADOS.md`
- **Requerimientos funcionales:** `docs/CRIPTOCABALLO_REQUERIMIENTOS_FUNCIONALES.md`
