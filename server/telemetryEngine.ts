import { microservices } from './microservices.js';
import { MetricSnapshot, ServiceId } from './types.js';

type TelemetryListener = (snapshot: MetricSnapshot) => void;

export class TelemetryEngine {
  private history: MetricSnapshot[] = [];
  private readonly maxHistoryPoints = 60;
  private listeners: Set<TelemetryListener> = new Set();
  private intervalTimer: NodeJS.Timeout | null = null;
  private baselineMetrics: Record<ServiceId, { latency: number; errorRate: number }> = {
    'api-gateway': { latency: 14, errorRate: 0.1 },
    'order-service': { latency: 38, errorRate: 0.2 },
    'payment-service': { latency: 52, errorRate: 0.3 },
    'notification-service': { latency: 22, errorRate: 0.1 },
    'database': { latency: 8, errorRate: 0.05 },
  };

  constructor() {
    this.startEngine();
  }

  public startEngine(): void {
    if (this.intervalTimer) return;

    // Run continuous cycle every 1000ms
    this.intervalTimer = setInterval(() => {
      // Step 1: Simulate background transactions
      microservices.executeTransaction();

      // Step 2: Step microservices physics/telemetry
      microservices.updateMetricsCycle();

      // Step 3: Capture snapshot
      const snapshot = this.captureSnapshot();
      this.history.push(snapshot);
      if (this.history.length > this.maxHistoryPoints) {
        this.history.shift();
      }

      // Notify all SSE / WebSocket subscribers
      for (const listener of this.listeners) {
        try {
          listener(snapshot);
        } catch (err) {
          console.error('[TelemetryEngine] Error notifying listener:', err);
        }
      }
    }, 1000);
    this.intervalTimer.unref();
  }

  public stopEngine(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  public subscribe(listener: TelemetryListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getHistory(): MetricSnapshot[] {
    return [...this.history];
  }

  public getLatestSnapshot(): MetricSnapshot {
    if (this.history.length > 0) {
      return this.history[this.history.length - 1];
    }
    return this.captureSnapshot();
  }

  public getBaseline(serviceId: ServiceId) {
    return this.baselineMetrics[serviceId] || { latency: 30, errorRate: 0.2 };
  }

  private captureSnapshot(): MetricSnapshot {
    const services = microservices.getServices();
    const serviceKeys = Object.keys(services) as ServiceId[];

    const servicesMetrics: MetricSnapshot['services'] = {} as any;
    let totalLatency = 0;
    let totalErrorRate = 0;
    let totalQueue = 0;
    let healthyCount = 0;

    for (const id of serviceKeys) {
      const s = services[id];
      servicesMetrics[id] = {
        latencyMs: s.latencyMs,
        errorRate: s.errorRate,
        requestsPerSec: s.requestsPerSec,
        cpuPercent: s.cpuPercent,
        memoryPercent: s.memoryPercent,
        queueDepth: s.queueDepth,
        healthScore: s.healthScore,
        status: s.status,
      };

      totalLatency += s.latencyMs;
      totalErrorRate += s.errorRate;
      totalQueue += s.queueDepth;
      if (s.status === 'HEALTHY') healthyCount++;
    }

    const serviceCount = serviceKeys.length;
    const avgLatency = Math.round(totalLatency / serviceCount);
    const avgErrorRate = Number((totalErrorRate / serviceCount).toFixed(2));

    // Availability formula: based on error rate and service health states
    // A service DOWN is 0% available, CRITICAL is 50%, DEGRADED is 85%, HEALTHY is 99.9%
    let availabilitySum = 0;
    for (const id of serviceKeys) {
      const s = services[id];
      if (s.status === 'HEALTHY') availabilitySum += 99.95 - (s.errorRate * 0.5);
      else if (s.status === 'DEGRADED') availabilitySum += 92.0 - (s.errorRate * 0.8);
      else if (s.status === 'CRITICAL') availabilitySum += 64.0 - (s.errorRate * 0.9);
      else availabilitySum += 0;
    }
    const systemAvailability = Number((Math.max(0, Math.min(99.99, availabilitySum / serviceCount))).toFixed(2));

    // Deterministic Reliability Score (0 - 100):
    // Formula:
    // 35% Availability weight
    // 25% Error rate penalty
    // 20% Latency score (sub-100ms is 100, 2000ms is 0)
    // 20% Healthy services ratio
    const availFactor = (systemAvailability / 100) * 35;
    const errFactor = Math.max(0, (1 - avgErrorRate / 50)) * 25;
    const latFactor = Math.max(0, (1 - Math.min(2000, avgLatency) / 2000)) * 20;
    const healthRatioFactor = (healthyCount / serviceCount) * 20;
    const deterministicScore = Math.max(0, Math.min(100, Math.round(availFactor + errFactor + latFactor + healthRatioFactor)));

    return {
      timestamp: Date.now(),
      services: servicesMetrics,
      systemAvailability,
      overallLatencyMs: avgLatency,
      overallErrorRate: avgErrorRate,
      overallQueueDepth: totalQueue,
      healthyServicesCount: healthyCount,
      totalServicesCount: serviceCount,
      deterministicReliabilityScore: deterministicScore,
    };
  }
}

export const telemetryEngine = new TelemetryEngine();
