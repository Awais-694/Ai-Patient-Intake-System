"use client";

import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AppointmentFilters({ initialSearch = "", initialStatus = "all", initialDate = "all" }) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [date, setDate] = useState(initialDate);
  const [isPending, startTransition] = useTransition();

  function navigate(next = { search, status, date }) {
    const params = new URLSearchParams();
    if (next.search.trim()) params.set("search", next.search.trim());
    if (next.status !== "all") params.set("status", next.status);
    if (next.date !== "all") params.set("date", next.date);
    const query = params.toString();
    const url = `/patient/appointments${query ? `?${query}` : ""}#appointment-records`;
    startTransition(() => router.replace(url, { scroll: false }));
  }

  function reset() {
    setSearch("");
    setStatus("all");
    setDate("all");
    navigate({ search: "", status: "all", date: "all" });
  }

  return (
    <form
      onSubmit={(event) => { event.preventDefault(); navigate(); }}
      className="grid gap-4 xl:grid-cols-[1fr_200px_200px_auto]"
      aria-busy={isPending}
    >
      <div>
        <label htmlFor="appointment-search" className="text-sm font-medium">Search appointments</label>
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input id="appointment-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Doctor, specialization, or reason" className="focus-ring h-11 w-full rounded-lg border bg-background pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground" />
        </div>
      </div>

      <div>
        <label htmlFor="appointment-status" className="text-sm font-medium">Status</label>
        <select id="appointment-status" value={status} onChange={(event) => setStatus(event.target.value)} className="focus-ring mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none">
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div>
        <label htmlFor="appointment-date" className="text-sm font-medium">Date</label>
        <select id="appointment-date" value={date} onChange={(event) => setDate(event.target.value)} className="focus-ring mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none">
          <option value="all">All dates</option>
          <option value="today">Today</option>
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
        </select>
      </div>

      <div className="flex items-end gap-2">
        <button type="submit" disabled={isPending} className="focus-ring inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-wait disabled:opacity-70">
          <Search className="size-4" aria-hidden="true" />
          {isPending ? "Applying…" : "Apply"}
        </button>
        {(search || status !== "all" || date !== "all") && (
          <button type="button" onClick={reset} disabled={isPending} className="focus-ring inline-flex h-11 items-center justify-center rounded-lg border bg-background px-4 text-sm font-medium transition hover:bg-muted disabled:opacity-70">Reset</button>
        )}
      </div>
    </form>
  );
}
