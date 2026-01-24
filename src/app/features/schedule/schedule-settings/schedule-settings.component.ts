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
  dayOfWeek?: number;
  specificDate?: string;
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
                <input
                  type="time"
                  formControlName="dayStartTime"
                  class="input-premium"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-surface-700 mb-2">
                  Fin del día laboral
                </label>
                <input
                  type="time"
                  formControlName="dayEndTime"
                  class="input-premium"
                />
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
                  <div class="flex-1 text-sm text-surface-400">
                    No disponible
                  </div>
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
              <h2 class="text-lg font-semibold text-surface-700">Opciones Avanzadas</h2>
              <p class="text-sm text-surface-400 mt-1">
                Bloquea intervalos específicos dentro de tu horario laboral
              </p>
            </div>
            <svg 
              class="w-5 h-5 text-surface-400 transition-transform duration-200"
              [class.rotate-180]="showAdvancedOptions"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          @if (showAdvancedOptions) {
            <div class="mt-6 pt-6 border-t border-surface-100 animate-fade-in">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-medium text-surface-700">Bloqueos de Tiempo</h3>
                <button 
                  (click)="addTimeBlock()"
                  class="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Agregar bloqueo
                </button>
              </div>

              @if (timeBlocks.length === 0) {
                <div class="text-center py-8 text-surface-400 bg-surface-50 rounded-xl">
                  <svg class="w-12 h-12 mx-auto mb-3 text-surface-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <p class="text-sm">No tienes bloqueos de tiempo configurados</p>
                  <p class="text-xs mt-1">Agrega intervalos donde no puedas atender citas</p>
                </div>
              } @else {
                <div class="space-y-3">
                  @for (block of timeBlocks; track $index) {
                    <div class="p-4 rounded-xl border border-surface-100 hover:border-surface-200 transition-colors">
                      <div class="flex items-start justify-between gap-4">
                        <div class="flex-1 space-y-3">
                          <!-- Time Range -->
                          <div class="flex items-center gap-2">
                            <input
                              type="time"
                              [(ngModel)]="block.startTime"
                              class="input-premium !py-2 !text-sm w-32"
                            />
                            <span class="text-surface-400">a</span>
                            <input
                              type="time"
                              [(ngModel)]="block.endTime"
                              class="input-premium !py-2 !text-sm w-32"
                            />
                          </div>
                          
                          <!-- Reason -->
                          <input
                            type="text"
                            [(ngModel)]="block.reason"
                            placeholder="Razón (ej: Cita médica, almuerzo...)"
                            class="input-premium !py-2 !text-sm"
                          />

                          <!-- Type Selection -->
                          <div class="flex items-center gap-4">
                            <label class="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="radio" 
                                [name]="'blockType' + $index"
                                [checked]="block.isRecurring"
                                (change)="block.isRecurring = true"
                                class="w-4 h-4 text-primary-600"
                              />
                              <span class="text-sm text-surface-600">Recurrente (cada semana)</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="radio" 
                                [name]="'blockType' + $index"
                                [checked]="!block.isRecurring"
                                (change)="block.isRecurring = false"
                                class="w-4 h-4 text-primary-600"
                              />
                              <span class="text-sm text-surface-600">Fecha específica</span>
                            </label>
                          </div>

                          <!-- Day or Date Selection -->
                          @if (block.isRecurring) {
                            <select [(ngModel)]="block.dayOfWeek" class="input-premium !py-2 !text-sm">
                              <option [value]="1">Lunes</option>
                              <option [value]="2">Martes</option>
                              <option [value]="3">Miércoles</option>
                              <option [value]="4">Jueves</option>
                              <option [value]="5">Viernes</option>
                              <option [value]="6">Sábado</option>
                              <option [value]="0">Domingo</option>
                            </select>
                          } @else {
                            <input
                              type="date"
                              [(ngModel)]="block.specificDate"
                              class="input-premium !py-2 !text-sm"
                            />
                          }
                        </div>

                        <!-- Delete Button -->
                        <button 
                          (click)="removeTimeBlock($index)"
                          class="p-2 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

        @if (successMessage()) {
          <div class="mt-4 bg-accent-green/10 border border-accent-green/20 rounded-xl p-4">
            <p class="text-sm text-accent-green">{{ successMessage() }}</p>
          </div>
        }

        @if (errorMessage()) {
          <div class="mt-4 bg-red-50 border border-red-100 rounded-xl p-4">
            <p class="text-sm text-red-600">{{ errorMessage() }}</p>
          </div>
        }
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

  async loadSettings() {
    const user = await this.supabaseService.getCurrentUser();
    if (!user) return;

    // Load availability settings
    const settings = await this.supabaseService.getAvailabilitySettings(user.id);
    if (settings) {
      this.settingsForm.patchValue({
        dayStartTime: settings.day_start_time,
        dayEndTime: settings.day_end_time,
        minSessionDuration: settings.min_session_duration,
        advanceBookingDays: settings.advance_booking_days
      });
    }

    // Load weekly schedule
    const weeklySchedule = await this.supabaseService.getWeeklySchedule(user.id);
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

    // Load time blocks (date overrides with specific times)
    const dateOverrides = await this.supabaseService.getDateOverrides(user.id);
    if (dateOverrides && dateOverrides.length > 0) {
      this.timeBlocks = dateOverrides
        .filter(o => o.start_time && o.end_time)
        .map(o => ({
          id: o.id,
          startTime: o.start_time,
          endTime: o.end_time,
          reason: o.reason || '',
          isRecurring: !o.date || o.date === null,
          dayOfWeek: o.day_of_week,
          specificDate: o.date
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
      isRecurring: false,
      dayOfWeek: 1,
      specificDate: new Date().toISOString().split('T')[0]
    });
  }

  removeTimeBlock(index: number) {
    this.timeBlocks.splice(index, 1);
  }

  async saveSettings() {
    this.saving.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    try {
      const user = await this.supabaseService.getCurrentUser();
      if (!user) {
        this.errorMessage.set('No se encontró el usuario');
        return;
      }

      // Save general settings
      const settingsData = {
        user_id: user.id,
        day_start_time: this.settingsForm.value.dayStartTime,
        day_end_time: this.settingsForm.value.dayEndTime,
        min_session_duration: this.settingsForm.value.minSessionDuration,
        advance_booking_days: this.settingsForm.value.advanceBookingDays
      };

      await this.supabaseService.upsertAvailabilitySettings(settingsData);

      // Save weekly schedule
      for (const slot of this.weeklySlots) {
        await this.supabaseService.upsertWeeklySchedule({
          user_id: user.id,
          day_of_week: slot.dayOfWeek,
          start_time: slot.startTime,
          end_time: slot.endTime,
          is_available: slot.isEnabled
        });
      }

      // Save time blocks using batch method
      const timeBlocksToSave = this.timeBlocks.map(block => ({
        user_id: user.id,
        date: block.isRecurring ? null : block.specificDate,
        day_of_week: block.isRecurring ? block.dayOfWeek : null,
        start_time: block.startTime,
        end_time: block.endTime,
        reason: block.reason || null,
        is_available: false
      }));

      await this.supabaseService.saveTimeBlocks(user.id, timeBlocksToSave);

      this.successMessage.set('Configuración guardada correctamente');
    } catch (error) {
      this.errorMessage.set('Error al guardar la configuración');
      console.error('Error saving settings:', error);
    } finally {
      this.saving.set(false);
    }
  }
}
