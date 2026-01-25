import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService, Profile, TutorProfile } from '../../core/services/supabase.service';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="min-h-screen">
      <div class="max-w-4xl mx-auto px-6 lg:px-8 py-8">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-2xl font-semibold text-surface-700">Mi Perfil</h1>
          <p class="text-surface-400 mt-1">Cuéntale al mundo sobre ti</p>
        </div>

        <!-- Success/Error Messages -->
        @if (successMessage()) {
          <div class="bg-accent-green/10 border border-accent-green/20 rounded-xl p-4 mb-6 animate-fade-in">
            <p class="text-sm text-accent-green">{{ successMessage() }}</p>
          </div>
        }
        @if (errorMessage()) {
          <div class="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 animate-fade-in">
            <p class="text-sm text-red-600">{{ errorMessage() }}</p>
          </div>
        }

        <!-- Profile Header Card -->
        <div class="card-premium p-6 mb-6">
          <div class="flex items-center gap-6">
            <div class="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
              <span class="text-3xl font-bold text-white">{{ getInitials() }}</span>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-surface-700">{{ profile()?.first_name }} {{ profile()?.last_name }}</h2>
              <p class="text-surface-400">{{ profile()?.email }}</p>
              <p class="text-sm text-primary-600 font-medium mt-1">{{ getRoleLabel() }}</p>
            </div>
          </div>
        </div>

        <!-- Bio Section -->
        <div class="card-premium p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-surface-700">Sobre Mí</h3>
            @if (!editingBio()) {
              <button (click)="startEditBio()" class="btn-secondary text-sm">Editar</button>
            }
          </div>
          
          @if (editingBio()) {
            <div>
              <textarea 
                [(ngModel)]="bioForm.bio"
                rows="5"
                class="input-premium w-full resize-none"
                placeholder="Cuéntale a tus alumnos sobre ti, tu experiencia y tu metodología de enseñanza..."
              ></textarea>
              <div class="flex gap-3 mt-4">
                <button (click)="cancelEditBio()" class="btn-secondary">Cancelar</button>
                <button (click)="saveBio()" [disabled]="loading()" class="btn-premium disabled:opacity-50">
                  @if (loading()) { Guardando... } @else { Guardar }
                </button>
              </div>
            </div>
          } @else {
            <p class="text-surface-600 whitespace-pre-line">
              {{ profileData()?.bio || 'Aún no has agregado información sobre ti. Click en "Editar" para agregar tu biografía.' }}
            </p>
          }
        </div>

        <!-- Experience Section -->
        <div class="card-premium p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-surface-700">Experiencia</h3>
            @if (!editingExperience()) {
              <button (click)="startEditExperience()" class="btn-secondary text-sm">Editar</button>
            }
          </div>
          
          @if (editingExperience()) {
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-surface-700 mb-2">Años de experiencia</label>
                <input type="number" [(ngModel)]="experienceForm.years_experience" class="input-premium w-32" min="0" />
              </div>
              <div>
                <label class="block text-sm font-medium text-surface-700 mb-2">Títulos o certificaciones</label>
                <textarea 
                  [(ngModel)]="experienceForm.certifications"
                  rows="3"
                  class="input-premium w-full resize-none"
                  placeholder="Ej: Licenciatura en Educación, Certificación TEFL, etc."
                ></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-surface-700 mb-2">Experiencia laboral</label>
                <textarea 
                  [(ngModel)]="experienceForm.work_experience"
                  rows="4"
                  class="input-premium w-full resize-none"
                  placeholder="Describe tu experiencia laboral como tutor o profesor..."
                ></textarea>
              </div>
              <div class="flex gap-3">
                <button (click)="cancelEditExperience()" class="btn-secondary">Cancelar</button>
                <button (click)="saveExperience()" [disabled]="loading()" class="btn-premium disabled:opacity-50">
                  @if (loading()) { Guardando... } @else { Guardar }
                </button>
              </div>
            </div>
          } @else {
            <div class="space-y-4">
              @if (profileData()?.years_experience) {
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                    <span class="text-lg">📅</span>
                  </div>
                  <div>
                    <p class="text-sm text-surface-400">Años de experiencia</p>
                    <p class="font-semibold text-surface-700">{{ profileData()?.years_experience }} años</p>
                  </div>
                </div>
              }
              @if (profileData()?.certifications) {
                <div>
                  <p class="text-sm text-surface-400 mb-1">Títulos y certificaciones</p>
                  <p class="text-surface-600 whitespace-pre-line">{{ profileData()?.certifications }}</p>
                </div>
              }
              @if (profileData()?.work_experience) {
                <div>
                  <p class="text-sm text-surface-400 mb-1">Experiencia laboral</p>
                  <p class="text-surface-600 whitespace-pre-line">{{ profileData()?.work_experience }}</p>
                </div>
              }
              @if (!profileData()?.years_experience && !profileData()?.certifications && !profileData()?.work_experience) {
                <p class="text-surface-400">Aún no has agregado información sobre tu experiencia.</p>
              }
            </div>
          }
        </div>

        <!-- Skills Section -->
        <div class="card-premium p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-surface-700">Especialidades y Habilidades</h3>
            @if (!editingSkills()) {
              <button (click)="startEditSkills()" class="btn-secondary text-sm">Editar</button>
            }
          </div>
          
          @if (editingSkills()) {
            <div>
              <label class="block text-sm font-medium text-surface-700 mb-2">Materias que enseñas</label>
              <textarea 
                [(ngModel)]="skillsForm.subjects"
                rows="3"
                class="input-premium w-full resize-none mb-4"
                placeholder="Ej: Matemáticas, Física, Química, Inglés..."
              ></textarea>
              
              <label class="block text-sm font-medium text-surface-700 mb-2">Metodología de enseñanza</label>
              <textarea 
                [(ngModel)]="skillsForm.teaching_methodology"
                rows="3"
                class="input-premium w-full resize-none"
                placeholder="Describe tu estilo y metodología de enseñanza..."
              ></textarea>
              
              <div class="flex gap-3 mt-4">
                <button (click)="cancelEditSkills()" class="btn-secondary">Cancelar</button>
                <button (click)="saveSkills()" [disabled]="loading()" class="btn-premium disabled:opacity-50">
                  @if (loading()) { Guardando... } @else { Guardar }
                </button>
              </div>
            </div>
          } @else {
            <div class="space-y-4">
              @if (profileData()?.subjects) {
                <div>
                  <p class="text-sm text-surface-400 mb-2">Materias que enseño</p>
                  <div class="flex flex-wrap gap-2">
                    @for (subject of getSubjectsArray(); track subject) {
                      <span class="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">{{ subject }}</span>
                    }
                  </div>
                </div>
              }
              @if (profileData()?.teaching_methodology) {
                <div>
                  <p class="text-sm text-surface-400 mb-1">Metodología de enseñanza</p>
                  <p class="text-surface-600 whitespace-pre-line">{{ profileData()?.teaching_methodology }}</p>
                </div>
              }
              @if (!profileData()?.subjects && !profileData()?.teaching_methodology) {
                <p class="text-surface-400">Aún no has agregado información sobre tus especialidades.</p>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
    profile = signal<Profile | null>(null);
    profileData = signal<TutorProfile | null>(null);
    loading = signal(false);
    successMessage = signal('');
    errorMessage = signal('');

    // Edit modes
    editingBio = signal(false);
    editingExperience = signal(false);
    editingSkills = signal(false);

    // Form data
    bioForm = { bio: '' };
    experienceForm = { years_experience: 0, certifications: '', work_experience: '' };
    skillsForm = { subjects: '', teaching_methodology: '' };

    constructor(private supabaseService: SupabaseService) { }

    async ngOnInit() {
        await this.loadProfile();
    }

    private async loadProfile() {
        const user = await this.supabaseService.getCurrentUser();
        if (user) {
            const profile = await this.supabaseService.getProfile(user.id);
            this.profile.set(profile);

            // Load tutor profile
            const { data } = await this.supabaseService.getTutorProfile(user.id);
            if (data) {
                this.profileData.set(data);
            }
        }
    }

    getInitials(): string {
        const first = this.profile()?.first_name?.[0] || '';
        const last = this.profile()?.last_name?.[0] || '';
        return (first + last).toUpperCase() || 'U';
    }

    getRoleLabel(): string {
        const role = this.profile()?.role;
        if (role === 'director') return 'Director de Academia';
        return 'Tutor Independiente';
    }

    getSubjectsArray(): string[] {
        const subjects = this.profileData()?.subjects;
        if (!subjects) return [];
        return subjects.split(',').map((s: string) => s.trim()).filter((s: string) => s);
    }

    // Bio editing
    startEditBio() {
        this.bioForm.bio = this.profileData()?.bio || '';
        this.editingBio.set(true);
    }

    cancelEditBio() {
        this.editingBio.set(false);
    }

    async saveBio() {
        await this.saveProfileData({ bio: this.bioForm.bio });
        this.editingBio.set(false);
    }

    // Experience editing
    startEditExperience() {
        this.experienceForm = {
            years_experience: this.profileData()?.years_experience || 0,
            certifications: this.profileData()?.certifications || '',
            work_experience: this.profileData()?.work_experience || ''
        };
        this.editingExperience.set(true);
    }

    cancelEditExperience() {
        this.editingExperience.set(false);
    }

    async saveExperience() {
        await this.saveProfileData({
            years_experience: this.experienceForm.years_experience,
            certifications: this.experienceForm.certifications,
            work_experience: this.experienceForm.work_experience
        });
        this.editingExperience.set(false);
    }

    // Skills editing
    startEditSkills() {
        this.skillsForm = {
            subjects: this.profileData()?.subjects || '',
            teaching_methodology: this.profileData()?.teaching_methodology || ''
        };
        this.editingSkills.set(true);
    }

    cancelEditSkills() {
        this.editingSkills.set(false);
    }

    async saveSkills() {
        await this.saveProfileData({
            subjects: this.skillsForm.subjects,
            teaching_methodology: this.skillsForm.teaching_methodology
        });
        this.editingSkills.set(false);
    }

    private async saveProfileData(data: Partial<TutorProfile>) {
        this.loading.set(true);
        this.errorMessage.set('');

        try {
            const user = await this.supabaseService.getCurrentUser();
            if (!user) {
                this.errorMessage.set('Error de autenticación');
                return;
            }

            const { error } = await this.supabaseService.upsertTutorProfile(user.id, data);

            if (error) {
                this.errorMessage.set('Error al guardar');
                return;
            }

            // Reload profile data
            const { data: newData } = await this.supabaseService.getTutorProfile(user.id);
            if (newData) {
                this.profileData.set(newData);
            }

            this.showSuccess('Guardado correctamente');

        } catch (error: any) {
            this.errorMessage.set('Error inesperado');
        } finally {
            this.loading.set(false);
        }
    }

    private showSuccess(message: string) {
        this.successMessage.set(message);
        setTimeout(() => this.successMessage.set(''), 3000);
    }
}
