"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getSession,
  signIn,
} from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  LoaderCircle,
  LogIn,
} from "lucide-react";
import { toast } from "sonner";

import { loginSchema } from "@/validations/auth.validation";
import { USER_ROLES } from "@/lib/constants";

function getDashboardPath(role) {
  if (role === USER_ROLES.ADMIN) {
    return "/admin/dashboard";
  }

  if (role === USER_ROLES.DOCTOR) {
    return "/doctor/dashboard";
  }

  return "/patient/dashboard";
}

function getSafeCallbackUrl() {
  if (typeof window === "undefined") {
    return "";
  }

  const searchParams = new URLSearchParams(
    window.location.search
  );

  const callbackUrl = searchParams.get("callbackUrl");

  /*
    Only internal relative application URLs are allowed.

    Valid:
    /patient/dashboard

    Invalid:
    https://unknown-site.com
    //unknown-site.com
  */
  if (
    callbackUrl &&
    callbackUrl.startsWith("/") &&
    !callbackUrl.startsWith("//")
  ) {
    return callbackUrl;
  }

  return "";
}

export default function LoginForm() {
  const router = useRouter();

  const [showPassword, setShowPassword] =
    useState(false);

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm({
    resolver: zodResolver(loginSchema),

    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(
      window.location.search
    );

    const registered =
      searchParams.get("registered");

    const error = searchParams.get("error");

    if (registered === "true") {
      toast.success(
        "Your account has been created. Please log in."
      );
    }

    if (error === "AccountDisabled") {
      toast.error(
        "Your account is disabled. Please contact an administrator."
      );
    }
  }, []);

  async function onSubmit(formData) {
    try {
      /*
        With `redirect: false`, Auth.js returns the result to the
        browser without redirecting automatically.

        Check the response and redirect according to the user's role.
      */
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (!result?.ok || result?.error) {
        toast.error(
          "The email address or password is incorrect."
        );

        return;
      }

      // Read the fresh session to determine the user's role.
      const session = await getSession();

      if (!session?.user) {
        toast.error(
          "The session could not be created. Please log in again."
        );

        return;
      }

      if (session.user.isActive === false) {
        toast.error(
          "Your account is disabled."
        );

        return;
      }

      const callbackUrl = getSafeCallbackUrl();

      const destination =
        callbackUrl ||
        getDashboardPath(session.user.role);

      toast.success(
        `Welcome back, ${session.user.name || "User"}!`
      );

      router.replace(destination);
      router.refresh();
    } catch (error) {
      console.error("Login request failed:", error);

      toast.error(
        "Login could not be completed. Please try again."
      );
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
      <div>
        <p className="text-sm font-semibold text-primary">
          Welcome back
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Log in to your account
        </h1>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Enter your registered email address and password.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 space-y-5"
        noValidate
      >
        <FormField
          id="email"
          label="Email address"
          error={errors.email?.message}
        >
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={getInputClasses(
              Boolean(errors.email)
            )}
            {...register("email")}
          />
        </FormField>

        <FormField
          id="password"
          label="Password"
          error={errors.password?.message}
        >
          <div className="relative">
            <input
              id="password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              autoComplete="current-password"
              placeholder="Enter your password"
              className={`${getInputClasses(
                Boolean(errors.password)
              )} pr-11`}
              {...register("password")}
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  (currentValue) => !currentValue
                )
              }
              className="focus-ring absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff
                  className="size-4"
                  aria-hidden="true"
                />
              ) : (
                <Eye
                  className="size-4"
                  aria-hidden="true"
                />
              )}
            </button>
          </div>
        </FormField>

        <div className="flex items-center justify-end">
          <Link
            href="/forgot-password"
            className="focus-ring rounded-sm text-sm font-medium text-primary hover:underline"
          >
            Forgot your password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:pointer-events-none"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />

              Logging in...
            </>
          ) : (
            <>
              <LogIn
                className="size-4"
                aria-hidden="true"
              />

              Login
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Do not have an account?{" "}
        <Link
          href="/register"
          className="focus-ring rounded-sm font-semibold text-primary hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}

function FormField({
  id,
  label,
  error,
  children,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-sm font-medium"
      >
        {label}
      </label>

      <div className="mt-2">
        {children}
      </div>

      <FieldError message={error} />
    </div>
  );
}

function FieldError({ message }) {
  if (!message) {
    return null;
  }

  return (
    <p
      className="mt-2 text-sm text-destructive"
      role="alert"
    >
      {message}
    </p>
  );
}

function getInputClasses(hasError) {
  return `focus-ring h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground ${
    hasError
      ? "border-destructive"
      : "border-input hover:border-ring/50"
  }`;
}
