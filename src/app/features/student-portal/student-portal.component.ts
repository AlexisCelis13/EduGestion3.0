import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  HostListener,
  ElementRef,
  ViewChild,
  computed,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import {
  SupabaseService,
  StudentPortalData,
  StudentFeedback,
  StudentMaterial,
  AppNotification,
} from "../../core/services/supabase.service";

import { BookingWidgetComponent } from "../booking/booking-widget/booking-widget.component";
import { NotificationListComponent } from "../../shared/components/notification-list/notification-list.component";
import { LucideAngularModule, HelpCircle, Bell } from "lucide-angular";

@Component({
  selector: "app-student-portal",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BookingWidgetComponent,
    NotificationListComponent,
    LucideAngularModule,
  ],
  templateUrl: "./student-portal.component.html",
})
export class StudentPortalComponent implements OnInit, OnDestroy {
  @ViewChild("profileMenu") profileMenu!: ElementRef;
  @ViewChild("notificationsContainer") notificationsContainer!: ElementRef;

  loading = signal(true);
  error = signal("");
  data = signal<StudentPortalData | null>(null);
  activeTab = signal<"feedback" | "materials" | "sessions">("feedback");
  showProfileMenu = signal(false);
  showProfileModal = signal(false);

  // Header Icons
  readonly HelpCircle = HelpCircle;
  readonly Bell = Bell;

  // Notifications
  showNotifications = signal(false);
  portalNotifications = signal<AppNotification[]>([]);
  unreadNotificationsCount = computed(
    () => this.portalNotifications().filter((n) => !n.is_read).length,
  );
  private sessionCheckInterval: any;
  private notifiedSessionIds = new Set<string>();

  // Sessions
  upcomingSessions = signal<any[]>([]);
  pastSessions = signal<any[]>([]);

  // Extension Flow
  showExtensionBooking = signal(false);
  activeExtensionProposal = signal<any>(null);
  activeExtensionTutorId = signal<string>("");
  activeExtensionServiceId = signal<string>("");
  activeExtensionServices = signal<any[]>([]);
  activeExtensionStudentEmail = signal<string>("");
  activeExtensionRecentAppointments = signal<any[]>([]);

  // Session Details & Cancellation Modal
  showSessionDetailsModal = signal(false);
  selectedAppointment = signal<any>(null);
  cancelStep = signal<'details' | 'reason' | 'reschedule'>('details');
  cancelReason = signal('');
  isCancelling = signal(false);

  // Reschedule
  rescheduleDate = signal('');
  rescheduleSlots = signal<{ startTime: string; endTime: string }[]>([]);
  selectedRescheduleSlot = signal<{ startTime: string; endTime: string } | null>(null);
  loadingRescheduleSlots = signal(false);
  isRescheduling = signal(false);
  rescheduleMinDate = signal('');

  constructor(
    private route: ActivatedRoute,
    private supabaseService: SupabaseService,
    private router: Router,
  ) { }

