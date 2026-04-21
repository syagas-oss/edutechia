# EduTEchIA - Copiloto Pedagógico 4.0 🚀

**EduTEchIA** es un asistente conversacional avanzado diseñado para transformar la planificación docente mediante Inteligencia Artificial. No es solo un chatbot; es un motor de diseño curricular que entiende el contexto educativo y genera materiales listos para el aula.

## ✨ Características Principales

- **🧠 Inteligencia Adaptativa:** Capaz de procesar respuestas de IA complejas y variables gracias a una capa de normalización inteligente y renderizado dinámico de "Datos Adicionales".
- **🎙️ Interfaz Multimodal:** Soporta dictado por voz (Mic) para una interacción manos libres más natural para el docente.
- **📱 Experiencia PWA:** Instalable como aplicación en dispositivos móviles y escritorio, con soporte para modo offline básico.
- **📄 Exportación a PDF e Impresión:** Genera hojas de actividad limpias y profesionales con un solo clic, optimizadas para impresión física.
- **⚡ Feedback Táctil y Sonoro:** Respuesta inmediata mediante micro-vibraciones (hápticos) y sonidos sutiles para una mejor experiencia de usuario.
- **📊 Sistema de Bento-Grid:** Visualización estructurada de actividades pedagógicas (Objetivos, Dinámicas, Adaptaciones y Evaluación).
- **🔄 Persistencia Inteligente:** Gestión de sesiones local para no perder el hilo de la conversación.

## 🛠️ Stack Tecnológico

- **Frontend:** React 18 + Vite
- **Estilos:** Tailwind CSS (Arquitectura de paneles de cristal / Glassmorphism)
- **Animaciones:** Framer Motion (Transiciones espaciales y efectos de entrada)
- **Iconografía:** Lucide React
- **Notificaciones:** Sonner
- **Estado & Red:** Hooks de React + Webhook de n8n (o cualquier orquestador compatible)

## 🔌 Integración con IA (n8n)

La aplicación conversa con un flujo de trabajo de n8n mediante un webhook que centraliza la lógica pedagógica.

### Formato de Salida Esperado (JSON)
EduTEchIA es resiliente a las variaciones de la IA, pero el esquema óptimo incluye:

```json
{
  "type": "final_activity",
  "message": "Mensaje de la IA para el docente...",
  "activity": {
    "title": "Nombre de la Actividad",
    "objective": "Objetivo pedagógico central",
    "duration": "Tiempo estimado",
    "steps": ["Paso 1", "Paso 2"],
    "adaptations": ["Estrategias para necesidades especiales"],
    "assessment": ["Criterios de éxito"],
    "resources_required": ["Materiales"]
  }
}
```
*Si la IA envía campos extra (ej: `curiosidades`, `tips_pro`), EduTEchIA los mostrará automáticamente en la sección "Datos Adicionales".*

## 🚀 Instalación y Desarrollo

1. **Clonar e Instalar:**
   ```bash
   npm install
   ```

2. **Ejecutar en Desarrollo:**
   ```bash
   npm run dev
   ```

3. **Verificación de Tipos y Calidad:**
   ```bash
   npm run lint
   ```

## 📦 Despliegue

El proyecto está configurado para desplegarse automáticamente en **GitHub Pages** mediante GitHub Actions en cada `push` a la rama `main`.

- **PWA:** Los Service Workers se generan automáticamente para asegurar que la app se comporte como una aplicación nativa.
- **Asset Optimization:** Los assets se comprimen y minifican durante el proceso de build.

---
*Desarrollado con ❤️ para la comunidad educativa.*
