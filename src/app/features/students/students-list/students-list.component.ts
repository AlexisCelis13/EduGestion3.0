import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SupabaseService, Student, StudentFeedback, StudentMaterial } from '../../../core/services/supabase.service';
import { PhoneInputComponent } from '../../../shared/components/phone-input/phone-input.component';

// Custom validator for past dates only
function pastDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const inputDate = new Date(control.value);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (inputDate > today) {
        return { futureDate: true };
    }
    return null;
}

@Component({
    selector: 'app-students-list',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, PhoneInputComponent],
    templateUrl: './students-list.component.html'
})
export class StudentsListComponent implements OnInit {
    students = signal<Student[]>([]);
    showCreateForm = signal(false);
    loading = signal(false);
    errorMessage = signal('');
    successMessage = signal('');
    studentForm: FormGroup;

    // Edit mode
    editingStudent = signal<Student | null>(null);
    showDeleteConfirm = signal<string | null>(null);

    // Feedback modal
    showFeedbackModal = signal(false);
    selectedStudentForFeedback = signal<Student | null>(null);
    feedbackForm: FormGroup;
    studentFeedback = signal<StudentFeedback[]>([]);
    loadingFeedback = signal(false);

    // Material modal
    showMaterialModal = signal(false);
    selectedStudentForMaterial = signal<Student | null>(null);
    materialForm: FormGroup;
    studentMaterials = signal<StudentMaterial[]>([]);
    loadingMaterials = signal(false);
    selectedFile = signal<File | null>(null);
    uploadProgress = signal(false);

    // Student detail view
    showStudentDetail = signal(false);
    selectedStudent = signal<Student | null>(null);

    // Student appointment stats (for badges)
    studentStats = signal<Map<string, { upcoming: number; past: number; lastAppointmentDate: string | null }>>(new Map());

    // Tags management
    currentTag = signal('');
    studentTags = signal<string[]>([]);
    
    // Portal Link
    portalLinkCopied = signal<string | null>(null);

    // Max date for date of birth (today)
    today = new Date().toISOString().split('T')[0];

    constructor(
        private fb: FormBuilder,
        private supabaseService: SupabaseService,
        private route: ActivatedRoute
    ) {
        this.studentForm = this.fb.group({
            first_name: ['', Validators.required],
            last_name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phone: [''],
            date_of_birth: ['', [pastDateValidator]],
            parent_name: [''],
            parent_email: [''],
            parent_phone: [''],
            notes: ['']
        });

        this.feedbackForm = this.fb.group({
            message: ['', Validators.required]
        });

        this.materialForm = this.fb.group({
            title: ['', Validators.required],
            type: ['file', Validators.required],
            url: [''],
            description: ['']
        });
    }

    addTag(event?: Event) {
        if (event) event.preventDefault();
        const tag = this.currentTag().trim();
        if (tag && !this.studentTags().includes(tag)) {
            this.studentTags.update(tags => [...tags, tag]);
            this.currentTag.set('');
        }
    }

    removeTag(tag: string) {
        this.studentTags.update(tags => tags.filter(t => t !== tag));
    }

    async copyPortalLink(student: Student) {
        if (!student.access_token) return;
        const origin = window.location.origin;
        const link = `${origin}/student-portal/${student.access_token}`;
        
        try {
            await navigator.clipboard.writeText(link);
            this.portalLinkCopied.set(student.id);
            setTimeout(() => this.portalLinkCopied.set(null), 2000);
        } catch (err) {
            console.error('Failed to copy link', err);
        }
    }

    async ngOnInit() {
        await this.loadStudents();

        // Check for query params
        this.route.queryParams.subscribe(async params => {
            // Auto-open create form
            if (params['action'] === 'new') {
                this.showCreateForm.set(true);
            }

            // Auto-open student detail modal
            if (params['student']) {
                const studentId = params['student'];
                const student = this.students().find(s => s.id === studentId);
                if (student) {
                    await this.viewStudent(student);
                }
            }
        });
    }

    private async loadStudents() {
        const user = await this.supabaseService.getCurrentUser();
        if (user) {
            const { data, error } = await this.supabaseService.getStudents(user.id);
            if (data) {
                this.students.set(data);
                // Load stats for each student in background
                this.loadStudentStats(data);
            }
        }
    }

