import React, { useState } from 'react';
import { 
  Flame, 
  Clock, 
  AlertOctagon, 
  Skull, 
  TrendingUp, 
  Database, 
  Cpu, 
  Unplug, 
  RotateCcw,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { ServiceId, ChaosType, ServiceState } from '../types';

interface ChaosLabProps {
  services: Record<ServiceId, ServiceState>;
  onInjectChaos: (serviceId: ServiceId, chaos: ChaosType) => void;
  onClearChaos: (serviceId?: ServiceId) => void;
}

export const ChaosLab: React.FC<ChaosLabProps> = ({
  services,
  onInjectChaos,
  onClearChaos,
}) => {
  const [selectedService, setSelectedService] = useState<ServiceId>('payment-service');

  const chaosActions: Array<{
    type: ChaosType;
    label: string;
    description: string;
    icon: any;
    color: string;
  }> = [
    {
      type: 'HIGH_LATENCY',
      label: 'High Latency (+1.8s)',
      description: 'Injects network stall & connection delay into service thread workers',
      icon: Clock,
      color: 'hover:border-amber-500 hover:text-amber-300 hover:bg-amber-950/40',
    },
    {
      type: 'ERROR_SPIKE',
      label: 'Error Spike (500s)',
      description: 'Forces 45% HTTP 500/503 errors on transactional endpoints',
      icon: AlertOctagon,
      color: 'hover:border-rose-500 hover:text-rose-300 hover:bg-rose-950/40',
    },
    {
      type: 'KILL_SERVICE',
      label: 'Kill Service Instance',
      description: 'Crashes container pods, cutting all network connections immediately',
      icon: Skull,
      color: 'hover:border-red-600 hover:text-red-300 hover:bg-red-950/50',
    },
    {
      type: 'TRAFFIC_SURGE',
      label: 'Traffic Surge (4.5x RPS)',
      description: 'Simulates flash-sale load spike exceeding worker queue capacity',
      icon: TrendingUp,
      color: 'hover:border-purple-500 hover:text-purple-300 hover:bg-purple-950/40',
    },
    {
      type: 'DB_FAILURE',
      label: 'Database Failure',
      description: 'Simulates PostgreSQL pool exhaustion and deadlocked connection pool',
      icon: Database,
      color: 'hover:border-orange-500 hover:text-orange-300 hover:bg-orange-950/40',
    },
    {
      type: 'MEMORY_PRESSURE',
      label: 'Memory Pressure (95%)',
      description: 'Simulates memory leak causing JVM/Node GC pauses and throttling',
      icon: Cpu,
      color: 'hover:border-blue-500 hover:text-blue-300 hover:bg-blue-950/40',
    },
    {
      type: 'DEPENDENCY_FAILURE',
      label: 'Dependency Failure',
      description: 'Drops external payment processor gateway and third-party APIs',
      icon: Unplug,
      color: 'hover:border-pink-500 hover:text-pink-300 hover:bg-pink-950/40',
    },
  ];

  const targetServiceState = services[selectedService];
  const activeChaos = targetServiceState?.activeChaos ?? [];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 lg:p-5 relative backdrop-blur-sm shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-400">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
              Chaos & Fault Injection Lab
            </h3>
            <p className="text-xs text-slate-400">
              Inject real microservice failures to test live detection, cascade risk, and auto-healing
            </p>
          </div>
        </div>

        {/* Global reset */}
        <button
          onClick={() => onClearChaos()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Clear All Chaos
        </button>
      </div>

      {/* Target service selector tabs */}
      <div className="mb-4">
        <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
          Select Target Microservice:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(Object.keys(services) as ServiceId[]).map((id) => {
            const svc = services[id];
            const isSelected = selectedService === id;
            const hasChaos = svc.activeChaos.length > 0;

            return (
              <button
                key={id}
                onClick={() => setSelectedService(id)}
                className={`p-2 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/50'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                {hasChaos && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                )}
                <div className="font-semibold text-xs truncate">{svc.name}</div>
                <div className="text-[10px] font-mono mt-0.5 flex items-center justify-between">
                  <span className={svc.status === 'HEALTHY' ? 'text-emerald-400' : 'text-rose-400'}>
                    {svc.status}
                  </span>
                  <span className="text-slate-500">{svc.latencyMs}ms</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action buttons grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
        {chaosActions.map((action) => {
          const Icon = action.icon;
          const isTriggered = activeChaos.includes(action.type);

          return (
            <button
              key={action.type}
              onClick={() => onInjectChaos(selectedService, action.type)}
              className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                isTriggered
                  ? 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-md ring-1 ring-rose-500'
                  : `bg-slate-950/70 border-slate-800 text-slate-300 ${action.color}`
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-semibold text-xs flex items-center gap-1.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  {action.label}
                </span>
                {isTriggered && (
                  <span className="text-[9px] font-mono bg-rose-900 text-rose-200 px-1.5 py-0.5 rounded font-bold uppercase animate-pulse">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {action.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Curated 1-Click Judge Scenarios */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="font-medium">Curated Chaos Scenarios:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onInjectChaos('payment-service', 'HIGH_LATENCY')}
            className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px] transition-colors"
          >
            ⚡ Payment Gateway Stalling
          </button>
          <button
            onClick={() => onInjectChaos('database', 'DB_FAILURE')}
            className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px] transition-colors"
          >
            🔥 DB Pool Lockup
          </button>
          <button
            onClick={() => onInjectChaos('order-service', 'TRAFFIC_SURGE')}
            className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px] transition-colors"
          >
            📈 Flash Sale Queue Spike
          </button>
        </div>
      </div>
    </div>
  );
};
