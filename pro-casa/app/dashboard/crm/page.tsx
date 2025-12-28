import { KanbanBoard } from "@/components/crm/kanban-board";
import { DealsTable } from "@/components/crm/deals-table";
import { ClientsTable } from "@/components/crm/clients-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function CRMPage() {
  return (
    <div className="h-full flex flex-col p-4 md:p-8 pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">CRM</h2>
          <p className="text-muted-foreground">
            Управление сделками и клиентской базой
          </p>
        </div>
      </div>
      <Separator />

      <Tabs defaultValue="kanban" className="flex-1 flex flex-col h-full overflow-hidden">
        <TabsList>
          <TabsTrigger value="kanban">Канбан</TabsTrigger>
          <TabsTrigger value="list">Список сделок</TabsTrigger>
          <TabsTrigger value="clients">База клиентов</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden mt-4 h-full">
          <TabsContent value="kanban" className="h-full m-0">
            <KanbanBoard />
          </TabsContent>
          <TabsContent value="list" className="h-full m-0 overflow-auto">
            <DealsTable />
          </TabsContent>
          <TabsContent value="clients" className="h-full m-0 overflow-auto">
            <ClientsTable />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
