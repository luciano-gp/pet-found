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










  /* ADOCAO */
create table if not exists public.adoption_pets (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  user_id uuid not null default auth.uid (),
  pet_name character varying not null default ''::character varying,
  pet_age bigint null,
  pet_description text null,
  pet_specie character varying null,
  adopted boolean not null default false,
  pet_image text null,
  pet_vaccinated boolean null default false,
  pet_castrated boolean null default false,
  address text not null default ''::text,
  latitude numeric null,
  longitude numeric null,
  constraint adoption_pets_pkey primary key (id),
  constraint adoption_pets_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;

ALTER TABLE adoption_pets ENABLE ROW LEVEL SECURITY;

create policy "Enable delete for users based on user_id"
on "public"."adoption_pets"
to public
using (
  (( SELECT auth.uid() AS uid) = user_id)
 );
 
create policy  "Enable insert for users based on user_id"
on "public"."adoption_pets"
to public
with check (
  (( SELECT auth.uid() AS uid) = user_id)
);

create policy  "Enable read access for all users"
on "public"."adoption_pets"
to authenticated
using (
  true
);

create policy "Update usuario autorizado"
on "public"."adoption_pets"
to public
using (
  ( SELECT (auth.uid() = adoption_pets.user_id))
);




/* CAMPANHA */
create table if not exists public.campaigns (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone not null default now(),
  ong_id uuid null,
  title text null,
  description text null,
  goal_amount numeric null,
  raised_amount numeric null,
  constraint campaings_pkey primary key (id),
  constraint campaings_ong_id_fkey foreign KEY (ong_id) references ongs (id)
) TABLESPACE pg_default; 

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

create policy "Enable insert for authenticated users only"
on "public"."campaigns"
to authenticated
with check (
  true
);

create policy "Enable read access for all users"
on "public"."campaigns"
to authenticated
using (
  true
);

create policy "ONGs can delete their own campaigns"
on "public"."campaigns"
to authenticated
using (
  (ong_id IN ( SELECT ongs.id
   FROM ongs
  WHERE (ongs.user_id = auth.uid())))
);


create policy "ONGs can update their own campaigns"
on "public"."campaigns"
to authenticated
using (
  (ong_id IN ( SELECT ongs.id
   FROM ongs
  WHERE (ongs.user_id = auth.uid())))
);