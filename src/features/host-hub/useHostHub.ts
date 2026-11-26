import type { User } from "@supabase/supabase-js";
import { failedResult, runApi } from "../../lib/apiResult";
import { useEffect, useState } from "react";
import { createOrGetHostGameSession } from "../../lib/gameSessions";
import { readHostIdentity } from "../../lib/hostAuth";
import {
  readHostGames,
  readHostPreview,
  readHostDirectory,
  readPlatformAdmin,
} from "../../lib/hostHubQueries";
import { localDateKey } from "../../utils/hostDate";
import type {
  HostDirectoryEntry,
  HostGame,
  HostPreviewIdentity,
} from "../../types/hostHub";
export function useHostHub({
  view,
  viewAsHostId,
  navigate,
}: {
  view: "home" | "games";
  viewAsHostId: string | null;
  navigate: (path: string) => void;
}) {
  const [games, setGames] = useState<HostGame[]>([]);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [hostDirectory, setHostDirectory] = useState<HostDirectoryEntry[]>([]);
  const [viewingHost, setViewingHost] = useState<HostPreviewIdentity | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    async function loadGames() {
      setLoading(true);
      setError("");
      const { data: userData, error: userError } = await runApi<{
        user: User | null;
      }>(readHostIdentity);
      if (!current) return;
      if (userError || !userData?.user) {
        setLoading(false);
        setError("Your session has expired. Please log in again.");
        return;
      }

      const userId = userData.user.id;
      setUserId(userId);
      const dateKey = localDateKey();
      const gamesRequest = readHostGames(view, dateKey).catch(failedResult);
      const [{ data: adminData, error: adminError }, gamesResult] =
        await Promise.all([
          readPlatformAdmin().catch(failedResult),
          gamesRequest,
        ]);
      if (!current) return;
      const platformAdmin = !adminError && Boolean(adminData);
      setIsPlatformAdmin(platformAdmin);

      if (viewAsHostId) {
        if (!platformAdmin) {
          setLoading(false);
          setError(
            "Only a platform administrator can view another host's Host Hub.",
          );
          setViewingHost(null);
          setGames([]);
          return;
        }
        const { data: previewData, error: previewError } =
          await readHostPreview(viewAsHostId).catch(failedResult);
        if (!current) return;
        setLoading(false);
        if (previewError || !previewData) {
          console.error("HOST PREVIEW ERROR", previewError);
          setError(
            previewError?.message ??
              "Couldn't load this host's dashboard. Check the platform-admin migration.",
          );
          return;
        }
        const payload = previewData;
        setViewingHost(payload.host ?? null);
        setGames(Array.isArray(payload.games) ? payload.games : []);
        return;
      }

      setViewingHost(null);
      const { data, error: queryError } = gamesResult;
      if (queryError) {
        setLoading(false);
        console.error("LOAD HOST GAMES ERROR", queryError);
        setError(
          "Couldn't load your plans. Make sure the host planning database migration has been run.",
        );
        return;
      }
      setGames(data ?? []);
      setLoading(false);
      if (platformAdmin && view === "home") {
        setHostDirectory([]);
        const { data: hosts, error: hostsError } =
          await readHostDirectory().catch(failedResult);
        if (!current) return;
        if (hostsError) {
          console.warn("Could not load host directory", hostsError);
        } else {
          setHostDirectory(hosts ?? []);
        }
      }
    }
    void loadGames();
    return () => {
      current = false;
    };
  }, [viewAsHostId, view]);

  const upcoming = games.filter(
    (game) =>
      game.status !== "completed" &&
      (!game.event_date ||
        new Date(`${game.event_date}T23:59:59`).getTime() >= Date.now()),
  );
  const past = games.filter(
    (game) =>
      game.status === "completed" ||
      (game.event_date &&
        new Date(`${game.event_date}T23:59:59`).getTime() < Date.now()),
  );
  const editGame = (id: string) => navigate(`/host/games/${id}/edit`);
  const dashboardGame =
    upcoming.find((game) => game.status === "live") ??
    upcoming.find((game) => game.status === "planned") ??
    upcoming[0] ??
    games[0] ??
    null;
  async function playGame(game: HostGame) {
    if (viewAsHostId) return;
    if (game.status !== "planned" && game.status !== "live") {
      navigate(`/host/games/${game.id}/edit`);
      return;
    }

    setActionError("");
    setPlayingId(game.id);
    setError("");
    try {
      const session = await createOrGetHostGameSession(game.id);
      navigate(`/host/live/${session.id}`);
    } catch (launchError) {
      console.error("CREATE HOST GAME SESSION ERROR", launchError);
      setActionError(
        launchError instanceof Error
          ? launchError.message
          : "Couldn't prepare this game. Check that the multi-game migration has been applied.",
      );
    } finally {
      setPlayingId(null);
    }
  }

  return {
    games,
    upcoming,
    past,
    dashboardGame,
    isPlatformAdmin,
    hostDirectory,
    viewingHost,
    loading,
    error: actionError || error,
    playingId,
    userId,
    editGame,
    playGame,
  };
}
