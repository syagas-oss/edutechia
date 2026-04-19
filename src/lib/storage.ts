import { Message } from '../types';

const SESSION_KEY = 'docente_ai_session_id';
const HISTORY_KEY = 'docente_ai_chat_history';

export function getSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    const randomHash = Math.random().toString(36).substring(2, 11);
    sessionId = `session_${randomHash}_${Date.now()}`;
    localStorage.setItem(SESSION_KEY, sessionId);
    console.log('[Storage] 🟢 Created new session ID:', sessionId);
  } else {
    console.log('[Storage] 🔄 Loaded existing session ID:', sessionId);
  }
  return sessionId;
}

export function getChatHistory(): Message[] {
  const historyMsg = localStorage.getItem(HISTORY_KEY);
  if (historyMsg) {
    try {
      const parsed = JSON.parse(historyMsg);
      console.log(`[Storage] 📜 Loaded chat history (${parsed.length} messages)`);
      return parsed;
    } catch (e) {
      console.error("[Storage] ❌ Error al recuperar el historial del chat", e);
    }
  }
  
  console.log('[Storage] 🤖 No history found. Initializing empty history.');
  return [];
}

export function saveChatHistory(history: Message[]) {
  console.log(`[Storage] 💾 Saving chat history to LocalStorage (${history.length} messages)`);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function clearSession() {
  console.log('[Storage] 🗑️ Clearing session data...');
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(HISTORY_KEY);
  window.location.reload();
}
