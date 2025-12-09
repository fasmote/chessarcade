# 🎯 Guía Paso a Paso - CriptoCaballo (Para personas que no saben nada)

## 📌 ¿Qué vamos a hacer?

Vamos a configurar el juego CriptoCaballo para que funcione con Supabase (tu base de datos en la nube). Al final, podrás:

1. Entrar al panel de administración con una contraseña
2. Generar mensajes secretos con IA
3. Guardarlos en la base de datos
4. Los jugadores verán esos mensajes en el juego

---

## PARTE 1: Crear la Tabla en Supabase (5 minutos)

### Paso 1.1: Abrir Supabase

1. Abre tu navegador (Chrome, Firefox, etc.)
2. Ve a: https://supabase.com/dashboard
3. Si te pide login, inicia sesión con tu cuenta
4. Deberías ver tu proyecto "chessarcade" (o similar)
5. **Haz clic** en el proyecto para abrirlo

### Paso 1.2: Abrir el Editor SQL

1. En el menú de la izquierda, busca el icono que dice **"SQL Editor"**
   - Es un icono que parece `</>`
2. Haz clic en **"SQL Editor"**
3. Se abrirá una pantalla con un cuadro grande de texto (como un bloc de notas)

### Paso 1.3: Copiar y Pegar el SQL

1. Abre este archivo: `C:\Users\clau\Documents\Multiajedrez 2025\games\criptocaballo\GUIA_PASO_A_PASO.md`
2. Copia TODO el código que está aquí abajo (desde CREATE TABLE hasta el final):

```sql
-- ============================================
-- TABLA PARA CRIPTOCABALLO
-- ============================================

-- Crear la tabla donde se guardarán los puzzles
CREATE TABLE IF NOT EXISTS puzzles (
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

-- Crear índice para buscar rápido por fecha
CREATE INDEX IF NOT EXISTS idx_puzzle_date ON puzzles(puzzle_date);

-- Crear índice para buscar por fecha + tamaño
CREATE INDEX IF NOT EXISTS idx_puzzle_date_size ON puzzles(puzzle_date, board_size);

-- Evitar duplicados: un puzzle por fecha + tamaño
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_date_size ON puzzles(puzzle_date, board_size);

-- Activar seguridad básica
ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;

-- Permitir que cualquiera pueda LEER los puzzles (para jugadores)
CREATE POLICY "Permitir lectura pública" ON puzzles
FOR SELECT USING (true);

-- Permitir que cualquiera pueda GUARDAR puzzles (para admin)
CREATE POLICY "Permitir escritura pública" ON puzzles
FOR INSERT WITH CHECK (true);

-- Permitir que cualquiera pueda ACTUALIZAR puzzles (para admin)
CREATE POLICY "Permitir actualización pública" ON puzzles
FOR UPDATE USING (true);

-- Permitir que cualquiera pueda ELIMINAR puzzles (para admin)
CREATE POLICY "Permitir eliminación pública" ON puzzles
FOR DELETE USING (true);
```

3. **Pega** el código en el cuadro grande de texto del SQL Editor
4. Haz clic en el botón **"Run"** o **"Ejecutar"** (generalmente arriba a la derecha, es un botón verde o azul)
5. Espera 2-3 segundos
6. Deberías ver un mensaje verde que dice "Success" o "Éxito"

### Paso 1.4: Verificar que se creó la tabla

1. En el menú de la izquierda, busca **"Table Editor"**
2. Haz clic en **"Table Editor"**
3. Deberías ver una tabla llamada **"puzzles"** en la lista
4. Haz clic en **"puzzles"**
5. Verás una tabla vacía (sin datos) con columnas como: id, puzzle_date, board_size, etc.

✅ **¡Listo!** La tabla está creada.

---

## PARTE 2: Obtener tus Credenciales (2 minutos)

### Paso 2.1: Ir a la configuración del proyecto

1. En el menú de la izquierda, busca el icono de **engranaje** ⚙️ (generalmente abajo)
2. Haz clic en **"Settings"** o **"Configuración"**
3. En el menú que aparece, haz clic en **"API"**

### Paso 2.2: Copiar la URL del proyecto

1. Busca donde dice **"Project URL"** o **"URL del Proyecto"**
2. Verás algo como: `https://eyuuujpwvgmpajrjhnah.supabase.co`
3. Haz clic en el botón de **copiar** (icono de dos cuadrados) al lado de la URL
4. **Pega** la URL en un bloc de notas temporal (la usaremos después)

### Paso 2.3: Copiar la Anon Key

