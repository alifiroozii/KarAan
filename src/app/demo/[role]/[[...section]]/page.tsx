import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Bell, BriefcaseBusiness, Building2, Clock3, MapPinned, Scale, ShieldCheck, Star, UserRound, UsersRound, WalletCards } from "lucide-react";

const workerSections = [
  ["overview", "داشبورد", BriefcaseBusiness],
  ["offers", "پیشنهادها", Star],
  ["shift", "شیفت فعال", Clock3],
  ["wallet", "کیف پول", WalletCards],
  ["notifications", "اعلان‌ها", Bell],
  ["disputes", "اختلافات", Scale],
  ["profile", "پروفایل", UserRound],
] as const;

const employerSections = [
  ["overview", "داشبورد", Building2],
  ["live", "عملیات زنده", UsersRound],
  ["shifts", "شیفت‌ها", BriefcaseBusiness],
  ["branches", "شعب", MapPinned],
  ["timesheets", "تایم‌شیت‌ها", Clock3],
  ["wallet", "کیف پول", WalletCards],
  ["notifications", "اعلان‌ها", Bell],
  ["disputes", "اختلافات", Scale],
] as const;

type DemoRole = "worker" | "employer";

const workerCopy: Record<string, { title: string; description: string; stats: string[] }> = {
  overview: { title: "داشبورد کارگر", description: "نمونه خواندنی از تجربه کارجو؛ این صفحه برای نمایش محصول به دیتابیس وابسته نیست.", stats: ["Reliability: 98.5", "۲ پیشنهاد فعال", "۱ شیفت امروز"] },
  offers: { title: "پیشنهادهای شیفت", description: "پیشنهادهای Matching با فاصله، دستمزد، زمان انقضا و وضعیت Backfill نمایش داده می‌شوند.", stats: ["فروشنده — صادقیه", "انباردار — آزادی", "Backfill فوری — ونک"] },
  shift: { title: "شیفت فعال", description: "جریان CONFIRMED → EN_ROUTE → ARRIVED → CHECKED_IN → CHECKED_OUT در یک نمای عملیاتی دیده می‌شود.", stats: ["ETA: ۱۸ دقیقه", "Geofence: 100m", "QR حضور: آماده"] },
  wallet: { title: "کیف پول کارگر", description: "Available، Pending، Reserved و تاریخچه Ledger بدون نمایش عملیات مالی جعلی.", stats: ["Available: 8,450,000 ریال", "Pending: 1,200,000 ریال", "Payout: آماده‌سازی‌شده"] },
  notifications: { title: "مرکز اعلان", description: "Inbox پایدار، وضعیت خوانده‌شدن و ترجیحات SMS/Push در تجربه واقعی محصول وجود دارد.", stats: ["۲ اعلان خوانده‌نشده", "SMS فعال", "Push provider-ready"] },
  disputes: { title: "مرکز اختلافات", description: "Prompt 34 اختلاف تایم‌شیت را از ثبت تا بررسی و رأی نهایی قابل رهگیری می‌کند.", stats: ["OPEN: 1", "UNDER_REVIEW: 1", "Resolved: 3"] },
  profile: { title: "پروفایل و مهارت‌ها", description: "مهارت، محدوده کاری، Availability و اعتبار کاری در پروفایل کارگر نگهداری می‌شوند.", stats: ["پروفایل ۹۲٪ کامل", "۴ مهارت تأییدشده", "Availability فعال"] },
};

