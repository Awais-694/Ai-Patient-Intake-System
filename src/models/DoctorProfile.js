import mongoose from "mongoose";

import {
  DAYS_OF_WEEK,
  DOCTOR_APPROVAL_STATUS,
  SPECIALIZATIONS,
  USER_ROLES,
} from "@/lib/constants";

const timeSlotSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: [true, "Start time is required."],
      trim: true,
    },

    endTime: {
      type: String,
      required: [true, "End time is required."],
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const availabilitySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: [true, "Availability day is required."],
      enum: {
        values: DAYS_OF_WEEK,
        message: "Invalid availability day.",
      },
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    slots: {
      type: [timeSlotSchema],
      default: [],
    },
  },
  {
    _id: false,
  }
);

const doctorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Doctor user ID is required."],
      unique: true,
      index: true,
    },

    specialization: {
      type: String,
      required: [true, "Specialization is required."],
      enum: {
        values: SPECIALIZATIONS,
        message: "Invalid specialization.",
      },
      trim: true,
    },

    qualification: {
      type: String,
      required: [true, "Qualification is required."],
      trim: true,
      minlength: [
        2,
        "Qualification at least 2 ceachacters of must be.",
      ],
      maxlength: [
        150,
        "Qualification cannot exceed 150 ceachacters.",
      ],
    },

    licenseNumber: {
      type: String,
      required: [true, "Medical license number is required."],
      unique: true,
      trim: true,
      uppercase: true,
    },

    experienceYears: {
      type: Number,
      required: [true, "Experience years are required."],
      min: [0, "Experience years cannot be negative."],
      max: [70, "Experience years valid range in must be."],
      default: 0,
    },

    consultationFee: {
      type: Number,
      required: [true, "Consultation fee is required."],
      min: [0, "Consultation fee cannot be negative."],
      default: 0,
    },

    clinicName: {
      type: String,
      trim: true,
      maxlength: [100, "Clinic name cannot exceed 100 ceachacters."],
      default: "",
    },

    clinicAddress: {
      type: String,
      required: [true, "Clinic address is required."],
      trim: true,
      maxlength: [
        250,
        "Clinic address cannot exceed 250 ceachacters.",
      ],
    },

    city: {
      type: String,
      required: [true, "City is required."],
      trim: true,
      maxlength: [60, "City cannot exceed 60 ceachacters."],
    },

    biography: {
      type: String,
      trim: true,
      maxlength: [1000, "Biography cannot exceed 1000 ceachacters."],
      default: "",
    },

    availability: {
      type: [availabilitySchema],
      default: [],
    },

    appointmentDuration: {
      type: Number,
      min: [10, "Appointment duration at least 10 minutes must be."],
      max: [120, "Appointment duration cannot exceed 120 minutes."],
      default: 20,
    },

    approvalStatus: {
      type: String,
      enum: {
        values: Object.values(DOCTOR_APPROVAL_STATUS),
        message: "Invalid doctor approval status.",
      },
      default: DOCTOR_APPROVAL_STATUS.PENDING,
      required: true,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [
        500,
        "Rejection reason cannot exceed 500 ceachacters.",
      ],
      default: "",
    },

    isAcceptingAppointments: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

doctorProfileSchema.index({ specialization: 1 });
doctorProfileSchema.index({ city: 1 });
doctorProfileSchema.index({ approvalStatus: 1 });

doctorProfileSchema.pre("save", async function validateDoctorUser() {
  if (!this.isModified("userId")) {
    return;
  }

  const User = mongoose.models.User;

  if (!User) {
    return;
  }

  const user = await User.findById(this.userId).select("role");

  if (!user) {
    throw new Error("Doctor profile for related user not found.");
  }

  if (user.role !== USER_ROLES.DOCTOR) {
    throw new Error("Doctor profile only doctor role user of can only belong to.");
  }
});

const DoctorProfile =
  mongoose.models.DoctorProfile ||
  mongoose.model("DoctorProfile", doctorProfileSchema);

export default DoctorProfile;