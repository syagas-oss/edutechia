# EduTEchIA - Mentoria 5: escalado, seguridad y preparacion de tribunal

## 1. Resumen ejecutivo

EduTEchIA es una prueba de concepto de copiloto pedagogico con IA orientada a reducir la friccion de la planificacion docente. La solucion permite que un profesor describa una necesidad de aula y reciba una actividad estructurada, editable y exportable. Sobre esa actividad se activa un laboratorio de innovacion que revisa la propuesta desde diferentes angulos: debate pedagogico, prueba de estres en aula, vinculacion curricular LOMLOE, comunicacion para familias y critica de sesgos o puntos debiles.

La POC no pretende validar una salida comercial completa, sino demostrar que la IA aporta valor real en un proceso docente concreto: convertir una necesidad pedagogica abierta en una propuesta accionable, revisable y comunicable. La demo actual ya integra frontend, automatizacion, modelos generativos y mecanismos de resiliencia.

Arquitectura funcional actual:

```text
Docente
  -> Frontend React/Vite
    -> n8n
      -> proveedor IA primario / fallback local LM Studio
      -> respuesta normalizada
    -> tarjeta de actividad + laboratorio IA
```

Endpoints usados por la POC:

- `POST /webhook/teacher-assistant`: generacion principal de actividades.
- `POST /webhook/teacher-assistant-lab`: acciones del laboratorio de innovacion.

## 2. Guardarrailes implementados

### Separacion entre interfaz y motor IA

El frontend no debe llamar directamente a LM Studio ni a los modelos. Toda llamada de IA pasa por n8n. Esta decision evita exponer URLs, tokens o configuracion interna al navegador, reduce problemas de CORS y permite controlar validacion, logs, fallbacks y formato de salida desde una capa backend.

Responsabilidades separadas:

- Frontend: recoge contexto, envia payloads de negocio, renderiza respuestas y muestra errores comprensibles.
- n8n: valida entrada, normaliza campos, enruta acciones, construye payloads compatibles con los modelos, parsea respuestas y aplica fallbacks.
- Modelos IA: generan contenido, pero no definen el contrato publico de la aplicacion.

### Contratos estables

El flujo principal devuelve respuestas del tipo:

```json
{
  "type": "clarification | final_activity | error",
  "message": "texto visible para el docente",
  "activity": {},
  "missingFields": [],
  "profile": {}
}
```

El laboratorio devuelve:

```json
{
  "ok": true,
  "type": "expert_debate | stress_test | curriculum_mapping | parent_summary | critic_mirror",
  "data": {},
  "message": "Operation completed successfully."
}
```

Esto permite que el frontend no dependa de la estructura cruda del proveedor IA. Si cambia el modelo, el prompt o el proveedor, la interfaz puede mantenerse estable mientras n8n conserve el contrato.

### Validacion y normalizacion en n8n

Los workflows validan campos minimos antes de llamar al modelo. En el laboratorio se comprueba:

- `sessionId` no vacio.
- `action` informada.
- accion soportada.
- `activity.title` con contenido util.

Tambien se normalizan alias y formatos: `stage`, `subject`, `duration`, `level`, `nivel`, `etapa`, `asignatura`, `duracion`, pasos, evaluacion y recursos. Esto reduce errores por variaciones naturales en el lenguaje del usuario o en la respuesta del modelo.

### Fallbacks y degradacion controlada

La POC contempla escenarios donde el proveedor IA no responde, devuelve contenido vacio o genera JSON invalido. En esos casos, n8n responde con un fallback controlado en lugar de romper la experiencia.

Estados tecnicos observados en los contratos y tipos:

- `gemini_ok`: proveedor primario responde correctamente.
- `gemini_failed_lmstudio_ok`: el primario falla y LM Studio responde correctamente.
- `both_failed_degraded`: fallan los proveedores y se devuelve contenido degradado.
- `lmstudio_ok`: LM Studio responde correctamente en flujos locales.
- `lmstudio_failed` o `degraded_fallback`: fallo controlado con respuesta degradada.

El frontend muestra avisos cuando `usedFallback` es verdadero, de forma que el docente sabe que la respuesta debe revisarse con mas cuidado.

### Parseo robusto y errores legibles

La solucion incluye parseo tolerante de JSON para casos comunes de modelos generativos: cercos Markdown, texto adicional, arrays u objetos embebidos. Si el parseo falla, el sistema no expone stacktraces ni HTML: devuelve mensajes controlados y diagnosticos tecnicos limitados.

### Supervision humana

