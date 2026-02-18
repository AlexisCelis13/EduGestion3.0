import { Component, signal, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { NotificationListComponent } from '../../shared/components/notification-list/notification-list.component';
import { CommandPaletteComponent } from '../../shared/components/command-palette/command-palette.component';
import {
  LucideAngularModule,
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Clock,
  Briefcase,
  FileText,
  CreditCard,
  Globe,
  Settings,
  LogOut,
  Menu,
  Bell,
  User,
  ChevronDown,
  ChevronLeft
} from 'lucide-angular';

interface MenuItem {
  name: string;
  route: string;
  icon: any;
  active?: boolean;
}

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NotificationListComponent,
    CommandPaletteComponent,
    LucideAngularModule
  ],
  template: `
    <div class="flex h-screen bg-surface-50 overflow-hidden">
      <!-- Sidebar -->
      <div 
        class="h-full bg-surface-900/95 backdrop-blur-xl text-white flex flex-col transition-[width] duration-300 ease-in-out shadow-2xl z-40 relative border-r border-white/5"
        [class.w-20]="!isSidebarExpanded()"
        [class.w-72]="isSidebarExpanded()"
        (mouseenter)="onMouseEnter()"
        (mouseleave)="onMouseLeave()">
        
        <!-- Logo Area -->
        <div class="flex items-center justify-center h-[70px] border-b border-white/5 overflow-hidden relative" style="background-color: #4d8273ff;">
          <div class="absolute inset-0 transition-opacity duration-300 flex items-center justify-center"
               [class.opacity-100]="!isSidebarExpanded()"
               [class.opacity-0]="isSidebarExpanded()">
            <img src="assets/isotipo.png" class="h-10 w-auto object-contain transition-transform duration-300 hover:scale-105" alt="EduGestion">
          </div>
          <div class="absolute inset-0 transition-opacity duration-300 flex items-center justify-center"
               [class.opacity-0]="!isSidebarExpanded()"
               [class.opacity-100]="isSidebarExpanded()">
            <img src="assets/LogoCompleto.png" class="h-8 w-auto object-contain" alt="EduGestion">
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-3 py-6 space-y-2 overflow-y-auto no-scrollbar">
          @for (item of menuItems; track item.name) {
            <a
              [routerLink]="item.route"
              routerLinkActive="bg-primary-600/20 text-primary-400 after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:w-1 after:h-8 after:bg-primary-500 after:rounded-l-full"
              [routerLinkActiveOptions]="{exact: item.route === '/dashboard'}"
              class="group relative flex items-center px-3 py-3 text-sm font-medium rounded-xl hover:bg-white/5 transition-all duration-200 overflow-hidden whitespace-nowrap"
              [class.text-surface-300]="!isRouteActive(item.route)"
              [title]="!isSidebarExpanded() ? item.name : ''">
              
              <lucide-icon 
                [name]="item.icon" 
                class="w-6 h-6 min-w-[24px] transition-colors duration-200 group-hover:text-primary-400"
                [class.text-primary-500]="isRouteActive(item.route)">
              </lucide-icon>
              
              <span 
                class="ml-4 transition-opacity duration-300 delay-75"
                [class.opacity-0]="!isSidebarExpanded()"
                [class.opacity-100]="isSidebarExpanded()"
                [class.hidden]="!isSidebarExpanded() && !isAnimating">
                {{ item.name }}
              </span>

              @if (!isSidebarExpanded()) {
                <!-- Tooltip for collapsed state -->
                <div class="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-surface-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap border border-white/10 shadow-lg">
                  {{ item.name }}
                </div>
              }
            </a>
          }
        </nav>

        <!-- User Menu -->
        <div class="p-3 border-t border-white/10">
          <div class="flex items-center p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group" (click)="toggleProfileMenu()">
            <div class="w-10 h-10 min-w-[40px] bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white/10 group-hover:ring-primary-500/50 transition-all">
              <span class="text-sm font-bold text-white">{{ userInitials() }}</span>
            </div>
            
            <div class="ml-3 flex-1 min-w-0 transition-opacity duration-300"
                 [class.opacity-0]="!isSidebarExpanded()"
                 [class.opacity-100]="isSidebarExpanded()"
                 [class.hidden]="!isSidebarExpanded() && !isAnimating">
              <p class="text-sm font-medium truncate text-white">{{ userName() }}</p>
              <p class="text-xs text-surface-400 truncate">{{ userEmail() }}</p>
            </div>

            <!-- Logout Button (Only visible when expanded) -->
             @if (isSidebarExpanded()) {
              <button
                (click)="logout(); $event.stopPropagation()"
                class="ml-2 p-2 rounded-lg hover:bg-red-500/20 hover:text-red-400 text-surface-400 transition-colors"
                title="Cerrar sesión">
                <lucide-icon name="log-out" class="w-4 h-4"></lucide-icon>
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col overflow-hidden relative">
        <!-- Top Bar -->
        <header class="glass border-b border-surface-200/50 h-[70px] flex items-center relative z-30 bg-white/80 backdrop-blur-md">
          <div class="flex items-center justify-between w-full px-8">
            <div class="flex items-center">
              <button
                (click)="toggleSidebarMobile()"
                class="lg:hidden p-2 rounded-xl hover:bg-surface-100 mr-4">
                <lucide-icon name="menu" class="w-6 h-6 text-surface-700"></lucide-icon>
              </button>
              
              <!-- Breadcrumbs or Page Title could go here -->
               <h2 class="text-lg font-semibold text-surface-800 tracking-tight">
                {{ getCurrentPageTitle() }}
              </h2>
            </div>

            <div class="flex items-center gap-4">
              <!-- Search/Command Palette Trigger -->
              <button 
                (click)="showCommandPalette.set(true)"
                class="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-100 hover:bg-surface-200 text-surface-500 hover:text-surface-700 transition-colors border border-surface-200">
                <span class="text-xs font-medium">Buscar...</span>
                <kbd class="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-surface-300 bg-surface-50 px-1 font-mono text-[10px] font-medium text-surface-500">
                  <span class="text-xs">⌘</span>K
                </kbd>
              </button>

              <!-- Notifications -->
              <div class="relative" #notificationsContainer>
                <button 
                  (click)="toggleNotifications()"
                  class="p-2.5 rounded-xl hover:bg-surface-100 relative transition-all duration-200 hover:text-primary-700 border border-transparent hover:border-surface-200"
                  style="color: #000000;"
                  [class.bg-primary-50]="showNotifications()"
                  [class.text-primary-700]="showNotifications()">
                  <lucide-icon name="bell" class="w-5 h-5"></lucide-icon>
                  @if (unreadCount() > 0) {
                    <span class="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse"></span>
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
                  class="flex items-center gap-2 p-1.5 pl-2 rounded-xl hover:bg-surface-100 transition-colors border border-transparent hover:border-surface-200">
                  <div class="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center text-white shadow-sm">
                    <span class="text-xs font-bold">{{ userInitials() }}</span>
                  </div>
                  <lucide-icon name="chevron-down" class="w-4 h-4 text-surface-400"></lucide-icon>
                </button>

                @if (showProfileMenu()) {
                  <div class="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-premium-xl py-2 z-50 border border-surface-100 ring-1 ring-black/5 transform origin-top-right transition-all">
                    <div class="px-4 py-3 border-b border-surface-100 mb-2">
                       <p class="text-sm font-semibold text-surface-900 truncate">{{ userName() }}</p>
                       <p class="text-xs text-surface-500 truncate">{{ userEmail() }}</p>
                    </div>
                    
                    <a routerLink="/dashboard/profile" class="flex items-center gap-2 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors">
                      <lucide-icon name="user" class="w-4 h-4"></lucide-icon>
                      Mi Perfil
                    </a>
                    <a routerLink="/dashboard/settings" class="flex items-center gap-2 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors">
                      <lucide-icon name="settings" class="w-4 h-4"></lucide-icon>
                      Configuración
                    </a>
                    
                    <div class="border-t border-surface-100 my-2"></div>
                    
                    <button
                      (click)="logout()"
                      class="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <lucide-icon name="log-out" class="w-4 h-4"></lucide-icon>
                      Cerrar Sesión
                    </button>
                  </div>
                }
              </div>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="flex-1 overflow-y-auto bg-surface-50/50 relative">
          <!-- Background decoration -->
          <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
             <div class="absolute top-0 left-0 w-[500px] h-[500px] bg-primary-200/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
             <div class="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2"></div>
          </div>
          
          <div class="relative z-10">
             <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>

    <!-- Mobile Sidebar Overlay -->
    @if (mobileSidebarOpen()) {
      <div class="fixed inset-0 z-50 lg:hidden">
        <div class="absolute inset-0 bg-surface-900/60 backdrop-blur-sm transition-opacity" (click)="toggleSidebarMobile()"></div>
        
        <div class="absolute left-0 top-0 bottom-0 w-72 bg-surface-900 text-white shadow-2xl flex flex-col">
           <!-- Mobile Sidebar Header -->
           <div class="flex items-center justify-between h-[70px] px-6 border-b border-white/10">
             <img src="assets/LogoCompleto.png" class="h-8 w-auto">
             <button (click)="toggleSidebarMobile()" class="p-2 -mr-2 text-surface-400 hover:text-white">
               <lucide-icon name="chevron-left" class="w-6 h-6"></lucide-icon>
             </button>
           </div>
           
           <!-- Mobile Navigation -->
           <nav class="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
              @for (item of menuItems; track item.name) {
                <a
                  [routerLink]="item.route"
                  (click)="toggleSidebarMobile()"
                  routerLinkActive="bg-primary-600 text-white"
                  [routerLinkActiveOptions]="{exact: item.route === '/dashboard'}"
                  class="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl hover:bg-white/5 transition-all text-surface-300">
                  <lucide-icon [name]="item.icon" class="w-5 h-5"></lucide-icon>
                  {{ item.name }}
                </a>
              }
           </nav>
        </div>
      </div>
    }

    <!-- Command Palette -->
    @if (showCommandPalette()) {
      <app-command-palette (closed)="showCommandPalette.set(false)"></app-command-palette>
    }
  `
})
export class DashboardLayoutComponent implements OnInit {
  @ViewChild('notificationsContainer') notificationsContainer!: ElementRef;

