import { ServiceId, ServiceState, HealthStatus, ChaosType } from './types.js';
import { eventBus } from './eventBus.js';

export class MicroserviceCluster {
  private services: Map<ServiceId, ServiceState> = new Map();
  private requestStats: Map<ServiceId, { total: number; failed: number; latencies: number[] }> = new Map();

  constructor() {
    this.initDefaultServices();
  }

  private initDefaultServices() {
    const defaultList: Omit<ServiceState, 'activeChaos'>[] = [
      {
        id: 'api-gateway',
        name: 'API Gateway',
        role: 'Ingress & Traffic Routing Layer',
        status: 'HEALTHY',
        version: 'v2.4.1',
        replicas: 3,
        minReplicas: 1,
        maxReplicas: 5,
        trafficWeight: 100,
        isolated: false,
        latencyMs: 14,
        errorRate: 0.1,
        requestsPerSec: 28,
        cpuPercent: 24,
        memoryPercent: 32,
        queueDepth: 2,
        dependencyFailures: 0,
        dependencies: ['order-service'],
        lastRestartTimestamp: Date.now() - 3600000,
        healthScore: 99,
      },
      {
        id: 'order-service',
        name: 'Order Service',
        role: 'Order Orchestration & Cart Lifecycle',
        status: 'HEALTHY',
        version: 'v1.8.0',
        replicas: 2,
        minReplicas: 1,
        maxReplicas: 5,
        trafficWeight: 100,
        isolated: false,
        latencyMs: 38,
        errorRate: 0.2,
        requestsPerSec: 25,
        cpuPercent: 35,
        memoryPercent: 44,
        queueDepth: 5,
        dependencyFailures: 0,
        dependencies: ['payment-service', 'database'],
        lastRestartTimestamp: Date.now() - 3600000,
        healthScore: 98,
      },
      {
        id: 'payment-service',
        name: 'Payment Service',
        role: 'Card Processing & Merchant Gateway',
        status: 'HEALTHY',
        version: 'v3.1.2',
        replicas: 2,
        minReplicas: 1,
        maxReplicas: 5,
        trafficWeight: 100,
        isolated: false,
        latencyMs: 52,
        errorRate: 0.3,
        requestsPerSec: 22,
        cpuPercent: 41,
        memoryPercent: 48,
        queueDepth: 6,
        dependencyFailures: 0,
        dependencies: ['database'],
        lastRestartTimestamp: Date.now() - 3600000,
        healthScore: 97,
      },
      {
        id: 'notification-service',
        name: 'Notification Service',
        role: 'Asynchronous Event Consumer & Alerts',
        status: 'HEALTHY',
        version: 'v1.4.2',
        replicas: 2,
        minReplicas: 1,
        maxReplicas: 5,
        trafficWeight: 100,
        isolated: false,
        latencyMs: 22,
        errorRate: 0.1,
        requestsPerSec: 18,
        cpuPercent: 20,
        memoryPercent: 28,
        queueDepth: 3,
        dependencyFailures: 0,
        dependencies: ['order-service'],
        lastRestartTimestamp: Date.now() - 3600000,
        healthScore: 99,
      },
      {
        id: 'database',
        name: 'Database Cluster',
        role: 'Distributed PostgreSQL & Transaction Store',
        status: 'HEALTHY',
        version: 'v15.3-HA',
        replicas: 2,
        minReplicas: 1,
        maxReplicas: 4,
        trafficWeight: 100,
        isolated: false,
        latencyMs: 8,
        errorRate: 0.05,
        requestsPerSec: 64,
        cpuPercent: 38,
        memoryPercent: 55,
        queueDepth: 4,
        dependencyFailures: 0,
        dependencies: [],
        lastRestartTimestamp: Date.now() - 7200000,
        healthScore: 99,
      },
    ];

    for (const item of defaultList) {
      this.services.set(item.id, {
        ...item,
        activeChaos: [],
      });
      this.requestStats.set(item.id, { total: 0, failed: 0, latencies: [] });
    }
  }

  public getServices(): Record<ServiceId, ServiceState> {
    const result = {} as Record<ServiceId, ServiceState>;
    this.services.forEach((service, id) => {
      result[id] = { ...service };
    });
    return result;
  }

  public getService(id: ServiceId): ServiceState | undefined {
    const s = this.services.get(id);
    return s ? { ...s } : undefined;
  }

