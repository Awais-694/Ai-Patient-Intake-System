import {
  Globe2,
  KeyRound,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

import PageHeader from "@/components/shared/page-header";
import { APP_NAME, APP_URL } from "@/lib/constants";

export const metadata = {
  title: "Administrator Settings",
  description: "Review MediAssist administrator and application settings.",
};

export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Administration"
        title="Settings"
        description="Review the application configuration and administrator access settings."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SettingsCard
          icon={ShieldCheck}
          title="Security"
          description="Administrator access is protected by Auth.js sessions and role-based route protection."
          items={[
            ["Authentication", "Credentials and JWT sessions"],
            ["Role", "Administrator"],
            ["Route protection", "Enabled"],
          ]}
        />

        <SettingsCard
          icon={SlidersHorizontal}
          title="Application"
          description="Core application values currently used by MediAssist."
          items={[
            ["Application name", APP_NAME],
            ["Environment", process.env.NODE_ENV || "development"],
            ["Application URL", APP_URL],
          ]}
        />

        <SettingsCard
          icon={KeyRound}
          title="Integrations"
          description="Server-side integrations are configured through environment variables."
          items={[
            ["MongoDB", "Configured on the server"],
            ["Groq AI", "Configured on the server"],
            ["Credentials", "Never displayed in the browser"],
          ]}
        />

        <SettingsCard
          icon={Globe2}
          title="Language and accessibility"
          description="MediAssist uses professional English and semantic interface components throughout the administrator area."
          items={[
            ["Interface language", "English"],
            ["Screen-reader support", "Enabled through semantic labels"],
            ["Public URL", APP_URL],
          ]}
        />
      </div>
    </div>
  );
}

function SettingsCard({
  icon: Icon,
  title,
  description,
  items,
}) {
  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <dl className="mt-6 divide-y rounded-lg border">
        {items.map(([label, value]) => (
          <div
            className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
            key={label}
          >
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
