// =========================================
// SELLERS ROUTES (CASA CRM)
// RESTful API for Seller management
// =========================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { prisma } from '../lib/prisma';
import {
    SellerContactStageSchema,
    SellerInterviewStageSchema,
    SellerInterviewTransitionSchema,
    SellerUpdateSchema,
} from '../lib/validation.schemas';

export const sellersRouter = Router();

// Apply auth middleware to all routes
sellersRouter.use(authenticate);

// =========================================
// GET /api/sellers - Список продавцов
// =========================================
sellersRouter.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            funnelStage,
            search,
            isActive,
            brokerId,
            page = '1',
            limit = '20',
        } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};

        // Role-based filtering
        if (req.user?.role === 'BROKER') {
            where.brokerId = req.user.userId;
        } else if (brokerId) {
            // Admin can filter by specific broker
            where.brokerId = brokerId as string;
        }

        // Фильтр по этапу воронки
        if (funnelStage) {
            where.funnelStage = funnelStage;
        }

        // Фильтр по активности
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        } else {
            where.isActive = true; // По умолчанию только активные
        }

        // Поиск по имени/телефону
        if (search) {
            where.OR = [
                { firstName: { contains: search as string, mode: 'insensitive' } },
                { lastName: { contains: search as string, mode: 'insensitive' } },
                { phone: { contains: search as string } },
            ];
        }

        const [sellers, total] = await Promise.all([
            prisma.seller.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { updatedAt: 'desc' },
                include: {
                    broker: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    properties: {
                        where: { status: { not: 'ARCHIVED' } },
                        select: {
                            id: true,
                            residentialComplex: true,
                            price: true,
                            funnelStage: true,
                            repairState: true,
                            ceilingHeight: true,
                            parkingType: true,
                            activeStrategy: true, // NEW
                            showsCount: true,
                            leadsCount: true,
                            offers: {
                                select: {
                                    id: true,
                                    price: true,
                                    status: true,
                                },
                                where: {
                                    status: { not: 'REJECTED' }
                                },
                                orderBy: { price: 'desc' },
                                take: 1
                            }
                        },
                    },
                    _count: {
                        select: {
                            properties: {
                                where: { status: { not: 'ARCHIVED' } }
                            }
                        },
                    },
                },
            }),
            prisma.seller.count({ where }),
        ]);

        res.json({
            sellers,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.error('Get sellers error:', error);
        res.status(500).json({ error: 'Ошибка получения списка продавцов' });
    }
});

// =========================================
// GET /api/sellers/funnel-stats - Статистика по воронке
// =========================================
sellersRouter.get('/funnel-stats', async (req: Request, res: Response): Promise<void> => {
    try {
        const where: any = {};

        if (req.user?.role === 'BROKER') {
            where.brokerId = req.user.userId;
        }

        const stats = await prisma.seller.groupBy({
            by: ['funnelStage'],
            where,
            _count: { id: true },
        });

        const result = {
            CONTACT: 0,
            INTERVIEW: 0,
            STRATEGY: 0,
            CONTRACT_SIGNING: 0,
        };

        stats.forEach((s) => {
            result[s.funnelStage as keyof typeof result] = s._count.id;
        });

        res.json(result);
    } catch (error) {
        console.error('Get funnel stats error:', error);
        res.status(500).json({ error: 'Ошибка получения статистики воронки' });
    }
});

// =========================================
// GET /api/sellers/archived - Получение архивных продавцов
// =========================================
sellersRouter.get(
    '/archived',
    requireRole('BROKER', 'ADMIN'),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId;
            const role = req.user!.role;

            const where = {
                isActive: false,
                ...(role === 'BROKER' ? { brokerId: userId } : {})
            };

            const sellers = await prisma.seller.findMany({
                where,
                include: {
                    broker: { select: { id: true, firstName: true, lastName: true } },
                    properties: true
                },
                orderBy: { updatedAt: 'desc' }
            });

            res.json(sellers);
        } catch (error) {
            console.error('Get archived sellers error:', error);
            res.status(500).json({ error: 'Ошибка получения архива' });
        }
    }
);

// =========================================
// GET /api/sellers/:id - Детали продавца
// =========================================
sellersRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const seller = await prisma.seller.findUnique({
            where: { id },
            include: {
                broker: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                    },
                },
                properties: {
                    where: { status: { not: 'ARCHIVED' } },
                    include: {
                        calculationLogs: {
                            orderBy: { createdAt: 'desc' },
                            take: 5,
                        },
                    },
                },
                documents: true,
            },
        });

        if (!seller) {
            res.status(404).json({ error: 'Продавец не найден' });
            return;
        }

        // Проверка прав доступа
        if (req.user?.role === 'BROKER' && seller.brokerId !== req.user.userId) {
            res.status(403).json({ error: 'Доступ запрещен' });
            return;
        }

        res.json(seller);
    } catch (error) {
        console.error('Get seller error:', error);
        res.status(500).json({ error: 'Ошибка получения продавца' });
    }
});

