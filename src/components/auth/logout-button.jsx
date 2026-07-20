// TODO: Implement this file.
"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LoaderCircle, LogOut } from "lucide-react";
import { toast } from "sonner";

export default function LogoutButton({
  callbackUrl = "/",
  label = "Logout",
  showIcon = true,
  variant = "default",
  className = "",
}) {
  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  async function handleLogout() {
    try {
      setIsLoggingOut(true);

      await signOut({
        callbackUrl,
      });
    } catch (error) {
      console.error("Logout failed:", error);

      toast.error(
        "Logout could not be completed. Please try again."
      );

      setIsLoggingOut(false);
    }
  }

  const buttonClasses = getButtonClasses(variant);

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`${buttonClasses} ${className}`}
    >
      {isLoggingOut ? (
        <>
          <LoaderCircle
            className="size-4 animate-spin"
            aria-hidden="true"
          />

          Logging out...
        </>
      ) : (
        <>
          {showIcon && (
            <LogOut
              className="size-4"
              aria-hidden="true"
            />
          )}

          {label}
        </>
      )}
    </button>
  );
}

function getButtonClasses(variant) {
  const baseClasses =
    "focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-60";

  const variants = {
    default:
      "border bg-background hover:bg-muted",

    destructive:
      "border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10",

    ghost:
      "text-muted-foreground hover:bg-muted hover:text-foreground",

    primary:
      "bg-primary text-primary-foreground hover:opacity-90",
  };

  return `${baseClasses} ${
    variants[variant] || variants.default
  }`;
}
