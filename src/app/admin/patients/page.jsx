import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  CalendarDays,
  Mail,
  Phone,
  Search,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { USER_ROLES } from "@/lib/constants";
import User from "@/models/User";
import PatientProfile from "@/models/PatientProfile";

export const metadata = {
  title: "Manage Patients",
  description:
    "Search and manage registered MediAssist patient accounts.",
};

export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 10;

const ALLOWED_ACCOUNT_STATUSES = [
  "all",
  "active",
  "disabled",
];

export default async function AdminPatientsPage({
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

  const status = ALLOWED_ACCOUNT_STATUSES.includes(
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

  const result = await getPatients({
    search,
    status,
    page,
  });

  return (
    <div className="dashboard-container">
      <header className="flex flex-col gap-4 border-b pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">
            Patient Management
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Patients
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Registered patients to search please, unki
            profile information view and account status
            manage please.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <SummaryCard
            label="Total Patients"
            value={result.summary.total}
            icon={UsersRound}
          />

          <SummaryCard
            label="Active Accounts"
            value={result.summary.active}
            icon={UserRoundCheck}
          />

          <SummaryCard
            label="Disabled"
            value={result.summary.disabled}
            icon={Ban}
          />
        </div>
      </header>

      <section className="mt-6 rounded-xl border bg-card p-4 shadow-sm sm:p-5">
        <form
          action="/admin/patients"
          method="GET"
          className="grid gap-4 lg:grid-cols-[1fr_220px_auto]"
        >
          <div>
            <label
              htmlFor="patient-search"
              className="text-sm font-medium"
            >
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
                defaultValue={search}
                placeholder="Name, email or phone..."
                className="focus-ring h-11 w-full rounded-lg border bg-background pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="patient-status"
              className="text-sm font-medium"
            >
              Account status
            </label>

            <select
              id="patient-status"
              name="status"
              defaultValue={status}
              className="focus-ring mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none"
            >
              <option value="all">
                All accounts
              </option>

              <option value="active">
                Active
              </option>

              <option value="disabled">
                Disabled
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
                href="/admin/patients"
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
              Patient Accounts
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

        {result.patients.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-4 font-semibold">
                      Patient
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Contact
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Profile
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Joined
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
                  {result.patients.map((patient) => (
                    <PatientTableRow
                      key={patient.id}
                      patient={patient}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y md:hidden">
              {result.patients.map((patient) => (
                <PatientMobileCard
                  key={patient.id}
                  patient={patient}
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

async function getPatients({
  search,
  status,
  page,
}) {
  await connectDB();

  const userFilter = {
    role: USER_ROLES.PATIENT,
  };

  if (search) {
    const escapedSearch = escapeRegExp(search);

    userFilter.$or = [
      {
        name: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
      {
        email: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
      {
        phone: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
    ];
  }

  if (status === "active") {
    userFilter.isActive = true;
  }

  if (status === "disabled") {
    userFilter.isActive = false;
  }

  const [
    totalResults,
    users,
    totalPatients,
    activePatients,
    disabledPatients,
  ] = await Promise.all([
    User.countDocuments(userFilter),

    User.find(userFilter)
      .select(
        "_id name email phone isActive createdAt profileImage"
      )
      .sort({ createdAt: -1 })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
      .lean(),

    User.countDocuments({
      role: USER_ROLES.PATIENT,
    }),

    User.countDocuments({
      role: USER_ROLES.PATIENT,
      isActive: true,
    }),

    User.countDocuments({
      role: USER_ROLES.PATIENT,
      isActive: false,
    }),
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(totalResults / ITEMS_PER_PAGE)
  );

  if (page > totalPages && totalResults > 0) {
    return getPatients({
      search,
      status,
      page: totalPages,
    });
  }

  const userIds = users.map((user) => user._id);

  const profiles = await PatientProfile.find({
    userId: {
      $in: userIds,
    },
  })
    .select(
      "userId gender dateOfBirth bloodGroup profileCompleted profileCompletionPercentage"
    )
    .lean();

  const profileByUserId = new Map(
    profiles.map((profile) => [
      profile.userId.toString(),
      profile,
    ])
  );

  const patients = users.map((user) => {
    const profile = profileByUserId.get(
      user._id.toString()
    );

    const completionPercentage = Math.min(
      100,
      Math.max(
        0,
        Number(
          profile?.profileCompletionPercentage ??
            (profile?.profileCompleted ? 100 : 0)
        )
      )
    );

    return {
      id: user._id.toString(),

      name:
        user.name ||
        "Unnamed Patient",

      email:
        user.email ||
        "Email unavailable",

      phone:
        user.phone ||
        "Not provided",

      gender:
        profile?.gender ||
        "Not provided",

      bloodGroup:
        profile?.bloodGroup ||
        "Not provided",

      age: calculateAge(
        profile?.dateOfBirth
      ),

      profileCompleted:
        profile?.profileCompleted === true,

      profileCompletionPercentage:
        completionPercentage,

      isActive:
        user.isActive !== false,

      createdAt:
        user.createdAt,
    };
  });

  return {
    patients,
    totalResults,
    totalPages,
    currentPage: page,

    summary: {
      total: totalPatients,
      active: activePatients,
      disabled: disabledPatients,
    },
  };
}

function PatientTableRow({ patient }) {
  return (
    <tr className="transition hover:bg-muted/30">
      <td className="px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {getInitials(patient.name)}
          </div>

          <div className="min-w-0">
            <p className="max-w-[220px] truncate font-semibold">
              {patient.name}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {patient.gender}
              {patient.age !== null
                ? ` • ${patient.age} years`
                : ""}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="space-y-2">
          <ContactRow
            icon={Mail}
            value={patient.email}
          />

          <ContactRow
            icon={Phone}
            value={patient.phone}
          />
        </div>
      </td>

      <td className="px-5 py-4">
        <ProfileCompletion patient={patient} />

        <p className="mt-2 text-xs text-muted-foreground">
          Blood group: {patient.bloodGroup}
        </p>
      </td>

      <td className="px-5 py-4 text-muted-foreground">
        {formatDate(patient.createdAt)}
      </td>

      <td className="px-5 py-4">
        <AccountBadge isActive={patient.isActive} />
      </td>

      <td className="px-5 py-4 text-right">
        <TogglePatientAccountForm patient={patient} />
      </td>
    </tr>
  );
}

function PatientMobileCard({ patient }) {
  return (
    <article className="p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {getInitials(patient.name)}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">
            {patient.name}
          </p>

          <p className="truncate text-xs text-muted-foreground">
            {patient.email}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Joined {formatDate(patient.createdAt)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <AccountBadge isActive={patient.isActive} />

        <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
          Blood group: {patient.bloodGroup}
        </span>
      </div>

      <div className="mt-4">
        <ProfileCompletion patient={patient} />
      </div>

      <div className="mt-4 rounded-lg border bg-background p-3">
        <ContactRow
          icon={Phone}
          value={patient.phone}
        />

        <p className="mt-2 text-xs text-muted-foreground">
          {patient.gender}
          {patient.age !== null
                ? ` • ${patient.age} years`
            : ""}
        </p>
      </div>

      <div className="mt-5">
        <TogglePatientAccountForm
          patient={patient}
          fullWidth
        />
      </div>
    </article>
  );
}

function TogglePatientAccountForm({
  patient,
  fullWidth = false,
}) {
  return (
    <form action={togglePatientAccount}>
      <input
        type="hidden"
        name="userId"
        value={patient.id}
      />

      <input
        type="hidden"
        name="isActive"
        value={
          patient.isActive
            ? "false"
            : "true"
        }
      />

      <button
        type="submit"
        className={`focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-semibold transition ${
          fullWidth ? "w-full" : ""
        } ${
          patient.isActive
            ? "border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10"
            : "bg-background text-foreground hover:bg-muted"
        }`}
      >
        {patient.isActive ? (
          <>
            <Ban
              className="size-3.5"
              aria-hidden="true"
            />

            Disable
          </>
        ) : (
          <>
            <UserRoundCheck
              className="size-3.5"
              aria-hidden="true"
            />

            Enable
          </>
        )}
      </button>
    </form>
  );
}

async function togglePatientAccount(formData) {
  "use server";

  const session = await auth();

  if (
    !session?.user ||
    session.user.role !== USER_ROLES.ADMIN
  ) {
    redirect("/unauthorized");
  }

  const userId = String(
    formData.get("userId") || ""
  );

  const isActive =
    String(formData.get("isActive")) ===
    "true";

  if (!userId) {
    return;
  }

  await connectDB();

  await User.findOneAndUpdate(
    {
      _id: userId,
      role: USER_ROLES.PATIENT,
    },
    {
      $set: {
        isActive,
      },
    },
    {
      runValidators: true,
    }
  );

  revalidatePath("/admin/patients");
  revalidatePath("/admin/dashboard");
}

function ProfileCompletion({ patient }) {
  const percentage = Math.min(
    100,
    Math.max(
      0,
      patient.profileCompletionPercentage
    )
  );

  return (
    <div className="min-w-36">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium">
          {patient.profileCompleted
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

function AccountBadge({ isActive }) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        isActive
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "bg-destructive/10 text-destructive"
      }`}
    >
      {isActive ? (
        <UserRoundCheck
          className="size-3.5"
          aria-hidden="true"
        />
      ) : (
        <Ban
          className="size-3.5"
          aria-hidden="true"
        />
      )}

      {isActive ? "Active" : "Disabled"}
    </span>
  );
}

function ContactRow({
  icon: Icon,
  value,
}) {
  return (
    <div className="flex max-w-[260px] items-center gap-2 text-xs text-muted-foreground">
      <Icon
        className="size-3.5 shrink-0"
        aria-hidden="true"
      />

      <span className="truncate">
        {value || "Not provided"}
      </span>
    </div>
  );
}

function SummaryCard({
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
        <UsersRound
          className="size-6"
          aria-hidden="true"
        />
      </span>

      <h2 className="mt-4 font-semibold">
        {hasFilters
          ? "No matching patients found"
          : "No patients registered"}
      </h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {hasFilters
          ? "Search or account-status filter change karke try again."
          : "Patient registration of after accounts here show honge."}
      </p>

      {hasFilters && (
        <Link
          href="/admin/patients"
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

  return `/admin/patients?${params.toString()}`;
}

function escapeRegExp(value = "") {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) {
    return null;
  }

  const birthDate = new Date(dateOfBirth);

  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();

  let age =
    today.getFullYear() -
    birthDate.getFullYear();

  const hasBirthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() >= birthDate.getDate());

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return age >= 0 ? age : null;
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

  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}
