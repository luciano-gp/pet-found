import React, { useEffect, useRef, useState } from 'react';
import { FlatList, TextInput, View, Text, TouchableOpacity, Image, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { ChatService } from '../../../services/chatService';
import { ChatMessage } from '../../../types/chat';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { ImagePickerComponent } from '../../../components/ui/ImagePicker';
import { StorageService } from '../../../services/storageService';


export default function ChatScreen() {
  const { id: threadId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [showImagePicker, setShowImagePicker] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Função para adicionar mensagens sem duplicar
  const addMessage = (newMsg: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev; // evita duplicatas
      return [...prev, newMsg];
    });
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      const msgs = await ChatService.getMessages(threadId);
      setMessages(msgs);
      flatListRef.current?.scrollToEnd({ animated: true });
    };
    fetchMessages();

    const subscription = ChatService.subscribeToMessages(threadId, (msg) => {
      addMessage(msg);
    });

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [threadId]);

  const handleSend = async () => {
  // Não envia se não houver texto nem imagem
  if (!message.trim() && !selectedImage) return;

  try {
    let imageUrl: string | undefined;

    if (selectedImage) {
      // Faz upload usando StorageService para o bucket 'chat-images'
      console.log('Enviando imagem selecionada...');
      imageUrl = await StorageService.uploadImage(selectedImage, 'chat-images');
      console.log('Imagem enviada com sucesso:', imageUrl);
    }

    // Cria a mensagem no chat
    const newMsg = await ChatService.sendMessage({
      thread_id: threadId,
      sender_id: user?.id!,
      content: message.trim() || undefined,
      image_url: imageUrl,
    });

    // Adiciona a mensagem à lista (evita duplicação)
    addMessage(newMsg);

    // Limpa os estados
    setMessage('');
    setSelectedImage(null);
    setShowImagePicker(false);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    Alert.alert('Erro', 'Não foi possível enviar a mensagem.');
  }
};

  const handleImageSelected = async (uri: string) => {
  if (!user) return;

  try {
    console.log('Iniciando upload da imagem...');
    
    // Reutiliza o StorageService do app
    const imageUrl = await StorageService.uploadImage(uri, 'chat-images');
    
    console.log('Imagem enviada com sucesso:', imageUrl);

    // Cria a mensagem no chat com a imagem
    const imgMsg = await ChatService.sendMessage({
      thread_id: threadId,
      sender_id: user.id,
      image_url: imageUrl,
    });

    // Adiciona a mensagem à lista
    addMessage(imgMsg);

    // Fecha o ImagePicker
    setShowImagePicker(false);
  } catch (error) {
    console.error('Erro ao enviar imagem:', error);
    Alert.alert('Erro', 'Não foi possível enviar a imagem.');
  }
}

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUserMessage = item.sender_id === user?.id;
    return (
      <View style={[styles.messageContainer, isUserMessage ? styles.userMessage : styles.otherMessage]}>
        {item.content && <Text style={styles.messageText}>{item.content}</Text>}
        {item.image_url && <Image source={{ uri: item.image_url }} style={styles.messageImage} />}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {showImagePicker && <ImagePickerComponent
                            onImageSelected={(uri) => setSelectedImage(uri)}
                            loading={false}
                          />
      }

      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={() => setShowImagePicker((prev) => !prev)}>
          <Ionicons name="image-outline" size={28} color="#007AFF" />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Digite uma mensagem..."
          value={message}
          onChangeText={setMessage}
        />

        <TouchableOpacity onPress={handleSend}>
          <Ionicons name="send" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  messageList: { padding: 10 },
  messageContainer: {
    marginVertical: 6,
    maxWidth: '80%',
    borderRadius: 10,
    padding: 10,
  },
  userMessage: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
  },
  otherMessage: {
    backgroundColor: '#F1F0F0',
    alignSelf: 'flex-start',
  },
  messageText: { fontSize: 16 },
  messageImage: { width: 200, height: 200, borderRadius: 10, marginTop: 5 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f1f1',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 8,
  },
});
