import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Profile } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getServerSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-id')) {
    return null;
  }
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });
}

export async function verifyUserQuota(userId: string): Promise<{
  allowed: boolean;
  profile: Profile | null;
  credits_used: number;
  credits_limit: number;
}> {
  const supabase = getServerSupabase();
  if (!supabase) {
    // If Supabase credentials are not yet configured on server,
    // allow by default up to 20 messages per session or client header
    return {
      allowed: true,
      profile: null,
      credits_used: 0,
      credits_limit: 20,
    };
  }

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      console.warn('Profile not found in Supabase for user:', userId, error);
      return {
        allowed: true,
        profile: null,
        credits_used: 0,
        credits_limit: 20,
      };
    }

    const credits_used = profile.credits_used ?? 0;
    const credits_limit = profile.credits_limit ?? 20;
    const allowed = credits_used < credits_limit;

    return {
      allowed,
      profile,
      credits_used,
      credits_limit,
    };
  } catch (err) {
    console.error('Error verifying user quota in Supabase:', err);
    return {
      allowed: true,
      profile: null,
      credits_used: 0,
      credits_limit: 20,
    };
  }
}

export async function incrementCreditsAndPersist(
  userId: string,
  conversationId: string,
  userMessage: string,
  assistantMessage: string,
  tokensUsed = 0
) {
  const supabase = getServerSupabase();
  if (!supabase) return;

  try {
    // 1. Insert user message
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: userMessage,
    });

    // 2. Insert assistant message
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: assistantMessage,
      tokens_used: tokensUsed,
    });

    // 3. Increment credits_used in profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits_used')
      .eq('id', userId)
      .single();

    if (profile) {
      await supabase
        .from('profiles')
        .update({ credits_used: (profile.credits_used || 0) + 1 })
        .eq('id', userId);
    }
  } catch (err) {
    console.error('Error persisting messages and credits to Supabase:', err);
  }
}
