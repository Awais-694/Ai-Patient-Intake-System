import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  CalendarPlus,
  CalendarX,
  Clock3,
  Stethoscope,
} from "lucide-react";

import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { USER_ROLES } from "@/lib/constants";
import DoctorProfile from "@/models/DoctorProfile";
import Appointment from "@/models/Appointment";
import AppointmentFilters from "@/components/patient/appointment-filters";

export const metadata = {
  title: "My Appointments",
  description:
    "Search, filter, and review your MediAssist appointment history.",
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

export default async function PatientAppointmentsPage({
  searchParams,
}) {
  const session = await auth();

  if (
    !session?.user ||
    session.user.role !== USER_ROLES.PATIENT
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

  const result = await getPatientAppointments({
    patientUserId: session.user.id,
    search,
    status,
    dateFilter,
    page,
  });

  return (
    <div className="dashboard-container">
      <header className="flex flex-col gap-5 border-b pb-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <Link
            href="/patient/dashboard"
            className="focus-ring mb-4 inline-flex items-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition hover:text-primary"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to Dashboard
          </Link>

          <p className="text-sm font-semibold text-primary">
            Appointment History
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            My Appointments
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Search, filter, and review your upcoming and previous
            consultations.
          </p>
        </div>

        <Link
          href="/patient/appointments/new"
          className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <CalendarPlus
            className="size-4"
            aria-hidden="true"
          />

          Book Appointment
        </Link>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
      </section>

      <section className="mt-6 rounded-xl border bg-card p-4 shadow-sm sm:p-5">
        <AppointmentFilters
          initialSearch={search}
          initialStatus={status}
          initialDate={dateFilter}
        />
      </section>

      <section id="appointment-records" className="mt-6 overflow-hidden rounded-xl border bg-card shadow-sm">
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
            <div className="hidden w-full lg:block">
              <table className="w-full table-fixed text-left text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="w-[28%] px-3 py-4 font-semibold xl:px-5">
                      Doctor
                    </th>

                    <th className="w-[15%] px-3 py-4 font-semibold xl:px-5">
                      Schedule
                    </th>

                    <th className="w-[21%] px-3 py-4 font-semibold xl:px-5">
                      Reason
                    </th>

                    <th className="w-[12%] px-3 py-4 font-semibold xl:px-5">
                      Type
                    </th>

                    <th className="w-[13%] px-3 py-4 font-semibold xl:px-5">
                      Status
                    </th>

                    <th className="w-[11%] px-3 py-4 text-right font-semibold xl:px-5">
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

async function getPatientAppointments({
  patientUserId,
  search,
  status,
  dateFilter,
  page,
}) {
  await connectDB();

  const filter = {
    patientId: patientUserId,
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

  const appointmentDocuments =
    await Appointment.find(filter)
      .populate({
        path: "doctorId",
        select: "name email phone",
      })
      .sort({
        appointmentDate: -1,
        appointmentTime: 1,
        createdAt: -1,
      })
      .lean();

  const normalizedAppointments =
    appointmentDocuments.map(
      normalizeAppointment
    );

  const normalizedSearch =
    search.toLowerCase();

  const searchedAppointments = search
    ? normalizedAppointments.filter(
        (appointment) => {
          const values = [
            appointment.doctor.name,
            appointment.doctor.email,
            appointment.doctor.specialization,
            appointment.reason,
            appointment.symptoms,
            appointment.consultationType,
            appointment.referenceNumber,
          ];

          return values.some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(normalizedSearch)
          );
        }
      )
    : normalizedAppointments;

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

  const appointments =
    searchedAppointments.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );

  const patientFilter = {
    patientId: patientUserId,
  };

  const [
    pendingAppointments,
    confirmedAppointments,
    completedAppointments,
    cancelledAppointments,
  ] = await Promise.all([
    Appointment.countDocuments({
      ...patientFilter,
      status: "pending",
    }),

    Appointment.countDocuments({
      ...patientFilter,
      status: "confirmed",
    }),

    Appointment.countDocuments({
      ...patientFilter,
      status: "completed",
    }),

    Appointment.countDocuments({
      ...patientFilter,
      status: "cancelled",
    }),
  ]);

  return {
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

function normalizeAppointment(appointment) {
  const doctorReference =
    appointment.doctorId || {};

  /*
    doctorId if User to reference does:
    doctorReference.name available will be.

    doctorId if DoctorProfile to reference does:
    doctorReference.userId.name available will be.
  */
  const doctorUser =
    doctorReference.userId &&
    typeof doctorReference.userId === "object"
      ? doctorReference.userId
      : doctorReference;

  return {
    id: appointment._id.toString(),

    referenceNumber:
      appointment.referenceNumber ||
      appointment.bookingNumber ||
      `APT-${appointment._id
        .toString()
        .slice(-8)
        .toUpperCase()}`,

    doctor: {
      name:
        doctorUser?.name ||
        "Doctor unavailable",

      email:
        doctorUser?.email ||
        "Email unavailable",

      phone:
        doctorUser?.phone ||
        "Phone unavailable",

      specialization:
        doctorReference?.specialization ||
        appointment.doctorSpecialization ||
        "General Physician",

      qualification:
        doctorReference?.qualification ||
        "Not provided",

      clinicName:
        doctorReference?.clinicName ||
        appointment.clinicName ||
        "Not provided",
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
        appointment.symptoms,
        "No reason provided"
      ),

    symptoms: formatListOrText(
      appointment.symptoms,
      "No symptoms provided"
    ),

    consultationType:
      formatReadableText(
        appointment.consultationType ||
          appointment.type ||
          "In person"
      ),

    status:
      appointment.status || "pending",

    createdAt:
      appointment.createdAt || null,
  };
}

function AppointmentTableRow({
  appointment,
}) {
  return (
    <tr className="transition hover:bg-muted/30">
      <td className="px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Stethoscope
              className="size-5"
              aria-hidden="true"
            />
          </span>

          <div className="min-w-0">
            <p className="max-w-[220px] truncate font-semibold">
              {appointment.doctor.name}
            </p>

            <p className="max-w-[220px] truncate text-xs text-muted-foreground">
              {appointment.doctor.specialization}
            </p>

            <p className="mt-1 max-w-[220px] truncate text-xs text-muted-foreground">
              {appointment.doctor.email}
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
        <p className="max-w-[270px] line-clamp-2 text-sm leading-6 text-muted-foreground">
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
          href={`/patient/appointments/${appointment.id}`}
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
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Stethoscope
            className="size-5"
            aria-hidden="true"
          />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">
            {appointment.doctor.name}
          </p>

          <p className="truncate text-xs text-muted-foreground">
            {appointment.doctor.specialization}
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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {appointment.consultationType}
        </span>

        <Link
          href={`/patient/appointments/${appointment.id}`}
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
    <div className="flex items-center gap-3 rounded-xl border bg-card p-5 shadow-sm">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon
          className="size-5"
          aria-hidden="true"
        />
      </span>

      <div>
        <p className="text-xs text-muted-foreground">
          {label}
        </p>

        <p className="mt-1 text-xl font-bold">
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
          : "No appointments booked"}
      </h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {hasFilters
          ? "Search, status or date filter change and try again."
          : "Book your first doctor consultation to get started."}
      </p>

      {hasFilters ? (
        <Link
          href="/patient/appointments"
          className="focus-ring mt-5 inline-flex h-10 items-center justify-center rounded-lg border bg-background px-4 text-sm font-semibold transition hover:bg-muted"
        >
          Clear filters
        </Link>
      ) : (
        <Link
          href="/patient/appointments/new"
          className="focus-ring mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <CalendarPlus
            className="size-4"
            aria-hidden="true"
          />

          Book Appointment
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

  return `/patient/appointments?${params.toString()}`;
}

function formatListOrText(
  value,
  fallback = "Not provided"
) {
  if (!value) {
    return fallback;
  }

  if (Array.isArray(value)) {
    const values = value
      .map((item) => {
        if (typeof item === "string") {
          return item.trim();
        }

        return String(
          item?.name ||
            item?.value ||
            item?.symptom ||
            ""
        ).trim();
      })
      .filter(Boolean);

    return values.length > 0
      ? values.join(", ")
      : fallback;
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
