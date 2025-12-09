# 🆔 Actualización: Sistema de ID para Puzzles

## ✅ Qué se implementó:

### 1. **ID Visible y Único**
Cada puzzle ahora tiene un ID legible en formato: **`#YYYYMMDD-AxB`**

**Ejemplos:**
- `#20251205-3x4` - Puzzle del 5 de diciembre 2025, tablero 3x4
- `#20251225-5x5` - Puzzle del 25 de diciembre 2025, tablero 5x5

### 2. **Campos Adicionales**
- **Título**: Nombre del puzzle (ej: "El Despertar", "Navidad Mágica")
- **Autor**: Autor de la frase (ej: "Albert Einstein", "Anónimo")

### 3. **Visibilidad**

#### Para el Admin:
Al guardar un puzzle, verás:
```
✅ Puzzle guardado exitosamente!

ID: #20251205-3x4 "El Despertar"
Fecha: 2025-12-05
Tablero: 3x4
Mensaje: HELLO WORLD!!
```

#### Para el Jugador:
Al cargar un puzzle, verá:
```
✅ Puzzle cargado!

ID: #20251205-3x4 "El Despertar" por Albert Einstein
Fecha: 2025-12-05
Tablero: 3x4

¡Encuentra el mensaje oculto!
```

---

## 🔧 Pasos para Actualizar Supabase:

### Paso 1: Abrir Supabase SQL Editor

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto (eyuuujpwvgmpajrjhnah)
3. Click en **SQL Editor** en la barra lateral
4. Click en **New Query**

### Paso 2: Ejecutar SQL de actualización

Copia y pega este SQL:

```sql
-- Agregar columnas 'title' y 'author' a la tabla puzzles
ALTER TABLE puzzles
ADD COLUMN IF NOT EXISTS title TEXT;

ALTER TABLE puzzles
ADD COLUMN IF NOT EXISTS author TEXT;

-- Agregar comentarios para documentación
COMMENT ON COLUMN puzzles.title IS 'Nombre o título del puzzle (ej: "El Despertar")';
COMMENT ON COLUMN puzzles.author IS 'Autor de la frase del puzzle (ej: "Albert Einstein")';
```

### Paso 3: Ejecutar

Click en **Run** (o presiona `Ctrl+Enter`)

Deberías ver: `Success. No rows returned`

---

## 🧪 Cómo Probar:

### Test 1: Admin - Guardar puzzle con ID

1. Abre: `https://chessarcade-81392uh1a-claudios-projects.vercel.app/games/criptocaballo/admin.html`
2. Password: `C_michigaN_77889900`
3. Genera un mensaje (ej: "PRUEBA CON ID")
4. Click "Guardar"
5. En el modal:
   - Nombre: "Test ID"
   - Autor: "Tu Nombre"
   - Fecha: HOY
6. Click "Guardar en Supabase"

**Resultado esperado:**
```
✅ Puzzle guardado exitosamente!

ID: #20251205-3x4 "Test ID"
Fecha: 2025-12-05
Tablero: 3x4
Mensaje: PRUEBA CON ID
```

### Test 2: Jugador - Cargar puzzle y ver ID

1. Abre: `https://chessarcade-81392uh1a-claudios-projects.vercel.app/games/criptocaballo/`
2. Selecciona fecha: HOY
3. Selecciona tablero: 3x4
4. El puzzle se cargará automáticamente

**Resultado esperado:**
```
✅ Puzzle cargado!

ID: #20251205-3x4 "Test ID" por Tu Nombre
Fecha: 2025-12-05
Tablero: 3x4

¡Encuentra el mensaje oculto!
```

---

## 📊 Estructura del ID:

### Formato: `#YYYYMMDD-RxC`

- **#**: Prefijo para identificación rápida
- **YYYYMMDD**: Fecha en formato año-mes-día (20251205)
- **-**: Separador
- **RxC**: Tamaño del tablero (3x4, 5x5, etc.)

### Ventajas:

✅ **Único**: Combina fecha + tamaño = único por día
✅ **Legible**: Fácil de leer y recordar
✅ **Sorteable**: Se puede ordenar cronológicamente
✅ **Compacto**: Corto pero informativo

---

## 🎯 Casos de Uso:

### Como Admin:
- **Referencia rápida**: "El puzzle #20251225-5x5 tiene un error"
- **Tracking**: Saber qué puzzles has creado para cada día
- **Debugging**: Identificar puzzles problemáticos fácilmente

### Como Jugador:
- **Compartir**: "Resuelve el puzzle #20251205-3x4, está difícil!"
- **Progreso**: "Ya completé todos los puzzles del día 5"
- **Feedback**: "El puzzle #20251210-8x8 no carga"

---

## ❓ FAQ:

**P: ¿Puedo cambiar el título después de guardar?**
R: Sí, solo guarda de nuevo el mismo puzzle (misma fecha + tamaño) con el nuevo título. Se actualizará.

**P: ¿El ID cambia si actualizo el puzzle?**
R: No, el ID se basa en fecha + tamaño, que no cambian.

**P: ¿Es obligatorio poner título y autor?**
R: No, son opcionales. Si no los pones, solo se mostrará el ID.

**P: ¿Puedo tener dos puzzles con el mismo ID?**
R: No, el ID es único por combinación de fecha + tamaño de tablero.

---

## 📝 Notas:

- Los puzzles antiguos (guardados antes de esta actualización) no tendrán título ni autor, pero funcionarán normalmente
- El campo `title` y `author` admiten cualquier texto
- El ID se genera automáticamente, no hace falta que lo ingreses manualmente

---

**¿Listo para usar?** Ejecuta el SQL en Supabase y después haz commit + deploy! 🚀
