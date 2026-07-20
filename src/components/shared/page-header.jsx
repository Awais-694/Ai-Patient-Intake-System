import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PageHeader({
  title,
  description = "",
  backHref = "",
  backLabel = "Back",
  actionLabel = "",
  actionHref = "",
  actionIcon: ActionIcon = null,
  children,
  className = "",
}) {
  const showBackLink = Boolean(backHref);
  const showActionLink = Boolean(actionLabel && actionHref);

  return (
    <header
      className={`flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-start sm:justify-between ${className}`}
    >
      <div className="min-w-0">
        {showBackLink && (
          <Link
            href={backHref}
            className="focus-ring mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft
              className="size-4"
              aria-hidden="true"
            />

            {backLabel}
          </Link>
        )}

        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h1>

        {description && (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-3">
        {children}

        {showActionLink && (
          <Link
            href={actionHref}
            className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            {ActionIcon && (
              <ActionIcon
                className="size-4"
                aria-hidden="true"
              />
            )}

            {actionLabel}
          </Link>
        )}
      </div>
    </header>
  );
}
