"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { API_URL } from "@/lib/api-client"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check auth via cookie-based endpoint
    fetch(`${API_URL}/auth/check`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated');
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem("user")
        router.push("/login")
      });
  }, [router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto bg-muted/5">
          <div className="flex items-center p-4 md:hidden border-b bg-background sticky top-0 z-20">
            <SidebarTrigger />
            <span className="ml-2 font-semibold">Pro Casa</span>
          </div>
          <div className="container mx-auto p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  )
}
