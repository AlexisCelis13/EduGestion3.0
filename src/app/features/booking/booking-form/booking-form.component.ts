import { Component, EventEmitter, Input, Output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, Calendar, Clock, Loader2 } from 'lucide-angular';

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  providers: [{ provide: 'LUCIDE_ICONS', useValue: { Calendar, Clock, Loader2 } }],
  template: `
    <div class="form-container">
      <div class="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
        <h3 class="text-sm font-medium text-blue-900 mb-2">Resumen de la cita</h3>
        <div class="flex items-center gap-2 text-blue-700 text-sm mb-1">
          <i-lucide name="calendar" class="w-4 h-4"></i-lucide>
          <span>{{ formatDate(date) }}</span>
        </div>
        <div class="flex items-center gap-2 text-blue-700 text-sm">
          <i-lucide name="clock" class="w-4 h-4"></i-lucide>
          <span>{{ formatTime(startTime) }} - {{ formatTime(endTime) }}</span>
        </div>
      </div>

      <form [formGroup]="bookingForm" (ngSubmit)="onSubmit()" class="space-y-4">
        
        <!-- Nombre -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tu Nombre Completo *</label>
          <input 
            type="text" 
            formControlName="studentName"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Ej. Juan Pérez">
          <div *ngIf="bookingForm.get('studentName')?.touched && bookingForm.get('studentName')?.invalid" class="text-red-500 text-xs mt-1">
            El nombre es obligatorio.
          </div>
        </div>

        <!-- Email -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico *</label>
          <input 
            type="email" 
            formControlName="studentEmail"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Ej. juan@email.com">
          <div *ngIf="bookingForm.get('studentEmail')?.touched && bookingForm.get('studentEmail')?.invalid" class="text-red-500 text-xs mt-1">
            Ingresa un correo válido.
          </div>
        </div>

        <!-- Servicio (Opcional) -->
        <div *ngIf="services.length > 0">
          <label class="block text-sm font-medium text-gray-700 mb-1">Servicio de Interés</label>
          <select 
            formControlName="serviceId"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white">
            <option [ngValue]="null">Asesoría General</option>
            <option *ngFor="let service of services" [value]="service.id">
              {{ service.name }} ({{ formatPrice(service.price) }})
            </option>
          </select>
        </div>

        <!-- Notas -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notas Adicionales</label>
          <textarea 
            formControlName="notes"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="¿Hay algún tema específico que quieras tratar?"></textarea>
        </div>

        <!-- Botones -->
        <div class="flex gap-3 pt-4">
          <button 
            type="button" 
            (click)="onCancel()"
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
            Atrás
          </button>
          <button 
            type="submit" 
            [disabled]="bookingForm.invalid || isSubmitting"
            class="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <i-lucide *ngIf="isSubmitting" name="loader-2" class="w-4 h-4 animate-spin"></i-lucide>
            {{ isSubmitting ? 'Confirmando...' : 'Confirmar Reserva' }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class BookingFormComponent implements OnInit {
  @Input() date: string = '';
  @Input() startTime: string = '';
  @Input() endTime: string = '';
  @Input() services: any[] = [];
  @Input() preSelectedServiceId: string | undefined;
  @Input() isSubmitting: boolean = false;

  @Output() submitForm = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  bookingForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.bookingForm = this.fb.group({
      studentName: ['', [Validators.required, Validators.minLength(3)]],
      studentEmail: ['', [Validators.required, Validators.email]],
      serviceId: [null],
      notes: ['']
    });
  }

  ngOnInit() {
    if (this.preSelectedServiceId) {
      this.bookingForm.patchValue({ serviceId: this.preSelectedServiceId });
    }
  }

  onSubmit() {
    if (this.bookingForm.valid) {
      this.submitForm.emit(this.bookingForm.value);
    } else {
      this.bookingForm.markAllAsTouched();
    }
  }

  onCancel() {
    this.cancel.emit();
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(time: string): string {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  }

  formatPrice(price: number): string {
    return price.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  }
}