EduTEchIA no toma decisiones docentes autonomas. Propone actividades y analisis, pero la decision final queda en manos del profesor. Este guardarrail es especialmente importante en contexto educativo: la IA actua como copiloto, no como autoridad pedagogica.

## 3. Seguridad, compliance y riesgos

### Datos y privacidad

La POC trabaja con informacion de planificacion docente: etapa, asignatura, duracion, instrucciones y actividad generada. Para escalar a un centro real, la regla sera minimizar datos personales y evitar introducir informacion identificable de alumnos salvo que exista base legal, consentimiento y un tratamiento claramente definido.

Medidas recomendadas para piloto:

- No pedir nombres de alumnos ni datos sensibles.
- Usar identificadores de sesion anonimos.
- Limitar logs de payload completo.
- Registrar solo metadatos operativos: `sessionId`, accion, timestamp, estado del proveedor y errores tecnicos.
- Definir politica de retencion de historiales.

### Gestion de secretos

En la POC existen configuraciones de proveedor y endpoints dentro de workflows y variables de entorno. Para produccion, las claves deberian moverse a credenciales n8n, variables de entorno protegidas o gestor de secretos. No deben quedar tokens operativos en JSON exportado ni en el frontend.

### Exposicion de LM Studio

LM Studio se usa como proveedor local o fallback a traves de n8n. Si se expone mediante Cloudflare Tunnel, el endpoint debe protegerse con token, Cloudflare Access o un mecanismo equivalente. Un tunnel sin proteccion real puede permitir consumo no autorizado del modelo local.

### Prompt injection y contenido inseguro

Riesgo: un usuario podria intentar forzar al sistema a ignorar instrucciones, devolver datos internos o alterar el formato. Mitigacion:

- Mantener prompts de sistema en n8n, no en cliente.
- Validar salidas por estructura antes de renderizar.
- No confiar en el texto del modelo como fuente de verdad.
- Rechazar acciones no soportadas.
- Evitar incluir secretos o configuracion interna dentro de prompts.

### Riesgos pedagogicos y eticos

Riesgos principales:

- Actividades atractivas pero con bajo aprendizaje real.
- Sesgos por etapa, nivel, necesidades educativas o contexto socioeconomico.
- Exceso de confianza del docente en una salida generada.
- Mapeos curriculares incompletos o demasiado genericos.

Mitigaciones ya contempladas en la POC:

- IA Espejo para detectar sesgos, placebo pedagogico y puntos ciegos.
- Simulacro de Estres para anticipar fricciones reales de aula.
- Gemelo Curricular LOMLOE como apoyo, no como certificacion legal.
- Exportacion/copiar/imprimir para facilitar revision humana fuera del sistema.

## 4. Escalado de la solucion

### Fase 1: POC actual

Objetivo: demostrar que el circuito funciona de extremo a extremo.

Incluye:

- Frontend React/Vite.
- Persistencia local de sesion en navegador.
- n8n como backend de automatizacion.
- Workflows de chat y laboratorio.
- LM Studio como proveedor local/fallback.
- Runbooks de reinicio y troubleshooting.
- Contrato documentado `frontend -> n8n -> LM Studio`.

### Fase 2: piloto controlado en centro educativo

Duracion orientativa: 4 a 8 semanas.

Alcance recomendado:

- 5 a 15 docentes.
- 2 o 3 asignaturas.
- Uso sobre planificacion de actividades, no evaluacion automatizada de alumnos.
- Recogida de feedback cualitativo y tiempos estimados ahorrados.
- Revision manual de todas las actividades antes de aplicarlas en aula.

Cambios necesarios:

- Autenticacion basica de usuarios.
- Persistencia centralizada de sesiones y actividades.
- Panel de administracion simple.
- Politica de datos y consentimiento.
- Monitorizacion de errores y latencia.
- Versionado de prompts y workflows.

### Fase 3: despliegue organizativo

Objetivo: convertir la POC en servicio interno estable.

Arquitectura objetivo:

```text
Frontend web desplegado
  -> API/backend controlado o n8n gestionado
    -> proveedor LLM primario
    -> fallback alternativo
    -> base de datos
    -> logs/observabilidad
    -> panel admin
```

Decisiones de escalado:

- Mantener n8n para orquestacion si el equipo necesita iterar rapido.
- Migrar parte de la logica a backend propio si crecen volumen, permisos, auditoria o versionado.
- Sustituir tunnels temporales por endpoints estables y protegidos.
- Definir entornos separados: desarrollo, demo, piloto y produccion.
- Introducir evaluacion automatizada de calidad de salida con datasets de prueba.

