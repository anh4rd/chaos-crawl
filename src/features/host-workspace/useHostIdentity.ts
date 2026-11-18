import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { readHostIdentity, signOutHost } from "../../lib/hostAuth";
import type { HostPreviewUser } from "../../components/host/types";
export function useHostIdentity(previewUser?: HostPreviewUser) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    let alive = true;
    void readHostIdentity().then(({ data }) => {
      if (alive) setUser(data.user);
    });
    return () => {
      alive = false;
    };
  }, []);
  const displayName = String(
    previewUser?.displayName ??
      user?.user_metadata?.display_name ??
      user?.email?.split("@")[0] ??
      "Host",
  );
  const homeHref = previewUser
    ? `/host?viewAs=${encodeURIComponent(previewUser.id)}`
    : "/host";
  async function signOut() {
    await signOutHost();
    navigate("/host/login", { replace: true });
  }
  return {
    displayName,
    homeHref,
    signOut,
    createGame: () => navigate("/host/games/new"),
  };
}
