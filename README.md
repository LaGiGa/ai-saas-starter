## 🚀 Arquitetura & Fluxo da Rota de Streaming com Controle de Cota

```mermaid
flowchart TD
    subgraph S1["1. Interface do Usuário (Cliente)"]
        A["💻 Chat UI (Browser)<br/>Usuário envia mensagem"]
        B["🌐 Requisição POST /api/chat<br/>{ conversationId, messages }"]
        A --> B
    end

    subgraph S2["2. API Route & Validação de Cota"]
        C["🔍 Consulta Cota no Supabase<br/>SELECT credits_used, credits_limit"]
        D{"Possui saldo?"}
        B --> C
        C --> D
        D -- "Não (Excedeu limite)" --> E["⛔ Retorna HTTP 403 Forbidden<br/>UI exibe aviso amigável"]
    end

    subgraph S3["3. Engine de IA & Streaming"]
        F["🧠 Chamada OpenAI API<br/>(stream: true)"]
        G["🌊 Server-Sent Events (SSE)<br/>Retorna chunks (máquina de escrever)"]
        D -- "Sim (Tem saldo)" --> F
        F --> G
    end

    subgraph S4["4. Persistência e Débito (Pós-Stream)"]
        H[("🗄️ PostgreSQL (Supabase)<br/>Salva mensagens no histórico")]
        I["💸 Atualiza Cota<br/>UPDATE profiles SET credits_used + 1"]
        H --> I
    end

    G --> H
    G -. "Retorna texto em tempo real" .-> A

    classDef step fill:#1e293b,stroke:#334155,stroke-width:1.5px,color:#fff;
    classDef success fill:#064e3b,stroke:#059669,stroke-width:2px,color:#fff;
    classDef warning fill:#78350f,stroke:#d97706,stroke-width:2px,color:#fff;
    
    class S1,S2,S3,S4 step;
    class F,G success;
    class E warning;
    
📦 Stack Tecnológica

Framework: Next.js 15+ (App Router)

Linguagem: TypeScript (Strict Mode)

Estilização: Tailwind CSS + Shadcn UI

Banco de Dados & Autenticação: Supabase (PostgreSQL + Supabase Auth com RLS)

Engine de IA: OpenAI API (gpt-4o-mini) via ReadableStream (com fallback automático para Gemini API gemini-3.8-flash no ambiente de preview)

Componentes Visuais: Radix UI primitives (@radix-ui/react-progress, @radix-ui/react-dialog, @radix-ui/react-avatar, @radix-ui/react-slot), Lucide Icons

🗄️ Modelagem do Banco de Dados (Supabase)

O script completo com Row Level Security (RLS) e triggers está disponível em /supabase/schema.sql:

1. profiles

Tabela vinculada ao auth.users que controla a cota de uso:

id (uuid, FK auth.users.id, PK)

email (text)

credits_limit (int, default 20)

credits_used (int, default 0)

created_at (timestamptz)

2. conversations

Armazena as sessões de chat criadas pelo usuário:

id (uuid, PK)

user_id (uuid, FK auth.users.id)

title (text, default 'Nova Conversa')

created_at (timestamptz)

3. messages

Histórico individual de mensagens de cada conversa:

id (uuid, PK)

conversation_id (uuid, FK conversations.id)

role (text: 'user' | 'assistant' | 'system')

content (text)

tokens_used (int)

created_at (timestamptz)

⚙️ Variáveis de Ambiente (.env)

Crie seu arquivo .env.local baseado no .env.example:

# OpenAI API Key
OPENAI_API_KEY="sk-..."

# Supabase Credentials (disponíveis no painel Project Settings > API)
NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."


🛠️ Instalação e Execução Local

Siga o passo a passo abaixo para configurar e rodar o projeto em sua máquina:

1. Clone o repositório

git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio


2. Instale as dependências

Execute com o gerenciador de pacotes da sua escolha:

npm install
# ou
pnpm install
# ou
yarn install


3. Configure as variáveis de ambiente

Copie o arquivo de exemplo para o arquivo local:

cp .env.example .env.local


Abra o .env.local e preencha as credenciais da OpenAI e do seu projeto no Supabase.

4. Configure o banco de dados no Supabase

Acesse o painel do Supabase e crie um novo projeto (ou use um existente).

Vá até a seção SQL Editor no menu lateral esquerdo.

Copie o conteúdo do arquivo /supabase/schema.sql e cole no editor.

Execute o script (Run) para criar as tabelas (profiles, conversations, messages), as regras de RLS e o trigger de criação automática de usuário.

5. Inicie o servidor de desenvolvimento

npm run dev
# ou
pnpm dev
# ou
yarn dev


6. Acesse no navegador

Abra http://localhost:3000. Crie uma conta no formulário de autenticação para testar o limite de 20 mensagens com streaming em tempo real.

🛡️ Fluxos Principais Implementados

Autenticação: Login e Cadastro com e-mail e senha via Supabase Auth (com modo Sandbox simulado para testes rápidos sem travar na ausência de credenciais).

Middleware de Cota (HTTP 403): Antes de invocar a LLM, a rota /api/chat valida se credits_used < credits_limit. Se a cota estiver esgotada, retorna status 403 amigável.

Streaming HTTP em Tempo Real: Conexão com ReadableStream decodificada chunk-a-chunk no cliente com cursor animado de máquina de escrever.

Persistência: Ao término da resposta, armazena mensagens no PostgreSQL e incrementa atomicamente o credits_used.

Dashboard & Sidebar: Barra lateral retrátil com histórico de conversas, contador visual de créditos (X/20), criação de novas conversas e botão para reset de créditos em modo desenvolvimento.

## 📄 Licença

Distribuído sob a licença MIT. Sinta-se livre para usar em seu portfólio, adaptar e estender.
