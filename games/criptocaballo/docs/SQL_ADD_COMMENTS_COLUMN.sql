-- ==============================================================================
-- SQL SCRIPT: Agregar columna admin_comments a la tabla puzzles
-- ==============================================================================
-- Descripción: Este script agrega una columna opcional para comentarios de admin
--              en la tabla puzzles de CriptoCaballo.
--
-- Casos de uso:
--   - Traducciones: "EN: The early bird catches the worm"
--   - Pistas: "Hint: Start at square A1"
--   - Notas de dificultad: "Difficult - has many Q and X letters"
--   - Autor original: "Quote by Benjamin Franklin"
--   - Contexto cultural: "Common saying in Argentina"
--
-- INSTRUCCIONES:
-- 1. Ir a https://supabase.com/dashboard/project/[tu-proyecto-id]/editor
-- 2. Abrir SQL Editor
-- 3. Copiar y pegar este script completo
-- 4. Ejecutar (Run)
-- ==============================================================================

-- Agregar columna admin_comments a la tabla puzzles
ALTER TABLE puzzles
ADD COLUMN IF NOT EXISTS admin_comments TEXT;

-- Agregar comentario a la columna para documentación
COMMENT ON COLUMN puzzles.admin_comments IS 'Comentarios opcionales del admin: traducciones, pistas, notas, etc. Separar múltiples notas con "|".';

-- Crear índice para búsquedas rápidas en comentarios (opcional pero recomendado)
CREATE INDEX IF NOT EXISTS idx_puzzles_admin_comments
ON puzzles USING gin(to_tsvector('spanish', admin_comments));

-- Verificar que la columna fue creada exitosamente
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'puzzles'
AND column_name = 'admin_comments';

-- ==============================================================================
-- FIN DEL SCRIPT
-- ==============================================================================
-- NOTA: Después de ejecutar este script, la columna estará disponible
--       y podrás guardar comentarios desde el panel admin de CriptoCaballo.
-- ==============================================================================
