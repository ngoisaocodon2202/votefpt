import { NextRequest } from "next/server";
import { connection } from "next/server";
import { voteBroadcaster } from "@/lib/broadcaster";

const isServerlessRuntime = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
);

export async function GET(req: NextRequest) {
  await connection();

  const encoder = new TextEncoder();

  // On Vercel Free (Serverless), long-lived SSE streams hold open Lambda instances,
  // consume Function Duration GB-hours, and cannot share in-memory emitters across isolates.
  // Handshake cleanly in <2ms so the client switches to smart Edge-cached SWR sync!
  if (isServerlessRuntime) {
    const body = encoder.encode(
      `data: ${JSON.stringify({
        type: "SERVERLESS_SYNC",
        pollIntervalMs: 10000,
        timestamp: new Date().toISOString(),
      })}\n\n`
    );

    return new Response(body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  }

  let unsubscribe: (() => void) | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const sendEvent = (data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          cleanup();
        }
      };

      const cleanup = () => {
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }
        try {
          controller.close();
        } catch {
          // Stream already closed
        }
      };

      sendEvent({
        type: "CONNECTED",
        timestamp: new Date().toISOString(),
      });

      unsubscribe = voteBroadcaster.subscribe((payload) => {
        sendEvent(payload);
      });

      heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive ${Date.now()}\n\n`));
        } catch {
          cleanup();
        }
      }, 15000);

      req.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
