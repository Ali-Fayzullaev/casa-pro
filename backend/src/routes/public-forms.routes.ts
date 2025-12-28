import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { DealStage, DealStatus } from '@prisma/client';
import { z } from 'zod';

export const publicFormsRouter = Router();

// Get Form Definition (Public)
publicFormsRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const form = await prisma.leadForm.findUnique({
            where: { id: req.params.id },
            select: { id: true, title: true, fields: true, isActive: true }
        });
        if (!form) {
            res.status(404).json({ error: 'Form not found' });
            return;
        }
        res.json(form);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Submit Form (Public)
publicFormsRouter.post('/:id/submit', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { brokerId, ...formData } = req.body; // Form data + optional brokerId

        const form = await prisma.leadForm.findUnique({
            where: { id },
            include: { brokers: true }
        });

        if (!form || !form.isActive) {
            res.status(404).json({ error: 'Form not found or inactive' });
            return;
        }

        let assignedBrokerId = brokerId;

        // Logic for Round Robin if no specific broker provided
        if (!assignedBrokerId && form.distributionType === 'ROUND_ROBIN' && form.brokers.length > 0) {
            // Find broker with LEAST deals today or just strict rotation
            // Simple Round Robin: Find last deal created from this form, see who got it, pick next.
            // OR: Random for now, or fetch usage stats.
            // Let's implement simple "Least Recently Used" or "Random" for simplicity first version.

            // Random distribution among enabled brokers
            const randomIndex = Math.floor(Math.random() * form.brokers.length);
            assignedBrokerId = form.brokers[randomIndex].id;
        }

        let isFallback = false;
        if (!assignedBrokerId) {
            // Fallback to Admin or leave unassigned?
            // Let's assign to first available admin if no broker found
            const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
            assignedBrokerId = admin?.id;
            isFallback = true;
        }

        if (!assignedBrokerId) {
            res.status(500).json({ error: 'No broker available to assign deal' });
            return;
        }

        // Create Deal
        // Extract Client info from form data
        // Usually form has: name, phone. We should parsing it.
        // We assume fields "name" and "phone" exist or mapping.
        // For MVP, we dump everything into notes, and try to find Name/Phone.

        // Find fields by label or key?
        // Let's assume frontend sends { "Имя": "John", "Телефон": "+7700..." } based on labels.

        // Robust way: key-value.
        // Intelligent Field Mapping
        const normalizedData: Record<string, string> = {};
        for (const [key, value] of Object.entries(formData)) {
            normalizedData[key.toLowerCase()] = String(value);
        }

        // Extract Standard Fields
        const nameVal =
            normalizedData['имя'] ||
            normalizedData['name'] ||
            normalizedData['fio'] ||
            'Unknown';

        const phoneVal =
            normalizedData['телефон'] ||
            normalizedData['phone'] ||
            normalizedData['tel'] ||
            '';

        const budgetVal =
            normalizedData['бюджет'] ||
            normalizedData['budget'] ||
            normalizedData['цена'] ||
            '0';

        const notesVal =
            normalizedData['примечание'] ||
            normalizedData['комментарий'] ||
            normalizedData['notes'] ||
            normalizedData['comment'] ||
            '';

        const typeVal =
            normalizedData['тип недвижимости'] ||
            normalizedData['тип'] ||
            normalizedData['type'] ||
            'PROPERTY';

        // Build generic notes from ALL fields for safety
        const fullNoteContent = Object.entries(formData)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');

        // Check/Create Client
        let client;
        if (phoneVal) {
            client = await prisma.client.findFirst({ where: { phone: phoneVal } });
            if (!client) {
                client = await prisma.client.create({
                    data: {
                        firstName: nameVal,
                        lastName: 'Form Lead',
                        phone: phoneVal,
                        brokerId: assignedBrokerId,
                        iin: `LEAD-${Date.now()}`,
                        status: 'NEW',
                        clientType: 'BUYER',
                        budget: parseFloat(budgetVal) || 0, // Map Budget
                        notes: `Источник: Форма "${form.title}"`
                    }
                });
            }
        }

        const deal = await prisma.deal.create({
            data: {
                brokerId: assignedBrokerId,
                clientId: client?.id,
                amount: parseFloat(budgetVal) || 0, // Map Budget
                commission: 0,
                casaFee: 0,
                notes: `Заявка с сайта (${form.title})\n${isFallback ? '[WARNING: No brokers assigned to form, sent to Admin]\n' : ''}\n${fullNoteContent}`, // Full dump + Specific notes
                source: brokerId ? 'FORM_PERSONAL' : 'BOT_DISTRIBUTION',
                stage: DealStage.CONSULTATION,
                status: DealStatus.IN_PROGRESS,
                objectType: 'PROPERTY',
                // We could map objectType from typeVal if it matches enum/string expected
            }
        });

        // Notify Broker
        await prisma.notification.create({
            data: {
                userId: assignedBrokerId,
                type: 'DEAL',
                title: 'Новая заявка',
                message: `Поступила новая заявка "${form.title}" от ${nameVal}. Бюджет: ${budgetVal}`,
                isRead: false
            }
        });

        res.json({ success: true, message: 'Application received', dealId: deal.id });

    } catch (error) {
        console.error('Submit form error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
