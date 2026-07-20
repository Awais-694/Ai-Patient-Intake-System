import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  CircleAlert,
  Clock3,
  MapPin,
  Search,
  Sparkles,
  Stethoscope,
  UserRound,
  WalletCards,
} from "lucide-react";

import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { SPECIALIZATIONS, USER_ROLES } from "@/lib/constants";
import PatientProfile from "@/models/PatientProfile";
import DoctorProfile from "@/models/DoctorProfile";
import Appointment from "@/models/Appointment";
import SymptomSubmission from "@/models/SymptomSubmission";
import AIAnalysis from "@/models/AIAnalysis";
import DoctorRecommendation from "@/models/DoctorRecommendation";
import { analyzeSymptoms } from "@/services/ai.service";

export const metadata = {
  title: "Book Appointment",
  description:
    "Select an approved doctor and book an available consultation slot.",
};

export const dynamic = "force-dynamic";

const CONSULTATION_TYPES = [
  {
    value: "in_person",
    label: "In-person consultation",
  },
  {
    value: "video",
    label: "Video consultation",
  },
  {
    value: "phone",
    label: "Phone consultation",
  },
];

const SEVERITY_OPTIONS = [
  {
    value: "mild",
    label: "Mild",
  },
  {
    value: "moderate",
    label: "Moderate",
  },
  {
    value: "severe",
    label: "Severe",
  },
];

