import { useEffect, useRef, useState, type FormEvent } from "react";
import type { CommunitySubmission } from "../../types/hostExplore";
import type { ExploreActionFeedback } from "./types";
import {
  createChallengeDraft,
  draftFromSubmission,
  challengePayload,
} from "./challengeDraft";
import { readHostIdentity } from "../../lib/hostAuth";
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
  useEffect(() => {
    mounted.current = true;
    lifetime.current += 1;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function submitChallenge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const generation = lifetime.current;
    const current = () => mounted.current && lifetime.current === generation;
    if (!current()) return;
    setSubmittingChallenge(true);
    onActionStart();
    const { data: userData, error: userError } = await readHostIdentity();
    if (!current()) return;
    if (userError || !userData.user) {
      onActionError("Your session has expired. Please log in again.");
      setSubmittingChallenge(false);
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
    setSubmittingChallenge(false);
    if (insertError) {
      onActionError(insertError.message);
      return;
    }
    setChallengeDraft(createChallengeDraft());
    setEditingSubmission(null);
    setShowCreateChallenge(false);
    await loadSubmissions();
  }
  function editCommunityChallenge(submission: CommunitySubmission) {
    setEditingSubmission(submission);
    setChallengeDraft(draftFromSubmission(submission));
    setShowCreateChallenge(true);
  }

  return {
    showCreateChallenge,
    setShowCreateChallenge,
    editingSubmission,
    setEditingSubmission,
    submittingChallenge,
    challengeDraft,
    setChallengeDraft,
    submitChallenge,
    editCommunityChallenge,
  };
}
