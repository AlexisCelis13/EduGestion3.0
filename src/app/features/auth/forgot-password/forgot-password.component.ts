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
    <div class="min-h-screen bg-gradient-to-br from-surface-50 via-primary-50/30 to-surface-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 class="text-2xl font-semibold text-surface-700 text-center mb-2">EduGestión</h1>
        <h2 class="text-center text-title text-surface-700">
          Recuperar Contraseña
        </h2>
        <p class="mt-3 text-center text-surface-400">
          Te enviaremos un enlace para restablecer tu contraseña
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="glass-card p-8 sm:p-10">
          @if (emailSent()) {
            <div class="bg-accent-green/10 border border-accent-green/20 rounded-2xl p-5">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-full bg-accent-green/20 flex items-center justify-center shrink-0">
                  <svg class="h-5 w-5 text-accent-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div>
                  <h3 class="text-base font-semibold text-surface-700">¡Correo enviado!</h3>
                  <p class="mt-1 text-sm text-surface-500">
                    Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
                  </p>
                </div>
              </div>
            </div>
            <div class="mt-6">
              <a routerLink="/auth/login" class="btn-secondary w-full flex justify-center">
                Volver al inicio de sesión
              </a>
            </div>
          } @else {
            <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()" class="space-y-6">
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
                @if (forgotForm.get('email')?.invalid && forgotForm.get('email')?.touched) {
                  <p class="mt-2 text-sm text-red-500">Ingresa un email válido</p>
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
                  [disabled]="forgotForm.invalid || loading()"
                  class="btn-premium w-full flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                <a routerLink="/auth/login" class="text-sm font-medium text-primary-600 hover:text-primary-500">
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
