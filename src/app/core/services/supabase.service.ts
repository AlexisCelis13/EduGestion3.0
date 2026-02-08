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

export interface Student {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  parent_name?: string;
  parent_email?: string;
  parent_phone?: string;
  notes?: string;
  is_active: boolean;
  created_at?: string;
}

export interface StudentFeedback {
  id: string;
  user_id: string;
  student_id: string;
  message: string;
  created_at: string;
}

export interface StudentMaterial {
  id: string;
  user_id: string;
  student_id: string;
  title: string;
  type: 'pdf' | 'doc' | 'link';
  url: string;
  description?: string;
  created_at: string;
}

export interface Service {
  id: string;
  user_id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  category: string;
  is_active: boolean;
  target_level?: string;
  topics?: string[];
  methodology?: string;
  language?: string;
  prerequisites?: string;
  created_at?: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: 'booking_new' | 'booking_cancel' | 'booking_reminder' | 'system';
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  created_at: string;
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
    // First check if a record exists
    const { data: existing } = await this.supabase
      .from('tenant_settings')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (existing) {
      // Update existing record(s) - don't use .single() as there may be duplicates
      const { error } = await this.supabase
        .from('tenant_settings')
        .update(updates)
        .eq('user_id', userId);

      if (error) {
        return { data: null, error };
      }

      // Fetch the updated record
      const { data, error: fetchError } = await this.supabase
        .from('tenant_settings')
        .select()
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      return { data, error: fetchError };
    } else {
      // Insert new record
      const { data, error } = await this.supabase
        .from('tenant_settings')
        .insert({
          ...updates,
          user_id: userId,
          slug: updates.slug || userId.substring(0, 8),
          primary_color: updates.primary_color || '#3B82F6',
          secondary_color: updates.secondary_color || '#1E40AF',
          is_active: true
        })
        .select()
        .single();
      return { data, error };
    }
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

  async updateService(serviceId: string, updates: any) {
    const { data, error } = await this.supabase
      .from('services')
      .update(updates)
      .eq('id', serviceId)
      .select()
      .single();

    return { data, error };
  }

