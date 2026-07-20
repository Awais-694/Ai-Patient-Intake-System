import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  CalendarDays,
  CalendarX,
  CheckCircle2,
  Clock3,
  FileText,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Stethoscope,
  UserRound,
  Video,
} from "lucide-react";

import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { USER_ROLES } from "@/lib/constants";
import Appointment from "@/models/Appointment";

export const metadata = {
  title: "Appointment Details",
  description:
    "Review MediAssist appointment information and status history.",
};

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

export default async function AdminAppointmentDetailsPage({
  params,
}) {
  const resolvedParams = await params;
  const appointmentId =
    resolvedParams?.appointmentId;

  const appointment =
    await getAppointmentDetails(
      appointmentId
    );

  if (!appointment) {
    notFound();
  }

  return (
    <div className="dashboard-container">
      <header className="border-b pb-6">
        <Link
          href="/admin/appointments"
          className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft
            className="size-4"
            aria-hidden="true"
          />

          Back to appointments
        </Link>

        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">
              Appointment Details
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {appointment.referenceNumber}
              </h1>

              <AppointmentStatusBadge
                status={appointment.status}
              />
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              Created on{" "}
              {formatDateTime(
                appointment.createdAt
              )}
            </p>
          </div>

          <StatusUpdateForm
            appointment={appointment}
          />
        </div>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={CalendarDays}
          label="Appointment Date"
          value={formatDate(
            appointment.appointmentDate
          )}
        />

        <SummaryCard
          icon={Clock3}
          label="Appointment Time"
          value={appointment.appointmentTime}
        />

        <SummaryCard
          icon={
            appointment.consultationType
              .toLowerCase()
              .includes("online")
              ? Video
              : MapPin
          }
          label="Consultation Type"
          value={appointment.consultationType}
        />

        <SummaryCard
          icon={Clock3}
          label="Duration"
          value={
            appointment.durationMinutes
              ? `${appointment.durationMinutes} minutes`
              : "Not specified"
          }
        />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="grid gap-6 md:grid-cols-2">
            <PersonCard
              title="Patient Information"
              icon={UserRound}
              person={appointment.patient}
              fallbackLabel="Patient unavailable"
            />

            <PersonCard
              title="Doctor Information"
              icon={Stethoscope}
              person={appointment.doctor}
              fallbackLabel="Doctor unavailable"
            />
          </section>

          <SectionCard
            title="Reason for Appointment"
            description="Patient of main complaint or consultation reason."
            icon={MessageSquareText}
          >
            <p className="whitespace-pre-wrap text-sm leading-7">
              {appointment.reason}
            </p>
          </SectionCard>

          <SectionCard
            title="Symptoms and Intake Details"
          description="Medical information provided with the appointment request."
            icon={FileText}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <DetailItem
                label="Symptoms"
                value={appointment.symptoms}
              />

              <DetailItem
                label="Symptom duration"
                value={
                  appointment.symptomDuration
                }
              />

              <DetailItem
                label="Severity"
                value={appointment.severity}
              />

              <DetailItem
                label="Preferred language"
                value={
                  appointment.preferredLanguage
                }
              />
            </div>

            <div className="mt-5 border-t pt-5">
              <DetailItem
                label="Additional patient notes"
                value={
                  appointment.patientNotes
                }
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Doctor Notes"
            description="Consultation or appointment management of dauran add of was notes."
            icon={Stethoscope}
          >
            <div className="grid gap-5">
              <DetailItem
                label="Clinical notes"
                value={appointment.doctorNotes}
              />

              <DetailItem
                label="Diagnosis"
                value={appointment.diagnosis}
              />

              <DetailItem
                label="Prescription"
                value={appointment.prescription}
              />

              <DetailItem
                label="Follow-up instructions"
                value={
                  appointment.followUpInstructions
                }
              />
            </div>
          </SectionCard>

          {appointment.cancellationReason && (
            <SectionCard
              title="Cancellation Information"
              description="Appointment cancel to be of recorded details."
              icon={CalendarX}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <DetailItem
                  label="Cancellation reason"
                  value={
                    appointment.cancellationReason
                  }
                />

                <DetailItem
                  label="Cancelled at"
                  value={formatDateTime(
                    appointment.cancelledAt
                  )}
                />

                <DetailItem
                  label="Cancelled by"
                  value={
                    appointment.cancelledBy
                  }
                />
              </div>
            </SectionCard>
          )}
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border bg-card shadow-sm">
            <div className="border-b p-5">
              <h2 className="font-semibold">
                Status History
              </h2>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Appointment status changes
                timeline.
              </p>
            </div>

            <div className="p-5">
              <StatusTimeline
                history={appointment.statusHistory}
              />
            </div>
          </section>

          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="font-semibold">
              Record Information
            </h2>

            <dl className="mt-5 space-y-4">
              <ReviewDetail
                label="Appointment ID"
                value={appointment.id}
              />

              <ReviewDetail
                label="Reference number"
                value={
                  appointment.referenceNumber
                }
              />

              <ReviewDetail
                label="Created at"
                value={formatDateTime(
                  appointment.createdAt
                )}
              />

              <ReviewDetail
                label="Last updated"
                value={formatDateTime(
                  appointment.updatedAt
                )}
              />
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}

async function getAppointmentDetails(
  appointmentId
) {
  if (!appointmentId) {
    return null;
  }

  await connectDB();

  let appointment;

  try {
    appointment = await Appointment.findById(
      appointmentId
    )
      .populate({
        path: "patientId",
        select:
          "name email phone profileImage isActive",
      })
      .populate({
        path: "doctorId",
        select:
          "name email phone profileImage isActive",
      })
      .populate({
        path: "statusHistory.changedBy",
        select: "name email role",
      })
      .lean();
  } catch {
    return null;
  }

  if (!appointment) {
    return null;
  }

  const rawHistory = Array.isArray(
    appointment.statusHistory
  )
    ? appointment.statusHistory
    : [];

  const statusHistory = rawHistory
    .map((historyItem) => ({
      status:
        historyItem.status ||
        historyItem.newStatus ||
        "pending",

      note:
        historyItem.note ||
        historyItem.reason ||
        "",

      changedAt:
        historyItem.changedAt ||
        historyItem.createdAt ||
        null,

      changedBy:
        historyItem.changedBy?.name ||
        historyItem.changedByName ||
        historyItem.changedByRole ||
        "System",
    }))
    .sort(
      (firstItem, secondItem) =>
        new Date(secondItem.changedAt || 0) -
        new Date(firstItem.changedAt || 0)
    );

  /*
    Purane appointment documents in statusHistory
    If it is absent, create a fallback event from the current status.
  */
  if (statusHistory.length === 0) {
    statusHistory.push({
      status:
        appointment.status ||
        "pending",

      note:
        "Current appointment status",

      changedAt:
        appointment.updatedAt ||
        appointment.createdAt,

      changedBy: "System",
    });
  }

  const appointmentDate =
    appointment.appointmentDate ||
    appointment.date ||
    null;

  const appointmentTime =
    appointment.appointmentTime ||
    appointment.time ||
    appointment.timeSlot ||
    "Time unavailable";

  return {
    id: appointment._id.toString(),

    referenceNumber:
      appointment.referenceNumber ||
      appointment.bookingNumber ||
      `APT-${appointment._id
        .toString()
        .slice(-8)
        .toUpperCase()}`,

    patient: mapPerson(
      appointment.patientId,
      "Patient unavailable"
    ),

    doctor: mapPerson(
      appointment.doctorId,
      "Doctor unavailable"
    ),

    appointmentDate,
    appointmentTime,

    durationMinutes:
      getFiniteNumber(
        appointment.durationMinutes ??
          appointment.duration
      ),

    consultationType:
      formatReadableText(
        appointment.consultationType ||
          appointment.type ||
          "In person"
      ),

    reason:
      appointment.reason ||
      appointment.chiefComplaint ||
      "No reason provided",

    symptoms:
      formatListOrText(
        appointment.symptoms
      ),

    symptomDuration:
      appointment.symptomDuration ||
      appointment.durationOfSymptoms ||
      "Not provided",

    severity:
      formatReadableText(
        appointment.severity ||
          "Not provided"
      ),

    preferredLanguage:
      appointment.preferredLanguage ||
      "Not provided",

    patientNotes:
      appointment.patientNotes ||
      appointment.additionalNotes ||
      appointment.notes ||
      "No additional patient notes",

    doctorNotes:
      appointment.doctorNotes ||
      appointment.clinicalNotes ||
      "No clinical notes added",

    diagnosis:
      formatListOrText(
        appointment.diagnosis
      ),

    prescription:
      formatPrescription(
        appointment.prescription ||
          appointment.prescriptions
      ),

    followUpInstructions:
      appointment.followUpInstructions ||
      appointment.followUpNotes ||
      "No follow-up instructions added",

    cancellationReason:
      appointment.cancellationReason ||
      appointment.cancelReason ||
      "",

    cancelledAt:
      appointment.cancelledAt ||
      null,

    cancelledBy:
      appointment.cancelledBy?.name ||
      appointment.cancelledByRole ||
      "Not recorded",

    status:
      appointment.status ||
      "pending",

    statusHistory,

    createdAt:
      appointment.createdAt ||
      null,

    updatedAt:
      appointment.updatedAt ||
      null,
  };
}

function StatusUpdateForm({ appointment }) {
  return (
    <form
      action={updateAppointmentStatus}
      className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:min-w-80"
    >
      <input
        type="hidden"
        name="appointmentId"
        value={appointment.id}
      />

      <label
        htmlFor="appointment-status"
        className="text-sm font-medium"
      >
        Update appointment status
      </label>

      <select
        id="appointment-status"
        name="status"
        defaultValue={appointment.status}
        className="focus-ring h-10 rounded-lg border bg-background px-3 text-sm outline-none"
      >
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

      <div>
        <label
          htmlFor="status-note"
          className="text-xs font-medium text-muted-foreground"
        >
          Status note
        </label>

        <textarea
          id="status-note"
          name="note"
          rows={2}
          maxLength={300}
          placeholder="Optional status update note..."
          className="focus-ring mt-2 w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <button
        type="submit"
        className="focus-ring inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
      >
        Save Status
      </button>
    </form>
  );
}

async function updateAppointmentStatus(
  formData
) {
  "use server";

  const session = await auth();

  if (
    !session?.user ||
    session.user.role !== USER_ROLES.ADMIN
  ) {
    redirect("/unauthorized");
  }

  const appointmentId = String(
    formData.get("appointmentId") || ""
  );

  const status = String(
    formData.get("status") || ""
  ).toLowerCase();

  const note = String(
    formData.get("note") || ""
  )
    .trim()
    .slice(0, 300);

  if (
    !appointmentId ||
    !ALLOWED_STATUSES.includes(status)
  ) {
    return;
  }

  await connectDB();

  const appointment =
    await Appointment.findById(
      appointmentId
    );

  if (!appointment) {
    return;
  }

  const previousStatus =
    appointment.status || "pending";

  /*
    If the same status is selected and the note is blank,
    to unnecessary database update will not.
  */
  if (
    previousStatus === status &&
    !note
  ) {
    return;
  }

  appointment.status = status;

  /*
    If the statusHistory field exists in the schema,
    Mongoose history item save will.

    If the field is not defined in the strict schema, you
    Appointment model in statusHistory add must be added.
  */
  if (
    Array.isArray(
      appointment.statusHistory
    )
  ) {
    appointment.statusHistory.push({
      status,
      previousStatus,
      note:
        note ||
        `Status changed from ${previousStatus} to ${status}`,

      changedBy:
        session.user.id || null,

      changedAt: new Date(),
    });
  }

  if (status === "cancelled") {
    appointment.cancelledAt =
      appointment.cancelledAt ||
      new Date();

    if (note) {
      appointment.cancellationReason =
        note;
    }
  }

  if (
    status !== "cancelled" &&
    previousStatus === "cancelled"
  ) {
    appointment.cancelledAt = null;
  }

  if (status === "completed") {
    appointment.completedAt =
      appointment.completedAt ||
      new Date();
  }

  await appointment.save();

  revalidatePath(
    `/admin/appointments/${appointmentId}`
  );

  revalidatePath(
    "/admin/appointments"
  );

  revalidatePath("/admin/dashboard");
}

function PersonCard({
  title,
  icon: Icon,
  person,
  fallbackLabel,
}) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon
            className="size-5"
            aria-hidden="true"
          />
        </span>

        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">
            {title}
          </p>

          <h2 className="mt-1 truncate font-semibold">
            {person.name || fallbackLabel}
          </h2>
        </div>
      </div>

      <div className="mt-5 space-y-3 border-t pt-5">
        <ContactItem
          icon={Mail}
          label="Email"
          value={person.email}
        />

        <ContactItem
          icon={Phone}
          label="Phone"
          value={person.phone}
        />

        <ContactItem
          icon={UserRound}
          label="Account"
          value={
            person.isActive
              ? "Active"
              : "Disabled"
          }
        />
      </div>
    </section>
  );
}

