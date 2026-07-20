import { z } from "zod";

const appointmentStatuses = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

const consultationTypes = [
  "in_person",
  "video",
  "phone",
];

const severityLevels = [
  "mild",
  "moderate",
  "severe",
];

const timeRegex =
  /^([01]\d|2[0-3]):[0-5]\d$/;

const objectIdRegex =
  /^[a-f\d]{24}$/i;

export const createAppointmentSchema =
  z
    .object({
      doctorId: z
        .string({
          required_error:
            "Doctor selection is required.",
        })
        .trim()
        .min(
          1,
          "Please select a doctor."
        )
        .regex(
          objectIdRegex,
          "Invalid doctor ID."
        ),

      appointmentDate: z
        .string({
          required_error:
            "Appointment date is required.",
        })
        .trim()
        .min(
          1,
          "Appointment date is required."
        )
        .refine(
          (value) =>
            isValidDateValue(value),
          {
            message:
              "Please provide a valid appointment date.",
          }
        ),

      appointmentTime: z
        .string({
          required_error:
            "Appointment time is required.",
        })
        .trim()
        .regex(
          timeRegex,
          "Appointment time must use HH:MM format."
        ),

      consultationType: z.enum(
        consultationTypes,
        {
          required_error:
            "Consultation type is required.",
          invalid_type_error:
            "Invalid consultation type.",
        }
      ),

      reason: z
        .string({
          required_error:
            "Reason for appointment is required.",
        })
        .trim()
        .min(
          5,
          "Reason must contain at least 5 characters."
        )
        .max(
          500,
          "Reason cannot exceed 500 characters."
        ),

      symptoms: z
        .union([
          z.string(),
          z.array(
            z.string()
              .trim()
              .min(1)
          ),
        ])
        .optional()
        .default(""),

      symptomDuration: z
        .string()
        .trim()
        .max(
          100,
          "Symptom duration cannot exceed 100 characters."
        )
        .optional()
        .default(""),

      severity: z
        .enum(severityLevels)
        .optional()
        .default("mild"),

      preferredLanguage: z
        .string()
        .trim()
        .max(
          50,
          "Preferred language cannot exceed 50 characters."
        )
        .optional()
        .default("English"),

      patientNotes: z
        .string()
        .trim()
        .max(
          1000,
          "Additional notes cannot exceed 1000 characters."
        )
        .optional()
        .default(""),

      durationMinutes: z
        .union([
          z.number(),
          z.string(),
        ])
        .optional()
        .default(30),

      consultationFee: z
        .union([
          z.number(),
          z.string(),
        ])
        .optional()
        .default(0),
    })
    .superRefine(
      (data, context) => {
        const appointmentDateTime =
          combineDateAndTime(
            data.appointmentDate,
            data.appointmentTime
          );

        if (!appointmentDateTime) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: [
              "appointmentDate",
            ],
            message:
              "Invalid appointment date or time.",
          });

          return;
        }

        if (
          appointmentDateTime <=
          new Date()
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: [
              "appointmentDate",
            ],
            message:
              "Appointment must be scheduled for a future date and time.",
          });
        }

        const durationMinutes =
          normalizeNumber(
            data.durationMinutes
          );

        if (
          durationMinutes === null ||
          durationMinutes < 10 ||
          durationMinutes > 240
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: [
              "durationMinutes",
            ],
            message:
              "Appointment duration must be between 10 and 240 minutes.",
          });
        }

        const consultationFee =
          normalizeNumber(
            data.consultationFee
          );

        if (
          consultationFee === null ||
          consultationFee < 0 ||
          consultationFee > 1000000
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: [
              "consultationFee",
            ],
            message:
              "Consultation fee must be a valid non-negative amount.",
          });
        }
      }
    );

export const appointmentStatusSchema =
  z.object({
    appointmentId: z
      .string()
      .trim()
      .regex(
        objectIdRegex,
        "Invalid appointment ID."
      ),

    status: z.enum(
      appointmentStatuses,
      {
        required_error:
          "Appointment status is required.",
        invalid_type_error:
          "Invalid appointment status.",
      }
    ),

    note: z
      .string()
      .trim()
      .max(
        500,
        "Status note cannot exceed 500 characters."
      )
      .optional()
      .default(""),

    cancellationReason: z
      .string()
      .trim()
      .max(
        500,
        "Cancellation reason cannot exceed 500 characters."
      )
      .optional()
      .default(""),
  })
  .superRefine(
    (data, context) => {
      if (
        data.status ===
          "cancelled" &&
        data.cancellationReason.length <
          5
      ) {
        context.addIssue({
          code:
            z.ZodIssueCode.custom,
          path: [
            "cancellationReason",
          ],
          message:
            "Cancellation reason must contain at least 5 characters.",
        });
      }
    }
  );

