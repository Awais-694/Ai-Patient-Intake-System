import assert from "node:assert/strict";
import test from "node:test";

import {
  appointmentStatusSchema,
  cancelAppointmentSchema,
  combineDateAndTime,
  createAppointmentSchema,
  normalizeAppointmentData,
} from "../src/validations/appointment.validation.js";

const appointmentId = "507f1f77bcf86cd799439011";

test("appointment creation accepts a future appointment", () => {
  const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const appointmentDate = future.toISOString().slice(0, 10);

  const result = createAppointmentSchema.safeParse({
    doctorId: appointmentId,
    appointmentDate,
    appointmentTime: "14:30",
    consultationType: "in_person",
    reason: "Persistent headache and dizziness",
  });

  assert.equal(result.success, true);
});

test("appointment creation rejects past appointments", () => {
  const result = createAppointmentSchema.safeParse({
    doctorId: appointmentId,
    appointmentDate: "2020-01-01",
    appointmentTime: "14:30",
    consultationType: "video",
    reason: "Persistent headache and dizziness",
  });

  assert.equal(result.success, false);
});

test("cancelled status requires a meaningful cancellation reason", () => {
  const result = appointmentStatusSchema.safeParse({
    appointmentId,
    status: "cancelled",
    cancellationReason: "No",
  });

  assert.equal(result.success, false);
});

test("cancellation payload accepts a valid reason", () => {
  const result = cancelAppointmentSchema.safeParse({
    appointmentId,
    cancellationReason: "The patient is no longer available.",
  });

  assert.equal(result.success, true);
});

test("appointment normalization converts numeric fields and symptoms", () => {
  const result = normalizeAppointmentData({
    doctorId: ` ${appointmentId} `,
    appointmentDate: "2030-05-10",
    appointmentTime: "09:15",
    symptoms: "headache, nausea",
    durationMinutes: "30",
    consultationFee: "1500",
  });

  assert.deepEqual(result.symptoms, ["headache", "nausea"]);
  assert.equal(result.durationMinutes, 30);
  assert.equal(result.consultationFee, 1500);
});

test("date and time combination rejects malformed time", () => {
  assert.equal(combineDateAndTime("2030-05-10", "25:00"), null);
});
