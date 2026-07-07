import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

import {
  usePlayers,
} from "../game/hooks/usePlayers";

import {
  supabase,
} from "../lib/supabase";

import {
  awardScore,
  type ScoreChallengeType,
} from "../lib/scoreApi";

interface CompletionRow {
  id: string | number;

  player_id: string;

  challenge_type: string;
  challenge_id: string;

  points: number;

  photo_id:
    | string
    | number
    | null;

  completed_at: string;
}

interface PhotoRow {
  id: string | number;

  image_url: string;

  media_type:
    | "image"
    | "video"
    | null;

  player_name:
    | string
    | null;

  team:
    | string
    | null;
}

export default function ChallengeReview() {
  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

  const players = usePlayers();

  const challengeType =
    (
      searchParams.get("type") ??
      "main"
    ) as ScoreChallengeType;

  const challengeId =
    searchParams.get("id") ?? "";

  const challengeTitle =
    searchParams.get("title") ??
    "Challenge";

  const [
    completions,
    setCompletions,
  ] = useState<CompletionRow[]>([]);

  const [
    photos,
    setPhotos,
  ] = useState<PhotoRow[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    awardingId,
    setAwardingId,
  ] = useState<string | null>(
    null
  );

  const [
    customPoints,
    setCustomPoints,
  ] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    async function loadReview() {
      setLoading(true);

      const {
        data: completionData,
        error: completionError,
      } = await supabase
        .from(
          "challenge_completions"
        )
        .select(
          "id, player_id, challenge_type, challenge_id, points, photo_id, completed_at"
        )
        .eq(
          "challenge_type",
          challengeType
        )
        .eq(
          "challenge_id",
          String(challengeId)
        )
        .order(
          "completed_at",
          {
            ascending: true,
          }
        );

      if (completionError) {
        console.error(
          "LOAD COMPLETIONS ERROR:",
          completionError
        );
      }

      const completionRows =
        (completionData ??
          []) as CompletionRow[];

      setCompletions(
        completionRows
      );

      const photoIds =
        completionRows
          .map(
            (completion) =>
              completion.photo_id
          )
          .filter(
            (
              id
            ): id is
              | string
              | number =>
              id !== null
          );

      if (photoIds.length > 0) {
        const {
          data: photoData,
          error: photoError,
        } = await supabase
          .from("photos")
          .select(
            "id, image_url, media_type, player_name, team"
          )
          .in(
            "id",
            photoIds
          );

        if (photoError) {
          console.error(
            "LOAD PHOTOS ERROR:",
            photoError
          );
        }

        setPhotos(
          (photoData ??
            []) as PhotoRow[]
        );
      } else {
        setPhotos([]);
      }

      setLoading(false);
    }

    if (challengeId) {
      loadReview();
    } else {
      setLoading(false);
    }
  }, [
    challengeId,
    challengeType,
  ]);

  async function handleAward(
    playerId: string,
    completionId:
      | string
      | number
  ) {
    const player =
      players.find(
        (item) =>
          item.id === playerId
      );

    if (!player) {
      alert(
        "Could not find player."
      );
      return;
    }

    const pointsValue =
      Number(
        customPoints[
          String(completionId)
        ] ?? 0
      );

    if (
      !Number.isFinite(
        pointsValue
      ) ||
      pointsValue === 0
    ) {
      alert(
        "Enter a valid points amount."
      );
      return;
    }

    const awardToTeam =
      player.team
        ? window.confirm(
            `Award ${pointsValue} points to team "${player.team}"?\n\nPress Cancel to award them only to ${player.name}.`
          )
        : false;

    setAwardingId(
      String(completionId)
    );

    const {
      error,
    } = await awardScore({
      playerId:
        awardToTeam
          ? null
          : player.id,

      teamName:
        awardToTeam
          ? player.team
          : null,

      challengeType,

      challengeId,

      challengeTitle,

      points:
        pointsValue,

      reason:
        `Awarded from ${challengeTitle}`,
    });

    setAwardingId(null);

    if (error) {
      console.error(
        "AWARD SCORE ERROR:",
        error
      );

      alert(
        `Could not award points: ${error.message}`
      );

      return;
    }

    alert(
      `Awarded ${pointsValue} points!`
    );
  }

  if (!challengeId) {
    return (
      <main className="mx-auto min-h-screen max-w-md space-y-6 p-6">
        <Card>
          <h1 className="text-3xl font-bold">
            Challenge not found
          </h1>

          <p className="mt-3">
            No challenge ID was provided.
          </p>
        </Card>

        <Button
          type="button"
          onClick={() =>
            navigate("/admin")
          }
        >
          Back to Admin
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-md space-y-6 p-6">

      <Card>
        <p className="text-sm uppercase">
          Challenge Review
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          {challengeTitle}
        </h1>

        <p className="mt-2 text-sm">
          {challengeType}
        </p>
      </Card>

      {loading ? (
        <Card>
          <p>
            Loading completions...
          </p>
        </Card>
      ) : completions.length === 0 ? (
        <Card>
          <p>
            Nobody has completed this
            challenge yet.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {completions.map(
            (completion) => {
              const player =
                players.find(
                  (item) =>
                    item.id ===
                    completion.player_id
                );

              const photo =
                photos.find(
                  (item) =>
                    String(
                      item.id
                    ) ===
                    String(
                      completion.photo_id
                    )
                );

              return (
                <Card
                  key={
                    completion.id
                  }
                >
                  <h2 className="text-2xl font-bold">
                    {player?.name ??
                      "Unknown player"}
                  </h2>

                  {player?.team && (
                    <p className="mt-1">
                      {player.team}
                    </p>
                  )}

                  {photo && (
                    <div className="mt-4 overflow-hidden rounded-2xl">
                      {photo.media_type ===
                      "video" ? (
                        <video
                          src={
                            photo.image_url
                          }
                          controls
                          playsInline
                          className="w-full"
                        />
                      ) : (
                        <img
                          src={
                            photo.image_url
                          }
                          alt="Challenge submission"
                          className="w-full"
                        />
                      )}
                    </div>
                  )}

                  {!photo && (
                    <p className="mt-4 text-sm">
                      Completed without
                      media.
                    </p>
                  )}

                  <div className="mt-4">
                    <label className="text-sm font-bold">
                      Points to award
                    </label>

                    <input
                      type="number"
                      value={
                        customPoints[
                          String(
                            completion.id
                          )
                        ] ?? ""
                      }
                      onChange={(
                        event
                      ) =>
                        setCustomPoints(
                          (
                            current
                          ) => ({
                            ...current,

                            [String(
                              completion.id
                            )]:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="e.g. 10"
                      className="mt-2 w-full rounded-xl border-2 border-pink-500 bg-black p-3 text-white"
                    />
                  </div>

                  <div className="mt-4">
                    <Button
                      type="button"
                      disabled={
                        awardingId ===
                        String(
                          completion.id
                        )
                      }
                      onClick={() =>
                        handleAward(
                          completion.player_id,
                          completion.id
                        )
                      }
                    >
                      {awardingId ===
                      String(
                        completion.id
                      )
                        ? "Awarding..."
                        : "Award Points"}
                    </Button>
                  </div>
                </Card>
              );
            }
          )}
        </div>
      )}

      <Button
        type="button"
        onClick={() =>
          navigate("/admin")
        }
      >
        Back to Admin
      </Button>
    </main>
  );
}