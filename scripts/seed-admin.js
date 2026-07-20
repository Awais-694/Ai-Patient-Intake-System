import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const USER_ROLES = {
  PATIENT: "patient",
  DOCTOR: "doctor",
  ADMIN: "admin",
};

async function seedAdmin() {
  try {
    const {
      MONGODB_URI,
      ADMIN_NAME = "MediAssist Administrator",
      ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL,
      ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD,
    } = process.env;

    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is not configured.");
    }

    if (
      !ADMIN_NAME ||
      !ADMIN_EMAIL ||
      !ADMIN_PASSWORD
    ) {
      throw new Error(
        "Admin configuration is incomplete. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD."
      );
    }

    await mongoose.connect(MONGODB_URI);

    const userSchema = new mongoose.Schema(
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },

        email: {
          type: String,
          required: true,
          unique: true,
          lowercase: true,
          trim: true,
        },

        password: {
          type: String,
          required: true,
          select: false,
        },

        role: {
          type: String,
          enum: Object.values(USER_ROLES),
          default: USER_ROLES.PATIENT,
        },

        phone: {
          type: String,
          default: "",
        },

        profileImage: {
          type: String,
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

    const User =
      mongoose.models.User ||
      mongoose.model("User", userSchema);

    const normalizedEmail =
      ADMIN_EMAIL.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      if (existingUser.role !== USER_ROLES.ADMIN) {
        throw new Error(
          "This email is already registered to a non-administrator account."
        );
      }

      console.log("Admin account already exists.");

      await mongoose.disconnect();
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(
      ADMIN_PASSWORD,
      12
    );

    const admin = await User.create({
      name: ADMIN_NAME.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: USER_ROLES.ADMIN,
      isActive: true,
      emailVerified: true,
    });

    console.log("Administrator account created successfully.");
    console.log(`Admin ID: ${admin._id.toString()}`);
    console.log(`Admin Email: ${admin.email}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Admin seed failed:", error.message);

    await mongoose.disconnect().catch(() => {});

    process.exit(1);
  }
}

seedAdmin();
