import type { FormEvent } from "react";
export type AuthMode = "login" | "signup";
export interface HostAccessState {
  mode: AuthMode;
  name: string;
  email: string;
  password: string;
  busy: boolean;
  error: string;
  notice: string;
  setName: (value: string) => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  submit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  changeMode: (mode: AuthMode) => void;
}
