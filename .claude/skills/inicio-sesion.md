# Inicio de sesión — ChessArcade / CriptoSopa

Ejecutar al inicio de cada sesión de trabajo para tener contexto completo.

## Pasos

1. Leer el resumen ejecutivo del proyecto:
   `C:\Users\clau\.claude\projects\C--Users-clau-Documents-Multiajedrez-2025\memory\RESUMEN_EJECUTIVO.md`

2. Revisar el estado del repositorio:
   - `git status` para ver archivos modificados
   - `git log --oneline -5` para ver los últimos 5 commits
   - Rama actual: si no es `main`, avisarle al usuario

3. Leer la última entrada del CHANGELOG de CriptoSopa:
   `games/criptosopa/DOCS/CHANGELOG.md` (primeras 30 líneas)

4. Revisar si hay algún ⚠️ PENDIENTE en requerimientos:
   `games/criptosopa/DOCS/requerimientos.md` (últimas 20 líneas)

5. Reportar al usuario en formato conciso:
   - Rama actual
   - Último commit
   - Qué quedó pendiente de la sesión anterior
   - Preguntar: ¿en qué trabajamos hoy?

## Reglas que recordar siempre

- Rama separada para cada feature (`git checkout -b feat/nombre`)
- Deploy preview antes de producción (`NODE_TLS_REJECT_UNAUTHORIZED=0 npx vercel deploy --token TOKEN --yes`)
- Comentarios educativos en todo código nuevo
- No modificar mobile cuando el pedido es solo desktop (y viceversa)
- Documentar al final: CHANGELOG + requerimientos + errores-y-soluciones
