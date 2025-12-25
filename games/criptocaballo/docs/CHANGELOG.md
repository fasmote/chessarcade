# Changelog - CriptoCaballo

Todos los cambios notables en CriptoCaballo serán documentados aquí.

---

## [v5.11] - 2025-12-25

### Added - Sistema de Tags/Categorías (Fase 2: UI Usuario)

#### Filtros de Tags
- Botones de filtro por categoría sobre el selector de fecha
- Solo se muestran tags con puzzles asignados (usage_count > 0)
- Botón "Todos" para volver a vista normal
- Estado activo visual con colores de cada categoría

#### Display de Tags
- Tags del puzzle actual se muestran bajo la info del puzzle
- Chips con emoji, nombre y color de cada categoría
- Se cargan automáticamente al cargar cualquier puzzle

#### Funciones JavaScript
- `loadTagFilters()` - carga tags desde Supabase
- `renderTagFilters()` - renderiza botones de filtro
- `filterByTag()` - filtra puzzles usando RPC `get_puzzles_by_tag()`
- `loadAndDisplayPuzzleTags()` - muestra tags del puzzle actual
- `loadPuzzleById()` y `loadPuzzleFromData()` - helpers para carga

---

## [v5.10] - 2025-12-24

### Added - Sistema de Tags/Categorías (Fase 1: Admin)

#### Base de datos
- Nueva tabla `puzzle_tags` con 13 categorías predefinidas:
  - General, Matemáticas, Ajedrez, Navidad, Ciencia, Historia
  - Filosofía, Deportes, Arte/Cultura, Refranes, Humor, Motivación, Autores
- Nueva tabla `puzzle_tag_relations` para relación muchos-a-muchos
- Trigger automático para actualizar `usage_count`
- Funciones SQL: `get_puzzle_tags()`, `get_puzzles_by_tag()`
- Diseñado para futuro soporte i18n (`tag_key` inmutable, `display_name` traducible)

#### Admin UI
- Selector de tags con chips clickeables en modal de guardado
- CSS personalizado para chips con colores por categoría
- Tags se cargan desde Supabase al abrir modal
- Tags existentes se cargan al editar puzzle existente
- Tags se guardan junto con el puzzle (sin alterar ID ni daily_number)

#### Scripts SQL incluidos
- `SQL_TAGS_SYSTEM.sql` - Crear tablas y datos iniciales
- `SQL_ASSIGN_GENERAL_TAG.sql` - Asignar "general" a puzzles sin tags

---

## [v5.9] - 2025-12-24

### Added
- Mensaje decodificado a la derecha del tablero en desktop
- Board permanece centrado, mensaje en panel lateral
- Estilo ChessArcade: fondo animado, logo SVG, menú de navegación

### Fixed
- Espaciado del botón "Ver con Espacios" en mobile y desktop
- Separación del instructivo "Cómo Jugar"

---

## Pendiente - Mejoras Futuras

### Por implementar
- [ ] Nube de tags interactiva (visualización gráfica)
- [ ] Estadísticas de puzzles por categoría
- [ ] Internacionalización de nombres de tags

### Completado en v5.11
- [x] Mostrar tags en cada puzzle (badge/chip)
- [x] Filtros por categoría en pantalla de usuario
- [x] Búsqueda de puzzles por tag

---

## Referencias

- **Documentación tags:** `docs/FUTURAS_MEJORAS.md`
- **SQL scripts:** `docs/SQL_TAGS_SYSTEM.sql`, `docs/SQL_ASSIGN_GENERAL_TAG.sql`
- **Bugs resueltos:** `docs/ERRORES_SOLUCIONADOS.md`
