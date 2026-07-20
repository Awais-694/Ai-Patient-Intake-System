import "dotenv/config";

import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import User from "../src/models/User.js";
import PatientProfile from "../src/models/PatientProfile.js";
import DoctorProfile from "../src/models/DoctorProfile.js";
import Appointment from "../src/models/Appointment.js";

const DATABASE_URL =
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL;

const DEFAULT_PASSWORD =
  process.env.SEED_DEFAULT_PASSWORD ||
  "Password123";

const ADMIN_EMAIL =
  process.env.SEED_ADMIN_EMAIL ||
  "admin@mediassist.com";

const ADMIN_PASSWORD =
  process.env.SEED_ADMIN_PASSWORD ||
  "Admin12345";

async function seedDatabase() {
  try {
    validateEnvironment();

    console.log(
      "\nðŸŒ± MediAssist database seeding started...\n"
    );

    await mongoose.connect(DATABASE_URL);

    console.log(
      "âœ… MongoDB connected successfully."
    );

    const passwordHash = await bcrypt.hash(
      DEFAULT_PASSWORD,
      12
    );

    const adminPasswordHash =
      await bcrypt.hash(
        ADMIN_PASSWORD,
        12
      );

    const adminUser = await upsertUser({
      name: "MediAssist Administrator",
      email: ADMIN_EMAIL,
      phone: "03000000000",
      passwordHash: adminPasswordHash,
      role: "admin",
      isActive: true,
      isApproved: true,
    });

    console.log(
      `âœ… Admin ready: ${adminUser.email}`
    );

    const patientUsers = [];

    for (const patientData of PATIENTS) {
      const patientUser = await upsertUser({
        name: patientData.name,
        email: patientData.email,
        phone: patientData.phone,
        passwordHash,
        role: "patient",
        isActive: true,
        isApproved: true,
      });

      await upsertPatientProfile({
        userId: patientUser._id,
        ...patientData.profile,
      });

      patientUsers.push(patientUser);

      console.log(
        `âœ… Patient ready: ${patientUser.email}`
      );
    }

    const doctorRecords = [];

    for (const doctorData of DOCTORS) {
      const doctorUser = await upsertUser({
        name: doctorData.name,
        email: doctorData.email,
        phone: doctorData.phone,
        passwordHash,
        role: "doctor",
        isActive: true,
        isApproved: true,
      });

      const doctorProfile =
        await upsertDoctorProfile({
          userId: doctorUser._id,
          ...doctorData.profile,
        });

      doctorRecords.push({
        user: doctorUser,
        profile: doctorProfile,
      });

      console.log(
        `âœ… Doctor ready: ${doctorUser.email}`
      );
    }

    await seedAppointments({
      patients: patientUsers,
      doctors: doctorRecords,
    });

    console.log(
      "\nðŸŽ‰ Database seeded successfully.\n"
    );

    printLoginCredentials();
  } catch (error) {
    console.error(
      "\nâŒ Database seed failed:",
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

async function upsertUser({
  name,
  email,
  phone,
  passwordHash,
  role,
  isActive,
  isApproved,
}) {
  const normalizedEmail = email
    .trim()
    .toLowerCase();

  const updateData = {
    name,
    email: normalizedEmail,
    phone,
    role,
    isActive,
    isApproved,
    emailVerified: new Date(),
  };

  setPasswordField(
    updateData,
    passwordHash
  );

  return User.findOneAndUpdate(
    {
      email: normalizedEmail,
    },
    {
      $set: filterDataForModel(
        User,
        updateData
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

async function upsertPatientProfile({
  userId,
  ...profileData
}) {
  const lookupField =
    getReferenceField(
      PatientProfile,
      [
        "userId",
        "patientId",
        "user",
      ]
    );

  if (!lookupField) {
    throw new Error(
      "PatientProfile model in user reference field not found."
    );
  }

  const data = {
    [lookupField]: userId,
    ...profileData,
  };

  return PatientProfile.findOneAndUpdate(
    {
      [lookupField]: userId,
    },
    {
      $set: filterDataForModel(
        PatientProfile,
        data
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
  ...profileData
}) {
  const lookupField =
    getReferenceField(
      DoctorProfile,
      [
        "userId",
        "doctorId",
        "user",
      ]
    );

  if (!lookupField) {
    throw new Error(
      "DoctorProfile model in user reference field not found."
    );
  }

  const data = {
    [lookupField]: userId,
    ...profileData,
  };

  return DoctorProfile.findOneAndUpdate(
    {
      [lookupField]: userId,
    },
    {
      $set: filterDataForModel(
        DoctorProfile,
        data
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

async function seedAppointments({
  patients,
  doctors,
}) {
  if (
    patients.length === 0 ||
    doctors.length === 0
  ) {
    console.log(
      "âš ï¸ Appointments skipped because patients or doctors are missing."
    );

    return;
  }

  const patientReferenceField =
    getReferenceField(
      Appointment,
      [
        "patientId",
        "patient",
        "userId",
      ]
    );

  const doctorReferenceField =
    getReferenceField(
      Appointment,
      [
        "doctorId",
        "doctor",
      ]
    );

  if (
    !patientReferenceField ||
    !doctorReferenceField
  ) {
    console.log(
      "âš ï¸ Appointment schema reference fields not mile. Appointment seeding skipped."
    );

    return;
  }

  const doctorReferenceModel =
    Appointment.schema.path(
      doctorReferenceField
    )?.options?.ref;

  const appointmentDates =
    createAppointmentDates();

  const appointmentInputs = [
    {
      referenceNumber:
        "APT-SEED-0001",
      patient: patients[0],
      doctor: doctors[0],
      date: appointmentDates.futureOne,
      time: "10:00",
      status: "confirmed",
      consultationType: "in_person",
      reason:
        "Recurring headaches and fatigue",
      symptoms:
        "Headache, tiredness and difficulty concentrating",
      symptomDuration: "2 weeks",
      severity: "moderate",
      consultationFee: 2500,
    },
    {
      referenceNumber:
        "APT-SEED-0002",
      patient:
        patients[1] || patients[0],
      doctor:
        doctors[1] || doctors[0],
      date: appointmentDates.futureTwo,
      time: "14:30",
      status: "pending",
      consultationType: "video",
      reason:
        "Skin irritation and itching",
      symptoms:
        "Redness, itching and dry skin",
      symptomDuration: "5 days",
      severity: "mild",
      consultationFee: 2000,
    },
    {
      referenceNumber:
        "APT-SEED-0003",
      patient: patients[0],
      doctor:
        doctors[2] || doctors[0],
      date: appointmentDates.pastOne,
      time: "11:30",
      status: "completed",
      consultationType: "in_person",
      reason:
        "Follow-up for blood pressure",
      symptoms:
        "Occasional dizziness",
      symptomDuration: "1 month",
      severity: "mild",
      consultationFee: 3000,
      diagnosis:
        "Mild hypertension",
      prescription:
        "Amlodipine 5mg â€” once daily â€” 30 days",
      followUpInstructions:
        "Monitor blood pressure daily and return after four weeks.",
    },
  ];

  for (
    const input of appointmentInputs
  ) {
    const doctorReference =
      doctorReferenceModel ===
      "DoctorProfile"
        ? input.doctor.profile._id
        : input.doctor.user._id;

    const appointmentData = {
      referenceNumber:
        input.referenceNumber,

      [patientReferenceField]:
        input.patient._id,

      [doctorReferenceField]:
        doctorReference,

      appointmentDate:
        input.date,

      date: input.date,

      appointmentTime:
        input.time,

      time: input.time,

      durationMinutes: 30,

      consultationType:
        input.consultationType,

      consultationFee:
        input.consultationFee,

      reason: input.reason,
      symptoms: input.symptoms,

      symptomDuration:
        input.symptomDuration,

      severity: input.severity,

      preferredLanguage:
        "English",

      patientNotes:
        "This is demonstration seed data.",

      status: input.status,

      diagnosis:
        input.diagnosis || "",

      prescription:
        input.prescription || "",

      followUpInstructions:
        input.followUpInstructions || "",

      confirmedAt:
        ["confirmed", "completed"].includes(
          input.status
        )
          ? new Date()
          : null,

      completedAt:
        input.status === "completed"
          ? new Date()
          : null,

      statusHistory: [
        {
          status: "pending",
          note:
            "Appointment created by seed script",
          changedBy:
            input.patient._id,
          changedAt:
            input.date,
        },
        ...(input.status !== "pending"
          ? [
              {
                status:
                  input.status,
                previousStatus:
                  "pending",
                note:
                  `Appointment marked as ${input.status}`,
                changedBy:
                  input.doctor.user._id,
                changedAt:
                  new Date(),
              },
            ]
          : []),
      ],
    };

    const filteredData =
      filterDataForModel(
        Appointment,
        appointmentData
      );

    const lookup = Appointment.schema.path(
      "referenceNumber"
    )
      ? {
          referenceNumber:
            input.referenceNumber,
        }
      : {
          [patientReferenceField]:
            input.patient._id,
          [doctorReferenceField]:
            doctorReference,
          appointmentDate:
            input.date,
          appointmentTime:
            input.time,
        };

    await Appointment.findOneAndUpdate(
      lookup,
      {
        $set: filteredData,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log(
      `âœ… Appointment ready: ${input.referenceNumber}`
    );
  }
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

function getReferenceField(
  Model,
  candidates
) {
  return (
    candidates.find((field) =>
      Model.schema.path(field)
    ) || null
  );
}

function setPasswordField(
  data,
  passwordHash
) {
  if (User.schema.path("password")) {
    data.password = passwordHash;
    return;
  }

  if (
    User.schema.path("passwordHash")
  ) {
    data.passwordHash = passwordHash;
    return;
  }

  throw new Error(
    "User model in password or passwordHash field not found."
  );
}

function createAppointmentDates() {
  const futureOne = new Date();
  futureOne.setDate(
    futureOne.getDate() + 3
  );
  futureOne.setHours(10, 0, 0, 0);

  const futureTwo = new Date();
  futureTwo.setDate(
    futureTwo.getDate() + 7
  );
  futureTwo.setHours(14, 30, 0, 0);

  const pastOne = new Date();
  pastOne.setDate(
    pastOne.getDate() - 10
  );
  pastOne.setHours(11, 30, 0, 0);

  return {
    futureOne,
    futureTwo,
    pastOne,
  };
}

function validateEnvironment() {
  if (!DATABASE_URL) {
    throw new Error(
      "MONGODB_URI environment variable missing is."
    );
  }
}

function printLoginCredentials() {
  console.log(
    "â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€"
  );

  console.log("Seed login credentials:");

  console.log(
    `Admin:   ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`
  );

  console.log(
    `Patient: ${PATIENTS[0].email} / ${DEFAULT_PASSWORD}`
  );

  console.log(
    `Doctor:  ${DOCTORS[0].email} / ${DEFAULT_PASSWORD}`
  );

  console.log(
    "â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€"
  );
}

const PATIENTS = [
  {
    name: "Ali Khan",
    email:
      "patient1@mediassist.com",
    phone: "03001234567",

    profile: {
      dateOfBirth:
        new Date("1995-04-15"),

      gender: "male",
      bloodGroup: "B+",
      address:
        "Model Town, Lahore",
      city: "Lahore",

      emergencyContactName:
        "Ahmed Khan",

      emergencyContactPhone:
        "03007654321",

      allergies: [
        "Penicillin",
      ],

      chronicConditions: [
        "Migraine",
      ],

      currentMedications: [],
    },
  },
  {
    name: "Ayesha Malik",
    email:
      "patient2@mediassist.com",
    phone: "03111234567",

    profile: {
      dateOfBirth:
        new Date("1998-09-22"),

      gender: "female",
      bloodGroup: "O+",
      address:
        "Gulberg, Lahore",
      city: "Lahore",

      emergencyContactName:
        "Sara Malik",

      emergencyContactPhone:
        "03117654321",

      allergies: [],
      chronicConditions: [],
      currentMedications: [],
    },
  },
];

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
        "Experienced cardiologist providing preventive and clinical cardiac care.",

      approvalStatus:
        "approved",

      isApproved: true,
      isAvailable: true,
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
        "Dermatologist focused on skin, isr and allergy-related conditions.",

      approvalStatus:
        "approved",

      isApproved: true,
      isAvailable: true,
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
        "Internal medicine specialist treating common and chronic medical conditions.",

      approvalStatus:
        "approved",

      isApproved: true,
      isAvailable: true,
    },
  },
];

await seedDatabase();