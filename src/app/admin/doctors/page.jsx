import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CircleX,
  Clock3,
  Search,
  Stethoscope,
  UserRoundCheck,
} from "lucide-react";

import connectDB from "@/lib/db";
import { USER_ROLES } from "@/lib/constants";
import User from "@/models/User";
import DoctorProfile from "@/models/DoctorProfile";

export const metadata = {
  title: "Manage Doctors",
  description:
    "Search, review, approve, and manage MediAssist doctor accounts.",
};

export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 10;

const ALLOWED_STATUSES = [
  "all",
  "pending",
  "approved",
  "rejected",
];

export default async function AdminDoctorsPage({
  searchParams,
}) {
  /*
    Modern Next.js App Router searchParams Promise
    may be a Promise, so await is used.
  */
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

  const result = await getDoctors({
    search,
    status,
    page,
  });

  return (
    <div className="dashboard-container">
      <header className="flex flex-col gap-4 border-b pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">
            Doctor Management
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Doctors
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Registered doctors to search please, unki
            professional profile review please and approval
            status manage please.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <SummaryBadge
            label="Total"
            value={result.summary.total}
            icon={Stethoscope}
          />

          <SummaryBadge
            label="Pending"
            value={result.summary.pending}
            icon={Clock3}
          />
        </div>
      </header>

      <section className="mt-6 rounded-xl border bg-card p-4 shadow-sm sm:p-5">
        <form
          action="/admin/doctors"
          method="GET"
          className="grid gap-4 lg:grid-cols-[1fr_220px_auto]"
        >
          <div>
            <label
              htmlFor="doctor-search"
              className="text-sm font-medium"
            >
              Search doctors
            </label>

            <div className="relative mt-2">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />

              <input
                id="doctor-search"
                name="search"
                type="search"
                defaultValue={search}
                placeholder="Name, email, specialization..."
                className="focus-ring h-11 w-full rounded-lg border bg-background pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="doctor-status"
              className="text-sm font-medium"
            >
              Approval status
            </label>

            <select
              id="doctor-status"
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

              <option value="approved">
                Approved
              </option>

              <option value="rejected">
                Rejected
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
                href="/admin/doctors"
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
              Doctor Accounts
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

        {result.doctors.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-4 font-semibold">
                      Doctor
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Specialization
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Profile
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Status
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Account
                    </th>

                    <th className="px-5 py-4 text-right font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {result.doctors.map((doctor) => (
                    <DoctorTableRow
                      key={doctor.id}
                      doctor={doctor}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y md:hidden">
              {result.doctors.map((doctor) => (
                <DoctorMobileCard
                  key={doctor.id}
                  doctor={doctor}
                />
              ))}
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

async function getDoctors({
  search,
  status,
  page,
}) {
  await connectDB();

  /*
    before doctor users search will, then un users
    of DoctorProfile records fetch will.
  */
  const userFilter = {
    role: USER_ROLES.DOCTOR,
  };

  if (search) {
    userFilter.$or = [
      {
        name: {
          $regex: escapeRegExp(search),
          $options: "i",
        },
      },
      {
        email: {
          $regex: escapeRegExp(search),
          $options: "i",
        },
      },
    ];
  }

  const matchingUsers = await User.find(userFilter)
    .select("_id name email isActive createdAt")
    .lean();

  const matchingUserIds = matchingUsers.map(
    (user) => user._id
  );

  const profileFilter = {};

  /*
    When the search is blank, all doctor profiles are allowed.
    When a search is provided, match user IDs or specialization.
    must be.
  */
  if (search) {
    profileFilter.$or = [
      {
        userId: {
          $in: matchingUserIds,
        },
      },
      {
        specialization: {
          $regex: escapeRegExp(search),
          $options: "i",
        },
      },
      {
        qualification: {
          $regex: escapeRegExp(search),
          $options: "i",
        },
      },
      {
        licenseNumber: {
          $regex: escapeRegExp(search),
          $options: "i",
        },
      },
    ];
  }

  if (status !== "all") {
    profileFilter.approvalStatus = status;
  }

  const [
    totalResults,
    profiles,
    totalDoctors,
    pendingDoctors,
  ] = await Promise.all([
    DoctorProfile.countDocuments(profileFilter),

    DoctorProfile.find(profileFilter)
      .populate({
        path: "userId",
        select:
          "name email isActive createdAt profileImage",
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
      .lean(),

    User.countDocuments({
      role: USER_ROLES.DOCTOR,
    }),

    DoctorProfile.countDocuments({
      approvalStatus: "pending",
    }),
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(totalResults / ITEMS_PER_PAGE)
  );

  /*
    If the requested page exceeds the total number of pages, display the last page.
    
  */
  if (page > totalPages && totalResults > 0) {
    return getDoctors({
      search,
      status,
      page: totalPages,
    });
  }

  const doctors = profiles
    .filter((profile) => profile.userId)
    .map((profile) => ({
      id: profile._id.toString(),
      userId: profile.userId._id.toString(),

      name:
        profile.userId.name ||
        "Unnamed Doctor",

      email:
        profile.userId.email ||
        "Email unavailable",

      specialization:
        profile.specialization ||
        "Not provided",

      qualification:
        profile.qualification ||
        "Not provided",

      licenseNumber:
        profile.licenseNumber ||
        "Not provided",

      approvalStatus:
        profile.approvalStatus ||
        "pending",

      profileCompleted:
        getDoctorProfileCompletion(profile) === 100,

      profileCompletionPercentage:
        getDoctorProfileCompletion(profile),

      isActive:
        profile.userId.isActive !== false,

      createdAt:
        profile.createdAt ||
        profile.userId.createdAt,
    }));

  return {
    doctors,
    totalResults,
    totalPages,
    currentPage: page,

    summary: {
      total: totalDoctors,
      pending: pendingDoctors,
    },
  };
}

function getDoctorProfileCompletion(profile) {
  const checks = [
    Boolean(profile?.specialization),
    Boolean(profile?.qualification),
    Boolean(profile?.licenseNumber),
    Number.isFinite(Number(profile?.experienceYears)),
    Number.isFinite(Number(profile?.consultationFee)),
    Boolean(profile?.clinicAddress),
    Boolean(profile?.city),
    Boolean(profile?.biography || profile?.bio),
    Number(profile?.appointmentDuration) >= 10,
    Array.isArray(profile?.availability) &&
      profile.availability.some(
        (day) => day.isAvailable && day.slots?.length > 0
      ),
  ];

  return Math.round(
    (checks.filter(Boolean).length / checks.length) * 100
  );
}

function DoctorTableRow({ doctor }) {
  return (
    <tr className="transition hover:bg-muted/30">
      <td className="px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {getInitials(doctor.name)}
          </div>

          <div className="min-w-0">
            <p className="max-w-[220px] truncate font-semibold">
              {doctor.name}
            </p>

            <p className="max-w-[220px] truncate text-xs text-muted-foreground">
              {doctor.email}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Joined {formatDate(doctor.createdAt)}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <p className="font-medium">
          {doctor.specialization}
        </p>

        <p className="mt-1 max-w-[180px] truncate text-xs text-muted-foreground">
          {doctor.qualification}
        </p>
      </td>

      <td className="px-5 py-4">
        <ProfileCompletion doctor={doctor} />
      </td>

      <td className="px-5 py-4">
        <ApprovalBadge
          status={doctor.approvalStatus}
        />
      </td>

      <td className="px-5 py-4">
        <AccountBadge isActive={doctor.isActive} />
      </td>

      <td className="px-5 py-4 text-right">
        <Link
          href={`/admin/doctors/${doctor.id}`}
          className="focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-lg border bg-background px-3 text-xs font-semibold transition hover:bg-muted"
        >
          Review

          <ArrowRight
            className="size-3.5"
            aria-hidden="true"
          />
        </Link>
      </td>
    </tr>
  );
}

function DoctorMobileCard({ doctor }) {
  return (
    <article className="p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {getInitials(doctor.name)}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">
            {doctor.name}
          </p>

          <p className="truncate text-xs text-muted-foreground">
            {doctor.email}
          </p>

          <p className="mt-2 text-sm font-medium">
            {doctor.specialization}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <ApprovalBadge
          status={doctor.approvalStatus}
        />

        <AccountBadge isActive={doctor.isActive} />
      </div>

      <div className="mt-4">
        <ProfileCompletion doctor={doctor} />
      </div>

      <Link
        href={`/admin/doctors/${doctor.id}`}
        className="focus-ring mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border bg-background text-sm font-semibold transition hover:bg-muted"
      >
        Review doctor

        <ArrowRight
          className="size-4"
          aria-hidden="true"
        />
      </Link>
    </article>
  );
}

function ProfileCompletion({ doctor }) {
  const percentage = Math.min(
    100,
    Math.max(
      0,
      doctor.profileCompletionPercentage
    )
  );

  return (
    <div className="min-w-36">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium">
          {doctor.profileCompleted
            ? "Complete"
            : "Incomplete"}
        </span>

        <span className="text-muted-foreground">
          {percentage}%
        </span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

function ApprovalBadge({ status }) {
  const normalizedStatus =
    status?.toLowerCase() || "pending";

  const config = {
    approved: {
      icon: BadgeCheck,
      classes:
        "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    },

    rejected: {
      icon: CircleX,
      classes:
        "bg-destructive/10 text-destructive",
    },

    pending: {
      icon: Clock3,
      classes:
        "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    },
  };

  const selected =
    config[normalizedStatus] || config.pending;

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

function AccountBadge({ isActive }) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        isActive
          ? "bg-primary/10 text-primary"
          : "bg-muted text-muted-foreground"
      }`}
    >
      <UserRoundCheck
        className="size-3.5"
        aria-hidden="true"
      />

      {isActive ? "Active" : "Disabled"}
    </span>
  );
}

function SummaryBadge({
  label,
  value,
  icon: Icon,
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 shadow-sm">
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
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

  const previousPage = Math.max(
    1,
    currentPage - 1
  );

  const nextPage = Math.min(
    totalPages,
    currentPage + 1
  );

  return (
    <div className="flex flex-col gap-3 border-t p-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>

      <div className="flex gap-2">
        {currentPage > 1 ? (
          <Link
            href={createPageUrl({
              page: previousPage,
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
              page: nextPage,
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
        <Stethoscope
          className="size-6"
          aria-hidden="true"
        />
      </span>

      <h2 className="mt-4 font-semibold">
        {hasFilters
          ? "No matching doctors found"
          : "No doctor profiles found"}
      </h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {hasFilters
          ? "Search or approval filter change and try again."
          : "Doctor registration and profile completion of after records here will appear."}
      </p>

      {hasFilters && (
        <Link
          href="/admin/doctors"
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

  return `/admin/doctors?${params.toString()}`;
}

function escapeRegExp(value = "") {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
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
