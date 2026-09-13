export type ServiceId = 'api-gateway' | 'order-service' | 'payment-service' | 'notification-service' | 'database';

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'DOWN';

export type ChaosType = 
  | 'HIGH_LATENCY' 
  | 'ERROR_SPIKE' 
  | 'KILL_SERVICE' 
  | 'TRAFFIC_SURGE' 
  | 'DB_FAILURE' 
  | 'MEMORY_PRESSURE' 
  | 'DEPENDENCY_FAILURE';

export interface ServiceState {
  id: ServiceId;
  name: string;
  role: string;
  status: HealthStatus;
  version: string;
  replicas: number;
  maxReplicas: number;
  minReplicas: number;
  trafficWeight: number;
  isolated: boolean;
  activeChaos: ChaosType[];
  latencyMs: number;
  errorRate: number;
  requestsPerSec: number;
  cpuPercent: number;
  memoryPercent: number;
  queueDepth: number;
  dependencyFailures: number;
  dependencies: ServiceId[];
  lastRestartTimestamp: number;
  healthScore: number;
}

export interface MetricSnapshot {
  timestamp: number;
  services: Record<ServiceId, {
    latencyMs: number;
    errorRate: number;
    requestsPerSec: number;
    cpuPercent: number;
    memoryPercent: number;
    queueDepth: number;
    healthScore: number;
    status: HealthStatus;
  }>;
  systemAvailability: number;
  overallLatencyMs: number;
  overallErrorRate: number;
  overallQueueDepth: number;
  healthyServicesCount: number;
  totalServicesCount: number;
  deterministicReliabilityScore: number;
}

export type EventType = 
  | 'SYSTEM_BOOT'
  | 'SERVICE_HEALTH_CHANGED'
  | 'HIGH_LATENCY_DETECTED'
  | 'ERROR_SPIKE_DETECTED'
  | 'TRAFFIC_SPIKE_DETECTED'
  | 'DEPENDENCY_FAILURE'
  | 'CASCADE_RISK_DETECTED'
  | 'INCIDENT_OPENED'
  | 'AI_RCA_GENERATED'
  | 'POLICY_EVALUATED'
  | 'REMEDIATION_REQUESTED'
  | 'REMEDIATION_EXECUTED'
  | 'RECOVERY_VERIFIED'
  | 'CHAOS_INJECTED'
  | 'CHAOS_CLEARED';

export interface SystemEvent {
  id: string;
  type: EventType;
  timestamp: number;
  source: ServiceId | 'RELIABILITY_ENGINE' | 'REMEDIATION_ENGINE' | 'POLICY_ENGINE' | 'AI_AGENT' | 'CHAOS_LAB' | 'SYSTEM';
  severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  message: string;
  data?: Record<string, any>;
}

export interface CascadeRisk {
  probability: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  primaryCulprit: ServiceId | null;
  affectedServices: ServiceId[];
  propagationPath: string[];
  potentialImpact: string;
  calculatedAt: number;
}

export type RemediationActionType = 
  | 'restart_service'
  | 'scale_service'
  | 'reroute_traffic'
  | 'isolate_instance'
  | 'recover_dependency'
  | 'clear_queue_backlog'
  | 'reset_all';

export interface PolicyEvaluation {
  action: RemediationActionType;
  targetService: ServiceId;
  targetParams?: Record<string, any>;
  decision: 'APPROVED' | 'REJECTED';
  reason: string;
  ruleEvaluated: string;
  evaluatedAt: number;
}

export interface RemediationPlan {
  id: string;
  incidentId: string;
  recommendedAction: RemediationActionType;
  targetService: ServiceId;
  targetParams?: Record<string, any>;
  proposedBy: 'AI_GEMINI' | 'DETERMINISTIC_RULES';
  rationale: string;
  confidence: number;
  policy: PolicyEvaluation | null;
  status: 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'EXECUTING' | 'EXECUTED' | 'VERIFIED' | 'FAILED';
  executedAt?: number;
  verifiedAt?: number;
  verificationDetails?: string;
}

export interface IncidentEvidence {
  metric: string;
  observedValue: string;
  baselineValue: string;
  deviationPercent: number;
  severity: 'WARN' | 'CRITICAL';
}

export interface Incident {
  id: string;
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'MITIGATING' | 'RESOLVED';
  detectedAt: number;
  resolvedAt?: number;
  culpritService: ServiceId;
  affectedServices: ServiceId[];
  evidence: IncidentEvidence[];
  cascadeRisk: CascadeRisk;
  rootCauseAnalysis: {
    summary: string;
    explanation: string;
    groundedTelemetry: string[];
    confidence: number;
    analyzedBy: 'GEMINI_3.8_FLASH' | 'FALLBACK_EXPERT_ENGINE';
  };
  remediationPlan?: RemediationPlan;
  recoveryComparison?: {
    before: {
      availability: number;
      latencyMs: number;
      errorRate: number;
      healthyServices: string;
    };
    after: {
      availability: number;
      latencyMs: number;
      errorRate: number;
      healthyServices: string;
    };
  };
}

export interface SystemSnapshot {
  services: Record<ServiceId, ServiceState>;
  metricsHistory: MetricSnapshot[];
  currentMetrics: MetricSnapshot;
  activeIncidents: Incident[];
  pastIncidents: Incident[];
  cascadeRisk: CascadeRisk;
  recentEvents: SystemEvent[];
  autoRemediationEnabled: boolean;
  demoMode: {
    active: boolean;
    stage: string;
    stepIndex: number;
    totalSteps: number;
    description: string;
  };
}

export interface TransactionTrace {
  serviceId: ServiceId;
  latency: number;
  ok: boolean;
  error?: string;
}

export interface TransactionResult {
  success: boolean;
  durationMs: number;
  trace: TransactionTrace[];
}
