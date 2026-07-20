import mongoose from "mongoose";

const doctorRecommendationSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    symptoms: { type: String, required: true, trim: true, maxlength: 2000 },
    duration: { type: String, trim: true, maxlength: 100, default: "" },
    summary: { type: String, trim: true, maxlength: 2000, default: "" },
    suggestedDepartment: { type: String, trim: true, maxlength: 100, default: "" },
    recommendedSpecializations: { type: [String], default: [] },
    redFlagsDetected: { type: [String], default: [] },
    requiresUrgentReview: { type: Boolean, default: false },
    missingInformation: { type: [String], default: [] },
    consentToAIAnalysis: { type: Boolean, required: true },
    provider: { type: String, default: "groq" },
    modelName: { type: String, default: "" },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      index: { expires: 0 },
    },
  },
  { timestamps: true, versionKey: false }
);

const DoctorRecommendation =
  process.env.NODE_ENV === "development"
    ? mongoose.model("DoctorRecommendation", doctorRecommendationSchema, undefined, { overwriteModels: true })
    : mongoose.models.DoctorRecommendation ||
      mongoose.model("DoctorRecommendation", doctorRecommendationSchema);

export default DoctorRecommendation;
