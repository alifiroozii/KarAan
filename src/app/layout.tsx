import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import { ThemeProvider } from "@/components/common/theme-provider";
import "./globals.css";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "کارآن | پلتفرم مدیریت و جذب نیروی کار ساعتی و شیفتی",
  description: "سامانه هوشمند اعزام، ثبت حضور و غیاب جی‌پیاسی و تسویه حساب فوری نیروی کار ساعتی در ایران",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "کارآن",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen flex flex-col selection:bg-indigo-500 selection:text-white">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
