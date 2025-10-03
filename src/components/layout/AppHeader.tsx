import { useState } from "react";
import { Bell, Search, User, AlertTriangle } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useRealtimeAlerts } from '@/hooks/useRealtimeAlerts';
import { useNavigate } from 'react-router-dom';

export function AppHeader() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Hook de Realtime para Notificações
  const { unreadCount, alerts, loading, markAsRead, error } = useRealtimeAlerts();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case 'Alta':
        return 'text-red-500';
      case 'Média':
      return 'text-yellow-500';
      case 'Baixa':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const navigateToAlerts = () => {
    navigate('/alerts');
  };

  return (
    <header className="h-16 bg-fleet-header border-b border-border flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="lg:hidden" />
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar veículos, motoristas..."
            className="pl-10 w-full md:w-96"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* COMPONENTE DE NOTIFICAÇÕES */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="p-4">
              <h4 className="font-bold">Notificações ({unreadCount})</h4>
              <p className="text-sm text-muted-foreground">Alertas de manutenção, CNH e mais.</p>
            </div>
            <Separator />
            <ScrollArea className="h-[300px]">
              {loading ? (
                <div className="text-center p-4 text-sm text-muted-foreground">
                  Carregando alertas...
                </div>
              ) : error ? (
                <div className="flex flex-col items-center p-4 text-sm text-destructive">
                  <AlertTriangle className="w-4 h-4 mb-1" />
                  {error}
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center p-4 text-sm text-muted-foreground">
                  Nenhum alerta ativo.
                </div>
              ) : (
                <div className="divide-y">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{alert.tipo_alerta}</span>
                          <span className={`text-xs font-semibold ${getPriorityColor(alert.prioridade)}`}>
                            {alert.prioridade}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs hover:bg-primary/10"
                          onClick={() => markAsRead(alert.id)}
                        >
                          Lido
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {alert.descricao || 'Verifique os detalhes na página Alertas.'}
                      </p>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span className="font-medium">
                          {alert.veiculo || alert.motorista || 'Sistema'}
                        </span>
                        <span className="text-[10px]">
                          {new Date(alert.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <Separator />
            <div className="p-2 text-center">
              <Button
                variant="link"
                size="sm"
                className="text-xs w-full"
                onClick={navigateToAlerts}
              >
                Ver todos os Alertas
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-auto p-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">Manoel Armenteiro</p>
                <p className="text-xs text-muted-foreground">Administrador</p>
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