import { clients } from "./liveStore";

export function getStreamResponse(request: Request): Response {
  const url = new URL(request.url);
  const share_code = url.searchParams.get("share_code");

  if (!share_code) {
    return new Response("Missing share_code", { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const send = (msg: string) => {
        controller.enqueue(new TextEncoder().encode(msg));
      };

      if (!clients.has(share_code)) {
        clients.set(share_code, new Set());
      }
      clients.get(share_code)!.add(send);

      send(`data: {"type": "connected"}\n\n`);

      const interval = setInterval(() => {
        send(`:\n\n`);
      }, 15000);

      if (request.signal) {
        request.signal.addEventListener("abort", () => {
          clearInterval(interval);
          const sessionClients = clients.get(share_code);
          if (sessionClients) {
            sessionClients.delete(send);
            if (sessionClients.size === 0) {
              clients.delete(share_code);
            }
          }
        });
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
