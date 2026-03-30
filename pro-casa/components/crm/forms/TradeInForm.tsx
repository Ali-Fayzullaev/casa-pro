"use client"

import { useState, useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import api from "@/lib/api-client"
import { toast } from "sonner"
import type { CrmProperty } from "@/types/kanban"

interface Project {
  id: string
  name: string
}

interface Client {
  id: string
  firstName: string
  lastName: string
  phone: string
}

interface TradeInFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  property: CrmProperty
}

export function TradeInForm({ open, onOpenChange, property }: TradeInFormProps) {
  const queryClient = useQueryClient()

  const [projectId, setProjectId] = useState("")
  const [newApartmentPrice, setNewApartmentPrice] = useState("")
  const [commissionPercent, setCommissionPercent] = useState("1.5")
  const [clientId, setClientId] = useState("")
  const [notes, setNotes] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: () => api.get("/projects").then((r) => r.data),
    enabled: open,
  })

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: () => api.get("/clients").then((r) => r.data),
    enabled: open,
  })

  const commission = useMemo(() => {
    const price = Number(newApartmentPrice) || 0
    const percent = Number(commissionPercent) || 0
    return (price * percent) / 100
  }, [newApartmentPrice, commissionPercent])

  const casaFee = useMemo(() => commission * 0.2, [commission])

  const mutation = useMutation({
    mutationFn: (data: {
      sellerId: string
      projectId?: string
      oldPropertyId: string
      newApartmentPrice: number
      commissionPercent: number
      clientId?: string
      notes?: string
    }) => api.post("/deals/tradein", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] })
      toast.success("TradeIn сделка создана")
      resetAndClose()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Ошибка создания TradeIn")
    },
  })

  const resetAndClose = () => {
    setProjectId("")
    setNewApartmentPrice("")
    setCommissionPercent("1.5")
    setClientId("")
    setNotes("")
    setErrors({})
    onOpenChange(false)
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!newApartmentPrice || Number(newApartmentPrice) <= 0)
      newErrors.newApartmentPrice = "Цена должна быть больше 0"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    mutation.mutate({
      sellerId: property.seller?.id || "",
      oldPropertyId: property.id,
      projectId: projectId || undefined,
      newApartmentPrice: Number(newApartmentPrice),
      commissionPercent: Number(commissionPercent),
      clientId: clientId || undefined,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>TradeIn — обмен квартиры</DialogTitle>
          <DialogDescription>
            Создайте TradeIn-сделку для объекта «{property.residentialComplex}».
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>ЖК / Проект</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                {isLoadingProjects ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Загрузка...
                  </span>
                ) : (
                  <SelectValue placeholder="Выберите проект" />
                )}
              </SelectTrigger>
              <SelectContent>
                {(projects ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Цена новой квартиры (₸)</Label>
            <Input
              type="number"
              min="1"
              value={newApartmentPrice}
              onChange={(e) => setNewApartmentPrice(e.target.value)}
              placeholder="0"
            />
            {errors.newApartmentPrice && (
              <p className="text-sm text-destructive">{errors.newApartmentPrice}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Процент комиссии (%)</Label>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={commissionPercent}
              onChange={(e) => setCommissionPercent(e.target.value)}
              placeholder="1.5"
            />
          </div>

          {(Number(newApartmentPrice) > 0) && (
            <div className="rounded-lg border bg-muted/50 p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Комиссия:</span>
                <span className="font-medium">{commission.toLocaleString("ru-RU")} ₸</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Casa Fee (20%):</span>
                <span className="font-medium">{casaFee.toLocaleString("ru-RU")} ₸</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Клиент (необязательно)</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите клиента" />
              </SelectTrigger>
              <SelectContent>
                {(clients ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} ({c.phone})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Комментарий (необязательно)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Дополнительная информация..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={resetAndClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Создание..." : "Создать сделку"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
