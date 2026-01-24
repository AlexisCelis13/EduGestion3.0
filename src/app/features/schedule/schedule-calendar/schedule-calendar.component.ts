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

interface Appointment {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    studentName: string;
    serviceName?: string;
    status: string;
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
        <div class="card-premium p-6">
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
                <div class="flex items-center justify-between p-4 rounded-xl border border-surface-100 hover:border-surface-200 transition-colors">
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
                        [class.bg-accent-green]="apt.status === 'confirmed'"
                        [class.bg-opacity-10]="apt.status === 'confirmed'"
                        [class.text-accent-green]="apt.status === 'confirmed'">
                    {{ apt.status === 'pending' ? 'Pendiente' : 'Confirmada' }}
                  </span>
                </div>
              }
            </div>
          }
        </div>
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
    </div>
  `
})
export class ScheduleCalendarComponent implements OnInit {
    weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    currentDate = new Date();
    currentYear = this.currentDate.getFullYear();
    currentMonth = this.currentDate.getMonth();
    currentMonthName = '';
    calendarDays: any[] = [];
    upcomingAppointments: Appointment[] = [];
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
            this.upcomingAppointments = appointments
                .filter(apt => apt.status !== 'cancelled')
                .map(apt => ({
                    id: apt.id,
                    date: apt.date,
                    startTime: apt.start_time,
                    endTime: apt.end_time,
                    studentName: apt.student_name || 'Sin nombre',
                    status: apt.status
                }));

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
