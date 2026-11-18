import { useEffect, useState } from "react";
import { supabase } from "../../lib/sessionSupabase";

export function useHostIdentity() {
  const [hostPlayerName, setHostPlayerName] = useState("Host");

  const [hostDisplayName, setHostDisplayName] = useState("Host");

  useEffect(() => {
    let alive = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!alive) return;
      const name = String(
        data.user?.user_metadata?.display_name ??
          data.user?.email?.split("@")[0] ??
          "Host",
      );
      setHostDisplayName(name);
      setHostPlayerName(name);
    });
    return () => {
      alive = false;
    };
  }, []);
  return { hostPlayerName, hostDisplayName };
}
