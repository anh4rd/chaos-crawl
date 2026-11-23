import { apiError } from "../../lib/apiResult";
import { useCallback, useEffect, useRef, useState } from "react";
import { hostDispatchDueSecretMissions } from "../../lib/hostSecretCommands";
import { supabase } from "../../lib/sessionSupabase";
import type {
  GameSession,
  SecretMissionAssignment,
  SecretReviewAssignment,
  SecretReviewState,
  SecretReviewVote,
  SessionChallenge,
  SessionEvidence,
  SessionFinalRoundChallenge,
  SessionFinalRoundState,
  SessionFinalVote,
  SessionPlayer,
  SessionRewardAward,
  SessionRewardRound,
  SessionRewardVote,
  SessionSubmission,
  SessionTeam,
} from "./types";

export function useHostSessionData(sessionId: string) {
  const requestVersion = useRef(0);
  const [session, setSession] = useState<GameSession | null>(null);

  const [challenges, setChallenges] = useState<SessionChallenge[]>([]);

  const [players, setPlayers] = useState<SessionPlayer[]>([]);

  const [teams, setTeams] = useState<SessionTeam[]>([]);

  const [submissions, setSubmissions] = useState<SessionSubmission[]>([]);

  const [secretAssignments, setSecretAssignments] = useState<
    SecretMissionAssignment[]
  >([]);

  const [secretReviewState, setSecretReviewState] =
    useState<SecretReviewState | null>(null);

  const [secretReviewAssignments, setSecretReviewAssignments] = useState<
    SecretReviewAssignment[]
  >([]);

  const [secretReviewVotes, setSecretReviewVotes] = useState<
    SecretReviewVote[]
  >([]);

  const [evidence, setEvidence] = useState<SessionEvidence[]>([]);

  const [finalVotes, setFinalVotes] = useState<SessionFinalVote[]>([]);

  const [finalRoundState, setFinalRoundState] =
    useState<SessionFinalRoundState | null>(null);

  const [finalRoundChallenges, setFinalRoundChallenges] = useState<
    SessionFinalRoundChallenge[]
  >([]);

  const [rewardRounds, setRewardRounds] = useState<SessionRewardRound[]>([]);

  const [rewardVotes, setRewardVotes] = useState<SessionRewardVote[]>([]);

  const [rewardAwards, setRewardAwards] = useState<SessionRewardAward[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    const version = ++requestVersion.current;
    try {
      // Send any scheduled missions whose time has arrived while this game is live.
      const { error: dispatchError } = await hostDispatchDueSecretMissions({
        p_session_id: sessionId,
      });
      if (dispatchError)
        console.warn("SECRET MISSION DISPATCH:", dispatchError.message);

      if (version !== requestVersion.current) return;
      const [
        sessionResult,
        challengeResult,
        playerResult,
        teamResult,
        submissionResult,
        secretAssignmentResult,
        secretReviewStateResult,
        secretReviewAssignmentResult,
        secretReviewVoteResult,
        evidenceResult,
        voteResult,
        finalRoundStateResult,
        finalRoundChallengesResult,
        rewardRoundResult,
        rewardVoteResult,
        rewardAwardResult,
      ] = await Promise.all([
        supabase
          .from("cc_game_sessions")
          .select("*")
          .eq("id", sessionId)
          .single(),
        supabase
          .from("cc_game_session_challenges")
          .select("*")
          .eq("session_id", sessionId)
          .order("sort_order", { ascending: true }),
        supabase
          .from("cc_game_session_players")
          .select("id,name,avatar_url,team_id,score,joined_at,last_seen_at")
          .eq("session_id", sessionId)
          .order("joined_at", { ascending: true }),
        supabase
          .from("cc_game_session_teams")
          .select("id,name,created_at,manual_score_adjustment")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true }),
        supabase
          .from("cc_game_session_submissions")
          .select(
            "id,player_id,challenge_id,status,awarded_points,submitted_at",
          )
          .eq("session_id", sessionId)
          .order("submitted_at", { ascending: false }),
        supabase
          .from("cc_game_session_secret_assignments")
          .select(
            "id,session_id,player_id,challenge_id,status,scheduled_at,sent_at,submitted_at,reviewed_at,awarded_points,final_review_outcome,created_at",
          )
          .eq("session_id", sessionId)
          .order("created_at", { ascending: false }),
        supabase
          .from("cc_game_session_secret_review_state")
          .select(
            "session_id,is_open,voting_open,current_assignment_id,current_evidence_id",
          )
          .eq("session_id", sessionId)
          .maybeSingle(),
        supabase
          .from("cc_game_session_secret_review_assignments")
          .select(
            "session_id,assignment_id,status,success_votes,fail_votes,votes_cast,outcome,points_awarded,opened_at,closed_at",
          )
          .eq("session_id", sessionId),
        supabase
          .from("cc_game_session_secret_review_votes")
          .select("session_id,assignment_id,player_id,vote,voted_at")
          .eq("session_id", sessionId),
        supabase
          .from("cc_game_session_evidence")
          .select(
            "id,session_id,player_id,challenge_id,secret_assignment_id,storage_path,media_type,saved_for_final,created_at",
          )
          .eq("session_id", sessionId)
          .order("created_at", { ascending: false }),
        supabase
          .from("cc_game_session_final_round_votes")
          .select("session_id,challenge_id,player_id,evidence_id,voted_at")
          .eq("session_id", sessionId),
        supabase
          .from("cc_game_session_final_round_state")
          .select(
            "session_id,is_open,voting_open,slideshow_challenge_id,slideshow_evidence_id",
          )
          .eq("session_id", sessionId)
          .maybeSingle(),
        supabase
          .from("cc_game_session_final_round_challenges")
          .select(
            "session_id,challenge_id,status,votes_cast,opened_at,closed_at",
          )
          .eq("session_id", sessionId),
        supabase
          .from("cc_game_session_reward_rounds")
          .select("*")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: false }),
        supabase
          .from("cc_game_session_reward_votes")
          .select(
            "id,session_id,reward_round_id,voter_player_id,target_player_id,target_team_id,voted_at",
          )
          .eq("session_id", sessionId),
        supabase
          .from("cc_game_session_reward_awards")
          .select(
            "id,session_id,reward_round_id,winner_player_id,winner_team_id,points_awarded,votes_received",
          )
          .eq("session_id", sessionId),
      ]);

      if (version !== requestVersion.current) return;
      if (sessionResult.error) {
        setError(
          `Couldn't load this game session: ${sessionResult.error.message}`,
        );
        setLoading(false);
        return;
      }
      setSession(sessionResult.data as GameSession);
      const loadedChallenges = (challengeResult.data ??
        []) as SessionChallenge[];
      setChallenges(loadedChallenges);
      setPlayers((playerResult.data ?? []) as SessionPlayer[]);
      setTeams((teamResult.data ?? []) as SessionTeam[]);
      setSubmissions((submissionResult.data ?? []) as SessionSubmission[]);
      setSecretAssignments(
        (secretAssignmentResult.data ?? []) as SecretMissionAssignment[],
      );
      setSecretReviewState(
        (secretReviewStateResult.data as SecretReviewState | null) ?? null,
      );
      setSecretReviewAssignments(
        (secretReviewAssignmentResult.data ?? []) as SecretReviewAssignment[],
      );
      setSecretReviewVotes(
        (secretReviewVoteResult.data ?? []) as SecretReviewVote[],
      );
      setEvidence((evidenceResult.data ?? []) as SessionEvidence[]);
      setFinalVotes((voteResult.data ?? []) as SessionFinalVote[]);
      setFinalRoundState(
        (finalRoundStateResult.data as SessionFinalRoundState | null) ?? null,
      );
      setFinalRoundChallenges(
        (finalRoundChallengesResult.data ?? []) as SessionFinalRoundChallenge[],
      );
      setRewardRounds((rewardRoundResult.data ?? []) as SessionRewardRound[]);
      setRewardVotes((rewardVoteResult.data ?? []) as SessionRewardVote[]);
      setRewardAwards((rewardAwardResult.data ?? []) as SessionRewardAward[]);
      const loadError =
        challengeResult.error ||
        playerResult.error ||
        teamResult.error ||
        submissionResult.error ||
        secretAssignmentResult.error ||
        secretReviewStateResult.error ||
        secretReviewAssignmentResult.error ||
        secretReviewVoteResult.error ||
        evidenceResult.error ||
        voteResult.error ||
        finalRoundStateResult.error ||
        finalRoundChallengesResult.error ||
        rewardRoundResult.error ||
        rewardVoteResult.error ||
        rewardAwardResult.error;
      if (loadError)
        setError(`Some game details could not load: ${loadError.message}`);
      else setError("");
      setLoading(false);
    } catch (failure: unknown) {
      if (version !== requestVersion.current) return;
      setError(`Couldn't load this game session: ${apiError(failure).message}`);
      setLoading(false);
    }
  }, [sessionId]);
  useEffect(() => {
    let active = true;
    let refreshing = false;
    const refresh = async () => {
      if (!active || refreshing) return;
      refreshing = true;
      try {
        await load();
      } finally {
        refreshing = false;
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 3000);
    return () => {
      active = false;
      requestVersion.current += 1;
      window.clearInterval(timer);
    };
  }, [load]);
  return {
    session,
    setSession,
    challenges,
    players,
    teams,
    submissions,
    secretAssignments,
    secretReviewState,
    secretReviewAssignments,
    secretReviewVotes,
    evidence,
    finalVotes,
    finalRoundState,
    finalRoundChallenges,
    rewardRounds,
    rewardVotes,
    rewardAwards,
    loading,
    error,
    setError,
    load,
  };
}
