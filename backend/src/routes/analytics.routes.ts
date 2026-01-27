import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth.middleware';

export const analyticsRouter = Router();

analyticsRouter.use(authenticate);

// GET /api/analytics/dashboard
analyticsRouter.get('/dashboard', async (req: Request, res: Response) => {
    try {
        // 1. KPI Data
        const activePropertiesCount = await prisma.crmProperty.count({
            where: { status: 'ACTIVE' }
        });

        const activeProperties = await prisma.crmProperty.findMany({
            where: { status: 'ACTIVE' },
            select: { price: true }
        });

        // Approx Commission: Sum of price * 2%
        const commissionForecast = activeProperties.reduce((sum, prop) => {
            return sum + (Number(prop.price) * 0.02);
        }, 0);

        const hotLeadsCount = await prisma.buyer.count({
            where: { status: 'ACTIVE' }
        });

        // Conversion: (Deals / Total Created) * 100
        const totalProperties = await prisma.crmProperty.count();
        const dealProperties = await prisma.crmProperty.count({ where: { funnelStage: 'DEAL' } });
        const conversionRate = totalProperties > 0 ? (dealProperties / totalProperties) * 100 : 0;

        // 2. Chart Data: Funnel
        const funnelRaw = await prisma.crmProperty.groupBy({
            by: ['funnelStage'],
            _count: { id: true }
        });

        // Format for Recharts
        const funnelChart = [
            { name: 'Создан', stage: 'CREATED', value: 0 },
            { name: 'Подготовка', stage: 'PREPARATION', value: 0 },
            { name: 'Лиды', stage: 'LEADS', value: 0 },
            { name: 'Показы', stage: 'SHOWS', value: 0 },
            { name: 'Сделка', stage: 'DEAL', value: 0 },
        ].map(step => {
            const found = funnelRaw.find(f => f.funnelStage === step.stage);
            return {
                ...step,
                value: found?._count.id || 0
            };
        });

        // 3. Activity Feed (Mocked or simple Aggregation)
        // Let's get last 5 properties updated
        const recentProperties = await prisma.crmProperty.findMany({
            take: 5,
            orderBy: { updatedAt: 'desc' },
            include: { seller: true }
        });

        const activityFeed = recentProperties.map(p => ({
            id: p.id,
            type: 'PROPERTY_UPDATE',
            title: `Обновление объекта: ${p.residentialComplex}`,
            description: `Этап: ${p.funnelStage}`,
            date: p.updatedAt
        }));

        // 4. Action Items (Risky Strategies)
        const actionItems = await prisma.crmProperty.findMany({
            where: {
                OR: [
                    { liquidityScore: { lt: 40 } },
                    { activeStrategy: 'LOW_LIQUIDITY' }
                ],
                status: 'ACTIVE'
            },
            take: 5,
            select: { id: true, residentialComplex: true, activeStrategy: true, liquidityScore: true }
        });

        res.json({
            kpi: {
                activeDeals: activePropertiesCount,
                commissionForecast,
                hotLeads: hotLeadsCount,
                conversionRate: Math.round(conversionRate)
            },
            charts: {
                funnel: funnelChart,
                // Dynamics could be mocked for now or calculated properly if we had history table
                dynamics: [
                    { date: '1 Jan', leads: 4 },
                    { date: '8 Jan', leads: 7 },
                    { date: '15 Jan', leads: 5 },
                    { date: '22 Jan', leads: 12 },
                    { date: '29 Jan', leads: 9 },
                ]
            },
            activity: activityFeed,
            actionItems
        });

    } catch (error) {
        console.error("Dashboard Analytics Error:", error);
        res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
});
