import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

export default function HostGuard() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) console.error("HOST SESSION CHECK FAILED", error);
      setSession(data.session);
      setChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setChecking(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (checking) {
    return <main className="host-auth-loading"><span className="host-spinner" />Checking your session…</main>;
  }

  if (!session) return <Navigate to="/host/login" replace />;
  return <Outlet />;
}
