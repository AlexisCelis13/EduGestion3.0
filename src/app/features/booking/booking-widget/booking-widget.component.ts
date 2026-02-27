import { Component, computed, inject, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingCalendarComponent } from '../booking-calendar/booking-calendar.component';
import { BookingSlotsComponent } from '../booking-slots/booking-slots.component';
import { BookingFormComponent } from '../booking-form/booking-form.component';
import { PaymentFormComponent } from '../payment-form/payment-form.component';
import { SupabaseService } from '../../../core/services/supabase.service';
import { LucideAngularModule, ArrowLeft, Check, Calendar, Clock, X } from 'lucide-angular';

interface SelectedSlot {
  date: string;
  startTime: string;
  endTime: string;
}

@Component({
  selector: 'app-booking-widget',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BookingCalendarComponent,
    BookingSlotsComponent,
    BookingFormComponent,
    PaymentFormComponent,
    LucideAngularModule
  ],
  providers: [],
  template: `
    <div class="booking-widget bg-white rounded-2xl shadow-xl border border-gray-100 overflow-visible w-full max-w-6xl mx-auto">
      <div class="p-6 md:p-8 flex flex-col md:flex-row gap-8">
        
        <!-- Left Column (Main content) -->
        <div class="flex-1">
          <!-- Paso 1: Calendario -->
          <div *ngIf="currentStep() === 'calendar' || (currentStep() === 'slots' && !showSlotsAside)" class="animate-fade-in">
              <div class="flex justify-between items-center mb-2">
                <h2 class="text-2xl font-bold text-gray-900">1. Selecciona fechas</h2>
              </div>
              <p class="text-gray-600 mb-6">Elige un día en el calendario para ver los horarios disponibles y escoge las horas que deseas reservar.</p>
              <app-booking-calendar 
                [tutorId]="tutorId" 
                (dateSelected)="onDateSelected($event)">
              </app-booking-calendar>
          </div>

          <!-- Paso 2: Slots -->
          <div *ngIf="currentStep() === 'slots'" class="animate-fade-in">
              
              <div class="flex items-center gap-3 mb-6">
                  <button (click)="goBack()" class="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                    Atrás
                  </button>
                  <button (click)="goBackToCalendar()" class="px-4 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors whitespace-nowrap">
                    <i-lucide [img]="Calendar" class="w-4 h-4"></i-lucide>
                    Elegir otra fecha
                  </button>
              </div>

              <h2 class="text-3xl font-bold text-gray-900 mb-6 flex flex-col gap-1">
                Horarios:
                <span class="text-blue-600 capitalize leading-tight">{{ formatDate(selectedDate) }}</span>
              </h2>
              
              <app-booking-slots 
                [slots]="availableSlots" 
                [loading]="loadingSlots()"
                (slotSelected)="onSlotSelected($event)">
              </app-booking-slots>
          </div>

          <!-- Paso 3: Formulario -->
          <div *ngIf="currentStep() === 'form'" class="animate-fade-in">
              <div class="flex items-center gap-4 mb-6">
                <h2 class="text-2xl font-bold text-gray-900">2. Tus Datos</h2>
              </div>
              
              <app-booking-form 
                [tutorId]="tutorId"
                [date]="selectedSlots[0]?.date || ''"
                [startTime]="selectedSlots[0]?.startTime || ''"
                [endTime]="selectedSlots[0]?.endTime || ''"
                [services]="services"
                [preSelectedServiceId]="preSelectedServiceId"
                [isSubmitting]="checkingAvailability" 
                (submitForm)="onFormSubmit($event)" 
                (cancel)="goBack()">
              </app-booking-form>
          </div>

          <!-- Paso 4: Pago -->
          <div *ngIf="currentStep() === 'payment'" class="animate-fade-in">
              <div class="flex flex-col gap-4 mb-6 relative">
                <button (click)="goBack()" class="self-start px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                    Atrás
                </button>
                <h2 class="text-2xl font-bold text-gray-900">Confirmar y Pagar</h2>
              </div>
              
              <app-payment-form
                [amount]="pendingPaymentAmount"
                [isProcessing]="submitting()"
                (pay)="onProcessPayment($event)"
                (cancel)="goBack()">
              </app-payment-form>
          </div>

          <!-- Paso 5: Éxito -->
          <div *ngIf="currentStep() === 'success'" class="text-center py-12 animate-fade-in">
            <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i-lucide [img]="Check" class="w-10 h-10 text-green-600"></i-lucide>
            </div>
            <h2 class="text-3xl font-bold text-gray-900 mb-3">¡Reserva Confirmada!</h2>
            <p class="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              Hemos agendado un total de <strong>{{ totalGeneratedSlots.length }}</strong> clase(s) con éxito.
            </p>
            <div class="p-6 bg-blue-50 border border-blue-100 text-blue-800 rounded-xl text-left mb-8 max-w-md mx-auto">
              <p class="font-bold mb-3 text-lg">Próximos pasos:</p>
              <ul class="list-disc pl-5 space-y-2">
                <li>Revisa tu correo {{ confirmedEmail }}</li>
                <li>Podrás acceder al portal del estudiante para ver tus horarios</li>
              </ul>
            </div>
            <button 
              (click)="reset()" 
              class="px-8 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors shadow-md text-lg">
              Cerrar y volver al inicio
            </button>
          </div>
        </div> <!-- End Left Column -->

        <!-- Right Column (Summary & Settings) -->
        <!-- Visible unless success step -->
        <div *ngIf="currentStep() !== 'success'" class="w-full md:w-80 lg:w-[400px] flex flex-col gap-6 border-t md:border-t-0 md:border-l border-gray-200 pt-6 md:pt-0 md:pl-8">
          
          <!-- Resumen en pasos calendar / slots -->
          <div *ngIf="currentStep() === 'calendar' || currentStep() === 'slots'" class="sticky top-6">
            <div class="bg-gray-50 rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                <i-lucide [img]="Calendar" class="w-5 h-5 text-blue-600"></i-lucide>
                Carrito de Clases
              </h3>
              
              <div *ngIf="selectedSlots.length === 0" class="text-sm text-gray-500 italic mb-4 p-4 text-center bg-white rounded-lg border border-dashed border-gray-300">
                Aún no has seleccionado ningún horario. Navega por el calendario y agrega clases.
              </div>
              
              <div *ngIf="selectedSlots.length > 0" class="space-y-3 mb-6 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                <div *ngFor="let s of selectedSlots" class="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm relative group overflow-hidden hover:border-blue-200 transition-colors">
                  <!-- Left accent border -->
                  <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 group-hover:bg-blue-600 transition-colors"></div>
                  <div class="pl-3">
                    <p class="text-sm font-bold text-gray-900 capitalize">{{ formatDateShort(s.date) }}</p>
                    <div class="flex items-center gap-1.5 text-xs text-gray-500 mt-1 font-medium">
                      <i-lucide [img]="Clock" class="w-3.5 h-3.5"></i-lucide>
                      {{ formatTime(s.startTime) }}
                    </div>
                  </div>
                  <button (click)="removeSlot(s)" class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500" title="Eliminar clase">
                    <i-lucide [img]="X" class="w-4 h-4"></i-lucide>
                  </button>
                </div>
              </div>

              <div *ngIf="selectedSlots.length > 0">
                <label class="block text-sm font-bold text-gray-900 mb-2">¿Quieres repetir estos horarios?</label>
                <select [(ngModel)]="recurrenceMonths" (change)="calculateTotalSessions()" class="w-full border-gray-300 bg-white rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm mb-3 py-3 px-4">
                  <option [ngValue]="0">Agendar solo estas veces</option>
                  <option [ngValue]="1">Repetir cada semana por 1 Mes</option>
                  <option [ngValue]="2">Repetir cada semana por 2 Meses</option>
                  <option [ngValue]="3">Repetir cada semana por 3 Meses</option>
                </select>
                
                <div class="bg-blue-50 text-blue-800 text-xs font-semibold p-3 rounded-lg flex items-start gap-2 mb-6">
                  <i-lucide [img]="Calendar" class="w-4 h-4 shrink-0 mt-0.5"></i-lucide>
                  <span *ngIf="recurrenceMonths > 0">Generaremos {{ totalGeneratedSlots.length }} clases en el sistema durante el período seleccionado. Todas se agendarán de una vez.</span>
                  <span *ngIf="recurrenceMonths === 0">Se agendarán {{ totalGeneratedSlots.length }} clases.</span>
                </div>
                
                <button 
                  (click)="continueToForm()" 
                  class="w-full bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-blue-700 hover:shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-[0.98]">
                  Continuar
                  <i-lucide [img]="ArrowLeft" class="w-5 h-5 rotate-180"></i-lucide>
                </button>
              </div>
            </div>
          </div>

          <!-- Resumen en pasos form / payment -->
          <div *ngIf="currentStep() === 'form' || currentStep() === 'payment'" class="sticky top-6">
            <div class="bg-gray-50 rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 class="font-bold text-gray-900 mb-4 flex items-center justify-between pb-4 border-b border-gray-200">
                <span class="flex items-center gap-2 text-lg">
                  <i-lucide [img]="Calendar" class="w-5 h-5 text-blue-600"></i-lucide>
                  Resumen
                </span>
                <span class="text-sm font-semibold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  {{ totalGeneratedSlots.length }} clase(s)
                </span>
              </h3>
              
              <div class="space-y-4">
                <div>
                  <p class="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Has seleccionado</p>
                  <div class="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    <div *ngFor="let s of selectedSlots" class="text-sm text-gray-700 bg-white p-2.5 rounded-lg border border-gray-200">
                      <div class="font-medium capitalize">{{ formatDateShort(s.date) }}</div>
                      <div class="text-gray-500 mt-0.5 text-xs flex items-center gap-1">
                        <i-lucide [img]="Clock" class="w-3 h-3"></i-lucide>
                        {{ formatTime(s.startTime) }}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div *ngIf="recurrenceMonths > 0" class="pt-3 border-t border-gray-200">
                  <p class="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Repetición</p>
                  <p class="text-sm font-medium text-blue-700 bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                    Se repite por {{ recurrenceMonths }} mes(es)
                  </p>
                </div>
                
                <!-- If form is filled and we have price -->
                <div *ngIf="currentStep() === 'payment'" class="pt-3 border-t border-gray-200">
                  <p class="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Total a pagar</p>
                  <p class="text-xl font-bold text-gray-900">
                    {{ pendingPaymentAmount | currency:'MXN' }}
                  </p>
                  <p class="text-xs text-gray-500 mt-1">Pago único por todas las clases</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `]
})
export class BookingWidgetComponent {
  @Input() tutorId!: string;
  @Input() services: any[] = [];
  @Input() preSelectedServiceId?: string;

