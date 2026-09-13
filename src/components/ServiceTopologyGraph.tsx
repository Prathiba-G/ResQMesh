import React from 'react';
import { 
  Server, 
  Database, 
  Layers, 
  CreditCard, 
  Bell, 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle2, 
  Flame,
  ArrowDownRight,
  ArrowRight,
  Radio,
  ExternalLink
} from 'lucide-react';
import { ServiceId, ServiceState, HealthStatus } from '../types';

interface ServiceTopologyGraphProps {
  services: Record<ServiceId, ServiceState>;
  onSelectService: (serviceId: ServiceId) => void;
  selectedServiceId: ServiceId | null;
}

export const ServiceTopologyGraph: React.FC<ServiceTopologyGraphProps> = ({
  services,
  onSelectService,
  selectedServiceId,
}) => {
  const getStatusColor = (status: HealthStatus) => {
    switch (status) {
      case 'HEALTHY':
        return {
          bg: 'bg-emerald-950/40',
          border: 'border-emerald-500/50',
          badge: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/60',
          glow: 'shadow-emerald-500/10',
          dot: 'bg-emerald-400',
        };
      case 'DEGRADED':
        return {
          bg: 'bg-amber-950/40',
          border: 'border-amber-500/60',
          badge: 'bg-amber-900/60 text-amber-300 border-amber-700/60',
          glow: 'shadow-amber-500/20 ring-1 ring-amber-500/40',
          dot: 'bg-amber-400 animate-pulse',
        };
      case 'CRITICAL':
        return {
          bg: 'bg-rose-950/60',
          border: 'border-rose-500/80',
          badge: 'bg-rose-900/80 text-rose-200 border-rose-600',
          glow: 'shadow-rose-500/30 ring-2 ring-rose-500 animate-pulse',
          dot: 'bg-rose-400 animate-ping',
        };
      case 'DOWN':
        return {
          bg: 'bg-red-950/90',
          border: 'border-red-600',
          badge: 'bg-red-950 text-red-300 border-red-800',
          glow: 'shadow-red-900/50 ring-2 ring-red-600',
          dot: 'bg-red-500',
        };
    }
  };

  const getServiceIcon = (id: ServiceId) => {
    switch (id) {
      case 'api-gateway':
        return Radio;
      case 'order-service':
        return Layers;
      case 'payment-service':
        return CreditCard;
      case 'notification-service':
        return Bell;
      case 'database':
        return Database;
    }
  };

  const renderNode = (id: ServiceId, label: string, role: string) => {
    const s = services[id];
    if (!s) return null;
    const colors = getStatusColor(s.status);
    const Icon = getServiceIcon(id);
    const isSelected = selectedServiceId === id;
    const hasChaos = s.activeChaos.length > 0;

    return (
      <div
        onClick={() => onSelectService(id)}
        className={`relative cursor-pointer transition-all duration-300 rounded-xl p-3 border ${colors.bg} ${colors.border} ${colors.glow} ${
          isSelected ? 'ring-2 ring-cyan-400 scale-[1.02]' : 'hover:scale-[1.01]'
        } backdrop-blur-sm`}
      >
        {/* Chaos indicator ribbon */}
        {hasChaos && (
          <div className="absolute -top-2.5 -right-2 bg-gradient-to-r from-rose-600 to-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md animate-bounce">
            <Flame className="w-3 h-3" />
            <span>CHAOS ACTIVE</span>
          </div>
        )}

        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-cyan-400`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5">
                {label}
                <ExternalLink className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-[11px] text-slate-400 line-clamp-1">{role}</p>
            </div>
          </div>

          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${colors.badge} flex items-center gap-1`}>
            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}></span>
            {s.status}
          </span>
        </div>

        {/* Real-time microservice operational vitals */}
        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
          <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/50">
            <div className="text-slate-400 text-[9px] uppercase tracking-wider">Latency</div>
            <div className={`font-bold ${s.latencyMs > 300 ? 'text-rose-400' : s.latencyMs > 100 ? 'text-amber-400' : 'text-slate-200'}`}>
              {s.latencyMs}ms
            </div>
          </div>
          <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/50">
            <div className="text-slate-400 text-[9px] uppercase tracking-wider">Errors</div>
            <div className={`font-bold ${s.errorRate > 10 ? 'text-rose-400' : s.errorRate > 1 ? 'text-amber-400' : 'text-slate-200'}`}>
              {s.errorRate}%
            </div>
          </div>
          <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/50">
            <div className="text-slate-400 text-[9px] uppercase tracking-wider">Queue</div>
            <div className={`font-bold ${s.queueDepth > 15 ? 'text-rose-400' : s.queueDepth > 5 ? 'text-amber-400' : 'text-slate-200'}`}>
              {s.queueDepth}
            </div>
          </div>
        </div>

        {/* Replicas & traffic weight pill */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono">
          <span>Replicas: <strong className="text-slate-200">{s.replicas}</strong></span>
          <span>Health: <strong className={s.healthScore > 80 ? 'text-emerald-400' : 'text-amber-400'}>{s.healthScore}/100</strong></span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-4 lg:p-5 relative overflow-hidden backdrop-blur-sm">
      {/* Background grid accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

      {/* Header title */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            Live Service Topology & Dependency Mesh
          </h2>
          <p className="text-xs text-slate-400">
            Click any microservice node to inspect thread pools, queues, and inject targeted chaos
          </p>
        </div>
        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Healthy
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Degraded
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" /> Critical/Down
          </span>
        </div>
      </div>

      {/* Dependency Mesh Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        
        {/* Tier 1: Ingress API Gateway */}
        <div className="md:col-span-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 px-1 flex items-center gap-1">
            <span>Tier 1: Ingress Layer</span>
          </div>
          {renderNode('api-gateway', 'API Gateway', 'Ingress Router & Rate Limiter')}
        </div>

        {/* Ingress Edge Arrow */}
        <div className="hidden md:flex md:col-span-1 justify-center">
          <div className="flex flex-col items-center">
            <div className="w-8 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 animate-pulse" />
            <span className="text-[10px] text-cyan-400 font-mono mt-1">HTTP</span>
          </div>
        </div>

        {/* Tier 2: Order Service */}
        <div className="md:col-span-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 px-1">
            <span>Tier 2: Orchestrator</span>
          </div>
          {renderNode('order-service', 'Order Service', 'Checkout Workflow & Sagas')}
        </div>

        {/* Processing Edge Arrow */}
        <div className="hidden md:flex md:col-span-1 justify-center">
          <div className="flex flex-col items-center">
            <div className="w-8 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse" />
            <span className="text-[10px] text-indigo-400 font-mono mt-1">gRPC</span>
          </div>
        </div>

        {/* Tier 3: Payment Service */}
        <div className="md:col-span-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 px-1">
            <span>Tier 3: Payment Gateway</span>
          </div>
          {renderNode('payment-service', 'Payment Service', 'PCI Gateway & Tokenization')}
        </div>

      </div>

      {/* Downstream Tier: Database & Asynchronous Notification Service */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-3 mt-4 pt-3 border-t border-slate-800/80">
        
        {/* Notification Service */}
        <div className="md:col-span-6">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 px-1 flex items-center gap-1">
            <span>Asynchronous Event Consumer (Pub/Sub)</span>
          </div>
          {renderNode('notification-service', 'Notification Service', 'Email, SMS & Webhooks (Worker Queue)')}
        </div>

        {/* Shared Database */}
        <div className="md:col-span-6">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 px-1 flex items-center gap-1">
            <span>State Persistence (PostgreSQL Cluster)</span>
          </div>
          {renderNode('database', 'PostgreSQL DB', 'Orders, Ledgers & Inventory Pool')}
        </div>

      </div>

    </div>
  );
};
