import { ChatMessage, ChatThread, CreateMessageData, CreateThreadData } from '../types/chat';
import { supabase } from './supabase';

export class ChatService {


static async getUserThreads(userId: string): Promise<ChatThread[]> {
  try {
    console.log("[DEBUG] === getUserThreads() INIT ===");

    // 1) Buscar IDs das threads onde o usuário participa
    const { data: participantRows, error: partError } = await supabase
      .from("chat_participants")
      .select("thread_id")
      .eq("user_id", userId);

    if (partError) throw partError;

    const participantThreadIds = (participantRows || []).map((r) => r.thread_id);

    console.log("[DEBUG] THREADS ONDE USUARIO PARTICIPA:", participantThreadIds);

    // 2) Buscar threads criadas pelo usuário
    const { data: byCreator, error: errCreator } = await supabase
      .from("chat_threads")
      .select(`
        id,
        created_at,
        created_by,
        chat_participants(
          thread_id,
          user_id,
          users (
            id,
            name,
            avatar_url,
            is_ong
          )
        ),
        chat_messages(
          id,
          content,
          image_url,
          created_at
        )
      `)
      .eq("created_by", userId)
      .order("created_at", { ascending: false });

    if (errCreator) throw errCreator;

    // 3) Buscar threads onde o usuário é participante
    let byParticipant: any[] = [];

    if (participantThreadIds.length > 0) {
      const { data: byPart, error: errPart } = await supabase
        .from("chat_threads")
        .select(`
          id,
          created_at,
          created_by,
          chat_participants(
            thread_id,
            user_id,
            users (
              id,
              name,
              avatar_url,
              is_ong
            )
          ),
          chat_messages(
            id,
            content,
            image_url,
            created_at
          )
        `)
        .in("id", participantThreadIds)
        .order("created_at", { ascending: false });

      if (errPart) throw errPart;
      byParticipant = byPart || [];
    }

    // 4) Merge sem duplicar
    const map = new Map();
    [...(byCreator ?? []), ...(byParticipant ?? [])].forEach((thread) => {
      if (!map.has(thread.id)) {
        map.set(thread.id, thread);
      }
    });

    const merged = Array.from(map.values());

    console.log("[DEBUG] THREADS MERGED:", merged);

    // 5) Format final
    const formatted: ChatThread[] = merged.map((thread: any) => {
      const lastMessage =
        thread.chat_messages?.[thread.chat_messages.length - 1] || null;

      return {
        id: thread.id,
        created_at: thread.created_at,
        last_message: lastMessage,
        participants: thread.chat_participants || [],
      };
    });

    console.log("[DEBUG] FINAL THREADS:", formatted);

    return formatted;
  } catch (error) {
    console.error("[ChatService] getUserThreads ERROR:", error);
    throw error;
  }
}


  /**
   * CRIA UMA THREAD COM LISTA DE PARTICIPANTES
   */
  static async createThread({ participant_ids }: CreateThreadData): Promise<ChatThread> {
    if (!participant_ids || participant_ids.length === 0) {
      throw new Error('Lista de participantes inválida');
    }

    const createdBy = participant_ids[0];

    const { data, error } = await supabase
      .from('chat_threads')
      .insert([{ created_at: new Date().toISOString(), created_by: createdBy }])
      .select()
      .single();

    if (error || !data) throw error;

    const threadId = data.id;

    const { error: participantsError } = await supabase.from('chat_participants').insert(
      participant_ids.map((user_id) => ({
        thread_id: threadId,
        user_id,
      }))
    );

    if (participantsError) throw participantsError;

    return { id: threadId, created_at: data.created_at };
  }

  /**
   * ENVIA UMA MENSAGEM
   */
  static async sendMessage({
    thread_id,
    sender_id,
    content,
    image_url,
  }: CreateMessageData): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([
        {
          thread_id,
          sender_id,
          content: content || null,
          image_url: image_url || null,
        },
      ])
      .select('id, thread_id, sender_id, content, image_url, created_at')
      .single();

    if (error || !data) throw error;
    return data;
  }

  /**
   * LISTA MENSAGENS DE UM CHAT
   */
  static async getMessages(threadId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        id,
        thread_id,
        sender_id,
        content,
        image_url,
        created_at,
        users(id, name, avatar_url)
      `)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data ?? []).map((msg: any) => ({
      ...msg,
      sender: msg.users,
    }));
  }

  /**
   * SUBSCRIBE MENSAGENS
   */
  static subscribeToMessages(threadId: string, onNewMessage: (msg: ChatMessage) => void) {
    const channel = supabase
      .channel(`chat_thread_${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          onNewMessage(payload.new as ChatMessage);
        }
      )
      .subscribe();

    return channel;
  }

  /**
   * SUBSCRIBE THREADS
   */
  static subscribeToThreads(userId: string, onChange: () => void) {
    const messagesChannel = supabase
      .channel(`chat_messages_${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        onChange
      )
      .subscribe();

    const threadsChannel = supabase
      .channel(`chat_threads_${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_threads' },
        onChange
      )
      .subscribe();

    return { messagesChannel, threadsChannel };
  }

  /**
   * UNSUBSCRIBE
   */
  static unsubscribeFromThreads(channels: { messagesChannel: any; threadsChannel: any }) {
    supabase.removeChannel(channels.messagesChannel);
    supabase.removeChannel(channels.threadsChannel);
  }
}
