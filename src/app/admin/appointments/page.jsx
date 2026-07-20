import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CalendarX,
  CheckCircle2,
  Clock3,
  Mail,
  Search,
  Stethoscope,
  UserRound,
} from "lucide-react";

import connectDB from "@/lib/db";
import Appointment from "@/models/Appointment";

export const metadata = {
  title: "Manage Appointments",
  description:
    "Search, filter, and review MediAssist appointments.",
};

export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 10;

const ALLOWED_STATUSES = [
  "all",
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

export default async function AdminAppointmentsPage({
  searchParams,
}) {
  const resolvedSearchParams = await searchParams;

  const search =
    typeof resolvedSearchParams?.search === "string"
      ? resolvedSearchParams.search.trim()
      : "";

  const requestedStatus =
    typeof resolvedSearchParams?.status === "string"
      ? resolvedSearchParams.status.toLowerCase()
      : "all";

  const status = ALLOWED_STATUSES.includes(
    requestedStatus
  )
    ? requestedStatus
    : "all";

  const requestedPage = Number.parseInt(
    resolvedSearchParams?.page || "1",
    10
  );

  const page =
    Number.isInteger(requestedPage) &&
    requestedPage > 0
      ? requestedPage
      : 1;

  const result = await getAppointments({
    search,
    status,
    page,
  });

  return (
    <div className="dashboard-container">
      <header className="flex flex-col gap-5 border-b pb-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">
            Appointment Management
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Appointments
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Patient and doctor appointments to search, filter
            and review please.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard
            label="Total"
            value={result.summary.total}
            icon={CalendarDays}
          />

          <SummaryCard
            label="Pending"
            value={result.summary.pending}
            icon={Clock3}
          />

          <SummaryCard
            label="Completed"
            value={result.summary.completed}
            icon={CheckCircle2}
          />

          <SummaryCard
            label="Cancelled"
            value={result.summary.cancelled}
            icon={CalendarX}
          />
        </div>
      </header>

      <section className="mt-6 rounded-xl border bg-card p-4 shadow-sm sm:p-5">
        <form
          action="/admin/appointments"
          method="GET"
          className="grid gap-4 lg:grid-cols-[1fr_220px_auto]"
        >
          <div>
            <label
              htmlFor="appointment-search"
              className="text-sm font-medium"
            >
              Search appointments
            </label>

            <div className="relative mt-2">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />

              <input
                id="appointment-search"
                name="search"
                type="search"
                defaultValue={search}
                placeholder="Patient, doctor, reason..."
                className="focus-ring h-11 w-full rounded-lg border bg-background pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="appointment-status"
              className="text-sm font-medium"
            >
              Appointment status
            </label>

            <select
              id="appointment-status"
              name="status"
              defaultValue={status}
              className="focus-ring mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none"
            >
              <option value="all">
                All statuses
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="confirmed">
                Confirmed
              </option>

              <option value="completed">
                Completed
              </option>

              <option value="cancelled">
                Cancelled
              </option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="focus-ring inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <Search
                className="size-4"
                aria-hidden="true"
              />

              Search
            </button>

            {(search || status !== "all") && (
              <Link
                href="/admin/appointments"
                className="focus-ring inline-flex h-11 items-center justify-center rounded-lg border bg-background px-4 text-sm font-medium transition hover:bg-muted"
              >
                Reset
              </Link>
            )}
          </div>
        </form>
      </section>

      <section className="mt-6 overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">
              Appointment Records
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {result.totalResults.toLocaleString()} result
              {result.totalResults === 1 ? "" : "s"} found
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            Page {result.currentPage} of{" "}
            {result.totalPages}
          </p>
        </div>

        {result.appointments.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-4 font-semibold">
                      Patient
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Doctor
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Schedule
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Reason
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {result.appointments.map(
                    (appointment) => (
                      <AppointmentTableRow
                        key={appointment.id}
                        appointment={appointment}
                      />
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="divide-y lg:hidden">
              {result.appointments.map(
                (appointment) => (
                  <AppointmentMobileCard
                    key={appointment.id}
                    appointment={appointment}
                  />
                )
              )}
            </div>

            <Pagination
              currentPage={result.currentPage}
              totalPages={result.totalPages}
              search={search}
              status={status}
            />
          </>
        ) : (
          <EmptyState
            hasFilters={
              Boolean(search) || status !== "all"
            }
          />
        )}
      </section>
    </div>
  );
}

async function getAppointments({
  search,
  status,
  page,
}) {
  await connectDB();

  const filter = {};

  if (status !== "all") {
    filter.status = status;
  }

  /*
    before base appointments fetch are using.

    Patient and doctor User documents populate to be of after
    Search matching is applied at the application level.
  */
  let appointmentQuery = Appointment.find(filter)
    .populate({
      path: "patientId",
      select: "name email phone",
    })
    .populate({
      path: "doctorId",
      select: "name email phone",
    })
    .sort({
      appointmentDate: -1,
      createdAt: -1,
    })
    .lean();

  const allMatchingStatusAppointments =
    await appointmentQuery;

  const escapedSearch = search.toLowerCase();

  const searchedAppointments = search
    ? allMatchingStatusAppointments.filter(
        (appointment) => {
          const patient =
            appointment.patientId || {};

          const doctor =
            appointment.doctorId || {};

          const searchableValues = [
            patient.name,
            patient.email,
            patient.phone,
            doctor.name,
            doctor.email,
            doctor.phone,
            appointment.reason,
            appointment.symptoms,
            appointment.notes,
            appointment.consultationType,
          ];

          return searchableValues.some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(escapedSearch)
          );
        }
      )
    : allMatchingStatusAppointments;

  const totalResults =
    searchedAppointments.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalResults / ITEMS_PER_PAGE)
  );

  const currentPage =
    totalResults > 0
      ? Math.min(page, totalPages)
      : 1;

  const startIndex =
    (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedAppointments =
    searchedAppointments.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );

  const [
    totalAppointments,
    pendingAppointments,
    confirmedAppointments,
    completedAppointments,
    cancelledAppointments,
  ] = await Promise.all([
    Appointment.countDocuments(),

    Appointment.countDocuments({
      status: "pending",
    }),

    Appointment.countDocuments({
      status: "confirmed",
    }),

    Appointment.countDocuments({
      status: "completed",
    }),

    Appointment.countDocuments({
      status: "cancelled",
    }),
  ]);

  const appointments =
    paginatedAppointments.map(
      (appointment) => ({
        id: appointment._id.toString(),

        patient: {
          id:
            appointment.patientId?._id?.toString() ||
            "",

          name:
            appointment.patientId?.name ||
            "Patient unavailable",

          email:
            appointment.patientId?.email ||
            "Email unavailable",

          phone:
            appointment.patientId?.phone ||
            "Phone unavailable",
        },

        doctor: {
          id:
            appointment.doctorId?._id?.toString() ||
            "",

          name:
            appointment.doctorId?.name ||
            "Doctor unavailable",

          email:
            appointment.doctorId?.email ||
            "Email unavailable",
        },

        appointmentDate:
          appointment.appointmentDate ||
          appointment.date ||
          null,

        appointmentTime:
          appointment.appointmentTime ||
          appointment.time ||
          appointment.timeSlot ||
          "Time unavailable",

        reason:
          appointment.reason ||
          appointment.symptoms ||
          appointment.chiefComplaint ||
          "No reason provided",

        status:
          appointment.status ||
          "pending",

        consultationType:
          appointment.consultationType ||
          appointment.type ||
          "In person",

        createdAt:
          appointment.createdAt ||
          null,
      })
    );

  return {
    appointments,
    totalResults,
    totalPages,
    currentPage,

    summary: {
      total: totalAppointments,
      pending: pendingAppointments,
      confirmed: confirmedAppointments,
      completed: completedAppointments,
      cancelled: cancelledAppointments,
    },
  };
}

