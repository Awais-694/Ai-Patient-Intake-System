import bcrypt from "bcryptjs";

import connectDB from "@/lib/db";
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/api-response";
import { USER_ROLES } from "@/lib/constants";

import User from "@/models/User";
import PatientProfile from "@/models/PatientProfile";

import { registrationSchema } from "@/validations/auth.validation";

export async function POST(request) {
  try {
    // Request body read please.
    const body = await request.json();

    // Registration data to Zod from validate please.
    const validationResult = registrationSchema.safeParse(body);

    if (!validationResult.success) {
      return validationErrorResponse(
        validationResult.error.flatten().fieldErrors
      );
    }

    const { name, email, password, phone, role } =
      validationResult.data;

    // Public registration in only patient and doctor allowed are.
    const allowedRoles = [
      USER_ROLES.PATIENT,
      USER_ROLES.DOCTOR,
    ];

    if (!allowedRoles.includes(role)) {
      return errorResponse(
        "Invalid role for public registration.",
        403
      );
    }

    // MongoDB from connection establish please.
    await connectDB();

    // check of email before from registered to not.
    const existingUser = await User.findOne({
      email,
    }).select("_id email");

    if (existingUser) {
      return errorResponse(
        "An account with this email address is already registered.",
        409
      );
    }

    // Password to hash please.
    const passwordHash = await bcrypt.hash(password, 12);

    // Common user account create please.
    const user = await User.create({
      name,
      email,
      password: passwordHash,
      phone: phone || "",
      role,
      isActive: true,
      emailVerified: false,
    });

    try {
      // Patient for basic profile automatically create will be.
      if (role === USER_ROLES.PATIENT) {
        await PatientProfile.create({
          userId: user._id,
        });
      }

      return successResponse(
        {
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
          },

          nextStep:
            role === USER_ROLES.DOCTOR
              ? "complete-doctor-profile"
              : "login",
        },
        role === USER_ROLES.DOCTOR
          ? "Doctor account created successfully. Complete your professional profile after logging in."
          : "Patient account created successfully.",
        201
      );
    } catch (profileError) {
      // Delete the incomplete user if profile creation fails.
      await User.findByIdAndDelete(user._id);

      console.error(
        "Profile creation failed:",
        profileError
      );

      return errorResponse(
        "The account profile could not be created. Please try again.",
        500
      );
    }
  } catch (error) {
    // Invalid JSON request.
    if (error instanceof SyntaxError) {
      return errorResponse(
        "The request body must contain valid JSON.",
        400
      );
    }

    // MongoDB duplicate-key error.
    if (error?.code === 11000) {
      const duplicateField =
        Object.keys(error.keyPattern || {})[0] || "field";

      return errorResponse(
        `${duplicateField} is already registered.`,
        409
      );
    }

    console.error("Registration error:", error);

    return errorResponse(
      "The account could not be created. Please try again.",
      500
    );
  }
}
