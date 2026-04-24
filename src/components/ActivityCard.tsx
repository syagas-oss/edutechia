import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { 
  Copy, Check, Clock, Target, ListChecks, Sparkles, GraduationCap, 
  Printer, ThumbsUp, ThumbsDown, Users, Flame, BookOpen, AlertTriangle,
  Zap, Brain, Shield, Info, ArrowRight, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { Activity } from '../types';
import { geminiService } from '../services/geminiService';

interface ActivityCardProps {
  activity: Activity;
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState<'up' | 'down' | null>(null);
  
  // New AI state
  const [isDebating, setIsDebating] = useState(false);
  const [debate, setDebate] = useState<any[] | null>(null);
  const [isStressTesting, setIsStressTesting] = useState(false);
  const [stressTest, setStressTest] = useState<any | null>(null);
  const [isMappingCurr, setIsMappingCurr] = useState(false);
  const [curriculumMarkdown, setCurriculumMarkdown] = useState<string | null>(null);
  const [isGettingParentSummary, setIsGettingParentSummary] = useState(false);
  const [parentSummary, setParentSummary] = useState<string | null>(null);
  const [isGettingCriticMirror, setIsGettingCriticMirror] = useState(false);
  const [criticMirror, setCriticMirror] = useState<any | null>(null);

  // Neuro-morphism detection
  const isNeuroAdaptative = useMemo(() => {
    const textToSearch = JSON.stringify(activity).toLowerCase();
    const keywords = ['adhd', 'tdah', 'dislexia', 'atención', 'concentración', 'especiales', 'neae', 'tea', 'autismo'];
    return keywords.some(k => textToSearch.includes(k));
  }, [activity]);

  const morphStyle = isNeuroAdaptative ? {
    border: '2px solid rgba(16, 185, 129, 0.3)',
    background: 'rgba(6, 182, 212, 0.02)',
    boxShadow: '0 0 40px rgba(16, 185, 129, 0.05) inset'
  } : {};

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

  // AI Feature Handlers
  const triggerDebate = async () => {
    setIsDebating(true);
    try {
      const result = await geminiService.getExpertDebate(activity);
      setDebate(result);
      toast.success('Debate generado por el Consejo de Sabios');
    } catch (e) {
      toast.error('Error al invocar al Consejo de Sabios');
    } finally {
      setIsDebating(false);
    }
  };

  const triggerStressTest = async () => {
    setIsStressTesting(true);
    try {
      const result = await geminiService.getStressTest(activity);
      setStressTest(result);
      toast.success('Simulación de aula completada');
    } catch (e) {
      toast.error('Error en la simulación de estrés');
    } finally {
      setIsStressTesting(false);
    }
  };

  const triggerCurriculumMapping = async () => {
    setIsMappingCurr(true);
    try {
      const result = await geminiService.getCurriculumMapping(activity);
      setCurriculumMarkdown(result);
      toast.success('Vinculación curricular LOMLOE completada');
    } catch (e) {
      toast.error('Error al mapear el currículo');
    } finally {
      setIsMappingCurr(false);
    }
  };

  const triggerParentSummary = async () => {
    setIsGettingParentSummary(true);
    try {
      const result = await geminiService.getParentSummary(activity);
      setParentSummary(result);
      toast.success('Sincronía para Padres generada');
    } catch (e) {
      toast.error('Error al generar resumen para padres');
    } finally {
      setIsGettingParentSummary(false);
    }
  };

  const triggerCriticMirror = async () => {
    setIsGettingCriticMirror(true);
    try {
      const result = await geminiService.getCriticMirror(activity);
      setCriticMirror(result);
      toast.success('IA Espejo activada: Puntos ciegos detectados');
    } catch (e) {
      toast.error('Error al activar IA Espejo');
    } finally {
      setIsGettingCriticMirror(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      style={morphStyle}
      className={`w-full glass-panel luxury-card shimmer-effect rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden group mt-4 mb-2 activity-card-print ${isNeuroAdaptative ? 'neuro-glow' : ''}`}
    >
      {/* Background ambient glow inside the card */}
      <div className="absolute -top-[30%] -right-[10%] w-[60%] h-[80%] bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-cyan-500/20 transition-colors duration-1000 ease-in-out" />
      <div className="absolute -bottom-[30%] -left-[10%] w-[50%] h-[60%] bg-purple-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-purple-500/20 transition-colors duration-1000 ease-in-out" />
      
      {isNeuroAdaptative && (
        <div className="absolute top-0 right-0 p-4 z-20">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full text-emerald-400 text-[10px] font-bold uppercase tracking-widest"
          >
            <Brain className="w-3 h-3" /> Morphismo Neuro-Activado
          </motion.div>
        </div>
      )}
      
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

        {/* Laboratorio de Innovación - New Disruptive Features Area */}
        <div className="col-span-full mt-12 sm:mt-16 no-print relative z-10 w-full">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <h4 className="font-display text-[10px] font-bold text-white/30 uppercase tracking-[0.4em] px-4">
              Laboratorio de Innovación
            </h4>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
            {/* Feature 1: Consejo de Sabios */}
            <button 
              onClick={triggerDebate}
              disabled={isDebating}
              className="flex flex-col items-center gap-3 sm:gap-4 p-4 sm:p-8 glass-panel shimmer-effect hover:bg-white/5 hover:border-cyan-400/30 transition-all text-center group/lab disabled:opacity-50 rounded-[1.5rem] sm:rounded-[2rem] cursor-pointer"
            >
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-cyan-500/10 flex items-center justify-center group-hover/lab:scale-110 group-hover/lab:bg-cyan-500/20 transition-all duration-500">
                {isDebating ? <Loader2 className="w-5 h-5 sm:w-7 sm:h-7 text-cyan-400 animate-spin" /> : <Users className="w-5 h-5 sm:w-7 sm:h-7 text-cyan-400" /> }
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <span className="text-[10px] sm:text-sm font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white">Sabios</span>
                <p className="hidden sm:block text-[10px] text-white/40 leading-tight">Debate pedagógico multi-agente</p>
              </div>
            </button>

            {/* Feature 2:Stress Test */}
            <button 
              onClick={triggerStressTest}
              disabled={isStressTesting}
              className="flex flex-col items-center gap-3 sm:gap-4 p-4 sm:p-8 glass-panel shimmer-effect hover:bg-red-500/5 hover:border-red-400/30 transition-all text-center group/lab disabled:opacity-50 rounded-[1.5rem] sm:rounded-[2rem] cursor-pointer"
            >
               <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-red-500/10 flex items-center justify-center group-hover/lab:scale-110 group-hover/lab:bg-red-500/20 transition-all duration-500">
                {isStressTesting ? <Loader2 className="w-5 h-5 sm:w-7 sm:h-7 text-red-400 animate-spin" /> : <Flame className="w-5 h-5 sm:w-7 sm:h-7 text-red-400" /> }
               </div>
               <div className="space-y-0.5 sm:space-y-1">
                <span className="text-[10px] sm:text-sm font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white">Estrés</span>
                <p className="hidden sm:block text-[10px] text-white/40 leading-tight">Analítica de fricción real</p>
               </div>
            </button>

            {/* Feature 3: Currículo Twin */}
            <button 
              onClick={triggerCurriculumMapping}
              disabled={isMappingCurr}
              className="flex flex-col items-center gap-3 sm:gap-4 p-4 sm:p-8 glass-panel shimmer-effect hover:bg-purple-500/5 hover:border-purple-400/30 transition-all text-center group/lab disabled:opacity-50 rounded-[1.5rem] sm:rounded-[2rem] cursor-pointer"
            >
               <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover/lab:scale-110 group-hover/lab:bg-purple-500/20 transition-all duration-500">
                {isMappingCurr ? <Loader2 className="w-5 h-5 sm:w-7 sm:h-7 text-purple-400 animate-spin" /> : <BookOpen className="w-5 h-5 sm:w-7 sm:h-7 text-purple-400" /> }
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <span className="text-[10px] sm:text-sm font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white">Currículo</span>
                <p className="hidden sm:block text-[10px] text-white/40 leading-tight">Marco legal LOMLOE</p>
              </div>
            </button>

            {/* Feature 4: Sincronía para Padres */}
            <button 
              onClick={triggerParentSummary}
              disabled={isGettingParentSummary}
              className="flex flex-col items-center gap-3 sm:gap-4 p-4 sm:p-8 glass-panel shimmer-effect hover:bg-emerald-500/5 hover:border-emerald-400/30 transition-all text-center group/lab disabled:opacity-50 rounded-[1.5rem] sm:rounded-[2rem] cursor-pointer"
            >
               <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover/lab:scale-110 group-hover/lab:bg-emerald-500/20 transition-all duration-500">
                {isGettingParentSummary ? <Loader2 className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-400 animate-spin" /> : <Info className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-400" /> }
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <span className="text-[10px] sm:text-sm font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white">Padres</span>
                <p className="hidden sm:block text-[10px] text-white/40 leading-tight">Comunicación familias</p>
              </div>
            </button>

            {/* Feature 5: IA Espejo */}
            <button 
              onClick={triggerCriticMirror}
              disabled={isGettingCriticMirror}
              className="flex flex-col items-center gap-3 sm:gap-4 p-4 sm:p-8 glass-panel shimmer-effect hover:bg-amber-500/5 hover:border-amber-400/30 transition-all text-center group/lab disabled:opacity-50 rounded-[1.5rem] sm:rounded-[2rem] cursor-pointer"
            >
               <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-amber-500/10 flex items-center justify-center group-hover/lab:scale-110 group-hover/lab:bg-amber-500/20 transition-all duration-500">
                {isGettingCriticMirror ? <Loader2 className="w-5 h-5 sm:w-7 sm:h-7 text-amber-400 animate-spin" /> : <Zap className="w-5 h-5 sm:w-7 sm:h-7 text-amber-400" /> }
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <span className="text-[10px] sm:text-sm font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white">Espejo</span>
                <p className="hidden sm:block text-[10px] text-white/40 leading-tight">Crítica radical honesta</p>
              </div>
            </button>
          </div>

          {/* Display Areas for AI features */}
          <AnimatePresence mode="wait">
            {/* Debate results */}
            {debate && (
              <motion.div 
                key="debate"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 overflow-hidden"
              >
                {debate.map((item, i) => (
                  <div key={i} className="p-8 glass-panel bg-cyan-500/[0.08] border-cyan-500/30 rounded-[2rem] relative hover:bg-cyan-500/[0.12] transition-colors duration-500">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-cyan-400/20 flex items-center justify-center border border-cyan-400/30">
                        <Brain className="w-5 h-5 text-cyan-400" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">{item.role}</span>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 bg-emerald-500/15 rounded-2xl border border-emerald-500/30 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-2 tracking-widest">Punto Focal Positivo</span>
                        <p className="text-[15px] text-white/95 font-medium leading-snug">{item.pros}</p>
                      </div>
                      <div className="p-4 bg-red-500/15 rounded-2xl border border-red-500/30 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-red-100 block mb-2 tracking-widest opacity-80">Riesgo a Contemplar</span>
                        <p className="text-[15px] text-red-100/90 italic leading-snug">{item.cons}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => setDebate(null)}
                  className="col-span-full text-center text-[10px] text-white/20 hover:text-white/40 py-2"
                >
                  Cerrar debate
                </button>
              </motion.div>
            )}

            {/* Stress Test results */}
            {stressTest && (
              <motion.div 
                key="stress"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-6 p-6 glass-panel bg-red-500/[0.02] border-red-500/10 rounded-2xl overflow-hidden"
              >
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-red-400">Classroom Stress Test</span>
                  </div>
                  <div className="flex flex-col items-end">
                     <span className="text-[11px] text-white/30 uppercase font-bold mb-1 tracking-widest">Stress Index</span>
                     <span className="text-4xl font-display font-bold text-red-500">{stressTest.score}/100</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  {stressTest.risks.map((risk: any, i: number) => (
                    <div key={i} className="p-8 bg-white/[0.05] rounded-3xl border border-white/10 hover:border-red-500/40 transition-all duration-500 group/risk">
                      <div className="flex items-center justify-between gap-2 mb-6">
                         <div className="flex items-center gap-2">
                           <AlertTriangle className="w-5 h-5 text-amber-500 group-hover/risk:scale-125 transition-transform" />
                           <span className="text-xs font-bold text-amber-300 uppercase tracking-widest">Punto Crítico</span>
                         </div>
                         <span className="bg-red-500/20 text-red-400 text-[11px] px-3 py-1 rounded-full font-bold uppercase ring-1 ring-red-500/20">{risk.probability}</span>
                      </div>
                      <p className="text-lg text-white font-medium leading-tight mb-8">{risk.event}</p>
                      <div className="flex flex-col gap-3 p-5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-inner">
                         <div className="flex items-center gap-2 mb-1">
                           <Shield className="w-4 h-4 text-emerald-400" />
                           <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-[0.15em]">Protocolo Extintor</span>
                         </div>
                         <p className="text-[13px] text-emerald-200/90 italic leading-relaxed">{risk.extinguisher}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => setStressTest(null)}
                  className="w-full text-center text-[10px] text-white/20 hover:text-white/40 py-2 mt-4"
                >
                  Resetear simulación
                </button>
              </motion.div>
            )}

            {/* Curriculum mapping results */}
            {curriculumMarkdown && (
              <motion.div 
                 key="curr"
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: 'auto', opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 className="mt-6 p-6 glass-panel bg-purple-500/[0.02] border-purple-500/10 rounded-2xl overflow-hidden"
              >
                 <div className="flex items-center gap-2 mb-6">
                    <BookOpen className="w-5 h-5 text-purple-400" />
                    <span className="text-sm font-bold uppercase tracking-[0.2em] text-purple-400">Gemelo Curricular LOMLOE</span>
                 </div>
                 <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-10 max-h-[700px] overflow-y-auto scrollbar-hide">
                    <div className="markdown-body text-base text-white/90 leading-relaxed">
                       <Markdown>{curriculumMarkdown}</Markdown>
                    </div>
                 </div>
                 <button 
                  onClick={() => setCurriculumMarkdown(null)}
                  className="w-full text-center text-[10px] text-white/20 hover:text-white/40 py-2 mt-4"
                >
                  Cerrar vista legal
                </button>
              </motion.div>
            )}

            {/* Parent Summary results */}
            {parentSummary && (
              <motion.div 
                 key="parent"
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: 'auto', opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 className="mt-6 p-6 glass-panel bg-emerald-500/[0.02] border-emerald-500/10 rounded-2xl overflow-hidden"
              >
                 <div className="flex items-center gap-2 mb-6">
                    <Info className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-400">Sincronía para Padres (Zero Jargon)</span>
                 </div>
                 <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-10 max-h-[700px] overflow-y-auto scrollbar-hide">
                    <div className="markdown-body text-base text-white/90 leading-relaxed italic">
                       <Markdown>{parentSummary}</Markdown>
                    </div>
                 </div>
                 <button 
                  onClick={() => setParentSummary(null)}
                  className="w-full text-center text-[10px] text-white/20 hover:text-white/40 py-2 mt-4"
                >
                  Cerrar comunicación familias
                </button>
              </motion.div>
            )}

            {/* Critic Mirror results */}
            {criticMirror && (
              <motion.div 
                 key="critic"
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: 'auto', opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 className="mt-6 p-10 glass-panel bg-amber-500/[0.03] border-amber-500/20 rounded-[2.5rem] overflow-hidden relative"
              >
                 <div className="absolute top-0 right-0 p-8">
                    <Zap className="w-12 h-12 text-amber-500/20 rotate-12" />
                 </div>
                 
                 <div className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                       <Shield className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <span className="text-sm font-bold uppercase tracking-[0.2em] text-amber-400 block">IA ESPEJO</span>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">The Critic Anti-Agent</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                    <div className="space-y-4">
                       <h5 className="text-[11px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full w-fit">Elefante en la Habitación</h5>
                       <p className="text-lg text-white font-medium leading-tight">{criticMirror.elephant}</p>
                    </div>
                    <div className="space-y-4">
                       <h5 className="text-[11px] font-bold text-red-400 uppercase tracking-widest bg-red-500/10 px-3 py-1 rounded-full w-fit">Sesgo Potencial</h5>
                       <p className="text-lg text-white font-medium leading-tight">{criticMirror.bias}</p>
                    </div>
                    <div className="space-y-4">
                       <h5 className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-3 py-1 rounded-full w-fit">Efecto Placebo</h5>
                       <p className="text-lg text-white font-medium leading-tight">{criticMirror.placebo_effect}</p>
                    </div>
                 </div>

                 <div className="p-6 bg-white/[0.05] rounded-2xl border border-white/10 shadow-2xl">
                    <div className="flex items-center gap-2 mb-3">
                       <Sparkles className="w-4 h-4 text-emerald-400" />
                       <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Sugerencia Evolutiva</span>
                    </div>
                    <p className="text-white/80 leading-relaxed italic pr-4">{criticMirror.suggestion}</p>
                 </div>

                 <button 
                  onClick={() => setCriticMirror(null)}
                  className="w-full text-center text-[10px] text-white/20 hover:text-white/40 py-2 mt-8"
                >
                  Cerrar IA Espejo
                </button>
              </motion.div>
            )}
          </AnimatePresence>

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
