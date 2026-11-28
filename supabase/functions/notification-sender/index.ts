import webpush from "web-push";
import { handleNotifications } from "./handler.ts";

const url = Deno.env.get("SUPABASE_URL");
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const secret = Deno.env.get("NOTIFICATION_SENDER_SECRET");
const publicKey = Deno.env.get("VAPID_PUBLIC_KEY");
const privateKey = Deno.env.get("VAPID_PRIVATE_KEY");
const subject = Deno.env.get("VAPID_SUBJECT");
if (!url || !key || !secret || !publicKey || !privateKey || !subject)
  throw new Error("Notification sender is not configured.");

webpush.setVapidDetails(subject, publicKey, privateKey);

Deno.serve((request) => handleNotifications(request, secret, async (name, args) => {
  const result = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  if (!result.ok) throw new Error("Notification database operation failed.");
  return result.json();
}, async (delivery) => {
  await webpush.sendNotification({
    endpoint: delivery.endpoint,
    keys: { p256dh: delivery.p256dh, auth: delivery.auth },
  }, JSON.stringify({
    title: delivery.title,
    body: delivery.body,
    joinCode: delivery.join_code,
  }), { TTL: 3600 });
}));
