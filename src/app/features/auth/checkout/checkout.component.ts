import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { SubscriptionService, Plan } from '../../../core/services/subscription.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-surface-50 to-surface-100 py-12">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="text-center mb-10">
          <h1 class="text-title text-surface-800">Finalizar Suscripción</h1>
          <p class="text-surface-500 mt-2">Completa tu suscripción a EduGestión</p>
        </div>

        @if (loading() && !plan()) {
          <div class="flex justify-center py-16">
            <svg class="animate-spin h-10 w-10 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        } @else {
          <div class="grid lg:grid-cols-5 gap-8">
            <!-- Plan Summary -->
            <div class="lg:col-span-2">
              <div class="card-premium sticky top-8">
                <div class="p-6 border-b border-surface-100">
                  <h2 class="text-lg font-semibold text-surface-700">Tu Plan</h2>
                </div>
                <div class="p-6">
                  @if (plan()) {
                    <div class="text-center mb-6">
                      <div class="w-16 h-16 mx-auto bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                        <svg class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                          <path d="M2 17l10 5 10-5"></path>
                          <path d="M2 12l10 5 10-5"></path>
                        </svg>
                      </div>
                      <h3 class="text-2xl font-bold text-surface-800">{{ plan()!.name }}</h3>
                      <p class="text-surface-500 text-sm mt-1">{{ plan()!.description }}</p>
                    </div>

                    <div class="bg-surface-50 rounded-xl p-4 mb-6">
                      <div class="flex items-baseline justify-center gap-1">
                        <span class="text-4xl font-bold text-surface-800">\${{ formatPrice(plan()!.price_monthly) }}</span>
                        <span class="text-surface-400">/mes</span>
                      </div>
                    </div>

                    <ul class="space-y-3">
                      @for (feature of plan()!.features; track feature) {
                        <li class="flex items-start gap-3">
                          <div class="w-5 h-5 rounded-full bg-accent-green/10 flex items-center justify-center shrink-0 mt-0.5">
                            <svg class="w-3 h-3 text-accent-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                          <span class="text-sm text-surface-600">{{ feature }}</span>
                        </li>
                      }
                    </ul>
                  }
                </div>

                <!-- Trial Badge -->
                <div class="p-4 bg-amber-50 border-t border-amber-100">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                      <svg class="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                    </div>
                    <div>
                      <p class="font-semibold text-amber-800">14 días gratis</p>
                      <p class="text-xs text-amber-600">No se cobra hasta que termine tu prueba</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Payment Form -->
            <div class="lg:col-span-3">
              <div class="card-premium">
                <div class="p-6 border-b border-surface-100">
                  <h2 class="text-lg font-semibold text-surface-700">Información de Pago</h2>
                </div>
                <div class="p-6">
                  <!-- Demo Notice -->
                  <div class="bg-primary-50 border border-primary-100 rounded-xl p-4 mb-6">
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                        <svg class="w-4 h-4 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="16" x2="12" y2="12"></line>
                          <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                      </div>
                      <div>
                        <p class="font-medium text-primary-800">Modo Demostración</p>
                        <p class="text-sm text-primary-600 mt-0.5">Este checkout es simulado. Próximamente se integrará PayPal.</p>
                      </div>
                    </div>
                  </div>

                  <!-- Simulated Card Form -->
                  <form class="space-y-5">
                    <div>
                      <label class="block text-sm font-medium text-surface-600 mb-2">Número de Tarjeta</label>
                      <div class="relative">
                        <input
                          type="text"
                          value="4242 4242 4242 4242"
                          class="input-premium w-full pl-12"
                          disabled
                        />
                        <div class="absolute left-4 top-1/2 -translate-y-1/2">
                          <svg class="w-5 h-5 text-surface-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                            <line x1="1" y1="10" x2="23" y2="10"></line>
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-surface-600 mb-2">Vencimiento</label>
                        <input
                          type="text"
                          value="12/28"
                          class="input-premium w-full"
                          disabled
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-surface-600 mb-2">CVC</label>
                        <input
                          type="text"
                          value="123"
                          class="input-premium w-full"
                          disabled
                        />
                      </div>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-surface-600 mb-2">Nombre del Titular</label>
                      <input
                        type="text"
                        value="Usuario Demo"
                        class="input-premium w-full"
                        disabled
                      />
                    </div>
                  </form>

                  <!-- Order Summary -->
                  <div class="mt-6 pt-6 border-t border-surface-100">
                    <div class="flex justify-between items-center mb-2">
                      <span class="text-surface-500">Plan {{ plan()?.name }}</span>
                      <span class="text-surface-700">\${{ formatPrice(plan()?.price_monthly || 0) }}/mes</span>
                    </div>
                    <div class="flex justify-between items-center mb-4">
                      <span class="text-surface-500">Período de prueba</span>
                      <span class="text-accent-green font-medium">14 días gratis</span>
                    </div>
                    <div class="flex justify-between items-center pt-4 border-t border-surface-100">
                      <span class="text-lg font-semibold text-surface-700">Hoy pagas:</span>
                      <span class="text-2xl font-bold text-accent-green">\$0</span>
                    </div>
                    <p class="text-xs text-surface-400 mt-2">
                      Se cobrará \${{ formatPrice(plan()?.price_monthly || 0) }} después de los 14 días de prueba.
                    </p>
                  </div>

                  <!-- Submit Button -->
                  <button
                    (click)="processPayment()"
                    [disabled]="processing()"
                    class="btn-premium w-full mt-6 py-4 text-base"
                  >
                    @if (processing()) {
                      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Procesando...
                    } @else {
                      Iniciar Prueba Gratis de 14 Días
                    }
                  </button>

                  <!-- Trust Indicators -->
                  <div class="flex items-center justify-center gap-4 mt-6 text-xs text-surface-400">
                    <span class="flex items-center gap-1">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      Pago seguro
                    </span>
                    <span>•</span>
                    <span>Cancela cuando quieras</span>
                    <span>•</span>
                    <span>Sin compromisos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class CheckoutComponent implements OnInit {
  loading = signal(false);
  processing = signal(false);
  plan = signal<Plan | null>(null);
  selectedPlanId = signal('freelance');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabaseService: SupabaseService,
    private subscriptionService: SubscriptionService
  ) { }

  async ngOnInit() {
    this.loading.set(true);

    this.route.queryParams.subscribe(async params => {
      this.selectedPlanId.set(params['plan'] || 'freelance');

      // Load plan details from database
      const planData = await this.subscriptionService.getPlanById(this.selectedPlanId());
      if (planData) {
        this.plan.set(planData);
      }

      this.loading.set(false);
    });
  }

  formatPrice(price: number): string {
    return price.toLocaleString('es-MX');
  }

  async processPayment() {
    this.processing.set(true);

    try {
      const user = await this.supabaseService.getCurrentUser();
      if (!user) {
        this.router.navigate(['/auth/login']);
        return;
      }

      // Simulate payment processing
      await this.subscriptionService.simulatePayment(this.plan()?.price_monthly || 0);

      // Check if user already has a subscription
      const existingSubscription = await this.subscriptionService.getSubscription(user.id);

      if (existingSubscription) {
        // Upgrade/change existing subscription
        if (this.selectedPlanId() !== existingSubscription.plan_id) {
          await this.subscriptionService.upgradePlan(existingSubscription.id, this.selectedPlanId());
        }
      } else {
        // Create new subscription with trial
        await this.subscriptionService.createSubscription(user.id, this.selectedPlanId(), true);
      }

      // Update profile for backwards compatibility
      await this.supabaseService.updateProfile(user.id, {
        subscription_plan: this.selectedPlanId() as any,
        subscription_status: 'trial'
      });

      // Redirect to onboarding
      this.router.navigate(['/dashboard/onboarding']);

    } catch (error) {
      console.error('Error processing subscription:', error);
    } finally {
      this.processing.set(false);
    }
  }
}