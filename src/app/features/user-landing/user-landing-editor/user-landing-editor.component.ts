import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService, TenantSettings } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-user-landing-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen">
      <div class="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-2xl font-semibold text-surface-700">Editor de Landing Page</h1>
          <p class="text-surface-400 mt-1">
            Personaliza tu página web donde los alumnos pueden conocerte y agendar citas
          </p>
        </div>

        <div class="grid lg:grid-cols-2 gap-8">
          <!-- Editor Panel -->
          <div class="space-y-6">
            <div class="card-premium p-6">
              <h2 class="text-lg font-semibold text-surface-700 mb-6">Configuración</h2>
              
              <form [formGroup]="editorForm" (ngSubmit)="saveSettings()" class="space-y-5">
                <!-- URL de la Landing Page -->
                <div>
                  <label class="block text-sm font-medium text-surface-700 mb-2">
                    URL de tu Landing Page
                  </label>
                  <div class="flex">
                    <span class="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-surface-200 bg-surface-50 text-surface-400 text-sm">
                      edugestion.com/p/
                    </span>
                    <input
                      type="text"
                      formControlName="slug"
                      class="flex-1 min-w-0 block w-full px-4 py-3 rounded-none rounded-r-xl border border-surface-200 focus:ring-2 focus:ring-primary-100 focus:border-primary-400 text-sm transition-all"
                      placeholder="tu-nombre"
                    />
                  </div>
                  <p class="mt-2 text-xs text-surface-400">
                    Solo letras, números y guiones. Ej: maria-garcia-matematicas
                  </p>
                </div>

                <!-- Logo -->
                <div>
                  <label class="block text-sm font-medium text-surface-700 mb-2">
                    Logo (Opcional)
                  </label>
                  <div class="flex items-center gap-4">
                    @if (currentSettings()?.logo_url) {
                      <img [src]="currentSettings()?.logo_url" alt="Logo" class="w-16 h-16 object-cover rounded-xl">
                    } @else {
                      <div class="w-16 h-16 bg-surface-100 rounded-xl flex items-center justify-center">
                        <svg class="w-8 h-8 text-surface-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                      </div>
                    }
                    <button
                      type="button"
                      class="btn-secondary">
                      Subir Logo
                    </button>
                  </div>
                </div>

                <!-- Colores -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-surface-700 mb-2">
                      Color Primario
                    </label>
                    <div class="flex items-center gap-2">
                      <input
                        type="color"
                        formControlName="primaryColor"
                        class="w-12 h-12 border border-surface-200 rounded-xl cursor-pointer"
                      />
                      <input
                        type="text"
                        formControlName="primaryColor"
                        class="input-premium"
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-surface-700 mb-2">
                      Color Secundario
                    </label>
                    <div class="flex items-center gap-2">
                      <input
                        type="color"
                        formControlName="secondaryColor"
                        class="w-12 h-12 border border-surface-200 rounded-xl cursor-pointer"
                      />
                      <input
                        type="text"
                        formControlName="secondaryColor"
                        class="input-premium"
                        placeholder="#1E40AF"
                      />
                    </div>
                  </div>
                </div>

                <!-- Descripción -->
                <div>
                  <label class="block text-sm font-medium text-surface-700 mb-2">
                    Descripción de tu Academia/Servicio
                  </label>
                  <textarea
                    formControlName="description"
                    rows="4"
                    class="input-premium resize-none"
                    placeholder="Ej: Clases particulares de matemáticas para ESO y Bachillerato. Más de 10 años de experiencia ayudando a estudiantes a alcanzar sus objetivos académicos."
                  ></textarea>
                </div>

                <!-- Información de Contacto -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-surface-700 mb-2">
                      Email de Contacto
                    </label>
                    <input
                      type="email"
                      formControlName="contactEmail"
                      class="input-premium"
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-surface-700 mb-2">
                      Teléfono (Opcional)
                    </label>
                    <input
                      type="tel"
                      formControlName="contactPhone"
                      class="input-premium"
                      placeholder="+52 55 0000 0000"
                    />
                  </div>
                </div>

                @if (errorMessage()) {
                  <div class="bg-red-50 border border-red-100 rounded-xl p-4">
                    <p class="text-sm text-red-600">{{ errorMessage() }}</p>
                  </div>
                }

                @if (successMessage()) {
                  <div class="bg-accent-green/10 border border-accent-green/20 rounded-xl p-4">
                    <p class="text-sm text-accent-green">{{ successMessage() }}</p>
                  </div>
                }

                <div class="flex gap-3">
                  <button
                    type="submit"
                    [disabled]="editorForm.invalid || loading()"
                    class="flex-1 btn-premium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                    @if (loading()) {
                      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    } @else {
                      Guardar Cambios
                    }
                  </button>
                  @if (currentSettings()?.slug) {
                    <a
                      [href]="'/p/' + currentSettings()?.slug"
                      target="_blank"
                      class="btn-secondary">
                      Ver Landing Page
                    </a>
                  }
                </div>
              </form>
            </div>
          </div>

          <!-- Preview Panel -->
          <div class="space-y-6">
            <div class="card-premium p-6">
              <h2 class="text-lg font-semibold text-surface-700 mb-6">Vista Previa</h2>
              
              <!-- Preview Content -->
              <div class="border border-surface-100 rounded-2xl overflow-hidden">
                <div class="text-white p-8 text-center"
                     [style.background]="'linear-gradient(135deg, ' + editorForm.get('primaryColor')?.value + ', ' + editorForm.get('secondaryColor')?.value + ')'">
                  @if (currentSettings()?.logo_url) {
                    <img [src]="currentSettings()?.logo_url" alt="Logo" class="w-16 h-16 mx-auto mb-4 rounded-xl">
                  }
                  <h1 class="text-2xl font-semibold mb-2">
                    {{ editorForm.get('slug')?.value || 'tu-nombre' }}
                  </h1>
                  <p class="text-white/80 text-sm">
                    {{ editorForm.get('description')?.value || 'Descripción de tu academia o servicio educativo' }}
                  </p>
                </div>
                
                <div class="p-6 bg-white">
                  <h3 class="text-lg font-semibold text-surface-700 mb-4">Mis Servicios</h3>
                  <div class="space-y-3">
                    <div class="border border-surface-100 rounded-xl p-4 hover:border-surface-200 transition-colors">
                      <h4 class="font-medium text-surface-700">Matemáticas ESO</h4>
                      <p class="text-sm text-surface-400">Clases particulares de matemáticas</p>
                      <p class="text-lg font-semibold text-primary-600 mt-2">$500/hora</p>
                    </div>
                    <div class="border border-surface-100 rounded-xl p-4 hover:border-surface-200 transition-colors">
                      <h4 class="font-medium text-surface-700">Física Bachillerato</h4>
                      <p class="text-sm text-surface-400">Preparación para selectividad</p>
                      <p class="text-lg font-semibold text-primary-600 mt-2">$600/hora</p>
                    </div>
                  </div>
                  
                  <div class="mt-6">
                    <button class="btn-premium w-full">
                      Agendar Cita
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class UserLandingEditorComponent implements OnInit {
  editorForm: FormGroup;
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  currentSettings = signal<TenantSettings | null>(null);

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService
  ) {
    this.editorForm = this.fb.group({
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      primaryColor: ['#3B82F6', Validators.required],
      secondaryColor: ['#1E40AF', Validators.required],
      description: [''],
      contactEmail: ['', [Validators.email]],
      contactPhone: ['']
    });
  }

  async ngOnInit() {
    await this.loadCurrentSettings();
  }

  private async loadCurrentSettings() {
    const user = await this.supabaseService.getCurrentUser();
    if (user) {
      const settings = await this.supabaseService.getTenantSettings(user.id);
      if (settings) {
        this.currentSettings.set(settings);
        this.editorForm.patchValue({
          slug: settings.slug,
          primaryColor: settings.primary_color,
          secondaryColor: settings.secondary_color,
          description: settings.company_description || '',
          contactEmail: settings.contact_email || '',
          contactPhone: settings.contact_phone || ''
        });
      }
    }
  }

  async saveSettings() {
    if (this.editorForm.valid) {
      this.loading.set(true);
      this.errorMessage.set('');
      this.successMessage.set('');

      try {
        const user = await this.supabaseService.getCurrentUser();
        if (!user) {
          this.errorMessage.set('Error de autenticación');
          return;
        }

        const formData = this.editorForm.value;

        const updates: Partial<TenantSettings> = {
          slug: formData.slug,
          primary_color: formData.primaryColor,
          secondary_color: formData.secondaryColor,
          company_description: formData.description,
          contact_email: formData.contactEmail,
          contact_phone: formData.contactPhone
        };

        const { error } = await this.supabaseService.updateTenantSettings(user.id, updates);

        if (error) {
          this.errorMessage.set('Error al guardar la configuración');
          return;
        }

        // Marcar paso de onboarding como completado
        await this.supabaseService.updateOnboardingStep(user.id, 'landing-page', true);

        this.successMessage.set('Configuración guardada correctamente');

        // Recargar configuración actual
        await this.loadCurrentSettings();

      } catch (error: any) {
        this.errorMessage.set('Error inesperado. Inténtalo de nuevo.');
      } finally {
        this.loading.set(false);
      }
    }
  }
}