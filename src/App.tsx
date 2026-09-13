import React, { useState, useEffect, useRef } from 'react';
import { 
  SystemSnapshot, 
  ServiceId, 
  ChaosType, 
  RemediationActionType, 
  TransactionResult 
} from './types';
import { Header } from './components/Header';
import { DemoProgressBar } from './components/DemoProgressBar';
import { ServiceTopologyGraph } from './components/ServiceTopologyGraph';
import { ReliabilityScoreCard } from './components/ReliabilityScoreCard';
import { CascadeRiskPanel } from './components/CascadeRiskPanel';
import { LiveTelemetryCharts } from './components/LiveTelemetryCharts';
import { ChaosLab } from './components/ChaosLab';
import { ActiveIncidentCard } from './components/ActiveIncidentCard';
import { AuditTimeline } from './components/AuditTimeline';
import { ServiceDetailModal } from './components/ServiceDetailModal';
import { ArchitectureModal } from './components/ArchitectureModal';
import { TransactionTraceModal } from './components/TransactionTraceModal';
import { ShieldCheck, CheckCircle2, AlertTriangle, Layers, Activity } from 'lucide-react';

export function App() {
  const [snapshot, setSnapshot] = useState<SystemSnapshot | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<ServiceId | null>(null);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [transactionResult, setTransactionResult] = useState<TransactionResult | null>(null);
  const [isTestingTransaction, setIsTestingTransaction] = useState(false);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);

  // Connect to SSE Telemetry Stream on mount
  useEffect(() => {
    let eventSource: EventSource | null = null;

    function connectSSE() {
      try {
        eventSource = new EventSource('/api/telemetry/stream');

        eventSource.onmessage = (event) => {
          try {
            const data: SystemSnapshot = JSON.parse(event.data);
            setSnapshot(data);
          } catch (err) {
            console.error('[SSE] JSON Parse error:', err);
          }
        };

        eventSource.onerror = () => {
          // If SSE fails or drops, fall back to initial snapshot fetch
          eventSource?.close();
          fetchState();
          // Reconnect after 3 seconds
          setTimeout(connectSSE, 3000);
        };
      } catch (err) {
        console.error('[SSE] Connection error:', err);
        fetchState();
      }
    }

    async function fetchState() {
      try {
        const res = await fetch('/api/state');
        if (res.ok) {
          const data = await res.json();
          setSnapshot(data);
        }
      } catch (err) {
        console.error('[App] Failed to fetch state snapshot:', err);
      }
    }

    connectSSE();

    return () => {
      eventSource?.close();
    };
  }, []);

  // --- ACTIONS ---

  const handleStartDemo = async () => {
    try {
      await fetch('/api/demo/start', { method: 'POST' });
    } catch (err) {
      console.error('[App] Start demo error:', err);
    }
  };

  const handleStopDemo = async () => {
    try {
      await fetch('/api/demo/stop', { method: 'POST' });
    } catch (err) {
      console.error('[App] Stop demo error:', err);
    }
  };

  const handleToggleAutoRemediation = async (enabled: boolean) => {
    try {
      await fetch('/api/remediation/auto-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
    } catch (err) {
      console.error('[App] Toggle auto-remediation error:', err);
    }
  };

  const handleInjectChaos = async (serviceId: ServiceId, chaos: ChaosType) => {
    try {
      await fetch('/api/chaos/inject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, chaos }),
      });
    } catch (err) {
      console.error('[App] Inject chaos error:', err);
    }
  };

  const handleClearChaos = async (serviceId?: ServiceId) => {
    try {
      await fetch('/api/chaos/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId }),
      });
    } catch (err) {
      console.error('[App] Clear chaos error:', err);
    }
  };

  const handleExecuteRemediation = async (
    action: RemediationActionType, 
    targetService: ServiceId, 
    params?: any
  ) => {
    try {
      await fetch('/api/remediation/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, targetService, targetParams: params }),
      });
    } catch (err) {
      console.error('[App] Execute remediation error:', err);
    }
  };

  const handleTriggerAIRCA = async (incidentId: string) => {
    setIsAnalyzingAI(true);
    try {
      await fetch('/api/ai/analyze-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId }),
      });
    } catch (err) {
      console.error('[App] AI RCA error:', err);
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  const handleTestTransaction = async () => {
    setIsTestingTransaction(true);
    try {
      const res = await fetch('/api/transaction/test', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTransactionResult(data.transaction);
      }
    } catch (err) {
      console.error('[App] Test transaction error:', err);
    } finally {
      setIsTestingTransaction(false);
    }
  };

  const activeIncidents = snapshot?.activeIncidents ?? [];
  const pastIncidents = snapshot?.pastIncidents ?? [];
  const selectedService = selectedServiceId && snapshot ? snapshot.services[selectedServiceId] : null;

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Top Navigation & Status Bar */}
      <Header 
        snapshot={snapshot}
        onStartDemo={handleStartDemo}
        onStopDemo={handleStopDemo}
        onToggleAutoRemediation={handleToggleAutoRemediation}
        onClearChaos={() => handleClearChaos()}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
        onTestTransaction={handleTestTransaction}
        isTestingTransaction={isTestingTransaction}
      />

      {/* Guided Demo Progress Bar (when demo is active) */}
      {snapshot && (
        <DemoProgressBar demoMode={snapshot.demoMode} />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
        
        {/* Tier 1: Service Mesh Topology & Reliability Health Gauge */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Topology Graph (Left / Main) */}
          <div className="lg:col-span-8">
            {snapshot ? (
              <ServiceTopologyGraph
                services={snapshot.services}
                onSelectService={(id) => setSelectedServiceId(id)}
                selectedServiceId={selectedServiceId}
              />
            ) : (
              <div className="h-64 bg-slate-900/50 rounded-2xl border border-slate-800 animate-pulse flex items-center justify-center text-slate-500 font-mono text-xs">
                Connecting to ResQMesh telemetry stream...
              </div>
            )}
          </div>

          {/* Vitals Column: Reliability Score & Cascade Risk (Right) */}
          <div className="lg:col-span-4 space-y-4">
            <ReliabilityScoreCard metrics={snapshot?.currentMetrics ?? null} />
            <CascadeRiskPanel cascadeRisk={snapshot?.cascadeRisk ?? null} />
          </div>

        </div>

        {/* Tier 2: Active Incidents & Autonomous Self-Healing */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Active Incidents & Autonomous Self-Healing Engine
            </h2>
            <span className="text-xs font-mono text-slate-400">
              {activeIncidents.length} active alarm{activeIncidents.length === 1 ? '' : 's'}
            </span>
          </div>

          {activeIncidents.length > 0 ? (
            activeIncidents.map((incident) => (
              <ActiveIncidentCard
                key={incident.id}
                incident={incident}
                onExecuteRemediation={handleExecuteRemediation}
                onTriggerAIRCA={handleTriggerAIRCA}
                isAnalyzingAI={isAnalyzingAI}
              />
            ))
          ) : (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 text-center backdrop-blur-sm shadow-inner">
              <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white font-mono">
                All Cluster Microservices Operating Nominally
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                Zero active telemetry anomalies. Use the <strong className="text-cyan-400">Failure Injection Lab</strong> below or click <strong className="text-cyan-400">RUN FULL INCIDENT DEMO</strong> to simulate cascading failures and autonomous self-healing.
              </p>
            </div>
          )}

          {/* Past Resolved Incidents (Last 2) */}
          {pastIncidents.length > 0 && activeIncidents.length === 0 && (
            <div className="mt-4">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                Recently Resolved & Verified Incidents:
              </div>
              {pastIncidents.slice(0, 2).map((inc) => (
                <ActiveIncidentCard
                  key={inc.id}
                  incident={inc}
                  onExecuteRemediation={handleExecuteRemediation}
                  onTriggerAIRCA={handleTriggerAIRCA}
                  isAnalyzingAI={false}
                />
              ))}
            </div>
          )}
        </section>

        {/* Tier 3: Real-Time Charts & Chaos Injection Lab */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6">
            <LiveTelemetryCharts history={snapshot?.metricsHistory ?? []} />
          </div>
          <div className="lg:col-span-6">
            {snapshot && (
              <ChaosLab
                services={snapshot.services}
                onInjectChaos={handleInjectChaos}
                onClearChaos={handleClearChaos}
              />
            )}
          </div>
        </div>

        {/* Tier 4: Autonomous Audit Trail & Event Stream */}
        <section>
          <AuditTimeline events={snapshot?.recentEvents ?? []} />
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-4 px-6 mt-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>RESQMESH • Autonomous Self-Healing Cloud Infrastructure</span>
          </div>
          <div className="text-[11px]">
            OBSERVE → DETECT → PREDICT → EXPLAIN → PLAN → GOVERN → EXECUTE → VERIFY
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ServiceDetailModal
        service={selectedService}
        onClose={() => setSelectedServiceId(null)}
        onExecuteAction={handleExecuteRemediation}
        onInjectChaos={handleInjectChaos}
      />

      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />

      <TransactionTraceModal
        result={transactionResult}
        onClose={() => setTransactionResult(null)}
      />

    </div>
  );
}
export default App;
