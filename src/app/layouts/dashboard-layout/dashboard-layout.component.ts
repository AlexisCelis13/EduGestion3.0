import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';

interface MenuItem {
  name: string;
  icon: string;
  route: string;
  active?: boolean;
}

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="flex h-screen bg-gray-100">
      <!-- Sidebar -->
      <div class="w-64 bg-gray-900 text-white flex flex-col">
        <!-- Logo -->
        <div class="flex items-center justify-center h-16 bg-gray-800">
          <h1 class="text-xl font-bold">EduGestión</h1>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-4 py-6 space-y-2">
          @for (item of menuItems; track item.name) {
            <a
              [routerLink]="item.route"
              routerLinkActive="bg-blue-600"
              class="flex items-center px-4 py-3 text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
              [class.bg-blue-600]="item.active">
              <span class="mr-3 text-lg">{{ item.icon }}</span>
              {{ item.name }}
            </a>
          }
        </nav>

        <!-- User Menu -->
        <div class="p-4 border-t border-gray-700">
          <div class="flex items-center">
            <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span class="text-sm font-medium">{{ userInitials() }}</span>
            </div>
            <div class="ml-3 flex-1">
              <p class="text-sm font-medium">{{ userName() }}</p>
              <p class="text-xs text-gray-400">{{ userEmail() }}</p>
            </div>
            <button
              (click)="logout()"
              class="ml-2 p-1 rounded hover:bg-gray-700 transition-colors"
              title="Cerrar sesión">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Top Bar -->
        <header class="bg-white shadow-sm border-b border-gray-200">
          <div class="flex items-center justify-between px-6 py-4">
            <div class="flex items-center">
              <button
                (click)="toggleSidebar()"
                class="lg:hidden p-2 rounded-md hover:bg-gray-100">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </button>
            </div>

            <div class="flex items-center space-x-4">
              <!-- Notifications -->
              <button class="p-2 rounded-full hover:bg-gray-100 relative">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM10.5 3.5a6 6 0 0 1 6 6v2l1.5 3h-15l1.5-3v-2a6 6 0 0 1 6-6z"></path>
                </svg>
                <span class="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
              </button>

              <!-- Profile Dropdown -->
              <div class="relative">
                <button
                  (click)="toggleProfileMenu()"
                  class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100">
                  <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span class="text-sm font-medium text-white">{{ userInitials() }}</span>
                  </div>
                  <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>

                @if (showProfileMenu()) {
                  <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Mi Perfil</a>
                    <a routerLink="/dashboard/settings" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Configuración</a>
                    <div class="border-t border-gray-100"></div>
                    <button
                      (click)="logout()"
                      class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Cerrar Sesión
                    </button>
                  </div>
                }
              </div>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="flex-1 overflow-y-auto">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>

    <!-- Mobile Sidebar Overlay -->
    @if (sidebarOpen()) {
      <div class="fixed inset-0 z-40 lg:hidden">
        <div class="fixed inset-0 bg-gray-600 bg-opacity-75" (click)="toggleSidebar()"></div>
      </div>
    }
  `
})
export class DashboardLayoutComponent {
  sidebarOpen = signal(false);
  showProfileMenu = signal(false);
  userName = signal('Usuario');
  userEmail = signal('');
  userInitials = signal('U');

  menuItems: MenuItem[] = [
    { name: 'Dashboard', icon: '🏠', route: '/dashboard' },
    { name: 'Alumnos', icon: '👨‍🎓', route: '/dashboard/students' },
    { name: 'Clases', icon: '📅', route: '/dashboard/appointments' },
    { name: 'Servicios', icon: '📚', route: '/dashboard/services' },
    { name: 'Pagos', icon: '💰', route: '/dashboard/payments' },
    { name: 'Mi Landing Page', icon: '🌐', route: '/dashboard/landing-editor' },
    { name: 'Reportes', icon: '📊', route: '/dashboard/reports' },
    { name: 'Configuración', icon: '⚙️', route: '/dashboard/settings' }
  ];

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.loadUserInfo();
  }

  toggleSidebar() {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  toggleProfileMenu() {
    this.showProfileMenu.set(!this.showProfileMenu());
  }

  async loadUserInfo() {
    const user = await this.supabaseService.getCurrentUser();
    if (user) {
      this.userEmail.set(user.email || '');

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

  async logout() {
    await this.supabaseService.signOut();
    this.router.navigate(['/']);
  }
}