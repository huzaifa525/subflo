import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { OnboardingGuard } from "@/components/layout/onboarding-guard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingGuard>
      <div className="flex min-h-screen">
        <div className="hidden md:block"><Sidebar /></div>
        <main className="flex-1 md:ml-56 pb-16 md:pb-0">
          <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-6 md:py-8">{children}</div>
        </main>
        <MobileNav />
      </div>
    </OnboardingGuard>
  );
}
