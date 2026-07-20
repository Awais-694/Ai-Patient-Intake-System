import { z } from "zod";

import { USER_ROLES } from "../lib/constants.js";

const phoneRegex =
  /^[+]?[\d\s()-]{7,20}$/;

export const loginSchema = z.object({
  email: z
    .string({
      required_error:
        "Email address is required.",
    })
    .trim()
    .toLowerCase()
    .min(
      1,
      "Email address is required."
    )
    .email(
      "Please enter a valid email address."
    )
    .max(
      120,
      "Email address cannot exceed 120 characters."
    ),

  password: z
    .string({
      required_error:
        "Password is required.",
    })
    .min(
      1,
      "Password is required."
    )
    .max(
      72,
      "Password cannot exceed 72 characters."
    ),
});

export const baseRegistrationSchema =
  z.object({
    name: z
      .string({
        required_error:
          "Full name is required.",
      })
      .trim()
      .min(
        2,
        "Name must contain at least 2 characters."
      )
      .max(
        80,
        "Name cannot exceed 80 characters."
      ),

    email: z
      .string({
        required_error:
          "Email address is required.",
      })
      .trim()
      .toLowerCase()
      .min(
        1,
        "Email address is required."
      )
      .email(
        "Please enter a valid email address."
      )
      .max(
        120,
        "Email address cannot exceed 120 characters."
      ),

    phone: z
      .string({
        required_error:
          "Phone number is required.",
      })
      .trim()
      .min(
        7,
        "Phone number must contain at least 7 characters."
      )
      .max(
        20,
        "Phone number cannot exceed 20 characters."
      )
      .regex(
        phoneRegex,
        "Please enter a valid phone number."
      ),

    password: z
      .string({
        required_error:
          "Password is required.",
      })
      .min(
        8,
        "Password must contain at least 8 characters."
      )
      .max(
        72,
        "Password cannot exceed 72 characters."
      )
      .regex(
        /[A-Z]/,
        "Password must contain at least one uppercase letter."
      )
      .regex(
        /[a-z]/,
        "Password must contain at least one lowercase letter."
      )
      .regex(
        /\d/,
        "Password must contain at least one number."
      ),

    confirmPassword: z
      .string({
        required_error:
          "Please confirm your password.",
      })
      .min(
        1,
        "Please confirm your password."
      ),

    role: z.enum(
      [
        USER_ROLES.PATIENT,
        USER_ROLES.DOCTOR,
      ],
      {
        required_error:
          "Please select an account type.",
        invalid_type_error:
          "Invalid account type.",
      }
    ),
  });

export const doctorRegistrationFieldsSchema =
  z.object({
    specialization: z
      .string()
      .trim()
      .max(
        100,
        "Specialization cannot exceed 100 characters."
      )
      .optional()
      .default(""),

    qualification: z
      .string()
      .trim()
      .max(
        150,
        "Qualification cannot exceed 150 characters."
      )
      .optional()
      .default(""),

    licenseNumber: z
      .string()
      .trim()
      .max(
        100,
        "License number cannot exceed 100 characters."
      )
      .optional()
      .default(""),

    experienceYears: z
      .union([
        z.number(),
        z.string(),
      ])
      .optional()
      .default(0),

    consultationFee: z
      .union([
        z.number(),
        z.string(),
      ])
      .optional()
      .default(0),

    clinicName: z
      .string()
      .trim()
      .max(
        150,
        "Clinic name cannot exceed 150 characters."
      )
      .optional()
      .default(""),

    clinicAddress: z
      .string()
      .trim()
      .max(
        300,
        "Clinic address cannot exceed 300 characters."
      )
      .optional()
      .default(""),

    city: z
      .string()
      .trim()
      .max(
        100,
        "City cannot exceed 100 characters."
      )
      .optional()
      .default(""),
  });

export const registrationSchema =
  baseRegistrationSchema
    .merge(
      doctorRegistrationFieldsSchema
    )
    .superRefine(
      (data, context) => {
        if (
          data.password !==
          data.confirmPassword
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,

            path: [
              "confirmPassword",
            ],

            message:
              "Passwords do not match.",
          });
        }

        // Doctor professional details are collected after the account
        // is created through the protected doctor profile workflow.
      }
    );