  async deleteService(serviceId: string) {
    // Soft delete by setting is_active to false
    const { error } = await this.supabase
      .from('services')
      .update({ is_active: false })
      .eq('id', serviceId);

    return { error };
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



  async deleteDateOverride(overrideId: string) {
    const { error } = await this.supabase
      .from('date_overrides')
      .delete()
      .eq('id', overrideId);

    return { error };
  }

  // Save multiple time blocks at once (clears existing and inserts new)
  async saveTimeBlocks(userId: string, timeBlocks: any[]) {
    // First, delete ALL existing time blocks/overrides for this user
    const deleteResult = await this.supabase
      .from('date_overrides')
      .delete()
      .eq('user_id', userId);

    if (deleteResult.error) {
      console.error('Error deleting time blocks:', deleteResult.error);
    }

    // If no new blocks to save, we're done
    if (timeBlocks.length === 0) {
      return { data: [], error: null };
    }

    // Insert all new time blocks
    const { data, error } = await this.supabase
      .from('date_overrides')
      .insert(timeBlocks)
      .select();

    if (error) {
      console.error('Error inserting time blocks:', error);
    }

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

    if (data && !error) {
      await this.createAppNotification({
        user_id: appointment.user_id, // If self-booking, user_id is the tutor
        type: 'booking_new',
        title: 'Cita Creada',
        message: `Has agendado una cita con ${appointment.student_name} para el ${appointment.date}.`,
        data: {
          appointment_id: data.id,
          date: appointment.date,
          time: appointment.start_time
        }
      });
    }

    return { data, error };
  }

  async updateAppointmentStatus(appointmentId: string, status: string) {
    const { data, error } = await this.supabase
      .from('appointments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', appointmentId)
      .select()
      .single();

    if (data && !error) {
      // Trigger notification if validation/cancellation
      if (status === 'cancelled') {
        await this.createAppNotification({
          user_id: data.user_id,
          type: 'booking_cancel',
          title: 'Cita Cancelada',
          message: `La cita con ${data.student_name} para el ${data.date} ha sido cancelada.`,
          data: { appointment_id: appointmentId, date: data.date }
        });
      }
    }

    return { data, error };
  }


  // ============================================
  // PUBLIC BOOKING METHODS
  // ============================================

  // Securely get busy slots (RPC)
  async getPublicBusySlots(tutorId: string, date: string) {
    const { data, error } = await this.supabase
      .rpc('get_busy_slots', {
        p_tutor_id: tutorId,
        p_date: date
      });

    return { data, error };
  }

  // Create appointment for guest/public (No auth required)
  async createPublicAppointment(appointment: {
    tutor_id: string;
    student_name: string; // This will now be First Name
    student_last_name?: string; // New
    student_email: string;
    student_phone?: string;
    student_dob?: string; // New
    date: string;
    start_time: string;
    end_time: string;
    service_id?: string;
    notes?: string;
    parent_name?: string;
    parent_email?: string;
    parent_phone?: string;
    payment_status?: 'pending' | 'free' | 'paid'; // New
    amount_paid?: number; // New
  }) {
    // Basic validation
    if (!appointment.tutor_id || !appointment.date || !appointment.start_time || !appointment.end_time || !appointment.student_email || !appointment.student_name) {
      return { data: null, error: { message: 'Faltan campos obligatorios' } };
    }

    // 1. Upsert Student (Create or Update) to ensure they appear in Dashboard
    // We match by email and tutor_id to avoid duplicates for this tutor
    const studentData = {
      user_id: appointment.tutor_id,
      first_name: appointment.student_name,
      last_name: appointment.student_last_name || '',
      email: appointment.student_email,
      phone: appointment.student_phone || null,
      date_of_birth: appointment.student_dob || null, // Map DOB
      parent_name: appointment.parent_name || null,
      parent_email: appointment.parent_email || null,
      parent_phone: appointment.parent_phone || null,
      is_active: true,
      notes: appointment.notes || null // Save notes to student profile
    };

    // Try to find existing student first to get ID
    let studentId = null;

    // Check if student exists
    const { data: existingStudent } = await this.supabase
      .from('students')
      .select('id')
      .eq('user_id', appointment.tutor_id)
      .eq('email', appointment.student_email)
      .maybeSingle();

    if (existingStudent) {
      studentId = existingStudent.id;
      // Optional: Update details if provided?
      // For now, let's update contact info
      await this.supabase
        .from('students')
        .update(studentData)
        .eq('id', studentId);
    } else {
      // Create new
      const { data: newStudent, error: createError } = await this.supabase
        .from('students')
        .insert(studentData)
        .select()
        .single();

      if (!createError && newStudent) {
        studentId = newStudent.id;
      }
    }

    // Generate appointment_date (Timestamp with Time Zone)
    // Combine date and start_time
    const dateTimeStr = `${appointment.date}T${appointment.start_time}`;
    const appointmentDate = new Date(dateTimeStr).toISOString();

    // Calculate duration in minutes
    const start = this.timeToMinutes(appointment.start_time);
    const end = this.timeToMinutes(appointment.end_time);
    const durationMinutes = end - start;

    const { data, error } = await this.supabase
      .from('appointments')
      .insert({
        user_id: appointment.tutor_id,
        student_id: studentId, // Link to student record
        student_name: appointment.student_name,
        student_email: appointment.student_email,
        appointment_date: appointmentDate, // Required by DB
        duration_minutes: durationMinutes, // Required by DB
        date: appointment.date,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        service_id: appointment.service_id || null,
        notes: appointment.notes || '',
        status: 'scheduled',
        payment_status: appointment.payment_status || 'pending', // Pending by default
        amount_paid: appointment.amount_paid || 0
      })
      .select()
      .single();

    if (data && !error) {
      // Notify the Tutor
      await this.createAppNotification({
        user_id: appointment.tutor_id,
        type: 'booking_new',
        title: '¡Nueva Reserva!',
        message: `Has recibido una nueva reserva de ${appointment.student_name} para el ${appointment.date} a las ${appointment.start_time}.`,
        data: {
          appointment_id: data.id,
          student_id: studentId,
          date: appointment.date,
          time: appointment.start_time
        }
      });
    }

    return { data, error };
  }

  // Updated to work for both Auth and Public users
  // Updated to work for both Auth and Public users
  async getAvailableSlotsForDate(tutorId: string, date: string, durationMinutes?: number) {
    // Get tutor's availability settings
    // Since settings are public read, this works for everyone
    const settings = await this.getAvailabilitySettings(tutorId);
    if (!settings) return [];

    // Get day of week for the requested date
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();

    // Fetch ALL time blocks for this tutor
    const { data: allOverrides } = await this.supabase
      .from('date_overrides')
      .select('*')
      .eq('user_id', tutorId);

    // Filter blocks that apply to this date
    const blocksForDate: { start_time: string; end_time: string }[] = [];
    let isFullDayBlocked = false;

    if (allOverrides) {
      for (const block of allOverrides) {
        let applies = false;

        if (block.date === date) {
          // Specific date block
          applies = true;
        } else if (!block.date && block.days_of_week && block.days_of_week.includes(dayOfWeek)) {
          // Recurring block - check if within end_date
          if (block.end_date) {
            const [endYear, endMonth, endDay] = block.end_date.split('-').map(Number);
            const endDateObj = new Date(endYear, endMonth - 1, endDay);
            applies = dateObj <= endDateObj;
          } else {
            applies = true;
          }
        }

        if (applies) {
          // Check if full day blocked
          if (block.start_time <= '00:30:00' && block.end_time >= '23:00:00') {
            isFullDayBlocked = true;
            break;
          }
          blocksForDate.push({ start_time: block.start_time, end_time: block.end_time });
        }
      }
    }

    if (isFullDayBlocked) {
      return []; // Entire day is blocked
    }

    // Get weekly schedule for this day
    const { data: weeklySlot } = await this.supabase
      .from('weekly_schedule')
      .select('*')
      .eq('user_id', tutorId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_available', true)
      .maybeSingle();

    if (!weeklySlot) return []; // Day not available

    // Get booked slots - Use RPC for security/public access
    let bookedSlots: { start_time: string, end_time: string }[] = [];

    const { data: rpcSlots, error: rpcError } = await this.getPublicBusySlots(tutorId, date);

    if (!rpcError && rpcSlots) {
      bookedSlots = rpcSlots;
    } else {
      const { data: appointments } = await this.getAppointmentsByDate(tutorId, date);
      bookedSlots = appointments || [];
    }

    // Generate available slots
    const slots: { startTime: string; endTime: string }[] = [];

    const slotDuration = durationMinutes || settings.min_session_duration;
    const stepIncrement = settings.min_session_duration;

    let currentTime = this.timeToMinutes(weeklySlot.start_time);
    const endTime = this.timeToMinutes(weeklySlot.end_time);

    const buffer = settings.buffer_between_sessions || 0;

    while (currentTime + slotDuration <= endTime) {
      const slotStart = this.minutesToTime(currentTime);
      const slotEnd = this.minutesToTime(currentTime + slotDuration);

      // Check if slot overlaps with any booked appointment
      const isBooked = bookedSlots.some(apt =>
        this.timesOverlap(slotStart, slotEnd, apt.start_time, apt.end_time)
      );

      // Check if slot overlaps with any time block
      const isBlocked = blocksForDate.some(block =>
        this.timesOverlap(slotStart, slotEnd, block.start_time, block.end_time)
      );

      if (!isBooked && !isBlocked) {
        slots.push({ startTime: slotStart, endTime: slotEnd });
      }

      currentTime += stepIncrement;
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

  // ============================================
  // NOTIFICATION METHODS (APP)
  // ============================================

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();
  private notificationSubscription: any = null;

  async initializeNotificationSubscription(userId: string) {
    if (this.notificationSubscription) {
      return;
    }

    // Initial count fetch
    await this.getAppUnreadCount(userId);

    this.notificationSubscription = this.supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          // On any change, refresh the count
          // We could be more efficient, but this ensures accuracy
          await this.getAppUnreadCount(userId);
        }
      )
      .subscribe();
  }

  async getAppNotifications(userId: string, limit = 20) {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return { data, error };
  }

  async getAppUnreadCount(userId: string) {
    const { count, error } = await this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false); // Only count unread

    if (count !== null) {
      this.unreadCountSubject.next(count);
    }

    return { count, error };
  }

  async markAppNotificationAsRead(notificationId: string) {
    const { data, error } = await this.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();

    // Refresh count after marking as read
    const user = await this.getCurrentUser();
    if (user) {
      this.getAppUnreadCount(user.id);
    }

    return { data, error };
  }

  async markAllAppNotificationsAsRead(userId: string) {
    const { data, error } = await this.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    // Update local count immediately
    this.unreadCountSubject.next(0);

    return { data, error };
  }

  async createAppNotification(notification: {
    user_id: string;
    type: 'booking_new' | 'booking_cancel' | 'booking_reminder' | 'system';
    title: string;
    message: string;
    data?: any;
  }) {
    const { data, error } = await this.supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();

    return { data, error };
  }

  // ============================================
  // STORAGE METHODS (Logos)
  // ============================================

  /**
   * Upload a logo file to Supabase Storage
   * @param userId - The user ID (used as folder name)
   * @param file - The file to upload
   * @returns The public URL of the uploaded file or null on error
   */
  async uploadLogo(userId: string, file: File): Promise<string | null> {
    try {
      // Create a unique filename with timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/logo_${Date.now()}.${fileExt}`;

      // First, delete any existing logos for this user
      await this.deleteLogo(userId);

      // Upload the new file
      const { data, error } = await this.supabase.storage
        .from('logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Error uploading logo:', error);
        return null;
      }

      // Get the public URL
      const { data: urlData } = this.supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadLogo:', error);
      return null;
    }
  }

