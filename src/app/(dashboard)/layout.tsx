"use client";

import { useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import TopBar from "@/components/layout/TopBar";
import { useUser } from "@/lib/hooks/useUser";
import { recordVisit } from "@/lib/actions/recordVisit";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const userName = user?.user_metadata?.name as string | undefined;

  // Авто-отметка захода на платформу (один раз в день на пользователя)
  useEffect(() => {
    if (user?.id) {
      recordVisit(user.id);
    }
  }, [user?.id]);

  return (
    <div className="flex min-h-screen bg-[#f7f7f8]">
      <Sidebar userName={userName} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-6 pb-20 md:pb-6">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