export const patientRegistrationSchema =
  baseRegistrationSchema
    .omit({
      role: true,
    })
    .extend({
      role: z.literal(
        USER_ROLES.PATIENT
      ),
    })
    .superRefine(
      (data, context) => {
        if (
          data.password !==
          data.confirmPassword
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,

            path: [
              "confirmPassword",
            ],

            message:
              "Passwords do not match.",
          });
        }
      }
    );

export const doctorRegistrationSchema =
  baseRegistrationSchema
    .merge(
      doctorRegistrationFieldsSchema
    )
    .extend({
      role: z.literal(
        USER_ROLES.DOCTOR
      ),
    })
    .superRefine(
      (data, context) => {
        if (
          data.password !==
          data.confirmPassword
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,

            path: [
              "confirmPassword",
            ],

            message:
              "Passwords do not match.",
          });
        }

        validateDoctorRequiredField({
          context,
          field: "specialization",
          value:
            data.specialization,
          message:
            "Specialization is required.",
        });

        validateDoctorRequiredField({
          context,
          field: "qualification",
          value:
            data.qualification,
          message:
            "Qualification is required.",
        });

        validateDoctorRequiredField({
          context,
          field: "licenseNumber",
          value:
            data.licenseNumber,
          message:
            "Medical license number is required.",
        });
      }
    );

export const forgotPasswordSchema =
  z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email(
        "Please enter a valid email address."
      )
      .max(
        120,
        "Email address cannot exceed 120 characters."
      ),
  });

export const resetPasswordSchema =
  z
    .object({
      password: z
        .string()
        .min(
          8,
          "Password must contain at least 8 characters."
        )
        .max(
          72,
          "Password cannot exceed 72 characters."
        )
        .regex(
          /[A-Z]/,
          "Password must contain at least one uppercase letter."
        )
        .regex(
          /[a-z]/,
          "Password must contain at least one lowercase letter."
        )
        .regex(
          /\d/,
          "Password must contain at least one number."
        ),

      confirmPassword: z
        .string()
        .min(
          1,
          "Please confirm your password."
        ),
    })
    .refine(
      (data) =>
        data.password ===
        data.confirmPassword,
      {
        path: [
          "confirmPassword",
        ],
        message:
          "Passwords do not match.",
      }
    );

export function formatZodErrors(
  error
) {
  if (!error) {
    return {};
  }

  const fieldErrors =
    error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(
      fieldErrors
    ).map(
      ([field, messages]) => [
        field,
        messages?.[0] ||
          "Invalid field value.",
      ]
    )
  );
}

export function normalizeRegistrationData(
  data
) {
  return {
    ...data,

    name: String(
      data?.name || ""
    ).trim(),

    email: String(
      data?.email || ""
    )
      .trim()
      .toLowerCase(),

    phone: String(
      data?.phone || ""
    ).trim(),

    specialization: String(
      data?.specialization || ""
    ).trim(),

    qualification: String(
      data?.qualification || ""
    ).trim(),

    licenseNumber: String(
      data?.licenseNumber || ""
    ).trim(),

    clinicName: String(
      data?.clinicName || ""
    ).trim(),

    clinicAddress: String(
      data?.clinicAddress || ""
    ).trim(),

    city: String(
      data?.city || ""
    ).trim(),

    experienceYears:
      normalizeNumber(
        data?.experienceYears
      ) ?? 0,

    consultationFee:
      normalizeNumber(
        data?.consultationFee
      ) ?? 0,
  };
}

function validateDoctorRequiredField({
  context,
  field,
  value,
  message,
}) {
  if (!String(value || "").trim()) {
    context.addIssue({
      code:
        z.ZodIssueCode.custom,
      path: [field],
      message,
    });
  }
}

function normalizeNumber(value) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return 0;
  }

  const numberValue =
    Number(value);

  return Number.isFinite(
    numberValue
  )
    ? numberValue
    : null;
}
