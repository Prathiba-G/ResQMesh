# ResQMesh: Autonomous Self-Healing Cloud Infrastructure

> **Intelligent Reliability Layer for Cloud-Native Microservices**  
> *Observe → Detect → Predict → Explain → Plan → Govern → Execute → Verify*

[![Build Status](https://img.shields.io/badge/Build-Passing-emerald)](https://github.com/)
[![Reliability Loop](https://img.shields.io/badge/Architecture-Autonomous_Self--Healing-cyan)](https://github.com/)
[![AI Grounding](https://img.shields.io/badge/AI_Engine-Gemini_3.8_Flash-blue)](https://github.com/)
[![SRE Governance](https://img.shields.io/badge/Governance-Deterministic_Policy_Gate-purple)](https://github.com/)

---

## 1. Executive Summary

Modern cloud-native microservice architectures are notoriously prone to **cascading failures**. A transient socket leak in an upstream payment processor can saturate worker pools in downstream order services, blow out queue depths in message consumers, and cause system-wide downtime.

Traditional SRE operations rely on human paging rotations, static threshold alerts, and fragmented dashboards. By the time an on-call engineer opens a terminal, thousands of transactions have failed.

**ResQMesh** is an autonomous reliability layer that closes the loop between telemetry observation and recovery execution. It continuously ingests real distributed golden signals, detects anomalies, forecasts cascading blast radius, synthesizes an AI root-cause explanation grounded in telemetry, passes the proposed recovery through a deterministic safety policy validator, autonomously executes permitted mutations, and cryptographically verifies health restoration.

---

## 2. The 8-Stage ResQMesh Control Loop

```
[ OBSERVE ] ──> [ DETECT ] ──> [ PREDICT ] ──> [ EXPLAIN ]
     │               │              │               │
  Golden          Anomaly        Cascade         Gemini 3.8
  Signals        Telemetry      Blast Radius       Flash
     │               │              │               │
[ VERIFY ] <── [ EXECUTE ] <── [ GOVERN ] <─── [ PLAN ]
     │               │              │               │
  Health         Autonomous      SRE Policy      Actionable
 Restoration      Mutation       Allowlist        Playbook
```

1. **OBSERVE**: High-frequency ingest of golden signals (Latency, 5xx Error Rate, Queue Depth, Worker Saturation, Ingress RPS) across all microservices.
2. **DETECT**: Real-time statistical anomaly detection comparing live telemetry deviations against operational baselines.
3. **PREDICT**: Downstream dependency topology modeling calculating cascade probability (0–100%) and isolating the primary bottleneck.
4. **EXPLAIN**: Gemini 3.8 Flash multi-variable cognitive reasoning answering **WHY** the failure occurred using strictly grounded metrics (zero hallucination).
5. **PLAN**: Synthesizing the lowest-risk remediation plan (`restart_service`, `scale_service`, `clear_queue_backlog`, `recover_dependency`, `reroute_traffic`).
6. **GOVERN**: Deterministic SRE policy engine validating scaling envelopes, rate limits, and security allowlists. (Forbidden actions like unbounded scaling or dropping tables are hard-rejected with cited policy rules).
7. **EXECUTE**: Autonomous execution mutating container worker states and clearing blocked network sockets.
8. **VERIFY**: Closed-loop verification measuring post-recovery availability, latency, and error rates, and outputting an audit scorecard.

---

## 3. Separation of Concerns: AI vs. Deterministic Governance

ResQMesh enforces a strict boundary between probabilistic AI inference and deterministic infrastructure safety:

| Responsibility | Engine | Why This Architecture? |
| :--- | :--- | :--- |
| **Composite Reliability Score** | Deterministic Code | Never hallucinated. Computed mathematically from uptime, error rate, and queue pressure. |
| **Cascade Risk & Topology** | Graph Adjacency Engine | Tracks real dependency chains (`Gateway → Order → Payment → DB`). |
| **Cognitive RCA & "Why"** | **Gemini 3.8 Flash** | Correlates multiple telemetry anomalies to formulate human-readable SRE explanations. |
| **Safety Governance Matrix** | Policy Engine Guardrail | Enforces hard bounds (e.g. max 5 replicas, 4s anti-flapping cooldown). |
| **Physical Cluster Mutation** | Execution Engine | Dispatches actual container restarts, worker scaling, and socket pool resets. |

---

## 4. Live Microservice Architecture

ResQMesh ships with a genuine distributed microservice cluster:

* **API Gateway (`api-gateway`)**: Ingress traffic router with load balancing and circuit breaking.
* **Order Service (`order-service`)**: Checkout workflow coordinator managing transactional worker threads.
* **Payment Service (`payment-service`)**: PCI tokenization and merchant banking connector.
* **Notification Service (`notification-service`)**: Asynchronous worker consuming checkout events.
* **Database (`database`)**: PostgreSQL cluster storing orders, ledgers, and transaction pools.

---

## 5. Failure Injection & Chaos Lab

ResQMesh includes a dedicated Chaos Engineering console capable of injecting physical failure modes:

1. **High Latency**: Injects +1,800ms artificial network delay into worker threads.
2. **Error Spike**: Forces 45% HTTP 500/503 errors on transactional endpoints.
3. **Kill Service Pod**: Crashes container instances, cutting network sockets immediately.
4. **Traffic Surge**: Simulates a 4.5x flash-sale load spike exceeding worker queue capacity.
5. **Database Failure**: Exhausts PostgreSQL connection pools and locks transaction tables.
6. **Memory Pressure**: Simulates severe heap memory leaks triggering GC pauses.
7. **Dependency Failure**: Simulates external banking gateway outage.

---

## 6. The 3-Minute Hackathon Judge Walkthrough

1. **Start System**: Open ResQMesh in browser. All 5 microservices show green (`HEALTHY`, Reliability Score: ~99%).
2. **Click [RUN FULL INCIDENT DEMO]**:
   * **Phase 1**: Cluster establishes clean baseline state.
   * **Phase 2**: Controlled chaos injects High Latency into `Payment Service`.
   * **Phase 3**: Order Service thread workers become backlogged; queue depth spikes; Cascade Risk surges to **91%**.
   * **Phase 4**: ResQMesh invokes **Gemini 3.8 Flash** to compute grounded RCA. The card explains *why* the failure happened and *why* restarting worker pods is the optimal mitigation.
   * **Phase 5**: SRE Policy Engine checks `SRE-POL-00: Authorized Autonomous Self-Healing Rule` and marks the plan **APPROVED**.
   * **Phase 6**: Execution engine restarts Payment Service and drains worker sockets.
   * **Phase 7**: Recovery verification confirms latency has normalized to sub-40ms and generates a **Before vs. After** scorecard.
3. **Click [Trace Request]**: Observe real-time hop-by-hop latency waterfall across the cluster.

---

## 7. Running Locally & Testing

### Development
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

### Run Test Suite
```bash
npm test
```
Executes automated tests validating microservice health transitions, chaos physics, policy guardrails, event bus broadcasts, and reliability score computation.

### Production Build
```bash
npm run build
npm start
```
Compiles client assets and bundles `server.ts` into a self-contained CommonJS artifact at `dist/server.cjs`.

---

## 8. SRE Policy Governance Matrix

* `SEC-POL-01`: Unauthorized action execution guardrail.
* `RES-POL-03`: Horizontal Pod Autoscaler safety envelope (`1 <= replicas <= 5`).
* `NET-POL-02`: Load balancer weight boundary (`0% <= weight <= 100%`).
* `SRE-POL-05`: Anti-flapping remediation cooldown (minimum 4s between mutations).
* `SRE-POL-00`: Authorized autonomous self-healing rule.
