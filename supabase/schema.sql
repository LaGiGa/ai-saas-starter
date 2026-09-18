-- ==========================================================
-- PROJETO 01: AI SaaS Starter (Next.js + Supabase + OpenAI)
-- Database Migration Script (PostgreSQL / Supabase)
-- ==========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
-- profiles: id (uuid, FK auth.users), email (text), credits_limit (int, default 20), credits_used (int, default 0), created_at.
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  credits_limit int not null default 20,
  credits_used int not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. CONVERSATIONS TABLE
-- conversations: id (uuid), user_id (uuid), title (text), created_at.
create table if not exists public.conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Nova Conversa',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. MESSAGES TABLE
-- messages: id (uuid), conversation_id (uuid), role (text: 'user' | 'assistant'), content (text), tokens_used (int), created_at.
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  tokens_used int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Policies for Profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Policies for Conversations
create policy "Users can view own conversations"
  on public.conversations for select
  using (auth.uid() = user_id);

create policy "Users can create own conversations"
  on public.conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own conversations"
  on public.conversations for update
  using (auth.uid() = user_id);

create policy "Users can delete own conversations"
  on public.conversations for delete
  using (auth.uid() = user_id);

-- Policies for Messages
create policy "Users can view messages in their conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
      and conversations.user_id = auth.uid()
    )
  );

create policy "Users can insert messages in their conversations"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
      and conversations.user_id = auth.uid()
    )
  );

-- Function and Trigger to automatically create a profile record when a new user signs up in auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, credits_limit, credits_used)
  values (new.id, new.email, 20, 0);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper function to atomic increment credits used
create or replace function public.increment_user_credits(user_id uuid, amount int default 1)
returns int as $$
declare
  updated_credits int;
begin
  update public.profiles
  set credits_used = credits_used + amount
  where id = user_id
  returning credits_used into updated_credits;
  
  return updated_credits;
end;
$$ language plpgsql security definer;
