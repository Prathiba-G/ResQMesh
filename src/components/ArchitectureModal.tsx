import React from 'react';
import { 
  X, 
  ShieldCheck, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  Terminal, 
  Activity, 
  Lock, 
  Server,
  Cpu,
  ArrowRight
} from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const loopPhases = [
    { name: 'OBSERVE', desc: 'Real-time telemetry stream of golden signals (Latency, Error Rate, Queue Depth, Saturation)' },
    { name: 'DETECT', desc: 'Statistical anomaly detection evaluating deviations against baseline thresholds' },
    { name: 'PREDICT', desc: 'Downstream cascade risk modeling identifying probable blast radius propagation' },
    { name: 'EXPLAIN', desc: 'Gemini 3.8 Flash multi-variable correlation grounded purely in real telemetry facts' },
    { name: 'PLAN', desc: 'Synthesizing targeted reliability playbook action (Restart, Scale, Drain, Reroute)' },
    { name: 'GOVERN', desc: 'Deterministic SRE policy validator verifying scaling envelopes and rate-limit guardrails' },
    { name: 'EXECUTE', desc: 'Autonomous execution engine applying permitted recovery mutations to the cluster' },
    { name: 'VERIFY', desc: 'Post-recovery verification confirming health restoration and publishing audit scorecards' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl max-h-[90vh] rounded-2xl p-6 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                ResQMesh Architecture & Design Philosophy
              </h2>
              <p className="text-xs text-slate-400">
                Autonomous Self-Healing Reliability Layer for Cloud-Native Infrastructure
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1 text-xs">
          
          {/* Loop Diagram */}
          <div>
            <h3 className="text-xs font-bold uppercase font-mono text-cyan-400 tracking-wider mb-2 flex items-center gap-1.5">
              <Activity className="w-4 h-4" />
              The ResQMesh 8-Stage Self-Healing Control Loop
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {loopPhases.map((phase, i) => (
                <div key={phase.name} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-start gap-2">
                  <span className="font-mono font-bold text-cyan-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-[10px]">
                    0{i + 1}
                  </span>
                  <div>
                    <strong className="text-white font-mono text-xs block">{phase.name}</strong>
                    <span className="text-slate-400 text-[11px] leading-relaxed">{phase.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI vs Determinism Division of Responsibility */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <h3 className="text-xs font-bold uppercase font-mono text-white tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Separation of Concerns: AI Reasoning vs. Deterministic Governance
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <strong className="text-emerald-400 font-mono block mb-1">
                  ✓ Deterministic Core (Never Hallucinates)
                </strong>
                <ul className="space-y-1 text-slate-300 list-disc list-inside">
                  <li>Composite Reliability Score calculation</li>
                  <li>Golden signal metric threshold evaluation</li>
                  <li>SRE policy allowlists & scaling boundary guardrails</li>
                  <li>Anti-flapping action cooldown timers</li>
                  <li>Actual container socket & worker execution</li>
                </ul>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-lg border border-cyan-900/60">
                <strong className="text-cyan-400 font-mono block mb-1">
                  ✓ Gemini 3.8 Flash (Cognitive Layer)
                </strong>
                <ul className="space-y-1 text-slate-300 list-disc list-inside">
                  <li>Telemetry metric anomaly correlation</li>
                  <li>Plain-English root cause explanation ("WHY")</li>
                  <li>Multi-tier dependency bottleneck diagnosis</li>
                  <li>Targeted remediation recommendation</li>
                  <li>Operator incident briefing summaries</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Cloud Native Production Mapping */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <h3 className="text-xs font-bold uppercase font-mono text-white tracking-wider mb-2 flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-400" />
              Production Cloud-Native & Kubernetes Mapping
            </h3>
            <p className="text-slate-300 leading-relaxed mb-3">
              In a hyperscale Kubernetes deployment, ResQMesh operates as a native Control Plane Operator:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Telemetry Source:</span>
                <strong className="text-white">Prometheus + OpenTelemetry</strong>
              </div>
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Service Mesh:</span>
                <strong className="text-white">Envoy / Istio Sidecars</strong>
              </div>
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Policy Gate:</span>
                <strong className="text-white">OPA / Kyverno Webhooks</strong>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold transition-colors"
          >
            Close Architecture Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
