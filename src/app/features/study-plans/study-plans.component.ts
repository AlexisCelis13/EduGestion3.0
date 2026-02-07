import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupabaseService, ConsultationRequest } from '../../core/services/supabase.service';

@Component({
  selector: 'app-study-plans',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen">
      <!-- Header -->
      <div class="bg-white border-b border-surface-100">
        <div class="max-w-7xl mx-auto px-6 lg:px-8">
          <div class="flex justify-between items-center py-8">
            <div>
              <h1 class="text-2xl font-semibold text-surface-700">Planes de Estudio</h1>
              <p class="text-surface-400 mt-1">Gestiona las solicitudes de asesoría personalizada</p>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <!-- Stats -->
        <div class="grid md:grid-cols-4 gap-6 mb-8">
          <div class="card-premium p-6 hover-lift">
            <div class="flex items-center">
              <div class="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-xl">
                🕒
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-surface-400">Pendientes</p>
                <p class="text-2xl font-semibold text-surface-700">{{ pendingCount() }}</p>
              </div>
            </div>
          </div>

          <div class="card-premium p-6 hover-lift">
            <div class="flex items-center">
              <div class="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-xl">
                👁️
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-surface-400">Por Revisar</p>
                <p class="text-2xl font-semibold text-surface-700">{{ toReviewCount() }}</p>
              </div>
            </div>
          </div>

          <div class="card-premium p-6 hover-lift">
            <div class="flex items-center">
              <div class="w-12 h-12 bg-accent-green/10 rounded-2xl flex items-center justify-center text-xl">
                ✅
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-surface-400">Aprobados</p>
                <p class="text-2xl font-semibold text-surface-700">{{ approvedCount() }}</p>
              </div>
            </div>
          </div>

          <div class="card-premium p-6 hover-lift">
            <div class="flex items-center">
              <div class="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-xl">
                💰
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-surface-400">Ingresos Potenciales</p>
                <p class="text-2xl font-semibold text-surface-700">{{ formatPrice(potentialRevenue()) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex gap-2 mb-6">
          <button 
            (click)="activeTab.set('pending')"
            class="px-4 py-2 rounded-lg font-medium transition-all"
            [class.bg-primary-600]="activeTab() === 'pending'"
            [class.text-white]="activeTab() === 'pending'"
            [class.bg-surface-100]="activeTab() !== 'pending'"
            [class.text-surface-600]="activeTab() !== 'pending'">
            Pendientes de Revisión
            <span *ngIf="toReviewCount() > 0" class="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">{{ toReviewCount() }}</span>
          </button>
          <button 
            (click)="activeTab.set('approved')"
            class="px-4 py-2 rounded-lg font-medium transition-all"
            [class.bg-primary-600]="activeTab() === 'approved'"
            [class.text-white]="activeTab() === 'approved'"
            [class.bg-surface-100]="activeTab() !== 'approved'"
            [class.text-surface-600]="activeTab() !== 'approved'">
            Aprobados
          </button>
          <button 
            (click)="activeTab.set('all')"
            class="px-4 py-2 rounded-lg font-medium transition-all"
            [class.bg-primary-600]="activeTab() === 'all'"
            [class.text-white]="activeTab() === 'all'"
            [class.bg-surface-100]="activeTab() !== 'all'"
            [class.text-surface-600]="activeTab() !== 'all'">
            Todos
          </button>
        </div>

        <!-- Lista de Consultations -->
        <div class="space-y-4">
          @if (loading()) {
            <div class="card-premium p-12 text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p class="text-surface-400">Cargando planes...</p>
            </div>
          } @else if (filteredConsultations().length === 0) {
            <div class="card-premium p-12 text-center">
              <div class="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
                📖
              </div>
              <h3 class="text-lg font-semibold text-surface-700 mb-2">No hay planes en esta categoría</h3>
              <p class="text-surface-400">Los planes de estudio solicitados aparecerán aquí</p>
            </div>
          } @else {
            @for (consultation of filteredConsultations(); track consultation.id) {
              <div class="card-premium p-6 hover-lift cursor-pointer" (click)="openDetail(consultation)">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-lg">
                        👤
                      </div>
                      <div>
                        <h3 class="font-semibold text-surface-700">
                          {{ consultation.student_first_name }} {{ consultation.student_last_name }}
                        </h3>
                        <p class="text-sm text-surface-400">{{ consultation.student_email || consultation.parent_email }}</p>
                      </div>
                    </div>
                    
                    <div class="flex flex-wrap gap-2 mt-3">
                      <span class="px-2 py-1 text-xs rounded-full bg-surface-100 text-surface-600">
                        {{ consultation.academic_level || 'Sin especificar' }}
                      </span>
                      @for (subject of consultation.subjects || []; track subject) {
                        <span class="px-2 py-1 text-xs rounded-full bg-primary-50 text-primary-700">
                          {{ subject }}
                        </span>
                      }
                    </div>

                    @if (consultation.study_plans && consultation.study_plans.length > 0) {
                      <div class="mt-4 p-3 bg-surface-50 rounded-lg">
                        <p class="text-sm font-medium text-surface-700">{{ consultation.study_plans[0].plan_title }}</p>
                        <div class="flex gap-4 mt-2 text-sm text-surface-500">
                          <span class="flex items-center gap-1">
                            📅 {{ consultation.study_plans[0].recommended_sessions }} sesiones
                          </span>
                          <span class="flex items-center gap-1">
                            💰 {{ formatPrice(consultation.study_plans[0].estimated_price) }}
                          </span>
                        </div>
                      </div>
                    }
                  </div>

                  <div class="flex flex-col items-end gap-2">
                    <button 
                      (click)="deleteConsultation(consultation.id, $event)"
                      class="p-1 hover:bg-red-50 text-surface-400 hover:text-red-500 rounded-lg transition-colors"
                      title="Eliminar solicitud">
                      🗑️
                    </button>
                    <span class="px-3 py-1 text-xs font-medium rounded-full"
                          [ngClass]="getStatusClass(consultation.status)">
                      {{ getStatusLabel(consultation.status) }}
                    </span>
                    <p class="text-xs text-surface-400">{{ formatDate(consultation.created_at) }}</p>
                    <span class="text-surface-300">›</span>
                  </div>
                </div>
              </div>
            }
          }
        </div>
      </div>
    </div>

    <!-- Modal de Detalle -->
    <div *ngIf="selectedConsultation()" class="fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div class="card-premium w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
        <div class="p-6 border-b border-surface-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 class="text-lg font-semibold text-surface-700">Detalle de Solicitud</h3>
          <button (click)="closeDetail()" class="w-8 h-8 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-400 hover:text-surface-600 transition-colors">
            ✕
          </button>
        </div>
        
        <div class="p-6 space-y-6">
          <!-- Info del Estudiante -->
          <div>
            <h4 class="font-semibold text-surface-600 text-sm uppercase tracking-wider mb-3">Información del Estudiante</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="p-3 bg-surface-50 rounded-lg">
                <p class="text-xs text-surface-400 mb-1">Nombre</p>
                <p class="font-medium text-surface-700">{{ selectedConsultation()!.student_first_name }} {{ selectedConsultation()!.student_last_name }}</p>
              </div>
              <div class="p-3 bg-surface-50 rounded-lg">
                <p class="text-xs text-surface-400 mb-1">Nivel Académico</p>
                <p class="font-medium text-surface-700">{{ selectedConsultation()!.academic_level || 'No especificado' }}</p>
              </div>
              <div class="p-3 bg-surface-50 rounded-lg">
                <p class="text-xs text-surface-400 mb-1">Email</p>
                <p class="font-medium text-surface-700">{{ selectedConsultation()!.student_email || selectedConsultation()!.parent_email || 'No especificado' }}</p>
              </div>
              <div class="p-3 bg-surface-50 rounded-lg">
                <p class="text-xs text-surface-400 mb-1">Teléfono</p>
                <p class="font-medium text-surface-700">{{ selectedConsultation()!.student_phone || selectedConsultation()!.parent_phone || 'No especificado' }}</p>
              </div>
            </div>
          </div>

          <!-- Necesidades -->
          <div>
            <h4 class="font-semibold text-surface-600 text-sm uppercase tracking-wider mb-3">Necesidades Académicas</h4>
            <div class="space-y-3">
              <div class="p-3 bg-surface-50 rounded-lg">
                <p class="text-xs text-surface-400 mb-1">Materias</p>
                <div class="flex flex-wrap gap-2">
                  @for (subject of selectedConsultation()!.subjects || []; track subject) {
                    <span class="px-2 py-1 text-sm rounded bg-primary-100 text-primary-700">{{ subject }}</span>
                  }
                </div>
              </div>
              @if (selectedConsultation()!.specific_topics) {
                <div class="p-3 bg-surface-50 rounded-lg">
                  <p class="text-xs text-surface-400 mb-1">Temas Específicos</p>
                  <p class="text-surface-700">{{ selectedConsultation()!.specific_topics }}</p>
                </div>
              }
              @if (selectedConsultation()!.learning_goals) {
                <div class="p-3 bg-surface-50 rounded-lg">
                  <p class="text-xs text-surface-400 mb-1">Objetivos</p>
                  <p class="text-surface-700">{{ selectedConsultation()!.learning_goals }}</p>
                </div>
              }
            </div>
          </div>

          <!-- Plan Generado -->
          @if (selectedConsultation()!.study_plans && selectedConsultation()!.study_plans!.length > 0) {
            <div>
              <h4 class="font-semibold text-surface-600 text-sm uppercase tracking-wider mb-3">Plan de Estudios Propuesto</h4>
              @for (plan of selectedConsultation()!.study_plans; track plan.id) {
                <div class="card-premium p-4 border-2" [class.border-accent-green]="plan.tutor_approved_at" [class.border-surface-100]="!plan.tutor_approved_at">
                  <div class="flex justify-between items-start mb-3">
                    <div>
                      <h5 class="font-semibold text-surface-700">{{ plan.plan_title }}</h5>
                      <p class="text-sm text-surface-500">{{ plan.plan_description }}</p>
                    </div>
                    <p class="text-xl font-bold text-primary-600">{{ formatPrice(plan.estimated_price) }}</p>
                  </div>

                  <div class="grid grid-cols-3 gap-2 mb-4">
                    <div class="p-2 bg-surface-50 rounded text-center">
                      <p class="text-lg font-bold text-surface-700">{{ plan.recommended_sessions }}</p>
                      <p class="text-xs text-surface-400">Sesiones</p>
                    </div>
                    <div class="p-2 bg-surface-50 rounded text-center">
                      <p class="text-lg font-bold text-surface-700">{{ plan.session_duration_minutes }}</p>
                      <p class="text-xs text-surface-400">Min/sesión</p>
                    </div>
                    <div class="p-2 bg-surface-50 rounded text-center">
                      <p class="text-lg font-bold text-surface-700">{{ plan.total_hours }}h</p>
                      <p class="text-xs text-surface-400">Total</p>
                    </div>
                  </div>

                  <!-- Status Badges -->
                  <div class="flex gap-2 mb-4">
                    <span *ngIf="plan.client_approved_at" class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                      ✓ Cliente aceptó
                    </span>
                    <span *ngIf="plan.tutor_approved_at" class="px-2 py-1 text-xs rounded-full bg-accent-green/20 text-accent-green">
                      ✓ Tu aprobaste
                    </span>
                  </div>

                  <!-- Acciones del Tutor -->
                  @if (plan.client_approved_at && !plan.tutor_approved_at) {
                    <div class="flex gap-3 pt-4 border-t border-surface-100">
                      <button 
                        (click)="rejectPlan(plan.id)"
                        [disabled]="isProcessing()"
                        class="flex-1 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-all font-medium flex items-center justify-center gap-2">
                        ✕ Rechazar
                      </button>
                      <button 
                        (click)="approvePlan(plan.id)"
                        [disabled]="isProcessing()"
                        class="flex-1 px-4 py-2 bg-accent-green text-white rounded-lg hover:bg-accent-green/90 transition-all font-medium flex items-center justify-center gap-2">
                        ✅ Aprobar Plan
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-scale-in {
      animation: scaleIn 0.2s ease-out;
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class StudyPlansComponent implements OnInit {
  consultations = signal<ConsultationRequest[]>([]);
  loading = signal(true);
  activeTab = signal<'pending' | 'approved' | 'all'>('pending');
  selectedConsultation = signal<ConsultationRequest | null>(null);
  isProcessing = signal(false);

  pendingCount = signal(0);
  toReviewCount = signal(0);
  approvedCount = signal(0);
  potentialRevenue = signal(0);

  private userId: string = '';

  constructor(private supabaseService: SupabaseService) { }

  async ngOnInit() {
    const user = await this.supabaseService.getCurrentUser();
    if (user) {
      this.userId = user.id;
      await this.loadConsultations();
    }
  }

  async loadConsultations() {
    this.loading.set(true);
    const data = await this.supabaseService.getConsultationRequests(this.userId);
    this.consultations.set(data as ConsultationRequest[]);
    this.calculateStats();
    this.loading.set(false);
  }

  calculateStats() {
    const all = this.consultations();

    this.pendingCount.set(all.filter(c => c.status === 'pending_plan' || c.status === 'plan_generated').length);
    this.toReviewCount.set(all.filter(c => c.status === 'client_approved').length);
    this.approvedCount.set(all.filter(c => c.status === 'tutor_approved' || c.status === 'paid').length);

    const revenue = all
      .filter(c => c.study_plans && c.study_plans.length > 0)
      .reduce((sum, c) => sum + (c.study_plans![0].estimated_price || 0), 0);
    this.potentialRevenue.set(revenue);
  }

  filteredConsultations(): ConsultationRequest[] {
    const all = this.consultations();
    switch (this.activeTab()) {
      case 'pending':
        return all.filter(c => c.status === 'client_approved');
      case 'approved':
        return all.filter(c => c.status === 'tutor_approved' || c.status === 'paid');
      default:
        return all;
    }
  }

  openDetail(consultation: ConsultationRequest) {
    this.selectedConsultation.set(consultation);
  }

  closeDetail() {
    this.selectedConsultation.set(null);
  }

  async approvePlan(planId: string) {
    this.isProcessing.set(true);
    const { error } = await this.supabaseService.approveStudyPlanAsTutor(planId);

    if (!error) {
      await this.loadConsultations();
      this.closeDetail();

      // Crear notificación para el cliente (se podría enviar email aquí también)
      const consultation = this.selectedConsultation();
      if (consultation) {
        await this.supabaseService.createNotification({
          user_id: this.userId,
          type: 'plan_approved_tutor',
          title: 'Plan Aprobado',
          message: `Has aprobado el plan para ${consultation.student_first_name} ${consultation.student_last_name}`,
          reference_type: 'study_plan',
          reference_id: planId
        });
      }
    }

    this.isProcessing.set(false);
  }

  async rejectPlan(planId: string) {
    const reason = prompt('¿Por qué rechazas este plan? (opcional)');

    this.isProcessing.set(true);
    const { error } = await this.supabaseService.rejectStudyPlan(planId, reason || 'Sin motivo especificado');

    if (!error) {
      await this.loadConsultations();
      this.closeDetail();
    }

    this.isProcessing.set(false);
  }

  async deleteConsultation(id: string, event: Event) {
    event.stopPropagation();
    if (!confirm('¿Estás seguro de eliminar esta solicitud? Esta acción no se puede deshacer.')) return;

    this.loading.set(true);
    const { error } = await this.supabaseService.deleteConsultationRequest(id);

    if (error) {
      console.error('Error deleting consultation:', error);
      alert('Error al eliminar la solicitud');
    } else {
      await this.loadConsultations();
    }
    this.loading.set(false);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending_plan': 'Esperando plan',
      'plan_generated': 'Plan listo',
      'client_approved': 'Cliente aceptó',
      'tutor_approved': 'Aprobado',
      'paid': 'Pagado',
      'cancelled': 'Cancelado'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'pending_plan': 'bg-surface-100 text-surface-600',
      'plan_generated': 'bg-blue-100 text-blue-700',
      'client_approved': 'bg-amber-100 text-amber-700',
      'tutor_approved': 'bg-accent-green/20 text-accent-green',
      'paid': 'bg-primary-100 text-primary-700',
      'cancelled': 'bg-red-100 text-red-700'
    };
    return classes[status] || 'bg-surface-100 text-surface-600';
  }

  formatPrice(amount: number): string {
    return amount?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) || '$0';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}