  public injectChaos(serviceId: ServiceId, chaos: ChaosType): { success: boolean; message: string } {
    const service = this.services.get(serviceId);
    if (!service) {
      return { success: false, message: `Service ${serviceId} not found` };
    }

    if (!service.activeChaos.includes(chaos)) {
      service.activeChaos.push(chaos);
    }

    eventBus.publish({
      type: 'CHAOS_INJECTED',
      source: 'CHAOS_LAB',
      severity: 'WARN',
      message: `Injected fault [${chaos}] into ${service.name}`,
      data: { serviceId, chaos, timestamp: Date.now() },
    });

    this.recalculateServiceStatus(service);
    return { success: true, message: `Chaos ${chaos} injected into ${service.name}` };
  }

  public clearChaos(serviceId?: ServiceId): { success: boolean; message: string } {
    if (serviceId) {
      const service = this.services.get(serviceId);
      if (service) {
        service.activeChaos = [];
        service.isolated = false;
        service.trafficWeight = 100;
        this.recalculateServiceStatus(service);
        eventBus.publish({
          type: 'CHAOS_CLEARED',
          source: 'CHAOS_LAB',
          severity: 'INFO',
          message: `Cleared all chaos faults on ${service.name}`,
          data: { serviceId },
        });
      }
    } else {
      // Clear all
      this.services.forEach((service) => {
        service.activeChaos = [];
        service.isolated = false;
        service.trafficWeight = 100;
        this.recalculateServiceStatus(service);
      });
      eventBus.publish({
        type: 'CHAOS_CLEARED',
        source: 'CHAOS_LAB',
        severity: 'INFO',
        message: `Cleared all chaos faults across entire cluster`,
      });
    }

    return { success: true, message: 'Chaos cleared successfully' };
  }

  public restartService(serviceId: ServiceId): { success: boolean; message: string } {
    const service = this.services.get(serviceId);
    if (!service) return { success: false, message: 'Service not found' };

    // Clear runtime fault triggers
    service.activeChaos = service.activeChaos.filter(c => c !== 'KILL_SERVICE' && c !== 'MEMORY_PRESSURE');
    service.lastRestartTimestamp = Date.now();
    service.isolated = false;
    service.trafficWeight = 100;
    service.queueDepth = Math.max(1, Math.floor(service.queueDepth / 4));
    service.cpuPercent = 25;
    service.memoryPercent = 35;
    service.dependencyFailures = 0;

    this.recalculateServiceStatus(service);

    eventBus.publish({
      type: 'REMEDIATION_EXECUTED',
      source: 'REMEDIATION_ENGINE',
      severity: 'INFO',
      message: `Service container instance restarted for ${service.name} (worker pods re-provisioned)`,
      data: { serviceId, action: 'restart_service' },
    });

    return { success: true, message: `Restarted ${service.name}` };
  }

  public scaleService(serviceId: ServiceId, targetReplicas: number): { success: boolean; message: string } {
    const service = this.services.get(serviceId);
    if (!service) return { success: false, message: 'Service not found' };

    const oldReplicas = service.replicas;
    service.replicas = Math.min(service.maxReplicas, Math.max(service.minReplicas, targetReplicas));

    // Scaling up eases CPU, memory, and queue pressure
    if (service.replicas > oldReplicas) {
      const ratio = oldReplicas / service.replicas;
      service.queueDepth = Math.max(1, Math.round(service.queueDepth * ratio));
      service.cpuPercent = Math.max(15, Math.round(service.cpuPercent * ratio));
      service.activeChaos = service.activeChaos.filter(c => c !== 'TRAFFIC_SURGE');
    }

    this.recalculateServiceStatus(service);

    eventBus.publish({
      type: 'REMEDIATION_EXECUTED',
      source: 'REMEDIATION_ENGINE',
      severity: 'INFO',
      message: `Scaled ${service.name} from ${oldReplicas} to ${service.replicas} replicas`,
      data: { serviceId, oldReplicas, newReplicas: service.replicas },
    });

    return { success: true, message: `Scaled ${service.name} to ${service.replicas} replicas` };
  }

  public isolateInstance(serviceId: ServiceId): { success: boolean; message: string } {
    const service = this.services.get(serviceId);
    if (!service) return { success: false, message: 'Service not found' };

    service.isolated = true;
    service.trafficWeight = 0;
    this.recalculateServiceStatus(service);

    eventBus.publish({
      type: 'REMEDIATION_EXECUTED',
      source: 'REMEDIATION_ENGINE',
      severity: 'WARN',
      message: `Unhealthy instance of ${service.name} isolated from load balancer rotation`,
      data: { serviceId, action: 'isolate_instance' },
    });

    return { success: true, message: `Isolated unhealthy instance ${service.name}` };
  }

