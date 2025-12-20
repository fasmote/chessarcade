-- ============================================
-- AGREGAR CAMPO daily_number A LA TABLA puzzles
-- ============================================
-- Este campo guarda el número secuencial del reto diario
-- que se muestra al usuario (ej: #1, #25, #354)
-- El formato interno (20251220-8x8) se conserva en puzzle_date + board_size
-- ============================================

-- Paso 1: Agregar la columna
ALTER TABLE puzzles
ADD COLUMN IF NOT EXISTS daily_number INTEGER;

-- Paso 2: Crear índice único para evitar duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_puzzles_daily_number
ON puzzles(daily_number)
WHERE daily_number IS NOT NULL;

-- Paso 3: Asignar números a los puzzles existentes (ordenados por fecha)
-- EJECUTAR MANUALMENTE después de agregar la columna:
/*
WITH numbered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY puzzle_date, board_size) as rn
    FROM puzzles
    WHERE puzzle_date IS NOT NULL
)
UPDATE puzzles
SET daily_number = numbered.rn
FROM numbered
WHERE puzzles.id = numbered.id;
*/

-- Paso 4: Para nuevos puzzles, asignar el siguiente número disponible
-- Esto se puede hacer en el código al guardar, o con un trigger:
/*
CREATE OR REPLACE FUNCTION set_daily_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.daily_number IS NULL THEN
        SELECT COALESCE(MAX(daily_number), 0) + 1 INTO NEW.daily_number FROM puzzles;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_daily_number
BEFORE INSERT ON puzzles
FOR EACH ROW
EXECUTE FUNCTION set_daily_number();
*/
