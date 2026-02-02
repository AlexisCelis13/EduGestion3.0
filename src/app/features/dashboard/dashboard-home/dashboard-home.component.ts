import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupabaseService, Profile } from '../../../core/services/supabase.service';

interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
  route: string;
}

import { LucideAngularModule, Calendar, Clock, User, ChevronRight } from 'lucide-angular';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  providers: [{ provide: 'LUCIDE_ICONS', useValue: { Calendar, Clock, User, ChevronRight } }],
  template: `
    <div class="min-h-screen">
      <!-- Header -->
      <div class="bg-white border-b border-surface-100">
        <div class="max-w-7xl mx-auto px-6 lg:px-8">
          <div class="flex justify-between items-center py-8">
            <div>
              <h1 class="text-2xl font-semibold text-surface-700">
                ¡Hola{{ profile()?.first_name ? ', ' + profile()?.first_name : '' }}!
              </h1>
              <p class="text-surface-400 mt-1">
                Bienvenido a tu panel de control de EduGestión
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <!-- Widget Principal de Onboarding - Solo visible si no se han completado todos los pasos -->
        @if (completedTasks() < onboardingTasks.length) {
          <div class="card-premium p-6 mb-8">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 class="text-xl font-semibold text-surface-700">
                  Explora EduGestión siguiendo estos pasos
                </h2>
                <p class="text-surface-400 mt-1">
                  Completa estos pasos para aprovechar al máximo la plataforma
                </p>
              </div>
              <div class="text-right">
                <div class="text-3xl font-semibold text-primary-600">
                  {{ completedTasks() }}/{{ onboardingTasks.length }}
                </div>
                <div class="text-sm text-surface-400">completados</div>
              </div>
            </div>

            <!-- Barra de Progreso -->
            <div class="mb-8">
              <div class="flex justify-between text-sm text-surface-500 mb-2">
                <span>Progreso de configuración</span>
                <span class="font-medium text-surface-700">{{ Math.round((completedTasks() / onboardingTasks.length) * 100) }}%</span>
              </div>
              <div class="w-full bg-surface-100 rounded-full h-2.5">
                <div 
                  class="bg-gradient-to-r from-primary-500 to-primary-600 h-2.5 rounded-full transition-all duration-500"
                  [style.width.%]="(completedTasks() / onboardingTasks.length) * 100">
                </div>
              </div>
            </div>

            <!-- Tarjetas de Tareas -->
            <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              @for (task of onboardingTasks; track task.id) {
                <div class="card-premium p-5 cursor-pointer hover-lift"
                     [class.bg-accent-green]="task.completed"
                     [class.bg-opacity-5]="task.completed"
                     [routerLink]="task.route">
                  <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 rounded-2xl flex items-center justify-center"
                         [class.bg-accent-green]="task.completed"
                         [class.bg-opacity-15]="task.completed"
                         [class.bg-primary-50]="!task.completed">
                      @if (task.completed) {
                        <svg class="w-6 h-6 text-accent-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      } @else {
                        <span class="text-2xl">{{ task.icon }}</span>
                      }
                    </div>
                    @if (task.completed) {
                      <span class="text-xs font-medium bg-accent-green bg-opacity-10 text-accent-green px-2.5 py-1 rounded-full">
                        Completado
                      </span>
                    }
                  </div>
                  <h3 class="font-semibold text-surface-700 mb-1.5">{{ task.title }}</h3>
                  <p class="text-sm text-surface-400 leading-relaxed">{{ task.description }}</p>
                </div>
              }
            </div>
          </div>
        }


        <!-- Stats Cards -->
        <div class="grid md:grid-cols-4 gap-6 mb-8">
          <div class="card-premium p-6 hover-lift">
            <div class="flex items-center">
              <div class="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center">
                <svg class="w-6 h-6 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-surface-400">Alumnos Activos</p>
                <p class="text-2xl font-semibold text-surface-700">{{ activeStudents() }}</p>
              </div>
            </div>
          </div>

          <div class="card-premium p-6 hover-lift">
            <div class="flex items-center">
              <div class="w-12 h-12 bg-accent-green/10 rounded-2xl flex items-center justify-center">
                <svg class="w-6 h-6 text-accent-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-surface-400">Clases Esta Semana</p>
                <p class="text-2xl font-semibold text-surface-700">{{ classesThisWeek() }}</p>
              </div>
            </div>
          </div>

          <div class="card-premium p-6 hover-lift">
            <div class="flex items-center">
              <div class="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                <svg class="w-6 h-6 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
                  <path d="M12 18V6"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-surface-400">Ingresos Este Mes</p>
                <p class="text-2xl font-semibold text-surface-700">{{ formatCurrency(monthlyRevenue()) }}</p>
              </div>
            </div>
          </div>

          <div class="card-premium p-6 hover-lift">
            <div class="flex items-center">
              <div class="w-12 h-12 bg-accent-indigo/10 rounded-2xl flex items-center justify-center">
                <svg class="w-6 h-6 text-accent-indigo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-surface-400">Servicios Activos</p>
                <p class="text-2xl font-semibold text-surface-700">{{ activeServices() }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Próximas Citas -->
        <div class="card-premium p-6 mb-8">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-semibold text-surface-700">Próximas Citas</h3>
            <a routerLink="/dashboard/schedule/calendar" class="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors">
              Ver calendario completo
              <i-lucide name="chevron-right" class="w-4 h-4"></i-lucide>
            </a>
          </div>

          @if (upcomingAppointments().length === 0) {
            <div class="text-center py-8 bg-surface-50 rounded-xl border border-surface-100 border-dashed">
              <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                <i-lucide name="calendar" class="w-6 h-6 text-surface-400"></i-lucide>
              </div>
              <p class="text-surface-500 font-medium">No tienes citas programadas</p>
              <p class="text-sm text-surface-400 mt-1">Comparte tu landing page para recibir reservas</p>
            </div>
          } @else {
            <div class="divide-y divide-surface-100">
              @for (apt of upcomingAppointments(); track apt.id) {
                <div class="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-primary-50 text-primary-700 rounded-xl flex flex-col items-center justify-center font-semibold border border-primary-100">
                      <span class="text-xs uppercase">{{ apt.date | date:'MMM' }}</span>
                      <span class="text-lg leading-none">{{ apt.date | date:'dd' }}</span>
                    </div>
                    <div>
                      <p class="font-medium text-surface-900">{{ apt.student_name }}</p>
                      <div class="flex items-center gap-3 text-sm text-surface-500 mt-0.5">
                        <span class="flex items-center gap-1">
                          <i-lucide name="clock" class="w-3.5 h-3.5"></i-lucide>
                          {{ apt.start_time.substring(0, 5) }} - {{ apt.end_time.substring(0, 5) }}
                        </span>
                        @if (apt.services?.name) {
                          <span class="w-1 h-1 bg-surface-300 rounded-full"></span>
                          <span>{{ apt.services.name }}</span>
                        }
                      </div>
                    </div>
                  </div>
                  <div class="hidden sm:block">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          [class.bg-blue-100]="apt.status === 'scheduled'"
                          [class.text-blue-800]="apt.status === 'scheduled'"
                          [class.bg-green-100]="apt.status === 'confirmed'"
                          [class.text-green-800]="apt.status === 'confirmed'"
                          [class.bg-yellow-100]="apt.status === 'pending'"
                          [class.text-yellow-800]="apt.status === 'pending'">
                      {{ apt.status === 'scheduled' ? 'Confirmada' : apt.status }}
                    </span>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Acciones Rápidas -->
        <div class="card-premium p-6">
          <h3 class="text-lg font-semibold text-surface-700 mb-5">Acciones Rápidas</h3>
          <div class="grid md:grid-cols-3 gap-4">
            <button class="card-premium flex items-center p-5 text-left hover-lift">
              <div class="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mr-4 shrink-0">
                <svg class="w-6 h-6 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </div>
              <div>
                <p class="font-semibold text-surface-700">Agregar Alumno</p>
                <p class="text-sm text-surface-400">Registra un nuevo estudiante</p>
              </div>
            </button>

            <button class="card-premium flex items-center p-5 text-left hover-lift">
              <div class="w-12 h-12 bg-accent-green/10 rounded-2xl flex items-center justify-center mr-4 shrink-0">
                <svg class="w-6 h-6 text-accent-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div>
                <p class="font-semibold text-surface-700">Programar Clase</p>
                <p class="text-sm text-surface-400">Agenda una nueva sesión</p>
              </div>
            </button>

            <button class="card-premium flex items-center p-5 text-left hover-lift">
              <div class="w-12 h-12 bg-accent-indigo/10 rounded-2xl flex items-center justify-center mr-4 shrink-0">
                <svg class="w-6 h-6 text-accent-indigo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
              </div>
              <div>
                <p class="font-semibold text-surface-700">Ver Reportes</p>
                <p class="text-sm text-surface-400">Analiza tu rendimiento</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardHomeComponent implements OnInit {
  profile = signal<Profile | null>(null);
  Math = Math;

  onboardingTasks: OnboardingTask[] = [
    {
      id: 'landing-page',
      title: 'Configura tu Landing Page',
      description: 'Personaliza tu página web donde los alumnos pueden conocerte',
      icon: '🌐',
      completed: false,
      route: '/dashboard/landing-editor'
    },
    {
      id: 'first-service',
      title: 'Crea tu primer Servicio',
      description: 'Define las materias o clases que ofreces',
      icon: '📚',
      completed: false,
      route: '/dashboard/services'
    },
    {
      id: 'bank-account',
      title: 'Vincula tu cuenta bancaria',
      description: 'Configura Stripe para recibir pagos automáticamente',
      icon: '💳',
      completed: false,
      route: '/dashboard/payments'
    },
    {
      id: 'schedule',
      title: 'Configura tu horario',
      description: 'Define tu disponibilidad para recibir reservaciones',
      icon: '⏰',
      completed: false,
      route: '/dashboard/schedule/settings'
    }
  ];

  completedTasks = signal(0);
  upcomingAppointments = signal<any[]>([]);

  // Dashboard stats
  activeStudents = signal(0);
  classesThisWeek = signal(0);
  monthlyRevenue = signal(0);
  activeServices = signal(0);

  constructor(private supabaseService: SupabaseService) { }

  async ngOnInit() {
    await this.loadProfile();
    await this.loadOnboardingProgress();
    await this.loadAppointments();
    await this.loadStats();
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  }

  private async loadStats() {
    const user = await this.supabaseService.getCurrentUser();
    if (!user) return;

    // Load active students count
    const { data: students } = await this.supabaseService.getStudents(user.id);
    if (students) {
      this.activeStudents.set(students.length); // getStudents already filters by is_active
    }

    // Load active services count
    const { data: services } = await this.supabaseService.getServices(user.id);
    if (services) {
      this.activeServices.set(services.length);
    }

    // Load appointments for stats
    const appointments = await this.supabaseService.getAppointments(user.id);
    if (appointments) {
      const now = new Date();

      // Classes this week
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);

      const thisWeekClasses = appointments.filter((a: any) => {
        const aptDate = new Date(a.date);
        return aptDate >= startOfWeek && aptDate < endOfWeek && a.status !== 'cancelled';
      });
      this.classesThisWeek.set(thisWeekClasses.length);

      // Revenue this month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const monthlyPaid = appointments.filter((a: any) => {
        const aptDate = new Date(a.date);
        return aptDate >= startOfMonth && aptDate <= endOfMonth && a.payment_status === 'paid';
      });

      const totalRevenue = monthlyPaid.reduce((sum: number, a: any) => sum + (Number(a.amount_paid) || 0), 0);
      this.monthlyRevenue.set(totalRevenue);
    }
  }

  private async loadAppointments() {
    const user = await this.supabaseService.getCurrentUser();
    if (user) {
      const appointments = await this.supabaseService.getAppointments(user.id);

      if (appointments) {
        // Filter future appointments and take top 5
        const now = new Date();
        const future = appointments
          .filter((a: any) => new Date(a.date + 'T' + a.start_time) >= now && a.status !== 'cancelled')
          .slice(0, 5);

        this.upcomingAppointments.set(future);
      }
    }
  }

  private async loadProfile() {
    const user = await this.supabaseService.getCurrentUser();
    if (user) {
      const profile = await this.supabaseService.getProfile(user.id);
      this.profile.set(profile);
    }
  }

  private async loadOnboardingProgress() {
    const user = await this.supabaseService.getCurrentUser();
    if (user) {
      const { data: progress } = await this.supabaseService.getOnboardingProgress(user.id);

      let completed = 0;

      // Check each task's actual state
      for (const task of this.onboardingTasks) {
        let isCompleted = false;

        // First check onboarding_progress table
        if (progress) {
          const taskProgress = progress.find(p => p.step_name === task.id);
          if (taskProgress?.completed) {
            isCompleted = true;
          }
        }

        // For bank-account, also check if payout_settings exists
        if (task.id === 'bank-account' && !isCompleted) {
          const payoutSettings = await this.supabaseService.getPayoutSettings(user.id);
          if (payoutSettings && payoutSettings.account_number) {
            isCompleted = true;
            // Sync back to onboarding_progress
            await this.supabaseService.updateOnboardingStep(user.id, 'bank-account', true);
          }
        }

        // For schedule, check if weekly_schedule exists
        if (task.id === 'schedule' && !isCompleted) {
          const weeklySchedule = await this.supabaseService.getWeeklySchedule(user.id);
          if (weeklySchedule && weeklySchedule.length > 0) {
            isCompleted = true;
            // Sync back to onboarding_progress
            await this.supabaseService.updateOnboardingStep(user.id, 'schedule', true);
          }
        }

        task.completed = isCompleted;
        if (isCompleted) completed++;
      }

      this.completedTasks.set(completed);
    }
  }
}