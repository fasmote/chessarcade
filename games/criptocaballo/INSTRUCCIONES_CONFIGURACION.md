# 🎯 CriptoCaballo - Instrucciones de Configuración

## ✅ Lo que se ha hecho

### Archivos Creados y Commiteados a GitHub:
1. ✅ `admin.html` - Panel administrador con login
2. ✅ `index.html` - Juego público (panel admin oculto)
3. ✅ `README_SETUP.md` - Guía completa de setup
4. ✅ `QUICK_START.md` - Guía rápida
5. ✅ `config.example.js` - Plantilla de configuración

### Seguridad Implementada:
- ✅ NO hay passwords hardcodeados en el código
- ✅ NO hay credenciales de Supabase en el código
- ✅ Configuración real va en `/.private/` (gitignored)

---

## 🔐 PASO 1: Configurar Credenciales (LOCAL)

### Copiar archivo de configuración:

```bash
cp games/criptocaballo/config.example.js .private/criptocaballo-config.js
```

### Editar `.private/criptocaballo-config.js`:

```javascript
const CRYPTO_CONFIG = {
    supabase: {
        url: "https://tu-proyecto-real.supabase.co",  // ← TU URL REAL
        anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  // ← TU KEY REAL
    },
    admin: {
        password: "tu-password-seguro-aqui"  // ← TU PASSWORD REAL
    }
};

if (typeof window !== 'undefined') {
    window.CRYPTO_CONFIG = CRYPTO_CONFIG;
}
```

### Cargar config en los HTML:

Agrega esta línea en **admin.html** y **index.html** ANTES del `<script>` principal:

```html
<!-- Cargar configuración privada (solo desarrollo local) -->
<script src="../../.private/criptocaballo-config.js"></script>
```

Ubicación exacta:
- **admin.html** línea ~598 (justo antes del `<script>` que empieza con `const apiKey`)
- **index.html** línea ~568 (justo antes del `<script>` que empieza con `const apiKey`)

---

## ☁️ PASO 2: Configurar Supabase

### 1. Crear Proyecto en Supabase

1. Ir a https://supabase.com
2. Crear nuevo proyecto
3. Esperar ~2 minutos a que se cree

### 2. Ejecutar SQL

Ir a **SQL Editor** y ejecutar:

```sql
-- Crear tabla de puzzles
CREATE TABLE puzzles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    puzzle_date DATE NOT NULL,
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

-- Índices
CREATE INDEX idx_puzzle_date ON puzzles(puzzle_date);
CREATE INDEX idx_puzzle_date_size ON puzzles(puzzle_date, board_size);

-- Constraint: un puzzle por fecha+tamaño
CREATE UNIQUE INDEX idx_unique_date_size ON puzzles(puzzle_date, board_size);

-- RLS (Row Level Security)
ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Lectura pública"
ON puzzles FOR SELECT
USING (true);

CREATE POLICY "Escritura pública"
ON puzzles FOR INSERT
WITH CHECK (true);

CREATE POLICY "Actualización pública"
ON puzzles FOR UPDATE
USING (true);
```

### 3. Obtener Credenciales

**Project Settings → API:**
- Project URL: `https://xxxxx.supabase.co`
- Anon/Public Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 4. Actualizar `.private/criptocaballo-config.js`

Pegar las credenciales copiadas.

---

## 🧪 PASO 3: Probar Localmente

### 1. Abrir admin.html

```
file:///C:/Users/clau/Documents/Multiajedrez%202025/games/criptocaballo/admin.html
```

- Ingresar password configurado
- Generar un mensaje
- Seleccionar fecha (ej: hoy)
- Guardar puzzle
- Verificar en Supabase Dashboard que se guardó

### 2. Abrir index.html

```
file:///C:/Users/clau/Documents/Multiajedrez%202025/games/criptocaballo/index.html
```

- Seleccionar la misma fecha del paso anterior
- Verificar que carga el puzzle
- Probar resolverlo

---

## ☁️ PASO 4: Configurar Variables de Entorno en Vercel

### Dashboard de Vercel → Settings → Environment Variables