// =========================================
// POST /api/sellers - Создание продавца (этап Contact)
// =========================================
sellersRouter.post(
    '/',
    requireRole('BROKER', 'ADMIN'),
    validate(SellerContactStageSchema),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const data = req.body;

            // Проверка на дубликат по телефону
            const existing = await prisma.seller.findFirst({
                where: { phone: data.phone },
            });

            if (existing) {
                console.log(`Duplicate seller creation attempt: Phone ${data.phone} exists (ID: ${existing.id})`); // DEBUG
                res.status(400).json({
                    error: 'Продавец с таким телефоном уже существует',
                    existingSellerId: existing.id,
                });
                return;
            }

            const seller = await prisma.seller.create({
                data: {
                    ...data,
                    brokerId: req.user!.userId,
                    funnelStage: 'CONTACT',
                },
                include: {
                    broker: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            });

            res.status(201).json(seller);
        } catch (error) {
            console.error('Create seller error:', error);
            res.status(500).json({ error: 'Ошибка создания продавца' });
        }
    }
);

// =========================================
// PUT /api/sellers/:id/interview - Заполнение данных интервью
// =========================================
sellersRouter.put(
    '/:id/interview',
    requireRole('BROKER', 'ADMIN'),
    validate(SellerInterviewTransitionSchema),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const data = req.body;

            // Проверка существования
            const existing = await prisma.seller.findUnique({ where: { id } });

            if (!existing) {
                res.status(404).json({ error: 'Продавец не найден' });
                return;
            }

            // Проверка прав
            if (req.user?.role === 'BROKER' && existing.brokerId !== req.user.userId) {
                res.status(403).json({ error: 'Доступ запрещен' });
                return;
            }

            const seller = await prisma.seller.update({
                where: { id },
                data: {
                    ...data,
                    funnelStage: 'INTERVIEW',
                },
                include: {
                    broker: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    properties: true,
                },
            });

            res.json(seller);
        } catch (error) {
            console.error('Update seller interview error:', error);
            res.status(500).json({ error: 'Ошибка обновления данных интервью' });
        }
    }
);

// =========================================
// PUT /api/sellers/:id/stage - Изменение этапа воронки
// =========================================
const updateStageSchema = z.object({
    funnelStage: z.enum(['CONTACT', 'INTERVIEW', 'STRATEGY', 'CONTRACT_SIGNING', 'SOLD', 'ARCHIVED', 'CANCELLED']),
});

sellersRouter.put(
    '/:id/stage',
    requireRole('BROKER', 'ADMIN'),
    validate(updateStageSchema),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { funnelStage } = req.body;

            const existing = await prisma.seller.findUnique({ where: { id } });

            if (!existing) {
                res.status(404).json({ error: 'Продавец не найден' });
                return;
            }

            if (req.user?.role === 'BROKER' && existing.brokerId !== req.user.userId) {
                res.status(403).json({ error: 'Доступ запрещен' });
                return;
            }

            // Валидация перехода этапов (нельзя перескакивать)
            const stages = ['CONTACT', 'INTERVIEW', 'STRATEGY', 'CONTRACT_SIGNING', 'SOLD', 'ARCHIVED', 'CANCELLED'];
            const currentIndex = stages.indexOf(existing.funnelStage);
            const newIndex = stages.indexOf(funnelStage);

            // SOLD, ARCHIVED и CANCELLED можно устанавливать из любого этапа
            // Для остальных - можно двигаться только на 1 шаг вперёд или назад
            const isSpecialStage = funnelStage === 'SOLD' || funnelStage === 'ARCHIVED' || funnelStage === 'CANCELLED';
            if (!isSpecialStage && Math.abs(newIndex - currentIndex) > 1) {
                res.status(400).json({
                    error: 'Нельзя перескакивать этапы воронки',
                    currentStage: existing.funnelStage,
                    requestedStage: funnelStage,
                });
                return;
            }

            // Если этап меняется на "CONTRACT_SIGNING / Договор", активируем связанные объекты
            let activatedPropertiesCount = 0;
            if (funnelStage === 'CONTRACT_SIGNING') {
                // Find properties in preliminary stages
                const propertiesToActivate = await prisma.crmProperty.findMany({
                    where: {
                        sellerId: id,
                        funnelStage: { in: ['CREATED', 'PREPARATION'] },
                    },
                });

                if (propertiesToActivate.length > 0) {
                    // Update to LEADS (Marketing / Shows started)
                    await prisma.crmProperty.updateMany({
                        where: {
                            id: { in: propertiesToActivate.map(p => p.id) },
                        },
                        data: {
                            funnelStage: 'LEADS', // Active marketing
                            status: 'ACTIVE',
                        },
                    });
                    activatedPropertiesCount = propertiesToActivate.length;

                    // Send Notification to Broker
                    await prisma.notification.create({
                        data: {
                            userId: existing.brokerId,
                            type: 'SYSTEM',
                            title: 'Продажа запущена! 🚀',
                            message: `Договор с ${existing.firstName} подписан. ${activatedPropertiesCount} объект(ов) переведены в статус "Лиды" и доступны для показов.`,
                            isRead: false,
                        },
                    });
                }
            }

            const seller = await prisma.seller.update({
                where: { id },
                data: { funnelStage },
            });

            res.json({ ...seller, activatedPropertiesCount });
        } catch (error) {
            console.error('Update seller stage error:', error);
            res.status(500).json({ error: 'Ошибка изменения этапа' });
        }
    }
);

