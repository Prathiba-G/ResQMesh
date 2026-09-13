import React, { useState } from 'react';
import { 
  AlertOctagon, 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert, 
  Play, 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Cpu,
  Layers,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { Incident, RemediationActionType } from '../types';

interface ActiveIncidentCardProps {
  incident: Incident;
  onExecuteRemediation: (action: RemediationActionType, targetService: any, params?: any) => void;
  onTriggerAIRCA: (incidentId: string) => void;
  isAnalyzingAI: boolean;
}

export const ActiveIncidentCard: React.FC<ActiveIncidentCardProps> = ({
  incident,
  onExecuteRemediation,
  onTriggerAIRCA,
  isAnalyzingAI,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const plan = incident.remediationPlan;
  const policy = plan?.policy;
  const isExecuting = plan?.status === 'EXECUTING';
  const isVerified = plan?.status === 'VERIFIED';
  const isResolved = incident.status === 'RESOLVED';

  const getSeverityBadge = (sev: Incident['severity']) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-950 text-rose-300 border-rose-600';
      case 'HIGH':
        return 'bg-amber-950 text-amber-300 border-amber-600';
      case 'MEDIUM':
        return 'bg-yellow-950 text-yellow-300 border-yellow-700';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className={`rounded-2xl border transition-all ${
      isResolved 
        ? 'bg-slate-900/60 border-slate-800 opacity-90' 
        : 'bg-slate-900/90 border-rose-600/80 shadow-2xl shadow-rose-950/30'
    } p-4 lg:p-5 mb-4 backdrop-blur-md`}>
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg ${
            isResolved 
              ? 'bg-emerald-950/60 border border-emerald-700 text-emerald-400' 
              : 'bg-rose-950/80 border border-rose-700 text-rose-400 animate-pulse'
          }`}>
            {isResolved ? <CheckCircle2 className="w-5 h-5" /> : <AlertOctagon className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-400 font-bold">
                INCIDENT #{incident.id}
              </span>
              <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full border ${getSeverityBadge(incident.severity)}`}>
                {incident.severity}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                isResolved 
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                  : 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
              }`}>
                {incident.status}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mt-0.5">
              {incident.title}
            </h3>
          </div>
        </div>

        {/* Action button in header */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!isResolved && (
            <button
              onClick={() => onTriggerAIRCA(incident.id)}
              disabled={isAnalyzingAI}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 text-xs font-mono font-semibold transition-all shadow-sm"
              title="Query Gemini 3.8 Flash to interpret grounded telemetry and formulate recovery plan"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAnalyzingAI ? 'animate-spin text-cyan-400' : 'text-cyan-300'}`} />
              <span>{isAnalyzingAI ? 'Gemini Reasoning...' : 'Invoke AI RCA'}</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          
          {/* Grounded Evidence Matrix */}
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Telemetry Evidence Detected:</span>
              <span className="text-slate-500">Culprit: <strong className="text-rose-400">{incident.culpritService}</strong></span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {incident.evidence.map((ev, i) => (
                <div key={i} className="bg-slate-950/80 rounded-xl p-2.5 border border-slate-800/80 text-xs font-mono">
                  <div className="text-slate-400 text-[10px] uppercase truncate">{ev.metric}</div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-rose-400 font-bold text-sm">{ev.observedValue}</span>
                    <span className="text-slate-500 text-[11px]">base: {ev.baselineValue}</span>
                  </div>
                  <div className="text-[10px] text-rose-400/90 mt-0.5">
                    +{ev.deviationPercent}% deviation above safety baseline
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Root Cause Analysis Section */}
          <div className="bg-gradient-to-r from-slate-950 via-cyan-950/20 to-slate-950 rounded-xl p-3.5 border border-cyan-800/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold font-mono text-cyan-300 uppercase tracking-wider">
                  AI Root Cause Explanation (Grounded in Telemetry)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Model: {incident.rootCauseAnalysis.analyzedBy}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Confidence: {incident.rootCauseAnalysis.confidence}%
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-medium leading-relaxed mb-2">
              {incident.rootCauseAnalysis.summary}
            </p>

            <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
              <strong className="text-cyan-400 font-mono text-[11px] block mb-1">
                WHY THIS ACTION IS RECOMMENDED:
              </strong>
              {incident.rootCauseAnalysis.explanation}
            </div>
          </div>

          {/* SRE Policy Governance & Execution Layer */}
          {plan && (
            <div className="bg-slate-950/90 rounded-xl p-3.5 border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">
                    SRE Policy Governance & Autonomous Remediation
                  </span>
                </div>

                {policy && (
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                    policy.decision === 'APPROVED' 
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700' 
                      : 'bg-rose-950 text-rose-300 border-rose-700'
                  }`}>
                    POLICY {policy.decision}: {policy.ruleEvaluated}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center text-xs font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Action Proposed</span>
                  <strong className="text-cyan-400 text-sm">{plan.recommendedAction}</strong>
                  <span className="text-slate-500 text-[11px] block">Target: {plan.targetService}</span>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Policy Verification</span>
                  <span className="text-slate-300 text-[11px] line-clamp-2">{policy?.reason || 'Verified within safety limits'}</span>
                </div>

                <div className="flex justify-end">
                  {!isResolved ? (
                    <button
                      onClick={() => onExecuteRemediation(plan.recommendedAction, plan.targetService, plan.targetParams)}
                      disabled={isExecuting || policy?.decision === 'REJECTED'}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all ${
                        isExecuting
                          ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 animate-pulse'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950 ring-1 ring-emerald-400/50'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isExecuting ? 'Self-Healing Executing...' : 'Execute Recovery Plan'}</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-xs bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-800">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Recovery Verified & Closed</span>
                    </div>
                  )}
                </div>
              </div>

              {plan.verificationDetails && (
                <div className="mt-3 pt-2 border-t border-slate-800/60 text-[11px] text-emerald-300 font-mono flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{plan.verificationDetails}</span>
                </div>
              )}
            </div>
          )}

          {/* Recovery comparison scorecard if resolved */}
          {incident.recoveryComparison && (
            <div className="bg-emerald-950/30 rounded-xl p-3 border border-emerald-800/40 text-xs font-mono">
              <div className="text-[10px] uppercase font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified Before vs After Health Scorecard:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Availability</span>
                  <span className="text-rose-400 line-through">{incident.recoveryComparison.before.availability}%</span>
                  <span className="text-emerald-400 font-bold ml-1.5">→ {incident.recoveryComparison.after.availability}%</span>
                </div>
                <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Latency</span>
                  <span className="text-rose-400 line-through">{incident.recoveryComparison.before.latencyMs}ms</span>
                  <span className="text-emerald-400 font-bold ml-1.5">→ {incident.recoveryComparison.after.latencyMs}ms</span>
                </div>
                <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Error Rate</span>
                  <span className="text-rose-400 line-through">{incident.recoveryComparison.before.errorRate}%</span>
                  <span className="text-emerald-400 font-bold ml-1.5">→ {incident.recoveryComparison.after.errorRate}%</span>
                </div>
                <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Healthy Services</span>
                  <span className="text-rose-400 line-through">{incident.recoveryComparison.before.healthyServices}</span>
                  <span className="text-emerald-400 font-bold ml-1.5">→ {incident.recoveryComparison.after.healthyServices}</span>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
