import { SystemEvent, EventType, ServiceId } from './types.js';

type EventHandler = (event: SystemEvent) => void | Promise<void>;

export class ResQEventBus {
  private subscribers: Map<EventType | '*', Set<EventHandler>> = new Map();
  private history: SystemEvent[] = [];
  private readonly maxHistorySize = 250;
  private counter = 1000;

  constructor() {
    this.publish({
      id: `EV-${Date.now()}-0001`,
      type: 'SYSTEM_BOOT',
      timestamp: Date.now(),
      source: 'SYSTEM',
      severity: 'INFO',
      message: 'ResQMesh Real-time Event Bus initialized and listening on internal broker queue',
    });
  }

  public subscribe(eventType: EventType | '*', handler: EventHandler): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)!.add(handler);

    // Return un-subscribe function
    return () => {
      this.subscribers.get(eventType)?.delete(handler);
    };
  }

  public publish(eventPayload: Omit<SystemEvent, 'id' | 'timestamp'> & { id?: string; timestamp?: number }): SystemEvent {
    this.counter++;
    const event: SystemEvent = {
      id: eventPayload.id || `EV-${this.counter}`,
      timestamp: eventPayload.timestamp || Date.now(),
      type: eventPayload.type,
      source: eventPayload.source,
      severity: eventPayload.severity,
      message: eventPayload.message,
      data: eventPayload.data,
    };

    // Store in circular buffer for audit trail
    this.history.unshift(event);
    if (this.history.length > this.maxHistorySize) {
      this.history.pop();
    }

    // Notify specific subscribers
    const directHandlers = this.subscribers.get(event.type);
    if (directHandlers) {
      for (const handler of directHandlers) {
        try {
          handler(event);
        } catch (err) {
          console.error(`[EventBus] Error in subscriber for ${event.type}:`, err);
        }
      }
    }

    // Notify wildcard subscribers
    const wildcardHandlers = this.subscribers.get('*');
    if (wildcardHandlers) {
      for (const handler of wildcardHandlers) {
        try {
          handler(event);
        } catch (err) {
          console.error(`[EventBus] Error in wildcard subscriber:`, err);
        }
      }
    }

    return event;
  }

  public getRecentEvents(limit: number = 50): SystemEvent[] {
    return this.history.slice(0, limit);
  }

  public clearHistory(): void {
    this.history = [];
  }
}

export const eventBus = new ResQEventBus();
