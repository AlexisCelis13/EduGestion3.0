import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Crea tu cuenta en EduGestión
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?
          <a routerLink="/auth/login" class="font-medium text-blue-600 hover:text-blue-500">
            Inicia sesión aquí
          </a>
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div class="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  formControlName="email"
                  required
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="tu@email.com"
                />
              </div>
              @if (registerForm.get('email')?.invalid && registerForm.get('email')?.touched) {
                <p class="mt-1 text-sm text-red-600">Email es requerido y debe ser válido</p>
              }
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div class="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  formControlName="password"
                  required
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              @if (registerForm.get('password')?.invalid && registerForm.get('password')?.touched) {
                <p class="mt-1 text-sm text-red-600">La contraseña debe tener al menos 6 caracteres</p>
              }
            </div>

            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
                Confirmar Contraseña
              </label>
              <div class="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  formControlName="confirmPassword"
                  required
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              @if (registerForm.hasError('passwordMismatch') && registerForm.get('confirmPassword')?.touched) {
                <p class="mt-1 text-sm text-red-600">Las contraseñas no coinciden</p>
              }
            </div>

            @if (errorMessage()) {
              <div class="bg-red-50 border border-red-200 rounded-md p-4">
                <p class="text-sm text-red-600">{{ errorMessage() }}</p>
              </div>
            }

            <div>
              <button
                type="submit"
                [disabled]="registerForm.invalid || loading()"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                @if (loading()) {
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creando cuenta...
                } @else {
                  Crear Cuenta
                }
              </button>
            </div>
          </form>

          <div class="mt-6">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-300"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-white text-gray-500">Prueba gratis por 14 días</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  async onSubmit() {
    if (this.registerForm.valid) {
      this.loading.set(true);
      this.errorMessage.set('');

      const { email, password } = this.registerForm.value;

      try {
        const { data, error } = await this.supabaseService.signUp(email, password);

        if (error) {
          this.errorMessage.set(error.message);
        } else if (data.user) {

          // Verificar si hay un plan seleccionado
          const params = this.route.snapshot.queryParams;
          if (params['plan']) {
            this.router.navigate(['/auth/checkout'], { queryParams: params });
          } else {
            this.router.navigate(['/dashboard']);
          }
        }
      } catch (error: any) {
        this.errorMessage.set('Error inesperado. Inténtalo de nuevo.');
      } finally {
        this.loading.set(false);
      }
    }
  }
}