  private supabase = inject(SupabaseService);

  readonly ArrowLeft = ArrowLeft;
  readonly Check = Check;
  readonly Calendar = Calendar;
  readonly Clock = Clock;
  readonly X = X;

  currentStep = signal<'calendar' | 'slots' | 'form' | 'payment' | 'success'>('calendar');
  selectedDate = '';
  availableSlots: any[] = [];
  loadingSlots = signal(false);
  submitting = signal(false);

  selectedSlots: SelectedSlot[] = [];
  recurrenceMonths: number = 0;
  totalGeneratedSlots: SelectedSlot[] = [];

  bookingFormData: any = null;
  pendingPaymentAmount = 0;
  confirmedEmail = '';
  checkingAvailability = false;

  get showSlotsAside() {
    return true;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString + 'T12:00:00');
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(date);
  }

  formatDateShort(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString + 'T12:00:00');
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    }).format(date);
  }

  formatTime(timeString: string): string {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  async onDateSelected(date: string) {
    this.selectedDate = date;
    this.currentStep.set('slots');
    this.loadingSlots.set(true);

    try {
      this.availableSlots = await this.supabase.getAvailableSlotsForDate(this.tutorId, date);
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      this.loadingSlots.set(false);
    }
  }

  onSlotSelected(slot: any) {
    const startTime = slot.startTime || slot.start_time;
    const endTime = slot.endTime || slot.end_time;
    const existing = this.selectedSlots.find(
      (s) => s.date === this.selectedDate && s.startTime === startTime
    );
    if (!existing) {
      this.selectedSlots.push({
        date: this.selectedDate,
        startTime: startTime,
        endTime: endTime
      });
      this.calculateTotalSessions();
    }
  }

  removeSlot(slot: SelectedSlot) {
    this.selectedSlots = this.selectedSlots.filter(s => s !== slot);
    this.calculateTotalSessions();
  }

  calculateTotalSessions() {
    this.totalGeneratedSlots = [...this.selectedSlots];

    if (this.recurrenceMonths > 0) {
      const maxWeeks = this.recurrenceMonths * 4;
      for (const baseSlot of this.selectedSlots) {
        for (let i = 1; i <= maxWeeks; i++) {
          const d = new Date(baseSlot.date + 'T12:00:00');
          d.setDate(d.getDate() + (i * 7));
          this.totalGeneratedSlots.push({
            date: d.toISOString().split('T')[0],
            startTime: baseSlot.startTime,
            endTime: baseSlot.endTime
          });
        }
      }
    }
  }

  async continueToForm() {
    if (this.selectedSlots.length === 0) return;
    this.checkingAvailability = true;

    try {
      const mappedSlots = this.totalGeneratedSlots.map(s => ({
        date: s.date,
        start_time: s.startTime,
        end_time: s.endTime
      }));

      const { data: conflicts, error } = await this.supabase.checkRecurringAvailability(
        this.tutorId,
        mappedSlots
      );

      if (error) {
        console.error(error);
        alert('Hubo un error verificando disponibilidad.');
        this.checkingAvailability = false;
        return;
      }

      if (conflicts && (conflicts as any[]).length > 0) {
        alert('Algunas fechas en la serie seleccionada ya están reservadas. Por favor, revisa tus fechas o elige otro horario.');
        this.checkingAvailability = false;
        return;
      }

      this.currentStep.set('form');
    } catch (error) {
      console.error(error);
      alert('Hubo un error verificando disponibilidad.');
    } finally {
      this.checkingAvailability = false;
    }
  }

  goBack() {
    const step = this.currentStep();
    if (step === 'slots') this.currentStep.set('calendar');
    else if (step === 'form') {
      this.currentStep.set('slots');
    }
    else if (step === 'payment') this.currentStep.set('form');
  }

  goBackToCalendar() {
    this.currentStep.set('calendar');
  }

  onFormSubmit(formData: any) {
    this.bookingFormData = formData;

    // Calculate price
    const service = this.services.find(s => s.id === formData.serviceId);
    let price = service?.price || 0;

    // Total cost
    this.pendingPaymentAmount = price * this.totalGeneratedSlots.length;

    this.currentStep.set('payment');
  }

  async onProcessPayment(paymentStatus: { status: string, message?: string }) {
    if (paymentStatus.status === 'success' || paymentStatus.status === 'COMPLETED') {
      await this.finalizeBooking();
    }
  }

  async finalizeBooking() {
    this.submitting.set(true);

    try {
      const isOther = this.bookingFormData.bookingFor === 'other' || this.bookingFormData.bookingFor === 'child';
      const parentName = isOther ? this.bookingFormData.parentName : null;
      const parentPhone = isOther ? this.bookingFormData.parentPhone : null;
      const parentEmail = isOther ? this.bookingFormData.parentEmail : null;

      const studentEmailToUse = this.bookingFormData.studentEmail || parentEmail;
      const studentPhoneToUse = this.bookingFormData.studentPhone || parentPhone;

      const mappedSlots = this.totalGeneratedSlots.map(s => ({
        date: s.date,
        start_time: s.startTime,
        end_time: s.endTime
      }));

      const { data, error } = await this.supabase.createRecurringBookings({
        student_name: this.bookingFormData.studentName,
        student_last_name: this.bookingFormData.studentLastName,
        student_email: studentEmailToUse,
        student_phone: studentPhoneToUse,
        student_dob: this.bookingFormData.studentDob || undefined,
        parent_name: parentName,
        parent_phone: parentPhone,
        parent_email: parentEmail,
        service_id: this.bookingFormData.serviceId || undefined,
        tutor_id: this.tutorId,
        notes: this.bookingFormData.notes,
        amount_paid: this.pendingPaymentAmount,
        payment_status: 'paid', // Assuming payment went through successfully here
        slots: mappedSlots
      });

      if (error) {
        throw new Error(error.message || JSON.stringify(error));
      }

      this.confirmedEmail = this.bookingFormData.studentEmail;
      this.currentStep.set('success');
    } catch (error: any) {
      console.error('Error in finalizeBooking', error);
      alert('Error guardando la reserva: ' + (error.message || error));
    } finally {
      this.submitting.set(false);
    }
  }

  reset() {
    this.selectedDate = '';
    this.selectedSlots = [];
    this.totalGeneratedSlots = [];
    this.recurrenceMonths = 0;
    this.bookingFormData = null;
    this.pendingPaymentAmount = 0;
    this.currentStep.set('calendar');
  }
}
