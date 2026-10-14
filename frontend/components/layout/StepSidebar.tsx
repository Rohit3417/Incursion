"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const steps = [
  { name: "Upload", href: "/upload", description: "Import team data" },
  { name: "Configure", href: "/config", description: "Set criteria and weights" },
  { name: "Results", href: "/results", description: "View ranked teams" },
  { name: "Compare", href: "/compare", description: "Compare configurations" },
  { name: "History", href: "/history", description: "Past runs" },
];

export function StepSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border bg-muted/30 flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-lg font-semibold tracking-tight">Team Recruitment</h1>
        <p className="text-sm text-muted-foreground mt-1">Shortlisting Tool</p>
      </div>

      <nav className="flex-1 p-4" aria-label="Main navigation">
        <ol className="space-y-1">
          {steps.map((step, index) => {
            const isActive = pathname === step.href;
            const stepNumber = index + 1;

            return (
              <li key={step.href}>
                <Link
                  href={step.href}
                  className={cn(
                    "flex items-start gap-3 px-3 py-2.5 rounded-md transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent text-foreground"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span
                    className={cn(
                      "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {stepNumber}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{step.name}</div>
                    <div className={cn(
                      "text-xs mt-0.5",
                      isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {step.description}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Day 1 — Layout Shell
        </p>
      </div>
    </aside>
  );
}
