"use client"

import React, { useState } from "react"
import { Conversation, Profile } from "@/lib/supabase/types"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  MessageSquarePlus,
  MessageSquare,
  Trash2,
  LogOut,
  Zap,
  Database,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  Flame,
} from "lucide-react"

interface SidebarProps {
  conversations: Conversation[]
  activeConversationId: string | null
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onDeleteConversation: (id: string) => void
  profile: Profile | null
  isSupabaseLive: boolean
  onLogout: () => void
  onOpenQuotaDialog: () => void
  onOpenSchemaModal: () => void
}

export function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  profile,
  isSupabaseLive,
  onLogout,
  onOpenQuotaDialog,
  onOpenSchemaModal,
}: SidebarProps) {
  const creditsUsed = profile?.credits_used ?? 0
  const creditsLimit = profile?.credits_limit ?? 20
  const progressPercent = Math.min(100, Math.round((creditsUsed / creditsLimit) * 100))
  const isLimitReached = creditsUsed >= creditsLimit
  const isLimitNear = progressPercent >= 75 && !isLimitReached

  return (
    <aside className="w-72 flex flex-col h-full border-r border-zinc-200 bg-zinc-50/80 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-zinc-200/80 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-sm">
              <Sparkles className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-zinc-900 leading-tight">
                AI SaaS Starter
              </h1>
              <p className="text-[11px] text-zinc-500 leading-none mt-0.5">
                Next.js + Supabase + OpenAI
              </p>
            </div>
          </div>
        </div>

        {/* New Chat Button */}
        <Button
          onClick={onNewConversation}
          className="w-full justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs text-xs h-9 font-medium"
        >
          <MessageSquarePlus className="h-4 w-4" />
          Nova Conversa
        </Button>
      </div>

      {/* Conversations History List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        <div className="px-2 pb-1.5 flex items-center justify-between text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
          <span>Histórico</span>
          <span className="text-[10px] font-normal lowercase">{conversations.length} chats</span>
        </div>

        {conversations.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-zinc-400">
            Nenhuma conversa ainda. Clique em &quot;Nova Conversa&quot; para começar.
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeConversationId
            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  isActive
                    ? "bg-white text-zinc-950 shadow-xs border border-zinc-200/80 font-semibold"
                    : "text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <MessageSquare
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isActive ? "text-emerald-600" : "text-zinc-400 group-hover:text-zinc-600"
                    }`}
                  />
                  <span className="truncate">{conv.title || "Sem título"}</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteConversation(conv.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 hover:text-red-600 text-zinc-400 transition-opacity"
                  title="Excluir conversa"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* Credits Quota Card */}
      <div className="p-3 border-t border-zinc-200/80 bg-white space-y-2">
        <div
          onClick={onOpenQuotaDialog}
          className="p-3 rounded-lg border border-zinc-200/90 bg-zinc-50/70 hover:bg-zinc-100/70 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>Cota de Mensagens</span>
            </div>
            {isLimitReached ? (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                Esgotado
              </Badge>
            ) : isLimitNear ? (
              <Badge variant="warning" className="text-[10px] px-1.5 py-0 h-4">
                Quase lá
              </Badge>
            ) : (
              <span className="text-[11px] font-bold text-zinc-700">
                {creditsUsed}/{creditsLimit}
              </span>
            )}
          </div>

          <Progress
            value={progressPercent}
            className="h-1.5 bg-zinc-200"
            indicatorClassName={
              isLimitReached
                ? "bg-red-500"
                : isLimitNear
                ? "bg-amber-500"
                : "bg-emerald-600"
            }
          />

          <div className="flex items-center justify-between mt-2 text-[10px] text-zinc-500">
            <span>{creditsLimit - creditsUsed} restantes</span>
            <span className="text-zinc-400 hover:text-zinc-700 font-medium">Ver detalhes</span>
          </div>
        </div>

        {/* Database schema quick view button */}
        <button
          type="button"
          onClick={onOpenSchemaModal}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] font-medium text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-zinc-400" />
            Modelagem Supabase
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold">SQL</span>
        </button>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-zinc-200/80 bg-white flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="h-8 w-8 border border-zinc-200">
            <AvatarFallback className="bg-zinc-800 text-white text-xs font-semibold">
              {(profile?.email || "U")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-900 truncate">
              {profile?.email?.split("@")[0] || "Usuário"}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-zinc-500">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  isSupabaseLive ? "bg-emerald-500" : "bg-blue-400"
                }`}
              />
              <span className="truncate">
                {isSupabaseLive ? "Supabase Live" : "Sandbox"}
              </span>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onLogout}
          className="h-8 w-8 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 shrink-0"
          title="Sair da conta"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </aside>
  )
}