    private async loadStudentStats(students: Student[]) {
        const statsMap = new Map<string, { upcoming: number; past: number; lastAppointmentDate: string | null }>();

        // Load stats in parallel
        const statsPromises = students.map(async (student) => {
            const stats = await this.supabaseService.getStudentAppointmentStats(student.id);
            return { id: student.id, stats };
        });

        const results = await Promise.all(statsPromises);

        for (const result of results) {
            statsMap.set(result.id, result.stats);
        }

        this.studentStats.set(statsMap);
    }

    // Get student status for badge display
    getStudentStatus(studentId: string): { label: string; color: string } {
        const stats = this.studentStats().get(studentId);

        if (!stats) {
            return { label: '', color: '' };
        }

        if (stats.upcoming > 0) {
            return { label: `${stats.upcoming} cita${stats.upcoming > 1 ? 's' : ''} próxima${stats.upcoming > 1 ? 's' : ''}`, color: 'bg-green-100 text-green-700' };
        }

        if (stats.past > 0) {
            // Calculate days since last appointment
            if (stats.lastAppointmentDate) {
                const lastDate = new Date(stats.lastAppointmentDate);
                const today = new Date();
                const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDays <= 30) {
                    return { label: 'Activo', color: 'bg-blue-100 text-blue-700' };
                } else {
                    return { label: 'Inactivo', color: 'bg-surface-100 text-surface-500' };
                }
            }
            return { label: 'Inactivo', color: 'bg-surface-100 text-surface-500' };
        }

