import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Crumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Crumb[];
  actions?: React.ReactNode;
  eyebrow?: string;
  className?: string;
}

/**
 * Unified page header — serif display title + optional breadcrumbs, eyebrow,
 * subtitle and right-aligned actions slot.
 */
export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  eyebrow,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-4", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1 text-xs text-text-muted"
        >
          {breadcrumbs.map((c, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (
              <React.Fragment key={`${c.label}-${i}`}>
                {c.href && !isLast ? (
                  <Link
                    href={c.href}
                    className="transition-colors hover:text-text-default"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      isLast ? "text-text-default" : "text-text-muted"
                    )}
                  >
                    {c.label}
                  </span>
                )}
                {!isLast && (
                  <ChevronRight className="size-3 text-text-subtle" />
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          {eyebrow && (
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-gold">
              {eyebrow}
            </span>
          )}
          <h1 className="font-heading text-[2rem] leading-[1.1] tracking-tight text-text-strong sm:text-[2.25rem]">
            {title}
          </h1>
          {subtitle && (
            <p className="max-w-2xl text-sm text-text-muted">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  );
}
