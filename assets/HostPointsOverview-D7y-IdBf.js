var e=`import HostReviewSection from "./HostReviewSection";

interface Props {
  mainPoints: number;
  sidePoints: number;
  secretPoints: number;
  teams: { id: string; name: string; score: number }[];
  players: { id: string; name: string; score: number }[];
  challenges: PointsChallenge[];
}

export interface PointsChallenge {
  id: string;
  title: string;
  kind: "main" | "side" | "secret";
  entries: { id: string; name: string; points: number; votes?: number }[];
}

export default function HostPointsOverview({
  mainPoints,
  sidePoints,
  secretPoints,
  teams,
  players,
  challenges,
}: Props) {
  return (
    <HostReviewSection
      title="Points overview"
      icon="trophy"
      count={\`\${mainPoints + sidePoints + secretPoints} pts\`}
    >
      <dl className="host-points-overview__sources">
        <div>
          <dt>Main</dt>
          <dd>{mainPoints}</dd>
        </div>
        <div>
          <dt>Side</dt>
          <dd>{sidePoints}</dd>
        </div>
        <div>
          <dt>Secret</dt>
          <dd>{secretPoints}</dd>
        </div>
      </dl>
      {challenges.length > 0 && (
        <section aria-label="Points by challenge">
          <h3 className="host-points-overview__heading">Points by challenge</h3>
          <ul className="host-points-overview__challenges">
            {challenges.map((challenge) => (
              <li key={challenge.id}>
                <strong>
                  {challenge.title}
                  <small> · {challenge.kind}</small>
                </strong>
                <ul className="host-points-overview__entries">
                  {challenge.entries.map((entry) => (
                    <li key={entry.id} className="host-points-overview__entry">
                      <span>{entry.name}</span>
                      <span>
                        {entry.votes !== undefined &&
                          \`\${entry.votes} vote\${entry.votes === 1 ? "" : "s"} · \`}
                        <strong>{entry.points} pts</strong>
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}
      {teams.length > 0 && (
        <section aria-label="Team totals">
          <h3 className="host-points-overview__heading">Team totals</h3>
          <ol className="host-points-overview__list">
            {teams.map((team) => (
              <li key={team.id}>
                <span>{team.name}</span>
                <strong>{team.score}</strong>
              </li>
            ))}
          </ol>
        </section>
      )}
      <section aria-label="Player totals">
        <h3 className="host-points-overview__heading">Player totals</h3>
        <ol className="host-points-overview__list">
          {players.map((player) => (
            <li key={player.id}>
              <span>{player.name}</span>
              <strong>{player.score}</strong>
            </li>
          ))}
        </ol>
      </section>
    </HostReviewSection>
  );
}
`;export{e as default};