const employerCopy: Record<string, { title: string; description: string; stats: string[] }> = {
  overview: { title: "داشبورد کارفرما", description: "نمای مدیریتی read-only برای مرور جریان محصول بدون وابستگی به seed یا session دیتابیس.", stats: ["۱۲ شیفت این هفته", "۹۶٪ Fill Rate", "۳ عملیات زنده"] },
  live: { title: "عملیات زنده", description: "وضعیت EN_ROUTE، ETA، ARRIVED، حضور، No-show و Backfill در یک رادار عملیاتی جمع می‌شوند.", stats: ["۵ نفر در مسیر", "۲ نفر حاضر", "۱ Backfill فعال"] },
  shifts: { title: "لیست شیفت‌ها", description: "شیفت‌های Draft تا Settled همراه بودجه، ظرفیت و وضعیت Matching قابل پیگیری‌اند.", stats: ["PUBLISHED: 4", "FILLED: 6", "IN_PROGRESS: 2"] },
  branches: { title: "شعب و محل‌ها", description: "شعب، مدیر شعبه، آدرس و نقطه Geofence برای عملیات حضور مدیریت می‌شوند.", stats: ["۳ شعبه فعال", "۲ مدیر شعبه", "Geofence تنظیم‌شده"] },
  timesheets: { title: "تایم‌شیت‌ها", description: "کارکرد، Break، Overtime، Bonus و وضعیت READY_FOR_SETTLEMENT قابل بازبینی است.", stats: ["Awaiting review: 3", "Ready: 5", "Settled: 28"] },
  wallet: { title: "کیف پول و Escrow", description: "رزرو بودجه، Ledger، Escrow، Settlement و payout preparation با حسابداری idempotent نمایش داده می‌شوند.", stats: ["Available: 54M ریال", "Escrow: 18M ریال", "Settlement امروز: 7"] },
  notifications: { title: "اعلان‌های کارفرما", description: "اعلان‌های عملیاتی و مالی در Inbox پایدار ثبت و برای کانال‌های فعال صف‌بندی می‌شوند.", stats: ["No-show alert", "Settlement completed", "Backfill filled"] },
  disputes: { title: "حل اختلافات", description: "اختلاف کارکرد و پرداخت تا رأی عامل حل اختلاف، Audit و بازگشت امن به مسیر تسویه مدیریت می‌شود.", stats: ["OPEN: 2", "UNDER_REVIEW: 1", "SLA قابل رهگیری"] },
};

export default async function DemoPage({ params }: { params: Promise<{ role: string; section?: string[] }> }) {
  const { role: rawRole, section } = await params;
  if (rawRole !== "worker" && rawRole !== "employer") notFound();
  const role = rawRole as DemoRole;
  const current = section?.[0] ?? "overview";
  const nav = role === "worker" ? workerSections : employerSections;
  const copy = (role === "worker" ? workerCopy : employerCopy)[current];
  if (!copy || !nav.some(([id]) => id === current)) notFound();

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs font-bold text-indigo-300">KarAan Production Demo</p>
            <h1 className="text-lg font-black">{role === "worker" ? "پنل نمایشی کارگر" : "پنل نمایشی کارفرما"}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-200 sm:inline">Read-only fallback</span>
            <Link href="/" className="rounded-xl border border-slate-700 px-3 py-2 text-xs hover:bg-slate-900">بازگشت</Link>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3 h-fit">
          <nav className="grid grid-cols-2 gap-2 md:grid-cols-1">
            {nav.map(([id, label, Icon]) => (
              <Link key={id} href={`/demo/${role}/${id}`} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition ${current === id ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
                <Icon className="h-4 w-4" />{label}
              </Link>
            ))}
          </nav>
        </aside>
        <section className="space-y-5">
          <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/50 to-slate-900 p-6 md:p-8">
            <div className="mb-4 flex items-center gap-2 text-xs font-bold text-emerald-300"><ShieldCheck className="h-4 w-4" />دمو همیشه قابل مشاهده است؛ عملیات نوشتنی و مالی در این fallback غیرفعال‌اند.</div>
            <h2 className="text-3xl font-black">{copy.title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">{copy.description}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">{copy.stats.map((item) => <div key={item} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm font-bold text-slate-200">{item}</div>)}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="font-bold">مسیر واقعی محصول</h3>
            <p className="mt-2 text-sm leading-7 text-slate-400">اگر سرویس دیتابیس و session آماده باشد، دکمه‌های اصلی صفحه اول شما را وارد پنل تعاملی واقعی می‌کنند؛ در غیر این صورت به‌جای JSON یا صفحه خالی، همین نسخه read-only باز می‌شود.</p>
            <Link href={role === "worker" ? "/demo/employer" : "/demo/worker"} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-indigo-300 hover:text-indigo-200">مشاهده دموی {role === "worker" ? "کارفرما" : "کارگر"}<ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      </div>
    </main>
  );
}
