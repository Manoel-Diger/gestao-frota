import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/components/ui/use-toast';

// Define o tipo para o Alerta
type Alerta = Tables<'Alertas'>;

// Define o tipo de retorno do hook
interface RealtimeAlertsState {
    unreadCount: number;
    alerts: Alerta[];
    loading: boolean;
    error: string | null;
    markAsRead: (alertId: number) => void;
    // Função para recarregar todos os alertas (para inicialização)
    refetch: () => Promise<void>; 
}

export function useRealtimeAlerts(): RealtimeAlertsState {
    const [alerts, setAlerts] = useState<Alerta[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    // Função para buscar os alertas iniciais (todos os ativos para popular o estado)
    const fetchInitialAlerts = useCallback(async () => {
        try {
            setLoading(true);
            // Busca todos os alertas ativos, ordenados do mais novo para o mais antigo
            const { data, error } = await supabase
                .from('Alertas')
                .select('*')
                .eq('ativo', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAlerts(data as Alerta[]);
            setError(null);
        } catch (err) {
            console.error("Erro ao carregar alertas iniciais:", err);
            setError("Falha ao carregar alertas.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // 1. Carrega os alertas iniciais
        fetchInitialAlerts();

        // 2. Configura a escuta Realtime
        const alertChannel = supabase
            .channel('public:Alertas') // Nome do canal para a tabela 'Alertas'
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'Alertas' },
                (payload) => {
                    const newAlert = payload.new as Alerta;

                    // Lógica para lidar com INSERÇÃO de novo alerta
                    if (payload.eventType === 'INSERT' && newAlert.ativo) {
                        setAlerts(prevAlerts => [newAlert, ...prevAlerts]);
                        
                        // Mostra um toast para alertar o usuário sobre a novidade
                        toast({
                            title: "🚨 Novo Alerta Ativo!",
                            description: newAlert.tipo_alerta || "Alerta de sistema",
                            variant: "default",
                        });
                    }
                    
                    // Lógica para lidar com ATUALIZAÇÃO de alerta existente
                    if (payload.eventType === 'UPDATE') {
                        setAlerts(prevAlerts => 
                            prevAlerts.map(alert => 
                                alert.id === newAlert.id 
                                    ? newAlert // Substitui pelo novo objeto
                                    : alert
                            ).filter(alert => alert.ativo) // Remove se o alerta foi desativado
                        );
                    }
                }
            )
            .subscribe(); // Inicia a escuta

        // 3. Função de cleanup ao desmontar o componente
        return () => {
            supabase.removeChannel(alertChannel);
        };
    }, [fetchInitialAlerts, toast]);


    // Função fictícia para marcar como lido (desativar o alerta)
    // No seu contexto, "ler" um alerta geralmente significa desativá-lo
    const markAsRead = async (alertId: number) => {
        // Encontra o alerta e verifica se ele já está inativo (ativo=false)
        const alertToUpdate = alerts.find(a => a.id === alertId);
        if (!alertToUpdate || !alertToUpdate.ativo) return; // Se não for ativo, não faz nada

        try {
            // Atualiza o status 'ativo' para false
            const { error } = await supabase
                .from('Alertas')
                .update({ ativo: false })
                .eq('id', alertId);

            if (error) throw error;

            // O Realtime listener acima (payload.eventType === 'UPDATE') 
            // já irá remover o alerta da lista automaticamente.
            toast({
                title: "Alerta Desativado",
                description: `O alerta ID ${alertId} foi marcado como lido.`,
            });
        } catch (err) {
            console.error("Erro ao marcar alerta como lido:", err);
            toast({
                title: "Erro",
                description: "Não foi possível desativar o alerta.",
                variant: "destructive",
            });
        }
    };
    
    // Calcula a contagem de alertas não lidos (aqui consideramos todos os ativos)
    // Se você tivesse uma coluna 'read' (lido), usaria ela. Por enquanto, usamos 'ativo'.
    const unreadCount = alerts.length; 

    return { 
        unreadCount, 
        alerts, 
        loading, 
        error, 
        markAsRead, 
        refetch: fetchInitialAlerts // Exporta a função de recarga manual
    };
}