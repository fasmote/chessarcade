-- ============================================
-- ACTUALIZACIÓN DE SCHEMA - CriptoCaballo
-- ============================================
-- Agregar columnas 'title' y 'author' a la tabla puzzles
-- Ejecutar en Supabase SQL Editor

-- Agregar columna title (nombre/título del puzzle)
ALTER TABLE puzzles
ADD COLUMN IF NOT EXISTS title TEXT;

-- Agregar columna author (autor de la frase)
ALTER TABLE puzzles
ADD COLUMN IF NOT EXISTS author TEXT;

-- Agregar comentarios para documentación
COMMENT ON COLUMN puzzles.title IS 'Nombre o título del puzzle (ej: "El Despertar")';
COMMENT ON COLUMN puzzles.author IS 'Autor de la frase del puzzle (ej: "Albert Einstein")';

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'puzzles'
AND column_name IN ('title', 'author');
