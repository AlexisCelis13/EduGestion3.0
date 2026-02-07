import { Component, signal, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { NotificationListComponent } from '../../shared/components/notification-list/notification-list.component';

interface MenuItem {
  name: string;
  route: string;
  active?: boolean;
}

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationListComponent],
  template: `
    <div class="flex h-screen bg-surface-50">
      <!-- Sidebar -->
      <div class="w-64 bg-surface-700 text-white flex flex-col">
        <!-- Logo -->
        <div class="flex items-center justify-center h-[65px] border-b border-surface-600">
        <h1 class="text-xl font-semibold tracking-tight">Edu</h1><img src="assets/isotipo.png" class="h-10"><h1 class="text-xl font-semibold tracking-tight">estión</h1>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-3 py-6 space-y-1">
          @for (item of menuItems; track item.name) {
            <a
              [routerLink]="item.route"
              routerLinkActive="bg-primary-600 text-white"
              [routerLinkActiveOptions]="{exact: item.route === '/dashboard' || item.route === '/dashboard/schedule'}"
              class="block px-4 py-3 text-sm font-medium rounded-xl hover:bg-surface-600 transition-all"
              [class.bg-primary-600]="item.active">
              {{ item.name }}
            </a>
          }
        </nav>

        <!-- User Menu -->
        <div class="p-4 border-t border-surface-600">
          <div class="flex items-center">
            <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
              <span class="text-sm font-semibold">{{ userInitials() }}</span>
            </div>
            <div class="ml-3 flex-1 min-w-0">
              <p class="text-sm font-medium truncate">{{ userName() }}</p>
              <p class="text-xs text-surface-400 truncate">{{ userEmail() }}</p>
            </div>
            <button
              (click)="logout()"
              class="ml-2 p-2 rounded-lg hover:bg-surface-600 transition-colors"
              title="Cerrar sesión">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Top Bar -->
        <header class="glass border-b border-surface-100 h-[65px] flex items-center relative z-30">
          <div class="flex items-center justify-between w-full px-6">
            <div class="flex items-center">
              <button
                (click)="toggleSidebar()"
                class="lg:hidden p-2 rounded-xl hover:bg-surface-100">
                <svg class="w-5 h-5 text-surface-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
            </div>

            <div class="flex items-center gap-3">
              <!-- Notifications -->
              <div class="relative" #notificationsContainer>
                <button 
                  (click)="toggleNotifications()"
                  class="p-2.5 rounded-xl hover:bg-surface-100 relative transition-colors"
                  [class.bg-surface-100]="showNotifications()">
                  <svg class="w-5 h-5 text-surface-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  @if (unreadCount() > 0) {
                    <span class="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-white z-10"></span>
                  }
                </button>

                @if (showNotifications()) {
                  <app-notification-list (close)="showNotifications.set(false)"></app-notification-list>
                }
              </div>

              <!-- Profile Dropdown -->
              <div class="relative">
                <button
                  (click)="toggleProfileMenu()"
                  class="flex items-center gap-2 p-2 rounded-xl hover:bg-surface-100 transition-colors">
                  <div class="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                    <span class="text-xs font-semibold text-white">{{ userInitials() }}</span>
                  </div>
                  <svg class="w-4 h-4 text-surface-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                @if (showProfileMenu()) {
                  <div class="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-premium-lg py-2 z-50 border border-surface-100">
                    <a routerLink="/dashboard/profile" class="block px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors">Mi Perfil</a>
                    <a routerLink="/dashboard/settings" class="block px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors">Configuración</a>
                    <div class="border-t border-surface-100 my-1"></div>
                    <button
                      (click)="logout()"
                      class="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      Cerrar Sesión
                    </button>
                  </div>
                }
              </div>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="flex-1 overflow-y-auto bg-surface-50">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>

    <!-- Mobile Sidebar Overlay -->
    @if (sidebarOpen()) {
      <div class="fixed inset-0 z-40 lg:hidden">
        <div class="fixed inset-0 bg-surface-900/60 backdrop-blur-sm" (click)="toggleSidebar()"></div>
      </div>
    }
  `
})
export class DashboardLayoutComponent implements OnInit {
  @ViewChild('notificationsContainer') notificationsContainer!: ElementRef;

  sidebarOpen = signal(false);
  showProfileMenu = signal(false);
  showNotifications = signal(false);

  userName = signal('Usuario');
  userEmail = signal('');
  userInitials = signal('U');
  unreadCount = signal(0);

  menuItems: MenuItem[] = [
    { name: 'Dashboard', route: '/dashboard' },
    { name: 'Alumnos', route: '/dashboard/students' },
    { name: 'Clases', route: '/dashboard/schedule/calendar' },
    { name: 'Horarios', route: '/dashboard/schedule' },
    { name: 'Servicios', route: '/dashboard/services' },
    { name: 'Planes de Estudio', route: '/dashboard/study-plans' },
    { name: 'Pagos', route: '/dashboard/payments' },
    { name: 'Mi Landing Page', route: '/dashboard/landing-editor' },
    // { name: 'Reportes', route: '/dashboard/reports' }, // Oculto temporalmente
    { name: 'Configuración', route: '/dashboard/settings' }
  ];

  constructor(
    private supabaseService: SupabaseService,
    private router: Router,
    private elementRef: ElementRef
  ) {
    this.loadUserInfo();
  }

  ngOnInit() {
    // Subscribe to count updates
    this.supabaseService.unreadCount$.subscribe(count => {
      this.unreadCount.set(count);
    });
  }

  toggleSidebar() {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  toggleProfileMenu() {
    this.showProfileMenu.set(!this.showProfileMenu());
  }

  toggleNotifications() {
    this.showNotifications.set(!this.showNotifications());
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // If notifications are open and click is outside the notification container
    if (this.showNotifications() && this.notificationsContainer && !this.notificationsContainer.nativeElement.contains(event.target)) {
      this.showNotifications.set(false);
    }
  }

  async loadUserInfo() {
    const user = await this.supabaseService.getCurrentUser();
    if (user) {
      this.userEmail.set(user.email || '');

      // Initialize real-time notifications
      this.supabaseService.initializeNotificationSubscription(user.id);

      const profile = await this.supabaseService.getProfile(user.id);
      if (profile) {
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        this.userName.set(fullName || user.email || 'Usuario');

        // Generate initials
        const initials = fullName
          ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
          : (user.email?.[0] || 'U').toUpperCase();
        this.userInitials.set(initials);
      }
    }
  }

  async loadUnreadCount() {
    // Deprecated in favor of subscription, but method kept if needed or called elsewhere
    const user = await this.supabaseService.getCurrentUser();
    if (user) {
      await this.supabaseService.getAppUnreadCount(user.id);
    }
  }

  async logout() {
    await this.supabaseService.signOut();
    this.router.navigate(['/']);
  }
}