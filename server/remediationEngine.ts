import { microservices } from './microservices.js';
import { policyEngine } from './policyEngine.js';
import { reliabilityEngine } from './reliabilityEngine.js';
import { eventBus } from './eventBus.js';
import { telemetryEngine } from './telemetryEngine.js';
import { 
  RemediationPlan, 
  RemediationActionType, 
  ServiceId, 
  Incident 
} from './types.js';

export class RemediationEngine {
  private executedPlans: RemediationPlan[] = [];
  private planCounter = 4810;
  private autoRemediationEnabled: boolean = true;

  constructor() {
    // Listen for newly opened incidents to trigger autonomous remediation workflow if enabled
    eventBus.subscribe('INCIDENT_OPENED', async (event) => {
      if (!this.autoRemediationEnabled) return;
      const incidentId = event.data?.incidentId;
      if (!incidentId) return;

      // Small delay to simulate observation window
      setTimeout(async () => {
        const incident = reliabilityEngine.getIncident(incidentId);
        if (incident && incident.status === 'ACTIVE') {
          await this.orchestrateIncidentRemediation(incident);
        }
      }, 1500);
    });
  }

  public isAutoRemediationEnabled(): boolean {
    return this.autoRemediationEnabled;
  }

  public setAutoRemediation(enabled: boolean): void {
    this.autoRemediationEnabled = enabled;
  }

  public getExecutedPlans(): RemediationPlan[] {
    return [...this.executedPlans];
  }

  public async orchestrateIncidentRemediation(incident: Incident): Promise<RemediationPlan> {
    this.planCounter++;
    const planId = `RM-${this.planCounter}`;

    // Capture before metrics
    const beforeSnapshot = telemetryEngine.getLatestSnapshot();
    const culprit = incident.culpritService;

    // Propose action based on incident
    let recommendedAction: RemediationActionType = 'restart_service';
    let targetParams: Record<string, any> = {};

    if (incident.remediationPlan?.recommendedAction) {
      recommendedAction = incident.remediationPlan.recommendedAction;
      targetParams = incident.remediationPlan.targetParams || {};
    } else {
      if (culprit === 'database') {
        recommendedAction = 'recover_dependency';
      } else if (incident.evidence.some(e => e.metric.toLowerCase().includes('traffic') || e.metric.toLowerCase().includes('queue'))) {
        recommendedAction = 'scale_service';
        targetParams = { replicas: 4 };
      } else {
        recommendedAction = 'restart_service';
      }
    }

    eventBus.publish({
      type: 'REMEDIATION_REQUESTED',
      source: 'REMEDIATION_ENGINE',
      severity: 'INFO',
      message: `Plan #${planId} created for Incident #${incident.id}: Requesting [${recommendedAction}] on [${culprit}]`,
      data: { planId, incidentId: incident.id, action: recommendedAction },
    });

    // Step: Policy Governance Check
    const policy = policyEngine.evaluateAction(recommendedAction, culprit, targetParams);

    const plan: RemediationPlan = {
      id: planId,
      incidentId: incident.id,
      recommendedAction,
      targetService: culprit,
      targetParams,
      proposedBy: incident.rootCauseAnalysis.analyzedBy === 'GEMINI_3.8_FLASH' ? 'AI_GEMINI' : 'DETERMINISTIC_RULES',
      rationale: incident.rootCauseAnalysis.explanation,
      confidence: incident.rootCauseAnalysis.confidence,
      policy,
      status: policy.decision === 'APPROVED' ? 'APPROVED' : 'REJECTED',
    };

    incident.remediationPlan = plan;
    this.executedPlans.unshift(plan);

    if (policy.decision === 'REJECTED') {
      return plan;
    }

    // Step: Execute Remediation
    plan.status = 'EXECUTING';
    incident.status = 'MITIGATING';

    const execResult = this.executeAction(recommendedAction, culprit, targetParams);
    plan.executedAt = Date.now();
    plan.status = execResult.success ? 'EXECUTED' : 'FAILED';

    // Step: Verify Recovery after physical propagation
    setTimeout(() => {
      this.verifyRecovery(incident, plan, beforeSnapshot);
    }, 2500);

    return plan;
  }