  public rerouteTraffic(serviceId: ServiceId, weight: number): { success: boolean; message: string } {
    const service = this.services.get(serviceId);
    if (!service) return { success: false, message: 'Service not found' };

    service.trafficWeight = Math.min(100, Math.max(0, weight));
    if (service.trafficWeight > 0) {
      service.isolated = false;
    }

    eventBus.publish({
      type: 'REMEDIATION_EXECUTED',
      source: 'REMEDIATION_ENGINE',
      severity: 'INFO',
      message: `Rerouted traffic for ${service.name} to ${service.trafficWeight}% capacity`,
      data: { serviceId, weight },
    });

    return { success: true, message: `Traffic rerouted for ${service.name}` };
  }

  public clearQueueBacklog(serviceId: ServiceId): { success: boolean; message: string } {
    const service = this.services.get(serviceId);
    if (!service) return { success: false, message: 'Service not found' };

    service.queueDepth = 1;
    this.recalculateServiceStatus(service);

    eventBus.publish({
      type: 'REMEDIATION_EXECUTED',
      source: 'REMEDIATION_ENGINE',
      severity: 'INFO',
      message: `Drained dead-letter queue and cleared backlog for ${service.name}`,
      data: { serviceId, action: 'clear_queue_backlog' },
    });

    return { success: true, message: `Queue backlog drained for ${service.name}` };
  }

  public recoverDependency(serviceId: ServiceId): { success: boolean; message: string } {
    const service = this.services.get(serviceId);
    if (!service) return { success: false, message: 'Service not found' };

    service.activeChaos = service.activeChaos.filter(c => c !== 'DEPENDENCY_FAILURE' && c !== 'DB_FAILURE');
    service.dependencyFailures = 0;
    this.recalculateServiceStatus(service);

    eventBus.publish({
      type: 'REMEDIATION_EXECUTED',
      source: 'REMEDIATION_ENGINE',
      severity: 'INFO',
      message: `Dependency connection circuit-breaker reset for ${service.name}`,
      data: { serviceId, action: 'recover_dependency' },
    });

    return { success: true, message: `Recovered dependency for ${service.name}` };
  }

  // Execute a real synthetic end-to-end request transaction:
  // User -> API Gateway -> Order Service -> Payment Service -> Notification Service & DB
  public executeTransaction(customLatencyNoise: number = 0): {
    success: boolean;
    durationMs: number;
    trace: Array<{ serviceId: ServiceId; latency: number; ok: boolean; error?: string }>;
  } {
    const trace: Array<{ serviceId: ServiceId; latency: number; ok: boolean; error?: string }> = [];
    let overallSuccess = true;
    let totalDuration = 0;

    const gateway = this.services.get('api-gateway')!;
    const order = this.services.get('order-service')!;
    const payment = this.services.get('payment-service')!;
    const notification = this.services.get('notification-service')!;
    const db = this.services.get('database')!;

    // 1. API Gateway step
    const gwLatency = Math.max(5, gateway.latencyMs + (Math.random() * 6 - 3) + customLatencyNoise);
    const gwOk = gateway.status !== 'DOWN' && Math.random() > (gateway.errorRate / 100);
    trace.push({ serviceId: 'api-gateway', latency: Math.round(gwLatency), ok: gwOk });
    totalDuration += gwLatency;

    if (!gwOk) {
      return { success: false, durationMs: Math.round(totalDuration), trace };
    }

    // 2. Order Service step
    let ordLatency = Math.max(10, order.latencyMs + (Math.random() * 10 - 5));
    let ordOk = order.status !== 'DOWN' && Math.random() > (order.errorRate / 100);

    // Cascading effect: If Payment Service is down or degraded, Order Service times out or delays!
    if (payment.status === 'DOWN') {
      ordLatency += 2000;
      ordOk = false;
      order.queueDepth = Math.min(100, order.queueDepth + 2);
      order.dependencyFailures += 1;
      trace.push({ serviceId: 'order-service', latency: Math.round(ordLatency), ok: false, error: 'Payment Service Connection Refused (504)' });
      totalDuration += ordLatency;
      return { success: false, durationMs: Math.round(totalDuration), trace };
    } else if (payment.status === 'CRITICAL' || payment.status === 'DEGRADED') {
      ordLatency += payment.latencyMs * 0.8;
      order.queueDepth = Math.min(80, order.queueDepth + 1);
      if (Math.random() < 0.35) {
        ordOk = false;
        order.dependencyFailures += 1;
      }
    }

    // Cascading effect: If DB is degraded
    if (db.status === 'DOWN' || db.status === 'CRITICAL') {
      ordLatency += db.latencyMs;
      if (Math.random() < 0.45) ordOk = false;
    }

    trace.push({ serviceId: 'order-service', latency: Math.round(ordLatency), ok: ordOk });
    totalDuration += ordLatency;

    if (!ordOk) {
      return { success: false, durationMs: Math.round(totalDuration), trace };
    }

    // 3. Payment Service step
    let payLatency = Math.max(15, payment.latencyMs + (Math.random() * 14 - 7));
    let payOk = Math.random() > (payment.errorRate / 100);
    if (db.status === 'DOWN' || db.status === 'CRITICAL') {
      payLatency += db.latencyMs * 0.5;
      if (Math.random() < 0.4) payOk = false;
    }
    trace.push({ serviceId: 'payment-service', latency: Math.round(payLatency), ok: payOk });
    totalDuration += payLatency;

    if (!payOk) {
      overallSuccess = false;
    }

    // 4. DB Step
    const dbLatency = Math.max(4, db.latencyMs + (Math.random() * 4 - 2));
    const dbOk = db.status !== 'DOWN' && Math.random() > (db.errorRate / 100);
    trace.push({ serviceId: 'database', latency: Math.round(dbLatency), ok: dbOk });
    totalDuration += dbLatency;

    // 5. Notification Service (Asynchronous consumer)
    const notifLatency = Math.max(8, notification.latencyMs + (Math.random() * 6 - 3));
    const notifOk = notification.status !== 'DOWN' && Math.random() > (notification.errorRate / 100);
    trace.push({ serviceId: 'notification-service', latency: Math.round(notifLatency), ok: notifOk });

    return {
      success: overallSuccess && dbOk && notifOk,
      durationMs: Math.round(totalDuration),
      trace,
    };
  }

