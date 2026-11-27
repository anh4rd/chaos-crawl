import type { Dispatch, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";
import * as hostRosterCommands from "../../lib/hostRosterCommands";
import { gameAssetUrl } from "../../lib/sessionMedia";
import { hostPlayerStorageKey } from "./hostParticipationStorage";
import type { GameSession, HostTab, SessionChallenge } from "./types";
import type { SetHostBusy } from "./useHostOperation";

interface Options {
  sessionId: string;
  session: GameSession | null;
  canUseHostPlayer: boolean;
  setBusy: SetHostBusy;
  setError: Dispatch<SetStateAction<string>>;
  setNotice: Dispatch<SetStateAction<string>>;
  setSession: Dispatch<SetStateAction<GameSession | null>>;
  hostPlayerName: string;
  setActiveTab: Dispatch<SetStateAction<HostTab>>;
  load: () => Promise<void>;
}
interface JoinOptions {
  requireAvatar?: boolean;
}
export function useHostParticipation({
  sessionId,
  session,
  canUseHostPlayer,
  setBusy,
  setError,
  setNotice,
  setSession,
  hostPlayerName,
  setActiveTab,
  load,
}: Options) {
  const mounted = useRef(false);
  const generation = useRef(0);
  const identity = useRef({ sessionId, canUseHostPlayer });
  identity.current = { sessionId, canUseHostPlayer };
  useEffect(() => {
    mounted.current = true;
    generation.current += 1;
    return () => {
      mounted.current = false;
      generation.current += 1;
    };
  }, [sessionId, canUseHostPlayer]);
  function isCurrent(request: number) {
    return (
      mounted.current &&
      generation.current === request &&
      identity.current.sessionId === sessionId &&
      identity.current.canUseHostPlayer
    );
  }
  const [hostPlayerToken, setHostPlayerToken] = useState<string | null>(() =>
    canUseHostPlayer
      ? localStorage.getItem(hostPlayerStorageKey(sessionId))
      : null,
  );

  const [focusedHostChallenge, setFocusedHostChallenge] = useState<
    string | null
  >(null);

  const [hostAvatarFile, setHostAvatarFile] = useState<File | null>(null);

  const [hostAvatarPreview, setHostAvatarPreview] = useState("");

  useEffect(
    () => () => {
      if (hostAvatarPreview) URL.revokeObjectURL(hostAvatarPreview);
    },
    [hostAvatarPreview],
  );
  async function uploadAvatar(
    file: File,
    request: number,
  ): Promise<string | null> {
    const extension =
      file.name
        .split(".")
        .pop()
        ?.replace(/[^a-z0-9]/gi, "") || "jpg";
    const path = `host-avatars/${sessionId}/${Date.now()}.${extension}`;
    const { error } = await hostRosterCommands.uploadHostAvatar(path, file, {
      upsert: true,
      contentType: file.type,
    });
    if (!isCurrent(request)) return null;
    if (error) {
      setError(
        `You joined, but your profile photo couldn't upload: ${error.message}`,
      );
      return null;
    }
    return gameAssetUrl(path);
  }

  async function attachAvatar(
    avatarUrl: string,
    request: number,
  ): Promise<boolean> {
    const { data, error } =
      await hostRosterCommands.readHostPlayerIdentity(sessionId);
    if (!isCurrent(request)) return false;
    if (error || !data?.host_player_id) {
      setError(
        `Your profile photo couldn't be saved: ${error?.message ?? "Host player not found."}`,
      );
      return false;
    }
    const { error: updateError } = await hostRosterCommands.updateHostAvatar({
      values: { avatar_url: avatarUrl },
      playerId: data.host_player_id,
      sessionId,
    });
    if (!isCurrent(request)) return false;
    if (updateError) {
      setError(`Your profile photo couldn't be saved: ${updateError.message}`);
      return false;
    }
    await load();
    return isCurrent(request);
  }

  async function saveHostAvatar(): Promise<boolean> {
    if (!canUseHostPlayer) {
      setError("Only the game owner can use the host player profile.");
      return false;
    }
    if (!hostAvatarFile) return true;
    if (!setBusy(true)) return false;
    const request = generation.current;
    try {
      setError("");
      const avatarUrl = await uploadAvatar(hostAvatarFile, request);
      if (!avatarUrl) return false;
      return await attachAvatar(avatarUrl, request);
    } finally {
      setBusy(false);
    }
  }

  async function setHostParticipation(
    participates: boolean,
    options?: JoinOptions,
  ): Promise<boolean> {
    if (!canUseHostPlayer) {
      setError("Only the game owner can change host participation.");
      return false;
    }
    if (!session) return false;
    if (!setBusy(true)) return false;
    const request = generation.current;
    setError("");
    setNotice("");
    const { error: updateError } =
      await hostRosterCommands.updateHostParticipation(
        { host_participates: participates },
        session.id,
      );
    setBusy(false);
    if (!isCurrent(request)) return false;
    if (updateError) {
      setError(updateError.message);
      return false;
    }
    setSession({ ...session, host_participates: participates });
    if (participates) {
      return Boolean(await openHostPlayerView(options));
    } else {
      setNotice("You’ll host the game without joining the player list.");
    }
    return true;
  }

  async function openHostPlayerView(
    options?: JoinOptions,
  ): Promise<string | null> {
    if (!canUseHostPlayer) {
      setError("Only the game owner can use the host player profile.");
      return null;
    }
    if (!session) return null;
    if (!setBusy(true)) return null;
    const request = generation.current;
    setError("");
    setNotice("");
    const { data, error: joinError } =
      await hostRosterCommands.hostJoinAsPlayer({
        p_session_id: session.id,
        p_player_name: hostPlayerName.trim() || "Host",
      });
    setBusy(false);
    if (!isCurrent(request)) return null;
    if (joinError) {
      setError(joinError.message);
      return null;
    }
    const result = data as {
      join_code?: string;
      player_token?: string;
      name?: string;
    } | null;
    const joinCode = result?.join_code ?? session.join_code;
    const playerToken = result?.player_token;
    if (!playerToken) {
      setError(
        "The host player profile was created, but no player token was returned. Check the host participation migration.",
      );
      return null;
    }
    localStorage.setItem(hostPlayerStorageKey(session.id), playerToken);
    setHostPlayerToken(playerToken);
    localStorage.setItem(
      `chaos-crawl-session-player:${joinCode.replace(/\D/g, "")}`,
      playerToken,
    );
    const avatarUrl = hostAvatarFile
      ? await uploadAvatar(hostAvatarFile, request)
      : null;
    if (!isCurrent(request)) return null;
    setActiveTab("game");
    if (!options?.requireAvatar)
      setNotice(
        `You're in the game${result?.name ? ` as ${result.name}` : " as Host"}.`,
      );
    await load();
    if (!isCurrent(request)) return null;
    const avatarSaved = avatarUrl
      ? await attachAvatar(avatarUrl, request)
      : !hostAvatarFile;
    if (!isCurrent(request)) return null;
    if (options?.requireAvatar) {
      if (!avatarSaved) return null;
      setNotice(
        `You're in the game${result?.name ? ` as ${result.name}` : " as Host"}.`,
      );
    }
    return playerToken;
  }

  async function ensureHostPlayerToken(
    onRecovered?: () => void,
    options?: JoinOptions,
  ): Promise<string | null> {
    if (!canUseHostPlayer) {
      setError("Only the game owner can use the host player profile.");
      return null;
    }
    if (!session) return null;
    const request = generation.current;
    let token = localStorage.getItem(hostPlayerStorageKey(session.id));
    if (!session.host_participates || !session.host_player_id || !token) {
      const joined = await setHostParticipation(true, options);
      if (!isCurrent(request)) return null;
      if (!joined) return null;
      onRecovered?.();
      token = localStorage.getItem(hostPlayerStorageKey(session.id));
    }
    if (!token)
      setError(
        "Host participation was enabled, but the host player token is missing. Please rejoin as Host and try again.",
      );
    return token;
  }

  async function openHostSideChallengeUpload(challenge: SessionChallenge) {
    if (!canUseHostPlayer) {
      setError("Only the game owner can use the host player profile.");
      return;
    }
    if (!session || session.status !== "live") return;
    const request = generation.current;
    if (
      !session.host_participates ||
      !localStorage.getItem(hostPlayerStorageKey(session.id))
    ) {
      await setHostParticipation(true);
    }
    if (!isCurrent(request)) return;
    if (!localStorage.getItem(hostPlayerStorageKey(session.id))) return;
    setFocusedHostChallenge(challenge.id);
    setActiveTab("side-challenges");
  }
  useEffect(() => {
    setHostPlayerToken(
      canUseHostPlayer
        ? localStorage.getItem(hostPlayerStorageKey(sessionId))
        : null,
    );
    setFocusedHostChallenge(null);
  }, [sessionId, canUseHostPlayer]);
  return {
    hostPlayerToken: canUseHostPlayer ? hostPlayerToken : null,
    ensureHostPlayerToken,
    focusedHostChallenge,
    setHostAvatarFile,
    hostAvatarPreview,
    setHostAvatarPreview,
    setHostParticipation,
    saveHostAvatar,
    openHostPlayerView,
    openHostSideChallengeUpload,
  };
}
