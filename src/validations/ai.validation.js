import { z } from "zod";

import { APPOINTMENT_STATUS } from "@/lib/constants";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;
const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const objectIdSchema = (fieldName) =>
  z
    .string({
      required_error: `${fieldName} required is.`,
    })
    .trim()
    .regex(
      objectIdPattern,
      `${fieldName} valid MongoDB ObjectId must be.`
    );

const appointmentDateSchema = z.coerce
  .date({
    required_error: "Appointment date is required.",
    invalid_type_error: "Please enter a valid appointment date.",
  })
  .refine(
    (date) => {
      const today = new Date();

      today.setHours(0, 0, 0, 0);

      const selectedDate = new Date(date);

      selectedDate.setHours(0, 0, 0, 0);

      return selectedDate >= today;
    },
    {
      message: "Appointment past date in book cannot be.",
    }
  );

const appointmentTimeSchema = z
  .string({
    required_error: "Appointment time is required.",
  })
  .trim()
  .regex(
    timePattern,
    "Appointment time HH:mm format in must be, for example 18:20."
  );

const cancellationReasonSchema = z
  .string({
    required_error: "Cancellation reason is required.",
  })
  .trim()
  .min(
    5,
    "Cancellation reason at least 5 ceachacters of must be."
  )
  .max(
    500,
    "Cancellation reason cannot exceed 500 ceachacters."
  );

export const createAppointmentSchema = z
  .object({
    doctorId: objectIdSchema("Doctor ID"),

    appointmentDate: appointmentDateSchema,

    startTime: appointmentTimeSchema,

    endTime: appointmentTimeSchema,

    reason: z
      .string({
        required_error: "Appointment reason is required.",
      })
      .trim()
      .min(
        5,
        "Appointment reason at least 5 ceachacters of must be."
      )
      .max(
        500,
        "Appointment reason cannot exceed 500 ceachacters."
      ),
  })
  .superRefine((data, context) => {
    if (data.endTime <= data.startTime) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: "End time start time of after must be.",
      });
    }

    const now = new Date();
    const selectedDate = new Date(data.appointmentDate);

    const [startHour, startMinute] = data.startTime
      .split(":")
      .map(Number);

    selectedDate.setHours(startHour, startMinute, 0, 0);

    if (selectedDate <= now) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startTime"],
        message:
          "Appointment date and time current time of after must be.",
      });
    }
  });

export const updateAppointmentSchema = z
  .object({
    appointmentDate: appointmentDateSchema.optional(),

    startTime: appointmentTimeSchema.optional(),

    endTime: appointmentTimeSchema.optional(),

    reason: z
      .string()
      .trim()
      .min(
        5,
        "Appointment reason at least 5 ceachacters of must be."
      )
      .max(
        500,
        "Appointment reason cannot exceed 500 ceachacters."
      )
      .optional(),
  })
  .superRefine((data, context) => {
    if (
      data.startTime &&
      data.endTime &&
      data.endTime <= data.startTime
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: "End time start time of after must be.",
      });
    }
  });

export const updateAppointmentStatusSchema = z
  .object({
    status: z.enum(
      [
        APPOINTMENT_STATUS.CONFIRMED,
        APPOINTMENT_STATUS.COMPLETED,
        APPOINTMENT_STATUS.CANCELLED,
      ],
      {
        errorMap: () => ({
          message: "Invalid appointment status.",
        }),
      }
    ),

    cancellationReason: z
      .string()
      .trim()
      .max(
        500,
        "Cancellation reason cannot exceed 500 ceachacters."
      )
      .optional()
      .or(z.literal("")),

    doctorNotes: z
      .string()
      .trim()
      .max(
        3000,
        "Doctor notes cannot exceed 3000 ceachacters."
      )
      .optional()
      .or(z.literal("")),
  })
  .superRefine((data, context) => {
    if (
      data.status === APPOINTMENT_STATUS.CANCELLED &&
      !data.cancellationReason
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cancellationReason"],
        message: "Appointment cancel to of reason is required.",
      });
    }

    if (
      data.status !== APPOINTMENT_STATUS.CANCELLED &&
      data.cancellationReason
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cancellationReason"],
        message:
          "Cancellation reason only cancelled appointment for must be.",
      });
    }
  });

export const cancelAppointmentSchema = z.object({
  cancellationReason: cancellationReasonSchema,
});

export const appointmentIdParamSchema = z.object({
  appointmentId: objectIdSchema("Appointment ID"),
});

export const appointmentQuerySchema = z.object({
  status: z
    .enum(Object.values(APPOINTMENT_STATUS), {
      errorMap: () => ({
        message: "Invalid appointment status filter.",
      }),
    })
    .optional(),

  doctorId: objectIdSchema("Doctor ID").optional(),

  patientId: objectIdSchema("Patient ID").optional(),

  fromDate: z.coerce
    .date({
      invalid_type_error: "Please enter a valid starting date.",
    })
    .optional(),

  toDate: z.coerce
    .date({
      invalid_type_error: "Please enter a valid endayg date.",
    })
    .optional(),

  page: z.coerce
    .number()
    .int("Page whole number must be.")
    .min(1, "Page at least 1 must be.")
    .default(1),

  limit: z.coerce
    .number()
    .int("Limit whole number must be.")
    .min(1, "Limit at least 1 must be.")
    .max(100, "A request can return a maximum of 100 records.")
    .default(10),
}).superRefine((data, context) => {
  if (data.fromDate && data.toDate && data.toDate < data.fromDate) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["toDate"],
      message: "Endayg date starting date of after must be.",
    });
  }
});
