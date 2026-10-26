export interface RankedCandidate {
  id: string;
  fullName: string;
  dob: string;
  studentId: string;
  major: string;
  avatarUrl: string;
  bio: string | null;
  voteCount: number;
  createdAt?: string | Date | null;
  rank: number;
}

export interface CandidatesApiResponse {
  candidates: RankedCandidate[];
  totalVotes: number;
  updatedAt: string;
}

export interface VoteStatusResponse {
  authenticated: boolean;
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
  } | null;
  maxDailyVotes: number;
  votesUsedToday: number;
  remainingVotes: number;
  votedCandidateIdsToday: string[];
  todayDate: string;
  nextResetAt: string;
  msUntilReset: number;
}

export interface LiveVoteFeedItem {
  id: string;
  candidateId: string;
  candidateName: string;
  studentId: string;
  newVoteCount: number;
  voterHint: string;
  timestamp: string;
}
