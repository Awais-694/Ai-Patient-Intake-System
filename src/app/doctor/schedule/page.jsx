import { redirect } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Save,
  Settings2,
  Stethoscope,
} from "lucide-react";

import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { USER_ROLES } from "@/lib/constants";
import DoctorProfile from "@/models/DoctorProfile";
import Appointment from "@/models/Appointment";

export const metadata = {
  title: "Doctor Schedule",
  description:
    "Manage weekly doctor availability and consultation timings.",
};

export const dynamic = "force-dynamic";

const WEEK_DAYS = [
  {
    value: "monday",
    label: "Monday",
  },
  {
    value: "tuesday",
    label: "Tuesday",
  },
  {
    value: "wednesday",
    label: "Wednesday",
  },
  {
    value: "thursday",
    label: "Thursday",
  },
  {
    value: "friday",
    label: "Friday",
  },
  {
    value: "saturday",
    label: "Saturday",
  },
  {
    value: "sunday",
    label: "Sunday",
  },
];

const DURATION_OPTIONS = [
  15,
  20,
  30,
  45,
  60,
];

export default async function DoctorSchedulePage({
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

  const error =
    typeof resolvedSearchParams?.error === "string"
      ? resolvedSearchParams.error
      : "";

  const scheduleData =
    await getDoctorScheduleData(
      session.user.id
    );

  if (!scheduleData.profileExists) {
    redirect("/doctor/profile");
  }

  return (
    <div className="dashboard-container">
      <header className="flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">
            Availability Management
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Weekly Schedule
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Apne available days, consultation timings,
            appointment duration and daily booking limits.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border bg-card px-5 py-4 shadow-sm">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarDays
              className="size-5"
              aria-hidden="true"
            />
          </span>

          <div>
            <p className="text-xs text-muted-foreground">
              Available days
            </p>

            <p className="text-xl font-bold">
              {scheduleData.availableDaysCount}
            </p>
          </div>
        </div>
      </header>

      {updated && (
        <AlertMessage
          type="success"
          title="Schedule successfully updated"
          message="Your weekly availability and consultation settings have been saved."
        />
      )}

      {error && (
        <ScheduleErrorAlert error={error} />
      )}

      {scheduleData.profileStatus !== "approved" && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-700 dark:text-amber-400">
          <CircleAlert
            className="mt-0.5 size-5 shrink-0"
            aria-hidden="true"
          />

          <div>
            <p className="font-semibold">
              Profile approval pending
            </p>

            <p className="mt-1 text-sm leading-6">
              You can configure your schedule, but
              Patients can book appointments only after an administrator
              approves your doctor profile.
            </p>
          </div>
        </div>
      )}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Clock3}
          label="Slot Duration"
          value={`${scheduleData.settings.consultationDuration} minutes`}
        />

        <SummaryCard
          icon={CalendarDays}
          label="Daily Limit"
          value={`${scheduleData.settings.maxAppointmentsPerDay} appointments`}
        />

        <SummaryCard
          icon={Settings2}
          label="Booking Notice"
          value={`${scheduleData.settings.minimumBookingNoticeHours} hours`}
        />

        <SummaryCard
          icon={Stethoscope}
          label="Profile Status"
          value={formatReadableText(
            scheduleData.profileStatus
          )}
        />
      </section>

      <form
        action={saveDoctorSchedule}
        className="mt-6 space-y-6"
      >
        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <SectionHeader
            icon={Settings2}
            title="Appointment Settings"
              description="Configure appointment slots and booking rules."
          />

          <div className="grid gap-5 p-5 md:grid-cols-2 xl:grid-cols-4">
            <FormField
              id="consultationDuration"
              label="Consultation duration"
              description="Duration of each appointment slot."
            >
              <select
                id="consultationDuration"
                name="consultationDuration"
                defaultValue={
                  scheduleData.settings
                    .consultationDuration
                }
                className={inputClasses}
              >
                {DURATION_OPTIONS.map(
                  (duration) => (
                    <option
                      key={duration}
                      value={duration}
                    >
                      {duration} minutes
                    </option>
                  )
                )}
              </select>
            </FormField>

            <FormField
              id="maxAppointmentsPerDay"
              label="Maximum appointments"
              description="Maximum number of bookings per day."
            >
              <input
                id="maxAppointmentsPerDay"
                name="maxAppointmentsPerDay"
                type="number"
                min="1"
                max="100"
                required
                defaultValue={
                  scheduleData.settings
                    .maxAppointmentsPerDay
                }
                className={inputClasses}
              />
            </FormField>

            <FormField
              id="minimumBookingNoticeHours"
              label="Minimum booking notice"
              description="How many hours before an appointment booking is allowed."
            >
              <input
                id="minimumBookingNoticeHours"
                name="minimumBookingNoticeHours"
                type="number"
                min="0"
                max="720"
                required
                defaultValue={
                  scheduleData.settings
                    .minimumBookingNoticeHours
                }
                className={inputClasses}
              />
            </FormField>

            <FormField
              id="advanceBookingDays"
              label="Advance booking window"
              description="How many days in advance patients can book appointments."
            >
              <input
                id="advanceBookingDays"
                name="advanceBookingDays"
                type="number"
                min="1"
                max="365"
                required
                defaultValue={
                  scheduleData.settings
                    .advanceBookingDays
                }
                className={inputClasses}
              />
            </FormField>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <SectionHeader
            icon={CalendarDays}
            title="Weekly Availability"
            description="Select available days and set their start and end times."
          />

          <div className="divide-y">
            {WEEK_DAYS.map((day) => (
              <ScheduleDayRow
                key={day.value}
                day={day}
                schedule={
                  scheduleData.availabilityByDay[
                    day.value
                  ]
                }
              />
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <SectionHeader
            icon={Clock3}
            title="Break Time"
              description="Configure an optional daily break, such as a lunch break."
          />

          <div className="grid gap-5 p-5 md:grid-cols-3">
            <div className="flex items-end">
              <label className="flex h-11 w-full items-center gap-3 rounded-lg border bg-background px-3">
                <input
                  type="checkbox"
                  name="breakEnabled"
                  defaultChecked={
                    scheduleData.settings
                      .breakEnabled
                  }
                  className="size-4 rounded border-input accent-primary"
                />

                <span className="text-sm font-medium">
                  Enable a daily break
                </span>
              </label>
            </div>

            <FormField
              id="breakStartTime"
              label="Break start time"
            >
              <input
                id="breakStartTime"
                name="breakStartTime"
                type="time"
                defaultValue={
                  scheduleData.settings
                    .breakStartTime
                }
                className={inputClasses}
              />
            </FormField>

            <FormField
              id="breakEndTime"
              label="Break end time"
            >
              <input
                id="breakEndTime"
                name="breakEndTime"
                type="time"
                defaultValue={
                  scheduleData.settings
                    .breakEndTime
                }
                className={inputClasses}
              />
            </FormField>
          </div>
        </section>

        <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">
              Save weekly schedule
            </p>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Existing appointments will not be automatically deleted or
              moved. Schedule changes apply to future appointment slots.
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

            Save Schedule
          </button>
        </div>
      </form>
    </div>
  );
}

async function getDoctorScheduleData(
  userId
) {
  await connectDB();

  const profile =
    await DoctorProfile.findOne({
      userId,
    }).lean();

  if (!profile) {
    return {
      profileExists: false,
      profileStatus: "pending",
      availableDaysCount: 0,
      availabilityByDay:
        createDefaultAvailability(),
      settings: getDefaultSettings(),
    };
  }

  const availabilityByDay =
    createDefaultAvailability();

  const rawAvailability = Array.isArray(
    profile.availability
  )
    ? profile.availability
    : [];

  for (const item of rawAvailability) {
    const day = String(
      item?.day || ""
    ).toLowerCase();

    if (
      !WEEK_DAYS.some(
        (weekDay) =>
          weekDay.value === day
      )
    ) {
      continue;
    }

    availabilityByDay[day] = {
      isAvailable:
        item.isAvailable !== false,

      startTime:
        sanitizeExistingTime(
          item.startTime,
          "09:00"
        ),

      endTime:
        sanitizeExistingTime(
          item.endTime,
          "17:00"
        ),
    };
  }

  const availableDaysCount =
    Object.values(
      availabilityByDay
    ).filter(
      (schedule) =>
        schedule.isAvailable
    ).length;

  return {
    profileExists: true,

    profileStatus:
      profile.approvalStatus ||
      "pending",

    availableDaysCount,

    availabilityByDay,

    settings: {
      consultationDuration:
        getNumberInRange(
          profile.consultationDuration ??
            profile.slotDuration,
          15,
          60,
          30
        ),

      maxAppointmentsPerDay:
        getNumberInRange(
          profile.maxAppointmentsPerDay,
          1,
          100,
          20
        ),

      minimumBookingNoticeHours:
        getNumberInRange(
          profile.minimumBookingNoticeHours,
          0,
          720,
          2
        ),

      advanceBookingDays:
        getNumberInRange(
          profile.advanceBookingDays,
          1,
          365,
          30
        ),

      breakEnabled:
        profile.breakEnabled === true,

      breakStartTime:
        sanitizeExistingTime(
          profile.breakStartTime,
          "13:00"
        ),

      breakEndTime:
        sanitizeExistingTime(
          profile.breakEndTime,
          "14:00"
        ),
    },
  };
}

async function saveDoctorSchedule(formData) {
  "use server";

  const session = await auth();

  if (
    !session?.user ||
    session.user.role !== USER_ROLES.DOCTOR
  ) {
    redirect("/unauthorized");
  }

  const consultationDuration =
    parseNumber(
      formData.get(
        "consultationDuration"
      ),
      15,
      60
    );

  const maxAppointmentsPerDay =
    parseNumber(
      formData.get(
        "maxAppointmentsPerDay"
      ),
      1,
      100
    );

  const minimumBookingNoticeHours =
    parseNumber(
      formData.get(
        "minimumBookingNoticeHours"
      ),
      0,
      720
    );

  const advanceBookingDays =
    parseNumber(
      formData.get(
        "advanceBookingDays"
      ),
      1,
      365
    );

  if (
    consultationDuration === null ||
    !DURATION_OPTIONS.includes(
      consultationDuration
    ) ||
    maxAppointmentsPerDay === null ||
    minimumBookingNoticeHours === null ||
    advanceBookingDays === null
  ) {
    redirect(
      "/doctor/schedule?error=invalid-settings"
    );
  }

  const availability = WEEK_DAYS.map(
    (day) => {
      const isAvailable =
        formData.get(
          `${day.value}-available`
        ) === "on";

      const startTime = sanitizeTime(
        formData.get(
          `${day.value}-start`
        )
      );

      const endTime = sanitizeTime(
        formData.get(
          `${day.value}-end`
        )
      );

      return {
        day: day.value,
        isAvailable,

        startTime:
          startTime || "09:00",

        endTime:
          endTime || "17:00",
      };
    }
  );

  const activeSchedules =
    availability.filter(
      (schedule) =>
        schedule.isAvailable
    );

  if (activeSchedules.length === 0) {
    redirect(
      "/doctor/schedule?error=no-available-days"
    );
  }

  const invalidSchedule =
    activeSchedules.some(
      (schedule) =>
        schedule.startTime >=
        schedule.endTime
    );

  if (invalidSchedule) {
    redirect(
      "/doctor/schedule?error=invalid-day-time"
    );
  }

  const breakEnabled =
    formData.get("breakEnabled") ===
    "on";

  const breakStartTime = sanitizeTime(
    formData.get("breakStartTime")
  );

  const breakEndTime = sanitizeTime(
    formData.get("breakEndTime")
  );

  if (
    breakEnabled &&
    (!breakStartTime ||
      !breakEndTime ||
      breakStartTime >= breakEndTime)
  ) {
    redirect(
      "/doctor/schedule?error=invalid-break"
    );
  }

  if (breakEnabled) {
    const breakOutsideSchedule =
      activeSchedules.every(
        (schedule) =>
          breakEndTime <=
            schedule.startTime ||
          breakStartTime >=
            schedule.endTime
      );

    if (breakOutsideSchedule) {
      redirect(
        "/doctor/schedule?error=break-outside-hours"
      );
    }
  }

  await connectDB();

  const profile =
    await DoctorProfile.findOne({
      userId: session.user.id,
    });

  if (!profile) {
    redirect("/doctor/profile");
  }

  profile.availability =
    availability;

  profile.consultationDuration =
    consultationDuration;

  profile.maxAppointmentsPerDay =
    maxAppointmentsPerDay;

  profile.minimumBookingNoticeHours =
    minimumBookingNoticeHours;

  profile.advanceBookingDays =
    advanceBookingDays;

  profile.breakEnabled =
    breakEnabled;

  profile.breakStartTime =
    breakEnabled
      ? breakStartTime
      : "";

  profile.breakEndTime =
    breakEnabled
      ? breakEndTime
      : "";

  await profile.save();

  redirect(
    "/doctor/schedule?updated=true"
  );
}

function ScheduleDayRow({
  day,
  schedule,
}) {
  return (
    <div className="grid gap-4 p-5 lg:grid-cols-[220px_1fr] lg:items-center">
      <div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name={`${day.value}-available`}
            defaultChecked={
              schedule.isAvailable
            }
            className="size-4 rounded border-input accent-primary"
          />

          <span className="font-semibold">
            {day.label}
          </span>
        </label>

        <p className="mt-1 pl-7 text-xs text-muted-foreground">
          Patients can book appointments on this day.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id={`${day.value}-start`}
          label="Start time"
        >
          <input
            id={`${day.value}-start`}
            name={`${day.value}-start`}
            type="time"
            defaultValue={
              schedule.startTime
            }
            className={inputClasses}
          />
        </FormField>

        <FormField
          id={`${day.value}-end`}
          label="End time"
        >
          <input
            id={`${day.value}-end`}
            name={`${day.value}-end`}
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

function ScheduleErrorAlert({ error }) {
  const messages = {
    "invalid-settings":
      "Appointment settings must be within the valid range.",

    "no-available-days":
      "At least ek available day select perform required is.",

    "invalid-day-time":
      "The end time must be later than the start time on each available day.",

    "invalid-break":
      "Break start and end time valid enter.",

    "break-outside-hours":
      "Break timing at least ek available schedule of inside must be.",
  };

  return (
    <AlertMessage
      type="error"
      title="Schedule could not be saved"
      message={
        messages[error] ||
        "Schedule information check and try again."
      }
    />
  );
}

function AlertMessage({
  type,
  title,
  message,
}) {
  const isSuccess =
    type === "success";

  const Icon = isSuccess
    ? CheckCircle2
    : CircleAlert;

  return (
    <div
      className={`mt-6 flex items-start gap-3 rounded-xl border p-4 ${
        isSuccess
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "border-destructive/30 bg-destructive/10 text-destructive"
      }`}
      role={isSuccess ? "status" : "alert"}
    >
      <Icon
        className="mt-0.5 size-5 shrink-0"
        aria-hidden="true"
      />

      <div>
        <p className="text-sm font-semibold">
          {title}
        </p>

        <p className="mt-1 text-sm leading-6">
          {message}
        </p>
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
  children,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-sm font-medium"
      >
        {label}
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

const inputClasses =
  "focus-ring h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition";

function createDefaultAvailability() {
  return Object.fromEntries(
    WEEK_DAYS.map((day) => [
      day.value,
      {
        isAvailable:
          ![
            "saturday",
            "sunday",
          ].includes(day.value),

        startTime: "09:00",
        endTime: "17:00",
      },
    ])
  );
}

function getDefaultSettings() {
  return {
    consultationDuration: 30,
    maxAppointmentsPerDay: 20,
    minimumBookingNoticeHours: 2,
    advanceBookingDays: 30,
    breakEnabled: false,
    breakStartTime: "13:00",
    breakEndTime: "14:00",
  };
}

function sanitizeTime(value) {
  const time = String(value || "");

  return /^([01]\d|2[0-3]):[0-5]\d$/.test(
    time
  )
    ? time
    : "";
}

function sanitizeExistingTime(
  value,
  fallback
) {
  return sanitizeTime(value) || fallback;
}

function parseNumber(
  value,
  minimum,
  maximum
) {
  const number = Number(value);

  if (
    !Number.isInteger(number) ||
    number < minimum ||
    number > maximum
  ) {
    return null;
  }

  return number;
}

function getNumberInRange(
  value,
  minimum,
  maximum,
  fallback
) {
  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number < minimum ||
    number > maximum
  ) {
    return fallback;
  }

  return number;
}

function formatReadableText(value) {
  return String(value || "Not provided")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}
