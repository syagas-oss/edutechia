# Docente AI - Asistente Pedagógico (PoC)

Aplicación web estática construida con React, Vite y Tailwind CSS. La interfaz conversa con un webhook de n8n para generar actividades pedagógicas y puede publicarse automáticamente en GitHub Pages.

## Capacidades
- Interfaz conversacional para dialogar con el asistente.
- Dictado por voz usando la Web Speech API en navegadores compatibles.
- Persistencia local de `sessionId` e historial con `localStorage`.
- Renderizado visual de actividades estructuradas devueltas por el webhook.
- Despliegue automático en GitHub Pages sin publicar `dist/` en una rama dedicada.

## Webhook
La app envía un `POST` JSON a n8n al enviar un mensaje:

```json
{
  "sessionId": "session_xxx_123",
  "message": "Quiero una actividad de álgebra para primaria...",
  "timestamp": "2024-03-24T10:00:00.000Z"
}
```

Respuestas esperadas (`type`: `clarification`, `final_activity` o `error`):

```json
{
  "type": "final_activity",
  "message": "¡Aquí tienes la actividad diseñada!",
  "activity": {
    "title": "Aventura Matemática",
    "objective": "Resolver sumas simples.",
    "duration": "45 minutos",
    "steps": ["Paso 1", "Paso 2"],
    "adaptations": ["Usar colores visuales"],
    "assessment": ["Revisión cruzada"]
  }
}
```

El endpoint actual está definido en `src/App.tsx`. n8n debe aceptar CORS desde el dominio público de GitHub Pages.

## Desarrollo local
```bash
npm install
npm run dev
```

## Despliegue en GitHub Pages
La publicación queda automatizada mediante GitHub Actions.

- Cada `push` a `main` dispara build y deploy.
- También se puede ejecutar manualmente desde la pestaña Actions con `workflow_dispatch`.
- La URL esperada es `https://syagas-oss.github.io/edutechia/`.

### Cómo funciona
- `vite.config.ts` usa `base: '/edutechia/'` en producción.
- `.github/workflows/deploy-pages.yml` instala dependencias, ejecuta `npm run build`, sube `dist/` como artifact y despliega con `actions/deploy-pages`.
- GitHub Pages debe estar configurado con fuente `GitHub Actions`.

## Verificación rápida
```bash
npm run lint
npm run build
```
