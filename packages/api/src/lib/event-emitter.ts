import type { SSEEvent, SSEEventType } from "@devil-advocate/shared";

type EventCallback<T = unknown> = (event: SSEEvent<T>) => void;

export class TypedEventEmitter {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on<T = unknown>(eventType: SSEEventType, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback as EventCallback);

    return () => {
      this.listeners.get(eventType)?.delete(callback as EventCallback);
    };
  }

  emit<T = unknown>(eventType: SSEEventType, data: T): void {
    const event: SSEEvent<T> = {
      type: eventType,
      data,
      timestamp: new Date(),
    };

    this.listeners.get(eventType)?.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error(`Error in event listener for ${eventType}:`, error);
      }
    });
  }

  removeAllListeners(eventType?: SSEEventType): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }
}

// Global session event emitters
const sessionEmitters: Map<string, TypedEventEmitter> = new Map();

export function getSessionEmitter(sessionId: string): TypedEventEmitter {
  if (!sessionEmitters.has(sessionId)) {
    sessionEmitters.set(sessionId, new TypedEventEmitter());
  }
  return sessionEmitters.get(sessionId)!;
}

export function removeSessionEmitter(sessionId: string): void {
  const emitter = sessionEmitters.get(sessionId);
  if (emitter) {
    emitter.removeAllListeners();
    sessionEmitters.delete(sessionId);
  }
}
