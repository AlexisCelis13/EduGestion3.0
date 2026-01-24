import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService, Profile } from '../../core/services/supabase.service';

interface PlanInfo {
  id: string;
  name: string;
  price: number;
  period: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-6 lg:p-8 max-w-4xl mx-auto">
      <h1 class="text-title text-surface-700 mb-8">Configuración</h1>

      <!-- Loading State -->
      @if (loading()) {
        <div class="flex justify-center py-16">
          <svg class="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      } @else {
        <!-- Plan Section -->
        <div class="card-premium mb-8">
          <div class="p-6 border-b border-surface-100">
            <h2 class="text-lg font-semibold text-surface-700">Tu Plan Actual</h2>
          </div>
          <div class="p-6">
            <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
              <div>
                <div class="flex items-center gap-3 mb-3">
                  <span class="text-2xl font-semibold text-surface-700">{{ currentPlanInfo().name }}</span>
                  <span [class]="getStatusBadgeClass()">
                    {{ getStatusLabel() }}
                  </span>
                </div>
                <p class="text-surface-500 mb-4">
                  <span class="text-4xl font-semibold text-surface-700 tracking-tight">\${{ currentPlanInfo().price }}</span>
                  <span class="text-surface-400 ml-1">/{{ currentPlanInfo().period }}</span>
                </p>
                
                @if (profile()?.subscription_status === 'trial') {
                  <div class="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-sm">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    Estás en período de prueba. Actualiza tu plan para seguir disfrutando de todas las funciones.
                  </div>
                }
              </div>
              
              <button 
                (click)="goToPricing()"
                class="btn-premium shrink-0">
                Cambiar Plan
              </button>
            </div>
          </div>
        </div>

        <!-- Profile Section -->
        <div class="card-premium mb-8">
          <div class="p-6 border-b border-surface-100">
            <h2 class="text-lg font-semibold text-surface-700">Información del Perfil</h2>
          </div>
          <div class="p-6">
            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-surface-400 mb-1">Nombre</label>
                <p class="text-surface-700 text-lg">{{ profile()?.first_name || '-' }} {{ profile()?.last_name || '' }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-surface-400 mb-1">Email</label>
                <p class="text-surface-700 text-lg">{{ profile()?.email || '-' }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-surface-400 mb-1">Nombre de Empresa/Academia</label>
                <p class="text-surface-700 text-lg">{{ profile()?.company_name || '-' }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-surface-400 mb-1">Rol</label>
                <p class="text-surface-700 text-lg">{{ getRoleLabel() }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Features based on plan -->
        <div class="card-premium">
          <div class="p-6 border-b border-surface-100">
            <h2 class="text-lg font-semibold text-surface-700">Características de tu Plan</h2>
          </div>
          <div class="p-6">
            <ul class="grid sm:grid-cols-2 gap-4">
              @for (feature of getPlanFeatures(); track feature) {
                <li class="flex items-center gap-3">
                  <div class="w-6 h-6 rounded-full bg-accent-green/10 flex items-center justify-center shrink-0">
                    <svg class="w-4 h-4 text-accent-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span class="text-surface-600">{{ feature }}</span>
                </li>
              }
            </ul>
          </div>
        </div>
      }
    </div>
  `
})
export class SettingsComponent implements OnInit {
  loading = signal(true);
  profile = signal<Profile | null>(null);

  private plans: Record<string, PlanInfo> = {
    'freelance': { id: 'freelance', name: 'Freelance', price: 399, period: 'mes' },
    'academia': { id: 'academia', name: 'Academia', price: 999, period: 'mes' },
    'enterprise': { id: 'enterprise', name: 'Enterprise', price: 1999, period: 'mes' }
  };

  private planFeatures: Record<string, string[]> = {
    'freelance': [
      'Hasta 50 alumnos',
      'Landing page personalizada',
      'Gestión de citas',
      'Pagos con Stripe',
      'Soporte por email'
    ],
    'academia': [
      'Hasta 200 alumnos',
      'Múltiples profesores',
      'Landing page personalizada',
      'Gestión avanzada de citas',
      'Pagos con Stripe',
      'Reportes y estadísticas',
      'Soporte prioritario'
    ],
    'enterprise': [
      'Alumnos ilimitados',
      'Profesores ilimitados',
      'Landing pages múltiples',
      'API personalizada',
      'Integraciones avanzadas',
      'Soporte dedicado',
      'Onboarding personalizado'
    ]
  };

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) { }

  async ngOnInit() {
    await this.loadProfile();
  }

  private async loadProfile() {
    try {
      const user = await this.supabaseService.getCurrentUser();
      if (user) {
        const profile = await this.supabaseService.getProfile(user.id);
        this.profile.set(profile);
      }
    } finally {
      this.loading.set(false);
    }
  }

  currentPlanInfo(): PlanInfo {
    const planId = this.profile()?.subscription_plan || 'freelance';
    return this.plans[planId] || this.plans['freelance'];
  }

  getStatusLabel(): string {
    const status = this.profile()?.subscription_status;
    const labels: Record<string, string> = {
      'trial': 'Período de Prueba',
      'active': 'Activo',
      'cancelled': 'Cancelado',
      'expired': 'Expirado'
    };
    return labels[status || 'trial'] || 'Desconocido';
  }

  getStatusBadgeClass(): string {
    const status = this.profile()?.subscription_status;
    const classes: Record<string, string> = {
      'trial': 'px-3 py-1 text-sm font-medium rounded-full bg-orange-100 text-orange-700',
      'active': 'px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-700',
      'cancelled': 'px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-700',
      'expired': 'px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-700'
    };
    return classes[status || 'trial'] || classes['trial'];
  }

  getRoleLabel(): string {
    const role = this.profile()?.role;
    const labels: Record<string, string> = {
      'director': 'Director de Academia',
      'tutor_independiente': 'Tutor Independiente'
    };
    return labels[role || ''] || '-';
  }

  getPlanFeatures(): string[] {
    const planId = this.profile()?.subscription_plan || 'freelance';
    return this.planFeatures[planId] || this.planFeatures['freelance'];
  }

  goToPricing() {
    this.router.navigate(['/']);
    setTimeout(() => {
      const element = document.getElementById('pricing-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }
}
