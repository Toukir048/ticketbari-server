import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const tokenFromCookie = req.cookies?.token;
  const tokenFromHeader = req.headers.authorization?.split(" ")[1];

  const token = tokenFromCookie || tokenFromHeader;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized access. Token is missing.",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access. Invalid token.",
      });
    }

    req.user = decoded;
    next();
  });
};