  // Sidebar State
  isSidebarExpanded = signal(false);
  mobileSidebarOpen = signal(false);
  isAnimating = false;
  private expandTimeout: any;

  // Other UI State
  showProfileMenu = signal(false);
  showNotifications = signal(false);
  showCommandPalette = signal(false);

  // User Data
  userName = signal('Usuario');
  userEmail = signal('');
  userInitials = signal('U');
  unreadCount = signal(0);

  menuItems: MenuItem[] = [
    { name: 'Dashboard', route: '/dashboard', icon: LayoutDashboard },
    { name: 'Alumnos', route: '/dashboard/students', icon: GraduationCap },
    { name: 'Clases', route: '/dashboard/schedule/calendar', icon: BookOpen },
    { name: 'Horarios', route: '/dashboard/schedule', icon: Clock },
    { name: 'Servicios', route: '/dashboard/services', icon: Briefcase },
    { name: 'Planes de Estudio', route: '/dashboard/study-plans', icon: FileText },
    { name: 'Pagos', route: '/dashboard/payments', icon: CreditCard },
    { name: 'Mi Landing Page', route: '/dashboard/landing-editor', icon: Globe },
    { name: 'Configuración', route: '/dashboard/settings', icon: Settings }
  ];

  constructor(
    private supabaseService: SupabaseService,
    public router: Router,
    private elementRef: ElementRef
  ) {
    this.loadUserInfo();
  }

