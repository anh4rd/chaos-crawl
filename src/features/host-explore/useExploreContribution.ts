import { useEffect, useRef, useState, type FormEvent } from "react";
import type { CommunitySubmission } from "../../types/hostExplore";
import type { ExploreActionFeedback } from "./types";
import {
  createChallengeDraft,
  draftFromSubmission,
  challengePayload,
} from "./challengeDraft";
import { readHostIdentity } from "../../lib/hostAuth";
import { apiError } from "../../lib/apiResult";
import {
  createCommunityChallenge,
  updateApprovedCommunityChallenge,
} from "../../lib/hostExploreCommands";

export function useExploreContribution({
  onActionStart,
  onActionError,
  loadSubmissions,
}: ExploreActionFeedback & { loadSubmissions: () => Promise<void> }) {
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [editingSubmission, setEditingSubmission] =
    useState<CommunitySubmission | null>(null);
  const [submittingChallenge, setSubmittingChallenge] = useState(false);
  const [challengeDraft, setChallengeDraft] = useState(createChallengeDraft);
  const mounted = useRef(false);
  const lifetime = useRef(0);
  const dialogGeneration = useRef(0);
  const dialogOpen = useRef(false);
  const pending = useRef(false);
  useEffect(() => {
    mounted.current = true;
    lifetime.current += 1;
    return () => {
      mounted.current = false;
    };
  }, []);

  function beginDialog() {
    dialogGeneration.current += 1;
    dialogOpen.current = true;
    pending.current = false;
    setSubmittingChallenge(false);
    onActionStart();
    setShowCreateChallenge(true);
  }
  function openCreateChallenge() {
    if (dialogOpen.current) return;
    setEditingSubmission(null);
    beginDialog();
  }
  function closeContribution() {
    dialogGeneration.current += 1;
    dialogOpen.current = false;
    pending.current = false;
    setSubmittingChallenge(false);
    setShowCreateChallenge(false);
    if (editingSubmission) setChallengeDraft(createChallengeDraft());
    setEditingSubmission(null);
    onActionStart();
  }
  function editCommunityChallenge(submission: CommunitySubmission) {
    if (dialogOpen.current) return;
    setEditingSubmission(submission);
    setChallengeDraft(draftFromSubmission(submission));
    beginDialog();
  }
  async function submitChallenge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mounted.current || !dialogOpen.current || pending.current) return;
    const generation = lifetime.current;
    const dialog = dialogGeneration.current;
    const current = () =>
      mounted.current &&
      lifetime.current === generation &&
      dialogOpen.current &&
      dialogGeneration.current === dialog;
    pending.current = true;
    setSubmittingChallenge(true);
    onActionStart();
    try {
      const { data: userData, error: userError } = await readHostIdentity();
      if (!current()) return;
      if (userError || !userData.user) {
        onActionError("Your session has expired. Please log in again.");
        return;
      }
      const payload = challengePayload(challengeDraft);
      const { error: insertError } = editingSubmission
        ? await updateApprovedCommunityChallenge({
            id: editingSubmission.id,
            title: challengeDraft.title.trim(),
            description: challengeDraft.description.trim(),
            payload,
          })
        : await createCommunityChallenge({
            title: challengeDraft.title.trim(),
            description: challengeDraft.description.trim(),
            payload,
            submittedBy: userData.user.id,
          });
      if (!current()) return;
      if (insertError) {
        onActionError(insertError.message);
        return;
      }
      setChallengeDraft(createChallengeDraft());
      closeContribution();
      await loadSubmissions();
    } catch (error) {
      if (current()) onActionError(apiError(error).message);
    } finally {
      if (current()) {
        pending.current = false;
        setSubmittingChallenge(false);
      }
    }
  }
  return {
    showCreateChallenge,
    openCreateChallenge,
    closeContribution,
    editingSubmission,
    submittingChallenge,
    challengeDraft,
    setChallengeDraft,
    submitChallenge,
    editCommunityChallenge,
  };
}
