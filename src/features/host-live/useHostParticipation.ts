import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import * as hostRosterCommands from "../../lib/hostRosterCommands";
import { gameAssetUrl } from "../../lib/sessionMedia";
import { hostPlayerStorageKey } from "./hostParticipationStorage";
import type { GameSession, HostTab, SessionChallenge } from "./types";
import type { SetHostBusy } from "./useHostOperation";

interface Options {
  sessionId: string;
  session: GameSession | null;
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
  setBusy,
  setError,
  setNotice,
  setSession,
  hostPlayerName,
  setActiveTab,
  load,
}: Options) {
  const [hostPlayerToken, setHostPlayerToken] = useState<string | null>(() =>
    localStorage.getItem(hostPlayerStorageKey(sessionId)),
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
  async function uploadAvatar(file: File): Promise<string | null> {
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
    if (error) {
      setError(
        `You joined, but your profile photo couldn't upload: ${error.message}`,
      );
      return null;
    }
    return gameAssetUrl(path);
  }

  async function attachAvatar(avatarUrl: string): Promise<boolean> {
    const { data, error } =
      await hostRosterCommands.readHostPlayerIdentity(sessionId);
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
    if (updateError) {
      setError(`Your profile photo couldn't be saved: ${updateError.message}`);
      return false;
    }
    await load();
    return true;
  }

  async function saveHostAvatar(): Promise<boolean> {
    if (!hostAvatarFile) return true;
    if (!setBusy(true)) return false;
    try {
      setError("");
      const avatarUrl = await uploadAvatar(hostAvatarFile);
      if (!avatarUrl) return false;
      return await attachAvatar(avatarUrl);
    } finally {
      setBusy(false);
    }
  }

  async function setHostParticipation(
    participates: boolean,
    options?: JoinOptions,
  ): Promise<boolean> {
    if (!session) return false;
    if (!setBusy(true)) return false;
    setError("");
    setNotice("");
    const { error: updateError } =
      await hostRosterCommands.updateHostParticipation(
        { host_participates: participates },
        session.id,
      );
    setBusy(false);
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
    if (!session) return null;
    if (!setBusy(true)) return null;
    setError("");
    setNotice("");
    const { data, error: joinError } =
      await hostRosterCommands.hostJoinAsPlayer({
        p_session_id: session.id,
        p_player_name: hostPlayerName.trim() || "Host",
      });
    setBusy(false);
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
      ? await uploadAvatar(hostAvatarFile)
      : null;
    setActiveTab("game");
    if (!options?.requireAvatar)
      setNotice(
        `You're in the game${result?.name ? ` as ${result.name}` : " as Host"}.`,
      );
    await load();
    const avatarSaved = avatarUrl
      ? await attachAvatar(avatarUrl)
      : !hostAvatarFile;
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
    if (!session) return null;
    let token = localStorage.getItem(hostPlayerStorageKey(session.id));
    if (!session.host_participates || !session.host_player_id || !token) {
      const joined = await setHostParticipation(true, options);
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
    if (!session || session.status !== "live") return;
    if (
      !session.host_participates ||
      !localStorage.getItem(hostPlayerStorageKey(session.id))
    ) {
      await setHostParticipation(true);
    }
    if (!localStorage.getItem(hostPlayerStorageKey(session.id))) return;
    setFocusedHostChallenge(challenge.id);
    setActiveTab("side-challenges");
  }
  useEffect(() => {
    setHostPlayerToken(localStorage.getItem(hostPlayerStorageKey(sessionId)));
    setFocusedHostChallenge(null);
  }, [sessionId]);
  return {
    hostPlayerToken,
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
