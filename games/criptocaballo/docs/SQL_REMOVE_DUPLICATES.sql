-- Script para eliminar puzzles duplicados en CriptoCaballo
-- Problema: Error 406 "Cannot coerce the result to a single JSON object"
-- Causa: Múltiples registros con mismo puzzle_date + board_size

-- PASO 1: Ver los duplicados
SELECT puzzle_date, board_size, COUNT(*) as count
FROM puzzles
GROUP BY puzzle_date, board_size
HAVING COUNT(*) > 1
ORDER BY puzzle_date, board_size;

-- PASO 2: Eliminar duplicados, manteniendo solo el más reciente
-- (Esto elimina las versiones antiguas y mantiene la última versión guardada)
DELETE FROM puzzles
WHERE id IN (
    SELECT id
    FROM (
        SELECT
            id,
            ROW_NUMBER() OVER (
                PARTITION BY puzzle_date, board_size
                ORDER BY created_at DESC
            ) as rn
        FROM puzzles
    ) as ranked
    WHERE rn > 1
);

-- PASO 3: Crear constraint único para prevenir futuros duplicados
-- NOTA: Esto puede fallar si ya existe un constraint. En ese caso, ignora este paso.
ALTER TABLE puzzles
ADD CONSTRAINT unique_puzzle_date_size UNIQUE (puzzle_date, board_size);

-- Verificar que no queden duplicados
SELECT puzzle_date, board_size, COUNT(*) as count
FROM puzzles
GROUP BY puzzle_date, board_size
HAVING COUNT(*) > 1;
-- (Si este query no devuelve nada, significa que los duplicados fueron eliminados exitosamente)
