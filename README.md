# Docente AI - Asistente Pedagógico (PoC)

Esta es una Prueba de Concepto (PoC) web estática desarrollada con React, Vite y Tailwind CSS. Está diseñada para integrarse con un pipeline de automatización impulsado por n8n para la creación de actividades pedagógicas adaptadas.

## Requisitos Cumplidos
- 💬 **Interfaz Conversacional**: Layout limpio e intuitivo para chatear con el asistente.
- 🎙️ **Reconocimiento de Voz**: Botón de dictado que utiliza la Web Speech API en navegadores soportados.
- 💾 **Persistencia Local**: Manejo transparente de `sessionId` e historial usando `localStorage`.
- 🎨 **Renderizado Inteligente**: Tarjeta visual dinámica para presentar los datos estructurados obtenidos mediante webhook, incluyendo exportación por portapapeles.
- ⚡ **Despliegue Simple**: Aplicación estática SPA sin necesidad de base de datos dedicada. Todo el procesamiento transcurre en n8n.

## Funcionamiento del Webhook
La app hace un POST con formato JSON a n8n cuando se envía un mensaje:

```json
{
  "sessionId": "session_xxx_123",
  "message": "Quiero una actividad de álgebra para primaria...",
  "timestamp": "2024-03-24T10:00:00.000Z"
}
```

Espera respuestas con esta estructura (`type` puede ser `clarification`, `final_activity` o `error`):

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

## Configuración y Despliegue en GitHub Pages

Dado que la web no necesita backend, puedes alojarla de forma completamente grauita en GitHub Pages.

**1. Configuración del Endpoint n8n**
Edita la constante `N8N_WEBHOOK_URL` en `src/App.tsx`.
*Importante*: Tu entorno de n8n debe tener habilitadas las cabeceras **CORS** para aceptar peticiones web procedentes de tu dominio de GitHub Pages.

**2. Configuración en Vite.config.ts**
Si tu repositorio se llama `ai-challenge-docente`, abre `vite.config.ts` y añade la propiedad `base` indicando el repo:
```typescript
export default defineConfig({
  base: '/ai-challenge-docente/',
  // ... resto de tu config
})
```

**3. Testeo Local**
Para ejecutar la aplicación localmente:
```bash
npm install
npm run dev
```

**4. Build Manual para GH Pages**
Puedes hacer un despliegue rápido usando la compilación estática.
```bash
npm run build
npx gh-pages -d dist
```

*(Opcional y altamente recomendado: Usa una GitHub Action oficial de Vite para despliegue automatizado).*
