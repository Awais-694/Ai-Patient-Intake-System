import assert from "node:assert/strict";
import test from "node:test";

import {
  API_MESSAGES,
  APPOINTMENT_STATUS,
  USER_ROLES,
} from "../src/lib/constants.js";

test("role constants contain only supported application roles", () => {
  assert.deepEqual(Object.values(USER_ROLES).sort(), [
    "admin",
    "doctor",
    "patient",
  ]);
});

test("appointment lifecycle constants remain stable", () => {
  assert.deepEqual(Object.values(APPOINTMENT_STATUS), [
    "pending",
    "confirmed",
    "completed",
    "cancelled",
  ]);
});

test("shared API errors are professional English messages", () => {
  for (const message of Object.values(API_MESSAGES)) {
    assert.match(message, /^[A-Z]/);
    assert.match(message, /\.$/);
    assert.doesNotMatch(
      message,
      /\b(aap|nahi|mila|saki|gaya)\b/i
    );
  }
});