  /**
   * Delete all logos for a user
   * @param userId - The user ID
   */
  async deleteLogo(userId: string): Promise<boolean> {
    try {
      // List all files in the user's folder
      const { data: files, error: listError } = await this.supabase.storage
        .from('logos')
        .list(userId);

      if (listError || !files || files.length === 0) {
        return true; // No files to delete
      }

      // Delete all files
      const filesToDelete = files.map(file => `${userId}/${file.name}`);
      const { error: deleteError } = await this.supabase.storage
        .from('logos')
        .remove(filesToDelete);

      if (deleteError) {
        console.error('Error deleting logos:', deleteError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteLogo:', error);
      return false;
    }
  }

  /**
   * Update tenant settings with new logo URL
   * @param userId - The user ID
   * @param logoUrl - The new logo URL (or null to remove)
   */
  async updateLogoUrl(userId: string, logoUrl: string | null): Promise<boolean> {
    // Use direct update instead of updateTenantSettings
    // because we need to pass null explicitly to clear the field
    const { error } = await this.supabase
      .from('tenant_settings')
      .update({ logo_url: logoUrl })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating logo URL:', error);
      return false;
    }
    return true;
  }

  // ============================================
  // STUDENTS MANAGEMENT METHODS
  // ============================================

  async getStudents(userId: string) {
    const { data, error } = await this.supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  async createStudent(student: any) {
    const { data, error } = await this.supabase
      .from('students')
      .insert(student)
      .select()
      .single();

    return { data, error };
  }

  async updateStudent(studentId: string, updates: any) {
    const { data, error } = await this.supabase
      .from('students')
      .update(updates)
      .eq('id', studentId)
      .select()
      .single();

    return { data, error };
  }

  async deleteStudent(studentId: string) {
    // Hard delete to trigger DB cascade and remove appointments
    const { error } = await this.supabase
      .from('students')
      .delete()
      .eq('id', studentId);

    return { error };
  }

  // ============================================
  // STUDENT FEEDBACK METHODS
  // ============================================

  async getStudentFeedback(studentId: string) {
    const { data, error } = await this.supabase
      .from('student_feedback')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  async createFeedback(feedback: { user_id: string; student_id: string; message: string }) {
    const { data, error } = await this.supabase
      .from('student_feedback')
      .insert(feedback)
      .select()
      .single();

    return { data, error };
  }

  async deleteFeedback(feedbackId: string) {
    const { error } = await this.supabase
      .from('student_feedback')
      .delete()
      .eq('id', feedbackId);

    return { error };
  }

  // ============================================
  // STUDENT MATERIALS METHODS
  // ============================================

  async getStudentMaterials(studentId: string) {
    const { data, error } = await this.supabase
      .from('student_materials')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  async createMaterial(material: {
    user_id: string;
    student_id: string;
    title: string;
    type: 'pdf' | 'doc' | 'link';
    url: string;
    description?: string | null;
  }) {
    // Filter out null/undefined description
    const insertData: any = {
      user_id: material.user_id,
      student_id: material.student_id,
      title: material.title,
      type: material.type,
      url: material.url
    };
    if (material.description) {
      insertData.description = material.description;
    }

    const { data, error } = await this.supabase
      .from('student_materials')
      .insert(insertData)
      .select()
      .single();

    return { data, error };
  }

  async deleteMaterial(materialId: string) {
    const { error } = await this.supabase
      .from('student_materials')
      .delete()
      .eq('id', materialId);

    return { error };
  }

  // ============================================
  // STUDENT MATERIALS STORAGE METHODS
  // ============================================

  /**
   * Upload a material file to Supabase Storage
   * @param userId - The user ID (used as folder name)
   * @param studentId - The student ID
   * @param file - The file to upload
   * @returns The public URL of the uploaded file or null on error
   */
  async uploadStudentMaterial(userId: string, studentId: string, file: File): Promise<string | null> {
    try {
      // Create a unique filename with timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${studentId}/${Date.now()}_${file.name}`;

      // Upload the file
      const { data, error } = await this.supabase.storage
        .from('student-materials')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading student material:', error);
        return null;
      }

      // Get the signed URL (valid for 1 year)
      const { data: urlData, error: urlError } = await this.supabase.storage
        .from('student-materials')
        .createSignedUrl(fileName, 31536000); // 1 year in seconds

      if (urlError) {
        console.error('Error getting signed URL:', urlError);
        return null;
      }

      return urlData.signedUrl;
    } catch (error) {
      console.error('Error in uploadStudentMaterial:', error);
      return null;
    }
  }

  /**
   * Delete a material file from Supabase Storage
   * @param filePath - The file path in storage
   */
  async deleteStudentMaterialFile(filePath: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from('student-materials')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting student material file:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteStudentMaterialFile:', error);
      return false;
    }
  }

  // ============================================
  // TUTOR PROFILE METHODS
  // ============================================

  async getTutorProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('tutor_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    return { data: data as TutorProfile | null, error };
  }

  async upsertTutorProfile(userId: string, profileData: Partial<TutorProfile>) {
    const { data, error } = await this.supabase
      .from('tutor_profiles')
      .upsert({
        user_id: userId,
        ...profileData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single();

    return { data, error };
  }
  // ============================================
  // PAGOS Y COBROS (Dashboard)
  // ============================================

  async getPayoutSettings(userId: string) {
    const { data, error } = await this.supabase
      .from('payout_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching payout settings:', error);
    }
    return data;
  }

  async upsertPayoutSettings(settings: any) {
    // Check if exists
    const existing = await this.getPayoutSettings(settings.user_id);

    let result;
    if (existing) {
      result = await this.supabase
        .from('payout_settings')
        .update({
          bank_name: settings.bank_name,
          account_number: settings.account_number,
          account_holder: settings.account_holder,
          updated_at: new Date()
        })
        .eq('user_id', settings.user_id);
    } else {
      result = await this.supabase
        .from('payout_settings')
        .insert(settings);
    }

    return result;
  }

  async getPaymentHistory(userId: string) {
    // Obtener citas pagadas
    const { data, error } = await this.supabase
      .from('appointments')
      .select(`
        id,
        user_id,
        amount_paid,
        appointment_date,
        status,
        service_id,
        students ( first_name, last_name, email )
      `)
      .eq('user_id', userId)
      .eq('payment_status', 'paid')
      .order('appointment_date', { ascending: false });

    if (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }
    return data;
  }

  // =============================================
  // CONSULTATION REQUESTS (Asesoría Personalizada)
  // =============================================

  async createConsultationRequest(data: {
    tutor_id: string;
    booking_for: 'me' | 'other';
    student_first_name: string;
    student_last_name: string;
    student_email?: string;
    student_phone?: string;
    student_dob?: string;
    parent_name?: string;
    parent_email?: string;
    parent_phone?: string;
    academic_level?: string;
    subjects?: string[];
    specific_topics?: string;
    current_struggles?: string;
    learning_goals?: string;
    chat_history?: any[];
  }) {
    const { data: result, error } = await this.supabase
      .from('consultation_requests')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error creating consultation request:', error);
      return { data: null, error };
    }
    return { data: result, error: null };
  }

  async getConsultationRequests(tutorId: string) {
    const { data, error } = await this.supabase
      .from('consultation_requests')
      .select(`
        *,
        study_plans (*)
      `)
      .eq('tutor_id', tutorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching consultation requests:', error);
      return [];
    }
    return data;
  }

  async getConsultationById(consultationId: string) {
    const { data, error } = await this.supabase
      .from('consultation_requests')
      .select(`
        *,
        study_plans (*)
      `)
      .eq('id', consultationId)
      .single();

    if (error) {
      console.error('Error fetching consultation:', error);
      return null;
    }
    return data;
  }

  async updateConsultationStatus(consultationId: string, status: string) {
    const { error } = await this.supabase
      .from('consultation_requests')
      .update({ status })
      .eq('id', consultationId);

    if (error) {
      console.error('Error updating consultation status:', error);
      return { error };
    }
    return { error: null };
  }

  // =============================================
  // STUDY PLANS (Planes de Estudio)
  // =============================================

  async createStudyPlan(data: {
    consultation_id: string;
    plan_title: string;
    plan_description: string;
    recommended_sessions: number;
    session_duration_minutes: number;
    total_hours: number;
    estimated_price: number;
    plan_content: any[];
    version?: number;
  }) {
    const { data: result, error } = await this.supabase
      .from('study_plans')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error creating study plan:', error);
      return { data: null, error };
    }
    return { data: result, error: null };
  }

  async getStudyPlansByTutor(tutorId: string) {
    const { data, error } = await this.supabase
      .from('study_plans')
      .select(`
        *,
        consultation_requests!inner (
          *
        )
      `)
      .eq('consultation_requests.tutor_id', tutorId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching study plans:', error);
      return [];
    }
    return data;
  }

  async getStudyPlanById(planId: string) {
    const { data, error } = await this.supabase
      .from('study_plans')
      .select(`
        *,
        consultation_requests (*)
      `)
      .eq('id', planId)
      .single();

    if (error) {
      console.error('Error fetching study plan:', error);
      return null;
    }
    return data;
  }

  async approveStudyPlanAsClient(planId: string) {
    const { error } = await this.supabase
      .from('study_plans')
      .update({ client_approved_at: new Date().toISOString() })
      .eq('id', planId);

    if (error) {
      console.error('Error approving plan as client:', error);
      return { error };
    }

    // Update consultation status
    const plan = await this.getStudyPlanById(planId);
    if (plan) {
      await this.updateConsultationStatus(plan.consultation_id, 'client_approved');
    }

    return { error: null };
  }

  async approveStudyPlanAsTutor(planId: string, notes?: string) {
    const updateData: any = { tutor_approved_at: new Date().toISOString() };
    if (notes) updateData.tutor_notes = notes;

    const { error } = await this.supabase
      .from('study_plans')
      .update(updateData)
      .eq('id', planId);

    if (error) {
      console.error('Error approving plan as tutor:', error);
      return { error };
    }

    // Update consultation status
    const plan = await this.getStudyPlanById(planId);
    if (plan) {
      await this.updateConsultationStatus(plan.consultation_id, 'tutor_approved');
    }

    return { error: null };
  }

  async rejectStudyPlan(planId: string, reason: string) {
    const { error } = await this.supabase
      .from('study_plans')
      .update({
        is_active: false,
        tutor_notes: reason
      })
      .eq('id', planId);

    if (error) {
      console.error('Error rejecting study plan:', error);
      return { error };
    }

    return { error: null };
  }

  // =============================================
  // DASHBOARD NOTIFICATIONS
  // =============================================

  async createNotification(data: {
    user_id: string;
    type: 'new_consultation' | 'plan_approved_client' | 'plan_approved_tutor' | 'payment_received' | 'appointment_booked';
    title: string;
    message: string;
    reference_type?: string;
    reference_id?: string;
  }) {
    const { data: result, error } = await this.supabase
      .from('dashboard_notifications')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return { data: null, error };
    }
    return { data: result, error: null };
  }

