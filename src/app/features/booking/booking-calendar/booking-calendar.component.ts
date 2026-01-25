import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ChevronLeft, ChevronRight } from 'lucide-angular';

@Component({
  selector: 'app-booking-calendar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  providers: [{ provide: 'LUCIDE_ICONS', useValue: { ChevronLeft, ChevronRight } }],
  template: `
    <div class="calendar-container bg-white rounded-lg shadow-sm border border-gray-200">
      <!-- Header del calendario -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 class="font-medium text-gray-900">{{ currentMonthName }} {{ currentYear }}</h3>
        <div class="flex items-center gap-2">
          <button 
            (click)="previousMonth()" 
            class="p-1 hover:bg-gray-100 rounded-full transition-colors"
            [disabled]="isPreviousMonthDisabled()">
            <i-lucide name="chevron-left" class="w-5 h-5 text-gray-600"></i-lucide>
          </button>
          <button 
            (click)="nextMonth()" 
            class="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <i-lucide name="chevron-right" class="w-5 h-5 text-gray-600"></i-lucide>
          </button>
        </div>
      </div>

      <!-- Grid de días -->
      <div class="p-4">
        <!-- Nombres de días -->
        <div class="grid grid-cols-7 mb-2 text-center">
          <span *ngFor="let day of weekDays" class="text-xs font-medium text-gray-500 py-1">
            {{ day }}
          </span>
        </div>

        <!-- Días del mes -->
        <div class="grid grid-cols-7 gap-1">
          <div *ngFor="let day of calendarDays" 
               [class.invisible]="day.isEmpty">
            <button 
              *ngIf="!day.isEmpty"
              (click)="selectDate(day)"
              [disabled]="day.isDisabled"
              [class.bg-blue-600]="day.isSelected"
              [class.text-white]="day.isSelected"
              [class.hover:bg-blue-50]="!day.isSelected && !day.isDisabled"
              [class.text-gray-900]="!day.isSelected && !day.isDisabled"
              [class.text-gray-300]="day.isDisabled"
              [class.cursor-not-allowed]="day.isDisabled"
              class="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm transition-colors mx-auto relative group">
              
              {{ day.dayNumber }}
              
              <!-- Indicador de hoy -->
              <span *ngIf="day.isToday && !day.isSelected" 
                    class="absolute bottom-1 w-1 h-1 bg-blue-600 rounded-full"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class BookingCalendarComponent {
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;

  @Input() tutorId: string = '';
  @Output() dateSelected = new EventEmitter<string>();

  currentDate = new Date();
  selectedDate: Date | null = null;

  weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  calendarDays: any[] = [];

  // Mes que se está visualizando
  viewDate = new Date();

  ngOnInit() {
    this.generateCalendar();
  }

  get currentMonthName(): string {
    return this.viewDate.toLocaleString('es-ES', { month: 'long' })
      .replace(/^\w/, c => c.toUpperCase());
  }

  get currentYear(): number {
    return this.viewDate.getFullYear();
  }

  previousMonth() {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth() {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1);
    this.generateCalendar();
  }

  isPreviousMonthDisabled(): boolean {
    const today = new Date();
    return this.viewDate.getMonth() === today.getMonth() &&
      this.viewDate.getFullYear() === today.getFullYear();
  }

  selectDate(day: any) {
    if (day.isDisabled) return;

    this.selectedDate = day.date_obj;
    this.generateCalendar(); // Regenerar para actualizar estilos

    // Emitir fecha en formato YYYY-MM-DD
    const dateStr = this.formatDate(day.date_obj);
    this.dateSelected.emit(dateStr);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  generateCalendar() {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();

    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    // Último día del mes
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Domingo

    this.calendarDays = [];

    // Días vacíos previos
    for (let i = 0; i < startingDayOfWeek; i++) {
      this.calendarDays.push({ isEmpty: true });
    }

    // Días del mes
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const isToday = date.getTime() === today.getTime();
      const isPast = date < today;

      const isSelected = this.selectedDate ?
        (date.getTime() === this.selectedDate.getTime()) : false;

      this.calendarDays.push({
        dayNumber: i,
        date_obj: date,
        isEmpty: false,
        isToday: isToday,
        isDisabled: isPast, // Solo deshabilitamos el pasado por defecto
        isSelected: isSelected
      });
    }
  }
}
