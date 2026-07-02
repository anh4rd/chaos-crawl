import Card from "../components/ui/Card";

const teams = [
  {
    name: "🍍 Pineapples",
    score: 42,
  },
  {
    name: "🦆 Ducks",
    score: 38,
  },
  {
    name: "🍺 Beer Mats",
    score: 31,
  },
];

export default function Leaderboard() {
  return (
    <main className="mx-auto max-w-md p-6">

      <h1 className="mb-6 text-4xl font-bold">

        Leaderboard

      </h1>

      <div className="space-y-4">

        {teams.map((team) => (

          <Card key={team.name}>

            <div className="flex justify-between">

              <span>

                {team.name}

              </span>

              <strong>

                {team.score}

              </strong>

            </div>

          </Card>

        ))}

      </div>

    </main>
  );
}