function AppointmentTableRow({
  appointment,
}) {
  return (
    <tr className="transition hover:bg-muted/30">
      <td className="px-5 py-4">
        <PersonDetails
          icon={UserRound}
          name={appointment.patient.name}
          email={appointment.patient.email}
        />
      </td>

      <td className="px-5 py-4">
        <PersonDetails
          icon={Stethoscope}
          name={appointment.doctor.name}
          email={appointment.doctor.email}
        />
      </td>

      <td className="px-5 py-4">
        <p className="font-medium">
          {formatDate(
            appointment.appointmentDate
          )}
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          {appointment.appointmentTime}
        </p>

        <p className="mt-1 text-xs capitalize text-muted-foreground">
          {appointment.consultationType}
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="max-w-[240px] line-clamp-2 text-sm text-muted-foreground">
          {appointment.reason}
        </p>
      </td>

      <td className="px-5 py-4">
        <AppointmentStatusBadge
          status={appointment.status}
        />
      </td>

      <td className="px-5 py-4 text-right">
        <Link
          href={`/admin/appointments/${appointment.id}`}
          className="focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-lg border bg-background px-3 text-xs font-semibold transition hover:bg-muted"
        >
          View details

          <ArrowRight
            className="size-3.5"
            aria-hidden="true"
          />
        </Link>
      </td>
    </tr>
  );
}

