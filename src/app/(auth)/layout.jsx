import Link from "next/link";
import { Stethoscope } from "lucide-react";
import Image from "next/image";

import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({ children }) {
  return (
    <main className="grid min-h-screen min-w-0 lg:grid-cols-2">
      <section className="flex min-h-screen min-w-0 flex-col bg-background">
        <header className="flex h-16 items-center border-b px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="focus-ring inline-flex items-center gap-2 rounded-md"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope
                className="size-5"
                aria-hidden="true"
              />
            </span>

            <span className="text-lg font-bold tracking-tight">
              {APP_NAME}
            </span>
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>

        <footer className="border-t px-4 py-4 text-center text-xs text-muted-foreground sm:px-6">
          AI-generated summaries require doctor review and are not medical
          diagnoses.
        </footer>
      </section>

      <aside className="relative hidden min-w-0 overflow-hidden bg-gradient-to-br from-blue-950 via-primary to-blue-700 p-5 text-primary-foreground lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:gap-5 xl:p-6">
        <div
          className="absolute inset-0 opacity-20"
          aria-hidden="true"
        >
          <div className="absolute -right-24 -top-24 size-80 rounded-full border border-primary-foreground/30" />
          <div className="absolute -bottom-32 -left-24 size-96 rounded-full border border-primary-foreground/20" />
          <div className="absolute left-1/2 top-1/3 size-48 -translate-x-1/2 rounded-full bg-primary-foreground/10 blur-3xl" />
        </div>

        <figure className="relative h-56 shrink-0 overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-2xl xl:h-64">
          <Image
            src="/images/ChatGPT Image Jul 19, 2026, 10_14_19 PM.png"
            alt="Healthcare professionals reviewing patient information"
            fill
            priority
            sizes="50vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-950/45 via-transparent to-transparent" aria-hidden="true" />
          <figcaption className="absolute bottom-4 left-4 rounded-lg border border-white/20 bg-blue-950/65 px-3 py-2 text-xs font-semibold backdrop-blur">
            Secure, coordinated patient care
          </figcaption>
        </figure>

        <div className="relative shrink-0">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-foreground/75">
            Smart clinic workflow
          </p>

          <h1 className="mt-3 max-w-xl text-2xl font-bold leading-tight xl:text-3xl">
            Turn patient information into clear, structured clinical
            summaries.
          </h1>

          <p className="mt-3 max-w-lg text-sm leading-6 text-primary-foreground/80">
            MediAssist helps patients book appointments and describe their
            symptoms in everyday language. The AI creates an intake
            summary, while a doctor makes the final clinical review.
          </p>
        </div>

        <div className="relative mt-auto grid grid-cols-3 gap-2 border-t border-white/15 pt-4">
          <TrustPoint value="Secure" label="Health records" />
          <TrustPoint value="Smart" label="AI-assisted intake" />
          <TrustPoint value="Human" label="Doctor review" />
        </div>

      </aside>
    </main>
  );
}

function TrustPoint({ value, label }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/10 px-2 py-3 text-center backdrop-blur-sm">
      <p className="text-xs font-bold text-white">{value}</p>
      <p className="mt-1 text-[10px] leading-4 text-primary-foreground/70">{label}</p>
    </div>
  );
}
