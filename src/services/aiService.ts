import { Activity } from "./types";

const LM_STUDIO_URL = 'https://realtor-employee-cafe-offshore.trycloudflare.com/v1/chat/completions';
const LM_STUDIO_KEY = 'CHANGE_ME_LM_STUDIO_TOKEN';
const LM_MODEL = 'google/gemma-4-e2b';

async function callLMStudio(prompt: string, jsonMode: boolean = false) {
  try {
    const response = await fetch(LM_STUDIO_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LM_STUDIO_KEY}`
      },
      body: JSON.stringify({
        model: LM_MODEL,
        messages: [
          { role: "system", content: "Eres un experto pedagogo altamente capacitado. Responde siempre en el formato solicitado." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        ...(jsonMode && { response_format: { type: "json_object" } })
      })
    });

    if (!response.ok) {
      throw new Error(`LM Studio Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("LM Studio API Call failed:", error);
    throw error;
  }
}

export const aiService = {
  async getExpertDebate(activity: Activity) {
    const prompt = `Analiza esta actividad pedagógica:
    Título: ${activity.title}
    Objetivo: ${activity.objective}
    Pasos: ${activity.steps?.join(', ')}
    
    Genera un debate entre 3 expertos:
    1. Una experta en pedagogía creativa.
    2. Un especialista en neurodiversidad.
    3. Un director de escuela pragmático.
    
    Responde estrictamente en formato JSON como un array de objetos con las llaves exactamente así: [{"expert": "...", "role": "...", "pros": "...", "cons": "..."}]`;

    const response = await callLMStudio(prompt, true);
    return JSON.parse(response);
  },

  async getStressTest(activity: Activity) {
    const prompt = `Actúa como un simulador de aula de alto estrés. Analiza los riesgos de esta actividad:
    ${JSON.stringify(activity)}
    
    Identifica 3 puntos críticos donde la clase podría descontrolarse.
    Calcula un score de 0 a 100.
    Responde estrictamente en formato JSON con llaves exactamente así: {"score": 85, "risks": [{"event": "...", "probability": "...", "extinguisher": "..."}]}`;

    const response = await callLMStudio(prompt, true);
    return JSON.parse(response);
  },

  async getCurriculumMapping(activity: Activity) {
    const prompt = `Analiza esta actividad y vincúlala con el marco legal LOMLOE de España.
    Identifica Competencias Específicas, Criterios de Evaluación y Saberes Básicos.
    Actividad: ${activity.title}\nContexto: ${activity.objective}\n
    Responde en formato Markdown estructurado.`;

    return await callLMStudio(prompt);
  },

  async getParentSummary(activity: Activity) {
    const prompt = `Traduce esta actividad escolar para familias, eliminando la jerga pedagógica.
    Enfócate en: ¿Qué aprenderán?, ¿Por qué importa? y tips para casa.
    Actividad: ${JSON.stringify(activity)}
    Responde en formato Markdown cálido.`;

    return await callLMStudio(prompt);
  },

  async getCriticMirror(activity: Activity) {
    const prompt = `Actúa como el "Abogado del Diablo" pedagógico más escéptico.
    Encuentra el "Elefante en la habitación", sesgos potenciales y el "Efecto Placebo".
    Actividad: ${JSON.stringify(activity)}
    Responde estrictamente en formato JSON con llaves exactamente así: {"elephant": "...", "bias": "...", "placebo_effect": "...", "suggestion": "..."}`;

    const response = await callLMStudio(prompt, true);
    return JSON.parse(response);
  }
};
