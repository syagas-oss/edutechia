# Contrato de integracion `frontend -> n8n -> LM Studio`

## 1. Problema actual

El proyecto tiene hoy dos caminos distintos para IA:

- El chat principal de generacion de actividades usa `n8n`.
- Los modulos del laboratorio de innovacion llaman directamente desde el navegador a `LM Studio`.

Esa mezcla funciona mal en `GitHub Pages` por tres razones:

1. `GitHub Pages` es un hosting estatico y no aporta backend propio.
2. El navegador hace preflight `OPTIONS` cuando intenta llamar a `LM Studio` con `Authorization` y `Content-Type: application/json`.
3. `LM Studio` no debe ser consumido directamente desde cliente en produccion, ni por CORS ni por exposicion de URL/token.

Sintoma observado:

```text
Received request: OPTIONS to /v1/chat/completions
[google/gemma-4-e2b] 'messages' field is required
```

Interpretacion correcta:

- El navegador esta intentando hablar directo con `/v1/chat/completions`.
- La peticion `OPTIONS` no es una llamada valida de chat.
- El problema no es solo el prompt: el problema principal es de arquitectura y de contrato HTTP.

## 2. Arquitectura objetivo

Arquitectura aprobada:

```text
Frontend (GitHub Pages o localhost)
  -> n8n
    -> LM Studio
```

### Responsabilidades

#### Frontend

- Nunca llama directo a `LM Studio`.
- Solo envia payloads de negocio a `n8n`.
- Renderiza la respuesta normalizada de `n8n`.
- Muestra errores de forma legible sin asumir detalles internos del modelo.

#### n8n

- Recibe payloads del frontend.
- Valida campos obligatorios.
- Normaliza estructura y nombres.
- Decide el flujo segun `action`.
- Construye el payload OpenAI-compatible para `LM Studio`.
- Hace la llamada al modelo.
- Parsea la respuesta.
- Devuelve un contrato estable al frontend.
- Aplica fallbacks y manejo de errores.

#### LM Studio

- Solo recibe requests desde `n8n`.
- Siempre debe recibir `model` y `messages`.
- Nunca debe exponerse como dependencia directa del navegador en produccion.

## 3. Endpoints esperados de `n8n`

### 3.1 Chat principal

```text
POST /webhook/teacher-assistant
```

Mantiene el flujo actual de generacion de actividad docente.

### 3.2 Laboratorio IA

```text
POST /webhook/teacher-assistant-lab
```

Centraliza los modulos del laboratorio de innovacion.

## 4. Contrato de entrada del laboratorio

### 4.1 Request base

```json
{
  "sessionId": "string",
  "action": "expert_debate",
  "activity": {
    "title": "Actividad ejemplo",
    "objective": "Objetivo",
    "steps": ["Paso 1", "Paso 2"]
  },
  "timestamp": "2026-04-24T20:00:00.000Z",
  "context": {
    "stage": "Primaria",
    "subject": "Ciencias",
    "duration": "45 min"
  }
}
```

### 4.2 Campos obligatorios

- `sessionId`
- `action`
- `activity`
- `activity.title`

### 4.3 Campos opcionales

- `timestamp`
- `context`
- cualquier campo adicional dentro de `activity` que ayude al analisis

### 4.4 Acciones soportadas

- `expert_debate`
- `stress_test`
- `curriculum_mapping`
- `parent_summary`
- `critic_mirror`

### 4.5 Regla para acciones no soportadas

```json
{
  "ok": false,
  "type": "validation_error",
  "data": null,
  "message": "Unsupported lab action.",
  "error": {
    "code": "UNSUPPORTED_ACTION",
    "message": "The provided action is not supported by the lab workflow."
  }
}
```

## 5. Comportamiento esperado de `n8n`

### 5.1 Validacion

Antes de llamar a `LM Studio`, `n8n` debe comprobar:

- que exista `sessionId`
- que exista `action`
- que `activity` sea un objeto
- que `activity.title` tenga contenido util

Si falla la validacion, no se debe invocar al modelo.

### 5.2 Normalizacion

`n8n` debe:

- limpiar espacios
- tolerar aliases razonables si se introducen en el futuro
- asegurar que `activity.steps`, `activity.assessment`, `activity.resources_required` y similares tengan un formato consistente

### 5.3 Routing por accion

Regla:

- una accion = un prompt de sistema bien definido
- un formato de salida esperado
- un parseo/fallback coherente

### 5.4 Construccion del payload para `LM Studio`

Toda llamada a `LM Studio` debe salir de `n8n` con este shape minimo:

```json
{
  "model": "google/gemma-4-e2b",
  "messages": [
    {
      "role": "system",
      "content": "Instrucciones del modulo"
    },
    {
      "role": "user",
      "content": "Payload serializado o prompt final"
    }
  ],
  "temperature": 0.3,
  "stream": false
}
```

