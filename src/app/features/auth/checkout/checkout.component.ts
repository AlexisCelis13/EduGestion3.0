import { Component, signal, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { SubscriptionService, Plan } from '../../../core/services/subscription.service';
import { PaymentService } from '../../../core/services/payment.service';

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
                      <p class="font-semibold text-amber-800">Pago Seguro</p>
                      <p class="text-xs text-amber-600">Procesado por PayPal</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Payment Form -->
            <div class="lg:col-span-3">
              <div class="card-premium">
                <div class="p-6 border-b border-surface-100">
                  <h2 class="text-lg font-semibold text-surface-700">Selecciona método de pago</h2>
                </div>
                <div class="p-6">
                  
                  <!-- Order Summary -->
                  <div class="mb-6 pb-6 border-b border-surface-100">
                    <div class="flex justify-between items-center mb-2">
                      <span class="text-surface-500">Plan {{ plan()?.name }}</span>
                      <span class="text-surface-700">\${{ formatPrice(plan()?.price_monthly || 0) }}/mes</span>
                    </div>
                   
                    <div class="flex justify-between items-center pt-4">
                      <span class="text-lg font-semibold text-surface-700">Total a pagar:</span>
                      <span class="text-2xl font-bold text-accent-green">\${{ formatPrice(plan()?.price_monthly || 0) }}</span>
                    </div>
                  </div>

                  <!-- PayPal Button Container -->
                  <div #paypalContainer id="paypal-button-container" class="w-full"></div>
                  
                  @if (processing()) {
                    <div class="text-center mt-4">
                      <p class="text-sm text-surface-500 flex items-center justify-center gap-2">
                        <svg class="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Procesando pago...
                      </p>
                    </div>
                  }

                  <!-- Trust Indicators -->
                  <div class="flex items-center justify-center gap-4 mt-6 text-xs text-surface-400">
                    <span class="flex items-center gap-1">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      Pago 100% seguro con PayPal
                    </span>
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
  
  @ViewChild('paypalContainer') paypalContainer!: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabaseService: SupabaseService,
    private subscriptionService: SubscriptionService,
    private paymentService: PaymentService
  ) { }

  async ngOnInit() {
    this.loading.set(true);

    this.route.queryParams.subscribe(async params => {
      this.selectedPlanId.set(params['plan'] || 'freelance');

      // Load plan details from database
      const planData = await this.subscriptionService.getPlanById(this.selectedPlanId());
      if (planData) {
        this.plan.set(planData);
        // Initialize PayPal after plan is loaded and view is ready (setTimeout allows the view to render)
        setTimeout(() => this.initPayPal(), 100);
      }

      this.loading.set(false);
    });
  }

  async initPayPal() {
    if (this.plan()) {
      await this.paymentService.initPayPalButton(
        '#paypal-button-container',
        this.plan()!.price_monthly,
        (details) => this.handlePaymentSuccess(details)
      );
    }
  }

  formatPrice(price: number): string {
    return price.toLocaleString('es-MX');
  }

  async handlePaymentSuccess(details: any) {
    this.processing.set(true);

    try {
      const user = await this.supabaseService.getCurrentUser();
      if (!user) {
        // Guarda el estado en localStorage si quieres recuperar después del login
        this.router.navigate(['/auth/login']);
        return;
      }

      console.log('Pago aprobado por PayPal:', details);

      // Check if user already has a subscription
      const existingSubscription = await this.subscriptionService.getSubscription(user.id);

      if (existingSubscription) {
        // Upgrade existing subscription
        if (this.selectedPlanId() !== existingSubscription.plan_id) {
           // Nota: Si ya pagaron, deberíamos usar una lógica de upgrade pagado, por ahora lo forzamos.
          await this.subscriptionService.upgradePlan(existingSubscription.id, this.selectedPlanId());
        }
        // También podríamos extender el periodo si el plan es el mismo
      } else {
        // Create new PAID subscription (startTrial = false)
        await this.subscriptionService.createSubscription(
            user.id, 
            this.selectedPlanId(), 
            false, // No trial, paid immediately
            'paypal', 
            details
        );
      }

      // Update profile info
      await this.supabaseService.updateProfile(user.id, {
        subscription_plan: this.selectedPlanId() as any,
        subscription_status: 'active'
      });

      // Redirect to success / onboarding
      this.router.navigate(['/dashboard/onboarding']);

    } catch (error) {
      console.error('Error recording subscription:', error);
      alert('Hubo un error registrando tu suscripción. Por favor contacta a soporte.');
    } finally {
      this.processing.set(false);
    }
  }

  // Legacy method kept if needed for fallback, but not used in UI anymore
  async processPayment() {
    // ... logic removed from template
  }
}