        return { label: 'Nuevo', color: 'bg-amber-100 text-amber-700' };
    }

    async createStudent() {
        if (this.studentForm.valid) {
            this.loading.set(true);
            this.errorMessage.set('');

            try {
                const user = await this.supabaseService.getCurrentUser();
                if (!user) {
                    this.errorMessage.set('Error de autenticación');
                    return;
                }

                const formData = this.studentForm.value;
                const studentData = {
                    user_id: user.id,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    email: formData.email,
                    phone: formData.phone || null,
                    date_of_birth: formData.date_of_birth || null,
                    parent_name: formData.parent_name || null,
                    parent_email: formData.parent_email || null,
                    parent_phone: formData.parent_phone || null,
                    notes: formData.notes || null,
                    is_active: true,
                    tags: this.studentTags()
                };

                const { error } = await this.supabaseService.createStudent(studentData);

                if (error) {
                    this.errorMessage.set('Error al crear el alumno');
                    return;
                }

                await this.loadStudents();
                this.cancelCreate();
                this.showSuccess('Alumno creado correctamente');

            } catch (error: any) {
                this.errorMessage.set('Error inesperado. Inténtalo de nuevo.');
            } finally {
                this.loading.set(false);
            }
        }
    }

    cancelCreate() {
        this.showCreateForm.set(false);
        this.editingStudent.set(null);
        this.studentTags.set([]);
        this.currentTag.set('');
        this.studentForm.reset();
        this.errorMessage.set('');
    }

    // Edit methods
    startEdit(student: Student) {
        this.editingStudent.set(student);
        this.showCreateForm.set(true);
        this.studentTags.set(student.tags || []);
        this.studentForm.patchValue({
            first_name: student.first_name,
            last_name: student.last_name,
            email: student.email,
            phone: student.phone || '',
            date_of_birth: student.date_of_birth || '',
            parent_name: student.parent_name || '',
            parent_email: student.parent_email || '',
            parent_phone: student.parent_phone || '',
            notes: student.notes || ''
        });
    }

    async saveEdit() {
        if (this.studentForm.valid && this.editingStudent()) {
            this.loading.set(true);
            this.errorMessage.set('');

            try {
                const formData = this.studentForm.value;
                const updates = {
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    email: formData.email,
                    phone: formData.phone || null,
                    date_of_birth: formData.date_of_birth || null,
                    parent_name: formData.parent_name || null,
                    parent_email: formData.parent_email || null,
                    parent_phone: formData.parent_phone || null,
                    notes: formData.notes || null,
                    tags: this.studentTags()
                };

                const { error } = await this.supabaseService.updateStudent(
                    this.editingStudent()!.id,
                    updates
                );

                if (error) {
                    this.errorMessage.set('Error al actualizar el alumno');
                    return;
                }

                await this.loadStudents();
                this.cancelCreate();
                this.showSuccess('Alumno actualizado correctamente');

            } catch (error: any) {
                this.errorMessage.set('Error inesperado. Inténtalo de nuevo.');
            } finally {
                this.loading.set(false);
            }
        }
    }

    // Delete methods
    async confirmDelete(studentId: string) {
        // Check if student has upcoming appointments
        const hasUpcoming = await this.supabaseService.hasUpcomingAppointments(studentId);

        if (hasUpcoming) {
            this.errorMessage.set('No puedes eliminar este alumno porque tiene citas programadas. Cancela las citas primero.');
            setTimeout(() => this.errorMessage.set(''), 5000);
            return;
        }

        this.showDeleteConfirm.set(studentId);
    }

    cancelDelete() {
        this.showDeleteConfirm.set(null);
    }

    async deleteStudent(studentId: string) {
        this.loading.set(true);

        try {
            const { error } = await this.supabaseService.deleteStudent(studentId);

            if (error) {
                this.errorMessage.set('Error al eliminar el alumno');
                return;
            }

            await this.loadStudents();
            this.showDeleteConfirm.set(null);
            this.showSuccess('Alumno eliminado correctamente');

        } catch (error: any) {
            this.errorMessage.set('Error inesperado. Inténtalo de nuevo.');
        } finally {
            this.loading.set(false);
        }
    }

    // Student Detail
    async viewStudent(student: Student) {
        this.selectedStudent.set(student);
        this.showStudentDetail.set(true);
        await this.loadStudentFeedbackAndMaterials(student.id);
    }

    closeStudentDetail() {
        this.showStudentDetail.set(false);
        this.selectedStudent.set(null);
        this.studentFeedback.set([]);
        this.studentMaterials.set([]);
    }

    private async loadStudentFeedbackAndMaterials(studentId: string) {
        this.loadingFeedback.set(true);
        this.loadingMaterials.set(true);

        const [feedbackResult, materialsResult] = await Promise.all([
            this.supabaseService.getStudentFeedback(studentId),
            this.supabaseService.getStudentMaterials(studentId)
        ]);

        if (feedbackResult.data) {
            this.studentFeedback.set(feedbackResult.data);
        }
        this.loadingFeedback.set(false);

        if (materialsResult.data) {
            this.studentMaterials.set(materialsResult.data);
        }
        this.loadingMaterials.set(false);
    }

    // Feedback methods
    openFeedbackModal(student: Student) {
        this.selectedStudentForFeedback.set(student);
        this.showFeedbackModal.set(true);
        this.feedbackForm.reset();
    }

    closeFeedbackModal() {
        this.showFeedbackModal.set(false);
        this.selectedStudentForFeedback.set(null);
        this.feedbackForm.reset();
    }

    async sendFeedback() {
        if (this.feedbackForm.valid && this.selectedStudentForFeedback()) {
            this.loading.set(true);
            this.errorMessage.set('');

            try {
                const user = await this.supabaseService.getCurrentUser();
                if (!user) {
                    this.errorMessage.set('Error de autenticación');
                    return;
                }

                // Save student ID before closing modal
                const studentId = this.selectedStudentForFeedback()!.id;
                const shouldReloadDetail = this.selectedStudent()?.id === studentId;

                const { error } = await this.supabaseService.createFeedback({
                    user_id: user.id,
                    student_id: studentId,
                    message: this.feedbackForm.value.message
                });

                if (error) {
                    this.errorMessage.set('Error al enviar el feedback');
                    return;
                }

                this.closeFeedbackModal();
                this.showSuccess('Feedback enviado correctamente');

                // Reload if detail view is open
                if (shouldReloadDetail) {
                    await this.loadStudentFeedbackAndMaterials(studentId);
                }

            } catch (error: any) {
                this.errorMessage.set('Error inesperado. Inténtalo de nuevo.');
            } finally {
                this.loading.set(false);
            }
        }
    }

    // Material methods
    openMaterialModal(student: Student) {
        this.selectedStudentForMaterial.set(student);
        this.showMaterialModal.set(true);
        this.materialForm.reset({ type: 'link' });
    }

    closeMaterialModal() {
        this.showMaterialModal.set(false);
        this.selectedStudentForMaterial.set(null);
        this.materialForm.reset({ type: 'file' });
        this.selectedFile.set(null);
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            // Validate file type
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                this.errorMessage.set('Solo se permiten archivos PDF y Word');
                return;
            }
            // Validate file size (10MB max)
            if (file.size > 10 * 1024 * 1024) {
                this.errorMessage.set('El archivo no puede superar los 10MB');
                return;
            }
            this.selectedFile.set(file);
            // Auto-fill title if empty
            if (!this.materialForm.get('title')?.value) {
                this.materialForm.patchValue({ title: file.name.replace(/\.[^/.]+$/, '') });
            }
        }
    }

    getFileTypeFromMime(file: File): 'pdf' | 'doc' {
        if (file.type === 'application/pdf') return 'pdf';
        return 'doc';
    }

    async sendMaterial() {
        if (this.selectedStudentForMaterial()) {
            const formData = this.materialForm.value;
            const materialType = formData.type;

            // Validate based on type
            if (materialType === 'link' && !formData.url) {
                this.errorMessage.set('Por favor ingresa una URL');
                return;
            }
            if (materialType === 'file' && !this.selectedFile()) {
                this.errorMessage.set('Por favor selecciona un archivo');
                return;
            }
            if (!formData.title) {
                this.errorMessage.set('Por favor ingresa un título');
                return;
            }

            this.loading.set(true);
            this.uploadProgress.set(true);
            this.errorMessage.set('');

            try {
                const user = await this.supabaseService.getCurrentUser();
                if (!user) {
                    this.errorMessage.set('Error de autenticación');
                    return;
                }

                // Save student ID before closing modal
                const studentId = this.selectedStudentForMaterial()!.id;
                const shouldReloadDetail = this.selectedStudent()?.id === studentId;

                let url = formData.url;
                let type: 'pdf' | 'doc' | 'link' = 'link';

                // If file type, upload the file first
                if (materialType === 'file' && this.selectedFile()) {
                    const uploadedUrl = await this.supabaseService.uploadStudentMaterial(
                        user.id,
                        studentId,
                        this.selectedFile()!
                    );

                    if (!uploadedUrl) {
                        this.errorMessage.set('Error al subir el archivo. Verifica que el bucket esté configurado.');
                        return;
                    }
                    url = uploadedUrl;
                    type = this.getFileTypeFromMime(this.selectedFile()!);
                }

                const { error } = await this.supabaseService.createMaterial({
                    user_id: user.id,
                    student_id: studentId,
                    title: formData.title,
                    type: type,
                    url: url,
                    description: formData.description || null
                });

                if (error) {
                    console.error('Error creating material:', error);
                    this.errorMessage.set('Error al guardar el material: ' + (error.message || 'Error desconocido'));
                    return;
                }

                this.closeMaterialModal();
                this.showSuccess('Material enviado correctamente');

                // Reload if detail view is open
                if (shouldReloadDetail) {
                    await this.loadStudentFeedbackAndMaterials(studentId);
                }

            } catch (error: any) {
                this.errorMessage.set('Error inesperado. Inténtalo de nuevo.');
            } finally {
                this.loading.set(false);
                this.uploadProgress.set(false);
            }
        }
    }

    // Helpers
    private showSuccess(message: string) {
        this.successMessage.set(message);
        setTimeout(() => this.successMessage.set(''), 3000);
    }

    formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getMaterialTypeIcon(type: string): string {
        switch (type) {
            case 'pdf': return '📄';
            case 'doc': return '📝';
            case 'link': return '🔗';
            default: return '📎';
        }
    }

    async deleteFeedback(feedbackId: string) {
        if (!confirm('¿Estás seguro de eliminar este feedback?')) return;

        const { error } = await this.supabaseService.deleteFeedback(feedbackId);
        if (error) {
            this.errorMessage.set('Error al eliminar el feedback');
            return;
        }

        // Reload feedback list
        if (this.selectedStudent()) {
            await this.loadStudentFeedbackAndMaterials(this.selectedStudent()!.id);
        }
        this.showSuccess('Feedback eliminado correctamente');
    }

    async deleteMaterial(materialId: string) {
        if (!confirm('¿Estás seguro de eliminar este material?')) return;

        const { error } = await this.supabaseService.deleteMaterial(materialId);
        if (error) {
            this.errorMessage.set('Error al eliminar el material');
            return;
        }

        // Reload materials list
        if (this.selectedStudent()) {
            await this.loadStudentFeedbackAndMaterials(this.selectedStudent()!.id);
        }
        this.showSuccess('Material eliminado correctamente');
    }
}
