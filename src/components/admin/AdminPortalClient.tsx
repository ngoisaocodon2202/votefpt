"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  GraduationCap,
  IdCard,
  ImagePlus,
  KeyRound,
  Loader2,
  LockKeyhole,
  LogOut,
  MapPin,
  Newspaper,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
  UserRound,
  Users,
  Vote,
  X,
} from "lucide-react";
import type { RankedCandidate } from "@/types/voting";
import type { NewsArticle } from "@/data/contest-content";
import {
  compressImageForUpload,
  isUnoptimizedImageSrc,
} from "@/lib/image-utils";

interface AdminPortalClientProps {
  initialAuthenticated: boolean;
  initialUsername: string | null;
  initialCandidates: RankedCandidate[];
  initialArticles: NewsArticle[];
}

type AdminTab = "candidates" | "news";

interface CandidateFormState {
  id: string | null;
  fullName: string;
  studentId: string;
  dob: string;
  major: string;
  avatarUrl: string;
  bio: string;
  voteCount: string;
}

interface ArticleFormState {
  id: string | null;
  title: string;
  category: string;
  campus: string;
  publishedAt: string;
  readTime: string;
  imageUrl: string;
  excerpt: string;
  contentText: string;
  featured: boolean;
}

const MAJOR_SUGGESTIONS = [
  "Phát triển Phần mềm (CNTT)",
  "Lập trình Web (CNTT)",
  "Ứng dụng Phần mềm (CNTT)",
  "Thiết kế Đồ họa",
  "Digital Marketing",
  "PR & Tổ chức Sự kiện",
  "Quản trị Kinh doanh",
  "Logistics",
];

const CATEGORY_SUGGESTIONS = [
  "TIÊU ĐIỂM CƠ SỞ",
  "DỰ ÁN THỰC CHIẾN",
  "ONG VÀNG SÁNG TẠO",
  "GIẢI THƯỞNG",
  "SỰ KIỆN GALA",
];

function sortAndRankCandidates(list: RankedCandidate[]): RankedCandidate[] {
  return [...list]
    .sort((a, b) => {
      if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
      return a.studentId.localeCompare(b.studentId);
    })
    .map((c, idx) => ({ ...c, rank: idx + 1 }));
}

