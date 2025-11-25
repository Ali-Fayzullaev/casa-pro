'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { useToast } from '@/hooks/use-toast';

export default function NewProjectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    city: '',
    address: '',
    class: 'Комфорт',
    deliveryDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Ошибка создания проекта');
      }

      const data = await response.json();

      toast({
        title: '✅ Проект создан!',
        description: `Жилой комплекс "${formData.name}" успешно добавлен`,
      });

      router.push(`/dashboard/projects/${data.id}`);
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({
        title: '❌ Ошибка',
        description: error.message || 'Не удалось создать проект',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Новый жилой комплекс</h1>
          <p className="text-muted-foreground">
            Добавьте новостройку в систему
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
              <CardDescription>
                Заполните данные о жилом комплексе
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название *</Label>
                <Input
                  id="name"
                  placeholder="ЖК Алматы Тауэрс"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  placeholder="Премиум класс в центре города..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">Город *</Label>
                  <Input
                    id="city"
                    placeholder="Алматы"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="class">Класс</Label>
                  <Select
                    value={formData.class}
                    onValueChange={(value) => handleChange('class', value)}
                  >
                    <SelectTrigger id="class">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Эконом">Эконом</SelectItem>
                      <SelectItem value="Комфорт">Комфорт</SelectItem>
                      <SelectItem value="Бизнес">Бизнес</SelectItem>
                      <SelectItem value="Премиум">Премиум</SelectItem>
                      <SelectItem value="Элитный">Элитный</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="address">Адрес *</Label>
                  <Input
                    id="address"
                    placeholder="ул. Абая, 150"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryDate">Дата сдачи</Label>
                  <Input
                    id="deliveryDate"
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => handleChange('deliveryDate', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Отмена
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Создание...' : 'Создать проект'}
          </Button>
        </div>
      </form>
    </div>
  );
}
