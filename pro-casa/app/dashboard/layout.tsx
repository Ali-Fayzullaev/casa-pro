"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { getToken, isTokenExpired } from "@/lib/auth-utils"
import { StrategyProvider } from "@/lib/strategy-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token || isTokenExpired(token)) {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      router.push("/login")
    } else {
      setLoading(false)
    }
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
      <StrategyProvider>
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
      </StrategyProvider>
    </SidebarProvider>
  )
}
