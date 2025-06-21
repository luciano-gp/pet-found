# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

# PetGuard - Aplicativo para Encontrar Pets Perdidos

PetGuard é um aplicativo React Native que permite aos usuários reportar pets avistados e criar anúncios para pets perdidos, ajudando a reunir famílias com seus animais de estimação.

## 🚀 Funcionalidades

- **Autenticação**: Login e registro de usuários
- **Relatos de Pets Avistados**: Reporte pets que você viu na rua
- **Anúncios de Pets Perdidos**: Crie anúncios para encontrar seu pet
- **Captura de Imagens**: Tire fotos dos pets
- **Localização GPS**: Registre onde o pet foi visto/perdido
- **Interface Intuitiva**: Design limpo e fácil de usar

## 📋 Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn
- Expo CLI
- Conta no Supabase

## 🛠️ Instalação

1. **Clone o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd pet-found
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure o Supabase**
   - Crie uma conta em [supabase.com](https://supabase.com)
   - Crie um novo projeto
   - Vá para Settings > API e copie as credenciais

4. **Configure as variáveis de ambiente**
   - Crie um arquivo `.env` na raiz do projeto
   - Adicione suas credenciais do Supabase:
   ```
   EXPO_PUBLIC_SUPABASE_URL=sua_url_do_supabase
   EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
   ```

5. **Configure o banco de dados**
   - No Supabase, vá para SQL Editor
   - Execute o conteúdo do arquivo `database-setup.sql`
   - Isso criará as tabelas necessárias e as políticas de segurança

## 🗄️ Configuração do Banco de Dados

Execute o seguinte SQL no SQL Editor do Supabase:

```sql
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

-- Habilitar RLS
ALTER TABLE public.lost_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança (execute todas as políticas do arquivo database-setup.sql)
```

## 🚀 Executando o Projeto

1. **Inicie o servidor de desenvolvimento**
   ```bash
   npm start
   ```

2. **Execute no dispositivo/emulador**
   - Instale o Expo Go no seu dispositivo
   - Escaneie o QR code que aparece no terminal
   - Ou pressione `a` para Android ou `i` para iOS

## 📱 Estrutura do Projeto

```
pet-found/
├── app/                    # Rotas do expo-router
│   ├── (auth)/            # Telas de autenticação
│   └── (app)/             # Telas principais do app
├── components/            # Componentes reutilizáveis
├── contexts/              # Contextos React
├── hooks/                 # Hooks customizados
├── services/              # Serviços de API
├── types/                 # Definições de tipos TypeScript
└── constants/             # Constantes do app
```

## 🔧 Tecnologias Utilizadas

- **React Native** - Framework mobile
- **Expo** - Plataforma de desenvolvimento
- **TypeScript** - Tipagem estática
- **Supabase** - Backend como serviço
- **Expo Router** - Navegação
- **Expo Image Picker** - Captura de imagens
- **Expo Location** - Localização GPS

## 📄 Licença

Este projeto é um trabalho acadêmico desenvolvido para fins educacionais.

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Se você encontrar algum problema ou tiver dúvidas, abra uma issue no repositório.

---

**Desenvolvido com ❤️ para ajudar a encontrar pets perdidos**