1. Busca donde dice **"Project API keys"**
2. Dentro, busca **"anon" "public"** key
3. Verás un texto LARGO que empieza con `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
4. Haz clic en el botón de **copiar** al lado
5. **Pega** la key en el bloc de notas (debajo de la URL)

Tu bloc de notas debería verse así:

```
URL: https://eyuuujpwvgmpajrjhnah.supabase.co
KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5dXV1anB3dmdtcGFqcmpobmFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA2NTEzODMsImV4cCI6MjA0NjIyNzM4M30.xxx...
```

✅ **¡Listo!** Tienes tus credenciales.

---

## PARTE 3: Configurar el Archivo Local (3 minutos)

### Paso 3.1: Abrir VSCode (o tu editor de código)

1. Abre **Visual Studio Code**
2. Si ya tienes abierto el proyecto ChessArcade, perfecto
3. Si no, haz clic en **File → Open Folder**
4. Navega a: `C:\Users\clau\Documents\Multiajedrez 2025`
5. Haz clic en **"Seleccionar carpeta"** o **"Select Folder"**

### Paso 3.2: Crear el archivo de configuración privada

1. En VSCode, en el panel de la izquierda, busca la carpeta **`.private`**
2. Haz **clic derecho** en la carpeta `.private`
3. Selecciona **"New File"** o **"Nuevo Archivo"**
4. Nombra el archivo: `criptocaballo-config.js`
5. Presiona **Enter**

### Paso 3.3: Copiar el código de configuración

1. Copia TODO este código:

```javascript
// ============================================
// CONFIGURACIÓN PRIVADA - CRIPTOCABALLO
// ============================================
// Este archivo NO se sube a GitHub (.gitignore)

const CRYPTO_CONFIG = {
    supabase: {
        url: "PEGAR_TU_URL_AQUI",
        anonKey: "PEGAR_TU_KEY_AQUI"
    },
    admin: {
        password: "mipassword123"  // Cambia esto por tu password
    }
};

if (typeof window !== 'undefined') {
    window.CRYPTO_CONFIG = CRYPTO_CONFIG;
}
```

2. **Pega** el código en el archivo `criptocaballo-config.js` que acabas de crear

### Paso 3.4: Reemplazar las credenciales

1. Busca la línea que dice: `url: "PEGAR_TU_URL_AQUI"`
2. **Reemplaza** `PEGAR_TU_URL_AQUI` con la URL que copiaste (entre comillas)
3. Busca la línea que dice: `anonKey: "PEGAR_TU_KEY_AQUI"`
4. **Reemplaza** `PEGAR_TU_KEY_AQUI` con la KEY que copiaste (entre comillas)
5. Busca la línea que dice: `password: "mipassword123"`
6. **Cambia** `mipassword123` por tu contraseña personal (la que usarás para entrar al admin)

Debería verse así (con TUS datos reales):

```javascript
const CRYPTO_CONFIG = {
    supabase: {
        url: "https://eyuuujpwvgmpajrjhnah.supabase.co",
        anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5dXV1anB3dmdtcGFqcmpobmFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA2NTEzODMsImV4cCI6MjA0NjIyNzM4M30.xxx..."
    },
    admin: {
        password: "tuPasswordSeguro2025"  // TU PASSWORD
    }
};
```

7. Guarda el archivo: **Ctrl + S** (o File → Save)

✅ **¡Listo!** El archivo de configuración está creado.

---

## PARTE 4: Cargar la Configuración en los HTML (5 minutos)

### Paso 4.1: Editar admin.html

1. En VSCode, navega a: `games/criptocaballo/admin.html`
2. Haz clic para abrir el archivo
3. Usa **Ctrl + F** (o Edit → Find) para buscar: `const apiKey`
4. Deberías ver una línea que dice: `const apiKey = "AIzaSy..."`
5. **JUSTO ANTES** de esa línea (en la línea de arriba), agrega este código:

```html
    <!-- Cargar configuración privada -->
    <script src="../../.private/criptocaballo-config.js"></script>

```

Debería verse así:

```html
<script>
    <!-- Cargar configuración privada -->
    <script src="../../.private/criptocaballo-config.js"></script>

    const apiKey = "AIzaSyDDRILtZ02s-_i81kSqYCQda8VtzKb2weY";
    const APP_VERSION = "5.7";
    ...
```

6. Guarda el archivo: **Ctrl + S**

### Paso 4.2: Editar index.html

1. En VSCode, navega a: `games/criptocaballo/index.html`
2. Haz clic para abrir el archivo
3. Usa **Ctrl + F** para buscar: `const apiKey`
4. **JUSTO ANTES** de esa línea, agrega el mismo código:

```html
    <!-- Cargar configuración privada -->
    <script src="../../.private/criptocaballo-config.js"></script>

