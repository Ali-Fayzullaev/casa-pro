import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);

// GET /api/dashboard/stats - основная статистика для дашборда
dashboardRouter.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // Специальная статистика для девелопера
    if (userRole === 'DEVELOPER') {
      const [
        totalProjects,
        totalApartments,
        activeBookings,
      ] = await Promise.all([
        prisma.project.count({ where: { developerId: userId } }),
        prisma.apartment.count({
          where: { project: { developerId: userId } },
        }),
        prisma.booking.count({
          where: {
            apartment: { project: { developerId: userId } },
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
        }),
      ]);

      res.json({
        totalClients: totalApartments,
        totalDeals: totalProjects,
        totalIncome: 0,
        balance: activeBookings,
        clientsTrend: 0,
        dealsTrend: 0,
        salesChart: [],
      });
      return;
    }

    // Месяц назад
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Filter for BROKER and REALTOR
    const isRestricted = userRole === 'BROKER' || userRole === 'REALTOR';
    const where: any = isRestricted ? { brokerId: userId } : {};

    // Получаем статистику
    const [
      totalClients,
      newClientsThisMonth,
      completedDeals,
      totalDeals,
      dealsThisMonth,
      totalBookings,
      activeBookings,
    ] = await Promise.all([
      prisma.client.count({ where }),
      prisma.client.count({
        where: {
          ...where,
          createdAt: { gte: oneMonthAgo },
        },
      }),
      prisma.deal.findMany({
        where: {
          ...where,
          status: 'COMPLETED',
        },
        select: {
          amount: true,
          commission: true,
          casaFee: true,
          completedAt: true,
        },
      }),
      prisma.deal.count({
        where,
      }),
      prisma.deal.count({
        where: {
          ...where,
          createdAt: { gte: oneMonthAgo },
        },
      }),
      prisma.booking.count({
        where,
      }),
      prisma.booking.count({
        where: {
          ...where,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      }),
    ]);

    // Подсчитываем доходы
    const totalIncome = completedDeals.reduce(
      (sum, deal) => sum + Number(deal.commission),
      0
    );
    const totalCasaFee = completedDeals.reduce(
      (sum, deal) => sum + Number(deal.casaFee),
      0
    );
    const balance = totalIncome - totalCasaFee;

    // Группировка сделок по месяцам для графика
    const dealsGrouped: { [key: string]: { count: number; income: number } } = {};
    completedDeals.forEach((deal) => {
      if (deal.completedAt) {
        const monthKey = new Date(deal.completedAt).toISOString().slice(0, 7); // YYYY-MM
        if (!dealsGrouped[monthKey]) {
          dealsGrouped[monthKey] = { count: 0, income: 0 };
        }
        dealsGrouped[monthKey].count++;
        dealsGrouped[monthKey].income += Number(deal.commission);
      }
    });

    // Преобразуем в массив для графика (последние 6 месяцев)
    const salesChart = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7);
      const monthName = date.toLocaleDateString('ru-RU', { month: 'short' });

      salesChart.push({
        month: monthName,
        deals: dealsGrouped[monthKey]?.count || 0,
        income: dealsGrouped[monthKey]?.income || 0,
      });
    }

    // Тренды
    const clientsTrend = totalClients > 0
      ? Math.round((newClientsThisMonth / totalClients) * 100)
      : 0;
    const dealsTrend = totalDeals > 0
      ? Math.round((dealsThisMonth / totalDeals) * 100)
      : 0;

    res.json({
      totalClients,
      newClientsThisMonth,
      totalDeals: completedDeals.length,
      totalIncome,
      totalCasaFee,
      balance,
      totalBookings,
      activeBookings,
      clientsTrend,
      dealsTrend,
      salesChart,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

// GET /api/dashboard/recent-clients - последние клиенты
dashboardRouter.get('/recent-clients', async (req: Request, res: Response): Promise<void> => {
  try {
    const where: any = {};
    // Restricted roles
    if (req.user?.role === 'BROKER' || req.user?.role === 'REALTOR') {
      where.brokerId = req.user.userId;
    }

    const clients = await prisma.client.findMany({
      where,
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        clientType: true,
        createdAt: true,
      },
    });

    res.json(clients);
  } catch (error) {
    console.error('Get recent clients error:', error);
    res.status(500).json({ error: 'Ошибка получения списка клиентов' });
  }
});

// GET /api/dashboard/recent-properties - последние объекты
dashboardRouter.get('/recent-properties', async (req: Request, res: Response): Promise<void> => {
  try {
    const where: any = {};
    // Restricted roles
    if (req.user?.role === 'BROKER' || req.user?.role === 'REALTOR') {
      where.brokerId = req.user.userId;
    }

    // Будет работать после миграции
    const properties = await (prisma as any).property.findMany({
      where,
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        address: true,
        price: true,
        status: true,
        images: true,
        createdAt: true,
      },
    }).catch(() => []);

    res.json(properties);
  } catch (error) {
    console.error('Get recent properties error:', error);
    res.status(500).json({ error: 'Ошибка получения списка объектов' });
  }
});
