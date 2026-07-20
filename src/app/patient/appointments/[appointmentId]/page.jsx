import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  Activity,
  BrainCircuit,
  Building2,
  CalendarCheck2,
  CalendarDays,
  CalendarX,
  CheckCircle2,
  CircleAlert,
  CircleHelp,
  Clock3,
  FileText,
  HeartPulse,
  Mail,
  MapPin,
  Phone,
  Pill,
  ShieldAlert,
  Stethoscope,
  UserRound,
  WalletCards,
} from "lucide-react";

import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { USER_ROLES } from "@/lib/constants";
import DoctorProfile from "@/models/DoctorProfile";
import Appointment from "@/models/Appointment";
import PatientProfile from "@/models/PatientProfile";
import AIAnalysis from "@/models/AIAnalysis";
import SymptomSubmission from "@/models/SymptomSubmission";
import { analyzeSymptoms } from "@/services/ai.service";
import AppointmentDetailTabs from "@/components/patient/appointment-detail-tabs";

export const metadata = {
  title: "Appointment Details",
  description:
    "Review doctor information, appointment status, diagnosis, and prescription.",
};

export const dynamic = "force-dynamic";

export default async function PatientAppointmentDetailsPage({
  params,
  searchParams,
}) {
  const session = await auth();

  if (
    !session?.user ||
    session.user.role !== USER_ROLES.PATIENT
  ) {
    redirect("/unauthorized");
  }

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const appointmentId =
    resolvedParams?.appointmentId;

  const booked =
    resolvedSearchParams?.booked === "true";

  const cancelled =
    resolvedSearchParams?.cancelled === "true";

  const error =
    typeof resolvedSearchParams?.error === "string"
      ? resolvedSearchParams.error
      : "";

  const appointment =
    await getPatientAppointmentDetails({
      appointmentId,
      patientUserId: session.user.id,
    });

  if (!appointment) {
    notFound();
  }

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
              Appointment requested on{" "}
              {formatDateTime(
                appointment.createdAt
              )}
            </p>
          </div>

          <PatientAppointmentActions
            appointment={appointment}
          />
        </div>
      </header>

      {booked && (
        <AlertMessage
          type="success"
          title="Appointment request submitted"
          message="Your appointment request has been submitted and is awaiting confirmation from the doctor."
        />
      )}

      {cancelled && (
        <AlertMessage
          type="success"
          title="Appointment cancelled"
          message="Your appointment has been cancelled successfully."
        />
      )}

      {error && (
        <AppointmentErrorAlert
          error={error}
        />
      )}

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
          value={formatTime(
            appointment.appointmentTime
          )}
        />

        <SummaryCard
          icon={Stethoscope}
          label="Consultation Type"
          value={appointment.consultationType}
        />

        <SummaryCard
          icon={WalletCards}
          label="Consultation Fee"
          value={`PKR ${appointment.consultationFee.toLocaleString()}`}
        />
      </section>

      <AppointmentDetailTabs />

      <div id="appointment-detail-grid" className="mt-6 grid gap-6 xl:grid-cols-[1fr_370px]">
        <div id="appointment-main-sections" className="space-y-6">
          <SectionCard
            id="doctor-information"
            icon={Stethoscope}
            title="Doctor Information"
            description="Professional and clinic information for the selected doctor."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <InformationItem
                icon={UserRound}
                label="Doctor name"
                value={appointment.doctor.name}
              />

              <InformationItem
                icon={Stethoscope}
                label="Specialization"
                value={
                  appointment.doctor.specialization
                }
              />

              <InformationItem
                icon={FileText}
                label="Qualification"
                value={
                  appointment.doctor.qualification
                }
              />

              <InformationItem
                icon={UserRound}
                label="Experience"
                value={`${appointment.doctor.experienceYears} years`}
              />

              <InformationItem
                icon={Mail}
                label="Email address"
                value={appointment.doctor.email}
              />

              <InformationItem
                icon={Phone}
                label="Phone number"
                value={appointment.doctor.phone}
              />

              <InformationItem
                icon={MapPin}
                label="Clinic"
                value={
                  appointment.doctor.clinicName
                }
              />

              <InformationItem
                icon={MapPin}
                label="Clinic address"
                value={
                  appointment.doctor.clinicAddress
                }
              />
            </div>
          </SectionCard>

          <PatientAIIntakeCard id="ai-summary">
            {appointment.aiAnalysis?.status === "completed" ? (
              <div className="space-y-6">
                {appointment.aiAnalysis.requiresUrgentReview && (
                  <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                      <ShieldAlert className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">Urgent medical review recommended</p>
                      <p className="mt-1 text-sm leading-6 text-destructive/90">
                        If your symptoms are severe, worsening, or feel life-threatening, seek immediate medical care.
                      </p>
                    </div>
                  </div>
                )}

                <section className="rounded-xl border bg-background p-5">
                  <div className="flex items-center gap-2 text-primary">
                    <BrainCircuit className="size-4" aria-hidden="true" />
                    <h3 className="text-sm font-semibold">Your intake summary</h3>
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-foreground/90">
                    {appointment.aiAnalysis.summary || "No intake summary was generated."}
                  </p>
                </section>

                <div className="grid gap-4 md:grid-cols-2">
                  <PatientAIField
                    icon={Activity}
                    title="Symptoms you reported"
                    value={appointment.aiAnalysis.reportedSymptoms}
                    fallback="No symptoms identified"
                  />
                  <PatientAIField
                    icon={CircleHelp}
                    title="Details your doctor may clarify"
                    value={appointment.aiAnalysis.missingInformation}
                    fallback="No additional details identified"
                  />
                  <PatientAIField
                    icon={ShieldAlert}
                    title="Symptoms requiring attention"
                    value={appointment.aiAnalysis.redFlagsDetected}
                    fallback="No urgent warning signs identified"
                    tone="danger"
                  />
                  <PatientAIField
                    icon={Building2}
                    title="Suggested department"
                    value={appointment.aiAnalysis.suggestedDepartment}
                    fallback="Not specified"
                    tone="primary"
                  />
                </div>

                <div className="flex items-start gap-2 rounded-lg border bg-muted/30 px-4 py-3 text-xs leading-5 text-muted-foreground">
                  <Stethoscope className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <p>{appointment.aiAnalysis.disclaimer || "This AI-generated summary supports your doctor's review and is not a diagnosis or prescription."}</p>
                </div>
              </div>
            ) : appointment.aiAnalysis?.status === "failed" ? (
              <div>
                <p className="text-sm text-muted-foreground">
                  AI analysis was unavailable. Your original information remains available to the doctor.
                </p>
                <form action={retryAIAnalysis} className="mt-4">
                  <input type="hidden" name="appointmentId" value={appointment.id} />
                  <button className="focus-ring inline-flex h-10 items-center justify-center rounded-lg border bg-background px-4 text-sm font-semibold hover:bg-muted">
                    Retry AI Analysis
                  </button>
                </form>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No AI analysis is available for this legacy appointment.</p>
            )}
          </PatientAIIntakeCard>

          <PatientDataCard
            id="patient-intake"
            icon={FileText}
            title="Patient Intake"
            description="Symptoms and consultation details submitted with this appointment request."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <DataTile
                label="Reason for appointment"
                value={appointment.reason}
              />

              <DataTile
                label="Symptoms"
                value={appointment.symptoms}
              />

              <DataTile
                label="Symptoms duration"
                value={
                  appointment.symptomDuration
                }
              />

              <DataTile
                label="Severity"
                value={appointment.severity}
              />

              <DataTile
                label="Preferred language"
                value={
                  appointment.preferredLanguage
                }
              />

              <DataTile
                label="Consultation type"
                value={
                  appointment.consultationType
                }
              />
            </div>

            <div className="mt-5 border-t pt-5">
              <DataTile
                label="Additional notes"
                value={appointment.patientNotes}
              />
            </div>
          </PatientDataCard>

          <PatientDataCard
            id="health-profile"
            icon={ShieldAlert}
            title="Patient Health Profile"
            description="Saved medical information provided by the patient."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <DataTile label="Date of birth" value={appointment.patientProfile.dateOfBirth} />
              <DataTile label="Gender" value={appointment.patientProfile.gender} />
              <DataTile label="Blood group" value={appointment.patientProfile.bloodGroup} />
              <DataTile label="Known allergies" value={appointment.patientProfile.allergies} />
              <DataTile label="Current medications" value={appointment.patientProfile.currentMedications} />
              <DataTile label="Chronic conditions" value={appointment.patientProfile.chronicConditions} />
              <DataTile label="Previous surgeries" value={appointment.patientProfile.previousSurgeries} />
              <DataTile label="Family medical history" value={appointment.patientProfile.familyMedicalHistory} />
            </div>
          </PatientDataCard>

          <ClinicalOutcomeCard id="clinical-outcome">
            {appointment.status === "completed" ? (
              <div className="space-y-6">
                <ClinicalDetail
                  icon={HeartPulse}
                  label="Diagnosis"
                  value={appointment.diagnosis}
                />

                <ClinicalDetail
                  icon={Pill}
                  label="Prescription"
                  value={appointment.prescription}
                />

                <ClinicalDetail
                  icon={CalendarCheck2}
                  label="Follow-up instructions"
                  value={
                    appointment.followUpInstructions
                  }
                />

                <ClinicalDetail
                  icon={FileText}
                  label="Doctor notes"
                  value={appointment.doctorNotes}
                />
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
                <Clock3
                  className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />

                <div>
                  <p className="text-sm font-semibold">
                    Clinical outcome pending
                  </p>

                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    The diagnosis and prescription will appear here
                    after the consultation is completed.
                  </p>
                </div>
              </div>
            )}
          </ClinicalOutcomeCard>
        </div>

        <aside id="appointment-side-sections" className="space-y-6">
          <section id="appointment-status" data-appointment-section className="scroll-mt-20 overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="border-b bg-muted/20 p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Clock3 className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-semibold">
                Appointment Status
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Appointment progress and previous status updates.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <StatusTimeline
                history={
                  appointment.statusHistory
                }
              />
            </div>
          </section>

          <section id="booking-record" data-appointment-section className="scroll-mt-20 overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="border-b bg-muted/20 p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-semibold">Booking Record</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Key details for this appointment.</p>
                </div>
              </div>
            </div>

            <dl className="grid gap-4 p-5">
              <RecordItem
                label="Appointment ID"
                value={appointment.id}
              />

              <RecordItem
                label="Reference number"
                value={
                  appointment.referenceNumber
                }
              />

              <RecordItem
                label="Duration"
                value={`${appointment.durationMinutes} minutes`}
              />

              <RecordItem
                label="Created at"
                value={formatDateTime(
                  appointment.createdAt
                )}
              />

              <RecordItem
                label="Last updated"
                value={formatDateTime(
                  appointment.updatedAt
                )}
              />
            </dl>
          </section>

          {appointment.status === "cancelled" && (
            <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-destructive">
              <div className="flex items-start gap-3">
                <CalendarX
                  className="mt-0.5 size-5 shrink-0"
                  aria-hidden="true"
                />

                <div>
                  <h2 className="font-semibold">
                    Cancellation Details
                  </h2>

                  <p className="mt-3 text-xs font-medium">
                    Reason
                  </p>

                  <p className="mt-1 text-sm leading-6">
                    {
                      appointment.cancellationReason
                    }
                  </p>

                  <p className="mt-3 text-xs">
                    Cancelled on{" "}
                    {formatDateTime(
                      appointment.cancelledAt
                    )}
                  </p>
                </div>
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

async function retryAIAnalysis(formData) {
  "use server";
  const session = await auth();
  if (!session?.user || session.user.role !== USER_ROLES.PATIENT) redirect("/unauthorized");

  const appointmentId = String(formData.get("appointmentId") || "");
  await connectDB();
  const appointment = await Appointment.findOne({ _id: appointmentId, patientId: session.user.id }).lean();
  if (!appointment) redirect("/patient/appointments");

  const submission = await SymptomSubmission.findOne({
    appointmentId,
    patientId: session.user.id,
    consentToAIAnalysis: true,
  }).lean();
  if (!submission) redirect(`/patient/appointments/${appointmentId}?error=ai-consent-required`);

  try {
    const analysis = await analyzeSymptoms({
      symptoms: submission.originalText,
      duration: submission.symptomsDuration,
      additionalInformation: submission.additionalInformation,
    });
    await AIAnalysis.updateOne(
      { appointmentId },
      {
        $set: {
          summary: analysis.summary,
          reportedSymptoms: analysis.reportedSymptoms,
          symptomsDuration: submission.symptomsDuration,
          missingInformation: analysis.missingInformation,
          redFlagsDetected: analysis.redFlagsDetected,
          requiresUrgentReview: analysis.requiresUrgentReview,
          suggestedDepartment: analysis.suggestedDepartment,
          disclaimer: analysis.disclaimer,
          status: "completed",
          provider: analysis.provider,
          modelName: analysis.modelName,
          errorMessage: "",
        },
      },
      { upsert: false }
    );
  } catch (error) {
    console.error("AI intake retry failed:", error);
    await AIAnalysis.updateOne(
      { appointmentId },
      { $set: { status: "failed", errorMessage: "AI analysis retry failed. Please try again shortly." } }
    );
    redirect(`/patient/appointments/${appointmentId}?error=ai-retry-failed`);
  }

  revalidatePath(`/patient/appointments/${appointmentId}`);
  revalidatePath(`/doctor/appointments/${appointmentId}`);
  redirect(`/patient/appointments/${appointmentId}?ai=completed`);
}

async function getPatientAppointmentDetails({
  appointmentId,
  patientUserId,
}) {
  if (!appointmentId || !patientUserId) {
    return null;
  }

  await connectDB();

  let appointment;

  try {
    appointment = await Appointment.findOne({
      _id: appointmentId,
      patientId: patientUserId,
    }).lean();
  } catch {
    return null;
  }

  if (!appointment) {
    return null;
  }

  const [patientProfile, aiAnalysis] = await Promise.all([
    PatientProfile.findOne({ userId: patientUserId }).lean(),
    AIAnalysis.findOne({ appointmentId: appointment._id }).sort({ createdAt: -1 }).lean(),
  ]);

  const doctorData =
    await getAppointmentDoctorData(
      appointment.doctorId
    );

  const statusHistory = Array.isArray(
    appointment.statusHistory
  )
    ? appointment.statusHistory
        .map((item) => ({
          status:
            item.status ||
            item.newStatus ||
            "pending",

          note:
            item.note ||
            item.reason ||
            "",

          changedAt:
            item.changedAt ||
            item.createdAt ||
            null,

          changedBy:
            item.changedByRole ||
            "System",
        }))
        .sort(
          (firstItem, secondItem) =>
            new Date(
              secondItem.changedAt || 0
            ) -
            new Date(
              firstItem.changedAt || 0
            )
        )
    : [];

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

  return {
    id: appointment._id.toString(),

    referenceNumber:
      appointment.referenceNumber ||
      appointment.bookingNumber ||
      `APT-${appointment._id
        .toString()
        .slice(-8)
        .toUpperCase()}`,

    doctor: doctorData,

    patientProfile: {
      dateOfBirth: formatDate(patientProfile?.dateOfBirth),
      gender: formatReadableText(patientProfile?.gender || "Not provided"),
      bloodGroup: patientProfile?.bloodGroup || "Not provided",
      allergies: formatListOrText(patientProfile?.allergies, "No allergies recorded"),
      currentMedications: formatListOrText(patientProfile?.currentMedications, "No current medications recorded"),
      chronicConditions: formatListOrText(patientProfile?.chronicConditions, "No chronic conditions recorded"),
      previousSurgeries: formatListOrText(patientProfile?.previousSurgeries, "No previous surgeries recorded"),
      familyMedicalHistory: formatListOrText(patientProfile?.familyMedicalHistory, "No family medical history recorded"),
    },

    aiAnalysis: aiAnalysis
      ? {
          status: aiAnalysis.status,
          summary: aiAnalysis.summary || "No summary generated",
          reportedSymptoms: formatListOrText(aiAnalysis.reportedSymptoms, "None identified"),
          missingInformation: formatListOrText(aiAnalysis.missingInformation, "No missing information identified"),
          redFlagsDetected: formatListOrText(aiAnalysis.redFlagsDetected, "No red flags detected"),
          requiresUrgentReview: aiAnalysis.requiresUrgentReview === true,
          suggestedDepartment: aiAnalysis.suggestedDepartment || "Not specified",
          disclaimer: aiAnalysis.disclaimer,
        }
      : null,

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

    durationMinutes:
      getNumber(
        appointment.durationMinutes ??
          appointment.duration,
        30
      ),

    consultationFee:
      getNumber(
        appointment.consultationFee,
        doctorData.consultationFee
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

    symptoms: formatListOrText(
      appointment.symptoms,
      "No symptoms provided"
    ),

    symptomDuration:
      appointment.symptomDuration ||
      appointment.durationOfSymptoms ||
      "Not provided",

    severity: formatReadableText(
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
      "No additional notes provided",

    doctorNotes:
      appointment.doctorNotes ||
      appointment.clinicalNotes ||
      "No doctor notes recorded",

    diagnosis: formatListOrText(
      appointment.diagnosis,
      "No diagnosis recorded"
    ),

    prescription:
      formatPrescription(
        appointment.prescription ||
          appointment.prescriptions
      ),

    followUpInstructions:
      appointment.followUpInstructions ||
      appointment.followUpNotes ||
      "No follow-up instructions recorded",

    status:
      appointment.status ||
      "pending",

    statusHistory,

    cancellationReason:
      appointment.cancellationReason ||
      "No cancellation reason provided",

    cancelledAt:
      appointment.cancelledAt ||
      null,

    createdAt:
      appointment.createdAt ||
      null,

    updatedAt:
      appointment.updatedAt ||
      null,
  };
}

async function getAppointmentDoctorData(
  doctorReferenceId
) {
  const fallback = {
    name: "Doctor unavailable",
    email: "Not provided",
    phone: "Not provided",
    specialization: "General Physician",
    qualification: "Not provided",
    experienceYears: 0,
    consultationFee: 0,
    clinicName: "Not provided",
    clinicAddress: "Not provided",
  };

  if (!doctorReferenceId) {
    return fallback;
  }

  const doctorPath =
    Appointment.schema.path("doctorId");

  const referenceModel =
    doctorPath?.options?.ref;

  if (
    referenceModel === "DoctorProfile"
  ) {
    const profile =
      await DoctorProfile.findById(
        doctorReferenceId
      )
        .populate({
          path: "userId",
          select: "name email phone",
        })
        .lean();

    if (!profile) {
      return fallback;
    }

    return normalizeDoctorProfile(profile);
  }

  /*
    doctorId User to reference kare to User data
    direct populate of baghair retrieve to for
    DoctorProfile in userId search will.
  */
  const profile =
    await DoctorProfile.findOne({
      userId: doctorReferenceId,
    })
      .populate({
        path: "userId",
        select: "name email phone",
      })
      .lean();

  if (profile) {
    return normalizeDoctorProfile(profile);
  }

  return fallback;
}

function normalizeDoctorProfile(profile) {
  const user =
    profile.userId &&
    typeof profile.userId === "object"
      ? profile.userId
      : {};

  return {
    name:
      user.name || "Doctor unavailable",

    email:
      user.email || "Not provided",

    phone:
      user.phone || "Not provided",

    specialization:
      profile.specialization ||
      "General Physician",

    qualification:
      profile.qualification ||
      "Not provided",

    experienceYears:
      getNumber(
        profile.experienceYears ??
          profile.yearsOfExperience,
        0
      ),

    consultationFee:
      getNumber(
        profile.consultationFee,
        0
      ),

    clinicName:
      profile.clinicName ||
      profile.hospitalName ||
      "Not provided",

    clinicAddress:
      formatAddress(
        profile.clinicAddress ||
          profile.address
      ),
  };
}

function PatientAppointmentActions({
  appointment,
}) {
  const canCancel =
    ["pending", "confirmed"].includes(
      appointment.status
    ) &&
    !isAppointmentInPast(
      appointment.appointmentDate,
      appointment.appointmentTime
    );

  if (!canCancel) {
    return null;
  }

  return (
    <details className="relative">
      <summary className="focus-ring inline-flex h-10 cursor-pointer list-none items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 text-sm font-semibold text-destructive transition hover:bg-destructive/10">
        <CalendarX
          className="size-4"
          aria-hidden="true"
        />

        Cancel Appointment
      </summary>

      <form
        action={cancelPatientAppointment}
        className="absolute right-0 z-20 mt-2 w-80 rounded-xl border bg-card p-4 shadow-lg"
      >
        <input
          type="hidden"
          name="appointmentId"
          value={appointment.id}
        />

        <label
          htmlFor="cancellationReason"
          className="text-sm font-medium"
        >
          Cancellation reason
        </label>

        <textarea
          id="cancellationReason"
          name="cancellationReason"
          required
          minLength={5}
          maxLength={300}
          rows={4}
          placeholder="Enter the reason for cancellation..."
          className="focus-ring mt-2 w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
        />

        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          This appointment cannot be restored after it is cancelled.
        </p>

        <button
          type="submit"
          className="focus-ring mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg bg-destructive px-4 text-sm font-semibold text-destructive-foreground"
        >
          Confirm Cancellation
        </button>
      </form>
    </details>
  );
}

async function cancelPatientAppointment(
  formData
) {
  "use server";

  const session = await auth();

  if (
    !session?.user ||
    session.user.role !== USER_ROLES.PATIENT
  ) {
    redirect("/unauthorized");
  }

  const appointmentId = sanitizeText(
    formData.get("appointmentId"),
    100
  );

  const cancellationReason = sanitizeText(
    formData.get("cancellationReason"),
    300
  );

  if (
    !appointmentId ||
    cancellationReason.length < 5
  ) {
    redirect(
      `/patient/appointments/${appointmentId}?error=invalid-cancellation`
    );
  }

  await connectDB();

  let appointment;

  try {
    appointment =
      await Appointment.findOne({
        _id: appointmentId,
        patientId: session.user.id,
      });
  } catch {
    redirect(
      "/patient/appointments"
    );
  }

  if (!appointment) {
    redirect(
      "/patient/appointments"
    );
  }

  if (
    !["pending", "confirmed"].includes(
      appointment.status
    )
  ) {
    redirect(
      `/patient/appointments/${appointmentId}?error=cannot-cancel`
    );
  }

  const appointmentDate =
    appointment.appointmentDate ||
    appointment.date;

  const appointmentTime =
    appointment.appointmentTime ||
    appointment.time ||
    appointment.timeSlot;

  if (
    isAppointmentInPast(
      appointmentDate,
      appointmentTime
    )
  ) {
    redirect(
      `/patient/appointments/${appointmentId}?error=past-appointment`
    );
  }

  const previousStatus =
    appointment.status;

  appointment.status = "cancelled";
  appointment.cancelledAt = new Date();
  appointment.cancellationReason =
    cancellationReason;

  if (
    Array.isArray(
      appointment.statusHistory
    )
  ) {
    appointment.statusHistory.push({
      status: "cancelled",
      previousStatus,
      note: cancellationReason,
      changedBy: session.user.id,
      changedAt: new Date(),
    });
  }

  await appointment.save();

  revalidatePath(
    `/patient/appointments/${appointmentId}`
  );

  revalidatePath(
    "/patient/appointments"
  );

  revalidatePath(
    "/patient/dashboard"
  );

  revalidatePath(
    "/doctor/appointments"
  );

  revalidatePath(
    "/doctor/dashboard"
  );

  redirect(
    `/patient/appointments/${appointmentId}?cancelled=true`
  );
}

function SectionCard({
  id,
  icon: Icon,
  title,
  description,
  children,
}) {
  return (
    <section id={id} data-appointment-section className="scroll-mt-20 overflow-hidden rounded-xl border bg-card shadow-sm">
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

function PatientAIIntakeCard({ id, children }) {
  return (
    <section id={id} data-appointment-section className="scroll-mt-20 overflow-hidden rounded-2xl border bg-card shadow-sm">
      <header className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <BrainCircuit className="size-5" aria-hidden="true" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">AI-Assisted Intake Summary</h2>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                Prepared for your doctor
              </span>
            </div>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
              Groq AI organized your submitted health information to help your doctor review it efficiently.
            </p>
          </div>
        </div>
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function PatientDataCard({ id, icon: Icon, title, description, children }) {
  return (
    <section id={id} data-appointment-section className="scroll-mt-20 overflow-hidden rounded-2xl border bg-card shadow-sm">
      <header className="flex items-start gap-4 border-b bg-muted/20 p-5 sm:p-6">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function DataTile({ label, value }) {
  const displayValue = Array.isArray(value) ? value.join("\n") : value;
  return (
    <div className="rounded-xl border bg-background p-4 transition-colors hover:border-primary/30">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-foreground">
        {displayValue || "Not provided"}
      </p>
    </div>
  );
}

function ClinicalOutcomeCard({ id, children }) {
  return (
    <section id={id} data-appointment-section className="scroll-mt-20 overflow-hidden rounded-2xl border border-emerald-500/20 bg-card shadow-sm">
      <header className="flex items-start gap-4 border-b border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-5 sm:p-6">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
          <CalendarCheck2 className="size-5" aria-hidden="true" />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">Clinical Outcome</h2>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              Doctor reviewed
            </span>
          </div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Diagnosis, treatment, and follow-up information recorded by your doctor.
          </p>
        </div>
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function PatientAIField({ icon: Icon, title, value, fallback, tone = "default" }) {
  const entries = Array.isArray(value)
    ? value.filter(Boolean)
    : value
      ? String(value).split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean)
      : [];
  const toneClasses = tone === "danger"
    ? "border-destructive/20 bg-destructive/5 text-destructive"
    : tone === "primary"
      ? "border-primary/20 bg-primary/5 text-primary"
      : "border-border bg-background text-foreground";

  return (
    <section className={`rounded-xl border p-4 ${toneClasses}`}>
      <div className="flex items-center gap-2">
        <Icon className="size-4" aria-hidden="true" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {entries.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm text-foreground">
          {entries.map((entry) => (
            <li key={entry} className="flex items-start gap-2 leading-5">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
              <span>{entry}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{fallback}</p>
      )}
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

      <p className="mt-2 break-words text-sm font-semibold leading-6">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function DetailItem({
  label,
  value,
}) {
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

function ClinicalDetail({
  icon: Icon,
  label,
  value,
}) {
  const displayValue = Array.isArray(value) ? value : String(value || "").split(/\r?\n/).filter(Boolean);
  return (
    <div className="rounded-xl border bg-background p-5">
      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
        {Icon && <Icon className="size-4" aria-hidden="true" />}
        <h3 className="text-sm font-semibold">{label}</h3>
      </div>
      {displayValue.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {displayValue.map((entry) => (
            <li key={entry} className="flex items-start gap-2 text-sm leading-6">
              <CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
              <span>{entry}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Not provided</p>
      )}
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
        No status history is available yet.
      </p>
    );
  }

  return (
    <ol className="relative space-y-5 border-l border-primary/20 pl-6">
      {history.map((item, index) => (
        <li
          key={`${item.status}-${item.changedAt}-${index}`}
          className="relative"
        >
          <span className="absolute -left-[31px] top-0 flex size-5 items-center justify-center rounded-full border-4 border-card bg-primary shadow-sm">
            <span className="size-1.5 rounded-full bg-white" />
          </span>

          <AppointmentStatusBadge
            status={item.status}
          />

          <p className="mt-2 text-sm font-medium leading-6">
            {item.note ||
              "Appointment status updated"}
          </p>

          <p className="mt-2 text-xs leading-5 text-muted-foreground">
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

function RecordItem({
  label,
  value,
}) {
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

function AlertMessage({
  type,
  title,
  message,
}) {
  const success = type === "success";

  const Icon = success
    ? CheckCircle2
    : CircleAlert;

  return (
    <div
      className={`mt-6 flex items-start gap-3 rounded-xl border p-4 ${
        success
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "border-destructive/30 bg-destructive/10 text-destructive"
      }`}
      role={success ? "status" : "alert"}
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

function AppointmentErrorAlert({
  error,
}) {
  const messages = {
    "invalid-cancellation":
      "The cancellation reason must contain at least 5 characters.",

    "cannot-cancel":
      "A completed or already cancelled appointment cannot be cancelled.",

    "past-appointment":
      "A past appointment cannot be cancelled.",
  };

  return (
    <AlertMessage
      type="error"
      title="The action could not be completed"
      message={
        messages[error] ||
        "Appointment information check and try again."
      }
    />
  );
}

function isAppointmentInPast(
  dateValue,
  timeValue
) {
  if (!dateValue) {
    return false;
  }

  const appointmentDate =
    new Date(dateValue);

  if (
    Number.isNaN(
      appointmentDate.getTime()
    )
  ) {
    return false;
  }

  const normalizedTime =
    normalizeTime(timeValue);

  if (normalizedTime) {
    const [hours, minutes] =
      normalizedTime
        .split(":")
        .map(Number);

    appointmentDate.setHours(
      hours,
      minutes,
      0,
      0
    );
  } else {
    appointmentDate.setHours(
      23,
      59,
      59,
      999
    );
  }

  return appointmentDate < new Date();
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
            item?.symptom ||
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

function normalizeTime(value) {
  const time = String(value || "")
    .trim();

  return /^([01]\d|2[0-3]):[0-5]\d$/.test(
    time
  )
    ? time
    : "";
}

function formatTime(value) {
  const time = normalizeTime(value);

  if (!time) {
    return value || "Time unavailable";
  }

  const [hours, minutes] =
    time.split(":").map(Number);

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return new Intl.DateTimeFormat(
    "en-PK",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(date);
}

function sanitizeText(
  value,
  maximumLength
) {
  return String(value || "")
    .trim()
    .slice(0, maximumLength);
}

function getNumber(
  value,
  fallback
) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
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

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
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

  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
}