export default async function NewAppointmentPage({
  searchParams,
}) {
  const session = await auth();

  if (
    !session?.user ||
    session.user.role !== USER_ROLES.PATIENT
  ) {
    redirect("/unauthorized");
  }

  const resolvedSearchParams = await searchParams;

  const selectedDoctorId =
    typeof resolvedSearchParams?.doctorId === "string"
      ? resolvedSearchParams.doctorId
      : "";

  const selectedDate =
    typeof resolvedSearchParams?.date === "string"
      ? resolvedSearchParams.date
      : "";

  const search =
    typeof resolvedSearchParams?.search === "string"
      ? resolvedSearchParams.search.trim()
      : "";

  const error =
    typeof resolvedSearchParams?.error === "string"
      ? resolvedSearchParams.error
      : "";

  const recommendationId =
    typeof resolvedSearchParams?.recommendationId === "string"
      ? resolvedSearchParams.recommendationId
      : "";

  const bookingData = await getBookingPageData({
    patientUserId: session.user.id,
    selectedDoctorId,
    selectedDate,
    search,
    recommendationId,
  });

  return (
    <div className="dashboard-container">
      <header className="border-b pb-6">
        <Link
          href="/patient/appointments"
          className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft
            className="size-4"
            aria-hidden="true"
          />

          Back to appointments
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold text-primary">
            New Consultation
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Book Appointment
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Select an approved doctor, choose an available date and
            time, then provide your symptoms and consultation details.
          </p>
        </div>
      </header>

      {!bookingData.profileExists && (
        <div className="mt-6 flex flex-col gap-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-700 dark:text-amber-400 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <CircleAlert
              className="mt-0.5 size-5 shrink-0"
              aria-hidden="true"
            />

            <div>
              <p className="font-semibold">
                Medical profile required
              </p>

              <p className="mt-1 text-sm leading-6">
                Please complete your medical profile before booking an
                appointment.
              </p>
            </div>
          </div>

          <Link
            href="/patient/profile"
            className="focus-ring inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-current/20 bg-background/60 px-4 text-sm font-semibold"
          >
            Complete Profile
          </Link>
        </div>
      )}

      {error && (
        <BookingErrorAlert error={error} />
      )}

      <section className="mt-6 overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-sm">
        <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">Step 1</span>
                <h2 className="text-lg font-semibold">Find the right doctor with AI</h2>
              </div>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Tell us what you are experiencing. Groq AI will suggest suitable specialties and doctors. You can still choose a doctor manually below.
              </p>
            </div>
          </div>
        </div>

        <form action={recommendDoctors} className="grid gap-5 p-5 sm:p-6 md:grid-cols-[1fr_220px]">
          <div className="md:col-span-2">
            <label htmlFor="recommendationSymptoms" className="text-sm font-semibold">What symptoms are you experiencing?</label>
            <p className="mt-1 text-xs text-muted-foreground">You can write in English, Urdu, or Roman Urdu. Include when the symptoms started and how they feel.</p>
            <textarea id="recommendationSymptoms" name="symptoms" required minLength={10} maxLength={2000} rows={4} placeholder="Example: Mujhe teen din se headache aur chakkar aa rahe hain" className={`${textareaClasses} mt-2`} />
          </div>
          <div>
            <label htmlFor="recommendationDuration" className="text-sm font-semibold">How long have you had them?</label>
            <input id="recommendationDuration" name="duration" maxLength={100} placeholder="Example: 3 days" className={`${inputClasses} mt-2`} />
          </div>
          <label className="flex items-start gap-3 rounded-xl border bg-muted/30 p-3 text-sm leading-6 text-muted-foreground md:col-span-2">
            <input type="checkbox" name="consentToAIAnalysis" value="true" required className="mt-1 size-4 shrink-0 accent-primary" />
            <span>I agree that Groq AI may process these symptoms to suggest a medical specialty. This recommendation is not a diagnosis or medical advice.</span>
          </label>
          <button className="focus-ring inline-flex h-11 w-fit items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:col-span-2">
            <Sparkles className="size-4" /> Find Recommended Doctors
          </button>
        </form>

        {bookingData.recommendation && (
          <div className="mx-5 mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:mx-6">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">AI recommendation ready</p>
            <p className="mt-2 text-sm leading-6">{bookingData.recommendation.summary}</p>
            <p className="mt-2 text-sm text-primary">Suggested specialty: <strong>{bookingData.recommendation.specializations.join(", ") || bookingData.recommendation.suggestedDepartment}</strong></p>
            {bookingData.doctors.filter((doctor) => doctor.recommended).length > 0 && (
              <div className="mt-4 rounded-lg border bg-muted/30 p-3">
                <p className="text-sm font-semibold">Recommended doctors</p>
                <div className="mt-2 space-y-2">
                  {bookingData.doctors
                    .filter((doctor) => doctor.recommended)
                    .slice(0, 3)
                    .map((doctor) => (
                      <div key={doctor.profileId} className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <span><strong>{doctor.name}</strong> — {doctor.specialization}</span>
                        <span className="text-muted-foreground">{doctor.clinicName}, {doctor.city}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
            {bookingData.recommendation.requiresUrgentReview && <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm font-semibold text-destructive">Urgent medical review is recommended. Seek immediate care if symptoms are severe or worsening.</p>}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Search
              className="size-5"
              aria-hidden="true"
            />
          </span>

          <div>
            <h2 className="font-semibold">
              Find a Doctor
            </h2>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Search by doctor name, specialization, qualification, or
              clinic.
            </p>
          </div>
        </div>

        <form
          action="/patient/appointments/new"
          method="GET"
          className="mt-5 flex flex-col gap-3 sm:flex-row"
        >
          {recommendationId && <input type="hidden" name="recommendationId" value={recommendationId} />}
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />

            <input
              name="search"
              type="search"
              defaultValue={search}
              placeholder="Cardiologist, Dr. Ahmed, clinic..."
              className="focus-ring h-11 w-full rounded-lg border bg-background pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <button
            type="submit"
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Search
              className="size-4"
              aria-hidden="true"
            />

            Search
          </button>

          {search && (
            <Link
              href="/patient/appointments/new"
              className="focus-ring inline-flex h-11 items-center justify-center rounded-lg border bg-background px-4 text-sm font-medium transition hover:bg-muted"
            >
              Reset
            </Link>
          )}
        </form>
      </section>

      <section className="mt-6">
        <div className="mb-4">
          <h2 className="font-semibold">
            Approved Doctors
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {bookingData.doctors.length.toLocaleString()} doctor
            {bookingData.doctors.length === 1 ? "" : "s"} found
          </p>
        </div>

        {bookingData.doctors.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {bookingData.doctors.map((doctor) => (
              <DoctorCard
                key={doctor.profileId}
                doctor={doctor}
                selected={
                  doctor.profileId ===
                  bookingData.selectedDoctor?.profileId
                }
                search={search}
                selectedDate={selectedDate}
                recommended={doctor.recommended}
                recommendationId={recommendationId}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border bg-card px-6 py-14 text-center shadow-sm">
            <Stethoscope
              className="mx-auto size-9 text-muted-foreground"
              aria-hidden="true"
            />

            <h2 className="mt-4 font-semibold">
              No approved doctors found
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Try a different doctor name, specialization, or clinic.
            </p>
          </div>
        )}
      </section>

      {bookingData.selectedDoctor && (
        <section id="booking-details" className="mt-8 scroll-mt-6 overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="border-b p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Stethoscope
                    className="size-5"
                    aria-hidden="true"
                  />
                </span>

                <div>
                  <h2 className="font-semibold">
                    Book with{" "}
                    {bookingData.selectedDoctor.name}
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {
                      bookingData.selectedDoctor
                        .specialization
                    }
                    {" • "}
                    {
                      bookingData.selectedDoctor
                        .qualification
                    }
                  </p>
                </div>
              </div>

              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2
                  className="size-4"
                  aria-hidden="true"
                />

                Approved Doctor
              </span>
            </div>
          </div>

          <div className="grid gap-6 p-5 xl:grid-cols-[310px_1fr]">
            <aside className="space-y-4">
              <DoctorInformationCard
                icon={Stethoscope}
                label="Specialization"
                value={
                  bookingData.selectedDoctor
                    .specialization
                }
              />

              <DoctorInformationCard
                icon={UserRound}
                label="Experience"
                value={`${bookingData.selectedDoctor.experienceYears} years`}
              />

              <DoctorInformationCard
                icon={WalletCards}
                label="Consultation fee"
                value={`PKR ${bookingData.selectedDoctor.consultationFee.toLocaleString()}`}
              />

              <DoctorInformationCard
                icon={Clock3}
                label="Slot duration"
                value={`${bookingData.selectedDoctor.consultationDuration} minutes`}
              />

              <DoctorInformationCard
                icon={MapPin}
                label="Clinic"
                value={`${bookingData.selectedDoctor.clinicName} — ${bookingData.selectedDoctor.city}`}
              />
            </aside>

            <div id="appointment-slots" className="scroll-mt-6">
              <form
                action="/patient/appointments/new#appointment-slots"
                method="GET"
                className="rounded-xl border bg-background p-4"
              >
                <input
                  type="hidden"
                  name="doctorId"
                  value={
                    bookingData.selectedDoctor.profileId
                  }
                />

                {search && (
                  <input
                    type="hidden"
                    name="search"
                    value={search}
                  />
                )}

                {recommendationId && (
                  <input type="hidden" name="recommendationId" value={recommendationId} />
                )}

                <label
                  htmlFor="appointment-date"
                  className="text-sm font-medium"
                >
                  Select appointment date
                </label>

                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                  <input
                    id="appointment-date"
                    name="date"
                    type="date"
                    required
                    min={bookingData.minimumDate}
                    max={bookingData.maximumDate}
                    defaultValue={selectedDate}
                    className="focus-ring h-11 flex-1 rounded-lg border bg-background px-3 text-sm outline-none"
                  />

                  <button
                    type="submit"
                    className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg border bg-card px-5 text-sm font-semibold transition hover:bg-muted"
                  >
                    <CalendarDays
                      className="size-4"
                      aria-hidden="true"
                    />

                    Check Slots
                  </button>
                </div>
              </form>

              {selectedDate &&
                bookingData.dateMessage && (
                  <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-400">
                    <CircleAlert
                      className="mt-0.5 size-5 shrink-0"
                      aria-hidden="true"
                    />

                    <p className="text-sm leading-6">
                      {bookingData.dateMessage}
                    </p>
                  </div>
                )}

              {selectedDate &&
                bookingData.availableSlots.length >
                  0 && (
                  <form
                    action={createAppointment}
                    className="mt-6 space-y-5"
                  >
                    <input
                      type="hidden"
                      name="doctorProfileId"
                      value={
                        bookingData.selectedDoctor
                          .profileId
                      }
                    />

                    <input
                      type="hidden"
                      name="appointmentDate"
                      value={selectedDate}
                    />

                    <div>
                      <p className="text-sm font-medium">
                        Available time slots
                        <span className="ml-1 text-destructive">
                          *
                        </span>
                      </p>

                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {bookingData.availableSlots.map(
                          (slot) => (
                            <label
                              key={slot}
                              className="cursor-pointer"
                            >
                              <input
                                type="radio"
                                name="appointmentTime"
                                value={slot}
                                required
                                className="peer sr-only"
                              />

                              <span className="focus-ring flex h-11 items-center justify-center rounded-lg border bg-background text-sm font-semibold transition peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground hover:bg-muted peer-checked:hover:bg-primary">
                                {formatTime(slot)}
                              </span>
                            </label>
                          )
                        )}
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <FormField
                        id="consultationType"
                        label="Consultation type"
                        required
                      >
                        <select
                          id="consultationType"
                          name="consultationType"
                          required
                          defaultValue="in_person"
                          className={inputClasses}
                        >
                          {CONSULTATION_TYPES.map(
                            (type) => (
                              <option
                                key={type.value}
                                value={type.value}
                              >
                                {type.label}
                              </option>
                            )
                          )}
                        </select>
                      </FormField>

                      <FormField
                        id="severity"
                        label="Symptom severity"
                        required
                      >
                        <select
                          id="severity"
                          name="severity"
                          required
                          defaultValue="mild"
                          className={inputClasses}
                        >
                          {SEVERITY_OPTIONS.map(
                            (option) => (
                              <option
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </option>
                            )
                          )}
                        </select>
                      </FormField>

                      <div className="md:col-span-2">
                        <FormField
                          id="reason"
                          label="Reason for appointment"
                          required
                        >
                          <input
                            id="reason"
                            name="reason"
                            type="text"
                            required
                            minLength={5}
                            maxLength={300}
                            placeholder="Example: Persistent headache and dizziness"
                            className={inputClasses}
                          />
                        </FormField>
                      </div>

                      <FormField
                        id="symptoms"
                        label="Symptoms"
                        required
                        description="Enter multiple symptoms separated by commas or on separate lines."
                      >
                        <textarea
                          id="symptoms"
                          name="symptoms"
                          required
                          minLength={3}
                          maxLength={1500}
                          rows={5}
                          placeholder={`Headache\nDizziness\nNausea`}
                          className={textareaClasses}
                        />
                      </FormField>

                      <FormField
                        id="symptomDuration"
                        label="Symptom duration"
                      >
                        <input
                          id="symptomDuration"
                          name="symptomDuration"
                          type="text"
                          maxLength={100}
                          placeholder="Example: 3 days"
                          className={inputClasses}
                        />
                      </FormField>

                      <FormField
                        id="preferredLanguage"
                        label="Preferred language"
                      >
                        <input
                          id="preferredLanguage"
                          name="preferredLanguage"
                          type="text"
                          maxLength={100}
                          placeholder="Urdu, English..."
                          className={inputClasses}
                        />
                      </FormField>

                      <FormField
                        id="patientNotes"
                        label="Additional notes"
                      >
                        <textarea
                          id="patientNotes"
                          name="patientNotes"
                          rows={5}
                          maxLength={1500}
                          placeholder="Add any information that may help the doctor..."
                          className={textareaClasses}
                        />
                      </FormField>
                    </div>

                    <label className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                      <input
                        type="checkbox"
                        name="consentToAIAnalysis"
                        value="true"
                        required
                        className="mt-1 size-4"
                      />
                      <span>
                        <span className="block text-sm font-semibold">AI-assisted intake consent</span>
                        <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                          I consent to Groq AI processing my submitted symptoms to create a structured clinical intake summary for doctor review. AI output is not a diagnosis or prescription.
                        </span>
                      </span>
                    </label>

                    <div className="flex flex-col gap-4 rounded-xl border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold">
                          Confirm appointment request
                        </p>

                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          Your request will initially be marked as pending.
                          It will be confirmed after the doctor accepts it.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={!bookingData.profileExists}
                        className="focus-ring inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <CalendarPlus
                          className="size-4"
                          aria-hidden="true"
                        />

                        Book Appointment
                      </button>
                    </div>
                  </form>
                )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

async function getBookingPageData({
  patientUserId,
  selectedDoctorId,
  selectedDate,
  search,
  recommendationId,
}) {
  await connectDB();

  const patientProfile =
    await PatientProfile.findOne({
      userId: patientUserId,
    })
      .select("_id profileCompleted")
      .lean();

  const doctorDocuments =
    await DoctorProfile.find({
      approvalStatus: "approved",
    })
      .populate({
        path: "userId",
        select: "name email phone isActive",
      })
      .sort({
        specialization: 1,
        createdAt: -1,
      })
      .lean();

  const recommendation = recommendationId
    ? await DoctorRecommendation.findOne({
        _id: recommendationId,
        patientId: patientUserId,
        expiresAt: { $gt: new Date() },
      }).lean().catch(() => null)
    : null;

  const recommendedSpecializations = new Set(
    recommendation?.recommendedSpecializations || []
  );

  const normalizedDoctors = doctorDocuments
    .filter(
      (doctor) =>
        doctor.userId &&
        doctor.userId.isActive !== false
    )
    .map(normalizeDoctor)
    .map((doctor) => ({
      ...doctor,
      recommended: recommendedSpecializations.has(doctor.specialization),
    }))
    .sort((first, second) => Number(second.recommended) - Number(first.recommended));

  const normalizedSearch = search.toLowerCase();

  const doctors = search
    ? normalizedDoctors.filter((doctor) => {
        const values = [
          doctor.name,
          doctor.email,
          doctor.specialization,
          doctor.qualification,
          doctor.clinicName,
          doctor.city,
        ];

        return values.some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(normalizedSearch)
        );
      })
    : normalizedDoctors;

  const selectedDoctor =
    normalizedDoctors.find(
      (doctor) =>
        doctor.profileId === selectedDoctorId
    ) || null;

  const minimumDate =
    getDateInputValue(new Date());

  const maximumDateObject = new Date();

  maximumDateObject.setDate(
    maximumDateObject.getDate() +
      (selectedDoctor?.advanceBookingDays || 30)
  );

  const maximumDate =
    getDateInputValue(maximumDateObject);

  let availableSlots = [];
  let dateMessage = "";

  if (selectedDoctor && selectedDate) {
    const slotResult =
      await generateAvailableSlots({
        doctor: selectedDoctor,
        selectedDate,
      });

    availableSlots = slotResult.slots;
    dateMessage = slotResult.message;
  }

  return {
    profileExists: Boolean(patientProfile),
    doctors,
    selectedDoctor,
    availableSlots,
    dateMessage,
    minimumDate,
    maximumDate,
    recommendation: recommendation
      ? {
          id: recommendation._id.toString(),
          summary: recommendation.summary,
          suggestedDepartment: recommendation.suggestedDepartment,
          specializations: recommendation.recommendedSpecializations,
          requiresUrgentReview: recommendation.requiresUrgentReview,
        }
      : null,
  };
}

async function generateAvailableSlots({
  doctor,
  selectedDate,
}) {
  const date = parseDateInput(selectedDate);

  if (!date) {
    return {
      slots: [],
      message: "Please select a valid appointment date.",
    };
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  if (date < todayStart) {
    return {
      slots: [],
      message: "Appointments cannot be booked for a past date.",
    };
  }

  const maximumDate = new Date(todayStart);

  maximumDate.setDate(
    maximumDate.getDate() +
      doctor.advanceBookingDays
  );

  maximumDate.setHours(23, 59, 59, 999);

  if (date > maximumDate) {
    return {
      slots: [],
      message: `This doctor accepts bookings up to ${doctor.advanceBookingDays} days in advance.`,
    };
  }

  const dayName = date
    .toLocaleDateString("en-US", {
      weekday: "long",
    })
    .toLowerCase();

  const daySchedule =
    doctor.availability.find(
      (item) => item.day === dayName
    );

  if (
    !daySchedule ||
    !daySchedule.isAvailable
  ) {
    return {
      slots: [],
      message: `This doctor is not available on ${capitalize(dayName)}.`,
    };
  }

  const dateStart = new Date(date);
  dateStart.setHours(0, 0, 0, 0);

  const dateEnd = new Date(date);
  dateEnd.setHours(23, 59, 59, 999);

  const doctorReferenceIds = [
    doctor.userId,
    doctor.profileId,
  ];

  const existingAppointments =
    await Appointment.find({
      doctorId: {
        $in: doctorReferenceIds,
      },

      appointmentDate: {
        $gte: dateStart,
        $lte: dateEnd,
      },

      status: {
        $in: ["pending", "confirmed"],
      },
    })
      .select("appointmentTime")
      .lean();

  if (
    existingAppointments.length >=
    doctor.maxAppointmentsPerDay
  ) {
    return {
      slots: [],
      message:
        "The maximum daily appointment limit for this date has been reached.",
    };
  }

  const bookedTimes = new Set(
    existingAppointments.map((appointment) =>
      normalizeTime(
        appointment.appointmentTime ||
          appointment.time ||
          appointment.timeSlot
      )
    )
  );

  const allSlots = createTimeSlots({
    startTime: daySchedule.startTime,
    endTime: daySchedule.endTime,
    durationMinutes:
      doctor.consultationDuration,
    breakEnabled: doctor.breakEnabled,
    breakStartTime: doctor.breakStartTime,
    breakEndTime: doctor.breakEndTime,
  });

  const now = new Date();

  const minimumBookingTime = new Date(
    now.getTime() +
      doctor.minimumBookingNoticeHours *
        60 *
        60 *
        1000
  );

  const slots = allSlots.filter((slot) => {
    if (bookedTimes.has(slot)) {
      return false;
    }

    const slotDateTime =
      combineDateAndTime(date, slot);

    return slotDateTime >= minimumBookingTime;
  });

  return {
    slots,

    message:
      slots.length === 0
        ? "No appointment slots are available on this date."
        : "",
  };
}

async function recommendDoctors(formData) {
  "use server";
  const session = await auth();
  if (!session?.user || session.user.role !== USER_ROLES.PATIENT) redirect("/unauthorized");

  const symptoms = sanitizeText(formData.get("symptoms"), 2000);
  const duration = sanitizeText(formData.get("duration"), 100);
  const consentToAIAnalysis = formData.get("consentToAIAnalysis") === "true";
  if (symptoms.length < 10 || !consentToAIAnalysis) {
    redirect("/patient/appointments/new?error=invalid-recommendation-data");
  }

  await connectDB();
  const profile = await PatientProfile.findOne({ userId: session.user.id }).lean();

  let recommendationId;
  try {
    const analysis = await analyzeSymptoms({
      symptoms,
      duration,
      additionalInformation: buildPatientMedicalContext(profile),
    });
    const recommendedSpecializations = matchSpecializations(
      analysis.suggestedDepartment,
      analysis.summary
    );
    const recommendation = await DoctorRecommendation.create({
      patientId: session.user.id,
      symptoms,
      duration,
      summary: analysis.summary,
      suggestedDepartment: analysis.suggestedDepartment,
      recommendedSpecializations,
      redFlagsDetected: analysis.redFlagsDetected,
      requiresUrgentReview: analysis.requiresUrgentReview,
      missingInformation: analysis.missingInformation,
      consentToAIAnalysis,
      provider: analysis.provider,
      modelName: analysis.modelName,
    });
    recommendationId = recommendation._id.toString();
  } catch (error) {
    console.error("AI doctor recommendation failed:", error);
    redirect("/patient/appointments/new?error=recommendation-failed");
  }
  redirect(`/patient/appointments/new?recommendationId=${recommendationId}`);
}

async function createAppointment(formData) {
  "use server";

  const session = await auth();

  if (
    !session?.user ||
    session.user.role !== USER_ROLES.PATIENT
  ) {
    redirect("/unauthorized");
  }

  const doctorProfileId = sanitizeText(
    formData.get("doctorProfileId"),
    100
  );

  const appointmentDateValue = sanitizeText(
    formData.get("appointmentDate"),
    20
  );

  const appointmentTime = normalizeTime(
    formData.get("appointmentTime")
  );

  const consultationType = sanitizeText(
    formData.get("consultationType"),
    50
  );

  const severity = sanitizeText(
    formData.get("severity"),
    50
  );

  const reason = sanitizeText(
    formData.get("reason"),
    300
  );

  const symptoms = parseList(
    formData.get("symptoms"),
    50,
    150
  );

  const symptomDuration = sanitizeText(
    formData.get("symptomDuration"),
    100
  );

  const preferredLanguage = sanitizeText(
    formData.get("preferredLanguage"),
    100
  );

  const patientNotes = sanitizeText(
    formData.get("patientNotes"),
    1500
  );

  const consentToAIAnalysis =
    formData.get("consentToAIAnalysis") === "true";

  if (
    !doctorProfileId ||
    !appointmentTime ||
    reason.length < 5 ||
    symptoms.length === 0 ||
    !consentToAIAnalysis ||
    !CONSULTATION_TYPES.some(
      (type) =>
        type.value === consultationType
    ) ||
    !SEVERITY_OPTIONS.some(
      (option) =>
        option.value === severity
    )
  ) {
    redirect(
      createBookingErrorUrl({
        doctorProfileId,
        appointmentDateValue,
        error: "invalid-data",
      })
    );
  }

  const appointmentDate = parseDateInput(
    appointmentDateValue
  );

  if (!appointmentDate) {
    redirect(
      createBookingErrorUrl({
        doctorProfileId,
        appointmentDateValue,
        error: "invalid-date",
      })
    );
  }

  await connectDB();

  const [patientProfile, doctorDocument] =
    await Promise.all([
      PatientProfile.findOne({
        userId: session.user.id,
      }),

      DoctorProfile.findOne({
        _id: doctorProfileId,
        approvalStatus: "approved",
      }).populate({
        path: "userId",
        select: "name email isActive",
      }),
    ]);

  if (!patientProfile) {
    redirect("/patient/profile");
  }

  if (
    !doctorDocument ||
    !doctorDocument.userId ||
    doctorDocument.userId.isActive === false
  ) {
    redirect(
      "/patient/appointments/new?error=doctor-unavailable"
    );
  }

  const doctor =
    normalizeDoctor(
      doctorDocument.toObject()
    );

  const slotResult =
    await generateAvailableSlots({
      doctor,
      selectedDate: appointmentDateValue,
    });

  if (
    !slotResult.slots.includes(
      appointmentTime
    )
  ) {
    redirect(
      createBookingErrorUrl({
        doctorProfileId,
        appointmentDateValue,
        error: "slot-unavailable",
      })
    );
  }

  const duplicateAppointment =
    await Appointment.exists({
      patientId: session.user.id,

      appointmentDate: {
        $gte: startOfDay(appointmentDate),
        $lte: endOfDay(appointmentDate),
      },

      appointmentTime,

      status: {
        $in: ["pending", "confirmed"],
      },
    });

  if (duplicateAppointment) {
    redirect(
      createBookingErrorUrl({
        doctorProfileId,
        appointmentDateValue,
        error: "patient-time-conflict",
      })
    );
  }

  const doctorReference =
    getAppointmentDoctorReference(
      doctorDocument
    );

  const appointment =
    await Appointment.create({
      patientId: session.user.id,
      doctorId: doctorReference,

      appointmentDate,
      appointmentTime,
      startTime: appointmentTime,
      endTime: addMinutesToTime(
        appointmentTime,
        doctor.consultationDuration
      ),

      consultationType,
      severity,
      reason,
      symptoms,
      symptomDuration,
      preferredLanguage,
      patientNotes,

      status: "pending",

      durationMinutes:
        doctor.consultationDuration,

      consultationFee:
        doctor.consultationFee,

      clinicName:
        doctor.clinicName,

      doctorSpecialization:
        doctor.specialization,

      referenceNumber:
        createReferenceNumber(),

      statusHistory: [
        {
          status: "pending",
          note:
            "Appointment requested by patient",
          changedBy: session.user.id,
          changedAt: new Date(),
        },
      ],
    });

  // Persist the complete intake even if a development server still has a
  // legacy Mongoose model cached from before these fields were introduced.
  await Appointment.collection.updateOne(
    { _id: appointment._id },
    {
      $set: {
        appointmentTime,
        consultationType,
        severity,
        symptoms,
        symptomDuration,
        preferredLanguage,
        patientNotes,
        durationMinutes: doctor.consultationDuration,
        clinicName: doctor.clinicName,
        doctorSpecialization: doctor.specialization,
      },
    }
  );

  const symptomText = symptoms.join(", ");
  const symptomSubmission = await SymptomSubmission.create({
    appointmentId: appointment._id,
    patientId: session.user.id,
    originalText: symptomText,
    symptomsDuration: symptomDuration,
    additionalInformation: patientNotes,
    consentToAIAnalysis,
    lastUpdatedBy: session.user.id,
  });

  try {
    const medicalContext = buildPatientMedicalContext(patientProfile);
    const analysis = await analyzeSymptoms({
      symptoms: symptomText,
      duration: symptomDuration,
      additionalInformation: [
        `Reason: ${reason}`,
        `Severity: ${severity}`,
        patientNotes ? `Patient notes: ${patientNotes}` : "",
        medicalContext,
      ].filter(Boolean).join("\n"),
    });

    await AIAnalysis.create({
      symptomSubmissionId: symptomSubmission._id,
      appointmentId: appointment._id,
      patientId: session.user.id,
      doctorId: doctorReference,
      summary: analysis.summary,
      reportedSymptoms: analysis.reportedSymptoms,
      symptomsDuration: symptomDuration,
      missingInformation: analysis.missingInformation,
      redFlagsDetected: analysis.redFlagsDetected,
      requiresUrgentReview: analysis.requiresUrgentReview,
      suggestedDepartment: analysis.suggestedDepartment,
      inputLanguage: preferredLanguage || "unknown",
      disclaimer: analysis.disclaimer,
      status: "completed",
      provider: analysis.provider,
      modelName: analysis.modelName,
      promptVersion: "v1",
    });
  } catch (error) {
    console.error("Appointment AI intake analysis failed:", error);
    const safeErrorMessage = getSafeAIErrorMessage(error);
    await AIAnalysis.create({
      symptomSubmissionId: symptomSubmission._id,
      appointmentId: appointment._id,
      patientId: session.user.id,
      doctorId: doctorReference,
      symptomsDuration: symptomDuration,
      status: "failed",
      errorMessage: safeErrorMessage,
    });
  }

  redirect(
    `/patient/appointments/${appointment._id.toString()}?booked=true`
  );
}

function DoctorCard({
  doctor,
  selected,
  search,
  selectedDate,
  recommended,
  recommendationId,
}) {
  const params = new URLSearchParams({
    doctorId: doctor.profileId,
  });

  if (search) {
    params.set("search", search);
  }

  if (selectedDate) {
    params.set("date", selectedDate);
  }

  if (recommendationId) {
    params.set("recommendationId", recommendationId);
  }

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition duration-200 ${
        selected
          ? "border-primary shadow-md ring-1 ring-primary"
          : "hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
      }`}
    >
      <div className={`h-1.5 w-full ${recommended ? "bg-emerald-500" : selected ? "bg-primary" : "bg-primary/20"}`} />

      <div className="flex flex-1 flex-col p-5">
      <div className="flex items-start gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/10">
          <Stethoscope
            className="size-6"
            aria-hidden="true"
          />
        </span>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {recommended && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                <Sparkles className="size-3" aria-hidden="true" /> AI Recommended
              </span>
            )}
            {selected && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                <CheckCircle2 className="size-3" aria-hidden="true" /> Selected
              </span>
            )}
          </div>
          <h3 className="truncate text-base font-semibold tracking-tight">
            {doctor.name}
          </h3>

          <p className="mt-1 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            {doctor.specialization}
          </p>

          <p className="mt-2 truncate text-xs text-muted-foreground">
            {doctor.qualification}
          </p>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3">
        <DoctorCardDetail
          icon={UserRound}
          title="Experience"
          label={`${doctor.experienceYears} years`}
        />

        <DoctorCardDetail
          icon={WalletCards}
          title="Consultation fee"
          label={`PKR ${doctor.consultationFee.toLocaleString()}`}
        />

        <DoctorCardDetail
          icon={Clock3}
          title="Slot duration"
          label={`${doctor.consultationDuration} minute slots`}
        />

        <DoctorCardDetail
          icon={MapPin}
          title="Clinic"
          label={`${doctor.clinicName}, ${doctor.city}`}
        />
      </dl>

      <div className="mt-4 rounded-xl border bg-muted/30 p-3">
        <DoctorCardDetail
          icon={CalendarDays}
          title="Availability"
          label={formatAvailabilitySummary(doctor.availability)}
          allowWrap
        />
      </div>

      <Link
        href={`/patient/appointments/new?${params.toString()}#booking-details`}
        className={`focus-ring mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition ${
          selected
            ? "bg-primary text-primary-foreground"
            : "border border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground"
        }`}
      >
        <CalendarDays
          className="size-4"
          aria-hidden="true"
        />

        {selected
          ? "Continue to Booking"
          : "Select Doctor"}
      </Link>
      </div>
    </article>
  );
}

function DoctorCardDetail({
  icon: Icon,
  title,
  label,
  allowWrap = false,
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
        <dt>{title}</dt>
      </div>
      <dd className={`mt-1 text-xs font-semibold text-foreground ${allowWrap ? "leading-5" : "truncate"}`}>
        {label}
      </dd>
    </div>
  );
}

function DoctorInformationCard({
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

      <p className="mt-2 text-sm font-semibold leading-6">
        {value || "Not provided"}
      </p>
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

function BookingErrorAlert({ error }) {
  const messages = {
    "invalid-data":
      "Required appointment information must use a valid format.",

    "invalid-date":
      "Please select a valid appointment date.",

    "doctor-unavailable":
      "The selected doctor is currently unavailable for appointments.",

    "slot-unavailable":
      "The selected time slot is no longer available. Please choose another slot.",

    "patient-time-conflict":
      "You already have an appointment at this date and time.",

    "invalid-recommendation-data":
      "Enter at least 10 characters and provide consent before requesting an AI doctor recommendation.",

    "recommendation-failed":
      "The AI doctor recommendation could not be completed. Please try again shortly or select a doctor manually.",
  };

  return (
    <div
      className="mt-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive"
      role="alert"
    >
      <CircleAlert
        className="mt-0.5 size-5 shrink-0"
        aria-hidden="true"
      />

      <div>
        <p className="text-sm font-semibold">
          The appointment could not be booked
        </p>

        <p className="mt-1 text-sm leading-6">
          {messages[error] ||
            "Please check the appointment information and try again."}
        </p>
      </div>
    </div>
  );
}

function normalizeDoctor(doctor) {
  const user =
    doctor.userId &&
    typeof doctor.userId === "object"
      ? doctor.userId
      : {};

  return {
    profileId:
      doctor._id?.toString() || "",

    userId:
      user._id?.toString() ||
      doctor.userId?.toString() ||
      "",

    name:
      user.name || "Doctor",

    email:
      user.email || "",

    specialization:
      doctor.specialization ||
      "General Physician",

    qualification:
      doctor.qualification ||
      "Qualification not provided",

    experienceYears:
      getNumber(
        doctor.experienceYears ??
          doctor.yearsOfExperience,
        0
      ),

    consultationFee:
      getNumber(
        doctor.consultationFee,
        0
      ),

    consultationDuration:
      getNumberInAllowedValues(
        doctor.consultationDuration ??
          doctor.slotDuration,
        [15, 20, 30, 45, 60],
        30
      ),

    maxAppointmentsPerDay:
      getNumberInRange(
        doctor.maxAppointmentsPerDay,
        1,
        100,
        20
      ),

    minimumBookingNoticeHours:
      getNumberInRange(
        doctor.minimumBookingNoticeHours,
        0,
        720,
        2
      ),

    advanceBookingDays:
      getNumberInRange(
        doctor.advanceBookingDays,
        1,
        365,
        30
      ),

    clinicName:
      doctor.clinicName ||
      doctor.hospitalName ||
      "Clinic not provided",

    city:
      doctor.city ||
      doctor.clinicAddress?.city ||
      doctor.address?.city ||
      "City not provided",

    breakEnabled:
      doctor.breakEnabled === true,

    breakStartTime:
      normalizeTime(
        doctor.breakStartTime
      ),

    breakEndTime:
      normalizeTime(
        doctor.breakEndTime
      ),

    availability: Array.isArray(
      doctor.availability
    )
      ? doctor.availability.map(
          (item) => ({
            day: String(
              item.day || ""
            ).toLowerCase(),

            isAvailable:
              item.isAvailable !== false,

            startTime:
              normalizeTime(item.slots?.[0]?.startTime || item.startTime) ||
              "09:00",

            endTime:
              normalizeTime(item.slots?.[0]?.endTime || item.endTime) ||
              "17:00",
          })
        )
      : [],
  };
}

function createTimeSlots({
  startTime,
  endTime,
  durationMinutes,
  breakEnabled,
  breakStartTime,
  breakEndTime,
}) {
  const startMinutes =
    timeToMinutes(startTime);

  const endMinutes =
    timeToMinutes(endTime);

  if (
    startMinutes === null ||
    endMinutes === null ||
    startMinutes >= endMinutes
  ) {
    return [];
  }

  const slots = [];

  for (
    let current = startMinutes;
    current + durationMinutes <= endMinutes;
    current += durationMinutes
  ) {
    const slotEnd =
      current + durationMinutes;

    const overlapsBreak =
      breakEnabled &&
      breakStartTime &&
      breakEndTime &&
      current <
        timeToMinutes(breakEndTime) &&
      slotEnd >
        timeToMinutes(breakStartTime);

    if (!overlapsBreak) {
      slots.push(
        minutesToTime(current)
      );
    }
  }

  return slots;
}

function addMinutesToTime(time, minutesToAdd) {
  const start = timeToMinutes(time);
  return start === null ? "" : minutesToTime(start + minutesToAdd);
}

function formatAvailabilitySummary(availability) {
  const availableDays = availability.filter(
    (schedule) => schedule.isAvailable
  );

  if (availableDays.length === 0) {
    return "No weekly availability provided";
  }

  return availableDays
    .map(
      (schedule) =>
        `${capitalize(schedule.day)}: ${formatTime(schedule.startTime)}–${formatTime(schedule.endTime)}`
    )
    .join("; ");
}

function getAppointmentDoctorReference(
  doctorDocument
) {
  const doctorPath =
    Appointment.schema.path("doctorId");

  const referenceModel =
    doctorPath?.options?.ref;

  if (
    referenceModel === "DoctorProfile"
  ) {
    return doctorDocument._id;
  }

  return doctorDocument.userId._id;
}

function createBookingErrorUrl({
  doctorProfileId,
  appointmentDateValue,
  error,
}) {
  const params = new URLSearchParams();

  if (doctorProfileId) {
    params.set(
      "doctorId",
      doctorProfileId
    );
  }

  if (appointmentDateValue) {
    params.set(
      "date",
      appointmentDateValue
    );
  }

  params.set("error", error);

  return `/patient/appointments/new?${params.toString()}`;
}

function parseDateInput(value) {
  const text = String(value || "");

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(text)
  ) {
    return null;
  }

  const [year, month, day] = text
    .split("-")
    .map(Number);

  const date = new Date(
    year,
    month - 1,
    day
  );

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  date.setHours(0, 0, 0, 0);

  return date;
}

function combineDateAndTime(
  date,
  time
) {
  const [hours, minutes] = time
    .split(":")
    .map(Number);

  const result = new Date(date);

  result.setHours(
    hours,
    minutes,
    0,
    0
  );

  return result;
}

function startOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function getDateInputValue(date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeTime(value) {
  const time = String(value || "")
    .trim();

  if (
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(
      time
    )
  ) {
    return "";
  }

  return time;
}

function timeToMinutes(time) {
  const normalized =
    normalizeTime(time);

  if (!normalized) {
    return null;
  }

  const [hours, minutes] =
    normalized.split(":").map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = Math.floor(
    minutes / 60
  );

  const remainingMinutes =
    minutes % 60;

  return `${String(hours).padStart(
    2,
    "0"
  )}:${String(
    remainingMinutes
  ).padStart(2, "0")}`;
}

function formatTime(time) {
  const normalized =
    normalizeTime(time);

  if (!normalized) {
    return "Invalid time";
  }

  const [hours, minutes] =
    normalized.split(":").map(Number);

  const date = new Date();

  date.setHours(
    hours,
    minutes,
    0,
    0
  );

  return new Intl.DateTimeFormat(
    "en-PK",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(date);
}

function createReferenceNumber() {
  const datePart = new Date()
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "");

  const randomPart = Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase();

  return `APT-${datePart}-${randomPart}`;
}

function buildPatientMedicalContext(profile) {
  if (!profile) return "No patient medical profile was available.";
  const values = [
    ["Blood group", profile.bloodGroup],
    ["Allergies", profile.allergies],
    ["Current medications", profile.currentMedications],
    ["Chronic conditions", profile.chronicConditions],
    ["Previous surgeries", profile.previousSurgeries],
    ["Family medical history", profile.familyMedicalHistory],
  ];
  return values
    .map(([label, value]) => `${label}: ${Array.isArray(value) ? value.join(", ") : value || "Not provided"}`)
    .join("\n");
}

function matchSpecializations(department, summary) {
  const text = `${department || ""} ${summary || ""}`.toLowerCase();
  const rules = [
    ["Cardiologist", ["cardio", "heart", "chest pain"]],
    ["Dermatologist", ["dermat", "skin", "rash", "acne"]],
    ["Neurologist", ["neuro", "headache", "migraine", "seizure", "dizziness"]],
    ["Pediatrician", ["pediatric", "child", "infant"]],
    ["Gynecologist", ["gynec", "women", "pregnan", "menstrual"]],
    ["Orthopedic Surgeon", ["orthopedic", "bone", "joint", "fracture", "back pain"]],
    ["ENT Specialist", ["ent", "ear", "nose", "throat", "sinus"]],
    ["Psychiatrist", ["psychi", "mental", "anxiety", "depression"]],
    ["Dentist", ["dental", "tooth", "teeth", "gum"]],
    ["General Physician", ["general", "internal medicine", "primary care"]],
  ];
  const matches = rules
    .filter(([, keywords]) => keywords.some((keyword) => text.includes(keyword)))
    .map(([specialization]) => specialization)
    .filter((specialization) => SPECIALIZATIONS.includes(specialization));
  return matches.length ? [...new Set(matches)] : ["General Physician"];
}

function getSafeAIErrorMessage(error) {
  const message = String(error?.message || "");
  if (message.includes("GROQ_API_KEY")) return "Groq API is not configured.";
  if (message.toLowerCase().includes("json")) return "Groq returned an invalid structured response.";
  if (error?.status === 401) return "Groq authentication failed.";
  if (error?.status === 429) return "Groq request limit was reached. Please retry shortly.";
  return "AI intake analysis could not be completed. Please retry the analysis.";
}

function parseList(
  value,
  maximumItems,
  maximumItemLength
) {
  return String(value || "")
    .split(/\r?\n|,/)
    .map((item) =>
      item
        .trim()
        .slice(0, maximumItemLength)
    )
    .filter(Boolean)
    .slice(0, maximumItems);
}

function sanitizeText(
  value,
  maximumLength
) {
  return String(value || "")
    .trim()
    .slice(0, maximumLength);
}

function getNumber(value, fallback) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function getNumberInAllowedValues(
  value,
  allowedValues,
  fallback
) {
  const number = Number(value);

  return allowedValues.includes(number)
    ? number
    : fallback;
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

function capitalize(value) {
  const text = String(value || "");

  return text
    ? text[0].toUpperCase() +
        text.slice(1)
    : "";
}

const inputClasses =
  "focus-ring h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground";

const textareaClasses =
  "focus-ring w-full resize-y rounded-lg border bg-background px-3 py-3 text-sm outline-none placeholder:text-muted-foreground";
