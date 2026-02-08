import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';

interface WeeklySlot {
  dayOfWeek: number;
  dayName: string;
  isEnabled: boolean;
  startTime: string;
  endTime: string;
}

interface TimeBlock {
  id?: string;
  startTime: string;
  endTime: string;
  reason: string;
  isRecurring: boolean;
  daysOfWeek: number[];
  specificDate?: string;
  endType: 'never' | 'weeks' | 'date';
  endWeeks?: number;
  endDate?: string;
  isFullDay: boolean;
}

@Component({
  selector: 'app-schedule-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="min-h-screen">
      <div class="max-w-4xl mx-auto px-6 lg:px-8 py-8">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-2xl font-semibold text-surface-700">Configuración de Horarios</h1>
          <p class="text-surface-400 mt-1">
            Configura tu disponibilidad para que tus alumnos puedan agendar asesorías
          </p>
        </div>

        <!-- General Settings Card -->
        <div class="card-premium p-6 mb-6">
          <h2 class="text-lg font-semibold text-surface-700 mb-6">Configuración General</h2>
          
          <form [formGroup]="settingsForm" class="space-y-5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label class="block text-sm font-medium text-surface-700 mb-2">
                  Inicio del día laboral
                </label>
                <input type="time" formControlName="dayStartTime" class="input-premium" />
              </div>
              <div>
                <label class="block text-sm font-medium text-surface-700 mb-2">
                  Fin del día laboral
                </label>
                <input type="time" formControlName="dayEndTime" class="input-premium" />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label class="block text-sm font-medium text-surface-700 mb-2">
                  Duración mínima de sesión (minutos)
                </label>
                <select formControlName="minSessionDuration" class="input-premium">
                  <option value="30">30 minutos</option>
                  <option value="45">45 minutos</option>
                  <option value="60">60 minutos</option>
                  <option value="90">90 minutos</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-surface-700 mb-2">
                  Días de antelación para agendar
                </label>
                <select formControlName="advanceBookingDays" class="input-premium">
                  <option value="7">1 semana</option>
                  <option value="14">2 semanas</option>
                  <option value="30">1 mes</option>
                  <option value="60">2 meses</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        <!-- Weekly Schedule Card -->
        <div class="card-premium p-6 mb-6">
          <h2 class="text-lg font-semibold text-surface-700 mb-6">Horario Semanal</h2>
          <p class="text-sm text-surface-400 mb-6">
            Configura tu horario de trabajo regular para cada día de la semana
          </p>
          
          <div class="space-y-4">
            @for (slot of weeklySlots; track slot.dayOfWeek) {
              <div class="flex items-center gap-4 p-4 rounded-xl border border-surface-100 hover:border-surface-200 transition-colors"
                   [class.bg-surface-50]="!slot.isEnabled"
                   [class.opacity-60]="!slot.isEnabled">
                <div class="w-28">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      [checked]="slot.isEnabled"
                      (change)="toggleDay(slot.dayOfWeek)"
                      class="w-5 h-5 text-primary-600 border-surface-300 rounded focus:ring-primary-500"
                    />
                    <span class="text-sm font-medium text-surface-700">{{ slot.dayName }}</span>
                  </label>
                </div>
                
                @if (slot.isEnabled) {
                  <div class="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      [value]="slot.startTime"
                      (change)="updateSlotTime(slot.dayOfWeek, 'start', $event)"
                      class="input-premium !py-2 !text-sm"
                    />
                    <span class="text-surface-400">a</span>
                    <input
                      type="time"
                      [value]="slot.endTime"
                      (change)="updateSlotTime(slot.dayOfWeek, 'end', $event)"
                      class="input-premium !py-2 !text-sm"
                    />
                  </div>
                } @else {
                  <div class="flex-1 text-sm text-surface-400">No disponible</div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Advanced Options - Time Blocks -->
        <div class="card-premium p-6 mb-6">
          <button 
            (click)="showAdvancedOptions = !showAdvancedOptions"
            class="flex items-center justify-between w-full text-left">
            <div>
              <h2 class="text-lg font-semibold text-surface-700">Bloqueos de Tiempo</h2>
              <p class="text-sm text-surface-400 mt-1">
                Bloquea intervalos específicos dentro de tu horario laboral
              </p>
            </div>
            <svg 
              class="w-5 h-5 text-surface-400 transition-transform duration-200"
              [class.rotate-180]="showAdvancedOptions"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          @if (showAdvancedOptions) {
            <div class="mt-6 pt-6 border-t border-surface-100 animate-fade-in">
              <div class="flex items-center justify-between mb-4">
                <span class="text-sm text-surface-500">{{ timeBlocks.length }} bloqueo(s) configurado(s)</span>
                <button 
                  (click)="addTimeBlock()"
                  class="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Agregar bloqueo
                </button>
              </div>

              @if (timeBlocks.length === 0) {
                <div class="text-center py-8 text-surface-400 bg-surface-50 rounded-xl">
                  <svg class="w-12 h-12 mx-auto mb-3 text-surface-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <p class="text-sm">No tienes bloqueos de tiempo configurados</p>
                  <p class="text-xs mt-1">Agrega intervalos donde no puedas atender citas</p>
                </div>
              } @else {
                <div class="space-y-4">
                  @for (block of timeBlocks; track block; let i = $index) {
                    <div class="p-5 rounded-xl border border-surface-100 hover:border-surface-200 transition-colors bg-white">
                      <div class="flex items-start justify-between gap-4">
                        <div class="flex-1 space-y-4">
                          <!-- Time Range + Full Day Toggle -->
                          <div class="flex flex-wrap items-center gap-3">
                            <div class="flex items-center gap-2">
                              <span class="text-sm text-surface-500">De</span>
                              <input
                                type="time"
                                [(ngModel)]="block.startTime"
                                [disabled]="block.isFullDay"
                                class="input-premium !py-2 !text-sm"
                                [class.opacity-50]="block.isFullDay"
                                [class.cursor-not-allowed]="block.isFullDay"
                              />
                            </div>
                            <div class="flex items-center gap-2">
                              <span class="text-sm text-surface-500">a</span>
                              <input
                                type="time"
                                [(ngModel)]="block.endTime"
                                [disabled]="block.isFullDay"
                                class="input-premium !py-2 !text-sm"
                                [class.opacity-50]="block.isFullDay"
                                [class.cursor-not-allowed]="block.isFullDay"
                              />
                            </div>
                            <!-- Only show "Todo el día" for specific dates OR recurring with end date -->
                            @if (!block.isRecurring || block.endType !== 'never') {
                              <label class="flex items-center gap-2 cursor-pointer ml-4">
                                <input 
                                  type="checkbox" 
                                  [(ngModel)]="block.isFullDay"
                                  (change)="onFullDayToggle(block)"
                                  class="w-4 h-4 text-red-600 border-surface-300 rounded focus:ring-red-500"
                                />
                                <span class="text-sm text-surface-600">Todo el día</span>
                              </label>
                            }
                          </div>
                          <!-- Invalid time range warning -->
                          @if (!block.isFullDay && block.startTime >= block.endTime) {
                            <p class="text-xs text-red-500">⚠️ La hora de inicio debe ser anterior a la hora de fin</p>
                          }
                          
                          <!-- Reason -->
                          <input
                            type="text"
                            [(ngModel)]="block.reason"
                            placeholder="Razón (ej: Reunión, almuerzo, cita médica...)"
                            class="input-premium !py-2 !text-sm w-full"
                          />

                          <!-- Type Selection -->
                          <div class="flex items-center gap-4">
                            <label class="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="radio" 
                                [name]="'blockType' + i"
                                [checked]="block.isRecurring"
                                (change)="block.isRecurring = true"
                                class="w-4 h-4 text-primary-600"
                              />
                              <span class="text-sm text-surface-600">Se repite cada semana</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="radio" 
                                [name]="'blockType' + i"
                                [checked]="!block.isRecurring"
                                (change)="block.isRecurring = false"
                                class="w-4 h-4 text-primary-600"
                              />
                              <span class="text-sm text-surface-600">Fecha específica</span>
                            </label>
                          </div>

                          <!-- Day Selection or Date Picker -->
                          @if (block.isRecurring) {
                            <div class="space-y-3">
                              <!-- Multi-day Selection -->
                              <div>
                                <label class="block text-sm font-medium text-surface-600 mb-2">Repetir cada semana en:</label>
                                @if (block.daysOfWeek.length === 0) {
                                  <p class="text-xs text-red-500 mb-2">⚠️ Selecciona al menos un día</p>
                                }
                                <div class="flex gap-1.5">
                                  <button
                                    type="button"
                                    (click)="toggleDayInBlock(i, 0)"
                                    class="w-10 h-10 rounded-lg text-sm font-medium transition-all duration-150"
                                    [class.bg-primary-600]="isDaySelected(block, 0)"
                                    [class.text-white]="isDaySelected(block, 0)"
                                    [class.bg-surface-100]="!isDaySelected(block, 0)"
                                    [class.text-surface-600]="!isDaySelected(block, 0)">
                                    D
                                  </button>
                                  <button
                                    type="button"
                                    (click)="toggleDayInBlock(i, 1)"
                                    class="w-10 h-10 rounded-lg text-sm font-medium transition-all duration-150"
                                    [class.bg-primary-600]="isDaySelected(block, 1)"
                                    [class.text-white]="isDaySelected(block, 1)"
                                    [class.bg-surface-100]="!isDaySelected(block, 1)"
                                    [class.text-surface-600]="!isDaySelected(block, 1)">
                                    L
                                  </button>
                                  <button
                                    type="button"
                                    (click)="toggleDayInBlock(i, 2)"
                                    class="w-10 h-10 rounded-lg text-sm font-medium transition-all duration-150"
                                    [class.bg-primary-600]="isDaySelected(block, 2)"
                                    [class.text-white]="isDaySelected(block, 2)"
                                    [class.bg-surface-100]="!isDaySelected(block, 2)"
                                    [class.text-surface-600]="!isDaySelected(block, 2)">
                                    M
                                  </button>
                                  <button
                                    type="button"
                                    (click)="toggleDayInBlock(i, 3)"
                                    class="w-10 h-10 rounded-lg text-sm font-medium transition-all duration-150"
                                    [class.bg-primary-600]="isDaySelected(block, 3)"
                                    [class.text-white]="isDaySelected(block, 3)"
                                    [class.bg-surface-100]="!isDaySelected(block, 3)"
                                    [class.text-surface-600]="!isDaySelected(block, 3)">
                                    X
                                  </button>
                                  <button
                                    type="button"
                                    (click)="toggleDayInBlock(i, 4)"
                                    class="w-10 h-10 rounded-lg text-sm font-medium transition-all duration-150"
                                    [class.bg-primary-600]="isDaySelected(block, 4)"
                                    [class.text-white]="isDaySelected(block, 4)"
                                    [class.bg-surface-100]="!isDaySelected(block, 4)"
                                    [class.text-surface-600]="!isDaySelected(block, 4)">
                                    J
                                  </button>
                                  <button
                                    type="button"
                                    (click)="toggleDayInBlock(i, 5)"
                                    class="w-10 h-10 rounded-lg text-sm font-medium transition-all duration-150"
                                    [class.bg-primary-600]="isDaySelected(block, 5)"
                                    [class.text-white]="isDaySelected(block, 5)"
                                    [class.bg-surface-100]="!isDaySelected(block, 5)"
                                    [class.text-surface-600]="!isDaySelected(block, 5)">
                                    V
                                  </button>
                                  <button
                                    type="button"
                                    (click)="toggleDayInBlock(i, 6)"
                                    class="w-10 h-10 rounded-lg text-sm font-medium transition-all duration-150"
                                    [class.bg-primary-600]="isDaySelected(block, 6)"
                                    [class.text-white]="isDaySelected(block, 6)"
                                    [class.bg-surface-100]="!isDaySelected(block, 6)"
                                    [class.text-surface-600]="!isDaySelected(block, 6)">
                                    S
                                  </button>
                                </div>
                              </div>

                              <!-- End Options -->
                              <div class="space-y-2">
                                <label class="block text-sm font-medium text-surface-600">Termina en:</label>
                                <div class="flex flex-wrap items-center gap-3">
                                  <label class="flex items-center gap-2 cursor-pointer">
                                    <input 
                                      type="radio" 
                                      [name]="'endType' + i"
                                      [checked]="block.endType === 'never'"
                                      (change)="setEndType(i, 'never')"
                                      class="w-4 h-4 text-primary-600"
                                    />
                                    <span class="text-sm text-surface-600">Nunca</span>
                                  </label>
                                  <label class="flex items-center gap-2 cursor-pointer">
                                    <input 
                                      type="radio" 
                                      [name]="'endType' + i"
                                      [checked]="block.endType === 'weeks'"
                                      (change)="setEndType(i, 'weeks')"
                                      class="w-4 h-4 text-primary-600"
                                    />
                                    <span class="text-sm text-surface-600">Después de</span>
                                  </label>
                                  @if (block.endType === 'weeks') {
                                    <select 
                                      [(ngModel)]="block.endWeeks"
                                      class="input-premium !py-1.5 !text-sm !w-20">
                                      @for (w of weekOptions; track w) {
                                        <option [value]="w">{{ w }}</option>
                                      }
                                    </select>
                                    <span class="text-sm text-surface-600">semanas</span>
                                  }
                                  <label class="flex items-center gap-2 cursor-pointer">
                                    <input 
                                      type="radio" 
                                      [name]="'endType' + i"
                                      [checked]="block.endType === 'date'"
                                      (change)="setEndType(i, 'date')"
                                      class="w-4 h-4 text-primary-600"
                                    />
                                    <span class="text-sm text-surface-600">Fecha</span>
                                  </label>
                                  @if (block.endType === 'date') {
                                    <input
                                      type="date"
                                      [(ngModel)]="block.endDate"
                                      class="input-premium !py-1.5 !text-sm !w-40"
                                    />
                                  }
                                </div>
                              </div>
                            </div>
                          } @else {
                            <div>
                              <label class="block text-sm font-medium text-surface-600 mb-2">Fecha:</label>
                              <input
                                type="date"
                                [(ngModel)]="block.specificDate"
                                class="input-premium !py-2 !text-sm !w-44"
                              />
                            </div>
                          }
                        </div>

                        <!-- Delete Button -->
                        <button 
                          (click)="removeTimeBlock(i)"
                          class="p-2 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>

        <!-- Messages (above save button) -->
        @if (successMessage()) {
          <div class="mb-4 bg-accent-green/10 border border-accent-green/20 rounded-xl p-4">
            <p class="text-sm text-accent-green">✓ {{ successMessage() }}</p>
          </div>
        }

        @if (errorMessage()) {
          <div class="mb-4 bg-red-50 border border-red-100 rounded-xl p-4">
            <p class="text-sm text-red-600">⚠️ {{ errorMessage() }}</p>
          </div>
        }

        <!-- Save Button -->
        <div class="flex justify-end gap-3">
          <button 
            (click)="saveSettings()"
            [disabled]="saving()"
            class="btn-premium disabled:opacity-50 disabled:cursor-not-allowed">
            @if (saving()) {
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Guardando...
            } @else {
              Guardar Configuración
            }
          </button>
        </div>
      </div>
    </div>
  `
})
export class ScheduleSettingsComponent implements OnInit {
  settingsForm: FormGroup;
  saving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  showAdvancedOptions = false;

  hours12 = ['12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'];
  minutes = ['00', '15', '30', '45'];
  weekOptions = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12];

  weeklySlots: WeeklySlot[] = [
    { dayOfWeek: 1, dayName: 'Lunes', isEnabled: true, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 2, dayName: 'Martes', isEnabled: true, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 3, dayName: 'Miércoles', isEnabled: true, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 4, dayName: 'Jueves', isEnabled: true, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 5, dayName: 'Viernes', isEnabled: true, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 6, dayName: 'Sábado', isEnabled: false, startTime: '10:00', endTime: '14:00' },
    { dayOfWeek: 0, dayName: 'Domingo', isEnabled: false, startTime: '10:00', endTime: '14:00' }
  ];

  timeBlocks: TimeBlock[] = [];

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService
  ) {
    this.settingsForm = this.fb.group({
      dayStartTime: ['08:00', Validators.required],
      dayEndTime: ['22:00', Validators.required],
      minSessionDuration: [30, Validators.required],
      advanceBookingDays: [30, Validators.required]
    });
  }

  async ngOnInit() {
    await this.loadSettings();
  }

  // Time conversion helpers
  getHour12(time24: string): string {
    const [h] = time24.split(':');
    let hour = parseInt(h, 10);
    if (hour === 0) hour = 12;
    else if (hour > 12) hour -= 12;
    return hour.toString().padStart(2, '0');
  }

  getMinute(time24: string): string {
    const [, m] = time24.split(':');
    return m || '00';
  }

  getAmPm(time24: string): string {
    const [h] = time24.split(':');
    return parseInt(h, 10) >= 12 ? 'PM' : 'AM';
  }

  setTime(blockIndex: number, field: 'start' | 'end', part: 'hour' | 'minute' | 'ampm', value: string) {
    const block = this.timeBlocks[blockIndex];
    const currentTime = field === 'start' ? block.startTime : block.endTime;
    const [currentH, currentM] = currentTime.split(':');

    let hour = parseInt(currentH, 10);
    let minute = currentM || '00';
    let isPm = hour >= 12;

    if (part === 'hour') {
      const newHour = parseInt(value, 10);
      if (isPm) {
        hour = newHour === 12 ? 12 : newHour + 12;
      } else {
        hour = newHour === 12 ? 0 : newHour;
      }
    } else if (part === 'minute') {
      minute = value;
    } else if (part === 'ampm') {
      const hour12 = hour % 12 || 12;
      if (value === 'PM') {
        hour = hour12 === 12 ? 12 : hour12 + 12;
      } else {
        hour = hour12 === 12 ? 0 : hour12;
      }
    }

    const newTime = `${hour.toString().padStart(2, '0')}:${minute}`;
    if (field === 'start') {
      block.startTime = newTime;
    } else {
      block.endTime = newTime;
    }
  }

  isDaySelected(block: TimeBlock, day: number): boolean {
    return block.daysOfWeek.includes(day);
  }

  async loadSettings() {
    const user = await this.supabaseService.getCurrentUser();
    if (!user) return;

    // Load all data in parallel
    const [settings, weeklySchedule, dateOverrides] = await Promise.all([
      this.supabaseService.getAvailabilitySettings(user.id),
      this.supabaseService.getWeeklySchedule(user.id),
      this.supabaseService.getDateOverrides(user.id)
    ]);

    if (settings) {
      this.settingsForm.patchValue({
        dayStartTime: settings.day_start_time,
        dayEndTime: settings.day_end_time,
        minSessionDuration: settings.min_session_duration,
        advanceBookingDays: settings.advance_booking_days
      });
    }

    if (weeklySchedule && weeklySchedule.length > 0) {
      this.weeklySlots = this.weeklySlots.map(slot => {
        const saved = weeklySchedule.find(s => s.day_of_week === slot.dayOfWeek);
        if (saved) {
          return {
            ...slot,
            isEnabled: saved.is_available,
            startTime: saved.start_time,
            endTime: saved.end_time
          };
        }
        return slot;
      });
    }

    if (dateOverrides && dateOverrides.length > 0) {
      this.timeBlocks = dateOverrides
        .filter(o => o.start_time && o.end_time)
        .map(o => ({
          id: o.id,
          startTime: o.start_time,
          endTime: o.end_time,
          reason: o.reason || '',
          isRecurring: !o.date,
          daysOfWeek: o.days_of_week || (o.day_of_week !== null ? [o.day_of_week] : []),
          specificDate: o.date,
          endType: o.end_date ? 'date' : 'never' as 'never' | 'weeks' | 'date',
          endWeeks: 4,
          endDate: o.end_date,
          isFullDay: o.start_time <= '00:30:00' && o.end_time >= '23:00:00'
        }));
    }
  }

  toggleDay(dayOfWeek: number) {
    const slot = this.weeklySlots.find(s => s.dayOfWeek === dayOfWeek);
    if (slot) {
      slot.isEnabled = !slot.isEnabled;
    }
  }

  updateSlotTime(dayOfWeek: number, type: 'start' | 'end', event: Event) {
    const input = event.target as HTMLInputElement;
    const slot = this.weeklySlots.find(s => s.dayOfWeek === dayOfWeek);
    if (slot) {
      if (type === 'start') {
        slot.startTime = input.value;
      } else {
        slot.endTime = input.value;
      }
    }
  }

  addTimeBlock() {
    this.timeBlocks.push({
      startTime: '12:00',
      endTime: '13:00',
      reason: '',
      isRecurring: true,
      daysOfWeek: [],
      specificDate: new Date().toISOString().split('T')[0],
      endType: 'never',
      endWeeks: 4,
      endDate: undefined,
      isFullDay: false
    });
    this.showAdvancedOptions = true;
  }

  onFullDayToggle(block: TimeBlock) {
    if (block.isFullDay) {
      block.startTime = '00:00';
      block.endTime = '23:59';
    }
  }

  removeTimeBlock(index: number) {
    this.timeBlocks.splice(index, 1);
  }

  toggleDayInBlock(blockIndex: number, dayValue: number) {
    const block = this.timeBlocks[blockIndex];
    const idx = block.daysOfWeek.indexOf(dayValue);
    if (idx === -1) {
      block.daysOfWeek = [...block.daysOfWeek, dayValue].sort((a, b) => a - b);
    } else {
      block.daysOfWeek = block.daysOfWeek.filter(d => d !== dayValue);
    }
  }

  setEndType(blockIndex: number, type: 'never' | 'weeks' | 'date') {
    const block = this.timeBlocks[blockIndex];
    block.endType = type;
    if (type === 'weeks' && !block.endWeeks) {
      block.endWeeks = 4;
    }
    if (type === 'date' && !block.endDate) {
      const date = new Date();
      date.setMonth(date.getMonth() + 1);
      block.endDate = date.toISOString().split('T')[0];
    }
  }

  calculateEndDate(weeks: number): string {
    const date = new Date();
    date.setDate(date.getDate() + (weeks * 7));
    return date.toISOString().split('T')[0];
  }

  async saveSettings() {
    this.saving.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    try {
      // Validate time blocks have valid time ranges
      const invalidTimeRanges = this.timeBlocks.filter(b => !b.isFullDay && b.startTime >= b.endTime);
      if (invalidTimeRanges.length > 0) {
        this.errorMessage.set('La hora de inicio debe ser anterior a la hora de fin en los bloqueos de tiempo');
        this.saving.set(false);
        return;
      }

      // Validate recurring blocks have at least one day selected
      const invalidBlocks = this.timeBlocks.filter(b => b.isRecurring && b.daysOfWeek.length === 0);
      if (invalidBlocks.length > 0) {
        this.errorMessage.set('Los bloqueos recurrentes deben tener al menos un día seleccionado');
        this.saving.set(false);
        return;
      }

      const user = await this.supabaseService.getCurrentUser();
      if (!user) {
        this.errorMessage.set('No se encontró el usuario');
        return;
      }

      const settingsData = {
        user_id: user.id,
        day_start_time: this.settingsForm.value.dayStartTime,
        day_end_time: this.settingsForm.value.dayEndTime,
        min_session_duration: this.settingsForm.value.minSessionDuration,
        advance_booking_days: this.settingsForm.value.advanceBookingDays
      };

      await this.supabaseService.upsertAvailabilitySettings(settingsData);

      for (const slot of this.weeklySlots) {
        await this.supabaseService.upsertWeeklySchedule({
          user_id: user.id,
          day_of_week: slot.dayOfWeek,
          start_time: slot.startTime,
          end_time: slot.endTime,
          is_available: slot.isEnabled
        });
      }

      const timeBlocksToSave = this.timeBlocks.map(block => {
        let endDate: string | null = null;
        if (block.isRecurring) {
          if (block.endType === 'weeks' && block.endWeeks) {
            endDate = this.calculateEndDate(block.endWeeks);
          } else if (block.endType === 'date' && block.endDate) {
            endDate = block.endDate;
          }
        }

        return {
          user_id: user.id,
          date: block.isRecurring ? null : block.specificDate,
          days_of_week: block.isRecurring ? block.daysOfWeek : null,
          start_time: block.startTime,
          end_time: block.endTime,
          reason: block.reason || null,
          is_available: false,
          end_date: endDate
        };
      });

      await this.supabaseService.saveTimeBlocks(user.id, timeBlocksToSave);

      // Sync onboarding progress
      await this.supabaseService.updateOnboardingStep(user.id, 'schedule', true);

      this.successMessage.set('Configuración guardada correctamente');
    } catch (error) {
      this.errorMessage.set('Error al guardar la configuración');
      console.error('Error saving settings:', error);
    } finally {
      this.saving.set(false);
    }
  }
}
