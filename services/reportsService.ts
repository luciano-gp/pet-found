import { CreateReportData, Report, UpdateReportData } from '../types/pet';
import { supabase } from './supabase';

export class ReportsService {
  static async createReport(data: CreateReportData): Promise<Report> {
    try {
      console.log('ReportsService: Iniciando criação do relato...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('ReportsService: Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }

      console.log('ReportsService: Usuário autenticado, ID:', user.id);
      console.log('ReportsService: Dados do relato:', data);

      const { data: report, error } = await supabase
        .from('reports')
        .insert({
          user_id: user.id,
          species: data.species,
          description: data.description,
          image_url: data.image_url,
          location_name: data.location_name,
          latitude: data.latitude,
          longitude: data.longitude,
        })
        .select()
        .single();

      if (error) {
        console.error('ReportsService: Erro ao criar relato:', error);
        throw new Error(error.message);
      }

      console.log('ReportsService: Relato criado com sucesso:', report);
      return report;
    } catch (error) {
      console.error('ReportsService: Erro detalhado ao criar relato:', error);
      console.error('ReportsService: Stack trace:', error instanceof Error ? error.stack : 'N/A');
      throw error;
    }
  }

  static async getAllReports(): Promise<Report[]> {
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return reports || [];
  }

  static async getUserReports(): Promise<Report[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return reports || [];
  }

  static async updateReport(id: string, data: UpdateReportData): Promise<Report> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: report, error } = await supabase
      .from('reports')
      .update(data)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return report;
  }

  static async deleteReport(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(error.message);
    }
  }

  static async getReportById(id: string): Promise<Report | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: report, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Report not found
      }
      throw new Error(error.message);
    }

    return report;
  }
} 