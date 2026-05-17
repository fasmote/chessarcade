# Fin de sesión — ChessArcade / CriptoSopa

Ejecutar al terminar para dejar todo documentado y pusheado.

## Pasos

1. **Documentar en CHANGELOG** (`games/criptosopa/DOCS/CHANGELOG.md`):
   - Nueva entrada con fecha de hoy
   - Secciones: ✨ Added, 🐛 Fixed, 📚 Aprendizajes
   - Si algo quedó sin resolver: sección ⚠️ PENDIENTE

2. **Actualizar requerimientos** (`games/criptosopa/DOCS/requerimientos.md`):
   - Nueva sección numerada con RF-XXX para cada feature
   - Marcar pendientes con ⚠️

3. **Documentar errores** (`games/criptosopa/DOCS/errores-y-soluciones.md`):
   - Error con número, causa raíz, solución y lección aprendida
   - Si quedó sin resolver: Estado ⚠️ SIN RESOLVER con intentos fallidos documentados
   - Si se resolvió algo pendiente: marcarlo ✅ RESUELTO con la solución

4. **Commit de documentación**:
   ```
   git add games/criptosopa/DOCS/
   git commit -m "Docs: CriptoSopa — sesión FECHA"
   ```

5. **Merge y push**:
   ```
   git checkout main
   git merge nombre-rama --no-ff
   git push origin main
   ```

6. **Actualizar RESUMEN_EJECUTIVO** si cambió algo importante del proyecto o del workflow.

## Qué NO olvidar documentar
- Bugs que costaron más de 1 intento (con los intentos fallidos)
- CSS que no debe tocarse y por qué
- Funciones JS que tienen side effects no obvios
- Cualquier workaround o hack con el motivo