  // Recalculates operational metrics based on real chaos and cascading dependencies
  public updateMetricsCycle(): void {
    const payment = this.services.get('payment-service')!;
    const order = this.services.get('order-service')!;
    const notif = this.services.get('notification-service')!;
    const db = this.services.get('database')!;
    const gw = this.services.get('api-gateway')!;

    // Base noise and natural recovery rate
    this.services.forEach((service) => {
      // Nominal base values
      let targetLatency = 20;
      let targetError = 0.2;
      let targetCpu = 25;
      let targetMem = 35;
      let targetQueue = 3;
      let targetRps = 24;

      if (service.id === 'api-gateway') {
        targetLatency = 14;
        targetCpu = 22;
        targetMem = 30;
        targetRps = 32;
      } else if (service.id === 'order-service') {
        targetLatency = 36;
        targetCpu = 32;
        targetMem = 42;
        targetRps = 26;
      } else if (service.id === 'payment-service') {
        targetLatency = 50;
        targetCpu = 38;
        targetMem = 46;
        targetRps = 22;
      } else if (service.id === 'notification-service') {
        targetLatency = 24;
        targetCpu = 18;
        targetMem = 26;
        targetRps = 20;
      } else if (service.id === 'database') {
        targetLatency = 8;
        targetCpu = 35;
        targetMem = 52;
        targetRps = 60;
      }

      // Apply active chaos effects
      for (const chaos of service.activeChaos) {
        switch (chaos) {
          case 'HIGH_LATENCY':
            targetLatency = Math.min(3200, targetLatency + 1650 + Math.random() * 450);
            targetQueue += 18;
            targetCpu += 28;
            targetError = Math.min(100, targetError + 14.5);
            break;
          case 'ERROR_SPIKE':
            targetError = Math.min(95, targetError + 42.0);
            targetQueue += 12;
            targetLatency += 280;
            break;
          case 'KILL_SERVICE':
            targetLatency = 5000;
            targetError = 100;
            targetCpu = 0;
            targetMem = 5;
            targetRps = 0;
            targetQueue = 45;
            break;
          case 'TRAFFIC_SURGE':
            targetRps = Math.round(targetRps * 4.5);
            targetCpu = Math.min(98, targetCpu + 52);
            targetMem = Math.min(95, targetMem + 40);
            targetQueue += 32;
            targetLatency += 340;
            targetError += 8.2;
            break;
          case 'DB_FAILURE':
            targetLatency += 2100;
            targetError += 68;
            targetQueue += 35;
            targetCpu = Math.min(96, targetCpu + 45);
            break;
          case 'MEMORY_PRESSURE':
            targetMem = Math.min(96, targetMem + 54);
            targetCpu += 35;
            targetLatency += 480;
            targetError += 12.0;
            break;
          case 'DEPENDENCY_FAILURE':
            targetLatency += 1200;
            targetError += 34.0;
            targetQueue += 14;
            service.dependencyFailures += 2;
            break;
        }
      }

      // CASCADING PROPAGATION LOGIC:
      // 1. If Payment is troubled, Order Service suffers (downstream timeout)
      if (service.id === 'order-service' && (payment.status === 'CRITICAL' || payment.status === 'DOWN' || payment.latencyMs > 500)) {
        const cascadeRatio = payment.latencyMs > 1000 ? 0.7 : 0.4;
        targetLatency += Math.round(payment.latencyMs * cascadeRatio);
        targetQueue += Math.round(payment.queueDepth * 0.85);
        targetError = Math.min(95, targetError + (payment.errorRate * 0.65));
        targetCpu = Math.min(96, targetCpu + 24);
      }

      // 2. If Order Service is troubled, Notification Service queue builds up or starves
      if (service.id === 'notification-service' && (order.status === 'CRITICAL' || order.status === 'DOWN')) {
        targetQueue += Math.round(order.queueDepth * 0.5);
        targetRps = Math.max(2, Math.round(targetRps * 0.4));
      }

      // 3. If Database is down/critical, both Order and Payment fail
      if ((service.id === 'order-service' || service.id === 'payment-service') && (db.status === 'CRITICAL' || db.status === 'DOWN')) {
        targetLatency += 1800;
        targetError = Math.min(98, targetError + 55);
        targetQueue += 25;
      }

      // Smooth step towards target with slight jitter
      const jitter = (Math.random() - 0.5) * 0.1;
      service.latencyMs = Math.round(service.latencyMs * 0.4 + targetLatency * 0.6 + jitter * 10);
      service.errorRate = Number(Math.max(0, Math.min(100, service.errorRate * 0.4 + targetError * 0.6)).toFixed(1));
      service.cpuPercent = Math.max(5, Math.min(100, Math.round(service.cpuPercent * 0.5 + targetCpu * 0.5)));
      service.memoryPercent = Math.max(10, Math.min(100, Math.round(service.memoryPercent * 0.7 + targetMem * 0.3)));
      service.queueDepth = Math.max(0, Math.round(service.queueDepth * 0.5 + targetQueue * 0.5));
      service.requestsPerSec = Math.max(0, Math.round(service.requestsPerSec * 0.4 + targetRps * 0.6));

      this.recalculateServiceStatus(service);
    });
  }

