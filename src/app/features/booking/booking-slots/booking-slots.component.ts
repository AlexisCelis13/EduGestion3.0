import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Loader2 } from 'lucide-angular';

@Component({
  selector: 'app-booking-slots',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  providers: [{ provide: 'LUCIDE_ICONS', useValue: { Loader2 } }],
  template: `
    <div class="slots-container">
      <h3 class="text-sm font-medium text-gray-700 mb-3">Horarios disponibles</h3>
      
      <div *ngIf="loading" class="flex justify-center p-4">
        <i-lucide name="loader-2" class="w-6 h-6 animate-spin text-blue-600"></i-lucide>
      </div>

      <div *ngIf="!loading && slots.length === 0" class="text-center p-4 bg-gray-50 rounded-lg text-gray-500 text-sm">
        No hay horarios disponibles para esta fecha.
      </div>

      <div *ngIf="!loading && slots.length > 0" class="grid grid-cols-2 gap-2">
        <button 
          *ngFor="let slot of slots"
          (click)="selectSlot(slot)"
          class="flex items-center justify-center px-4 py-2 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-sm text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1">
          {{ formatTime(slot.startTime) }}
        </button>
      </div>
    </div>
  `
})
export class BookingSlotsComponent {
  @Input() slots: { startTime: string; endTime: string }[] = [];
  @Input() loading: boolean = false;
  @Output() slotSelected = new EventEmitter<{ startTime: string; endTime: string }>();

  selectSlot(slot: { startTime: string; endTime: string }) {
    this.slotSelected.emit(slot);
  }

  formatTime(time: string): string {
    // Convertir HH:mm a formato 12h (ej: 14:00 -> 02:00 PM)
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  }
}
