import { supabase } from "./supabase";
export function readHostSession() {
  return supabase.auth.getSession();
}
export function signInHost({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  return supabase.auth.signInWithPassword({ email, password });
}
export function registerHost({
  email,
  password,
  name,
}: {
  email: string;
  password: string;
  name: string;
}) {
  const confirmationUrl = new URL(
    import.meta.env.BASE_URL,
    window.location.origin,
  );
  confirmationUrl.searchParams.set("host_confirmation", "1");
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: name },
      emailRedirectTo: confirmationUrl.href,
    },
  });
}
export function readHostIdentity() {
  return supabase.auth.getUser();
}
export function signOutHost() {
  return supabase.auth.signOut();
}