Agregar estas 3 variables:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciO...` | Production |
| `VITE_ADMIN_PASSWORD` | `tu-password` | Production |

**IMPORTANTE:** En Vercel, las variables de entorno NO están disponibles en archivos HTML estáticos. Tendremos que usar un enfoque diferente para producción.

---

## 🚀 PASO 5: Deployment en Vercel

### Opción A: Usar archivo de config público (MÁS SIMPLE)

Crear un archivo `games/criptocaballo/config.js` (SIN .example) con las credenciales reales:

```javascript
// SOLO PARA PRODUCCIÓN
// Este archivo SÍ se sube a GitHub pero con credenciales de PRODUCCIÓN
const CRYPTO_CONFIG = {
    supabase: {
        url: "https://tu-proyecto.supabase.co",
        anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    admin: {
        password: "password-produccion-diferente"
    }
};

if (typeof window !== 'undefined') {
    window.CRYPTO_CONFIG = CRYPTO_CONFIG;
}
```

Luego en **admin.html** y **index.html**, agregar:

```html
<!-- Config para producción -->
<script src="config.js"></script>
```

**NOTA:** La Anon Key de Supabase es segura compartirla públicamente (está diseñada para eso). El password del admin puede ser diferente en producción.

### Opción B: API Proxy (MÁS SEGURO pero más complejo)

Crear un Vercel Serverless Function que actúe como proxy. Requiere convertir el proyecto a Node.js.

**Recomendación:** Usar Opción A por ahora.

---

## 📅 PASO 6: Programar Puzzles Mensuales

### Estrategia Diaria

Para cada día del mes:
1. Generar 6 puzzles (uno por cada tamaño: 3x4, 4x5, 5x5, 5x6, 6x7, 8x8)
2. Usar temas variados (ajedrez, filosofía, motivación)
3. Ajustar dificultad según tamaño

### Workflow Rápido

1. Abrir `admin.html`
2. Ingresar password
3. Para cada tamaño de tablero:
   - Seleccionar tamaño
   - Click "Frase Chess" o "Célebre"
   - Ajustar si es necesario
   - Seleccionar fecha
   - Click "Guardar Puzzle"
4. Repetir para los 30 días del mes

**Tiempo estimado:** 5 min por día × 30 días = 2.5 horas/mes

---

## 🔍 Troubleshooting

### "Password incorrecta" en admin.html
- Verificar que `.private/criptocaballo-config.js` existe
- Verificar que está cargado: `console.log(window.CRYPTO_CONFIG)`
- Verificar password exacto (case-sensitive)

### "Failed to connect to Supabase"
- Verificar credenciales en config
- Verificar que la tabla `puzzles` existe en Supabase
- Verificar políticas RLS están habilitadas

### Puzzle no carga en index.html
- Verificar que existe puzzle para esa fecha + tamaño en Supabase
- Abrir DevTools → Network → Verificar llamada a Supabase
- Verificar mensaje de error en Console

### En Vercel no carga las credenciales
- Crear archivo `config.js` público con credenciales de producción
- Agregar `<script src="config.js"></script>` en los HTML
- Re-deploy en Vercel

---

## 📊 Resumen de Archivos

```
games/criptocaballo/
├── index.html                      ← Juego público (commiteado)
├── admin.html                      ← Panel admin (commiteado)
├── config.example.js               ← Plantilla (commiteado)
├── config.js                       ← Config producción (crear, commitear)
├── README_SETUP.md                 ← Guía completa (commiteado)
├── QUICK_START.md                  ← Guía rápida (commiteado)
└── docs/
    └── requerimiento funcional...  ← Specs (commiteado)

.private/
└── criptocaballo-config.js         ← Config desarrollo (NO commitear)
```

---

## ✅ Checklist Final

- [ ] Crear proyecto Supabase
- [ ] Ejecutar SQL para crear tabla
- [ ] Copiar credenciales
- [ ] Crear `.private/criptocaballo-config.js`
- [ ] Probar admin.html localmente
- [ ] Guardar un puzzle de prueba
- [ ] Probar index.html localmente
- [ ] Crear `config.js` para producción
- [ ] Agregar `<script src="config.js">` en HTMLs
- [ ] Commit y push
- [ ] Verificar en Vercel que funciona
- [ ] Programar puzzles del mes

---

## 🎯 Próximo: Programar Diciembre 2025

Una vez configurado todo, programa los 180 puzzles de diciembre:
- 30 días × 6 tamaños = 180 puzzles
- Usar temas navideños para el 24-25 de diciembre
- Usar frases motivacionales para fin de año

**¡Listo para comenzar!** 🚀
