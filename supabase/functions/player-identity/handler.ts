import { createHash, timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";

type Rpc = (name: string, args: Record<string, unknown>) => Promise<unknown>;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

function response(status: number, body: object) {
  return new Response(JSON.stringify(body), { status, headers });
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseCredential(value: unknown) {
  if (typeof value !== "string" || value.length > 100) return null;
  const parts = value.split(".");
  if (
    parts.length !== 2 ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(parts[0]) ||
    !/^[A-Za-z0-9_-]{43}$/.test(parts[1])
  ) return null;
  const secret = Buffer.from(parts[1], "base64url");
  if (secret.length !== 32 || secret.toString("base64url") !== parts[1]) return null;
  const digest = createHash("sha256")
    .update("chaos-crawl:player-recovery:v1\0", "utf8")
    .update(secret)
    .digest();
  return { handle: parts[0], digest };
}

function candidateMatches(candidate: unknown, digest: Uint8Array) {
  if (!record(candidate) || typeof candidate.digest !== "string" ||
    !/^[0-9a-f]{64}$/.test(candidate.digest)) return false;
  return timingSafeEqual(Buffer.from(candidate.digest, "hex"), digest);
}

function normalizePhone(mobile: string) {
  let phone = mobile.replace(/\D/g, "");
  if (phone.startsWith("00")) phone = phone.slice(2);
  if (phone.startsWith("44") && phone.length === 13 && phone[2] === "0")
    return `0${phone.slice(3)}`;
  if (phone.startsWith("44") && phone.length === 12)
    return `0${phone.slice(2)}`;
  return phone;
}

function phoneRateHandle(code: string, phone: string) {
  const hash = createHash("sha256")
    .update(`chaos-crawl:temporary-phone-recovery:v1\0${code}\0${phone}`)
    .digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

export async function handleIdentity(request: Request, rpc: Rpc) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return response(405, { error: "Method not allowed." });
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))
    return response(415, { error: "JSON is required." });
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > 4096))
    return response(413, { error: "Request is too large." });
  const reader = request.body?.getReader();
  if (!reader) return response(400, { error: "Invalid request." });
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > 4096) {
      await reader.cancel();
      return response(413, { error: "Request is too large." });
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  let body: unknown;
  try {
    body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return response(400, { error: "Invalid request." });
  }
  if (!record(body) || (body.action !== "register" && body.action !== "recover" &&
    body.action !== "recover_phone") ||
    typeof body.join_code !== "string" || !/^[0-9]{6}$/.test(body.join_code))
    return response(400, { error: "Invalid request." });
  if (body.action === "recover_phone" &&
    (typeof body.mobile !== "string" || body.mobile.length > 40 ||
      body.mobile.replace(/\D/g, "").length < 8 ||
      body.mobile.replace(/\D/g, "").length > 15))
    return response(400, { error: "Invalid request." });
  const credential = body.action === "recover_phone" ? null : parseCredential(body.credential);
  if (body.action !== "recover_phone" && !credential)
    return response(400, { error: "Invalid request." });
  if (body.action === "register" &&
    (typeof body.name !== "string" || body.name.trim().length < 1 ||
      body.name.trim().length > 60 || typeof body.mobile !== "string" ||
      body.mobile.length > 40 || (body.mobile.trim() !== "" &&
        (body.mobile.replace(/\D/g, "").length < 8 ||
          body.mobile.replace(/\D/g, "").length > 15))))
    return response(400, { error: "Invalid request." });

  try {
    if (body.action === "recover_phone") {
      if (typeof body.mobile !== "string") return response(400, { error: "Invalid request." });
      const phone = normalizePhone(body.mobile);
      if (await rpc("cc_player_identity_rate_limit", {
        p_handle: phoneRateHandle(body.join_code, phone),
      }) !== true)
        return response(429, { error: "Please wait before trying again." });
      const result = await rpc("cc_recover_player_with_phone", {
        p_join_code: body.join_code,
        p_mobile: phone,
      });
      if (record(result)) return response(200, result);
      return response(400, { error: "Unable to complete this request. Check your details and try again." });
    }
    if (!credential) return response(400, { error: "Invalid request." });
    if (await rpc("cc_player_identity_rate_limit", { p_handle: credential.handle }) !== true)
      return response(429, { error: "Please wait before trying again." });
    const args = { p_join_code: body.join_code, p_handle: credential.handle };
    const candidate = await rpc("cc_player_recovery_candidate", args);
    if (candidateMatches(candidate, credential.digest) && record(candidate)) {
      if (typeof candidate.revision !== "number" || typeof candidate.player_token !== "string")
        throw new Error("Invalid candidate response");
      if (body.action === "register") {
        const result = await rpc("cc_retry_player_registration", {
          ...args, p_revision: candidate.revision, p_expected_token: candidate.player_token,
        });
        if (record(result)) return response(200, result);
        return response(409, { error: "Your session changed. Please try again." });
      }
      const result = await rpc("cc_recover_player_with_credential", {
        ...args, p_revision: candidate.revision, p_expected_token: candidate.player_token,
      });
      if (record(result)) return response(200, result);
      return response(409, { error: "Your session changed. Please try again." });
    }
    if (candidate !== null || body.action === "recover")
      return response(400, { error: "Unable to complete this request. Check your details and try again." });
    const result = await rpc("cc_register_player_with_recovery", {
      ...args, p_name: body.name, p_mobile: body.mobile,
      p_digest: credential.digest.toString("hex"),
    });
    if (!record(result))
      return response(400, { error: "Unable to complete this request. Check your details and try again." });
    return response(200, { ...result, recovery_credential: body.credential });
  } catch {
    console.error("Player identity service failed.");
    return response(503, { error: "Player access is temporarily unavailable. Please try again." });
  }
}
