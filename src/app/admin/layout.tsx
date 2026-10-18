import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="light bg-slate-50 text-slate-900 min-h-screen" style={{ colorScheme: "light" }}>
      {children}
    </div>
  );
}
