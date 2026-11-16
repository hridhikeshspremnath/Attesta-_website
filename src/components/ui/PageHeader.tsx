import type { ReactNode } from "react";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Status and data-source badges shown beside the title. */
  badges?: ReactNode;
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, badges, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h1 className="min-w-0 break-words text-2xl font-semibold tracking-tight text-fg">{title}</h1>
          {badges && <div className="flex flex-wrap items-center gap-1.5">{badges}</div>}
        </div>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
