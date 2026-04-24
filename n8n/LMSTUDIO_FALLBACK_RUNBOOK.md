# OpenRouter -> LM Studio Fallback (n8n + Cloudflare Tunnel)

## 1) Objetivo
Este documento describe:
- Configuración inicial (primera vez) para exponer LM Studio local con Cloudflare Tunnel.
- Cómo usar el flujo n8n ya modificado con fallback automático:
  - `openrouter_ok`
  - `openrouter_failed_lm_ok`
  - `both_failed_degraded`
- Operación diaria y troubleshooting.

## 2) Requisitos
- PC local con LM Studio.
- `cloudflared` instalado en la PC local.
- Dominio gestionado en Cloudflare (o subdominio disponible).
- n8n en Render con el flujo actualizado.

## 3) Configuración primera vez (setup)

### 3.1 Levantar LM Studio API local
1. Abrir LM Studio.
2. Cargar el modelo local que usarás en fallback.
3. Activar servidor API (OpenAI-compatible) en puerto local (por ejemplo `1234`).
4. Verificar local:

```powershell
curl http://127.0.0.1:1234/v1/models
```

### 3.2 Crear Cloudflare Tunnel
1. Autenticar cloudflared:

```powershell
cloudflared tunnel login
```

2. Crear túnel:

```powershell
cloudflared tunnel create lmstudio-n8n
```

3. Crear DNS del túnel (ejemplo):

```powershell
cloudflared tunnel route dns lmstudio-n8n lmstudio-tu-dominio.com
```

4. Crear config de cloudflared (`config.yml`) en tu PC, ejemplo:

```yaml
tunnel: lmstudio-n8n
credentials-file: C:\Users\TU_USUARIO\.cloudflared\<TUNNEL_ID>.json
ingress:
  - hostname: lmstudio-tu-dominio.com
    service: http://localhost:1234
  - service: http_status:404
```

5. Ejecutar túnel:

```powershell
cloudflared tunnel run lmstudio-n8n
```

### 3.3 Proteger el endpoint
Opciones recomendadas:
- Cloudflare Access (JWT/service token), o
- Bearer token en tu reverse layer.

En el flujo quedó el header:
- `Authorization: Bearer <lmStudioKey>`

Debes configurar el backend expuesto para validar ese token si quieres seguridad real.

### 3.4 Ajustar valores en el flujo n8n
En cada workflow exportado que vaya a usar LM Studio:
- `Teacher Assistant Conversational Flow.json`
- `Teacher Assistant Lab Flow.json`

En el nodo `AI Config` dentro de cada flujo:
- `lmStudioUrl`: `https://lmstudio-tu-dominio.com/v1/chat/completions`
- `lmStudioKey`: token real
- `lmModel`: modelo local real cargado en LM Studio
- (Opcional) actualizar `openrouterKey`

### 3.5 Importar/activar flujo
1. Importar los JSON actualizados en n8n.
2. Verificar que el workflow esté activo.
3. Ejecutar prueba manual al webhook del chat y al del laboratorio.

## 4) Validación funcional

### 4.1 Caso normal (OpenRouter ok)
- Esperado: `response_payload.aiProviderStatus = openrouter_ok`

### 4.2 Forzar fallback LM Studio
- Invalidar temporalmente `openrouterKey` en `AI Config`.
- Esperado: `response_payload.aiProviderStatus = openrouter_failed_lm_ok`

### 4.3 Forzar fallo doble
- Mantener OpenRouter inválido y apagar túnel o LM Studio.
- Esperado: `response_payload.aiProviderStatus = both_failed_degraded`
- El webhook debe responder JSON válido (sin romper frontend).

## 5) Operación futura (runbook)

### 5.1 Antes de empezar jornada
1. Abrir LM Studio y cargar modelo.
2. Iniciar túnel:

```powershell
cloudflared tunnel run lmstudio-n8n
```

3. Health check rápido:

```powershell
curl https://lmstudio-tu-dominio.com/v1/models
```

4. Ejecutar un test corto al webhook de n8n.

### 5.2 Monitoreo
Revisar en respuestas de n8n:
- `response_payload.aiProviderStatus`

Interpretación:
- `openrouter_ok`: primario funcionando.
- `openrouter_failed_lm_ok`: fallback activo (OpenRouter caído o degradado).
- `both_failed_degraded`: ambos no disponibles; respuesta degradada.

### 5.3 Parada
1. Detener `cloudflared`.
2. Cerrar LM Studio o descargar modelo para liberar recursos.

## 6) Troubleshooting

### 401/403
- Token inválido o header Authorization ausente.
- Revisar `lmStudioKey` y mecanismo de validación.

### Timeout
- Modelo local muy pesado/saturado.
- PC en suspensión.
- Túnel inestable.

### 5xx
- `cloudflared` detenido.
- LM Studio API no escuchando en `localhost:1234`.

### Respuesta vacía/no JSON
- Modelo local no adecuado para instrucciones JSON.
- Ajustar prompt/modelo en `AI Config` / nodos LLM.

## 7) Nota de seguridad
Actualmente el flujo mantiene secretos en el JSON por decisión explícita.
Recomendación futura: mover claves a credenciales n8n o variables de entorno en Render.