  private recalculateServiceStatus(service: ServiceState): void {
    const prevStatus = service.status;

    if (service.activeChaos.includes('KILL_SERVICE') || service.isolated) {
      service.status = 'DOWN';
      service.healthScore = 0;
    } else if (service.errorRate > 30 || service.latencyMs > 1800 || service.cpuPercent > 92 || service.memoryPercent > 94) {
      service.status = 'CRITICAL';
      service.healthScore = Math.max(15, Math.round(100 - (service.errorRate * 1.2 + (service.latencyMs / 30))));
    } else if (service.errorRate > 5 || service.latencyMs > 300 || service.cpuPercent > 75 || service.queueDepth > 15) {
      service.status = 'DEGRADED';
      service.healthScore = Math.max(45, Math.round(100 - (service.errorRate * 1.5 + (service.latencyMs / 40))));
    } else {
      service.status = 'HEALTHY';
      service.healthScore = Math.min(100, Math.max(90, Math.round(100 - service.errorRate * 2 - (service.latencyMs / 200))));
    }

    // Publish event if health status changed
    if (prevStatus !== service.status) {
      eventBus.publish({
        type: 'SERVICE_HEALTH_CHANGED',
        source: service.id,
        severity: service.status === 'CRITICAL' || service.status === 'DOWN' ? 'CRITICAL' : service.status === 'DEGRADED' ? 'WARN' : 'INFO',
        message: `${service.name} health state transitioned from [${prevStatus}] to [${service.status}] (Score: ${service.healthScore}/100)`,
        data: {
          serviceId: service.id,
          oldStatus: prevStatus,
          newStatus: service.status,
          latencyMs: service.latencyMs,
          errorRate: service.errorRate,
          healthScore: service.healthScore,
        },
      });
    }
  }
}

export const microservices = new MicroserviceCluster();
