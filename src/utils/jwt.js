import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET;

export const createJwtToken = (payload) => {
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is missing in .env file");
  }

  return jwt.sign(payload, jwtSecret, {
    expiresIn: "7d",
  });
};

export const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};