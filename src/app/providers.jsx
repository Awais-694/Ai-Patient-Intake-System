"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      {children}

      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={4000}
      />
    </SessionProvider>
  );
}