import mongoose from "mongoose";

import { USER_ROLES } from "@/lib/constants";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      minlength: [2, "Name at least 2 ceachacters of must be."],
      maxlength: [60, "Name cannot exceed 60 ceachacters."],
    },

    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address.",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required."],
      minlength: [8, "Password at least 8 ceachacters of must be."],
      select: false,
    },

    role: {
      type: String,
      enum: {
        values: Object.values(USER_ROLES),
        message: "Invalid user role.",
      },
      default: USER_ROLES.PATIENT,
      required: true,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    profileImage: {
      type: String,
      trim: true,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/*
  A unique index is created for the email field.

  Note:
  `unique: true` normal validation not is.
  This instructs MongoDB to enforce email uniqueness.
*/
/*
  In Next.js development mode, hot reloads may cause
  same model multiple times compile to be of attempt can.

  Is pattern from existing model reuse hota is.
*/
const User =
  mongoose.models.User || mongoose.model("User", userSchema);

export default User;
