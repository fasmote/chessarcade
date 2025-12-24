-- ============================================
-- SISTEMA DE TAGS PARA CRIPTOCABALLO
-- ============================================
-- Permite categorizar puzzles con múltiples tags
-- Diseñado para ser expandible y con soporte futuro de i18n
-- ============================================

-- ============================================
-- PASO 1: Crear tabla de tags
-- ============================================
-- Los tags tienen un 'key' inmutable para referencias internas
-- y campos de display que pueden traducirse en el futuro

CREATE TABLE IF NOT EXISTS puzzle_tags (
    id SERIAL PRIMARY KEY,

    -- Key único e inmutable (usado internamente, no se traduce)
    -- Ej: 'matematicas', 'ajedrez', 'navidad'
    tag_key VARCHAR(50) UNIQUE NOT NULL,

    -- Nombre para mostrar (en español por defecto, traducible en futuro)
    display_name VARCHAR(100) NOT NULL,

    -- Emoji asociado al tag
    emoji VARCHAR(10),

    -- Color en formato hex para UI
    color VARCHAR(20) DEFAULT '#22d3ee',

    -- Descripción del tag (opcional, traducible en futuro)
    description TEXT,

    -- Contador de uso (se actualiza automáticamente)
    usage_count INTEGER DEFAULT 0,

    -- Orden para mostrar en UI (menor = primero)
    sort_order INTEGER DEFAULT 100,

    -- Si el tag está activo (permite ocultar sin eliminar)
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_puzzle_tags_key ON puzzle_tags(tag_key);
CREATE INDEX IF NOT EXISTS idx_puzzle_tags_active ON puzzle_tags(is_active);
CREATE INDEX IF NOT EXISTS idx_puzzle_tags_sort ON puzzle_tags(sort_order);

-- ============================================
-- PASO 2: Crear tabla de relaciones puzzle <-> tags
-- ============================================
-- Relación muchos a muchos

CREATE TABLE IF NOT EXISTS puzzle_tag_relations (
    id SERIAL PRIMARY KEY,
    puzzle_id UUID REFERENCES puzzles(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES puzzle_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Evitar duplicados
    UNIQUE(puzzle_id, tag_id)
);

-- Índices para joins eficientes
CREATE INDEX IF NOT EXISTS idx_ptr_puzzle ON puzzle_tag_relations(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_ptr_tag ON puzzle_tag_relations(tag_id);

-- ============================================
-- PASO 3: Insertar tags iniciales
-- ============================================
-- Categorías predefinidas con sus emojis y colores

INSERT INTO puzzle_tags (tag_key, display_name, emoji, color, description, sort_order) VALUES
    ('general', 'General', '🎯', '#22d3ee', 'Frases variadas sin tema específico', 1),
    ('matematicas', 'Matemáticas', '🔢', '#f59e0b', 'Números, operaciones, geometría', 2),
    ('ajedrez', 'Ajedrez', '♞', '#10b981', 'Frases sobre ajedrez y estrategia', 3),
    ('navidad', 'Navidad', '🎄', '#ef4444', 'Frases navideñas y de fiestas', 4),
    ('ciencia', 'Ciencia', '🔬', '#8b5cf6', 'Física, química, biología', 5),
    ('historia', 'Historia', '📜', '#6366f1', 'Frases históricas y personajes', 6),
    ('filosofia', 'Filosofía', '🤔', '#ec4899', 'Reflexiones y pensamientos profundos', 7),
    ('deportes', 'Deportes', '⚽', '#14b8a6', 'Frases deportivas', 8),
    ('arte', 'Arte/Cultura', '🎨', '#f97316', 'Arte, música, literatura', 9),
    ('refranes', 'Refranes', '💬', '#84cc16', 'Dichos populares y refranes', 10),
    ('humor', 'Humor', '😄', '#fbbf24', 'Frases graciosas y chistes', 11),
    ('motivacion', 'Motivación', '💪', '#06b6d4', 'Frases inspiradoras', 12),
    ('autores', 'Autores', '✍️', '#64748b', 'Filtrar por autor de la frase', 13)
ON CONFLICT (tag_key) DO NOTHING;

-- ============================================
-- PASO 4: Función para obtener tags de un puzzle
-- ============================================

CREATE OR REPLACE FUNCTION get_puzzle_tags(p_puzzle_id UUID)
RETURNS TABLE(
    tag_key VARCHAR,
    display_name VARCHAR,
    emoji VARCHAR,
    color VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pt.tag_key,
        pt.display_name,
        pt.emoji,
        pt.color
    FROM puzzle_tags pt
    JOIN puzzle_tag_relations ptr ON pt.id = ptr.tag_id
    WHERE ptr.puzzle_id = p_puzzle_id
    AND pt.is_active = true
    ORDER BY pt.sort_order;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PASO 5: Función para obtener puzzles por tag
-- ============================================

CREATE OR REPLACE FUNCTION get_puzzles_by_tag(p_tag_key VARCHAR)
RETURNS TABLE(
    puzzle_id UUID,
    puzzle_date DATE,
    board_size VARCHAR,
    message TEXT,
    title VARCHAR,
    author VARCHAR,
    daily_number INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.puzzle_date,
        p.board_size,
        p.message,
        p.title,
        p.author,
        p.daily_number
    FROM puzzles p
    JOIN puzzle_tag_relations ptr ON p.id = ptr.puzzle_id
    JOIN puzzle_tags pt ON ptr.tag_id = pt.id
    WHERE pt.tag_key = p_tag_key
    AND pt.is_active = true
    ORDER BY p.puzzle_date DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PASO 6: Trigger para actualizar usage_count
-- ============================================

CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE puzzle_tags
        SET usage_count = usage_count + 1,
            updated_at = NOW()
        WHERE id = NEW.tag_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE puzzle_tags
        SET usage_count = GREATEST(usage_count - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.tag_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_update_tag_usage ON puzzle_tag_relations;
CREATE TRIGGER trigger_update_tag_usage
AFTER INSERT OR DELETE ON puzzle_tag_relations
FOR EACH ROW
EXECUTE FUNCTION update_tag_usage_count();

-- ============================================
-- PASO 7: Vista para estadísticas de tags
-- ============================================

CREATE OR REPLACE VIEW tag_statistics AS
SELECT
    pt.id,
    pt.tag_key,
    pt.display_name,
    pt.emoji,
    pt.color,
    pt.usage_count,
    pt.is_active,
    pt.sort_order,
    COUNT(DISTINCT ptr.puzzle_id) as actual_puzzle_count
FROM puzzle_tags pt
LEFT JOIN puzzle_tag_relations ptr ON pt.id = ptr.tag_id
GROUP BY pt.id, pt.tag_key, pt.display_name, pt.emoji, pt.color,
         pt.usage_count, pt.is_active, pt.sort_order
ORDER BY pt.sort_order;

-- ============================================
-- NOTAS PARA FUTURO i18n
-- ============================================
-- Cuando se implemente internacionalización:
--
-- 1. Crear tabla puzzle_tags_translations:
--    CREATE TABLE puzzle_tags_translations (
--        tag_id INTEGER REFERENCES puzzle_tags(id),
--        language_code VARCHAR(5), -- 'es', 'en', 'pt', 'fr'
--        display_name VARCHAR(100),
--        description TEXT,
--        PRIMARY KEY (tag_id, language_code)
--    );
--
-- 2. Los mensajes de los puzzles NO se traducen
--    (son frases en español que el usuario descifra)
--
-- 3. Solo se traduce la UI: nombres de tags, botones, instrucciones
--
-- ============================================

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecutar para verificar que todo se creó correctamente:

-- SELECT * FROM puzzle_tags ORDER BY sort_order;
-- SELECT * FROM tag_statistics;
