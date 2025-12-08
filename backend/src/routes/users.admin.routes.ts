import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const usersAdminRouter = Router();

// Все routes требуют ADMIN роли
usersAdminRouter.use(authenticate);
usersAdminRouter.use(requireRole('ADMIN'));

// GET /api/admin/users - получить всех пользователей (ADMIN only)
usersAdminRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Admin fetching all users');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Ошибка получения списка пользователей' });
  }
});

// GET /api/admin/users/:id/full - получить полные данные пользователя (ADMIN only)
// ВАЖНО: этот роут должен быть ДО /:id чтобы не конфликтовать
usersAdminRouter.get('/:id/full', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    console.log('Admin fetching full user data:', id);

    const user = await prisma.user.findUnique({
      where: { id },
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
        courseProgress: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    res.json({ ...user, balance: Number(user.balance) });
  } catch (error) {
    console.error('Get user full error:', error);
    res.status(500).json({ error: 'Ошибка получения данных пользователя' });
  }
});

// POST /api/admin/users - создать пользователя (ADMIN only)
usersAdminRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;

    console.log('Admin creating user:', email, 'with role:', role);

    // Валидация
    if (!email || !password || !firstName || !lastName || !role) {
      res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
      return;
    }

    // Проверка допустимых ролей
    if (!['BROKER', 'DEVELOPER', 'ADMIN'].includes(role)) {
      res.status(400).json({ error: 'Недопустимая роль. Используйте: BROKER, DEVELOPER или ADMIN' });
      return;
    }

    // Проверка существования пользователя
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({ error: 'Пользователь с таким email уже существует' });
      return;
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    console.log('User created successfully:', user.id);

    res.status(201).json({
      message: 'Пользователь успешно создан',
      user,
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Ошибка создания пользователя' });
  }
});

// PUT /api/admin/users/:id - обновить пользователя (ADMIN only)
usersAdminRouter.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, phone, role } = req.body;

    console.log('Admin updating user:', id);

    // Проверка существования
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    // Проверка email на уникальность (если меняется)
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        res.status(400).json({ error: 'Email уже используется другим пользователем' });
        return;
      }
    }

    // Проверка роли
    if (role && !['BROKER', 'DEVELOPER', 'ADMIN'].includes(role)) {
      res.status(400).json({ error: 'Недопустимая роль' });
      return;
    }

    // Обновляем
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(email && { email }),
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone }),
        ...(role && { role }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({
      message: 'Пользователь успешно обновлен',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Ошибка обновления пользователя' });
  }
});

// DELETE /api/admin/users/:id - удалить пользователя (ADMIN only)
usersAdminRouter.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    console.log('Admin deleting user:', id);

    // Проверяем что не удаляем самого себя
    if (req.user?.userId === id) {
      res.status(400).json({ error: 'Нельзя удалить собственный аккаунт' });
      return;
    }

    // Проверка существования
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    // Удаляем
    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: 'Пользователь успешно удален' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Ошибка удаления пользователя' });
  }
});

// POST /api/admin/users/:id/reset-password - сбросить пароль (ADMIN only)
usersAdminRouter.post('/:id/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    console.log('Admin resetting password for user:', id);

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов' });
      return;
    }

    // Проверка существования
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    // Хешируем новый пароль
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Обновляем пароль
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Пароль успешно сброшен' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Ошибка сброса пароля' });
  }
});

// PUT /api/admin/users/:id/curator - установить куратора для брокера (ADMIN only)
usersAdminRouter.put('/:id/curator', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { curatorName, curatorPhone, curatorEmail, curatorWhatsApp } = req.body;

    console.log('Admin setting curator for user:', id);

    // Проверка существования
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    // Обновляем данные куратора
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        curatorName,
        curatorPhone,
        curatorEmail,
        curatorWhatsApp,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        curatorName: true,
        curatorPhone: true,
        curatorEmail: true,
        curatorWhatsApp: true,
      },
    });

    res.json({
      message: 'Данные куратора успешно обновлены',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Set curator error:', error);
    res.status(500).json({ error: 'Ошибка обновления данных куратора' });
  }
});

export { usersAdminRouter };
