import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';

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

interface TimeBlock {
  id: string;
  date: string | null;
  days_of_week: number[] | null;
  start_time: string;
  end_time: string;
  reason: string | null;
  end_date: string | null;
}

interface WeeklySlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
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
          <!-- Action button removed as requested -->
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
              @if (day.isCurrentMonth && !day.isWorkingDay) {
                <!-- Non-working day: gray, non-clickable -->
                <div class="min-h-24 p-2 border-b border-r border-surface-100 bg-surface-100 relative">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-sm font-medium text-surface-400">{{ day.dayNumber }}</span>
                  </div>
                  <p class="text-xs text-surface-400 italic">No laboral</p>
                </div>
              } @else {
                <div 
                  class="min-h-24 p-2 border-b border-r border-surface-100 cursor-pointer hover:bg-surface-50 transition-colors relative"
                  [class.bg-surface-50]="!day.isCurrentMonth"
                  [class.opacity-50]="!day.isCurrentMonth"
                  [class.bg-orange-50]="day.isCurrentMonth && day.hasTimeBlock"
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
                    <!-- Block indicator (orange dot for time blocks) -->
                    @if (day.hasTimeBlock) {
                      <span class="w-2 h-2 rounded-full bg-orange-400" title="Bloqueo de tiempo"></span>
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

      <!-- Day Details Modal (View Appointments) -->
      @if (showDayDetails) {
        <div class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="fixed inset-0 bg-surface-900/60 backdrop-blur-sm" (click)="closeDayDetails()"></div>
          <div class="relative bg-white rounded-2xl shadow-premium-lg p-6 w-full max-w-md mx-4 animate-fade-in-up">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-lg font-semibold text-surface-700">Citas del {{ formatDateLong(selectedDayDate) }}</h3>
              <button (click)="closeDayDetails()" class="text-surface-400 hover:text-surface-600">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <!-- Working Hours Info -->
            @if (selectedDayWorkingHours) {
              <div class="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <div class="flex items-center gap-2">
                  <span class="text-blue-500">🕐</span>
                  <span class="text-sm font-medium text-blue-700">Horario laboral:</span>
                  <span class="text-sm text-blue-600">{{ selectedDayWorkingHours }}</span>
                </div>
              </div>
            }

            <!-- Time Block Info -->
            @if (selectedDayBlocks.length > 0) {
              <div class="mb-4 p-3 bg-orange-50 rounded-xl border border-orange-200">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-orange-500">⏰</span>
                  <span class="text-sm font-medium text-orange-700">Bloqueos de tiempo</span>
                </div>
                @for (block of selectedDayBlocks; track block.id) {
                  <div class="text-xs text-orange-600 mt-1">
                    {{ block.start_time.substring(0,5) }} - {{ block.end_time.substring(0,5) }}
                    @if (block.reason) {
                      <span class="text-orange-500"> · {{ block.reason }}</span>
                    }
                  </div>
                }
              </div>
            }

            @if (selectedDayAppointments.length === 0) {
              <div class="text-center py-8">
                <div class="w-12 h-12 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-3">
                   <svg class="w-6 h-6 text-surface-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <p class="text-surface-500 font-medium">Sin citas programadas</p>
                <p class="text-sm text-surface-400 mt-1">Este día está libre.</p>
              </div>
            } @else {
              <div class="space-y-3">
                @for (apt of selectedDayAppointments; track apt.id) {
                  <div (click)="selectAppointment(apt); closeDayDetails()" class="flex items-center gap-4 p-3 rounded-xl border border-surface-100 hover:border-surface-200 transition-colors cursor-pointer hover:bg-surface-50">
                    <div class="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-700 font-semibold text-xs flex-col">
                       <span>{{ apt.startTime }}</span>
                    </div>
                    <div>
                      <p class="font-medium text-surface-700">{{ apt.studentName }}</p>
                      <p class="text-xs text-surface-400">{{ apt.startTime }} - {{ apt.endTime }}</p>
                    </div>
                    @if (apt.status === 'scheduled') {
                        <span class="ml-auto w-2 h-2 rounded-full bg-accent-green"></span>
                    }
                  </div>
                }
              </div>
            }

            <div class="mt-6 pt-4 border-t border-surface-100 flex justify-end">
              <button (click)="closeDayDetails()" class="btn-secondary">Cerrar</button>
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
  timeBlocks: TimeBlock[] = [];
  weeklySchedule: WeeklySlot[] = [];

  // Day Details Modal
  showDayDetails = false;
  selectedDayDate = '';
  selectedDayAppointments: Appointment[] = [];
  selectedDayBlocks: TimeBlock[] = [];
  selectedDayWorkingHours = '';

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
        appointments: [],
        hasTimeBlock: false,
        isFullDayBlocked: false,
        timeBlocks: [],
        isWorkingDay: true,
        workingHours: null
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
        appointments: [],
        hasTimeBlock: false,
        isFullDayBlocked: false,
        timeBlocks: [],
        isWorkingDay: true,
        workingHours: null
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
        appointments: [],
        hasTimeBlock: false,
        isFullDayBlocked: false,
        timeBlocks: [],
        isWorkingDay: true,
        workingHours: null
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

    // Load time blocks
    const overrides = await this.supabaseService.getDateOverrides(user.id);
    if (overrides) {
      this.timeBlocks = overrides;
      this.applyTimeBlocksToCalendar();
    }

    // Load weekly schedule
    const schedule = await this.supabaseService.getWeeklySchedule(user.id);
    if (schedule) {
      this.weeklySchedule = schedule;
      this.applyWeeklyScheduleToCalendar();
    }
  }

  applyWeeklyScheduleToCalendar() {
    for (const day of this.calendarDays) {
      if (!day.isCurrentMonth || !day.date) {
        day.isWorkingDay = true; // Default for non-current month days
        continue;
      }

      // Parse date as local time (not UTC) to get correct day of week
      const [year, month, dayNum] = day.date.split('-').map(Number);
      const dayDate = new Date(year, month - 1, dayNum);
      const dayOfWeek = dayDate.getDay();

      const slot = this.weeklySchedule.find(s => s.day_of_week === dayOfWeek);
      day.isWorkingDay = slot?.is_available ?? false;
      day.workingHours = slot ? { start: slot.start_time, end: slot.end_time } : null;
    }
  }

  applyTimeBlocksToCalendar() {
    for (const day of this.calendarDays) {
      if (!day.isCurrentMonth || !day.date) continue;

      // Parse date as local time (not UTC) to get correct day of week
      const [year, month, dayNum] = day.date.split('-').map(Number);
      const dayDate = new Date(year, month - 1, dayNum);
      const dayOfWeek = dayDate.getDay();
      const blocksForDay: TimeBlock[] = [];

      for (const block of this.timeBlocks) {
        // Check if block applies to this day
        let applies = false;

        if (block.date) {
          // Specific date block
          applies = block.date === day.date;
        } else if (block.days_of_week && block.days_of_week.includes(dayOfWeek)) {
          // Recurring block - check if within end_date
          if (block.end_date) {
            applies = dayDate <= new Date(block.end_date);
          } else {
            applies = true;
          }
        }

        if (applies) {
          blocksForDay.push(block);
        }
      }

      day.timeBlocks = blocksForDay;
      day.hasTimeBlock = blocksForDay.length > 0;

      // Check if full day blocked (block covers 00:00-23:59 or similar)
      day.isFullDayBlocked = blocksForDay.some(b =>
        b.start_time <= '00:30:00' && b.end_time >= '23:00:00'
      );
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

    this.selectedDayDate = day.date;
    // Map the raw appointments to the Appointment interface if needed, 
    // but looking at loadData, day.appointments contains raw Supabase data, 
    // so we should map them to consistent Appointment interface for the modal
    this.selectedDayAppointments = day.appointments.map((apt: any) => ({
      id: apt.id,
      date: apt.date,
      startTime: apt.start_time,
      endTime: apt.end_time,
      studentName: apt.student_name || 'Sin nombre',
      studentEmail: apt.student_email,
      serviceName: apt.services?.name,
      status: apt.status,
      notes: apt.notes
    })).sort((a: Appointment, b: Appointment) => a.startTime.localeCompare(b.startTime));

    // Get time blocks for selected day
    this.selectedDayBlocks = day.timeBlocks || [];

    // Get working hours for the selected day
    if (day.workingHours) {
      const startFormatted = this.formatTimeDisplay(day.workingHours.start);
      const endFormatted = this.formatTimeDisplay(day.workingHours.end);
      this.selectedDayWorkingHours = `${startFormatted} - ${endFormatted}`;
    } else {
      this.selectedDayWorkingHours = '';
    }

    this.showDayDetails = true;
  }

  formatTimeDisplay(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }

  closeDayDetails() {
    this.showDayDetails = false;
    this.selectedDayAppointments = [];
  }

  formatDay(dateStr: string): string {
    const date = new Date(dateStr);
    return date.getDate().toString();
  }

  formatDateLong(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    // Adjust for timezone offset to ensure correct day is shown
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);

    return adjustedDate.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
