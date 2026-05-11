'use client'
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Outfit } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { SpotlightProvider, SpotlightModal } from "@/components/spotlight";
import { Wave } from "@/components/ui/wave";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  if (status === "loading") return null;
  if (status === "unauthenticated") return null;

  return (
    <SpotlightProvider>
      <SpotlightModal />
      <div className={cn("font-sans", outfit.variable)}>
        <TooltipProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="min-w-0 overflow-hidden relative">
              <Wave />
              <DashboardHeader />
              <div className="relative z-10">
                {children}
              </div>
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
      </div>
    </SpotlightProvider>
  );
}