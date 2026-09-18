"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, Copy, Database, ShieldCheck, Zap } from "lucide-react"

interface SchemaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SQL_SCHEMA = `-- ==========================================================
-- PROJETO 01: AI SaaS Starter (Next.js + Supabase + OpenAI)
-- ==========================================================

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  credits_limit int not null default 20,
  credits_used int not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. CONVERSATIONS TABLE
create table if not exists public.conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Nova Conversa',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. MESSAGES TABLE
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  tokens_used int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Auto create profile on auth.users signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, credits_limit, credits_used)
  values (new.id, new.email, 20, 0);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();`

export function SchemaModal({ open, onOpenChange }: SchemaModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SCHEMA)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">Modelagem do Banco (Supabase)</DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Tabelas <code className="text-zinc-800 font-semibold">profiles</code>, <code className="text-zinc-800 font-semibold">conversations</code> e <code className="text-zinc-800 font-semibold">messages</code> com RLS e Triggers.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 text-xs py-1">
          <div className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50/70">
            <div className="font-semibold text-zinc-900 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              profiles
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              id, email, credits_limit (20), credits_used, created_at.
            </p>
          </div>

          <div className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50/70">
            <div className="font-semibold text-zinc-900 flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-blue-600" />
              conversations
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              id, user_id (FK), title, created_at.
            </p>
          </div>

          <div className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50/70">
            <div className="font-semibold text-zinc-900 flex items-center gap-1">
              <Database className="h-3.5 w-3.5 text-purple-600" />
              messages
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              id, conversation_id, role, content, tokens_used.
            </p>
          </div>
        </div>

        <div className="relative flex-1 min-h-[260px] overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-200">
          <div className="absolute right-3 top-3 z-10">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCopy}
              className="h-7 px-2.5 text-xs bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700"
            >
              {copied ? (
                <>
                  <Check className="mr-1 h-3 w-3 text-emerald-400" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="mr-1 h-3 w-3" />
                  Copiar SQL
                </>
              )}
            </Button>
          </div>
          <pre className="h-full overflow-y-auto pr-1 text-[11px] leading-relaxed text-zinc-300">
            {SQL_SCHEMA}
          </pre>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs text-zinc-500">
          <span>Arquivo no projeto: <code className="bg-zinc-100 px-1 py-0.5 rounded">/supabase/schema.sql</code></span>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
