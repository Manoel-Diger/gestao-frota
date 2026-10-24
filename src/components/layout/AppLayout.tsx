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
      <div className="h-dvh flex w-full bg-background text-foreground">
        <AppSidebar />

        <div className="flex-1 flex min-w-0 flex-col overflow-hidden">
          <AppHeader />

          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1480px] p-4 sm:p-6 lg:p-8">
              <AnimatePresence mode="wait">
                <PageTransition key={location.pathname}>
                  <Outlet />
                </PageTransition>
              </AnimatePresence>
            </div>

            <footer className="border-t border-border/70 px-4 py-5 text-center text-xs leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">
                © {new Date().getFullYear()}
              </span>{" "}
              Todos os direitos reservados. Plataforma desenvolvida por{" "}
              <span className="font-semibold text-foreground">
                Manoel Armenteiro Diger Neto
              </span>.
            </footer>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
