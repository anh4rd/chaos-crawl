import { expect, it, vi } from "vitest";
import { handleNotifications } from "../../supabase/functions/notification-sender/handler";

const delivery = {
  id: "delivery",
  lease: "lease",
  endpoint: "https://fcm.googleapis.com/fcm/send/device",
  p256dh: "key",
  auth: "auth",
  title: "Chaos Crawl",
  body: "Game update",
  join_code: "123456",
};

function request(secret: string) {
  return new Request("https://example.test", {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
  });
}

it("rejects unauthorized queue processing", async () => {
  const rpc = vi.fn();
  const response = await handleNotifications(
    request("wrong"),
    "secret",
    rpc,
    vi.fn(),
  );
  expect(response.status).toBe(401);
  expect(rpc).not.toHaveBeenCalled();
});

it.each([
  ["sent", null],
  ["expired", { statusCode: 410 }],
  ["retry", { statusCode: 503 }],
])("records the %s delivery outcome", async (outcome, failure) => {
  const rpc = vi
    .fn()
    .mockImplementation((name: string) =>
      Promise.resolve(name === "cc_claim_push_deliveries" ? [delivery] : null),
    );
  const send = vi
    .fn()
    .mockImplementation(() =>
      failure ? Promise.reject(failure) : Promise.resolve(),
    );
  const response = await handleNotifications(
    request("secret"),
    "secret",
    rpc,
    send,
  );
  expect(response.status).toBe(200);
  expect(rpc).toHaveBeenCalledWith("cc_finish_push_delivery", {
    p_id: "delivery",
    p_lease: "lease",
    p_outcome: outcome,
  });
});

it("continues sending other deliveries when one push fails", async () => {
  const second = { ...delivery, id: "second", lease: "second-lease" };
  const rpc = vi
    .fn()
    .mockImplementation((name: string) =>
      Promise.resolve(
        name === "cc_claim_push_deliveries" ? [delivery, second] : null,
      ),
    );
  const send = vi
    .fn()
    .mockImplementation((item: typeof delivery) =>
      item.id === delivery.id
        ? Promise.reject({ statusCode: 503 })
        : Promise.resolve(),
    );
  const response = await handleNotifications(
    request("secret"),
    "secret",
    rpc,
    send,
  );
  expect(response.status).toBe(200);
  expect(send).toHaveBeenCalledTimes(2);
  expect(rpc).toHaveBeenCalledWith("cc_finish_push_delivery", {
    p_id: "delivery",
    p_lease: "lease",
    p_outcome: "retry",
  });
  expect(rpc).toHaveBeenCalledWith("cc_finish_push_delivery", {
    p_id: "second",
    p_lease: "second-lease",
    p_outcome: "sent",
  });
});
