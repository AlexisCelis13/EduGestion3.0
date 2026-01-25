import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService, Profile } from '../../core/services/supabase.service';
import { SubscriptionService, Plan, SubscriptionWithPlan, SubscriptionHistory } from '../../core/services/subscription.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
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
        <!-- Subscription Section -->
        <div class="card-premium mb-8">
          <div class="p-6 border-b border-surface-100">
            <h2 class="text-lg font-semibold text-surface-700">Tu Suscripción</h2>
          </div>
          <div class="p-6">
            <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div class="flex-1">
                <!-- Current Plan -->
                <div class="flex items-center gap-4 mb-4">
                  <div class="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                      <path d="M2 17l10 5 10-5"></path>
                      <path d="M2 12l10 5 10-5"></path>
                    </svg>
                  </div>
                  <div>
                    <div class="flex items-center gap-3">
                      <span class="text-2xl font-bold text-surface-800">{{ subscription()?.plan?.name || 'Sin Plan' }}</span>
                      <span [class]="getStatusBadgeClass()">{{ getStatusLabel() }}</span>
                    </div>
                    <p class="text-surface-500">
                      <span class="text-3xl font-bold text-surface-700">\${{ formatPrice(subscription()?.plan?.price_monthly || 0) }}</span>
                      <span class="text-surface-400">/mes</span>
                    </p>
                  </div>
                </div>

                <!-- Trial/Period Info -->
                @if (subscription()?.status === 'trial' && trialDaysRemaining() !== null) {
                  <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                        <svg class="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </div>
                      <div>
                        <p class="font-semibold text-amber-800">{{ trialDaysRemaining() }} días restantes de prueba</p>
                        <p class="text-sm text-amber-600">Tu prueba termina el {{ formatDate(subscription()?.trial_end) }}</p>
                      </div>
                    </div>
                  </div>
                }

                @if (subscription()?.status === 'cancelled') {
                  <div class="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                        <svg class="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="15" y1="9" x2="9" y2="15"></line>
                          <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                      </div>
                      <div>
                        <p class="font-semibold text-red-800">Suscripción cancelada</p>
                        <p class="text-sm text-red-600">Tendrás acceso hasta el {{ formatDate(subscription()?.current_period_end) }}</p>
                      </div>
                    </div>
                  </div>
                }

                @if (subscription()?.status === 'active') {
                  <p class="text-sm text-surface-500 mb-4">
                    Próxima facturación: <span class="font-medium text-surface-700">{{ formatDate(subscription()?.current_period_end) }}</span>
                  </p>
                }
              </div>

              <!-- Actions -->
              <div class="flex flex-col gap-3">
                <button (click)="showChangePlanModal.set(true)" class="btn-premium">
                  Cambiar Plan
                </button>
                @if (subscription()?.status !== 'cancelled' && subscription()?.status !== 'expired') {
                  <button (click)="showCancelModal.set(true)" class="btn-outline text-red-600 border-red-200 hover:bg-red-50">
                    Cancelar Suscripción
                  </button>
                }
                @if (subscription()?.status === 'cancelled') {
                  <button (click)="reactivateSubscription()" [disabled]="processing()" class="btn-premium">
                    @if (processing()) {
                      Reactivando...
                    } @else {
                      Reactivar Suscripción
                    }
                  </button>
                }
              </div>
            </div>
          </div>

          <!-- Plan Features -->
          <div class="p-6 bg-surface-50 border-t border-surface-100">
            <h3 class="text-sm font-semibold text-surface-600 mb-3">Características incluidas:</h3>
            <div class="grid sm:grid-cols-2 gap-2">
              @for (feature of subscription()?.plan?.features || []; track feature) {
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-accent-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span class="text-sm text-surface-600">{{ feature }}</span>
                </div>
              }
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

        <!-- Subscription History -->
        @if (history().length > 0) {
          <div class="card-premium">
            <div class="p-6 border-b border-surface-100">
              <h2 class="text-lg font-semibold text-surface-700">Historial de Suscripción</h2>
            </div>
            <div class="divide-y divide-surface-100">
              @for (event of history(); track event.id) {
                <div class="p-4 flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div [class]="getEventIconClass(event.event_type)">
                      @switch (event.event_type) {
                        @case ('created') { <span>🎉</span> }
                        @case ('upgraded') { <span>⬆️</span> }
                        @case ('downgraded') { <span>⬇️</span> }
                        @case ('cancelled') { <span>❌</span> }
                        @case ('reactivated') { <span>✅</span> }
                        @case ('payment_success') { <span>💳</span> }
                        @case ('trial_started') { <span>🎁</span> }
                        @default { <span>📋</span> }
                      }
                    </div>
                    <div>
                      <p class="font-medium text-surface-700">{{ getEventLabel(event.event_type) }}</p>
                      <p class="text-sm text-surface-500">{{ event.notes || '' }}</p>
                    </div>
                  </div>
                  <div class="text-right">
                    @if (event.amount) {
                      <p class="font-semibold text-surface-700">\${{ formatPrice(event.amount) }}</p>
                    }
                    <p class="text-sm text-surface-400">{{ formatDate(event.created_at) }}</p>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      }

      <!-- Change Plan Modal -->
      @if (showChangePlanModal()) {
        <div class="fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="showChangePlanModal.set(false)">
          <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <div class="p-6 border-b border-surface-100">
              <h2 class="text-xl font-semibold text-surface-800">Cambiar Plan</h2>
              <p class="text-surface-500 mt-1">Selecciona el plan que mejor se adapte a tus necesidades</p>
            </div>
            <div class="p-6">
              <div class="grid gap-4">
                @for (plan of plans(); track plan.id) {
                  <div 
                    class="border-2 rounded-xl p-4 cursor-pointer transition-all"
                    [class.border-primary-500]="selectedNewPlan() === plan.id"
                    [class.bg-primary-50]="selectedNewPlan() === plan.id"
                    [class.border-surface-200]="selectedNewPlan() !== plan.id"
                    [class.opacity-50]="plan.id === subscription()?.plan_id"
                    (click)="selectPlan(plan.id)"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                             [class.border-primary-500]="selectedNewPlan() === plan.id"
                             [class.bg-primary-500]="selectedNewPlan() === plan.id"
                             [class.border-surface-300]="selectedNewPlan() !== plan.id">
                          @if (selectedNewPlan() === plan.id) {
                            <div class="w-2 h-2 bg-white rounded-full"></div>
                          }
                        </div>
                        <div>
                          <p class="font-semibold text-surface-800">{{ plan.name }}</p>
                          <p class="text-sm text-surface-500">{{ plan.description }}</p>
                        </div>
                      </div>
                      <div class="text-right">
                        <p class="text-xl font-bold text-surface-800">\${{ formatPrice(plan.price_monthly) }}</p>
                        <p class="text-sm text-surface-400">/mes</p>
                      </div>
                    </div>
                    @if (plan.id === subscription()?.plan_id) {
                      <div class="mt-2 text-sm text-primary-600 font-medium">Tu plan actual</div>
                    }
                  </div>
                }
              </div>

              @if (selectedNewPlan() && selectedNewPlan() !== subscription()?.plan_id) {
                <div class="mt-6 p-4 bg-surface-50 rounded-xl">
                  <p class="text-sm text-surface-600">
                    @if (isUpgrade()) {
                      Se te cobrará la diferencia prorrateada por los días restantes del ciclo actual.
                    } @else {
                      Tu crédito se aplicará a futuras facturas.
                    }
                  </p>
                </div>
              }
            </div>
            <div class="p-6 border-t border-surface-100 flex justify-end gap-3">
              <button (click)="showChangePlanModal.set(false)" class="btn-outline">Cancelar</button>
              <button 
                (click)="changePlan()" 
                [disabled]="!selectedNewPlan() || selectedNewPlan() === subscription()?.plan_id || processing()"
                class="btn-premium"
              >
                @if (processing()) {
                  Procesando...
                } @else {
                  Confirmar Cambio
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Cancel Subscription Modal -->
      @if (showCancelModal()) {
        <div class="fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="showCancelModal.set(false)">
          <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full" (click)="$event.stopPropagation()">
            <div class="p-6 border-b border-surface-100">
              <h2 class="text-xl font-semibold text-surface-800">¿Cancelar suscripción?</h2>
            </div>
            <div class="p-6">
              <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-amber-600 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <div>
                    <p class="font-medium text-amber-800">Antes de irte...</p>
                    <p class="text-sm text-amber-700 mt-1">
                      Mantendrás acceso hasta el final de tu período de facturación actual.
                      Después tendrás 30 días para gestionar citas programadas.
                    </p>
                  </div>
                </div>
              </div>

              <p class="text-surface-600 mb-4">¿Hay algo que podamos mejorar?</p>
              <textarea
                [(ngModel)]="cancelReason"
                placeholder="Cuéntanos por qué te vas (opcional)"
                class="input-premium w-full h-24 resize-none"
              ></textarea>
            </div>
            <div class="p-6 border-t border-surface-100 flex justify-end gap-3">
              <button (click)="showCancelModal.set(false)" class="btn-premium">
                Mantener Suscripción
              </button>
              <button (click)="cancelSubscription()" [disabled]="processing()" class="btn-outline text-red-600 border-red-200 hover:bg-red-50">
                @if (processing()) {
                  Cancelando...
                } @else {
                  Cancelar Suscripción
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class SettingsComponent implements OnInit {
  loading = signal(true);
  processing = signal(false);
  profile = signal<Profile | null>(null);
  subscription = signal<SubscriptionWithPlan | null>(null);
  plans = signal<Plan[]>([]);
  history = signal<SubscriptionHistory[]>([]);

  // Modal states
  showChangePlanModal = signal(false);
  showCancelModal = signal(false);
  selectedNewPlan = signal<string | null>(null);
  cancelReason = '';

  constructor(
    private supabaseService: SupabaseService,
    private subscriptionService: SubscriptionService,
    private router: Router
  ) { }

  async ngOnInit() {
    await this.loadData();
  }

  private async loadData() {
    try {
      const user = await this.supabaseService.getCurrentUser();
      if (user) {
        // Load profile
        const profile = await this.supabaseService.getProfile(user.id);
        this.profile.set(profile);

        // Load subscription
        const subscription = await this.subscriptionService.getSubscription(user.id);
        this.subscription.set(subscription);

        // Load plans
        const plans = await this.subscriptionService.getPlans();
        this.plans.set(plans);

        // Load history
        if (subscription) {
          const history = await this.subscriptionService.getSubscriptionHistory(subscription.id);
          this.history.set(history);
        }
      }
    } finally {
      this.loading.set(false);
    }
  }

  trialDaysRemaining(): number | null {
    return this.subscriptionService.getTrialDaysRemaining(this.subscription());
  }

  getStatusLabel(): string {
    const status = this.subscription()?.status || this.profile()?.subscription_status;
    const labels: Record<string, string> = {
      'trial': 'Período de Prueba',
      'active': 'Activo',
      'cancelled': 'Cancelado',
      'expired': 'Expirado',
      'grace_period': 'Período de Gracia',
      'past_due': 'Pago Pendiente'
    };
    return labels[status || 'trial'] || 'Desconocido';
  }

  getStatusBadgeClass(): string {
    const status = this.subscription()?.status || this.profile()?.subscription_status;
    const classes: Record<string, string> = {
      'trial': 'px-3 py-1 text-sm font-medium rounded-full bg-amber-100 text-amber-700',
      'active': 'px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-700',
      'cancelled': 'px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-700',
      'expired': 'px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-700',
      'grace_period': 'px-3 py-1 text-sm font-medium rounded-full bg-orange-100 text-orange-700',
      'past_due': 'px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-700'
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

  formatPrice(price: number): string {
    return price.toLocaleString('es-MX');
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getEventIconClass(eventType: string): string {
    return 'w-10 h-10 rounded-xl flex items-center justify-center text-lg';
  }

  getEventLabel(eventType: string): string {
    const labels: Record<string, string> = {
      'created': 'Suscripción creada',
      'upgraded': 'Plan mejorado',
      'downgraded': 'Plan reducido',
      'cancelled': 'Suscripción cancelada',
      'reactivated': 'Suscripción reactivada',
      'payment_success': 'Pago exitoso',
      'payment_failed': 'Pago fallido',
      'trial_started': 'Prueba iniciada',
      'trial_ended': 'Prueba finalizada',
      'grace_period_started': 'Período de gracia iniciado'
    };
    return labels[eventType] || eventType;
  }

  // Plan change methods
  selectPlan(planId: string) {
    if (planId !== this.subscription()?.plan_id) {
      this.selectedNewPlan.set(planId);
    }
  }

  isUpgrade(): boolean {
    const currentPlan = this.subscription()?.plan;
    const newPlan = this.plans().find(p => p.id === this.selectedNewPlan());
    if (!currentPlan || !newPlan) return false;
    return newPlan.price_monthly > currentPlan.price_monthly;
  }

  async changePlan() {
    if (!this.selectedNewPlan() || !this.subscription()) return;

    this.processing.set(true);
    try {
      if (this.isUpgrade()) {
        await this.subscriptionService.upgradePlan(this.subscription()!.id, this.selectedNewPlan()!);
      } else {
        await this.subscriptionService.downgradePlan(this.subscription()!.id, this.selectedNewPlan()!);
      }

      // Reload data
      await this.loadData();
      this.showChangePlanModal.set(false);
      this.selectedNewPlan.set(null);
    } catch (error) {
      console.error('Error changing plan:', error);
    } finally {
      this.processing.set(false);
    }
  }

  async cancelSubscription() {
    if (!this.subscription()) return;

    this.processing.set(true);
    try {
      await this.subscriptionService.cancelSubscription(this.subscription()!.id, this.cancelReason);

      // Reload data
      await this.loadData();
      this.showCancelModal.set(false);
      this.cancelReason = '';
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    } finally {
      this.processing.set(false);
    }
  }

  async reactivateSubscription() {
    if (!this.subscription()) return;

    this.processing.set(true);
    try {
      await this.subscriptionService.reactivateSubscription(this.subscription()!.id);
      await this.loadData();
    } catch (error) {
      console.error('Error reactivating subscription:', error);
    } finally {
      this.processing.set(false);
    }
  }
}
