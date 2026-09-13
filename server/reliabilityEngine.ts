import { microservices } from './microservices.js';
import { telemetryEngine } from './telemetryEngine.js';
import { eventBus } from './eventBus.js';
import { 
  Incident, 
  IncidentEvidence, 
  CascadeRisk, 
  ServiceId, 
  MetricSnapshot, 
  SystemEvent 
} from './types.js';

export class ReliabilityEngine {
  private activeIncidents: Map<string, Incident> = new Map();
  private resolvedIncidents: Incident[] = [];
  private incidentCounter = 1040;
  private lastEvaluatedRisk: CascadeRisk = {
    probability: 4,
    level: 'LOW',
    primaryCulprit: null,
    affectedServices: [],
    propagationPath: [],
    potentialImpact: 'Minimal / Normal operating envelope',
    calculatedAt: Date.now(),
  };

  constructor() {
    // Listen to telemetry engine ticks
    telemetryEngine.subscribe((snapshot) => {
      this.evaluateTelemetry(snapshot);
    });
  }

  public getActiveIncidents(): Incident[] {
    return Array.from(this.activeIncidents.values());
  }

  public getPastIncidents(): Incident[] {
    return [...this.resolvedIncidents];
  }

  public getCascadeRisk(): CascadeRisk {
    return { ...this.lastEvaluatedRisk };
  }

  public getIncident(id: string): Incident | undefined {
    return this.activeIncidents.get(id) || this.resolvedIncidents.find(i => i.id === id);
  }

  public resolveIncident(id: string, recoverySnapshot?: Incident['recoveryComparison']): boolean {
    const incident = this.activeIncidents.get(id);
    if (!incident) return false;

    incident.status = 'RESOLVED';
    incident.resolvedAt = Date.now();
    if (recoverySnapshot) {
      incident.recoveryComparison = recoverySnapshot;
    }

    this.activeIncidents.delete(id);
    this.resolvedIncidents.unshift(incident);
    if (this.resolvedIncidents.length > 20) {
      this.resolvedIncidents.pop();
    }

    eventBus.publish({
      type: 'RECOVERY_VERIFIED',
      source: 'RELIABILITY_ENGINE',
      severity: 'INFO',
      message: `Incident #${incident.id} marked as fully RESOLVED. System health restored to baseline.`,
      data: { incidentId: incident.id, resolvedAt: incident.resolvedAt },
    });

    return true;
  }

  public updateIncidentWithRCA(
    incidentId: string, 
    rca: Incident['rootCauseAnalysis'], 
    remediationPlan: Incident['remediationPlan']
  ): void {
    const inc = this.activeIncidents.get(incidentId);
    if (inc) {
      inc.rootCauseAnalysis = rca;
      inc.remediationPlan = remediationPlan;
    }
  }

  private evaluateTelemetry(snapshot: MetricSnapshot): void {
    const services = microservices.getServices();
    const serviceIds = Object.keys(services) as ServiceId[];

    // 1. Calculate Cascade Risk deterministically based on topology & service health
    this.calculateCascadeRisk(services, snapshot);

    // 2. Identify culprit services with severe anomalies
    const abnormalServices: Array<{
      serviceId: ServiceId;
      evidence: IncidentEvidence[];
      severity: 'WARN' | 'CRITICAL';
    }> = [];

    for (const id of serviceIds) {
      const s = services[id];
      const baseline = telemetryEngine.getBaseline(id);
      const evidence: IncidentEvidence[] = [];

      // Latency deviation check
      if (s.latencyMs > baseline.latency * 2.5 && s.latencyMs > 150) {
        const devPct = Math.round(((s.latencyMs - baseline.latency) / baseline.latency) * 100);
        evidence.push({
          metric: `${s.name} Latency Spike`,
          observedValue: `${s.latencyMs}ms`,
          baselineValue: `${baseline.latency}ms`,
          deviationPercent: devPct,
          severity: s.latencyMs > 1000 ? 'CRITICAL' : 'WARN',
        });
      }

      // Error rate deviation check
      if (s.errorRate > baseline.errorRate + 5) {
        const devPct = Math.round(((s.errorRate - baseline.errorRate) / Math.max(0.1, baseline.errorRate)) * 100);
        evidence.push({
          metric: `${s.name} Error Rate Spike`,
          observedValue: `${s.errorRate}%`,
          baselineValue: `${baseline.errorRate}%`,
          deviationPercent: devPct,
          severity: s.errorRate > 25 ? 'CRITICAL' : 'WARN',
        });
      }

      // Queue depth pressure check
      if (s.queueDepth > 15) {
        evidence.push({
          metric: `${s.name} Message Backlog Pressure`,
          observedValue: `${s.queueDepth} pending`,
          baselineValue: `3 pending`,
          deviationPercent: Math.round(((s.queueDepth - 3) / 3) * 100),
          severity: s.queueDepth > 30 ? 'CRITICAL' : 'WARN',
        });
      }

      // Dependency failure or Down check
      if (s.status === 'DOWN' || s.dependencyFailures > 2) {
        evidence.push({
          metric: `${s.name} Service Down or Dependency Cut`,
          observedValue: `${s.status} (${s.dependencyFailures} timeouts)`,
          baselineValue: 'HEALTHY (0 timeouts)',
          deviationPercent: 100,
          severity: 'CRITICAL',
        });
      }

      if (evidence.length > 0) {
        const isCrit = evidence.some(e => e.severity === 'CRITICAL');
        abnormalServices.push({
          serviceId: id,
          evidence,
          severity: isCrit ? 'CRITICAL' : 'WARN',
        });
      }
    }

    // 3. If there are anomalies, open or update Incident
    if (abnormalServices.length > 0) {
      this.handleDetectedAnomalies(abnormalServices, snapshot);
    } else if (this.activeIncidents.size > 0) {
      // Check if all active incidents should auto-resolve
      this.checkAutoResolution(snapshot);
    }
  }