function ContactItem({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />

      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-medium">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon: Icon,
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

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function SummaryCard({
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

      <p className="mt-1 text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}

function StatusTimeline({ history }) {
  if (!history.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Status history unavailable is.
      </p>
    );
  }

  return (
    <ol className="relative space-y-6 border-l pl-5">
      {history.map((item, index) => (
        <li
          key={`${item.status}-${item.changedAt}-${index}`}
          className="relative"
        >
          <span className="absolute -left-[29px] top-0 flex size-4 items-center justify-center rounded-full border-2 border-card bg-primary" />

          <AppointmentStatusBadge
            status={item.status}
          />

          <p className="mt-2 text-sm leading-6">
            {item.note ||
              "Appointment status updated"}
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            {formatDateTime(
              item.changedAt
            )}{" "}
            • {item.changedBy}
          </p>
        </li>
      ))}
    </ol>
  );
}

function AppointmentStatusBadge({
  status,
}) {
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

function ReviewDetail({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">
        {label}
      </dt>

      <dd className="mt-1 break-all text-sm font-semibold">
        {value || "Not available"}
      </dd>
    </div>
  );
}

function mapPerson(
  person,
  fallbackName
) {
  if (!person) {
    return {
      id: "",
      name: fallbackName,
      email: "Not available",
      phone: "Not available",
      isActive: false,
    };
  }

  return {
    id:
      person._id?.toString() || "",

    name:
      person.name || fallbackName,

    email:
      person.email || "Not provided",

    phone:
      person.phone || "Not provided",

    isActive:
      person.isActive !== false,
  };
}

function formatListOrText(value) {
  if (!value) {
    return "Not provided";
  }

  if (Array.isArray(value)) {
    const values = value
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

    return values.length > 0
      ? values.join(", ")
      : "Not provided";
  }

  return String(value);
}

function formatPrescription(value) {
  if (!value) {
    return "No prescription added";
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

        const parts = [
          medicine.name,
          medicine.dosage,
          medicine.frequency,
          medicine.duration,
        ].filter(Boolean);

        return parts.join(" — ");
      })
      .filter(Boolean);

    return medicines.length > 0
      ? medicines.join("\n")
      : "No prescription added";
  }

  return "Prescription details available";
}

function formatReadableText(value) {
  if (!value) {
    return "Not provided";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function getFiniteNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function formatDate(date) {
  if (!date) {
    return "Date unavailable";
  }

  const parsedDate = new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat(
    "en-PK",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(parsedDate);
}

function formatDateTime(date) {
  if (!date) {
    return "Not available";
  }

  const parsedDate = new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat(
    "en-PK",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(parsedDate);
}
