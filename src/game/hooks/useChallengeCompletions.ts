import { getChallengeCompletions } from "../../lib/completionApi";
import type { ChallengeCompletion } from "../../types/database";
import { useRealtimeQuery } from "./useRealtimeQuery";
export type { ChallengeCompletion } from "../../types/database";

const initialData: ChallengeCompletion[] = [];
const load = (signal: AbortSignal) => getChallengeCompletions(signal);

export default function useChallengeCompletions() {
  return useRealtimeQuery("challenge_completions", load, initialData);
}
