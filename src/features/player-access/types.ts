import type { FormEvent } from "react";

export type JoinMode = "join" | "rejoin";
export type JoinStep = 1 | 2;
export type RecoveryMethod = "phone" | "credential";

export interface PlayerAccessModel {
  mode: JoinMode;
  recoveryMethod: RecoveryMethod;
  code: string;
  name: string;
  mobile: string;
  countryCode: string;
  customCountryCode: string;
  credential: string;
  joinStep: JoinStep;
  busy: boolean;
  error: string;
  notice: string;
  canSubmit: boolean;
  onCodeChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onMobileChange: (value: string) => void;
  onCountryCodeChange: (value: string) => void;
  onCustomCountryCodeChange: (value: string) => void;
  onCredentialChange: (value: string) => void;
  onBack: () => void;
  onToggleMode: () => void;
  onToggleRecoveryMethod: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}