  async getNotifications(userId: string, unreadOnly: boolean = false) {
    let query = this.supabase
      .from('dashboard_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
    return data;
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('dashboard_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching notification count:', error);
      return 0;
    }
    return count || 0;
  }

  async markNotificationAsRead(notificationId: string) {
    const { error } = await this.supabase
      .from('dashboard_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return { error };
    }
    return { error: null };
  }

  async markAllNotificationsAsRead(userId: string) {
    const { error } = await this.supabase
      .from('dashboard_notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return { error };
    }
    return { error: null };
  }

  // =============================================
  // PERSONALIZED SERVICES (Servicios creados desde planes)
  // =============================================

  async createPersonalizedService(tutorId: string, planData: {
    planTitle: string;
    planDescription: string;
    recommendedSessions: number;
    sessionDurationMinutes: number;
    estimatedPrice: number;
    studentName: string;
  }) {
    const service = {
      user_id: tutorId,
      name: `Plan Personalizado: ${planData.studentName}`,
      description: planData.planDescription,
      price: planData.estimatedPrice,
      duration_minutes: planData.sessionDurationMinutes * planData.recommendedSessions,
      category: 'Asesoría Personalizada',
      is_active: true,
      is_personalized: true
    };

    const { data, error } = await this.supabase
      .from('services')
      .insert(service)
      .select()
      .single();

    if (error) {
      console.error('Error creating personalized service:', error);
      return { data: null, error };
    }
    return { data, error };
  }

