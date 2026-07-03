import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

import { supabase } from "../lib/supabase";
import { setPlayerId } from "../lib/playerSession";

export default function Join() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [joining, setJoining] =
    useState(false);

  async function handleJoin() {
    const cleanName = name.trim();

    if (!cleanName) {
      alert("Enter your name first.");
      return;
    }

    setJoining(true);

    const { data, error } = await supabase
      .from("players")
      .insert({
        name: cleanName,
        team: null,
        score: 0,
      })
      .select()
      .single();

    setJoining(false);

    if (error) {
      console.error("JOIN ERROR", error);
      alert(`Join failed: ${error.message}`);
      return;
    }

    setPlayerId(data.id);
    navigate("/game");
  }

  return (
    <main className="mx-auto min-h-screen max-w-md space-y-6 p-6">
      <header>
        <img
          src={`${import.meta.env.BASE_URL}Title.png`}
          alt="Anna's Chaos Crawl"
          className="mx-auto mb-4 w-full"
        />
      </header>

      <Card>
        <h1 className="mb-4 text-3xl font-bold">
          Join the Chaos
        </h1>

        <Input
          placeholder="Your name..."
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
        />

        <div className="mt-4">
          <Button
            type="button"
            disabled={joining}
            onClick={handleJoin}
          >
            {joining
              ? "Joining..."
              : "Join Game"}
          </Button>
        </div>
      </Card>
    </main>
  );
}