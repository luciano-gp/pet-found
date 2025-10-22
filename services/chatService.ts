import { ChatMessage, ChatThread, CreateMessageData, CreateThreadData } from '../types/chat';
import { supabase } from './supabase';

export class ChatService {
    /**
     * Lista todas as threads (conversas) do usuário
     */
    static async getUserThreads(userId: string): Promise<ChatThread[]> {
        const { data, error } = await supabase
            .from('chat_threads')
            .select(`
        id,
        created_at,
        chat_participants!inner(
          user_id,
          users!chat_participants_user_id_fkey(id, name, avatar_url, is_ong)
        ),
        chat_messages(
          id,
          content,
          image_url,
          created_at
        )
      `)
            .eq('chat_participants.user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);

        const formatted: ChatThread[] = (data || []).map((thread: any) => {
            const lastMessage = thread.chat_messages?.[thread.chat_messages.length - 1] || null;
            return {
                id: thread.id,
                created_at: thread.created_at,
                participants: thread.chat_participants.map((p: any) => ({
                    thread_id: thread.id,
                    user_id: p.user_id,
                    user: p.users,
                })),
                last_message: lastMessage,
            };
        });

        return formatted;
    }

    /**
     * Cria uma nova thread (conversa) com participantes
     */
    static async createThread({ participant_ids }: CreateThreadData): Promise<ChatThread> {
        const { data, error } = await supabase
            .from('chat_threads')
            .insert([{ created_at: new Date().toISOString() }])
            .select()
            .single();

        if (error || !data) throw new Error(error?.message || 'Erro ao criar thread');

        const threadId = data.id;

        const { error: participantsError } = await supabase.from('chat_participants').insert(
            participant_ids.map((user_id) => ({
                thread_id: threadId,
                user_id,
            }))
        );

        if (participantsError) throw new Error(participantsError.message);

        return { id: threadId, created_at: data.created_at };
    }

    /**
     * Envia uma mensagem (texto ou imagem)
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

        if (error || !data) throw new Error(error?.message || 'Erro ao enviar mensagem');
        return data;
    }

    /**
     * Lista as mensagens de uma thread específica
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
        users!chat_messages_sender_id_fkey(id, name, avatar_url)
      `)
            .eq('thread_id', threadId)
            .order('created_at', { ascending: true });

        if (error) throw new Error(error.message);

        return (data || []).map((msg: any) => ({
            ...msg,
            sender: msg.users,
        }));
    }

    /**
     * Inscrição no Realtime para novas mensagens em uma thread
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
                    const msg = payload.new as ChatMessage;
                    onNewMessage(msg);
                }
            )
            .subscribe();

        return channel;
    }

    /**
     * Inscrição no Realtime para atualizações gerais de threads
     * (ex: nova conversa, última mensagem alterada, etc.)
     */
    static subscribeToThreads(userId: string, onChange: () => void) {
        // Escuta novas mensagens
        const messagesChannel = supabase
            .channel(`chat_messages_${userId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'chat_messages' },
                (payload) => {
                    console.log('[Realtime] Nova mensagem:', payload);
                    onChange();
                }
            )
            .subscribe();

        // Escuta novas threads criadas
        const threadsChannel = supabase
            .channel(`chat_threads_${userId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'chat_threads' },
                (payload) => {
                    console.log('[Realtime] Nova thread:', payload);
                    onChange();
                }
            )
            .subscribe();

        return { messagesChannel, threadsChannel };
    }

    /**
     * Cancela inscrições Realtime (boa prática)
     */
    static unsubscribeFromThreads(channels: { messagesChannel: any; threadsChannel: any }) {
        supabase.removeChannel(channels.messagesChannel);
        supabase.removeChannel(channels.threadsChannel);
    }
}
