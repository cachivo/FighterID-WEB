

## Plan: Ocultar botón de Facebook Login

Eliminar el botón de Facebook del formulario de autenticación, dejando solo Google. El botón de Google ocupará el ancho completo.

### Cambios en `src/pages/Auth.tsx`:
- Eliminar el botón de Facebook OAuth
- Cambiar el grid de 2 columnas a layout de 1 columna
- Ajustar el texto divisor de "o continúa con" (mantener)

