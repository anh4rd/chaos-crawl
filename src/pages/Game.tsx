import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

import { useGameState } from "../hooks/useGameState";
import useSideChallenges from "../hooks/useSideChallenges";
import { usePlayers } from "../game/hooks/usePlayers";

import {
  clearPlayerId,
  getPlayerId,
} from "../lib/playerSession";

import { uploadPhoto } from "../lib/photoApi";

export default function Game() {
  // ALL HOOKS FIRST
  const game = useGameState();
  const sideChallenges = useSideChallenges();
  const players = usePlayers();
  const navigate = useNavigate();

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [uploading, setUploading] =
    useState(false);

  useEffect(() => {
    if (game?.voting_open === true) {
      navigate("/vote");
    }
  }, [game?.voting_open, navigate]);

  // RETURN ONLY AFTER ALL HOOKS
  if (!game) {
    return <p>Waiting for bday kween...</p>;
  }

  const currentPub = game.current_pub;
  const currentChallenge =
    game.current_challenge;
  const challengeDescription =
    game.challenge_description;

  async function handlePhotoSelected(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const playerId = getPlayerId();

    if (!playerId) {
      alert(
        "Player session not found. Please rejoin."
      );

      navigate("/");
      return;
    }

    const currentPlayer = players.find(
      (player) => player.id === playerId
    );

    if (!currentPlayer) {
      alert("Could not find your player.");
      return;
    }

    setUploading(true);

    const { error } = await uploadPhoto(
      file,
      {
        playerId,
        playerName: currentPlayer.name,
        team: currentPlayer.team ?? null,
        challenge: currentChallenge,
        pub: currentPub,
        points: 0,
      }
    );

    setUploading(false);

    // Allows the same image to be chosen again
    event.target.value = "";

    if (error) {
      console.error(
        "PHOTO UPLOAD ERROR:",
        error
      );

      alert(
        `Upload failed: ${error.message}`
      );

      return;
    }

    alert("Photo uploaded!");
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
        <div className="space-y-2">
          <div className="text-sm text-zinc-400">
            📍 Current Pub
          </div>

          <h2 className="text-3xl font-bold">
            {currentPub}
          </h2>
        </div>
      </Card>

      <Card>
        <div className="space-y-4">
          <div className="text-sm text-zinc-400">
            ⭐ Main Mission
          </div>

          <h2 className="text-2xl font-bold">
            {currentChallenge}
          </h2>

          <p>{challengeDescription}</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoSelected}
          />

          <Button
            type="button"
            disabled={uploading}
            onClick={() =>
              fileInputRef.current?.click()
            }
          >
            {uploading
              ? "Uploading..."
              : "Upload Photo"}
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-2xl font-bold">
          CHAOS BINGO
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {sideChallenges.map((challenge) => (
            <div
              key={challenge.id}
              className="rounded-2xl border-2 border-pink-500 bg-black/70 p-3"
            >
              <div className="text-lg font-bold">
                {challenge.title}
              </div>

              <p className="mt-2 text-sm text-zinc-300">
                {challenge.description}
              </p>

              <div className="mt-3 font-bold text-yellow-400">
                +{challenge.points}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Button
        type="button"
        onClick={() =>
          navigate("/leaderboard")
        }
      >
        Leaderboard
      </Button>

      <Button
        type="button"
        onClick={() => {
          clearPlayerId();
          navigate("/");
        }}
      >
        Leave Game
      </Button>
    </main>
  );
}