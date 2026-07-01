import { useState } from "react";

import Container from "../components/ui/Container";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import TeamCard from "../components/ui/TeamCard";

export default function Join() {
  const [team, setTeam] = useState("");

  return (
    <Container>
      <div className="space-y-8">

        <div>
          <h1 className="text-4xl font-bold">
            Join Tonight's Game
          </h1>

          <p className="mt-2 text-zinc-400">
            Pick a team and get ready.
          </p>
        </div>

        <Card>

          <div className="space-y-6">

            <Input placeholder="Your name" />

            <div className="space-y-4">

              <TeamCard
                emoji="🍍"
                name="Pineapples"
                selected={team==="pineapple"}
                onClick={()=>setTeam("pineapple")}
              />

              <TeamCard
                emoji="🦆"
                name="Ducks"
                selected={team==="ducks"}
                onClick={()=>setTeam("ducks")}
              />

              <TeamCard
                emoji="🍺"
                name="Beer Mats"
                selected={team==="beer"}
                onClick={()=>setTeam("beer")}
              />

            </div>

            <Button>

              Join Game

            </Button>

          </div>

        </Card>

      </div>
    </Container>
  );
}