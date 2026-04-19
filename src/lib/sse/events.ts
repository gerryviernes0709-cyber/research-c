/**
 * SSE Event Type Definitions
 *
 * Defines the event types and data structures for Server-Sent Events
 * used across the PeptideIQ real-time system.
 */

export type SSEEventType =
  | "idea.created"
  | "idea.updated"
  | "idea.scored"
  | "signal.created"
  | "signal.processed"
  | "source.health_changed"
  | "digest.generated"
  | "competitor.alert";

export interface SSEEvent {
  id: string;
  type: SSEEventType;
  data: Record<string, unknown>;
  timestamp: string;
}

/**
 * Format an SSEEvent into the SSE wire format.
 *
 * SSE format:
 *   id: <event-id>
 *   event: <event-type>
 *   data: <json-data>
 *   <blank line>
 */
export function formatSSE(event: SSEEvent): string {
  return `id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
}

/**
 * Create an SSE event object with auto-generated timestamp.
 */
export function createSSEEvent(
  id: string,
  type: SSEEventType,
  data: Record<string, unknown>
): SSEEvent {
  return {
    id,
    type,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Format a heartbeat/keep-alive comment for SSE streams.
 * Keeps the connection alive and prevents proxies from closing it.
 */
export function formatSSEHeartbeat(): string {
  return `: heartbeat ${Date.now()}\n\n`;
}
