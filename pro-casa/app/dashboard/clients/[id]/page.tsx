'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Mail, Phone, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Client {
  id: string;
  iin: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone: string;
  email?: string;
  status: 'NEW' | 'IN_PROGRESS' | 'DEAL_CLOSED' | 'REJECTED';
  notes?: string;
  monthlyIncome?: number;
  initialPayment?: number;
  createdAt: string;
  updatedAt: string;
  broker: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  bookings: any[];
  documents: any[];
  mortgageCalculations: any[];
}

const statusLabels = {
  NEW: 'Новый',
  IN_PROGRESS: 'В работе',
  DEAL_CLOSED: 'Сделка закрыта',
  REJECTED: 'Отклонен',
};

const statusColors = {
  NEW: 'bg-blue-500',
  IN_PROGRESS: 'bg-yellow-500',
  DEAL_CLOSED: 'bg-green-500',
  REJECTED: 'bg-red-500',
};

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchClient();
  }, [params.id]);

  const fetchClient = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/clients/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch client');
      }

      const data = await response.json();
      setClient(data);
    } catch (error) {
      console.error('Error fetching client:', error);
      router.push('/dashboard/clients');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/clients/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete client');
      }

      router.push('/dashboard/clients');
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Ошибка при удалении клиента');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '—';
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Клиент не найден</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {client.lastName} {client.firstName} {client.middleName}
            </h1>
            <p className="text-muted-foreground">ИИН: {client.iin}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/clients/${client.id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Редактировать
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Удалить
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить клиента?</AlertDialogTitle>
                <AlertDialogDescription>
                  Это действие нельзя отменить. Все данные клиента, включая документы,
                  брони и расчеты будут удалены.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deleting ? 'Удаление...' : 'Удалить'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Статус</p>
              <Badge className={statusColors[client.status]}>
                {statusLabels[client.status]}
              </Badge>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Телефон
              </p>
              <p className="font-medium">{client.phone}</p>
            </div>

            {client.email && (
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </p>
                <p className="font-medium">{client.email}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Дата создания
              </p>
              <p className="font-medium">{formatDate(client.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Финансовая информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Ежемесячный доход</p>
              <p className="font-medium text-lg">{formatCurrency(client.monthlyIncome)}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Первоначальный взнос</p>
              <p className="font-medium text-lg">{formatCurrency(client.initialPayment)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Брокер</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">ФИО</p>
              <p className="font-medium">
                {client.broker.firstName} {client.broker.lastName}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{client.broker.email}</p>
            </div>

            {client.broker.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Телефон</p>
                <p className="font-medium">{client.broker.phone}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {client.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Заметки
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Брони</CardTitle>
            <CardDescription>Забронированные квартиры</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{client.bookings.length}</p>
            {client.bookings.length > 0 && (
              <Button variant="link" className="mt-2 p-0 h-auto">
                Посмотреть все брони
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Документы</CardTitle>
            <CardDescription>Загруженные файлы</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{client.documents.length}</p>
            {client.documents.length > 0 && (
              <Button variant="link" className="mt-2 p-0 h-auto">
                Посмотреть документы
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Расчеты ипотеки</CardTitle>
            <CardDescription>Сохраненные расчеты</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{client.mortgageCalculations.length}</p>
            {client.mortgageCalculations.length > 0 && (
              <Button variant="link" className="mt-2 p-0 h-auto">
                Посмотреть расчеты
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
