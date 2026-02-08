import { Component, signal, OnInit, OnDestroy, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService, Student, Service } from '../../../core/services/supabase.service';

interface SearchResult {
    type: 'navigation' | 'student' | 'appointment' | 'service';
    icon: string;
    title: string;
    subtitle?: string;
    route?: string;
    queryParams?: any;
    action?: () => void;
}

interface SearchGroup {
    name: string;
    results: SearchResult[];
}

@Component({
    selector: 'app-command-palette',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './command-palette.component.html'
})
export class CommandPaletteComponent implements OnInit, OnDestroy {
    @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
    @Output() closed = new EventEmitter<void>();

    query = '';
    loading = signal(false);
    groups = signal<SearchGroup[]>([]);

    // Keyboard navigation
    selectedGroupIndex = 0;
    selectedItemIndex = 0;

    // Cached data
    private students: Student[] = [];
    private appointments: any[] = [];
    private services: Service[] = [];

    // Navigation items (static)
    private navigationItems: SearchResult[] = [
        { type: 'navigation', icon: '🏠', title: 'Dashboard', subtitle: 'Ir al inicio', route: '/dashboard' },
        { type: 'navigation', icon: '📅', title: 'Clases', subtitle: 'Ver calendario de citas', route: '/dashboard/schedule/calendar' },
        { type: 'navigation', icon: '👥', title: 'Alumnos', subtitle: 'Gestionar estudiantes', route: '/dashboard/students' },
        { type: 'navigation', icon: '📦', title: 'Servicios', subtitle: 'Configurar servicios', route: '/dashboard/services' },
        { type: 'navigation', icon: '💳', title: 'Pagos', subtitle: 'Ver historial de pagos', route: '/dashboard/payments' },
        { type: 'navigation', icon: '📚', title: 'Planes de Estudio', subtitle: 'Gestionar planes', route: '/dashboard/study-plans' },
        { type: 'navigation', icon: '🌐', title: 'Mi Landing Page', subtitle: 'Ver y editar tu página pública', route: '/dashboard/landing-editor' },
        { type: 'navigation', icon: '⚙️', title: 'Configuración', subtitle: 'Ajustes de cuenta', route: '/dashboard/settings' },
    ];

    // Quick actions (create new items)
    private quickActions: SearchResult[] = [
        { type: 'navigation', icon: '➕', title: 'Nuevo Alumno', subtitle: 'Agregar un estudiante', route: '/dashboard/students', queryParams: { action: 'new' } },
        { type: 'navigation', icon: '➕', title: 'Nuevo Servicio', subtitle: 'Crear un servicio', route: '/dashboard/services', queryParams: { action: 'new' } },
        { type: 'navigation', icon: '➕', title: 'Nuevo Bloqueo de Tiempo', subtitle: 'Bloquear fecha u hora', route: '/dashboard/schedule', queryParams: { action: 'new-block' } },
    ];

    constructor(
        private router: Router,
        private supabaseService: SupabaseService
    ) { }

    async ngOnInit() {
        // Focus input after render
        setTimeout(() => {
            this.searchInput?.nativeElement?.focus();
        }, 100);

        // Load initial data
        await this.loadData();

        // Show default groups
        this.updateResults();
    }

    ngOnDestroy() { }

    private async loadData() {
        this.loading.set(true);

        const user = await this.supabaseService.getCurrentUser();
        if (!user) {
            this.loading.set(false);
            return;
        }

        // Load students, appointments and services in parallel
        const [studentsResult, appointmentsResult, servicesResult] = await Promise.all([
            this.supabaseService.getStudents(user.id),
            this.supabaseService.getAppointments(user.id),
            this.supabaseService.getServices(user.id)
        ]);

        if (studentsResult.data) {
            this.students = studentsResult.data;
        }

        if (appointmentsResult) {
            // Filter to upcoming appointments only
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            this.appointments = appointmentsResult
                .filter((apt: any) => new Date(apt.date) >= today && apt.status !== 'cancelled')
                .slice(0, 10); // Limit to 10 most recent
        }

        if (servicesResult.data) {
            this.services = servicesResult.data;
        }

        this.loading.set(false);
    }

    onSearch(query: string) {
        this.selectedGroupIndex = 0;
        this.selectedItemIndex = 0;
        this.updateResults();
    }

