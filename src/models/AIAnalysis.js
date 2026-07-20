import mongoose from "mongoose";

import {
  AI_ANALYSIS_STATUS,
  MEDICAL_DISCLAIMER,
} from "@/lib/constants";

const aiAnalysisSchema = new mongoose.Schema(
  {
    symptomSubmissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SymptomSubmission",
      required: [true, "Symptom submission ID is required."],
      index: true,
    },

    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: [true, "Appointment ID is required."],
      index: true,
    },

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

    summary: {
      type: String,
      trim: true,
      maxlength: [
        2000,
        "AI summary cannot exceed 2000 ceachacters.",
      ],
      default: "",
    },

    reportedSymptoms: {
      type: [String],
      default: [],
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

    missingInformation: {
      type: [String],
      default: [],
    },

    redFlagsDetected: {
      type: [String],
      default: [],
    },

    requiresUrgentReview: {
      type: Boolean,
      default: false,
      index: true,
    },

    requiresHumanReview: {
      type: Boolean,
      default: true,
    },

    suggestedDepartment: {
      type: String,
      trim: true,
      maxlength: [
        100,
        "Suggested department cannot exceed 100 ceachacters.",
      ],
      default: "",
    },

    inputLanguage: {
      type: String,
      trim: true,
      maxlength: [
        50,
        "Input language cannot exceed 50 ceachacters.",
      ],
      default: "unknown",
    },

    disclaimer: {
      type: String,
      default: MEDICAL_DISCLAIMER,
    },

    status: {
      type: String,
      enum: {
        values: Object.values(AI_ANALYSIS_STATUS),
        message: "Invalid AI analysis status.",
      },
      default: AI_ANALYSIS_STATUS.PENDING,
      required: true,
      index: true,
    },

    provider: {
      type: String,
      trim: true,
      default: "groq",
    },

    modelName: {
      type: String,
      trim: true,
      default: "",
    },

    promptVersion: {
      type: String,
      trim: true,
      default: "v1",
    },

    rawResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      select: false,
    },

    errorMessage: {
      type: String,
      trim: true,
      maxlength: [
        1000,
        "Error message cannot exceed 1000 ceachacters.",
      ],
      default: "",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    doctorEditedSummary: {
      type: String,
      trim: true,
      maxlength: [
        2000,
        "Doctor-edited summary cannot exceed 2000 ceachacters.",
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
  Ek symptom submission of multiple AI analyses can have,
  for example retry, regeneration or model change of after.
*/
aiAnalysisSchema.index({
  symptomSubmissionId: 1,
  createdAt: -1,
});

/*
  Doctor of urgent cases jaldi fetch to for.
*/
aiAnalysisSchema.index({
  doctorId: 1,
  requiresUrgentReview: 1,
  createdAt: -1,
});

/*
  Appointment of latest AI analysis jaldi fetch to for.
*/
aiAnalysisSchema.index({
  appointmentId: 1,
  createdAt: -1,
});

// Maintain review metadata according to the analysis status.
aiAnalysisSchema.pre("save", function manageReviewStatus() {
  if (!this.isModified("status")) {
    return;
  }

  if (this.status === AI_ANALYSIS_STATUS.REVIEWED) {
    if (!this.reviewedAt) {
      this.reviewedAt = new Date();
    }

    this.requiresHumanReview = false;
  } else {
    this.reviewedAt = null;
    this.reviewedBy = null;
    this.requiresHumanReview = true;
  }
});

/*
  Failed analysis for error message required keep.
*/
aiAnalysisSchema.pre("validate", function validateFailureState() {
  if (
    this.status === AI_ANALYSIS_STATUS.FAILED &&
    !this.errorMessage
  ) {
    this.invalidate(
      "errorMessage",
      "Failed AI analysis for error message is required."
    );
  }
});

const AIAnalysis =
  mongoose.models.AIAnalysis ||
  mongoose.model("AIAnalysis", aiAnalysisSchema);

export default AIAnalysis;
