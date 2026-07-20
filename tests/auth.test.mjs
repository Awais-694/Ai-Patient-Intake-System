import assert from "node:assert/strict";
import test from "node:test";

import {
  loginSchema,
  normalizeRegistrationData,
  doctorRegistrationSchema,
  registrationSchema,
} from "../src/validations/auth.validation.js";

test("login accepts a normalized valid email and password", () => {
  const result = loginSchema.safeParse({
    email: " Patient@Example.com ",
    password: "SecurePass1",
  });

  assert.equal(result.success, true);
  assert.equal(result.data.email, "patient@example.com");
});

test("registration rejects mismatched passwords", () => {
  const result = registrationSchema.safeParse({
    name: "Test Patient",
    email: "patient@example.com",
    phone: "+92 300 1234567",
    password: "SecurePass1",
    confirmPassword: "DifferentPass1",
    role: "patient",
  });

  assert.equal(result.success, false);
  assert.ok(
    result.error.issues.some(
      (issue) => issue.path[0] === "confirmPassword"
    )
  );
});

test("doctor account registration accepts basic account details", () => {
  const result = registrationSchema.safeParse({
    name: "Test Doctor",
    email: "doctor@example.com",
    phone: "+92 300 7654321",
    password: "SecurePass1",
    confirmPassword: "SecurePass1",
    role: "doctor",
  });

  assert.equal(result.success, true);
});

test("doctor profile validation requires professional credentials", () => {
  const result = doctorRegistrationSchema.safeParse({
    name: "Test Doctor",
    email: "doctor@example.com",
    phone: "+92 300 7654321",
    password: "SecurePass1",
    confirmPassword: "SecurePass1",
    role: "doctor",
  });

  assert.equal(result.success, false);
  assert.ok(
    result.error.issues.some(
      (issue) => issue.path[0] === "licenseNumber"
    )
  );
});

test("registration normalization trims values and converts numbers", () => {
  const result = normalizeRegistrationData({
    name: " Test Doctor ",
    email: " DOCTOR@EXAMPLE.COM ",
    phone: " +92 300 7654321 ",
    experienceYears: "12",
    consultationFee: "2500",
  });

  assert.equal(result.name, "Test Doctor");
  assert.equal(result.email, "doctor@example.com");
  assert.equal(result.experienceYears, 12);
  assert.equal(result.consultationFee, 2500);
});
