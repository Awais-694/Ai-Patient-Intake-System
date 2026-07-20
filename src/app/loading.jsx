export default function LoadingPage() {
  return (
    <main
      className="min-h-screen bg-background"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">
        Page loading, please wait.
      </span>

      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r bg-card p-5 lg:block">
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 rounded-xl" />

            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>

          <div className="mt-8 space-y-3">
            {Array.from({
              length: 6,
            }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-lg p-3"
              >
                <Skeleton className="size-9 rounded-lg" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>

          <div className="mt-auto pt-10">
            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />

                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="flex h-16 items-center justify-between border-b px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-lg lg:hidden" />
              <Skeleton className="h-5 w-36" />
            </div>

            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="hidden h-9 w-28 rounded-lg sm:block" />
            </div>
          </header>

          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
            <section className="flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-9 w-72 max-w-full" />
                <Skeleton className="h-4 w-full max-w-xl" />
                <Skeleton className="h-4 w-4/5 max-w-md" />
              </div>

              <Skeleton className="h-11 w-44 rounded-lg" />
            </section>

            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({
                length: 4,
              }).map((_, index) => (
                <StatisticCardSkeleton
                  key={index}
                />
              ))}
            </section>

            <section className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
              <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                <div className="flex items-center justify-between border-b p-5">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-44" />
                    <Skeleton className="h-3 w-64 max-w-full" />
                  </div>

                  <Skeleton className="h-4 w-20" />
                </div>

                <div className="divide-y">
                  {Array.from({
                    length: 5,
                  }).map((_, index) => (
                    <ListRowSkeleton
                      key={index}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="mt-2 h-3 w-64 max-w-full" />

                  <div className="mt-6 space-y-5">
                    {Array.from({
                      length: 4,
                    }).map((_, index) => (
                      <ProgressRowSkeleton
                        key={index}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border bg-card p-5 shadow-sm">
                  <Skeleton className="h-5 w-32" />

                  <div className="mt-5 space-y-3">
                    {Array.from({
                      length: 3,
                    }).map((_, index) => (
                      <ActionRowSkeleton
                        key={index}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatisticCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <Skeleton className="size-11 rounded-lg" />
        <Skeleton className="size-4 rounded" />
      </div>

      <Skeleton className="mt-5 h-8 w-20" />
      <Skeleton className="mt-3 h-4 w-36" />
      <Skeleton className="mt-2 h-3 w-44 max-w-full" />
    </div>
  );
}

function ListRowSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <Skeleton className="size-11 shrink-0 rounded-full" />

        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-52 max-w-full" />
          <Skeleton className="h-3 w-64 max-w-full" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>

        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="size-9 rounded-lg" />
      </div>
    </div>
  );
}

function ProgressRowSkeleton() {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>

      <Skeleton className="mt-2 h-2 w-full rounded-full" />
    </div>
  );
}

function ActionRowSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-lg" />
        <Skeleton className="h-4 w-36" />
      </div>

      <Skeleton className="size-4 rounded" />
    </div>
  );
}

function Skeleton({
  className = "",
}) {
  return (
    <div
      className={`animate-pulse bg-muted ${className}`}
      aria-hidden="true"
    />
  );
}