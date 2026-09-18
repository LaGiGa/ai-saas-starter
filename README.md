# Projeto 01 — AI SaaS Starter (Next.js + Supabase + OpenAI)

> Starter kit para produtos SaaS de Inteligência Artificial com arquitetura moderna, consumo de streaming HTTP em tempo real (ReadableStream/SSE), autenticação Supabase Auth, persistência PostgreSQL e controle rigoroso de cota de 20 mensagens por usuário.

---

## 🚀 Arquitetura & Fluxo da Rota de Streaming com Controle de Cota

```
+-------------+                 +--------------------+                  +------------------------+
|   Cliente   |                 | Next.js API Route  |                  |    Supabase (Postgres) |
|  (Browser)  |                 |     /api/chat      |                  |                        |
+------+------+                 +---------+----------+                  +-----------+------------+
       |                                  |                                         |
       |  1. POST /api/chat               |                                         |
       |  { conversationId, messages }    |                                         |
       +--------------------------------->|                                         |
       |                                  |  2. Consulta cota no banco               |
       |                                  |     SELECT credits_used, credits_limit  |
       |                                  |     FROM profiles WHERE id = user_id    |
       |                                  +---------------------------------------->|
       |                                  |<----------------------------------------+
       |                                  |     Retorna saldo                       |
       |                                  |                                         |
       |  [SE credits_used >= limit]      |                                         |
       |  HTTP 403 Forbidden              |                                         |
       |<---------------------------------+                                         |
       |  (UI exibe modal amigável)       |                                         |
       |                                  |                                         |
       |  [SE saldo disponível]           |                                         |
       |                                  |  3. Chama OpenAI com streaming          |
       |                                  |     openai.chat.completions.create(     |
       |                                  |       { stream: true, ... }             |
       |                                  |     )                                   |
       |                                  +----------------+                        |
       |                                                   |                        |
       |  4. Server-Sent Events / ReadableStream Chunks    v                        |
       |<--------------------------------------------------+                        |
       |  (Efeito máquina de escrever em tempo real)                                |
       |                                  |                                         |
       |  5. Fim do stream                |  6. Persistência e Débito               |
       |                                  |     - Grava msg do usuário              |
       |                                  |     - Grava resposta do assistente      |
       |                                  |     - UPDATE profiles                   |
       |                                  |       SET credits_used = credits_used+1 |
       |                                  +---------------------------------------->|
       v                                                                            v
```

---

## 📦 Stack Tecnológica

- **Framework**: Next.js 15+ (App Router)
- **Linguagem**: TypeScript (Strict Mode)
- **Estilização**: Tailwind CSS + Shadcn UI
- **Banco de Dados & Autenticação**: Supabase (PostgreSQL + Supabase Auth com RLS)
- **Engine de IA**: OpenAI API (`gpt-4o-mini`) via `ReadableStream` (com fallback automático para Gemini API `gemini-3.8-flash` no ambiente de preview)
- **Componentes Visuais**: Radix UI primitives (`@radix-ui/react-progress`, `@radix-ui/react-dialog`, `@radix-ui/react-avatar`, `@radix-ui/react-slot`), Lucide Icons

---

## 🗄️ Modelagem do Banco de Dados (Supabase)

O script completo com **Row Level Security (RLS)** e triggers está disponível em [`/supabase/schema.sql`](./supabase/schema.sql):

### 1. `profiles`
Tabela vinculada ao `auth.users` que controla a cota de uso:
- `id` (uuid, FK `auth.users.id`, PK)
- `email` (text)
- `credits_limit` (int, default `20`)
- `credits_used` (int, default `0`)
- `created_at` (timestamptz)

### 2. `conversations`
Armazena as sessões de chat criadas pelo usuário:
- `id` (uuid, PK)
- `user_id` (uuid, FK `auth.users.id`)
- `title` (text, default `'Nova Conversa'`)
- `created_at` (timestamptz)

### 3. `messages`
Histórico individual de mensagens de cada conversa:
- `id` (uuid, PK)
- `conversation_id` (uuid, FK `conversations.id`)
- `role` (text: `'user'` | `'assistant'` | `'system'`)
- `content` (text)
- `tokens_used` (int)
- `created_at` (timestamptz)

---

## ⚙️ Variáveis de Ambiente (`.env`)

Crie seu arquivo `.env.local` baseado no `.env.example`:

```bash
# OpenAI API Key
OPENAI_API_KEY="sk-..."

# Supabase Credentials (disponíveis no painel Project Settings > API)
NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."
```

---

## 🛡️ Fluxos Principais Implementados

1. **Autenticação**: Login e Cadastro com e-mail e senha via Supabase Auth (com modo Sandbox simulado para testes rápidos sem travar na ausência de credenciais).
2. **Middleware de Cota (HTTP 403)**: Antes de invocar a LLM, a rota `/api/chat` valida se `credits_used < credits_limit`. Se a cota estiver esgotada, retorna status `403` amigável.
3. **Streaming HTTP em Tempo Real**: Conexão com `ReadableStream` decodificada chunk-a-chunk no cliente com cursor animado de máquina de escrever.
4. **Persistência**: Ao término da resposta, armazena mensagens no PostgreSQL e incrementa atomicamente o `credits_used`.
5. **Dashboard & Sidebar**: Barra lateral retrátil com histórico de conversas, contador visual de créditos (`X/20`), criação de novas conversas e botão para reset de créditos em modo desenvolvimento.
