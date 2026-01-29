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
    <div class="min-h-screen bg-surface-50">
      <!-- Header with glassmorphism -->
      <header class="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
        <div class="max-w-6xl mx-auto px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center">
              <img src="assets/LogoCompleto.png" class="h-10">
            </div>
            <div class="flex items-center gap-4">
              <a routerLink="/auth/login" 
                 class="text-surface-700 hover:text-primary-600 font-medium text-sm">
                Iniciar Sesión
              </a>
              <a routerLink="/auth/register" class="btn-premium text-sm !py-2.5 !px-5">
                Comenzar Gratis
              </a>
            </div>
          </div>
        </div>
      </header>

      <!-- Hero Section -->
      <section class="pt-32 pb-24 lg:pt-40 lg:pb-32">
        <div class="max-w-6xl mx-auto px-6 lg:px-8 text-center">
          <h1 class="text-hero text-surface-700 mb-6 animate-fade-in-up">
            Gestiona tu Academia
            <span class="text-gradient block">de Forma Inteligente</span>
          </h1>
          <p class="text-subtitle text-surface-400 mb-10 max-w-2xl mx-auto animate-fade-in-up delay-100">
            La plataforma todo-en-uno para academias y tutores independientes. 
            Gestiona alumnos, programa clases, recibe pagos y crea tu landing page profesional.
          </p>
          <div class="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up delay-200">
            <a routerLink="/auth/register" class="btn-premium text-lg !py-4 !px-8">
              Comenzar Prueba Gratis
            </a>
            <button (click)="scrollToPlans()" class="btn-secondary text-lg !py-4 !px-8">
              Ver Planes
            </button>
          </div>
        </div>
      </section>

      <!-- Pricing Section -->
      <section id="pricing-section" class="py-24 lg:py-32">
        <div class="max-w-6xl mx-auto px-6 lg:px-8">
          <!-- Header -->
          <div class="text-center mb-16">
            <h2 class="text-title text-surface-700 mb-4">
              Elige el plan perfecto para ti
            </h2>
            <p class="text-subtitle text-surface-400">
              Comienza con 14 días gratis. Cancela cuando quieras.
            </p>
          </div>

          <!-- Pricing Cards -->
          <div class="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            @for (plan of plans; track plan.id) {
              <div class="card-premium p-8 hover-lift"
                   [class.card-featured]="plan.popular"
                   [class.ring-2]="plan.popular"
                   [class.ring-primary-500]="plan.popular">
                @if (plan.popular) {
                  <div class="flex justify-center -mt-4 mb-4">
                    <span class="badge-premium">
                      Más Popular
                    </span>
                  </div>
                }
                <h3 class="text-xl font-semibold text-surface-700 text-center">
                  {{ plan.name }}
                </h3>
                <p class="mt-3 text-sm text-surface-400 text-center min-h-[40px]">
                  {{ plan.description }}
                </p>
                <p class="mt-6 text-center">
                  <span class="text-5xl font-semibold text-surface-700 tracking-tight">\${{ plan.price }}</span>
                  <span class="text-surface-400 ml-1">/{{ plan.period }}</span>
                </p>
                <button
                  (click)="selectPlan(plan)"
                  [class]="plan.popular 
                    ? 'btn-premium w-full mt-8' 
                    : 'btn-secondary w-full mt-8 border border-surface-200'">
                  Seleccionar Plan
                </button>
                <div class="mt-8 pt-8 border-t border-surface-100">
                  <h4 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-4">
                    Incluye:
                  </h4>
                  <ul class="space-y-3">
                    @for (feature of plan.features; track feature) {
                      <li class="flex items-start gap-3">
                        <svg class="flex-shrink-0 w-5 h-5 text-accent-green mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span class="text-sm text-surface-500">{{ feature }}</span>
                      </li>
                    }
                  </ul>
                </div>
              </div>
            }
          </div>

          <!-- Trust Indicators -->
          <div class="mt-16 flex flex-wrap justify-center gap-8 text-sm text-surface-400">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-surface-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>Pago seguro con Stripe</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-surface-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <span>Soporte 24/7</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-surface-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
              <span>Garantía de 30 días</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="py-24 lg:py-32 bg-white">
        <div class="max-w-6xl mx-auto px-6 lg:px-8">
          <div class="text-center mb-16">
            <h2 class="text-title text-surface-700 mb-4">
              Todo lo que necesitas para hacer crecer tu academia
            </h2>
            <p class="text-subtitle text-surface-400 max-w-2xl mx-auto">
              Herramientas profesionales diseñadas específicamente para educadores
            </p>
          </div>

          <div class="grid md:grid-cols-3 gap-8 lg:gap-12">
            <!-- Feature 1 -->
            <div class="card-premium p-8 text-center hover-lift">
              <div class="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg class="w-8 h-8 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-surface-700 mb-3">Gestión de Alumnos</h3>
              <p class="text-surface-400 leading-relaxed">
                Organiza toda la información de tus estudiantes, historial académico y comunicación con padres.
              </p>
            </div>

            <!-- Feature 2 -->
            <div class="card-premium p-8 text-center hover-lift">
              <div class="w-16 h-16 bg-accent-green/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg class="w-8 h-8 text-accent-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
                  <path d="M12 18V6"></path>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-surface-700 mb-3">Cobros Automáticos</h3>
              <p class="text-surface-400 leading-relaxed">
                Recibe pagos de forma segura con Stripe. Facturas automáticas y recordatorios de pago.
              </p>
            </div>

            <!-- Feature 3 -->
            <div class="card-premium p-8 text-center hover-lift">
              <div class="w-16 h-16 bg-accent-indigo/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg class="w-8 h-8 text-accent-indigo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-surface-700 mb-3">Landing Page Propia</h3>
              <p class="text-surface-400 leading-relaxed">
                Crea tu página web profesional donde los alumnos pueden conocerte y agendar citas.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="py-24 lg:py-32 bg-gradient-to-br from-primary-600 to-primary-700">
        <div class="max-w-4xl mx-auto text-center px-6 lg:px-8">
          <h2 class="text-display text-white mb-6">
            ¿Listo para transformar tu academia?
          </h2>
          <p class="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Únete a cientos de educadores que ya confían en EduGestión
          </p>
          <a routerLink="/auth/register" 
             class="inline-block bg-white text-primary-600 px-10 py-4 rounded-full text-lg font-semibold hover:bg-surface-100 hover:scale-105 transition-all shadow-lg">
            Comenzar Prueba Gratis — 14 días
          </a>
        </div>
      </section>

      <!-- Footer -->
      <footer class="bg-surface-700 text-white py-16">
        <div class="max-w-6xl mx-auto px-6 lg:px-8">
          <div class="text-center">
            <h3 class="text-2xl font-semibold mb-4">EduGestión</h3>
            <p class="text-surface-300 text-sm">
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