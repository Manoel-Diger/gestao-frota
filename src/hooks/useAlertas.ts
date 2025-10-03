import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables, Database } from '@/integrations/supabase/types'; 
import { useToast } from '@/components/ui/use-toast'; 

// Tipagem: Usando a tipagem direta da tabela para maior consistência e flexibilidade
export type Alerta = Tables<'Alertas'>;

// Define o tipo de dados necessários para criar um novo Alerta
// Excluímos 'id' e 'created_at', que são gerados pelo banco
export type NewAlerta = Omit<Alerta, 'id' | 'created_at' | 'ativo'> & { ativo?: boolean };


export interface UseAlertasState {
    alertas: Alerta[];
    loading: boolean;
    error: string | null;
    refreshAlertas: () => Promise<void>;
    markAsInactive: (id: number) => Promise<void>;
    createAlerta: (alertaData: NewAlerta) => Promise<void>; // ADICIONADO
}


export function useAlertas(): UseAlertasState {
    const [alertas, setAlertas] = useState<Alerta[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    // 1. Função de Busca (MODIFICADA para usar SELECT direto na tabela 'Alertas')
    const fetchAlertas = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // MODIFICADO: Chamada direta na tabela para contornar o erro da RPC/RLS
            const { data, error } = await supabase
                .from('Alertas')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                // Se falhar aqui, o problema é 100% RLS.
                console.error("Erro ao buscar alertas (SELECT):", error);
                // Sugestão clara do que fazer no banco de dados para corrigir:
                throw new Error("Falha RLS/Permissão ao buscar alertas. Verifique o RLS para SELECT na tabela 'Alertas' (com aspas duplas).");
            }
            setAlertas(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar alertas');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAlertas();
    }, [fetchAlertas]);


    // 2. Função de Criação (ADICIONADA: para o formulário "Novo Alerta")
    const createAlerta = async (alertaData: NewAlerta) => {
        try {
            // Requer uma política de INSERT RLS para ser executado
            const { error } = await supabase
                .from('Alertas')
                .insert(alertaData);

            if (error) {
                 console.error("Erro ao criar alerta:", error);
                 throw new Error("Falha ao criar alerta. Verifique a política RLS de INSERT.");
            }
            
            // Recarrega a lista para mostrar o novo alerta (e atualizar o sino)
            fetchAlertas(); 

            toast({
                title: "Alerta Configurado",
                description: `O novo alerta '${alertaData.tipo_alerta}' foi criado com sucesso.`,
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao criar alerta.';
            setError(message);
            toast({
                title: "Erro ao Criar Alerta",
                description: message,
                variant: "destructive",
            });
        }
    };


    // 3. Função para Desativar/Marcar Alerta como Resolvido (Mantida)
    const markAsInactive = async (id: number) => {
        try {
            // Requer uma política de UPDATE RLS para ser executado
            const { error } = await supabase
                .from('Alertas') 
                .update({ ativo: false })
                .eq('id', id);

            if (error) {
                 console.error("Erro ao desativar alerta:", error);
                 throw new Error("Falha ao desativar o alerta. Verifique a política RLS de UPDATE.");
            }
            
            // Atualiza o estado localmente 
            setAlertas(prevAlertas => 
                prevAlertas.map(alerta => 
                    alerta.id === id ? { ...alerta, ativo: false } : alerta
                )
            );

            toast({
                title: "Alerta Resolvido",
                description: `O alerta ID ${id} foi desativado.`,
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao desativar alerta.';
            setError(message);
            toast({
                title: "Erro",
                description: message,
                variant: "destructive",
            });
        }
    };
    
    // Alias para clareza
    const refreshAlertas = fetchAlertas;

    // Retorna a nova função createAlerta
    return { alertas, loading, error, refreshAlertas, markAsInactive, createAlerta };
}