  async ngOnInit() {
    const token = this.route.snapshot.paramMap.get("token");

    if (!token) {
      this.error.set("Enlace inválido");
      this.loading.set(false);
      return;
    }

    try {
      // Intenta verificar como Magic Link (acceso temporal)
      let { data, error } = await this.supabaseService.verifyMagicLink(token);

      // Si falla, intenta como Token Permanente (acceso directo antiguo)
      if (error || !data) {
        const legacyResult =
          await this.supabaseService.getStudentPortalData(token);
        data = legacyResult.data;
        error = legacyResult.error;
      } else if (
        data &&
        data.student &&
        (!data.student.company_name || !data.appointments)
      ) {
        // Magic link respondió pero sin datos del tutor o citas (edge function vieja)
        // Complementar con RPC si el alumno tiene access_token
        try {
          const rpcResult = await this.supabaseService.getStudentPortalData(
            data.student.access_token || token,
          );
          if (rpcResult.data) {
            if (rpcResult.data.student) {
              data.student.company_name =
                data.student.company_name ||
                rpcResult.data.student.company_name ||
                "";
              data.student.tutor_name =
                data.student.tutor_name ||
                rpcResult.data.student.tutor_name ||
                "";
              data.student.logo_url =
                data.student.logo_url || rpcResult.data.student.logo_url || "";
              data.student.primary_color =
                data.student.primary_color ||
                rpcResult.data.student.primary_color ||
                "#3B82F6";
              data.student.secondary_color =
                data.student.secondary_color ||
                rpcResult.data.student.secondary_color ||
                "#1E40AF";
            }
            if (!data.appointments && rpcResult.data.appointments) {
              data.appointments = rpcResult.data.appointments;
            }
            if (!data.materials && rpcResult.data.materials) {
              data.materials = rpcResult.data.materials;
            }
            if (!data.feedback && rpcResult.data.feedback) {
              data.feedback = rpcResult.data.feedback;
            }
          }
        } catch (e) {
          console.log("Could not supplement magic link data with RPC:", e);
        }
      }

      if (error) {
        console.error("Portal Error:", error);
        this.error.set(
          `Error: ${error.message || "El enlace ha caducado o no es válido"}`,
        );
        return;
      }

      if (data) {
        this.data.set(data);

        // Process appointments into upcoming and past
        console.log(
          "appointments data inside student portal:",
          data.appointments,
        );
        if (data.appointments) {
          const now = new Date();
          const upcoming = data.appointments.filter((appt: any) => {
            if (appt.status === "cancelled") return false;
            // A session is upcoming if its start time hasn't passed, or if it's currently happening
            // Assuming duration_minutes exists
            const startDateTime = new Date(`${appt.date}T${appt.start_time}`);
            const endDateTime = new Date(
              startDateTime.getTime() + (appt.duration_minutes || 60) * 60000,
            );
            return endDateTime >= now;
          });

          const past = data.appointments.filter((appt: any) => {
            if (appt.status === "cancelled") return false;
            const startDateTime = new Date(`${appt.date}T${appt.start_time}`);
            const endDateTime = new Date(
              startDateTime.getTime() + (appt.duration_minutes || 60) * 60000,
            );
            return endDateTime < now;
          });

          this.upcomingSessions.set(upcoming);
          this.pastSessions.set(past);
          console.log(`upcoming: ${upcoming.length}, past: ${past.length}`);

          // Create an initial static notification if they have upcoming sessions
          if (upcoming.length > 0) {
            this.pushLocalNotification(
              "Sesiones Programadas",
              `Tienes ${upcoming.length} sesión(es) próxima(s) agendada(s).`,
              "system",
            );
          }

          // Generate "Newly Booked" notification if there's an appointment created in the last 24h
          const recentlyCreated = upcoming.filter((a: any) => {
            if (!a.created_at) return false;
            const diffHours =
              (now.getTime() - new Date(a.created_at).getTime()) /
              (1000 * 60 * 60);
            return diffHours <= 24;
          });

          if (recentlyCreated.length > 0) {
            this.pushLocalNotification(
              "¡Nueva Reserva Confirmada!",
              `Se ha${recentlyCreated.length > 1 ? "n" : ""} agendado correctamente ${recentlyCreated.length} sesión(es) recientemente.`,
              "booking_new",
            );
          }

          // Initialize notification polling for these upcoming sessions
          this.startSessionTimer();
        }

        // If no feedback but has materials, switch directly to materials
        if (data.feedback.length === 0 && data.materials.length > 0) {
          this.activeTab.set("materials");
        }
      } else {
        this.error.set("No se encontró información o el enlace ha caducado");
      }
    } catch (err: any) {
      this.error.set(`Error crítico: ${err.message || err}`);
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  formatTime(timeStr: string | undefined): string {
    if (!timeStr) return "";
    try {
      const [hours, minutes] = timeStr.split(':');
      let h = parseInt(hours, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      h = h ? h : 12;
      return `${h}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  }

  getInitials(first: string, last: string): string {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  }
  toggleProfileMenu() {
    this.showProfileMenu.set(!this.showProfileMenu());
    if (this.showProfileMenu()) this.showNotifications.set(false);
  }

  toggleNotifications() {
    this.showNotifications.set(!this.showNotifications());
    if (this.showNotifications()) this.showProfileMenu.set(false);
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent) {
    if (
      this.showProfileMenu() &&
      this.profileMenu &&
      !this.profileMenu.nativeElement.contains(event.target)
    ) {
      this.showProfileMenu.set(false);
    }
    if (
      this.showNotifications() &&
      this.notificationsContainer &&
      !this.notificationsContainer.nativeElement.contains(event.target)
    ) {
      this.showNotifications.set(false);
    }
  }

  logout() {
    this.data.set(null);
    this.showProfileMenu.set(false);
    this.router.navigate(["/student-portal/login"]);
  }

  // Session Extension Methods
  acceptExtension(proposal: any, tutorId: string, studentEmail: string) {
    this.activeExtensionProposal.set(proposal);
    this.activeExtensionTutorId.set(tutorId);
    this.activeExtensionServiceId.set(proposal.service_id);
    this.activeExtensionStudentEmail.set(studentEmail);

    // Inject the recent appointments from current data to auto-fill calendar if available
    const portalData = this.data();
    if (portalData && portalData.appointments) {
      this.activeExtensionRecentAppointments.set(
        portalData.appointments.slice(0, 10),
      ); // Take top 10 for calendar bounds
    } else {
      this.activeExtensionRecentAppointments.set([]);
    }

    // Fetch services for this tutor so we can calculate pricing correctly
    this.supabaseService.getServices(tutorId).then((res) => {
      if (res.data) {
        this.activeExtensionServices.set(res.data);
      }
    });

    this.showExtensionBooking.set(true);
    // Scroll to booking widget
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 100);
  }

  cancelExtensionBooking() {
    this.showExtensionBooking.set(false);
    this.activeExtensionProposal.set(null);
    this.activeExtensionRecentAppointments.set([]);
  }

  async rejectExtension(feedbackId: string) {
    if (!confirm("¿Estás seguro de que quieres descartar esta sugerencia?")) {
      return;
    }

    const token = this.route.snapshot.paramMap.get("token");
    if (!token) return;

    try {
      const { error } = await this.supabaseService.rejectExtension(
        feedbackId,
        token,
      );
      if (error) {
        console.error("Error al rechazar sugerencia:", error);
        alert(
          "Hubo un error al rechazar la sugerencia. Por favor intenta de nuevo.",
        );
        return;
      }

      // Update local state to remove the proposal
      const currentData = this.data();
      if (currentData) {
        const updatedFeedback = currentData.feedback.map((f) => {
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
      console.error("Excepción al rechazar sugerencia:", err);
    }
  }

  onBookingSuccess() {
    // Reload data to potentially clear/update feedback status if needed
    // Currently, it just closes the widget and scrolls up
    this.cancelExtensionBooking();
    window.scrollTo({ top: 0, behavior: "smooth" });
    this.ngOnInit(); // Reload data
  }

  // ==========================================
  // Session Details & Cancellation
  // ==========================================
  openSessionDetails(appt: any) {
    this.selectedAppointment.set(appt);
    this.cancelStep.set('details');
    this.cancelReason.set('');
    this.rescheduleDate.set('');
    this.rescheduleSlots.set([]);
    this.selectedRescheduleSlot.set(null);
    // Min date = tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.rescheduleMinDate.set(tomorrow.toISOString().split('T')[0]);
    this.showSessionDetailsModal.set(true);
  }

  closeSessionDetails() {
    this.showSessionDetailsModal.set(false);
    this.selectedAppointment.set(null);
  }

  canCancelSession(appt: any): boolean {
    if (!appt) return false;
    const now = new Date();
    const startDateTime = new Date(`${appt.date}T${appt.start_time}`);
    const hoursDiff = (startDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDiff >= 24;
  }

  initiateCancel() {
    this.cancelStep.set('reason');
  }

  async confirmCancel() {
    if (!this.cancelReason().trim()) {
      alert('Por favor ingresa un motivo para cancelar la sesión.');
      return;
    }

    const appt = this.selectedAppointment();
    const portalData = this.data();
    if (!appt || !portalData?.student) return;

    // Use token if available, otherwise fallback (we need the token to pass RLS in RPC)
    const token = this.route.snapshot.paramMap.get('token') || '';

    this.isCancelling.set(true);
    try {
      const { data, error } = await this.supabaseService.cancelAppointmentStudent(
        appt.id,
        this.cancelReason(),
        token
      );

      if (error) throw error;

      // Update local state
      this.upcomingSessions.update(sessions =>
        sessions.filter(s => s.id !== appt.id)
      );

      // Optionally show a success toast
      this.pushLocalNotification('Sesión Cancelada', 'Tu cita ha sido cancelada exitosamente.', 'booking_cancel');

      this.closeSessionDetails();
    } catch (err: any) {
      console.error('Error cancelling session:', err);
      alert('Hubo un error al cancelar la sesión: ' + (err.message || err));
    } finally {
      this.isCancelling.set(false);
    }
  }

  // ==========================================
  // Reschedule
  // ==========================================
  initiateReschedule() {
    this.cancelStep.set('reschedule');
  }

  async onRescheduleDateChange(dateStr: string) {
    this.rescheduleDate.set(dateStr);
    this.selectedRescheduleSlot.set(null);
    this.rescheduleSlots.set([]);

    if (!dateStr) return;

    const appt = this.selectedAppointment();
    if (!appt) return;

    // user_id comes from the appointment (added to RPC), fallback to feedback user_id
    const portalData = this.data();
    const tutorId = appt.user_id
      || portalData?.feedback?.[0]?.user_id
      || '';
    if (!tutorId) {
      console.error('Could not determine tutor ID for reschedule');
      return;
    }
    const duration = appt.duration_minutes || 60;

    this.loadingRescheduleSlots.set(true);
    try {
      const slots = await this.supabaseService.getAvailableSlotsForDate(tutorId, dateStr, duration);
      this.rescheduleSlots.set(slots || []);
    } catch (err) {
      console.error('Error fetching reschedule slots:', err);
      this.rescheduleSlots.set([]);
    } finally {
      this.loadingRescheduleSlots.set(false);
    }
  }

  selectRescheduleSlot(slot: { startTime: string; endTime: string }) {
    this.selectedRescheduleSlot.set(slot);
  }

  formatSlotTime(time: string): string {
    try {
      const [hours, minutes] = time.split(':');
      let h = parseInt(hours, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      h = h ? h : 12;
      return `${h}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  }

  async confirmReschedule() {
    const appt = this.selectedAppointment();
    const slot = this.selectedRescheduleSlot();
    const date = this.rescheduleDate();
    if (!appt || !slot || !date) return;

    const token = this.route.snapshot.paramMap.get('token') || '';

    this.isRescheduling.set(true);
    try {
      const { data, error } = await this.supabaseService.rescheduleAppointmentStudent(
        appt.id,
        date,
        slot.startTime,
        slot.endTime,
        token
      );

      if (error) throw error;

      // Update local state — replace the appointment in upcoming sessions
      this.upcomingSessions.update(sessions =>
        sessions.map(s => {
          if (s.id === appt.id) {
            return { ...s, date, start_time: slot.startTime, end_time: slot.endTime, status: 'scheduled' };
          }
          return s;
        })
      );

      this.pushLocalNotification(
        'Sesión Reagendada',
        `Tu cita ha sido reagendada al ${this.formatDate(date)} a las ${this.formatSlotTime(slot.startTime)}.`,
        'booking_new'
      );

      this.closeSessionDetails();
    } catch (err: any) {
      console.error('Error rescheduling session:', err);
      alert('Error al reagendar: ' + (err.message || err));
    } finally {
      this.isRescheduling.set(false);
    }
  }

  // ==========================================
  // Notifications & Session Timers
  // ==========================================================
  startSessionTimer() {
    if (this.sessionCheckInterval) clearInterval(this.sessionCheckInterval);

    // Check every 30 seconds
    this.sessionCheckInterval = setInterval(() => {
      this.checkUpcomingSessionsForAlerts();
    }, 30000);

    // Check immediately on load
    this.checkUpcomingSessionsForAlerts();
  }

  checkUpcomingSessionsForAlerts() {
    const upcoming = this.upcomingSessions();
    if (!upcoming || upcoming.length === 0) return;

    const now = new Date();
    const portalData = this.data();
    if (!portalData?.student) return;

    upcoming.forEach((appt) => {
      // Don't alert twice for the same logical trigger
      const startDateTime = new Date(`${appt.date}T${appt.start_time}`);
      const diffMs = startDateTime.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      // Alert 1: 15 minutes before (Window: 14 to 16 mins)
      if (diffMins <= 15 && diffMins > 0) {
        const notifId = `15min_${appt.id}`;
        if (!this.notifiedSessionIds.has(notifId)) {
          this.notifiedSessionIds.add(notifId);
          this.pushLocalNotification(
            "Sesión próxima a iniciar",
            `Tu sesión comienza en ${diffMins} minutos. ¡Prepárate!`,
            "booking_reminder",
          );
        }
      }

      // Alert 2: Just started (Window: -5 to 0 mins)
      if (diffMins <= 0 && diffMins > -15) {
        const notifId = `started_${appt.id}`;
        if (!this.notifiedSessionIds.has(notifId)) {
          this.notifiedSessionIds.add(notifId);
          this.pushLocalNotification(
            "Sesión iniciada",
            `Tu sesión ha comenzado. Accede al enlace del Meet si aún no lo haces.`,
            "system",
          );
        }
      }
    });
  }

  pushLocalNotification(
    title: string,
    message: string,
    type: "booking_new" | "booking_cancel" | "booking_reminder" | "system",
  ) {
    const newNotif: AppNotification = {
      id: Math.random().toString(36).substring(2, 11),
      user_id: "system", // we don't have student.user_id natively available here unless we fetch it. 'system' is fine for local-only ones
      type: type,
      title: title,
      message: message,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    const current = this.portalNotifications();
    this.portalNotifications.set([newNotif, ...current]);

    // Play a gentle sound? Optional.
    try {
      const audio = new Audio("/assets/notification.mp3"); // Need to ensure it exists or ignore
      audio.volume = 0.5;
      audio.play().catch((e) => { }); // Ignore autoplay blocks
    } catch (e) { }
  }

  ngOnDestroy() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }
  }
}
