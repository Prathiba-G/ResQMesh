import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { microservices } from './server/microservices.js';
import { telemetryEngine } from './server/telemetryEngine.js';
import { reliabilityEngine } from './server/reliabilityEngine.js';
import { remediationEngine } from './server/remediationEngine.js';
import { geminiService } from './server/geminiService.js';
import { demoOrchestrator } from './server/demoOrchestrator.js';
import { eventBus } from './server/eventBus.js';
import { ServiceId, ChaosType, RemediationActionType } from './server/types.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to get unified system snapshot
  function getSystemSnapshot() {
    return {
      services: microservices.getServices(),
      currentMetrics: telemetryEngine.getLatestSnapshot(),
      metricsHistory: telemetryEngine.getHistory(),
      activeIncidents: reliabilityEngine.getActiveIncidents(),
      pastIncidents: reliabilityEngine.getPastIncidents(),
      cascadeRisk: reliabilityEngine.getCascadeRisk(),
      recentEvents: eventBus.getRecentEvents(40),
      autoRemediationEnabled: remediationEngine.isAutoRemediationEnabled(),
      demoMode: demoOrchestrator.getStatus(),
    };
  }

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'ResQMesh-Control-Plane',
      timestamp: Date.now(),
      geminiConfigured: !!process.env.GEMINI_API_KEY,
    });
  });

  // Full state snapshot
  app.get('/api/state', (req: Request, res: Response) => {
    res.json(getSystemSnapshot());
  });

  // Server-Sent Events (SSE) for Real-Time Telemetry & System Updates
  app.get('/api/telemetry/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Send initial state immediately
    res.write(`data: ${JSON.stringify(getSystemSnapshot())}\n\n`);

    // Stream updates every telemetry tick (1 second)
    const unsubscribe = telemetryEngine.subscribe(() => {
      try {
        const payload = JSON.stringify(getSystemSnapshot());
        res.write(`data: ${payload}\n\n`);
      } catch (err) {
        console.error('[SSE] Error streaming snapshot:', err);
      }
    });

    req.on('close', () => {
      unsubscribe();
    });
  });

  // Chaos Injection
  app.post('/api/chaos/inject', (req: Request, res: Response) => {
    const { serviceId, chaos } = req.body as { serviceId: ServiceId; chaos: ChaosType };
    if (!serviceId || !chaos) {
      return res.status(400).json({ success: false, error: 'serviceId and chaos parameters are required' });
    }

    const result = microservices.injectChaos(serviceId, chaos);
    res.json(result);
  });

  // Clear Chaos
  app.post('/api/chaos/clear', (req: Request, res: Response) => {
    const { serviceId } = req.body as { serviceId?: ServiceId };
    const result = microservices.clearChaos(serviceId);
    res.json(result);
  });

  // Execute Remediation Action (Manual or Automation Override)
  app.post('/api/remediation/execute', (req: Request, res: Response) => {
    const { action, targetService, targetParams } = req.body as {
      action: RemediationActionType;
      targetService: ServiceId;
      targetParams?: Record<string, any>;
    };

    if (!action || !targetService) {
      return res.status(400).json({ success: false, error: 'action and targetService are required' });
    }

    const plan = remediationEngine.executeManualAction(action, targetService, targetParams);
    res.json({ success: true, plan });
  });

  // Toggle Auto-Remediation
  app.post('/api/remediation/auto-toggle', (req: Request, res: Response) => {
    const { enabled } = req.body as { enabled: boolean };
    remediationEngine.setAutoRemediation(!!enabled);
    res.json({ success: true, autoRemediationEnabled: remediationEngine.isAutoRemediationEnabled() });
  });

  // AI Root Cause Analysis on an active or past incident
  app.post('/api/ai/analyze-incident', async (req: Request, res: Response) => {
    const { incidentId } = req.body as { incidentId: string };
    const incident = reliabilityEngine.getIncident(incidentId);

    if (!incident) {
      return res.status(404).json({ success: false, error: `Incident ${incidentId} not found` });
    }

    const liveTelemetry = telemetryEngine.getLatestSnapshot();
    const analysis = await geminiService.analyzeIncident(incident, {
      clusterServices: microservices.getServices(),
      liveTelemetry,
    });

    // Update incident with generated analysis
    reliabilityEngine.updateIncidentWithRCA(incident.id, {
      summary: analysis.summary,
      explanation: analysis.explanation,
      groundedTelemetry: analysis.groundedTelemetry,
      confidence: analysis.confidence,
      analyzedBy: analysis.analyzedBy,
    }, {
      id: `RM-AI-${Date.now().toString().slice(-4)}`,
      incidentId: incident.id,
      recommendedAction: analysis.recommendedAction,
      targetService: analysis.targetService,
      targetParams: analysis.targetParams,
      proposedBy: analysis.analyzedBy === 'GEMINI_3.8_FLASH' ? 'AI_GEMINI' : 'DETERMINISTIC_RULES',
      rationale: analysis.rationale,
      confidence: analysis.confidence,
      policy: null,
      status: 'PROPOSED',
    });

    res.json({ success: true, analysis });
  });

  // Trigger Guided Demo Workflow
  app.post('/api/demo/start', async (req: Request, res: Response) => {
    await demoOrchestrator.startFullDemo();
    res.json({ success: true, demoStatus: demoOrchestrator.getStatus() });
  });

  // Stop Guided Demo Workflow
  app.post('/api/demo/stop', (req: Request, res: Response) => {
    demoOrchestrator.stopDemo();
    res.json({ success: true, demoStatus: demoOrchestrator.getStatus() });
  });

  // Execute on-demand synthetic e-commerce transaction trace
  app.post('/api/transaction/test', (req: Request, res: Response) => {
    const traceResult = microservices.executeTransaction();
    res.json({ success: true, transaction: traceResult });
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ResQMesh] Autonomous Self-Healing Infrastructure Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
