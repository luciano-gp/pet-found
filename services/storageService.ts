import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';

export class StorageService {
  static async uploadImage(uri: string, fileName: string): Promise<string> {
    try {
      console.log('StorageService: Iniciando upload da imagem:', uri);
      
      // Lê o arquivo como base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log('StorageService: Arquivo lido como base64, tamanho:', base64.length);

      // Gera um nome único para o arquivo
      const fileExt = uri.split('.').pop();
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      console.log('StorageService: Nome do arquivo gerado:', uniqueFileName);

      // Faz upload para o bucket pet-image
      console.log('StorageService: Fazendo upload para o bucket pet-image...');
      const { data, error } = await supabase.storage
        .from('pet-image')
        .upload(uniqueFileName, decode(base64), {
          contentType: `image/${fileExt}`,
        });

      if (error) {
        console.error('StorageService: Erro no upload:', error);
        throw new Error(error.message);
      }

      console.log('StorageService: Upload realizado com sucesso, obtendo URL pública...');
      // Retorna a URL pública da imagem
      const { data: { publicUrl } } = supabase.storage
        .from('pet-image')
        .getPublicUrl(uniqueFileName);

      console.log('StorageService: URL pública obtida:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('StorageService: Erro detalhado:', error);
      console.error('StorageService: Stack trace:', error instanceof Error ? error.stack : 'N/A');
      throw new Error(`Erro ao fazer upload da imagem: ${error}`);
    }
  }

  static async deleteImage(fileName: string): Promise<void> {
    try {
      console.log('StorageService: Deletando imagem:', fileName);
      const { error } = await supabase.storage
        .from('pet-image')
        .remove([fileName]);

      if (error) {
        console.error('StorageService: Erro ao deletar:', error);
        throw new Error(error.message);
      }
      console.log('StorageService: Imagem deletada com sucesso');
    } catch (error) {
      console.error('StorageService: Erro ao deletar imagem:', error);
      throw new Error(`Erro ao deletar imagem: ${error}`);
    }
  }
}

// Função auxiliar para decodificar base64
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
} 