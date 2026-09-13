import React from 'react';
import { Sparkles, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck, Flame } from 'lucide-react';
import { SystemSnapshot } from '../types';

interface DemoProgressBarProps {
  demoMode: SystemSnapshot['demoMode'];
}

export const DemoProgressBar: React.FC<DemoProgressBarProps> = ({ demoMode }) => {
  if (!demoMode.active && demoMode.stage !== 'COMPLETED') return null;

  const steps = [
    { title: 'Baseline', icon: CheckCircle2 },
    { title: 'Chaos Injection', icon: Flame },
    { title: 'Cascade Surge', icon: AlertTriangle },
    { title: 'AI RCA', icon: Sparkles },
    { title: 'Policy Check', icon: ShieldCheck },
    { title: 'Self-Healing', icon: ArrowRight },
    { title: 'Verified Recovery', icon: CheckCircle2 },
  ];

  return (
    <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border-b border-cyan-800/40 px-4 py-2.5">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
          
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
              Live Demo Orchestration Flow
            </span>
            <span className="text-xs text-slate-300 font-medium hidden sm:inline">
              — {demoMode.description}
            </span>
          </div>

          <div className="text-xs font-mono text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-800/60 self-start md:self-auto">
            STAGE {demoMode.stepIndex}/{demoMode.totalSteps}
          </div>
        </div>

        {/* Step dots */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {steps.map((step, idx) => {
            const stepNum = idx + 1;
            const isPassed = demoMode.stepIndex > stepNum || demoMode.stage === 'COMPLETED';
            const isCurrent = demoMode.stepIndex === stepNum && demoMode.stage !== 'COMPLETED';
            const isPending = demoMode.stepIndex < stepNum && demoMode.stage !== 'COMPLETED';
            const Icon = step.icon;

            return (
              <div 
                key={step.title}
                className={`relative flex items-center gap-1.5 p-1.5 rounded-lg border text-xs transition-all ${
                  isCurrent
                    ? 'bg-cyan-900/50 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-950 ring-1 ring-cyan-400/40'
                    : isPassed
                    ? 'bg-slate-900/90 border-emerald-800/50 text-emerald-400'
                    : 'bg-slate-950/60 border-slate-800 text-slate-500'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'animate-bounce text-cyan-300' : ''}`} />
                <span className="font-medium truncate hidden md:inline text-[11px]">{step.title}</span>
                {isCurrent && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
