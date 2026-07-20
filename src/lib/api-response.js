import { NextResponse } from "next/server";

export function successResponse(
  data = null,
  message = "Request successful",
  status = 200
) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    {
      status,
    }
  );
}

export function errorResponse(
  message = "Something went wrong",
  status = 500,
  errors = null
) {
  return NextResponse.json(
    {
      success: false,
      message,
      errors,
    },
    {
      status,
    }
  );
}

export function validationErrorResponse(errors) {
  return errorResponse(
    "Provided information valid not is.",
    400,
    errors
  );
}

export function unauthorizedResponse(
  message = "Login is required."
) {
  return errorResponse(message, 401);
}

export function forbiddenResponse(
  message = "Aapko is action of permission not is."
) {
  return errorResponse(message, 403);
}

export function notFoundResponse(
  message = "Requested record not found."
) {
  return errorResponse(message, 404);
}