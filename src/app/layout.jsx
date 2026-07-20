import Providers from "@/app/providers";
import { APP_NAME } from "@/lib/constants";

import "./globals.css";

export const metadata = {
  title: {
    default: `${APP_NAME} | AI Patient Intake System`,
    template: `%s | ${APP_NAME}`,
  },

  description:
    "A secure AI-assisted patient intake and clinic appointment management system.",

  applicationName: APP_NAME,

  keywords: [
    "AI patient intake",
    "clinic management",
    "doctor appointments",
    "patient symptom summary",
    "healthcare SaaS",
  ],

  authors: [
    {
      name: "MediAssist Team",
    },
  ],

  creator: "MediAssist Team",

  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),

  openGraph: {
    title: `${APP_NAME} | AI Patient Intake System`,

    description:
      "Book appointments and provide structured symptom information for doctor review.",

    type: "website",

    siteName: APP_NAME,
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers>
          <div className="flex min-h-screen flex-col">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
