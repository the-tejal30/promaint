import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { seedIfEmpty } from './data/seed.js';
import authRoutes from './routes/auth.js';
import equipmentRoutes from './routes/equipment.js';
import scheduleRoutes from './routes/schedule.js';
import workordersRoutes from './routes/workorders.js';
import techniciansRoutes from './routes/technicians.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/workorders', workordersRoutes);
app.use('/api/technicians', techniciansRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    await seedIfEmpty();
    app.listen(PORT, () => {
      console.log(`ProMaint backend running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
