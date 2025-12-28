import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { DealStage, DealStatus } from '@prisma/client';

export const dealsRouter = Router();
dealsRouter.use(authenticate);

// Validation schemas
const createDealSchema = z.object({
  amount: z.number().positive('Сумма должна быть положительной'),
  commission: z.number().min(0, 'Комиссия не может быть отрицательной'),
  casaFee: z.number().min(0, 'Casa Fee не может быть отрицательным'),
  objectType: z.enum(['PROPERTY', 'APARTMENT', 'BOOKING']),
  objectId: z.string().optional(),
  clientId: z.string().optional(),
  notes: z.string().optional(),
  stage: z.nativeEnum(DealStage).optional(),
  color: z.string().optional(),
});

const updateDealSchema = z.object({
  amount: z.number().positive().optional(),
  commission: z.number().min(0).optional(),
  casaFee: z.number().min(0).optional(),
  status: z.nativeEnum(DealStatus).optional(),
  stage: z.nativeEnum(DealStage).optional(),
  color: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/deals - список сделок
dealsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, stage, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (req.user?.role === 'BROKER') where.brokerId = req.user.userId;
    if (status) where.status = status;
    if (stage) where.stage = stage;

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [
          { order: 'asc' },
          { createdAt: 'desc' }
        ],
        include: {
          broker: { select: { id: true, firstName: true, lastName: true } },
          client: { select: { id: true, firstName: true, lastName: true, phone: true } },
        },
      }),
      prisma.deal.count({ where }),
    ]);

    res.json({ deals, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
  } catch (error) {
    console.error('Get deals error:', error);
    res.status(500).json({ error: 'Ошибка получения списка сделок' });
  }
});

// GET /api/deals/:id - детали сделки
dealsRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: req.params.id },
      include: {
        broker: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        client: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
      },
    });

    if (!deal) {
      res.status(404).json({ error: 'Сделка не найдена' });
      return;
    }

    if (req.user?.role === 'BROKER' && deal.brokerId !== req.user.userId) {
      res.status(403).json({ error: 'Доступ запрещен' });
      return;
    }

    res.json(deal);
  } catch (error) {
    console.error('Get deal error:', error);
    res.status(500).json({ error: 'Ошибка получения сделки' });
  }
});

// POST /api/deals - создать сделку
dealsRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = createDealSchema.parse(req.body);

    const deal = await prisma.deal.create({
      data: { ...data, brokerId: req.user!.userId, status: 'IN_PROGRESS' },
      include: {
        broker: { select: { id: true, firstName: true, lastName: true } },
        client: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    });

    if (data.objectType === 'PROPERTY' && data.objectId) {
      await prisma.property.update({ where: { id: data.objectId }, data: { status: 'SOLD' } });
    }

    res.status(201).json(deal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error('Create deal error:', error);
    res.status(500).json({ error: 'Ошибка создания сделки' });
  }
});

// PUT /api/deals/:id - обновить сделку
dealsRouter.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = updateDealSchema.parse(req.body);

    const existing = await prisma.deal.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: 'Сделка не найдена' });
      return;
    }

    if (req.user?.role === 'BROKER' && existing.brokerId !== req.user.userId) {
      res.status(403).json({ error: 'Доступ запрещен' });
      return;
    }

    const updateData: any = { ...data };
    if (data.status === 'COMPLETED' && !existing.completedAt) {
      updateData.completedAt = new Date();
    }

    // Check if broker changed and notify
    if (updateData.brokerId && updateData.brokerId !== existing.brokerId) {
      await prisma.notification.create({
        data: {
          userId: updateData.brokerId,
          type: 'DEAL',
          title: 'Вам назначена сделка',
          message: `Вы назначены ответственным за сделку #${existing.id.slice(-4)}`,
          isRead: false
        }
      });
    }

    const updated = await prisma.deal.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        broker: { select: { id: true, firstName: true, lastName: true } },
        client: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error('Update deal error:', error);
    res.status(500).json({ error: 'Ошибка обновления сделки' });
  }
});

// DELETE /api/deals/:id - удалить сделку (Admin only)
dealsRouter.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Только администратор может удалять сделки' });
      return;
    }

    await prisma.deal.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete deal error:', error);
    res.status(500).json({ error: 'Ошибка удаления сделки' });
  }
});

