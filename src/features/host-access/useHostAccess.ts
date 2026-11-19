import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { readHostSession, registerHost, signInHost } from "../../lib/hostAuth";
import type { AuthMode } from "./types";
export function useHostAccess() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let alive = true;
    void readHostSession().then(({ data }) => {
      if (alive && data.session) navigate("/host", { replace: true });
    });
    return () => {
      alive = false;
    };
  }, [navigate]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    if (mode === "signup") {
      const { data, error: signUpError } = await registerHost({
        email: email.trim(),
        password,
        name: name.trim(),
      });

      setBusy(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (data.session) {
        navigate("/host", { replace: true });
      } else {
        setNotice(
          "Account created. Check your email to confirm your address, then come back here to log in.",
        );
      }
      return;
    }

    const { error: signInError } = await signInHost({
      email: email.trim(),
      password,
    });

    setBusy(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    navigate("/host", { replace: true });
  }
  function changeMode(next: AuthMode) {
    setMode(next);
    setError("");
    setNotice("");
  }
  return {
    mode,
    name,
    email,
    password,
    busy,
    error,
    notice,
    setName,
    setEmail,
    setPassword,
    submit,
    changeMode,
  };
}
