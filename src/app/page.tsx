import React from "react";
import Link from "next/link";
import {
  Briefcase,
  MapPin,
  Clock,
  ShieldCheck,
  Wallet,
  ArrowLeft,
  Smartphone,
  Building2,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                کارآن
              </h1>
              <p className="text-[10px] text-indigo-400 font-medium">پلتفرم مدیریت نیروی کار ساعتی</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              ورود / ثبت‌نام
            </Link>
            <Link
              href="/employer"
              className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              <span>پنل کارفرما</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 py-12 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>چرخه کامل ثبت شیفت، اعتبارسنجی GPS و تسویه حساب فوری</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold leading-tight text-slate-50">
            تامین هوشمند و ساعتی نیروی کار
            <span className="block mt-2 text-indigo-400">بدون واسطه، با اعتبارسنجی مکانی</span>
          </h2>

          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            کارآن پلتفرم جامع اختصاص شیفت، ثبت ورود و خروج بر اساس شعاع مکانی GPS، محاسبه خودکار کارکرد و تسویه حساب تضمین‌شده با سپرده‌گذاری (Escrow) است.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/worker"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all group"
            >
              <Smartphone className="w-5 h-5" />
              <span>ورود کارجو (تجربه PWA موبایل)</span>
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </Link>

            <Link
              href="/employer"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Building2 className="w-5 h-5 text-indigo-400" />
              <span>ایجاد شیفت جدید (کارفرما)</span>
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-2">تطبیق هوشمند مکانی (PostGIS)</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              ارسال اعلان شیفت به نزدیک‌ترین نیروهای متخصص در محدوده جغرافیایی بر اساس الگوریتم‌های شعاعی مکان.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-2">ثبت ورود/خروج با Geofence</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              حضور و غیاب آنلاین با بررسی مختصات زنده GPS و کنترل شعاع مجاز ورود و استراحت در شیفت.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-2">تسویه Idempotent و امن</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              قفل بودجه شیفت در سپرده امن (Escrow) قبل از انتشار و تسویه آنی به محض تایید تایم‌شیت.
            </p>
          </div>
        </div>

        {/* 12-Step Lifecycle Banner */}
        <div className="mt-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 md:p-8">
          <h3 className="text-center text-lg font-bold text-slate-300 mb-6">
            چرخه ۱۲ مرحله‌ای کارآن از ایجاد تا تسویه حساب
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
            {[
              "ایجاد شیفت",
              "تطبیق مکانی",
              "پذیرش کارجو",
              "تایید مجدد",
              "در مسیر",
              "حضور در محل",
              "ثبت ورود GPS",
              "شروع کار",
              "ثبت استراحت",
              "ثبت خروج",
              "ارسال تایم‌شیت",
              "تسویه حساب",
            ].map((step, index) => (
              <React.Fragment key={index}>
                <span className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-200 font-medium">
                  {step}
                </span>
                {index < 11 && <span className="text-indigo-500 font-bold">←</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>© ۱۴۰۵ - سامانه کارآن | پلتفرم مدیریت نیروی کار ساعتی و شیفتی در ایران</p>
      </footer>
    </div>
  );
}
