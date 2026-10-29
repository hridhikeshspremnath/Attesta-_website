import Sidebar from "@/src/components/layout/Sidebar";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#060b16]">
      <Sidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}

