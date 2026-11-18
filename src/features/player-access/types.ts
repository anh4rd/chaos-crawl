import type { FormEvent } from "react";

export type JoinMode = "join" | "rejoin";
export type JoinStep = 1 | 2;

export interface PlayerAccessModel {
  mode: JoinMode;
  code: string;
  name: string;
  mobile: string;
  joinStep: JoinStep;
  busy: boolean;
  error: string;
  notice: string;
  canSubmit: boolean;
  onCodeChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onMobileChange: (value: string) => void;
  onBack: () => void;
  onToggleMode: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}