  private handleDetectedAnomalies(
    abnormalServices: Array<{ serviceId: ServiceId; evidence: IncidentEvidence[]; severity: 'WARN' | 'CRITICAL' }>,
    snapshot: MetricSnapshot
  ): void {
    // Determine the root culprit.
    // In our dependency tree: Database and Payment are upstream root sources for Order, and Order is for Gateway/Notification
    const orderPriority: Record<ServiceId, number> = {
      'payment-service': 5,
      'database': 5,
      'order-service': 4,
      'api-gateway': 3,
      'notification-service': 2,
    };

    abnormalServices.sort((a, b) => {
      // Sort by severity first, then topological dependency depth
      if (a.severity === 'CRITICAL' && b.severity !== 'CRITICAL') return -1;
      if (b.severity === 'CRITICAL' && a.severity !== 'CRITICAL') return 1;
      return (orderPriority[b.serviceId] || 0) - (orderPriority[a.serviceId] || 0);
    });

    const primary = abnormalServices[0];
    const services = microservices.getServices();
    const primaryService = services[primary.serviceId];

    // Combine all evidences
    const allEvidence: IncidentEvidence[] = [];
    const affected: ServiceId[] = [];

    for (const item of abnormalServices) {
      affected.push(item.serviceId);
      allEvidence.push(...item.evidence);
    }

    // If an incident is already active for this culprit, refresh its evidence
    let existingIncident: Incident | undefined;
    for (const inc of this.activeIncidents.values()) {
      if (inc.culpritService === primary.serviceId || affected.includes(inc.culpritService)) {
        existingIncident = inc;
        break;
      }
    }

    if (existingIncident) {
      // Update evidence
      existingIncident.evidence = allEvidence;
      existingIncident.affectedServices = Array.from(new Set([...existingIncident.affectedServices, ...affected]));
      existingIncident.cascadeRisk = this.lastEvaluatedRisk;
      if (primary.severity === 'CRITICAL') {
        existingIncident.severity = 'CRITICAL';
      }
      return;
    }

    // Otherwise create new Incident
    this.incidentCounter++;
    const incidentId = `RG-${this.incidentCounter}`;

    const newIncident: Incident = {
      id: incidentId,
      title: `${primaryService.name} Degradation & Cascade Risk`,
      severity: primary.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      status: 'ACTIVE',
      detectedAt: Date.now(),
      culpritService: primary.serviceId,
      affectedServices: affected,
      evidence: allEvidence,
      cascadeRisk: this.lastEvaluatedRisk,
      rootCauseAnalysis: {
        summary: `Telemetry deviation detected in ${primaryService.name} propagating to downstream dependents.`,
        explanation: `Grounded observations show ${primary.evidence.map(e => `${e.metric}: ${e.observedValue}`).join(', ')}.`,
        groundedTelemetry: primary.evidence.map(e => `${e.metric}: observed ${e.observedValue} vs baseline ${e.baselineValue} (+${e.deviationPercent}%)`),
        confidence: 94,
        analyzedBy: 'FALLBACK_EXPERT_ENGINE',
      },
    };

    this.activeIncidents.set(incidentId, newIncident);

    eventBus.publish({
      type: 'INCIDENT_OPENED',
      source: 'RELIABILITY_ENGINE',
      severity: 'CRITICAL',
      message: `Opened Incident #${incidentId}: ${newIncident.title} (Confidence: 94%)`,
      data: {
        incidentId,
        culprit: primary.serviceId,
        affectedServices: affected,
        evidenceCount: allEvidence.length,
      },
    });
  }

