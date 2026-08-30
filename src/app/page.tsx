import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  Download,
  MapPin,
  ShieldCheck,
  Smartphone,
  WalletCards,
  Star,
  Users,
  Building2,
  Clock,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/common/theme-toggle";

const features = [
  {
    title: "برای کارفرمایان و متقاضیان",
    description: "خدمت مورد نیازت را در چند ثانیه ثبت کن، متخصصین تأییدشده اطراف را روی نقشه رادار ببین و تسویه امن انجام بده.",
    icon: MapPin,
    accent: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    title: "برای تکنسین‌ها و متخصصان",
    description: "درخواست‌های فوری و پرسود اطراف خودت را دریافت کن، درآمدت را با نمودار هفتگی تحلیل کن و بدون معطلی تسویه شو.",
    icon: BriefcaseBusiness,
    accent: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    title: "امنیت، شفافیت و کیف پول هوشمند",
    description: "احراز هویت رسمی، استعلام عدم سوءپیشینه، ضمانت حسن انجام کار و پشتیبانی ۲۴ ساعته در تمام مراحل سفارش.",
    icon: ShieldCheck,
    accent: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
];

export default function LandingPage() {
  return (
    <main dir="rtl" className="min-h-screen overflow-hidden bg-background text-foreground selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 border-b border-border">
        <Link href="/" className="flex items-center gap-3 text-xl font-black">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white font-black text-xl shadow-md shadow-indigo-600/30">
            ک
          </span>
          <div>
            <span className="text-xl font-extrabold tracking-tight">کاروین</span>
            <span className="block text-[10px] text-muted-foreground font-normal">پلتفرم هوشمند خدمات محلی</span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/employer" className="hidden sm:inline-block text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
            پنل کارفرمایان
          </Link>
          <Link href="/worker" className="hidden sm:inline-block text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
            پنل متخصصان
          </Link>
          <Link href="/login" className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground hover:bg-muted transition-all shadow-sm">
            ورود به حساب
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-bold text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>نسخه جدید کاروین پرو منتشر شد</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black leading-tight sm:leading-none tracking-tight">
            خدمت حرفه‌ای،
            <span className="block mt-2 bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-400 bg-clip-text text-transparent">
              همین نزدیکی شماست.
            </span>
          </h1>

          <p className="max-w-xl text-base sm:text-lg leading-8 sm:leading-9 text-muted-foreground">
            کاروین، مسیر ارتباط مستقیم میان متقاضیان خدمت و متخصصان احرازهویت‌شده را سریع، شفاف، منصفانه و بدون واسطه می‌سازد.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3.5 sm:flex-row pt-2">
            <a
              href="/app-release.apk"
              download
              className="flex items-center justify-center gap-2.5 rounded-2xl bg-indigo-600 px-6 py-4 font-bold text-sm text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/25"
            >
              <Download size={18} />
              <span>دانلود مستقیم اپلیکیشن اندروید (APK)</span>
            </a>

            <Link
              href="/employer"
              className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-6 py-4 font-bold text-sm text-foreground hover:bg-muted transition-all shadow-sm"
            >
              <span>ورود به داشبورد تحت وب</span>
              <ArrowLeft size={16} />
            </Link>
          </div>

          {/* Trust Metrics */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
            <div>
              <div className="text-2xl font-black text-foreground">۱۰۰٪</div>
              <div className="text-xs text-muted-foreground mt-0.5">احراز هویت رسمی</div>
            </div>
            <div>
              <div className="text-2xl font-black text-indigo-500">زیر ۱۵ دقیقه</div>
              <div className="text-xs text-muted-foreground mt-0.5">اعزام سریع متخصص</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-500">۴.۹ / ۵.۰</div>
              <div className="text-xs text-muted-foreground mt-0.5">رضایت مشتریان</div>
            </div>
          </div>
        </div>

        {/* Hero Interactive Card Mockup */}
        <div className="relative rounded-[2.5rem] border border-indigo-500/20 bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 p-8 shadow-2xl shadow-indigo-950/40">
          <div className="absolute -left-6 -top-6 rounded-2xl bg-emerald-500 p-4 text-white shadow-xl">
            <CheckCircle2 size={28} />
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white font-black text-xl">
                  ع
                </div>
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    علی رضایی
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">تأییدشده</span>
                  </div>
                  <div className="text-xs text-indigo-300">متخصص تأسیسات و برق‌کاری</div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-amber-400 text-sm font-bold">
                  <Star size={16} className="fill-amber-400" />
                  <span>۴.۹</span>
                </div>
                <div className="text-[10px] text-slate-400">۱.۲ کیلومتر فاصله</div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-950/80 p-5 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">سفارش فعال:</span>
                <span className="font-bold text-emerald-400">تعمیر جعبه فیوز ساختمان</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">برآورد هزینه:</span>
                <span className="font-bold text-white text-sm">۳۵۰,۰۰۰ تومان</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full w-3/4 rounded-full"></div>
              </div>
              <div className="text-[10px] text-indigo-300 text-center font-bold">
                وضعیت: متخصص در مسیر اعزام (۱۰ دقیقه تا محل)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-16 md:grid-cols-3">
        {features.map((f) => {
          const IconComponent = f.icon;
          return (
            <article
              key={f.title}
              className={`rounded-3xl border ${f.bg} bg-card p-8 shadow-sm transition-all hover:shadow-md space-y-4`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${f.accent} bg-background border border-border shadow-sm`}>
                <IconComponent size={26} />
              </div>
              <h2 className="text-lg font-black text-foreground">{f.title}</h2>
              <p className="text-xs sm:text-sm leading-7 text-muted-foreground">{f.description}</p>
            </article>
          );
        })}
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © ۱۴۰۵ کاروین (Karvin) — کلیه حقوق محفوظ است. سامانه هوشمند ارائه و اعزام خدمات ساعتی در ایران
      </footer>
    </main>
  );
}