  async deleteConsultationRequest(id: string) {
    const { error } = await this.supabase
      .from('consultation_requests')
      .delete()
      .eq('id', id);

    return { error };
  }
}


export interface TutorProfile {
  id: string;
  user_id: string;
  bio?: string;
  years_experience?: number;
  certifications?: string;
  work_experience?: string;
  subjects?: string;
  teaching_methodology?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ConsultationRequest {
  id: string;
  tutor_id: string;
  booking_for: 'me' | 'other';
  student_first_name: string;
  student_last_name: string;
  student_email?: string;
  student_phone?: string;
  student_dob?: string;
  parent_name?: string;
  parent_email?: string;
  parent_phone?: string;
  academic_level?: string;
  subjects?: string[];
  specific_topics?: string;
  current_struggles?: string;
  learning_goals?: string;
  chat_history?: any[];
  status: 'pending_plan' | 'plan_generated' | 'client_approved' | 'tutor_approved' | 'paid' | 'cancelled';
  created_at: string;
  updated_at: string;
  study_plans?: StudyPlan[];
}

export interface StudyPlan {
  id: string;
  consultation_id: string;
  plan_title: string;
  plan_description: string;
  recommended_sessions: number;
  session_duration_minutes: number;
  total_hours: number;
  estimated_price: number;
  plan_content: any[];
  version: number;
  is_active: boolean;
  client_approved_at?: string;
  tutor_approved_at?: string;
  tutor_notes?: string;
  created_at: string;
}

export interface DashboardNotification {
  id: string;
  user_id: string;
  type: 'new_consultation' | 'plan_approved_client' | 'plan_approved_tutor' | 'payment_received' | 'appointment_booked';
  title: string;
  message: string;
  reference_type?: string;
  reference_id?: string;
}