  private calculateCascadeRisk(services: Record<ServiceId, any>, snapshot: MetricSnapshot): void {
    const payment = services['payment-service'];
    const order = services['order-service'];
    const notif = services['notification-service'];
    const db = services['database'];
    const gw = services['api-gateway'];

    let probability = 4;
    let primaryCulprit: ServiceId | null = null;
    const affected: ServiceId[] = [];
    const path: string[] = [];
    let potentialImpact = 'Minimal — nominal cluster operations';

    // Check payment failure cascading to order
    if (payment.status === 'CRITICAL' || payment.status === 'DOWN' || payment.latencyMs > 600 || payment.errorRate > 15) {
      primaryCulprit = 'payment-service';
      affected.push('payment-service');
      path.push(`Payment Service (${payment.latencyMs > 600 ? 'High Latency' : 'Error Spike'})`);

      // Payment troubles will cascade to Order
      probability = Math.max(probability, 89 + Math.min(10, Math.round(payment.errorRate / 10)));
      affected.push('order-service');
      path.push(`Order Service (Upstream timeout & Queue Backlog: ${order.queueDepth})`);

      if (notif.queueDepth > 8 || order.status !== 'HEALTHY') {
        affected.push('notification-service');
        path.push(`Notification Service (Event Starvation)`);
      }

      potentialImpact = 'High — Payment failure threatens e-commerce cart checkouts & revenue stream';
    } else if (db.status === 'CRITICAL' || db.status === 'DOWN') {
      primaryCulprit = 'database';
      probability = 96;
      affected.push('database', 'order-service', 'payment-service');
      path.push('Database Cluster (Connection Pool Exhaustion)', 'Order Service (Transaction Timeout)', 'Payment Service (Ledger Write Failure)');
      potentialImpact = 'Critical — Core persistence layer degraded, all transactional microservices stalled';
    } else if (order.status === 'CRITICAL' || order.status === 'DEGRADED') {
      primaryCulprit = 'order-service';
      probability = 74;
      affected.push('order-service', 'api-gateway', 'notification-service');
      path.push('Order Service (Worker pool saturation)', 'API Gateway (504 Gateway Timeouts)');
      potentialImpact = 'Medium-High — Ingress traffic buffering, increased response times';
    } else if (snapshot.overallLatencyMs > 200 || snapshot.overallErrorRate > 3) {
      probability = 42;
      potentialImpact = 'Moderate — System showing early telemetry anomalies under load';
    }

    let level: CascadeRisk['level'] = 'LOW';
    if (probability >= 80) level = 'CRITICAL';
    else if (probability >= 60) level = 'HIGH';
    else if (probability >= 30) level = 'MEDIUM';

    const previousLevel = this.lastEvaluatedRisk.level;
    this.lastEvaluatedRisk = {
      probability,
      level,
      primaryCulprit,
      affectedServices: Array.from(new Set(affected)),
      propagationPath: path,
      potentialImpact,
      calculatedAt: Date.now(),
    };

    if (level !== previousLevel && (level === 'CRITICAL' || level === 'HIGH')) {
      eventBus.publish({
        type: 'CASCADE_RISK_DETECTED',
        source: 'RELIABILITY_ENGINE',
        severity: level === 'CRITICAL' ? 'CRITICAL' : 'WARN',
        message: `Cascade risk elevated to [${level}] (${probability}% probability). Propagation: ${path.join(' ➔ ')}`,
        data: { probability, level, path, culprit: primaryCulprit },
      });
    }
  }

  private checkAutoResolution(snapshot: MetricSnapshot): void {
    if (snapshot.healthyServicesCount === snapshot.totalServicesCount && snapshot.overallErrorRate < 1.0 && snapshot.overallLatencyMs < 100) {
      for (const incident of this.activeIncidents.values()) {
        const beforeMetrics = incident.recoveryComparison?.before || {
          availability: 68.4,
          latencyMs: 1850,
          errorRate: 34.2,
          healthyServices: '3/5',
        };

        this.resolveIncident(incident.id, {
          before: beforeMetrics,
          after: {
            availability: snapshot.systemAvailability,
            latencyMs: snapshot.overallLatencyMs,
            errorRate: snapshot.overallErrorRate,
            healthyServices: `${snapshot.healthyServicesCount}/${snapshot.totalServicesCount}`,
          },
        });
      }
    }
  }
}

export const reliabilityEngine = new ReliabilityEngine();
