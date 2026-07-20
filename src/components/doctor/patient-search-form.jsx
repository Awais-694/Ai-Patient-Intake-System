"use client";

import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PatientSearchForm({ initialSearch = "" }) {
  const router = useRouter();
  const [value, setValue] = useState(initialSearch);
  const [isPending, startTransition] = useTransition();

  function navigate(nextSearch) {
    const query = nextSearch.trim();
    const url = query
      ? `/doctor/patients?search=${encodeURIComponent(query)}#patient-records`
      : "/doctor/patients#patient-records";

    startTransition(() => router.replace(url, { scroll: false }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    navigate(value);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 sm:flex-row sm:items-end"
      aria-busy={isPending}
    >
      <div className="flex-1">
        <label htmlFor="patient-search" className="text-sm font-medium">
          Search patients
        </label>

        <div className="relative mt-2">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />

          <input
            id="patient-search"
            name="search"
            type="search"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Patient name, email, or phone"
            className="focus-ring h-11 w-full rounded-lg border bg-background pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
        >
          <Search className="size-4" aria-hidden="true" />
          {isPending ? "Searching…" : "Search"}
        </button>

        {(value.trim() || initialSearch) && (
          <button
            type="button"
            onClick={() => {
              setValue("");
              navigate("");
            }}
            disabled={isPending}
            className="focus-ring inline-flex h-11 items-center justify-center rounded-lg border bg-background px-4 text-sm font-medium transition hover:bg-muted disabled:opacity-70"
          >
            Reset
          </button>
        )}
      </div>
    </form>
  );
}
