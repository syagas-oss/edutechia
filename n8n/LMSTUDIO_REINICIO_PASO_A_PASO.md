# LM Studio + n8n: arranque diario despues de reiniciar la PC

## Objetivo
Este documento es el checklist practico para volver a conectar tu modelo local con n8n cuando apagas y vuelves a encender la PC.

Aplica a tu configuracion actual:
- `n8n` remoto en Render
- `LM Studio` corriendo en tu PC
- `cloudflared` con Quick Tunnel (`trycloudflare.com`)
- fallback de `OpenRouter -> LM Studio`

## Estado actual del flujo
En el flujo JSON actual, el nodo `AI Config` usa estos valores base:

```js
lmStudioUrl: 'https://rating-paperbacks-estate-numeric.trycloudflare.com/v1/chat/completions'
lmModel: 'qwen3.5-2b'
```

Importante:
- La URL `trycloudflare.com` normalmente cambia cuando vuelves a levantar el tunnel.
- Por eso, despues de reiniciar, casi siempre tendras que actualizar `lmStudioUrl` en n8n.

## Lo que tienes que hacer cada vez que reinicias la PC

### 1. Abrir LM Studio
1. Abre `LM Studio`.
2. Carga el modelo que usas en el flujo.
3. Verifica que el modelo cargado siga siendo:

```text
qwen3.5-2b
```

Si cambias de modelo, luego tambien debes cambiar `lmModel` en `AI Config`.

### 2. Activar el servidor API local
En LM Studio:
1. Ve a la parte de servidor / API.
2. Confirma que esta activo el endpoint OpenAI-compatible.
3. Confirma que escucha en:

```text
http://127.0.0.1:1234
```

### 3. Probar LM Studio local
En PowerShell:

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://127.0.0.1:1234/v1/models"
```

Si esto falla:
- LM Studio no esta levantado
- el server API no esta activado
- o el puerto no es `1234`

### 4. Levantar Cloudflare Quick Tunnel
Abre una consola nueva de PowerShell y ejecuta:

```powershell
cloudflared tunnel --url http://127.0.0.1:1234
```

Te devolvera una URL parecida a esta:

```text
https://algo-random.trycloudflare.com
```

No cierres esa consola. Si la cierras, el tunnel cae.

### 5. Probar el tunnel remoto
Con la URL que te devuelva `cloudflared`, prueba:

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "https://TU-URL.trycloudflare.com/v1/models"
```

Si esto responde, el tunnel esta funcionando bien.

### 6. Actualizar la URL en n8n
En n8n:
1. Abre cada workflow que llame a LM Studio.
2. Abre el nodo `AI Config` en:
   - `Teacher Assistant Conversational Flow`
   - `Teacher Assistant Lab Flow`
3. Cambia:

```js
lmStudioUrl: 'https://URL-VIEJA.trycloudflare.com/v1/chat/completions'
```

por:

```js
lmStudioUrl: 'https://TU-URL-NUEVA.trycloudflare.com/v1/chat/completions'
```

Si el modelo cambio, actualiza tambien:

```js
lmModel: 'qwen3.5-2b'
```

### 7. Guardar y activar el workflow
1. Guarda el workflow.
2. Confirma que sigue activo.
3. Si estas probando fallback, deja `openrouterKey` invalida temporalmente.

Ejemplo de prueba de fallback:

```js
openrouterKey: 'sk-test-invalid'
```

Cuando termines las pruebas, vuelve a poner la real.

## Pruebas recomendadas

### A. Probar LM Studio directamente por el tunnel
Usa este comando:

```powershell
$lmBody = @{
  model = "qwen3.5-2b"
  messages = @(
    @{
      role = "user"
      content = 'Responde solo con un JSON valido: {"message":"ok"}'
    }
  )
  temperature = 0.2
} | ConvertTo-Json -Depth 10

$response = Invoke-RestMethod `
  -Method Post `
  -Uri "https://TU-URL.trycloudflare.com/v1/chat/completions" `
  -ContentType "application/json" `
  -Body $lmBody

$response | ConvertTo-Json -Depth 10
```

Si esto funciona, LM Studio + tunnel estan bien.

### B. Probar el webhook de n8n
Ejemplo de prueba del webhook:

```powershell
$body = @{
  sessionId = "test-lm-fallback-01"
  message   = "Soy docente de 5o de primaria. Necesito una actividad de matematicas sobre fracciones para 45 minutos, trabajo en parejas y con material concreto."
  timestamp = "2026-04-22T09:00:00Z"
} | ConvertTo-Json

$response = Invoke-RestMethod `
  -Method Post `
  -Uri "https://n8n-i9qf.onrender.com/webhook/teacher-assistant" `
  -ContentType "application/json" `
  -Body $body

$response | ConvertTo-Json -Depth 10
```

Resultado esperado segun el caso:
- `openrouter_ok`: esta respondiendo OpenRouter
- `openrouter_failed_lm_ok`: OpenRouter fallo y LM Studio entro bien
- `both_failed_degraded`: fallaron ambos

## Donde hacer cambios

### En LM Studio
Cambias:
- modelo cargado
- puerto si no usas `1234`

### En `cloudflared`
No cambias nada estructural si sigues con Quick Tunnel.
Solo vuelves a ejecutar:

```powershell
cloudflared tunnel --url http://127.0.0.1:1234
```

### En n8n, nodo `AI Config`
Normalmente solo cambias:

```js
lmStudioUrl: 'https://TU-URL-NUEVA.trycloudflare.com/v1/chat/completions'
lmModel: 'qwen3.5-2b'
```

Opcionalmente para probar fallback:

```js
openrouterKey: 'sk-test-invalid'
```

Luego lo devuelves a tu key real.

## Checklist rapido diario
1. Abrir `LM Studio`
2. Cargar `qwen3.5-2b`
3. Confirmar API en `http://127.0.0.1:1234`
4. Probar `http://127.0.0.1:1234/v1/models`
5. Ejecutar `cloudflared tunnel --url http://127.0.0.1:1234`
6. Copiar la nueva URL `https://...trycloudflare.com`
7. Probar `https://...trycloudflare.com/v1/models`
8. Actualizar `lmStudioUrl` en cada `AI Config`
9. Guardar los workflows en n8n
10. Lanzar prueba al webhook del chat y al del laboratorio

## Problemas comunes

### `both_failed_degraded`
Significa:
- OpenRouter fallo
- y LM Studio no entro correctamente

Revisar:
- LM Studio abierto
- modelo cargado
- API activa
- `cloudflared` corriendo
- `lmStudioUrl` actualizada en n8n
- `lmModel` correcta

### `The value in the "JSON Body" field is not valid JSON`
Eso indica un problema en la configuracion del nodo HTTP de n8n, no en LM Studio.

### `404 Not Found`
Si pasa contra LM Studio:
- probablemente la URL del tunnel cambio y n8n sigue apuntando a una vieja

### `401` o `403`
Si en algun momento agregas validacion real de token, revisa `lmStudioKey`.

## Recomendacion operativa
Mientras uses `Quick Tunnel`, asume que `lmStudioUrl` cambia en cada reinicio.

Si quieres dejar esto mas estable, el siguiente paso tecnico correcto es:
- usar un dominio propio en Cloudflare
- crear un tunnel persistente con hostname fijo

Eso elimina la necesidad de cambiar la URL en `AI Config` cada dia.
