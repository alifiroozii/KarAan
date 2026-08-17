import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BellRing,
  Briefcase,
  Building2,
  Clock,
  CreditCard,
  MapPin,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Wallet,
} from "lucide-react";

const latestChanges = [
  {
    title: "عملیات شیفت واقعی‌تر",
    description:
      "لغو شیفت با سیاست جریمه، No-show دو مرحله‌ای و Backfill فوری برای جایگزینی نیروی غایب به جریان اصلی اضافه شده‌اند.",
    icon: RefreshCcw,
  },
  {
    title: "اعتماد، امتیاز و رابطه کاری",
    description:
      "Reliability مستقل از Quality Rating شده و Favorite / Preferred / Block مستقیماً در Matching و تجربه دو طرف اثر می‌گذارند.",
    icon: Star,
  },
  {
    title: "مالی: Payment تا Settlement",
    description:
      "Payment Provider، Wallet Ledger، Escrow، Settlement و آماده‌سازی Payout با idempotency و پول صحیحِ ریالی به هسته مالی متصل شده‌اند.",
    icon: CreditCard,
  },
  {
    title: "مرکز اعلان و ترجیحات",
    description:
      "Inbox واقعی، read/unread، تنظیم SMS/Push، صف BullMQ و Realtime برای اعلان‌های Worker و Employer اضافه شده است.",
    icon: BellRing,
  },
];

function DemoWorkerButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action="/api/auth/demo" method="post" className={compact ? "" : "w-full sm:w-auto"}>
      <input type="hidden" name="role" value="WORKER" />
      <button
        type="submit"
        className={
          compact
            ? "px-3 py-2 text-xs font-bold rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors"
            : "w-full px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all group"
        }
      >
        {!compact && <Smartphone className="w-5 h-5" />}
        <span>{compact ? "دموی کارگر" : "مشاهده پنل کارگر — بدون OTP"}</span>
        {!compact && <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />}
      </button>
    </form>
  );
}

function DemoEmployerButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action="/api/auth/demo" method="post" className={compact ? "" : "w-full sm:w-auto"}>
      <input type="hidden" name="role" value="EMPLOYER" />
      <button
        type="submit"
        className={
          compact
            ? "px-3 py-2 text-xs font-bold rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition-colors"
            : "w-full px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold flex items-center justify-center gap-2 transition-all"
        }
      >
        <Building2 className="w-5 h-5 text-indigo-400" />
        <span>{compact ? "دموی کارفرما" : "مشاهده پنل کارفرما — بدون OTP"}</span>
      </button>
    </form>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      <header className="border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                کارآن
              </h1>
              <p className="text-[10px] text-indigo-400 font-medium">پلتفرم مدیریت نیروی کار ساعتی</p>
            </div>
          </Link>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[11px] font-bold text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              Demo Mode فعال
            </span>
            <DemoWorkerButton compact />
            <DemoEmployerButton compact />
            <Link
              href="/login"
              className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              ورود عادی
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12 flex-1 w-full">
        <section className="text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-950/50 border border-amber-500/30 text-amber-200 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>نسخه نمایشی آخرین تغییرات فعال است — Worker و Employer بدون OTP قابل مشاهده‌اند</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold leading-tight text-slate-50">
            آخرین نسخه کارآن روی Main
            <span className="block mt-2 text-indigo-400">از عملیات شیفت تا Wallet، Settlement و Notifications</span>
          </h2>

          <p className="text-slate-400 text-base md:text-lg max-w-3xl mx-auto leading-8">
            برای بازبینی سریع، ورود نمایشی موقت فقط برای نقش‌های کارگر و کارفرما باز شده است. سیستم Auth و OTP اصلی حذف نشده و پنل Admin همچنان محافظت‌شده باقی مانده است.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <DemoWorkerButton />
            <DemoEmployerButton />
          </div>

          <p className="text-[11px] text-slate-500 leading-5">
            حساب‌های دمو shared هستند و برای تست محصول‌اند؛ تغییراتی که داخل پنل انجام می‌دهید ممکن است برای بازدید بعدی هم باقی بماند.
          </p>
        </section>

        <section className="mt-14 rounded-3xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/35 to-slate-900/50 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-7">
            <div>
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold mb-2">
                <Sparkles className="h-4 w-4" />
                <span>آخرین تغییرات محصول</span>
              </div>
              <h3 className="text-2xl font-extrabold text-white">Prompt 24 تا 33 الان در نسخه اصلی هستند</h3>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-400">
              این بخش دقیقاً برای این است که بدون گشتن در commitها بفهمید چه چیزهایی در آخرین موج توسعه وارد محصول شده‌اند.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {latestChanges.map(({ title, description, icon: Icon }) => (
              <article key={title} className="rounded-2xl border border-slate-800 bg-slate-950/55 p-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100">{title}</h4>
                    <p className="mt-2 text-sm leading-7 text-slate-400">{description}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-slate-300">کارگر: Offers، Current Shift، Reliability، Wallet، Notifications</div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-slate-300">کارفرما: Live Ops، Timesheets، Relationships، Wallet، Notifications</div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-slate-300">مالی: Payment → Ledger → Escrow → Settlement</div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-slate-300">عملیات: Cancel → No-show → Backfill → Reliability</div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-2">تطبیق هوشمند مکانی</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Matching بر اساس فاصله، مهارت، Reliability، سابقه همکاری و قواعد Block / Preferred / Favorite انجام می‌شود.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-2">حضور، Break و Timesheet</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              مسیر EN_ROUTE تا ARRIVED، QR attendance، Break/Overtime و Timesheet واحد، جریان واقعی حضور و کارکرد را تشکیل می‌دهند.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-2">مالی Ledger-based</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              موجودی از Wallet Ledger می‌آید، بودجه شیفت در Escrow قفل می‌شود و Settlement با idempotency و Audit انجام می‌شود.
            </p>
          </div>
        </section>

        <section className="mt-12 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 md:p-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <h3 className="text-center text-lg font-bold text-slate-300">
              چرخه عملیاتی کارآن از نیاز تا پرداخت و بازاستخدام
            </h3>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
            {[
              "ثبت نیاز",
              "Matching",
              "Commit",
              "در مسیر",
              "حضور",
              "QR ورود",
              "کار / Break",
              "QR خروج",
              "Timesheet",
              "Settlement",
              "Rating",
              "Rehire",
            ].map((step, index) => (
              <React.Fragment key={step}>
                <span className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-200 font-medium">
                  {step}
                </span>
                {index < 11 && <span className="text-indigo-500 font-bold">←</span>}
              </React.Fragment>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>© ۱۴۰۵ - سامانه کارآن | نسخه بازبینی توسعه — Demo Access موقت برای Worker و Employer</p>
      </footer>
    </div>
  );
}
