"use client";

import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import TopBar from "@/components/layout/TopBar";
import { useUser } from "@/lib/hooks/useUser";
import { CohortProvider } from "@/lib/cohort/CohortProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();
  const userName = user?.user_metadata?.name as string | undefined;

  return (
    <div className="flex min-h-screen bg-[#f7f7f8]">
      <Sidebar userName={userName} />
      <div className="flex-1 flex flex-col min-w-0">
        <CohortProvider userId={user?.id ?? null} userLoading={loading}>
          <TopBar />
          <main className="flex-1 p-6 pb-20 md:pb-6">{children}</main>
        </CohortProvider>
      </div>
      <MobileNav />
    </div>
  );
}
