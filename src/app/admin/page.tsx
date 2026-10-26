import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { connection } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { getUncachedCandidatesPayload } from "@/lib/voting-data";
import { getAllNewsArticles } from "@/lib/news-store";
import { AdminPortalClient } from "@/components/admin/AdminPortalClient";
import type { RankedCandidate } from "@/types/voting";
import type { NewsArticle } from "@/data/contest-content";

export const metadata: Metadata = {
  title: "Quản Trị Hệ Thống | FPT Polytechnic Đồng Nai",
  description:
    "Cổng quản trị bài viết tin tức và hồ sơ thí sinh FPT Polytechnic Đồng Nai.",
};

async function DynamicAdminPortal() {
  await connection();

  const admin = await getAuthenticatedAdmin();
  let initialCandidates: RankedCandidate[] = [];
  let initialArticles: NewsArticle[] = [];

  if (admin) {
    try {
      const [candidatesPayload, articles] = await Promise.all([
        getUncachedCandidatesPayload(),
        getAllNewsArticles(),
      ]);

      initialCandidates = candidatesPayload.candidates;
      initialArticles = articles;
    } catch (error) {
      console.error("Admin initial data fetch warning:", error);
    }
  }

  return (
    <AdminPortalClient
      initialAuthenticated={Boolean(admin)}
      initialUsername={admin?.username ?? null}
      initialCandidates={initialCandidates}
      initialArticles={initialArticles}
    />
  );
}

function AdminLoadingFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FFFDFB] px-4 text-center">
      <Image
        src="/images/fpt-logo.png"
        alt="Logo FPT Polytechnic Đồng Nai"
        width={120}
        height={74}
        preload
        className="mb-4 h-11 w-auto object-contain animate-pulse"
      />
      <p className="text-xs sm:text-sm font-bold tracking-wider text-[#F26F21] uppercase whitespace-nowrap">
        Đang tải Cổng Quản Trị FPT Polytechnic Đồng Nai...
      </p>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminLoadingFallback />}>
      <DynamicAdminPortal />
    </Suspense>
  );
}
