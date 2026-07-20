import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  CalendarPlus,
  CalendarX,
  CircleAlert,
  Clock3,
  FileHeart,
  Stethoscope,
  UserRound,
} from "lucide-react";

import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { USER_ROLES } from "@/lib/constants";
import PatientProfile from "@/models/PatientProfile";
import Appointment from "@/models/Appointment";

export const metadata = {
  title: "Patient Dashboard",
  description:
    "View your MediAssist appointments, medical profile, and healthcare activity.",
};

export const dynamic = "force-dynamic";

export default async function PatientDashboardPage() {
  const session = await auth();

  if (
    !session?.user ||
    session.user.role !== USER_ROLES.PATIENT
  ) {
    redirect("/unauthorized");
  }

  const dashboardData = await getPatientDashboardData(
    session.user.id
  );

  const statistics = [
    {
      title: "Upcoming",
      value: dashboardData.upcomingCount,
      description: "Pending or confirmed appointments",
      icon: CalendarDays,
      tone: "blue",
      href: "/patient/appointments?date=upcoming",
    },
    {
      title: "Pending",
      value: dashboardData.pendingCount,
      description: "Waiting for doctor confirmation",
      icon: Clock3,
      tone: "amber",
      href: "/patient/appointments?status=pending",
    },
    {
      title: "Completed",
      value: dashboardData.completedCount,
      description: "Completed consultations",
      icon: CalendarCheck2,
      tone: "emerald",
      href: "/patient/appointments?status=completed",
    },
    {
      title: "Cancelled",
      value: dashboardData.cancelledCount,
      description: "Cancelled appointments",
      icon: CalendarX,
      tone: "red",
      href: "/patient/appointments?status=cancelled",
    },
  ];

  return (
    <div className="dashboard-container">
      <header className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-6 shadow-sm sm:p-8">
        <div className="absolute -right-16 -top-20 size-52 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">
            Patient Portal
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Welcome, {getFirstName(session.user.name)}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            View an overview of your upcoming appointments, medical profile, and
            consultation history.
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
        </div>
      </header>

      <div className="mt-6">
        <ProfileCompletionBanner
          profile={dashboardData.profile}
        />
      </div>

      <section
        className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Patient appointment statistics"
      >
        {statistics.map((statistic) => (
          <StatisticCard
            key={statistic.title}
            {...statistic}
          />
        ))}
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b bg-muted/20 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">
                Upcoming Appointments
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Your next scheduled consultations.
              </p>
            </div>

            <Link
              href="/patient/appointments"
              className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-semibold text-primary hover:underline"
            >
              View all

              <ArrowRight
                className="size-4"
                aria-hidden="true"
              />
            </Link>
          </div>

          {dashboardData.upcomingAppointments.length > 0 ? (
            <div className="divide-y">
              {dashboardData.upcomingAppointments.map(
                (appointment) => (
                  <AppointmentRow
                    key={appointment.id}
                    appointment={appointment}
                  />
                )
              )}
            </div>
          ) : (
            <EmptyAppointments />
          )}
        </div>

        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="flex items-start gap-3 border-b bg-gradient-to-r from-primary/10 to-transparent p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <FileHeart className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold">Medical Profile</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  A summary of your important medical information.
                </p>
              </div>
            </div>

            <dl className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <ProfileDetail
                label="Blood group"
                value={dashboardData.profile.bloodGroup}
              />

              <ProfileDetail
                label="Known allergies"
                value={dashboardData.profile.allergies}
              />

              <ProfileDetail
                label="Chronic conditions"
                value={
                  dashboardData.profile.chronicConditions
                }
              />

              <ProfileDetail
                label="Current medications"
                value={
                  dashboardData.profile.currentMedications
                }
              />
            </dl>

            <Link
              href="/patient/profile"
              className="focus-ring mx-5 mb-5 inline-flex h-10 w-[calc(100%-2.5rem)] items-center justify-center gap-2 rounded-lg border bg-background text-sm font-semibold transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
            >
              <FileHeart
                className="size-4"
                aria-hidden="true"
              />

              Manage Medical Profile
            </Link>
          </section>

          <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="border-b bg-muted/20 p-5">
              <h2 className="font-semibold">Quick Actions</h2>
              <p className="mt-1 text-sm text-muted-foreground">Manage your care and appointments.</p>
            </div>

            <div className="space-y-2 p-5">
              <QuickAction
                href="/patient/appointments/new"
                icon={CalendarPlus}
                label="Book new appointment"
              />

              <QuickAction
                href="/patient/appointments"
                icon={CalendarDays}
                label="View appointments"
              />

              <QuickAction
                href="/patient/profile"
                icon={UserRound}
                label="Update profile"
              />
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

async function getPatientDashboardData(userId) {
  await connectDB();

  const profile = await PatientProfile.findOne({
    userId,
  }).lean();

  const patientFilter = {
    patientId: userId,
  };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    pendingCount,
    confirmedCount,
    completedCount,
    cancelledCount,
    upcomingDocuments,
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

    Appointment.find({
      ...patientFilter,

      appointmentDate: {
        $gte: todayStart,
      },

      status: {
        $in: ["pending", "confirmed"],
      },
    })
      .populate({
        path: "doctorId",
        select: "name email phone",
      })
      .sort({
        appointmentDate: 1,
        appointmentTime: 1,
      })
      .limit(5)
      .lean(),
  ]);

  const upcomingAppointments =
    upcomingDocuments.map((appointment) => ({
      id: appointment._id.toString(),

      doctorName:
        appointment.doctorId?.name ||
        "Doctor unavailable",

      doctorEmail:
        appointment.doctorId?.email ||
        "Email unavailable",

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

      consultationType:
        formatReadableText(
          appointment.consultationType ||
            appointment.type ||
            "In person"
        ),

      status:
        appointment.status || "pending",
    }));

  return {
    pendingCount,
    confirmedCount,
    completedCount,
    cancelledCount,

    upcomingCount:
      pendingCount + confirmedCount,

    upcomingAppointments,

    profile: {
      exists: Boolean(profile),

      profileCompleted:
        profile?.profileCompleted === true,

      profileCompletionPercentage:
        getProfileCompletion(profile),

      bloodGroup:
        profile?.bloodGroup ||
        "Not provided",

      allergies: formatListOrText(
        profile?.allergies,
        "No allergies recorded"
      ),

      chronicConditions:
        formatListOrText(
          profile?.chronicConditions,
          "No chronic conditions recorded"
        ),

      currentMedications:
        formatListOrText(
          profile?.currentMedications,
          "No current medications recorded"
        ),
    },
  };
}

