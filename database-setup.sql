-- Configuração do banco de dados para PetGuard
-- Execute este SQL no SQL Editor do Supabase

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de pets perdidos
CREATE TABLE IF NOT EXISTS public.lost_pets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    species VARCHAR(50) NOT NULL,
    description TEXT,
    reward DECIMAL(10,2),
    image_url TEXT,
    last_seen_name VARCHAR(200),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de relatos de pets avistados
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    species VARCHAR(50) NOT NULL,
    description TEXT,
    image_url TEXT,
    location_name VARCHAR(200),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas de segurança RLS (Row Level Security)
ALTER TABLE public.lost_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Políticas para lost_pets
CREATE POLICY "Users can view all lost pets" ON public.lost_pets
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own lost pets" ON public.lost_pets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lost pets" ON public.lost_pets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lost pets" ON public.lost_pets
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para reports
CREATE POLICY "Users can view all reports" ON public.reports
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own reports" ON public.reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports" ON public.reports
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports" ON public.reports
    FOR DELETE USING (auth.uid() = user_id);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_lost_pets_updated_at 
    BEFORE UPDATE ON public.lost_pets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at 
    BEFORE UPDATE ON public.reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_lost_pets_user_id ON public.lost_pets(user_id);
CREATE INDEX IF NOT EXISTS idx_lost_pets_created_at ON public.lost_pets(created_at);
CREATE INDEX IF NOT EXISTS idx_lost_pets_location ON public.lost_pets(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_location ON public.reports(latitude, longitude);

-- Tabela de contatos dos usuários
CREATE TABLE IF NOT EXISTS user_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca rápida por user_id
CREATE INDEX IF NOT EXISTS idx_user_contacts_user_id ON user_contacts(user_id);

-- Políticas para user_contacts
-- Permitir que usuários vejam contatos de outros usuários (para comunicação)
ALTER TABLE user_contacts ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver todos os contatos (para comunicação)
CREATE POLICY "Usuários podem ver contatos de outros usuários" ON user_contacts
  FOR SELECT USING (true);

-- Política: Usuários podem inserir apenas seus próprios contatos
CREATE POLICY "Usuários podem inserir seus próprios contatos" ON user_contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar apenas seus próprios contatos
CREATE POLICY "Usuários podem atualizar seus próprios contatos" ON user_contacts
  FOR UPDATE USING (auth.uid() = user_id);

-- Política: Usuários podem deletar apenas seus próprios contatos
CREATE POLICY "Usuários podem deletar seus próprios contatos" ON user_contacts
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_contacts_updated_at 
  BEFORE UPDATE ON user_contacts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 