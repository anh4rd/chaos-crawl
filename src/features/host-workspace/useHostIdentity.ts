import type { User } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { readHostIdentity, signOutHost } from "../../lib/hostAuth";
import { runApi } from "../../lib/apiResult";
import type { HostPreviewUser } from "../../components/host/types";
export function useHostIdentity(previewUser?: HostPreviewUser) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const lifetime = useRef(0);
  const pending = useRef(false);
  const [identityError, setIdentityError] = useState("");
  const [actionError, setActionError] = useState("");
  useEffect(() => {
    const request = ++lifetime.current;
    void runApi<{ user: User | null }>(readHostIdentity).then(
      ({ data, error }) => {
        if (request !== lifetime.current) return;
        if (error)
          setIdentityError(
            "Couldn't load your host identity. Refresh to try again.",
          );
        else setUser(data?.user ?? null);
      },
    );
    return () => {
      lifetime.current += 1;
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
    if (pending.current) return;
    pending.current = true;
    const request = lifetime.current;
    setActionError("");
    try {
      const result = await runApi(async () => ({
        data: null,
        ...(await signOutHost()),
      }));
      if (request !== lifetime.current) return;
      if (result.error) {
        setActionError(
          `Couldn't sign out: ${result.error.message}. Please try again.`,
        );
        return;
      }
      navigate("/host/login", { replace: true });
    } finally {
      pending.current = false;
    }
  }
  return {
    error: actionError || identityError,
    dismissError: () => {
      setActionError("");
      setIdentityError("");
    },
    displayName,
    homeHref,
    signOut,
    createGame: () => navigate("/host/games/new"),
  };
}
