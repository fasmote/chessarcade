# 🗑️ Cómo Borrar Todos los Scores del Leaderboard

Esta guía te muestra cómo limpiar completamente el leaderboard de ChessArcade.

⚠️ **ADVERTENCIA:** Esta acción es **PERMANENTE** y no se puede deshacer. Todos los scores se perderán.

---

## 📊 Donde Están Almacenados los Scores

- **Base de datos:** Supabase (PostgreSQL)
- **Tabla:** `scores`
- **Ubicación:** Servidor remoto de Supabase

---

## 🗑️ Opción 1: Supabase Console (RECOMENDADO - Más Fácil)

Esta es la forma más directa y visual.

### Pasos:

1. **Ir a Supabase Dashboard:**
   ```
   https://supabase.com/dashboard
   ```

2. **Iniciar sesión** con tu cuenta

3. **Seleccionar tu proyecto** (ChessArcade)

4. **Ir a SQL Editor:**
   - En el menú izquierdo: **SQL Editor**
   - O click en el ícono `</>`

5. **Ejecutar query:**

   **Para borrar TODO:**
   ```sql
   DELETE FROM scores;
   ```

   **Para borrar solo un juego específico:**
   ```sql
   -- Borrar solo Master Sequence
   DELETE FROM scores WHERE game = 'master-sequence';

   -- Borrar solo Memory Matrix
   DELETE FROM scores WHERE game = 'memory-matrix';

   -- Borrar solo Knight Quest
   DELETE FROM scores WHERE game = 'knight-quest';

   -- Borrar solo Square Rush
   DELETE FROM scores WHERE game = 'square-rush';

   -- Borrar solo ChessInFive
   DELETE FROM scores WHERE game = 'chessinfive';
   ```

6. **Click en "Run"** (botón verde ▶️)

7. **Verificar que se borró todo:**
   ```sql
   SELECT COUNT(*) FROM scores;
   ```
   Debería devolver `0` si borraste todo.

---

## 🗑️ Opción 2: Script Node.js (Desde tu Computadora)

Esta opción te permite borrar desde la línea de comandos.

### Prerequisitos:

1. **Tener Node.js instalado** (ya lo tienes ✅)

2. **Obtener DATABASE_URL de Supabase:**
   - Ir a: Supabase Dashboard → **Project Settings** (⚙️)
   - Click en **Database** (en el menú izquierdo)
   - Copiar el **Connection String** (formato URI)
   - Ejemplo: `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres`

3. **Crear archivo `.env.local` en la raíz del proyecto:**
   ```bash
   # Copia el ejemplo
   cp .env.local.example .env.local

   # Edita y agrega tu DATABASE_URL
   nano .env.local
   ```

   Contenido del `.env.local`:
   ```
   DATABASE_URL=postgresql://postgres:[TU-PASSWORD]@db.[TU-PROJECT-REF].supabase.co:5432/postgres
   ```

### Ejecutar:

```bash
# Opción A: Usando npm script
npm run clear-leaderboard

# Opción B: Directamente con node
node scripts/clear-leaderboard.js
```

### ¿Qué Hace el Script?

1. Conecta a Supabase
2. Muestra cuántos scores hay
3. Muestra desglose por juego
4. Te pide confirmación (debes escribir "yes")
5. Borra todos los scores
6. Muestra confirmación final

### Ejemplo de Salida:

```
🎮 ChessArcade - Clear Leaderboard Script

📊 Scores actuales en la base de datos: 1234

📋 Desglose por juego:
   - master-sequence: 456 scores
   - memory-matrix: 345 scores
   - knight-quest: 234 scores
   - square-rush: 123 scores
   - chessinfive: 76 scores

⚠️  ADVERTENCIA: Esta acción NO se puede deshacer.

¿Estás seguro de que querés borrar TODOS los scores? (escribe "yes" para confirmar): yes

🗑️  Borrando scores...
✅ 1234 scores borrados exitosamente.
📊 Scores restantes: 0

✅ Leaderboard limpiado completamente.
```

---

## 🗑️ Opción 3: API REST (Avanzado)

Si querés crear un endpoint admin permanente, podemos agregar:

```javascript
// api/scores/admin/clear.js
export default async function handler(req, res) {
  // Validar token de admin
  const token = req.headers.authorization;
  if (token !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Borrar scores
  const result = await sql`DELETE FROM scores`;

  res.json({
    success: true,
    deleted: result.count
  });
}
```

**Uso:**
```bash
curl -X DELETE https://chessarcade.vercel.app/api/scores/admin/clear \
  -H "Authorization: Bearer TU_TOKEN_SECRETO"
```

Esta opción es más compleja y la recomendaría solo si necesitas borrar scores frecuentemente.

---

## 🔍 Queries Útiles (Supabase SQL Editor)

### Ver todos los scores:
```sql
SELECT * FROM scores ORDER BY created_at DESC LIMIT 100;
```

### Contar scores por juego:
```sql
SELECT game, COUNT(*) as total
FROM scores
GROUP BY game
ORDER BY total DESC;
```

### Ver los últimos 10 scores:
```sql
SELECT * FROM scores
ORDER BY created_at DESC
LIMIT 10;
```

### Borrar scores de prueba (ejemplo):
```sql
-- Borrar scores de un jugador específico
DELETE FROM scores WHERE player_name = 'TEST';

-- Borrar scores creados hoy
DELETE FROM scores WHERE created_at >= CURRENT_DATE;

-- Borrar scores con menos de 100 puntos
DELETE FROM scores WHERE score < 100;
```

---

## ✅ Verificación Post-Borrado

Después de borrar, verifica que el leaderboard esté vacío:

1. **Ir a tu sitio:** https://chessarcade.com.ar

2. **Abrir cualquier juego** (ej: Master Sequence)

3. **Click en "LEADERBOARD"**

4. Debería mostrar:
   ```
   No scores yet. Be the first to play!
   ```

---

## 🔄 Restaurar Datos (Si Hiciste Backup)

Si hiciste un backup antes de borrar:

```sql
-- Restaurar desde archivo CSV
COPY scores FROM '/path/to/backup.csv'
WITH (FORMAT CSV, HEADER);

-- O insertar manualmente
INSERT INTO scores (game, player_name, score, created_at)
VALUES
  ('master-sequence', 'PLAYER1', 1000, NOW()),
  ('memory-matrix', 'PLAYER2', 2000, NOW());
```

---

## 📝 Notas Importantes

- ✅ **Hacer backup antes** si tenés datos importantes
- ✅ **Probar en development primero** si no estás seguro
- ✅ **Verificar que estás conectado al proyecto correcto** en Supabase
- ⚠️ **No hay "undo"** - los datos se borran permanentemente
- 🔒 **El archivo `.env.local` NO debe subirse a Git** (ya está en .gitignore)

---

## 🆘 Troubleshooting

### Error: "DATABASE_URL not set"
**Solución:** Crear archivo `.env.local` con tu connection string de Supabase

### Error: "permission denied for table scores"
**Solución:** Verificar que el usuario de la conexión tenga permisos DELETE

### Error: "Connection timeout"
**Solución:**
- Verificar que el connection string es correcto
- Verificar que Supabase está accesible (no pausado por inactividad)

---

**Última actualización:** 2025-11-15
