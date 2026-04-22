import { useState } from 'react';
import { motion } from 'motion/react';
import { Copy, Check, Clock, Target, ListChecks, Sparkles, GraduationCap, Printer, ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';
import { Activity } from '../types';

interface ActivityCardProps {
  activity: Activity;
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState<'up' | 'down' | null>(null);

  // Fallback heuristic for the core identity of the card
  const finalTitle = activity.title || (activity as any).taskTitle || (activity as any).activityName || 'Actividad Pedagógica';
  const finalObjective = activity.objective || activity.description || (activity as any).goal || (activity as any).purpose || 'No especificado';
  const finalDuration = activity.duration || (activity as any).timeLimit || (activity.estimated_time_minutes ? `${activity.estimated_time_minutes} min` : 'Variable');
  
  const ensureArray = (val: any): string[] => {
    if (Array.isArray(val)) {
      return val.map(item => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
          if (item.instruction) {
            return item.step_number ? `${item.instruction}` : item.instruction;
          }
          if (item.description) return item.description;
          if (item.text) return item.text;
          if (item.name) return item.name;
          return JSON.stringify(item);
        }
        return String(item);
      });
    }
    if (typeof val === 'string') return val.split('\n').map(s => s.trim()).filter(s => s);
    if (val !== null && val !== undefined) {
      if (typeof val === 'object') return [JSON.stringify(val)];
      return [String(val)];
    }
    return [];
  };

  const finalSteps = ensureArray(activity.steps || activity.instructions);
  const finalAdaptations = ensureArray(activity.adaptations);
  const finalAssessment = ensureArray(activity.assessment);
  const finalResources = ensureArray(activity.resources_required);

  // Dynamic extra fields logic
  const knownKeys = [
    'title', 'taskTitle', 'name', 'activityTitle', 'activity_name', 
    'objective', 'goal', 'description', 'purpose', 'meta',
    'duration', 'timeLimit', 'estimated_time_minutes', 'time', 'duracion',
    'passage', 'text', 'reading', 'lectura',
    'questions', 'preguntas', 'assessment_questions',
    'steps', 'instructions', 'pasos', 'dynamic', 'development',
    'adaptations', 'special_needs', 'ajustes', 'adaptaciones',
    'assessment', 'evaluation', 'evaluacion', 'grading',
    'resources_required', 'resources', 'materiales', 'recursos', 'materials',
    'closure', 'conclusion', 'cierre', 'finish',
    'difficulty_level', 'level', 'nivel', 'difficulty',
    'id', 'session_id', 'created_at', 'updated_at', 'conversation_state', 'profile', 
    'ok', 'message', 'context', 'normalizedActivity', 'last_activity'
  ];
  const extraEntries = Object.entries(activity).filter(([key]) => !knownKeys.includes(key) && typeof activity[key as keyof Activity] !== 'object');

  const handleCopy = () => {
    const textToCopy = `TÍTULO: ${activity.title}\nDURACIÓN: ${finalDuration}\n\nOBJETIVO:\n${finalObjective}\n\nPASOS:\n${finalSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\nADAPTACIONES:\n${finalAdaptations.length > 0 ? finalAdaptations.map(a => `- ${a}`).join('\n') : 'N/A'}\n\nEVALUACIÓN:\n${finalAssessment.length > 0 ? finalAssessment.map(e => `- ${e}`).join('\n') : 'N/A'}\n\nCIERRE:\n${activity.closure || 'N/A'}`.trim();
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      toast.success('Copiado al portapapeles');
      if (navigator.vibrate) navigator.vibrate(30);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePrint = () => {
    if (navigator.vibrate) navigator.vibrate(20);
    window.print();
  };

  const handleRate = (type: 'up' | 'down') => {
    if (rating === type) {
      setRating(null);
      return;
    }
    setRating(type);
    toast.success(type === 'up' ? '¡Gracias! Nos alegra que te guste.' : 'Gracias por tu feedback. Seguiremos mejorando.');
    if (navigator.vibrate) navigator.vibrate(10);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="w-full glass-panel rounded-[2rem] p-6 sm:p-8 relative overflow-hidden group mt-4 mb-2 activity-card-print"
    >
      {/* Background ambient glow inside the card */}
      <div className="absolute -top-[30%] -right-[10%] w-[60%] h-[80%] bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-cyan-500/20 transition-colors duration-1000 ease-in-out" />
      <div className="absolute -bottom-[30%] -left-[10%] w-[50%] h-[60%] bg-purple-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-purple-500/20 transition-colors duration-1000 ease-in-out" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 relative z-10 w-full">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-400">Modelo Generativo</span>
            {activity.difficulty_level && (
               <span className="ml-2 text-[10px] uppercase font-bold tracking-widest text-[#02040a] bg-amber-400 px-2 py-0.5 rounded-full">
                 {activity.difficulty_level}
               </span>
            )}
          </div>
          <h3 className="font-display text-3xl sm:text-4xl font-bold bg-gradient-to-br from-white via-white/90 to-white/40 bg-clip-text text-transparent leading-tight tracking-tight">
            {finalTitle}
          </h3>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <div className="glass-panel px-5 py-2.5 rounded-full flex items-center gap-2 no-print">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-white/90 tracking-wide">{finalDuration}</span>
          </div>
          
          <button 
            onClick={handlePrint} 
            className="glass-panel hover:bg-white/10 transition-all duration-300 w-11 h-11 rounded-full flex items-center justify-center shrink-0 cursor-pointer active:scale-95 no-print print-visible"
            title="Imprimir o Exportar PDF"
          >
            <Printer className="w-4 h-4 text-white/70" />
          </button>

          <button 
            onClick={handleCopy} 
            className="glass-panel hover:bg-white/10 transition-all duration-300 w-11 h-11 rounded-full flex items-center justify-center shrink-0 cursor-pointer active:scale-95 no-print"
            title="Copiar actividad"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white/70" />}
          </button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 relative z-10">
        
        {/* Objective - Expanded width */}
        <div className="lg:col-span-3 glass-panel bg-white/[0.01] hover:bg-white/[0.03] transition-colors border-white/[0.03] p-6 lg:p-8 rounded-[1.5rem]">
          <h4 className="flex items-center gap-2 font-display text-[11px] font-bold text-white/40 uppercase tracking-[0.2em] mb-4">
            <Target className="w-4 h-4 text-cyan-400/50" /> Objetivo Central
          </h4>
          <p className="text-white/90 leading-relaxed text-lg sm:text-xl font-light">{finalObjective}</p>
        </div>

        {/* Passage, Questions, Steps - Taking 2/3 width */}
        {(finalSteps.length > 0 || activity.passage || (activity.questions && activity.questions.length > 0)) && (
          <div className="lg:col-span-2 glass-panel bg-white/[0.01] hover:bg-white/[0.03] transition-colors border-white/[0.03] p-6 lg:p-8 rounded-[1.5rem]">
            
            {activity.passage && (
              <div className="mb-10 last:mb-0 relative z-10">
                <h4 className="flex items-center gap-2 font-display text-[11px] font-bold text-white/40 uppercase tracking-[0.2em] mb-4">
                  📘 Texto / Lectura
                </h4>
                <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
                  <p className="text-white/90 leading-relaxed font-serif text-lg italic">{activity.passage}</p>
                </div>
              </div>
            )}
            
            {activity.questions && activity.questions.length > 0 && (
              <div className="mb-10 last:mb-0 relative z-10">
                <h4 className="flex items-center gap-2 font-display text-[11px] font-bold text-white/40 uppercase tracking-[0.2em] mb-4">
                  💬 Preguntas Formativas
                </h4>
                <div className="grid gap-3">
                  {ensureArray(activity.questions).map((q, idx) => (
                     <div key={idx} className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex items-start gap-4">
                        <span className="text-purple-400 font-display font-medium text-sm mt-0.5 pointer-events-none">Q{(idx + 1).toString().padStart(2, '0')}</span>
                        <p className="text-white/80 leading-relaxed">{q}</p>
                     </div>
                  ))}
                </div>
              </div>
            )}

            {finalSteps.length > 0 && (
              <div className="mb-10 last:mb-0 relative z-10">
                <h4 className="flex items-center gap-2 font-display text-[11px] font-bold text-white/40 uppercase tracking-[0.2em] mb-6">
                  <ListChecks className="w-4 h-4 text-cyan-400/50" /> Dinámica de Desarrollo
                </h4>
                <div className="space-y-6">
                  {finalSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-5 group/step">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-display font-medium text-sm group-hover/step:bg-cyan-500/20 group-hover/step:scale-110 transition-all duration-300">
                        {idx + 1}
                      </div>
                      <p className="text-white/70 group-hover/step:text-white/90 transition-colors leading-relaxed pt-1.5">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activity.closure && (
              <div className="mt-10 pt-10 border-t border-white/5 relative z-10">
                <h4 className="flex items-center gap-2 font-display text-[11px] font-bold text-cyan-400/50 uppercase tracking-[0.2em] mb-4">
                  🏁 Cierre / Conclusión
                </h4>
                <p className="text-white/80 leading-relaxed italic pr-4">{activity.closure}</p>
              </div>
            )}
          </div>
        )}

        {/* Adaptations & Assesment - Stacked safely 1/3 width */}
        <div className="lg:col-span-1 flex flex-col gap-4 sm:gap-6">
          {finalAdaptations.length > 0 && (
            <div className="glass-panel hover:bg-amber-500/[0.05] bg-amber-500/[0.02] border-amber-500/[0.05] p-6 lg:p-8 rounded-[1.5rem] flex-1 transition-colors">
              <h4 className="flex items-center gap-2 font-display text-[11px] font-bold text-amber-500/50 uppercase tracking-[0.2em] mb-5">
                 Adaptaciones Flexibles
              </h4>
              <ul className="space-y-4">
                {finalAdaptations.map((adapt, idx) => (
                  <li key={idx} className="text-amber-100/70 leading-relaxed text-[15px] flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50 mt-2 shrink-0" />
                    {adapt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {finalAssessment.length > 0 && (
            <div className="glass-panel hover:bg-fuchsia-500/[0.05] bg-fuchsia-500/[0.02] border-fuchsia-500/[0.05] p-6 lg:p-8 rounded-[1.5rem] flex-1 transition-colors">
              <h4 className="flex items-center gap-2 font-display text-[11px] font-bold text-fuchsia-400/50 uppercase tracking-[0.2em] mb-5">
                <GraduationCap className="w-4 h-4 text-fuchsia-400/50" /> Evaluación Táctica
              </h4>
              <ul className="space-y-4">
                {finalAssessment.map((evalItem, idx) => (
                  <li key={idx} className="text-fuchsia-100/70 leading-relaxed text-[15px] flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500/50 mt-2 shrink-0" />
                    {evalItem}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {finalResources.length > 0 && (
            <div className="glass-panel hover:bg-cyan-500/[0.05] bg-cyan-500/[0.02] border-cyan-500/[0.05] p-6 lg:p-8 rounded-[1.5rem] flex-1 transition-colors">
              <h4 className="flex items-center gap-2 font-display text-[11px] font-bold text-cyan-400/50 uppercase tracking-[0.2em] mb-5">
                <Sparkles className="w-4 h-4 text-cyan-400/50" /> Set de Recursos
              </h4>
              <ul className="space-y-4">
                {finalResources.map((res, idx) => (
                  <li key={idx} className="text-cyan-100/70 leading-relaxed text-[15px] flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 mt-2 shrink-0" />
                    {res}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {extraEntries.length > 0 && (
            <div className="glass-panel hover:bg-slate-500/[0.05] bg-slate-500/[0.02] border-slate-500/[0.05] p-6 lg:p-10 rounded-[1.5rem] flex-1 transition-colors no-print">
              <h4 className="flex items-center gap-2 font-display text-[11px] font-bold text-slate-400/50 uppercase tracking-[0.2em] mb-5">
                Datos Adicionales
              </h4>
              <div className="grid gap-2.5">
                {extraEntries.map(([key, val]) => (
                  <div key={key} className="flex justify-between items-start gap-4 text-[11px]">
                     <span className="text-white/30 uppercase tracking-tighter shrink-0">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</span>
                     <span className="text-white/60 font-mono text-right break-words">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rating System Overlay Bottom Right */}
        <div className="absolute bottom-6 right-8 flex items-center gap-2 no-print opacity-0 group-hover:opacity-100 transition-opacity duration-500">
           <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 mr-2">¿Te gusta?</span>
           <button 
            onClick={() => handleRate('up')}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${rating === 'up' ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
           >
            <ThumbsUp className="w-4 h-4" />
           </button>
           <button 
            onClick={() => handleRate('down')}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${rating === 'down' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
           >
            <ThumbsDown className="w-4 h-4" />
           </button>
        </div>

      </div>
    </motion.div>
  );
}