```

5. Guarda el archivo: **Ctrl + S**

✅ **¡Listo!** Los archivos HTML ya saben dónde buscar la configuración.

---

## PARTE 5: Probar que Funciona (5 minutos)

### Paso 5.1: Abrir el panel de administración

1. Abre tu navegador (Chrome, Firefox, etc.)
2. En la barra de direcciones, escribe (o copia y pega):

```
file:///C:/Users/clau/Documents/Multiajedrez%202025/games/criptocaballo/admin.html
```

3. Presiona **Enter**
4. Deberías ver una pantalla con:
   - Un candado 🔐
   - "Panel de Administración"
   - Un campo para contraseña
   - Un botón "Acceder"

### Paso 5.2: Ingresar la contraseña

1. Escribe la contraseña que configuraste en el archivo `criptocaballo-config.js`
2. Haz clic en **"Acceder"**
3. Si la contraseña es correcta, la pantalla de login desaparecerá
4. Verás el panel de administración completo con:
   - Botones de IA (Frase Chess, Célebre, etc.)
   - Un textarea para escribir mensajes
   - Un tablero de previsualización

**Si la contraseña es incorrecta:**
- Verás un mensaje rojo: "Contraseña incorrecta"
- Vuelve a revisar el archivo `.private/criptocaballo-config.js`
- Asegúrate de escribir la contraseña EXACTAMENTE igual (mayúsculas/minúsculas importan)

### Paso 5.3: Generar un mensaje de prueba

1. Haz clic en el botón **"Frase Chess"** (espera 2-3 segundos)
2. Debería aparecer una frase relacionada con ajedrez en el textarea
3. O escribe tu propio mensaje: `HOLA MUNDO`

### Paso 5.4: Configurar y guardar

1. Selecciona tamaño de tablero: **5x5** (por ejemplo)
2. Selecciona tipo de relleno: **Random**
3. Selecciona separador: **Ninguno**
4. Haz clic en **"Generar Ruta"** (debería mostrarse el tablero con letras)
5. Abajo del tablero, selecciona una **fecha** (hoy, por ejemplo: 2025-12-03)
6. Haz clic en el botón **"Guardar Puzzle"**

**Si sale bien:**
- Verás un mensaje verde: "Puzzle guardado exitosamente"

**Si sale mal:**
- Abre **DevTools** (F12 en el navegador)
- Ve a la pestaña **"Console"**
- Busca mensajes de error en rojo
- Copia el error y envíamelo

### Paso 5.5: Verificar en Supabase

1. Vuelve a Supabase (https://supabase.com/dashboard)
2. Ve a **"Table Editor"**
3. Haz clic en la tabla **"puzzles"**
4. Deberías ver **1 fila** (una línea) con:
   - La fecha que seleccionaste
   - El tamaño 5x5
   - Tu mensaje
5. **¡Funciona!** 🎉

### Paso 5.6: Probar el juego (index.html)

1. Abre una nueva pestaña en el navegador
2. Escribe (o copia y pega):

```
file:///C:/Users/clau/Documents/Multiajedrez%202025/games/criptocaballo/index.html
```

3. Presiona **Enter**
4. Deberías ver el juego público (sin panel admin)
5. Selecciona el **mismo tamaño** que guardaste (5x5)
6. Selecciona la **misma fecha** que guardaste (2025-12-03)
7. El tablero debería cargarse con el puzzle que guardaste
8. **¡Funciona!** 🎉

---

## PARTE 6: Para Producción (Vercel) - 5 minutos

### Paso 6.1: Crear config.js público

1. En VSCode, navega a: `games/criptocaballo/`
2. Haz **clic derecho** en la carpeta
3. Selecciona **"New File"**
4. Nombra el archivo: `config.js`

### Paso 6.2: Copiar configuración para producción

1. Copia este código:

```javascript
// ============================================
// CONFIGURACIÓN PARA PRODUCCIÓN (VERCEL)
// ============================================
// Este archivo SÍ se sube a GitHub
// Usa credenciales de PRODUCCIÓN

const CRYPTO_CONFIG = {
    supabase: {
        url: "PEGAR_TU_URL_AQUI",
        anonKey: "PEGAR_TU_KEY_AQUI"
    },
    admin: {
        password: "passwordProduccion2025"  // Password DIFERENTE para producción
    }
};

