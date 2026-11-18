import type { User } from "@supabase/supabase-js";
import { runApi } from "../../lib/apiResult";
import { useEffect, useState } from "react";
import { readHostIdentity } from "../../lib/hostAuth";

export function useHostIdentity() {
  const [hostPlayerName, setHostPlayerName] = useState("Host");

  const [hostDisplayName, setHostDisplayName] = useState("Host");

  useEffect(() => {
    let alive = true;
    void runApi<{ user: User | null }>(readHostIdentity).then(({ data }) => {
      if (!alive) return;
      const name = String(
        data?.user?.user_metadata?.display_name ??
          data?.user?.email?.split("@")[0] ??
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
