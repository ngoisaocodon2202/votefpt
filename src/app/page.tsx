import { Suspense } from "react";
import Image from "next/image";
import { connection } from "next/server";
import { getCachedCandidatesPayload } from "@/lib/voting-data";
import { getCachedNewsArticles } from "@/lib/news-store";
import { VotingLandingClient } from "@/components/VotingLandingClient";

async function DynamicVotingContent() {
  await connection();

  const [candidatesPayload, initialNews] = await Promise.all([
    getCachedCandidatesPayload(),
    getCachedNewsArticles(),
  ]);

  return (
    <VotingLandingClient
      initialCandidates={candidatesPayload.candidates}
      initialTotalVotes={candidatesPayload.totalVotes}
      initialNews={initialNews}
    />
  );
}

function LandingShellFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
      <Image
        src="/images/fpt-logo.png"
        alt="Logo FPT Polytechnic Đồng Nai"
        width={136}
        height={83}
        preload
        className="mb-5 h-12 w-auto object-contain animate-pulse"
      />
      <p className="text-xs sm:text-sm font-bold tracking-wider text-[#F26F21] uppercase whitespace-nowrap">
        Đang tải Cổng Bình Chọn FPT Polytechnic Đồng Nai...
      </p>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<LandingShellFallback />}>
      <DynamicVotingContent />
    </Suspense>
  );
}
