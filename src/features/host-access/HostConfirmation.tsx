import { useEffect, useState } from "react";
import PageFrame from "../../components/ui/PageFrame";
import { supabase } from "../../lib/supabase";

export default function HostConfirmation() {
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function confirm() {
      try {
        const { error: initializationError } = await supabase.auth.initialize();
        if (initializationError) throw initializationError;
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!data.session)
          throw new Error(
            "No sign-in session was returned. If you have confirmed your email, log in to continue.",
          );
        if (active)
          window.location.replace(`${import.meta.env.BASE_URL}#/host`);
      } catch (reason) {
        if (!active) return;
        window.history.replaceState(
          window.history.state,
          "",
          `${window.location.pathname}${window.location.search}`,
        );
        setError(
          reason instanceof Error
            ? reason.message
            : "Email confirmation failed.",
        );
      }
    }
    void confirm();
    return () => {
      active = false;
    };
  }, []);

  return (
    <PageFrame variant="compact">
      <h1>Email confirmation</h1>
      {error ? (
        <>
          <p role="alert">{error}</p>
          <p>If the link has expired, request a new confirmation email.</p>
          <a href={`${import.meta.env.BASE_URL}#/host/login`}>
            Go to host login
          </a>
        </>
      ) : (
        <output>Confirming your account...</output>
      )}
    </PageFrame>
  );
}
