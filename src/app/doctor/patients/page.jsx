import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  FileHeart,
  Mail,
  Phone,
  UserRound,
  UsersRound,
} from "lucide-react";

import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { USER_ROLES } from "@/lib/constants";
import DoctorProfile from "@/models/DoctorProfile";
import PatientProfile from "@/models/PatientProfile";
import Appointment from "@/models/Appointment";
import PatientSearchForm from "@/components/doctor/patient-search-form";

export const metadata = {
  title: "Doctor Patients",
  description:
    "View and search patients connected with your MediAssist appointments.",
};

export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 10;

export default async function DoctorPatientsPage({
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

  const requestedPage = Number.parseInt(
    resolvedSearchParams?.page || "1",
    10
  );

  const page =
    Number.isInteger(requestedPage) &&
    requestedPage > 0
      ? requestedPage
      : 1;

  const result = await getDoctorPatients({
    doctorUserId: session.user.id,
    search,
    page,
  });

  return (
    <div className="dashboard-container">
      <header className="flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">
            Patient Management
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            My Patients
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            View patients who have booked an
            appointment with you. Review their medical profile and
            appointment history.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border bg-card px-5 py-4 shadow-sm">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UsersRound
              className="size-5"
              aria-hidden="true"
            />
          </span>

          <div>
            <p className="text-xs text-muted-foreground">
              Unique patients
            </p>

            <p className="text-xl font-bold">
              {result.totalPatients.toLocaleString()}
            </p>
          </div>
        </div>
      </header>

      {!result.profileExists && (
        <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-700 dark:text-amber-400">
          <p className="font-semibold">
            Doctor profile is incomplete
          </p>

          <p className="mt-1 text-sm leading-6">
            Complete your professional profile to access patient records
            and appointment details.
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
        <PatientSearchForm initialSearch={search} />
      </section>

      <section className="mt-6 overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">
              Patient Records
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
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-4 font-semibold">
                      Patient
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Medical Profile
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Appointments
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Last Visit
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

            <div className="divide-y lg:hidden">
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
            />
          </>
        ) : (
          <EmptyState hasSearch={Boolean(search)} />
        )}
      </section>
    </div>
  );
}

async function getDoctorPatients({
  doctorUserId,
  search,
  page,
}) {
  await connectDB();

  const doctorProfile =
    await DoctorProfile.findOne({
      userId: doctorUserId,
    })
      .select("_id")
      .lean();

  const allowedDoctorIds = [doctorUserId];

  if (doctorProfile?._id) {
    allowedDoctorIds.push(
      doctorProfile._id
    );
  }

  const appointmentDocuments =
    await Appointment.find({
      doctorId: {
        $in: allowedDoctorIds,
      },
    })
      .populate({
        path: "patientId",
        select:
          "name email phone isActive createdAt",
      })
      .sort({
        appointmentDate: -1,
        createdAt: -1,
      })
      .lean();

  /*
    Ek patient of multiple appointments can have.
    Use a map to create unique patient records.
  */
  const patientMap = new Map();

  for (const appointment of appointmentDocuments) {
    const patient = appointment.patientId;

    if (!patient?._id) {
      continue;
    }

    const patientId = patient._id.toString();

    if (!patientMap.has(patientId)) {
      patientMap.set(patientId, {
        user: patient,
        appointments: [],
      });
    }

    patientMap
      .get(patientId)
      .appointments.push(appointment);
  }

  const patientUserIds = Array.from(
    patientMap.keys()
  );

  const patientProfiles =
    patientUserIds.length > 0
      ? await PatientProfile.find({
          userId: {
            $in: patientUserIds,
          },
        }).lean()
      : [];

  const profileByUserId = new Map(
    patientProfiles.map((profile) => [
      profile.userId.toString(),
      profile,
    ])
  );

  const allPatients = Array.from(
    patientMap.entries()
  ).map(([patientId, record]) => {
    const patientProfile =
      profileByUserId.get(patientId);

    const appointments =
      record.appointments;

    const completedAppointments =
      appointments.filter(
        (appointment) =>
          appointment.status === "completed"
      );

    const upcomingAppointments =
      appointments.filter((appointment) => {
        const date =
          appointment.appointmentDate ||
          appointment.date;

        if (!date) {
          return false;
        }

        return (
          new Date(date) >= new Date() &&
          ["pending", "confirmed"].includes(
            appointment.status
          )
        );
      });

    const latestAppointment =
      appointments[0] || null;

    return {
      id: patientId,

      name:
        record.user.name ||
        "Unnamed Patient",

      email:
        record.user.email ||
        "Email unavailable",

      phone:
        record.user.phone ||
        "Not provided",

      isActive:
        record.user.isActive !== false,

      gender: formatReadableText(
        patientProfile?.gender ||
          "Not provided"
      ),

      age: calculateAge(
        patientProfile?.dateOfBirth
      ),

      bloodGroup:
        patientProfile?.bloodGroup ||
        "Not provided",

      allergies: formatListOrText(
        patientProfile?.allergies,
        "No allergies recorded"
      ),

      chronicConditions:
        formatListOrText(
          patientProfile?.chronicConditions,
          "No chronic conditions recorded"
        ),

      totalAppointments:
        appointments.length,

      completedAppointments:
        completedAppointments.length,

      upcomingAppointments:
        upcomingAppointments.length,

      lastAppointmentDate:
        latestAppointment?.appointmentDate ||
        latestAppointment?.date ||
        latestAppointment?.createdAt ||
        null,

      lastAppointmentStatus:
        latestAppointment?.status ||
        "Not available",
    };
  });

  const normalizedSearch =
    search.toLowerCase();

  const searchedPatients = search
    ? allPatients.filter((patient) => {
        const values = [
          patient.name,
          patient.email,
          patient.phone,
          patient.gender,
          patient.bloodGroup,
          patient.allergies,
          patient.chronicConditions,
        ];

        return values.some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(normalizedSearch)
        );
      })
    : allPatients;

  searchedPatients.sort((first, second) => {
    const firstDate = new Date(
      first.lastAppointmentDate || 0
    );

    const secondDate = new Date(
      second.lastAppointmentDate || 0
    );

    return secondDate - firstDate;
  });

  const totalResults =
    searchedPatients.length;

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

  const patients = searchedPatients.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  return {
    profileExists: Boolean(doctorProfile),
    patients,
    totalPatients: allPatients.length,
    totalResults,
    totalPages,
    currentPage,
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

            <div className="mt-1 flex max-w-[220px] items-center gap-1.5 text-xs text-muted-foreground">
              <Mail
                className="size-3 shrink-0"
                aria-hidden="true"
              />

              <span className="truncate">
                {patient.email}
              </span>
            </div>

            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone
                className="size-3 shrink-0"
                aria-hidden="true"
              />

              {patient.phone}
            </div>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="space-y-1 text-xs">
          <p>
            <span className="text-muted-foreground">
              Gender:
            </span>{" "}
            <span className="font-medium">
              {patient.gender}
            </span>
          </p>

          <p>
            <span className="text-muted-foreground">
              Age:
            </span>{" "}
            <span className="font-medium">
              {patient.age !== null
                ? `${patient.age} years`
                : "Not provided"}
            </span>
          </p>

          <p>
            <span className="text-muted-foreground">
              Blood:
            </span>{" "}
            <span className="font-medium">
              {patient.bloodGroup}
            </span>
          </p>
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="grid min-w-44 grid-cols-3 gap-2">
          <CountBadge
            label="Total"
            value={patient.totalAppointments}
          />

          <CountBadge
            label="Done"
            value={
              patient.completedAppointments
            }
          />

          <CountBadge
            label="Upcoming"
            value={
              patient.upcomingAppointments
            }
          />
        </div>
      </td>

      <td className="px-5 py-4">
        <p className="font-medium">
          {formatDate(
            patient.lastAppointmentDate
          )}
        </p>

        <p className="mt-1 text-xs capitalize text-muted-foreground">
          {formatReadableText(
            patient.lastAppointmentStatus
          )}
        </p>
      </td>

      <td className="px-5 py-4 text-right">
        <Link
          href={`/doctor/patients/${patient.id}`}
          className="focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-lg border bg-background px-3 text-xs font-semibold transition hover:bg-muted"
        >
          View patient

          <ArrowRight
            className="size-3.5"
            aria-hidden="true"
          />
        </Link>
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
            {patient.phone}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <CountBadge
          label="Total"
          value={patient.totalAppointments}
        />

        <CountBadge
          label="Done"
          value={patient.completedAppointments}
        />

        <CountBadge
          label="Upcoming"
          value={patient.upcomingAppointments}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <ProfileValue
          label="Gender"
          value={patient.gender}
        />

        <ProfileValue
          label="Age"
          value={
            patient.age !== null
              ? `${patient.age} years`
              : "Not provided"
          }
        />

        <ProfileValue
          label="Blood group"
          value={patient.bloodGroup}
        />
      </div>

      <div className="mt-4 rounded-lg border bg-background p-3">
        <p className="text-xs text-muted-foreground">
          Last appointment
        </p>

        <p className="mt-1 text-sm font-semibold">
          {formatDate(
            patient.lastAppointmentDate
          )}
        </p>

        <p className="mt-1 text-xs capitalize text-muted-foreground">
          {formatReadableText(
            patient.lastAppointmentStatus
          )}
        </p>
      </div>

      <Link
        href={`/doctor/patients/${patient.id}`}
        className="focus-ring mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border bg-background text-sm font-semibold transition hover:bg-muted"
      >
        View patient

        <ArrowRight
          className="size-4"
          aria-hidden="true"
        />
      </Link>
    </article>
  );
}

function CountBadge({ label, value }) {
  return (
    <div className="rounded-lg bg-muted/70 p-2 text-center">
      <p className="text-sm font-bold">
        {value.toLocaleString()}
      </p>

      <p className="mt-0.5 text-[10px] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function ProfileValue({ label, value }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  search,
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

function EmptyState({ hasSearch }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <UsersRound
          className="size-6"
          aria-hidden="true"
        />
      </span>

      <h2 className="mt-4 font-semibold">
        {hasSearch
          ? "No matching patients found"
          : "No patients available"}
      </h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {hasSearch
          ? "Search value change and try again."
          : "Patients appointment book will to their records here will appear."}
      </p>

      {hasSearch && (
        <Link
          href="/doctor/patients"
          className="focus-ring mt-5 inline-flex h-10 items-center justify-center rounded-lg border bg-background px-4 text-sm font-semibold transition hover:bg-muted"
        >
          Clear search
        </Link>
      )}
    </div>
  );
}

function createPageUrl({ page, search }) {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  params.set("page", page.toString());

  return `/doctor/patients?${params.toString()}`;
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

  const birthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() ===
      birthDate.getMonth() &&
      today.getDate() >= birthDate.getDate());

  if (!birthdayPassed) {
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
