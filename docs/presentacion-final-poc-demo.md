# EduTEchIA - Guion para presentacion final y demo real

## 1. Objetivo de la presentacion

Presentar EduTEchIA como una POC funcional de IA aplicada a la planificacion docente. La exposicion debe demostrar tres ideas:

- Existe un problema real: planificar actividades de calidad consume tiempo y exige adaptar objetivos, recursos, evaluacion, diversidad y comunicacion.
- La POC funciona: el docente puede generar una actividad, revisarla y enriquecerla con modulos de analisis pedagogico.
- La solucion puede escalar: la arquitectura separa frontend, automatizacion, proveedores IA, fallbacks y guardarrailes.

Duracion total: 15 minutos.

## 2. Estructura recomendada de 15 minutos

| Tiempo | Bloque | Objetivo |
| ---: | --- | --- |
| 0:00-1:30 | Apertura y reto | Explicar el problema docente y por que tiene sentido aplicar IA. |
| 1:30-3:00 | Solucion | Presentar EduTEchIA y sus capacidades principales. |
| 3:00-5:00 | Arquitectura y proceso | Explicar como funciona sin entrar en exceso de detalle tecnico. |
| 5:00-10:30 | Demo real | Mostrar generacion de actividad y laboratorio de innovacion. |
| 10:30-12:30 | Guardarrailes | Seguridad, supervision humana, fallbacks y compliance. |
| 12:30-14:00 | Escalado | Roadmap de piloto, equipo, costes y arquitectura objetivo. |
| 14:00-15:00 | Cierre | Aprendizajes, valor generado y peticion de siguiente paso. |

## 3. Narrativa principal

### Mensaje de apertura

"EduTEchIA nace para ayudar al docente a pasar de una necesidad de aula a una actividad lista para revisar, adaptar y aplicar. No sustituye al profesor: le da una primera version estructurada y un laboratorio de analisis para mejorarla antes de llevarla al aula."

### Reto

Problema seleccionado:

- La planificacion docente requiere combinar curriculo, objetivos, tiempos, materiales, diversidad, evaluacion y comunicacion con familias.
- Muchas herramientas generativas producen texto util, pero no siempre generan una actividad estructurada, revisable y alineada con el uso real de aula.
- El reto de la POC es demostrar si la IA puede aportar valor en ese flujo de trabajo sin perder control pedagogico.

Valor esperado:

- Reducir tiempo de primera version.
- Mejorar calidad de revision pedagogica.
- Hacer explicitos riesgos, adaptaciones y criterios de evaluacion.
- Facilitar comunicacion con familias.
- Mantener siempre supervision docente.

## 4. Solucion EduTEchIA

EduTEchIA es un copiloto pedagogico con dos capas:

1. Generador de actividad docente.
2. Laboratorio de innovacion pedagogica sobre la actividad generada.

Funcionalidades visibles:

- Seleccion de etapa, asignatura y duracion.
- Entrada por texto o dictado de voz.
- Generacion de actividad estructurada.
- Tarjeta visual con objetivo, pasos, adaptaciones, evaluacion y recursos.
- Copia, impresion y exportacion a PDF mediante impresion del navegador.
- Persistencia local de la sesion.
- Modulos de laboratorio:
  - Consejo de Sabios.
  - Simulacro de Estres.
  - Gemelo Curricular LOMLOE.
  - Zero Jargon para familias.
  - IA Espejo.

## 5. Arquitectura explicada para tribunal

Version simple:

```text
Usuario docente
  -> EduTEchIA frontend
    -> n8n como backend IA
      -> modelos generativos / fallback
      -> respuesta normalizada
    -> actividad y analisis renderizados
```

Puntos clave:

- React/Vite construye la experiencia de usuario.
- n8n orquesta la logica de IA y evita que el navegador llame directamente a los modelos.
- LM Studio permite usar un modelo local o fallback controlado.
- El flujo de produccion contempla validacion, normalizacion, parseo robusto y respuestas degradadas.
- Los contratos HTTP permiten cambiar proveedores sin redisenar la interfaz.

Endpoints:

- `POST /webhook/teacher-assistant`: genera la actividad principal.
- `POST /webhook/teacher-assistant-lab`: ejecuta acciones del laboratorio.

