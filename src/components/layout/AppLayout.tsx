import { useState } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <AppHeader />
          <main className="flex-1 p-6 bg-gradient-to-br from-background to-secondary/20">
            <Outlet />
          </main>
          <footer className="text-center text-sm text-muted-foreground py-4 border-t border-border">
            © 2025 Desenvolvido por Manoel Armenteiro Diger Neto. Todos os direitos reservados.
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
