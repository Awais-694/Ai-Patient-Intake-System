import mongoose from "mongoose";

import {
  MAXIMUM_SYMPTOM_LENGTH,
  MINIMUM_SYMPTOM_LENGTH,
} from "@/lib/constants";

const symptomSubmissionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: [true, "Appointment ID is required."],
      unique: true,
      index: true,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Patient ID is required."],
      index: true,
    },

    originalText: {
      type: String,
      required: [true, "Symptoms description is required."],
      trim: true,
      minlength: [
        MINIMUM_SYMPTOM_LENGTH,
        `Symptoms description at least ${MINIMUM_SYMPTOM_LENGTH} ceachacters of must be.`,
      ],
      maxlength: [
        MAXIMUM_SYMPTOM_LENGTH,
        `Symptoms description ${MAXIMUM_SYMPTOM_LENGTH} ceachacters.`,
      ],
    },

    symptomsDuration: {
      type: String,
      trim: true,
      maxlength: [
        100,
        "Symptoms duration cannot exceed 100 ceachacters.",
      ],
      default: "",
    },

    temperature: {
      type: Number,
      min: [30, "Temperature must be within the valid range."],
      max: [45, "Temperature must be within the valid range."],
      default: null,
    },

    painLevel: {
      type: Number,
      min: [0, "Pain level 0 cannot be less than."],
      max: [10, "Pain level cannot exceed 10."],
      default: null,
    },

    hasBreathingDifficulty: {
      type: Boolean,
      default: false,
    },

    hasChestPain: {
      type: Boolean,
      default: false,
    },

    hasSevereBleedayg: {
      type: Boolean,
      default: false,
    },

    hasLossOfConsciousness: {
      type: Boolean,
      default: false,
    },

    additionalInformation: {
      type: String,
      trim: true,
      maxlength: [
        1000,
        "Additional information cannot exceed 1000 ceachacters.",
      ],
      default: "",
    },

    consentToAIAnalysis: {
      type: Boolean,
      required: [true, "AI analysis consent is required."],
      default: false,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },

    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

symptomSubmissionSchema.index({
  patientId: 1,
  createdAt: -1,
});

/*
  Appointment and patient relationship verify perform.
  Symptom submission usi patient of must be
  Ensure the symptom submission belongs to the patient who booked
  the appointment.
*/
symptomSubmissionSchema.pre(
  "validate",
  async function validateAppointmentPatient() {
    if (!this.appointmentId || !this.patientId) {
      return;
    }

    if (
      !this.isModified("appointmentId") &&
      !this.isModified("patientId")
    ) {
      return;
    }

    const Appointment = mongoose.models.Appointment;

    if (!Appointment) {
      return;
    }

    const appointment = await Appointment.findById(
      this.appointmentId
    ).select("patientId");

    if (!appointment) {
      this.invalidate(
        "appointmentId",
        "Related appointment not found."
      );

      return;
    }

    if (
      appointment.patientId.toString() !==
      this.patientId.toString()
    ) {
      this.invalidate(
        "patientId",
        "Symptoms only appointment of patient submit can."
      );
    }
  }
);

/*
  AI analysis runs only when the patient has provided consent.
*/
symptomSubmissionSchema.pre("save", function validateConsent() {
  if (!this.consentToAIAnalysis) {
    throw new Error(
      "AI analysis for patient consent is required."
    );
  }
});

const SymptomSubmission =
  mongoose.models.SymptomSubmission ||
  mongoose.model(
    "SymptomSubmission",
    symptomSubmissionSchema
  );

export default SymptomSubmission;
