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
}