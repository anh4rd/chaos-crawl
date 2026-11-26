var e=`import type { FormEventHandler, ReactNode } from "react";

export default function TeamNameForm({
  teamName,
  setTeamName,
  placeholder,
  variant = "lobby",
  onSubmit,
  children,
}: {
  teamName: string;
  setTeamName: (name: string) => void;
  placeholder: string;
  variant?: "lobby" | "participant";
  onSubmit: FormEventHandler<HTMLFormElement>;
  children: ReactNode;
}) {
  return (
    <form
      className={\`team-name-form team-name-form--\${variant}\`}
      onSubmit={onSubmit}
    >
      <input
        aria-label="New team name"
        value={teamName}
        onChange={(event) => setTeamName(event.target.value)}
        placeholder={placeholder}
        maxLength={40}
      />
      {children}
    </form>
  );
}
`;export{e as default};