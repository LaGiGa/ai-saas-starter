"use client"

import React, { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Message, Conversation, Profile } from "@/lib/supabase/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Send,
  Square,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  AlertCircle,
  Zap,
  RefreshCw,
  Cpu,
  ArrowRight,
} from "lucide-react"

interface ChatAreaProps {
  conversation: Conversation | null
  messages: Message[]
  streamingText: string
  isStreaming: boolean
  profile: Profile | null
  onSendMessage: (content: string) => Promise<void>
  onStopStreaming: () => void
  onOpenQuotaDialog: () => void
  onUpdateTitle: (title: string) => void
}

const SUGGESTIONS = [
  "Como funciona o Middleware de Cota no Supabase?",
  "Escreva um exemplo de rota de streaming em Next.js com ReadableStream",
  "Explique a arquitetura do banco deste AI SaaS Starter",
  "Crie um script SQL para resetar créditos de um usuário",
]

export function ChatArea({
  conversation,
  messages,
  streamingText,
  isStreaming,
  profile,
  onSendMessage,
  onStopStreaming,
  onOpenQuotaDialog,
  onUpdateTitle,
}: ChatAreaProps) {
  const [input, setInput] = useState("")
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const creditsUsed = profile?.credits_used ?? 0
  const creditsLimit = profile?.credits_limit ?? 20
  const isQuotaReached = creditsUsed >= creditsLimit

  // Auto-scroll on new messages or streaming chunks
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingText])

  const handleStartEditing = () => {
    setTitleInput(conversation?.title || "")
    setIsEditingTitle(true)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!input.trim() || isStreaming) return

    if (isQuotaReached) {
      onOpenQuotaDialog()
      return
    }

    const text = input.trim()
    setInput("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }

    await onSendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    // Auto adjust height
    const target = e.target
    target.style.height = "auto"
    target.style.height = `${Math.min(target.scrollHeight, 180)}px`
  }

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleSaveTitle = () => {
    if (titleInput.trim()) {
      onUpdateTitle(titleInput.trim())
    }
    setIsEditingTitle(false)
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
      {/* Top Header */}
      <header className="h-14 border-b border-zinc-200 px-6 flex items-center justify-between shrink-0 bg-white/95 backdrop-blur-xs z-10">
        <div className="flex items-center gap-3 min-w-0">
          {isEditingTitle ? (
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
              autoFocus
              className="text-sm font-semibold text-zinc-900 border-b border-zinc-400 focus:outline-none bg-transparent"
            />
          ) : (
            <h2
              onClick={handleStartEditing}
              className="text-sm font-semibold text-zinc-900 truncate cursor-pointer hover:text-zinc-600 transition-colors"
              title="Clique para editar o título"
            >
              {conversation?.title || "Nova Conversa"}
            </h2>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[11px] gap-1.5 py-0.5 border-zinc-200">
            <Cpu className="h-3 w-3 text-emerald-600" />
            <span>OpenAI Streaming</span>
          </Badge>

          <Badge
            variant={isQuotaReached ? "destructive" : "secondary"}
            className="text-[11px] gap-1 py-0.5 cursor-pointer"
            onClick={onOpenQuotaDialog}
          >
            <Zap className="h-3 w-3" />
            <span>{creditsUsed}/{creditsLimit} msgs</span>
          </Badge>
        </div>
      </header>

      {/* Quota reached alert banner if applicable */}
      {isQuotaReached && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900 animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong>Cota atingida (403):</strong> Você consumiu todas as 20 mensagens do plano Starter.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenQuotaDialog}
            className="h-7 text-xs border-amber-300 bg-white hover:bg-amber-100 text-amber-900"
          >
            Gerenciar Cota
          </Button>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && !streamingText ? (
          <div className="h-full flex flex-col items-center justify-center max-w-lg mx-auto text-center py-12">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-xs">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900">
              AI SaaS Starter Assistant
            </h3>
            <p className="text-xs text-zinc-500 mt-1.5 mb-6 max-w-sm">
              Demonstração de integração LLM com streaming HTTP em tempo real,
              controle de cotas no Supabase e Next.js App Router.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full text-left">
              {SUGGESTIONS.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSendMessage(item)}
                  className="p-3 text-xs rounded-xl border border-zinc-200 bg-zinc-50/70 hover:bg-zinc-100/80 hover:border-zinc-300 text-zinc-700 transition-all flex items-center justify-between group"
                >
                  <span className="truncate pr-2">{item}</span>
                  <ArrowRight className="h-3 w-3 text-zinc-400 group-hover:text-zinc-900 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === "user"
            return (
              <div
                key={msg.id || index}
                className={`flex gap-3 max-w-3xl ${
                  isUser ? "ml-auto justify-end" : "mr-auto justify-start"
                }`}
              >
                {!isUser && (
                  <Avatar className="h-8 w-8 border border-zinc-200 shrink-0 mt-0.5">
                    <AvatarFallback className="bg-emerald-600 text-white text-xs">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className="flex flex-col group max-w-[85%]">
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm shadow-xs ${
                      isUser
                        ? "bg-zinc-900 text-white rounded-tr-none"
                        : "bg-zinc-50 border border-zinc-200/90 text-zinc-900 rounded-tl-none"
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    ) : (
                      <div className="prose prose-sm prose-zinc max-w-none break-words leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {!isUser && (
                    <div className="flex items-center gap-2 mt-1 px-1">
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.content, index)}
                        className="text-[11px] text-zinc-400 hover:text-zinc-700 flex items-center gap-1 transition-colors"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                      {msg.tokens_used ? (
                        <span className="text-[10px] text-zinc-400">
                          • ~{msg.tokens_used} tokens
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>

                {isUser && (
                  <Avatar className="h-8 w-8 border border-zinc-200 shrink-0 mt-0.5">
                    <AvatarFallback className="bg-zinc-800 text-white text-xs">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            )
          })
        )}

        {/* Live Streaming Message chunk */}
        {isStreaming && (
          <div className="flex gap-3 max-w-3xl mr-auto justify-start animate-in fade-in duration-200">
            <Avatar className="h-8 w-8 border border-zinc-200 shrink-0 mt-0.5">
              <AvatarFallback className="bg-emerald-600 text-white text-xs">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col group max-w-[85%]">
              <div className="rounded-2xl rounded-tl-none px-4 py-3 text-sm shadow-xs bg-zinc-50 border border-zinc-200/90 text-zinc-900">
                {streamingText ? (
                  <div className="prose prose-sm prose-zinc max-w-none break-words leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {streamingText}
                    </ReactMarkdown>
                    {/* Blinking typewriter cursor */}
                    <span className="inline-block w-2 h-4 ml-1 bg-emerald-600 align-middle animate-pulse" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-zinc-400 text-xs py-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Gerando resposta em tempo real...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className="p-4 border-t border-zinc-200 bg-white">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto rounded-2xl border border-zinc-200/90 shadow-xs focus-within:border-zinc-400 transition-colors bg-white p-2"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder={
              isQuotaReached
                ? "Limite de 20 mensagens atingido. Abra o modal para resetar ou fazer upgrade."
                : "Digite uma mensagem para a OpenAI... (Shift+Enter para nova linha)"
            }
            disabled={isQuotaReached && !isStreaming}
            className="w-full resize-none px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none max-h-44 disabled:bg-transparent disabled:cursor-not-allowed"
          />

          <div className="flex items-center justify-between pt-2 px-2 border-t border-zinc-100">
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span>Streaming HTTP (SSE)</span>
              <span>•</span>
              <span>1 msg = 1 crédito</span>
            </div>

            <div className="flex items-center gap-2">
              {isStreaming ? (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={onStopStreaming}
                  className="h-8 px-3 text-xs gap-1.5"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  Parar
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="sm"
                  disabled={!input.trim() || isQuotaReached}
                  className="h-8 px-3.5 bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-40 gap-1.5 text-xs font-medium"
                >
                  <span>Enviar</span>
                  <Send className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
