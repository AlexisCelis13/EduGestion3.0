import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Recuperar Contraseña
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Te enviaremos un enlace para restablecer tu contraseña
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          @if (emailSent()) {
            <div class="bg-green-50 border border-green-200 rounded-md p-4">
              <div class="flex">
                <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-green-800">¡Correo enviado!</h3>
                  <p class="mt-2 text-sm text-green-700">
                    Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
                  </p>
                </div>
              </div>
            </div>
            <div class="mt-6">
              <a routerLink="/auth/login" class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                Volver al inicio de sesión
              </a>
            </div>
          } @else {
            <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()" class="space-y-6">
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
                @if (forgotForm.get('email')?.invalid && forgotForm.get('email')?.touched) {
                  <p class="mt-1 text-sm text-red-600">Ingresa un email válido</p>
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
                  [disabled]="forgotForm.invalid || loading()"
                  class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  @if (loading()) {
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                  } @else {
                    Enviar enlace de recuperación
                  }
                </button>
              </div>

              <div class="text-center">
                <a routerLink="/auth/login" class="text-sm font-medium text-blue-600 hover:text-blue-500">
                  Volver al inicio de sesión
                </a>
              </div>
            </form>
          }
        </div>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
    forgotForm: FormGroup;
    loading = signal(false);
    errorMessage = signal('');
    emailSent = signal(false);

    constructor(
        private fb: FormBuilder,
        private supabaseService: SupabaseService
    ) {
        this.forgotForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]]
        });
    }

    async onSubmit() {
        if (this.forgotForm.valid) {
            this.loading.set(true);
            this.errorMessage.set('');

            const { email } = this.forgotForm.value;

            try {
                const { error } = await this.supabaseService.resetPasswordForEmail(email);

                if (error) {
                    this.errorMessage.set(error.message);
                } else {
                    this.emailSent.set(true);
                }
            } catch (error: any) {
                this.errorMessage.set('Error inesperado. Inténtalo de nuevo.');
            } finally {
                this.loading.set(false);
            }
        }
    }
}
