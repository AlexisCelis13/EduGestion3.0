import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-surface-50 via-primary-50/30 to-surface-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="flex items-center justify-center mb-4"><img src="assets/isotipo.png" class="h-20"></div>
        <h2 class="text-center text-title text-surface-700">
          Iniciar Sesión
        </h2>
        <p class="mt-3 text-center text-surface-400">
          ¿No tienes cuenta?
          <a routerLink="/auth/register" class="font-medium text-primary-600 hover:text-primary-500 ml-1">
            Regístrate gratis aquí
          </a>
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="glass-card p-8 sm:p-10">
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
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
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-surface-700 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                formControlName="password"
                required
                class="input-premium"
                placeholder="••••••••"
              />
            </div>

            @if (errorMessage()) {
              <div class="bg-red-50 border border-red-100 rounded-xl p-4">
                <p class="text-sm text-red-600">{{ errorMessage() }}</p>
              </div>
            }

            <div>
              <button
                type="submit"
                [disabled]="loginForm.invalid || loading()"
                class="btn-premium w-full flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                @if (loading()) {
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                } @else {
                  Iniciar Sesión
                }
              </button>
            </div>
          </form>

          <div class="mt-6 text-center">
            <a routerLink="/auth/forgot-password" class="text-sm font-medium text-primary-600 hover:text-primary-500">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      this.loading.set(true);
      this.errorMessage.set('');

      const { email, password } = this.loginForm.value;

      try {
        const { data, error } = await this.supabaseService.signIn(email, password);

        if (error) {
          this.errorMessage.set('Email o contraseña incorrectos');
        } else if (data.user) {
          // Verificar si completó onboarding
          const profile = await this.supabaseService.getProfile(data.user.id);
          if (profile?.onboarding_completed) {
            this.router.navigate(['/dashboard']);
          } else {
            this.router.navigate(['/dashboard/onboarding']);
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