function AppointmentMobileCard({
  appointment,
}) {
  return (
    <article className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Appointment
          </p>

          <p className="mt-1 font-semibold">
            {formatDate(
              appointment.appointmentDate
            )}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {appointment.appointmentTime}
          </p>
        </div>

        <AppointmentStatusBadge
          status={appointment.status}
        />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-background p-4">
          <p className="text-xs font-medium text-muted-foreground">
            Patient
          </p>

          <p className="mt-2 text-sm font-semibold">
            {appointment.patient.name}
          </p>

          <p className="mt-1 truncate text-xs text-muted-foreground">
            {appointment.patient.email}
          </p>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <p className="text-xs font-medium text-muted-foreground">
            Doctor
          </p>

          <p className="mt-2 text-sm font-semibold">
            {appointment.doctor.name}
          </p>

          <p className="mt-1 truncate text-xs text-muted-foreground">
            {appointment.doctor.email}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium text-muted-foreground">
          Reason
        </p>

        <p className="mt-2 text-sm leading-6">
          {appointment.reason}
        </p>
      </div>

      <Link
        href={`/admin/appointments/${appointment.id}`}
        className="focus-ring mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border bg-background text-sm font-semibold transition hover:bg-muted"
      >
        View appointment

        <ArrowRight
          className="size-4"
          aria-hidden="true"
        />
      </Link>
    </article>
  );
}

function PersonDetails({
  icon: Icon,
  name,
  email,
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon
          className="size-4"
          aria-hidden="true"
        />
      </span>

      <div className="min-w-0">
        <p className="max-w-[200px] truncate font-semibold">
          {name}
        </p>

        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Mail
            className="size-3 shrink-0"
            aria-hidden="true"
          />

          <span className="max-w-[190px] truncate">
            {email}
          </span>
        </div>
      </div>
    </div>
  );
}

function AppointmentStatusBadge({ status }) {
  const normalizedStatus =
    status?.toLowerCase() || "pending";

  const config = {
    pending: {
      icon: Clock3,
      classes:
        "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    },

    confirmed: {
      icon: CalendarDays,
      classes:
        "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    },

    completed: {
      icon: CheckCircle2,
      classes:
        "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    },

    cancelled: {
      icon: CalendarX,
      classes:
        "bg-destructive/10 text-destructive",
    },
  };

  const selected =
    config[normalizedStatus] ||
    config.pending;

  const Icon = selected.icon;

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${selected.classes}`}
    >
      <Icon
        className="size-3.5"
        aria-hidden="true"
      />

      {normalizedStatus}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}) {
  return (
    <div className="flex min-w-32 items-center gap-3 rounded-lg border bg-card px-4 py-3 shadow-sm">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon
          className="size-4"
          aria-hidden="true"
        />
      </span>

      <div>
        <p className="text-xs text-muted-foreground">
          {label}
        </p>

        <p className="font-bold">
          {value.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  search,
  status,
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 border-t p-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>

      <div className="flex gap-2">
        {currentPage > 1 ? (
          <Link
            href={createPageUrl({
              page: currentPage - 1,
              search,
              status,
            })}
            className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium transition hover:bg-muted"
          >
            <ArrowLeft
              className="size-4"
              aria-hidden="true"
            />

            Previous
          </Link>
        ) : (
          <span className="inline-flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-lg border px-4 text-sm text-muted-foreground opacity-50">
            <ArrowLeft
              className="size-4"
              aria-hidden="true"
            />

            Previous
          </span>
        )}

        {currentPage < totalPages ? (
          <Link
            href={createPageUrl({
              page: currentPage + 1,
              search,
              status,
            })}
            className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium transition hover:bg-muted"
          >
            Next

            <ArrowRight
              className="size-4"
              aria-hidden="true"
            />
          </Link>
        ) : (
          <span className="inline-flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-lg border px-4 text-sm text-muted-foreground opacity-50">
            Next

            <ArrowRight
              className="size-4"
              aria-hidden="true"
            />
          </span>
        )}
      </div>
    </div>
  );
}

function EmptyState({ hasFilters }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <CalendarDays
          className="size-6"
          aria-hidden="true"
        />
      </span>

      <h2 className="mt-4 font-semibold">
        {hasFilters
          ? "No matching appointments found"
          : "No appointments found"}
      </h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {hasFilters
          ? "Search or status filter change and try again."
          : "Patients appointments book will to records here will appear."}
      </p>

      {hasFilters && (
        <Link
          href="/admin/appointments"
          className="focus-ring mt-5 inline-flex h-10 items-center justify-center rounded-lg border bg-background px-4 text-sm font-semibold transition hover:bg-muted"
        >
          Clear filters
        </Link>
      )}
    </div>
  );
}

function createPageUrl({
  page,
  search,
  status,
}) {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (status && status !== "all") {
    params.set("status", status);
  }

  params.set("page", page.toString());

  return `/admin/appointments?${params.toString()}`;
}

function formatDate(date) {
  if (!date) {
    return "Date unavailable";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}
