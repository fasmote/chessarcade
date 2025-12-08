# CriptoCaballo - Sesión de Debugging Parte 2
## Fecha: 2025-12-07 (Continuación)

---

## RESUMEN EJECUTIVO

Esta es la continuación de la sesión de debugging iniciada más temprano hoy. Después de resolver 8 bugs iniciales, el usuario reportó 3 nuevos problemas críticos:

1. ❌ **Usuario no carga tableros** - config.js devuelve 404
2. ✅ **Fecha correcta** - El fix de timezone UTC → local funcionó
3. ❌ **Tablero descentrado** - Board sigue desplazándose a la derecha en tamaños grandes

---

## PROBLEMA 1: config.js 404 Error (PARCIALMENTE RESUELTO)

### Log Evidence
```
195_CC_usuario.log línea 3:
config.js:1  Failed to load resource: the server responded with a status of 404 ()

195_CC_usuario.log línea 4-5:
criptocaballo:585 CRYPTO_CONFIG cargado: ❌ NO
criptocaballo:588 Supabase URL: TU_SUPABASE_URL
```

### Root Cause Analysis

**CAUSA INICIAL INCORRECTA**: Pensé que config.js no estaba siendo deployado a Vercel.

**VERIFICACIÓN**:
- ✅ `git ls-files games/criptocaballo/config.js` → archivo SÍ está trackeado
- ✅ `.gitignore` no incluye config.js
- ✅ WebFetch a https://chessarcade-5mregcb92-claudios-projects.vercel.app/games/criptocaballo/config.js → devuelve código JavaScript correcto
- ✅ El archivo SÍ se deployó correctamente

**CAUSA REAL**: **Browser caching del 404 anterior**

### Explicación Técnica

