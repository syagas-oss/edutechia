const DEFAULT_CHAT_WEBHOOK_URL = "https://n8n-i9qf.onrender.com/webhook/teacher-assistant";
const DEFAULT_LAB_WEBHOOK_URL = "https://n8n-i9qf.onrender.com/webhook/teacher-assistant-lab";

function cleanUrl(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

export const API_CONFIG = {
  chatWebhookUrl: cleanUrl(import.meta.env.VITE_N8N_CHAT_WEBHOOK_URL, DEFAULT_CHAT_WEBHOOK_URL),
  labWebhookUrl: cleanUrl(import.meta.env.VITE_N8N_LAB_WEBHOOK_URL, DEFAULT_LAB_WEBHOOK_URL),
} as const;
