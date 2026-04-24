# EduTEchIA - Laboratorio de Innovación Pedagógica 4.0 🚀

**EduTEchIA** es un ecosistema avanzado diseñado para transformar la planificación docente mediante Inteligencia Artificial disruptiva. Más allá de un chatbot, es un motor de diseño curricular que integra auditoría pedagógica, estrés de aula y alineación legal automatizada.

## ✨ Características Premium & Innovación

### 🧪 Laboratorio de Innovación (Gemini Powered)
Suite de herramientas disruptivas para elevar la calidad de cada actividad:
- **Consejo de Sabios**: Debate pedagógico multi-agente donde expertos virtuales (Piaget, Vygotsky, Robinson) auditan tu propuesta.
- **Simulacro de Estrés**: Identificación de puntos de fricción reales en el aula y generación de protocolos de respuesta inmediata.
- **Gemelo Curricular LOMLOE**: Traducción profunda de la actividad al marco legal español, mapeando competencias y criterios.
- **Zero Jargon (Padres)**: Traducción de la jerga pedagógica a un lenguaje cálido y directo para la comunicación con familias.
- **IA Espejo (Anti-Agent)**: Crítica radical que detecta sesgos, "efectos placebo" y debilidades ocultas en la propuesta.

### 💎 Diseño Luxury & Experiencia de Usuario
- **Sistema Background de Partículas**: Fondo dinámico con tsparticles y orbes de luz para una atmósfera premium.
- **Interfaz Neuro-Adaptativa**: Feedback visual (glow adaptativo) cuando la IA detecta patrones de aprendizaje disruptivo.
- **Arquitectura de Cristal (Glassmorphism)**: Paneles con efectos de brillo, shimmer y desenfoque de alta fidelidad.
- **Responsive Mastery**: Maquetación optimizada para máxima densidad en pantallas ultra-wide y rejilla adaptable en móviles.

### 🎙️ Funcionalidades Core
- **Interacción Multimodal**: Dictado por voz (Mic) integrado para una entrada de datos natural.
- **Exportación Profesional**: Sistema optimizado de impresión y PDF para materiales listos para el aula.
- **Persistencia Inteligente**: Gestión de sesiones local para recuperación inmediata de hilos de trabajo.

## 🛠️ Stack Tecnológico

- **Frontend:** React 18 + Vite
- **Estilos:** Tailwind CSS 4.0 + Custom Design System
- **Inteligencia Artificial:** Google Gemini AI SDK (Gemini 3 Flash Preview)
- **Visuales & Efectos:** Motion (react-motion) + tsParticles
- **Orquestación:** Webhook de n8n para generación de contenido base

## 🔌 Integración de n8n
La aplicación consulta un flujo de n8n que centraliza la lógica pedagógica inicial:

```json
{
  "type": "final_activity",
  "message": "Mensaje de la IA...",
  "activity": {
    "title": "Nombre",
    "objective": "Objetivo",
    "steps": ["Paso 1"],
    "adaptations": ["Estrategias"],
    "assessment": ["Criterios"]
  }
}
```

## 🚀 Instalación y Desarrollo

1. **Instalar Dependencias:**
   ```bash
   npm install
   ```
2. **Configurar Entorno:**
   - Crear `.env` con `GEMINI_API_KEY`.
3. **Desarrollo:**
   ```bash
   npm run dev
   ```

---
*Desarrollado con ❤️ para potenciar la educación del siglo XXI.*
