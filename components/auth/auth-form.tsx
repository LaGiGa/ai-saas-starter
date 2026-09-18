"use client"

import React, { useState } from "react"
import { getSupabaseClient, mockSupabase, isSupabaseConfigured } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck, Database, Zap } from "lucide-react"

interface AuthFormProps {
  onSuccess: (user: { id: string; email: string }) => void
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [infoMsg, setInfoMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setInfoMsg(null)

    if (!email || !password) {
      setErrorMsg("Preencha o e-mail e a senha.")
      return
    }

    if (password.length < 6) {
      setErrorMsg("A senha deve ter no mínimo 6 caracteres.")
      return
    }

    setLoading(true)

    try {
      const supabase = getSupabaseClient()

      if (supabase && isSupabaseConfigured) {
        // Real Supabase Auth Flow
        if (mode === "signup") {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          })
          if (error) throw error

          if (data.user) {
            setInfoMsg("Conta criada com sucesso! Você já pode entrar.")
            setMode("login")
          }
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })
          if (error) throw error

          if (data.user) {
            onSuccess({
              id: data.user.id,
              email: data.user.email || email,
            })
          }
        }
      } else {
        // Sandbox / Preview Mock Auth Flow
        await new Promise((resolve) => setTimeout(resolve, 400))
        const simulatedUser = {
          id: "usr_" + btoa(email).replace(/[^a-zA-Z0-9]/g, "").substring(0, 16) || "usr_demo",
          email,
        }
        mockSupabase.setCurrentUser(simulatedUser)
        mockSupabase.getProfile(simulatedUser.id)
        onSuccess(simulatedUser)
      }
    } catch (err: any) {
      console.error("Auth error:", err)
      setErrorMsg(err?.message || "Ocorreu um erro na autenticação.")
    } finally {
      setLoading(false)
    }
  }

  const handleQuickDemo = () => {
    const demoUser = {
      id: "usr_starter_demo",
      email: "founder@aisaas.dev",
    }
    mockSupabase.setCurrentUser(demoUser)
    mockSupabase.getProfile(demoUser.id)
    onSuccess(demoUser)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50/70">
      <div className="w-full max-w-md space-y-4">
        {/* Brand Top Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-md">
            <Sparkles className="h-6 w-6 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            AI SaaS Starter
          </h1>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            Next.js App Router • Supabase Auth & PostgreSQL • OpenAI Streaming
          </p>
        </div>

        {/* Auth Card */}
        <Card className="border-zinc-200 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <div className="flex rounded-lg bg-zinc-100 p-1 mb-2">
              <button
                type="button"
                onClick={() => {
                  setMode("login")
                  setErrorMsg(null)
                  setInfoMsg(null)
                }}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
                  mode === "login"
                    ? "bg-white text-zinc-900 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup")
                  setErrorMsg(null)
                  setInfoMsg(null)
                }}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
                  mode === "signup"
                    ? "bg-white text-zinc-900 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Cadastrar
              </button>
            </div>

            <CardTitle className="text-base">
              {mode === "login" ? "Acesse sua conta" : "Criar nova conta"}
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              {mode === "login"
                ? "Entre com seu e-mail e senha cadastrados no Supabase Auth."
                : "Cadastre-se para receber 20 créditos iniciais de mensagens."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {errorMsg && (
                <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-xs text-red-700">
                  {errorMsg}
                </div>
              )}

              {infoMsg && (
                <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-xs text-emerald-800">
                  {infoMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <Input
                    type="email"
                    placeholder="seu.email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 text-xs"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-zinc-900 text-white hover:bg-zinc-800 text-xs h-9 font-medium"
              >
                {loading ? (
                  "Processando..."
                ) : mode === "login" ? (
                  <>
                    <span>Entrar no Dashboard</span>
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    <span>Criar Conta (20 Créditos)</span>
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="pt-0 flex flex-col gap-2">
            <div className="relative w-full text-center my-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200" />
              </div>
              <span className="relative bg-white px-2 text-[10px] text-zinc-400 uppercase font-medium">
                Avaliação Rápida
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleQuickDemo}
              className="w-full text-xs h-8 border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            >
              <Zap className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
              Entrar como Usuário Demo (1-Clique)
            </Button>
          </CardFooter>
        </Card>

        {/* Feature Highlights Pills */}
        <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-zinc-500">
          <div className="p-2 rounded-lg bg-white border border-zinc-200">
            <ShieldCheck className="h-3.5 w-3.5 mx-auto text-emerald-600 mb-1" />
            <span>Supabase Auth</span>
          </div>
          <div className="p-2 rounded-lg bg-white border border-zinc-200">
            <Zap className="h-3.5 w-3.5 mx-auto text-amber-500 mb-1" />
            <span>Cota de 20 msgs</span>
          </div>
          <div className="p-2 rounded-lg bg-white border border-zinc-200">
            <Database className="h-3.5 w-3.5 mx-auto text-purple-600 mb-1" />
            <span>Streaming SSE</span>
          </div>
        </div>
      </div>
    </div>
  )
}