if (typeof window !== 'undefined') {
    window.CRYPTO_CONFIG = CRYPTO_CONFIG;
}
```

2. **Pega** en `config.js`
3. **Reemplaza** URL y KEY con las mismas credenciales de Supabase
4. **Cambia** el password por uno DIFERENTE (para producción)
5. Guarda: **Ctrl + S**

### Paso 6.3: Cargar config.js en los HTML

1. Abre `admin.html`
2. Busca la línea que agregaste antes: `<script src="../../.private/criptocaballo-config.js"></script>`
3. **Debajo** de esa línea, agrega:

```html
    <!-- Cargar configuración para producción (Vercel) -->
    <script src="config.js"></script>
```

Debería verse así:

```html
    <!-- Cargar configuración privada -->
    <script src="../../.private/criptocaballo-config.js"></script>
    <!-- Cargar configuración para producción (Vercel) -->
    <script src="config.js"></script>

    <script>
    const apiKey = "AIzaSy...";
```

4. Guarda: **Ctrl + S**
5. Repite lo mismo en `index.html`
6. Guarda: **Ctrl + S**

### Paso 6.4: Commit y Push

1. Abre **Git Bash** o la terminal integrada de VSCode
2. Navega al proyecto:

```bash
cd "C:\Users\clau\Documents\Multiajedrez 2025"
```

3. Agrega los cambios:

```bash
git add games/criptocaballo/admin.html games/criptocaballo/index.html games/criptocaballo/config.js
```

4. Crea el commit:

```bash
git commit -m "feat: Configure CriptoCaballo with Supabase credentials"
```

5. Sube a GitHub:

```bash
git push
```

6. Espera 1-2 minutos a que Vercel despliegue automáticamente

### Paso 6.5: Probar en Vercel

1. Ve a: `https://chessarcade.vercel.app/games/criptocaballo/admin.html`
2. Ingresa la contraseña de PRODUCCIÓN (la que pusiste en config.js)
3. Genera y guarda un puzzle
4. Ve a: `https://chessarcade.vercel.app/games/criptocaballo/`
5. Carga el puzzle
6. **¡Funciona en producción!** 🚀

---

## 📋 Resumen de Archivos

```
.private/
└── criptocaballo-config.js    ← Credenciales LOCALES (NO se sube a GitHub)

games/criptocaballo/
├── config.js                   ← Credenciales PRODUCCIÓN (SÍ se sube a GitHub)
├── admin.html                  ← Carga ambos config
├── index.html                  ← Carga ambos config
└── ...
```

**Cómo funciona:**

- **Local:** Usa `.private/criptocaballo-config.js` (tus credenciales privadas)
- **Vercel:** Usa `config.js` (credenciales públicas, pero con password diferente)
- Si existe `.private/...`, lo usa primero
- Si no existe (como en Vercel), usa `config.js`

---

## ❓ Preguntas Frecuentes

### "No veo el botón Run en SQL Editor"
- Busca un botón verde o azul con texto "Run" o un icono de ▶️
- A veces está arriba a la derecha
- O presiona **Ctrl + Enter**

### "La tabla ya existe"
- No pasa nada, el SQL usa `IF NOT EXISTS`
- Significa que ya estaba creada antes

### "Password incorrecta en admin.html"
- Abre DevTools (F12)
- Ve a Console
- Escribe: `window.CRYPTO_CONFIG`
- Verifica que el password coincida

### "Failed to connect to Supabase"
- Verifica que la URL y KEY sean correctas
- Verifica que copiaste TODO el KEY (es muy largo)
- Abre DevTools → Console para ver el error exacto

### "En Vercel no funciona"
- Verifica que `config.js` exista y tenga las credenciales
- Verifica que admin.html e index.html carguen `config.js`
- Espera 2-3 minutos después del push para que Vercel despliegue

---

## ✅ Checklist Final

- [ ] Crear tabla `puzzles` en Supabase ✓
- [ ] Copiar URL y Anon Key ✓
- [ ] Crear `.private/criptocaballo-config.js` ✓
- [ ] Editar admin.html para cargar config ✓
- [ ] Editar index.html para cargar config ✓
- [ ] Probar admin.html localmente ✓
- [ ] Guardar puzzle de prueba ✓
- [ ] Verificar en Supabase que se guardó ✓
- [ ] Probar index.html localmente ✓
- [ ] Crear `config.js` para producción ✓
- [ ] Commit y push ✓
- [ ] Probar en Vercel ✓

**¿Listo?** Mándame tus credenciales y yo lo configuro, o sígueme paso a paso y te ayudo si te trabas en algo.
