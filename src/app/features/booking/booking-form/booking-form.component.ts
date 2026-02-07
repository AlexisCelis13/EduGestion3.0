import { Component, EventEmitter, Input, Output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { LucideAngularModule, Calendar, Clock, Loader2 } from 'lucide-angular';
import { PhoneInputComponent } from '../../../shared/components/phone-input/phone-input.component';

// Custom validator for past dates only
function pastDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const inputDate = new Date(control.value);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (inputDate > today) {
    return { futureDate: true };
  }
  return null;
}

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, PhoneInputComponent],
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
        
        <!-- Para quién es la cita -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">¿Para quién es la clase?</label>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" formControlName="bookingFor" value="me" class="text-blue-600 focus:ring-blue-500">
              <span class="text-gray-700">Para mí</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" formControlName="bookingFor" value="other" class="text-blue-600 focus:ring-blue-500">
              <span class="text-gray-700">Para alguien más (Hijo/a)</span>
            </label>
          </div>
        </div>

        @if (!showParentFields()) {
          <!-- SECCIÓN: DATOS DE USUARIO NORMAL ('me') - DEFAULT -->
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Nombre -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input 
                type="text" 
                formControlName="studentName"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Ej. Juan">
              <div *ngIf="bookingForm.get('studentName')?.touched && bookingForm.get('studentName')?.invalid" class="text-red-500 text-xs mt-1">
                Requerido.
              </div>
            </div>

            <!-- Apellido -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
              <input 
                type="text" 
                formControlName="studentLastName"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Ej. Pérez">
              <div *ngIf="bookingForm.get('studentLastName')?.touched && bookingForm.get('studentLastName')?.invalid" class="text-red-500 text-xs mt-1">
                Requerido.
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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

             <!-- Teléfono -->
             <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono / WhatsApp *</label>
              <app-phone-input formControlName="studentPhone"></app-phone-input>
              <div *ngIf="bookingForm.get('studentPhone')?.touched && bookingForm.get('studentPhone')?.invalid" class="text-red-500 text-xs mt-1">
                Teléfono obligatorio.
              </div>
            </div>
          </div>

          <!-- Fecha de Nacimiento -->
           <div class="mb-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
            <input 
              type="date" 
              formControlName="studentDob"
              [max]="today"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              [class.border-red-300]="bookingForm.get('studentDob')?.hasError('futureDate')">
            <div *ngIf="bookingForm.get('studentDob')?.hasError('futureDate')" class="text-red-500 text-xs mt-1">
              La fecha no puede ser en el futuro.
            </div>
           </div>

        } @else {
          <!-- SECCIÓN: DATOS DEL ALUMNO (Cuando es 'other') -->
          <div class="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-4 animate-fade-in">
             <h4 class="text-sm font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Datos del Alumno</h4>
             
             <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
               <!-- Nombre del Alumno -->
               <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input 
                  type="text" 
                  formControlName="studentName"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Ej. Juan">
                <div *ngIf="bookingForm.get('studentName')?.touched && bookingForm.get('studentName')?.invalid" class="text-red-500 text-xs mt-1">
                  Requerido.
                </div>
              </div>

               <!-- Apellido del Alumno -->
               <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                <input 
                  type="text" 
                  formControlName="studentLastName"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Ej. Pérez">
                <div *ngIf="bookingForm.get('studentLastName')?.touched && bookingForm.get('studentLastName')?.invalid" class="text-red-500 text-xs mt-1">
                  Requerido.
                </div>
              </div>
             </div>

             <!-- Fecha de Nacimiento -->
             <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
              <input 
                type="date" 
                formControlName="studentDob"
                [max]="today"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                [class.border-red-300]="bookingForm.get('studentDob')?.hasError('futureDate')">
              <div *ngIf="bookingForm.get('studentDob')?.hasError('futureDate')" class="text-red-500 text-xs mt-1">
                La fecha no puede ser en el futuro.
              </div>
             </div>
          </div>

          <!-- SECCIÓN: DATOS DEL RESPONSABLE (PADRE/TUTOR) -->
          <div class="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4 animate-fade-in">
            <h4 class="text-sm font-semibold text-blue-900 mb-3 border-b border-blue-200 pb-2">Datos del Padre/Tutor (Contacto)</h4>
            
            <div class="grid grid-cols-1 gap-3">
              <!-- Nombre Padre -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                <input 
                  type="text" 
                  formControlName="parentName"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Nombre del responsable">
                 <div *ngIf="bookingForm.get('parentName')?.touched && bookingForm.get('parentName')?.invalid" class="text-red-500 text-xs mt-1">
                  Tu nombre es obligatorio.
                </div>
              </div>

              <!-- Email Padre -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico *</label>
                <input 
                  type="email" 
                  formControlName="parentEmail"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Para enviarte la confirmación">
                <div *ngIf="bookingForm.get('parentEmail')?.touched && bookingForm.get('parentEmail')?.invalid" class="text-red-500 text-xs mt-1">
                  Correo obligatorio.
                </div>
              </div>

               <!-- Teléfono Padre -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono / WhatsApp *</label>
                <app-phone-input formControlName="parentPhone"></app-phone-input>
                <div *ngIf="bookingForm.get('parentPhone')?.touched && bookingForm.get('parentPhone')?.invalid" class="text-red-500 text-xs mt-1">
                  Teléfono obligatorio.
                </div>
              </div>
            </div>
          </div>
        }

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
  showParentFields = signal(false);

  // Max date for date of birth (today)
  today = new Date().toISOString().split('T')[0];

  constructor(private fb: FormBuilder) {
    this.bookingForm = this.fb.group({
      bookingFor: ['me'], // 'me' or 'other'

      // Datos del Estudiante
      studentName: ['', [Validators.required, Validators.minLength(2)]],
      studentLastName: ['', [Validators.required, Validators.minLength(2)]],
      studentEmail: ['', [Validators.required, Validators.email]],
      studentPhone: ['', [Validators.required, Validators.minLength(10)]],
      studentDob: ['', [pastDateValidator]],

      // Campos para Padre/Tutor (si bookingFor === 'other')
      parentName: [''],
      parentEmail: [''],
      parentPhone: [''],

      serviceId: [null],
      notes: ['']
    });

    // Escuchar cambios en el selector de para quién es la cita
    this.bookingForm.get('bookingFor')?.valueChanges.subscribe(value => {
      this.updateValidators(value);
    });
  }

  ngOnInit() {
    if (this.preSelectedServiceId) {
      this.bookingForm.patchValue({ serviceId: this.preSelectedServiceId });
    }
    this.updateValidators('me');
  }

  updateValidators(bookingFor: string) {
    const isOther = bookingFor === 'other';
    this.showParentFields.set(isOther);

    const parentNameControl = this.bookingForm.get('parentName');
    const parentEmailControl = this.bookingForm.get('parentEmail');
    const parentPhoneControl = this.bookingForm.get('parentPhone');

    // Controles del estudiante
    const studentPhoneControl = this.bookingForm.get('studentPhone');
    const studentEmailControl = this.bookingForm.get('studentEmail');
    // studentName y studentLastName siempre son requeridos (para el alumno o para el usuario)

    if (isOther) {
      // Validaciones para Padre/Tutor
      parentNameControl?.setValidators([Validators.required, Validators.minLength(3)]);
      parentEmailControl?.setValidators([Validators.required, Validators.email]);
      parentPhoneControl?.setValidators([Validators.required, Validators.minLength(10)]);

      // Si es para otro (hijo):
      // - El teléfono del alumno NO es obligatorio (usamos el del padre)
      studentPhoneControl?.clearValidators();
      // - El email del alumno NO es obligatorio (usamos el del padre)
      studentEmailControl?.clearValidators();
      // Importante: asegurarnos de que el email del alumno no bloquee si está vacío
      studentEmailControl?.updateValueAndValidity();
    } else {
      // Limpiar validaciones de Padre
      parentNameControl?.clearValidators();
      parentEmailControl?.clearValidators();
      parentPhoneControl?.clearValidators();

      // Si es para mí:
      // - Mis datos de contacto son obligatorios
      studentPhoneControl?.setValidators([Validators.required, Validators.minLength(10)]);
      studentEmailControl?.setValidators([Validators.required, Validators.email]);
    }

    parentNameControl?.updateValueAndValidity();
    parentEmailControl?.updateValueAndValidity();
    parentPhoneControl?.updateValueAndValidity();
    studentPhoneControl?.updateValueAndValidity();

    // Asegurar que studentEmail se actualice
    studentEmailControl?.updateValueAndValidity();
  }

  onSubmit() {
    if (this.bookingForm.valid) {
      // Preparar objeto para emitir
      const formValue = this.bookingForm.value;
      const submissionData: any = {
        studentName: formValue.studentName,
        studentLastName: formValue.studentLastName,
        studentDob: formValue.studentDob,
        serviceId: formValue.serviceId,
        notes: formValue.notes,
        bookingFor: formValue.bookingFor
      };

      if (formValue.bookingFor === 'other') {
        // Si es para otro, el contacto principal es el Padre
        submissionData.studentEmail = formValue.parentEmail;
        submissionData.studentPhone = formValue.parentPhone;

        submissionData.parentName = formValue.parentName;
        submissionData.parentEmail = formValue.parentEmail;
        submissionData.parentPhone = formValue.parentPhone;
      } else {
        // Si es para mí
        submissionData.studentEmail = formValue.studentEmail;
        submissionData.studentPhone = formValue.studentPhone;

        submissionData.parentName = null;
        submissionData.parentEmail = null;
        submissionData.parentPhone = null;
      }

      this.submitForm.emit(submissionData);
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
