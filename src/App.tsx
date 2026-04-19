import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Mic, Square, Trash2, AlertCircle, Sparkles } from 'lucide-react';
import { Message, WebhookResponse } from './types';
import { saveChatHistory, getSessionId, getChatHistory, clearSession as clearStorageSession } from './lib/storage';
import ActivityCard from './components/ActivityCard';

// === CONFIGURACIÓN ===
const N8N_WEBHOOK_URL = "https://n8n-i9qf.onrender.com/webhook/teacher-assistant";
// =====================

const STAGES = ["Infantil", "Primaria", "Secundaria", "Bachillerato"];
const SUBJECTS = ["Matemáticas", "Lengua", "Ciencias", "Historia", "Inglés", "Arte", "Ed. Física", "Música"];
const DURATIONS = ["15 min", "30 min", "45 min", "60 min", "90 min"];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Context settings
  const [contextData, setContextData] = useState({ stage: '', subject: '', duration: '' });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll smooth
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle Session
  useEffect(() => {
    setSessionId(getSessionId());
    setMessages(getChatHistory());
  }, []);

  const clearSession = () => {
    clearStorageSession();
  };

  // Web Speech API for Dictation
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onstart = () => {
        console.log('[Voice] 🎤 Microphone activated. Listening...');
      };

      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        console.log('[Voice] 📝 Transcript snippet received:', currentTranscript);
        setInput(prev => {
          const words = prev.trim().split(' ');
          const lastWord = words[words.length - 1];
          if (currentTranscript.toLowerCase().startsWith(lastWord.toLowerCase())) {
            return prev; // Very basic duplicate prevention
          }
          return prev + (prev.endsWith(' ') ? '' : ' ') + currentTranscript;
        });
      };

      recognitionRef.current.onerror = (e: any) => {
        console.error('[Voice] ❌ Speech recognition error:', e.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        console.log('[Voice] ⏹️ Speech recognition ended.');
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Tu navegador no soporta el dictado por voz. Te recomendamos usar Chrome.");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  // Enviar mensaje al webhook
  const handleSend = async () => {
    let finalInput = input.trim();
    
    // Inject contextual tags if this is the first message and selections exist
    const isFirstMessage = messages.filter(m => m.sender === 'user').length === 0;
    if (isFirstMessage) {
      const parts = [];
      if (contextData.stage) parts.push(`Nivel: ${contextData.stage}`);
      if (contextData.subject) parts.push(`Asignatura: ${contextData.subject}`);
      if (contextData.duration) parts.push(`Duración: ${contextData.duration}`);
      
      if (parts.length > 0) {
        // Encerramos el contexto para aislarlo de las peticiones adicionales
        finalInput = `[CONTEXTO PRE-CARGADO: ${parts.join(' | ')}]\n\n${finalInput ? finalInput : 'Diseña una actividad adecuada basándote en este contexto.'}`;
      }
    }

    if (!finalInput && !isRecording) return;
    
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      text: finalInput,
      sender: 'user',
      type: 'text',
      timestamp: new Date().toISOString()
    };
    
    console.log('[Chat] 👤 User sent message:', newMessage.text);

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    saveChatHistory(updatedMessages);
    setInput('');
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        sessionId: sessionId,
        message: newMessage.text,
        timestamp: newMessage.timestamp
      };
      
      console.log('[API] 🚀 Triggering POST request to N8N webhook...', {
        url: N8N_WEBHOOK_URL,
        payload
      });

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      console.log('[API] 📡 Received HTTP status:', response.status);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const rawText = await response.text();
      console.log('[API] 📄 Raw response text from N8N:', rawText);

      let data: WebhookResponse;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        console.error('[API] ❌ Failed to parse JSON. Server returned:', rawText);
        throw new Error('n8n no retornó un JSON válido. Revisa la configuración del nodo Webhook (Respond Mode).');
      }

      console.log('[API] 📦 Parsed JSON payload from N8N:', data);

      let botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.message,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        type: data.type === 'error' ? 'error' : 'text',
      };

      if (data.type === 'final_activity' && data.activity) {
        console.log('[Chat] 🎨 Rendering Activity Card response.');
        botMessage.type = 'activity';
        botMessage.activityData = data.activity;
      } else {
        console.log(`[Chat] 💬 Processing Assistant message (type: ${data.type})`);
      }

      setMessages(prev => {
        const newHist = [...prev, botMessage];
        saveChatHistory(newHist);
        return newHist;
      });

    } catch (error: any) {
      console.error("[API] ❌ Connection error caught:", error);
      setErrorMsg("No se ha podido contactar con el asistente. Verifica tu conexión o intenta más tarde.");
      setMessages(prev => {
        const errorMsg: Message = {
           id: Date.now().toString(),
           text: "Error de conexión con el motor IA.",
           sender: 'assistant',
           type: 'error',
           timestamp: new Date().toISOString()
        };
        return [...prev, errorMsg];
      });
    } finally {
      setIsLoading(false);
      // Small delay on scroll to allow elements to render
      setTimeout(scrollToBottom, 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative flex flex-col h-screen text-white overflow-hidden bg-[#02040a]">
      
      {/* Background Spatial Effects */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-900/20 blur-[120px] mix-blend-screen opacity-50 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-fuchsia-900/10 blur-[150px] mix-blend-screen opacity-50 animate-pulse" style={{ animationDuration: '12s' }} />
        {/* Subtle grid mesh overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0idHJhbnNwYXJlbnQiPjwvcmVjdD4KPHBhdGggZD0iTTAgNDBoNDBNNDAgMHY0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiPjwvcGF0aD4KPC9zdmc+')] opacity-50"></div>
      </div>

      {/* Floating Header */}
      <header className="absolute top-0 w-full z-40 p-4 sm:p-6 flex justify-between items-center transition-all bg-gradient-to-b from-[#02040a] to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[1rem] glass-panel bg-white/5 flex items-center justify-center border-white/10 shadow-[0_0_30px_rgba(6,182,212,0.15)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-cyan-400/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 relative z-10" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-display font-medium text-lg sm:text-xl tracking-wide text-white/90">Aula<span className="font-extrabold text-cyan-400">AI</span></h1>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">Nexus Pedagógico</span>
          </div>
        </div>

        <button 
          onClick={clearSession} 
          className="glass-panel px-4 py-2 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <Trash2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Nueva Sesión</span>
        </button>
      </header>

      {/* Main Focus Area (Chat / Canvas) */}
      <main className="flex-1 overflow-y-auto relative z-10 w-full flex flex-col items-center pt-28 pb-40 px-4 sm:px-6">
        
        {/* Error Banner Floating Top */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-28 z-50 glass-panel bg-red-500/10 border-red-500/20 px-6 py-3 rounded-full flex items-center gap-3 shadow-[0_0_30px_rgba(239,68,68,0.2)]"
            >
              <AlertCircle className="w-4 h-4 text-red-400" />
              <p className="text-sm font-medium text-red-200">{errorMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full max-w-4xl space-y-8 flex flex-col pb-8">
          
          <AnimatePresence>
            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="text-center mt-[4vh] sm:mt-[6vh] px-2 sm:px-4 w-full flex flex-col items-center"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02] mb-6">
                   <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                   <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Sistema en línea</span>
                </div>
                <h2 className="font-display tracking-tight text-4xl sm:text-5xl font-bold bg-gradient-to-br from-white via-white/80 to-white/20 bg-clip-text text-transparent mb-4 pb-2">
                  ¿Qué vamos a enseñar hoy?
                </h2>
                <p className="text-[15px] sm:text-lg text-white/40 font-light max-w-2xl mx-auto leading-relaxed mb-8">
                  Configura el contexto rápidamente o simplemente empieza a dictar en el chat.
                </p>
                
                {/* Context Form Menu */}
                <div className="w-full max-w-[800px] bg-white/[0.02] border border-white/[0.05] rounded-[2rem] p-6 lg:p-8 glass-panel text-left space-y-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)]">
                  <div>
                    <h3 className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-4 ml-1">1. Elije la Etapa Educativa</h3>
                    <div className="flex flex-wrap gap-2.5 sm:gap-3">
                      {STAGES.map(s => (
                        <button
                          key={s}
                          onClick={() => setContextData(prev => ({...prev, stage: prev.stage === s ? "" : s}))}
                          className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-[13px] font-semibold tracking-wide transition-all duration-300 ${
                            contextData.stage === s 
                            ? 'bg-cyan-500 text-[#02040a] shadow-[0_0_20px_rgba(6,182,212,0.5)] scale-105' 
                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90 border border-white/[0.05]'
                          }`}
                        >{s}</button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 pt-2 border-t border-white/[0.03]">
                    <div>
                      <h3 className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-4 ml-1">2. Asignatura Central</h3>
                      <div className="flex flex-wrap gap-2 sm:gap-2.5">
                        {SUBJECTS.map(s => (
                          <button
                            key={s}
                            onClick={() => setContextData(prev => ({...prev, subject: prev.subject === s ? "" : s}))}
                            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[11px] sm:text-xs font-semibold transition-all duration-300 ${
                              contextData.subject === s 
                              ? 'bg-fuchsia-500 text-white shadow-[0_0_20px_rgba(217,70,239,0.5)] scale-105 border-transparent' 
                              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90 border border-white/[0.05]'
                            }`}
                          >{s}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-4 ml-1">3. Duración Aproximada</h3>
                      <div className="flex flex-wrap gap-2 sm:gap-2.5">
                        {DURATIONS.map(d => (
                          <button
                            key={d}
                            onClick={() => setContextData(prev => ({...prev, duration: prev.duration === d ? "" : d}))}
                            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold transition-all duration-300 ${
                              contextData.duration === d 
                              ? 'bg-amber-400 text-[#02040a] shadow-[0_0_20px_rgba(251,191,36,0.5)] scale-105 border-transparent' 
                              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90 border border-white/[0.05]'
                            }`}
                          >{d}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const isError = msg.type === 'error';

              return (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, scale: 0.95, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.4, type: 'spring', bounce: 0.3 }}
                  className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex flex-col gap-2 w-full ${isUser ? 'max-w-[85%] sm:max-w-[70%] items-end' : 'items-start'}`}>
                    
                    {/* User Message (Floating Pill) */}
                    {isUser && (
                      <div className="glass-panel hover:bg-white/10 transition-colors bg-white/5 border-white/10 px-6 py-4 rounded-[2rem] rounded-br-md shadow-lg backdrop-blur-3xl text-right">
                        <p className="text-[1.05rem] text-white/90 leading-relaxed font-light">{msg.text}</p>
                      </div>
                    )}

                    {/* AI Text Message (Clean, Large Text) */}
                    {!isUser && msg.type !== 'activity' && (
                      <div className={`py-2 px-2 max-w-3xl ${isError ? 'text-red-400' : 'text-white/80'}`}>
                        <p className="text-lg sm:text-[1.15rem] leading-[1.7] font-light tracking-wide">{msg.text}</p>
                      </div>
                    )}

                    {/* AI Activity Card (Bento Grid) */}
                    {msg.type === 'activity' && msg.activityData && (
                      <ActivityCard activity={msg.activityData} />
                    )}

                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Typing / Processing Indicator */}
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-4 px-4 py-2 mt-4"
            >
              <div className="relative flex items-center justify-center w-8 h-8">
                <div className="absolute inset-0 bg-cyan-500/30 rounded-full blur-md animate-ping" style={{ animationDuration: '2s' }}></div>
                <div className="absolute inset-2 bg-cyan-400 rounded-full blur-[2px] animate-pulse"></div>
                <Sparkles className="w-4 h-4 text-white relative z-10 animate-pulse" />
              </div>
              <span className="font-display font-bold text-cyan-400/80 tracking-[0.3em] uppercase text-[10px] animate-pulse">
                Sintetizando estructura
              </span>
            </motion.div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>

      {/* Floating Spatial Input Bar */}
      <div className="absolute bottom-6 sm:bottom-10 w-full px-4 sm:px-8 z-40 flex justify-center pointer-events-none">
        <div className="w-full max-w-3xl pointer-events-auto">
          <div className="input-glass p-2 sm:p-2.5 rounded-[2.5rem] flex items-end gap-2 sm:gap-3 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] group focus-within:border-cyan-500/30 focus-within:bg-white/[0.05] focus-within:shadow-[0_20px_60px_-15px_rgba(6,182,212,0.2)] transition-all duration-500">
            
            {/* Mic Toggle */}
            <button
              onClick={toggleRecording}
              className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                isRecording 
                  ? 'bg-red-500/20 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-pulse' 
                  : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
              }`}
              title={isRecording ? 'Detener dictado' : 'Dictar por voz'}
            >
              {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
            </button>
            
            {/* Main Text Input */}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Explica la actividad que necesitas..."
              className="flex-1 max-h-32 min-h-[48px] py-3 px-2 bg-transparent border-none focus:ring-0 resize-none text-[15px] text-white placeholder-white/30 font-light"
              style={{ overflowY: 'auto' }}
              rows={1}
            />
            
            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={isLoading || (!input.trim() && !isRecording && Object.values(contextData).every(v => v === ''))}
              className="w-12 h-12 rounded-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:bg-white/10 disabled:text-white/30 flex items-center justify-center text-black shrink-0 transition-all duration-300 disabled:hover:scale-100 hover:scale-[1.02] active:scale-95 disabled:shadow-none shadow-[0_0_30px_rgba(6,182,212,0.3)]"
            >
              <Send className="w-5 h-5 ml-1" />
            </button>
            
          </div>
          <div className="flex justify-center mt-4">
             <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-white/20 font-display">
                Powered by N8N Engine
             </span>
          </div>
        </div>
      </div>

    </div>
  );
}
