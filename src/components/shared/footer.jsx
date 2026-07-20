import Link from "next/link";
import {
  HeartPulse,
  Mail,
  ShieldCheck,
  Stethoscope,
  GitBranch,
} from "lucide-react";

import { APP_NAME } from "@/lib/constants";

const footerLinks = {
  platform: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Doctors",
      href: "/doctors",
    },
    {
      label: "About",
      href: "/about",
    },
  ],

  account: [
    {
      label: "Login",
      href: "/login",
    },
    {
      label: "Register",
      href: "/register",
    },
  ],

  dashboards: [
    {
      label: "Patient Dashboard",
      href: "/patient/dashboard",
    },
    {
      label: "Doctor Dashboard",
      href: "/doctor/dashboard",
    },
  ],
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-card text-card-foreground">
      <div className="page-container py-10">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link
              href="/"
              className="focus-ring inline-flex items-center gap-2 rounded-md"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Stethoscope
                  className="size-5"
                  aria-hidden="true"
                />
              </span>

              <span className="text-lg font-bold tracking-tight">
                {APP_NAME}
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
              An AI-assisted patient intake and clinic appointment management
              platform. AI-generated summaries are intended to support doctor
              review only.
            </p>

            <div className="mt-5 flex items-center gap-3">
              <a
                href="mailto:support@example.com"
                className="focus-ring inline-flex size-10 items-center justify-center rounded-lg border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Email support"
                title="Email support"
              >
                <Mail
                  className="size-4"
                  aria-hidden="true"
                />
              </a>

              <a
                href="https://github.com/"
                target="_blank"
                rel="noreferrer"
                className="focus-ring inline-flex size-10 items-center justify-center rounded-lg border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="GitHub"
                title="GitHub"
              >
                <GitBranch
                  className="size-4"
                  aria-hidden="true"
                />
              </a>
            </div>
          </div>

          <FooterLinkGroup
            title="Platform"
            links={footerLinks.platform}
          />

          <FooterLinkGroup
            title="Account"
            links={footerLinks.account}
          />

          <FooterLinkGroup
            title="Dashboards"
            links={footerLinks.dashboards}
          />
        </div>

        <div className="mt-10 grid gap-4 border-t pt-6 sm:grid-cols-2 sm:items-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear} {APP_NAME}. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:justify-end">
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck
                className="size-4 text-success"
                aria-hidden="true"
              />
              Secure role-based access
            </span>

            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <HeartPulse
                className="size-4 text-primary"
                aria-hidden="true"
              />
              Human review required
            </span>
          </div>
        </div>

        <div className="medical-disclaimer mt-6">
          <strong>Medical disclaimer:</strong> MediAssist AI output is not a
          replacement for medical diagnosis, prescriptions, professional
          treatment, or emergency services. Final assessments and treatment
          decisions must be made by a qualified medical professional.
        </div>
      </div>
    </footer>
  );
}

function FooterLinkGroup({ title, links }) {
  return (
    <div>
      <h2 className="text-sm font-semibold">
        {title}
      </h2>

      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="focus-ring rounded-sm text-sm text-muted-foreground transition hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
