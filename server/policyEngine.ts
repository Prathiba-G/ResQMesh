import { PolicyEvaluation, RemediationActionType, ServiceId } from './types.js';
import { eventBus } from './eventBus.js';

export class PolicyEngine {
  private allowedActions: Set<RemediationActionType> = new Set([
    'restart_service',
    'scale_service',
    'reroute_traffic',
    'isolate_instance',
    'recover_dependency',
    'clear_queue_backlog',
    'reset_all',
  ]);

  private lastActionTimestamps: Map<string, number> = new Map();
  private readonly cooldownPeriodMs = 4000; // 4 second cooldown per service action

  public evaluateAction(
    action: RemediationActionType,
    targetService: ServiceId,
    targetParams?: Record<string, any>
  ): PolicyEvaluation {
    const timestamp = Date.now();
    const serviceActionKey = `${targetService}:${action}`;

    // Rule 1: Allowlist check
    if (!this.allowedActions.has(action)) {
      const evaluation: PolicyEvaluation = {
        action,
        targetService,
        targetParams,
        decision: 'REJECTED',
        reason: `Action '${action}' is not in the authorized reliability playbook allowlist.`,
        ruleEvaluated: 'SEC-POL-01: Unauthorized Execution Guardrail',
        evaluatedAt: timestamp,
      };
      this.publishPolicyEvent(evaluation);
      return evaluation;
    }

    // Rule 2: Scaling bounds validation
    if (action === 'scale_service') {
      const requestedReplicas = targetParams?.replicas;
      if (typeof requestedReplicas !== 'number' || requestedReplicas < 1 || requestedReplicas > 5) {
        const evaluation: PolicyEvaluation = {
          action,
          targetService,
          targetParams,
          decision: 'REJECTED',
          reason: `Requested replica count (${requestedReplicas}) violates cloud capacity guardrails [min: 1, max: 5].`,
          ruleEvaluated: 'RES-POL-03: Horizontal Pod Autoscaler Safety Envelope',
          evaluatedAt: timestamp,
        };
        this.publishPolicyEvent(evaluation);
        return evaluation;
      }
    }

    // Rule 3: Traffic reroute bounds validation
    if (action === 'reroute_traffic') {
      const weight = targetParams?.weight;
      if (typeof weight !== 'number' || weight < 0 || weight > 100) {
        const evaluation: PolicyEvaluation = {
          action,
          targetService,
          targetParams,
          decision: 'REJECTED',
          reason: `Traffic weighting must be between 0% and 100% (received ${weight}%).`,
          ruleEvaluated: 'NET-POL-02: Load Balancer Weight Boundary',
          evaluatedAt: timestamp,
        };
        this.publishPolicyEvent(evaluation);
        return evaluation;
      }
    }

    // Rule 4: Action Cooldown Rate-Limit check
    const lastTimestamp = this.lastActionTimestamps.get(serviceActionKey);
    if (lastTimestamp && timestamp - lastTimestamp < this.cooldownPeriodMs) {
      const elapsed = Math.round((timestamp - lastTimestamp) / 1000);
      const evaluation: PolicyEvaluation = {
        action,
        targetService,
        targetParams,
        decision: 'REJECTED',
        reason: `Action '${action}' throttled by safety cooldown (${elapsed}s elapsed, min required: 4s) to prevent flap storms.`,
        ruleEvaluated: 'SRE-POL-05: Anti-Flapping Remediation Cooldown',
        evaluatedAt: timestamp,
      };
      this.publishPolicyEvent(evaluation);
      return evaluation;
    }

    // If all rules pass:
    this.lastActionTimestamps.set(serviceActionKey, timestamp);
    const evaluation: PolicyEvaluation = {
      action,
      targetService,
      targetParams,
      decision: 'APPROVED',
      reason: `Action permitted by SRE Reliability Governance Matrix for target '${targetService}'.`,
      ruleEvaluated: 'SRE-POL-00: Authorized Autonomous Self-Healing Rule',
      evaluatedAt: timestamp,
    };
    this.publishPolicyEvent(evaluation);
    return evaluation;
  }

  private publishPolicyEvent(evaluation: PolicyEvaluation): void {
    eventBus.publish({
      type: 'POLICY_EVALUATED',
      source: 'POLICY_ENGINE',
      severity: evaluation.decision === 'APPROVED' ? 'INFO' : 'WARN',
      message: `Policy ${evaluation.decision}: Action [${evaluation.action}] on [${evaluation.targetService}]. Rule: ${evaluation.ruleEvaluated} - ${evaluation.reason}`,
      data: evaluation,
    });
  }
}

export const policyEngine = new PolicyEngine();
