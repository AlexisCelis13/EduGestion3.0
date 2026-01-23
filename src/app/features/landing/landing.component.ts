import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

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
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <!-- Header -->
      <header class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center py-6">
            <div class="flex items-center">
              <h1 class="text-2xl font-bold text-gray-900">EduGestión</h1>
            </div>
            <div class="flex items-center space-x-4">
              <a routerLink="/auth/login" class="text-gray-600 hover:text-gray-900">Iniciar Sesión</a>
              <a routerLink="/auth/register" 
                 class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Comenzar Prueba Gratis
              </a>
            </div>
          </div>
        </div>
      </header>

      <!-- Hero Section -->
      <section class="py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 class="text-5xl font-bold text-gray-900 mb-6">
            Gestiona tu Academia de Forma
            <span class="text-blue-600">Inteligente</span>
          </h1>
          <p class="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            La plataforma todo-en-uno para academias y tutores independientes. 
            Gestiona alumnos, programa clases, recibe pagos y crea tu landing page profesional.
          </p>
          <div class="flex justify-center space-x-4">
            <a routerLink="/auth/register" 
               class="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
              Comenzar Prueba Gratis
            </a>
            <button (click)="scrollToPlans()" class="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors cursor-pointer">
              Ver Planes
            </button>
          </div>
        </div>
      </section>

      <!-- Pricing Section -->
      <section id="pricing-section" class="py-20 bg-gray-50">
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
                  <p class="mt-8 text-center">
                    <span class="text-4xl font-extrabold text-gray-900">\${{ plan.price }}</span>
                    <span class="text-base font-medium text-gray-500">/{{ plan.period }}</span>
                  </p>
                  <button
                    (click)="selectPlan(plan)"
                    [class]="plan.popular 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'"
                    class="mt-8 block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium transition-colors">
                    Seleccionar Plan
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
            <p class="text-sm text-gray-500">
              🔒 Pago seguro con Stripe • 📞 Soporte 24/7 • 💰 Garantía de 30 días
            </p>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="py-20 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <h2 class="text-3xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas para hacer crecer tu academia
            </h2>
            <p class="text-lg text-gray-600">
              Herramientas profesionales diseñadas específicamente para educadores
            </p>
          </div>

          <div class="grid md:grid-cols-3 gap-8">
            <!-- Feature 1 -->
            <div class="text-center p-6">
              <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">Gestión de Alumnos</h3>
              <p class="text-gray-600">
                Organiza toda la información de tus estudiantes, historial académico y comunicación con padres.
              </p>
            </div>

            <!-- Feature 2 -->
            <div class="text-center p-6">
              <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">Cobros Automáticos</h3>
              <p class="text-gray-600">
                Recibe pagos de forma segura con Stripe. Facturas automáticas y recordatorios de pago.
              </p>
            </div>

            <!-- Feature 3 -->
            <div class="text-center p-6">
              <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"></path>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">Landing Page Propia</h3>
              <p class="text-gray-600">
                Crea tu página web profesional donde los alumnos pueden conocerte y agendar citas.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="py-20 bg-blue-600">
        <div class="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 class="text-3xl font-bold text-white mb-4">
            ¿Listo para transformar tu academia?
          </h2>
          <p class="text-xl text-blue-100 mb-8">
            Únete a cientos de educadores que ya confían en EduGestión
          </p>
          <a routerLink="/auth/register" 
             class="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors">
            Comenzar Prueba Gratis - 14 días
          </a>
        </div>
      </section>

      <!-- Footer -->
      <footer class="bg-gray-900 text-white py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center">
            <h3 class="text-2xl font-bold mb-4">EduGestión</h3>
            <p class="text-gray-400">
              © 2024 EduGestión. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  `
})
export class LandingComponent {
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

  constructor(private router: Router) { }

  scrollToPlans(): void {
    const element = document.getElementById('pricing-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  selectPlan(plan: PricingPlan): void {
    this.router.navigate(['/auth/register'], {
      queryParams: { plan: plan.id, price: plan.price }
    });
  }
}