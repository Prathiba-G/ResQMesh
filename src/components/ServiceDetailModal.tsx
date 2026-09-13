import React from 'react';
import { 
  X, 
  Server, 
  Layers, 
  Activity, 
  RotateCcw, 
  TrendingUp, 
  Flame, 
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Sliders
} from 'lucide-react';
import { ServiceId, ServiceState, RemediationActionType } from '../types';

interface ServiceDetailModalProps {
  service: ServiceState | null;
  onClose: () => void;
  onExecuteAction: (action: RemediationActionType, targetService: ServiceId, params?: any) => void;
  onInjectChaos: (targetService: ServiceId, chaos: any) => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  onClose,
  onExecuteAction,
  onInjectChaos,
}) => {
  if (!service) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-mono">{service.name}</h2>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  service.status === 'HEALTHY' 
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                    : 'bg-rose-950 text-rose-300 border-rose-800'
                }`}>
                  {service.status}
                </span>
                <span className="text-xs text-slate-500 font-mono">v{service.version}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{service.role}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Detailed Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 my-5 font-mono text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase block">Response Latency</span>
            <span className={`text-lg font-bold ${service.latencyMs > 200 ? 'text-rose-400' : 'text-slate-100'}`}>
              {service.latencyMs}ms
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase block">Error Rate</span>
            <span className={`text-lg font-bold ${service.errorRate > 5 ? 'text-rose-400' : 'text-slate-100'}`}>
              {service.errorRate}%
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase block">Queue Depth</span>
            <span className={`text-lg font-bold ${service.queueDepth > 10 ? 'text-amber-400' : 'text-slate-100'}`}>
              {service.queueDepth} msgs
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase block">Active Replicas</span>
            <span className="text-lg font-bold text-slate-100">
              {service.replicas} <span className="text-xs text-slate-500 font-normal">/ max {service.maxReplicas}</span>
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase block">CPU Utilization</span>
            <span className="text-lg font-bold text-slate-100">{service.cpuPercent}%</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase block">RAM Memory</span>
            <span className="text-lg font-bold text-slate-100">{service.memoryPercent}%</span>
          </div>
        </div>

        {/* Upstream & Downstream Dependencies */}
        <div className="mb-5 bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400 text-[10px] uppercase font-mono block mb-1.5">
            Architectural Topology Dependencies:
          </span>
          <div className="flex flex-wrap gap-2">
            {service.dependencies.length === 0 ? (
              <span className="text-slate-500 italic">No downstream dependencies (Leaf Node)</span>
            ) : (
              service.dependencies.map((dep) => (
                <span key={dep} className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs">
                  → {dep}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div>
          <span className="text-slate-400 text-[10px] uppercase font-mono block mb-2">
            Operator Remediation Actions (Governed by SRE Policy):
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => onExecuteAction('restart_service', service.id)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              Restart Pods
            </button>
            <button
              onClick={() => onExecuteAction('scale_service', service.id, { replicas: Math.min(service.maxReplicas, service.replicas + 1) })}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Scale +1 Pod
            </button>
            <button
              onClick={() => onExecuteAction('clear_queue_backlog', service.id)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              Drain Queue
            </button>
            <button
              onClick={() => onExecuteAction('recover_dependency', service.id)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              Reset Pool
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
