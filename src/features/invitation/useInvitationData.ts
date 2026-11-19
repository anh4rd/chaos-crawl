import { useEffect, useState } from "react";
import { supabase } from "../../lib/sessionSupabase";
import type { InviteData } from "./types";

export function useInvitationData(joinCode: string) {
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void supabase
      .rpc("cc_get_public_game_invite", {
        p_join_code: joinCode.replace(/\D/g, "").slice(0, 6),
      })
      .then(({ data, error: rpcError }) => {
        if (!active) return;
        if (rpcError) setError(rpcError.message);
        else if (!data)
          setError(
            "This invitation couldn't be found. Ask your host for a fresh link.",
          );
        else if (!(data as InviteData).enabled)
          setError("This host hasn't opened pre-game invitations yet.");
        else setInvite(data as InviteData);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [joinCode]);

  return { invite, loading, error };
}
