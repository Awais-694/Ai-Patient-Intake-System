import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Stethoscope,
  UsersRound,
} from "lucide-react";

import connectDB from "@/lib/db";
import { USER_ROLES } from "@/lib/constants";
import User from "@/models/User";
import DoctorProfile from "@/models/DoctorProfile";
import Appointment from "@/models/Appointment";

export const metadata = {
  title: "Admin Dashboard",
  description:
    "View MediAssist users, doctors, appointments, and pending approvals.",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const dashboardData = await getAdminDashboardData();

  const statistics = [
    {
      title: "Total Patients",
      value: dashboardData.totalPatients,
      description: "Registered patient accounts",
      icon: UsersRound,
      href: "/admin/patients",
    },
    {
      title: "Total Doctors",
      value: dashboardData.totalDoctors,
      description: "Registered doctor accounts",
      icon: Stethoscope,
      href: "/admin/doctors",
    },
    {
      title: "Pending Approvals",
      value: dashboardData.pendingDoctors,
      description: "Doctors waiting for review",
      icon: Clock3,
      href: "/admin/doctors?status=pending",
    },
    {
      title: "Appointments",
      value: dashboardData.totalAppointments,
      description: "Appointments created so far",
      icon: CalendarDays,
      href: "/admin/appointments",
    },
  ];

  return (
    <div className="dashboard-container">
      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">
            Administration
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Admin Dashboard
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            MediAssist users, doctor approvals and appointment
            activity of overview view.
          </p>
        </div>

        <Link
          href="/admin/doctors?status=pending"
          className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Review Doctors

          <ArrowRight
            className="size-4"
            aria-hidden="true"
          />
        </Link>
      </header>

      <section
        className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Admin statistics"
      >
        {statistics.map((statistic) => (
          <StatisticCard
            key={statistic.title}
            {...statistic}
          />
        ))}
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b p-5">
            <div>
              <h2 className="font-semibold">
                Recent Doctor Registrations
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Latest doctors who joined MediAssist.
              </p>
            </div>

            <Link
              href="/admin/doctors"
              className="focus-ring rounded-md text-sm font-semibold text-primary hover:underline"
            >
              View all
            </Link>
          </div>

          {dashboardData.recentDoctors.length > 0 ? (
            <div className="divide-y">
              {dashboardData.recentDoctors.map(
                (doctor) => (
                  <DoctorRow
                    key={doctor.id}
                    doctor={doctor}
                  />
                )
              )}
            </div>
          ) : (
            <EmptyState
              icon={Stethoscope}
              title="No doctors found"
              description="Doctor registrations here will appear."
            />
          )}
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="border-b p-5">
            <h2 className="font-semibold">
              Appointment Status
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Current appointment distribution.
            </p>
          </div>

          <div className="space-y-4 p-5">
            <StatusRow
              label="Pending"
              value={dashboardData.appointmentCounts.pending}
              total={dashboardData.totalAppointments}
            />

            <StatusRow
              label="Confirmed"
              value={dashboardData.appointmentCounts.confirmed}
              total={dashboardData.totalAppointments}
            />

            <StatusRow
              label="Completed"
              value={dashboardData.appointmentCounts.completed}
              total={dashboardData.totalAppointments}
            />

            <StatusRow
              label="Cancelled"
              value={dashboardData.appointmentCounts.cancelled}
              total={dashboardData.totalAppointments}
            />
          </div>

          <div className="border-t p-5">
            <Link
              href="/admin/appointments"
              className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-semibold text-primary hover:underline"
            >
              Manage appointments

              <ArrowRight
                className="size-4"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

async function getAdminDashboardData() {
  await connectDB();

  const [
    totalPatients,
    totalDoctors,
    pendingDoctors,
    totalAppointments,
    pendingAppointments,
    confirmedAppointments,
    completedAppointments,
    cancelledAppointments,
    recentDoctorProfiles,
  ] = await Promise.all([
    User.countDocuments({
      role: USER_ROLES.PATIENT,
    }),

    User.countDocuments({
      role: USER_ROLES.DOCTOR,
    }),

    DoctorProfile.countDocuments({
      approvalStatus: "pending",
    }),

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

    DoctorProfile.find()
      .populate({
        path: "userId",
        select: "name email createdAt isActive",
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const recentDoctors = recentDoctorProfiles
    .filter((profile) => profile.userId)
    .map((profile) => ({
      id: profile._id.toString(),

      name:
        profile.userId.name ||
        "Unnamed Doctor",

      email:
        profile.userId.email ||
        "Email unavailable",

      specialization:
        profile.specialization ||
        "Profile incomplete",

      approvalStatus:
        profile.approvalStatus ||
        "pending",

      isActive:
        profile.userId.isActive !== false,

      createdAt:
        profile.createdAt ||
        profile.userId.createdAt,
    }));

  return {
    totalPatients,
    totalDoctors,
    pendingDoctors,
    totalAppointments,

    appointmentCounts: {
      pending: pendingAppointments,
      confirmed: confirmedAppointments,
      completed: completedAppointments,
      cancelled: cancelledAppointments,
    },

    recentDoctors,
  };
}

function StatisticCard({
  title,
  value,
  description,
  icon: Icon,
  href,
}) {
  return (
    <Link
      href={href}
      className="focus-ring group rounded-xl border bg-card p-5 text-card-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon
            className="size-5"
            aria-hidden="true"
          />
        </span>

        <ArrowRight
          className="size-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary"
          aria-hidden="true"
        />
      </div>

      <p className="mt-5 text-3xl font-bold">
        {value.toLocaleString()}
      </p>

      <h2 className="mt-2 text-sm font-semibold">
        {title}
      </h2>

      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </Link>
  );
}

function DoctorRow({ doctor }) {
  return (
    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {getInitials(doctor.name)}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {doctor.name}
          </p>

          <p className="truncate text-xs text-muted-foreground">
            {doctor.email}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {doctor.specialization}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
        <ApprovalBadge
          status={doctor.approvalStatus}
        />

        <span className="text-xs text-muted-foreground">
          {formatDate(doctor.createdAt)}
        </span>
      </div>
    </div>
  );
}

function ApprovalBadge({ status }) {
  const styles = {
    approved:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",

    rejected:
      "bg-destructive/10 text-destructive",

    pending:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  };

  const normalizedStatus =
    status?.toLowerCase() || "pending";

  return (
    <span
      className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
        styles[normalizedStatus] || styles.pending
      }`}
    >
      {normalizedStatus}
    </span>
  );
}

function StatusRow({
  label,
  value,
  total,
}) {
  const percentage =
    total > 0
      ? Math.round((value / total) * 100)
      : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-medium">
          {label}
        </span>

        <span className="text-muted-foreground">
          {value.toLocaleString()} ({percentage}%)
        </span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon
          className="size-5"
          aria-hidden="true"
        />
      </span>

      <h3 className="mt-4 text-sm font-semibold">
        {title}
      </h3>

      <p className="mt-1 text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function getInitials(name = "") {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "DR";
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

  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}