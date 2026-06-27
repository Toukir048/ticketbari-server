import jwt from "jsonwebtoken";

const sevenDays = 7 * 24 * 60 * 60 * 1000;

export const createToken = (email) => {
  return jwt.sign(
    {
      email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// Old route compatibility
export const createJwtToken = createToken;

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: sevenDays,
};

export const clearCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};

// Old route compatibility
export const getCookieOptions = () => cookieOptions;

export const getClearCookieOptions = () => clearCookieOptions;

export const verifyJwt = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};