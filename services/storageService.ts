import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';

export class StorageService {
  /**
   * Faz upload de uma imagem para o Supabase Storage
   * @param uri URI local da imagem
   * @param bucket Nome do bucket (ex: 'chat-images', 'pet-image')
   * @returns URL pública da imagem
   */
  static async uploadImage(uri: string, bucket: string): Promise<string> {
    try {
      console.log(`[StorageService] Iniciando upload para bucket "${bucket}":`, uri);

      // Lê o arquivo como base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log(`[StorageService] Arquivo lido como base64, tamanho:`, base64.length);

      // Gera nome único
      const fileExt = uri.split('.').pop();
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      console.log(`[StorageService] Nome do arquivo gerado:`, uniqueFileName);

      // Upload para o bucket especificado
      const { error } = await supabase.storage
        .from(bucket)
        .upload(uniqueFileName, decode(base64), {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (error) {
        console.error(`[StorageService] Erro no upload:`, error);
        throw new Error(error.message);
      }

      console.log(`[StorageService] Upload realizado com sucesso, obtendo URL pública...`);

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(uniqueFileName);

      console.log(`[StorageService] URL pública obtida:`, publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('[StorageService] Erro detalhado:', error);
      console.error('[StorageService] Stack trace:', error instanceof Error ? error.stack : 'N/A');
      throw new Error(`Erro ao fazer upload da imagem: ${error}`);
    }
  }

  /**
   * Deleta uma imagem do bucket
   * @param bucket Nome do bucket
   * @param fileName Nome do arquivo a ser deletado
   */
  static async deleteImage(bucket: string, fileName: string): Promise<void> {
    try {
      console.log(`[StorageService] Deletando imagem "${fileName}" do bucket "${bucket}"`);
      const { error } = await supabase.storage
        .from(bucket)
        .remove([fileName]);

      if (error) {
        console.error(`[StorageService] Erro ao deletar:`, error);
        throw new Error(error.message);
      }
      console.log(`[StorageService] Imagem deletada com sucesso`);
    } catch (error) {
      console.error('[StorageService] Erro ao deletar imagem:', error);
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