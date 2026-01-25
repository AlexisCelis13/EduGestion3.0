import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingCalendarComponent } from '../booking-calendar/booking-calendar.component';
import { BookingSlotsComponent } from '../booking-slots/booking-slots.component';
import { BookingFormComponent } from '../booking-form/booking-form.component';
import { SupabaseService } from '../../../core/services/supabase.service';
import { LucideAngularModule, ArrowLeft, Check, Calendar, Clock, Loader2 } from 'lucide-angular';

type BookingStep = 'calendar' | 'slots' | 'form' | 'success';

@Component({
  selector: 'app-booking-widget',
  standalone: true,
  imports: [
    CommonModule,
    BookingCalendarComponent,
    BookingSlotsComponent,
    BookingFormComponent,
    LucideAngularModule
  ],
  providers: [{ provide: 'LUCIDE_ICONS', useValue: { ArrowLeft, Check, Calendar, Clock, Loader2 } }],
  template: `
    <div class="booking-widget bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <!-- Headers de pasos (solo móvil o si se desea mostrar progreso) -->
      
      <div class="p-6">
        <!-- Paso 1: Calendario -->
        <div *ngIf="currentStep() === 'calendar' || (currentStep() === 'slots' && !showSlotsAside)">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Selecciona una fecha</h2>
          <app-booking-calendar 
            [tutorId]="tutorId" 
            (dateSelected)="onDateSelected($event)">
          </app-booking-calendar>
        </div>

        <!-- Paso 2: Slots (puede mostrarse junto al calendario en desktop si se quisiera, aquí lo hacemos secuencial por simplicidad móvil/desktop) -->
        <div *ngIf="currentStep() === 'slots'">
          <div class="flex items-center gap-2 mb-4">
            <button (click)="goBack()" class="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
              <i-lucide name="arrow-left" class="w-5 h-5"></i-lucide>
            </button>
            <h2 class="text-xl font-bold text-gray-900">
              Horarios para {{ formatDate(selectedDate) }}
            </h2>
          </div>
          
          <app-booking-slots 
            [slots]="availableSlots" 
            [loading]="loadingSlots()"
            (slotSelected)="onSlotSelected($event)">
          </app-booking-slots>
        </div>

        <!-- Paso 3: Formulario -->
        <div *ngIf="currentStep() === 'form'">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Completa tu reserva</h2>
          <app-booking-form 
            [date]="selectedDate"
            [startTime]="selectedSlot?.startTime || ''"
            [endTime]="selectedSlot?.endTime || ''"
            [services]="services"
            [preSelectedServiceId]="preSelectedServiceId"
            [isSubmitting]="submitting()"
            (submitForm)="onConfirmBooking($event)"
            (cancel)="goBack()">
          </app-booking-form>
        </div>

        <!-- Paso 4: Éxito -->
        <div *ngIf="currentStep() === 'success'" class="text-center py-8">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i-lucide name="check" class="w-8 h-8 text-green-600"></i-lucide>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">¡Reserva Confirmada!</h2>
          <p class="text-gray-600 mb-6 max-w-sm mx-auto">
            Hemos agendado tu asesoría para el <strong>{{ formatDate(selectedDate) }}</strong> a las <strong>{{ formatTime(selectedSlot?.startTime || '') }}</strong>.
          </p>
          <div class="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm mb-6 inline-block text-left">
            <p class="font-medium mb-1">Próximos pasos:</p>
            <ul class="list-disc pl-5 space-y-1">
              <li>Revisa tu correo {{ confirmedEmail }}</li>
              <li>El tutor confirmará tu solicitud pronto</li>
            </ul>
          </div>
          <br>
          <button 
            (click)="reset()" 
            class="px-6 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors">
            Hacer otra reserva
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      max-width: 500px;
      margin: 0 auto;
    }
  `]
})
export class BookingWidgetComponent implements OnInit {
  @Input() tutorId: string = '';
  @Input() services: any[] = [];
  @Input() preSelectedServiceId: string | undefined; // Servicio pre-seleccionado

  // Configuración
  showSlotsAside = false; // Para layout desktop a futuro

  // Estado
  currentStep = signal<BookingStep>('calendar');
  selectedDate: string = '';
  availableSlots: { startTime: string; endTime: string }[] = [];
  selectedSlot: { startTime: string; endTime: string } | null = null;

  loadingSlots = signal(false);
  submitting = signal(false);

  confirmedEmail = '';

  constructor(private supabaseService: SupabaseService) { }

  ngOnInit() {
  }

  async onDateSelected(date: string) {
    this.selectedDate = date;
    this.currentStep.set('slots');
    this.loadingSlots.set(true);

    // Cargar slots disponibles
    try {
      this.availableSlots = await this.supabaseService.getAvailableSlotsForDate(this.tutorId, date);
    } catch (error) {
      console.error('Error loading slots:', error);
      this.availableSlots = [];
    } finally {
      this.loadingSlots.set(false);
    }
  }

  onSlotSelected(slot: { startTime: string; endTime: string }) {
    this.selectedSlot = slot;
    this.currentStep.set('form');
  }

  async onConfirmBooking(formData: any) {
    if (!this.selectedSlot) return;

    this.submitting.set(true);

    try {
      const appointment = {
        tutor_id: this.tutorId,
        student_name: formData.studentName,
        student_email: formData.studentEmail,
        date: this.selectedDate,
        start_time: this.selectedSlot.startTime,
        end_time: this.selectedSlot.endTime,
        service_id: formData.serviceId,
        notes: formData.notes
      };

      const result = await this.supabaseService.createPublicAppointment(appointment);

      if (result.error) {
        throw result.error;
      }

      this.confirmedEmail = formData.studentEmail;
      this.currentStep.set('success');

    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Hubo un error al agendar la cita. Por favor intenta de nuevo.');
    } finally {
      this.submitting.set(false);
    }
  }

  goBack() {
    if (this.currentStep() === 'slots') {
      this.currentStep.set('calendar');
      this.selectedDate = '';
      this.availableSlots = [];
    } else if (this.currentStep() === 'form') {
      this.currentStep.set('slots');
      this.selectedSlot = null;
    }
  }

  reset() {
    this.currentStep.set('calendar');
    this.selectedDate = '';
    this.selectedSlot = null;
    this.availableSlots = [];
    this.confirmedEmail = '';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
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
}