    private updateResults() {
        const q = this.query.toLowerCase().trim();
        const groups: SearchGroup[] = [];

        // Navigation results
        const navResults = this.navigationItems.filter(item =>
            item.title.toLowerCase().includes(q) ||
            item.subtitle?.toLowerCase().includes(q)
        );

        if (navResults.length > 0) {
            groups.push({ name: 'Navegación', results: q ? navResults : navResults.slice(0, 4) });
        }

        // Student results
        if (this.students.length > 0) {
            const studentResults: SearchResult[] = this.students
                .filter(s =>
                    `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
                    s.email.toLowerCase().includes(q)
                )
                .slice(0, 5)
                .map(s => ({
                    type: 'student' as const,
                    icon: '👤',
                    title: `${s.first_name} ${s.last_name}`,
                    subtitle: s.email,
                    route: '/dashboard/students',
                    queryParams: { student: s.id }
                }));

            if (studentResults.length > 0) {
                groups.push({ name: 'Estudiantes', results: studentResults });
            }
        }

        // Service results
        if (this.services.length > 0) {
            const serviceResults: SearchResult[] = this.services
                .filter(s =>
                    s.name.toLowerCase().includes(q) ||
                    s.category?.toLowerCase().includes(q) ||
                    s.description?.toLowerCase().includes(q)
                )
                .slice(0, 5)
                .map(s => ({
                    type: 'service' as const,
                    icon: '📦',
                    title: s.name,
                    subtitle: `$${s.price.toLocaleString('es-MX')} MXN · ${s.duration_minutes} min`,
                    route: '/dashboard/services',
                    queryParams: { service: s.id }
                }));

            if (serviceResults.length > 0) {
                groups.push({ name: 'Servicios', results: serviceResults });
            }
        }

        // Appointment results
        if (this.appointments.length > 0 && q.length > 0) {
            const appointmentResults: SearchResult[] = this.appointments
                .filter((apt: any) =>
                    apt.student_name?.toLowerCase().includes(q) ||
                    apt.date.includes(q)
                )
                .slice(0, 5)
                .map((apt: any) => ({
                    type: 'appointment' as const,
                    icon: '📅',
                    title: apt.student_name || 'Sin nombre',
                    subtitle: `${this.formatDate(apt.date)} · ${apt.start_time} - ${apt.end_time}`,
                    route: '/dashboard/schedule/calendar'
                }));

            if (appointmentResults.length > 0) {
                groups.push({ name: 'Citas Próximas', results: appointmentResults });
            }
        }

        // Quick actions results (searchable)
        const actionResults = this.quickActions.filter(item =>
            item.title.toLowerCase().includes(q) ||
            item.subtitle?.toLowerCase().includes(q)
        );

        if (actionResults.length > 0 && q.length > 0) {
            groups.push({ name: 'Acciones Rápidas', results: actionResults });
        }

        // If no query, show quick actions and navigation as default
        if (!q && groups.length === 0) {
            groups.push({
                name: 'Acciones Rápidas',
                results: this.quickActions
            });
            groups.push({
                name: 'Navegación',
                results: this.navigationItems.slice(0, 4)
            });
        }

        this.groups.set(groups);
    }

    onKeydown(event: KeyboardEvent) {
        const groups = this.groups();

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            this.moveSelection(1);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            this.moveSelection(-1);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            const group = groups[this.selectedGroupIndex];
            if (group) {
                const result = group.results[this.selectedItemIndex];
                if (result) {
                    this.selectResult(result);
                }
            }
        } else if (event.key === 'Escape') {
            this.close();
        }
    }

    private moveSelection(direction: number) {
        const groups = this.groups();
        if (groups.length === 0) return;

        const currentGroup = groups[this.selectedGroupIndex];
        const newItemIndex = this.selectedItemIndex + direction;

        if (newItemIndex >= 0 && newItemIndex < currentGroup.results.length) {
            this.selectedItemIndex = newItemIndex;
        } else if (direction > 0 && this.selectedGroupIndex < groups.length - 1) {
            this.selectedGroupIndex++;
            this.selectedItemIndex = 0;
        } else if (direction < 0 && this.selectedGroupIndex > 0) {
            this.selectedGroupIndex--;
            this.selectedItemIndex = groups[this.selectedGroupIndex].results.length - 1;
        }
    }

    isSelected(group: SearchGroup, index: number): boolean {
        const groups = this.groups();
        const groupIndex = groups.indexOf(group);
        return groupIndex === this.selectedGroupIndex && index === this.selectedItemIndex;
    }

    selectResult(result: SearchResult) {
        if (result.action) {
            result.action();
        } else if (result.route) {
            this.router.navigate([result.route], { queryParams: result.queryParams });
        }
        this.close();
    }

    close() {
        this.closed.emit();
    }

    private formatDate(dateStr: string): string {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
    }
}
