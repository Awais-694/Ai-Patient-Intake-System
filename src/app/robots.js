
export default function robots() {
  const baseUrl =
    getApplicationBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",

        allow: [
          "/",
          "/login",
          "/register",
        ],

        disallow: [
          "/admin/",
          "/doctor/",
          "/patient/",
          "/api/",
          "/unauthorized",
        ],
      },
    ],

    sitemap: `${baseUrl}/sitemap.xml`,

    host: baseUrl,
  };
}

function getApplicationBaseUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AUTH_URL;

  if (configuredUrl) {
    return configuredUrl.replace(
      /\/+$/,
      ""
    );
  }

  if (
    process.env.VERCEL_URL
  ) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}