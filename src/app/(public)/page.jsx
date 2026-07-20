import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  CalendarCheck2,
  CheckCircle2,
  FileHeart,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { auth } from "@/lib/auth";
import HomeMotion from "@/components/public/home-motion";

const images = {
  hero: "/images/ChatGPT Image Jul 19, 2026, 10_33_02 PM (1).png",
  doctor: "/images/ChatGPT Image Jul 19, 2026, 10_33_02 PM (2).png",
  patient: "/images/ChatGPT Image Jul 19, 2026, 10_33_04 PM (3).png",
};

export default async function HomePage() {
  const session = await auth();

  return (
    <>
      <HomeMotion />
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/10 via-background to-blue-50/60 dark:to-background">
        <div className="page-container grid min-h-[620px] items-center gap-12 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
          <div className="scroll-reveal relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <BrainCircuit className="size-4" aria-hidden="true" />
              AI-assisted patient intake
            </span>

            <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl xl:text-6xl">
              Better information before every appointment.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
              Describe your symptoms in everyday language, find the right doctor,
              and share a structured clinical intake summary before your visit.
            </p>

            {!session?.user && (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  Get Started <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            )}

            <div className="mt-8 grid max-w-xl gap-3 text-sm sm:grid-cols-3">
              {["Secure health records", "Approved doctors", "Human clinical review"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="scroll-reveal scroll-reveal-delay-1 relative">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-primary/10 blur-3xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[2rem] border bg-card p-2 shadow-2xl">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.55rem]">
                <Image src={images.hero} alt="A doctor examining a patient in a modern clinic" fill priority sizes="(min-width: 1024px) 52vw, 100vw" className="object-cover" />
                <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/30 bg-slate-950/70 p-4 text-white shadow-lg backdrop-blur-md sm:inset-x-auto sm:left-5 sm:max-w-xs">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">Connected care</p>
                  <p className="mt-1 text-sm leading-6">Your doctor receives clear information before the consultation begins.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-container scroll-reveal-section py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">How MediAssist helps</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">A simpler path from symptoms to care</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">Designed for patients, doctors, and administrators to coordinate appointments and clinical information securely.</p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Feature icon={FileHeart} number="01" title="Share symptoms" text="Enter symptoms in English or Roman Urdu using your own words." />
          <Feature icon={BrainCircuit} number="02" title="AI organizes intake" text="Groq AI converts the information into a structured summary for review." />
          <Feature icon={Stethoscope} number="03" title="Find the right doctor" text="View approved specialists, availability, fees, and AI recommendations." />
          <Feature icon={CalendarCheck2} number="04" title="Complete care" text="Track confirmation, consultation outcomes, diagnosis, and prescriptions." />
        </div>
      </section>

      <section className="scroll-reveal-section border-y bg-muted/25 py-20">
        <div className="page-container space-y-20">
          <Story image={images.doctor} imageAlt="A doctor checking a patient's blood pressure" eyebrow="For patients" title="Arrive prepared for your consultation" text="Maintain your medical profile, book available time slots, and give your doctor the health context needed for a focused consultation." points={["Approved doctor profiles", "Real-time appointment workflow", "Clinical outcomes in one place"]} href="/register" linkLabel="Create Patient Account" showAction={!session?.user} />

          <Story image={images.patient} imageAlt="A doctor examining a patient's throat" eyebrow="For doctors" title="Review structured information before the visit" text="See the original patient intake alongside an AI-assisted clinical summary, then record the final diagnosis, prescription, and follow-up plan." points={["Structured clinical intake", "Human review remains essential", "Secure patient appointment history"]} href="/register?role=doctor" linkLabel="Join as a Doctor" showAction={!session?.user} reverse />
        </div>
      </section>

      <section className="page-container scroll-reveal-section py-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-12 text-primary-foreground shadow-xl sm:px-10 lg:px-14">
          <div className="absolute -right-20 -top-28 size-72 rounded-full border border-white/15" aria-hidden="true" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">Start today</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight">Make every appointment more informed.</h2>
              <p className="mt-3 max-w-2xl leading-7 text-primary-foreground/80">Create your secure account and connect with approved healthcare professionals.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="focus-ring inline-flex h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-primary transition hover:bg-white/90">Create Account</Link>
              <Link href="/login" className="focus-ring inline-flex h-12 items-center justify-center rounded-xl border border-white/30 px-6 text-sm font-semibold transition hover:bg-white/10">Sign In</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Feature({ icon: Icon, number, title, text }) {
  return (
    <article className="scroll-reveal rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" aria-hidden="true" /></span>
        <span className="text-xs font-bold tracking-wider text-muted-foreground">{number}</span>
      </div>
      <h3 className="mt-5 font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </article>
  );
}

function Story({ image, imageAlt, eyebrow, title, text, points, href, linkLabel, showAction = true, reverse = false }) {
  return (
    <article className="scroll-reveal grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className={reverse ? "lg:order-2" : ""}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border bg-card shadow-xl">
          <Image src={image} alt={imageAlt} fill sizes="(min-width: 1024px) 48vw, 100vw" className="object-cover image-reveal transition duration-700 hover:scale-[1.02]" />
        </div>
      </div>
      <div className={reverse ? "lg:order-1" : ""}>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{title}</h2>
        <p className="mt-5 text-base leading-8 text-muted-foreground">{text}</p>
        <ul className="mt-6 space-y-3">
          {points.map((point) => <li key={point} className="flex items-center gap-3 text-sm font-medium"><ShieldCheck className="size-5 shrink-0 text-emerald-600" aria-hidden="true" />{point}</li>)}
        </ul>
        {showAction && (
          <Link href={href} className="focus-ring mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">{linkLabel}<ArrowRight className="size-4" aria-hidden="true" /></Link>
        )}
      </div>
    </article>
  );
}
