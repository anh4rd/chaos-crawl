import { useState } from "react";
import Container from "../components/ui/Container";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import TeamCard from "../components/ui/TeamCard";
import { teams } from "../lib/demoData";
import { createPlayer } from "../lib/playerApi";

export default function Join() {
  const [playerName, setPlayerName] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!playerName.trim() ){
        alert("Please enter your name.");
        return;
        }
    if (!selectedTeam) {
        alert("Please select a team.");
        return;
    }
    const result = await createPlayer(
    playerName,
    selectedTeam
  );

  console.log("CREATE PLAYER RESULT", result);

  if (result.error) {
    console.error(result.error);
    alert(result.error.message);
    return;
  }

  alert("Let's fckn go!");

  window.location.href = "/game";
};

  return (
    <Container>
      <div className="space-y-8">
        <div>
          <div className="text-center">
            <div className="text-6xl">🎉</div>

            <h1 className="mt-4 text-4xl font-black">
              Anna's Chaos Crawl
            </h1>

            <p className="mt-2 text-zinc-400">
              Complete ridiculous challenges across London.
            </p>
          </div>

          <p className="mt-2 text-zinc-400">Pick a team and get ready.</p>
        </div>

        <Card>
          <div className="space-y-6">
            <Input
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              placeholder="Your name"
            />

            <div className="space-y-4">
              {teams.map((team) => (
                <TeamCard
                  key={team.id}
                  emoji={team.emoji}
                  name={team.name}
                  colour={team.colour}
                  selected={selectedTeam === team.id}
                  onClick={() => setSelectedTeam(team.id)}
                />
              ))}
            </div>

            <Button type="button" onClick={handleJoin}>
              Join Game
            </Button>
          </div>
        </Card>
      </div>
    </Container>
  );
}