function ProfileCompletionBanner({ profile }) {
  if (!profile.exists) {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-700 dark:text-amber-400 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <CircleAlert
            className="mt-0.5 size-5 shrink-0"
            aria-hidden="true"
          />

          <div>
            <p className="font-semibold">
              Medical profile incomplete
            </p>

            <p className="mt-1 text-sm leading-6">
              Complete your medical profile to support safe,
              personalized appointment intake.
            </p>
          </div>
        </div>

        <Link
          href="/patient/profile"
          className="focus-ring inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-current/20 bg-background/60 px-4 text-sm font-semibold"
        >
          Complete Profile

          <ArrowRight
            className="size-4"
            aria-hidden="true"
          />
        </Link>
      </div>
    );
  }

  if (!profile.profileCompleted) {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-blue-500/30 bg-blue-500/10 p-5 text-blue-700 dark:text-blue-400 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <FileHeart
            className="mt-0.5 size-5 shrink-0"
            aria-hidden="true"
          />

          <div>
            <p className="font-semibold">
              Profile {profile.profileCompletionPercentage}% complete
            </p>

            <p className="mt-1 text-sm leading-6">
              Complete missing medical details to provide doctors with
              better information.
            </p>
          </div>
        </div>

        <Link
          href="/patient/profile"
          className="focus-ring inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-current/20 bg-background/60 px-4 text-sm font-semibold"
        >
          Continue Profile

          <ArrowRight
            className="size-4"
            aria-hidden="true"
          />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-emerald-700 dark:text-emerald-400 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <FileHeart
          className="mt-0.5 size-5 shrink-0"
          aria-hidden="true"
        />

        <div>
          <p className="font-semibold">
            Medical profile complete
          </p>

          <p className="mt-1 text-sm leading-6">
            Your important health information is available for
            appointment intake.
          </p>
        </div>
      </div>

      <Link
        href="/patient/profile"
        className="focus-ring inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-current/20 bg-background/60 px-4 text-sm font-semibold"
      >
        Review Profile

        <ArrowRight
          className="size-4"
          aria-hidden="true"
        />
      </Link>
    </div>
  );
}

