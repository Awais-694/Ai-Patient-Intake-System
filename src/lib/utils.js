import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(
    clsx(inputs)
  );
}

export function formatCurrency(
  amount,
  options = {}
) {
  const {
    currency = "PKR",
    locale = "en-PK",
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
  } = options;

  const numericAmount =
    Number(amount);

  if (
    !Number.isFinite(
      numericAmount
    )
  ) {
    return `${currency} 0`;
  }

  return new Intl.NumberFormat(
    locale,
    {
      style: "currency",
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    }
  ).format(numericAmount);
}

export function formatDate(
  dateValue,
  options = {}
) {
  const date =
    parseDate(dateValue);

  if (!date) {
    return "Not available";
  }

  const {
    locale = "en-PK",
    day = "2-digit",
    month = "short",
    year = "numeric",
  } = options;

  return new Intl.DateTimeFormat(
    locale,
    {
      day,
      month,
      year,
    }
  ).format(date);
}

export function formatDateTime(
  dateValue,
  options = {}
) {
  const date =
    parseDate(dateValue);

  if (!date) {
    return "Not available";
  }

  const {
    locale = "en-PK",
    hour12 = true,
  } = options;

  return new Intl.DateTimeFormat(
    locale,
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12,
    }
  ).format(date);
}

export function formatTime(
  timeValue,
  options = {}
) {
  if (!timeValue) {
    return "Time unavailable";
  }

  const {
    locale = "en-PK",
    hour12 = true,
  } = options;

  if (
    timeValue instanceof Date &&
    !Number.isNaN(
      timeValue.getTime()
    )
  ) {
    return new Intl.DateTimeFormat(
      locale,
      {
        hour: "numeric",
        minute: "2-digit",
        hour12,
      }
    ).format(timeValue);
  }

  const normalizedTime =
    String(timeValue).trim();

  const match =
    normalizedTime.match(
      /^([01]\d|2[0-3]):([0-5]\d)$/
    );

  if (!match) {
    return normalizedTime;
  }

  const date = new Date();
  date.setHours(
    Number(match[1]),
    Number(match[2]),
    0,
    0
  );

  return new Intl.DateTimeFormat(
    locale,
    {
      hour: "numeric",
      minute: "2-digit",
      hour12,
    }
  ).format(date);
}

export function formatReadableText(
  value,
  fallback = "Not provided"
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  return String(value)
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

export function formatNameInitials(
  name
) {
  const normalizedName =
    String(name || "").trim();

  if (!normalizedName) {
    return "U";
  }

  return normalizedName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");
}

export function formatPhoneNumber(
  value
) {
  if (!value) {
    return "Not provided";
  }

  return String(value).trim();
}

export function formatAddress(
  address
) {
  if (!address) {
    return "Not provided";
  }

  if (
    typeof address === "string"
  ) {
    return (
      address.trim() ||
      "Not provided"
    );
  }

  if (
    typeof address === "object"
  ) {
    const parts = [
      address.street,
      address.area,
      address.city,
      address.state,
      address.postalCode,
      address.country,
    ]
      .map((part) =>
        String(part || "").trim()
      )
      .filter(Boolean);

    return parts.length > 0
      ? parts.join(", ")
      : "Not provided";
  }

  return "Not provided";
}

export function formatList(
  value,
  fallback = "Not provided"
) {
  if (!value) {
    return fallback;
  }

  if (Array.isArray(value)) {
    const items = value
      .map((item) => {
        if (
          typeof item === "string"
        ) {
          return item.trim();
        }

        if (
          item &&
          typeof item === "object"
        ) {
          return String(
            item.name ||
              item.value ||
              item.label ||
              ""
          ).trim();
        }

        return "";
      })
      .filter(Boolean);

    return items.length > 0
      ? items.join(", ")
      : fallback;
  }

  return (
    String(value).trim() ||
    fallback
  );
}

export function formatPrescription(
  prescription
) {
  if (!prescription) {
    return "No prescription recorded";
  }

  if (
    typeof prescription ===
    "string"
  ) {
    return (
      prescription.trim() ||
      "No prescription recorded"
    );
  }

  if (
    Array.isArray(
      prescription
    )
  ) {
    const medicines =
      prescription
        .map((medicine) => {
          if (
            typeof medicine ===
            "string"
          ) {
            return medicine.trim();
          }

          if (
            !medicine ||
            typeof medicine !==
              "object"
          ) {
            return "";
          }

          return [
            medicine.name,
            medicine.dosage,
            medicine.frequency,
            medicine.duration,
            medicine.instructions,
          ]
            .map((value) =>
              String(
                value || ""
              ).trim()
            )
            .filter(Boolean)
            .join(" — ");
        })
        .filter(Boolean);

    return medicines.length > 0
      ? medicines.join("\n")
      : "No prescription recorded";
  }

  return "Prescription information available";
}

export function parseDate(
  dateValue
) {
  if (!dateValue) {
    return null;
  }

  if (
    dateValue instanceof Date
  ) {
    return Number.isNaN(
      dateValue.getTime()
    )
      ? null
      : dateValue;
  }

  const parsedDate =
    new Date(dateValue);

  return Number.isNaN(
    parsedDate.getTime()
  )
    ? null
    : parsedDate;
}

export function isPastDate(
  dateValue
) {
  const date =
    parseDate(dateValue);

  if (!date) {
    return false;
  }

  return date < new Date();
}

export function isFutureDate(
  dateValue
) {
  const date =
    parseDate(dateValue);

  if (!date) {
    return false;
  }

  return date > new Date();
}

export function combineDateAndTime(
  dateValue,
  timeValue
) {
  const date =
    parseDate(dateValue);

  const time =
    String(timeValue || "").trim();

  const timeMatch =
    time.match(
      /^([01]\d|2[0-3]):([0-5]\d)$/
    );

  if (
    !date ||
    !timeMatch
  ) {
    return null;
  }

  const combinedDate =
    new Date(date);

  combinedDate.setHours(
    Number(timeMatch[1]),
    Number(timeMatch[2]),
    0,
    0
  );

  return combinedDate;
}

export function isAppointmentInPast(
  dateValue,
  timeValue
) {
  const appointmentDate =
    combineDateAndTime(
      dateValue,
      timeValue
    );

  if (!appointmentDate) {
    const date =
      parseDate(dateValue);

    if (!date) {
      return false;
    }

    date.setHours(
      23,
      59,
      59,
      999
    );

    return date < new Date();
  }

  return appointmentDate < new Date();
}

export function sanitizeText(
  value,
  maximumLength = 500
) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximumLength);
}

