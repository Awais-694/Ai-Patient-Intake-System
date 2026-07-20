import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Activity, ArrowLeft, BrainCircuit, Building2, CalendarCheck2, CalendarX, CircleHelp, Clock3, FileText, ShieldAlert, Stethoscope, UserRound } from "lucide-react";

import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { USER_ROLES } from "@/lib/constants";
import Appointment from "@/models/Appointment";
import PatientProfile from "@/models/PatientProfile";
import AIAnalysis from "@/models/AIAnalysis";

export const metadata = { title: "Appointment Details" };
export const dynamic = "force-dynamic";

export default async function DoctorAppointmentDetailsPage({ params, searchParams }) {
  const session = await auth();
  if (!session?.user || session.user.role !== USER_ROLES.DOCTOR) redirect("/unauthorized");

  const { appointmentId } = await params;
  const query = await searchParams;
  await connectDB();

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    doctorId: session.user.id,
  }).populate({ path: "patientId", select: "name email phone" }).lean().catch(() => null);

  if (!appointment) notFound();

  const [profile, aiAnalysis] = await Promise.all([
    PatientProfile.findOne({ userId: appointment.patientId?._id }).lean(),
    AIAnalysis.findOne({ appointmentId: appointment._id }).sort({ createdAt: -1 }).lean(),
  ]);
  const time = appointment.appointmentTime || appointment.startTime || appointment.time || appointment.timeSlot || "Time unavailable";

  return (
    <div className="dashboard-container">
      <header className="border-b pb-6">
        <Link href="/doctor/appointments" className="focus-ring inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to appointments
        </Link>
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Appointment Details</p>
            <h1 className="mt-2 text-3xl font-bold">{appointment.patientId?.name || "Patient"}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Review the appointment request and the patient&apos;s submitted health information.</p>
          </div>
          <StatusBadge status={appointment.status} />
        </div>
      </header>

      {query?.updated === "confirmed" && <Alert text="The appointment has been confirmed." />}
      {query?.updated === "cancelled" && <Alert text="The appointment request has been declined." />}

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <Summary icon={CalendarCheck2} label="Appointment date" value={formatDate(appointment.appointmentDate)} />
        <Summary icon={Clock3} label="Appointment time" value={formatTime(time)} />
        <Summary icon={FileText} label="Consultation type" value={readable(appointment.consultationType || "in_person")} />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <ClinicalIntakeCard>
            {aiAnalysis?.status === "completed" ? (
              <div className="space-y-6">
                {aiAnalysis.requiresUrgentReview && (
                  <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                      <ShieldAlert className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">Urgent clinical review recommended</p>
                      <p className="mt-1 text-sm leading-6 text-destructive/90">
                        Assess the patient promptly and apply independent clinical judgment.
                      </p>
                    </div>
                  </div>
                )}

                <section className="rounded-xl border bg-background p-5">
                  <div className="flex items-center gap-2 text-primary">
                    <BrainCircuit className="size-4" aria-hidden="true" />
                    <h3 className="text-sm font-semibold">Clinical summary</h3>
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-foreground/90">
                    {aiAnalysis.summary || "No clinical summary was generated."}
                  </p>
                </section>

                <div className="grid gap-4 md:grid-cols-2">
                  <ClinicalDetail
                    icon={Activity}
                    title="Reported symptoms"
                    values={aiAnalysis.reportedSymptoms}
                    fallback="No symptoms identified"
                  />
                  <ClinicalDetail
                    icon={CircleHelp}
                    title="Information to clarify"
                    values={aiAnalysis.missingInformation}
                    fallback="No missing information identified"
                  />
                  <ClinicalDetail
                    icon={ShieldAlert}
                    title="Clinical red flags"
                    values={aiAnalysis.redFlagsDetected}
                    fallback="No red flags detected"
                    tone="danger"
                  />
                  <ClinicalDetail
                    icon={Building2}
                    title="Suggested department"
                    values={[aiAnalysis.suggestedDepartment || "Not specified"]}
                    fallback="Not specified"
                    tone="primary"
                  />
                </div>

                <div className="flex items-start gap-2 rounded-lg border bg-muted/30 px-4 py-3 text-xs leading-5 text-muted-foreground">
                  <Stethoscope className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <p>{aiAnalysis.disclaimer || "This AI-generated intake supports clinical review and is not a diagnosis or prescription."}</p>
                </div>
              </div>
            ) : aiAnalysis?.status === "failed" ? (
              <p className="text-sm leading-6 text-amber-700">AI analysis was unavailable. Review the original patient intake and medical profile below.</p>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">No AI analysis is available for this legacy appointment.</p>
            )}
          </ClinicalIntakeCard>

          <Card title="Patient Intake" description="Symptoms and consultation details submitted with this request.">
            <Details items={[
              ["Reason for appointment", appointment.reason || "Not provided"],
              ["Symptoms", list(appointment.symptoms, "No symptoms provided")],
              ["Symptom duration", appointment.symptomDuration || "Not provided"],
              ["Severity", readable(appointment.severity || "Not provided")],
              ["Preferred language", appointment.preferredLanguage || "Not provided"],
              ["Additional notes", appointment.patientNotes || "No additional notes provided"],
            ]} />
          </Card>

          <Card title="Patient Health Profile" description="Medical information saved in the patient&apos;s profile.">
            <Details items={[
              ["Date of birth", formatDate(profile?.dateOfBirth)],
              ["Gender", readable(profile?.gender || "Not provided")],
              ["Blood group", profile?.bloodGroup || "Not provided"],
              ["Known allergies", list(profile?.allergies, "No allergies recorded")],
              ["Current medications", list(profile?.currentMedications, "No current medications recorded")],
              ["Chronic conditions", list(profile?.chronicConditions, "No chronic conditions recorded")],
              ["Previous surgeries", list(profile?.previousSurgeries, "No previous surgeries recorded")],
              ["Family medical history", list(profile?.familyMedicalHistory, "No family medical history recorded")],
            ]} />
          </Card>
        </div>

        <aside className="space-y-6">
          <Card title="Patient Contact" description="Contact information for this patient.">
            <Details items={[
              ["Name", appointment.patientId?.name || "Not provided"],
              ["Email", appointment.patientId?.email || "Not provided"],
              ["Phone", appointment.patientId?.phone || "Not provided"],
            ]} />
          </Card>

          {appointment.status === "pending" && (
            <Card title="Respond to Request" description="Confirm or decline this appointment request.">
              <div className="grid gap-3">
                <form action={updateAppointmentStatus}>
                  <input type="hidden" name="appointmentId" value={appointmentId} />
                  <input type="hidden" name="status" value="confirmed" />
                  <button className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-primary-foreground">
                    <CalendarCheck2 className="size-4" /> Confirm Appointment
                  </button>
                </form>
                <form action={updateAppointmentStatus}>
                  <input type="hidden" name="appointmentId" value={appointmentId} />
                  <input type="hidden" name="status" value="cancelled" />
                  <button className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-destructive/40 font-semibold text-destructive">
                    <CalendarX className="size-4" /> Decline Request
                  </button>
                </form>
              </div>
            </Card>
          )}

          {appointment.status === "confirmed" && (
            <Card title="Complete Consultation" description="Record the clinical outcome after consulting the patient.">
              <form action={completeConsultation} className="space-y-4">
                <input type="hidden" name="appointmentId" value={appointmentId} />
                <OutcomeField name="diagnosis" label="Diagnosis" placeholder="Enter each diagnosis on a separate line" required />
                <OutcomeField name="prescription" label="Prescription" placeholder="Enter each medicine or instruction on a separate line" required />
                <OutcomeField name="doctorNotes" label="Consultation notes" placeholder="Add relevant clinical notes" />
                <OutcomeField name="followUpInstructions" label="Follow-up instructions" placeholder="Example: Follow up in two weeks" />
                <button className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-primary-foreground">
                  <CalendarCheck2 className="size-4" /> Complete Consultation
                </button>
              </form>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

async function updateAppointmentStatus(formData) {
  "use server";
  const session = await auth();
  if (!session?.user || session.user.role !== USER_ROLES.DOCTOR) redirect("/unauthorized");
  const appointmentId = String(formData.get("appointmentId") || "");
  const status = String(formData.get("status") || "");
  if (!["confirmed", "cancelled"].includes(status)) redirect(`/doctor/appointments/${appointmentId}?error=invalid-status`);

  await connectDB();
  const appointment = await Appointment.findOne({ _id: appointmentId, doctorId: session.user.id, status: "pending" });
  if (!appointment) redirect(`/doctor/appointments/${appointmentId}?error=not-pending`);

  await Appointment.updateOne(
    { _id: appointment._id },
    {
      $set: {
        status,
        ...(status === "cancelled"
          ? { cancellationReason: "Declined by doctor.", cancelledBy: session.user.id, cancelledAt: new Date() }
          : { cancellationReason: "", cancelledBy: null, cancelledAt: null }),
      },
      $push: {
        statusHistory: {
          status,
          note: status === "confirmed" ? "Appointment confirmed by doctor" : "Appointment declined by doctor",
          changedBy: session.user.id,
          changedAt: new Date(),
        },
      },
    }
  );

  revalidatePath("/doctor/dashboard");
  revalidatePath("/doctor/appointments");
  revalidatePath("/patient/dashboard");
  revalidatePath("/patient/appointments");
  redirect(`/doctor/appointments/${appointmentId}?updated=${status}`);
}

async function completeConsultation(formData) {
  "use server";
  const session = await auth();
  if (!session?.user || session.user.role !== USER_ROLES.DOCTOR) redirect("/unauthorized");

  const appointmentId = String(formData.get("appointmentId") || "");
  const diagnosis = parseLines(formData.get("diagnosis"));
  const prescription = parseLines(formData.get("prescription"));
  const doctorNotes = cleanText(formData.get("doctorNotes"), 3000);
  const followUpInstructions = cleanText(formData.get("followUpInstructions"), 2000);

  if (!appointmentId || diagnosis.length === 0 || prescription.length === 0) {
    redirect(`/doctor/appointments/${appointmentId}?error=clinical-outcome-required`);
  }

  await connectDB();
  const result = await Appointment.updateOne(
    { _id: appointmentId, doctorId: session.user.id, status: "confirmed" },
    {
      $set: {
        status: "completed",
        diagnosis,
        prescription,
        doctorNotes,
        followUpInstructions,
        completedAt: new Date(),
      },
      $push: {
        statusHistory: {
          status: "completed",
          note: "Consultation completed and clinical outcome recorded",
          changedBy: session.user.id,
          changedAt: new Date(),
        },
      },
    }
  );

  if (result.matchedCount === 0) redirect(`/doctor/appointments/${appointmentId}?error=not-confirmed`);
  revalidatePath("/doctor/dashboard");
  revalidatePath("/doctor/appointments");
  revalidatePath(`/doctor/appointments/${appointmentId}`);
  revalidatePath("/patient/dashboard");
  revalidatePath("/patient/appointments");
  revalidatePath(`/patient/appointments/${appointmentId}`);
  redirect(`/doctor/appointments/${appointmentId}?updated=completed`);
}

function Card({ title, description, children }) {
  return <section className="rounded-xl border bg-card p-5 shadow-sm"><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p><div className="mt-5">{children}</div></section>;
}
function ClinicalIntakeCard({ children }) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <header className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <BrainCircuit className="size-5" aria-hidden="true" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">AI-Assisted Clinical Intake</h2>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                Clinical decision support
              </span>
            </div>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
              A structured patient intake summary generated by Groq AI for clinician review.
            </p>
          </div>
        </div>
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}
function ClinicalDetail({ icon: Icon, title, values, fallback, tone = "default" }) {
  const entries = Array.isArray(values) ? values.filter(Boolean) : values ? [values] : [];
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
function Details({ items }) { return <dl className="grid gap-5 sm:grid-cols-2">{items.map(([label, value]) => <div key={label}><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-line text-sm font-medium">{value}</dd></div>)}</dl>; }
function OutcomeField({ name, label, placeholder, required = false }) { return <label className="block"><span className="text-sm font-medium">{label}{required && <span className="text-destructive"> *</span>}</span><textarea name={name} required={required} rows={3} maxLength={3000} placeholder={placeholder} className="focus-ring mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none" /></label>; }
function Summary({ icon: Icon, label, value }) { return <div className="rounded-xl border bg-card p-5 shadow-sm"><Icon className="size-5 text-primary" /><p className="mt-4 text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>; }
function StatusBadge({ status }) { return <span className="inline-flex w-fit rounded-full bg-amber-500/10 px-3 py-1.5 text-sm font-semibold capitalize text-amber-700">{status || "pending"}</span>; }
function Alert({ text }) { return <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-700">{text}</div>; }
function list(value, fallback) { return Array.isArray(value) && value.length ? value.join("\n") : String(value || fallback); }
function readable(value) { return String(value || "Not provided").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function formatDate(value) { const date = new Date(value); return value && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat("en-PK", { day: "2-digit", month: "short", year: "numeric" }).format(date) : "Not provided"; }
function formatTime(value) { const match = /^(\d{2}):(\d{2})$/.exec(String(value || "")); if (!match) return value || "Time unavailable"; const date = new Date(); date.setHours(Number(match[1]), Number(match[2]), 0, 0); return new Intl.DateTimeFormat("en-PK", { hour: "numeric", minute: "2-digit" }).format(date); }
function parseLines(value) { return String(value || "").split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean).slice(0, 50); }
function cleanText(value, maximumLength) { return String(value || "").trim().slice(0, maximumLength); }