Reglas:

- `messages` es obligatorio siempre.
- `stream` debe ir en `false` salvo rediseño explicito.
- `n8n` es el unico responsable de `model`, `url`, `token` y timeouts.

### 5.5 Parseo de respuesta

Si se espera JSON:

- `n8n` debe intentar parsear primero la salida textual.
- Debe tolerar cercos Markdown tipo ```json.
- Debe intentar extraer el primer bloque JSON valido.

Si se espera Markdown:

- `n8n` puede devolver texto plano o Markdown tal cual.

### 5.6 Fallbacks

Si `LM Studio` falla por timeout, disponibilidad o formato:

- `n8n` debe responder error controlado, no HTML, no stacktrace, no body vacio.
- Si aplica, puede devolver una respuesta degradada por modulo.

## 6. Contrato de salida del laboratorio

### 6.1 Shape estandar

```json
{
  "ok": true,
  "type": "expert_debate",
  "data": [],
  "message": "Operation completed successfully."
}
```

Campos:

- `ok`
- `type`
- `data`
- `message`
- `error`

### 6.2 Error controlado estandar

```json
{
  "ok": false,
  "type": "provider_error",
  "data": null,
  "message": "LM Studio did not return a valid response.",
  "error": {
    "code": "LM_RESPONSE_INVALID",
    "message": "The provider response could not be parsed for this lab action."
  }
}
```

## 7. Matriz de acciones del laboratorio

### 7.1 `expert_debate`

Input esperado:

- `activity` completa o suficientemente descriptiva

Proceso esperado:

- pedir 3 perspectivas expertas
- devolver solo JSON

Output esperado:

```json
[
  {
    "expert": "Nombre",
    "role": "Perfil",
    "pros": "Aporte positivo",
    "cons": "Riesgo o critica"
  }
]
```

### 7.2 `stress_test`

Proceso esperado:

- identificar puntos criticos de aula
- asignar score
- devolver JSON

Output esperado:

```json
{
  "score": 85,
  "risks": [
    {
      "event": "Situacion critica",
      "probability": "Alta",
      "extinguisher": "Accion mitigadora"
    }
  ]
}
```

### 7.3 `curriculum_mapping`

Proceso esperado:

- mapear la actividad al marco LOMLOE
- devolver Markdown estructurado

Output esperado:

- `data` como `string`
- formato Markdown

### 7.4 `parent_summary`

Proceso esperado:

- traducir la actividad para familias
- eliminar jerga pedagogica
- devolver Markdown o texto claro

Output esperado:

- `data` como `string`

### 7.5 `critic_mirror`

Proceso esperado:

- detectar elefante en la habitacion
- detectar sesgo potencial
- detectar placebo pedagogico
- proponer mejora

Output esperado:

```json
{
  "elephant": "Problema principal",
  "bias": "Sesgo detectado",
  "placebo_effect": "Efecto placebo",
  "suggestion": "Siguiente mejora"
}
```

## 8. Compatibilidad con el frontend

Reglas:

- `n8n` debe devolver `application/json`
- el frontend no debe conocer la estructura cruda de `LM Studio`
- `data` debe contener directamente la carga lista para render
- `type` debe ser estable y coherente con `action`

Compatibilidad futura:

- si cambia el contrato, versionar con `v2` de endpoint o con `schemaVersion` en el body
- evitar cambios silenciosos en nombres de campos

## 9. Logging minimo recomendado en `n8n`

Loggear sin secretos:

- `sessionId`
- `action`
- timestamp de entrada
- si paso validacion o no
- si se llamo a `LM Studio`
- codigo de estado o error de proveedor
- si el parseo de salida fue exitoso

No loggear:

- tokens
- credenciales
- payload completo si contiene datos sensibles

## 10. Checklist para editar el JSON del flujo de `n8n`

- crear o ajustar el webhook `/teacher-assistant-lab`
- validar `sessionId`, `action` y `activity`
- enrutar por `action`
- construir payload con `messages`
- usar `model`, `url` y credenciales centralizadas
- parsear JSON cuando corresponda
- devolver siempre `{ ok, type, data, message, error? }`
- asegurar CORS correcto para `GitHub Pages` y localhost
- probar todos los modulos del laboratorio
- verificar que el navegador ya no haga requests a `/v1/chat/completions`

## 11. Criterios de aceptacion

La integracion se considera correcta cuando:

- el frontend solo llama a `n8n`
- `LM Studio` deja de recibir requests del navegador del usuario
- todas las llamadas a `LM Studio` incluyen `messages`
- cada accion del laboratorio devuelve un formato estable
- los errores de proveedor se ven como JSON controlado
- el equipo puede modificar el flujo de `n8n` usando este documento sin reinterpretar el frontend
