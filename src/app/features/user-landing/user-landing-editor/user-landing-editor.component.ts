import { Component, signal, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService, TenantSettings } from '../../../core/services/supabase.service';
import { PhoneInputComponent } from '../../../shared/components/phone-input/phone-input.component';

@Component({
  selector: 'app-user-landing-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PhoneInputComponent],
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
                      (input)="sanitizeSlug()"
                      class="flex-1 min-w-0 block w-full px-4 py-3 rounded-none rounded-r-xl border border-surface-200 focus:ring-2 focus:ring-primary-100 focus:border-primary-400 text-sm transition-all"
                      placeholder="mi-academia"
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
                    @if (logoPreview() || currentSettings()?.logo_url) {
                      <div class="relative">
                        <img [src]="logoPreview() || currentSettings()?.logo_url" alt="Logo" class="w-16 h-16 object-cover rounded-xl">
                        <button
                          type="button"
                          (click)="removeLogo()"
                          class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          title="Eliminar logo">
                          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    } @else {
                      <div class="w-16 h-16 bg-surface-100 rounded-xl flex items-center justify-center">
                        <svg class="w-8 h-8 text-surface-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                      </div>
                    }
                    <div class="flex flex-col gap-2">
                      <input
                        type="file"
                        #fileInput
                        accept="image/*"
                        class="hidden"
                        (change)="onFileSelected($event)"
                      />
                      <button
                        type="button"
                        (click)="fileInput.click()"
                        [disabled]="uploadingLogo()"
                        class="btn-secondary">
                        @if (uploadingLogo()) {
                          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Subiendo...
                        } @else {
                          Subir Logo
                        }
                      </button>
                      <p class="text-xs text-surface-400">PNG, JPG o WebP. Máx 7MB</p>
                    </div>
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
                    <app-phone-input formControlName="contactPhone"></app-phone-input>
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
              
              <!-- Preview Content - Matches real landing page -->
              <div class="border border-surface-100 rounded-2xl overflow-hidden bg-gray-50" style="max-height: 700px; overflow-y: auto;">
                
                <!-- Hero Section -->
                <div class="text-white py-10 px-6 text-center"
                     [style.background]="'linear-gradient(to right, ' + editorForm.get('primaryColor')?.value + ', ' + editorForm.get('secondaryColor')?.value + ')'">
                  @if (logoPreview() || currentSettings()?.logo_url) {
                    <img [src]="logoPreview() || currentSettings()?.logo_url" alt="Logo" class="w-16 h-16 mx-auto mb-4 rounded-lg object-cover">
                  }
                  <h1 class="text-2xl font-bold mb-2">
                    {{ getPreviewDisplayName() }}
                  </h1>
                  @if (editorForm.get('description')?.value) {
                    <p class="text-white/90 text-sm max-w-md mx-auto">
                      {{ editorForm.get('description')?.value }}
                    </p>
                  }
                </div>
                
                <!-- Services Section -->
                <div class="py-8 px-5">
                  <div class="text-center mb-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-1">Mis Servicios</h2>
                    <p class="text-sm text-gray-600">Elige el servicio que mejor se adapte a tus necesidades</p>
                  </div>

                  @if (previewServices().length === 0) {
                    <div class="text-center py-8">
                      <div class="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                        <span class="text-gray-400 text-lg">📚</span>
                      </div>
                      <p class="text-sm font-medium text-gray-900 mb-1">Próximamente</p>
                      <p class="text-xs text-gray-500">Crea servicios para que aparezcan aquí</p>
                    </div>
                  } @else {
                    <div class="space-y-4">
                      @for (service of previewServices(); track service.id) {
                        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                          <!-- Header: Name + Price -->
                          <div class="flex justify-between items-start mb-2">
                            <div class="flex-1 pr-3">
                              <h3 class="text-sm font-bold text-gray-900 leading-tight">{{ service.name }}</h3>
                              <div class="flex flex-wrap gap-1 mt-1">
                                @if (service.category) {
                                  <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                    {{ service.category }}
                                  </span>
                                }
                                @if (service.target_level) {
                                  <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-100">
                                    🎓 {{ service.target_level }}
                                  </span>
                                }
                              </div>
                            </div>
                            <div class="text-right shrink-0">
                              <p class="text-base font-bold text-gray-900">{{ '$' + service.price }}</p>
                              <p class="text-[10px] text-gray-500">⏱️ {{ service.duration_minutes }} min</p>
                            </div>
                          </div>

                          @if (service.description) {
                            <p class="text-xs text-gray-600 mb-2 border-b border-gray-100 pb-2">{{ service.description }}</p>
                          }

                          @if (service.topics && service.topics.length > 0) {
                            <div class="mb-2">
                              <p class="text-[10px] font-semibold text-gray-900 uppercase tracking-wider mb-1">📚 Qué aprenderás</p>
                              <div class="flex flex-wrap gap-1">
                                @for (topic of service.topics; track topic) {
                                  <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] text-gray-700 bg-gray-50 border border-gray-200">{{ topic }}</span>
                                }
                              </div>
                            </div>
                          }

                          <button class="w-full py-2 px-3 rounded-lg text-xs font-semibold text-white bg-gray-900 mt-2">
                            Reservar Clase →
                          </button>
                        </div>
                      }
                    </div>
                  }
                </div>

                <!-- Contact Section -->
                @if (editorForm.get('contactEmail')?.value || editorForm.get('contactPhone')?.value) {
                  <div class="bg-white py-6 px-5 border-t border-gray-200">
                    <h3 class="text-base font-bold text-gray-900 text-center mb-4">Contacto</h3>
                    <div class="flex flex-col sm:flex-row gap-3 justify-center items-center text-sm">
                      @if (editorForm.get('contactEmail')?.value) {
                        <span class="text-gray-600">📧 {{ editorForm.get('contactEmail')?.value }}</span>
                      }
                      @if (editorForm.get('contactPhone')?.value) {
                        <span class="text-gray-600">📞 {{ editorForm.get('contactPhone')?.value }}</span>
                      }
                    </div>
                  </div>
                }

                <!-- Footer -->
                <div class="bg-gray-900 text-center py-4 px-5">
                  <p class="text-gray-400 text-xs">Powered by <span class="text-white font-semibold">EduGestion</span></p>
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
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  editorForm: FormGroup;
  loading = signal(false);
  uploadingLogo = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  currentSettings = signal<TenantSettings | null>(null);
  logoPreview = signal<string | null>(null);
  previewServices = signal<any[]>([]);

  private pendingLogoFile: File | null = null;

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
    await this.loadPreviewServices();
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

      // If slug is empty, auto-generate from company name
      if (!this.editorForm.get('slug')?.value) {
        const profile = await this.supabaseService.getProfile(user.id);
        if (profile?.company_name) {
          const autoSlug = this.toSlug(profile.company_name);
          this.editorForm.patchValue({ slug: autoSlug });
        }
      }
    }
  }

  /** Converts any string to a URL-safe slug (lowercase, no accents, hyphens only) */
  private toSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')                    // decompose accents
      .replace(/[\u0300-\u036f]/g, '')     // remove accent marks
      .replace(/[^a-z0-9\s-]/g, '')        // remove special chars
      .replace(/\s+/g, '-')                // spaces → hyphens
      .replace(/-+/g, '-')                 // collapse multiple hyphens
      .replace(/^-|-$/g, '');              // trim leading/trailing hyphens
  }

  /** Sanitizes slug input in real-time */
  sanitizeSlug() {
    const control = this.editorForm.get('slug');
    if (control) {
      const sanitized = this.toSlug(control.value || '');
      if (sanitized !== control.value) {
        control.setValue(sanitized, { emitEvent: false });
      }
    }
  }

  /** Loads real services for the preview panel */
  private async loadPreviewServices() {
    const user = await this.supabaseService.getCurrentUser();
    if (user) {
      const { data } = await this.supabaseService.getServices(user.id);
      if (data) {
        this.previewServices.set(data);
      }
    }
  }

  /** Generates display name from slug, matching the real landing page logic */
  getPreviewDisplayName(): string {
    const slug = this.editorForm.get('slug')?.value;
    if (slug) {
      return slug
        .split('-')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return 'Mi Academia';
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Validate file size (max 7MB)
    if (file.size > 7 * 1024 * 1024) {
      this.errorMessage.set('El archivo es demasiado grande. Máximo 7MB.');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Por favor selecciona un archivo de imagen válido.');
      return;
    }

    this.errorMessage.set('');
    this.pendingLogoFile = file;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.logoPreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload immediately
    this.uploadLogo();
  }

  async uploadLogo() {
    if (!this.pendingLogoFile) return;

    this.uploadingLogo.set(true);
    this.errorMessage.set('');

    try {
      const user = await this.supabaseService.getCurrentUser();
      if (!user) {
        this.errorMessage.set('Error de autenticación');
        return;
      }

      // Upload to Supabase Storage
      const logoUrl = await this.supabaseService.uploadLogo(user.id, this.pendingLogoFile);

      if (!logoUrl) {
        this.errorMessage.set('Error al subir el logo. Intenta de nuevo.');
        this.logoPreview.set(null);
        return;
      }

      // Update tenant settings with new logo URL
      await this.supabaseService.updateLogoUrl(user.id, logoUrl);

      // Reload settings to get updated logo_url
      await this.loadCurrentSettings();

      this.logoPreview.set(null); // Clear preview, use real URL now
      this.pendingLogoFile = null;
      this.successMessage.set('Logo subido correctamente');

      // Clear success message after 3 seconds
      setTimeout(() => this.successMessage.set(''), 3000);

    } catch (error) {
      console.error('Error uploading logo:', error);
      this.errorMessage.set('Error al subir el logo. Intenta de nuevo.');
      this.logoPreview.set(null);
    } finally {
      this.uploadingLogo.set(false);
      // Reset file input
      if (this.fileInput) {
        this.fileInput.nativeElement.value = '';
      }
    }
  }

  async removeLogo() {
    this.uploadingLogo.set(true);
    this.errorMessage.set('');

    try {
      const user = await this.supabaseService.getCurrentUser();
      if (!user) {
        this.errorMessage.set('Error de autenticación');
        return;
      }

      // Delete from storage
      await this.supabaseService.deleteLogo(user.id);

      // Update tenant settings to remove logo URL
      await this.supabaseService.updateLogoUrl(user.id, null);

      // Clear local state
      this.logoPreview.set(null);
      this.pendingLogoFile = null;

      // Reload settings
      await this.loadCurrentSettings();

      this.successMessage.set('Logo eliminado correctamente');
      setTimeout(() => this.successMessage.set(''), 3000);

    } catch (error) {
      console.error('Error removing logo:', error);
      this.errorMessage.set('Error al eliminar el logo. Intenta de nuevo.');
    } finally {
      this.uploadingLogo.set(false);
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