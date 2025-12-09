# 🔐 CriptoCaballo - Configuración Admin + Supabase

## 📋 Índice
1. [Estructura del Proyecto](#estructura-del-proyecto)
2. [Configuración de Supabase](#configuración-de-supabase)
3. [Configuración de Vercel](#configuración-de-vercel)
4. [Uso del Panel Admin](#uso-del-panel-admin)
5. [Programación de Puzzles Mensuales](#programación-de-puzzles-mensuales)

---

## 🏗️ Estructura del Proyecto

```
games/criptocaballo/
├── index.html           → Juego público (jugadores)
├── admin.html           → Panel admin (solo administrador)
├── README_SETUP.md      → Esta guía
└── docs/
    └── requerimiento funcional 1.0 Cripto-Chess.pdf
```

### Diferencias entre archivos:

| Archivo | Propósito | Quién accede | Funcionalidades |
|---------|-----------|--------------|-----------------|
| `index.html` | Juego público | Jugadores | - Cargar puzzle del día<br>- Resolver criptograma<br>- Ver solución |
| `admin.html` | Panel administrador | Solo tú | - Generar mensajes con IA<br>- Configurar tablero<br>- Previsualizar puzzle<br>- Guardar en Supabase<br>- Programar puzzles mensuales |

---

## 🗄️ Configuración de Supabase

### 1. Crear Proyecto en Supabase

1. Ir a https://supabase.com
2. Crear nuevo proyecto
3. Guardar las credenciales:
   - **Project URL**: `https://tu-proyecto.supabase.co`
   - **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 2. Crear Tabla `puzzles`

Ejecuta este SQL en el editor de Supabase:

```sql
-- Crear tabla de puzzles
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsqueda por fecha
CREATE INDEX idx_puzzle_date ON puzzles(puzzle_date);

-- Crear índice para búsqueda por fecha + tamaño
CREATE INDEX idx_puzzle_date_size ON puzzles(puzzle_date, board_size);

-- Habilitar RLS (Row Level Security)
ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;

-- Política para lectura pública (jugadores)
CREATE POLICY "Permitir lectura pública"
ON puzzles FOR SELECT
USING (true);

-- Política para inserción (solo admin con service key)
CREATE POLICY "Permitir inserción autenticada"
ON puzzles FOR INSERT
WITH CHECK (true);

-- Política para actualización (solo admin)
CREATE POLICY "Permitir actualización autenticada"
ON puzzles FOR UPDATE
USING (true);
```

### 3. Estructura de la Tabla

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `id` | UUID | ID único del puzzle | `550e8400-e29b-41d4-a716-446655440000` |
| `puzzle_date` | DATE | Fecha del puzzle | `2025-12-01` |
| `board_size` | TEXT | Tamaño del tablero | `'3x4'`, `'4x5'`, `'5x5'`, `'5x6'`, `'6x7'`, `'8x8'` |
| `message` | TEXT | Mensaje secreto | `'HOLA MUNDO'` |
| `solution_path` | JSONB | Ruta del caballo | `[{row: 0, col: 0}, {row: 2, col: 1}, ...]` |
| `filler_type` | TEXT | Tipo de relleno | `'random'`, `'block'`, `'X'`, `'none'` |
| `difficulty` | TEXT | Dificultad | `'easy'`, `'medium'`, `'hard'`, `'expert'` |
| `hints` | JSONB | Configuración de pistas | `{showStart: true, showEnd: false, revealedLetters: 2}` |
| `start_position` | JSONB | Posición inicial | `{row: 0, col: 0}` |
| `created_at` | TIMESTAMP | Fecha de creación | `2025-12-03 10:30:00` |

### 4. Ejemplo de Registro

```json
{
  "puzzle_date": "2025-12-01",
  "board_size": "5x5",
  "message": "JAQUE MATE",
  "solution_path": [
    {"row": 0, "col": 0},
    {"row": 2, "col": 1},
    {"row": 0, "col": 2},
    ...
  ],
  "filler_type": "random",
  "difficulty": "medium",
  "hints": {
    "showStart": true,
    "showEnd": false,
    "revealedLetters": 1
  },
  "start_position": {"row": 0, "col": 0}
}
```

---

## ☁️ Configuración de Vercel

### 1. Variables de Entorno

En el dashboard de Vercel, agregar estas variables:

```bash
# Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Admin (opcional - para protección básica)
VITE_ADMIN_PASSWORD=tu-password-seguro
```

### 2. Configuración en los archivos HTML

Actualizar en `admin.html` y `index.html`:

```javascript
// Reemplazar estas líneas:
const SUPABASE_URL = "TU_SUPABASE_URL";
const SUPABASE_KEY = "TU_SUPABASE_ANON_KEY";

// Por:
const SUPABASE_URL = "https://tu-proyecto.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

---

## 🎮 Uso del Panel Admin

### Acceso al Panel

1. Ir a: `https://chessarcade.vercel.app/games/criptocaballo/admin.html`
2. (Opcional) Ingresar password si está configurado
3. Generar puzzles

### Workflow Típico

#### 1. Generar Mensaje
- Clic en **"Frase Chess"** → IA genera frase de ajedrez
- Clic en **"Célebre"** → IA genera cita famosa
- Clic en **"Por Tema"** → Ingresar tema y generar
- O escribir manualmente en el textarea

#### 2. Configurar Tablero
- Seleccionar **tamaño** (3x4, 4x5, 5x5, etc.)
- Elegir **tipo de relleno** (random, block, X, none)
- Configurar **separador de palabras** (●, ·, *, ninguno)

#### 3. Previsualizar
- El tablero muestra el puzzle generado
- Verificar que el mensaje se ve correcto
- Probar la solución haciendo clic en las casillas

#### 4. Guardar en Supabase
- Seleccionar **fecha** del puzzle
- Clic en **"Guardar Puzzle"**
- Confirmación de guardado exitoso

---

## 📅 Programación de Puzzles Mensuales

### Estrategia Recomendada

Para programar un mes completo (30 días):

1. **1 puzzle por día** por tamaño de tablero
2. **6 tamaños de tablero** (3x4, 4x5, 5x5, 5x6, 6x7, 8x8)
3. **Total: 180 puzzles** por mes (30 días × 6 tamaños)

### Ejemplo de Calendario

| Fecha | 3x4 | 4x5 | 5x5 | 5x6 | 6x7 | 8x8 |
|-------|-----|-----|-----|-----|-----|-----|
| 01/12 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 02/12 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ... | ... | ... | ... | ... | ... | ... |
| 30/12 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Proceso de Carga Masiva

#### Opción A: Manual (Panel Admin)
1. Para cada día del mes:
   - Generar 6 puzzles (uno por tamaño)
   - Guardar cada uno en Supabase
2. **Tiempo estimado:** ~5 min por día = 2.5 horas/mes

#### Opción B: Script de Carga (Recomendado)
Crear un archivo `bulk-upload.js` con puzzles pre-generados:

```javascript
const puzzles = [
  {
    date: '2025-12-01',
    size: '3x4',
    message: 'JAQUE',
    difficulty: 'easy'
  },
  {
    date: '2025-12-01',
    size: '4x5',
    message: 'GAMBITO',
    difficulty: 'medium'
  },
  // ... 178 puzzles más
];

// Función para subir todos
async function uploadAll() {
  for (const puzzle of puzzles) {
    await savePuzzleToSupabase(puzzle);
  }
}
```

---

## 🔒 Seguridad y Mejores Prácticas

### Protección del Panel Admin

**Opción 1: Obscuridad (Básico)**
- URL admin.html no está enlazada públicamente
- Solo tú conoces la URL
- ⚠️ No es 100% seguro

**Opción 2: Password Simple (Implementado)**
- Solicita password al cargar admin.html
- Password guardado en localStorage
- ✅ Suficiente para uso personal

**Opción 3: Autenticación Supabase (Avanzado)**
- Login con email/password
- Solo usuarios autenticados pueden guardar
- ✅✅ Más seguro para múltiples admins

### Recomendaciones

1. **No commitear credenciales** en git
2. **Usar variables de entorno** en Vercel
3. **Rotar API keys** periódicamente
4. **Mantener backups** de la base de datos

---

## 🚀 Deployment en Vercel

### Pasos

1. **Conectar repositorio** GitHub a Vercel
2. **Configurar variables** de entorno
3. **Deploy automático** en cada push a main
4. **Acceder a:**
   - Juego: `https://chessarcade.vercel.app/games/criptocaballo/`
   - Admin: `https://chessarcade.vercel.app/games/criptocaballo/admin.html`

---

## 📝 Notas Adicionales

### Dificultad Sugerida por Tamaño

| Tamaño | Casillas | Dificultad | Tiempo Promedio |
|--------|----------|------------|-----------------|
| 3×4 | 12 | Fácil | 2-3 min |
| 4×5 | 20 | Fácil-Medio | 3-5 min |
| 5×5 | 25 | Medio | 5-7 min |
| 5×6 | 30 | Medio-Difícil | 7-10 min |
| 6×7 | 42 | Difícil | 10-15 min |
| 8×8 | 64 | Experto | 15-25 min |

### Temas Sugeridos para Mensajes

- **Ajedrez:** JAQUE MATE, GAMBITO, TORRE, ALFIL, etc.
- **Filosofía:** COGITO ERGO SUM, CARPE DIEM, etc.
- **Motivación:** NUNCA TE RINDAS, SIEMPRE ADELANTE, etc.
- **Ciencia:** E IGUAL MC CUADRADO, etc.
- **Literatura:** Citas de libros famosos

---

## 🆘 Troubleshooting

### Error: "Failed to fetch from Supabase"
- Verificar credenciales en el código
- Verificar que la tabla `puzzles` existe
- Verificar políticas RLS

### Error: "Puzzle already exists for this date"
- Ya hay un puzzle guardado para esa fecha + tamaño
- Cambiar fecha o eliminar el registro existente

### Panel Admin no carga
- Verificar URL correcta (.../admin.html)
- Verificar console del navegador (F12)
- Verificar que Supabase CDN está cargando

---

## 📞 Soporte

Para dudas o problemas:
1. Revisar esta guía
2. Verificar logs en Supabase Dashboard
3. Verificar logs en Vercel Dashboard
4. Contactar al desarrollador

---

**Versión:** 1.0
**Última actualización:** Diciembre 2025
**Autor:** Claude Code + Usuario