export function normalizeEmail(
  value
) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function normalizeNumber(
  value,
  fallback = 0
) {
  const numberValue =
    Number(value);

  return Number.isFinite(
    numberValue
  )
    ? numberValue
    : fallback;
}

export function normalizePositiveInteger(
  value,
  fallback = 1
) {
  const numberValue =
    Number.parseInt(
      value,
      10
    );

  if (
    !Number.isFinite(
      numberValue
    ) ||
    numberValue < 1
  ) {
    return fallback;
  }

  return numberValue;
}

export function clampNumber(
  value,
  minimum,
  maximum
) {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue
    )
  ) {
    return minimum;
  }

  return Math.min(
    Math.max(
      numericValue,
      minimum
    ),
    maximum
  );
}

export function createReferenceNumber(
  prefix = "APT"
) {
  const timestamp =
    Date.now()
      .toString(36)
      .toUpperCase();

  const randomPart =
    Math.random()
      .toString(36)
      .slice(2, 7)
      .toUpperCase();

  return `${prefix}-${timestamp}-${randomPart}`;
}

export function getDashboardUrl(
  role
) {
  const dashboardRoutes = {
    admin:
      "/admin/dashboard",

    doctor:
      "/doctor/dashboard",

    patient:
      "/patient/dashboard",
  };

  return (
    dashboardRoutes[role] ||
    "/"
  );
}

export function buildPaginationData({
  page,
  limit,
  totalItems,
}) {
  const safePage =
    normalizePositiveInteger(
      page,
      1
    );

  const safeLimit =
    normalizePositiveInteger(
      limit,
      10
    );

  const safeTotalItems =
    Math.max(
      normalizeNumber(
        totalItems,
        0
      ),
      0
    );

  const totalPages =
    Math.max(
      Math.ceil(
        safeTotalItems /
          safeLimit
      ),
      1
    );

  const currentPage =
    Math.min(
      safePage,
      totalPages
    );

  return {
    page: currentPage,
    limit: safeLimit,
    totalItems:
      safeTotalItems,
    totalPages,

    hasPreviousPage:
      currentPage > 1,

    hasNextPage:
      currentPage <
      totalPages,

    skip:
      (currentPage - 1) *
      safeLimit,
  };
}

export function getErrorMessage(
  error,
  fallback =
    "Something went wrong."
) {
  if (
    typeof error === "string"
  ) {
    return error;
  }

  if (
    error?.message &&
    typeof error.message ===
      "string"
  ) {
    return error.message;
  }

  return fallback;
}

export function serializeDocument(
  document
) {
  if (!document) {
    return null;
  }

  return JSON.parse(
    JSON.stringify(document)
  );
}

export function sleep(
  milliseconds
) {
  return new Promise(
    (resolve) =>
      setTimeout(
        resolve,
        milliseconds
      )
  );
}