import { z } from "zod";

import {
  GENDER_OPTIONS,
  MAXIMUM_PATIENT_AGE,
  MINIMUM_PATIENT_AGE,
} from "@/lib/constants";

const bloodGroups = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "unknown",
];

const optionalShortText = (fieldName, maximumLength) =>
  z
    .string()
    .trim()
    .max(
      maximumLength,
      `${fieldName} ${maximumLength} ceachacters.`
    )
    .optional()
    .or(z.literal(""));

const stringArraySchema = z
  .array(
    z
      .string()
      .trim()
      .min(1, "Empty value allowed not is.")
      .max(100, "Each item cannot exceed 100 ceachacters.")
  )
  .default([])
  .transform((items) => {
    return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
  });

const emergencyContactSchema = z
  .object({
    name: optionalShortText("Emergency contact name", 60),

    relationship: optionalShortText("Relationship", 40),

    phone: z
      .string()
      .trim()
      .max(
        25,
        "Emergency contact phone cannot exceed 25 ceachacters."
      )
      .regex(
        /^[0-9+\-\s()]*$/,
        "Emergency phone in only valid phone ceachacters use please."
      )
      .optional()
      .or(z.literal("")),
  })
  .superRefine((data, context) => {
    const hasAnyContactValue =
      Boolean(data.name) ||
      Boolean(data.relationship) ||
      Boolean(data.phone);

    if (!hasAnyContactValue) {
      return;
    }

    if (!data.name) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["name"],
        message: "Emergency contact name is required.",
      });
    }

    if (!data.relationship) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["relationship"],
        message: "Emergency contact relationship is required.",
      });
    }

    if (!data.phone) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message: "Emergency contact phone is required.",
      });
    }
  });

const dateOfBirthSchema = z
  .union([
    z.coerce.date({
      invalid_type_error: "Please enter a valid date of birth.",
    }),
    z.null(),
    z.literal(""),
  ])
  .optional()
  .transform((value) => {
    if (value === "" || value === undefined) {
      return null;
    }

    return value;
  })
  .refine(
    (value) => {
      if (!value) {
        return true;
      }

      return value <= new Date();
    },
    {
      message: "Date of birth cannot be in the future.",
    }
  );

const ageSchema = z
  .union([
    z.coerce
      .number({
        invalid_type_error: "Age number must be.",
      })
      .int("Age whole number must be.")
      .min(
        MINIMUM_PATIENT_AGE,
        `Age at least ${MINIMUM_PATIENT_AGE} must be.`
      )
      .max(
        MAXIMUM_PATIENT_AGE,
        `Age ${MAXIMUM_PATIENT_AGE} cannot exceed.`
      ),
    z.null(),
    z.literal(""),
  ])
  .optional()
  .transform((value) => {
    if (value === "" || value === undefined) {
      return null;
    }

    return value;
  });

export const createPatientProfileSchema = z
  .object({
    dateOfBirth: dateOfBirthSchema,

    age: ageSchema,

    gender: z
      .enum(Object.values(GENDER_OPTIONS), {
        errorMap: () => ({
          message: "Please select a valid gender option.",
        }),
      })
      .default(GENDER_OPTIONS.PREFER_NOT_TO_SAY),

    bloodGroup: z
      .enum(bloodGroups, {
        errorMap: () => ({
          message: "Please select a valid blood group.",
        }),
      })
      .default("unknown"),

    address: optionalShortText("Address", 250),

    city: optionalShortText("City", 60),

    medicalConditions: stringArraySchema,

    allergies: stringArraySchema,

    currentMedications: stringArraySchema,

    emergencyContact: emergencyContactSchema.default({
      name: "",
      relationship: "",
      phone: "",
    }),
  })
  .superRefine((data, context) => {
    if (!data.dateOfBirth && !data.age) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateOfBirth"],
        message: "Date of birth or age from ek is required.",
      });
    }

    if (data.dateOfBirth && data.age) {
      const today = new Date();

      let calculatedAge =
        today.getFullYear() - data.dateOfBirth.getFullYear();

      const birthdayPassed =
        today.getMonth() > data.dateOfBirth.getMonth() ||
        (today.getMonth() === data.dateOfBirth.getMonth() &&
          today.getDate() >= data.dateOfBirth.getDate());

      if (!birthdayPassed) {
        calculatedAge -= 1;
      }

      const ageDifference = Math.abs(calculatedAge - data.age);

      if (ageDifference > 1) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["age"],
          message:
            "Age and date of birth ek doosre with match not karte.",
        });
      }
    }
  });

export const updatePatientProfileSchema =
  createPatientProfileSchema.partial();

export const updatePatientMedicalInformationSchema = z.object({
  bloodGroup: z
    .enum(bloodGroups, {
      errorMap: () => ({
        message: "Please select a valid blood group.",
      }),
    })
    .optional(),

  medicalConditions: stringArraySchema.optional(),

  allergies: stringArraySchema.optional(),

  currentMedications: stringArraySchema.optional(),
});

export const updateEmergencyContactSchema =
  emergencyContactSchema;