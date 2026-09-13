import React from 'react';
import { 
  ShieldCheck, 
  Play, 
  Square, 
  Layers, 
  RotateCcw, 
  Zap, 
  Cpu, 
  Activity,
  Send,
  ToggleLeft,
  ToggleRight,
  Info
} from 'lucide-react';
import { SystemSnapshot } from '../types';

interface HeaderProps {
  snapshot: SystemSnapshot | null;
  onStartDemo: () => void;
  onStopDemo: () => void;
  onToggleAutoRemediation: (enabled: boolean) => void;
  onClearChaos: () => void;
  onOpenArchitecture: () => void;
  onTestTransaction: () => void;
  isTestingTransaction: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  snapshot,
  onStartDemo,
  onStopDemo,
  onToggleAutoRemediation,
  onClearChaos,
  onOpenArchitecture,
  onTestTransaction,
  isTestingTransaction,
}) => {
  const isDemoActive = snapshot?.demoMode.active ?? false;
  const autoRemediation = snapshot?.autoRemediationEnabled ?? true;
  const score = snapshot?.currentMetrics.deterministicReliabilityScore ?? 99;
  const availability = snapshot?.currentMetrics.systemAvailability ?? 99.9;
  const activeIncidentsCount = snapshot?.activeIncidents.length ?? 0;

  return (
    <header className="border-b border-slate-800 bg-[#0d131f]/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        
        {/* Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5 font-mono">
                RESQ<span className="text-cyan-400">MESH</span>
              </h1>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 tracking-wider">
                PS07 Cloud-Native
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                SSE Connected
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Autonomous Self-Healing Reliability Layer • Observe → Predict → Govern → Heal
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          
          {/* Reliability Score Pill */}
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-400 font-medium">Reliability:</span>
            <span className={`font-mono font-bold text-sm ${
              score >= 90 ? 'text-emerald-400' : score >= 70 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {score}%
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 hidden lg:inline">Avail:</span>
            <span className="font-mono text-slate-200 hidden lg:inline">{availability}%</span>
            {activeIncidentsCount > 0 && (
              <span className="bg-rose-950 text-rose-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-rose-800 animate-pulse">
                {activeIncidentsCount} ALARM{activeIncidentsCount > 1 ? 'S' : ''}
              </span>
            )}
          </div>

          {/* Auto-Remediation Toggle */}
          <button
            onClick={() => onToggleAutoRemediation(!autoRemediation)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              autoRemediation 
                ? 'bg-cyan-950/60 border-cyan-700/60 text-cyan-300 hover:bg-cyan-900/60' 
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
            title="When active, AI & Policy Engine autonomously execute permitted self-healing plans"
          >
            {autoRemediation ? (
              <ToggleRight className="w-4 h-4 text-cyan-400" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-slate-500" />
            )}
            <span>Auto-Healing: {autoRemediation ? 'ON' : 'MANUAL'}</span>
          </button>

          {/* Test Transaction Button */}
          <button
            onClick={onTestTransaction}
            disabled={isTestingTransaction}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            title="Execute a synthetic user order transaction through Gateway -> Order -> Payment -> DB"
          >
            <Send className={`w-3.5 h-3.5 ${isTestingTransaction ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Trace</span> Request
          </button>

          {/* Guided Demo Button */}
          {isDemoActive ? (
            <button
              onClick={onStopDemo}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow-lg shadow-rose-950"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Demo</span>
            </button>
          ) : (
            <button
              onClick={onStartDemo}
              className="relative group flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-lg shadow-cyan-900/30 ring-1 ring-cyan-400/50"
            >
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-300"></span>
              </span>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>RUN FULL INCIDENT DEMO</span>
            </button>
          )}

          {/* Clear Chaos */}
          <button
            onClick={onClearChaos}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors"
            title="Clear all injected chaos and restore baseline nominal state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset</span>
          </button>

          {/* Architecture Modal */}
          <button
            onClick={onOpenArchitecture}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
            title="View Cloud-Native Architecture & Design Specifications"
          >
            <Info className="w-4 h-4" />
          </button>

        </div>
      </div>
    </header>
  );
};
