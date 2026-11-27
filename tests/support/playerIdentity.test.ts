// @vitest-environment node
import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { handleIdentity } from "../../supabase/functions/player-identity/handler";

const handle = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const secret = Buffer.alloc(32, 7).toString("base64url");
const credential = `${handle}.${secret}`;
const digest = createHash("sha256")
  .update("chaos-crawl:player-recovery:v1\0")
  .update(Buffer.alloc(32, 7))
  .digest("hex");

function request(body: unknown) {
  return new Request("https://example.invalid", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("player identity handler", () => {
  it("allows the Supabase client headers in the browser preflight", async () => {
    const rpc = vi.fn();
    const result = await handleIdentity(
      new Request("https://example.invalid", {
        method: "OPTIONS",
        headers: {
          origin: "https://example.com",
          "access-control-request-method": "POST",
          "access-control-request-headers":
            "authorization,apikey,content-type,x-client-info",
        },
      }),
      rpc,
    );
    expect(result.status).toBe(204);
    expect(result.headers.get("access-control-allow-origin")).toBe("*");
    const allowed = result.headers
      .get("access-control-allow-headers")
      ?.toLowerCase()
      .split(",")
      .map((header) => header.trim());
    expect(allowed).toEqual(
      expect.arrayContaining([
        "authorization",
        "apikey",
        "content-type",
        "x-client-info",
      ]),
    );
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rate-limits phone recovery with a normalized per-game bucket", async () => {
    const rpc = vi.fn(async (name: string, _args: Record<string, unknown>) => {
      if (name === "cc_player_identity_rate_limit") return true;
      return {
        player_token: "new",
        join_code: "123456",
        player_name: "Pat",
        resumed: true,
      };
    });
    const base = { action: "recover_phone", join_code: "123456" };
    const first = await handleIdentity(
      request({ ...base, mobile: "+44 7123 456789" }),
      rpc,
    );
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({
      player_token: "new",
      join_code: "123456",
      player_name: "Pat",
      resumed: true,
    });
    expect(rpc).toHaveBeenCalledWith("cc_recover_player_with_phone", {
      p_join_code: "123456",
      p_mobile: "07123456789",
    });
    const firstHandle = rpc.mock.calls[0][1].p_handle;
    rpc.mockClear();
    await handleIdentity(request({ ...base, mobile: "07123456789" }), rpc);
    expect(rpc.mock.calls[0][1].p_handle).toBe(firstHandle);
    expect(firstHandle).not.toContain("07123456789");
  });

  it("rejects malformed or rate-limited phone recovery before issuing a token", async () => {
    const rpc = vi.fn(async () => false);
    const base = { action: "recover_phone", join_code: "123456" };
    expect(
      (await handleIdentity(request({ ...base, mobile: "123" }), rpc)).status,
    ).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
    expect(
      (await handleIdentity(request({ ...base, mobile: "07123456789" }), rpc))
        .status,
    ).toBe(429);
    expect(rpc).not.toHaveBeenCalledWith(
      "cc_recover_player_with_phone",
      expect.anything(),
    );
  });

  it("creates a player using a domain-separated digest, not a plaintext secret", async () => {
    const rpc = vi.fn(async (name: string) => {
      if (name === "cc_player_identity_rate_limit") return true;
      if (name === "cc_player_recovery_candidate") return null;
      return {
        player_token: "token",
        join_code: "123456",
        player_name: "Pat",
        resumed: false,
      };
    });
    const result = await handleIdentity(
      request({
        action: "register",
        join_code: "123456",
        credential,
        name: "Pat",
        mobile: "07123456789",
      }),
      rpc,
    );
    expect(result.status).toBe(200);
    expect(await result.json()).toMatchObject({
      recovery_credential: credential,
    });
    expect(rpc.mock.calls[2][1]).toMatchObject({
      p_digest: digest,
      p_handle: handle,
    });
    expect(JSON.stringify(rpc.mock.calls)).not.toContain(secret);
  });

  it("accepts an empty phone for a new player but rejects invalid nonempty numbers", async () => {
    const rpc = vi.fn(async (name: string) => {
      if (name === "cc_player_identity_rate_limit") return true;
      if (name === "cc_player_recovery_candidate") return null;
      return {
        player_token: "token",
        join_code: "123456",
        player_name: "Pat",
        resumed: false,
      };
    });
    const body = {
      action: "register",
      join_code: "123456",
      credential,
      name: "Pat",
      mobile: "",
    };
    expect((await handleIdentity(request(body), rpc)).status).toBe(200);
    expect(rpc).toHaveBeenCalledWith(
      "cc_register_player_with_recovery",
      expect.objectContaining({ p_mobile: "" }),
    );
    rpc.mockClear();
    expect(
      (await handleIdentity(request({ ...body, mobile: "abc" }), rpc)).status,
    ).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("recovers with the correct credential and rejects another secret", async () => {
    const rpc = vi.fn(async (name: string) => {
      if (name === "cc_player_identity_rate_limit") return true;
      if (name === "cc_player_recovery_candidate")
        return { digest, revision: 1, player_token: "old", player_name: "Pat" };
      return {
        player_token: "new",
        join_code: "123456",
        player_name: "Pat",
        resumed: true,
      };
    });
    const body = { action: "recover", join_code: "123456", credential };
    expect((await handleIdentity(request(body), rpc)).status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("cc_recover_player_with_credential", {
      p_join_code: "123456",
      p_handle: handle,
      p_revision: 1,
      p_expected_token: "old",
    });
    rpc.mockClear();
    expect(
      (
        await handleIdentity(
          request({
            ...body,
            credential: `${handle}.${Buffer.alloc(32, 8).toString("base64url")}`,
          }),
          rpc,
        )
      ).status,
    ).toBe(400);
    expect(rpc).not.toHaveBeenCalledWith(
      "cc_recover_player_with_credential",
      expect.anything(),
    );
  });

  it("retries an interrupted registration without generating a new player", async () => {
    const rpc = vi.fn(async (name: string) => {
      if (name === "cc_player_identity_rate_limit") return true;
      if (name === "cc_player_recovery_candidate")
        return {
          digest,
          revision: 0,
          player_token: "existing",
          player_name: "Pat",
        };
      return { player_token: "existing", player_name: "Pat" };
    });
    const result = await handleIdentity(
      request({
        action: "register",
        join_code: "123456",
        credential,
        name: "Pat",
        mobile: "07123456789",
      }),
      rpc,
    );
    expect(await result.json()).toMatchObject({ player_token: "existing" });
    expect(rpc).not.toHaveBeenCalledWith(
      "cc_register_player_with_recovery",
      expect.anything(),
    );
    expect(rpc).toHaveBeenCalledWith("cc_retry_player_registration", {
      p_join_code: "123456",
      p_handle: handle,
      p_revision: 0,
      p_expected_token: "existing",
    });
  });

  it("enforces rate limits and rejects malformed credentials before database access", async () => {
    const rpc = vi.fn(async () => false);
    expect(
      (
        await handleIdentity(
          request({ action: "recover", join_code: "123456", credential }),
          rpc,
        )
      ).status,
    ).toBe(429);
    rpc.mockClear();
    expect(
      (
        await handleIdentity(
          request({
            action: "recover",
            join_code: "123456",
            credential: "bad",
          }),
          rpc,
        )
      ).status,
    ).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
});
