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
      
      <!-- Duplicate Email Error Notice -->
      @if (existingStudent()) {
        <div class="mb-6 p-4 rounded-lg flex gap-3 animate-fade-in border bg-red-50 border-red-200">
          <div class="mt-0.5">
             <i-lucide [img]="AlertCircle" class="w-5 h-5 text-red-600"></i-lucide>
          </div>
          <div>
            <h4 class="text-sm font-semibold text-red-800">Correo ya registrado</h4>
            <p class="text-sm text-red-700 mt-1">Ya existe un alumno registrado con este correo electrónico ({{ existingStudent()?.name }}). Por favor, utiliza un correo diferente.</p>
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
                 [class.border-red-500]="bookingForm.get('studentEmail')?.hasError('emailExists')"
                 placeholder="ejemplo@correo.com">
               <div *ngIf="bookingForm.get('studentEmail')?.touched && bookingForm.get('studentEmail')?.hasError('required')" class="text-red-500 text-xs mt-1">
                 Ingresa un correo válido para recibir la confirmación.
               </div>
               <div *ngIf="bookingForm.get('studentEmail')?.hasError('email')" class="text-red-500 text-xs mt-1">
                 Ingresa un correo válido para recibir la confirmación.
               </div>
               <div *ngIf="bookingForm.get('studentEmail')?.hasError('emailExists')" class="text-red-500 text-xs mt-1">
                 Este correo ya está registrado. Usa otro correo.
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
                  [class.border-red-500]="bookingForm.get('parentEmail')?.hasError('emailExists')"
                  placeholder="Para enviarte la confirmación">
                <div *ngIf="bookingForm.get('parentEmail')?.touched && bookingForm.get('parentEmail')?.hasError('required')" class="text-red-500 text-xs mt-1">
                  Correo obligatorio.
                </div>
                <div *ngIf="bookingForm.get('parentEmail')?.hasError('email')" class="text-red-500 text-xs mt-1">
                  Correo obligatorio.
                </div>
                <div *ngIf="bookingForm.get('parentEmail')?.hasError('emailExists')" class="text-red-500 text-xs mt-1">
                  Este correo ya está registrado. Usa otro correo.
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

          <!-- Si el servicio seleccionado tiene modalidad Híbrida, permitir elegir -->
          @if (getCurrentService()?.modality === 'hibrido') {
             <div class="mt-4 animate-fade-in p-4 bg-purple-50 rounded-lg border border-purple-100">
               <label class="block text-sm font-semibold text-purple-900 mb-2">Este servicio es Híbrido, ¿Cómo prefieres tomar la clase? *</label>
               <select formControlName="selectedModality" class="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors bg-white">
                 <option value="virtual">Virtual (Videollamada)</option>
                 <option value="presencial_tutor">Ir al lugar del Profesor</option>
                 <option value="presencial_alumno">Que el profesor venga a mí (A Domicilio)</option>
               </select>
             </div>
          }

          <!-- Si la modalidad seleccionada (o forzada) es presencial a domicilio, pedir dirección -->
          @if (getCurrentModality() === 'presencial_alumno') {
             <div class="mt-4 animate-fade-in p-4 bg-orange-50 rounded-lg border border-orange-100">
               <label class="block text-sm font-semibold text-orange-900 mb-2">Dirección para la clase presencial *</label>
               <input type="text" formControlName="studentLocation" class="w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors" placeholder="Ej: Calle Principal 123, Colonia Centro..."/>
               <div *ngIf="bookingForm.get('studentLocation')?.touched && bookingForm.get('studentLocation')?.invalid" class="text-red-500 text-xs mt-1">
                 Necesitas proporcionar tu dirección.
               </div>
             </div>
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
            [disabled]="bookingForm.invalid || isSubmitting || isCheckingEmail"
            class="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <i-lucide *ngIf="isSubmitting || isCheckingEmail" [img]="Loader2" class="w-4 h-4 animate-spin"></i-lucide>
            {{ isSubmitting ? 'Confirmando...' : isCheckingEmail ? 'Verificando...' : 'Confirmar Reserva' }}
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
  isCheckingEmail = false;
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
      selectedModality: ['virtual'],
      studentLocation: [''],
      notes: ['']
    });

    // Escuchar cambios en el selector de para quién es la cita
    this.bookingForm.get('bookingFor')?.valueChanges.subscribe(value => {
      this.updateValidators(value);
      this.applyPrefilledEmail(value);
    });

    // Escuchar cambios de servicio
    this.bookingForm.get('serviceId')?.valueChanges.subscribe(serviceId => {
      this.updateModalityValidators();
    });

    // Escuchar cambios en selectedModality
    this.bookingForm.get('selectedModality')?.valueChanges.subscribe(() => {
      this.updateModalityValidators();
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

  updateModalityValidators() {
    const modality = this.getCurrentModality();
    const locationControl = this.bookingForm.get('studentLocation');

    if (modality === 'presencial_alumno') {
      locationControl?.setValidators([Validators.required, Validators.minLength(5)]);
    } else {
      locationControl?.clearValidators();
    }
    locationControl?.updateValueAndValidity();
  }

  getCurrentService() {
    const serviceId = this.bookingForm.get('serviceId')?.value;
    return this.services.find(s => s.id === serviceId);
  }

  getCurrentModality() {
    const currentService = this.getCurrentService();
    if (!currentService) return 'virtual';

    if (currentService.modality === 'hibrido') {
      return this.bookingForm.get('selectedModality')?.value;
    }
    return currentService.modality || 'virtual';
  }

  async checkEmail(type: 'student' | 'parent') {
    if (!this.tutorId) return;

    // Check if we should check based on mode
    const isOther = this.showParentFields();
    if (type === 'student' && isOther) return;
    if (type === 'parent' && !isOther) return;

    const emailControl = type === 'student'
      ? this.bookingForm.get('studentEmail')
      : this.bookingForm.get('parentEmail');

    const email = emailControl?.value;

    if (!email || !email.includes('@') || email.length < 5) {
      this.existingStudent.set(null);
      // Limpiar error de emailExists si había uno
      if (emailControl?.hasError('emailExists')) {
        const errors = { ...emailControl.errors };
        delete errors['emailExists'];
        emailControl.setErrors(Object.keys(errors).length ? errors : null);
      }
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
        // Marcar el campo de email con error para bloquear el formulario
        emailControl?.setErrors({ ...emailControl?.errors, emailExists: true });
      } else {
        this.existingStudent.set(null);
        // Limpiar error de emailExists
        if (emailControl?.hasError('emailExists')) {
          const errors = { ...emailControl.errors };
          delete errors['emailExists'];
          emailControl.setErrors(Object.keys(errors).length ? errors : null);
        }
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

  async onSubmit() {
    // Marcar campos tocados para mostrar errores de validación básica
    this.bookingForm.markAllAsTouched();

    // Verificar validación estándar primero (campos requeridos, formato, etc.)
    if (this.bookingForm.invalid) return;

    // Verificar email duplicado contra la BD ANTES de proceder al pago
    if (!this.tutorId) return;
    const isOther = this.showParentFields();
    const emailControl = isOther
      ? this.bookingForm.get('parentEmail')
      : this.bookingForm.get('studentEmail');
    const email = emailControl?.value;

    if (email && email.includes('@') && email.length >= 5) {
      this.isCheckingEmail = true;
      let emailCheckFailed = false;
      try {
        const { data, error } = await this.supabaseService.checkStudentStatus(this.tutorId, email);
        if (error) {
          // RPC no disponible u otro error — bloquear por seguridad
          console.error('Error verificando email:', error);
          emailCheckFailed = true;
        } else if (data && data.exists) {
          // Email ya existe: mostrar error en el campo y NO continuar al pago
          this.existingStudent.set({
            exists: true,
            is_active: data.is_active,
            name: `${data.first_name} ${data.last_name}`
          });
          emailControl?.setErrors({ ...(emailControl?.errors || {}), emailExists: true });
          return; // DETENER aquí - no pasar a la pantalla de pago
        } else {
          // Email libre: limpiar error si existía
          this.existingStudent.set(null);
          if (emailControl?.hasError('emailExists')) {
            const errors = { ...emailControl.errors };
            delete errors['emailExists'];
            emailControl.setErrors(Object.keys(errors).length ? errors : null);
          }
        }
      } catch (e) {
        console.error('Error verificando email:', e);
        emailCheckFailed = true;
      } finally {
        this.isCheckingEmail = false;
      }

      if (emailCheckFailed) {
        // Si la verificación falló, NO proceder al pago
        alert('No se pudo verificar el correo. Por favor asegúrate de tener conexión e intenta de nuevo.');
        return;
      }
    }

    // Email OK y formulario válido: proceder al pago
    this.submitForm.emit(this.bookingForm.getRawValue());
  }

  onCancel() {
    this.cancel.emit();
  }
}
