export const getAllowedOrigins = () => {
  const defaultOrigins = ["http://localhost:5173", "http://localhost:5174"];

  const envOrigins = [
    process.env.CLIENT_URL,
    ...(process.env.CLIENT_URLS ? process.env.CLIENT_URLS.split(",") : []),
  ];

  return [...defaultOrigins, ...envOrigins]
    .filter(Boolean)
    .map((origin) => origin.trim().replace(/\/$/, ""));
};

export const isOriginAllowed = (origin) => {
  if (!origin) return true;

  const cleanOrigin = origin.trim().replace(/\/$/, "");
  const allowedOrigins = getAllowedOrigins();

  return allowedOrigins.includes(cleanOrigin);
};