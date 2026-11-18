import { useState } from "react";
import LegacyJoinView from "../legacy-player/LegacyJoinView";
import BallotView from "../voting/BallotView";
import VoteResultsView from "../voting/VoteResultsView";
import Note from "../../components/ui/Note";
import { Example } from "./Example";

const players = [{ id: "local-player", name: "Pat", team: "Ducks", score: 0 }];

export default function LegacyPlayerExample() {
  const [name, setName] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [selection, setSelection] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState<boolean | null>(false);
  const [voteError, setVoteError] = useState<Error | null>(null);
  return (
    <Example
      title="Local legacy player screens"
      source="src/features/legacy-player/LegacyJoinView.tsx + src/features/voting/BallotView.tsx + VoteResultsView.tsx"
      code={
        '<LegacyJoinView contentAs="div" {...controlledJoin} />\n<BallotView contentAs="div" {...controlledBallot} />\n<VoteResultsView contentAs="div" challenge="Best entrance" results={localResults} />'
      }
    >
      <LegacyJoinView
        contentAs="div"
        name={name}
        joining={false}
        locked={false}
        error={joinError}
        onNameChange={setName}
        onSubmit={(event) => {
          event.preventDefault();
          setJoinError(name.trim() ? null : "Enter your name first.");
          if (name.trim())
            setNotice(`${name.trim()} joined this local preview.`);
        }}
      />
      <BallotView
        contentAs="div"
        challenge="Best entrance"
        target="player"
        players={players}
        teams={[]}
        fromAdmin={false}
        selection={selection}
        setSelection={setSelection}
        onRejoin={() => setNotice("Local rejoin selected.")}
        onBack={() => setNotice("Local host selected.")}
        ballot={{
          sessionInvalid: false,
          hasVoted,
          submitting: false,
          error: voteError,
          cast: async (choice) => {
            if (!choice) {
              setVoteError(new Error("Choose someone first."));
              return;
            }
            setVoteError(null);
            setHasVoted(true);
          },
          reload: async () => {
            setHasVoted(false);
            setVoteError(null);
          },
        }}
      />
      <VoteResultsView
        contentAs="div"
        challenge="Best entrance"
        results={[{ id: "local-player", name: "Pat", votes: 1 }]}
      />
      <Note role="status">
        {notice || "All names, votes and actions stay in this preview."}
      </Note>
    </Example>
  );
}
