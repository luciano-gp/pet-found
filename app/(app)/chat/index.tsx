import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { ChatService } from '../../../services/chatService';
import { ChatThread } from '../../../types/chat';

export default function ChatListScreen() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    let channels: { messagesChannel: any; threadsChannel: any } | null = null;

    const fetchThreads = async () => {
      try {
        setLoading(true);
        const data = await ChatService.getUserThreads(user.id);
        setThreads(data);
      } catch (error) {
        console.error('Erro ao carregar conversas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();

    channels = ChatService.subscribeToThreads(user.id, async () => {
      const data = await ChatService.getUserThreads(user.id);
      setThreads(data);
    });

    return () => {
      if (channels) ChatService.unsubscribeFromThreads(channels);
    };
  }, [user]);

  /**
   * ITEM DA LISTA
   */
  function ChatListItem({ item }: { item: ChatThread }) {
    const other = item.participants?.find((p) => p.user_id !== user?.id);

    console.log("ITEM THREAD:", item);
    console.log("OTHER PARTICIPANT:", other);

    const name = other?.users?.name ?? 'Usuário Desconhecido';
    const avatar = other?.users?.avatar_url ?? "https://placehold.co/50x50";

    const lastMessageText =
      item.last_message?.content ||
      (item.last_message?.image_url ? "📷 Imagem enviada" : "Sem mensagens");

    return (
      <Pressable
        style={styles.chatItem}
        onPress={() =>
          router.push({
            pathname: "/chat/chatScreen",
            params: { id: item.id },
          })
        }
      >
        <Image source={{ uri: avatar }} style={styles.avatar} />

        <View style={styles.chatInfo}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {lastMessageText}
          </Text>
        </View>
      </Pressable>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (threads.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Sem conversas</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={threads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatListItem item={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: "#f3f4f6",
  },
  chatInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  lastMessage: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
  },
});
