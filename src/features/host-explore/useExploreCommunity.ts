import { useCallback, useEffect, useRef, useState } from "react";
import type { CommunitySubmission } from "../../types/hostExplore";
import { readHostIdentity } from "../../lib/hostAuth";
import { readPlatformAdmin } from "../../lib/hostHubQueries";
import { readCommunitySubmissions } from "../../lib/hostExploreQueries";

export function useExploreCommunity(onQueryError: (message: string) => void) {
  const [submissions, setSubmissions] = useState<CommunitySubmission[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const mounted = useRef(false);
  const lifetime = useRef(0);
  useEffect(() => {
    mounted.current = true;
    lifetime.current += 1;
    return () => {
      mounted.current = false;
    };
  }, []);
  const communityRead = useRef(0);
  const loadSubmissions = useCallback(async () => {
    if (!mounted.current) return;
    const request = ++communityRead.current;
    const generation = lifetime.current;
    const current = () =>
      mounted.current &&
      lifetime.current === generation &&
      communityRead.current === request;
    const [{ data: userData }, { data: adminData, error: adminError }] =
      await Promise.all([readHostIdentity(), readPlatformAdmin()]);
    if (!current()) return;
    if (adminError) {
      console.warn(
        "Platform-admin check unavailable; community review controls remain hidden.",
        adminError,
      );
    }
    setIsPlatformAdmin(Boolean(adminData));
    if (!userData.user) return;
    setCurrentUserId(userData.user.id);
    const { data, error: queryError } = await readCommunitySubmissions();
    if (!current()) return;
    if (queryError) {
      onQueryError(
        "Community submissions need the catalogue moderation migration. Run 20261112_community_catalog_and_host_view_as.sql in Supabase.",
      );
      return;
    }
    setSubmissions(data ?? []);
  }, [onQueryError]);

  useEffect(() => {
    void loadSubmissions();
  }, [loadSubmissions]);

  return { submissions, currentUserId, isPlatformAdmin, loadSubmissions };
}
