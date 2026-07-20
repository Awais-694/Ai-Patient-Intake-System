import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  CalendarX,
  Clock3,
  FileHeart,
  HeartPulse,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  Stethoscope,
  UserRound,
} from "lucide-react";

import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { USER_ROLES } from "@/lib/constants";
import DoctorProfile from "@/models/DoctorProfile";
import PatientProfile from "@/models/PatientProfile";
import Appointment from "@/models/Appointment";
import User from "@/models/User";

export const metadata = {
  title: "Patient Details",
  description:
    "Review a patient medical profile and appointment history.",
};

export const dynamic = "force-dynamic";

export default async function DoctorPatientDetailsPage({
  params,
}) {
  const session = await auth();

  if (
    !session?.user ||
    session.user.role !== USER_ROLES.DOCTOR
  ) {
    redirect("/unauthorized");
  }

  const resolvedParams = await params;
  const patientId = resolvedParams?.patientId;

  const patient = await getDoctorPatientDetails({
    patientId,
    doctorUserId: session.user.id,
  });

  if (!patient) {
    notFound();
  }

  return (
    <div className="dashboard-container">
      <header className="border-b pb-6">
        <Link
          href="/doctor/patients"
          className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft
            className="size-4"
            aria-hidden="true"
          />

          Back to patients
        </Link>

        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
              {getInitials(patient.name)}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary">
                Patient Record
              </p>

              <h1 className="mt-2 truncate text-3xl font-bold tracking-tight">
                {patient.name}
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Patient since {formatDate(patient.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <SummaryBadge
              label="Total Appointments"
              value={patient.statistics.total}
              icon={CalendarDays}
            />

            <SummaryBadge
              label="Completed"
              value={patient.statistics.completed}
              icon={CalendarCheck2}
            />

            <SummaryBadge
              label="Upcoming"
              value={patient.statistics.upcoming}
              icon={Clock3}
            />
          </div>
        </div>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InformationCard
          icon={Mail}
          label="Email address"
          value={patient.email}
        />

        <InformationCard
          icon={Phone}
          label="Phone number"
          value={patient.phone}
        />

        <InformationCard
          icon={UserRound}
          label="Gender and age"
          value={`${patient.gender}${
            patient.age !== null
              ? ` • ${patient.age} years`
              : ""
          }`}
        />

        <InformationCard
          icon={FileHeart}
          label="Blood group"
          value={patient.bloodGroup}
        />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <SectionCard
            icon={HeartPulse}
            title="Medical Information"
            description="Patient of available medical history and current health information."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <MedicalDetail
                label="Known allergies"
                value={patient.allergies}
              />

              <MedicalDetail
                label="Current medications"
                value={patient.currentMedications}
              />

              <MedicalDetail
                label="Chronic conditions"
                value={patient.chronicConditions}
              />

              <MedicalDetail
                label="Previous surgeries"
                value={patient.previousSurgeries}
              />

              <MedicalDetail
                label="Family medical history"
                value={patient.familyMedicalHistory}
              />

              <MedicalDetail
                label="Lifestyle notes"
                value={patient.lifestyleNotes}
              />
            </div>
          </SectionCard>

          <SectionCard
            icon={ShieldAlert}
            title="Emergency Information"
            description="Emergency contact and address details."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <MedicalDetail
                label="Emergency contact"
                value={patient.emergencyContact}
              />

              <MedicalDetail
                label="Patient address"
                value={patient.address}
              />
            </div>
          </SectionCard>

          <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold">
                  Appointment History
                </h2>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Only appointments associated with this patient and the current doctor are displayed below.
                  
                </p>
              </div>

              <Link
                href={`/doctor/appointments?search=${encodeURIComponent(
                  patient.email
                )}`}
                className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-semibold text-primary hover:underline"
              >
                View appointments

                <ArrowRight
                  className="size-4"
                  aria-hidden="true"
                />
              </Link>
            </div>

            {patient.appointments.length > 0 ? (
              <div className="divide-y">
                {patient.appointments.map(
                  (appointment) => (
                    <AppointmentHistoryRow
                      key={appointment.id}
                      appointment={appointment}
                    />
                  )
                )}
              </div>
            ) : (
              <div className="px-6 py-14 text-center">
                <CalendarDays
                  className="mx-auto size-8 text-muted-foreground"
                  aria-hidden="true"
                />

                <p className="mt-4 font-semibold">
                  No appointments found
                </p>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="font-semibold">
              Latest Consultation
            </h2>

            {patient.latestAppointment ? (
              <div className="mt-5">
                <AppointmentStatusBadge
                  status={
                    patient.latestAppointment.status
                  }
                />

                <dl className="mt-5 space-y-4">
                  <RecordItem
                    label="Date"
                    value={formatDate(
                      patient.latestAppointment
                        .appointmentDate
                    )}
                  />

                  <RecordItem
                    label="Time"
                    value={
                      patient.latestAppointment
                        .appointmentTime
                    }
                  />

                  <RecordItem
                    label="Reason"
                    value={
                      patient.latestAppointment.reason
                    }
                  />

                  <RecordItem
                    label="Diagnosis"
                    value={
                      patient.latestAppointment
                        .diagnosis
                    }
                  />
                </dl>

                <Link
                  href={`/doctor/appointments/${patient.latestAppointment.id}`}
                  className="focus-ring mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border bg-background text-sm font-semibold transition hover:bg-muted"
                >
                  View appointment

                  <ArrowRight
                    className="size-4"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Consultation record unavailable is.
              </p>
            )}
          </section>

          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="font-semibold">
              Patient Account
            </h2>

            <dl className="mt-5 space-y-4">
              <RecordItem
                label="Patient ID"
                value={patient.id}
              />

              <RecordItem
                label="Account status"
                value={
                  patient.isActive
                    ? "Active"
                    : "Disabled"
                }
              />

              <RecordItem
                label="Profile completion"
                value={`${patient.profileCompletionPercentage}%`}
              />

              <RecordItem
                label="Registered on"
                value={formatDate(patient.createdAt)}
              />
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}

async function getDoctorPatientDetails({
  patientId,
  doctorUserId,
}) {
  if (!patientId || !doctorUserId) {
    return null;
  }

  await connectDB();

  const doctorProfile =
    await DoctorProfile.findOne({
      userId: doctorUserId,
    })
      .select("_id")
      .lean();

  const allowedDoctorIds = [doctorUserId];

  if (doctorProfile?._id) {
    allowedDoctorIds.push(doctorProfile._id);
  }

  /*
    Privacy check:
    Allow patient access only when their appointment
    exists with the current doctor.
  */
  const hasAppointment =
    await Appointment.exists({
      patientId,

      doctorId: {
        $in: allowedDoctorIds,
      },
    });

  if (!hasAppointment) {
    return null;
  }

  const [patientUser, patientProfile, appointments] =
    await Promise.all([
      User.findOne({
        _id: patientId,
        role: USER_ROLES.PATIENT,
      })
        .select(
          "name email phone isActive createdAt"
        )
        .lean(),

      PatientProfile.findOne({
        userId: patientId,
      }).lean(),

      Appointment.find({
        patientId,

        doctorId: {
          $in: allowedDoctorIds,
        },
      })
        .sort({
          appointmentDate: -1,
          createdAt: -1,
        })
        .lean(),
    ]);

  if (!patientUser) {
    return null;
  }

  const now = new Date();

  const normalizedAppointments =
    appointments.map((appointment) => ({
      id: appointment._id.toString(),

      referenceNumber:
        appointment.referenceNumber ||
        appointment.bookingNumber ||
        `APT-${appointment._id
          .toString()
          .slice(-8)
          .toUpperCase()}`,

      appointmentDate:
        appointment.appointmentDate ||
        appointment.date ||
        null,

      appointmentTime:
        appointment.appointmentTime ||
        appointment.time ||
        appointment.timeSlot ||
        "Time unavailable",

      status:
        appointment.status || "pending",

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

      diagnosis:
        formatListOrText(
          appointment.diagnosis,
          "No diagnosis recorded"
        ),

      prescription:
        formatPrescription(
          appointment.prescription ||
            appointment.prescriptions
        ),

      doctorNotes:
        appointment.doctorNotes ||
        appointment.clinicalNotes ||
        "No clinical notes recorded",

      createdAt:
        appointment.createdAt || null,
    }));

  const completedAppointments =
    normalizedAppointments.filter(
      (appointment) =>
        appointment.status === "completed"
    );

  const upcomingAppointments =
    normalizedAppointments.filter(
      (appointment) => {
        if (!appointment.appointmentDate) {
          return false;
        }

        return (
          new Date(appointment.appointmentDate) >= now &&
          ["pending", "confirmed"].includes(
            appointment.status
          )
        );
      }
    );

  return {
    id: patientUser._id.toString(),

    name:
      patientUser.name ||
      "Unnamed Patient",

    email:
      patientUser.email ||
      "Not provided",

    phone:
      patientUser.phone ||
      "Not provided",

    isActive:
      patientUser.isActive !== false,

    createdAt:
      patientUser.createdAt || null,

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

    currentMedications:
      formatListOrText(
        patientProfile?.currentMedications,
        "No current medications recorded"
      ),

    chronicConditions:
      formatListOrText(
        patientProfile?.chronicConditions,
        "No chronic conditions recorded"
      ),

    previousSurgeries:
      formatListOrText(
        patientProfile?.previousSurgeries,
        "No previous surgeries recorded"
      ),

    familyMedicalHistory:
      formatListOrText(
        patientProfile?.familyMedicalHistory,
        "No family medical history recorded"
      ),

    lifestyleNotes:
      formatLifestyleNotes(patientProfile),

    emergencyContact:
      formatEmergencyContact(
        patientProfile?.emergencyContact
      ),

    address: formatAddress(
      patientProfile?.address
    ),

    profileCompletionPercentage:
      getProfileCompletion(patientProfile),

    appointments: normalizedAppointments,

    latestAppointment:
      normalizedAppointments[0] || null,

    statistics: {
      total: normalizedAppointments.length,
      completed: completedAppointments.length,
      upcoming: upcomingAppointments.length,
    },
  };
}

function AppointmentHistoryRow({
  appointment,
}) {
  return (
    <article className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CalendarDays
            className="size-5"
            aria-hidden="true"
          />
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">
              {formatDate(
                appointment.appointmentDate
              )}
            </p>

            <AppointmentStatusBadge
              status={appointment.status}
            />
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            {appointment.appointmentTime}
            {" • "}
            {appointment.consultationType}
          </p>

          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {appointment.reason}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 lg:justify-end">
        <p className="text-xs text-muted-foreground">
          {appointment.referenceNumber}
        </p>

        <Link
          href={`/doctor/appointments/${appointment.id}`}
          className="focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-lg border bg-background px-3 text-xs font-semibold transition hover:bg-muted"
        >
          View details

          <ArrowRight
            className="size-3.5"
            aria-hidden="true"
          />
        </Link>
      </div>
    </article>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-start gap-3 border-b p-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon
            className="size-5"
            aria-hidden="true"
          />
        </span>

        <div>
          <h2 className="font-semibold">
            {title}
          </h2>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <div className="p-5">
        {children}
      </div>
    </section>
  );
}

function InformationCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon
          className="size-5"
          aria-hidden="true"
        />
      </span>

      <p className="mt-4 text-xs font-medium text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function MedicalDetail({ label, value }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-xs font-medium text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
        {value || "Not provided"}
      </p>
    </div>
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

function RecordItem({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">
        {label}
      </dt>

      <dd className="mt-1 break-words text-sm font-semibold">
        {value || "Not available"}
      </dd>
    </div>
  );
}

function formatListOrText(
  value,
  fallback = "Not provided"
) {
  if (!value) {
    return fallback;
  }

  if (Array.isArray(value)) {
    const items = value
      .map((item) => {
        if (typeof item === "string") {
          return item.trim();
        }

        return String(
          item?.name ||
            item?.value ||
            item?.condition ||
            item?.surgery ||
            ""
        ).trim();
      })
      .filter(Boolean);

    return items.length > 0
      ? items.join(", ")
      : fallback;
  }

  return String(value);
}

function formatPrescription(value) {
  if (!value) {
    return "No prescription recorded";
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    const medicines = value
      .map((medicine) => {
        if (typeof medicine === "string") {
          return medicine;
        }

        return [
          medicine.name,
          medicine.dosage,
          medicine.frequency,
          medicine.duration,
        ]
          .filter(Boolean)
          .join(" — ");
      })
      .filter(Boolean);

    return medicines.length > 0
      ? medicines.join("\n")
      : "No prescription recorded";
  }

  return "Prescription information available";
}

function formatEmergencyContact(contact) {
  if (!contact) {
    return "Not provided";
  }

  if (typeof contact === "string") {
    return contact;
  }

  if (typeof contact === "object") {
    const parts = [
      contact.name,
      contact.relationship,
      contact.phone,
      contact.email,
    ].filter(Boolean);

    return parts.length > 0
      ? parts.join(" — ")
      : "Not provided";
  }

  return "Not provided";
}

function formatAddress(address) {
  if (!address) {
    return "Not provided";
  }

  if (typeof address === "string") {
    return address;
  }

  if (typeof address === "object") {
    const parts = [
      address.street,
      address.area,
      address.city,
      address.state,
      address.postalCode,
      address.country,
    ].filter(Boolean);

    return parts.length > 0
      ? parts.join(", ")
      : "Not provided";
  }

  return "Not provided";
}

function formatLifestyleNotes(profile) {
  if (!profile) {
    return "Not provided";
  }

  const values = [
    profile.smokingStatus
      ? `Smoking: ${formatReadableText(
          profile.smokingStatus
        )}`
      : "",

    profile.alcoholUse
      ? `Alcohol: ${formatReadableText(
          profile.alcoholUse
        )}`
      : "",

    profile.exerciseFrequency
      ? `Exercise: ${formatReadableText(
          profile.exerciseFrequency
        )}`
      : "",

    profile.dietaryPreferences
      ? `Diet: ${formatListOrText(
          profile.dietaryPreferences,
          ""
        )}`
      : "",
  ].filter(Boolean);

  return values.length > 0
    ? values.join("\n")
    : "Not provided";
}

function getProfileCompletion(profile) {
  if (!profile) {
    return 0;
  }

  const storedPercentage = Number(
    profile.profileCompletionPercentage
  );

  if (Number.isFinite(storedPercentage)) {
    return Math.min(
      100,
      Math.max(0, storedPercentage)
    );
  }

  return profile.profileCompleted
    ? 100
    : 0;
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
    (today.getMonth() === birthDate.getMonth() &&
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
