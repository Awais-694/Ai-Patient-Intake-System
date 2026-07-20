import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck2,
  CalendarDays,
  CalendarPlus,
  CalendarX,
  CircleAlert,
  Clock3,
  Stethoscope,
  UserRound,
  UsersRound,
} from "lucide-react";

import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { USER_ROLES } from "@/lib/constants";
import DoctorProfile from "@/models/DoctorProfile";
import Appointment from "@/models/Appointment";

export const metadata = {
  title: "Doctor Dashboard",
  description:
    "View doctor profile status, appointments, and patient activity.",
};

export const dynamic = "force-dynamic";

export default async function DoctorDashboardPage() {
  const session = await auth();

  if (
    !session?.user ||
    session.user.role !== USER_ROLES.DOCTOR
  ) {
    redirect("/unauthorized");
  }

  const dashboardData = await getDoctorDashboardData(
    session.user.id
  );

  const statistics = [
    {
      title: "Today's Appointments",
      value: dashboardData.todayAppointments,
      description: "Scheduled for today",
      icon: CalendarDays,
      href: "/doctor/appointments?date=today",
    },
    {
      title: "Pending Requests",
      value: dashboardData.pendingAppointments,
      description: "Waiting for confirmation",
      icon: Clock3,
      href: "/doctor/appointments?status=pending",
    },
    {
      title: "Completed",
      value: dashboardData.completedAppointments,
      description: "Completed consultations",
      icon: CalendarCheck2,
      href: "/doctor/appointments?status=completed",
    },
    {
      title: "Unique Patients",
      value: dashboardData.uniquePatients,
      description: "Patients consulted or scheduled",
      icon: UsersRound,
      href: "/doctor/patients",
    },
  ];

  return (
    <div className="dashboard-container">
      <header className="flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">
            Doctor Portal
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Welcome, Dr. {getFirstName(session.user.name)}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            View an overview of your appointments, patients, and
            professional profile.
          </p>
        </div>

        <Link
          href="/doctor/profile"
          className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-background px-4 text-sm font-semibold transition hover:bg-muted"
        >
          <Stethoscope
            className="size-4"
            aria-hidden="true"
          />

          Manage Profile
        </Link>
      </header>

      <div className="mt-6">
        <ProfileStatusBanner
          profile={dashboardData.profile}
        />
      </div>

      <section
        className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Doctor statistics"
      >
        {statistics.map((statistic) => (
          <StatisticCard
            key={statistic.title}
            {...statistic}
          />
        ))}
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">
                Upcoming Appointments
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Your next scheduled consultations.
              </p>
            </div>

            <Link
              href="/doctor/appointments"
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
            <EmptyState
              icon={CalendarPlus}
              title="No upcoming appointments"
              description="Your confirmed and pending appointments will appear here."
            />
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border bg-card shadow-sm">
            <div className="border-b p-5">
              <h2 className="font-semibold">
                Appointment Summary
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Current appointment status distribution.
              </p>
            </div>

            <div className="space-y-4 p-5">
              <StatusRow
                label="Pending"
                value={dashboardData.pendingAppointments}
                total={dashboardData.totalAppointments}
              />

              <StatusRow
                label="Confirmed"
                value={dashboardData.confirmedAppointments}
                total={dashboardData.totalAppointments}
              />

              <StatusRow
                label="Completed"
                value={dashboardData.completedAppointments}
                total={dashboardData.totalAppointments}
              />

              <StatusRow
                label="Cancelled"
                value={dashboardData.cancelledAppointments}
                total={dashboardData.totalAppointments}
              />
            </div>
          </section>

          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="font-semibold">
              Quick Actions
            </h2>

            <div className="mt-4 space-y-2">
              <QuickAction
                href="/doctor/appointments"
                icon={CalendarDays}
                label="Manage appointments"
              />

              <QuickAction
                href="/doctor/patients"
                icon={UserRound}
                label="View patients"
              />

              <QuickAction
                href="/doctor/schedule"
                icon={Clock3}
                label="Update schedule"
              />

              <QuickAction
                href="/doctor/profile"
                icon={Stethoscope}
                label="Edit professional profile"
              />
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

async function getDoctorDashboardData(userId) {
  await connectDB();

  const profile = await DoctorProfile.findOne({
    userId,
  }).lean();

  const doctorReferenceIds = [userId];

  if (profile?._id) {
    doctorReferenceIds.push(profile._id);
  }

  /*
    Kuch Appointment schemas doctorId in User ID store
    use and some DoctorProfile ID.

    Therefore, both possible IDs are supported.
  */
  const doctorFilter = {
    doctorId: {
      $in: doctorReferenceIds,
    },
  };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(
    tomorrowStart.getDate() + 1
  );

  const [
    totalAppointments,
    todayAppointments,
    pendingAppointments,
    confirmedAppointments,
    completedAppointments,
    cancelledAppointments,
    patientIds,
    upcomingDocuments,
  ] = await Promise.all([
    Appointment.countDocuments(doctorFilter),

    Appointment.countDocuments({
      ...doctorFilter,

      appointmentDate: {
        $gte: todayStart,
        $lt: tomorrowStart,
      },

      status: {
        $in: ["pending", "confirmed"],
      },
    }),

    Appointment.countDocuments({
      ...doctorFilter,
      status: "pending",
    }),

    Appointment.countDocuments({
      ...doctorFilter,
      status: "confirmed",
    }),

    Appointment.countDocuments({
      ...doctorFilter,
      status: "completed",
    }),

    Appointment.countDocuments({
      ...doctorFilter,
      status: "cancelled",
    }),

    Appointment.distinct(
      "patientId",
      doctorFilter
    ),

    Appointment.find({
      ...doctorFilter,

      appointmentDate: {
        $gte: todayStart,
      },

      status: {
        $in: ["pending", "confirmed"],
      },
    })
      .populate({
        path: "patientId",
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

      patientName:
        appointment.patientId?.name ||
        "Patient unavailable",

      patientEmail:
        appointment.patientId?.email ||
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
        appointment.symptoms ||
        "No reason provided",

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
    profile: {
      exists: Boolean(profile),

      approvalStatus:
        profile?.approvalStatus ||
        "pending",

      rejectionReason:
        profile?.rejectionReason || "",

      profileCompleted:
        getProfileCompletion(profile) === 100,

      profileCompletionPercentage:
        getProfileCompletion(profile),
    },

    totalAppointments,
    todayAppointments,
    pendingAppointments,
    confirmedAppointments,
    completedAppointments,
    cancelledAppointments,
    uniquePatients: patientIds.filter(Boolean).length,
    upcomingAppointments,
  };
}

function ProfileStatusBanner({ profile }) {
  if (!profile.exists) {
    return (
      <StatusBanner
        icon={CircleAlert}
        title="Professional profile incomplete"
        description="Complete your doctor profile before receiving appointment requests."
        linkLabel="Complete profile"
        href="/doctor/profile"
        classes="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
      />
    );
  }

  if (!profile.profileCompleted) {
    return (
      <StatusBanner
        icon={CircleAlert}
        title={`Profile ${profile.profileCompletionPercentage}% complete`}
        description="Complete the missing professional information and submit it for administrator review."
        linkLabel="Continue profile"
        href="/doctor/profile"
        classes="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
      />
    );
  }

  if (profile.approvalStatus === "rejected") {
    return (
      <StatusBanner
        icon={CalendarX}
        title="Profile changes required"
        description={
          profile.rejectionReason ||
          "Admin ne profile in changes request of are."
        }
        linkLabel="Correct profile"
        href="/doctor/profile"
        classes="border-destructive/30 bg-destructive/10 text-destructive"
      />
    );
  }

  if (profile.approvalStatus === "approved") {
    return (
      <StatusBanner
        icon={BadgeCheck}
        title="Doctor profile approved"
        description="Your profile is active, and patients can book appointments with you."
        linkLabel="View profile"
        href="/doctor/profile"
        classes="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      />
    );
  }

  return (
    <StatusBanner
      icon={Clock3}
      title="Profile approval pending"
      description="An administrator is reviewing your professional credentials and license information."
      linkLabel="Review submitted profile"
      href="/doctor/profile"
      classes="border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400"
    />
  );
}

function StatusBanner({
  icon: Icon,
  title,
  description,
  linkLabel,
  href,
  classes,
}) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between ${classes}`}
    >
      <div className="flex items-start gap-3">
        <Icon
          className="mt-0.5 size-5 shrink-0"
          aria-hidden="true"
        />

        <div>
          <p className="font-semibold">
            {title}
          </p>

          <p className="mt-1 text-sm leading-6">
            {description}
          </p>
        </div>
      </div>

      <Link
        href={href}
        className="focus-ring inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-current/20 bg-background/60 px-4 text-sm font-semibold transition hover:bg-background"
      >
        {linkLabel}

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
}) {
  return (
    <Link
      href={href}
      className="focus-ring group rounded-xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
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

function AppointmentRow({ appointment }) {
  return (
    <article className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {getInitials(
            appointment.patientName
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {appointment.patientName}
          </p>

          <p className="truncate text-xs text-muted-foreground">
            {appointment.patientEmail}
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
          href={`/doctor/appointments/${appointment.id}`}
          className="focus-ring inline-flex size-9 items-center justify-center rounded-lg border bg-background transition hover:bg-muted"
          aria-label={`View appointment with ${appointment.patientName}`}
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

      <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function getProfileCompletion(profile) {
  if (!profile) {
    return 0;
  }

  const checks = [
    Boolean(profile.specialization),
    Boolean(profile.qualification),
    Boolean(profile.licenseNumber),
    Number.isFinite(Number(profile.experienceYears)),
    Number.isFinite(Number(profile.consultationFee)),
    Boolean(profile.clinicAddress),
    Boolean(profile.city),
    Boolean(profile.biography),
    Number(profile.appointmentDuration) >= 10,
    Array.isArray(profile.availability) &&
      profile.availability.some(
        (day) => day.isAvailable && day.slots?.length > 0
      ),
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}

function getFirstName(name = "") {
  const normalizedName = name
    .trim()
    .replace(/^(dr\.?|doctor)\s+/i, "");
  const firstName = normalizedName.split(/\s+/)[0];

  return firstName || "Doctor";
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
