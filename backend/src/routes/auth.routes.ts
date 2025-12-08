import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { generateToken } from '../lib/jwt';
import { z } from 'zod';
import { auth } from '../middleware/auth.middleware';

export const authRouter = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Login attempt for:', req.body.email);
    const { email, password } = loginSchema.parse(req.body);

    console.log('Searching for user:', email);
    // Найти пользователя
    const user = await prisma.user.findUnique({
      where: { email },
    });
    console.log('User found:', !!user);

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Неверные учетные данные' });
      return;
    }

    // Проверить пароль
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Неверные учетные данные' });
      return;
    }

    // Генерировать токен
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Отправить данные пользователя без пароля
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Неверные данные', details: error.errors });
      return;
    }
    res.status(500).json({ 
      error: 'Ошибка сервера',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/auth/me - получить текущего пользователя
authRouter.get('/me', auth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        balance: true,
        curatorName: true,
        curatorPhone: true,
        curatorEmail: true,
        curatorWhatsApp: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    res.json({
      ...user,
      balance: Number(user.balance),
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT /api/auth/profile - обновить профиль
authRouter.put('/profile', auth, async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        firstName,
        lastName,
        phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT /api/auth/change-password - изменить пароль
authRouter.put('/change-password', auth, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Заполните все поля' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
    });

    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      res.status(400).json({ error: 'Неверный текущий пароль' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Пароль успешно изменен' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