Tecnologias usadas:

- Frontend: React, Vite, TypeScript.
- Estilos e interfaz: Tailwind CSS, Motion, lucide-react, tsParticles.
- Automatizacion IA: n8n.
- Modelos: proveedor IA configurado en n8n y fallback LM Studio.
- Operacion: Render/n8n remoto, Cloudflare Tunnel para LM Studio local cuando aplica.
- Persistencia: localStorage en frontend y persistencia Supabase prevista/soportada en workflow de produccion.

## 6. Demo script paso a paso

### Preparacion antes de presentar

Tener preparada una consigna educativa concreta. Ejemplo:

```text
Soy docente de 5o de Primaria. Necesito una actividad de Matematicas sobre fracciones equivalentes para 45 minutos. Quiero que sea colaborativa, con materiales sencillos y una forma rapida de evaluar si lo han entendido.
```

Comprobar antes:

- Frontend abre correctamente.
- Webhook principal responde.
- Webhook de laboratorio responde.
- LM Studio/tunnel/fallback estan preparados si se van a mencionar en vivo.
- No hay tokens ni secretos visibles.

### Paso 1: contexto inicial

Accion en demo:

- Seleccionar etapa: Primaria.
- Seleccionar asignatura: Matematicas.
- Seleccionar duracion: 45 min.
- Escribir o dictar la consigna.

Mensaje al tribunal:

"Aqui el docente no esta rellenando un formulario largo. Introduce contexto minimo y una necesidad real de aula."

### Paso 2: generacion de actividad

Accion en demo:

- Enviar la peticion.
- Esperar respuesta del asistente.
- Mostrar la tarjeta generada.

Elementos a destacar:

- Titulo de la actividad.
- Objetivo central.
- Dinamica paso a paso.
- Adaptaciones.
- Evaluacion.
- Recursos.
- Duracion.

Mensaje al tribunal:

"La IA no devuelve un bloque de texto plano, sino una estructura pedagogica renderizable y accionable."

### Paso 3: acciones utiles para docente

Accion en demo:

- Mostrar copiar actividad.
- Mostrar impresion/exportacion PDF.
- Explicar persistencia local de la sesion.

Mensaje al tribunal:

"La POC intenta cerrar el ultimo tramo operativo: que el docente pueda llevarse la actividad, editarla o compartirla."

### Paso 4: Consejo de Sabios

Accion en demo:

- Pulsar `Sabios`.
- Mostrar tres perspectivas expertas con pros y riesgos.

Mensaje al tribunal:

"No solo generamos; tambien hacemos que la actividad dialogue con criterios pedagogicos distintos."

### Paso 5: Simulacro de Estres

Accion en demo:

- Pulsar `Estres`.
- Mostrar indice de estres, puntos criticos y protocolos de mitigacion.

Mensaje al tribunal:

"Este modulo anticipa que puede fallar en el aula: consignas poco claras, gestion de tiempo, materiales o ritmos distintos."

### Paso 6: Gemelo Curricular LOMLOE

Accion en demo:

- Pulsar `Curriculo`.
- Mostrar el Markdown de vinculacion curricular.

Mensaje al tribunal:

"No lo presentamos como certificacion legal automatica. Es una ayuda para que el docente revise encaje curricular y complete criterios."

### Paso 7: Zero Jargon para familias

Accion en demo:

- Pulsar `Padres`.
- Mostrar resumen claro para familias.

Mensaje al tribunal:

"La misma actividad se traduce a lenguaje comprensible para casa, reduciendo jerga pedagogica."

### Paso 8: IA Espejo

Accion en demo:

- Pulsar `Espejo`.
- Mostrar elefante en la habitacion, sesgo potencial, placebo pedagogico y sugerencia.

Mensaje al tribunal:

"Este es uno de los guardarrailes pedagogicos: la IA tambien se usa para cuestionar la salida de la propia IA."

### Paso 9: fallback si aparece

Si durante la demo aparece aviso de respuesta degradada:

Mensaje recomendado:

"Esto forma parte del diseno de resiliencia. Si el proveedor no devuelve una respuesta valida, el sistema no se cae: informa al docente y devuelve una salida controlada que debe revisarse con mas cuidado."

Si no aparece:

