import type { User } from "@supabase/supabase-js";
import { runApi } from "../../lib/apiResult";
import { useEffect, useState } from "react";
import { readHostIdentity } from "../../lib/hostAuth";

export function useHostIdentity() {
  const [hostPlayerName, setHostPlayerName] = useState("Host");

  const [hostDisplayName, setHostDisplayName] = useState("Host");
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    void runApi<{ user: User | null }>(readHostIdentity).then(
      ({ data, error }) => {
        if (!alive) return;
        if (error || !data?.user) {
          setError("Couldn't verify the host account. Reload this page.");
          return;
        }
        setUserId(data.user.id);
        const name = String(
          data?.user?.user_metadata?.display_name ??
            data?.user?.email?.split("@")[0] ??
            "Host",
        );
        setHostDisplayName(name);
        setHostPlayerName(name);
      },
    );
    return () => {
      alive = false;
    };
  }, []);
  return { hostPlayerName, hostDisplayName, userId, error, setError };
}
