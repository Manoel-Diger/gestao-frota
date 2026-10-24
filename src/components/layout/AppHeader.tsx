import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

type Alert = {
  id: number;
  tipo_alerta: string;
  descricao: string;
  created_at: string;
};

export function AppHeader() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [search, setSearch] = useState("");

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from("Alertas")
      .select("id, tipo_alerta, descricao, created_at")
      .eq("ativo", true)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAlerts(data);
    }
  };

  useEffect(() => {
    fetchAlerts();

    const channel = supabase
      .channel("alertas-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Alertas" },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 🔎 Função de navegação da busca
  const handleSearch = () => {
    if (search.trim() !== "") {
      navigate(`/vehicles?search=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border/70 bg-fleet-header px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="lg:hidden" />
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar veículos, motoristas..."
            className="h-10 w-full border-transparent bg-muted/70 pl-10 shadow-none placeholder:text-muted-foreground/80 focus-visible:bg-card md:w-96"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {alerts.length > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-transparent bg-destructive px-1 text-[11px] text-destructive-foreground ring-2 ring-card"
                >
                  {alerts.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="max-h-[22rem] w-80 overflow-y-auto">
            <DropdownMenuLabel>Notificações</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {alerts.length === 0 ? (
              <DropdownMenuItem disabled>
                Nenhum alerta ativo
              </DropdownMenuItem>
            ) : (
              alerts.map((alert) => (
                <DropdownMenuItem
                  key={alert.id}
                  className="flex flex-col items-start gap-1 py-2"
                >
                  <span className="font-semibold text-sm">
                    {alert.tipo_alerta}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {alert.descricao}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex h-auto items-center gap-2.5 p-1.5 sm:pr-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold leading-tight">Manoel Armenteiro</p>
                <p className="text-xs leading-tight text-muted-foreground">Administrador</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configurações</DropdownMenuItem>
            <DropdownMenuItem>Ajuda</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}