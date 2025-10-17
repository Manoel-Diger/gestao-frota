import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Lendo as variáveis de ambiente do Vite (funcionam em dev e produção)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Validação crítica para evitar erros silenciosos
if (!supabaseUrl) {
  console.error('VITE_SUPABASE_URL não está definida!');
  throw new Error('Variável de ambiente VITE_SUPABASE_URL não configurada');
}

if (!supabaseAnonKey) {
  console.error('VITE_SUPABASE_PUBLISHABLE_KEY não está definida!');
  throw new Error('Variável de ambiente VITE_SUPABASE_PUBLISHABLE_KEY não configurada');
}

// Log apenas em desenvolvimento
if (import.meta.env.DEV) {
  console.log('Supabase URL configurada:', supabaseUrl);
  console.log('Supabase Key configurada:', supabaseAnonKey.substring(0, 20) + '...');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'x-client-info': 'fleet-management-dashboard',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Verificar autenticação ao inicializar (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  supabase.auth.getSession().then(({ data: { session }, error }) => {
    if (error) {
      console.error('Erro ao verificar sessão:', error);
    } else if (session) {
      console.log('Sessão ativa:', session.user.email);
    } else {
      console.log('Nenhuma sessão ativa');
    }
  });
}