import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/sessionSupabase";
import type {
  FinalGalleryView,
  LeaderboardEntry,
  PlayerPage,
  PlayerRewardRound,
  SecretMission,
  SecretReviewView,
  SessionEvidence,
  SessionView,
} from "./types";

export function useSessionPlayerData(
  code: string,
  token: string | null,
  activePage: PlayerPage,
) {
  const requestVersion = useRef(0);
  const [view, setView] = useState<SessionView | null>(null);

  const [secretMissions, setSecretMissions] = useState<SecretMission[]>([]);

  const [secretReview, setSecretReview] = useState<SecretReviewView | null>(
    null,
  );

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const [playerRank, setPlayerRank] = useState<number | null>(null);

  const [evidence, setEvidence] = useState<SessionEvidence[]>([]);

  const [finalGallery, setFinalGalleryView] = useState<FinalGalleryView | null>(
    null,
  );

  const [rewardRound, setRewardRound] = useState<PlayerRewardRound | null>(
    null,
  );

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [gamePhotoUrl, setGamePhotoUrl] = useState<string | null>(null);

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!code) return;
    let active = true;
    setGamePhotoUrl(null);
    void supabase
      .rpc("cc_get_public_game_invite", { p_join_code: code })
      .then(({ data, error: photoError }) => {
        if (!active || photoError || !data) return;
        const invite = data as { game_photo_url?: string | null };
        setGamePhotoUrl(invite.game_photo_url ?? null);
      });
    return () => {
      active = false;
    };
  }, [code]);

  useEffect(() => {
    setView(null);
    setSecretMissions([]);
    setSecretReview(null);
    setEvidence([]);
    setLeaderboard([]);
    setPlayerRank(null);
    setFinalGalleryView(null);
    setRewardRound(null);
    setError("");
    setLoading(Boolean(code && token));
  }, [code, token]);

  const loadView = useCallback(async () => {
    if (!code || !token) {
      setLoading(false);
      return;
    }
    const version = ++requestVersion.current;
    let nextError = "";
    const { data, error: viewError } = await supabase.rpc(
      "cc_get_game_session_view",
      {
        p_join_code: code,
        p_player_token: token,
      },
    );
    if (version !== requestVersion.current) return;
    if (viewError) {
      setError(viewError.message);
      setLoading(false);
      return;
    }
    const currentView = data as SessionView | null;
    if (currentView) {
      setView(currentView);
      setLastUpdated(new Date());
    }

    const { data: rewardData, error: rewardError } = await supabase.rpc(
      "cc_player_get_session_reward_round",
      {
        p_join_code: code,
        p_player_token: token,
      },
    );
    if (version !== requestVersion.current) return;
    if (rewardError) {
      nextError = `Your game loaded, but reward points couldn't refresh: ${rewardError.message}`;
    } else {
      setRewardRound((rewardData ?? null) as PlayerRewardRound | null);
    }

    const { data: missionData, error: missionError } = await supabase.rpc(
      "cc_get_player_secret_missions",
      {
        p_join_code: code,
        p_player_token: token,
      },
    );
    if (version !== requestVersion.current) return;
    if (missionError) {
      nextError = `Your game loaded, but secret missions couldn't refresh: ${missionError.message}`;
    } else {
      setSecretMissions((missionData ?? []) as SecretMission[]);
    }

    const { data: secretReviewData, error: secretReviewError } =
      await supabase.rpc("cc_player_get_session_secret_review", {
        p_join_code: code,
        p_player_token: token,
      });
    if (version !== requestVersion.current) return;
    if (secretReviewError) {
      nextError =
        nextError ||
        `Secret mission review couldn't refresh: ${secretReviewError.message}`;
    } else {
      setSecretReview(secretReviewData as SecretReviewView);
    }

    const { data: evidenceData, error: evidenceError } = await supabase.rpc(
      "cc_get_player_session_evidence",
      {
        p_join_code: code,
        p_player_token: token,
      },
    );
    if (version !== requestVersion.current) return;
    if (evidenceError) {
      nextError =
        nextError || `Your uploads couldn't refresh: ${evidenceError.message}`;
    } else {
      setEvidence((evidenceData ?? []) as SessionEvidence[]);
    }

    if (activePage === "leaderboard") {
      const { data: leaderboardData, error: leaderboardError } =
        await supabase.rpc("cc_get_player_session_leaderboard", {
          p_join_code: code,
          p_player_token: token,
        });
      if (version !== requestVersion.current) return;
      if (leaderboardError) {
        nextError =
          nextError ||
          `The leaderboard couldn't refresh: ${leaderboardError.message}`;
      } else {
        setLeaderboard((leaderboardData ?? []) as LeaderboardEntry[]);
      }
    }

    if (activePage === "final" || currentView?.session.final_gallery_open) {
      const { data: galleryData, error: galleryError } = await supabase.rpc(
        "cc_player_get_session_final_round_gallery",
        {
          p_join_code: code,
          p_player_token: token,
        },
      );
      if (version !== requestVersion.current) return;
      if (galleryError) {
        nextError =
          nextError ||
          `The final gallery couldn't refresh: ${galleryError.message}`;
      } else {
        const finalRoundData = galleryData as FinalGalleryView;
        setFinalGalleryView(finalRoundData);
        if (finalRoundData.voting_completed)
          setLeaderboard(finalRoundData.leaderboard);
      }
    } else {
      setFinalGalleryView(null);
    }

    setError(nextError);
    setLoading(false);
  }, [activePage, code, token]);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      if (mounted) await loadView();
    };
    void refresh();
    const id = window.setInterval(() => {
      if (mounted) void loadView();
    }, 3000);
    return () => {
      mounted = false;
      requestVersion.current += 1;
      window.clearInterval(id);
    };
  }, [loadView]);

  useEffect(() => {
    if (!code || !token || !view?.player.id) return;
    let live = true;
    const refreshRank = async () => {
      const { data, error: rankError } = await supabase.rpc(
        "cc_get_player_session_leaderboard",
        {
          p_join_code: code,
          p_player_token: token,
        },
      );
      if (rankError || !live) return;
      const entries = (data ?? []) as LeaderboardEntry[];
      const index = entries.findIndex(
        (entry) => entry.player_id === view.player.id,
      );
      setPlayerRank(index >= 0 ? index + 1 : null);
    };
    void refreshRank();
    const interval = window.setInterval(() => void refreshRank(), 15000);
    return () => {
      live = false;
      window.clearInterval(interval);
    };
  }, [code, token, view?.player.id]);
  return {
    view,
    secretMissions,
    secretReview,
    leaderboard,
    playerRank,
    evidence,
    finalGallery,
    rewardRound,
    loading,
    error,
    setError,
    gamePhotoUrl,
    lastUpdated,
    loadView,
  };
}