  ngOnInit() {
    this.supabaseService.unreadCount$.subscribe(count => {
      this.unreadCount.set(count);
    });
  }

  // Sidebar Hover Logic
  onMouseEnter() {
    // Clear any pending timeout to close (if any)
    if (this.expandTimeout) {
      clearTimeout(this.expandTimeout);
    }

    // Set delay to expand
    this.expandTimeout = setTimeout(() => {
      this.isAnimating = true;
      this.isSidebarExpanded.set(true);
      // Stop animation flag after transition
      setTimeout(() => this.isAnimating = false, 300);
    }, 300); // 300ms delay
  }

  onMouseLeave() {
    // Clear pending expansion if mouse leaves quickly
    if (this.expandTimeout) {
      clearTimeout(this.expandTimeout);
    }

    this.isAnimating = true;
    this.isSidebarExpanded.set(false);
    setTimeout(() => this.isAnimating = false, 300);
  }

  toggleSidebarMobile() {
    this.mobileSidebarOpen.set(!this.mobileSidebarOpen());
  }

  toggleProfileMenu() {
    this.showProfileMenu.set(!this.showProfileMenu());
  }

  toggleNotifications() {
    this.showNotifications.set(!this.showNotifications());
  }

  getCurrentPageTitle(): string {
    const activeRoute = this.router.url;
    const item = this.menuItems.find(i =>
      activeRoute === i.route || (i.route !== '/dashboard' && activeRoute.startsWith(i.route))
    );
    return item ? item.name : 'Dashboard';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.showNotifications() && this.notificationsContainer && !this.notificationsContainer.nativeElement.contains(event.target)) {
      this.showNotifications.set(false);
    }

    // Also close profile menu if clicking outside
    // Add logic similar to notifications if needed, or rely on button toggle
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.showCommandPalette.set(true);
    }
  }

  async loadUserInfo() {
    const user = await this.supabaseService.getCurrentUser();
    if (user) {
      this.userEmail.set(user.email || '');
      this.supabaseService.initializeNotificationSubscription(user.id);

      const profile = await this.supabaseService.getProfile(user.id);
      if (profile) {
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        this.userName.set(fullName || user.email || 'Usuario');

        const initials = fullName
          ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
          : (user.email?.[0] || 'U').toUpperCase();
        this.userInitials.set(initials);
      }
    }
  }

  isRouteActive(route: string): boolean {
    const isDashboard = route === '/dashboard';
    return this.router.isActive(route, {
      paths: isDashboard ? 'exact' : 'subset',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored'
    });
  }

  async logout() {
    await this.supabaseService.signOut();
    this.router.navigate(['/']);
  }
}