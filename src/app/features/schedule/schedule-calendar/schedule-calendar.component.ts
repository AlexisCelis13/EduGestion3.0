import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  studentId?: string;
  studentName: string;
  studentEmail?: string;
  studentPhone?: string;
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

        <!-- Appointments Table (Spreadsheet Style) -->
        <div class="card-premium overflow-hidden">
          <!-- Tab Headers -->
          <div class="flex border-b border-surface-100">
            <button 
              (click)="activeTab = 'upcoming'" 
              class="flex-1 px-6 py-4 text-sm font-semibold transition-colors relative"
              [class.text-primary-600]="activeTab === 'upcoming'"
              [class.text-surface-500]="activeTab !== 'upcoming'"
              [class.bg-surface-50]="activeTab === 'upcoming'">
              Próximas Citas
              <span class="ml-2 text-xs px-2 py-0.5 rounded-full"
                    [class.bg-primary-100]="activeTab === 'upcoming'"
                    [class.text-primary-700]="activeTab === 'upcoming'"
                    [class.bg-surface-200]="activeTab !== 'upcoming'"
                    [class.text-surface-600]="activeTab !== 'upcoming'">
                {{ upcomingAppointments.length }}
              </span>
              @if (activeTab === 'upcoming') {
                <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"></div>
              }
            </button>
            <button 
              (click)="activeTab = 'past'" 
              class="flex-1 px-6 py-4 text-sm font-semibold transition-colors relative"
              [class.text-primary-600]="activeTab === 'past'"
              [class.text-surface-500]="activeTab !== 'past'"
              [class.bg-surface-50]="activeTab === 'past'">
              Clases Pasadas
              <span class="ml-2 text-xs px-2 py-0.5 rounded-full"
                    [class.bg-primary-100]="activeTab === 'past'"
                    [class.text-primary-700]="activeTab === 'past'"
                    [class.bg-surface-200]="activeTab !== 'past'"
                    [class.text-surface-600]="activeTab !== 'past'">
                {{ pastAppointments.length }}
              </span>
              @if (activeTab === 'past') {
                <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"></div>
              }
            </button>
          </div>

          <!-- Filters Bar -->
          <div class="p-4 bg-surface-50/50 border-b border-surface-100">
            <div class="flex flex-wrap gap-3 items-center">
              <!-- Search Input -->
              <div class="relative flex-1 min-w-[200px]">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text" 
                  [(ngModel)]="searchFilter"
                  placeholder="Buscar por nombre o email..."
                  class="w-full pl-10 pr-4 py-2 text-sm border border-surface-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
              </div>

              <!-- Date Range Filter -->
              <select 
                [(ngModel)]="dateRangeFilter"
                class="px-4 py-2 text-sm border border-surface-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer">
                <option value="all">Todas las fechas</option>
                <option value="today">Hoy</option>
                <option value="week">Esta semana</option>
                <option value="month">Este mes</option>
                <option value="last7">Últimos 7 días</option>
                <option value="last30">Últimos 30 días</option>
              </select>

              <!-- Status Filter -->
              <select 
                [(ngModel)]="statusFilter"
                class="px-4 py-2 text-sm border border-surface-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer">
                <option value="all">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmada</option>
                <option value="scheduled">Programada</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Cancelada</option>
              </select>

              <!-- Clear Filters Button -->
              @if (hasActiveFilters()) {
                <button 
                  (click)="clearFilters()"
                  class="flex items-center gap-1.5 px-3 py-2 text-sm text-surface-600 hover:text-surface-800 hover:bg-surface-100 rounded-xl transition-colors">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Limpiar
                </button>
              }
            </div>

            <!-- Results Count -->
            @if (hasActiveFilters()) {
              <div class="mt-3 text-xs text-surface-500">
                Mostrando {{ getFilteredAppointments().length }} de {{ getActiveAppointments().length }} citas
              </div>
            }
          </div>

          <!-- Table Content -->
          <div class="overflow-x-auto">
            @if (getFilteredAppointments().length === 0) {
              <div class="text-center py-12">
                <div class="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-surface-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <p class="text-surface-400">{{ hasActiveFilters() ? 'No se encontraron citas con los filtros aplicados' : (activeTab === 'upcoming' ? 'No tienes citas programadas' : 'No tienes clases pasadas') }}</p>
                @if (hasActiveFilters()) {
                  <button (click)="clearFilters()" class="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium">Limpiar filtros</button>
                }
              </div>
            } @else {
              <table class="w-full">
                <thead>
                  <tr class="bg-surface-50 border-b border-surface-100">
                    <th class="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Fecha</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Estudiante</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Horario</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">Estado</th>
                    <th class="px-4 py-3 text-center text-xs font-semibold text-surface-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-surface-100">
                  @for (apt of getFilteredAppointments(); track apt.id) {
                    <tr 
                      (click)="selectAppointment(apt)" 
                      class="hover:bg-surface-50 transition-colors cursor-pointer"
                      [class.opacity-60]="activeTab === 'past'">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center gap-3">
                          <div class="w-10 h-10 rounded-lg flex items-center justify-center"
                               [class.bg-primary-50]="activeTab === 'upcoming'"
                               [class.bg-surface-100]="activeTab === 'past'">
                            <span class="text-sm font-bold"
                                  [class.text-primary-600]="activeTab === 'upcoming'"
                                  [class.text-surface-500]="activeTab === 'past'">{{ formatDay(apt.date) }}</span>
                          </div>
                          <span class="text-sm text-surface-600">{{ formatMonth(apt.date) }}</span>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                               [style.background-color]="getAvatarColor(apt.studentName)">
                            {{ apt.studentName.charAt(0).toUpperCase() }}
                          </div>
                          <div>
                            <p class="font-medium text-surface-700">{{ apt.studentName }}</p>
                            @if (apt.studentEmail) {
                              <p class="text-xs text-surface-400">{{ apt.studentEmail }}</p>
                            }
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center gap-2 text-sm text-surface-600">
                          <svg class="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {{ formatTimeRange(apt.startTime, apt.endTime) }}
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                              [class.bg-amber-100]="apt.status === 'pending'"
                              [class.text-amber-700]="apt.status === 'pending'"
                              [class.bg-green-100]="apt.status === 'confirmed' || apt.status === 'scheduled'"
                              [class.text-green-700]="apt.status === 'confirmed' || apt.status === 'scheduled'"
                              [class.bg-surface-100]="apt.status === 'completed' || activeTab === 'past'"
                              [class.text-surface-600]="apt.status === 'completed' || activeTab === 'past'">
                          {{ getStatusLabel(apt.status) }}
                        </span>
                      </td>
                      <!-- Actions Column -->
                      <td class="px-4 py-4 whitespace-nowrap">
                        <div class="flex items-center justify-center gap-1">
                          <!-- View Student Profile -->
                          @if (apt.studentId) {
                            <button 
                              (click)="viewStudentProfile($event, apt.studentId)"
                              class="p-2 rounded-lg text-surface-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                              title="Ver perfil del estudiante">
                              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </button>
                          }
                          
                          <!-- Send WhatsApp -->
                          @if (apt.studentPhone) {
                            <button 
                              (click)="sendWhatsApp($event, apt.studentPhone, apt.studentName)"
                              class="p-2 rounded-lg text-surface-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                              title="Enviar WhatsApp">
                              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                            </button>
                          }
                          
                          <!-- Cancel Appointment (only for upcoming) -->
                          @if (activeTab === 'upcoming' && apt.status !== 'cancelled') {
                            <button 
                              (click)="cancelAppointment($event, apt)"
                              class="p-2 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Cancelar cita">
                              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </div>
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
                  <div (click)="selectAppointmentFromDayDetails(apt)" class="flex items-center gap-4 p-3 rounded-xl border border-surface-100 hover:border-surface-200 transition-colors cursor-pointer hover:bg-surface-50">
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
  openedFromDayDetails = false; // Track if appointment was opened from day details

  // Tab selection for spreadsheet view
  activeTab: 'upcoming' | 'past' = 'upcoming';

  // Filter properties
  searchFilter = '';
  dateRangeFilter = 'all';
  statusFilter = 'all';

  monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) { }

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
          studentId: apt.student_id,
          studentName: apt.student_name || 'Sin nombre',
          studentEmail: apt.student_email,
          studentPhone: apt.student_phone,
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
    this.openedFromDayDetails = false;
  }

  // Contextual Action Methods
  viewStudentProfile(event: Event, studentId: string) {
    event.stopPropagation();
    this.router.navigate(['/dashboard/students'], { queryParams: { student: studentId } });
  }

  sendWhatsApp(event: Event, phone: string, studentName: string) {
    event.stopPropagation();
    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Hola ${studentName}, te escribo respecto a tu cita.`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  }

  async cancelAppointment(event: Event, apt: Appointment) {
    event.stopPropagation();

    const confirmed = confirm(`¿Estás seguro que deseas cancelar la cita con ${apt.studentName} del ${this.formatDateLong(apt.date)}?`);
    if (!confirmed) return;

    try {
      await this.supabaseService.updateAppointmentStatus(apt.id, 'cancelled');
      // Remove from upcoming list
      this.upcomingAppointments = this.upcomingAppointments.filter(a => a.id !== apt.id);
      // Also remove from calendar if present
      for (const day of this.calendarDays) {
        day.appointments = day.appointments.filter((a: any) => a.id !== apt.id);
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Hubo un error al cancelar la cita. Intenta de nuevo.');
    }
  }

  selectAppointmentFromDayDetails(apt: Appointment) {
    this.selectedAppointment = apt;
    this.openedFromDayDetails = true;
    // Hide day details but keep the data so we can return
    this.showDayDetails = false;
  }

  closeAppointmentDetails() {
    this.selectedAppointment = null;
    // If opened from day details, return to day details
    if (this.openedFromDayDetails) {
      this.showDayDetails = true;
      this.openedFromDayDetails = false;
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

  // Helper methods for spreadsheet view
  getActiveAppointments(): Appointment[] {
    return this.activeTab === 'upcoming' ? this.upcomingAppointments : this.pastAppointments;
  }

  getFilteredAppointments(): Appointment[] {
    let appointments = this.getActiveAppointments();

    // Apply search filter
    if (this.searchFilter.trim()) {
      const search = this.searchFilter.toLowerCase().trim();
      appointments = appointments.filter(apt =>
        apt.studentName.toLowerCase().includes(search) ||
        (apt.studentEmail && apt.studentEmail.toLowerCase().includes(search))
      );
    }

    // Apply status filter
    if (this.statusFilter !== 'all') {
      appointments = appointments.filter(apt => apt.status === this.statusFilter);
    }

    // Apply date range filter
    if (this.dateRangeFilter !== 'all') {
      appointments = appointments.filter(apt => this.matchesDateRange(apt.date));
    }

    return appointments;
  }

  matchesDateRange(dateStr: string): boolean {
    const appointmentDate = new Date(dateStr);
    appointmentDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (this.dateRangeFilter) {
      case 'today':
        return appointmentDate.getTime() === today.getTime();

      case 'week': {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return appointmentDate >= startOfWeek && appointmentDate <= endOfWeek;
      }

      case 'month': {
        return appointmentDate.getMonth() === today.getMonth() &&
          appointmentDate.getFullYear() === today.getFullYear();
      }

      case 'last7': {
        const last7Days = new Date(today);
        last7Days.setDate(today.getDate() - 7);
        return appointmentDate >= last7Days && appointmentDate <= today;
      }

      case 'last30': {
        const last30Days = new Date(today);
        last30Days.setDate(today.getDate() - 30);
        return appointmentDate >= last30Days && appointmentDate <= today;
      }

      default:
        return true;
    }
  }

  hasActiveFilters(): boolean {
    return this.searchFilter.trim() !== '' ||
      this.dateRangeFilter !== 'all' ||
      this.statusFilter !== 'all';
  }

  clearFilters(): void {
    this.searchFilter = '';
    this.dateRangeFilter = 'all';
    this.statusFilter = 'all';
  }

  formatMonth(dateStr: string): string {
    const date = new Date(dateStr);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    return adjustedDate.toLocaleDateString('es-MX', { month: 'short' });
  }

  formatTimeRange(startTime: string, endTime: string): string {
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      return `${hours}:${minutes}`;
    };
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Pendiente',
      'confirmed': 'Confirmada',
      'scheduled': 'Confirmada',
      'completed': 'Completada',
      'cancelled': 'Cancelada'
    };
    return labels[status] || (this.activeTab === 'past' ? 'Pasada' : status);
  }

  getAvatarColor(name: string): string {
    const colors = [
      '#6366f1', // indigo
      '#8b5cf6', // violet
      '#ec4899', // pink
      '#f43f5e', // rose
      '#f97316', // orange
      '#14b8a6', // teal
      '#06b6d4', // cyan
      '#3b82f6', // blue
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }
}
