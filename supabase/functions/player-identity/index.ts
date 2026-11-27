import { handleIdentity } from "./handler.ts";

const url = Deno.env.get("SUPABASE_URL");
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!url || !key) throw new Error("Player identity service is not configured.");

Deno.serve((request) =>
  handleIdentity(request, async (name, args) => {
    const result = await fetch(`${url}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
    });
    if (!result.ok) throw new Error("Player identity database operation failed.");
    return result.json();
  }),
);
