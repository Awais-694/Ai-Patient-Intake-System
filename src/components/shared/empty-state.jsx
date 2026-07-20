import Link from "next/link";
import { Inbox } from "lucide-react";

export default function EmptyState({
  icon: Icon = Inbox,
  title = "Koi record not found",
  description = "Filhal here dikhane for koi information available not is.",
  actionLabel = "",
  actionHref = "",
  onAction,
  className = "",
}) {
  const showAction =
    Boolean(actionLabel) &&
    (Boolean(actionHref) || typeof onAction === "function");

  return (
    <section
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-12 text-center text-card-foreground ${className}`}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon
          className="size-7"
          aria-hidden="true"
        />
      </div>

      <h2 className="mt-5 text-lg font-semibold">
        {title}
      </h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>

      {showAction && actionHref && (
        <Link
          href={actionHref}
          className="focus-ring mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          {actionLabel}
        </Link>
      )}

      {showAction && !actionHref && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="focus-ring mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          {actionLabel}
        </button>
      )}
    </section>
  );
}