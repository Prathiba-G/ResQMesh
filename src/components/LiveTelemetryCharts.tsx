import React, { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { Activity, Clock, AlertTriangle, Layers, Cpu, Server } from 'lucide-react';
import { MetricSnapshot } from '../types';

interface LiveTelemetryChartsProps {
  history: MetricSnapshot[];
}

export const LiveTelemetryCharts: React.FC<LiveTelemetryChartsProps> = ({ history }) => {
  const [selectedMetric, setSelectedMetric] = useState<'latency' | 'error' | 'rps' | 'queue' | 'cpu'>('latency');

  // Format data points for charts
  const chartData = history.slice(-25).map((snap, idx) => {
    const timeStr = new Date(snap.timestamp).toLocaleTimeString([], { 
      minute: '2-digit', 
      second: '2-digit' 
    });

    return {
      time: timeStr,
      latency: snap.overallLatencyMs,
      paymentLatency: snap.services['payment-service']?.latencyMs ?? 50,
      orderLatency: snap.services['order-service']?.latencyMs ?? 35,
      errorRate: snap.overallErrorRate,
      rps: snap.services['api-gateway']?.requestsPerSec ?? 28,
      queueDepth: snap.overallQueueDepth,
      paymentQueue: snap.services['payment-service']?.queueDepth ?? 4,
      orderQueue: snap.services['order-service']?.queueDepth ?? 5,
      cpu: snap.services['order-service']?.cpuPercent ?? 30,
      memory: snap.services['payment-service']?.memoryPercent ?? 40,
    };
  });

  const latest = history[history.length - 1];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 lg:p-5 relative backdrop-blur-sm shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
              Live Real-Time Telemetry Pipeline
            </h3>
            <p className="text-xs text-slate-400">
              High-frequency rolling metric buffers streaming via SSE (1-second tick intervals)
            </p>
          </div>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto overflow-x-auto">
          <button
            onClick={() => setSelectedMetric('latency')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium font-mono transition-all ${
              selectedMetric === 'latency'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Latency (ms)
          </button>
          <button
            onClick={() => setSelectedMetric('error')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium font-mono transition-all ${
              selectedMetric === 'error'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Error Rate (%)
          </button>
          <button
            onClick={() => setSelectedMetric('queue')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium font-mono transition-all ${
              selectedMetric === 'queue'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Queue Depth
          </button>
          <button
            onClick={() => setSelectedMetric('rps')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium font-mono transition-all ${
              selectedMetric === 'rps'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Throughput (RPS)
          </button>
          <button
            onClick={() => setSelectedMetric('cpu')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium font-mono transition-all ${
              selectedMetric === 'cpu'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            CPU / RAM (%)
          </button>
        </div>
      </div>

      {/* Primary Chart Area */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {selectedMetric === 'latency' ? (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="paymentLatGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="ms" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
              />
              <Area type="monotone" dataKey="latency" name="Cluster Avg Latency" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#latencyGrad)" />
              <Area type="monotone" dataKey="paymentLatency" name="Payment Svc Latency" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#paymentLatGrad)" />
            </AreaChart>
          ) : selectedMetric === 'error' ? (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="errorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="%" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
              />
              <Area type="monotone" dataKey="errorRate" name="Overall Error Rate" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#errorGrad)" />
            </AreaChart>
          ) : selectedMetric === 'queue' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
              />
              <Line type="monotone" dataKey="queueDepth" name="Total Queue Backlog" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="orderQueue" name="Order Service Queue" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          ) : selectedMetric === 'rps' ? (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="rpsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
              />
              <Area type="monotone" dataKey="rps" name="Ingress RPS" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#rpsGrad)" />
            </AreaChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="%" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
              />
              <Line type="monotone" dataKey="cpu" name="Order CPU %" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="memory" name="Payment RAM %" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Real-time statistics footnote */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800/60 text-xs font-mono">
        <div className="flex items-center justify-between bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/40">
          <span className="text-slate-400">Cluster Latency:</span>
          <span className="text-white font-bold">{latest?.overallLatencyMs ?? 0}ms</span>
        </div>
        <div className="flex items-center justify-between bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/40">
          <span className="text-slate-400">Error Rate:</span>
          <span className="text-white font-bold">{latest?.overallErrorRate ?? 0}%</span>
        </div>
        <div className="flex items-center justify-between bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/40">
          <span className="text-slate-400">Queue Depth:</span>
          <span className="text-white font-bold">{latest?.overallQueueDepth ?? 0} msgs</span>
        </div>
        <div className="flex items-center justify-between bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/40">
          <span className="text-slate-400">Ingress Inflow:</span>
          <span className="text-white font-bold">{latest?.services['api-gateway']?.requestsPerSec ?? 0} req/s</span>
        </div>
      </div>
    </div>
  );
};