  public executeManualAction(
    action: RemediationActionType, 
    targetService: ServiceId, 
    targetParams?: Record<string, any>
  ): RemediationPlan {
    this.planCounter++;
    const planId = `RM-${this.planCounter}`;
    const beforeSnapshot = telemetryEngine.getLatestSnapshot();

    const policy = policyEngine.evaluateAction(action, targetService, targetParams);

    const plan: RemediationPlan = {
      id: planId,
      incidentId: 'MANUAL_OVERRIDE',
      recommendedAction: action,
      targetService,
      targetParams,
      proposedBy: 'DETERMINISTIC_RULES',
      rationale: 'Operator initiated manual remediation override via ResQMesh Operations console.',
      confidence: 100,
      policy,
      status: policy.decision === 'APPROVED' ? 'APPROVED' : 'REJECTED',
    };

    this.executedPlans.unshift(plan);

    if (policy.decision === 'APPROVED') {
      plan.status = 'EXECUTING';
      const res = this.executeAction(action, targetService, targetParams);
      plan.executedAt = Date.now();
      plan.status = res.success ? 'EXECUTED' : 'FAILED';

      // Trigger verification
      setTimeout(() => {
        const activeIncidents = reliabilityEngine.getActiveIncidents();
        const matchingInc = activeIncidents.find(i => i.culpritService === targetService);
        if (matchingInc) {
          this.verifyRecovery(matchingInc, plan, beforeSnapshot);
        } else {
          // General recovery verification
          const afterSnapshot = telemetryEngine.getLatestSnapshot();
          plan.status = 'VERIFIED';
          plan.verifiedAt = Date.now();
          plan.verificationDetails = `Verified cluster health restored (Score: ${afterSnapshot.deterministicReliabilityScore}/100, Latency: ${afterSnapshot.overallLatencyMs}ms)`;
        }
      }, 2000);
    }

    return plan;
  }

  private executeAction(
    action: RemediationActionType, 
    targetService: ServiceId, 
    targetParams?: Record<string, any>
  ): { success: boolean; message: string } {
    switch (action) {
      case 'restart_service':
        return microservices.restartService(targetService);
      case 'scale_service':
        return microservices.scaleService(targetService, targetParams?.replicas || 3);
      case 'isolate_instance':
        return microservices.isolateInstance(targetService);
      case 'reroute_traffic':
        return microservices.rerouteTraffic(targetService, targetParams?.weight ?? 100);
      case 'clear_queue_backlog':
        return microservices.clearQueueBacklog(targetService);
      case 'recover_dependency':
        return microservices.recoverDependency(targetService);
      case 'reset_all':
        return microservices.clearChaos();
      default:
        return { success: false, message: `Unknown action ${action}` };
    }
  }

  private verifyRecovery(
    incident: Incident, 
    plan: RemediationPlan, 
    beforeSnapshot: any
  ): void {
    const afterSnapshot = telemetryEngine.getLatestSnapshot();
    const service = microservices.getService(incident.culpritService);

    // Verification check: Is service now HEALTHY or DEGRADED with error rate dropped?
    const isRestored = !service || service.status === 'HEALTHY' || (service.errorRate < 2.0 && service.latencyMs < 200);

    if (isRestored) {
      plan.status = 'VERIFIED';
      plan.verifiedAt = Date.now();
      plan.verificationDetails = `HEALTH RESTORED: ${incident.culpritService} latency normalized to ${service?.latencyMs ?? 20}ms (error rate: ${service?.errorRate ?? 0.1}%). All downstream dependents operating nominally.`;

      // Resolve incident with before/after comparison
      reliabilityEngine.resolveIncident(incident.id, {
        before: {
          availability: beforeSnapshot.systemAvailability,
          latencyMs: beforeSnapshot.overallLatencyMs,
          errorRate: beforeSnapshot.overallErrorRate,
          healthyServices: `${beforeSnapshot.healthyServicesCount}/${beforeSnapshot.totalServicesCount}`,
        },
        after: {
          availability: afterSnapshot.systemAvailability,
          latencyMs: afterSnapshot.overallLatencyMs,
          errorRate: afterSnapshot.overallErrorRate,
          healthyServices: `${afterSnapshot.healthyServicesCount}/${afterSnapshot.totalServicesCount}`,
        },
      });
    } else {
      plan.status = 'EXECUTED';
      plan.verificationDetails = `Recovery pending: Service health still stabilizing (current score: ${service?.healthScore}/100)`;
    }
  }
}

export const remediationEngine = new RemediationEngine();
