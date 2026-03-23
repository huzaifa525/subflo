import { Sidebar } from "@/components/layout/sidebar";
import { OnboardingGuard } from "@/components/layout/onboarding-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-56">
          <div className="max-w-[1100px] mx-auto px-8 py-8">{children}</div>
        </main>
      </div>
    </OnboardingGuard>
  );
}
