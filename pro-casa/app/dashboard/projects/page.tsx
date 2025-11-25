'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, MapPin, Calendar, Home, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface Project {
  id: string;
  name: string;
  description?: string;
  city: string;
  address: string;
  class?: string;
  deliveryDate?: string;
  images: string[];
  developer: {
    firstName: string;
    lastName: string;
  };
  apartmentStats: {
    total: number;
    available: number;
    reserved: number;
    sold: number;
  };
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [user, setUser] = useState<any>(null);

  // Получить информацию о пользователе
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  // Проверка прав на создание проекта (только DEVELOPER и ADMIN)
  const canCreateProject = user?.role === 'DEVELOPER' || user?.role === 'ADMIN';

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, cityFilter]);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (search) params.append('search', search);
      if (cityFilter !== 'all') params.append('city', cityFilter);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch projects');

      const data = await response.json();
      setProjects(data.projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
    });
  };

  const getAvailabilityColor = (available: number, total: number) => {
    const percent = (available / total) * 100;
    if (percent > 50) return 'text-green-600';
    if (percent > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Загрузка проектов...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Новостройки</h1>
          <p className="text-muted-foreground">
            Жилые комплексы и квартиры
          </p>
        </div>
        {canCreateProject && (
          <Button onClick={() => router.push('/dashboard/projects/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить ЖК
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск по названию или адресу..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Все города" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все города</SelectItem>
                <SelectItem value="Алматы">Алматы</SelectItem>
                <SelectItem value="Астана">Астана</SelectItem>
                <SelectItem value="Шымкент">Шымкент</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card
            key={project.id}
            className="cursor-pointer transition-all hover:shadow-lg"
            onClick={() => router.push(`/dashboard/projects/${project.id}`)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {project.city}
                  </CardDescription>
                </div>
                {project.class && (
                  <Badge variant="outline">{project.class}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-1">
                {project.address}
              </p>

              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {project.developer.firstName} {project.developer.lastName}
                </span>
              </div>

              {project.deliveryDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Сдача: {formatDate(project.deliveryDate)}
                  </span>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Квартир:</span>
                  </div>
                  <span className="font-bold">{project.apartmentStats.total}</span>
                </div>

                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div
                      className={`font-bold ${getAvailabilityColor(
                        project.apartmentStats.available,
                        project.apartmentStats.total
                      )}`}
                    >
                      {project.apartmentStats.available}
                    </div>
                    <div className="text-muted-foreground">Доступно</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-yellow-600">
                      {project.apartmentStats.reserved}
                    </div>
                    <div className="text-muted-foreground">Бронь</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-600">
                      {project.apartmentStats.sold}
                    </div>
                    <div className="text-muted-foreground">Продано</div>
                  </div>
                </div>

                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div className="flex h-full">
                    <div
                      className="bg-green-500"
                      style={{
                        width: `${
                          (project.apartmentStats.available /
                            project.apartmentStats.total) *
                          100
                        }%`,
                      }}
                    />
                    <div
                      className="bg-yellow-500"
                      style={{
                        width: `${
                          (project.apartmentStats.reserved /
                            project.apartmentStats.total) *
                          100
                        }%`,
                      }}
                    />
                    <div
                      className="bg-gray-500"
                      style={{
                        width: `${
                          (project.apartmentStats.sold /
                            project.apartmentStats.total) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium">Проекты не найдены</p>
          <p className="text-sm text-muted-foreground">
            Попробуйте изменить параметры поиска
          </p>
        </div>
      )}
    </div>
  );
}
