require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const logger = require('./utils/logger');

const connectDB = require('./config/db');
const ensureAdmin = require('./utils/ensureAdmin');
require('./config/passport'); 
const passport = require('passport');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();

// ================= SECURITY =================
app.use(helmet());

// ================= CORS (ONLY 2 ORIGINS) =================
const allowedOrigins = [
  'http://localhost:5173',              // Local frontend
  'https://smart-hire-frontend-two.vercel.app'   // 🔥 Apna real domain daalna
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true
}));

// ================= BODY PARSER =================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ================= STATIC =================
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ================= PASSPORT =================
app.use(passport.initialize());

// ================= ROUTES =================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/saved-jobs', require('./routes/savedJobRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/profiles', require('./routes/profileRoutes'));

// ================= TEST ROUTE =================
app.get('/api', (req, res) => {
  res.json({ message: 'API is running...' });
});

// ================= ERROR LOGGING =================
app.use((err, req, res, next) => {
  logger.error(`Error at ${req.originalUrl}: ${err.message}`, {
    stack: err.stack
  });

  if (res.headersSent) return next(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// ================= ERROR HANDLER =================
app.use(notFound);
app.use(errorHandler);

// ================= SERVER START =================
const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();
  await ensureAdmin();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  logger.error(`Startup error: ${err.message}`, {
    stack: err.stack
  });
  process.exit(1);
});


// cmcgkv
//ghghkjhljhb