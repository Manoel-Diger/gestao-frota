import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Car,
  Users,
  Wrench,
  Fuel,
  AlertTriangle,
  Settings,
  Home,
  FileText,
  ClipboardCheck,
  Trophy,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Veículos", url: "/vehicles", icon: Car },
  { title: "Motoristas", url: "/drivers", icon: Users },
  { title: "Manutenções", url: "/maintenance", icon: Wrench },
  { title: "Abastecimentos", url: "/fuel", icon: Fuel },
  { title: "Checklists", url: "/checklist", icon: ClipboardCheck },
  { title: "Relatórios", url: "/reports", icon: BarChart3 },
  { title: "Ranking", url: "/ranking", icon: Trophy },
  { title: "Alertas", url: "/alerts", icon: AlertTriangle },
];

const settingsItems = [
  { title: "Configurações", url: "/settings", icon: Settings },
  { title: "Documentação", url: "/docs", icon: FileText },
];

// Estilo do item de menu: o estado ativo usa o atributo data-active do componente
const menuItemClassName =
  "relative h-10 gap-3 rounded-lg px-3 font-medium text-sidebar-foreground/80 " +
  "hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground " +
  "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground " +
  "data-[active=true]:before:absolute data-[active=true]:before:inset-y-2 data-[active=true]:before:left-0 " +
  "data-[active=true]:before:w-[3px] data-[active=true]:before:rounded-full data-[active=true]:before:bg-sidebar-primary " +
  "data-[active=true]:[&>svg]:text-sidebar-primary";

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarContent>
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-[0_6px_16px_-4px_hsl(var(--primary)/0.7)] ring-1 ring-white/15">
              <Car className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div className="leading-tight">
                <h1 className="text-[17px] font-bold tracking-tight text-white">Diger Frota</h1>
                <p className="text-xs text-sidebar-foreground/60">Gestão de Frotas</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup className="px-3 pt-4">
          <SidebarGroupLabel className="mb-1 px-3 text-sidebar-foreground/50">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} className={menuItemClassName}>
                    <NavLink to={item.url}>
                      <item.icon className="h-[18px] w-[18px]" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings */}
        <SidebarGroup className="mt-auto border-t border-sidebar-border px-3 py-4">
          <SidebarGroupLabel className="mb-1 px-3 text-sidebar-foreground/50">
            Sistema
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} className={menuItemClassName}>
                    <NavLink to={item.url}>
                      <item.icon className="h-[18px] w-[18px]" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}