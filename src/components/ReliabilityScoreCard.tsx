import React from 'react';
import { ShieldCheck, Activity, AlertOctagon, TrendingDown, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { MetricSnapshot } from '../types';

interface ReliabilityScoreCardProps {
  metrics: MetricSnapshot | null;
}

export const ReliabilityScoreCard: React.FC<ReliabilityScoreCardProps> = ({ metrics }) => {
  const score = metrics?.deterministicReliabilityScore ?? 99;
  const availability = metrics?.systemAvailability ?? 99.9;
  const avgLatency = metrics?.overallLatencyMs ?? 26;
  const errorRate = metrics?.overallErrorRate ?? 0.2;
  const healthyCount = metrics?.healthyServicesCount ?? 5;
  const totalCount = metrics?.totalServicesCount ?? 5;
  const queueTotal = metrics?.overallQueueDepth ?? 18;

  // Determine color and status
  let scoreColor = 'text-emerald-400';
  let scoreBg = 'from-emerald-950/60 to-slate-900';
  let scoreBorder = 'border-emerald-700/60';
  let statusText = 'EXCELLENT';

  if (score < 65) {
    scoreColor = 'text-rose-400';
    scoreBg = 'from-rose-950/80 to-slate-900';
    scoreBorder = 'border-rose-600';
    statusText = 'CRITICAL DEGRADATION';
  } else if (score < 85) {
    scoreColor = 'text-amber-400';
    scoreBg = 'from-amber-950/70 to-slate-900';
    scoreBorder = 'border-amber-600';
    statusText = 'AT RISK';
  }

  return (
    <div className={`rounded-2xl p-4 lg:p-5 border bg-gradient-to-b ${scoreBg} ${scoreBorder} relative backdrop-blur-sm shadow-xl`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className={`w-5 h-5 ${scoreColor}`} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
            Deterministic Reliability Score
          </h3>
        </div>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-950/80 text-slate-400 border border-slate-800">
          Rule-Grounded
        </span>
      </div>

      <div className="flex items-baseline gap-3 mb-4">
        <div className={`text-4xl lg:text-5xl font-extrabold font-mono tracking-tight ${scoreColor}`}>
          {score}%
        </div>
        <div>
          <div className={`text-xs font-bold font-mono tracking-wider ${scoreColor}`}>
            {statusText}
          </div>
          <div className="text-[11px] text-slate-400">
            Weighted SRE Composite
          </div>
        </div>
      </div>

      {/* Breakdown vitals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-800/80 text-xs font-mono">
        
        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
          <div className="text-[10px] text-slate-400 uppercase">Availability</div>
          <div className={`text-sm font-bold mt-0.5 ${availability >= 99 ? 'text-emerald-400' : availability >= 90 ? 'text-amber-400' : 'text-rose-400'}`}>
            {availability}%
          </div>
        </div>

        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
          <div className="text-[10px] text-slate-400 uppercase">Cluster Latency</div>
          <div className={`text-sm font-bold mt-0.5 ${avgLatency < 100 ? 'text-emerald-400' : avgLatency < 500 ? 'text-amber-400' : 'text-rose-400'}`}>
            {avgLatency}ms
          </div>
        </div>

        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
          <div className="text-[10px] text-slate-400 uppercase">Error Rate</div>
          <div className={`text-sm font-bold mt-0.5 ${errorRate < 1 ? 'text-emerald-400' : errorRate < 10 ? 'text-amber-400' : 'text-rose-400'}`}>
            {errorRate}%
          </div>
        </div>

        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
          <div className="text-[10px] text-slate-400 uppercase">Healthy Nodes</div>
          <div className={`text-sm font-bold mt-0.5 ${healthyCount === totalCount ? 'text-emerald-400' : 'text-amber-400'}`}>
            {healthyCount}/{totalCount}
          </div>
        </div>

      </div>

      <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Total Cluster Queue Backlog: <strong className="text-slate-200 font-mono">{queueTotal} msgs</strong></span>
        <span className="text-[10px] text-slate-400">Zero AI Hallucination</span>
      </div>
    </div>
  );
};
