import { timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";

type Delivery = {
  id: string;
  lease: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  title: string;
  body: string;
  join_code: string;
};

type Send = (delivery: Delivery) => Promise<void>;
type Rpc = (name: string, args: Record<string, unknown>) => Promise<unknown>;

function isDelivery(value: unknown): value is Delivery {
  if (!value || typeof value !== "object") return false;
  const entry: Record<string, unknown> = Object.fromEntries(Object.entries(value));
  return ["id", "lease", "endpoint", "p256dh", "auth", "title", "body", "join_code"]
    .every((key) => typeof entry[key] === "string") &&
    typeof entry.join_code === "string" && /^\d{6}$/.test(entry.join_code);
}

function isAuthorized(request: Request, secret: string) {
  const supplied = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export async function handleNotifications(request: Request, secret: string, rpc: Rpc, send: Send) {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!secret || !isAuthorized(request, secret))
    return new Response("Unauthorized", { status: 401 });
  try {
    const deliveries = await rpc("cc_claim_push_deliveries", {});
    if (!Array.isArray(deliveries) || !deliveries.every(isDelivery))
      throw new Error("Invalid notification queue response.");
    await Promise.all(deliveries.map(async (delivery) => {
      let outcome = "sent";
      try {
        await send(delivery);
      } catch (error) {
        const status = error && typeof error === "object" && "statusCode" in error
          ? error.statusCode : null;
        outcome = status === 404 || status === 410 ? "expired" : "retry";
        if (outcome === "retry") console.error("Push delivery failed; it will be retried.");
      }
      await rpc("cc_finish_push_delivery", {
        p_id: delivery.id, p_lease: delivery.lease, p_outcome: outcome,
      });
    }));
    return new Response(JSON.stringify({ processed: deliveries.length }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Notification queue processing failed.", error);
    return new Response("Notification queue processing failed.", { status: 503 });
  }
}
