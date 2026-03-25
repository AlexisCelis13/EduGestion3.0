import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SubscriptionService } from './subscription.service';
import { Professor, ServiceProfessor } from '../models/professor.model';

@Injectable({
  providedIn: 'root'
})
export class ProfessorService {

  constructor(
    private supabaseService: SupabaseService,
    private subscriptionService: SubscriptionService
  ) { }

  /**
   * Obtiene todos los profesores asociados a la academia (dueño actual)
   */
  async getProfessors(): Promise<Professor[]> {
    const user = await this.supabaseService.getCurrentUser();
    if (!user) throw new Error('No user logged in');

    const { data, error } = await this.supabaseService.client
      .from('professors')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  /**
   * Obtiene un profesor con sus servicios asignados
   */
  async getProfessorWithServices(professorId: string): Promise<{ professor: Professor, serviceIds: string[] }> {
    const { data: professor, error: profError } = await this.supabaseService.client
      .from('professors')
      .select('*')
      .eq('id', professorId)
      .single();

    if (profError) throw profError;

    const { data: services, error: servError } = await this.supabaseService.client
      .from('service_professors')
      .select('service_id')
      .eq('professor_id', professorId);

    if (servError) throw servError;

    return {
      professor,
      serviceIds: services ? services.map(s => s.service_id) : []
    };
  }

  /**
   * Crea un nuevo perfil de profesor
   */
  async createProfessor(professorData: Partial<Professor>, serviceIds: string[] = []): Promise<Professor> {
    const user = await this.supabaseService.getCurrentUser();
    if (!user) throw new Error('No user logged in');

    const limitCheck = await this.subscriptionService.canAddProfessor(user.id);
    if (!limitCheck.allowed) {
      throw new Error(`Has alcanzado el límite de ${limitCheck.limit} profesor${limitCheck.limit === 1 ? '' : 'es'} activos de tu plan actual (${limitCheck.current}/${limitCheck.limit}). Actualiza tu plan para agregar más.`);
    }

    const { data, error } = await this.supabaseService.client
      .from('professors')
      .insert([{ 
        ...professorData, 
        user_id: user.id 
      }])
      .select()
      .single();

    if (error) throw error;

    if (serviceIds.length > 0 && data) {
      await this.assignServicesToProfessor(data.id, serviceIds);
    }

    return data;
  }

  /**
   * Actualiza el perfil de un profesor
   */
  async updateProfessor(professorId: string, professorData: Partial<Professor>, serviceIds?: string[]): Promise<Professor> {
    const { data, error } = await this.supabaseService.client
      .from('professors')
      .update(professorData)
      .eq('id', professorId)
      .select()
      .single();

    if (error) throw error;

    if (serviceIds !== undefined) {
      await this.assignServicesToProfessor(professorId, serviceIds);
    }

    return data;
  }

  /**
   * Sincroniza (borra e inserta) las materias que puede impartir un profesor
   */
  async assignServicesToProfessor(professorId: string, serviceIds: string[]): Promise<void> {
    // Primero borramos todas las asignaciones anteriores
    const { error: deleteError } = await this.supabaseService.client
      .from('service_professors')
      .delete()
      .eq('professor_id', professorId);

    if (deleteError) throw deleteError;

    // Si hay materias para agregar, las insertamos
    if (serviceIds.length > 0) {
      const inserts = serviceIds.map(serviceId => ({
        professor_id: professorId,
        service_id: serviceId
      }));

      const { error: insertError } = await this.supabaseService.client
        .from('service_professors')
        .insert(inserts);

      if (insertError) throw insertError;
    }
  }

  /**
   * Cambia el estado (activo/inactivo) de un profesor (Soft Delete)
   */
  async toggleProfessorStatus(professorId: string, isActive: boolean): Promise<void> {
    const { error } = await this.supabaseService.client
      .from('professors')
      .update({ is_active: isActive })
      .eq('id', professorId);

    if (error) throw error;
  }
}