export const completeAppointmentSchema =
  z.object({
    appointmentId: z
      .string()
      .trim()
      .regex(
        objectIdRegex,
        "Invalid appointment ID."
      ),

    diagnosis: z
      .string()
      .trim()
      .min(
        2,
        "Diagnosis must contain at least 2 characters."
      )
      .max(
        2000,
        "Diagnosis cannot exceed 2000 characters."
      ),

    prescription: z
      .union([
        z.string(),
        z.array(
          z.object({
            name: z
              .string()
              .trim()
              .min(
                1,
                "Medicine name is required."
              ),

            dosage: z
              .string()
              .trim()
              .optional()
              .default(""),

            frequency: z
              .string()
              .trim()
              .optional()
              .default(""),

            duration: z
              .string()
              .trim()
              .optional()
              .default(""),

            instructions: z
              .string()
              .trim()
              .optional()
              .default(""),
          })
        ),
      ])
      .optional()
      .default(""),

    followUpInstructions: z
      .string()
      .trim()
      .max(
        2000,
        "Follow-up instructions cannot exceed 2000 characters."
      )
      .optional()
      .default(""),

    doctorNotes: z
      .string()
      .trim()
      .max(
        3000,
        "Doctor notes cannot exceed 3000 characters."
      )
      .optional()
      .default(""),
  });

export const cancelAppointmentSchema =
  z.object({
    appointmentId: z
      .string()
      .trim()
      .regex(
        objectIdRegex,
        "Invalid appointment ID."
      ),

    cancellationReason: z
      .string({
        required_error:
          "Cancellation reason is required.",
      })
      .trim()
      .min(
        5,
        "Cancellation reason must contain at least 5 characters."
      )
      .max(
        500,
        "Cancellation reason cannot exceed 500 characters."
      ),
  });

export const appointmentFilterSchema =
  z.object({
    status: z
      .union([
        z.enum(
          appointmentStatuses
        ),
        z.literal("all"),
      ])
      .optional()
      .default("all"),

    consultationType: z
      .union([
        z.enum(
          consultationTypes
        ),
        z.literal("all"),
      ])
      .optional()
      .default("all"),

    search: z
      .string()
      .trim()
      .max(100)
      .optional()
      .default(""),

    dateFrom: z
      .string()
      .trim()
      .optional()
      .default(""),

    dateTo: z
      .string()
      .trim()
      .optional()
      .default(""),

    page: z
      .union([
        z.number(),
        z.string(),
      ])
      .optional()
      .default(1),

    limit: z
      .union([
        z.number(),
        z.string(),
      ])
      .optional()
      .default(10),
  });

export function normalizeAppointmentData(
  data
) {
  return {
    ...data,

    doctorId: String(
      data?.doctorId || ""
    ).trim(),

    appointmentDate:
      normalizeDateString(
        data?.appointmentDate
      ),

    appointmentTime: String(
      data?.appointmentTime || ""
    ).trim(),

    consultationType: String(
      data?.consultationType ||
        "in_person"
    )
      .trim()
      .toLowerCase(),

    reason: String(
      data?.reason || ""
    ).trim(),

    symptoms:
      normalizeSymptoms(
        data?.symptoms
      ),

    symptomDuration: String(
      data?.symptomDuration || ""
    ).trim(),

    severity: String(
      data?.severity || "mild"
    )
      .trim()
      .toLowerCase(),

    preferredLanguage: String(
      data?.preferredLanguage ||
        "English"
    ).trim(),

    patientNotes: String(
      data?.patientNotes || ""
    ).trim(),

    durationMinutes:
      normalizeNumber(
        data?.durationMinutes
      ) ?? 30,

    consultationFee:
      normalizeNumber(
        data?.consultationFee
      ) ?? 0,
  };
}

export function formatAppointmentValidationErrors(
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

export function combineDateAndTime(
  dateValue,
  timeValue
) {
  const normalizedDate =
    normalizeDateString(dateValue);

  const normalizedTime =
    String(timeValue || "").trim();

  if (
    !normalizedDate ||
    !timeRegex.test(
      normalizedTime
    )
  ) {
    return null;
  }

  const combinedDate =
    new Date(
      `${normalizedDate}T${normalizedTime}:00`
    );

  if (
    Number.isNaN(
      combinedDate.getTime()
    )
  ) {
    return null;
  }

  return combinedDate;
}

function normalizeSymptoms(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        String(item || "").trim()
      )
      .filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeDateString(value) {
  if (!value) {
    return "";
  }

  if (
    value instanceof Date &&
    !Number.isNaN(
      value.getTime()
    )
  ) {
    return value
      .toISOString()
      .slice(0, 10);
  }

  const stringValue =
    String(value).trim();

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      stringValue
    )
  ) {
    return stringValue;
  }

  const parsedDate =
    new Date(stringValue);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "";
  }

  return parsedDate
    .toISOString()
    .slice(0, 10);
}

function isValidDateValue(value) {
  const normalizedDate =
    normalizeDateString(value);

  if (!normalizedDate) {
    return false;
  }

  const parsedDate =
    new Date(
      `${normalizedDate}T00:00:00`
    );

  return !Number.isNaN(
    parsedDate.getTime()
  );
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

export {
  appointmentStatuses,
  consultationTypes,
  severityLevels,
};