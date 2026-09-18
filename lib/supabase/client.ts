import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Conversation, Message, Profile } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

// Fallback client-side simulated store for sandbox/preview testing when Supabase keys are not set
class MockSupabaseService {
  private STORAGE_KEY_PROFILES = 'aisaas_mock_profiles';
  private STORAGE_KEY_CONVOS = 'aisaas_mock_conversations';
  private STORAGE_KEY_MESSAGES = 'aisaas_mock_messages';
  private STORAGE_KEY_USER = 'aisaas_mock_current_user';

  private getStorage<T>(key: string, defaultVal: T): T {
    if (typeof window === 'undefined') return defaultVal;
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private setStorage<T>(key: string, val: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error('Storage error', e);
    }
  }

  getCurrentUser() {
    return this.getStorage<{ id: string; email: string } | null>(this.STORAGE_KEY_USER, null);
  }

  setCurrentUser(user: { id: string; email: string } | null) {
    this.setStorage(this.STORAGE_KEY_USER, user);
  }

  getProfile(userId: string): Profile {
    const profiles = this.getStorage<Record<string, Profile>>(this.STORAGE_KEY_PROFILES, {});
    if (!profiles[userId]) {
      const newProfile: Profile = {
        id: userId,
        email: this.getCurrentUser()?.email || 'user@example.com',
        credits_limit: 20,
        credits_used: 0,
        created_at: new Date().toISOString(),
      };
      profiles[userId] = newProfile;
      this.setStorage(this.STORAGE_KEY_PROFILES, profiles);
      return newProfile;
    }
    return profiles[userId];
  }

  updateCredits(userId: string, creditsUsed: number): Profile {
    const profiles = this.getStorage<Record<string, Profile>>(this.STORAGE_KEY_PROFILES, {});
    const profile = this.getProfile(userId);
    profile.credits_used = creditsUsed;
    profiles[userId] = profile;
    this.setStorage(this.STORAGE_KEY_PROFILES, profiles);
    return profile;
  }

  resetCredits(userId: string): Profile {
    return this.updateCredits(userId, 0);
  }

  getConversations(userId: string): Conversation[] {
    const all = this.getStorage<Conversation[]>(this.STORAGE_KEY_CONVOS, []);
    return all.filter((c) => c.user_id === userId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  createConversation(userId: string, title = 'Nova Conversa'): Conversation {
    const all = this.getStorage<Conversation[]>(this.STORAGE_KEY_CONVOS, []);
    const newConv: Conversation = {
      id: 'conv_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
      user_id: userId,
      title,
      created_at: new Date().toISOString(),
    };
    all.unshift(newConv);
    this.setStorage(this.STORAGE_KEY_CONVOS, all);
    return newConv;
  }

  updateConversationTitle(conversationId: string, title: string): void {
    const all = this.getStorage<Conversation[]>(this.STORAGE_KEY_CONVOS, []);
    const idx = all.findIndex((c) => c.id === conversationId);
    if (idx !== -1) {
      all[idx].title = title;
      this.setStorage(this.STORAGE_KEY_CONVOS, all);
    }
  }

  deleteConversation(conversationId: string): void {
    const all = this.getStorage<Conversation[]>(this.STORAGE_KEY_CONVOS, []);
    const filtered = all.filter((c) => c.id !== conversationId);
    this.setStorage(this.STORAGE_KEY_CONVOS, filtered);

    const msgs = this.getStorage<Message[]>(this.STORAGE_KEY_MESSAGES, []);
    const filteredMsgs = msgs.filter((m) => m.conversation_id !== conversationId);
    this.setStorage(this.STORAGE_KEY_MESSAGES, filteredMsgs);
  }

  getMessages(conversationId: string): Message[] {
    const msgs = this.getStorage<Message[]>(this.STORAGE_KEY_MESSAGES, []);
    return msgs
      .filter((m) => m.conversation_id === conversationId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  addMessage(msg: Omit<Message, 'id' | 'created_at'>): Message {
    const msgs = this.getStorage<Message[]>(this.STORAGE_KEY_MESSAGES, []);
    const newMsg: Message = {
      ...msg,
      id: 'msg_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
      created_at: new Date().toISOString(),
    };
    msgs.push(newMsg);
    this.setStorage(this.STORAGE_KEY_MESSAGES, msgs);
    return newMsg;
  }
}

export const mockSupabase = new MockSupabaseService();

// Real Supabase client instance if configured
let realClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  if (!isSupabaseConfigured) return null;
  if (!realClient && supabaseUrl && supabaseAnonKey) {
    realClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return realClient;
}
