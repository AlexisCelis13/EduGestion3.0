import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SupabaseService, TenantSettings, Service } from '../../../core/services/supabase.service';
import { BookingWidgetComponent } from '../../booking/booking-widget/booking-widget.component';
import { ConsultationChatbotComponent } from '../../booking/consultation-chatbot/consultation-chatbot.component';
import { GeneratedStudyPlan, ChatMessage } from '../../../core/services/gemini.service';

@Component({
  selector: 'app-public-landing',
  standalone: true,
  imports: [CommonModule, BookingWidgetComponent, ConsultationChatbotComponent],
  templateUrl: './public-landing.component.html'
})
export class PublicLandingComponent implements OnInit {
  settings = signal<TenantSettings | null>(null);
  services = signal<Service[]>([]);
  loading = signal(true);
  notFound = signal(false);
  slug = signal('');

  // Para pre-seleccionar servicio al agendar
  selectedServiceId = signal<string | undefined>(undefined);

  // Chatbot
  showChatbot = signal(false);

  // Helper para formatear precios en pesos mexicanos
  formatPrice(price: number): string {
    return price.toLocaleString('es-MX');
  }

  scrollToBooking(serviceId?: string) {
    if (serviceId) {
      this.selectedServiceId.set(serviceId);
    }
    const element = document.getElementById('reservar');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  constructor(
    private route: ActivatedRoute,
    private supabaseService: SupabaseService
  ) { }

  async ngOnInit() {
    this.route.params.subscribe(async params => {
      this.slug.set(params['slug']);
      await this.loadLandingData();
    });
  }

  private async loadLandingData() {
    try {
      const slug = this.slug();

      // Cargar configuración del tenant
      const tenantSettings = await this.supabaseService.getTenantSettingsBySlug(slug);

      if (!tenantSettings) {
        this.notFound.set(true);
        this.loading.set(false);
        return;
      }

      this.settings.set(tenantSettings);

      // Cargar servicios del usuario
      const { data: services } = await this.supabaseService.getServices(tenantSettings.user_id);
      if (services) {
        this.services.set(services);
      }

    } catch (error) {
      console.error('Error loading landing data:', error);
      this.notFound.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  getDisplayName(): string {
    const settings = this.settings();
    if (!settings) return '';

    // Usar el nombre de la empresa si existe, sino usar el slug formateado
    if (settings.slug) {
      return settings.slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    return 'Mi Academia';
  }

  // ==============================
  // Chatbot Methods
  // ==============================

  openChatbot() {
    this.showChatbot.set(true);
  }

  closeChatbot() {
    this.showChatbot.set(false);
  }

  async onPlanAccepted(event: {
    plan: GeneratedStudyPlan;
    chatHistory: ChatMessage[];
    extractedData: any;
  }) {
    const tutorId = this.settings()?.user_id;
    if (!tutorId) return;

    try {
      // 1. Crear la solicitud de consulta en la base de datos
      const { data: consultation, error: consultationError } = await this.supabaseService.createConsultationRequest({
        tutor_id: tutorId,
        booking_for: event.extractedData.bookingFor || 'me',
        student_first_name: event.extractedData.studentFirstName || 'Cliente',
        student_last_name: event.extractedData.studentLastName || '',
        student_email: event.extractedData.studentEmail,
        student_phone: event.extractedData.studentPhone,
        parent_name: event.extractedData.parentName,
        parent_email: event.extractedData.parentEmail,
        parent_phone: event.extractedData.parentPhone,
        academic_level: event.extractedData.academicLevel,
        subjects: event.extractedData.subjects,
        specific_topics: event.extractedData.specificTopics,
        current_struggles: event.extractedData.currentStruggles,
        learning_goals: event.extractedData.learningGoals,
        chat_history: event.chatHistory
      });

      if (consultationError || !consultation) {
        console.error('Error creating consultation:', consultationError);
        alert('Hubo un error al guardar tu solicitud. Por favor intenta de nuevo.');
        return;
      }

      // 2. Crear el plan de estudios asociado
      const { data: studyPlan, error: planError } = await this.supabaseService.createStudyPlan({
        consultation_id: consultation.id,
        plan_title: event.plan.planTitle,
        plan_description: event.plan.planDescription,
        recommended_sessions: event.plan.recommendedSessions,
        session_duration_minutes: event.plan.sessionDurationMinutes,
        total_hours: event.plan.totalHours,
        estimated_price: event.plan.estimatedPrice,
        plan_content: event.plan.planContent
      });

      if (planError) {
        console.error('Error creating study plan:', planError);
      }

      // 3. Actualizar estado de la consulta
      await this.supabaseService.updateConsultationStatus(consultation.id, 'plan_generated');

      // 4. Aprobar automáticamente como cliente (ya aceptó en el chatbot)
      if (studyPlan) {
        await this.supabaseService.approveStudyPlanAsClient(studyPlan.id);
      }

      // 5. Crear notificación para el tutor
      await this.supabaseService.createNotification({
        user_id: tutorId,
        type: 'new_consultation',
        title: '¡Nueva Asesoría Personalizada!',
        message: `${event.extractedData.studentFirstName || 'Un cliente'} ha solicitado un plan de estudios personalizado y lo ha aceptado. Revisa y aprueba el plan.`,
        reference_type: 'consultation',
        reference_id: consultation.id
      });

      // 6. Mostrar mensaje de éxito
      this.closeChatbot();
      alert('¡Solicitud enviada! Tu plan ha sido enviado al asesor para su validación. Te contactaremos pronto con la aprobación final.');

    } catch (error) {
      console.error('Error processing plan acceptance:', error);
      alert('Hubo un error. Por favor intenta de nuevo.');
    }
  }
}