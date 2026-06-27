export const errorHandler = (error, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: error.message || "Internal server error.",
    ...(process.env.NODE_ENV !== "production" && {
      stack: error.stack,
    }),
  });
};