'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Calendar, 
  Home,
  Edit,
  Grid3x3,
  Trash2,
} from 'lucide-react';
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
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  name: string;
  description?: string;
  city: string;
  address: string;
  class?: string;
  deliveryDate?: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
  developer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  apartments: any[];
  apartmentStats: {
    total: number;
    available: number;
    reserved: number;
    sold: number;
  };
}

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  
  // Получаем роль пользователя
  const user = typeof window !== 'undefined' 
    ? JSON.parse(localStorage.getItem('user') || '{}')
    : {};
  const canEditProject = user.role === 'DEVELOPER' || user.role === 'ADMIN';

  useEffect(() => {
    fetchProject();
  }, [params.id]);

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No auth token found');
        router.push('/login');
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects/${params.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch project:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to fetch project');
      }

      const data = await response.json();
      setProject(data);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching project:', error);
      setError(error.message || 'Не удалось загрузить проект');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects/${project.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Не удалось удалить проект');
      }

      toast({
        title: 'Успешно',
        description: 'Проект удален',
      });
      
      router.push('/dashboard/projects');
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
        <Building2 className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">Проект не найден</p>
        <p className="text-sm text-muted-foreground">{error || 'Проверьте URL или вернитесь к списку'}</p>
        <Button onClick={() => router.push('/dashboard/projects')}>
          Вернуться к списку проектов
        </Button>
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
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <MapPin className="h-4 w-4" />
              {project.city}, {project.address}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/projects/${project.id}/apartments`)}
          >
            <Grid3x3 className="mr-2 h-4 w-4" />
            Шахматка
          </Button>
          {canEditProject && (
            <>
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/projects/${project.id}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Редактировать
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Удалить
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Основная информация */}
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.class && (
              <div>
                <p className="text-sm text-muted-foreground">Класс</p>
                <Badge variant="outline" className="mt-1">{project.class}</Badge>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Срок сдачи
              </p>
              <p className="font-medium">{formatDate(project.deliveryDate)}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Застройщик
              </p>
              <p className="font-medium">
                {project.developer.firstName} {project.developer.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{project.developer.email}</p>
              {project.developer.phone && (
                <p className="text-sm text-muted-foreground">{project.developer.phone}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Статистика квартир */}
        <Card>
          <CardHeader>
            <CardTitle>Статистика квартир</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Всего квартир:</span>
              </div>
              <span className="text-2xl font-bold">{project.apartmentStats.total}</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Доступно</span>
                <span className="text-lg font-bold text-green-600">
                  {project.apartmentStats.available}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Забронировано</span>
                <span className="text-lg font-bold text-yellow-600">
                  {project.apartmentStats.reserved}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Продано</span>
                <span className="text-lg font-bold text-gray-600">
                  {project.apartmentStats.sold}
                </span>
              </div>
            </div>

            {/* Прогресс бар */}
            <div className="pt-2">
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                <div className="flex h-full">
                  <div
                    className="bg-green-500"
                    style={{
                      width: `${
                        (project.apartmentStats.available / project.apartmentStats.total) * 100
                      }%`,
                    }}
                  />
                  <div
                    className="bg-yellow-500"
                    style={{
                      width: `${
                        (project.apartmentStats.reserved / project.apartmentStats.total) * 100
                      }%`,
                    }}
                  />
                  <div
                    className="bg-gray-500"
                    style={{
                      width: `${
                        (project.apartmentStats.sold / project.apartmentStats.total) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>
                  {((project.apartmentStats.available / project.apartmentStats.total) * 100).toFixed(0)}% доступно
                </span>
                <span>
                  {((project.apartmentStats.sold / project.apartmentStats.total) * 100).toFixed(0)}% продано
                </span>
              </div>
            </div>

            <Button
              className="w-full mt-4"
              onClick={() => router.push(`/dashboard/projects/${project.id}/apartments`)}
            >
              <Grid3x3 className="mr-2 h-4 w-4" />
              Открыть шахматку
            </Button>
          </CardContent>
        </Card>

        {/* Дополнительная информация */}
        <Card>
          <CardHeader>
            <CardTitle>Статистика по комнатам</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4].map((rooms) => {
              const count = project.apartments.filter((apt) => apt.rooms === rooms).length;
              if (count === 0) return null;

              return (
                <div key={rooms} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {rooms}-комнатные
                  </span>
                  <span className="font-medium">{count} шт.</span>
                </div>
              );
            })}

            {project.apartments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Квартиры еще не добавлены
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Описание */}
      {project.description && (
        <Card>
          <CardHeader>
            <CardTitle>Описание</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{project.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Список квартир в виде таблицы */}
      {project.apartments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Квартиры ({project.apartments.length})</CardTitle>
            <CardDescription>Все квартиры в проекте</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">№</th>
                    <th className="text-left py-2 px-4">Этаж</th>
                    <th className="text-left py-2 px-4">Комнат</th>
                    <th className="text-left py-2 px-4">Площадь</th>
                    <th className="text-left py-2 px-4">Цена</th>
                    <th className="text-left py-2 px-4">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {project.apartments.slice(0, 10).map((apt) => (
                    <tr key={apt.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-4 font-medium">{apt.number}</td>
                      <td className="py-2 px-4">{apt.floor}</td>
                      <td className="py-2 px-4">{apt.rooms}</td>
                      <td className="py-2 px-4">{apt.area} м²</td>
                      <td className="py-2 px-4">
                        {new Intl.NumberFormat('ru-KZ', {
                          style: 'currency',
                          currency: 'KZT',
                          minimumFractionDigits: 0,
                        }).format(apt.price)}
                      </td>
                      <td className="py-2 px-4">
                        <Badge
                          variant={
                            apt.status === 'AVAILABLE'
                              ? 'default'
                              : apt.status === 'RESERVED'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {apt.status === 'AVAILABLE' && 'Доступно'}
                          {apt.status === 'RESERVED' && 'Забронировано'}
                          {apt.status === 'SOLD' && 'Продано'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {project.apartments.length > 10 && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/dashboard/projects/${project.id}/apartments`)}
                >
                  Показать все {project.apartments.length} квартир
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Диалог подтверждения удаления */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить проект?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены что хотите удалить проект "{project?.name}"?
              Это действие нельзя отменить. Все квартиры и данные будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Удаление...' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
