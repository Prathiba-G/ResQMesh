import React, { useState } from 'react';
import { 
  Terminal, 
  Clock, 
  Filter, 
  ShieldCheck, 
  Sparkles, 
  Flame, 
  AlertTriangle, 
  Activity,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { SystemEvent } from '../types';

interface AuditTimelineProps {
  events: SystemEvent[];
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ events }) => {
  const [filterSource, setFilterSource] = useState<string>('ALL');

  const filteredEvents = events.filter((ev) => {
    if (filterSource === 'ALL') return true;
    if (filterSource === 'AI' && ev.source === 'AI_AGENT') return true;
    if (filterSource === 'POLICY' && ev.source === 'POLICY_ENGINE') return true;
    if (filterSource === 'CHAOS' && (ev.source === 'CHAOS_LAB' || ev.type.includes('CHAOS'))) return true;
    if (filterSource === 'REMEDIATION' && (ev.source === 'REMEDIATION_ENGINE' || ev.type.includes('REMEDIATION'))) return true;
    return false;
  });

  const getEventBadge = (severity: SystemEvent['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-950 text-rose-300 border-rose-700';
      case 'ERROR':
        return 'bg-red-950 text-red-300 border-red-700';
      case 'WARN':
        return 'bg-amber-950 text-amber-300 border-amber-700';
      case 'INFO':
      default:
        return 'bg-cyan-950 text-cyan-300 border-cyan-800';
    }
  };

  const getSourceIcon = (source: SystemEvent['source']) => {
    switch (source) {
      case 'AI_AGENT':
        return Sparkles;
      case 'POLICY_ENGINE':
        return ShieldCheck;
      case 'CHAOS_LAB':
        return Flame;
      case 'REMEDIATION_ENGINE':
        return CheckCircle2;
      default:
        return Activity;
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 lg:p-5 relative backdrop-blur-sm shadow-xl flex flex-col h-[520px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-cyan-400">
            <Terminal className="w-5 h-5 font-mono" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
              Autonomous Audit Trail & Event Stream
            </h3>
            <p className="text-xs text-slate-400">
              Deterministic log of telemetry anomalies, AI RCA inferences, policy checks, and recovery executions
            </p>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto text-xs font-mono">
          {['ALL', 'AI', 'POLICY', 'CHAOS', 'REMEDIATION'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterSource(cat)}
              className={`px-2 py-0.5 rounded-lg transition-colors ${
                filterSource === cat 
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events scrollable list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
        {filteredEvents.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 italic">
            No events recorded for current filter
          </div>
        ) : (
          filteredEvents.map((ev) => {
            const timeStr = new Date(ev.timestamp).toLocaleTimeString([], {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });
            const Icon = getSourceIcon(ev.source);

            return (
              <div 
                key={ev.id}
                className="bg-slate-950/70 hover:bg-slate-950 rounded-xl p-2.5 border border-slate-800/80 transition-colors flex items-start gap-2.5"
              >
                <div className="text-slate-500 text-[11px] shrink-0 pt-0.5">
                  {timeStr}
                </div>

                <div className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${getEventBadge(ev.severity)}`}>
                      {ev.severity}
                    </span>
                    <span className="text-slate-400 text-[10px] font-semibold truncate">
                      [{ev.source}] {ev.type}
                    </span>
                  </div>
                  <p className="text-slate-200 text-xs leading-relaxed break-words font-sans">
                    {ev.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
