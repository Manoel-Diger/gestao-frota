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
  List, // Adicionado para representar Checklist
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
  { title: "Relatórios", url: "/reports", icon: BarChart3 },
  { title: "Alertas", url: "/alerts", icon: AlertTriangle },
  { title: "Checklist", url: "/checklist", icon: List }, // Novo item adicionado
];

const settingsItems = [
  { title: "Configurações", url: "/settings", icon: Settings },
  { title: "Documentação", url: "/docs", icon: FileText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const getNavClassName = (path: string) => {
    const active = isActive(path);
    return active 
      ? "bg-primary text-primary-foreground hover:bg-primary/90 font-medium" 
      : "hover:bg-muted/80 text-muted-foreground hover:text-foreground";
  };

  return (
    <Sidebar className="border-r bg-fleet-sidebar">
      <SidebarContent className="bg-fleet-sidebar">
        {/* Logo */}
        <div className="p-6 border-b border-border/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-lg font-bold text-fleet-sidebar-foreground">FrotaPro</h1>
                <p className="text-xs text-fleet-sidebar-foreground/60">Gestão de Frotas</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-fleet-sidebar-foreground/80">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClassName(item.url)}
                    >
                      <item.icon className="mr-3 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-fleet-sidebar-foreground/80">
            Sistema
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClassName(item.url)}
                    >
                      <item.icon className="mr-3 h-4 w-4" />
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