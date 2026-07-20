export const USER_ROLES = {
  PATIENT: "patient",
  DOCTOR: "doctor",
  ADMIN: "admin",
};

export const APPOINTMENT_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export const DOCTOR_APPROVAL_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

export const AI_ANALYSIS_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REVIEWED: "reviewed",
};

export const GENDER_OPTIONS = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
  PREFER_NOT_TO_SAY: "prefer-not-to-say",
};

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const SPECIALIZATIONS = [
  "General Physician",
  "Cardiologist",
  "Dermatologist",
  "Neurologist",
  "Pediatrician",
  "Gynecologist",
  "Orthopedic Surgeon",
  "ENT Specialist",
  "Psychiatrist",
  "Dentist",
];

export const DEFAULT_APPOINTMENT_DURATION = 20;

export const MINIMUM_PATIENT_AGE = 1;

export const MAXIMUM_PATIENT_AGE = 120;

export const MINIMUM_SYMPTOM_LENGTH = 10;

export const MAXIMUM_SYMPTOM_LENGTH = 2000;

export const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME || "MediAssist";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const MEDICAL_DISCLAIMER =
  "This AI-generated summary is for informational and clinical intake support only. It is not a medical diagnosis, prescription, or replacement for professional medical advice.";

export const API_MESSAGES = {
  UNAUTHORIZED: "You are not authorized to perform this action.",
  FORBIDDEN: "You do not have access to this resource.",
  NOT_FOUND: "The requested record was not found.",
  VALIDATION_ERROR: "The provided information is invalid.",
  SERVER_ERROR: "An unexpected server error occurred.",
  DATABASE_ERROR: "The database operation could not be completed.",
};
