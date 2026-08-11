const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
require('dotenv').config();

// Seed utilities
const seedFoods = require('./utils/seedFoods');
const { seedDefaultUser } = require('./utils/seedUsers');

// Route imports
const authRoutes     = require('./routes/auth');
const mealRoutes     = require('./routes/meals');
const workoutRoutes  = require('./routes/workouts');
const healthRoutes   = require('./routes/health');
const aiRoutes       = require('./routes/ai');
const userRoutes     = require('./routes/user');

const app    = express();
const server = http.createServer(app);
const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:3000', 'http://localhost:3002'].filter(Boolean);

const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
};

const io     = new Server(server, {
  cors: corsOptions,
});

/* ─── Middleware ─────────────────────────────────────────── */
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(multer({ storage: multer.memoryStorage() }).single('image'));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Global rate limiter
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: process.env.NODE_ENV === 'development' ? 1000 : 200,
  message: { error: 'Too many requests, please try again later.' },
}));

/* ─── Socket.io ──────────────────────────────────────────── */
// Attach io to every request so controllers can emit events
app.use((req, _res, next) => { req.io = io; next(); });

io.on('connection', (socket) => {
  console.log(`[Socket] client connected: ${socket.id}`);

  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`[Socket] user ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] client disconnected: ${socket.id}`);
  });
});

/* ─── Routes ─────────────────────────────────────────────── */
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

app.use('/api/auth',     authRoutes);
app.use('/api/meals',    mealRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/health',   healthRoutes);
app.use('/api/ai',       aiRoutes);
app.use('/api/user',     userRoutes);

const { protect } = require('./middleware/auth');
const Meal = require('./models/Meal');
const HealthMetric = require('./models/HealthMetric');

app.get('/api/dashboard', protect, async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // 1. Get today's meals
    const todayMeals = await Meal.find({ userId: req.user._id, date: todayStr });
    const todayNutrition = todayMeals.reduce((acc, m) => {
      acc.totalCalories += m.totalCalories || 0;
      acc.totalProtein += m.totalProtein || 0;
      acc.totalCarbs += m.totalCarbs || 0;
      acc.totalFat += m.totalFat || 0;
      return acc;
    }, { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, water: 0 });

    // 2. Get today's water glasses
    const todayHealth = await HealthMetric.findOne({ userId: req.user._id, date: todayStr });
    todayNutrition.water = todayHealth?.waterGlasses || 0;

    // 3. Get recent 7 days nutrition summaries
    const recentNutrition = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];

      const dayMeals = await Meal.find({ userId: req.user._id, date: dStr });
      const dayCalories = dayMeals.reduce((sum, m) => sum + (m.totalCalories || 0), 0);

      recentNutrition.push({
        date: dStr,
        totalCalories: dayCalories
      });
    }

    res.json({
      todayNutrition,
      recentNutrition
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/nutrition', protect, async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const { water } = req.body;
    if (water !== undefined) {
      await HealthMetric.findOneAndUpdate(
        { userId: req.user._id, date: todayStr },
        { $set: { waterGlasses: water } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── 404 handler ───────────────────────────────────────── */
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

/* ─── Global error handler ──────────────────────────────── */
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.stack);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

/* ─── Database + Server start ───────────────────────────── */
const PORT = process.env.PORT || 5000;

async function startServer() {
  let connected = false;

  // 1. Try configured URI (Atlas or local config)
  const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nutritrack';
  try {
    console.log(`[DB] Connecting to MongoDB...`);
    await mongoose.connect(dbUri, { serverSelectionTimeoutMS: 15000 });
    console.log('[DB] MongoDB connected ✅');
    connected = true;
  } catch (err) {
    console.error('[DB] Standard connection failed:', err.message);
  }

  // 2. If connection failed, fallback to Local In-Memory MongoDB Server
  if (!connected) {
    try {
      console.log('[DB] Attempting fallback to In-Memory MongoDB Server for local development...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      
      await mongoose.connect(mongoUri);
      console.log('[DB] Connected to Local In-Memory MongoDB ✅ (Note: Data will not persist across restarts)');
      connected = true;
    } catch (err) {
      console.error('[DB] In-Memory fallback failed:', err.message);
      process.exit(1);
    }
  }

  // Seed food database
  await seedFoods();

  // Seed default admin user if DB is empty
  await seedDefaultUser();

  // Start Express/Socket.io Server
  server.listen(PORT, () =>
    console.log(`[Server] Running on http://localhost:${PORT} 🚀`)
  );
}

startServer();

module.exports = { app, io };
