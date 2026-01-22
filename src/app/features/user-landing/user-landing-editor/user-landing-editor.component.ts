import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService, TenantSettings } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-user-landing-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Editor de Landing Page</h1>
          <p class="text-gray-600 mt-2">
            Personaliza tu página web donde los alumnos pueden conocerte y agendar citas
          </p>
        </div>

        <div class="grid lg:grid-cols-2 gap-8">
          <!-- Editor Panel -->
          <div class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 class="text-xl font-semibold text-gray-900 mb-6">Configuración</h2>
              
              <form [formGroup]="editorForm" (ngSubmit)="saveSettings()" class="space-y-6">
                <!-- URL de la Landing Page -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    URL de tu Landing Page
                  </label>
                  <div class="flex">
                    <span class="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      edugestion.com/p/
                    </span>
                    <input
                      type="text"
                      formControlName="slug"
                      class="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="tu-nombre"
                    />
                  </div>
                  <p class="mt-1 text-xs text-gray-500">
                    Solo letras, números y guiones. Ej: maria-garcia-matematicas
                  </p>
                </div>

                <!-- Logo -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Logo (Opcional)
                  </label>
                  <div class="flex items-center space-x-4">
                    @if (currentSettings()?.logo_url) {
                      <img [src]="currentSettings()?.logo_url" alt="Logo" class="w-16 h-16 object-cover rounded-lg">
                    } @else {
                      <div class="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                    }
                    <button
                      type="button"
                      class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                      Subir Logo
                    </button>
                  </div>
                </div>

                <!-- Colores -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Color Primario
                    </label>
                    <div class="flex items-center space-x-2">
                      <input
                        type="color"
                        formControlName="primaryColor"
                        class="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        formControlName="primaryColor"
                        class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Color Secundario
                    </label>
                    <div class="flex items-center space-x-2">
                      <input
                        type="color"
                        formControlName="secondaryColor"
                        class="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        formControlName="secondaryColor"
                        class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="#1E40AF"
                      />
                    </div>
                  </div>
                </div>

                <!-- Descripción -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Descripción de tu Academia/Servicio
                  </label>
                  <textarea
                    formControlName="description"
                    rows="4"
                    class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Ej: Clases particulares de matemáticas para ESO y Bachillerato. Más de 10 años de experiencia ayudando a estudiantes a alcanzar sus objetivos académicos."
                  ></textarea>
                </div>

                <!-- Información de Contacto -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Email de Contacto
                    </label>
                    <input
                      type="email"
                      formControlName="contactEmail"
                      class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono (Opcional)
                    </label>
                    <input
                      type="tel"
                      formControlName="contactPhone"
                      class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="+34 600 000 000"
                    />
                  </div>
                </div>

                @if (errorMessage()) {
                  <div class="bg-red-50 border border-red-200 rounded-md p-4">
                    <p class="text-sm text-red-600">{{ errorMessage() }}</p>
                  </div>
                }

                @if (successMessage()) {
                  <div class="bg-green-50 border border-green-200 rounded-md p-4">
                    <p class="text-sm text-green-600">{{ successMessage() }}</p>
                  </div>
                }

                <div class="flex space-x-4">
                  <button
                    type="submit"
                    [disabled]="editorForm.invalid || loading()"
                    class="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
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
                      class="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                      Ver Landing Page
                    </a>
                  }
                </div>
              </form>
            </div>
          </div>

          <!-- Preview Panel -->
          <div class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 class="text-xl font-semibold text-gray-900 mb-6">Vista Previa</h2>
              
              <!-- Preview Content -->
              <div class="border border-gray-200 rounded-lg overflow-hidden">
                <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-8 text-center"
                     [style.background]="'linear-gradient(to right, ' + editorForm.get('primaryColor')?.value + ', ' + editorForm.get('secondaryColor')?.value + ')'">
                  @if (currentSettings()?.logo_url) {
                    <img [src]="currentSettings()?.logo_url" alt="Logo" class="w-16 h-16 mx-auto mb-4 rounded-lg">
                  }
                  <h1 class="text-2xl font-bold mb-2">
                    {{ editorForm.get('slug')?.value || 'tu-nombre' }}
                  </h1>
                  <p class="text-blue-100">
                    {{ editorForm.get('description')?.value || 'Descripción de tu academia o servicio educativo' }}
                  </p>
                </div>
                
                <div class="p-6">
                  <h3 class="text-lg font-semibold text-gray-900 mb-4">Mis Servicios</h3>
                  <div class="space-y-3">
                    <div class="border border-gray-200 rounded-lg p-4">
                      <h4 class="font-medium text-gray-900">Matemáticas ESO</h4>
                      <p class="text-sm text-gray-600">Clases particulares de matemáticas</p>
                      <p class="text-lg font-semibold text-blue-600 mt-2">$500/hora</p>
                    </div>
                    <div class="border border-gray-200 rounded-lg p-4">
                      <h4 class="font-medium text-gray-900">Física Bachillerato</h4>
                      <p class="text-sm text-gray-600">Preparación para selectividad</p>
                      <p class="text-lg font-semibold text-blue-600 mt-2">$600/hora</p>
                    </div>
                  </div>
                  
                  <div class="mt-6">
                    <button class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold">
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