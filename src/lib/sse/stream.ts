export function createSSEResponse(stream: ReadableStream): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}

export function createSSEStream(
  generator: (controller: ReadableStreamDefaultController) => Promise<void>
): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      try {
        await generator(controller);
      } catch {
        controller.close();
      }
    },
  });
}
