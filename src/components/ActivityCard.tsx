import { useState } from 'react';
import { motion } from 'motion/react';
import { Copy, Check, Clock, Target, ListChecks, Sparkles, GraduationCap } from 'lucide-react';
import { Activity } from '../types';

interface ActivityCardProps {
  activity: Activity;
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  const [copied, setCopied] = useState(false);

  const finalObjective = activity.objective || activity.description || 'No especificado';
  const finalDuration = activity.duration || (activity.estimated_time_minutes ? `${activity.estimated_time_minutes} min` : 'Variable');
  
  const ensureArray = (val: any): string[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return val.split('\n').map(s => s.trim()).filter(s => s);
    if (val) return [String(val)];
    return [];
  };

  const finalSteps = ensureArray(activity.steps || activity.instructions);
  const finalAdaptations = ensureArray(activity.adaptations);
  const finalAssessment = ensureArray(activity.assessment);
  const finalResources = ensureArray(activity.resources_required);

  const handleCopy = () => {
    const textToCopy = `TÍTULO: ${activity.title}\nDURACIÓN: ${finalDuration}\n\nOBJETIVO:\n${finalObjective}\n\nPASOS:\n${finalSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\nADAPTACIONES:\n${finalAdaptations.length > 0 ? finalAdaptations.map(a => `- ${a}`).join('\n') : 'N/A'}\n\nEVALUACIÓN:\n${finalAssessment.length > 0 ? finalAssessment.map(e => `- ${e}`).join('\n') : 'N/A'}`.trim();
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="w-full glass-panel rounded-[2rem] p-6 sm:p-8 relative overflow-hidden group mt-4 mb-2"
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
            {activity.title}
          </h3>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <div className="glass-panel px-5 py-2.5 rounded-full flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-white/90 tracking-wide">{finalDuration}</span>
          </div>
          <button 
            onClick={handleCopy} 
            className="glass-panel hover:bg-white/10 transition-all duration-300 w-11 h-11 rounded-full flex items-center justify-center shrink-0 cursor-pointer active:scale-95"
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

        {/* Steps - Taking 2/3 width */}
        {finalSteps.length > 0 && (
          <div className="lg:col-span-2 glass-panel bg-white/[0.01] hover:bg-white/[0.03] transition-colors border-white/[0.03] p-6 lg:p-8 rounded-[1.5rem]">
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
        </div>

      </div>
    </motion.div>
  );
}
