import mongoose from "mongoose";

import { APPOINTMENT_STATUS } from "@/lib/constants";

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: Object.values(APPOINTMENT_STATUS),
      required: true,
    },
    note: { type: String, trim: true, default: "" },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Patient ID is required."],
      index: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Doctor ID is required."],
      index: true,
    },

    appointmentDate: {
      type: Date,
      required: [true, "Appointment date is required."],
      index: true,
    },

    startTime: {
      type: String,
      required: [true, "Appointment start time is required."],
      trim: true,
    },

    endTime: {
      type: String,
      required: [true, "Appointment end time is required."],
      trim: true,
    },

    appointmentTime: {
      type: String,
      required: [true, "Appointment time is required."],
      trim: true,
    },

    consultationType: { type: String, trim: true, default: "in_person" },
    severity: { type: String, trim: true, default: "mild" },
    symptoms: { type: [String], default: [] },
    symptomDuration: { type: String, trim: true, default: "" },
    preferredLanguage: { type: String, trim: true, default: "" },
    patientNotes: { type: String, trim: true, maxlength: 1500, default: "" },
    diagnosis: { type: [String], default: [] },
    prescription: { type: [String], default: [] },
    followUpInstructions: { type: String, trim: true, maxlength: 2000, default: "" },
    durationMinutes: { type: Number, min: 10, max: 120, default: 30 },
    clinicName: { type: String, trim: true, default: "" },
    doctorSpecialization: { type: String, trim: true, default: "" },
    referenceNumber: { type: String, trim: true, index: true, default: "" },
    statusHistory: { type: [statusHistorySchema], default: [] },

    reason: {
      type: String,
      required: [true, "Appointment reason is required."],
      trim: true,
      minlength: [
        5,
        "Appointment reason must contain at least 5 characters.",
      ],
      maxlength: [
        500,
        "Appointment reason cannot exceed 500 characters.",
      ],
    },

    status: {
      type: String,
      enum: {
        values: Object.values(APPOINTMENT_STATUS),
        message: "Invalid appointment status.",
      },
      default: APPOINTMENT_STATUS.PENDING,
      required: true,
      index: true,
    },

    consultationFee: {
      type: Number,
      min: [0, "Consultation fee cannot be negative."],
      default: 0,
    },

    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [
        500,
        "Cancellation reason cannot exceed 500 characters.",
      ],
      default: "",
    },

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    doctorNotes: {
      type: String,
      trim: true,
      maxlength: [
        3000,
        "Doctor notes cannot exceed 3,000 characters.",
      ],
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/*
  Prevent a doctor from having multiple appointments with the same
  date and start time.
  duplicate appointment to rokne for compound index.
*/
appointmentSchema.index(
  {
    doctorId: 1,
    appointmentDate: 1,
    startTime: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: {
        $in: [
          APPOINTMENT_STATUS.PENDING,
          APPOINTMENT_STATUS.CONFIRMED,
        ],
      },
    },
  }
);

/*
  Patient of appointments jaldi fetch to for.
*/
appointmentSchema.index({
  patientId: 1,
  appointmentDate: -1,
});

// Optimize doctor appointment queries by status and date.
appointmentSchema.index({
  doctorId: 1,
  status: 1,
  appointmentDate: 1,
});

/*
  Patient and doctor same user must not be.
*/
appointmentSchema.pre("validate", function validateParticipants() {
  if (
    this.patientId &&
    this.doctorId &&
    this.patientId.toString() === this.doctorId.toString()
  ) {
    this.invalidate(
      "doctorId",
      "Patient and doctor same user cannot be."
    );
  }
});

/*
  Cancelled appointment with cancellation fields
  automatically maintain perform.
*/
appointmentSchema.pre("save", function manageStatusDates() {
  if (!this.isModified("status")) {
    return;
  }

  if (this.status === APPOINTMENT_STATUS.CANCELLED) {
    if (!this.cancelledAt) {
      this.cancelledAt = new Date();
    }
  } else {
    this.cancelledAt = null;
    this.cancelledBy = null;
    this.cancellationReason = "";
  }

  if (this.status === APPOINTMENT_STATUS.COMPLETED) {
    if (!this.completedAt) {
      this.completedAt = new Date();
    }
  } else {
    this.completedAt = null;
  }
});

const Appointment =
  process.env.NODE_ENV === "development"
    ? mongoose.model(
        "Appointment",
        appointmentSchema,
        undefined,
        { overwriteModels: true }
      )
    : mongoose.models.Appointment ||
      mongoose.model("Appointment", appointmentSchema);

export default Appointment;
