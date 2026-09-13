# ResQMesh Technical Architecture Specification

## 1. System Overview

ResQMesh is an autonomous reliability control plane for cloud-native microservices. It bridges the gap between passive observability systems (Prometheus, Datadog) and active orchestration infrastructure (Kubernetes, Envoy Service Mesh).

```
                      +------------------------------------------+
                      |         ResQMesh Ingress & UI           |
                      |        (React 18 + SSE Stream)           |
                      +--------------------+---------------------+
                                           |
                                      REST / SSE
                                           |
+------------------------------------------v------------------------------------------+
|                                ResQMesh Control Plane                               |
|                                                                                     |
|   +-------------------+      +--------------------+      +----------------------+   |
|   |  Telemetry Engine |----->| Reliability Engine |----->|  Remediation Engine  |   |
|   |  (Golden Signals) |      | (Cascade & Incidents)     |  (Playbook Execution)|   |
|   +-------------------+      +--------------------+      +----------------------+   |
|             ^                          |                             |              |
|             |                          v                             v              |
|             |                 +------------------+          +------------------+    |
|             |                 | Gemini 3.8 Flash |          |  Policy Engine   |    |
|             |                 | (Cognitive RCA)  |          |  (SRE Guardrails)|    |
|             |                 +------------------+          +------------------+    |
|             |                                                        |              |
|             +----------------------- Event Bus <---------------------+              |
|                                (Synchronous Pub/Sub)                                |
+------------------------------------------+------------------------------------------+
                                           |
                              Physical Cluster Mutations
                                           |
+------------------------------------------v------------------------------------------+
|                                Microservice Cluster                                 |
|                                                                                     |
|   +----------------+       +---------------+       +-----------------+              |
|   |  API Gateway   |------>| Order Service |------>| Payment Service |              |
|   +----------------+       +---------------+       +-----------------+              |
|                                    |                        |                       |
|                                    v                        v                       |
|                        +----------------------+    +-----------------+              |
|                        | Notification Service |    |  PostgreSQL DB  |              |
|                        +----------------------+    +-----------------+              |
+-------------------------------------------------------------------------------------+
```

---

## 2. Distributed Microservice State Machine

Each microservice in ResQMesh implements a deterministic lifecycle state machine:

```
           [ HEALTHY ]
           /         \
   (Latency > 150ms)  (Latency > 400ms OR Errors > 20%)
         /             \
        v               v
  [ DEGRADED ] ----> [ CRITICAL ]
        \               /
   (Kill Signal / 100% Errors)
          \           /
           v         v
            [ DOWN ]
```

### Failure Propagation Modeling
When a service degrades, ResQMesh simulates real TCP socket exhaustion:
- **Upstream Timeouts**: When `payment-service` latency surges to 1,800ms, `order-service` threads waiting on synchronous responses are blocked.
- **Queue Saturation**: Unfinished requests back up in the `order-service` worker queue (`queueDepth` increases from 5 to 50+ msgs).
- **Asynchronous Starvation**: `notification-service` is an asynchronous worker consuming checkout events. Because order checkouts fail upstream, notification processing throughput drops to near zero.

---

## 3. Telemetry Pipeline & Golden Signals

The `TelemetryEngine` runs on a high-resolution 1,000ms loop:
1. **Transaction Simulation**: Dispatches distributed synthetic customer checkouts traversing `api-gateway -> order-service -> payment-service -> database`.
2. **Metric Aggregation**: Computes 4 Golden Signals:
   - **Latency (p95/avg)**: Per-service and composite system response time in milliseconds.
   - **Traffic**: Ingress requests per second (RPS).
   - **Errors**: Percentage of 5xx HTTP response codes.
   - **Saturation**: Worker thread queue depth and memory/CPU percentages.
3. **Deterministic Reliability Score Formula**:
   $$\text{Score} = 100 - (\text{ErrorRate} \times 1.4) - \min(35, \frac{\text{AvgLatency}}{25}) - (\text{UnhealthyNodes} \times 14) - \min(15, \frac{\text{QueueTotal}}{4})$$
   *Bounded strictly between 0 and 100.*

---

## 4. Cascading Failure Predictor

ResQMesh evaluates the cluster dependency graph using directed adjacency traversal:
- If a leaf dependency (e.g. `database` or `payment-service`) exceeds warning thresholds, ResQMesh computes downstream nodes:
  $$\text{Impacted Nodes} = \text{DownstreamReach}(\text{Culprit})$$
- Cascade probability is calculated based on culprit error rate, queue backlog rate of change, and dependency depth:
  $$\text{Probability} = \min(99, 30 + (\text{CulpritLatency} / 25) + (\text{QueueDepth} \times 2))$$

---

## 5. Grounded AI Reasoning with Gemini 3.8 Flash

Unlike traditional chatbots, ResQMesh grounds the AI model with real-time operational context:
- **Grounded Prompt Context**: Injects observed telemetry values, baseline values, deviation percentages, active chaos flags, and topology path.
- **Structured JSON Schema**: Gemini must return structured fields: `summary`, `explanation`, `groundedTelemetry`, `confidence`, `recommendedAction`, `targetService`, and `rationale`.
- **"WHY" Requirement**: Explains why the specific remediation action is the lowest-risk permitted mitigation according to SRE best practices.
- **Deterministic Fallback**: If `GEMINI_API_KEY` is not present or an API rate limit occurs, ResQMesh seamlessly routes through a deterministic expert-rules fallback engine.

---

## 6. SRE Policy Governance & Safety Envelopes

Every remediation plan (AI or human) must pass the `PolicyEngine` before execution:
1. **Allowlist Verification**: Action must match `['restart_service', 'scale_service', 'reroute_traffic', 'isolate_instance', 'recover_dependency', 'clear_queue_backlog', 'reset_all']`.
2. **Boundary Validation**:
   - Replicas must be strictly within `[1, 5]`.
   - Traffic weights must be within `[0%, 100%]`.
3. **Anti-Flapping Rate Limit**: Imposes a mandatory 4,000ms cooldown per service action to avoid catastrophic flapping feedback loops.
4. **Auditability**: Every evaluation is published to the `SystemEvent` audit bus with the specific rule ID cited (e.g. `SRE-POL-05`).

---

## 7. Kubernetes Cloud-Native Production Mapping

ResQMesh is architected to translate directly to production Kubernetes environments:

| ResQMesh Prototype Component | Kubernetes Production Mapping |
| :--- | :--- |
| `microservices.ts` | Kubernetes Deployments & StatefulSets |
| `telemetryEngine.ts` | Prometheus + OpenTelemetry Collector Sidecars |
| `eventBus.ts` | CloudEvents / Apache Kafka / NATS JetStream |
| `policyEngine.ts` | OPA Gatekeeper / Kyverno Admission Controller |
| `remediationEngine.ts` | Custom Kubernetes Operator (CRD Controller) |
| `geminiService.ts` | AI SRE Agent microservice with Vertex AI SDK |
