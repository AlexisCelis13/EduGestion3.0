import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';

interface PricingPlan {
  id: 'freelance' | 'academia' | 'enterprise';
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
}

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="text-center">
          <h2 class="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Elige el plan perfecto para ti
          </h2>
          <p class="mt-4 text-lg text-gray-600">
            Comienza con 14 días gratis. Cancela cuando quieras.
          </p>
        </div>

        <!-- Pricing Cards -->
        <div class="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0">
          @for (plan of plans; track plan.id) {
            <div class="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200 bg-white"
                 [class.ring-2]="plan.popular"
                 [class.ring-blue-500]="plan.popular">
              <div class="p-6">
                @if (plan.popular) {
                  <div class="flex justify-center">
                    <span class="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-blue-100 text-blue-600">
                      Más Popular
                    </span>
                  </div>
                }
                <h3 class="text-lg leading-6 font-medium text-gray-900 text-center mt-2">
                  {{ plan.name }}
                </h3>
                <p class="mt-4 text-sm text-gray-500 text-center">
                  {{ plan.description }}
                </p>
                <p class="mt-8">
                  <span class="text-4xl font-extrabold text-gray-900">€{{ plan.price }}</span>
                  <span class="text-base font-medium text-gray-500">/{{ plan.period }}</span>
                </p>
                <button
                  (click)="selectPlan(plan)"
                  [class]="plan.popular 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'"
                  class="mt-8 block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium transition-colors">
                  @if (selectedPlan() === plan.id && loading()) {
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  } @else {
                    Seleccionar Plan
                  }
                </button>
              </div>
              <div class="pt-6 pb-8 px-6">
                <h4 class="text-sm font-medium text-gray-900 tracking-wide uppercase">
                  Incluye:
                </h4>
                <ul class="mt-6 space-y-4">
                  @for (feature of plan.features; track feature) {
                    <li class="flex space-x-3">
                      <svg class="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                      <span class="text-sm text-gray-500">{{ feature }}</span>
                    </li>
                  }
                </ul>
              </div>
            </div>
          }
        </div>

        <!-- Trust Indicators -->
        <div class="mt-12 text-center">
          <p class="text-sm text-gray-500 flex items-center justify-center gap-2">
            <svg class="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.076 21.337l.732-4.634h2.695c4.221 0 7.716-2.029 8.281-6.623.364-2.964-1.343-4.832-3.832-5.753-1.638-.606-3.805-.487-3.805-.487l-.46 2.87s1.396-.062 2.456.326c1.556.57 2.213 1.764 1.959 3.827-.406 3.328-3.085 4.098-5.368 4.098h-1.61L7.076 21.337z"/>
            </svg>
            <span>Pago 100% seguro con <strong>PayPal</strong></span>
            <span class="mx-2">•</span>
            <span>📞 Soporte 24/7</span>
            <span class="mx-2">•</span>
            <span>💰 Garantía de 30 días</span>
          </p>
        </div>
      </div>
    </div>
  `
})
export class PricingComponent {
  loading = signal(false);
  selectedPlan = signal<string | null>(null);

  // Helper para formatear precios en pesos mexicanos
  formatPrice(price: number): string {
    return price.toLocaleString('es-MX');
  }

  plans: PricingPlan[] = [
    {
      id: 'freelance',
      name: 'Freelance',
      price: 399,
      period: 'mes',
      description: 'Perfecto para tutores independientes',
      features: [
        'Hasta 50 alumnos',
        'Landing page personalizada',
        'Gestión de citas',
        'Pagos con Stripe',
        'Soporte por email'
      ]
    },
    {
      id: 'academia',
      name: 'Academia',
      price: 999,
      period: 'mes',
      description: 'Ideal para academias pequeñas y medianas',
      features: [
        'Hasta 200 alumnos',
        'Múltiples profesores',
        'Landing page personalizada',
        'Gestión avanzada de citas',
        'Pagos con Stripe',
        'Reportes y estadísticas',
        'Soporte prioritario'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 1999,
      period: 'mes',
      description: 'Para grandes academias e instituciones',
      features: [
        'Alumnos ilimitados',
        'Profesores ilimitados',
        'Landing pages múltiples',
        'API personalizada',
        'Integraciones avanzadas',
        'Soporte dedicado',
        'Onboarding personalizado'
      ]
    }
  ];

  constructor(
    private router: Router,
    private supabaseService: SupabaseService
  ) { }

  async selectPlan(plan: PricingPlan) {
    this.loading.set(true);
    this.selectedPlan.set(plan.id);

    // Simular procesamiento
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verificar si el usuario está autenticado
    const user = await this.supabaseService.getCurrentUser();

    if (user) {
      // Si está autenticado, ir directo a checkout
      this.router.navigate(['/auth/checkout'], {
        queryParams: { plan: plan.id, price: plan.price }
      });
    } else {
      // Si no está autenticado, ir a registro primero
      this.router.navigate(['/auth/register'], {
        queryParams: { plan: plan.id, price: plan.price }
      });
    }
  }
}