1. En deployments anteriores, config.js NO existía o estaba en .gitignore
2. El navegador del usuario cargó la página y recibió 404 para config.js
3. El navegador cacheó este 404 (especialmente con `<script src="config.js?v=5.8">`
4. Aunque deployé config.js correctamente, el navegador SIGUIÓ usando el 404 cacheado
5. El parámetro `?v=5.8` no cambió entre deployments, entonces el cache no se invalidó

### Evidencia de Cache Issue

El log muestra DOS cosas contradictorias:
- ✅ Línea 8: `📅 Fecha local (no UTC): 2025-12-07` ← Este console.log es del deployment NUEVO
- ❌ Línea 3: `config.js:1 Failed to load resource: 404` ← Este 404 es del cache VIEJO

Esto prueba que el HTML nuevo se cargó (con mi código de fecha local), pero config.js seguía cacheado como 404.

### Solución Implementada

**Cambio 1: Cache Busting**
```javascript
// ANTES (index.html línea 577):
<script src="config.js?v=5.8"></script>
const APP_VERSION = "5.8";

// DESPUÉS:
<script src="config.js?v=5.9"></script>
const APP_VERSION = "5.9";
```

**Aplicado a ambos archivos**:
- `games/criptocaballo/index.html` (usuario)
- `games/criptocaballo/admin.html`

### Por Qué Esta Solución Funciona

El navegador trata `config.js?v=5.8` y `config.js?v=5.9` como URLs COMPLETAMENTE DIFERENTES:
- `config.js?v=5.8` está cacheado como 404
- `config.js?v=5.9` es una URL nueva sin cache, se cargará correctamente

### Deployment

**Commit**: `a0baaba` - "fix: Bump version to 5.9 to force cache bust for config.js"

**URL de producción**: https://chessarcade-pxfvx6021-claudios-projects.vercel.app

### Testing Necesario

Usuario debe:
1. Cargar https://chessarcade-pxfvx6021-claudios-projects.vercel.app/games/criptocaballo/
2. Abrir consola (F12)
3. Verificar que aparece: `CRYPTO_CONFIG cargado: ✅ SÍ`
4. Verificar que aparece: `Supabase URL: https://eyuuujpwvgmpajrjhnah.supabase.co` (NO "TU_SUPABASE_URL")
5. Intentar cambiar tamaños de tablero y verificar que cargan puzzles

### Estado

✅ **RESUELTO** (pendiente confirmación del usuario)

---

## PROBLEMA 2: Fecha Incorrecta (RESUELTO ✅)

### Evidence

El log muestra:
```
195_CC_usuario.log línea 8:
📅 Fecha local (no UTC): 2025-12-07
```

### Conclusión

✅ El fix de timezone implementado en la Parte 1 de esta sesión **FUNCIONÓ CORRECTAMENTE**.

La función `getLocalDateString()` está devolviendo la fecha local correcta (2025-12-07) en vez de UTC (que hubiera sido 2025-12-08).

**NO SE REQUIERE ACCIÓN ADICIONAL**.

---

## PROBLEMA 3: Board Centering (EN PROGRESO 🔧)

### Reporte del Usuario

> "tablero descentrado, tirado a la derecha como antes"

### Investigación

**Cambio anterior (Parte 1)**:
```css
.board-wrapper {
    display: grid; /* Cambié de inline-grid a grid */
    margin: 0 auto;
    justify-self: center;
}
```

**Este cambio NO funcionó** según reporte del usuario.

### Root Cause Analysis

El problema es la estructura grid interna:

```
.board-wrapper (grid con 2 columnas)
  ├─ Column 1: .ranks-col (números de filas: 8, 7, 6, 5...)
  └─ Column 2: .chess-grid (tablero real)
```

```css
.board-wrapper {
    grid-template-columns: max-content max-content; /* 2 columnas */
}

.ranks-col {
    grid-column: 1; /* Columna izquierda */
    min-width: 20px;
}

.chess-grid {
    grid-column: 2; /* Columna derecha */
}
```

**Por qué se descentra en tableros grandes**:
1. Tablero 3x4 → chess-grid es pequeño → ancho total (ranks + board) se centra bien
2. Tablero 8x8 → chess-grid es GRANDE → ancho total crece, pero el PESO visual está en la columna derecha
3. El ojo humano percibe que el tablero está "desplazado a la derecha" porque la columna de ranks (izquierda) es muy delgada comparada con el board grande

### Cambio Implementado (Reversión)

```css
.board-wrapper {
    display: inline-grid; /* Volví a inline-grid */
    /* Removed margin: 0 auto y justify-self: center */
    /* Centering handled by flex parent with items-center */
}
```

**Justificación**: El parent container tiene `class="flex flex-col items-center"`, que debería centrar el inline-grid.

### Estado Actual

🔧 **EN PROGRESO** - Requiere testing del usuario

### Próximos Pasos Si Falla

Si este cambio tampoco funciona, opciones:

**Opción A**: Transformación visual con translate
```css
.board-wrapper {
    transform: translateX(-10px); /* Ajuste manual para compensar visual */
}
```

**Opción B**: Reorganizar grid para centrar el board
```css
.board-wrapper {
    grid-template-columns: max-content auto max-content;
    /*                     ranks      board    (vacio)  */
}

.ranks-col { grid-column: 1; }
.chess-grid { grid-column: 2; justify-self: center; }
```

**Opción C**: Mover ranks a overlay
```css
.ranks-col {
    position: absolute;
    left: -25px; /* Fuera del grid, overlay */
}
```

---

## COMMITS DE ESTA SESIÓN

### Commit 1: `40681de`
**Mensaje**: "fix: Use local date instead of UTC to prevent wrong date queries"

**Archivos modificados**:
- `games/criptocaballo/admin.html`
- `games/criptocaballo/index.html`

**Cambios**:
1. Agregada función `getLocalDateString()` a ambos archivos
2. Reemplazadas todas las instancias de `new Date().toISOString().split('T')[0]`
3. Agregado console.log `📅 Fecha local (no UTC): ${today}`
4. Cambio de CSS: inline-grid → grid (LUEGO REVERTIDO)

### Commit 2: `a0baaba`
**Mensaje**: "fix: Bump version to 5.9 to force cache bust for config.js"

**Archivos modificados**:
- `games/criptocaballo/admin.html`
- `games/criptocaballo/index.html`

**Cambios**:
1. `config.js?v=5.8` → `config.js?v=5.9`
2. `APP_VERSION = "5.8"` → `APP_VERSION = "5.9"`
3. Reversión de CSS: grid → inline-grid

---

## DEPLOYMENTS

| Deployment | URL | Cambios Incluidos |
|------------|-----|-------------------|
| `5mregcb92` | https://chessarcade-5mregcb92-claudios-projects.vercel.app | Timezone fix + board centering (grid) |
| `pxfvx6021` | https://chessarcade-pxfvx6021-claudios-projects.vercel.app | Cache bust v5.9 + board centering (inline-grid) |

**URL ACTUAL RECOMENDADA**: https://chessarcade-pxfvx6021-claudios-projects.vercel.app

---

## LECCIONES APRENDIDAS

### 1. Browser Caching es Traicionero

**Problema**: El cache de JavaScript puede persistir incluso después de deployments exitosos.

**Solución**: Siempre usar cache busting con version parameters (`?v=X.Y`) y **incrementar el número** en cada deployment que cambie archivos JS externos.

**Best Practice**:
```javascript
// BIEN: Version number sincronizado
<script src="config.js?v=5.9"></script>
const APP_VERSION = "5.9";

// MAL: Version numbers desincronizados
<script src="config.js?v=5.8"></script>
const APP_VERSION = "5.9";
```

### 2. UTC vs Local Time en JavaScript

**Problema**: `new Date().toISOString()` siempre devuelve UTC, que puede ser un día diferente del local.

**Ejemplo Real**:
- Local: Argentina (UTC-3), 21:00 del 7 de diciembre
- UTC: 00:00 del 8 de diciembre
- `.toISOString().split('T')[0]` → "2025-12-08" ❌

**Solución**:
```javascript
function getLocalDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
```

**Uso**: Reemplazar TODAS las instancias de `new Date().toISOString().split('T')[0]`.

### 3. Logs con Emojis para Debugging

**Best Practice Implementada**:
```javascript
console.log(`📅 Fecha local (no UTC): ${today}`);
console.log(`💾 Cargando lastDecodedMessageOriginal: "${lastDecodedMessageOriginal}"`);
console.log(`✅ Usando tokens guardados: ${tokens.length}`);
```

**Beneficio**: Fácil identificación visual en consola con cientos de logs.

**Emoji System**:
- 📅 = Fecha/tiempo
- 💾 = Save/load operations
- 👁️ = Eye button (toggle spaces)
- 🔐 = Encryption
- 📋 = Board changes
- ✅ = Success
- ❌ = Error

### 4. Deployment URLs de Vercel Nunca Expiran

**Pregunta del usuario**: "¿Los links viejos de Vercel se inactivan alguna vez?"

**Respuesta**: NO. Cada deployment get a permanent unique URL:
- https://chessarcade-5mregcb92-claudios-projects.vercel.app
- https://chessarcade-pxfvx6021-claudios-projects.vercel.app
- https://chessarcade-f848j6po3-claudios-projects.vercel.app

Todos estos links SIEMPRE servirán ese deployment específico.

**Beneficio**: Excelente para debugging - puedes comparar diferentes versiones.

**Preocupación del usuario**: "¿No se satura con tanto link?"

**Respuesta**: No. Vercel está diseñado para manejar miles de deployment URLs. No hay límite práctico.

---

## ESTADO FINAL

| Problema | Estado | Deployment |
|----------|--------|-----------|
| 1. config.js 404 | ✅ RESUELTO (pendiente confirmación) | pxfvx6021 |
| 2. Fecha incorrecta (UTC) | ✅ RESUELTO CONFIRMADO | pxfvx6021 |
| 3. Board centering | 🔧 EN PROGRESO | pxfvx6021 |

---

## PRÓXIMOS PASOS

1. **Usuario debe testear**: https://chessarcade-pxfvx6021-claudios-projects.vercel.app/games/criptocaballo/
2. **Verificar**:
   - ✅ config.js carga correctamente (console: "CRYPTO_CONFIG cargado: ✅ SÍ")
   - ✅ Puzzles cargan sin 406 errors
   - 🔧 Board centering (¿sigue descentrado?)
3. **Si board sigue descentrado**: Implementar una de las opciones A/B/C descritas arriba

---

## CONSOLE.LOG ESPERADOS EN USUARIO

```
cdn.tailwindcss.com should not be used in production...
CRYPTO_CONFIG cargado: ✅ SÍ
Supabase URL: https://eyuuujpwvgmpajrjhnah.supabase.co
CriptoCaballo v5.9 cargado.
📅 Fecha local (no UTC): 2025-12-07
Botón presionado: Tablero 3x4
Cargando puzzle para 2025-12-07 (3x4)
```

**NO DEBE APARECER**:
- ❌ `config.js:1 Failed to load resource: 404`
- ❌ `CRYPTO_CONFIG cargado: ❌ NO`
- ❌ `Supabase URL: TU_SUPABASE_URL`
- ❌ `Supabase no configurado`

---

*Documentado por: Claude Code*
*Fecha: 2025-12-07*
*Sesión: Parte 2 (Continuación)*
