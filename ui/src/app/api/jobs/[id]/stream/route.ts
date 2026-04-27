import { getJobStore } from "@/lib/jobs/store";

export const dynamic = "force-dynamic";

/**
 * Server-Sent Events stream of a job's log + status.
 *
 * Events:
 *   event: log    data: { t, stream, text }
 *   event: status data: { status, exitCode, endedAt }
 *
 * The client opens an EventSource and reads either kind.
 */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const store = getJobStore();
  await store.ensureBooted();
  const job = store.get(id);
  if (!job) return new Response("not found", { status: 404 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          closed = true;
        }
      };

      // 1. Replay everything we already have so the client is fully caught up.
      for (const line of job.log) send("log", line);
      send("status", {
        status: job.status,
        exitCode: job.exitCode ?? null,
        endedAt: job.endedAt ?? null,
      });

      if (job.status !== "running" && job.status !== "queued") {
        // Nothing more will come — close cleanly.
        send("done", {});
        controller.close();
        return;
      }

      // 2. Subscribe for live events.
      const unsubscribe = store.subscribe(id, (event) => {
        if (event.type === "log") {
          send("log", event.line);
        } else {
          send("status", {
            status: event.job.status,
            exitCode: event.job.exitCode ?? null,
            endedAt: event.job.endedAt ?? null,
          });
          if (
            event.job.status !== "running" &&
            event.job.status !== "queued"
          ) {
            send("done", {});
            unsubscribe();
            try { controller.close(); } catch { /* already closed */ }
            closed = true;
          }
        }
      });

      // 3. Keep-alive ping so proxies don't drop us.
      const keepalive = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        } catch {
          closed = true;
        }
      }, 20_000);

      // 4. Cleanup if the client disconnects.
      const cleanup = () => {
        closed = true;
        clearInterval(keepalive);
        unsubscribe();
      };
      // Note: the runtime calls cancel() on the stream when the client goes away.
      this.cancel = cleanup;
    },
    cancel() { /* set in start() */ },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
