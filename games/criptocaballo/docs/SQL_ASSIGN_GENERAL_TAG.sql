-- ============================================
-- ASIGNAR TAG "GENERAL" A PUZZLES SIN TAGS
-- ============================================
-- Ejecutar este script para asignar el tag "general"
-- a todos los puzzles que no tienen ningún tag asignado
-- ============================================

-- Paso 1: Ver cuántos puzzles no tienen tags (preview)
SELECT
    p.id,
    p.puzzle_date,
    p.board_size,
    p.message,
    p.daily_number
FROM puzzles p
LEFT JOIN puzzle_tag_relations ptr ON p.id = ptr.puzzle_id
WHERE ptr.puzzle_id IS NULL
ORDER BY p.puzzle_date DESC;

-- Paso 2: Obtener el ID del tag "general"
-- SELECT id FROM puzzle_tags WHERE tag_key = 'general';
-- (Debería ser 1, pero verificamos)

-- Paso 3: Insertar relaciones para puzzles sin tags
-- EJECUTAR DESPUÉS DE VERIFICAR EL PASO 1

INSERT INTO puzzle_tag_relations (puzzle_id, tag_id)
SELECT
    p.id as puzzle_id,
    (SELECT id FROM puzzle_tags WHERE tag_key = 'general') as tag_id
FROM puzzles p
LEFT JOIN puzzle_tag_relations ptr ON p.id = ptr.puzzle_id
WHERE ptr.puzzle_id IS NULL;

-- Paso 4: Verificar resultado
SELECT
    COUNT(*) as puzzles_con_tag_general
FROM puzzle_tag_relations ptr
JOIN puzzle_tags pt ON ptr.tag_id = pt.id
WHERE pt.tag_key = 'general';

-- ============================================
-- NOTA: Este script es seguro de ejecutar múltiples veces
-- porque solo afecta puzzles que NO tienen tags
-- ============================================
