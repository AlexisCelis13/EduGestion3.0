import { Component, OnInit, signal, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SupabaseService, StudentPortalData, StudentFeedback, StudentMaterial } from '../../core/services/supabase.service';

import { BookingWidgetComponent } from '../booking/booking-widget/booking-widget.component';

@Component({
  selector: 'app-student-portal',
  standalone: true,
  imports: [CommonModule, RouterModule, BookingWidgetComponent],
  templateUrl: './student-portal.component.html'
})
export class StudentPortalComponent implements OnInit {
  @ViewChild('profileMenu') profileMenu!: ElementRef;

  loading = signal(true);
  error = signal('');
  data = signal<StudentPortalData | null>(null);
  activeTab = signal<'feedback' | 'materials'>('feedback');
  showProfileMenu = signal(false);
  showProfileModal = signal(false);

  // Extension Flow
  showExtensionBooking = signal(false);
  activeExtensionProposal = signal<any>(null);
  activeExtensionTutorId = signal<string>('');
  activeExtensionServiceId = signal<string>('');
  activeExtensionServices = signal<any[]>([]);
  activeExtensionStudentEmail = signal<string>('');
  activeExtensionRecentAppointments = signal<any[]>([]);

  constructor(
    private route: ActivatedRoute,
    private supabaseService: SupabaseService,
    private router: Router
  ) { }

  async ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token');

    if (!token) {
      this.error.set('Enlace inválido');
      this.loading.set(false);
      return;
    }

    try {
      // Intenta verificar como Magic Link (acceso temporal)
      let { data, error } = await this.supabaseService.verifyMagicLink(token);

      // Si falla, intenta como Token Permanente (acceso directo antiguo)
      if (error || !data) {
        const legacyResult = await this.supabaseService.getStudentPortalData(token);
        data = legacyResult.data;
        error = legacyResult.error;
      } else if (data && data.student && !data.student.company_name) {
        // Magic link respondió pero sin datos del tutor (edge function vieja)
        // Complementar con RPC si el alumno tiene access_token
        try {
          const rpcResult = await this.supabaseService.getStudentPortalData(data.student.access_token || token);
          if (rpcResult.data?.student) {
            data.student.company_name = rpcResult.data.student.company_name || '';
            data.student.tutor_name = rpcResult.data.student.tutor_name || '';
            data.student.logo_url = rpcResult.data.student.logo_url || '';
            data.student.primary_color = rpcResult.data.student.primary_color || '#3B82F6';
            data.student.secondary_color = rpcResult.data.student.secondary_color || '#1E40AF';
          }
        } catch (e) {
          console.log('Could not supplement magic link data with RPC:', e);
        }
      }

      if (error) {
        console.error('Portal Error:', error);
        this.error.set(`Error: ${error.message || 'El enlace ha caducado o no es válido'}`);
        return;
      }

      if (data) {
        this.data.set(data);
        // If no feedback but has materials, switch directly to materials
        if (data.feedback.length === 0 && data.materials.length > 0) {
          this.activeTab.set('materials');
        }
      } else {
        this.error.set('No se encontró información o el enlace ha caducado');
      }
    } catch (err: any) {
      this.error.set(`Error crítico: ${err.message || err}`);
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getInitials(first: string, last: string): string {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  }
  toggleProfileMenu() {
    this.showProfileMenu.set(!this.showProfileMenu());
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.showProfileMenu() && this.profileMenu && !this.profileMenu.nativeElement.contains(event.target)) {
      this.showProfileMenu.set(false);
    }
  }

  logout() {
    this.data.set(null);
    this.showProfileMenu.set(false);
    this.router.navigate(['/student-portal/login']);
  }

  // Session Extension Methods
  acceptExtension(proposal: any, tutorId: string, studentEmail: string) {
    this.activeExtensionProposal.set(proposal);
    this.activeExtensionTutorId.set(tutorId);
    this.activeExtensionServiceId.set(proposal.service_id);
    this.activeExtensionStudentEmail.set(studentEmail);

    // Inject the recent appointments from current data to auto-fill calendar if available
    const portalData = this.data();
    if (portalData && portalData.recent_appointments) {
      this.activeExtensionRecentAppointments.set(portalData.recent_appointments);
    } else {
      this.activeExtensionRecentAppointments.set([]);
    }

    // Fetch services for this tutor so we can calculate pricing correctly
    this.supabaseService.getServices(tutorId).then(res => {
      if (res.data) {
        this.activeExtensionServices.set(res.data);
      }
    });

    this.showExtensionBooking.set(true);
    // Scroll to booking widget
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  }

  cancelExtensionBooking() {
    this.showExtensionBooking.set(false);
    this.activeExtensionProposal.set(null);
    this.activeExtensionRecentAppointments.set([]);
  }

  async rejectExtension(feedbackId: string) {
    if (!confirm('¿Estás seguro de que quieres descartar esta sugerencia?')) {
      return;
    }

    const token = this.route.snapshot.paramMap.get('token');
    if (!token) return;

    try {
      const { error } = await this.supabaseService.rejectExtension(feedbackId, token);
      if (error) {
        console.error('Error al rechazar sugerencia:', error);
        alert('Hubo un error al rechazar la sugerencia. Por favor intenta de nuevo.');
        return;
      }

      // Update local state to remove the proposal
      const currentData = this.data();
      if (currentData) {
        const updatedFeedback = currentData.feedback.map(f => {
          if (f.id === feedbackId) {
            return { ...f, extension_proposal: null };
          }
          return f;
        });
        this.data.set({ ...currentData, feedback: updatedFeedback });
      }

      if (this.showExtensionBooking()) {
        this.cancelExtensionBooking();
      }

    } catch (err) {
      console.error('Excepción al rechazar sugerencia:', err);
    }
  }

  onBookingSuccess() {
    // Reload data to potentially clear/update feedback status if needed
    // Currently, it just closes the widget and scrolls up
    setTimeout(() => {
      this.cancelExtensionBooking();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.ngOnInit(); // Reload data
    }, 3000);
  }
}
