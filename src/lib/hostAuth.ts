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
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: name } },
  });
}
export function readHostIdentity() {
  return supabase.auth.getUser();
}
export function signOutHost() {
  return supabase.auth.signOut();
}
