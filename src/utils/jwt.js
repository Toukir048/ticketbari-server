import jwt from "jsonwebtoken";

const sevenDays = 7 * 24 * 60 * 60 * 1000;

const isProduction = process.env.NODE_ENV === "production";

export const createToken = (email) => {
  return jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const createJwtToken = createToken;

export const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: sevenDays,
  path: "/",
};

export const clearCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
};

export const getCookieOptions = () => cookieOptions;

export const getClearCookieOptions = () => clearCookieOptions;

export const verifyJwt = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};