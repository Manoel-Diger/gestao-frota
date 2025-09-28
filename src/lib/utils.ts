// src/lib/utils.ts

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Função para combinar classes Tailwind CSS
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// -------------------------------------------------------------
// FUNÇÕES DE FORMATAÇÃO (INCLUÍDAS PARA RESOLVER O ERRO TS2305)
// -------------------------------------------------------------

/**
 * Formata um número como moeda (R$) ou número simples com duas casas decimais.
 * @param value O valor numérico a ser formatado.
 * @param type O tipo de formatação: 'currency' para R$, ou 'number' para simples.
 */
export function formatNumber(value: number | string | null | undefined, type: 'currency' | 'number' = 'number'): string {
  // Converte para número, retornando 0 se for null/undefined/NaN
  const num = Number(value) || 0;

  if (type === 'currency') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  }

  // Formata como número com duas casas decimais, substituindo ponto por vírgula
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Formata um número como porcentagem.
 * @param value O valor percentual (0 a 100).
 */
export function formatPercentage(value: number | string | null | undefined): string {
  const num = Number(value) || 0;
  
  // Formata como porcentagem com uma casa decimal.
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(num / 100); // Divide por 100 para Intl.NumberFormat usar o valor correto
}