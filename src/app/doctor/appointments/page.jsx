import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  CalendarX,
  Clock3,
  Search,
  UserRound,
} from "lucide-react";

import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { USER_ROLES } from "@/lib/constants";
import DoctorProfile from "@/models/DoctorProfile";
import Appointment from "@/models/Appointment";

export const metadata = {
  title: "Doctor Appointments",
  description:
    "Search, filter, and manage your MediAssist appointments.",
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

const ALLOWED_DATE_FILTERS = [
  "all",
  "today",
  "upcoming",
  "past",
];

export default async function DoctorAppointmentsPage({
  searchParams,
}) {
  const session = await auth();

  if (
    !session?.user ||
    session.user.role !== USER_ROLES.DOCTOR
  ) {
    redirect("/unauthorized");
  }

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

  const requestedDateFilter =
    typeof resolvedSearchParams?.date === "string"
      ? resolvedSearchParams.date.toLowerCase()
      : "all";

  const dateFilter = ALLOWED_DATE_FILTERS.includes(
    requestedDateFilter
  )
    ? requestedDateFilter
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

  const result = await getDoctorAppointments({
    userId: session.user.id,
    search,
    status,
    dateFilter,
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
            Search appointment requests, review schedules, and manage
            consultation details.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard
            label="Pending"
            value={result.summary.pending}
            icon={Clock3}
          />

          <SummaryCard
            label="Confirmed"
            value={result.summary.confirmed}
            icon={CalendarDays}
          />

          <SummaryCard
            label="Completed"
            value={result.summary.completed}
            icon={CalendarCheck2}
          />

          <SummaryCard
            label="Cancelled"
            value={result.summary.cancelled}
            icon={CalendarX}
          />
        </div>
      </header>

      {!result.profileExists && (
        <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-700 dark:text-amber-400">
          <p className="font-semibold">
            Doctor profile incomplete
          </p>

          <p className="mt-1 text-sm leading-6">
            Complete your professional profile before receiving
            appointment requests.
          </p>

          <Link
            href="/doctor/profile"
            className="focus-ring mt-4 inline-flex h-10 items-center justify-center rounded-lg border border-current/20 bg-background/60 px-4 text-sm font-semibold"
          >
            Complete Profile
          </Link>
        </div>
      )}

      <section className="mt-6 rounded-xl border bg-card p-4 shadow-sm sm:p-5">
        <form
          action="/doctor/appointments"
          method="GET"
          className="grid gap-4 xl:grid-cols-[1fr_200px_200px_auto]"
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
                placeholder="Patient, email, symptoms..."
                className="focus-ring h-11 w-full rounded-lg border bg-background pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="appointment-status"
              className="text-sm font-medium"
            >
              Status
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

          <div>
            <label
              htmlFor="appointment-date-filter"
              className="text-sm font-medium"
            >
              Date
            </label>

            <select
              id="appointment-date-filter"
              name="date"
              defaultValue={dateFilter}
              className="focus-ring mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none"
            >
              <option value="all">
                All dates
              </option>

              <option value="today">
                Today
              </option>

              <option value="upcoming">
                Upcoming
              </option>

              <option value="past">
                Past
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

              Apply
            </button>

            {(search ||
              status !== "all" ||
              dateFilter !== "all") && (
              <Link
                href="/doctor/appointments"
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
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-4 font-semibold">
                      Patient
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Schedule
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Reason
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Type
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
              dateFilter={dateFilter}
            />
          </>
        ) : (
          <EmptyState
            hasFilters={
              Boolean(search) ||
              status !== "all" ||
              dateFilter !== "all"
            }
          />
        )}
      </section>
    </div>
  );
}

async function getDoctorAppointments({
  userId,
  search,
  status,
  dateFilter,
  page,
}) {
  await connectDB();

  const profile = await DoctorProfile.findOne({
    userId,
  })
    .select("_id approvalStatus")
    .lean();

  const doctorReferenceIds = [userId];

  if (profile?._id) {
    doctorReferenceIds.push(profile._id);
  }

  const filter = {
    doctorId: {
      $in: doctorReferenceIds,
    },
  };

  if (status !== "all") {
    filter.status = status;
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(
    tomorrowStart.getDate() + 1
  );

  if (dateFilter === "today") {
    filter.appointmentDate = {
      $gte: todayStart,
      $lt: tomorrowStart,
    };
  }

  if (dateFilter === "upcoming") {
    filter.appointmentDate = {
      $gte: todayStart,
    };
  }

  if (dateFilter === "past") {
    filter.appointmentDate = {
      $lt: todayStart,
    };
  }

  const documents = await Appointment.find(filter)
    .populate({
      path: "patientId",
      select: "name email phone",
    })
    .sort({
      appointmentDate: -1,
      appointmentTime: 1,
      createdAt: -1,
    })
    .lean();

  const normalizedSearch = search.toLowerCase();

  const searchedDocuments = search
    ? documents.filter((appointment) => {
        const patient =
          appointment.patientId || {};

        const values = [
          patient.name,
          patient.email,
          patient.phone,
          appointment.reason,
          appointment.chiefComplaint,
          appointment.symptoms,
          appointment.patientNotes,
          appointment.consultationType,
        ];

        return values.some((value) =>
          formatSearchValue(value).includes(
            normalizedSearch
          )
        );
      })
    : documents;

  const totalResults = searchedDocuments.length;

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

  const pageDocuments = searchedDocuments.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const baseDoctorFilter = {
    doctorId: {
      $in: doctorReferenceIds,
    },
  };

  const [
    pendingAppointments,
    confirmedAppointments,
    completedAppointments,
    cancelledAppointments,
  ] = await Promise.all([
    Appointment.countDocuments({
      ...baseDoctorFilter,
      status: "pending",
    }),

    Appointment.countDocuments({
      ...baseDoctorFilter,
      status: "confirmed",
    }),

    Appointment.countDocuments({
      ...baseDoctorFilter,
      status: "completed",
    }),

    Appointment.countDocuments({
      ...baseDoctorFilter,
      status: "cancelled",
    }),
  ]);

  const appointments = pageDocuments.map(
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

      appointmentDate:
        appointment.appointmentDate ||
        appointment.date ||
        null,

      appointmentTime:
        appointment.appointmentTime ||
        appointment.startTime ||
        appointment.time ||
        appointment.timeSlot ||
        "Time unavailable",

      reason:
        appointment.reason ||
        appointment.chiefComplaint ||
        formatListOrText(
          appointment.symptoms
        ),

      consultationType:
        formatReadableText(
          appointment.consultationType ||
            appointment.type ||
            "In person"
        ),

      status:
        appointment.status || "pending",
    })
  );

  return {
    profileExists: Boolean(profile),
    appointments,
    totalResults,
    totalPages,
    currentPage,

    summary: {
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
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {getInitials(
              appointment.patient.name
            )}
          </div>

          <div className="min-w-0">
            <p className="max-w-[210px] truncate font-semibold">
              {appointment.patient.name}
            </p>

            <p className="max-w-[210px] truncate text-xs text-muted-foreground">
              {appointment.patient.email}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {appointment.patient.phone}
            </p>
          </div>
        </div>
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
      </td>

      <td className="px-5 py-4">
        <p className="max-w-[260px] line-clamp-2 text-sm leading-6 text-muted-foreground">
          {appointment.reason}
        </p>
      </td>

      <td className="px-5 py-4">
        <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {appointment.consultationType}
        </span>
      </td>

      <td className="px-5 py-4">
        <AppointmentStatusBadge
          status={appointment.status}
        />
      </td>

      <td className="px-5 py-4 text-right">
        <Link
          href={`/doctor/appointments/${appointment.id}`}
          className="focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-lg border bg-background px-3 text-xs font-semibold transition hover:bg-muted"
        >
          View

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
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {getInitials(
            appointment.patient.name
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">
            {appointment.patient.name}
          </p>

          <p className="truncate text-xs text-muted-foreground">
            {appointment.patient.email}
          </p>
        </div>

        <AppointmentStatusBadge
          status={appointment.status}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border bg-background p-3">
          <p className="text-xs text-muted-foreground">
            Date
          </p>

          <p className="mt-1 text-sm font-semibold">
            {formatDate(
              appointment.appointmentDate
            )}
          </p>
        </div>

        <div className="rounded-lg border bg-background p-3">
          <p className="text-xs text-muted-foreground">
            Time
          </p>

          <p className="mt-1 text-sm font-semibold">
            {appointment.appointmentTime}
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

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {appointment.consultationType}
        </span>

        <Link
          href={`/doctor/appointments/${appointment.id}`}
          className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-background px-4 text-sm font-semibold transition hover:bg-muted"
        >
          View details

          <ArrowRight
            className="size-4"
            aria-hidden="true"
          />
        </Link>
      </div>
    </article>
  );
}

function AppointmentStatusBadge({
  status,
}) {
  const normalizedStatus =
    String(status || "pending").toLowerCase();

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
      icon: CalendarCheck2,
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
  dateFilter,
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
              dateFilter,
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
              dateFilter,
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
          : "No appointments available"}
      </h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {hasFilters
          ? "Search, status or date filter change and try again."
          : "Patients appointments book will to they here will appear."}
      </p>

      {hasFilters && (
        <Link
          href="/doctor/appointments"
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
  dateFilter,
}) {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (status && status !== "all") {
    params.set("status", status);
  }

  if (
    dateFilter &&
    dateFilter !== "all"
  ) {
    params.set("date", dateFilter);
  }

  params.set("page", page.toString());

  return `/doctor/appointments?${params.toString()}`;
}

function formatSearchValue(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "string"
          ? item
          : item?.name || item?.value || ""
      )
      .join(" ")
      .toLowerCase();
  }

  return String(value || "").toLowerCase();
}

function formatListOrText(value) {
  if (!value) {
    return "No reason provided";
  }

  if (Array.isArray(value)) {
    const items = value
      .map((item) =>
        typeof item === "string"
          ? item.trim()
          : String(
              item?.name ||
                item?.value ||
                ""
            ).trim()
      )
      .filter(Boolean);

    return items.length > 0
      ? items.join(", ")
      : "No reason provided";
  }

  return String(value);
}

function formatReadableText(value) {
  return String(value || "Not provided")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function getInitials(name = "") {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "PT";
  }

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`
    .toUpperCase();
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
