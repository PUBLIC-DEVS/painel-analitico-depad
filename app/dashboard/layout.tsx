'use client'
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { SpotlightProvider, SpotlightModal } from "@/components/spotlight";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

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
      <div className={cn("font-sans", inter.variable)}>
        <TooltipProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="min-w-0 overflow-hidden">
              <DashboardHeader />
              {children}
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
      </div>
    </SpotlightProvider>
  );
}