// =========================================
// PUT /api/sellers/:id - Обновление продавца
// =========================================
sellersRouter.put(
    '/:id',
    requireRole('BROKER', 'ADMIN'),
    validate(SellerUpdateSchema),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const data = req.body;

            const existing = await prisma.seller.findUnique({ where: { id } });

            if (!existing) {
                res.status(404).json({ error: 'Продавец не найден' });
                return;
            }

            if (req.user?.role === 'BROKER' && existing.brokerId !== req.user.userId) {
                res.status(403).json({ error: 'Доступ запрещен' });
                return;
            }

            const seller = await prisma.seller.update({
                where: { id },
                data,
                include: {
                    broker: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    properties: true,
                },
            });

            res.json(seller);
        } catch (error) {
            console.error('Update seller error:', error);
            res.status(500).json({ error: 'Ошибка обновления продавца' });
        }
    }
);

// =========================================
// DELETE /api/sellers/:id - Архивация продавца (soft delete)
// =========================================
sellersRouter.delete(
    '/:id',
    requireRole('BROKER', 'ADMIN'),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = req.user!.userId;
            const role = req.user!.role;

            const existing = await prisma.seller.findUnique({
                where: { id },
                include: { properties: true },
            });

            if (!existing) {
                res.status(404).json({ error: 'Продавец не найден' });
                return;
            }

            // BROKER может архивировать только своих продавцов
            if (role === 'BROKER' && existing.brokerId !== userId) {
                res.status(403).json({ error: 'Нет прав на архивацию этого продавца' });
                return;
            }

            // Архивируем продавца и все его объекты
            await prisma.$transaction(async (tx) => {
                // Архивируем все объекты продавца
                await tx.crmProperty.updateMany({
                    where: { sellerId: id },
                    data: { status: 'ARCHIVED' }
                });

                // Архивируем продавца
                await tx.seller.update({
                    where: { id },
                    data: { isActive: false }
                });
            });

            res.json({ success: true, message: 'Продавец и его объекты архивированы' });
        } catch (error) {
            console.error('Archive seller error:', error);
            res.status(500).json({ error: 'Ошибка архивации продавца' });
        }
    }
);


// =========================================
// POST /api/sellers/:id/restore - Восстановление из архива
// =========================================
sellersRouter.post(
    '/:id/restore',
    requireRole('BROKER', 'ADMIN'),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = req.user!.userId;
            const role = req.user!.role;

            const existing = await prisma.seller.findUnique({ where: { id } });

            if (!existing) {
                res.status(404).json({ error: 'Продавец не найден' });
                return;
            }

            if (role === 'BROKER' && existing.brokerId !== userId) {
                res.status(403).json({ error: 'Нет прав на восстановление этого продавца' });
                return;
            }

            // Восстанавливаем продавца и его объекты
            await prisma.$transaction(async (tx) => {
                await tx.crmProperty.updateMany({
                    where: { sellerId: id, status: 'ARCHIVED' },
                    data: { status: 'ACTIVE' }
                });

                await tx.seller.update({
                    where: { id },
                    data: { isActive: true }
                });
            });

            res.json({ success: true, message: 'Продавец восстановлен из архива' });
        } catch (error) {
            console.error('Restore seller error:', error);
            res.status(500).json({ error: 'Ошибка восстановления' });
        }
    }
);

// =========================================
// DELETE /api/sellers/:id/permanent - Полное удаление (ADMIN only)
// =========================================
// =========================================
// DELETE /api/sellers/:id/permanent - Полное удаление
// =========================================
sellersRouter.delete(
    '/:id/permanent',
    requireRole('BROKER', 'ADMIN'), // Allow Broker
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = req.user!.userId;
            const role = req.user!.role;

            const existing = await prisma.seller.findUnique({
                where: { id },
                include: { properties: true }
            });

            if (!existing) {
                res.status(404).json({ error: 'Продавец не найден' });
                return;
            }

            // Broker can only delete own sellers
            if (role === 'BROKER' && existing.brokerId !== userId) {
                res.status(403).json({ error: 'Нет прав на удаление этого продавца' });
                return;
            }

            // Удаляем все связанные объекты и продавца
            await prisma.$transaction(async (tx) => {
                await tx.crmProperty.deleteMany({ where: { sellerId: id } });
                await tx.seller.delete({ where: { id } });
            });

            res.json({ success: true, message: 'Продавец полностью удалён' });
        } catch (error) {
            console.error('Permanent delete seller error:', error);
            res.status(500).json({ error: 'Ошибка удаления' });
        }
    }
);