"El sistema esta preparado para escenarios de fallo mediante estados de proveedor y fallback controlado, aunque en esta ejecucion no se ha activado."

## 7. Guardarrailes para explicar en 2 minutos

Guardarrailes tecnicos:

- El frontend no llama directamente a LM Studio.
- n8n valida entrada antes de llamar al modelo.
- Las acciones del laboratorio estan cerradas a una lista permitida.
- La salida se parsea y normaliza antes de llegar a la interfaz.
- Los errores se devuelven como JSON controlado.
- Existen fallbacks y estados de proveedor visibles.

Guardarrailes pedagogicos:

- El docente siempre revisa y decide.
- IA Espejo detecta sesgos y debilidades.
- Simulacro de Estres anticipa problemas de aula.
- Gemelo Curricular ayuda a revisar alineacion, no reemplaza criterio profesional.
- Zero Jargon adapta comunicacion, no automatiza relacion con familias.

Guardarrailes de privacidad:

- En piloto se debe evitar introducir datos personales de alumnos.
- Sesiones con identificadores anonimos.
- Logs minimos sin secretos ni informacion sensible.
- Gestion de claves fuera del frontend.

## 8. Escalado y business case

### Escalado por fases

Fase POC:

- Validar tecnologia y valor pedagogico.
- Probar flujos principales.
- Preparar demo y documentacion.

Fase piloto:

- 5 a 15 docentes.
- 2 o 3 asignaturas.
- 4 a 8 semanas.
- Actividades revisadas siempre por docentes.
- Medicion cualitativa de utilidad, ahorro de tiempo percibido y calidad de salida.

Fase organizativa:

- Autenticacion.
- Persistencia centralizada.
- Panel admin.
- Observabilidad.
- Versionado de prompts.
- Integracion con herramientas del centro.

### Costes orientativos

No son presupuesto cerrado. Son rangos para dimensionar:

- Hosting frontend: 0-50 EUR/mes en POC o piloto pequeno.
- n8n: 0-100 EUR/mes segun plan y despliegue.
- Proveedor LLM: 50-300 EUR/mes en piloto pequeno, variable por volumen.
- Base de datos: 0-100 EUR/mes en piloto.
- Observabilidad: 0-100 EUR/mes al inicio.
- Seguridad/compliance: principalmente esfuerzo interno en piloto; revision formal si pasa a produccion.

### Equipo minimo para piloto

- Responsable pedagogico.
- Product owner del caso de uso.
- Ingeniero frontend/full-stack.
- Especialista n8n/automatizacion.
- Responsable de seguridad/compliance.

## 9. Aprendizajes del proceso

Aprendizajes principales:

- La IA generativa necesita arquitectura alrededor: contratos, validacion, fallbacks y observabilidad.
- La calidad de la demo depende tanto del flujo como del modelo.
- n8n acelera la iteracion, pero exige documentar y versionar los workflows.
- Una actividad generada gana valor cuando se revisa desde inclusion, evaluacion, curriculo, familias y riesgos de aula.
- El mejor posicionamiento de la solucion es copiloto docente, no sustituto del criterio profesional.

## 10. Cierre recomendado

Mensaje final:

"EduTEchIA demuestra que se puede construir una POC real de IA educativa con una arquitectura ligera, modular y escalable. Hemos validado el flujo completo: el docente plantea una necesidad, la IA genera una actividad estructurada, el laboratorio la revisa desde distintos angulos y el sistema incorpora guardarrailes tecnicos y pedagogicos. El siguiente paso natural es un piloto controlado con docentes reales, midiendo utilidad, calidad de salida y condiciones de escalado."

Ultima frase corta:

"No hemos construido solo un generador de actividades: hemos construido un entorno de revision pedagogica asistida por IA."

## 11. Checklist de ensayo

- La demo cabe en 5 minutos.
- La presentacion completa cabe en 15 minutos.
- Hay una consigna preparada por si falla el dictado.
- Hay capturas o salida previa por si falla internet o proveedor IA.
- No se muestran secretos ni URLs sensibles.
- Se explica claramente que es POC, no producto final.
- Se mencionan seguridad, escalado y costes como hipotesis razonadas.
- El cierre pide piloto controlado como siguiente paso.
