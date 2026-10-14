import type { Metadata } from "next";
import "./globals.css";
import { StepSidebar } from "@/components/layout/StepSidebar";
import { AppStateProvider } from "@/lib/app-state-context";

export const metadata: Metadata = {
  title: "Team Recruitment Automation Tool",
  description: "Configurable, explainable team shortlisting for hackathon organizers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        {/* Day 1 placeholder: AppStateProvider wraps all pages so later days
            (Day 4 for dataset_id, Day 7 for run_id) can access shared IDs
            without refactoring layout.tsx. See design.md section 5. */}
        <AppStateProvider>
          <div className="flex-1 flex">
            <StepSidebar />
            <main className="flex-1 flex flex-col">
              {children}
            </main>
          </div>
        </AppStateProvider>
      </body>
    </html>
  );
}
