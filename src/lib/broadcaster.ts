export interface VoteBroadcastPayload {
  type: "VOTE_CAST";
  candidateId: string;
  candidateName: string;
  studentId: string;
  newVoteCount: number;
  totalVotes: number;
  voterHint: string;
  timestamp: string;
}

type Listener = (payload: VoteBroadcastPayload) => void;

class VoteBroadcaster {
  private listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  broadcast(payload: VoteBroadcastPayload): void {
    for (const listener of this.listeners) {
      try {
        listener(payload);
      } catch {
        this.listeners.delete(listener);
      }
    }
  }

  get clientCount(): number {
    return this.listeners.size;
  }
}

const globalForBroadcaster = globalThis as unknown as {
  __fptVoteBroadcaster?: VoteBroadcaster;
};

export const voteBroadcaster =
  globalForBroadcaster.__fptVoteBroadcaster ?? new VoteBroadcaster();

if (!globalForBroadcaster.__fptVoteBroadcaster) {
  globalForBroadcaster.__fptVoteBroadcaster = voteBroadcaster;
}
