import { useEffect, useState, type ChangeEvent } from "react";
import Container from "../components/ui/Container";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import TeamCard from "../components/ui/TeamCard";
import { teams } from "../lib/demoData";
import { createPlayer } from "../lib/playerApi";
import { savePlayerId, getPlayerId } from "../lib/playerSession";

export default function Join() {
  useEffect(() => {
  if (getPlayerId()) {
    window.location.href = "/game";
  }
}, []);

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

  if (result.error) {
    alert(result.error.message);
    return;
  }
  savePlayerId(result.data.id);
  window.location.href = "/game";
  alert("Let's fckn go!");

  window.location.href = "/game";
};

  return (
    <Container>
      <div className="space-y-8">
        <div>
          <div>
            <img
              src={`${import.meta.env.BASE_URL}Title.png`}
              alt="Anna's Chaos Crawl"
              className="mx-auto mb-4 h-32 w-32"
            />

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
              onChange={(event: ChangeEvent<HTMLInputElement>) => setPlayerName(event.target.value)}
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
