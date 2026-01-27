import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
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
import { formsRouter } from './routes/forms.routes';
import { publicFormsRouter } from './routes/public-forms.routes';
import { sellersRouter } from './routes/sellers.routes';
import { crmPropertiesRouter } from './routes/crm-properties.routes';
import { buyersRouter } from './routes/buyers.routes';
import { uploadsRouter } from './routes/uploads.routes';
import { analyticsRouter } from './routes/analytics.routes';
import { errorHandler } from './middleware/error.middleware';
import { initializeBucket } from './lib/minio';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: true, // Allow any origin in development
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
app.use('/api/forms', formsRouter);
app.use('/api/public/forms', publicFormsRouter);

// CASA CRM Routes
app.use('/api/sellers', sellersRouter);
app.use('/api/crm-properties', crmPropertiesRouter);
app.use('/api/buyers', buyersRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/analytics', analyticsRouter);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);

  // Initialize MinIO bucket
  await initializeBucket();
});
