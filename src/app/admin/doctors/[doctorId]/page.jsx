import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  BadgeCheck,
  Ban,
  BriefcaseMedical,
  Building2,
  CalendarDays,
  CircleX,
  Clock3,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Stethoscope,
  UserRoundCheck,
  Trash2,
} from "lucide-react";

import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { USER_ROLES } from "@/lib/constants";
import User from "@/models/User";
import DoctorProfile from "@/models/DoctorProfile";
import Appointment from "@/models/Appointment";
import SymptomSubmission from "@/models/SymptomSubmission";
import AIAnalysis from "@/models/AIAnalysis";
import DoctorRecommendation from "@/models/DoctorRecommendation";

export const metadata = {
  title: "Review Doctor",
  description:
    "Review a MediAssist doctor profile and manage its approval status.",
};

export const dynamic = "force-dynamic";

export default async function AdminDoctorReviewPage({
  params,
}) {
  const resolvedParams = await params;
  const doctorId = resolvedParams?.doctorId;

  const doctor = await getDoctorDetails(doctorId);

  if (!doctor) {
    notFound();
  }

  return (
    <div className="dashboard-container">
      <header className="border-b pb-6">
        <Link
          href="/admin/doctors"
          className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft
            className="size-4"
            aria-hidden="true"
          />

          Back to doctors
        </Link>

        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
              {getInitials(doctor.name)}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-3xl font-bold tracking-tight">
                  {doctor.name}
                </h1>

                <ApprovalBadge
                  status={doctor.approvalStatus}
                />
              </div>

              <p className="mt-2 text-sm font-medium text-primary">
                {doctor.specialization}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Registered on {formatDate(doctor.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <AccountStatusForm doctor={doctor} />
          </div>
        </div>
      </header>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <SectionCard
            title="Personal Information"
            description="Doctor account and contact details."
            icon={Stethoscope}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <InformationItem
                icon={Mail}
                label="Email address"
                value={doctor.email}
              />

              <InformationItem
                icon={Phone}
                label="Phone number"
                value={doctor.phone}
              />

              <InformationItem
                icon={UserRoundCheck}
                label="Account status"
                value={
                  doctor.isActive
                    ? "Active"
                    : "Disabled"
                }
              />

              <InformationItem
                icon={CalendarDays}
                label="Registration date"
                value={formatDate(doctor.createdAt)}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Professional Information"
            description="Qualification, experience and medical license."
            icon={BriefcaseMedical}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <InformationItem
                icon={Stethoscope}
                label="Specialization"
                value={doctor.specialization}
              />

              <InformationItem
                icon={GraduationCap}
                label="Qualification"
                value={doctor.qualification}
              />

              <InformationItem
                icon={ShieldCheck}
                label="License number"
                value={doctor.licenseNumber}
              />

              <InformationItem
                icon={Clock3}
                label="Experience"
                value={
                  doctor.experienceYears !== null
                    ? `${doctor.experienceYears} years`
                    : "Not provided"
                }
              />

              <InformationItem
                icon={Building2}
                label="Hospital or clinic"
                value={doctor.clinicName}
              />

              <InformationItem
                icon={MapPin}
                label="Clinic address"
                value={doctor.clinicAddress}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Professional Biography"
            description="Information displayed to patients on the doctor's profile."
            icon={GraduationCap}
          >
            <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
              {doctor.bio}
            </p>
          </SectionCard>

          <SectionCard
            title="Availability"
            description="The doctor's configured consultation days and hours."
            icon={CalendarDays}
          >
            {doctor.availability.length > 0 ? (
              <div className="divide-y rounded-lg border">
                {doctor.availability.map(
                  (schedule, index) => (
                    <div
                      key={`${schedule.day}-${index}`}
                      className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <p className="text-sm font-semibold capitalize">
                        {schedule.day}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {schedule.isAvailable === false
                          ? "Unavailable"
                          : `${schedule.startTime} - ${schedule.endTime}`}
                      </p>
                    </div>
                  )
                )}
              </div>
            ) : (
              <EmptyValue message="No availability schedule has been provided." />
            )}
          </SectionCard>
        </div>

        <aside className="space-y-6">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="font-semibold">
              Profile Completion
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              How complete the submitted doctor profile is.
            </p>

            <div className="mt-5 flex items-end justify-between gap-4">
              <p className="text-3xl font-bold">
                {doctor.profileCompletionPercentage}%
              </p>

              <p className="text-sm font-medium text-muted-foreground">
                {doctor.profileCompleted
                  ? "Complete"
                  : "Incomplete"}
              </p>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${doctor.profileCompletionPercentage}%`,
                }}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="font-semibold">
              Approval Decision
            </h2>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Verify the profile and license details before approving
              or rejecting this doctor.
            </p>

            <div className="mt-5">
              <ApprovalForm doctor={doctor} />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="font-semibold">
              Review Information
            </h2>

            <dl className="mt-4 space-y-4">
              <ReviewDetail
                label="Current status"
                value={capitalize(
                  doctor.approvalStatus
                )}
              />

              <ReviewDetail
                label="Reviewed at"
                value={formatDateTime(
                  doctor.reviewedAt
                )}
              />

              <ReviewDetail
                label="Rejection reason"
                value={
                  doctor.rejectionReason ||
                  "Not applicable"
                }
              />
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DeleteDoctorForm({ doctor }) {
  return (
    <form
      action={deleteDoctor}
      onSubmit="return confirm('This permanently deletes the doctor account, profile, appointments, symptom submissions, and AI analyses. Continue?')"
      className="rounded-xl border border-destructive/30 bg-destructive/5 p-4"
    >
      <input type="hidden" name="doctorId" value={doctor.id} />
      <input type="hidden" name="userId" value={doctor.userId} />
      <p className="text-sm font-semibold text-destructive">Delete Doctor</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">This action permanently removes the doctor and related records from MongoDB.</p>
      <button type="submit" className="focus-ring mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-destructive px-4 text-sm font-semibold text-white">
        <Trash2 className="size-4" /> Delete Doctor Permanently
      </button>
    </form>
  );
}

async function getDoctorDetails(doctorId) {
  if (!doctorId) {
    return null;
  }

  await connectDB();

  let profile;

  try {
    profile = await DoctorProfile.findById(
      doctorId
    )
      .populate({
        path: "userId",
        select:
          "name email phone isActive createdAt profileImage",
      })
      .lean();
  } catch {
    return null;
  }

  if (!profile?.userId) {
    return null;
  }

  const completionPercentage = getDoctorProfileCompletion(profile);

  const rawAvailability = Array.isArray(
    profile.availability
  )
    ? profile.availability
    : [];

  const availability = rawAvailability.map(
    (schedule) => ({
      day: schedule.day || "Unknown day",

     startTime:
        schedule.slots?.[0]?.startTime ||
        schedule.startTime ||
        "Not provided",

     endTime:
        schedule.slots?.[0]?.endTime ||
        schedule.endTime ||
        "Not provided",

      isAvailable:
        schedule.isAvailable !== false,
    })
  );

  return {
    id: profile._id.toString(),
    userId: profile.userId._id.toString(),

    name:
      profile.userId.name ||
      "Unnamed Doctor",

    email:
      profile.userId.email ||
      "Not provided",

    phone:
      profile.userId.phone ||
      profile.phone ||
      "Not provided",

    isActive:
      profile.userId.isActive !== false,

    specialization:
      profile.specialization ||
      "Not provided",

    qualification:
      profile.qualification ||
      "Not provided",

    licenseNumber:
      profile.licenseNumber ||
      "Not provided",

    experienceYears:
      Number.isFinite(
        profile.experienceYears
      )
        ? profile.experienceYears
        : Number.isFinite(
              profile.yearsOfExperience
            )
          ? profile.yearsOfExperience
          : null,

    clinicName:
      profile.clinicName ||
      profile.hospitalName ||
      "Not provided",

    clinicAddress:
      formatAddress(
        profile.clinicAddress ||
          profile.address
      ),

   bio:
      profile.biography ||
      profile.bio ||
      profile.about ||
      "No professional biography has been provided.",

    availability,

    approvalStatus:
      profile.approvalStatus ||
      "pending",

    rejectionReason:
      profile.rejectionReason || "",

    reviewedAt:
      profile.reviewedAt || null,

    profileCompleted:
      completionPercentage === 100,

    profileCompletionPercentage:
      completionPercentage,

    createdAt:
      profile.createdAt ||
      profile.userId.createdAt,
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

function ApprovalForm({ doctor }) {
  return (
    <div className="space-y-4">
      <form action={updateDoctorApproval}>
        <input
          type="hidden"
          name="doctorId"
          value={doctor.id}
        />

        <input
          type="hidden"
          name="status"
          value="approved"
        />

        <button
          type="submit"
          disabled={
            doctor.approvalStatus === "approved"
          }
          className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
        >
          <BadgeCheck
            className="size-4"
            aria-hidden="true"
          />

          {doctor.approvalStatus === "approved"
            ? "Already Approved"
            : "Approve Doctor"}
        </button>
      </form>

      <form
        action={updateDoctorApproval}
        className="space-y-3"
      >
        <input
          type="hidden"
          name="doctorId"
          value={doctor.id}
        />

        <input
          type="hidden"
          name="status"
          value="rejected"
        />

        <div>
          <label
            htmlFor="rejectionReason"
            className="text-sm font-medium"
          >
            Rejection reason
          </label>

          <textarea
            id="rejectionReason"
            name="rejectionReason"
            rows={4}
            defaultValue={
              doctor.rejectionReason
            }
            placeholder="Profile reject to of reason write..."
            required
            minLength={10}
            className="focus-ring mt-2 w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <button
          type="submit"
          className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
        >
          <CircleX
            className="size-4"
            aria-hidden="true"
          />

          Reject Doctor
        </button>
      </form>

      {doctor.approvalStatus !== "pending" && (
        <form action={updateDoctorApproval}>
          <input
            type="hidden"
            name="doctorId"
            value={doctor.id}
          />

          <input
            type="hidden"
            name="status"
            value="pending"
          />

          <button
            type="submit"
            className="focus-ring inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium transition hover:bg-muted"
          >
            <Clock3
              className="size-4"
              aria-hidden="true"
            />

            Move Back to Pending
          </button>
        </form>
      )}
    </div>
  );
}

function AccountStatusForm({ doctor }) {
  return (
    <form action={toggleDoctorAccount}>
      <input
        type="hidden"
        name="userId"
        value={doctor.userId}
      />

      <input
        type="hidden"
        name="doctorId"
        value={doctor.id}
      />

      <input
        type="hidden"
        name="isActive"
        value={
          doctor.isActive
            ? "false"
            : "true"
        }
      />

      <button
        type="submit"
        className={`focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition ${
          doctor.isActive
            ? "border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10"
            : "bg-background hover:bg-muted"
        }`}
      >
        {doctor.isActive ? (
          <>
            <Ban
              className="size-4"
              aria-hidden="true"
            />

            Disable Account
          </>
        ) : (
          <>
            <UserRoundCheck
              className="size-4"
              aria-hidden="true"
            />

            Enable Account
          </>
        )}
      </button>
    </form>
  );
}

async function updateDoctorApproval(formData) {
  "use server";

  const session = await auth();

  if (
    !session?.user ||
    session.user.role !== USER_ROLES.ADMIN
  ) {
    redirect("/unauthorized");
  }

  const doctorId = String(
    formData.get("doctorId") || ""
  );

  const status = String(
    formData.get("status") || ""
  ).toLowerCase();

  const rejectionReason = String(
    formData.get("rejectionReason") || ""
  ).trim();

  const allowedStatuses = [
    "pending",
    "approved",
    "rejected",
  ];

  if (
    !doctorId ||
    !allowedStatuses.includes(status)
  ) {
    return;
  }

  if (
    status === "rejected" &&
    rejectionReason.length < 10
  ) {
    return;
  }

  await connectDB();

  const updateData = {
    approvalStatus: status,
    reviewedAt: new Date(),
  };

  if (session.user.id) {
    updateData.reviewedBy =
      session.user.id;
  }

  if (status === "rejected") {
    updateData.rejectionReason =
      rejectionReason;
  } else {
    updateData.rejectionReason = "";
  }

  await DoctorProfile.findByIdAndUpdate(
    doctorId,
    {
      $set: updateData,
    },
    {
      runValidators: true,
    }
  );

  revalidatePath(
    `/admin/doctors/${doctorId}`
  );

  revalidatePath("/admin/doctors");
  revalidatePath("/admin/dashboard");
}

async function toggleDoctorAccount(formData) {
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

  const doctorId = String(
    formData.get("doctorId") || ""
  );

  const isActive =
    String(formData.get("isActive")) ===
    "true";

  if (!userId || !doctorId) {
    return;
  }

  await connectDB();

  await User.findOneAndUpdate(
    {
      _id: userId,
      role: USER_ROLES.DOCTOR,
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

  revalidatePath(
    `/admin/doctors/${doctorId}`
  );

  revalidatePath("/admin/doctors");
  revalidatePath("/admin/dashboard");
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

          <p className="mt-1 text-sm text-muted-foreground">
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

function InformationItem({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon
          className="size-4"
          aria-hidden="true"
        />

        {label}
      </div>

      <p className="mt-2 break-words text-sm font-semibold">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function ReviewDetail({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">
        {label}
      </dt>

      <dd className="mt-1 break-words text-sm font-semibold">
        {value}
      </dd>
    </div>
  );
}

function EmptyValue({ message }) {
  return (
    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
      {message}
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
    config[normalizedStatus] ||
    config.pending;

  const Icon = selected.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${selected.classes}`}
    >
      <Icon
        className="size-3.5"
        aria-hidden="true"
      />

      {normalizedStatus}
    </span>
  );
}

function formatAddress(address) {
  if (!address) {
    return "Not provided";
  }

  if (typeof address === "string") {
    return address.trim() || "Not provided";
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

function capitalize(value = "") {
  if (!value) {
    return "Not available";
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
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

function formatDateTime(date) {
  if (!date) {
    return "Not reviewed yet";
  }

  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
