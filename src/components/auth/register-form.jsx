"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  LoaderCircle,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { registrationSchema } from "@/validations/auth.validation";
import { USER_ROLES } from "@/lib/constants";

export default function RegisterForm({ defaultRole = USER_ROLES.PATIENT }) {
  const router = useRouter();

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm({
    resolver: zodResolver(registrationSchema),

    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: defaultRole,
    },
  });

  const selectedRole = useWatch({
    control,
    name: "role",
  });

  async function onSubmit(formData) {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        const firstValidationError = result?.errors
          ? Object.values(result.errors)
              .flat()
              .find(Boolean)
          : null;

        toast.error(
          firstValidationError ||
            result?.message ||
            "The account could not be created."
        );

        return;
      }

      toast.success(
        result?.message ||
          "Your account was created successfully."
      );

      /*
        Redirect the user to the login page after registration.

        Doctors must complete their professional profile after
        logging in.
      */
      const registeredRole =
        result?.data?.user?.role || selectedRole;

      const query = new URLSearchParams({
        registered: "true",
        role: registeredRole,
      });

      router.push(`/login?${query.toString()}`);
      router.refresh();
    } catch (error) {
      console.error("Registration request failed:", error);

      toast.error(
        "Could not connect to the server. Please try again."
      );
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
      <div>
        <p className="text-sm font-semibold text-primary">
          Create an account
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Join MediAssist
        </h1>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Patients can book appointments, while doctors can complete
          a professional profile for administrator approval.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 space-y-5"
        noValidate
      >
        <fieldset disabled={isSubmitting}>
          <legend className="text-sm font-medium">
            Account type
          </legend>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <RoleOption
              title="Patient"
              description="Book and manage appointments"
              icon={UserRound}
              selected={
                selectedRole === USER_ROLES.PATIENT
              }
              onSelect={() =>
                setValue(
                  "role",
                  USER_ROLES.PATIENT,
                  {
                    shouldValidate: true,
                  }
                )
              }
            />

            <RoleOption
              title="Doctor"
              description="Manage patients and appointments"
              icon={Stethoscope}
              selected={
                selectedRole === USER_ROLES.DOCTOR
              }
              onSelect={() =>
                setValue(
                  "role",
                  USER_ROLES.DOCTOR,
                  {
                    shouldValidate: true,
                  }
                )
              }
            />
          </div>

          <input
            type="hidden"
            {...register("role")}
          />

          <FieldError message={errors.role?.message} />
        </fieldset>

        <FormField
          id="name"
          label="Full name"
          error={errors.name?.message}
        >
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder={
              selectedRole === USER_ROLES.DOCTOR
                ? "Dr Awais Khan"
                : "Ali Khan"
            }
            className={getInputClasses(
              Boolean(errors.name)
            )}
            {...register("name")}
          />
        </FormField>

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
          id="phone"
          label="Phone number"
          optional
          error={errors.phone?.message}
        >
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="03001234567"
            className={getInputClasses(
              Boolean(errors.phone)
            )}
            {...register("phone")}
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
                showPassword ? "text" : "password"
              }
              autoComplete="new-password"
              placeholder="StrongPass123"
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

        <FormField
          id="confirmPassword"
          label="Confirm password"
          error={errors.confirmPassword?.message}
        >
          <div className="relative">
            <input
              id="confirmPassword"
              type={
                showConfirmPassword
                  ? "text"
                  : "password"
              }
              autoComplete="new-password"
              placeholder="Re-enter your password"
              className={`${getInputClasses(
                Boolean(errors.confirmPassword)
              )} pr-11`}
              {...register("confirmPassword")}
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword(
                  (currentValue) => !currentValue
                )
              }
              className="focus-ring absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label={
                showConfirmPassword
                  ? "Hide confirmation password"
                  : "Show confirmation password"
              }
            >
              {showConfirmPassword ? (
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

        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="text-xs leading-5 text-muted-foreground">
            Password must contain at least 8 characters, one
            uppercase letter, one lowercase letter, and one number.
          </p>
        </div>

        {selectedRole === USER_ROLES.DOCTOR && (
          <div className="rounded-lg border border-warning/40 bg-warning/10 p-4">
            <p className="text-sm font-medium">
              Doctor account information
            </p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Specialization, qualification, license number, clinic
              address, and availability are required. An administrator
              must approve the account before appointment requests can
              be received.
            </p>
          </div>
        )}

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
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="focus-ring rounded-sm font-semibold text-primary hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}

function RoleOption({
  title,
  description,
  icon: Icon,
  selected,
  onSelect,
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`focus-ring flex items-start gap-3 rounded-lg border p-4 text-left transition ${
        selected
          ? "border-primary bg-primary/5"
          : "bg-background hover:bg-muted"
      }`}
      aria-pressed={selected}
    >
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
          selected
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        <Icon
          className="size-5"
          aria-hidden="true"
        />
      </span>

      <span>
        <span className="block text-sm font-semibold">
          {title}
        </span>

        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}

function FormField({
  id,
  label,
  optional = false,
  error,
  children,
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor={id}
          className="text-sm font-medium"
        >
          {label}
        </label>

        {optional && (
          <span className="text-xs text-muted-foreground">
            Optional
          </span>
        )}
      </div>

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
