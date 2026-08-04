"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Cohort } from "@/lib/types";
import { recordVisit } from "@/lib/actions/recordVisit";

const ACTIVE_COHORT_STORAGE_KEY = "lms.activeCohortId.v1";

type CohortContextValue = {
  cohorts: Cohort[];
  activeCohort: Cohort | null;
  activeCohortId: string | null;
  isLoading: boolean;
  error: string | null;
  canSwitch: boolean;
  isPrivileged: boolean;
  refresh: () => Promise<void>;
  selectCohort: (cohortId: string) => void;
};

const CohortContext = createContext<CohortContextValue | null>(null);

function isCohort(value: unknown): value is Cohort {
  if (!value || typeof value !== "object") return false;

  const cohort = value as Record<string, unknown>;
  return (
    typeof cohort.id === "string" &&
    typeof cohort.name === "string" &&
    (typeof cohort.starts_at === "string" || cohort.starts_at === null) &&
    (typeof cohort.ends_at === "string" || cohort.ends_at === null) &&
    typeof cohort.is_visible_to_students === "boolean"
  );
}

function getRequestedCohortId() {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("cohort");
}

function clearCohortQuery(pathname: string, router: ReturnType<typeof useRouter>) {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  url.pathname = pathname;
  url.searchParams.delete("cohort");
  router.replace(`${url.pathname}${url.search}${url.hash}`, { scroll: false });
}

export function CohortProvider({
  children,
  userId,
  userLoading,
}: {
  children: React.ReactNode;
  userId: string | null;
  userLoading: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [activeCohortId, setActiveCohortId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setCohorts([]);
      setActiveCohortId(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("get_available_cohorts");

    if (rpcError) {
      setCohorts([]);
      setActiveCohortId(null);
      setError("Не удалось загрузить потоки");
      setIsLoading(false);
      return;
    }

    const availableCohorts = Array.isArray(data) ? data.filter(isCohort) : [];
    setCohorts(availableCohorts);

    const requestedCohortId = getRequestedCohortId();
    const requestedCohort = availableCohorts.find(
      (cohort) => cohort.id === requestedCohortId
    );
    const hasPrivilegedCohort = availableCohorts.some(
      (cohort) => !cohort.is_visible_to_students
    );
    const requestedIsAllowed = Boolean(
      requestedCohort && (requestedCohort.is_visible_to_students || hasPrivilegedCohort)
    );

    let nextCohortId = requestedIsAllowed ? requestedCohortId : null;

    if (!nextCohortId && typeof window !== "undefined") {
      const storedCohortId = window.localStorage.getItem(ACTIVE_COHORT_STORAGE_KEY);
      if (storedCohortId && availableCohorts.some((cohort) => cohort.id === storedCohortId)) {
        nextCohortId = storedCohortId;
      }
    }

    nextCohortId = nextCohortId ?? availableCohorts[0]?.id ?? null;
    setActiveCohortId(nextCohortId);

    if (nextCohortId && typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_COHORT_STORAGE_KEY, nextCohortId);
    }

    if (requestedCohortId && !requestedIsAllowed) {
      clearCohortQuery(pathname, router);
    }

    setIsLoading(false);
  }, [pathname, router, userId]);

  useEffect(() => {
    if (userLoading) return;
    void refresh();
  }, [refresh, userLoading]);

  useEffect(() => {
    if (!userId || !activeCohortId || isLoading) return;
    const activeCohort = cohorts.find((cohort) => cohort.id === activeCohortId);
    void recordVisit(userId, activeCohortId, activeCohort?.starts_at);
  }, [activeCohortId, cohorts, isLoading, userId]);

  const selectCohort = useCallback(
    (cohortId: string) => {
      if (!cohorts.some((cohort) => cohort.id === cohortId)) return;

      setActiveCohortId(cohortId);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(ACTIVE_COHORT_STORAGE_KEY, cohortId);
      }

      const canUseCohortQuery = cohorts.some(
        (cohort) => !cohort.is_visible_to_students
      );

      if (canUseCohortQuery) {
        const url = new URL(window.location.href);
        url.pathname = pathname;
        url.searchParams.set("cohort", cohortId);
        router.replace(`${url.pathname}${url.search}${url.hash}`, { scroll: false });
      } else {
        clearCohortQuery(pathname, router);
      }
    },
    [cohorts, pathname, router]
  );

  const value = useMemo<CohortContextValue>(
    () => ({
      cohorts,
      activeCohort: cohorts.find((cohort) => cohort.id === activeCohortId) ?? null,
      activeCohortId,
      isLoading: userLoading || isLoading,
      error,
      canSwitch: cohorts.length > 1,
      isPrivileged: cohorts.some((cohort) => !cohort.is_visible_to_students),
      refresh,
      selectCohort,
    }),
    [activeCohortId, cohorts, error, isLoading, refresh, selectCohort, userLoading]
  );

  return <CohortContext.Provider value={value}>{children}</CohortContext.Provider>;
}

export function useCohort() {
  const context = useContext(CohortContext);
  if (!context) {
    throw new Error("useCohort must be used inside CohortProvider");
  }
  return context;
}
