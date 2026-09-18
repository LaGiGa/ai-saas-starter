"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, RefreshCw, Zap } from "lucide-react"

interface QuotaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  creditsUsed: number
  creditsLimit: number
  onResetCredits: () => void
}

export function QuotaDialog({
  open,
  onOpenChange,
  creditsUsed,
  creditsLimit,
  onResetCredits,
}: QuotaDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-2">
            <AlertCircle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl">
            Limite de Cota Atingido
          </DialogTitle>
          <DialogDescription className="text-center pt-1 text-zinc-600">
            Você atingiu o limite de{' '}
            <strong className="text-zinc-900 font-semibold">{creditsLimit} mensagens</strong>{' '}
            estabelecido no plano Starter ({creditsUsed}/{creditsLimit} créditos utilizados).
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-amber-200/80 bg-amber-50/60 p-3.5 text-xs text-amber-800 space-y-1.5">
          <div className="font-semibold flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-amber-600 shrink-0" />
            Middleware de Cota (/api/chat - HTTP 403)
          </div>
          <p className="leading-relaxed">
            A rota verifica o saldo na tabela <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">profiles</code> antes de acionar a OpenAI. Como o limite foi alcançado, a requisição foi interrompida com segurança.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="rounded-lg border border-zinc-200 p-3 bg-zinc-50/50">
            <div className="text-xs font-medium text-zinc-500">Plano Atual</div>
            <div className="text-sm font-bold text-zinc-900 mt-0.5">Starter Free</div>
            <div className="text-xs text-zinc-500 mt-1">20 mensagens / conta</div>
          </div>
          <div className="rounded-lg border border-emerald-300 p-3 bg-emerald-50/50 relative overflow-hidden">
            <div className="text-xs font-medium text-emerald-700">Plano Pro (SaaS)</div>
            <div className="text-sm font-bold text-emerald-950 mt-0.5">Ilimitado</div>
            <div className="text-xs text-emerald-600 mt-1">Streaming prioritário</div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => {
              onResetCredits()
              onOpenChange(false)
            }}
            className="w-full sm:w-auto text-xs"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Resetar Créditos (Modo Dev)
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto bg-zinc-900 text-white"
          >
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
