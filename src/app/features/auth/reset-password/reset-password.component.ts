import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Restablecer Contraseña
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Ingresa tu nueva contraseña
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          @if (passwordReset()) {
            <div class="bg-green-50 border border-green-200 rounded-md p-4">
              <div class="flex">
                <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-green-800">¡Contraseña actualizada!</h3>
                  <p class="mt-2 text-sm text-green-700">
                    Tu contraseña ha sido restablecida correctamente.
                  </p>
                </div>
              </div>
            </div>
            <div class="mt-6">
              <a routerLink="/auth/login" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                Ir a iniciar sesión
              </a>
            </div>
          } @else {
            <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="space-y-6">
              <div>
                <label for="password" class="block text-sm font-medium text-gray-700">
                  Nueva Contraseña
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
                @if (resetForm.get('password')?.invalid && resetForm.get('password')?.touched) {
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
                @if (resetForm.hasError('passwordMismatch') && resetForm.get('confirmPassword')?.touched) {
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
                  [disabled]="resetForm.invalid || loading()"
                  class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  @if (loading()) {
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Actualizando...
                  } @else {
                    Restablecer Contraseña
                  }
                </button>
              </div>
            </form>
          }
        </div>
      </div>
    </div>
  `
})
export class ResetPasswordComponent {
    resetForm: FormGroup;
    loading = signal(false);
    errorMessage = signal('');
    passwordReset = signal(false);

    constructor(
        private fb: FormBuilder,
        private supabaseService: SupabaseService,
        private router: Router
    ) {
        this.resetForm = this.fb.group({
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
        if (this.resetForm.valid) {
            this.loading.set(true);
            this.errorMessage.set('');

            const { password } = this.resetForm.value;

            try {
                const { error } = await this.supabaseService.updatePassword(password);

                if (error) {
                    this.errorMessage.set(error.message);
                } else {
                    this.passwordReset.set(true);
                }
            } catch (error: any) {
                this.errorMessage.set('Error inesperado. Inténtalo de nuevo.');
            } finally {
                this.loading.set(false);
            }
        }
    }
}
