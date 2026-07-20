import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    actorRole: {
      type: String,
      enum: ["patient", "doctor", "admin", "system"],
      default: "system",
      index: true,
    },

    action: {
      type: String,
      required: [true, "Audit action is required."],
      trim: true,
      maxlength: [
        100,
        "Audit action cannot exceed 100 characters.",
      ],
      index: true,
    },

    resourceType: {
      type: String,
      required: [true, "Resource type is required."],
      trim: true,
      maxlength: [
        100,
        "Resource type cannot exceed 100 characters.",
      ],
      index: true,
    },

    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [
        1000,
        "Audit description cannot exceed 1000 characters.",
      ],
      default: "",
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    ipAddress: {
      type: String,
      trim: true,
      maxlength: [
        100,
        "IP address cannot exceed 100 characters.",
      ],
      default: "",
    },

    userAgent: {
      type: String,
      trim: true,
      maxlength: [
        500,
        "User agent cannot exceed 500 characters.",
      ],
      default: "",
    },

    status: {
      type: String,
      enum: {
        values: ["success", "failed"],
        message: "Invalid audit log status.",
      },
      default: "success",
      index: true,
    },

    errorMessage: {
      type: String,
      trim: true,
      maxlength: [
        1000,
        "Error message cannot exceed 1000 characters.",
      ],
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

auditLogSchema.index({
  actorId: 1,
  createdAt: -1,
});

auditLogSchema.index({
  resourceType: 1,
  resourceId: 1,
  createdAt: -1,
});

auditLogSchema.index({
  action: 1,
  createdAt: -1,
});

auditLogSchema.index({
  status: 1,
  createdAt: -1,
});

auditLogSchema.pre("validate", function validateFailedLog() {
  if (this.status === "failed" && !this.errorMessage) {
    this.invalidate(
      "errorMessage",
      "Failed audit log for error message is required."
    );
  }
});

const AuditLog =
  mongoose.models.AuditLog ||
  mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;