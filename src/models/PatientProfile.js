import mongoose from "mongoose";

import {
  GENDER_OPTIONS,
  MAXIMUM_PATIENT_AGE,
  MINIMUM_PATIENT_AGE,
  USER_ROLES,
} from "@/lib/constants";

const emergencyContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: [
        60,
        "Emergency contact name cannot exceed 60 ceachacters.",
      ],
      default: "",
    },

    relationship: {
      type: String,
      trim: true,
      maxlength: [
        40,
        "Relationship cannot exceed 40 ceachacters.",
      ],
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      maxlength: [
        25,
        "Emergency contact phone cannot exceed 25 ceachacters.",
      ],
      default: "",
    },

    email: {
      type: String,
      trim: true,
      maxlength: [120, "Emergency contact email cannot exceed 120 characters."],
      default: "",
    },
  },
  {
    _id: false,
  }
);

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true, maxlength: 150, default: "" },
    area: { type: String, trim: true, maxlength: 100, default: "" },
    city: { type: String, trim: true, maxlength: 60, default: "" },
    state: { type: String, trim: true, maxlength: 60, default: "" },
    postalCode: { type: String, trim: true, maxlength: 20, default: "" },
    country: { type: String, trim: true, maxlength: 60, default: "" },
  },
  { _id: false }
);

const patientProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Patient user ID is required."],
      unique: true,
      index: true,
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    age: {
      type: Number,
      min: [
        MINIMUM_PATIENT_AGE,
        `Patient age at least ${MINIMUM_PATIENT_AGE} must be.`,
      ],
      max: [
        MAXIMUM_PATIENT_AGE,
        `Patient age ${MAXIMUM_PATIENT_AGE} cannot exceed.`,
      ],
      default: null,
    },

    gender: {
      type: String,
      enum: {
        values: Object.values(GENDER_OPTIONS),
        message: "Invalid gender option.",
      },
      default: GENDER_OPTIONS.PREFER_NOT_TO_SAY,
    },

    bloodGroup: {
      type: String,
      enum: {
        values: [
          "A+",
          "A-",
          "B+",
          "B-",
          "AB+",
          "AB-",
          "O+",
          "O-",
          "unknown",
        ],
        message: "Invalid blood group.",
      },
      default: "unknown",
    },

    address: {
      type: addressSchema,
      default: () => ({}),
    },

    city: {
      type: String,
      trim: true,
      maxlength: [60, "City cannot exceed 60 ceachacters."],
      default: "",
    },

    medicalConditions: {
      type: [String],
      default: [],
    },

    allergies: {
      type: [String],
      default: [],
    },

    currentMedications: {
      type: [String],
      default: [],
    },

    chronicConditions: { type: [String], default: [] },
    previousSurgeries: { type: [String], default: [] },
    familyMedicalHistory: { type: [String], default: [] },
    smokingStatus: { type: String, trim: true, default: "never" },
    alcoholUse: { type: String, trim: true, default: "never" },
    exerciseFrequency: { type: String, trim: true, default: "none" },
    dietaryPreferences: { type: [String], default: [] },
    heightCm: { type: Number, min: 30, max: 300, default: null },
    weightKg: { type: Number, min: 1, max: 500, default: null },
    profileCompleted: { type: Boolean, default: false },
    profileCompletionPercentage: { type: Number, min: 0, max: 100, default: 0 },

    emergencyContact: {
      type: emergencyContactSchema,
      default: () => ({}),
    },

    isProfileComplete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

patientProfileSchema.index({ city: 1 });

patientProfileSchema.pre("save", async function validatePatientUser() {
  if (!this.isModified("userId")) {
    return;
  }

  const User = mongoose.models.User;

  if (!User) {
    return;
  }

  const user = await User.findById(this.userId).select("role");

  if (!user) {
    throw new Error("Patient profile for related user not found.");
  }

  if (user.role !== USER_ROLES.PATIENT) {
    throw new Error("Patient profile only patient role user of can only belong to.");
  }
});

patientProfileSchema.pre("save", function updateProfileStatus() {
  const hasBasicInformation =
    Boolean(this.dateOfBirth || this.age) &&
    Boolean(this.gender) &&
    Boolean(this.city || this.address?.city);

  this.isProfileComplete = hasBasicInformation;
});

const PatientProfile =
  mongoose.models.PatientProfile ||
  mongoose.model("PatientProfile", patientProfileSchema);

export default PatientProfile;
