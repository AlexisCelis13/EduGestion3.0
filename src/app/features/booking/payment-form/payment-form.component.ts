import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, CreditCard, Lock, ShieldCheck } from 'lucide-angular';

@Component({
    selector: 'app-payment-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
    providers: [{ provide: 'LUCIDE_ICONS', useValue: { CreditCard, Lock, ShieldCheck } }],
    template: `
    <div class="payment-container bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-fade-in">
      <div class="text-center mb-6">
        <div class="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <i-lucide name="credit-card" class="w-6 h-6 text-blue-600"></i-lucide>
        </div>
        <h3 class="text-lg font-bold text-gray-900">Pasarela de Pago Segura</h3>
        <p class="text-gray-500 text-sm">Estás a un paso de confirmar tu clase</p>
      </div>

      <!-- Resumen de Cobro -->
      <div class="mb-6 bg-gray-50 p-4 rounded-lg flex justify-between items-center border border-gray-200">
        <span class="text-gray-700 font-medium">Total a pagar:</span>
        <span class="text-2xl font-bold text-blue-700">{{ formatPrice(amount) }}</span>
      </div>

      <form [formGroup]="paymentForm" (ngSubmit)="onSubmit()" class="space-y-4">
        
        <!-- Nombre en Tarjeta -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nombre en la tarjeta</label>
          <input 
            type="text" 
            formControlName="cardName"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors uppercase"
            placeholder="COMO APARECE EN LA TARJETA">
        </div>

        <!-- Número de Tarjeta -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Número de tarjeta</label>
          <div class="relative">
            <input 
              type="text" 
              formControlName="cardNumber"
              maxlength="19"
              (input)="formatCardNumber($event)"
              class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors placeholder-gray-400"
              placeholder="0000 0000 0000 0000">
            <i-lucide name="lock" class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"></i-lucide>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Expiración -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Vencimiento</label>
            <input 
              type="text" 
              formControlName="expiryDate"
              maxlength="5"
              (input)="formatExpiry($event)"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-center"
              placeholder="MM/YY">
          </div>

          <!-- CVC -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">CVC / CVV</label>
            <div class="relative">
              <input 
                type="password" 
                formControlName="cvc"
                maxlength="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-center"
                placeholder="123">
               <i-lucide name="shield-check" class="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2"></i-lucide>
            </div>
          </div>
        </div>

        <!-- Botones -->
        <div class="flex gap-3 pt-4">
          <button 
            type="button" 
            (click)="onCancel()"
            class="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
            Atrás
          </button>
          
          <button 
            type="submit" 
            [disabled]="paymentForm.invalid || isProcessing"
            class="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <span *ngIf="isProcessing" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
            {{ isProcessing ? 'Procesando...' : 'Pagar ' + formatPrice(amount) }}
          </button>
        </div>

        <p class="text-xs text-center text-gray-400 mt-2 flex items-center justify-center gap-1">
          <i-lucide name="lock" class="w-3 h-3"></i-lucide>
          Pagos procesados de forma segura con encriptación SSL de 256 bits.
        </p>
      </form>
    </div>
  `
})
export class PaymentFormComponent {
    @Input() amount: number = 0;
    @Input() isProcessing: boolean = false;
    @Output() pay = new EventEmitter<any>();
    @Output() cancel = new EventEmitter<void>();

    paymentForm: FormGroup;

    constructor(private fb: FormBuilder) {
        this.paymentForm = this.fb.group({
            cardName: ['', [Validators.required, Validators.minLength(3)]],
            cardNumber: ['', [Validators.required, Validators.minLength(16)]], // Validación simple
            expiryDate: ['', [Validators.required, Validators.minLength(5)]],
            cvc: ['', [Validators.required, Validators.pattern('^[0-9]{3}$')]]
        });
    }

    onSubmit() {
        if (this.paymentForm.valid) {
            this.pay.emit(this.paymentForm.value);
        } else {
            this.paymentForm.markAllAsTouched();
        }
    }

    onCancel() {
        this.cancel.emit();
    }

    formatPrice(price: number): string {
        return price.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    }

    // Helpers de formato visual
    formatCardNumber(event: any) {
        let input = event.target.value.replace(/\D/g, '').substring(0, 16);
        input = input != '' ? input.match(/.{1,4}/g)?.join(' ') : '';
        this.paymentForm.get('cardNumber')?.setValue(input, { emitEvent: false });
    }

    formatExpiry(event: any) {
        let input = event.target.value.replace(/\D/g, '').substring(0, 4);
        if (input.length >= 2) {
            input = input.substring(0, 2) + '/' + input.substring(2);
        }
        this.paymentForm.get('expiryDate')?.setValue(input, { emitEvent: false });
    }
}
