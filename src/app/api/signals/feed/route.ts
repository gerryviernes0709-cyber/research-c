import { mockSignals } from "@/mock/data";

export const runtime = "edge";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: Record<string, unknown>) => {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      // Send initial connection event
      sendEvent({
        type: "connected",
        timestamp: new Date().toISOString(),
      });

      let heartbeatCount = 0;
      let signalIndex = 0;
      const maxIterations = 100; // prevent infinite loop

      const interval = setInterval(() => {
        heartbeatCount++;

        if (heartbeatCount >= maxIterations) {
          clearInterval(interval);
          controller.close();
          return;
        }

        // Send heartbeat every tick (15s equivalent — managed by client reconnection)
        sendEvent({
          type: "heartbeat",
          timestamp: new Date().toISOString(),
        });

        // Every 2nd tick (~30s equivalent), send a mock signal event
        if (heartbeatCount % 2 === 0) {
          const signal = mockSignals[signalIndex % mockSignals.length];
          signalIndex++;

          sendEvent({
            type: "signal.created",
            data: {
              id: signal.id,
              source: signal.source,
              sourceTitle: signal.sourceTitle,
              contentType: signal.contentType,
              relevanceScore: signal.relevanceScore,
              peptidesMentioned: signal.peptidesMentioned,
              detectedAt: new Date().toISOString(),
            },
            timestamp: new Date().toISOString(),
          });
        }
      }, 15000);

      // Clean up on abort
      request: {
        // The stream will be closed when the client disconnects
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
