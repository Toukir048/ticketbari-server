const normalizeUrl = (url = "") => {
  return url.trim().replace(/\/+$/, "");
};

export const getAllowedOrigins = () => {
  const envOrigins = [
    process.env.CLIENT_URL,
    ...(process.env.CLIENT_URLS || "").split(","),
  ];

  const fallbackOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://ticketbari-client-ruby.vercel.app",
  ];

  return [...envOrigins, ...fallbackOrigins]
    .filter(Boolean)
    .map(normalizeUrl)
    .filter((origin, index, array) => array.indexOf(origin) === index);
};

export const normalizeOrigin = normalizeUrl;