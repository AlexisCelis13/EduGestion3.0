import { Component, EventEmitter, Input, Output, ViewChild, ElementRef, AfterViewInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../../core/services/payment.service';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="payment-container bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-fade-in">
      <div class="text-center mb-6">
        <div class="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg class="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
          </svg>
        </div>
        <h3 class="text-lg font-bold text-gray-900">Pasarela de Pago Segura</h3>
        <p class="text-gray-500 text-sm">Estás a un paso de confirmar tu clase</p>
      </div>

      <!-- Resumen de Cobro -->
      <div class="mb-6 bg-gray-50 p-4 rounded-lg flex justify-between items-center border border-gray-200">
        <span class="text-gray-700 font-medium">Total a pagar:</span>
        <span class="text-2xl font-bold text-blue-700">{{ formatPrice(amount) }}</span>
      </div>

      <!-- PayPal Button Container -->
      <div class="mb-4">
        <div #paypalContainer id="paypal-booking-container" class="w-full min-h-[55px]">
          <div *ngIf="loadingPayPal && !paypalError" class="flex items-center justify-center py-4">
            <svg class="animate-spin h-6 w-6 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-gray-500">Cargando opciones de pago...</span>
          </div>
        </div>
        
        <!-- Error message -->
        <div *ngIf="paypalError" class="text-center py-4 bg-red-50 rounded-lg border border-red-200">
          <p class="text-red-600 text-sm">No se pudo cargar el método de pago.</p>
          <p class="text-gray-500 text-xs mt-1">Por favor, intenta de nuevo más tarde.</p>
        </div>
      </div>

      <!-- Processing indicator -->
      <div *ngIf="isProcessing" class="text-center py-4">
        <svg class="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-gray-600">Procesando tu pago...</p>
      </div>

      <!-- Botón Atrás -->
      <div class="flex gap-3 pt-4 border-t border-gray-100">
        <button 
          type="button" 
          (click)="onCancel()"
          [disabled]="isProcessing"
          class="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Atrás
        </button>
      </div>
    </div>
  `
})
export class PaymentFormComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() amount: number = 0;
  @Input() isProcessing: boolean = false;
  @Output() pay = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  @ViewChild('paypalContainer') paypalContainer!: ElementRef;

  loadingPayPal = true;
  paypalError = false;
  private paypalInitialized = false;
  private viewInitialized = false;

  constructor(private paymentService: PaymentService) { }

  ngAfterViewInit() {
    this.viewInitialized = true;
    // Try to initialize if amount is already set
    if (this.amount > 0) {
      console.log('PayPal: AfterViewInit with amount:', this.amount);
      setTimeout(() => this.initPayPal(), 100);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // When amount changes and view is ready, initialize PayPal
    if (changes['amount'] && this.viewInitialized && this.amount > 0 && !this.paypalInitialized) {
      console.log('PayPal: Amount changed to', this.amount);
      setTimeout(() => this.initPayPal(), 100);
    }
  }

  ngOnDestroy() {
    // Clean up PayPal button
    const container = document.getElementById('paypal-booking-container');
    if (container) {
      container.innerHTML = '';
    }
  }

  private async initPayPal() {
    if (this.paypalInitialized) return;

    // If amount is 0 or less, show error
    if (this.amount <= 0) {
      console.warn('PayPal: Amount is 0 or less, skipping button initialization');
      this.loadingPayPal = false;
      this.paypalError = true;
      return;
    }

    try {
      console.log('PayPal: Initializing with amount:', this.amount);
      await this.paymentService.initPayPalButton(
        '#paypal-booking-container',
        this.amount,
        (details) => {
          // Payment approved!
          console.log('PayPal: Payment approved', details);
          this.pay.emit({
            paymentMethod: 'paypal',
            transactionId: details.id,
            payerEmail: details.payer?.email_address,
            status: details.status
          });
        }
      );
      this.paypalInitialized = true;
      console.log('PayPal: Button initialized successfully');
    } catch (error) {
      console.error('Error initializing PayPal:', error);
      this.paypalError = true;
    } finally {
      this.loadingPayPal = false;
    }
  }

  onCancel() {
    this.cancel.emit();
  }

  formatPrice(price: number): string {
    return price.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  }
}
