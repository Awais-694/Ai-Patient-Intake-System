import { z } from "zod";

import {
  DAYS_OF_WEEK,
  DOCTOR_APPROVAL_STATUS,
  SPECIALIZATIONS,
} from "@/lib/constants";

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const timeSlotSchema = z
  .object({
    startTime: z
      .string({
        required_error: "Start time is required.",
      })
      .trim()
      .regex(
        timePattern,
        "Start time HH:mm format in must be, for example 09:00."
      ),

    endTime: z
      .string({
        required_error: "End time is required.",
      })
      .trim()
      .regex(
        timePattern,
        "End time HH:mm format in must be, for example 17:00."
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
  });

const availabilitySchema = z
  .object({
    day: z.enum(DAYS_OF_WEEK, {
      errorMap: () => ({
        message: "Invalid availability day.",
      }),
    }),

    isAvailable: z.boolean().default(true),

    slots: z.array(timeSlotSchema).default([]),
  })
  .superRefine((data, context) => {
    if (data.isAvailable && data.slots.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slots"],
        message:
          "Available day for at least ek time slot is required.",
      });
    }

    const sortedSlots = [...data.slots].sort((firstSlot, secondSlot) =>
      firstSlot.startTime.localeCompare(secondSlot.startTime)
    );

    for (let index = 1; index < sortedSlots.length; index += 1) {
      const previousSlot = sortedSlots[index - 1];
      const currentSlot = sortedSlots[index];

      if (currentSlot.startTime < previousSlot.endTime) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["slots", index],
          message: "Doctor of time slots must not overlap.",
        });
      }
    }
  });

const specializationSchema = z.enum(SPECIALIZATIONS, {
  errorMap: () => ({
    message: "Please select a valid specialization.",
  }),
});

const qualificationSchema = z
  .string({
    required_error: "Qualification is required.",
  })
  .trim()
  .min(2, "Qualification at least 2 ceachacters of must be.")
  .max(150, "Qualification cannot exceed 150 ceachacters.");

const licenseNumberSchema = z
  .string({
    required_error: "Medical license number is required.",
  })
  .trim()
  .min(3, "License number at least 3 ceachacters of must be.")
  .max(50, "License number cannot exceed 50 ceachacters.")
  .transform((value) => value.toUpperCase());

const clinicAddressSchema = z
  .string({
    required_error: "Clinic address is required.",
  })
  .trim()
  .min(5, "Clinic address at least 5 ceachacters of must be.")
  .max(250, "Clinic address cannot exceed 250 ceachacters.");

const citySchema = z
  .string({
    required_error: "City is required.",
  })
  .trim()
  .min(2, "City at least 2 ceachacters of must be.")
  .max(60, "City cannot exceed 60 ceachacters.");

export const createDoctorProfileSchema = z.object({
  specialization: specializationSchema,

  qualification: qualificationSchema,

  licenseNumber: licenseNumberSchema,

  experienceYears: z.coerce
    .number({
      required_error: "Experience years are required.",
      invalid_type_error: "Experience years must be a number.",
    })
    .int("Experience years whole must be a number.")
    .min(0, "Experience years cannot be negative.")
    .max(70, "Experience years 70 cannot exceed."),

  consultationFee: z.coerce
    .number({
      required_error: "Consultation fee is required.",
      invalid_type_error: "Consultation fee number must be.",
    })
    .min(0, "Consultation fee cannot be negative.")
    .max(1000000, "Consultation fee must be within the valid range."),

  clinicName: z
    .string()
    .trim()
    .max(100, "Clinic name cannot exceed 100 ceachacters.")
    .optional()
    .or(z.literal("")),

  clinicAddress: clinicAddressSchema,

  city: citySchema,

  biography: z
    .string()
    .trim()
    .max(1000, "Biography cannot exceed 1000 ceachacters.")
    .optional()
    .or(z.literal("")),

  availability: z.array(availabilitySchema).default([]),

  appointmentDuration: z.coerce
    .number({
      invalid_type_error: "Appointment duration number must be.",
    })
    .int("Appointment duration whole number must be.")
    .min(10, "Appointment duration at least 10 minutes must be.")
    .max(120, "Appointment duration cannot exceed 120 minutes.")
    .default(20),
});

export const updateDoctorProfileSchema =
  createDoctorProfileSchema.partial();

export const updateDoctorApprovalSchema = z
  .object({
    approvalStatus: z.enum(
      [
        DOCTOR_APPROVAL_STATUS.APPROVED,
        DOCTOR_APPROVAL_STATUS.REJECTED,
      ],
      {
        errorMap: () => ({
          message:
            "Approval status approved or rejected must be.",
        }),
      }
    ),

    rejectionReason: z
      .string()
      .trim()
      .max(
        500,
        "Rejection reason cannot exceed 500 ceachacters."
      )
      .optional()
      .or(z.literal("")),
  })
  .superRefine((data, context) => {
    if (
      data.approvalStatus === DOCTOR_APPROVAL_STATUS.REJECTED &&
      !data.rejectionReason
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rejectionReason"],
        message: "Doctor reject to of reason is required.",
      });
    }

    if (
      data.approvalStatus === DOCTOR_APPROVAL_STATUS.APPROVED &&
      data.rejectionReason
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rejectionReason"],
        message:
          "Approved doctor with rejection reason not must be.",
      });
    }
  });

export const updateDoctorAvailabilitySchema = z.object({
  availability: z
    .array(availabilitySchema)
    .min(1, "At least ek availability day is required."),

  appointmentDuration: z.coerce
    .number({
      required_error: "Appointment duration is required.",
      invalid_type_error: "Appointment duration number must be.",
    })
    .int("Appointment duration whole number must be.")
    .min(10, "Appointment duration at least 10 minutes must be.")
    .max(120, "Appointment duration cannot exceed 120 minutes."),
});

export const doctorAppointmentSettingsSchema = z.object({
  consultationFee: z.coerce
    .number({
      required_error: "Consultation fee is required.",
      invalid_type_error: "Consultation fee number must be.",
    })
    .min(0, "Consultation fee cannot be negative.")
    .max(1000000, "Consultation fee must be within the valid range."),

  isAcceptingAppointments: z.boolean({
    required_error: "Appointment availability status is required.",
  }),
});