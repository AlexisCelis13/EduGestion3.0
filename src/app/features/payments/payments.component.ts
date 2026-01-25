import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { LucideAngularModule, DollarSign, CreditCard, Building, ArrowUpRight, History, Wallet, TrendingUp, CheckCircle } from 'lucide-angular';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  providers: [{ provide: 'LUCIDE_ICONS', useValue: { DollarSign, CreditCard, Building, ArrowUpRight, History, Wallet, TrendingUp, CheckCircle } }],
  template: `
    <div class="min-h-screen">
      <!-- Header -->
      <div class="bg-white border-b border-surface-100">
        <div class="max-w-7xl mx-auto px-6 lg:px-8">
          <div class="flex justify-between items-center py-8">
            <div>
              <h1 class="text-2xl font-semibold text-surface-700">Pagos e Ingresos</h1>
              <p class="text-surface-400 mt-1">Administra tus métodos de cobro y visualiza tus ganancias.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <!-- Stats Cards -->
        <div class="grid md:grid-cols-3 gap-6 mb-8">
          <!-- Ingresos Totales -->
          <div class="card-premium p-6 hover-lift">
            <div class="flex items-center">
              <div class="w-12 h-12 bg-accent-green/10 rounded-2xl flex items-center justify-center">
                <i-lucide name="trending-up" class="w-6 h-6 text-accent-green"></i-lucide>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-surface-400">Ingresos Totales</p>
                <p class="text-2xl font-semibold text-surface-700">{{ formatPrice(totalRevenue()) }}</p>
              </div>
            </div>
          </div>

          <!-- Saldo Disponible -->
          <div class="card-premium p-6 hover-lift">
            <div class="flex items-center">
              <div class="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center">
                <i-lucide name="wallet" class="w-6 h-6 text-primary-600"></i-lucide>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-surface-400">Disponible para Retiro</p>
                <p class="text-2xl font-semibold text-surface-700">{{ formatPrice(availableBalance()) }}</p>
              </div>
            </div>
          </div>

          <!-- Método de Cobro -->
          <div class="card-premium p-6 hover-lift cursor-pointer" (click)="showLinkModal.set(true)">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-12 h-12 rounded-2xl flex items-center justify-center"
                     [class.bg-accent-green]="hasPayoutMethod()"
                     [class.bg-opacity-10]="hasPayoutMethod()"
                     [class.bg-amber-50]="!hasPayoutMethod()">
                  <i-lucide name="building" class="w-6 h-6" 
                            [class.text-accent-green]="hasPayoutMethod()"
                            [class.text-amber-600]="!hasPayoutMethod()"></i-lucide>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-surface-400">Cuenta Vinculada</p>
                  <p class="text-lg font-semibold text-surface-700" *ngIf="hasPayoutMethod()">
                    **** {{ getLast4(payoutSettings()?.account_number || '') }}
                  </p>
                  <p class="text-sm font-medium text-amber-600" *ngIf="!hasPayoutMethod()">
                    Vincular cuenta bancaria
                  </p>
                </div>
              </div>
              <i-lucide name="arrow-up-right" class="w-5 h-5 text-surface-300"></i-lucide>
            </div>
          </div>
        </div>

        <div class="grid lg:grid-cols-3 gap-6">
          <!-- Historial de Transacciones -->
          <div class="lg:col-span-2 card-premium overflow-hidden flex flex-col" style="max-height: 500px;">
            <div class="p-6 border-b border-surface-100 flex justify-between items-center">
              <h3 class="font-semibold text-surface-700 flex items-center gap-2">
                <i-lucide name="history" class="w-5 h-5 text-surface-400"></i-lucide>
                Historial de Ingresos
              </h3>
            </div>
            
            <div class="overflow-y-auto flex-1">
              <table class="w-full text-left">
                <thead class="bg-surface-50 sticky top-0">
                  <tr>
                    <th class="px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Fecha</th>
                    <th class="px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Concepto</th>
                    <th class="px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Alumno</th>
                    <th class="px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider text-right">Monto</th>
                    <th class="px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider text-center">Estado</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-surface-100">
                  <tr *ngFor="let tx of transactions()" class="hover:bg-surface-50 transition-colors">
                    <td class="px-6 py-4 text-sm text-surface-600 whitespace-nowrap">{{ formatDate(tx.appointment_date) }}</td>
                    <td class="px-6 py-4 text-sm font-medium text-surface-700">
                      {{ tx.service_id ? 'Servicio/Clase' : 'Asesoría Personalizada' }}
                    </td>
                    <td class="px-6 py-4 text-sm text-surface-600">
                      {{ tx.students?.first_name }} {{ tx.students?.last_name }}
                    </td>
                    <td class="px-6 py-4 text-sm font-semibold text-accent-green text-right">
                      +{{ formatPrice(tx.amount_paid) }}
                    </td>
                    <td class="px-6 py-4 text-center">
                      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-green/10 text-accent-green">
                        <i-lucide name="check-circle" class="w-3 h-3"></i-lucide>
                        Completado
                      </span>
                    </td>
                  </tr>
                  <tr *ngIf="transactions().length === 0">
                    <td colspan="5" class="px-6 py-12 text-center text-surface-400">
                      <div class="flex flex-col items-center">
                        <div class="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mb-4">
                          <i-lucide name="dollar-sign" class="w-8 h-8 text-surface-300"></i-lucide>
                        </div>
                        <p>No hay ingresos registrados aún.</p>
                        <p class="text-sm mt-1">Los pagos recibidos aparecerán aquí.</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Configuración de Cuenta -->
          <div class="card-premium p-6">
            <h3 class="font-semibold text-surface-700 mb-6">Detalle de Cuenta</h3>
            
            <div *ngIf="!hasPayoutMethod()" class="text-center py-8">
              <div class="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i-lucide name="building" class="w-8 h-8 text-surface-400"></i-lucide>
              </div>
              <p class="text-surface-500 mb-4 text-sm">Vincula tu cuenta bancaria para recibir tus pagos automáticamente.</p>
              <button (click)="showLinkModal.set(true)" class="w-full px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-medium hover-lift">
                Vincular Cuenta
              </button>
            </div>

            <div *ngIf="hasPayoutMethod()" class="space-y-4">
              <div class="p-4 bg-surface-50 rounded-xl border border-surface-100">
                <p class="text-xs font-medium text-surface-400 uppercase mb-1">Banco</p>
                <p class="font-medium text-surface-700">{{ payoutSettings()?.bank_name }}</p>
              </div>
              <div class="p-4 bg-surface-50 rounded-xl border border-surface-100">
                <p class="text-xs font-medium text-surface-400 uppercase mb-1">Titular</p>
                <p class="font-medium text-surface-700">{{ payoutSettings()?.account_holder }}</p>
              </div>
              <div class="p-4 bg-surface-50 rounded-xl border border-surface-100">
                <p class="text-xs font-medium text-surface-400 uppercase mb-1">CLABE Interbancaria</p>
                <p class="font-medium text-surface-700 tracking-wider">
                  {{ maskAccount(payoutSettings()?.account_number) }}
                </p>
              </div>
              
              <button (click)="showLinkModal.set(true)" class="w-full mt-4 px-4 py-3 border border-primary-200 text-primary-600 rounded-xl hover:bg-primary-50 transition-all text-sm font-medium">
                Actualizar Datos
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Vincular Cuenta -->
    <div *ngIf="showLinkModal()" class="fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div class="card-premium w-full max-w-md overflow-hidden animate-scale-in">
        <div class="p-6 border-b border-surface-100 flex justify-between items-center">
          <h3 class="text-lg font-semibold text-surface-700">Datos Bancarios</h3>
          <button (click)="showLinkModal.set(false)" class="w-8 h-8 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-400 hover:text-surface-600 transition-colors">
            ✕
          </button>
        </div>
        
        <form [formGroup]="bankForm" (ngSubmit)="saveBankDetails()" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-surface-700 mb-2">Banco</label>
            <select formControlName="bank_name" class="w-full px-4 py-3 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white text-surface-700">
              <option value="">Selecciona tu banco</option>
              <option value="BBVA">BBVA</option>
              <option value="Santander">Santander</option>
              <option value="Banamex">Citibanamex</option>
              <option value="Banorte">Banorte</option>
              <option value="HSBC">HSBC</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-surface-700 mb-2">Titular de la Cuenta</label>
            <input type="text" formControlName="account_holder" class="w-full px-4 py-3 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" placeholder="Nombre completo">
          </div>

          <div>
            <label class="block text-sm font-medium text-surface-700 mb-2">CLABE Interbancaria (18 dígitos)</label>
            <input type="text" formControlName="account_number" maxlength="18" class="w-full px-4 py-3 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-mono" placeholder="000000000000000000">
            <p class="text-xs text-surface-400 mt-2">Tu CLABE es única y segura para recibir depósitos.</p>
          </div>

          <div class="pt-4 flex gap-3">
             <button type="button" (click)="showLinkModal.set(false)" class="flex-1 px-4 py-3 border border-surface-200 text-surface-600 rounded-xl hover:bg-surface-50 transition-all font-medium">
               Cancelar
             </button>
             <button type="submit" [disabled]="bankForm.invalid || isSaving()" class="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex justify-center items-center gap-2">
               {{ isSaving() ? 'Guardando...' : 'Guardar Cuenta' }}
             </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.2s ease-out;
    }
    .animate-scale-in {
      animation: scaleIn 0.2s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class PaymentsComponent implements OnInit {
  transactions = signal<any[]>([]);
  payoutSettings = signal<any>(null);
  totalRevenue = signal(0);
  availableBalance = signal(0);
  showLinkModal = signal(false);
  isSaving = signal(false);
  hasPayoutMethod = signal(false);
  bankForm: FormGroup;
  userId: string | undefined;

  constructor(
    private supabaseService: SupabaseService,
    private fb: FormBuilder
  ) {
    this.bankForm = this.fb.group({
      bank_name: ['', Validators.required],
      account_holder: ['', Validators.required],
      account_number: ['', [Validators.required, Validators.minLength(18), Validators.maxLength(18), Validators.pattern('^[0-9]+$')]]
    });
  }

  async ngOnInit() {
    this.supabaseService.currentUser$.subscribe(async (user: any) => {
      if (user) {
        this.userId = user.id;
        this.loadData();
      }
    });
  }

  async loadData() {
    if (!this.userId) return;
    const settings = await this.supabaseService.getPayoutSettings(this.userId);
    if (settings) {
      this.payoutSettings.set(settings);
      this.hasPayoutMethod.set(true);
      this.bankForm.patchValue({
        bank_name: settings.bank_name,
        account_holder: settings.account_holder,
        account_number: settings.account_number
      });
    }
    const txs = await this.supabaseService.getPaymentHistory(this.userId);
    this.transactions.set(txs || []);
    const total = (txs || []).reduce((sum: number, tx: any) => sum + (Number(tx.amount_paid) || 0), 0);
    this.totalRevenue.set(total);
    this.availableBalance.set(total);
  }

  async saveBankDetails() {
    if (this.bankForm.invalid || !this.userId) return;
    this.isSaving.set(true);
    const formValue = this.bankForm.value;
    const { error } = await this.supabaseService.upsertPayoutSettings({
      user_id: this.userId,
      ...formValue
    });
    if (!error) {
      this.showLinkModal.set(false);
      this.loadData();
    } else {
      alert('Error al guardar datos. Intenta de nuevo.');
    }
    this.isSaving.set(false);
  }

  formatPrice(amount: number): string {
    return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  maskAccount(number: string | undefined): string {
    if (!number) return '•••• •••• •••• ••••';
    return '•••• •••• •••• ' + number.slice(-4);
  }

  getLast4(number: string): string {
    return number.slice(-4);
  }
}
