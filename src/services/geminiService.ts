import { GoogleGenAI, Type } from "@google/genai";
import { Activity } from "../types";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "" 
});

export const geminiService = {
  async getExpertDebate(activity: Activity) {
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
    const prompt = `Analiza esta actividad y vincúlala con el marco legal LOMLOE de España.
    Identifica Competencias Específicas, Criterios de Evaluación y Saberes Básicos que se están trabajando.
    Responde en formato Markdown estructurado.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Actividad: ${activity.title}\nContexto: ${activity.objective}\n\n${prompt}`,
    });

    return response.text;
  }
};
