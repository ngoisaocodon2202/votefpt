"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import type {
  CandidatesApiResponse,
  LiveVoteFeedItem,
  RankedCandidate,
  VoteStatusResponse,
} from "@/types/voting";
import type { VoteBroadcastPayload } from "@/lib/broadcaster";
import { fireFptVoteConfetti } from "@/components/motion/MotionPrimitives";

const publicFetcher = async <T,>(url: string): Promise<T> => {
  // Allow Vercel Edge CDN s-maxage caching on public endpoints
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
};

const privateFetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
};

function sortAndRank(list: RankedCandidate[]): RankedCandidate[] {
  return [...list]
    .sort((a, b) => {
      if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
      return a.studentId.localeCompare(b.studentId);
    })
    .map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
}

interface UseRealtimeVotingOptions {
  initialCandidates: RankedCandidate[];
  initialTotalVotes: number;
}

export function useRealtimeVoting({
  initialCandidates,
  initialTotalVotes,
}: UseRealtimeVotingOptions) {
  const { data: session, status: sessionStatus } = useSession();

  const [sseConnected, setSseConnected] = useState(false);
  const [pollIntervalMs, setPollIntervalMs] = useState(10000);
  const [votingCandidateId, setVotingCandidateId] = useState<string | null>(
    null
  );
  const [liveFeed, setLiveFeed] = useState<LiveVoteFeedItem[]>([]);
  const [toastMessage, setToastMessage] = useState<{
    id: string;
    title: string;
    subtitle: string;
    tone: "success" | "warning" | "live";
  } | null>(null);
  const [authModalCandidate, setAuthModalCandidate] =
    useState<RankedCandidate | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const serverlessSyncRef = useRef(false);
  const prevVoteCountsRef = useRef<Map<string, number> | null>(null);

  const fallbackData = useMemo<CandidatesApiResponse>(
    () => ({
      candidates: sortAndRank(initialCandidates),
      totalVotes: initialTotalVotes,
      updatedAt: "",
    }),
    [initialCandidates, initialTotalVotes]
  );

  const { data: candidatesData, mutate: mutateCandidates } =
    useSWR<CandidatesApiResponse>("/api/candidates", publicFetcher, {
      fallbackData,
      refreshInterval: pollIntervalMs,
      refreshWhenHidden: false,
      refreshWhenOffline: false,
      revalidateOnFocus: true,
      dedupingInterval: 3000,
      onSuccess: (fresh) => {
        if (!prevVoteCountsRef.current) {
          const seedMap = new Map<string, number>();
          for (const c of initialCandidates) {
            seedMap.set(c.id, c.voteCount);
          }
          prevVoteCountsRef.current = seedMap;
        }

        const prevMap = prevVoteCountsRef.current;
        const detectedItems: LiveVoteFeedItem[] = [];

        for (const c of fresh.candidates) {
          const prevCount = prevMap.get(c.id) ?? c.voteCount;
          if (serverlessSyncRef.current && c.voteCount > prevCount) {
            detectedItems.push({
              id: `${fresh.updatedAt || Date.now()}-${c.id}-${c.voteCount}`,
              candidateId: c.id,
              candidateName: c.fullName,
              studentId: c.studentId,
              newVoteCount: c.voteCount,
              voterHint: "Khán giả FPoly",
              timestamp: fresh.updatedAt || new Date().toISOString(),
            });
          }
          prevMap.set(c.id, c.voteCount);
        }

        if (detectedItems.length > 0) {
          setLiveFeed((prev) => [...detectedItems, ...prev].slice(0, 6));
        }
      },
    });

  // Only query private user quota when user is actually signed in with Google.
  // Eliminates 100% of `/api/votes/status` serverless invocations for anonymous visitors!
  const { data: voteStatus, mutate: mutateVoteStatus } =
    useSWR<VoteStatusResponse>(
      sessionStatus === "authenticated" ? "/api/votes/status" : null,
      privateFetcher,
      {
        revalidateOnFocus: true,
        refreshWhenHidden: false,
        refreshWhenOffline: false,
        dedupingInterval: 5000,
      }
    );

  const showToast = useCallback(
    (
      title: string,
      subtitle: string,
      tone: "success" | "warning" | "live" = "success"
    ) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToastMessage({ id, title, subtitle, tone });
    },
    []
  );

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage((prev) => (prev?.id === toastMessage.id ? null : prev));
    }, 4200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Connect to SSE locally or gracefully switch to zero-overhead Edge SWR sync on Vercel Free
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const connect = () => {
      if (disposed || serverlessSyncRef.current) return;
      eventSource = new EventSource("/api/stream");

      eventSource.onopen = () => {
        setSseConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as
            | { type: "CONNECTED"; timestamp: string }
            | {
                type: "SERVERLESS_SYNC";
                pollIntervalMs?: number;
                timestamp: string;
              }
            | VoteBroadcastPayload;

          if (payload.type === "SERVERLESS_SYNC") {
            // Running on Vercel Serverless: close EventSource cleanly so no Lambda
            // stays open burning Function Duration quota, and rely on Edge-cached SWR!
            serverlessSyncRef.current = true;
            setSseConnected(true);
            if (payload.pollIntervalMs && payload.pollIntervalMs >= 5000) {
              setPollIntervalMs(payload.pollIntervalMs);
            }
            eventSource?.close();
            eventSource = null;
            return;
          }

          if (payload.type === "CONNECTED") {
            setSseConnected(true);
            return;
          }

          if (payload.type === "VOTE_CAST") {
            prevVoteCountsRef.current?.set(
              payload.candidateId,
              payload.newVoteCount
            );

            mutateCandidates((current) => {
              const base = current ?? fallbackData;
              const updatedList = base.candidates.map((c) =>
                c.id === payload.candidateId
                  ? {
                      ...c,
                      voteCount: Math.max(c.voteCount, payload.newVoteCount),
                    }
                  : c
              );
              const ranked = sortAndRank(updatedList);
              const computedTotal = ranked.reduce(
                (acc, item) => acc + item.voteCount,
                0
              );
              return {
                candidates: ranked,
                totalVotes: Math.max(computedTotal, payload.totalVotes),
                updatedAt: payload.timestamp,
              };
            }, false);

            const feedItem: LiveVoteFeedItem = {
              id: `${payload.timestamp}-${payload.candidateId}`,
              candidateId: payload.candidateId,
              candidateName: payload.candidateName,
              studentId: payload.studentId,
              newVoteCount: payload.newVoteCount,
              voterHint: payload.voterHint,
              timestamp: payload.timestamp,
            };

            setLiveFeed((prev) => [feedItem, ...prev].slice(0, 6));
          }
        } catch {
          // Ignore malformed event
        }
      };

      eventSource.onerror = () => {
        if (serverlessSyncRef.current || disposed) {
          eventSource?.close();
          return;
        }
        setSseConnected(false);
        eventSource?.close();
        reconnectTimer = setTimeout(connect, 8000);
      };
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      eventSource?.close();
    };
  }, [fallbackData, mutateCandidates]);

  const openSignInPrompt = useCallback((candidate?: RankedCandidate | null) => {
    setAuthModalCandidate(candidate ?? null);
    setIsAuthModalOpen(true);
  }, []);

  const closeSignInPrompt = useCallback(() => {
    setIsAuthModalOpen(false);
    setAuthModalCandidate(null);
  }, []);

  const handleMidnightReset = useCallback(() => {
    if (sessionStatus === "authenticated") {
      mutateVoteStatus();
    }
    mutateCandidates();
    showToast(
      "Đã làm mới lượt bình chọn ngày mới!",
      "Bạn vừa nhận lại 03 lượt bình chọn mới hôm nay.",
      "success"
    );
  }, [mutateCandidates, mutateVoteStatus, sessionStatus, showToast]);

  const sessionUserName = session?.user?.name || "Bạn";

  const castVote = useCallback(
    async (
      candidate: RankedCandidate,
      originRect?: DOMRect | null
    ): Promise<boolean> => {
      const isAuthenticated =
        sessionStatus === "authenticated" || Boolean(voteStatus?.authenticated);

      if (!isAuthenticated) {
        openSignInPrompt(candidate);
        return false;
      }

      const remaining = voteStatus?.remainingVotes ?? 3;
      if (remaining <= 0) {
        showToast(
          "Đã hết 03 lượt bình chọn hôm nay",
          "Vui lòng chờ đồng hồ đếm ngược về 00:00:00 để tiếp tục bình chọn.",
          "warning"
        );
        return false;
      }

      if (votingCandidateId) return false;
      setVotingCandidateId(candidate.id);

      try {
        const res = await fetch("/api/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidateId: candidate.id }),
        });

        const data = await res.json();

        if (res.status === 401) {
          openSignInPrompt(candidate);
          return false;
        }

        if (res.status === 429 || data.code === "DAILY_LIMIT_REACHED") {
          await mutateVoteStatus();
          showToast(
            "Đã chạm giới hạn 03 lượt/ngày",
            "Hệ thống sẽ mở lại 03 lượt mới vào đúng 00:00:00 đêm nay.",
            "warning"
          );
          return false;
        }

        if (!res.ok) {
          showToast(
            "Không thể ghi nhận bình chọn",
            data.error || "Vui lòng thử lại sau giây lát.",
            "warning"
          );
          return false;
        }

        // Fire FPT confetti burst from button position!
        fireFptVoteConfetti(originRect);

        const nextCount = data.newVoteCount ?? candidate.voteCount + 1;
        prevVoteCountsRef.current?.set(candidate.id, nextCount);

        // Immediately sync candidate leaderboard & user daily quota
        mutateCandidates((current) => {
          const base = current ?? fallbackData;
          const updated = base.candidates.map((c) =>
            c.id === candidate.id ? { ...c, voteCount: nextCount } : c
          );
          const ranked = sortAndRank(updated);
          return {
            candidates: ranked,
            totalVotes:
              data.totalVotes ??
              ranked.reduce((sum, item) => sum + item.voteCount, 0),
            updatedAt: new Date().toISOString(),
          };
        }, false);

        if (serverlessSyncRef.current) {
          const selfFeedItem: LiveVoteFeedItem = {
            id: `${Date.now()}-${candidate.id}`,
            candidateId: candidate.id,
            candidateName: candidate.fullName,
            studentId: candidate.studentId,
            newVoteCount: nextCount,
            voterHint: sessionUserName,
            timestamp: new Date().toISOString(),
          };
          setLiveFeed((prev) => [selfFeedItem, ...prev].slice(0, 6));
        }

        mutateVoteStatus(
          (prev) =>
            prev
              ? {
                  ...prev,
                  votesUsedToday: data.votesUsedToday,
                  remainingVotes: data.remainingVotes,
                  votedCandidateIdsToday: data.votedCandidateIdsToday,
                  nextResetAt: data.nextResetAt || prev.nextResetAt,
                }
              : prev,
          false
        );

        const leftText =
          data.remainingVotes > 0
            ? `Bạn còn ${data.remainingVotes}/3 lượt bình chọn hôm nay.`
            : "Bạn đã hoàn thành 3/3 lượt bình chọn hôm nay!";

        showToast(
          `Đã bình chọn cho ${candidate.fullName}!`,
          leftText,
          "success"
        );

        return true;
      } catch {
        showToast(
          "Lỗi kết nối mạng",
          "Không thể gửi phiếu bầu lúc này, vui lòng kiểm tra kết nối.",
          "warning"
        );
        return false;
      } finally {
        setVotingCandidateId(null);
      }
    },
    [
      sessionStatus,
      sessionUserName,
      voteStatus,
      votingCandidateId,
      openSignInPrompt,
      showToast,
      mutateCandidates,
      mutateVoteStatus,
      fallbackData,
    ]
  );

  const candidates = candidatesData?.candidates ?? fallbackData.candidates;
  const totalVotes = candidatesData?.totalVotes ?? fallbackData.totalVotes;
  const maxDailyVotes = voteStatus?.maxDailyVotes ?? 3;
  const votesUsedToday = voteStatus?.votesUsedToday ?? 0;
  const remainingVotes =
    sessionStatus === "authenticated" || voteStatus?.authenticated
      ? (voteStatus?.remainingVotes ?? 3)
      : 3;
  const isAuthenticated =
    sessionStatus === "authenticated" || Boolean(voteStatus?.authenticated);
  const isDailyLimitReached = isAuthenticated && remainingVotes <= 0;
  const votedCandidateIdsToday = voteStatus?.votedCandidateIdsToday ?? [];
  const nextResetAt = voteStatus?.nextResetAt ?? null;

  return {
    candidates,
    totalVotes,
    sseConnected,
    liveFeed,
    toastMessage,
    dismissToast: () => setToastMessage(null),
    isAuthenticated,
    sessionUser:
      voteStatus?.user ??
      (session?.user
        ? {
            id: session.user.id || "",
            email: session.user.email || "",
            name: session.user.name ?? null,
            avatarUrl: session.user.image ?? null,
          }
        : null),
    maxDailyVotes,
    votesUsedToday,
    remainingVotes,
    isDailyLimitReached,
    votedCandidateIdsToday,
    nextResetAt,
    votingCandidateId,
    castVote,
    isAuthModalOpen,
    authModalCandidate,
    openSignInPrompt,
    closeSignInPrompt,
    handleMidnightReset,
  };
}
