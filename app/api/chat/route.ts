import { NextRequest, NextResponse } from 'next/server';
import { createChatStream } from '@/lib/ai/stream';
import { verifyUserQuota, incrementCreditsAndPersist } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId, messages, userId, clientCreditsUsed } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Formato inválido: lista de mensagens é obrigatória.' },
        { status: 400 }
      );
    }

    const effectiveUserId = userId || 'demo-user-default';

    // 1. Quota Middleware check (Supabase profiles table check)
    const quotaCheck = await verifyUserQuota(effectiveUserId);
    
    // Also respect client-side credits if running in demo sandbox mode without Supabase connection
    const currentCreditsUsed = quotaCheck.profile ? quotaCheck.credits_used : (clientCreditsUsed ?? 0);
    const creditsLimit = quotaCheck.profile ? quotaCheck.credits_limit : 20;

    if (currentCreditsUsed >= creditsLimit) {
      return NextResponse.json(
        {
          error: `Limite de créditos atingido (${creditsLimit}/${creditsLimit} mensagens). Faça upgrade ou recarregue seus créditos para continuar.`,
          code: 'QUOTA_EXCEEDED',
          credits_used: currentCreditsUsed,
          credits_limit: creditsLimit,
        },
        { status: 403 }
      );
    }

    // 2. Invoke Streaming LLM (OpenAI / Gemini)
    const stream = await createChatStream(messages);

    // Get the last user message to persist
    const lastUserMessage = messages[messages.length - 1]?.content || '';

    // Create a TransformStream to tap into stream chunks and accumulate the final assistant text
    let fullAssistantResponse = '';
    const textDecoder = new TextDecoder();
    
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = textDecoder.decode(chunk, { stream: true });
        fullAssistantResponse += text;
        controller.enqueue(chunk);
      },
      async flush() {
        // 3. Persistence: When stream completes, persist messages and increment credits in database
        if (conversationId && effectiveUserId) {
          try {
            await incrementCreditsAndPersist(
              effectiveUserId,
              conversationId,
              lastUserMessage,
              fullAssistantResponse,
              Math.ceil(fullAssistantResponse.length / 4)
            );
          } catch (err) {
            console.error('Failed background persistence:', err);
          }
        }
      },
    });

    const responseStream = stream.pipeThrough(transformStream);

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Credits-Used': String(currentCreditsUsed + 1),
        'X-Credits-Limit': String(creditsLimit),
      },
    });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno ao processar requisição de chat.' },
      { status: 500 }
    );
  }
}
