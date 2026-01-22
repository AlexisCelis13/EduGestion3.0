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

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center py-6">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">
                ¡Hola{{ profile()?.first_name ? ', ' + profile()?.first_name : '' }}! 👋
              </h1>
              <p class="text-gray-600 mt-1">
                Bienvenido a tu panel de control de EduGestión
              </p>
            </div>
            <div class="flex items-center space-x-4">
              <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                + Nuevo Alumno
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Widget Principal de Onboarding -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-xl font-semibold text-gray-900">
                Explora EduGestión siguiendo estos pasos
              </h2>
              <p class="text-gray-600 mt-1">
                Completa estos pasos para aprovechar al máximo la plataforma
              </p>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold text-blue-600">
                {{ completedTasks() }}/{{ onboardingTasks.length }}
              </div>
              <div class="text-sm text-gray-500">completados</div>
            </div>
          </div>

          <!-- Barra de Progreso -->
          <div class="mb-6">
            <div class="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progreso de configuración</span>
              <span>{{ Math.round((completedTasks() / onboardingTasks.length) * 100) }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                [style.width.%]="(completedTasks() / onboardingTasks.length) * 100">
              </div>
            </div>
          </div>

          <!-- Tarjetas de Tareas -->
          <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            @for (task of onboardingTasks; track task.id) {
              <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                   [class.bg-green-50]="task.completed"
                   [class.border-green-200]="task.completed"
                   [routerLink]="task.route">
                <div class="flex items-center justify-between mb-3">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center"
                       [class.bg-green-100]="task.completed"
                       [class.bg-blue-100]="!task.completed">
                    @if (task.completed) {
                      <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                      </svg>
                    } @else {
                      <span class="text-2xl">{{ task.icon }}</span>
                    }
                  </div>
                  @if (task.completed) {
                    <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Completado
                    </span>
                  }
                </div>
                <h3 class="font-semibold text-gray-900 mb-2">{{ task.title }}</h3>
                <p class="text-sm text-gray-600">{{ task.description }}</p>
              </div>
            }
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center">
              <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Alumnos Activos</p>
                <p class="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center">
              <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Clases Esta Semana</p>
                <p class="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center">
              <div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Ingresos Este Mes</p>
                <p class="text-2xl font-semibold text-gray-900">$0</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center">
              <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Servicios Activos</p>
                <p class="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Acciones Rápidas -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
          <div class="grid md:grid-cols-3 gap-4">
            <button class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </div>
              <div class="text-left">
                <p class="font-medium text-gray-900">Agregar Alumno</p>
                <p class="text-sm text-gray-600">Registra un nuevo estudiante</p>
              </div>
            </button>

            <button class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <div class="text-left">
                <p class="font-medium text-gray-900">Programar Clase</p>
                <p class="text-sm text-gray-600">Agenda una nueva sesión</p>
              </div>
            </button>

            <button class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <div class="text-left">
                <p class="font-medium text-gray-900">Ver Reportes</p>
                <p class="text-sm text-gray-600">Analiza tu rendimiento</p>
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
      id: 'test-student',
      title: 'Registra un alumno de prueba',
      description: 'Prueba el sistema agregando tu primer estudiante',
      icon: '👨‍🎓',
      completed: false,
      route: '/dashboard/students'
    }
  ];

  completedTasks = signal(0);

  constructor(private supabaseService: SupabaseService) {}

  async ngOnInit() {
    await this.loadProfile();
    await this.loadOnboardingProgress();
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
      
      if (progress) {
        let completed = 0;
        this.onboardingTasks.forEach(task => {
          const taskProgress = progress.find(p => p.step_name === task.id);
          if (taskProgress?.completed) {
            task.completed = true;
            completed++;
          }
        });
        this.completedTasks.set(completed);
      }
    }
  }
}