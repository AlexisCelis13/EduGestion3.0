import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-student-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="flex items-center justify-center mb-4"><img src="assets/isotipo.png" class="h-16"></div>
        <h2 class="text-center text-3xl font-extrabold text-gray-900">
          Portal de Alumno
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Ingresa tu correo para recibir un enlace de acceso
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          @if (successMessage()) {
            <div class="rounded-md bg-green-50 p-4 mb-6">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-green-800">
                    ¡Enlace enviado!
                  </h3>
                  <div class="mt-2 text-sm text-green-700">
                    <p>{{ successMessage() }}</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="text-center">
              <button (click)="successMessage.set('')" class="text-indigo-600 hover:text-indigo-500 font-medium">
                Intentar con otro correo
              </button>
            </div>
          } @else {
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700">
                  Correo Electrónico
                </label>
                <div class="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autocomplete="email"
                    required
                    formControlName="email"
                    class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="ejemplo@correo.com"
                  />
                </div>
                @if (loginForm.get('email')?.invalid && loginForm.get('email')?.touched) {
                  <p class="mt-2 text-sm text-red-600">Por favor ingresa un correo válido</p>
                }
              </div>

              @if (errorMessage()) {
                <div class="rounded-md bg-red-50 p-4">
                  <div class="flex">
                    <div class="flex-shrink-0">
                      <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                      </svg>
                    </div>
                    <div class="ml-3">
                      <h3 class="text-sm font-medium text-red-800">
                        Error
                      </h3>
                      <div class="mt-2 text-sm text-red-700">
                        <p>{{ errorMessage() }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              }

              <div>
                <button
                  type="submit"
                  [disabled]="loginForm.invalid || loading()"
                  class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  @if (loading()) {
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando enlace...
                  } @else {
                    Enviar Enlace de Acceso
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
export class StudentLoginComponent {
    loginForm: FormGroup;
    loading = signal(false);
    errorMessage = signal('');
    successMessage = signal('');

    constructor(
        private fb: FormBuilder,
        private supabaseService: SupabaseService
    ) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]]
        });
    }

    async onSubmit() {
        if (this.loginForm.valid) {
            this.loading.set(true);
            this.errorMessage.set('');
            this.successMessage.set('');

            const { email } = this.loginForm.value;

            try {
                const { data, error } = await this.supabaseService.sendMagicLink(email);

                if (error) {
                    throw error;
                }

                this.successMessage.set(`Hemos enviado un enlace de acceso a ${email}. Revisa tu bandeja de entrada (y la carpeta de spam por si acaso). El enlace expira en 15 minutos.`);
                this.loginForm.reset();
            } catch (error: any) {
                console.error('Error sending magic link:', error);
                this.errorMessage.set('Hubo un error al enviar el enlace. Por favor intenta de nuevo.');
            } finally {
                this.loading.set(false);
            }
        }
    }
}