function StatisticCard({
  title,
  value,
  description,
  icon: Icon,
  href,
  tone = "blue",
}) {
  const tones = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    red: "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  return (
    <Link
      href={href}
      className="focus-ring group rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <span className={`flex size-11 items-center justify-center rounded-xl ${tones[tone] || tones.blue}`}>
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

function AppointmentRow({ appointment }) {
  return (
    <article className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Stethoscope
            className="size-5"
            aria-hidden="true"
          />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {appointment.doctorName}
          </p>

          <p className="truncate text-xs text-muted-foreground">
            {appointment.doctorEmail}
          </p>

          <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
            {appointment.reason}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        <div className="text-left sm:text-right">
          <p className="text-sm font-semibold">
            {formatDate(
              appointment.appointmentDate
            )}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {appointment.appointmentTime}
            {" • "}
            {appointment.consultationType}
          </p>
        </div>

        <AppointmentStatusBadge
          status={appointment.status}
        />

        <Link
          href={`/patient/appointments/${appointment.id}`}
          className="focus-ring inline-flex size-9 items-center justify-center rounded-lg border bg-background transition hover:bg-muted"
          aria-label={`View appointment with ${appointment.doctorName}`}
        >
          <ArrowRight
            className="size-4"
            aria-hidden="true"
          />
        </Link>
      </div>
    </article>
  );
}

function AppointmentStatusBadge({ status }) {
  const normalizedStatus =
    String(status || "pending").toLowerCase();

  const styles = {
    pending:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400",

    confirmed:
      "bg-blue-500/10 text-blue-700 dark:text-blue-400",

    completed:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",

    cancelled:
      "bg-destructive/10 text-destructive",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
        styles[normalizedStatus] ||
        styles.pending
      }`}
    >
      {normalizedStatus}
    </span>
  );
}

function ProfileDetail({ label, value }) {
  return (
    <div className="rounded-xl border bg-background p-3.5">
      <dt className="text-xs font-medium text-muted-foreground">
        {label}
      </dt>

      <dd className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6">
        {value || "Not provided"}
      </dd>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}) {
  return (
    <Link
      href={href}
      className="focus-ring group flex items-center justify-between gap-4 rounded-lg border bg-background p-3 transition hover:bg-muted"
    >
      <span className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon
            className="size-4"
            aria-hidden="true"
          />
        </span>

        <span className="text-sm font-medium">
          {label}
        </span>
      </span>

      <ArrowRight
        className="size-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary"
        aria-hidden="true"
      />
    </Link>
  );
}

function EmptyAppointments() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <CalendarPlus
          className="size-5"
          aria-hidden="true"
        />
      </span>

      <h3 className="mt-4 text-sm font-semibold">
        No upcoming appointments
      </h3>

      <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
        You currently have no pending or confirmed appointments.
      </p>

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
    </div>
  );
}

function getProfileCompletion(profile) {
  if (!profile) {
    return 0;
  }

  const percentage = Number(
    profile.profileCompletionPercentage
  );

  if (Number.isFinite(percentage)) {
    return Math.min(
      100,
      Math.max(0, percentage)
    );
  }

  return profile.profileCompleted
    ? 100
    : 0;
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
            item?.condition ||
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

function getFirstName(name = "") {
  const firstName = name
    .trim()
    .split(/\s+/)[0];

  return firstName || "Patient";
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
