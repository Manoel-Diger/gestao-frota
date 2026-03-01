import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "./PageTransition";

export function AppLayout() {
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background text-foreground">
        <AppSidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader />

          <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-background to-secondary/20">
            <AnimatePresence mode="wait">
              <PageTransition key={location.pathname}>
                <Outlet />
              </PageTransition>
            </AnimatePresence>
          </main>

          <footer className="border-t bg-background py-6 text-center text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              © {new Date().getFullYear()}
            </span>{" "}
            Todos os direitos reservados.
            <br />
            Plataforma desenvolvida por{" "}
            <span className="font-semibold text-foreground">
              Manoel Armenteiro Diger Neto
            </span>.
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}