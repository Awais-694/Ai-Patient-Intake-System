
import mongoose from "mongoose";
import { NextResponse } from "next/server";

import connectDB from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();

  try {
    await connectDB();

    const databaseStatus =
      getDatabaseStatus(
        mongoose.connection.readyState
      );

    const isDatabaseConnected =
      mongoose.connection.readyState === 1;

    const responseStatus =
      isDatabaseConnected ? 200 : 503;

    return NextResponse.json(
      {
        success: isDatabaseConnected,

        status: isDatabaseConnected
          ? "healthy"
          : "degraded",

        service: "MediAssist API",

        environment:
          process.env.NODE_ENV ||
          "development",

        timestamp:
          new Date().toISOString(),

        uptimeSeconds:
          Math.floor(process.uptime()),

        responseTimeMs:
          Date.now() - startedAt,

        database: {
          connected:
            isDatabaseConnected,

          status:
            databaseStatus,

          name:
            mongoose.connection.name ||
            "Unavailable",

          host:
            getSafeDatabaseHost(),
        },
      },
      {
        status: responseStatus,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "Health-check error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        status: "unhealthy",
        service: "MediAssist API",

        environment:
          process.env.NODE_ENV ||
          "development",

        timestamp:
          new Date().toISOString(),

        uptimeSeconds:
          Math.floor(process.uptime()),

        responseTimeMs:
          Date.now() - startedAt,

        database: {
          connected: false,
          status: "disconnected",
        },

        error:
          process.env.NODE_ENV ===
          "development"
            ? getSafeErrorMessage(error)
            : "Health check failed.",
      },
      {
        status: 503,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}

export async function HEAD() {
  try {
    await connectDB();

    const isDatabaseConnected =
      mongoose.connection.readyState === 1;

    return new Response(null, {
      status: isDatabaseConnected
        ? 200
        : 503,

      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",
      },
    });
  } catch {
    return new Response(null, {
      status: 503,

      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",
      },
    });
  }
}

function getDatabaseStatus(
  readyState
) {
  const statuses = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return (
    statuses[readyState] ||
    "unknown"
  );
}

function getSafeDatabaseHost() {
  if (
    process.env.NODE_ENV !==
    "development"
  ) {
    return "hidden";
  }

  return (
    mongoose.connection.host ||
    "Unavailable"
  );
}

function getSafeErrorMessage(
  error
) {
  if (
    error?.message &&
    typeof error.message ===
      "string"
  ) {
    return error.message;
  }

  return "Unknown health-check error.";
}