function formatViDate(dob: string): string {
  if (!dob) return "";
  const parts = dob.split("-");
  if (parts.length !== 3) return dob;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getTodayFormattedVi(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function AdminPortalClient({
  initialAuthenticated,
  initialUsername,
  initialCandidates,
  initialArticles,
}: AdminPortalClientProps) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [adminUsername, setAdminUsername] = useState<string>(
    initialUsername || "admin"
  );

  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Data state
  const [candidates, setCandidates] = useState<RankedCandidate[]>(() =>
    sortAndRankCandidates(initialCandidates)
  );
  const [articles, setArticles] = useState<NewsArticle[]>(initialArticles);
  const [activeTab, setActiveTab] = useState<AdminTab>("candidates");
  const [searchQuery, setSearchQuery] = useState("");

  // Toast feedback
  const [toast, setToast] = useState<{
    id: string;
    message: string;
    tone: "success" | "error";
  } | null>(null);

  // Modals state
  const [candidateModalOpen, setCandidateModalOpen] = useState(false);
  const [candidateForm, setCandidateForm] = useState<CandidateFormState>({
    id: null,
    fullName: "",
    studentId: "",
    dob: "2005-01-01",
    major: "Phát triển Phần mềm (CNTT)",
    avatarUrl: "/images/candidates/candidate-1.jpg",
    bio: "",
    voteCount: "0",
  });
  const [candidateFormError, setCandidateFormError] = useState<string | null>(
    null
  );
  const [savingCandidate, setSavingCandidate] = useState(false);
  const [uploadingCandidateImg, setUploadingCandidateImg] = useState(false);
  const candidateFileRef = useRef<HTMLInputElement | null>(null);

  const [articleModalOpen, setArticleModalOpen] = useState(false);
  const [articleForm, setArticleForm] = useState<ArticleFormState>({
    id: null,
    title: "",
    category: "TIÊU ĐIỂM CƠ SỞ",
    campus: "FPoly Đồng Nai",
    publishedAt: getTodayFormattedVi(),
    readTime: "3 phút đọc",
    imageUrl: "/images/news/news-1.jpg",
    excerpt: "",
    contentText: "",
    featured: false,
  });
  const [articleFormError, setArticleFormError] = useState<string | null>(null);
  const [savingArticle, setSavingArticle] = useState(false);
  const [uploadingArticleImg, setUploadingArticleImg] = useState(false);
  const articleFileRef = useRef<HTMLInputElement | null>(null);

  // Delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "candidate" | "article";
    id: string;
    title: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const toastSeqRef = useRef(0);

  const showNotice = useCallback(
    (message: string, tone: "success" | "error" = "success") => {
      toastSeqRef.current += 1;
      setToast({ id: `notice-${toastSeqRef.current}`, message, tone });
    },
    []
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast((prev) => (prev?.id === toast.id ? null : prev));
    }, 3800);
    return () => clearTimeout(timer);
  }, [toast]);

  // Body scroll lock & Esc handler when any modal is open
  const anyModalOpen =
    candidateModalOpen || articleModalOpen || Boolean(deleteTarget);

  useEffect(() => {
    if (!anyModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCandidateModalOpen(false);
        setArticleModalOpen(false);
        setDeleteTarget(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [anyModalOpen]);

  const refreshAdminData = async () => {
    try {
      const [candRes, newsRes] = await Promise.all([
        fetch("/api/admin/candidates", { cache: "no-store" }),
        fetch("/api/admin/news", { cache: "no-store" }),
      ]);
      if (candRes.ok) {
        const candData = (await candRes.json()) as {
          candidates: RankedCandidate[];
        };
        setCandidates(sortAndRankCandidates(candData.candidates));
      }
      if (newsRes.ok) {
        const newsData = (await newsRes.json()) as { articles: NewsArticle[] };
        setArticles(newsData.articles);
      }
    } catch {
      // Keep existing state on transient error
    }
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
        }),
      });

      const data = (await res.json()) as {
        authenticated?: boolean;
        username?: string;
        error?: string;
      };

      if (!res.ok || !data.authenticated) {
        setLoginError(
          data.error || "Tài khoản hoặc mật khẩu quản trị không chính xác."
        );
        return;
      }

      setAuthenticated(true);
      setAdminUsername(data.username || loginUsername);
      setLoginPassword("");
      await refreshAdminData();
      showNotice("Đăng nhập Cổng Quản Trị thành công!");
    } catch {
      setLoginError("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setAuthenticated(false);
    setLoginPassword("");
  };

  const uploadImageFile = async (
    file: File,
    onSuccessUrl: (url: string) => void,
    setUploading: (val: boolean) => void,
    setError: (msg: string | null) => void
  ) => {
    setError(null);
    setUploading(true);
    try {
      const optimizedFile = await compressImageForUpload(file);
      const formData = new FormData();
      formData.append("file", optimizedFile);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error || "Tải ảnh thất bại.");
        return;
      }
      onSuccessUrl(data.url);
      showNotice("Đã tối ưu & tải ảnh lên thành công!");
    } catch {
      setError("Lỗi kết nối khi tải ảnh lên.");
    } finally {
      setUploading(false);
    }
  };

  // Candidate CRUD handlers
  const openCreateCandidate = () => {
    setCandidateFormError(null);
    setCandidateForm({
      id: null,
      fullName: "",
      studentId: "PS38",
      dob: "2005-05-15",
      major: "Phát triển Phần mềm (CNTT)",
      avatarUrl: "/images/candidates/candidate-1.jpg",
      bio: "",
      voteCount: "0",
    });
    setCandidateModalOpen(true);
  };

  const openEditCandidate = (c: RankedCandidate) => {
    setCandidateFormError(null);
    setCandidateForm({
      id: c.id,
      fullName: c.fullName,
      studentId: c.studentId,
      dob: c.dob,
      major: c.major,
      avatarUrl: c.avatarUrl,
      bio: c.bio || "",
      voteCount: String(c.voteCount),
    });
    setCandidateModalOpen(true);
  };

  const handleSaveCandidate = async (e: FormEvent) => {
    e.preventDefault();
    setCandidateFormError(null);
    setSavingCandidate(true);

    const isEdit = Boolean(candidateForm.id);
    const endpoint = isEdit
      ? `/api/admin/candidates/${candidateForm.id}`
      : "/api/admin/candidates";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: candidateForm.fullName,
          studentId: candidateForm.studentId,
          dob: candidateForm.dob,
          major: candidateForm.major,
          avatarUrl: candidateForm.avatarUrl,
          bio: candidateForm.bio,
          voteCount: Number(candidateForm.voteCount || 0),
        }),
      });

      const data = (await res.json()) as {
        candidate?: RankedCandidate;
        error?: string;
      };

      if (res.status === 401) {
        setAuthenticated(false);
        setCandidateModalOpen(false);
        return;
      }

      if (!res.ok || !data.candidate) {
        setCandidateFormError(
          data.error || "Không thể lưu thông tin thí sinh."
        );
        return;
      }

      const saved = data.candidate;
      setCandidates((prev) => {
        const next = isEdit
          ? prev.map((item) =>
              item.id === saved.id ? { ...saved, rank: item.rank } : item
            )
          : [...prev, { ...saved, rank: prev.length + 1 }];
        return sortAndRankCandidates(next);
      });

      setCandidateModalOpen(false);
      showNotice(
        isEdit
          ? `Đã cập nhật hồ sơ thí sinh ${saved.fullName}!`
          : `Đã thêm thí sinh mới ${saved.fullName}!`
      );
    } catch {
      setCandidateFormError("Lỗi kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setSavingCandidate(false);
    }
  };

  // Article CRUD handlers
  const openCreateArticle = () => {
    setArticleFormError(null);
    setArticleForm({
      id: null,
      title: "",
      category: "TIÊU ĐIỂM CƠ SỞ",
      campus: "FPoly Đồng Nai",
      publishedAt: getTodayFormattedVi(),
      readTime: "3 phút đọc",
      imageUrl: "/images/news/news-1.jpg",
      excerpt: "",
      contentText: "",
      featured: articles.length === 0,
    });
    setArticleModalOpen(true);
  };

  const openEditArticle = (a: NewsArticle) => {
    setArticleFormError(null);
    setArticleForm({
      id: a.id,
      title: a.title,
      category: a.category,
      campus: a.campus,
      publishedAt: a.publishedAt,
      readTime: a.readTime,
      imageUrl: a.imageUrl,
      excerpt: a.excerpt,
      contentText: a.content.join("\n\n"),
      featured: Boolean(a.featured),
    });
    setArticleModalOpen(true);
  };

  const handleSaveArticle = async (e: FormEvent) => {
    e.preventDefault();
    setArticleFormError(null);
    setSavingArticle(true);

    const isEdit = Boolean(articleForm.id);
    const endpoint = isEdit
      ? `/api/admin/news/${articleForm.id}`
      : "/api/admin/news";
    const method = isEdit ? "PUT" : "POST";

    const paragraphs = articleForm.contentText
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: articleForm.title,
          category: articleForm.category,
          campus: articleForm.campus,
          publishedAt: articleForm.publishedAt,
          readTime: articleForm.readTime,
          imageUrl: articleForm.imageUrl,
          excerpt: articleForm.excerpt,
          content: paragraphs,
          featured: articleForm.featured,
        }),
      });

      const data = (await res.json()) as {
        article?: NewsArticle;
        error?: string;
      };

      if (res.status === 401) {
        setAuthenticated(false);
        setArticleModalOpen(false);
        return;
      }

      if (!res.ok || !data.article) {
        setArticleFormError(data.error || "Không thể lưu bài viết.");
        return;
      }

      await refreshAdminData();
      setArticleModalOpen(false);
      showNotice(
        isEdit
          ? "Đã cập nhật nội dung bài viết!"
          : "Đã đăng bài viết mới thành công!"
      );
    } catch {
      setArticleFormError("Lỗi kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setSavingArticle(false);
    }
  };

  const handleSetFeaturedArticle = async (article: NewsArticle) => {
    if (article.featured) return;
    try {
      const res = await fetch(`/api/admin/news/${article.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...article,
          featured: true,
        }),
      });
      if (res.ok) {
        await refreshAdminData();
        showNotice("Đã đặt làm bài viết Tiêu điểm trên trang chủ!");
      }
    } catch {
      showNotice("Không thể cập nhật trạng thái tiêu điểm.", "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    const endpoint =
      deleteTarget.type === "candidate"
        ? `/api/admin/candidates/${deleteTarget.id}`
        : `/api/admin/news/${deleteTarget.id}`;

    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      if (res.status === 401) {
        setAuthenticated(false);
        setDeleteTarget(null);
        return;
      }
      if (!res.ok) {
        showNotice("Không thể xóa mục đã chọn.", "error");
        return;
      }

      if (deleteTarget.type === "candidate") {
        setCandidates((prev) =>
          sortAndRankCandidates(
            prev.filter((item) => item.id !== deleteTarget.id)
          )
        );
        showNotice("Đã xóa hồ sơ thí sinh.");
      } else {
        setArticles((prev) =>
          prev.filter((item) => item.id !== deleteTarget.id)
        );
        showNotice("Đã xóa bài viết tin tức.");
      }
      setDeleteTarget(null);
    } catch {
      showNotice("Lỗi kết nối khi xóa dữ liệu.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const totalVotes = useMemo(
    () => candidates.reduce((acc, item) => acc + item.voteCount, 0),
    [candidates]
  );

  const filteredCandidates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.studentId.toLowerCase().includes(q) ||
        c.major.toLowerCase().includes(q)
    );
  }, [candidates, searchQuery]);

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.campus.toLowerCase().includes(q)
    );
  }, [articles, searchQuery]);

  // =========================================================================
  // 1. DEDICATED ADMIN LOGIN VIEW (/admin)
  // =========================================================================
  if (!authenticated) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#FFFDFB] px-4 py-10 overflow-x-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 overflow-hidden"
        >
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-[#F26F21]/10 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-md rounded-3xl border border-[#F26F21]/30 bg-white p-5 sm:p-8 shadow-[0_24px_64px_-16px_rgba(242,111,33,0.22)]"
        >
          <div className="flex flex-col items-center text-center">
            <Image
              src="/images/fpt-logo.png"
              alt="Logo FPT Polytechnic Đồng Nai"
              width={118}
              height={72}
              preload
              className="h-10 sm:h-11 w-auto object-contain"
            />

            <span className="mt-3.5 inline-flex items-center gap-1.5 rounded-full border border-[#F26F21]/35 bg-[#FFF4EC] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#F26F21] whitespace-nowrap">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">
                CỔNG QUẢN TRỊ • FPOLY ĐỒNG NAI
              </span>
            </span>

            <h1 className="mt-3 text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
              Đăng Nhập Quản Trị Viên
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 whitespace-nowrap">
              Quản lý bài viết tin tức &amp; hồ sơ thí sinh
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
            {loginError && (
              <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-bold text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold text-slate-700 whitespace-nowrap">
                <UserRound className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
                <span className="whitespace-nowrap">Tài khoản quản trị</span>
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Nhập tài khoản admin..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#F26F21] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold text-slate-700 whitespace-nowrap">
                <KeyRound className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
                <span className="whitespace-nowrap">Mật khẩu</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Nhập mật khẩu quản trị..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-10 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#F26F21] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label="Hiện hoặc ẩn mật khẩu"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#F26F21] cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#F26F21] px-5 text-sm font-extrabold text-white shadow-[0_12px_28px_-6px_rgba(242,111,33,0.5)] transition-all hover:bg-[#D9580F] disabled:opacity-60 cursor-pointer whitespace-nowrap"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  <span className="whitespace-nowrap">Đang xác thực...</span>
                </>
              ) : (
                <>
                  <LockKeyhole className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">Đăng nhập Quản trị</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-5 border-t border-slate-100 pt-4 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-[#F26F21] whitespace-nowrap"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
              <span className="whitespace-nowrap">
                Quay về trang bình chọn công khai
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // =========================================================================
  // 2. AUTHENTICATED ADMIN DASHBOARD (/admin)
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#FFFDFB] text-slate-900 overflow-x-hidden">
      {/* Sticky Top Admin Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[#F26F21]/15 bg-white/95 shadow-[0_4px_20px_rgba(15,23,42,0.04)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 sm:h-17 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <Image
              src="/images/fpt-logo.png"
              alt="Logo FPT Polytechnic Đồng Nai"
              width={96}
              height={59}
              preload
              className="h-6 sm:h-8 w-auto object-contain shrink-0"
            />
            <div className="flex flex-col leading-tight min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-base font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
                  ADMIN <span className="text-[#F26F21]">FPOLY</span>
                </span>
                <span className="hidden sm:inline-flex rounded-full border border-[#F26F21]/30 bg-[#FFF4EC] px-2 py-0.5 font-mono text-[10px] font-bold text-[#F26F21] whitespace-nowrap">
                  {adminUsername}
                </span>
              </div>
              <span className="sm:hidden text-[9px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                ĐỒNG NAI • CMS
              </span>
              <span className="hidden sm:block text-[10px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                Quản Trị Nội Dung &amp; Thí Sinh
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <Link
              href="/"
              className="inline-flex h-8.5 sm:h-10 items-center gap-1 sm:gap-1.5 rounded-xl border border-[#F26F21]/30 bg-[#FFF6F0] px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-extrabold text-[#F26F21] transition-colors hover:bg-[#F26F21] hover:text-white whitespace-nowrap"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">Trang chủ</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-8.5 sm:h-10 items-center gap-1 sm:gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-bold text-slate-700 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 cursor-pointer whitespace-nowrap"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            className="fixed right-3.5 left-3.5 sm:left-auto sm:right-5 top-18 sm:top-20 z-50 sm:w-full sm:max-w-sm"
          >
            <div
              className={`flex items-center justify-between gap-2.5 rounded-2xl border bg-white px-4 py-3 shadow-lg ${
                toast.tone === "error"
                  ? "border-red-200 text-red-700"
                  : "border-[#F26F21]/35 text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {toast.tone === "error" ? (
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#F26F21]" />
                )}
                <p className="text-xs sm:text-sm font-bold truncate">
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8 py-6 sm:py-9 space-y-6 sm:space-y-8">
        {/* Page Heading */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F26F21]/30 bg-[#FFF4EC] px-3 py-1 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-[#F26F21] whitespace-nowrap">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">
                FPT POLYTECHNIC ĐỒNG NAI • CMS
              </span>
            </span>
            <h1 className="mt-2 text-[clamp(1.2rem,5vw,2rem)] font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
              Bảng Điều Khiển <span className="text-[#F26F21]">Quản Trị</span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 whitespace-nowrap">
            Mọi thay đổi được đồng bộ trực tiếp lên trang chủ
          </p>
        </div>

        {/* 4 Summary Stat Cards (2x2 on Mobile, 4 cols on Desktop, Zero Wrapping) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="flex flex-col items-center justify-between rounded-2xl border border-[#F26F21]/25 bg-white px-3 py-3.5 sm:p-4 text-center shadow-[0_8px_24px_-12px_rgba(242,111,33,0.16)]">
            <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
              <Users className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
              <span className="whitespace-nowrap">TỔNG THÍ SINH</span>
            </div>
            <p className="mt-1.5 font-mono text-xl sm:text-3xl font-extrabold text-slate-900 whitespace-nowrap">
              {String(candidates.length).padStart(2, "0")}
            </p>
          </div>

          <div className="flex flex-col items-center justify-between rounded-2xl border border-[#F26F21]/25 bg-white px-3 py-3.5 sm:p-4 text-center shadow-[0_8px_24px_-12px_rgba(242,111,33,0.16)]">
            <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
              <Vote className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
              <span className="whitespace-nowrap">TỔNG PHIẾU BẦU</span>
            </div>
            <p className="mt-1.5 font-mono text-xl sm:text-3xl font-extrabold text-slate-900 whitespace-nowrap">
              {totalVotes.toLocaleString("vi-VN")}
            </p>
          </div>

          <div className="flex flex-col items-center justify-between rounded-2xl border border-[#F26F21]/25 bg-white px-3 py-3.5 sm:p-4 text-center shadow-[0_8px_24px_-12px_rgba(242,111,33,0.16)]">
            <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
              <Newspaper className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
              <span className="whitespace-nowrap">SỐ BÀI VIẾT</span>
            </div>
            <p className="mt-1.5 font-mono text-xl sm:text-3xl font-extrabold text-slate-900 whitespace-nowrap">
              {String(articles.length).padStart(2, "0")}
            </p>
          </div>

          <div className="flex flex-col items-center justify-between rounded-2xl border border-[#F26F21]/25 bg-white px-3 py-3.5 sm:p-4 text-center shadow-[0_8px_24px_-12px_rgba(242,111,33,0.16)]">
            <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
              <Star className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
              <span className="whitespace-nowrap">ĐỒNG BỘ DỮ LIỆU</span>
            </div>
            <p className="mt-1.5 text-sm sm:text-xl font-extrabold text-[#F26F21] whitespace-nowrap">
              Cập nhật tức thì
            </p>
          </div>
        </div>

        {/* Control Toolbar: Tabs + Search + Primary Create Action */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-2xl border border-[#F26F21]/20 bg-white p-3 sm:p-3.5 shadow-xs">
          {/* Segmented Tab Switcher */}
          <div className="grid grid-cols-2 sm:inline-flex rounded-xl bg-[#FFF5EE] p-1 gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab("candidates");
                setSearchQuery("");
              }}
              className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 sm:px-4 text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "candidates"
                  ? "bg-[#F26F21] text-white shadow-sm"
                  : "text-slate-700 hover:text-[#F26F21]"
              }`}
            >
              <Users className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">
                Thí sinh ({candidates.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("news");
                setSearchQuery("");
              }}
              className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 sm:px-4 text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "news"
                  ? "bg-[#F26F21] text-white shadow-sm"
                  : "text-slate-700 hover:text-[#F26F21]"
              }`}
            >
              <Newspaper className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">
                Bài viết ({articles.length})
              </span>
            </button>
          </div>

          {/* Search + Create Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 lg:max-w-xl lg:justify-end">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === "candidates"
                    ? "Tìm tên thí sinh, MSSV, ngành..."
                    : "Tìm tiêu đề, chuyên mục bài viết..."
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#F26F21] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#F26F21] cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {activeTab === "candidates" ? (
              <button
                type="button"
                onClick={openCreateCandidate}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#F26F21] px-4 text-xs sm:text-sm font-extrabold text-white shadow-[0_8px_20px_-4px_rgba(242,111,33,0.45)] transition-all hover:bg-[#D9580F] cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">Thêm thí sinh</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={openCreateArticle}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#F26F21] px-4 text-xs sm:text-sm font-extrabold text-white shadow-[0_8px_20px_-4px_rgba(242,111,33,0.45)] transition-all hover:bg-[#D9580F] cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">Thêm bài viết</span>
              </button>
            )}
          </div>
        </div>

        {/* =================================================================== */}
        {/* TAB 1: CANDIDATE MANAGEMENT GRID                                    */}
        {/* =================================================================== */}
        {activeTab === "candidates" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            {filteredCandidates.length === 0 ? (
              <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-white p-10 text-center">
                <p className="text-sm font-bold text-slate-600 whitespace-nowrap">
                  Không tìm thấy thí sinh phù hợp.
                </p>
              </div>
            ) : (
              filteredCandidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="flex items-center gap-3 sm:gap-4 rounded-2xl border border-[#F26F21]/25 bg-white p-3 sm:p-4 shadow-[0_8px_26px_-12px_rgba(15,23,42,0.07)] transition-all hover:border-[#F26F21]"
                >
                  {/* Candidate Portrait */}
                  <div className="relative h-[108px] w-[84px] sm:h-[120px] sm:w-[94px] shrink-0 overflow-hidden rounded-xl bg-orange-50 ring-1 ring-[#F26F21]/20">
                    <Image
                      src={candidate.avatarUrl}
                      alt={candidate.fullName}
                      fill
                      unoptimized={isUnoptimizedImageSrc(candidate.avatarUrl)}
                      sizes="110px"
                      className="object-cover object-top"
                    />
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-[#F26F21] px-2 py-0.5 font-mono text-[10px] font-extrabold text-white shadow-xs whitespace-nowrap">
                      #{candidate.rank}
                    </span>
                  </div>

                  {/* Candidate Info & Actions */}
                  <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch">
                    <div>
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[10px] sm:text-[11px] font-bold text-slate-700 whitespace-nowrap">
                          {candidate.studentId}
                        </span>
                        <span className="rounded-full border border-[#F26F21]/30 bg-[#FFF4EC] px-2 py-0.5 font-mono text-[10px] sm:text-[11px] font-extrabold text-[#F26F21] whitespace-nowrap">
                          {candidate.voteCount.toLocaleString("vi-VN")} phiếu
                        </span>
                      </div>

                      <h3 className="mt-1.5 truncate text-sm sm:text-lg font-extrabold text-slate-900">
                        {candidate.fullName}
                      </h3>

                      <div className="mt-1 flex items-center gap-1.5 min-w-0">
                        <span className="truncate rounded-full border border-[#F26F21]/20 bg-[#FFF8F3] px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-[#D9580F] whitespace-nowrap">
                          {candidate.major}
                        </span>
                        <span className="hidden sm:inline font-mono text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                          • {formatViDate(candidate.dob)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-end gap-2 border-t border-slate-100 pt-2">
                      <button
                        type="button"
                        onClick={() => openEditCandidate(candidate)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#F26F21]/35 bg-[#FFF4EC] px-3 text-xs font-extrabold text-[#F26F21] transition-colors hover:bg-[#F26F21] hover:text-white cursor-pointer whitespace-nowrap"
                      >
                        <Pencil className="h-3.5 w-3.5 shrink-0" />
                        <span className="whitespace-nowrap">Chỉnh sửa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({
                            type: "candidate",
                            id: candidate.id,
                            title: `${candidate.fullName} (${candidate.studentId})`,
                          })
                        }
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 cursor-pointer whitespace-nowrap"
                      >
                        <Trash2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="whitespace-nowrap">Xóa</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: NEWS ARTICLE MANAGEMENT GRID                                 */}
        {/* =================================================================== */}
        {activeTab === "news" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            {filteredArticles.length === 0 ? (
              <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-white p-10 text-center">
                <p className="text-sm font-bold text-slate-600 whitespace-nowrap">
                  Chưa có bài viết nào phù hợp.
                </p>
              </div>
            ) : (
              filteredArticles.map((article) => (
                <div
                  key={article.id}
                  className={`flex flex-col justify-between overflow-hidden rounded-2xl border bg-white p-3.5 sm:p-4 shadow-[0_8px_26px_-12px_rgba(15,23,42,0.07)] transition-all hover:border-[#F26F21] ${
                    article.featured
                      ? "border-2 border-[#F26F21]"
                      : "border-[#F26F21]/25"
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="relative h-22 w-24 sm:h-26 sm:w-32 shrink-0 overflow-hidden rounded-xl bg-orange-50 ring-1 ring-[#F26F21]/15">
                      <Image
                        src={article.imageUrl}
                        alt={article.title}
                        fill
                        unoptimized={isUnoptimizedImageSrc(article.imageUrl)}
                        sizes="140px"
                        className="object-cover"
                      />
                      {article.featured && (
                        <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full bg-[#F26F21] px-2 py-0.5 text-[9.5px] font-extrabold text-white shadow-xs whitespace-nowrap">
                          <Star className="h-2.5 w-2.5 fill-white shrink-0" />
                          <span className="whitespace-nowrap">TIÊU ĐIỂM</span>
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="truncate rounded-full border border-[#F26F21]/30 bg-[#FFF4EC] px-2 py-0.5 text-[10px] font-extrabold text-[#F26F21] whitespace-nowrap">
                          {article.category}
                        </span>
                        <span className="font-mono text-[10px] sm:text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                          {article.publishedAt}
                        </span>
                      </div>

                      <h3 className="mt-1.5 line-clamp-2 text-sm sm:text-base font-extrabold leading-snug text-slate-900">
                        {article.title}
                      </h3>

                      <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                        {article.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                    {article.featured ? (
                      <span className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#FFF4EC] px-2.5 text-[11px] font-extrabold text-[#F26F21] whitespace-nowrap">
                        <Star className="h-3.5 w-3.5 fill-[#F26F21] shrink-0" />
                        <span className="whitespace-nowrap">Đang nổi bật</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetFeaturedArticle(article)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-600 transition-colors hover:border-[#F26F21] hover:text-[#F26F21] cursor-pointer whitespace-nowrap"
                      >
                        <Star className="h-3.5 w-3.5 shrink-0" />
                        <span className="whitespace-nowrap">Đặt tiêu điểm</span>
                      </button>
                    )}

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditArticle(article)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#F26F21]/35 bg-[#FFF4EC] px-2.5 sm:px-3 text-xs font-extrabold text-[#F26F21] transition-colors hover:bg-[#F26F21] hover:text-white cursor-pointer whitespace-nowrap"
                      >
                        <Pencil className="h-3.5 w-3.5 shrink-0" />
                        <span className="whitespace-nowrap">Chỉnh sửa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({
                            type: "article",
                            id: article.id,
                            title: article.title,
                          })
                        }
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 cursor-pointer whitespace-nowrap"
                      >
                        <Trash2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="whitespace-nowrap">Xóa</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* ===================================================================== */}
      {/* PORTALED MODALS (z-[110] ABOVE ALL STICKY NAVS, PINNED CLOSE BUTTON)  */}
      {/* ===================================================================== */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {/* 1. CREATE / EDIT CANDIDATE MODAL */}
            {candidateModalOpen && (
              <motion.div
                key="admin-candidate-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setCandidateModalOpen(false)}
                className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/55 p-3 sm:p-6 backdrop-blur-md"
              >
                <motion.form
                  initial={{ opacity: 0, scale: 0.95, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 12 }}
                  onSubmit={handleSaveCandidate}
                  onClick={(e) => e.stopPropagation()}
                  className="relative flex max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-[#F26F21]/30 bg-white shadow-[0_24px_64px_-16px_rgba(242,111,33,0.3)]"
                >
                  {/* Modal Header with Pinned Close Button */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 sm:px-6 py-3.5 sm:py-4 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF4EC] text-[#F26F21] shrink-0">
                        <UserRound className="h-4 w-4" />
                      </span>
                      <h2 className="truncate text-base sm:text-lg font-extrabold text-slate-900 whitespace-nowrap">
                        {candidateForm.id
                          ? "Chỉnh sửa thông tin thí sinh"
                          : "Thêm hồ sơ thí sinh mới"}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCandidateModalOpen(false)}
                      aria-label="Đóng cửa sổ"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-[#F26F21] hover:bg-[#F26F21] hover:text-white cursor-pointer shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Scrollable Form Body */}
                  <div className="overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
                    {candidateFormError && (
                      <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-bold text-red-600">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{candidateFormError}</span>
                      </div>
                    )}

                    {/* Portrait Preview + Upload */}
                    <div className="flex flex-col sm:flex-row items-center gap-3.5 rounded-2xl border border-[#F26F21]/20 bg-[#FFF9F5] p-3.5">
                      <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-orange-100 ring-1 ring-[#F26F21]/25">
                        {candidateForm.avatarUrl ? (
                          <Image
                            src={candidateForm.avatarUrl}
                            alt="Xem trước ảnh thí sinh"
                            fill
                            unoptimized={isUnoptimizedImageSrc(
                              candidateForm.avatarUrl
                            )}
                            sizes="96px"
                            className="object-cover object-top"
                          />
                        ) : null}
                      </div>

                      <div className="w-full min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-slate-700 whitespace-nowrap">
                            Ảnh chân dung thí sinh
                          </span>
                          <input
                            ref={candidateFileRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                uploadImageFile(
                                  file,
                                  (url) =>
                                    setCandidateForm((prev) => ({
                                      ...prev,
                                      avatarUrl: url,
                                    })),
                                  setUploadingCandidateImg,
                                  setCandidateFormError
                                );
                              }
                              e.target.value = "";
                            }}
                          />
                          <button
                            type="button"
                            disabled={uploadingCandidateImg}
                            onClick={() => candidateFileRef.current?.click()}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#F26F21] px-3 text-xs font-extrabold text-white transition-colors hover:bg-[#D9580F] disabled:opacity-60 cursor-pointer whitespace-nowrap"
                          >
                            {uploadingCandidateImg ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                            ) : (
                              <Upload className="h-3.5 w-3.5 shrink-0" />
                            )}
                            <span className="whitespace-nowrap">
                              Tải ảnh từ máy
                            </span>
                          </button>
                        </div>

                        <input
                          type="text"
                          required
                          value={candidateForm.avatarUrl}
                          onChange={(e) =>
                            setCandidateForm((prev) => ({
                              ...prev,
                              avatarUrl: e.target.value,
                            }))
                          }
                          placeholder="Hoặc dán đường dẫn ảnh (/images/... hoặc https://...)"
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-[#F26F21] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="sm:col-span-2">
                        <label className="mb-1 flex items-center gap-1.5 text-xs font-extrabold text-slate-700 whitespace-nowrap">
                          <UserRound className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
                          <span className="whitespace-nowrap">
                            Họ và Tên thí sinh
                          </span>
                        </label>
                        <input
                          type="text"
                          required
                          value={candidateForm.fullName}
                          onChange={(e) =>
                            setCandidateForm((prev) => ({
                              ...prev,
                              fullName: e.target.value,
                            }))
                          }
                          placeholder="Ví dụ: Nguyễn Hoàng Minh Khôi"
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:border-[#F26F21] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 flex items-center gap-1.5 text-xs font-extrabold text-slate-700 whitespace-nowrap">
                          <IdCard className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
                          <span className="whitespace-nowrap">
                            Mã số sinh viên (MSSV)
                          </span>
                        </label>
                        <input
                          type="text"
                          required
                          value={candidateForm.studentId}
                          onChange={(e) =>
                            setCandidateForm((prev) => ({
                              ...prev,
                              studentId: e.target.value.toUpperCase(),
                            }))
                          }
                          placeholder="PS38102"
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 font-mono text-sm font-bold text-slate-900 focus:border-[#F26F21] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 flex items-center gap-1.5 text-xs font-extrabold text-slate-700 whitespace-nowrap">
                          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
                          <span className="whitespace-nowrap">Ngày sinh</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={candidateForm.dob}
                          onChange={(e) =>
                            setCandidateForm((prev) => ({
                              ...prev,
                              dob: e.target.value,
                            }))
                          }
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 font-mono text-sm font-semibold text-slate-900 focus:border-[#F26F21] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 flex items-center gap-1.5 text-xs font-extrabold text-slate-700 whitespace-nowrap">
                          <GraduationCap className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
                          <span className="whitespace-nowrap">Chuyên ngành</span>
                        </label>
                        <input
                          type="text"
                          required
                          list="fpoly-majors"
                          value={candidateForm.major}
                          onChange={(e) =>
                            setCandidateForm((prev) => ({
                              ...prev,
                              major: e.target.value,
                            }))
                          }
                          placeholder="Chọn hoặc nhập chuyên ngành..."
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:border-[#F26F21] focus:outline-none"
                        />
                        <datalist id="fpoly-majors">
                          {MAJOR_SUGGESTIONS.map((m) => (
                            <option key={m} value={m} />
                          ))}
                        </datalist>
                      </div>

                      <div>
                        <label className="mb-1 flex items-center gap-1.5 text-xs font-extrabold text-slate-700 whitespace-nowrap">
                          <Vote className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
                          <span className="whitespace-nowrap">
                            Số phiếu bình chọn
                          </span>
                        </label>
                        <input
                          type="number"
                          min={0}
                          required
                          value={candidateForm.voteCount}
                          onChange={(e) =>
                            setCandidateForm((prev) => ({
                              ...prev,
                              voteCount: e.target.value,
                            }))
                          }
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 font-mono text-sm font-bold text-slate-900 focus:border-[#F26F21] focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-extrabold text-slate-700 whitespace-nowrap">
                          Thông điệp &amp; Thành tựu nổi bật
                        </label>
                        <textarea
                          rows={3}
                          value={candidateForm.bio}
                          onChange={(e) =>
                            setCandidateForm((prev) => ({
                              ...prev,
                              bio: e.target.value,
                            }))
                          }
                          placeholder="Nhập thành tích học tập, dự án xưởng thực hành hoặc câu nói truyền cảm hứng..."
                          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-900 focus:border-[#F26F21] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sticky Modal Footer */}
                  <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/70 px-4 sm:px-6 py-3.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setCandidateModalOpen(false)}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={savingCandidate}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#F26F21] px-5 text-xs sm:text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-[#D9580F] disabled:opacity-60 cursor-pointer whitespace-nowrap"
                    >
                      {savingCandidate && (
                        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      )}
                      <span className="whitespace-nowrap">
                        {candidateForm.id ? "Lưu cập nhật" : "Thêm thí sinh"}
                      </span>
                    </button>
                  </div>
                </motion.form>
              </motion.div>
            )}

            {/* 2. CREATE / EDIT ARTICLE MODAL */}
            {articleModalOpen && (
              <motion.div
                key="admin-article-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setArticleModalOpen(false)}
                className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/55 p-3 sm:p-6 backdrop-blur-md"
              >
                <motion.form
                  initial={{ opacity: 0, scale: 0.95, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 12 }}
                  onSubmit={handleSaveArticle}
                  onClick={(e) => e.stopPropagation()}
                  className="relative flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[#F26F21]/30 bg-white shadow-[0_24px_64px_-16px_rgba(242,111,33,0.3)]"
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 sm:px-6 py-3.5 sm:py-4 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF4EC] text-[#F26F21] shrink-0">
                        <Newspaper className="h-4 w-4" />
                      </span>
                      <h2 className="truncate text-base sm:text-lg font-extrabold text-slate-900 whitespace-nowrap">
                        {articleForm.id
                          ? "Chỉnh sửa bài viết tin tức"
                          : "Đăng bài viết mới"}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setArticleModalOpen(false)}
                      aria-label="Đóng cửa sổ"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-[#F26F21] hover:bg-[#F26F21] hover:text-white cursor-pointer shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Scrollable Form Body */}
                  <div className="overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
                    {articleFormError && (
                      <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-bold text-red-600">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{articleFormError}</span>
                      </div>
                    )}

                    {/* Cover Image Preview + Upload */}
                    <div className="flex flex-col sm:flex-row items-center gap-3.5 rounded-2xl border border-[#F26F21]/20 bg-[#FFF9F5] p-3.5">
                      <div className="relative h-24 w-full sm:w-36 shrink-0 overflow-hidden rounded-xl bg-orange-100 ring-1 ring-[#F26F21]/25">
                        {articleForm.imageUrl ? (
                          <Image
                            src={articleForm.imageUrl}
                            alt="Ảnh bìa bài viết"
                            fill
                            unoptimized={isUnoptimizedImageSrc(
                              articleForm.imageUrl
                            )}
                            sizes="160px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>

                      <div className="w-full min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 text-xs font-extrabold text-slate-700 whitespace-nowrap">
                            <ImagePlus className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
                            <span className="whitespace-nowrap">
                              Ảnh bìa bài viết
                            </span>
                          </span>
                          <input
                            ref={articleFileRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                uploadImageFile(
                                  file,
                                  (url) =>
                                    setArticleForm((prev) => ({
                                      ...prev,
                                      imageUrl: url,
                                    })),
                                  setUploadingArticleImg,
                                  setArticleFormError
                                );
                              }
                              e.target.value = "";
                            }}
                          />
                          <button
                            type="button"
                            disabled={uploadingArticleImg}
                            onClick={() => articleFileRef.current?.click()}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#F26F21] px-3 text-xs font-extrabold text-white transition-colors hover:bg-[#D9580F] disabled:opacity-60 cursor-pointer whitespace-nowrap"
                          >
                            {uploadingArticleImg ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                            ) : (
                              <Upload className="h-3.5 w-3.5 shrink-0" />
                            )}
                            <span className="whitespace-nowrap">
                              Tải ảnh từ máy
                            </span>
                          </button>
                        </div>

                        <input
                          type="text"
                          required
                          value={articleForm.imageUrl}
                          onChange={(e) =>
                            setArticleForm((prev) => ({
                              ...prev,
                              imageUrl: e.target.value,
                            }))
                          }
                          placeholder="Hoặc dán đường dẫn ảnh bìa (/images/... hoặc https://...)"
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-[#F26F21] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-extrabold text-slate-700 whitespace-nowrap">
                        Tiêu đề bài viết
                      </label>
                      <input
                        type="text"
                        required
                        value={articleForm.title}
                        onChange={(e) =>
                          setArticleForm((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        placeholder="Nhập tiêu đề bài viết tin tức..."
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:border-[#F26F21] focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="mb-1 block text-xs font-extrabold text-slate-700 whitespace-nowrap">
                          Chuyên mục (Nhãn cam)
                        </label>
                        <input
                          type="text"
                          required
                          list="fpoly-categories"
                          value={articleForm.category}
                          onChange={(e) =>
                            setArticleForm((prev) => ({
                              ...prev,
                              category: e.target.value.toUpperCase(),
                            }))
                          }
                          placeholder="TIÊU ĐIỂM CƠ SỞ"
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-extrabold text-slate-900 focus:border-[#F26F21] focus:outline-none"
                        />
                        <datalist id="fpoly-categories">
                          {CATEGORY_SUGGESTIONS.map((cat) => (
                            <option key={cat} value={cat} />
                          ))}
                        </datalist>
                      </div>

                      <div>
                        <label className="mb-1 flex items-center gap-1 text-xs font-extrabold text-slate-700 whitespace-nowrap">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
                          <span className="whitespace-nowrap">
                            Đơn vị / Bộ môn
                          </span>
                        </label>
                        <input
                          type="text"
                          required
                          value={articleForm.campus}
                          onChange={(e) =>
                            setArticleForm((prev) => ({
                              ...prev,
                              campus: e.target.value,
                            }))
                          }
                          placeholder="FPoly Đồng Nai"
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:border-[#F26F21] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 flex items-center gap-1 text-xs font-extrabold text-slate-700 whitespace-nowrap">
                          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
                          <span className="whitespace-nowrap">Ngày đăng</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={articleForm.publishedAt}
                          onChange={(e) =>
                            setArticleForm((prev) => ({
                              ...prev,
                              publishedAt: e.target.value,
                            }))
                          }
                          placeholder="27/10/2026"
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 font-mono text-sm font-semibold text-slate-900 focus:border-[#F26F21] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 flex items-center gap-1 text-xs font-extrabold text-slate-700 whitespace-nowrap">
                          <Clock className="h-3.5 w-3.5 shrink-0 text-[#F26F21]" />
                          <span className="whitespace-nowrap">
                            Thời lượng đọc
                          </span>
                        </label>
                        <input
                          type="text"
                          required
                          value={articleForm.readTime}
                          onChange={(e) =>
                            setArticleForm((prev) => ({
                              ...prev,
                              readTime: e.target.value,
                            }))
                          }
                          placeholder="3 phút đọc"
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-900 focus:border-[#F26F21] focus:outline-none"
                        />
                      </div>
                    </div>

                    <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#F26F21]/25 bg-[#FFF6F0] px-3.5 py-2.5">
                      <input
                        type="checkbox"
                        checked={articleForm.featured}
                        onChange={(e) =>
                          setArticleForm((prev) => ({
                            ...prev,
                            featured: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 accent-[#F26F21] shrink-0"
                      />
                      <span className="text-xs sm:text-sm font-bold text-slate-800">
                        Đặt làm <span className="text-[#F26F21]">Bài viết Tiêu điểm</span>{" "}
                        (hiển thị lớn bên trái mục Tin tức)
                      </span>
                    </label>

                    <div>
                      <label className="mb-1 block text-xs font-extrabold text-slate-700 whitespace-nowrap">
                        Tóm tắt ngắn (hiển thị ngoài thẻ tin)
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={articleForm.excerpt}
                        onChange={(e) =>
                          setArticleForm((prev) => ({
                            ...prev,
                            excerpt: e.target.value,
                          }))
                        }
                        placeholder="Nhập đoạn mô tả ngắn thu hút người đọc..."
                        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-900 focus:border-[#F26F21] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-extrabold text-slate-700 whitespace-nowrap">
                        Nội dung chi tiết bài viết (mỗi đoạn xuống dòng)
                      </label>
                      <textarea
                        rows={6}
                        required
                        value={articleForm.contentText}
                        onChange={(e) =>
                          setArticleForm((prev) => ({
                            ...prev,
                            contentText: e.target.value,
                          }))
                        }
                        placeholder="Nhập nội dung đầy đủ của bài viết. Mỗi lần xuống dòng sẽ được trình bày thành một đoạn văn rõ ràng..."
                        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-900 focus:border-[#F26F21] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Sticky Modal Footer */}
                  <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/70 px-4 sm:px-6 py-3.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setArticleModalOpen(false)}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={savingArticle}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#F26F21] px-5 text-xs sm:text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-[#D9580F] disabled:opacity-60 cursor-pointer whitespace-nowrap"
                    >
                      {savingArticle && (
                        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      )}
                      <span className="whitespace-nowrap">
                        {articleForm.id ? "Lưu bài viết" : "Đăng bài viết"}
                      </span>
                    </button>
                  </div>
                </motion.form>
              </motion.div>
            )}

            {/* 3. DELETE CONFIRMATION MODAL */}
            {deleteTarget && (
              <motion.div
                key="admin-delete-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDeleteTarget(null)}
                className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-md"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: 14 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: 10 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-5 sm:p-6 shadow-2xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-600 shrink-0">
                        <Trash2 className="h-5 w-5" />
                      </span>
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 whitespace-nowrap">
                        Xác nhận xóa dữ liệu
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(null)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-600">
                    Bạn có chắc chắn muốn xóa{" "}
                    <strong className="text-slate-900">
                      {deleteTarget.title}
                    </strong>{" "}
                    không? Thao tác này sẽ cập nhật ngay trên trang chủ.
                  </p>

                  <div className="mt-5 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(null)}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                    >
                      Giữ lại
                    </button>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={handleConfirmDelete}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 text-xs sm:text-sm font-extrabold text-white hover:bg-red-700 disabled:opacity-60 cursor-pointer whitespace-nowrap"
                    >
                      {deleting && (
                        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      )}
                      <span className="whitespace-nowrap">Xóa vĩnh viễn</span>
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
