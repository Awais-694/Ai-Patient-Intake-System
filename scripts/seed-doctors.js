import "dotenv/config";

import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import User from "../src/models/User.js";
import DoctorProfile from "../src/models/DoctorProfile.js";

const DATABASE_URL =
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL;

const DOCTOR_PASSWORD =
  process.env.SEED_DOCTOR_PASSWORD ||
  process.env.SEED_DEFAULT_PASSWORD ||
  "Doctor123";

async function seedDoctors() {
  try {
    if (!DATABASE_URL) {
      throw new Error(
        "MONGODB_URI environment variable missing is."
      );
    }

    console.log(
      "\nðŸ©º Doctor seeding started...\n"
    );

    await mongoose.connect(DATABASE_URL);

    console.log(
      "âœ… MongoDB connected successfully."
    );

    const passwordHash =
      await bcrypt.hash(
        DOCTOR_PASSWORD,
        12
      );

    for (const doctorData of DOCTORS) {
      const doctorUser =
        await upsertDoctorUser({
          ...doctorData,
          passwordHash,
        });

      await upsertDoctorProfile({
        userId: doctorUser._id,
        profile:
          doctorData.profile,
      });

      console.log(
        `âœ… ${doctorData.name} seeded successfully.`
      );
    }

    console.log(
      `\nðŸŽ‰ ${DOCTORS.length} doctors seeded successfully.`
    );

    printCredentials();
  } catch (error) {
    console.error(
      "\nâŒ Doctor seeding failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    if (
      mongoose.connection.readyState !== 0
    ) {
      await mongoose.disconnect();

      console.log(
        "\nðŸ”Œ MongoDB connection closed."
      );
    }
  }
}

