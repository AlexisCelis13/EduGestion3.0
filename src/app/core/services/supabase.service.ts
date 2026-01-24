import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Profile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  role?: 'director' | 'tutor_independiente';
  estimated_monthly_income?: number | null;
  onboarding_completed: boolean;
  subscription_status: 'trial' | 'active' | 'cancelled' | 'expired';
  subscription_plan?: 'freelance' | 'academia' | 'enterprise';
}

export interface TenantSettings {
  id: string;
  user_id: string;
  slug: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  company_description?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  is_active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey
    );

    // Escuchar cambios de autenticación
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.currentUserSubject.next(session?.user ?? null);
    });
  }

  // Auth Methods
  async emailExists(email: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    // Si encontramos un registro, el email ya existe
    return data !== null;
  }

  async signUp(email: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();

    // Primero verificar si el email ya está registrado en profiles
    const exists = await this.emailExists(normalizedEmail);
    if (exists) {
      return {
        data: { user: null, session: null },
        error: { message: 'Este correo electrónico ya está registrado. Por favor inicia sesión.', status: 400 } as any
      };
    }

    // Intentar crear el usuario
    const { data, error } = await this.supabase.auth.signUp({
      email: normalizedEmail,
      password
    });

    // Si hay un error explícito, retornarlo
    if (error) {
      // Traducir mensaje de error común
      if (error.message.includes('User already registered')) {
        return {
          data: { user: null, session: null },
          error: { message: 'Este correo electrónico ya está registrado. Por favor inicia sesión.', status: 400 } as any
        };
      }
      return { data, error };
    }

    // Supabase a veces devuelve un usuario "falso" para emails existentes (por seguridad)
    // Verificar si el usuario tiene identities vacías - esto indica email ya registrado
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return {
        data: { user: null, session: null },
        error: { message: 'Este correo electrónico ya está registrado. Por favor inicia sesión.', status: 400 } as any
      };
    }

    return { data, error };
  }


  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    return { error };
  }

  // Password Recovery Methods
  async resetPasswordForEmail(email: string) {
    const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });
    return { data, error };
  }

  async updatePassword(newPassword: string) {
    const { data, error } = await this.supabase.auth.updateUser({
      password: newPassword
    });
    return { data, error };
  }

  async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  // Profile Methods
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  }

  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  }

  // Tenant Settings Methods
  async getTenantSettings(userId: string): Promise<TenantSettings | null> {
    const { data, error } = await this.supabase
      .from('tenant_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching tenant settings:', error);
      return null;
    }
    return data;
  }

  async getTenantSettingsBySlug(slug: string): Promise<TenantSettings | null> {
    const { data, error } = await this.supabase
      .from('tenant_settings')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching tenant settings by slug:', error);
      return null;
    }
    return data;
  }

  async createTenantSettings(settings: Omit<TenantSettings, 'id'>) {
    const { data, error } = await this.supabase
      .from('tenant_settings')
      .insert(settings)
      .select()
      .single();

    return { data, error };
  }

  async updateTenantSettings(userId: string, updates: Partial<TenantSettings>) {
    const { data, error } = await this.supabase
      .from('tenant_settings')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    return { data, error };
  }

  // Onboarding Progress Methods
  async getOnboardingProgress(userId: string) {
    const { data, error } = await this.supabase
      .from('onboarding_progress')
      .select('*')
      .eq('user_id', userId);

    return { data, error };
  }

  async updateOnboardingStep(userId: string, stepName: string, completed: boolean) {
    const { data, error } = await this.supabase
      .from('onboarding_progress')
      .upsert({
        user_id: userId,
        step_name: stepName,
        completed,
        completed_at: completed ? new Date().toISOString() : null
      })
      .select()
      .single();

    return { data, error };
  }

  // Services Methods
  async getServices(userId: string) {
    const { data, error } = await this.supabase
      .from('services')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  async createService(service: any) {
    const { data, error } = await this.supabase
      .from('services')
      .insert(service)
      .select()
      .single();

    return { data, error };
  }

  // ============================================
  // SCHEDULE MANAGEMENT METHODS
  // ============================================

  // Availability Settings
  async getAvailabilitySettings(userId: string) {
    const { data, error } = await this.supabase
      .from('availability_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching availability settings:', error);
      return null;
    }
    return data;
  }

  async upsertAvailabilitySettings(settings: any) {
    const { data, error } = await this.supabase
      .from('availability_settings')
      .upsert(settings, { onConflict: 'user_id' })
      .select()
      .single();

    return { data, error };
  }

  // Weekly Schedule
  async getWeeklySchedule(userId: string) {
    const { data, error } = await this.supabase
      .from('weekly_schedule')
      .select('*')
      .eq('user_id', userId)
      .order('day_of_week', { ascending: true });

    if (error) {
      console.error('Error fetching weekly schedule:', error);
      return null;
    }
    return data;
  }

  async upsertWeeklySchedule(schedule: any) {
    // Delete existing entry for this day and insert new one
    await this.supabase
      .from('weekly_schedule')
      .delete()
      .eq('user_id', schedule.user_id)
      .eq('day_of_week', schedule.day_of_week);

    const { data, error } = await this.supabase
      .from('weekly_schedule')
      .insert(schedule)
      .select()
      .single();

    return { data, error };
  }

  // Date Overrides
  async getDateOverrides(userId: string) {
    const { data, error } = await this.supabase
      .from('date_overrides')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching date overrides:', error);
      return null;
    }
    return data;
  }

  async upsertDateOverride(override: any) {
    // If it has an ID, update it; otherwise insert
    if (override.id) {
      const { data, error } = await this.supabase
        .from('date_overrides')
        .update(override)
        .eq('id', override.id)
        .select()
        .single();
      return { data, error };
    }

    const { data, error } = await this.supabase
      .from('date_overrides')
      .insert(override)
      .select()
      .single();

    return { data, error };
  }

  async deleteDateOverride(overrideId: string) {
    const { error } = await this.supabase
      .from('date_overrides')
      .delete()
      .eq('id', overrideId);

    return { error };
  }

  // Save multiple time blocks at once (clears existing and inserts new)
  async saveTimeBlocks(userId: string, timeBlocks: any[]) {
    // First, delete all existing time blocks for this user (those with start_time)
    await this.supabase
      .from('date_overrides')
      .delete()
      .eq('user_id', userId)
      .not('start_time', 'is', null);

    // If no new blocks to save, we're done
    if (timeBlocks.length === 0) {
      return { data: [], error: null };
    }

    // Insert all new time blocks
    const { data, error } = await this.supabase
      .from('date_overrides')
      .insert(timeBlocks)
      .select();

    return { data, error };
  }

  // Appointments
  async getAppointments(userId: string) {
    const { data, error } = await this.supabase
      .from('appointments')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching appointments:', error);
      return null;
    }
    return data;
  }

  async getAppointmentsByDate(userId: string, date: string) {
    const { data, error } = await this.supabase
      .from('appointments')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .neq('status', 'cancelled')
      .order('start_time', { ascending: true });

    return { data, error };
  }

  async createAppointment(appointment: any) {
    const { data, error } = await this.supabase
      .from('appointments')
      .insert(appointment)
      .select()
      .single();

    return { data, error };
  }

  async updateAppointmentStatus(appointmentId: string, status: string) {
    const { data, error } = await this.supabase
      .from('appointments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', appointmentId)
      .select()
      .single();

    return { data, error };
  }

  // Get available slots for a specific date (for booking)
  async getAvailableSlotsForDate(tutorId: string, date: string) {
    // Get tutor's availability settings
    const settings = await this.getAvailabilitySettings(tutorId);
    if (!settings) return [];

    // Check if date has an override (blocked)
    const { data: overrides } = await this.supabase
      .from('date_overrides')
      .select('*')
      .eq('user_id', tutorId)
      .eq('date', date)
      .maybeSingle();

    if (overrides && !overrides.is_available) {
      return []; // Date is blocked
    }

    // Get day of week and weekly schedule
    const dayOfWeek = new Date(date).getDay();
    const { data: weeklySlot } = await this.supabase
      .from('weekly_schedule')
      .select('*')
      .eq('user_id', tutorId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_available', true)
      .maybeSingle();

    if (!weeklySlot) return []; // Day not available

    // Get existing appointments for this date
    const { data: appointments } = await this.getAppointmentsByDate(tutorId, date);
    const bookedSlots = appointments || [];

    // Generate available slots
    const slots: { startTime: string; endTime: string }[] = [];
    const slotDuration = settings.min_session_duration;

    let currentTime = this.timeToMinutes(weeklySlot.start_time);
    const endTime = this.timeToMinutes(weeklySlot.end_time);

    while (currentTime + slotDuration <= endTime) {
      const slotStart = this.minutesToTime(currentTime);
      const slotEnd = this.minutesToTime(currentTime + slotDuration);

      // Check if slot overlaps with any booked appointment
      const isBooked = bookedSlots.some(apt =>
        this.timesOverlap(slotStart, slotEnd, apt.start_time, apt.end_time)
      );

      if (!isBooked) {
        slots.push({ startTime: slotStart, endTime: slotEnd });
      }

      currentTime += slotDuration;
    }

    return slots;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    const s1 = this.timeToMinutes(start1);
    const e1 = this.timeToMinutes(end1);
    const s2 = this.timeToMinutes(start2);
    const e2 = this.timeToMinutes(end2);
    return s1 < e2 && e1 > s2;
  }
}