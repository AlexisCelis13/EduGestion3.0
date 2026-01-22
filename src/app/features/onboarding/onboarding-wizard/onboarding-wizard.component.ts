import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

@Component({
  selector: 'app-onboarding-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <!-- Modal de Bienvenida -->
      @if (currentStep() === 0) {
        <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div class="text-center">
              <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                <svg class="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </div>
              <h3 class="text-2xl font-bold text-gray-900 mb-4">¡Bienvenido a EduGestión!</h3>
              <div class="space-y-4 text-left mb-8">
                <div class="flex items-center space-x-3">
                  <div class="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                  </div>
                  <span class="text-gray-700">Gestiona tus clases y alumnos de forma eficiente</span>
                </div>
                <div class="flex items-center space-x-3">
                  <div class="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                  </div>
                  <span class="text-gray-700">Recibe pagos automáticamente con Stripe</span>
                </div>
                <div class="flex items-center space-x-3">
                  <div class="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                  </div>
                  <span class="text-gray-700">Crea tu landing page profesional</span>
                </div>
              </div>
              <button
                (click)="nextStep()"
                class="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Comenzar Configuración
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal de Configuración de Perfil -->
      @if (currentStep() === 1) {
        <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div class="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div class="text-center mb-6">
              <h3 class="text-2xl font-bold text-gray-900 mb-2">Configuremos tu perfil</h3>
              <p class="text-gray-600">Necesitamos algunos datos para personalizar tu experiencia</p>
            </div>

            <form [formGroup]="profileForm" (ngSubmit)="completeOnboarding()" class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="firstName" class="block text-sm font-medium text-gray-700">
                    Nombre *
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    formControlName="firstName"
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label for="lastName" class="block text-sm font-medium text-gray-700">
                    Apellidos *
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    formControlName="lastName"
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tus apellidos"
                  />
                </div>
              </div>

              <div>
                <label for="companyName" class="block text-sm font-medium text-gray-700">
                  Nombre de la Academia/Empresa (Opcional)
                </label>
                <input
                  id="companyName"
                  type="text"
                  formControlName="companyName"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Academia Matemáticas Plus"
                />
              </div>

              <div>
                <label for="role" class="block text-sm font-medium text-gray-700">
                  ¿Cuál es tu rol? *
                </label>
                <select
                  id="role"
                  formControlName="role"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecciona una opción</option>
                  <option value="tutor_independiente">Tutor Independiente</option>
                  <option value="director">Director de Academia</option>
                </select>
              </div>

              <div>
                <label for="monthlyIncome" class="block text-sm font-medium text-gray-700">
                  Ingresos mensuales estimados ($MXN)
                </label>
                <select
                  id="monthlyIncome"
                  formControlName="monthlyIncome"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecciona un rango</option>
                  <option value="10000">Menos de $10,000</option>
                  <option value="25000">$10,000 - $25,000</option>
                  <option value="50000">$25,000 - $50,000</option>
                  <option value="100000">$50,000 - $100,000</option>
                  <option value="200000">Más de $100,000</option>
                </select>
              </div>

              @if (errorMessage()) {
                <div class="bg-red-50 border border-red-200 rounded-md p-4">
                  <p class="text-sm text-red-600">{{ errorMessage() }}</p>
                </div>
              }

              <div class="flex space-x-4">
                <button
                  type="button"
                  (click)="previousStep()"
                  class="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                  Atrás
                </button>
                <button
                  type="submit"
                  [disabled]="profileForm.invalid || loading()"
                  class="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
                  @if (loading()) {
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  } @else {
                    Completar Configuración
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class OnboardingWizardComponent implements OnInit {
  currentStep = signal(0);
  loading = signal(false);
  errorMessage = signal('');
  profileForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      companyName: [''],
      role: ['', Validators.required],
      monthlyIncome: ['']
    });
  }

  ngOnInit() {
    // Comenzar con el modal de bienvenida
    this.currentStep.set(0);
  }

  nextStep() {
    this.currentStep.set(this.currentStep() + 1);
  }

  previousStep() {
    this.currentStep.set(this.currentStep() - 1);
  }

  async completeOnboarding() {
    if (this.profileForm.valid) {
      this.loading.set(true);
      this.errorMessage.set('');

      try {
        const user = await this.supabaseService.getCurrentUser();
        if (!user) {
          this.errorMessage.set('Error de autenticación');
          return;
        }

        const formData = this.profileForm.value;
        
        // Actualizar perfil
        const { error: profileError } = await this.supabaseService.updateProfile(user.id, {
          first_name: formData.firstName,
          last_name: formData.lastName,
          company_name: formData.companyName || null,
          role: formData.role,
          estimated_monthly_income: formData.monthlyIncome ? parseFloat(formData.monthlyIncome) : null,
          onboarding_completed: true
        });

        if (profileError) {
          this.errorMessage.set('Error al guardar el perfil');
          return;
        }

        // Crear configuración inicial de tenant
        const slug = this.generateSlug(formData.firstName, formData.lastName, formData.companyName);
        await this.supabaseService.createTenantSettings({
          user_id: user.id,
          slug,
          primary_color: '#3B82F6',
          secondary_color: '#1E40AF',
          company_description: '',
          is_active: true
        });

        // Redirigir al dashboard
        this.router.navigate(['/dashboard']);

      } catch (error: any) {
        this.errorMessage.set('Error inesperado. Inténtalo de nuevo.');
      } finally {
        this.loading.set(false);
      }
    }
  }

  private generateSlug(firstName: string, lastName: string, companyName?: string): string {
    const base = companyName || `${firstName}-${lastName}`;
    return base
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      + '-' + Math.random().toString(36).substring(2, 8);
  }
}