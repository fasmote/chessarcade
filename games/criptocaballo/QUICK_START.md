# 🚀 CriptoCaballo - Guía Rápida

## ¿Qué tenemos ahora?

### ✅ Archivos Creados

1. **`admin.html`** - Panel de administración (solo tú)
   - Genera mensajes con IA
   - Configura tableros
   - Previsualiza puzzles
   - Guarda en Supabase

2. **`index.html`** - Juego público (jugadores)
   - Panel admin oculto
   - Carga puzzle del día desde Supabase
   - Interfaz limpia solo para jugar

3. **`README_SETUP.md`** - Guía completa de configuración
   - Estructura de BD
   - Variables de entorno
   - Deployment en Vercel

## 🎯 Próximos Pasos

### 1. Configurar Supabase (10 min)

```bash
# 1. Ir a https://supabase.com y crear proyecto
# 2. Copiar URL y Anon Key
# 3. Ejecutar SQL de README_SETUP.md para crear tabla
```

### 2. Actualizar Credenciales (2 min)

Editar en **ambos archivos** (`admin.html` y `index.html`):

```javascript
// Buscar estas líneas (~línea 573):
const SUPABASE_URL = "TU_SUPABASE_URL";
const SUPABASE_KEY = "TU_SUPABASE_ANON_KEY";

// Reemplazar por tus credenciales:
const SUPABASE_URL = "https://xxxxx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

### 3. Probar Localmente (5 min)

```bash
# Abrir admin.html en navegador
# 1. Generar un mensaje
# 2. Configurar tablero
# 3. Guardar en Supabase
# 4. Verificar en Supabase Dashboard que se guardó

# Abrir index.html en navegador
# 1. Verificar que carga el puzzle guardado
# 2. Probar resolver el puzzle
```

### 4. Subir a Vercel (5 min)

```bash
# 1. Commit y push a GitHub
git add games/criptocaballo/
git commit -m "feat: Add CriptoCaballo with admin/player separation"
git push

# 2. Vercel despliega automáticamente

# 3. Acceder a:
# - Admin: https://chessarcade.vercel.app/games/criptocaballo/admin.html
# - Juego: https://chessarcade.vercel.app/games/criptocaballo/
```

## 🎮 Uso Diario

### Como Admin

1. Ir a `admin.html`
2. Generar 6 puzzles (uno por cada tamaño de tablero)
3. Guardar cada uno con la fecha correspondiente
4. ¡Listo! Los jugadores verán el puzzle del día

### Programar un Mes

```javascript
// En admin.html, por cada día del mes:
// Fecha: 2025-12-01, Tamaño: 3x4 → Generar y guardar
// Fecha: 2025-12-01, Tamaño: 4x5 → Generar y guardar
// Fecha: 2025-12-01, Tamaño: 5x5 → Generar y guardar
// ... etc

// Total: 30 días × 6 tamaños = 180 puzzles/mes
```

## ⚙️ Configuración de Supabase

### SQL Mínimo Necesario

```sql
CREATE TABLE puzzles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    puzzle_date DATE NOT NULL UNIQUE,
    board_size TEXT NOT NULL,
    message TEXT NOT NULL,
    solution_path JSONB NOT NULL,
    filler_type TEXT NOT NULL,
    difficulty TEXT,
    hints JSONB,
    start_position JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_puzzle_date ON puzzles(puzzle_date);

ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura pública"
ON puzzles FOR SELECT
USING (true);

CREATE POLICY "Permitir escritura"
ON puzzles FOR INSERT
WITH CHECK (true);
```

## 🔐 Seguridad

### ¿Cómo proteger admin.html?

**Opción 1: URL secreta** (Actual)
- No enlazar admin.html desde ningún lado
- Solo tú conoces la URL
- Simple pero no 100% seguro

**Opción 2: Password simple** (Próximo paso)
- Agregar prompt de password al abrir admin.html
- 10 líneas de código

**Opción 3: Auth de Supabase** (Opcional)
- Login con email/password
- Más complejo pero más seguro

## 📊 Estructura de Datos

### Ejemplo de Puzzle Guardado

```json
{
  "puzzle_date": "2025-12-25",
  "board_size": "5x5",
  "message": "FELIZ NAVIDAD",
  "solution_path": [...],
  "filler_type": "random",
  "difficulty": "medium",
  "hints": {
    "showStart": true,
    "showEnd": false,
    "revealedLetters": 1
  }
}
```

## ❓ FAQ

**Q: ¿Puedo tener varios puzzles para la misma fecha?**
A: Sí, uno por tamaño de tablero. El jugador elige qué tamaño jugar.

**Q: ¿Cómo edito un puzzle ya guardado?**
A: Ve a Supabase Dashboard > Table Editor > puzzles > Editar fila

**Q: ¿El leaderboard está activo?**
A: No, por ahora sin leaderboard como pediste.

**Q: ¿Cómo veo qué puzzles tengo programados?**
A: Supabase Dashboard > Table Editor > puzzles > Ver todas las filas

---

**¿Listo para empezar?**

1. ✅ Crear proyecto Supabase
2. ✅ Ejecutar SQL
3. ✅ Actualizar credenciales
4. ✅ Probar localmente
5. ✅ Subir a Vercel

**Tiempo total:** ~30 minutos

¿Dudas? Revisa `README_SETUP.md` para más detalles.
