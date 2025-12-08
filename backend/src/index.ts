import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.routes';
import { usersRouter } from './routes/users.routes';
import { usersAdminRouter } from './routes/users.admin.routes';
import { clientsRouter } from './routes/clients.routes';
import { projectsRouter } from './routes/projects.routes';
import { apartmentsRouter } from './routes/apartments.routes';
import { bookingsRouter } from './routes/bookings.routes';
import { mortgageRouter } from './routes/mortgage.routes';
import { coursesRouter } from './routes/courses.routes';
import { notificationsRouter } from './routes/notifications.routes';
import { mortgageProgramsRouter } from './routes/mortgage-programs.routes';
import { dealsRouter } from './routes/deals.routes';
import { tasksRouter } from './routes/tasks.routes';
import { propertiesRouter } from './routes/properties.routes';
import { dashboardRouter } from './routes/dashboard.routes';
import { uploadRouter } from './routes/upload.routes';
import { paymentsRouter } from './routes/payments.routes';
import { errorHandler } from './middleware/error.middleware';
import { initializeBucket } from './lib/minio';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/admin/users', usersAdminRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/apartments', apartmentsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/mortgage', mortgageRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/mortgage-programs', mortgageProgramsRouter);
app.use('/api/deals', dealsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/payments', paymentsRouter);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  
  // Initialize MinIO bucket
  await initializeBucket();
});
