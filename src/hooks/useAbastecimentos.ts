import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";

type Abastecimento = Tables<"Abastecimentos">;
type AbastecimentoInsert = Omit<TablesInsert<"Abastecimentos">, "id" | "created_at" | "updated_at">;
type AbastecimentoUpdate = Partial<AbastecimentoInsert> & { id: number }; // Confirmado como number

export function useAbastecimentos() {
  const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch inicial dos abastecimentos
  const fetchAbastecimentos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("Abastecimentos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAbastecimentos(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar abastecimentos");
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch dos abastecimentos
  const refetch = useCallback(async () => {
    await fetchAbastecimentos();
  }, [fetchAbastecimentos]);

  // Criação de novo abastecimento
  const createAbastecimento = useCallback(async (abastecimentoData: AbastecimentoInsert) => {
    setError(null);
    try {
      const { data, error } = await supabase
        .from("Abastecimentos")
        .insert(abastecimentoData)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error("Falha ao criar o abastecimento.");

      // Validação de tipos nulos antes de adicionar
      const newAbastecimento = {
        ...data,
        custo_total: data.custo_total || 0,
        litros: data.litros || 0,
        quilometragem: data.quilometragem || 0,
      };
      setAbastecimentos((prev) => [...prev, newAbastecimento]);
      return newAbastecimento;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao criar abastecimento.";
      setError(message);
      console.error(message, err);
      return null;
    }
  }, []);

  // Atualização de abastecimento existente
  const updateAbastecimento = useCallback(async (id: number, updateData: AbastecimentoUpdate) => {
    setError(null);
    try {
      const { data, error } = await supabase
        .from("Abastecimentos")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error("Falha ao atualizar o abastecimento.");

      // Validação de tipos nulos
      const updatedAbastecimento = {
        ...data,
        custo_total: data.custo_total || 0,
        litros: data.litros || 0,
        quilometragem: data.quilometragem || 0,
      };
      setAbastecimentos((prev) =>
        prev.map((ab) => (ab.id === id ? updatedAbastecimento : ab))
      );
      return updatedAbastecimento;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar abastecimento.";
      setError(message);
      console.error(message, err);
      return null;
    }
  }, []);

  // Exclusão de abastecimento
  const deleteAbastecimento = useCallback(async (id: number) => {
    setError(null);
    try {
      const { error } = await supabase.from("Abastecimentos").delete().eq("id", id);

      if (error) throw error;

      setAbastecimentos((prev) => prev.filter((ab) => ab.id !== id));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao deletar abastecimento.";
      setError(message);
      console.error(message, err);
      return false;
    }
  }, []);

  // Limpa mensagem de erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Efeito para fetch inicial
  useEffect(() => {
    fetchAbastecimentos();
  }, [fetchAbastecimentos]);

  return {
    abastecimentos,
    loading,
    error,
    refetch,
    createAbastecimento,
    updateAbastecimento,
    deleteAbastecimento,
    clearError,
  };
}