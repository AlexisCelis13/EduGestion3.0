import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { SubscriptionService } from '../../../core/services/subscription.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-surface-50 via-primary-50/30 to-surface-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 class="text-2xl font-semibold text-surface-700 text-center mb-2">EduGestión</h1>
        <h2 class="text-center text-title text-surface-700">
          Crear Cuenta
        </h2>
        <p class="mt-3 text-center text-surface-400">
          ¿Ya tienes cuenta?
          <a routerLink="/auth/login" class="font-medium text-primary-600 hover:text-primary-500 ml-1">
            Inicia sesión aquí
          </a>
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="glass-card p-8 sm:p-10">
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-5">
            <div>
              <label for="email" class="block text-sm font-medium text-surface-700 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                formControlName="email"
                required
                class="input-premium"
                placeholder="tu@email.com"
              />
              @if (registerForm.get('email')?.invalid && registerForm.get('email')?.touched) {
                <p class="mt-2 text-sm text-red-500">Email es requerido y debe ser válido</p>
              }
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-surface-700 mb-2">
                Contraseña
              </label>
              <div class="relative">
                <input
                  id="password"
                  name="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  required
                  class="input-premium pr-10"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  (click)="showPassword.set(!showPassword())"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-surface-400 hover:text-surface-600 focus:outline-none"
                >
                  @if (showPassword()) {
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                </button>
              </div>
              @if (registerForm.get('password')?.invalid && registerForm.get('password')?.touched) {
                <p class="mt-2 text-sm text-red-500">La contraseña debe tener al menos 6 caracteres</p>
              }
            </div>

            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-surface-700 mb-2">
                Confirmar Contraseña
              </label>
              <div class="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  [type]="showConfirmPassword() ? 'text' : 'password'"
                  formControlName="confirmPassword"
                  required
                  class="input-premium pr-10"
                  placeholder="Repite la contraseña"
                />
                <button
                  type="button"
                  (click)="showConfirmPassword.set(!showConfirmPassword())"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-surface-400 hover:text-surface-600 focus:outline-none"
                >
                  @if (showConfirmPassword()) {
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                </button>
              </div>
              @if (registerForm.hasError('passwordMismatch') && registerForm.get('confirmPassword')?.touched) {
                <p class="mt-2 text-sm text-red-500">Las contraseñas no coinciden</p>
              }
            </div>

            @if (errorMessage()) {
              <div class="bg-red-50 border border-red-100 rounded-xl p-4">
                <p class="text-sm text-red-600">{{ errorMessage() }}</p>
              </div>
            }

            <div>
              <button
                type="submit"
                [disabled]="registerForm.invalid || loading()"
                class="btn-premium w-full flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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

          <div class="mt-6 pt-6 border-t border-surface-100">
            <p class="text-center text-sm text-surface-400">
              Prueba gratis por 14 días
            </p>
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
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private subscriptionService: SubscriptionService,
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
          // Si no hay sesión, es porque se requiere confirmación de email
          if (!data.session) {
            alert('¡Cuenta creada con éxito! Por favor revisa tu correo para confirmar tu cuenta antes de iniciar sesión.');
            this.router.navigate(['/auth/login']);
            return;
          }

          // Verificar si hay un plan seleccionado
          const params = this.route.snapshot.queryParams;

          if (params['plan']) {
            // Si viene con plan seleccionado, ir a checkout
            this.router.navigate(['/auth/checkout'], { queryParams: params });
          } else {
            // Si no hay plan, crear suscripción freelance con trial automáticamente
            try {
              // Intentar crear suscripción (si falla por duplicado es porque el trigger ya lo hizo)
              await this.subscriptionService.createSubscription(data.user.id, 'freelance', true);

              // Actualizar profile para compatibilidad
              await this.supabaseService.updateProfile(data.user.id, {
                subscription_plan: 'freelance',
                subscription_status: 'trial'
              });
            } catch (subError) {
              console.log('La suscripción ya existe o fue creada por trigger:', subError);
            }
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