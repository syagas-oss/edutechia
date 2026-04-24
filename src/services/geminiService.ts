import { GoogleGenAI, Type } from "@google/genai";
import { Activity } from "../types";

// Lazy initialization to handle missing keys in static deployments
let aiInstance: any = null;

const getAI = () => {
  if (aiInstance) return aiInstance;
  
  // Try both Vite-style (production) and Node-style (dev) keys
  const apiKey = (import.meta.env?.VITE_GEMINI_API_KEY) || process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "") {
    throw new Error('CONFIG_REQUIRED_GEMINI');
  }
  
  aiInstance = new GoogleGenAI({ apiKey });
  return aiInstance;
};

export const geminiService = {
  async getExpertDebate(activity: Activity) {
    const ai = getAI();
    const prompt = `Analiza esta actividad pedagógica:
    Título: ${activity.title}
    Objetivo: ${activity.objective}
    Pasos: ${activity.steps?.join(', ')}
    
    Genera un debate entre 3 expertos:
    1. Una experta en pedagogía creativa (busca chispa y asombro).
    2. Un especialista en neurodiversidad (busca accesibilidad y carga cognitiva).
    3. Un director de escuela pragmático (busca viabilidad y tiempos).
    
    Cada uno debe dar un punto positivo y una crítica constructiva breve. Responde en JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              expert: { type: Type.STRING },
              role: { type: Type.STRING },
              pros: { type: Type.STRING },
              cons: { type: Type.STRING }
            },
            required: ["expert", "role", "pros", "cons"]
          }
        }
      }
    });

    return JSON.parse(response.text);
  },

  async getStressTest(activity: Activity) {
    const ai = getAI();
    const prompt = `Actúa como un simulador de aula de alto estrés. Analiza los riesgos de esta actividad:
    ${JSON.stringify(activity)}
    
    Identifica 3 puntos críticos donde la clase podría descontrolarse o fallar.
    Calcula un "Stress Score" de 0 a 100.
    Da una recomendación de "Extintor" para cada riesgo.
    Responde en JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            risks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  event: { type: Type.STRING },
                  probability: { type: Type.STRING },
                  extinguisher: { type: Type.STRING }
                },
                required: ["event", "probability", "extinguisher"]
              }
            }
          },
          required: ["score", "risks"]
        }
      }
    });

    return JSON.parse(response.text);
  },

  async getCurriculumMapping(activity: Activity) {
    const ai = getAI();
    const prompt = `Analiza esta actividad y vincúlala con el marco legal LOMLOE de España.
    Identifica Competencias Específicas, Criterios de Evaluación y Saberes Básicos que se están trabajando.
    Responde en formato Markdown estructurado.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Actividad: ${activity.title}\nContexto: ${activity.objective}\n\n${prompt}`,
    });

    return response.text;
  },

  async getParentSummary(activity: Activity) {
    const ai = getAI();
    const prompt = `Actúa como un puente entre la escuela y la casa. 
    Traduce esta actividad escolar para familias, eliminando cualquier tecnicismo pedagógico (jerga).
    Enfócate en:
    1. ¿Qué va a aprender su hijo/a exactamente (en lenguaje cotidiano)?
    2. ¿Por qué es importante para su vida real?
    3. Una idea sencilla para reforzar esto en casa mientras cenan o pasean.
    
    Responde en formato Markdown cálido y directo.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Actividad: ${JSON.stringify(activity)}\n\n${prompt}`,
    });

    return response.text;
  },

  async getCriticMirror(activity: Activity) {
    const ai = getAI();
    const prompt = `Actúa como el "Abogado del Diablo" pedagógico más escéptico. 
    Tu objetivo es encontrar los puntos ciegos, los sesgos implícitos o las debilidades ocultas de esta actividad.
    No seas destructivo, sé brutalmente sincero para mejorarla.
    Identifica:
    1. El "Elefante en la habitación" (lo que nadie se atreve a decir que está mal).
    2. Sesgo potencial (¿a quién excluye sin querer?).
    3. El "Efecto Placebo" (¿parece que aprenden pero es solo entretenimiento?).
    
    Responde en JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Actividad: ${JSON.stringify(activity)}\n\n${prompt}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            elephant: { type: Type.STRING },
            bias: { type: Type.STRING },
            placebo_effect: { type: Type.STRING },
            suggestion: { type: Type.STRING }
          },
          required: ["elephant", "bias", "placebo_effect", "suggestion"]
        }
      }
    });

    return JSON.parse(response.text);
  }
};
