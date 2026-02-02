import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';

interface DateOverride {
  id?: string;
  date: string;
  isAvailable: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

// Update Interface
interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  studentName: string;
  studentEmail?: string;
  serviceName?: string;
  status: string;
  notes?: string;
}

@Component({
  selector: 'app-schedule-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen">
      <div class="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 class="text-2xl font-semibold text-surface-700">Calendario de Horarios</h1>
            <p class="text-surface-400 mt-1">
              Visualiza y gestiona tu disponibilidad y citas
            </p>
          </div>
          <button (click)="showAddOverride = true" class="btn-premium">
            + Marcar día especial
          </button>
        </div>

        <!-- Month Navigation -->
        <div class="card-premium p-4 mb-6">
          <div class="flex items-center justify-between">
            <button (click)="previousMonth()" class="p-2 rounded-xl hover:bg-surface-100 transition-colors">
              <svg class="w-5 h-5 text-surface-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <h2 class="text-lg font-semibold text-surface-700">{{ currentMonthName }} {{ currentYear }}</h2>
            <button (click)="nextMonth()" class="p-2 rounded-xl hover:bg-surface-100 transition-colors">
              <svg class="w-5 h-5 text-surface-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>

        <!-- Calendar Grid -->
        <div class="card-premium overflow-hidden mb-6">
          <!-- Day Headers -->
          <div class="grid grid-cols-7 bg-surface-50 border-b border-surface-100">
            @for (day of weekDays; track day) {
              <div class="p-3 text-center text-sm font-medium text-surface-500">
                {{ day }}
              </div>
            }
          </div>
          
          <!-- Calendar Days -->
          <div class="grid grid-cols-7">
            @for (day of calendarDays; track $index) {
              <div 
                class="min-h-24 p-2 border-b border-r border-surface-100 cursor-pointer hover:bg-surface-50 transition-colors"
                [class.bg-surface-50]="!day.isCurrentMonth"
                [class.opacity-50]="!day.isCurrentMonth"
                (click)="selectDate(day)">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium" 
                        [class.text-primary-600]="day.isToday"
                        [class.bg-primary-600]="day.isToday"
                        [class.text-white]="day.isToday"
                        [class.px-2]="day.isToday"
                        [class.py-0.5]="day.isToday"
                        [class.rounded-full]="day.isToday">
                    {{ day.dayNumber }}
                  </span>
                  @if (day.hasOverride && !day.isAvailable) {
                    <span class="w-2 h-2 rounded-full bg-red-500"></span>
                  }
                </div>
                @if (day.appointments.length > 0) {
                  <div class="space-y-1">
                    @for (apt of day.appointments.slice(0, 2); track apt.id) {
                      <div class="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded truncate">
                        {{ apt.startTime }} - {{ apt.studentName }}
                      </div>
                    }
                    @if (day.appointments.length > 2) {
                      <div class="text-xs text-surface-400">
                        +{{ day.appointments.length - 2 }} más
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Upcoming Appointments -->
        <div class="card-premium p-6 mb-6">
          <h3 class="text-lg font-semibold text-surface-700 mb-4">Próximas Citas</h3>
          @if (upcomingAppointments.length === 0) {
            <div class="text-center py-8">
              <div class="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-surface-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <p class="text-surface-400">No tienes citas programadas</p>
            </div>
          } @else {
            <div class="space-y-3">
              @for (apt of upcomingAppointments; track apt.id) {
                <div (click)="selectAppointment(apt)" class="flex items-center justify-between p-4 rounded-xl border border-surface-100 hover:border-surface-200 transition-colors cursor-pointer active:scale-98">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                      <span class="text-sm font-semibold text-primary-600">{{ formatDay(apt.date) }}</span>
                    </div>
                    <div>
                      <p class="font-medium text-surface-700">{{ apt.studentName }}</p>
                      <p class="text-sm text-surface-400">{{ apt.startTime }} - {{ apt.endTime }}</p>
                    </div>
                  </div>
                  <span class="text-xs font-medium px-2.5 py-1 rounded-full"
                        [class.bg-amber-100]="apt.status === 'pending'"
                        [class.text-amber-700]="apt.status === 'pending'"
                        [class.bg-accent-green]="apt.status === 'confirmed' || apt.status === 'scheduled'"
                        [class.bg-opacity-10]="apt.status === 'confirmed' || apt.status === 'scheduled'"
                        [class.text-accent-green]="apt.status === 'confirmed' || apt.status === 'scheduled'">
                    {{ apt.status === 'pending' ? 'Pendiente' : 'Confirmada' }}
                  </span>
                </div>
              }
            </div>
          }
        </div>

        <!-- Past Appointments -->
        @if (pastAppointments.length > 0) {
          <div class="card-premium p-6">
            <h3 class="text-lg font-semibold text-surface-700 mb-4">Clases Pasadas</h3>
            <div class="space-y-3 max-h-96 overflow-y-auto">
              @for (apt of pastAppointments; track apt.id) {
                <div (click)="selectAppointment(apt)" class="flex items-center justify-between p-4 rounded-xl border border-surface-100 hover:border-surface-200 transition-colors cursor-pointer active:scale-98 opacity-75">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-surface-100 rounded-xl flex items-center justify-center">
                      <span class="text-sm font-semibold text-surface-500">{{ formatDay(apt.date) }}</span>
                    </div>
                    <div>
                      <p class="font-medium text-surface-600">{{ apt.studentName }}</p>
                      <p class="text-sm text-surface-400">{{ apt.startTime }} - {{ apt.endTime }}</p>
                    </div>
                  </div>
                  <span class="text-xs font-medium px-2.5 py-1 rounded-full"
                        [class.bg-green-100]="apt.status === 'completed'"
                        [class.text-green-700]="apt.status === 'completed'"
                        [class.bg-surface-100]="apt.status !== 'completed'"
                        [class.text-surface-500]="apt.status !== 'completed'">
                    {{ apt.status === 'completed' ? 'Completada' : 'Pasada' }}
                  </span>
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- Add Override Modal -->
      @if (showAddOverride) {
        <div class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="fixed inset-0 bg-surface-900/60 backdrop-blur-sm" (click)="showAddOverride = false"></div>
          <div class="relative bg-white rounded-2xl shadow-premium-lg p-6 w-full max-w-md mx-4 animate-fade-in-up">
            <h3 class="text-lg font-semibold text-surface-700 mb-4">Marcar Día Especial</h3>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-surface-700 mb-2">Fecha</label>
                <input type="date" [(ngModel)]="newOverride.date" class="input-premium" />
              </div>
              
              <div>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="newOverride.isAvailable" class="w-5 h-5 text-primary-600 border-surface-300 rounded" />
                  <span class="text-sm text-surface-700">¿Disponible este día?</span>
                </label>
              </div>
              
              @if (!newOverride.isAvailable) {
                <div>
                  <label class="block text-sm font-medium text-surface-700 mb-2">Razón (opcional)</label>
                  <input type="text" [(ngModel)]="newOverride.reason" class="input-premium" placeholder="Ej: Día festivo, vacaciones..." />
                </div>
              }
            </div>

            <div class="flex gap-3 mt-6">
              <button (click)="showAddOverride = false" class="btn-secondary flex-1">Cancelar</button>
              <button (click)="saveOverride()" class="btn-premium flex-1">Guardar</button>
            </div>
          </div>
        </div>
      }

      <!-- Appointment Details Modal -->
      @if (selectedAppointment) {
        <div class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="fixed inset-0 bg-surface-900/60 backdrop-blur-sm" (click)="closeAppointmentDetails()"></div>
          <div class="relative bg-white rounded-2xl shadow-premium-lg p-6 w-full max-w-lg mx-4 animate-fade-in-up">
            <div class="flex justify-between items-start mb-6">
              <div>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-2"
                      [class.bg-blue-100]="selectedAppointment.status === 'scheduled'"
                      [class.text-blue-800]="selectedAppointment.status === 'scheduled'"
                      [class.bg-green-100]="selectedAppointment.status === 'confirmed'"
                      [class.text-green-800]="selectedAppointment.status === 'confirmed'"
                      [class.bg-yellow-100]="selectedAppointment.status === 'pending'"
                      [class.text-yellow-800]="selectedAppointment.status === 'pending'">
                  {{ selectedAppointment.status === 'scheduled' ? 'Confirmada' : selectedAppointment.status }}
                </span>
                <h3 class="text-xl font-bold text-surface-900">Detalles de la Cita</h3>
              </div>
              <button (click)="closeAppointmentDetails()" class="text-surface-400 hover:text-surface-600">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="space-y-6">
              <!-- Student Info -->
              <div class="flex items-start gap-4 p-4 bg-surface-50 rounded-xl">
                <div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-lg">
                  {{ selectedAppointment.studentName.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <p class="font-semibold text-surface-900">{{ selectedAppointment.studentName }}</p>
                  <p class="text-sm text-surface-500">{{ selectedAppointment.studentEmail }}</p>
                </div>
              </div>

              <!-- Time & Service -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-xs font-semibold text-surface-500 uppercase tracking-wider">Fecha</label>
                  <p class="font-medium text-surface-700 mt-1 flex items-center gap-2">
                    <svg class="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {{ selectedAppointment.date }}
                  </p>
                </div>
                <div>
                  <label class="text-xs font-semibold text-surface-500 uppercase tracking-wider">Hora</label>
                  <p class="font-medium text-surface-700 mt-1 flex items-center gap-2">
                    <svg class="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ selectedAppointment.startTime.substring(0,5) }} - {{ selectedAppointment.endTime.substring(0,5) }}
                  </p>
                </div>
              </div>

              @if (selectedAppointment.serviceName) {
                <div>
                  <label class="text-xs font-semibold text-surface-500 uppercase tracking-wider">Servicio</label>
                  <p class="font-medium text-surface-700 mt-1">{{ selectedAppointment.serviceName }}</p>
                </div>
              }

              @if (selectedAppointment.notes) {
                <div>
                  <label class="text-xs font-semibold text-surface-500 uppercase tracking-wider">Notas</label>
                  <div class="mt-2 p-3 bg-white border border-surface-200 rounded-lg text-surface-600 text-sm italic">
                    "{{ selectedAppointment.notes }}"
                  </div>
                </div>
              }
            </div>

            <div class="mt-8 pt-6 border-t border-surface-100 flex justify-end gap-3">
              <button (click)="closeAppointmentDetails()" class="btn-secondary">Cerrar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ScheduleCalendarComponent implements OnInit {
  selectedAppointment: Appointment | null = null;
  weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  currentDate = new Date();
  currentYear = this.currentDate.getFullYear();
  currentMonth = this.currentDate.getMonth();
  currentMonthName = '';
  calendarDays: any[] = [];
  upcomingAppointments: Appointment[] = [];
  pastAppointments: Appointment[] = [];
  dateOverrides: DateOverride[] = [];

  showAddOverride = false;
  newOverride: DateOverride = {
    date: '',
    isAvailable: false,
    reason: ''
  };

  monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  constructor(private supabaseService: SupabaseService) { }

  async ngOnInit() {
    this.generateCalendar();
    await this.loadData();
  }

  generateCalendar() {
    this.currentMonthName = this.monthNames[this.currentMonth];
    this.calendarDays = [];

    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();

    // Previous month days
    const prevMonthLastDay = new Date(this.currentYear, this.currentMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      this.calendarDays.push({
        dayNumber: prevMonthLastDay - i,
        isCurrentMonth: false,
        isToday: false,
        date: '',
        hasOverride: false,
        isAvailable: true,
        appointments: []
      });
    }

    // Current month days
    const today = new Date();
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(this.currentYear, this.currentMonth, day);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = date.toDateString() === today.toDateString();

      this.calendarDays.push({
        dayNumber: day,
        isCurrentMonth: true,
        isToday,
        date: dateStr,
        hasOverride: false,
        isAvailable: true,
        appointments: []
      });
    }

    // Next month days
    const remainingDays = 42 - this.calendarDays.length;
    for (let day = 1; day <= remainingDays; day++) {
      this.calendarDays.push({
        dayNumber: day,
        isCurrentMonth: false,
        isToday: false,
        date: '',
        hasOverride: false,
        isAvailable: true,
        appointments: []
      });
    }
  }

  async loadData() {
    const user = await this.supabaseService.getCurrentUser();
    if (!user) return;

    // Load appointments
    const appointments = await this.supabaseService.getAppointments(user.id);
    if (appointments) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const allAppointments = appointments
        .filter(apt => apt.status !== 'cancelled')
        .map(apt => ({
          id: apt.id,
          date: apt.date,
          startTime: apt.start_time,
          endTime: apt.end_time,
          studentName: apt.student_name || 'Sin nombre',
          studentEmail: apt.student_email,
          serviceName: apt.services?.name,
          status: apt.status,
          notes: apt.notes
        }));

      // Separate upcoming and past appointments
      this.upcomingAppointments = allAppointments
        .filter(apt => new Date(apt.date) >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      this.pastAppointments = allAppointments
        .filter(apt => new Date(apt.date) < today)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Add appointments to calendar days
      for (const apt of appointments) {
        const dayIndex = this.calendarDays.findIndex(d => d.date === apt.date);
        if (dayIndex !== -1) {
          this.calendarDays[dayIndex].appointments.push(apt);
        }
      }
    }

    // Load date overrides
    const overrides = await this.supabaseService.getDateOverrides(user.id);
    if (overrides) {
      for (const override of overrides) {
        const dayIndex = this.calendarDays.findIndex(d => d.date === override.date);
        if (dayIndex !== -1) {
          this.calendarDays[dayIndex].hasOverride = true;
          this.calendarDays[dayIndex].isAvailable = override.is_available;
        }
      }
    }
  }

  selectAppointment(apt: Appointment) {
    this.selectedAppointment = apt;
  }

  closeAppointmentDetails() {
    this.selectedAppointment = null;
  }

  previousMonth() {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.generateCalendar();
    this.loadData();
  }

  nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.generateCalendar();
    this.loadData();
  }

  selectDate(day: any) {
    if (!day.isCurrentMonth) return;
    this.newOverride.date = day.date;
    this.showAddOverride = true;
  }

  async saveOverride() {
    const user = await this.supabaseService.getCurrentUser();
    if (!user || !this.newOverride.date) return;

    await this.supabaseService.upsertDateOverride({
      user_id: user.id,
      date: this.newOverride.date,
      is_available: this.newOverride.isAvailable,
      reason: this.newOverride.reason || null
    });

    this.showAddOverride = false;
    this.newOverride = { date: '', isAvailable: false, reason: '' };
    this.generateCalendar();
    await this.loadData();
  }

  formatDay(dateStr: string): string {
    const date = new Date(dateStr);
    return date.getDate().toString();
  }
}