### Equipo necesario

Para pasar de POC a piloto:

- Product owner educativo: prioriza casos de uso y valida valor docente.
- Responsable pedagogico: revisa calidad, adecuacion LOMLOE y limites de uso.
- Ingeniero frontend/full-stack: mantiene interfaz, contratos y despliegue.
- Especialista n8n/automatizacion: versiona workflows y fallbacks.
- Responsable de seguridad/compliance: datos, permisos, retencion y proveedores.

Para produccion, se recomienda sumar soporte operativo y observabilidad.

## 5. Costes orientativos de escalado

Estos importes son estimaciones orientativas y dependen del proveedor, volumen de uso, politicas del centro y nivel de soporte. No son un presupuesto cerrado.

| Partida | POC/demo | Piloto pequeno | Produccion inicial |
| --- | ---: | ---: | ---: |
| Hosting frontend | 0-20 EUR/mes | 0-50 EUR/mes | 50-200 EUR/mes |
| n8n/automatizacion | 0-25 EUR/mes si local/free | 25-100 EUR/mes | 100-500 EUR/mes |
| Proveedor LLM | 0-50 EUR/mes | 50-300 EUR/mes | 300-2.000+ EUR/mes |
| Base de datos | 0-25 EUR/mes | 25-100 EUR/mes | 100-500 EUR/mes |
| Observabilidad/logs | 0-20 EUR/mes | 20-100 EUR/mes | 100-500 EUR/mes |
| Seguridad/compliance | esfuerzo interno | esfuerzo interno + revision | revision formal/proveedor |

Variables que mas impactan el coste:

- Numero de docentes activos.
- Numero de generaciones por docente.
- Longitud de prompts y respuestas.
- Uso de modelos premium frente a modelos pequenos/locales.
- Necesidad de historiales persistentes y auditoria.
- Nivel de soporte requerido.

Hipotesis de optimizacion:

- Cachear resultados o plantillas reutilizables.
- Usar modelos pequenos para tareas de clasificacion/validacion.
- Reservar modelos mas potentes para generacion principal o revisiones complejas.
- Mantener fallbacks degradados para no bloquear la experiencia.

## 6. Roadmap recomendado

### Corto plazo: antes del tribunal

- Congelar una version estable del workflow de produccion.
- Probar los dos endpoints con casos representativos.
- Preparar una demo con una actividad educativa concreta.
- Tener listo un plan B si falla el proveedor IA durante la presentacion.
- Revisar que no se muestren tokens, URLs sensibles o logs internos en pantalla.

### Medio plazo: piloto

- Incorporar login y roles basicos.
- Persistir actividades en base de datos.
- Crear biblioteca de actividades generadas y revisadas.
- Medir satisfaccion docente y tiempo percibido ahorrado.
- Documentar prompts, versiones y criterios de calidad.

### Largo plazo: producto interno

- Panel de analitica para coordinadores pedagogicos.
- Evaluaciones de calidad por etapa/asignatura.
- Integracion con LMS o herramientas del centro.
- Politicas avanzadas de privacidad, retencion y auditoria.
- Observabilidad completa de coste, latencia, errores y uso por modulo.

## 7. Aprendizajes y conclusiones

### Aprendizajes tecnicos

- Una POC de IA no es solo prompt engineering: necesita contratos, validacion, fallbacks y operacion.
- n8n permite iterar rapido y visualizar el flujo, pero requiere disciplina de versionado y documentacion.
- El frontend debe consumir respuestas de negocio, no respuestas crudas de modelos.
- Los modelos fallan de formas previsibles: JSON invalido, respuesta vacia, timeout o formato inesperado.
- La degradacion controlada es mejor que una demo rota, siempre que se comunique al usuario.

### Aprendizajes pedagogicos

- La IA aporta mas valor cuando se integra en un flujo docente concreto.
- Generar una actividad no es suficiente: hay que revisarla, estresarla, adaptarla y explicarla.
- El laboratorio de innovacion convierte la salida generativa en una conversacion pedagogica mas rica.
- La supervision docente es parte del diseno, no una capa externa.

### Conclusion

EduTEchIA demuestra que una arquitectura ligera puede convertir IA generativa, automatizacion y una interfaz web en una POC docente funcional. La solucion es viable para una demo real y tiene una ruta razonable hacia piloto, siempre que el escalado incorpore seguridad, privacidad, gestion de costes, observabilidad y revision pedagogica continua.
