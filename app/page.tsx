"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  getSupabaseClient,
  mockSupabase,
  isSupabaseConfigured,
} from "@/lib/supabase/client"
import { Conversation, Message, Profile } from "@/lib/supabase/types"
import { AuthForm } from "@/components/auth/auth-form"
import { Sidebar } from "@/components/dashboard/sidebar"
import { ChatArea } from "@/components/dashboard/chat-area"
import { QuotaDialog } from "@/components/dashboard/quota-dialog"
import { SchemaModal } from "@/components/dashboard/schema-modal"

export default function App() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [streamingText, setStreamingText] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [quotaDialogOpen, setQuotaDialogOpen] = useState(false)
  const [schemaModalOpen, setSchemaModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const abortControllerRef = useRef<AbortController | null>(null)

  // Load messages for active conversation
  const loadMessages = React.useCallback(async (conversationId: string) => {
    const supabase = getSupabaseClient()
    if (supabase && isSupabaseConfigured) {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
      setMessages(data || [])
    } else {
      setMessages(mockSupabase.getMessages(conversationId))
    }
  }, [])

  // Create new conversation
  const handleNewConversation = React.useCallback(async (explicitUserId?: string) => {
    const currentUserId = explicitUserId || user?.id
    if (!currentUserId) return

    const supabase = getSupabaseClient()
    if (supabase && isSupabaseConfigured) {
      const { data } = await supabase
        .from("conversations")
        .insert({
          user_id: currentUserId,
          title: "Nova Conversa",
        })
        .select()
        .single()

      if (data) {
        setConversations((prev) => [data, ...prev])
        setActiveConversationId(data.id)
        setMessages([])
      }
    } else {
      const newConv = mockSupabase.createConversation(currentUserId, "Nova Conversa")
      setConversations((prev) => [newConv, ...prev])
      setActiveConversationId(newConv.id)
      setMessages([])
    }
  }, [user?.id])

  // Load user data from real Supabase
  const loadUserData = React.useCallback(async (userId: string, email: string) => {
    const supabase = getSupabaseClient()
    if (!supabase) return

    try {
      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (profileData) {
        setProfile(profileData)
      } else {
        setProfile({
          id: userId,
          email,
          credits_limit: 20,
          credits_used: 0,
          created_at: new Date().toISOString(),
        })
      }

      // Load conversations
      const { data: convData } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      const convs = convData || []
      setConversations(convs)

      if (convs.length > 0) {
        setActiveConversationId(convs[0].id)
        await loadMessages(convs[0].id)
      } else {
        await handleNewConversation(userId)
      }
    } catch (e) {
      console.error("Error loading user data from Supabase:", e)
    }
  }, [handleNewConversation, loadMessages])

  // Load user data from mock sandbox
  const loadMockUserData = React.useCallback((userId: string, email: string) => {
    const userProfile = mockSupabase.getProfile(userId)
    setProfile(userProfile)

    const convs = mockSupabase.getConversations(userId)
    setConversations(convs)

    if (convs.length > 0) {
      setActiveConversationId(convs[0].id)
      setMessages(mockSupabase.getMessages(convs[0].id))
    } else {
      const newConv = mockSupabase.createConversation(userId, "Primeiros Passos com AI SaaS")
      setConversations([newConv])
      setActiveConversationId(newConv.id)
      setMessages([])
    }
  }, [])

  // 1. Initial auth check
  useEffect(() => {
    async function checkAuth() {
      setLoading(true)
      const supabase = getSupabaseClient()

      if (supabase && isSupabaseConfigured) {
        try {
          const { data } = await supabase.auth.getUser()
          if (data.user) {
            const authUser = {
              id: data.user.id,
              email: data.user.email || "user@example.com",
            }
            setUser(authUser)
            await loadUserData(authUser.id, authUser.email)
          }
        } catch (e) {
          console.error("Auth check failed:", e)
        }
      } else {
        const current = mockSupabase.getCurrentUser()
        if (current) {
          setUser(current)
          loadMockUserData(current.id, current.email)
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [loadUserData, loadMockUserData])

  // Switch active conversation
  const handleSelectConversation = async (conversationId: string) => {
    setActiveConversationId(conversationId)
    await loadMessages(conversationId)
  }

  // 7. Delete conversation
  const handleDeleteConversation = async (conversationId: string) => {
    const supabase = getSupabaseClient()
    if (supabase && isSupabaseConfigured) {
      await supabase.from("conversations").delete().eq("id", conversationId)
    } else {
      mockSupabase.deleteConversation(conversationId)
    }

    const remaining = conversations.filter((c) => c.id !== conversationId)
    setConversations(remaining)

    if (activeConversationId === conversationId) {
      if (remaining.length > 0) {
        setActiveConversationId(remaining[0].id)
        await loadMessages(remaining[0].id)
      } else {
        await handleNewConversation()
      }
    }
  }

  // 8. Update conversation title
  const handleUpdateTitle = async (title: string) => {
    if (!activeConversationId) return

    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversationId ? { ...c, title } : c))
    )

    const supabase = getSupabaseClient()
    if (supabase && isSupabaseConfigured) {
      await supabase
        .from("conversations")
        .update({ title })
        .eq("id", activeConversationId)
    } else {
      mockSupabase.updateConversationTitle(activeConversationId, title)
    }
  }

  // 9. Send message and handle streaming response from /api/chat
  const handleSendMessage = async (content: string) => {
    if (!user || !activeConversationId) return

    const creditsUsed = profile?.credits_used ?? 0
    const creditsLimit = profile?.credits_limit ?? 20

    // Client-side quota guard
    if (creditsUsed >= creditsLimit) {
      setQuotaDialogOpen(true)
      return
    }

    // Append user message immediately
    const userMessage: Message = {
      id: "usr_" + Date.now(),
      conversation_id: activeConversationId,
      role: "user",
      content,
      created_at: new Date().toISOString(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)

    // Auto update conversation title on first message
    if (messages.length === 0) {
      const newTitle = content.length > 30 ? content.substring(0, 30) + "..." : content
      handleUpdateTitle(newTitle)
    }

    // Prepare streaming
    setIsStreaming(true)
    setStreamingText("")

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: activeConversationId,
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userId: user.id,
          clientCreditsUsed: creditsUsed,
        }),
        signal: controller.signal,
      })

      // Check for 403 quota exceeded from server middleware
      if (response.status === 403) {
        const errorData = await response.json()
        setQuotaDialogOpen(true)
        setIsStreaming(false)
        setStreamingText("")
        return
      }

      if (!response.ok || !response.body) {
        throw new Error(`Erro na resposta: status ${response.status}`)
      }

      // Read stream chunk-by-chunk for typewriter effect
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        accumulatedText += chunk
        setStreamingText(accumulatedText)
      }

      // Finalize assistant message
      const assistantMessage: Message = {
        id: "ast_" + Date.now(),
        conversation_id: activeConversationId,
        role: "assistant",
        content: accumulatedText,
        tokens_used: Math.ceil(accumulatedText.length / 4),
        created_at: new Date().toISOString(),
      }

      setMessages([...updatedMessages, assistantMessage])
      setStreamingText("")
      setIsStreaming(false)

      // Increment credits used
      const newCreditsUsed = creditsUsed + 1
      if (!isSupabaseConfigured) {
        mockSupabase.addMessage(userMessage)
        mockSupabase.addMessage(assistantMessage)
        const updatedProfile = mockSupabase.updateCredits(user.id, newCreditsUsed)
        setProfile(updatedProfile)
      } else {
        setProfile((prev) =>
          prev ? { ...prev, credits_used: newCreditsUsed } : null
        )
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Stream stopped by user")
      } else {
        console.error("Stream error:", err)
      }
      setIsStreaming(false)
    } finally {
      abortControllerRef.current = null
    }
  }

  // 10. Stop streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    if (streamingText && activeConversationId) {
      const partialMessage: Message = {
        id: "ast_" + Date.now(),
        conversation_id: activeConversationId,
        role: "assistant",
        content: streamingText,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, partialMessage])
      setStreamingText("")
    }
    setIsStreaming(false)
  }

  // 11. Reset credits for Dev/testing
  const handleResetCredits = async () => {
    if (!user) return
    if (!isSupabaseConfigured) {
      const updated = mockSupabase.resetCredits(user.id)
      setProfile(updated)
    } else {
      const supabase = getSupabaseClient()
      if (supabase) {
        await supabase
          .from("profiles")
          .update({ credits_used: 0 })
          .eq("id", user.id)
        setProfile((prev) => (prev ? { ...prev, credits_used: 0 } : null))
      }
    }
  }

  // 12. Logout
  const handleLogout = async () => {
    const supabase = getSupabaseClient()
    if (supabase && isSupabaseConfigured) {
      await supabase.auth.signOut()
    }
    mockSupabase.setCurrentUser(null)
    setUser(null)
    setProfile(null)
    setConversations([])
    setMessages([])
    setActiveConversationId(null)
  }

  // 13. Render logic
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
          <p className="text-xs text-zinc-500 font-medium">Carregando AI SaaS Starter...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <AuthForm
        onSuccess={(loggedUser) => {
          setUser(loggedUser)
          if (isSupabaseConfigured) {
            loadUserData(loggedUser.id, loggedUser.email)
          } else {
            loadMockUserData(loggedUser.id, loggedUser.email)
          }
        }}
      />
    )
  }

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || null

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      {/* Sidebar with History & Quota Meter */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={() => handleNewConversation()}
        onDeleteConversation={handleDeleteConversation}
        profile={profile}
        isSupabaseLive={isSupabaseConfigured}
        onLogout={handleLogout}
        onOpenQuotaDialog={() => setQuotaDialogOpen(true)}
        onOpenSchemaModal={() => setSchemaModalOpen(true)}
      />

      {/* Main Chat Interface */}
      <ChatArea
        conversation={activeConversation}
        messages={messages}
        streamingText={streamingText}
        isStreaming={isStreaming}
        profile={profile}
        onSendMessage={handleSendMessage}
        onStopStreaming={handleStopStreaming}
        onOpenQuotaDialog={() => setQuotaDialogOpen(true)}
        onUpdateTitle={handleUpdateTitle}
      />

      {/* Quota limit exceeded dialog (403 friendly feedback) */}
      <QuotaDialog
        open={quotaDialogOpen}
        onOpenChange={setQuotaDialogOpen}
        creditsUsed={profile?.credits_used ?? 0}
        creditsLimit={profile?.credits_limit ?? 20}
        onResetCredits={handleResetCredits}
      />

      {/* Supabase SQL Schema Modal */}
      <SchemaModal
        open={schemaModalOpen}
        onOpenChange={setSchemaModalOpen}
      />
    </div>
  )
}
