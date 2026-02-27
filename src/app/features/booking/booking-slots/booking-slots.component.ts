import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Loader2 } from 'lucide-angular';

@Component({
  selector: 'app-booking-slots',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="slots-container">
      <h3 class="text-sm font-medium text-gray-700 mb-3">Horarios disponibles</h3>
      
      <div *ngIf="loading" class="flex justify-center p-4">
        <i-lucide [img]="Loader2" class="w-6 h-6 animate-spin text-blue-600"></i-lucide>
      </div>

      <div *ngIf="!loading && slots.length === 0" class="text-center p-4 bg-gray-50 rounded-lg text-gray-500 text-sm">
        No hay horarios disponibles para esta fecha.
      </div>

      <div *ngIf="!loading && slots.length > 0" class="grid grid-cols-2 gap-2">
        <button 
          *ngFor="let slot of slots"
          [disabled]="isPastSlot(slot)"
          (click)="selectSlot(slot)"
          class="flex items-center justify-center px-4 py-2 border border-gray-200 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
          [ngClass]="{'hover:border-blue-500 hover:bg-blue-50 text-gray-700': !isPastSlot(slot), 'text-gray-400': isPastSlot(slot)}">
          {{ formatTime(slot.startTime || slot.start_time) }}
        </button>
      </div>
    </div>
  `
})
export class BookingSlotsComponent {
  readonly Loader2 = Loader2;
  @Input() slots: any[] = [];
  @Input() loading: boolean = false;
  @Input() selectedDate: string = '';
  @Output() slotSelected = new EventEmitter<any>();

  isPastSlot(slot: any): boolean {
    if (!this.selectedDate) return false;

    const startTime = slot.startTime || slot.start_time;
    if (!startTime) return false;

    // Obtener la fecha y hora seleccionada en la zona local del dispositivo
    const [year, month, day] = this.selectedDate.split('-').map(Number);
    const [hours, minutes] = startTime.split(':').map(Number);

    // Crear la fecha del slot
    const slotDate = new Date(year, month - 1, day, hours, minutes, 0);
    const now = new Date();

    return slotDate <= now;
  }

  selectSlot(slot: any) {
    this.slotSelected.emit(slot);
  }

  formatTime(time: string): string {
    // Convertir HH:mm a formato 12h (ej: 14:00 -> 02:00 PM)
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  }
}
