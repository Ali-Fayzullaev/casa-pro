"use client"

import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  Home,
  Users,
  Building2,
  Calculator,
  User,
  Calendar,
  Grid3x3,
  BarChart3,
  LogOut,
  Shield,
  DollarSign,
  Building,
  ChevronRight,
  Briefcase,
  GraduationCap,
  Wallet,
  MessageCircle,
  FileText,
  Scale,
  Settings,
  Target,
  LayoutList, // NEW
  Archive,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { NotificationBell } from "@/components/notification-bell"

// Menu structure according to Casa PRO v1 ТЗ (5 main sections for broker)
interface MenuItem {
  title: string
  icon: any
  url?: string
  roles: string[]
  subItems?: {
    title: string
    url: string
    icon?: any
  }[]
}

interface MenuSection {
  title: string
  icon: any
  url?: string
  roles: string[]
  subItems?: {
    title: string
    url: string
    icon?: any
  }[]
}

const menuItems: MenuSection[] = [
  // 1. Главная - Dashboard
  {
    title: "Главная",
    icon: Home,
    url: "/dashboard",
    roles: ["ADMIN", "BROKER", "DEVELOPER", "REALTOR", "AGENCY"],
  },
  // 2. Сделки (CRM) - единая страница с вкладками
  {
    title: "Сделки (CRM)",
    icon: Briefcase,
    url: "/dashboard/crm",
    roles: ["ADMIN", "BROKER", "DEVELOPER", "REALTOR", "AGENCY"],
  },
  // 2.1 Стратегии - справочник
  {
    title: "Стратегии (CASA)",
    icon: Target,
    url: "/dashboard/strategies",
    roles: ["ADMIN", "BROKER", "DEVELOPER"],
  },
  // 2.2 Команда (Agency only)
  {
    title: "Команда",
    icon: Users,
    url: "/dashboard/agency/team",
    roles: ["AGENCY"],
  },
  // 2.3 Список объектов (List View)
  {
    title: "Мои объекты",
    icon: LayoutList,
    url: "/dashboard/properties",
    roles: ["ADMIN", "BROKER", "REALTOR", "AGENCY"],
  },
  // 2.4 Клиенты (Sellers List)
  {
    title: "Клиенты",
    icon: Users,
    url: "/dashboard/sellers",
    roles: ["AGENCY", "REALTOR", "DEVELOPER"],
  },
  // 3. Новостройки - collapsible
  {
    title: "Новостройки",
    icon: Building2,
    roles: ["ADMIN", "BROKER", "DEVELOPER", "REALTOR", "AGENCY"],
    subItems: [
      { title: "Каталог ЖК", url: "/dashboard/projects", icon: Building2 },
      { title: "Шахматка", url: "/dashboard/chess", icon: Grid3x3 },
    ],
  },
  // 4. Ипотека - одна кнопка без подразделов
  {
    title: "Ипотека",
    icon: Calculator,
    url: "/dashboard/mortgage",
    roles: ["ADMIN", "BROKER", "DEVELOPER", "REALTOR", "AGENCY"],
  },
  // 5. Профиль - одна кнопка без подразделов (табы внутри страницы)
  {
    title: "Профиль",
    icon: User,
    url: "/dashboard/profile",
    roles: ["ADMIN", "BROKER", "DEVELOPER", "REALTOR", "AGENCY"],
  },
  // 6. Формы (Admin)
  {
    title: "Формы",
    icon: FileText,
    url: "/dashboard/forms",
    roles: ["ADMIN", "BROKER", "AGENCY"], // Maybe Realtors too? restricted for now
  },
  // 7. Настройки (CRM)
  {
    title: "Настройки",
    icon: Settings,
    url: "/dashboard/settings",
    roles: ["ADMIN", "BROKER", "DEVELOPER", "REALTOR", "AGENCY"],
    subItems: [
      { title: "Воронки", url: "/dashboard/settings/funnels", icon: Settings },
      { title: "Поля", url: "/dashboard/settings/fields", icon: LayoutList } // NEW
    ]
  },
  // 8. Архив
  {
    title: "Архив",
    icon: Archive,
    url: "/dashboard/archives",
    roles: ["ADMIN", "BROKER", "DEVELOPER", "REALTOR", "AGENCY"],
  },
]

// Admin-only menu item
const adminMenuItem: MenuSection = {
  title: "Управление",
  icon: Shield,
  roles: ["ADMIN"],
  subItems: [
    { title: "Пользователи", url: "/dashboard/users", icon: Users },
    { title: "Курсы", url: "/dashboard/courses", icon: GraduationCap },
    { title: "Все проекты", url: "/dashboard/admin/projects", icon: Building2 },
    { title: "Настройки AI", url: "/dashboard/admin/settings", icon: Settings },
  ],
}

export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>({})
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})

  // Load user and open menus state from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }

    // Load saved open menus state
    const savedOpenMenus = localStorage.getItem("openMenus")
    if (savedOpenMenus) {
      setOpenMenus(JSON.parse(savedOpenMenus))
    } else {
      // Default: open menu that contains current page
      const defaultOpen: Record<string, boolean> = {}
      menuItems.forEach(item => {
        if (item.subItems?.some(sub => pathname.startsWith(sub.url.split("?")[0]))) {
          defaultOpen[item.title] = true
        }
      })
      setOpenMenus(defaultOpen)
    }
  }, [])

  // Toggle menu open state and save to localStorage
  const toggleMenu = (title: string) => {
    const newOpenMenus = { ...openMenus, [title]: !openMenus[title] }
    setOpenMenus(newOpenMenus)
    localStorage.setItem("openMenus", JSON.stringify(newOpenMenus))
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.removeItem("openMenus")
    router.push("/login")
  }

  const getUserInitials = () => {
    if (!user.firstName || !user.lastName) return "U"
    return `${user.firstName[0]}${user.lastName[0]}`
  }

  // Get visible menu items based on user role
  const getVisibleItems = () => {
    const items = [...menuItems]
    if (user.role === "ADMIN") {
      items.push(adminMenuItem)
    }
    return items.filter(item => item.roles.includes(user.role || "BROKER"))
  }

  const visibleItems = getVisibleItems()

  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="border-b border-border/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/1.png" alt="Casa Pro" className="h-10 w-10 rounded-lg object-contain" />
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Casa Pro</h2>
            </div>
          </div>
          {user.role !== "ADMIN" && <NotificationBell />}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Меню</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                item.subItems ? (
                  // Collapsible menu item with sub-items
                  <Collapsible
                    key={item.title}
                    asChild
                    open={openMenus[item.title] ?? false}
                    onOpenChange={() => toggleMenu(item.title)}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.subItems.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === subItem.url || pathname.startsWith(subItem.url.split("?")[0])}
                              >
                                <a href={subItem.url}>
                                  {subItem.icon && <subItem.icon className="h-3 w-3 mr-2" />}
                                  <span>{subItem.title}</span>
                                </a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  // Simple menu item without sub-items
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      tooltip={item.title}
                    >
                      <a href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border/50 p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-xs">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.role === "ADMIN" && "Администратор"}
              {user.role === "BROKER" && "Брокер"}
              {user.role === "DEVELOPER" && "Застройщик"}
              {user.role === "REALTOR" && "Риелтор"}
              {user.role === "AGENCY" && "Агентство"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Выйти
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
