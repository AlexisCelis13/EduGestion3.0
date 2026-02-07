import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService, AppNotification } from '../../../core/services/supabase.service';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-premium-lg py-2 z-50 border border-surface-100 max-h-[480px] flex flex-col">
      <div class="px-4 py-3 border-b border-surface-100 flex justify-between items-center">
        <h3 class="font-semibold text-surface-900">Notificaciones</h3>
        <button (click)="markAllAsRead()" class="text-xs text-primary-600 hover:text-primary-700 font-medium">
          Marcar todo leido
        </button>
      </div>

      <div class="overflow-y-auto flex-1">
        @if (loading) {
          <div class="p-4 text-center text-surface-500 text-sm">Cargando...</div>
        } @else if (notifications.length === 0) {
          <div class="p-8 text-center text-surface-500">
            <p class="text-sm">No tienes notificaciones nuevas</p>
          </div>
        } @else {
          @for (notification of notifications; track notification.id) {
            <div 
              class="px-4 py-3 hover:bg-surface-50 border-b border-surface-50 last:border-0 transition-colors cursor-pointer relative"
              [class.bg-blue-50]="!notification.is_read"
              (click)="handleNotificationClick(notification)">
              
              <div class="flex gap-3">
                <div class="mt-1">
                  @if (notification.type === 'booking_new') {
                    <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </div>
                  } @else if (notification.type === 'booking_cancel') {
                    <div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </div>
                  } @else {
                    <div class="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center text-surface-600">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                    </div>
                  }
                </div>
                
                <div class="flex-1">
                  <p class="text-sm font-medium text-surface-900 leading-snug">{{ notification.title }}</p>
                  <p class="text-xs text-surface-600 mt-0.5 line-clamp-2">{{ notification.message }}</p>
                  <p class="text-[10px] text-surface-400 mt-1.5">{{ getTimeAgo(notification.created_at) }}</p>
                </div>

                @if (!notification.is_read) {
                  <div class="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                }
              </div>
            </div>
          }
        }
      </div>
      
      <div class="p-2 border-t border-surface-100 bg-surface-50 rounded-b-2xl">
        <button class="w-full text-center text-xs font-medium text-surface-600 hover:text-surface-900 py-1">
          Ver todas las notificaciones
        </button>
      </div>
    </div>
  `
})
export class NotificationListComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  notifications: AppNotification[] = [];
  loading = true;

  constructor(private supabaseService: SupabaseService) { }

  async ngOnInit() {
    await this.loadNotifications();
  }

  async loadNotifications() {
    try {
      this.loading = true;
      const user = await this.supabaseService.getCurrentUser();
      if (!user) return;

      const { data } = await this.supabaseService.getAppNotifications(user.id);
      this.notifications = data || [];
    } catch (error) {
      console.error('Error loading notifications', error);
    } finally {
      this.loading = false;
    }
  }

  getTimeAgo(date: string): string {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
  }

  async markAsRead(notification: AppNotification) {
    if (notification.is_read) return;

    // Optimistic update
    notification.is_read = true;

    await this.supabaseService.markAppNotificationAsRead(notification.id);
  }

  async markAllAsRead() {
    const user = await this.supabaseService.getCurrentUser();
    if (!user) return;

    // Optimistic update
    this.notifications.forEach(n => n.is_read = true);

    await this.supabaseService.markAllAppNotificationsAsRead(user.id);
  }

  handleNotificationClick(notification: AppNotification) {
    this.markAsRead(notification);
    this.close.emit();
  }
}
