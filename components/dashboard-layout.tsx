"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { LayoutDashboard, FileText, Users, Car, Package, Settings, Menu, Wrench, LogOut, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Ordens de Serviço", href: "/dashboard/ordens", icon: FileText },
  { name: "Clientes", href: "/dashboard/clientes", icon: Users },
  { name: "Veículos", href: "/dashboard/veiculos", icon: Car },
  { name: "Serviços", href: "/dashboard/servicos", icon: Briefcase },
  { name: "Estoque", href: "/dashboard/estoque", icon: Package },
  { name: "Integrações", href: "/dashboard/integracoes", icon: Settings },
]

export function DashboardLayout({
  children,
  userEmail,
}: {
  children: React.ReactNode
  userEmail: string
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden border-b border-border bg-card sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            <span className="font-semibold">Sistema de Oficina</span>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <MobileNav pathname={pathname} onNavigate={() => setOpen(false)} userEmail={userEmail} />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[240px_1fr]">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block border-r border-border bg-card">
          <div className="sticky top-0 h-screen flex flex-col">
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm">Sistema de Oficina</h2>
                  <p className="text-xs text-muted-foreground">Gestão Completa</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            <div className="p-4 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{userEmail}</p>
                  <p className="text-xs text-muted-foreground">Administrador</p>
                </div>
              </div>
              <form action="/auth/signout" method="post">
                <Button variant="outline" size="sm" className="w-full bg-transparent" type="submit">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </form>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}

function MobileNav({
  pathname,
  onNavigate,
  userEmail,
}: {
  pathname: string
  onNavigate: () => void
  userEmail: string
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wrench className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Sistema de Oficina</h2>
            <p className="text-xs text-muted-foreground">Gestão Completa</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="mb-3">
          <p className="text-xs font-medium truncate">{userEmail}</p>
          <p className="text-xs text-muted-foreground">Administrador</p>
        </div>
        <form action="/auth/signout" method="post">
          <Button variant="outline" size="sm" className="w-full bg-transparent" type="submit">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </form>
      </div>
    </div>
  )
}
