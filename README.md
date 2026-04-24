# EduTEchIA - Laboratorio de Innovacion Pedagogica 4.0

**EduTEchIA** es un ecosistema orientado a transformar la planificacion docente mediante IA. El frontend genera actividades con ayuda de `n8n` y expone un laboratorio de analisis pedagogico sobre cada actividad.

## Caracteristicas

### Laboratorio de innovacion

- **Consejo de Sabios**: debate pedagogico multiagente.
- **Simulacro de Estres**: deteccion de puntos de friccion en aula.
- **Gemelo Curricular LOMLOE**: vinculacion al marco legal espanol.
- **Zero Jargon (Padres)**: traduccion de la actividad a lenguaje familiar.
- **IA Espejo**: critica de sesgos, placebo pedagogico y debilidades.

### Experiencia de usuario

- Dictado por voz.
- Exportacion para impresion y PDF.
- Persistencia de sesion en navegador.
- Interfaz visual con Motion y fondo de particulas.

## Stack tecnologico

- **Frontend:** React 18 + Vite
- **Estilos:** Tailwind CSS 4.0
- **Visuales:** Motion + tsParticles
- **Backend IA:** `n8n`
- **Proveedor de modelo:** `LM Studio`, consumido solo desde `n8n`

## Integracion de n8n

La aplicacion usa `n8n` como backend unico para IA:

- `POST /webhook/teacher-assistant` para la generacion principal de actividades.
- `POST /webhook/teacher-assistant-lab` para los modulos del laboratorio de innovacion.
- Export del chat principal: `n8n/Teacher Assistant Conversational Flow.json`
- Export del laboratorio: `n8n/Teacher Assistant Lab Flow.json`

En produccion, el frontend no debe llamar directamente a `LM Studio`. Toda llamada debe seguir el circuito `frontend -> n8n -> LM Studio`.

### Contrato recomendado para laboratorio

```json
{
  "sessionId": "abc123",
  "action": "expert_debate",
  "activity": {
    "title": "Nombre",
    "objective": "Objetivo",
    "steps": ["Paso 1"]
  },
  "timestamp": "2026-04-24T20:00:00.000Z"
}
```

Respuesta esperada:

```json
{
  "ok": true,
  "type": "expert_debate",
  "data": [],
  "message": "Operation completed successfully."
}
```

Consulta `docs/n8n-lmstudio-contract.md` para la especificacion completa del flujo esperado.

## Instalacion y desarrollo

1. Instalar dependencias:

```bash
npm install
```

2. Crear `.env`:

```bash
VITE_N8N_CHAT_WEBHOOK_URL="https://n8n-i9qf.onrender.com/webhook/teacher-assistant"
VITE_N8N_LAB_WEBHOOK_URL="https://n8n-i9qf.onrender.com/webhook/teacher-assistant-lab"
```

3. Ejecutar en desarrollo:

```bash
npm run dev
```
