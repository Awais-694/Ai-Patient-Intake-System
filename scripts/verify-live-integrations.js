import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import connectDB from "../src/lib/db.js";
import {
  APPOINTMENT_STATUS,
  DOCTOR_APPROVAL_STATUS,
  USER_ROLES,
} from "../src/lib/constants.js";
import Appointment from "../src/models/Appointment.js";
import DoctorProfile from "../src/models/DoctorProfile.js";
import PatientProfile from "../src/models/PatientProfile.js";
import User from "../src/models/User.js";
import { analyzeSymptoms } from "../src/services/ai.service.js";

const marker = `codex-live-test-${Date.now()}`;
const createdIds = {
  users: [],
  doctorProfiles: [],
  patientProfiles: [],
  appointments: [],
};

async function main() {
  assert.ok(process.env.MONGODB_URI, "MONGODB_URI is not configured.");
  assert.ok(process.env.GROQ_API_KEY, "GROQ_API_KEY is not configured.");

  await connectDB();
  assert.equal(mongoose.connection.readyState, 1);

  const password = await bcrypt.hash("TemporaryPass1", 10);
  const [admin, doctor, patient] = await User.create([
    {
      name: "Codex Test Administrator",
      email: `${marker}-admin@example.test`,
      phone: "+920000000001",
      password,
      role: USER_ROLES.ADMIN,
    },
    {
      name: "Codex Test Doctor",
      email: `${marker}-doctor@example.test`,
      phone: "+920000000002",
      password,
      role: USER_ROLES.DOCTOR,
    },
    {
      name: "Codex Test Patient",
      email: `${marker}-patient@example.test`,
      phone: "+920000000003",
      password,
      role: USER_ROLES.PATIENT,
    },
  ]);

  createdIds.users.push(admin._id, doctor._id, patient._id);
  assert.deepEqual(
    [admin.role, doctor.role, patient.role],
    [USER_ROLES.ADMIN, USER_ROLES.DOCTOR, USER_ROLES.PATIENT]
  );

  const doctorProfile = await DoctorProfile.create({
    userId: doctor._id,
    specialization: "General Physician",
    qualification: "MBBS",
    licenseNumber: `${marker}-license`,
    experienceYears: 5,
    consultationFee: 1500,
    clinicAddress: "Temporary integration-test clinic",
    city: "Karachi",
    approvalStatus: DOCTOR_APPROVAL_STATUS.APPROVED,
    approvedBy: admin._id,
    approvedAt: new Date(),
    isAcceptingAppointments: true,
  });
  createdIds.doctorProfiles.push(doctorProfile._id);

  const patientProfile = await PatientProfile.create({
    userId: patient._id,
    age: 30,
    gender: "prefer-not-to-say",
    city: "Karachi",
  });
  createdIds.patientProfiles.push(patientProfile._id);

  await assert.rejects(
    DoctorProfile.create({
      userId: patient._id,
      specialization: "General Physician",
      qualification: "MBBS",
      licenseNumber: `${marker}-invalid-license`,
      experienceYears: 1,
      consultationFee: 1000,
      clinicAddress: "Invalid role test",
      city: "Karachi",
    }),
    /doctor role/i
  );

  await assert.rejects(
    PatientProfile.create({
      userId: doctor._id,
      age: 35,
      city: "Karachi",
    }),
    /patient role/i
  );

  const appointment = await Appointment.create({
    patientId: patient._id,
    doctorId: doctor._id,
    appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    startTime: "10:00",
    endTime: "10:20",
    reason: "Temporary live integration test",
    status: APPOINTMENT_STATUS.PENDING,
    consultationFee: 1500,
  });
  createdIds.appointments.push(appointment._id);

  assert.equal(appointment.patientId.toString(), patient._id.toString());
  assert.equal(appointment.doctorId.toString(), doctor._id.toString());

  appointment.status = APPOINTMENT_STATUS.CONFIRMED;
  await appointment.save();
  assert.equal(appointment.status, APPOINTMENT_STATUS.CONFIRMED);

  appointment.status = APPOINTMENT_STATUS.COMPLETED;
  appointment.doctorNotes = "Temporary integration test completed.";
  await appointment.save();
  assert.ok(appointment.completedAt instanceof Date);

  const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
  const analysis = await analyzeSymptoms({
    symptoms: "Mild headache for two hours without other symptoms.",
    duration: "Two hours",
    additionalInformation: "This is a temporary integration test.",
  });
  assert.ok(analysis.summary);
  assert.equal(analysis.provider, "groq");
  assert.equal(analysis.modelName, model);

  console.log(
    JSON.stringify({
      mongodb: "connected",
      databaseName: mongoose.connection.name,
      roles: {
        administrator: "created and verified",
        doctor: "created with approved profile",
        patient: "created with patient profile",
        invalidRoleProfiles: "rejected",
      },
      appointmentWorkflow: "pending -> confirmed -> completed",
      groq: "live completion received",
      groqModel: model,
    })
  );
}

async function cleanup() {
  await Appointment.deleteMany({ _id: { $in: createdIds.appointments } });
  await DoctorProfile.deleteMany({
    $or: [
      { _id: { $in: createdIds.doctorProfiles } },
      { licenseNumber: new RegExp(`^${marker}`) },
    ],
  });
  await PatientProfile.deleteMany({
    _id: { $in: createdIds.patientProfiles },
  });
  await User.deleteMany({
    $or: [
      { _id: { $in: createdIds.users } },
      { email: new RegExp(`^${marker}`) },
    ],
  });
}

async function run() {
  try {
    await main();
  } finally {
    if (mongoose.connection.readyState === 1) {
      await cleanup();
      await mongoose.disconnect();
    }
  }
}

run().catch((error) => {
  console.error(error?.message || "Live integration test failed.");
  process.exitCode = 1;
});
