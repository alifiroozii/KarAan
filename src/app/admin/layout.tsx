import Link from "next/link";
import type { ReactNode } from "react";

const links = [["داشبورد", "/admin"], ["مدیریت کاربران", "/admin/users"], ["مدیریت درخواست‌ها", "/admin/jobs"], ["امور مالی", "/admin/finance"]];
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100"><aside className="fixed inset-y-0 right-0 w-64 border-l border-slate-800 bg-slate-900 p-5"><h1 className="mb-8 text-xl font-black">کاروین | مدیریت</h1><nav className="space-y-2">{links.map(([label, href]) => <Link key={href} href={href} className="block rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-indigo-600 hover:text-white">{label}</Link>)}</nav></aside><main className="mr-64 p-8">{children}</main></div>;
}
