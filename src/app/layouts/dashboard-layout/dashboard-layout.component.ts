import { Component, signal, OnInit, OnDestroy, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { ThemeService } from '../../core/services/theme.service';
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
  ChevronLeft,
  HelpCircle
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
    <div class="flex h-screen bg-surface-50 dark:bg-black overflow-hidden">
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
            <a routerLink="/dashboard" class="flex items-center">
              <img src="assets/Icono.png" class="h-10 w-auto object-contain transition-transform duration-300 hover:scale-105" alt="EduGestion">
            </a>
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
              [routerLinkActiveOptions]="{exact: item.route === '/dashboard' || item.route === '/dashboard/schedule'}"
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

        <!-- Support / Help -->
        <div class="p-3 border-t border-white/10">
          <a routerLink="/dashboard/support" class="flex items-center p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group text-surface-300 hover:text-white" title="Ayuda y Soporte">
            <lucide-icon [name]="HelpCircleIcon" class="w-6 h-6 min-w-[24px] transition-colors duration-200 group-hover:text-primary-400"></lucide-icon>
            
            <div class="ml-4 flex-1 min-w-0 transition-opacity duration-300"
                 [class.opacity-0]="!isSidebarExpanded()"
                 [class.opacity-100]="isSidebarExpanded()"
                 [class.hidden]="!isSidebarExpanded() && !isAnimating">
              <p class="text-sm font-medium truncate">Ayuda y Soporte</p>
            </div>
          </a>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col overflow-hidden relative">
        <!-- Top Bar -->
        <header class="glass border-b border-surface-200/50 dark:border-surface-700/50 h-[70px] flex items-center relative z-30 bg-white/80 dark:bg-surface-900/80 backdrop-blur-md">
          <div class="flex items-center justify-between w-full px-8">
            <div class="flex items-center">
              <button
                (click)="toggleSidebarMobile()"
                class="lg:hidden p-2 rounded-xl hover:bg-surface-100 mr-4">
                <lucide-icon [name]="MenuIcon" class="w-6 h-6 text-surface-700"></lucide-icon>
              </button>
              
              <!-- Breadcrumbs or Page Title could go here -->
               <h2 class="text-lg font-semibold text-surface-800 dark:text-surface-100 tracking-tight">
                {{ getCurrentPageTitle() }}
              </h2>
            </div>

            <!-- Centered Search/Command Palette Trigger -->
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
              <button 
                (click)="showCommandPalette.set(true)"
                class="flex items-center gap-2 px-4 py-2 w-72 md:w-96 lg:w-[500px] justify-between rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors border border-surface-200 dark:border-surface-700 shadow-sm relative overflow-hidden group">
                <div class="flex items-center gap-3 w-full">
                   <lucide-icon name="search" class="w-4 h-4 text-surface-400 group-hover:text-surface-600 transition-colors"></lucide-icon>
                   <span class="text-sm font-medium truncate transition-all duration-300">{{ searchPlaceholder() }}</span>
                </div>
                <kbd class="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-surface-300 bg-surface-50 px-1 font-mono text-[10px] font-medium text-surface-500">
                  <span class="text-xs">⌘</span>K
                </kbd>
              </button>
            </div>

            <div class="flex items-center gap-3">

              <!-- Theme Toggle -->
              <button 
                (click)="themeService.cycleMode()"
                class="p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 relative transition-all duration-200 border border-transparent hover:border-surface-200 dark:hover:border-surface-700"
                [title]="getThemeLabel()">
                @if (themeService.isDark()) {
                  <svg class="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                } @else {
                  <svg class="w-5 h-5 text-surface-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                }
              </button>

              <!-- Notifications -->
              <div class="relative" #notificationsContainer>
                <button 
                  (click)="toggleNotifications()"
                  class="p-2.5 rounded-xl hover:bg-surface-100 relative transition-all duration-200 hover:text-primary-700 border border-transparent hover:border-surface-200"
                  style="color: #000000;"
                  [class.bg-primary-50]="showNotifications()"
                  [class.text-primary-700]="showNotifications()">
                  <lucide-icon [name]="BellIcon" class="w-5 h-5"></lucide-icon>
                  @if (unreadCount() > 0) {
                    <span class="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse"></span>
                  }
                </button>

                @if (showNotifications()) {
                  <app-notification-list (close)="showNotifications.set(false)"></app-notification-list>
                }
              </div>

              <!-- Profile Dropdown -->
              <div class="relative" #profileMenuContainer>
                <button
                  (click)="toggleProfileMenu()"
                  class="flex items-center gap-2 p-1.5 pl-2 rounded-xl hover:bg-surface-100 transition-colors border border-transparent hover:border-surface-200"
                  [class.bg-surface-100]="showProfileMenu()">
                  <div class="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center text-white shadow-sm">
                    <span class="text-xs font-bold">{{ userInitials() }}</span>
                  </div>
                  <lucide-icon [name]="ChevronDownIcon" class="w-4 h-4 text-surface-400"></lucide-icon>
                </button>

                @if (showProfileMenu()) {
                  <div class="absolute right-0 mt-3 w-56 bg-white dark:bg-surface-800 rounded-2xl shadow-premium-xl py-2 z-50 border border-surface-100 dark:border-surface-700 ring-1 ring-black/5 transform origin-top-right transition-all">
                    <div class="px-4 py-3 border-b border-surface-100 mb-2">
                       <p class="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">{{ userName() }}</p>
                       <p class="text-xs text-surface-500 dark:text-surface-400 truncate">{{ userEmail() }}</p>
                    </div>
                    
                    <a routerLink="/dashboard/profile" class="flex items-center gap-2 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors">
                      <lucide-icon [name]="UserIcon" class="w-4 h-4"></lucide-icon>
                      Mi Perfil
                    </a>
                    <a routerLink="/dashboard/settings" class="flex items-center gap-2 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors">
                      <lucide-icon [name]="SettingsIcon" class="w-4 h-4"></lucide-icon>
                      Configuración
                    </a>
                    
                    <div class="border-t border-surface-100 my-2"></div>
                    
                    <button
                      (click)="logout()"
                      class="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <lucide-icon [name]="LogOutIcon" class="w-4 h-4"></lucide-icon>
                      Cerrar Sesión
                    </button>
                  </div>
                }
              </div>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="flex-1 overflow-y-auto bg-surface-50/50 dark:bg-surface-900/50 relative">
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
               <lucide-icon [name]="ChevronLeftIcon" class="w-6 h-6"></lucide-icon>
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
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('notificationsContainer') notificationsContainer!: ElementRef;
  @ViewChild('profileMenuContainer') profileMenuContainer!: ElementRef;

  // Sidebar State
  isSidebarExpanded = signal(false);
  mobileSidebarOpen = signal(false);
  isAnimating = false;
  private expandTimeout: any;

  // Icons used directly in template
  BellIcon = Bell;
  MenuIcon = Menu;
  ChevronDownIcon = ChevronDown;
  UserIcon = User;
  SettingsIcon = Settings;
  LogOutIcon = LogOut;
  ChevronLeftIcon = ChevronLeft;
  HelpCircleIcon = HelpCircle;

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

  // Search Placeholder State
  searchPlaceholder = signal('Buscar "Alumnos"...');
  private placeholderIndex = 0;
  private placeholderOptions = [
    'Buscar "Alumnos"...',
    'Crear "Nuevo Servicio"...',
    'Buscar "Facturación"...',
    'Ir a "Configuración"...',
    'Buscar "Horarios"...',
    'Presiona ⌘K para comandos...'
  ];
  private placeholderInterval: any;

  constructor(
    private supabaseService: SupabaseService,
    public router: Router,
    private elementRef: ElementRef,
    public themeService: ThemeService
  ) {
    this.loadUserInfo();
  }

  ngOnInit() {
    this.supabaseService.unreadCount$.subscribe(count => {
      this.unreadCount.set(count);
    });

    // Start cycling placeholders
    this.placeholderInterval = setInterval(() => {
      this.placeholderIndex = (this.placeholderIndex + 1) % this.placeholderOptions.length;
      this.searchPlaceholder.set(this.placeholderOptions[this.placeholderIndex]);
    }, 4000); // Change every 4 seconds
  }

  ngOnDestroy() {
    if (this.placeholderInterval) {
      clearInterval(this.placeholderInterval);
    }
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

    if (this.showProfileMenu() && this.profileMenuContainer && !this.profileMenuContainer.nativeElement.contains(event.target)) {
      this.showProfileMenu.set(false);
    }
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
    // Both Dashboard and Horarios need exact matching to prevent overlap
    // with sub-routes like /dashboard/schedule/calendar
    const isExactMatch = route === '/dashboard' || route === '/dashboard/schedule';
    return this.router.isActive(route, {
      paths: isExactMatch ? 'exact' : 'subset',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored'
    });
  }

  async logout() {
    await this.supabaseService.signOut();
    this.router.navigate(['/']);
  }

  getThemeLabel(): string {
    const labels: Record<string, string> = {
      'light': 'Modo claro',
      'dark': 'Modo oscuro',
      'system': 'Modo sistema'
    };
    return labels[this.themeService.currentMode()] || 'Cambiar tema';
  }
}