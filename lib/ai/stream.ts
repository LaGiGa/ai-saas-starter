import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function createChatStream(messages: ChatMessage[]) {
  const openAiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  // 1. Try OpenAI if API key is provided
  if (openAiKey && openAiKey !== 'sk-...' && !openAiKey.includes('placeholder')) {
    const openai = new OpenAI({ apiKey: openAiKey });
    
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
        content: m.content,
      })),
      stream: true,
      temperature: 0.7,
    });

    const encoder = new TextEncoder();
    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });
  }

  // 2. Fallback to Gemini with identical streaming chunks
  if (geminiKey) {
    const ai = new GoogleGenAI({
      apiKey: geminiKey,
    });

    const systemPrompt = messages.find((m) => m.role === 'system')?.content;
    const conversationHistory = messages
      .filter((m) => m.role !== 'system')
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    const contents = conversationHistory || 'Olá! Como posso ajudar você hoje?';

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: systemPrompt || 'Você é um assistente de IA prestativo, inteligente e conciso para um AI SaaS Starter.',
      },
    });

    const encoder = new TextEncoder();
    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            const text = chunk.text || '';
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });
  }

  // 3. Fallback simulated stream if neither key is active
  const fallbackText = "Olá! Sou o assistente do AI SaaS Starter. Conecte sua chave OPENAI_API_KEY ou configure o Supabase para persistência completa.";
  const words = fallbackText.split(' ');
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      for (const word of words) {
        controller.enqueue(encoder.encode(word + ' '));
        await new Promise((resolve) => setTimeout(resolve, 35));
      }
      controller.close();
    },
  });
}