async function upsertDoctorUser({
  name,
  email,
  phone,
  passwordHash,
}) {
  const normalizedEmail = email
    .trim()
    .toLowerCase();

  const userData = {
    name,
    email: normalizedEmail,
    phone,
    role: "doctor",
    isActive: true,
    isApproved: true,
    emailVerified: new Date(),
  };

  if (User.schema.path("password")) {
    userData.password =
      passwordHash;
  } else if (
    User.schema.path("passwordHash")
  ) {
    userData.passwordHash =
      passwordHash;
  } else {
    throw new Error(
      "User model in password field unavailable is."
    );
  }

  return User.findOneAndUpdate(
    {
      email: normalizedEmail,
    },
    {
      $set: filterDataForModel(
        User,
        userData
      ),
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );
}

async function upsertDoctorProfile({
  userId,
  profile,
}) {
  const userReferenceField =
    getFirstExistingField(
      DoctorProfile,
      [
        "userId",
        "doctorId",
        "user",
      ]
    );

  if (!userReferenceField) {
    throw new Error(
      "DoctorProfile schema in user reference field not found."
    );
  }

  const profileData = {
    [userReferenceField]:
      userId,

    ...profile,

    approvalStatus:
      "approved",

    isApproved: true,
    isAvailable: true,
  };

  return DoctorProfile.findOneAndUpdate(
    {
      [userReferenceField]:
        userId,
    },
    {
      $set: filterDataForModel(
        DoctorProfile,
        profileData
      ),
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );
}

function filterDataForModel(
  Model,
  data
) {
  const filteredData = {};

  for (const [key, value] of Object.entries(
    data
  )) {
    if (
      value !== undefined &&
      Model.schema.path(key)
    ) {
      filteredData[key] = value;
    }
  }

  return filteredData;
}

function getFirstExistingField(
  Model,
  candidateFields
) {
  return (
    candidateFields.find((field) =>
      Model.schema.path(field)
    ) || null
  );
}

function printCredentials() {
  console.log(
    "\nâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€"
  );

  console.log(
    "Seeded doctor accounts:"
  );

  for (const doctor of DOCTORS) {
    console.log(
      `${doctor.email} / ${DOCTOR_PASSWORD}`
    );
  }

  console.log(
    "â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€"
  );
}

const DOCTORS = [
  {
    name: "Dr. Sara Ahmed",
    email:
      "doctor1@mediassist.com",
    phone: "03211234567",

    profile: {
      specialization:
        "Cardiology",

      qualification:
        "MBBS, FCPS Cardiology",

      licenseNumber:
        "PMC-SEED-1001",

      experienceYears: 10,

      consultationFee: 2500,

      clinicName:
        "MediCare Heart Clinic",

      clinicAddress:
        "Main Boulevard, Gulberg",

      city: "Lahore",

      bio:
        "Cardiologist specializing in hypertension, heart disease and preventive cardiac care.",

      availableDays: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
      ],

      startTime: "09:00",
      endTime: "15:00",

      languages: [
        "English",
        "Urdu",
      ],
    },
  },
  {
    name: "Dr. Usman Raza",
    email:
      "doctor2@mediassist.com",
    phone: "03331234567",

    profile: {
      specialization:
        "Dermatology",

      qualification:
        "MBBS, FCPS Dermatology",

      licenseNumber:
        "PMC-SEED-1002",

      experienceYears: 7,

      consultationFee: 2000,

      clinicName:
        "Skin Health Clinic",

      clinicAddress:
        "Johar Town",

      city: "Lahore",

      bio:
        "Dermatologist treating acne, eczema, allergies and isr-related conditions.",

      availableDays: [
        "monday",
        "wednesday",
        "friday",
        "saturday",
      ],

      startTime: "11:00",
      endTime: "18:00",

      languages: [
        "English",
        "Urdu",
        "Punjabi",
      ],
    },
  },
  {
    name: "Dr. Hina Aslam",
    email:
      "doctor3@mediassist.com",
    phone: "03451234567",

    profile: {
      specialization:
        "Internal Medicine",

      qualification:
        "MBBS, FCPS Medicine",

      licenseNumber:
        "PMC-SEED-1003",

      experienceYears: 12,

      consultationFee: 3000,

      clinicName:
        "Wellness Medical Centre",

      clinicAddress:
        "DHA Phase 5",

      city: "Lahore",

      bio:
        "Internal medicine specialist with experience in chronic and general medical conditions.",

      availableDays: [
        "tuesday",
        "wednesday",
        "thursday",
        "saturday",
      ],

      startTime: "10:00",
      endTime: "16:00",

      languages: [
        "English",
        "Urdu",
      ],
    },
  },
  {
    name: "Dr. Bilal Hassan",
    email:
      "doctor4@mediassist.com",
    phone: "03081234567",

    profile: {
      specialization:
        "Pediatrics",

      qualification:
        "MBBS, FCPS Pediatrics",

      licenseNumber:
        "PMC-SEED-1004",

      experienceYears: 9,

      consultationFee: 2200,

      clinicName:
        "Children Care Clinic",

      clinicAddress:
        "Faisal Town",

      city: "Lahore",

      bio:
        "Pediatrician providing healthcare for infants, children and adolescents.",

      availableDays: [
        "monday",
        "tuesday",
        "thursday",
        "friday",
      ],

      startTime: "12:00",
      endTime: "19:00",

      languages: [
        "English",
        "Urdu",
      ],
    },
  },
  {
    name: "Dr. Zainab Iqbal",
    email:
      "doctor5@mediassist.com",
    phone: "03151234567",

    profile: {
      specialization:
        "Gynecology",

      qualification:
        "MBBS, FCPS Gynecology",

      licenseNumber:
        "PMC-SEED-1005",

      experienceYears: 11,

      consultationFee: 2800,

      clinicName:
        "Women Wellness Clinic",

      clinicAddress:
        "Garden Town",

      city: "Lahore",

      bio:
        "Gynecologist focused on women's health, reproductive care and routine consultations.",

      availableDays: [
        "monday",
        "wednesday",
        "thursday",
        "saturday",
      ],

      startTime: "09:30",
      endTime: "15:30",

      languages: [
        "English",
        "Urdu",
      ],
    },
  },
];

await seedDoctors();