import test from 'node:test';
import assert from 'node:assert/strict';
import { microservices } from '../server/microservices.js';
import { policyEngine } from '../server/policyEngine.js';
import { eventBus } from '../server/eventBus.js';
import { telemetryEngine } from '../server/telemetryEngine.js';
import { reliabilityEngine } from '../server/reliabilityEngine.js';

test('1. Microservices initialization and healthy state', () => {
  const services = microservices.getServices();
  assert.ok(services['api-gateway'], 'API Gateway should exist');
  assert.ok(services['order-service'], 'Order Service should exist');
  assert.ok(services['payment-service'], 'Payment Service should exist');
  assert.ok(services['notification-service'], 'Notification Service should exist');
  assert.ok(services['database'], 'Database should exist');

  assert.strictEqual(services['api-gateway'].status, 'HEALTHY');
  assert.strictEqual(services['payment-service'].status, 'HEALTHY');
});

test('2. Synthetic e-commerce transaction completes through cluster', () => {
  const result = microservices.executeTransaction();
  assert.ok(typeof result.durationMs === 'number', 'Duration should be a number');
  assert.ok(result.trace.length >= 4, 'Trace should include at least 4 microservice hops');
  assert.ok(result.trace.some(t => t.serviceId === 'api-gateway'), 'Trace contains Gateway');
  assert.ok(result.trace.some(t => t.serviceId === 'order-service'), 'Trace contains Order');
});

test('3. Chaos Injection physically alters service state', () => {
  // Inject high latency into payment service
  const res = microservices.injectChaos('payment-service', 'HIGH_LATENCY');
  assert.strictEqual(res.success, true);

  const payment = microservices.getService('payment-service');
  assert.ok(payment?.activeChaos.includes('HIGH_LATENCY'), 'Chaos flag active');

  // Step physics
  microservices.updateMetricsCycle();
  const updatedPayment = microservices.getService('payment-service');
  assert.ok(updatedPayment && updatedPayment.latencyMs > 80, `Latency should be elevated: ${updatedPayment?.latencyMs}ms`);

  // Clear chaos
  microservices.clearChaos('payment-service');
  const clearedPayment = microservices.getService('payment-service');
  assert.strictEqual(clearedPayment?.activeChaos.length, 0, 'Chaos cleared');
});

test('4. Policy Engine Guardrails enforce safety envelopes', () => {
  // Valid restart
  const approvedEval = policyEngine.evaluateAction('restart_service', 'payment-service');
  assert.strictEqual(approvedEval.decision, 'APPROVED');

  // Unbounded scale violation (scaling to 99 replicas rejected by SRE safety policy)
  const rejectedScale = policyEngine.evaluateAction('scale_service', 'order-service', { replicas: 99 });
  assert.strictEqual(rejectedScale.decision, 'REJECTED');
  assert.ok(rejectedScale.reason.includes('violates cloud capacity guardrails'));

  // Unauthorized action rejected
  const unauthorizedEval = policyEngine.evaluateAction('drop_database' as any, 'database');
  assert.strictEqual(unauthorizedEval.decision, 'REJECTED');
});

test('5. Event Bus properly broadcasts and buffers events', () => {
  let received = false;
  const unsubscribe = eventBus.subscribe('SERVICE_HEALTH_CHANGED', () => {
    received = true;
  });

  eventBus.publish({
    type: 'SERVICE_HEALTH_CHANGED',
    source: 'payment-service',
    severity: 'WARN',
    message: 'Test Health Event',
  });

  assert.strictEqual(received, true);
  unsubscribe();

  const history = eventBus.getRecentEvents(10);
  assert.ok(history.length > 0, 'Event history has entries');
});

test('6. Telemetry Engine computes deterministic Reliability Score', () => {
  const snapshot = telemetryEngine.getLatestSnapshot();
  assert.ok(snapshot.deterministicReliabilityScore >= 0 && snapshot.deterministicReliabilityScore <= 100);
  assert.ok(snapshot.systemAvailability >= 0 && snapshot.systemAvailability <= 100);
  assert.ok(typeof snapshot.overallLatencyMs === 'number');
});
