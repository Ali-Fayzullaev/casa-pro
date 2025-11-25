'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, Eye, Edit, Trash2 } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Client {
  id: string;
  iin: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone: string;
  email?: string;
  status: 'NEW' | 'IN_PROGRESS' | 'DEAL_CLOSED' | 'REJECTED';
  createdAt: string;
  broker: {
    firstName: string;
    lastName: string;
  };
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

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchClients();
  }, [page, statusFilter]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/clients?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }

      const data = await response.json();
      setClients(data.clients);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchClients();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Клиенты</h1>
          <p className="text-muted-foreground">Управление базой клиентов</p>
        </div>
        <Button onClick={() => router.push('/dashboard/clients/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить клиента
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
          <CardDescription>Поиск и фильтрация клиентов</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="flex gap-2">
                <Input
                  placeholder="Поиск по имени, ИИН или телефону..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="NEW">Новые</SelectItem>
                <SelectItem value="IN_PROGRESS">В работе</SelectItem>
                <SelectItem value="DEAL_CLOSED">Сделка закрыта</SelectItem>
                <SelectItem value="REJECTED">Отклонены</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Список клиентов</CardTitle>
          <CardDescription>Всего клиентов: {total}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <p className="text-muted-foreground">Загрузка...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground mb-2">Клиенты не найдены</p>
              <Button variant="outline" onClick={() => router.push('/dashboard/clients/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить первого клиента
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ИИН</TableHead>
                    <TableHead>ФИО</TableHead>
                    <TableHead>Телефон</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата создания</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-mono text-sm">{client.iin}</TableCell>
                      <TableCell className="font-medium">
                        {client.lastName} {client.firstName} {client.middleName}
                      </TableCell>
                      <TableCell>{client.phone}</TableCell>
                      <TableCell>{client.email || '—'}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[client.status]}>
                          {statusLabels[client.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(client.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/clients/${client.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Страница {page} из {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Назад
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Вперед
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
