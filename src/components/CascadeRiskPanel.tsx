import React from 'react';
import { AlertTriangle, ShieldAlert, ArrowRight, Activity, Zap, CheckCircle2 } from 'lucide-react';
import { CascadeRisk } from '../types';

interface CascadeRiskPanelProps {
  cascadeRisk: CascadeRisk | null;
}

export const CascadeRiskPanel: React.FC<CascadeRiskPanelProps> = ({ cascadeRisk }) => {
  const probability = cascadeRisk?.probability ?? 4;
  const level = cascadeRisk?.level ?? 'LOW';
  const culprit = cascadeRisk?.primaryCulprit;
  const affected = cascadeRisk?.affectedServices ?? [];
  const path = cascadeRisk?.propagationPath ?? [];
  const impact = cascadeRisk?.potentialImpact ?? 'Minimal nominal operations';

  const isHighRisk = level === 'HIGH' || level === 'CRITICAL';

  const getLevelColor = () => {
    switch (level) {
      case 'CRITICAL':
        return {
          text: 'text-rose-400',
          bg: 'bg-rose-950/60',
          border: 'border-rose-600',
          badge: 'bg-rose-900 text-rose-200 border-rose-600',
          bar: 'bg-rose-500',
        };
      case 'HIGH':
        return {
          text: 'text-amber-400',
          bg: 'bg-amber-950/50',
          border: 'border-amber-600',
          badge: 'bg-amber-900/80 text-amber-200 border-amber-600',
          bar: 'bg-amber-500',
        };
      case 'MEDIUM':
        return {
          text: 'text-yellow-400',
          bg: 'bg-yellow-950/30',
          border: 'border-yellow-700',
          badge: 'bg-yellow-900/60 text-yellow-300 border-yellow-700',
          bar: 'bg-yellow-500',
        };
      case 'LOW':
      default:
        return {
          text: 'text-emerald-400',
          bg: 'bg-slate-900/70',
          border: 'border-slate-800',
          badge: 'bg-emerald-950 text-emerald-400 border-emerald-800',
          bar: 'bg-emerald-500',
        };
    }
  };

  const colors = getLevelColor();

  return (
    <div className={`rounded-2xl p-4 lg:p-5 border ${colors.bg} ${colors.border} relative backdrop-blur-sm shadow-xl transition-all duration-300`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isHighRisk ? (
            <AlertTriangle className={`w-5 h-5 ${colors.text} animate-bounce`} />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          )}
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
            Cascading Failure Predictor
          </h3>
        </div>
        <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full border ${colors.badge}`}>
          {level} RISK
        </span>
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <div>
          <div className="text-[11px] text-slate-400 font-mono">CASCADE PROBABILITY</div>
          <div className={`text-4xl font-extrabold font-mono tracking-tight ${colors.text}`}>
            {probability}%
          </div>
        </div>
        {culprit && (
          <div className="text-right">
            <div className="text-[11px] text-slate-400 font-mono">PRIMARY BOTTLENECK</div>
            <span className="text-xs font-bold font-mono px-2 py-1 rounded bg-slate-950 text-rose-400 border border-slate-800 inline-block mt-0.5">
              {culprit}
            </span>
          </div>
        )}
      </div>

      {/* Probability meter bar */}
      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mb-3 border border-slate-800">
        <div 
          className={`h-full transition-all duration-500 ${colors.bar}`}
          style={{ width: `${Math.max(4, Math.min(100, probability))}%` }}
        />
      </div>

      {/* Affected services tag cloud */}
      <div className="mb-3">
        <div className="text-[10px] text-slate-400 uppercase font-mono mb-1">
          Affected Services in Blast Radius ({affected.length}):
        </div>
        {affected.length === 0 ? (
          <span className="text-xs text-slate-500 italic">No services currently threatened</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {affected.map((svc) => (
              <span 
                key={svc} 
                className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-slate-200"
              >
                {svc}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Cascade propagation chain */}
      {path.length > 0 && (
        <div className="bg-slate-950/70 rounded-lg p-2.5 border border-slate-800/80 mb-2">
          <div className="text-[10px] text-slate-400 uppercase font-mono mb-1 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Predicted Propagation Path:</span>
          </div>
          <div className="flex flex-col gap-1 text-[11px] font-mono">
            {path.map((step, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-slate-300">
                <span className="text-slate-500 font-bold">{idx + 1}.</span>
                <span className={idx === 0 ? 'text-rose-400 font-semibold' : 'text-slate-300'}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Potential impact summary */}
      <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
        <span className="text-slate-500 font-medium">Impact Assessment: </span>
        <span className="text-slate-300">{impact}</span>
      </div>
    </div>
  );
};
