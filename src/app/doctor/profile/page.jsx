import { redirect } from "next/navigation";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  CircleAlert,
  CircleCheck,
  Clock3,
  GraduationCap,
  MapPin,
  Save,
  ShieldCheck,
  Stethoscope,
  UserRound,
  WalletCards,
} from "lucide-react";

import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import {
  SPECIALIZATIONS,
  USER_ROLES,
} from "@/lib/constants";
import User from "@/models/User";
import DoctorProfile from "@/models/DoctorProfile";

export const metadata = {
  title: "Doctor Profile",
  description:
    "Create and update your MediAssist professional doctor profile.",
};

export const dynamic = "force-dynamic";

const WEEK_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export default async function DoctorProfilePage({
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

  const updated =
    resolvedSearchParams?.updated === "true";
  const errorMessage = getProfileErrorMessage(
    resolvedSearchParams?.error
  );

  const profileData =
    await getDoctorProfileData(
      session.user.id
    );

  if (!profileData) {
    redirect("/login");
  }

  return (
    <div className="dashboard-container">
      <header className="flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">
            Professional Profile
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Doctor Profile
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Complete your qualifications, specialization, medical
            license, clinic information, and availability.
          </p>
        </div>

        <ApprovalStatusCard
          profile={profileData.profile}
        />
      </header>

      {updated && (
        <div
          className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-400"
          role="status"
        >
          <CircleCheck
            className="mt-0.5 size-5 shrink-0"
            aria-hidden="true"
          />

          <div>
            <p className="text-sm font-semibold">
              Profile successfully saved
            </p>

            <p className="mt-1 text-sm">
              Your latest professional information has been
              updated.
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <p className="text-sm font-semibold">
            The profile could not be saved
          </p>
          <p className="mt-1 text-sm">{errorMessage}</p>
        </div>
      )}

      {profileData.profile.approvalStatus ===
        "rejected" && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <CircleAlert
            className="mt-0.5 size-5 shrink-0"
            aria-hidden="true"
          />

          <div>
            <p className="text-sm font-semibold">
              Profile requires correction
            </p>

            <p className="mt-1 text-sm leading-6">
              {profileData.profile.rejectionReason ||
                "The administrator requested changes to this profile. Review the information and submit it again."}
            </p>
          </div>
        </div>
      )}

      <form
        action={saveDoctorProfile}
        className="mt-6 space-y-6"
      >
        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <SectionHeader
            icon={UserRound}
            title="Account Information"
            description="Basic account details are read from your user account."
          />

          <div className="grid gap-5 p-5 md:grid-cols-2">
            <ReadOnlyField
              label="Full name"
              value={profileData.user.name}
            />

            <ReadOnlyField
              label="Email address"
              value={profileData.user.email}
            />

            <FormField
              id="phone"
              label="Phone number"
              required
            >
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                minLength={7}
                maxLength={20}
                defaultValue={
                  profileData.user.phone
                }
                placeholder="03001234567"
                className={inputClasses}
              />
            </FormField>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <SectionHeader
            icon={Stethoscope}
            title="Professional Information"
            description="Medical credentials displayed to patients and administrators."
          />

          <div className="grid gap-5 p-5 md:grid-cols-2">
            <FormField
              id="specialization"
              label="Specialization"
              required
            >
              <select
                id="specialization"
                name="specialization"
                required
                defaultValue={
                  profileData.profile
                    .specialization
                }
                className={inputClasses}
              >
                <option value="">
                  Select a specialization
                </option>
                {SPECIALIZATIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              id="qualification"
              label="Qualification"
              required
            >
              <input
                id="qualification"
                name="qualification"
                type="text"
                required
                minLength={2}
                maxLength={150}
                defaultValue={
                  profileData.profile
                    .qualification
                }
                placeholder="MBBS, FCPS"
                className={inputClasses}
              />
            </FormField>

            <FormField
              id="licenseNumber"
              label="Medical license number"
              required
            >
              <input
                id="licenseNumber"
                name="licenseNumber"
                type="text"
                required
                minLength={3}
                maxLength={100}
                defaultValue={
                  profileData.profile
                    .licenseNumber
                }
                placeholder="PMDC-123456"
                className={inputClasses}
              />
            </FormField>

            <FormField
              id="experienceYears"
              label="Years of experience"
              required
            >
              <input
                id="experienceYears"
                name="experienceYears"
                type="number"
                required
                min="0"
                max="70"
                defaultValue={
                  profileData.profile
                    .experienceYears
                }
                placeholder="5"
                className={inputClasses}
              />
            </FormField>

            <FormField
              id="consultationFee"
              label="Consultation fee (PKR)"
              required
            >
              <input
                id="consultationFee"
                name="consultationFee"
                type="number"
                required
                min="0"
                max="1000000"
                step="1"
                defaultValue={
                  profileData.profile
                    .consultationFee
                }
                placeholder="2000"
                className={inputClasses}
              />
            </FormField>

            <FormField
              id="consultationDuration"
              label="Consultation duration"
            >
              <select
                id="consultationDuration"
                name="consultationDuration"
                defaultValue={
                  profileData.profile
                    .consultationDuration
                }
                className={inputClasses}
              >
                <option value="15">
                  15 minutes
                </option>

                <option value="20">
                  20 minutes
                </option>

                <option value="30">
                  30 minutes
                </option>

                <option value="45">
                  45 minutes
                </option>

                <option value="60">
                  60 minutes
                </option>
              </select>
            </FormField>

            <div className="md:col-span-2">
              <FormField
                id="bio"
                label="Professional biography"
                required
                description="Write a brief introduction about your experience, treatment approach, and professional background."
              >
                <textarea
                  id="bio"
                  name="bio"
                  required
                  minLength={30}
                  maxLength={1500}
                  rows={6}
                  defaultValue={
                    profileData.profile.bio
                  }
                  placeholder="I am a cardiologist with experience in..."
                  className={`${inputClasses} h-auto resize-y py-3`}
                />
              </FormField>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <SectionHeader
            icon={Building2}
            title="Clinic Information"
            description="Information about your clinic or hospital."
          />

          <div className="grid gap-5 p-5 md:grid-cols-2">
            <FormField
              id="clinicName"
              label="Clinic or hospital name"
              required
            >
              <input
                id="clinicName"
                name="clinicName"
                type="text"
                required
                minLength={2}
                maxLength={150}
                defaultValue={
                  profileData.profile
                    .clinicName
                }
                placeholder="MediCare Clinic"
                className={inputClasses}
              />
            </FormField>

            <FormField
              id="city"
              label="City"
              required
            >
              <input
                id="city"
                name="city"
                type="text"
                required
                minLength={2}
                maxLength={100}
                defaultValue={
                  profileData.profile.city
                }
                placeholder="Lahore"
                className={inputClasses}
              />
            </FormField>

            <div className="md:col-span-2">
              <FormField
                id="clinicAddress"
                label="Clinic address"
                required
              >
                <textarea
                  id="clinicAddress"
                  name="clinicAddress"
                  required
                  minLength={5}
                  maxLength={300}
                  rows={3}
                  defaultValue={
                    profileData.profile
                      .clinicAddress
                  }
                  placeholder="Street, area, city..."
                  className={`${inputClasses} h-auto resize-y py-3`}
                />
              </FormField>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <SectionHeader
            icon={CalendarDays}
            title="Weekly Availability"
                description="Configure your consultation hours for each day."
          />

          <div className="divide-y">
            {WEEK_DAYS.map((day) => {
              const schedule =
                profileData.profile
                  .availabilityByDay[day];

              return (
                <AvailabilityRow
                  key={day}
                  day={day}
                  schedule={schedule}
                />
              );
            })}
          </div>
        </section>

        <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">
              Save professional profile
            </p>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              After an update, a rejected profile will be submitted
              for review again.
            </p>
          </div>

          <button
            type="submit"
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Save
              className="size-4"
              aria-hidden="true"
            />

            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
}

async function getDoctorProfileData(userId) {
  await connectDB();

  const [user, profile] = await Promise.all([
    User.findOne({
      _id: userId,
      role: USER_ROLES.DOCTOR,
    })
      .select(
        "name email phone isActive"
      )
      .lean(),

    DoctorProfile.findOne({
      userId,
    }).lean(),
  ]);

  if (!user) {
    return null;
  }

  const rawAvailability = Array.isArray(
    profile?.availability
  )
    ? profile.availability
    : [];

  const availabilityByDay =
    Object.fromEntries(
      WEEK_DAYS.map((day) => [
        day,
        {
          isAvailable: false,
          startTime: "09:00",
          endTime: "17:00",
        },
      ])
    );

  for (const item of rawAvailability) {
    const day = String(
      item?.day || ""
    ).toLowerCase();

    if (!WEEK_DAYS.includes(day)) {
      continue;
    }

    availabilityByDay[day] = {
      isAvailable:
        item.isAvailable !== false,

      startTime:
        item.slots?.[0]?.startTime ||
        item.startTime ||
        "09:00",

      endTime:
        item.slots?.[0]?.endTime ||
        item.endTime ||
        "17:00",
    };
  }

  return {
    user: {
      id: user._id.toString(),
      name: user.name || "Doctor",
      email: user.email || "",
      phone: user.phone || "",
      isActive:
        user.isActive !== false,
    },

    profile: {
      specialization:
        profile?.specialization || "",

      qualification:
        profile?.qualification || "",

      licenseNumber:
        profile?.licenseNumber || "",

      experienceYears:
        getNumericValue(
          profile?.experienceYears ??
            profile?.yearsOfExperience,
          ""
        ),

      consultationFee:
        getNumericValue(
          profile?.consultationFee,
          ""
        ),

      consultationDuration:
        String(
          profile?.appointmentDuration ||
            profile?.consultationDuration ||
            profile?.slotDuration ||
            30
        ),

      bio:
        profile?.biography ||
        profile?.bio ||
        profile?.about ||
        "",

      clinicName:
        profile?.clinicName ||
        profile?.hospitalName ||
        "",

      clinicAddress:
        formatAddressForInput(
          profile?.clinicAddress ||
            profile?.address
        ),

      city:
        profile?.city ||
        profile?.clinicAddress?.city ||
        profile?.address?.city ||
        "",

      approvalStatus:
        profile?.approvalStatus ||
        "pending",

      rejectionReason:
        profile?.rejectionReason || "",

      profileCompleted:
        calculateStoredCompletion(profile) === 100,

      profileCompletionPercentage:
        calculateStoredCompletion(
          profile
        ),

      availabilityByDay,
    },
  };
}

async function saveDoctorProfile(formData) {
  "use server";

  const session = await auth();

  if (
    !session?.user ||
    session.user.role !== USER_ROLES.DOCTOR
  ) {
    redirect("/unauthorized");
  }

  const phone = sanitizeText(
    formData.get("phone"),
    20
  );

  const specialization = normalizeSpecialization(
    formData.get("specialization")
  );

  const qualification = sanitizeText(
    formData.get("qualification"),
    150
  );

  const licenseNumber = sanitizeText(
    formData.get("licenseNumber"),
    100
  );

  const bio = sanitizeText(
    formData.get("bio"),
    1500
  );

  const clinicName = sanitizeText(
    formData.get("clinicName"),
    150
  );

  const clinicAddress = sanitizeText(
    formData.get("clinicAddress"),
    300
  );

  const city = sanitizeText(
    formData.get("city"),
    100
  );

  const experienceYears = parseNumber(
    formData.get("experienceYears"),
    0,
    70
  );

  const consultationFee = parseNumber(
    formData.get("consultationFee"),
    0,
    1000000
  );

  const consultationDuration = parseNumber(
    formData.get("consultationDuration"),
    10,
    180
  );

  if (
    phone.length < 7 ||
    !specialization ||
    qualification.length < 2 ||
    licenseNumber.length < 3 ||
    bio.length < 30 ||
    clinicName.length < 2 ||
    clinicAddress.length < 5 ||
    city.length < 2 ||
    experienceYears === null ||
    consultationFee === null ||
    consultationDuration === null
  ) {
    redirect(
      "/doctor/profile?error=invalid-data"
    );
  }

  const availability = WEEK_DAYS.map(
    (day) => {
      const isAvailable =
        formData.get(
          `${day}-available`
        ) === "on";

      const startTime = sanitizeTime(
        formData.get(
          `${day}-start`
        )
      );

      const endTime = sanitizeTime(
        formData.get(
          `${day}-end`
        )
      );

      return {
        day,
        isAvailable,
        startTime:
          startTime || "09:00",
        endTime:
          endTime || "17:00",
      };
    }
  );

  const availableDays =
    availability.filter(
      (item) => item.isAvailable
    );

  if (availableDays.length === 0) {
    redirect(
      "/doctor/profile?error=availability-required"
    );
  }

  const hasInvalidTime =
    availableDays.some(
      (item) =>
        item.startTime >= item.endTime
    );

  if (hasInvalidTime) {
    redirect(
      "/doctor/profile?error=invalid-time"
    );
  }

  await connectDB();

  const user = await User.findOne({
    _id: session.user.id,
    role: USER_ROLES.DOCTOR,
  });

  if (!user) {
    redirect("/login");
  }

  user.phone = phone;
  await user.save();

  let profile =
    await DoctorProfile.findOne({
      userId: session.user.id,
    });

  if (!profile) {
    profile = new DoctorProfile({
      userId: session.user.id,
    });
  }

  profile.specialization =
    specialization;

  profile.qualification =
    qualification;

  profile.licenseNumber =
    licenseNumber;

  profile.experienceYears =
    experienceYears;

  profile.consultationFee =
    consultationFee;

  profile.appointmentDuration =
    consultationDuration;

  profile.biography = bio;
  profile.clinicName = clinicName;
  profile.clinicAddress =
    clinicAddress;

  profile.city = city;
  profile.availability = availability.map(
    (item) => ({
      day: capitalize(item.day),
      isAvailable: item.isAvailable,
      slots: item.isAvailable
        ? [
            {
              startTime: item.startTime,
              endTime: item.endTime,
            },
          ]
        : [],
    })
  );

  /*
    When a rejected profile is corrected and saved,
    it will be submitted for administrator review again.
  */
  if (
    profile.approvalStatus ===
    "rejected"
  ) {
    profile.approvalStatus =
      "pending";

    profile.rejectionReason = "";
    profile.reviewedAt = null;
    profile.reviewedBy = null;
  }

  if (!profile.approvalStatus) {
    profile.approvalStatus =
      "pending";
  }

  try {
    await profile.save();
  } catch (error) {
    if (error?.name === "ValidationError") {
      console.error(
        "Doctor profile validation failed:",
        error.message
      );
      redirect("/doctor/profile?error=invalid-data");
    }

    if (error?.code === 11000) {
      redirect("/doctor/profile?error=duplicate-license");
    }

    throw error;
  }

  redirect(
    "/doctor/profile?updated=true"
  );
}

function ApprovalStatusCard({ profile }) {
  const config = {
    approved: {
      icon: BadgeCheck,
      title: "Profile Approved",
      description:
        "Your doctor account is now available to patients.",
      classes:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    },

    rejected: {
      icon: CircleAlert,
      title: "Changes Required",
      description:
        "Review the requested changes and submit your profile again.",
      classes:
        "border-destructive/30 bg-destructive/10 text-destructive",
    },

    pending: {
      icon: Clock3,
      title: "Approval Pending",
      description:
        "An administrator will review your professional information.",
      classes:
        "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    },
  };

  const status =
    profile.approvalStatus ||
    "pending";

  const selected =
    config[status] || config.pending;

  const Icon = selected.icon;

  return (
    <div
      className={`flex max-w-md items-start gap-3 rounded-xl border p-4 ${selected.classes}`}
    >
      <Icon
        className="mt-0.5 size-5 shrink-0"
        aria-hidden="true"
      />

      <div>
        <p className="text-sm font-semibold">
          {selected.title}
        </p>

        <p className="mt-1 text-xs leading-5">
          {selected.description}
        </p>

        <p className="mt-2 text-xs font-semibold">
          Profile completion:{" "}
          {profile.profileCompletionPercentage}%
        </p>
      </div>
    </div>
  );
}

function AvailabilityRow({
  day,
  schedule,
}) {
  return (
    <div className="grid gap-4 p-5 md:grid-cols-[180px_1fr] md:items-center">
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          name={`${day}-available`}
          defaultChecked={
            schedule.isAvailable
          }
          className="size-4 rounded border-input accent-primary"
        />

        <span className="font-semibold capitalize">
          {day}
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id={`${day}-start`}
          label="Start time"
        >
          <input
            id={`${day}-start`}
            name={`${day}-start`}
            type="time"
            defaultValue={
              schedule.startTime
            }
            className={inputClasses}
          />
        </FormField>

        <FormField
          id={`${day}-end`}
          label="End time"
        >
          <input
            id={`${day}-end`}
            name={`${day}-end`}
            type="time"
            defaultValue={
              schedule.endTime
            }
            className={inputClasses}
          />
        </FormField>
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}) {
  return (
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
  );
}

function FormField({
  id,
  label,
  description,
  required = false,
  children,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-sm font-medium"
      >
        {label}

        {required && (
          <span className="ml-1 text-destructive">
            *
          </span>
        )}
      </label>

      {description && (
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      )}

      <div className="mt-2">
        {children}
      </div>
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
}) {
  return (
    <div>
      <p className="text-sm font-medium">
        {label}
      </p>

      <div className="mt-2 flex h-11 items-center rounded-lg border bg-muted/50 px-3 text-sm text-muted-foreground">
        {value || "Not available"}
      </div>
    </div>
  );
}

const inputClasses =
  "focus-ring h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground";

function sanitizeText(value, maxLength) {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}

function sanitizeTime(value) {
  const time = String(value || "");

  return /^([01]\d|2[0-3]):[0-5]\d$/.test(
    time
  )
    ? time
    : "";
}

function capitalize(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized
    ? normalized.charAt(0).toUpperCase() + normalized.slice(1)
    : "";
}

function normalizeSpecialization(value) {
  const submittedValue = sanitizeText(value, 100);

  const aliases = {
    cardiology: "Cardiologist",
    dermatology: "Dermatologist",
    neurology: "Neurologist",
    pediatrics: "Pediatrician",
    gynecology: "Gynecologist",
    orthopedics: "Orthopedic Surgeon",
    ent: "ENT Specialist",
    psychiatry: "Psychiatrist",
    dentistry: "Dentist",
    general: "General Physician",
  };

  const exactMatch = SPECIALIZATIONS.find(
    (item) =>
      item.toLowerCase() === submittedValue.toLowerCase()
  );

  return (
    exactMatch ||
    aliases[submittedValue.toLowerCase()] ||
    ""
  );
}

function getProfileErrorMessage(errorCode) {
  const messages = {
    "invalid-data":
      "Review the highlighted information and select a valid specialization.",
    "availability-required":
      "Select at least one available day.",
    "invalid-time":
      "Each availability end time must be later than its start time.",
    "duplicate-license":
      "This medical license number is already associated with another doctor.",
  };

  return messages[errorCode] || "";
}

function parseNumber(
  value,
  minimum,
  maximum
) {
  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number < minimum ||
    number > maximum
  ) {
    return null;
  }

  return number;
}

function getNumericValue(
  value,
  fallback
) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function calculateStoredCompletion(
  profile
) {
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

function formatAddressForInput(address) {
  if (!address) {
    return "";
  }

  if (typeof address === "string") {
    return address;
  }

  if (typeof address === "object") {
    return [
      address.street,
      address.area,
      address.city,
      address.state,
      address.postalCode,
      address.country,
    ]
      .filter(Boolean)
      .join(", ");
  }

  return "";
}
