import { Component, EventEmitter, Input, Output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { LucideAngularModule, Calendar, Clock, Loader2, Info, AlertCircle } from 'lucide-angular';
import { PhoneInputComponent } from '../../../shared/components/phone-input/phone-input.component';
import { SupabaseService } from '../../../core/services/supabase.service';

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
  template: `
    <div class="form-container">
      
      <!-- Existing Student / Reactivation Notice -->
      @if (existingStudent()) {
        <div class="mb-6 p-4 rounded-lg flex gap-3 animate-fade-in border" 
            [class.bg-green-50]="existingStudent()?.is_active" 
            [class.border-green-200]="existingStudent()?.is_active" 
            [class.bg-amber-50]="!existingStudent()?.is_active"
            [class.border-amber-200]="!existingStudent()?.is_active">
          <div class="mt-0.5">
             <i-lucide [img]="existingStudent()?.is_active ? Info : AlertCircle" 
                class="w-5 h-5" 
                [class.text-green-600]="existingStudent()?.is_active"
                [class.text-amber-600]="!existingStudent()?.is_active"></i-lucide>
          </div>
          <div>
            @if (existingStudent()?.is_active) {
                <h4 class="text-sm font-semibold text-green-800">¡Bienvenido de nuevo, {{ existingStudent()?.name }}!</h4>
                <p class="text-sm text-green-700 mt-1">Ya tenemos tus datos. Confirmar esta cita actualizará tu historial.</p>
            } @else {
                <h4 class="text-sm font-semibold text-amber-800">Reactiva tu perfil</h4>
                <p class="text-sm text-amber-700 mt-1">Hola {{ existingStudent()?.name }}. Vemos que tu perfil estaba inactivo. Al reservar esta cita, tu cuenta será reactivada automáticamente.</p>
            }
          </div>
        </div>
      }

      <div class="bg-blue-50 p-4 rounded-lg mb-6 flex items-start gap-3">
        <i-lucide [img]="Calendar" class="w-5 h-5 text-blue-600 mt-0.5"></i-lucide>
        <div>
          <h3 class="font-medium text-blue-900">Resumen de la Cita</h3>
          <p class="text-sm text-blue-700 mt-1">
            {{ date | date:'fullDate' }} a las {{ startTime }} - {{ endTime }}
          </p>
        </div>
      </div>

      <form [formGroup]="bookingForm" (ngSubmit)="onSubmit()" class="space-y-4">
        
        <!-- Para quién es la cita -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">¿Para quién es la clase?</label>
          <div class="grid grid-cols-2 gap-3">
            <label class="cursor-pointer relative">
              <input type="radio" formControlName="bookingFor" value="me" class="peer sr-only">
              <div class="p-3 border rounded-lg text-center hover:bg-gray-50 peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700 transition-all">
                <span class="block text-sm font-medium">Para mí</span>
                <span class="block text-xs text-gray-500 mt-1">Soy el estudiante</span>
              </div>
            </label>
            <label class="cursor-pointer relative">
              <input type="radio" formControlName="bookingFor" value="other" class="peer sr-only">
              <div class="p-3 border rounded-lg text-center hover:bg-gray-50 peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700 transition-all">
                <span class="block text-sm font-medium">Para mi hijo/a</span>
                <span class="block text-xs text-gray-500 mt-1">Soy padre/tutor</span>
              </div>
            </label>
          </div>
        </div>

        @if (!showParentFields()) {
          <!-- SECCION: DATOS PERSONALES (Cuando es 'me') -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
             <!-- Nombre -->
             <div>
               <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
               <input 
                 type="text" 
                 formControlName="studentName"
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                 placeholder="Tu nombre">
               <div *ngIf="bookingForm.get('studentName')?.touched && bookingForm.get('studentName')?.invalid" class="text-red-500 text-xs mt-1">
                 Tu nombre es requerido.
               </div>
             </div>

             <!-- Apellido -->
             <div>
               <label class="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
               <input 
                 type="text" 
                 formControlName="studentLastName"
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                 placeholder="Tu apellido">
               <div *ngIf="bookingForm.get('studentLastName')?.touched && bookingForm.get('studentLastName')?.invalid" class="text-red-500 text-xs mt-1">
                 Tu apellido es requerido.
               </div>
             </div>

             <!-- Email -->
             <div class="md:col-span-2">
               <label class="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico *</label>
               <input 
                 type="email" 
                 formControlName="studentEmail"
                 (blur)="checkEmail('student')"
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                 placeholder="ejemplo@correo.com">
               <div *ngIf="bookingForm.get('studentEmail')?.touched && bookingForm.get('studentEmail')?.invalid" class="text-red-500 text-xs mt-1">
                 Ingresa un correo válido para recibir la confirmación.
               </div>
             </div>

             <!-- Teléfono -->
             <div class="md:col-span-2">
               <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono / WhatsApp *</label>
               <app-phone-input formControlName="studentPhone"></app-phone-input>
               <div *ngIf="bookingForm.get('studentPhone')?.touched && bookingForm.get('studentPhone')?.invalid" class="text-red-500 text-xs mt-1">
                 Un número de contacto es requerido.
               </div>
             </div>

             <!-- Fecha de Nacimiento -->
             <div class="md:col-span-2">
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
                  (blur)="checkEmail('parent')"
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

        <!-- Servicio -->
        <div *ngIf="services.length > 0">
          <label class="block text-sm font-medium text-gray-700 mb-1">Servicio de Interés</label>
          @if (preSelectedServiceId) {
            <!-- Servicio pre-seleccionado: solo lectura -->
            <div class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
              {{ getSelectedServiceName() }}
            </div>
          } @else {
            <select 
              formControlName="serviceId"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white">
              <option [ngValue]="null">Asesoría General</option>
              <option *ngFor="let service of services" [value]="service.id">
                {{ service.name }} ({{ formatPrice(service.price) }})
              </option>
            </select>
          }
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
            <i-lucide *ngIf="isSubmitting" [img]="Loader2" class="w-4 h-4 animate-spin"></i-lucide>
            {{ isSubmitting ? 'Confirmando...' : 'Confirmar Reserva' }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class BookingFormComponent implements OnInit {
  readonly Calendar = Calendar;
  readonly Loader2 = Loader2;
  readonly Info = Info;
  readonly AlertCircle = AlertCircle;
  @Input() tutorId!: string;
  @Input() date: string = '';
  @Input() startTime: string = '';
  @Input() endTime: string = '';
  @Input() services: any[] = [];
  @Input() preSelectedServiceId: string | undefined;
  @Input() prefilledEmail?: string;
  @Input() existingStudentData?: any;
  @Input() isSubmitting: boolean = false;

  @Output() submitForm = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  bookingForm: FormGroup;
  showParentFields = signal(false);

  // Existing student check for reactivation
  existingStudent = signal<{ exists: boolean; is_active: boolean; name: string } | null>(null);

  // Max date for date of birth (today)
  today = new Date().toISOString().split('T')[0];

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService
  ) {
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
      this.applyPrefilledEmail(value);
    });
  }

  ngOnInit() {
    if (this.preSelectedServiceId) {
      this.bookingForm.patchValue({ serviceId: this.preSelectedServiceId });
    }

    if (this.existingStudentData) {
      const student = this.existingStudentData;

      // Determine bookingFor based on existence of guardian info
      const isOther = !!(student.guardian_name || student.guardian_phone);
      this.bookingForm.patchValue({ bookingFor: isOther ? 'other' : 'me' });
      this.bookingForm.get('bookingFor')?.disable();

      if (isOther) {
        this.bookingForm.patchValue({
          studentName: student.first_name || '',
          studentLastName: student.last_name || '',
          studentDob: student.date_of_birth || '',
          parentName: student.guardian_name || '',
          parentEmail: student.email || '',
          parentPhone: student.guardian_phone || student.phone || ''
        });

        this.bookingForm.get('studentName')?.disable();
        this.bookingForm.get('studentLastName')?.disable();
        this.bookingForm.get('studentDob')?.disable();
        this.bookingForm.get('parentName')?.disable();
        this.bookingForm.get('parentEmail')?.disable();
        this.bookingForm.get('parentPhone')?.disable();
      } else {
        this.bookingForm.patchValue({
          studentName: student.first_name || '',
          studentLastName: student.last_name || '',
          studentEmail: student.email || '',
          studentPhone: student.phone || '',
          studentDob: student.date_of_birth || ''
        });

        this.bookingForm.get('studentName')?.disable();
        this.bookingForm.get('studentLastName')?.disable();
        this.bookingForm.get('studentEmail')?.disable();
        this.bookingForm.get('studentPhone')?.disable();
        this.bookingForm.get('studentDob')?.disable();
      }
    }

    // Initial validator setup
    this.updateValidators(this.bookingForm.getRawValue().bookingFor);
    this.applyPrefilledEmail(this.bookingForm.getRawValue().bookingFor);
  }

  applyPrefilledEmail(bookingFor: string) {
    if (!this.prefilledEmail) return;

    if (bookingFor === 'me') {
      if (!this.bookingForm.get('studentEmail')?.value) {
        this.bookingForm.patchValue({ studentEmail: this.prefilledEmail });
        this.checkEmail('student');
      }
    } else {
      if (!this.bookingForm.get('parentEmail')?.value) {
        this.bookingForm.patchValue({ parentEmail: this.prefilledEmail });
        this.checkEmail('parent');
      }
    }
  }

  updateValidators(bookingFor: string) {
    const isOther = bookingFor === 'other';
    this.showParentFields.set(isOther);

    const parentNameControl = this.bookingForm.get('parentName');
    const parentEmailControl = this.bookingForm.get('parentEmail');
    const parentPhoneControl = this.bookingForm.get('parentPhone');

    const studentEmailControl = this.bookingForm.get('studentEmail');
    const studentPhoneControl = this.bookingForm.get('studentPhone');

    if (isOther) {
      // Parent is booking for child: parent contact info required, student contact info optional
      parentNameControl?.setValidators([Validators.required, Validators.minLength(2)]);
      parentEmailControl?.setValidators([Validators.required, Validators.email]);
      parentPhoneControl?.setValidators([Validators.required, Validators.minLength(10)]);

      studentEmailControl?.clearValidators();
      studentPhoneControl?.clearValidators();
    } else {
      // Student is booking for themselves: parent info optional, student contact info required
      parentNameControl?.clearValidators();
      parentEmailControl?.clearValidators();
      parentPhoneControl?.clearValidators();

      studentEmailControl?.setValidators([Validators.required, Validators.email]);
      studentPhoneControl?.setValidators([Validators.required, Validators.minLength(10)]);
    }

    parentNameControl?.updateValueAndValidity();
    parentEmailControl?.updateValueAndValidity();
    parentPhoneControl?.updateValueAndValidity();

    studentEmailControl?.updateValueAndValidity();
    studentPhoneControl?.updateValueAndValidity();
  }

  async checkEmail(type: 'student' | 'parent') {
    if (!this.tutorId) return;

    // Check if we should check based on mode
    const isOther = this.showParentFields();
    if (type === 'student' && isOther) return;
    if (type === 'parent' && !isOther) return;

    const email = type === 'student'
      ? this.bookingForm.get('studentEmail')?.value
      : this.bookingForm.get('parentEmail')?.value;

    if (!email || !email.includes('@') || email.length < 5) {
      this.existingStudent.set(null);
      return;
    }

    try {
      const { data } = await this.supabaseService.checkStudentStatus(this.tutorId, email);
      if (data && data.exists) {
        this.existingStudent.set({
          exists: true,
          is_active: data.is_active,
          name: `${data.first_name} ${data.last_name}`
        });
      } else {
        this.existingStudent.set(null);
      }
    } catch (e) {
      console.error(e);
    }
  }

  getSelectedServiceName(): string {
    const service = this.services.find(s => s.id === this.preSelectedServiceId);
    return service ? `${service.name} (${this.formatPrice(service.price)})` : 'Servicio seleccionado';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  }

  onSubmit() {
    if (this.bookingForm.valid) {
      // Use getRawValue to include disabled fields
      this.submitForm.emit(this.bookingForm.getRawValue());
    } else {
      this.bookingForm.markAllAsTouched();
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}
