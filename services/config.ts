// Configurações do Supabase
// Substitua estas URLs pelas suas configurações reais do Supabase

export const SUPABASE_CONFIG = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL || 'SUA_SUPABASE_URL',
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'SUA_SUPABASE_ANON_KEY',
};

// Para usar variáveis de ambiente, crie um arquivo .env na raiz do projeto:
// EXPO_PUBLIC_SUPABASE_URL=sua_url_do_supabase
// EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase 