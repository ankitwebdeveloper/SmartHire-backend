const errorHandler = (err, req, res, next) => {
  // Catch Multer Payload Too Large explicit errors (code 11 is generic payload boundary, code 'LIMIT_FILE_SIZE' is direct Multer config output)
  if (err.code === 'LIMIT_FILE_SIZE' || err.message === 'File too large') {
     return res.status(413).json({ success: false, message: 'File exceeds 2MB upload limit' });
  }
  if (err.message && err.message.includes('Only PDF, DOC')) {
     return res.status(400).json({ success: false, message: err.message });
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = { errorHandler, notFound };
